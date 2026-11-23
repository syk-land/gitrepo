import Phaser from 'phaser';
import { BattleScene } from './BattleScene';
import { LevelUpManager, LevelUpChoice } from '../systems/LevelUpManager';
import { SoundEngine } from '../core/SoundEngine';
import { SaveManager } from '../core/SaveManager';
import { AdBillingAdapter } from '../systems/AdBillingAdapter';
import { SkillData } from '../data/types';
import { ACTIVE_SKILLS, PASSIVE_SKILLS, ALL_SKILLS_MAP } from '../data/skillsData';
import { drawHanokFrame, drawHanokCard } from '../utils/HanokFrameBuilder';

export class UIScene extends Phaser.Scene {
  private battleScene!: BattleScene;

  // 상단 HUD 객체
  private expBarFill!: Phaser.GameObjects.Graphics;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private bossHpContainer!: Phaser.GameObjects.Container;
  private bossHpFill!: Phaser.GameObjects.Graphics;
  private bossHpTitle!: Phaser.GameObjects.Text;

  // 플로팅 조이스틱
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickOrigin = { x: 0, y: 0 };
  private isJoystickActive: boolean = false;

  // 키보드 커서 키
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  // 하단 수동 필살기 버튼
  private ultButtonContainer!: Phaser.GameObjects.Container;
  private ultCooldownText!: Phaser.GameObjects.Text;
  private ultIconText!: Phaser.GameObjects.Text;

  // 모달 레이어 컨테이너
  private modalContainer!: Phaser.GameObjects.Container;

  // 배속 버튼
  private speedButtonContainer!: Phaser.GameObjects.Container;
  private speedBg!: Phaser.GameObjects.Graphics;
  private speedText!: Phaser.GameObjects.Text;
  private currentSpeedIndex: number = 0;
  private readonly speedOptions: number[] = [1.0, 1.5, 2.0, 3.0];

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.battleScene = this.scene.get('BattleScene') as BattleScene;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. 상단 HUD 구축
    this.createTopHUD(width);

    // 2. 하단 필살기 버튼 (CORPSE BLAST / TRUE BLIZZARD)
    this.createUltButton(width, height);

    // 3. 플로팅 조이스틱 및 키보드 입력
    this.createJoystick(width, height);
    this.createKeyboardInput();

    // 4. 모달 전용 최상위 레이어
    this.modalContainer = this.add.container(0, 0).setDepth(200);

    // 5. 최초 시작 주무기 1종 선택 체크
    this.time.delayedCall(50, () => {
      this.checkAndShowStartingSkill();
    });
  }

  private createTopHUD(width: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x0c0908, 0.85);
    bg.lineStyle(1, 0x543b28, 1);
    bg.fillRect(0, 0, width, 82);
    bg.strokeRect(0, 0, width, 82);

    // 레벨 표시
    this.levelText = this.add.text(15, 12, 'Lv.1', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '15px',
      color: '#ffd000',
    });

    // 경험치 바
    const barX = 75;
    const barY = 16;
    const barW = width - 90;
    const barH = 12;

    const expBox = this.add.graphics();
    expBox.fillStyle(0x18120e, 1);
    expBox.lineStyle(1, 0xd4a338, 1);
    expBox.fillRect(barX, barY, barW, barH);
    expBox.strokeRect(barX, barY, barW, barH);

    this.expBarFill = this.add.graphics();

    // 타이머 및 웨이브 정보
    this.timerText = this.add.text(width / 2, 45, '00:00 (W1 Scouts)', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#00ffaa',
    }).setOrigin(0.5);

    // 처치 수 및 골드
    this.statsText = this.add.text(width / 2, 65, '💀 0   💰 0 G', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '13px',
      color: '#f5ede2',
    }).setOrigin(0.5);

    // BOSS HP 바 (평소에는 숨김)
    this.bossHpContainer = this.add.container(width / 2, 105).setVisible(false);
    const bossBox = this.add.graphics();
    bossBox.fillStyle(0x18120e, 0.9);
    bossBox.lineStyle(2, 0xff2a6d, 1);
    bossBox.fillRect(-170, 0, 340, 16);
    bossBox.strokeRect(-170, 0, 340, 16);
    this.bossHpContainer.add(bossBox);

    this.bossHpFill = this.add.graphics();
    this.bossHpContainer.add(this.bossHpFill);

    this.bossHpTitle = this.add.text(0, -12, '⚠️ BOSS HP', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '12px',
      color: '#ff2a6d',
    }).setOrigin(0.5);
    this.bossHpContainer.add(this.bossHpTitle);

    // 배속 조절 버튼 (1x / 1.5x / 2x / 3x)
    this.createSpeedButton(width - 48, 54);
  }

  private createSpeedButton(x: number, y: number): void {
    this.currentSpeedIndex = 0;
    this.speedButtonContainer = this.add.container(x, y).setDepth(150);

    this.speedBg = this.add.graphics();
    this.speedButtonContainer.add(this.speedBg);

    this.speedText = this.add.text(0, 0, '⏩ 1x', {
      fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
      fontSize: '13px',
      color: '#f5ede2',
    }).setOrigin(0.5);
    this.speedButtonContainer.add(this.speedText);

    this.updateSpeedButtonVisual(1.0);

    const hitArea = this.add.rectangle(0, 0, 72, 34, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.toggleGameSpeed();
    });
    hitArea.on('pointerover', () => {
      this.speedButtonContainer.setScale(1.06);
    });
    hitArea.on('pointerout', () => {
      this.speedButtonContainer.setScale(1.0);
    });
    this.speedButtonContainer.add(hitArea);
  }

  public toggleGameSpeed(): void {
    this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedOptions.length;
    const speed = this.speedOptions[this.currentSpeedIndex];
    this.applyGameSpeed(speed);
  }

  public setGameSpeedByValue(speed: number): void {
    const idx = this.speedOptions.indexOf(speed);
    if (idx !== -1) {
      this.currentSpeedIndex = idx;
    }
    this.applyGameSpeed(speed);
  }

  private applyGameSpeed(speed: number): void {
    if (this.battleScene) {
      this.battleScene.setGameSpeed(speed);
    }
    this.updateSpeedButtonVisual(speed);
    SoundEngine.getInstance().playTone(380 + this.currentSpeedIndex * 120, 'sine', 0.12, 0.22);
  }

  private updateSpeedButtonVisual(speed: number): void {
    this.speedBg.clear();
    const w = 68;
    const h = 28;

    let strokeColor = 0x543b28;
    let textColor = '#f5ede2';

    if (speed === 1.5) {
      strokeColor = 0x00ffaa;
      textColor = '#00ffaa';
    } else if (speed === 2.0) {
      strokeColor = 0x00f0ff;
      textColor = '#00f0ff';
    } else if (speed === 3.0) {
      strokeColor = 0xff0055;
      textColor = '#ff5577';
    }

    this.speedBg.fillStyle(0x18120e, 0.95);
    this.speedBg.lineStyle(1.5, strokeColor, 1);
    this.speedBg.fillRoundedRect(-w / 2, -h / 2, w, h, 6);
    this.speedBg.strokeRoundedRect(-w / 2, -h / 2, w, h, 6);

    this.speedText.setText(`⏩ ${speed}x`).setColor(textColor);
  }

  private createUltButton(width: number, height: number): void {
    const btnY = height - 85;
    this.ultButtonContainer = this.add.container(width / 2, btnY).setDepth(150);

    const circle = this.add.graphics();
    circle.fillStyle(0x231b15, 0.95);
    circle.lineStyle(3, 0xff3344, 1);
    circle.fillCircle(0, 0, 44);
    circle.strokeCircle(0, 0, 44);
    this.ultButtonContainer.add(circle);

    this.ultIconText = this.add.text(0, -6, 'CORPSE\nBLAST', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '13px',
      color: '#f5ede2',
      align: 'center',
    }).setOrigin(0.5);
    this.ultButtonContainer.add(this.ultIconText);

    this.ultCooldownText = this.add.text(0, 0, '', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '18px',
      color: '#ffd000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setVisible(false);
    this.ultButtonContainer.add(this.ultCooldownText);

    const hitArea = this.add.circle(0, 0, 48, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      if (event && event.stopPropagation) event.stopPropagation();
      this.battleScene.triggerManualUlt();
    });
    this.ultButtonContainer.add(hitArea);
  }

  private createJoystick(width: number, height: number): void {
    this.joystickBase = this.add.circle(0, 0, 50, 0xffffff, 0.15).setVisible(false).setDepth(50);
    this.joystickThumb = this.add.circle(0, 0, 24, 0x00ffaa, 0.5).setVisible(false).setDepth(51);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.battleScene.isPaused) return;
      // 이미 한 손가락으로 조이스틱을 조작 중이면 다른 손가락 터치는 조이스틱을 뺏지 않음
      if (this.isJoystickActive) return;

      // 상단 HUD나 하단 필살기 버튼 영역 터치는 조이스틱 무시
      if (pointer.y < 90 || (pointer.y > height - 140 && Math.abs(pointer.x - width / 2) < 70)) {
        return;
      }
      this.isJoystickActive = true;
      this.joystickPointer = pointer;
      this.joystickOrigin = { x: pointer.x, y: pointer.y };

      this.joystickBase.setPosition(pointer.x, pointer.y).setVisible(true);
      this.joystickThumb.setPosition(pointer.x, pointer.y).setVisible(true);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // 조이스틱을 쥔 손가락만 조이스틱 위치를 갱신
      if (!this.isJoystickActive || pointer !== this.joystickPointer) return;

      const dx = pointer.x - this.joystickOrigin.x;
      const dy = pointer.y - this.joystickOrigin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 50;

      if (dist > maxDist) {
        this.joystickThumb.setPosition(
          this.joystickOrigin.x + (dx / dist) * maxDist,
          this.joystickOrigin.y + (dy / dist) * maxDist
        );
      } else {
        this.joystickThumb.setPosition(pointer.x, pointer.y);
      }

      if (dist > 5) {
        this.battleScene.inputVector = { x: dx / dist, y: dy / dist };
      } else {
        this.battleScene.inputVector = { x: 0, y: 0 };
      }
    });

    const onPointerRelease = (pointer: Phaser.Input.Pointer) => {
      // 조이스틱을 쥐고 있던 손가락이 떼어졌을 때만 조이스틱을 해제 (다른 손가락 터치업에 의해 취소되지 않음!)
      if (pointer !== this.joystickPointer) return;
      this.isJoystickActive = false;
      this.joystickPointer = null;
      this.joystickBase.setVisible(false);
      this.joystickThumb.setVisible(false);
      this.battleScene.inputVector = { x: 0, y: 0 };
    };

    this.input.on('pointerup', onPointerRelease);
    this.input.on('pointercancel', onPointerRelease);
  }

  private createKeyboardInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = this.input.keyboard.addKeys('W,A,S,D') as typeof this.wasdKeys;

      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        if (event.key === 'b' || event.key === 'B' || event.key === 'x' || event.key === 'X') {
          this.toggleGameSpeed();
        } else if (event.key === '1') {
          this.setGameSpeedByValue(1.0);
        } else if (event.key === '2') {
          this.setGameSpeedByValue(2.0);
        } else if (event.key === '3') {
          this.setGameSpeedByValue(3.0);
        }
      });
    }
  }

  public update(): void {
    if (!this.battleScene || !this.battleScene.player) return;

    // 1. 키보드 데스크톱 조작 보조
    if (!this.isJoystickActive && this.cursors && this.wasdKeys) {
      let kx = 0;
      let ky = 0;
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) kx -= 1;
      if (this.cursors.right.isDown || this.wasdKeys.D.isDown) kx += 1;
      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) ky -= 1;
      if (this.cursors.down.isDown || this.wasdKeys.S.isDown) ky += 1;

      if (kx !== 0 || ky !== 0) {
        const len = Math.sqrt(kx * kx + ky * ky);
        this.battleScene.inputVector = { x: kx / len, y: ky / len };
      } else {
        this.battleScene.inputVector = { x: 0, y: 0 };
      }
    }

    // 2. 상단 HUD 업데이트
    const player = this.battleScene.player;
    this.levelText.setText(`Lv.${player.level}`);

    const reqExp = player.getRequiredExp(player.level);
    const expRatio = Math.min(1.0, player.currentExp / reqExp);
    const barW = this.cameras.main.width - 90;
    this.expBarFill.clear();
    this.expBarFill.fillStyle(0x00ffaa, 1.0);
    this.expBarFill.fillRect(75, 16, barW * expRatio, 12);

    const elapsed = Math.floor(this.battleScene.waveSpawner.elapsedTime);
    const min = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const sec = (elapsed % 60).toString().padStart(2, '0');
    const wave = this.battleScene.waveSpawner.currentWave;
    const waveNames = ['', 'Scouts', 'Vanguard', 'Elites', 'Deep Horde', 'Gatekeeper', 'FINAL BOSS'];
    this.timerText.setText(`⏱️ ${min}:${sec} (W${wave} ${waveNames[wave] || ''})`);

    this.statsText.setText(`💀 ${this.battleScene.killCount}   💰 ${this.battleScene.earnedGold} G   HP: ${Math.max(0, Math.round(player.hp))}/${player.maxHp}`);

    // 3. 필살기 버튼 쿨타임 업데이트
    if (player.isJinBlizzard()) {
      this.ultIconText.setText('TRUE\nSTORM');
      this.ultIconText.setColor('#00f0ff');
    } else {
      this.ultIconText.setText('CORPSE\nBLAST');
      this.ultIconText.setColor('#f5ede2');
    }

    if (player.ultCooldown > 0) {
      this.ultCooldownText.setVisible(true).setText(`${player.ultCooldown.toFixed(1)}s`);
      this.ultIconText.setAlpha(0.2);
    } else {
      this.ultCooldownText.setVisible(false);
      this.ultIconText.setAlpha(1.0);
    }

    // 4. BOSS HP 바 갱신
    const boss = this.battleScene.waveSpawner.bossInstance;
    if (boss && boss.active) {
      this.bossHpContainer.setVisible(true);
      const bRatio = Math.max(0, boss.hp / boss.maxHp);
      this.bossHpFill.clear();
      this.bossHpFill.fillStyle(0xff2a6d, 1);
      this.bossHpFill.fillRect(-168, 2, 336 * bRatio, 12);
      this.bossHpTitle.setText(`⚠️ [BOSS] ${this.battleScene.region.boss} (${Math.floor(bRatio * 100)}%)`);
    } else {
      this.bossHpContainer.setVisible(false);
    }
  }

  // 최초 시작 무기 스킬 선택 체크
  private checkAndShowStartingSkill(): void {
    if (!this.battleScene || !this.battleScene.player) {
      this.time.delayedCall(50, () => this.checkAndShowStartingSkill());
      return;
    }
    const player = this.battleScene.player;
    const hasWeapon = player.activeSkills.size > 0;
    if (!hasWeapon) {
      this.showStartingSkillModal();
    }
  }

  // 최초 시작 무기 선택 모달 (3종 무작위 제시 + 리롤 지원)
  public showStartingSkillModal(onSelect?: (skill: SkillData) => void): void {
    this.battleScene.isPaused = true;
    this.modalContainer.removeAll(true);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 반투명 딤
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setInteractive();
    this.modalContainer.add(dim);

    // 상단 타이틀
    const title = this.add.text(width / 2, 95, 'CHOOSE STARTING WEAPON', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '22px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.modalContainer.add(title);

    const sub = this.add.text(width / 2, 125, 'Select your primary weapon before entering the portal.', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '13px',
      color: '#00ffaa',
    }).setOrigin(0.5);
    this.modalContainer.add(sub);

    // 1차 하위(기초 Tier 1) 액티브 스킬 목록에서 3종 무작위 추출 (강령술 포함 전 스킬 자유 선택)
    const weaponPool = ACTIVE_SKILLS.filter((s) => (s.tier ?? 1) === 1);
    const shuffled = Phaser.Utils.Array.Shuffle([...weaponPool]);
    const choices = shuffled.slice(0, 3);

    choices.forEach((skill, idx) => {
      const cardY = 220 + idx * 165;
      const cardBox = drawHanokCard(this, width / 2 - 210, cardY - 65, 420, 140, 0x00ffaa, 0x18120e);
      this.modalContainer.add(cardBox);

      // 스킬 아이콘 (1티어는 작게 44x44, 2티어는 크게 64x64)
      if (this.textures.exists(skill.id)) {
        const iconSz = skill.tier === 2 ? 64 : 44;
        const icon = this.add.image(width / 2 - 160, cardY + 5, skill.id);
        icon.setDisplaySize(iconSz, iconSz);
        this.modalContainer.add(icon);
      }

      // 스킬 이름 및 시작 배지
      const badge = skill.isNecroSignature ? '[Necro Signature Lv.1]' : '[Starter Weapon Lv.1]';
      const name = this.add.text(width / 2 - 115, cardY - 45, `${skill.name} ${badge}`, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '16px',
        color: '#00ffaa',
      });
      this.modalContainer.add(name);

      // 1레벨 상세 설명
      const lvData = skill.levels[0];
      const desc = this.add.text(width / 2 - 115, cardY - 15, lvData.description, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '13px',
        color: '#f5ede2',
        wordWrap: { width: 300 },
      });
      this.modalContainer.add(desc);

      // 짝꿍 패시브 각성 힌트
      if (skill.requiredPassiveId) {
        const partner = ALL_SKILLS_MAP.get(skill.requiredPassiveId);
        if (partner) {
          const hint = this.add.text(width / 2 - 115, cardY + 45, `Synergy Partner: ${partner.name}`, {
            fontFamily: 'NeoDunggeunmo, monospace',
            fontSize: '12px',
            color: '#ffd000',
          });
          this.modalContainer.add(hint);
        }
      }

      // 카드 클릭 이벤트
      const hitArea = this.add.zone(width / 2, cardY + 5, 420, 140).setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        SoundEngine.getInstance().click();
        this.battleScene.player.activeSkills.set(skill.id, 1);
        this.battleScene.player.skillCooldowns.set(skill.id, 0);
        this.battleScene.syncNecroArmy();
        this.modalContainer.removeAll(true);
        this.battleScene.isPaused = false;
        SoundEngine.getInstance().playTone(520, 'sine', 0.2, 0.2);
        if (onSelect) onSelect(skill);

        const startLevelBonus = this.battleScene.player.getEffectiveStats().startLevel || 0;
        if (startLevelBonus > 0) {
          this.battleScene.player.level += startLevelBonus;
          this.battleScene.player.pendingLevelUps += startLevelBonus;
          this.time.delayedCall(120, () => {
            this.battleScene.isPaused = true;
            this.showLevelUpModal();
          });
        }
      });
      this.modalContainer.add(hitArea);
    });

    // 다른 무기 재추천 (Reroll)
    const rerollBtn = this.add.graphics();
    rerollBtn.fillStyle(0x231b15, 0.95);
    rerollBtn.lineStyle(1, 0x00f0ff, 1);
    rerollBtn.fillRoundedRect(width / 2 - 110, height - 120, 220, 44, 6);
    rerollBtn.strokeRoundedRect(width / 2 - 110, height - 120, 220, 44, 6);
    this.modalContainer.add(rerollBtn);

    const rerollText = this.add.text(width / 2, height - 98, 'REROLL WEAPONS (AD)', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#00f0ff',
    }).setOrigin(0.5);
    this.modalContainer.add(rerollText);

    const rerollHit = this.add.zone(width / 2, height - 98, 220, 44).setInteractive({ useHandCursor: true });
    rerollHit.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.showStartingSkillModal(onSelect);
    });
    this.modalContainer.add(rerollHit);
  }

  // 레벨업 카드 선택 모달
  public showLevelUpModal(): void {
    this.modalContainer.removeAll(true);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 반투명 딤
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.82).setInteractive();
    this.modalContainer.add(dim);

    // 상단 타이틀
    const title = this.add.text(width / 2, 100, 'LEVEL UP! CHOOSE SKILL', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '22px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.modalContainer.add(title);

    const sub = this.add.text(width / 2, 130, 'Pick a new skill or upgrade an existing one.', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '13px',
      color: '#b8a692',
    }).setOrigin(0.5);
    this.modalContainer.add(sub);

    const choices = LevelUpManager.getChoices(this.battleScene.player, 3);

    choices.forEach((choice, idx) => {
      const cardY = 220 + idx * 165;
      const cardBox = drawHanokCard(this, width / 2 - 210, cardY - 65, 420, 140, choice.isNew ? 0x00ffaa : 0xd4a338, 0x18120e);
      this.modalContainer.add(cardBox);

      // 스킬 아이콘 (1티어는 작게 44x44, 2티어는 크게 64x64)
      if (!choice.isFallback) {
        const iconSz = choice.skill.tier === 2 ? 64 : 44;
        const icon = this.add.image(width / 2 - 160, cardY + 5, choice.skill.id);
        icon.setDisplaySize(iconSz, iconSz);
        this.modalContainer.add(icon);
      }

      // 스킬 이름 및 신규/레벨 배지
      const badge = choice.isNew ? '[NEW!]' : `[Lv.${choice.currentLevel} ➔ Lv.${choice.nextLevel}]`;
      const name = this.add.text(width / 2 - 115, cardY - 45, `${choice.skill.name} ${badge}`, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '16px',
        color: choice.isNew ? '#00ffaa' : '#ffd000',
      });
      this.modalContainer.add(name);

      // 상세 설명
      const lvData = choice.skill.levels[choice.nextLevel - 1] || choice.skill.levels[0];
      const desc = this.add.text(width / 2 - 115, cardY - 15, lvData.description, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '13px',
        color: '#f5ede2',
        wordWrap: { width: 300 },
      });
      this.modalContainer.add(desc);

      // 짝꿍 패시브 각성 힌트 배지
      if (choice.synergyHint) {
        const hint = this.add.text(width / 2 - 115, cardY + 45, choice.synergyHint, {
          fontFamily: 'NeoDunggeunmo, monospace',
          fontSize: '12px',
          color: '#ff2a6d',
        });
        this.modalContainer.add(hint);
      }

      // 카드 클릭 이벤트
      const hitArea = this.add.zone(width / 2, cardY + 5, 420, 140).setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        this.applyLevelUpChoice(choice);
      });
      this.modalContainer.add(hitArea);
    });

    // 리롤 버튼 (보상형 광고 2)
    const rerollBtn = this.add.graphics();
    rerollBtn.fillStyle(0x231b15, 0.95);
    rerollBtn.lineStyle(1, 0x00f0ff, 1);
    rerollBtn.fillRoundedRect(width / 2 - 110, height - 120, 220, 44, 6);
    rerollBtn.strokeRoundedRect(width / 2 - 110, height - 120, 220, 44, 6);
    this.modalContainer.add(rerollBtn);

    const rerollText = this.add.text(width / 2, height - 98, 'REROLL SKILLS (AD)', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#00f0ff',
    }).setOrigin(0.5);
    this.modalContainer.add(rerollText);

    const rerollHit = this.add.zone(width / 2, height - 98, 220, 44).setInteractive({ useHandCursor: true });
    rerollHit.on('pointerdown', async () => {
      SoundEngine.getInstance().click();
      const success = await AdBillingAdapter.getInstance().showRerollAd();
      if (success) {
        this.showLevelUpModal();
      }
    });
    this.modalContainer.add(rerollHit);
  }

  private applyLevelUpChoice(choice: LevelUpChoice): void {
    SoundEngine.getInstance().click();
    const player = this.battleScene.player;

    if (choice.isFallback) {
      if (choice.skill.id === 'fallback_chicken') {
        const maxHp = player.getEffectiveStats().maxHp;
        player.maxHp = maxHp;
        player.hp = Math.min(maxHp, player.hp + maxHp * 0.5);
      } else {
        this.battleScene.earnedGold += Math.round(500 * player.getEffectiveStats().goldMul);
      }
    } else {
      const isActive = choice.skill.category === 'weapon' || choice.skill.category === 'summon';
      if (isActive) {
        player.activeSkills.set(choice.skill.id, choice.nextLevel);
        if (!player.skillCooldowns.has(choice.skill.id)) {
          player.skillCooldowns.set(choice.skill.id, 0);
        }
      } else {
        player.passiveSkills.set(choice.skill.id, choice.nextLevel);
      }
    }

    player.pendingLevelUps--;

    // 레벨업 시 소환수 군단 편성 즉시 동기화 (해골 군단/사령 권능 등 레벨업 즉시 반영)
    this.battleScene.syncNecroArmy();

    if (player.pendingLevelUps > 0) {
      // 연속 레벨업 처리 (Section 6.2)
      this.showLevelUpModal();
    } else {
      // 모달 닫고 게임 재개
      this.modalContainer.removeAll(true);
      this.battleScene.isPaused = false;
    }
  }

  // 보물상자 진화 모달
  public showChestModal(awakenedSkill: SkillData | null): void {
    this.battleScene.isPaused = true;
    this.modalContainer.removeAll(true);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85).setInteractive();
    this.modalContainer.add(dim);

    const box = drawHanokFrame(this, width / 2 - 200, height / 2 - 170, 400, 340, {
      bgColor: 0x18120e,
      bgAlpha: 0.97,
      accentColor: 0xffd000,
      radius: 8,
    });
    this.modalContainer.add(box);

    const title = this.add.text(width / 2, height / 2 - 120, 'GATEKEEPER CHEST OPENED!', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '20px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.modalContainer.add(title);

    if (awakenedSkill) {
      const icon = this.add.image(width / 2, height / 2 - 40, awakenedSkill.id);
      icon.setDisplaySize(72, 72);
      this.modalContainer.add(icon);

      const aName = this.add.text(width / 2, height / 2 + 25, `AWAKENED: ${awakenedSkill.name}`, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '17px',
        color: '#00ffaa',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.modalContainer.add(aName);

      const aDesc = this.add.text(width / 2, height / 2 + 65, awakenedSkill.levels[0].description, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '13px',
        color: '#f5ede2',
        align: 'center',
        wordWrap: { width: 340 },
      }).setOrigin(0.5);
      this.modalContainer.add(aDesc);
    } else {
      const gText = this.add.text(width / 2, height / 2 - 10, 'Treasure Chest!\n+2,000 Gold & Full HP Restore', {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '17px',
        color: '#ffd000',
        align: 'center',
      }).setOrigin(0.5);
      this.modalContainer.add(gText);
    }

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0xd4a338, 1);
    confirmBtn.fillRoundedRect(width / 2 - 80, height / 2 + 105, 160, 44, 6);
    this.modalContainer.add(confirmBtn);

    const cText = this.add.text(width / 2, height / 2 + 127, 'CLAIM', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '16px',
      color: '#0c0908',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.modalContainer.add(cText);

    const hit = this.add.zone(width / 2, height / 2 + 127, 160, 44).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.modalContainer.removeAll(true);
      this.battleScene.isPaused = false;
    });
    this.modalContainer.add(hit);
  }

  // 📜 각성재료 선택권 모달 (정예 괴수/BOSS 처치 시 드랍되는 양피지 비급서)
  public showAwakeningSelectorModal(): void {
    this.battleScene.isPaused = true;
    this.modalContainer.removeAll(true);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const player = this.battleScene.player;

    // 반투명 딤
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setInteractive();
    this.modalContainer.add(dim);

    // 고대 양피지 헤더 아이콘
    if (this.textures.exists('item_parchment')) {
      const parchmentIcon = this.add.image(width / 2, 70, 'item_parchment');
      parchmentIcon.setDisplaySize(48, 48);
      this.modalContainer.add(parchmentIcon);
    }

    // 상단 타이틀
    const title = this.add.text(width / 2, 110, 'AWAKENING SCROLL', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '22px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.modalContainer.add(title);

    const sub = this.add.text(width / 2, 138, 'Choose 1 resonance passive to evolve your weapons!', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '12px',
      color: '#00ffaa',
    }).setOrigin(0.5);
    this.modalContainer.add(sub);

    // 보유 중인 액티브 무기 목록
    const ownedActives = Array.from(player.activeSkills.keys());
    const ownedPassives = Array.from(player.passiveSkills.keys());
    const maxPassiveSlots = 6;

    // 배운 액티브 스킬들의 짝꿍 각성 패시브 ID 집합
    const relatedPassiveIds = new Set<string>();
    for (const aId of ownedActives) {
      const activeSkill = ALL_SKILLS_MAP.get(aId);
      if (activeSkill && activeSkill.requiredPassiveId) {
        relatedPassiveIds.add(activeSkill.requiredPassiveId);
      }
    }

    // 1순위: 배운 액티브 스킬과 관련된 패시브 중 만렙이 아니고, 슬롯 조건을 만족하는 것
    let choices = PASSIVE_SKILLS.filter((p) => {
      if (!relatedPassiveIds.has(p.id)) return false;
      const curLv = player.passiveSkills.get(p.id) ?? 0;
      if (curLv >= p.maxLevel) return false;
      if (curLv === 0 && ownedPassives.length >= maxPassiveSlots) return false;
      return true;
    });

    // 2순위: 만약 배운 스킬에 관련된 각성재료가 전부 만렙이거나 없으면, 다른 습득 가능한 모든 패시브를 제시
    if (choices.length === 0) {
      choices = PASSIVE_SKILLS.filter((p) => {
        const curLv = player.passiveSkills.get(p.id) ?? 0;
        if (curLv >= p.maxLevel) return false;
        if (curLv === 0 && ownedPassives.length >= maxPassiveSlots) return false;
        return true;
      });
    }

    if (choices.length === 0) {
      // 모든 패시브 각성재료가 이미 만렙이거나 꽉 찬 경우의 대체 보상
      const emptyBox = drawHanokFrame(this, width / 2 - 200, height / 2 - 80, 400, 160, {
        bgColor: 0x231b15,
        bgAlpha: 0.96,
        accentColor: 0xffd000,
        radius: 8,
      });
      this.modalContainer.add(emptyBox);

      const emptyText = this.add.text(width / 2, height / 2 - 30, 'All synergy passives maxed!\n\nReward: +3,000 Gold & Full HP Restore', {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '15px',
        color: '#ffd000',
        align: 'center',
      }).setOrigin(0.5);
      this.modalContainer.add(emptyText);

      const confirmBtn = this.add.graphics();
      confirmBtn.fillStyle(0xd4a338, 1);
      confirmBtn.fillRoundedRect(width / 2 - 80, height / 2 + 30, 160, 40, 6);
      this.modalContainer.add(confirmBtn);

      const confirmText = this.add.text(width / 2, height / 2 + 50, 'CLAIM', {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '15px',
        color: '#0c0908',
      }).setOrigin(0.5);
      this.modalContainer.add(confirmText);

      const hit = this.add.zone(width / 2, height / 2 + 50, 160, 40).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        SoundEngine.getInstance().click();
        const stats = player.getEffectiveStats();
        this.battleScene.earnedGold += Math.round(3000 * stats.goldMul);
        const maxHp = stats.maxHp;
        player.maxHp = maxHp;
        player.hp = maxHp;
        this.modalContainer.removeAll(true);
        this.battleScene.isPaused = false;
      });
      this.modalContainer.add(hit);
      return;
    }

    // 모든 선택지 한 화면에 일괄 렌더링 (페이지네이션 없이 전부 나열)
    const count = choices.length;
    // 카드 높이 및 간격 계산 (항목 수에 따라 유연하게 조절: 1~3개면 120px, 4~6개면 85~100px)
    const cardHeight = count <= 3 ? 120 : count <= 4 ? 100 : 85;
    const cardGap = count <= 3 ? 15 : count <= 4 ? 12 : 8;
    const totalBlockHeight = count * cardHeight + (count - 1) * cardGap;
    const startY = Math.max(170, 170 + (height - 210 - totalBlockHeight) / 2);

    choices.forEach((skill, idx) => {
      const curLv = player.passiveSkills.get(skill.id) ?? 0;
      const nextLv = curLv + 1;
      const cardY = startY + idx * (cardHeight + cardGap) + cardHeight / 2;

      // 보유 액티브와의 시너지 여부
      const matchingActive = ownedActives
        .map((aId) => ALL_SKILLS_MAP.get(aId))
        .find((a) => a && a.requiredPassiveId === skill.id);

      const cardBox = drawHanokCard(this, width / 2 - 215, cardY - cardHeight / 2, 430, cardHeight, matchingActive ? 0xffd000 : 0x00f0ff, 0x1e1712);
      this.modalContainer.add(cardBox);

      // 패시브 아이콘
      const iconSize = cardHeight <= 85 ? 44 : 52;
      if (this.textures.exists(skill.id)) {
        const icon = this.add.image(width / 2 - 175, cardY, skill.id);
        icon.setDisplaySize(iconSize, iconSize);
        this.modalContainer.add(icon);
      }

      // 이름 및 레벨 진행 배지
      const lvBadge = curLv === 0 ? '[NEW]' : `[Lv.${curLv} ➔ Lv.${nextLv}]`;
      const titleY = cardHeight <= 85 ? cardY - 24 : cardY - 32;
      const name = this.add.text(width / 2 - 135, titleY, `${skill.name} ${lvBadge}`, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: cardHeight <= 85 ? '14px' : '15px',
        color: matchingActive ? '#ffd000' : '#00f0ff',
      });
      this.modalContainer.add(name);

      // 효과 설명
      const lvData = skill.levels[nextLv - 1] || skill.levels[0];
      const descY = cardHeight <= 85 ? cardY - 4 : cardY - 8;
      const desc = this.add.text(width / 2 - 135, descY, lvData.description, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: cardHeight <= 85 ? '11px' : '12px',
        color: '#f5ede2',
        wordWrap: { width: 310 },
      });
      this.modalContainer.add(desc);

      // 각성 시너지 정보
      let synergyText = '';
      if (matchingActive) {
        synergyText = `Evolves: ${matchingActive.name}`;
      } else {
        const anyPartner = ACTIVE_SKILLS.find((a) => a.requiredPassiveId === skill.id);
        if (anyPartner) {
          synergyText = `Synergy: ${anyPartner.name}`;
        }
      }

      if (synergyText) {
        const hintY = cardHeight <= 85 ? cardY + 18 : cardY + 22;
        const hint = this.add.text(width / 2 - 135, hintY, synergyText, {
          fontFamily: 'NeoDunggeunmo, monospace',
          fontSize: '11px',
          color: matchingActive ? '#ffd000' : '#b8a692',
        });
        this.modalContainer.add(hint);
      }

      // 클릭 영역
      const hitArea = this.add.zone(width / 2, cardY, 430, cardHeight).setInteractive({ useHandCursor: true });
      hitArea.on('pointerdown', () => {
        SoundEngine.getInstance().playTone(660, 'sine', 0.2, 0.25);
        player.passiveSkills.set(skill.id, nextLv);
        this.modalContainer.removeAll(true);
        this.battleScene.isPaused = false;
        if (typeof (this.battleScene as any).showDamageText === 'function') {
          (this.battleScene as any).showDamageText(player.x, player.y - 30, `Learned ${skill.name} Lv.${nextLv}!`, 0x00ffaa, true);
        }
      });
      this.modalContainer.add(hitArea);
    });
  }

  // BOSS 경고 배너 (Section 9)
  public showBossWarning(msg: string): void {
    const width = this.cameras.main.width;
    const banner = this.add.container(width / 2, 190).setDepth(150);

    const bar = this.add.graphics();
    bar.fillStyle(0xff2a6d, 0.9);
    bar.fillRect(-width / 2, -20, width, 40);
    banner.add(bar);

    const text = this.add.text(0, 0, msg, {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    banner.add(text);

    this.tweens.add({
      targets: banner,
      alpha: 0,
      yoyo: true,
      repeat: 3,
      duration: 300,
      onComplete: () => banner.destroy(),
    });
  }

  // 결과 정산 모달 (클리어 또는 패배)
  public showResultModal(isVictory: boolean): void {
    // Show interstitial ad on run end (GameMonetize / Yandex Games)
    AdBillingAdapter.getInstance().showInterstitial();

    this.modalContainer.removeAll(true);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.88).setInteractive();
    this.modalContainer.add(dim);

    const box = drawHanokFrame(this, width / 2 - 200, height / 2 - 210, 400, 420, {
      bgColor: 0x18120e,
      bgAlpha: 0.97,
      accentColor: isVictory ? 0x00ffaa : 0xff3344,
      radius: 8,
    });
    this.modalContainer.add(box);

    const title = this.add.text(width / 2, height / 2 - 160, isVictory ? 'PORTAL CLEARED!' : 'FALLEN IN BATTLE', {
      fontFamily: 'Cinzel, serif',
      fontSize: '22px',
      color: isVictory ? '#00ffaa' : '#ff3344',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.modalContainer.add(title);

    const sub = this.add.text(width / 2, height / 2 - 120, isVictory ? `Conquered ${this.battleScene.region.name}` : 'Your legion fell. Upgrade at the Altar and return!', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      color: '#b8a692',
      align: 'center',
      wordWrap: { width: 340 },
    }).setOrigin(0.5);
    this.modalContainer.add(sub);

    // 기록 정산
    const kills = this.add.text(width / 2, height / 2 - 60, `Enemies Slain: ${this.battleScene.killCount}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      color: '#f5ede2',
    }).setOrigin(0.5);
    this.modalContainer.add(kills);

    const elapsed = Math.floor(this.battleScene.waveSpawner.elapsedTime);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    const survival = this.add.text(width / 2, height / 2 - 30, `Survived: ${min}m ${sec}s`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      color: '#f5ede2',
    }).setOrigin(0.5);
    this.modalContainer.add(survival);

    const bonusGold = Math.round((isVictory ? 3000 : 500) * this.battleScene.player.getEffectiveStats().goldMul);
    const goldReward = this.battleScene.earnedGold + bonusGold;
    const goldText = this.add.text(width / 2, height / 2 + 10, `Gold Earned: +${goldReward.toLocaleString()} G`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.modalContainer.add(goldText);

    // 버튼 1: 보상형 광고 2배 수령
    const doubleBtn = this.add.graphics();
    doubleBtn.fillStyle(0xd4a338, 1);
    doubleBtn.fillRoundedRect(width / 2 - 140, height / 2 + 60, 280, 46, 6);
    this.modalContainer.add(doubleBtn);

    const doubleText = this.add.text(width / 2, height / 2 + 83, 'WATCH AD: 2X GOLD LOOT', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#0c0908',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.modalContainer.add(doubleText);

    let isClaiming = false;
    const doubleHit = this.add.zone(width / 2, height / 2 + 83, 280, 46).setInteractive({ useHandCursor: true });
    doubleHit.on('pointerdown', async () => {
      if (isClaiming) return;
      isClaiming = true;
      SoundEngine.getInstance().click();
      doubleText.setText('LOADING AD...');
      const success = await AdBillingAdapter.getInstance().showDoubleRewardAd();
      if (success) {
        SaveManager.getInstance().addGold(goldReward * 2);
        if (isVictory) SaveManager.getInstance().markRegionCleared(this.battleScene.regionId);
        this.returnToHub();
      } else {
        isClaiming = false;
        doubleText.setText('WATCH AD: 2X GOLD LOOT');
      }
    });
    this.modalContainer.add(doubleHit);

    // 버튼 2: EXIT TO HUB 버튼
    const exitBtn = this.add.graphics();
    exitBtn.fillStyle(0x231b15, 1);
    exitBtn.lineStyle(1, 0x543b28, 1);
    exitBtn.fillRoundedRect(width / 2 - 140, height / 2 + 120, 280, 44, 6);
    exitBtn.strokeRoundedRect(width / 2 - 140, height / 2 + 120, 280, 44, 6);
    this.modalContainer.add(exitBtn);

    const exitText = this.add.text(width / 2, height / 2 + 142, 'RETURN TO HUB', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#f5ede2',
    }).setOrigin(0.5);
    this.modalContainer.add(exitText);

    const exitHit = this.add.zone(width / 2, height / 2 + 142, 280, 44).setInteractive({ useHandCursor: true });
    exitHit.on('pointerdown', () => {
      if (isClaiming) return;
      isClaiming = true;
      SoundEngine.getInstance().click();
      SaveManager.getInstance().addGold(goldReward);
      if (isVictory) SaveManager.getInstance().markRegionCleared(this.battleScene.regionId);
      this.returnToHub();
    });
    this.modalContainer.add(exitHit);
  }

  private returnToHub(): void {
    SoundEngine.getInstance().stopBgm();
    this.scene.stop('BattleScene');
    this.scene.stop('UIScene');
    this.scene.start('HubScene');
  }
}
