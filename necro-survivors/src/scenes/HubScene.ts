import Phaser from 'phaser';
import { REGIONS_DATA } from '../data/regionsData';
import { SaveManager } from '../core/SaveManager';
import { SoundEngine } from '../core/SoundEngine';
import { COMBAT_TRAITS, SURVIVAL_TRAITS, getAltarUpgradeCost, formatAltarBonus } from '../data/altarData';
import { drawHanokFrame } from '../utils/HanokFrameBuilder';

export class HubScene extends Phaser.Scene {
  private selectedRegionId: number = 1;
  private townBg!: Phaser.GameObjects.Image;
  private goldText!: Phaser.GameObjects.Text;
  private regionCardContainer!: Phaser.GameObjects.Container;
  private altarModalContainer?: Phaser.GameObjects.Container;
  private currentAltarTab: 'combat' | 'survival' = 'combat';

  constructor() {
    super('HubScene');
  }

  create(): void {
    const save = SaveManager.getInstance().getData();
    this.selectedRegionId = Math.min(Math.max(1, save.selectedRegion), Math.min(14, save.highestClearedRegion + 1));

    SoundEngine.getInstance().startBgm('hub');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. 거점 마을 배경 (선택된 지역의 마을 풍경)
    this.townBg = this.add.image(width / 2, height / 2, `town_bg_${this.selectedRegionId}`);
    this.townBg.setDisplaySize(width, height);
    this.townBg.setAlpha(0.65);

    // 반투명 어두운 오버레이
    this.add.rectangle(width / 2, height / 2, width, height, 0x0c0908, 0.45);

    // 2. 상단 네비게이션 바
    this.createTopBar(width);

    // 3. 차원문 선택 카드 (1~14지역)
    this.regionCardContainer = this.add.container(0, 0);
    this.renderRegionCard(width, height);

    // 4. 하단 버튼군 (출정, 영혼 각인 제단, 상점)
    this.createBottomButtons(width, height);

    // 5. 오프라인 방치 보상 체크
    this.checkOfflineReward(width, height);
  }

  private createTopBar(width: number): void {
    const bar = this.add.graphics();
    bar.fillStyle(0x18120e, 0.95);
    bar.lineStyle(2, 0xd4a338, 1);
    bar.fillRect(0, 0, width, 65);
    bar.strokeRect(0, 0, width, 65);

    this.add.text(20, 18, 'NECRO SURVIVORS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffd000',
    });

    const save = SaveManager.getInstance().getData();
    this.goldText = this.add.text(width - 25, 20, `${save.gold.toLocaleString()} G`, {
      fontFamily: 'Inter, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#00ffaa',
    }).setOrigin(1, 0);
  }

  private renderRegionCard(width: number, height: number): void {
    this.regionCardContainer.removeAll(true);
    const region = REGIONS_DATA[this.selectedRegionId];
    const save = SaveManager.getInstance().getData();
    const isUnlocked = this.selectedRegionId <= save.highestClearedRegion + 1;
    const isCleared = this.selectedRegionId <= save.highestClearedRegion;

    const cardY = height / 2 - 40;

    // 게이트 프레임 카드 (한옥 나무 창호 프레임)
    const box = drawHanokFrame(this, width / 2 - 220, cardY - 180, 440, 360, {
      bgColor: 0x18120e,
      bgAlpha: 0.92,
      accentColor: isUnlocked ? 0xd4a338 : 0x666666,
      radius: 8,
    });
    this.regionCardContainer.add(box);

    // 게이트 아이콘
    const gateIcon = this.add.image(width / 2, cardY - 110, `gate_${region.gateType}`);
    gateIcon.setDisplaySize(72, 72);
    this.regionCardContainer.add(gateIcon);

    // 지역 번호 및 명칭
    const title = this.add.text(width / 2, cardY - 45, `[ZONE ${region.regionId}] ${region.gateName}`, {
      fontFamily: 'Cinzel, serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.regionCardContainer.add(title);

    const name = this.add.text(width / 2, cardY - 15, region.name, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f5ede2',
      align: 'center',
      wordWrap: { width: 380 },
    }).setOrigin(0.5);
    this.regionCardContainer.add(name);

    // 보스 정보 및 상태
    const bossInfo = this.add.text(width / 2, cardY + 45, `BOSS: ${region.boss}`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ff4d7d',
    }).setOrigin(0.5);
    this.regionCardContainer.add(bossInfo);

    const statusBadge = this.add.text(width / 2, cardY + 95, isCleared ? 'CLEARED' : isUnlocked ? 'READY FOR BATTLE' : 'CLEAR PREVIOUS ZONE TO UNLOCK', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: isCleared ? '#00ffaa' : isUnlocked ? '#00f0ff' : '#888888',
    }).setOrigin(0.5);
    this.regionCardContainer.add(statusBadge);

    // 좌/우 넘김 버튼
    const leftBtn = this.add.text(width / 2 - 200, cardY, '◀', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '32px',
      color: this.selectedRegionId > 1 ? '#ffd000' : '#444444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    leftBtn.on('pointerdown', () => {
      if (this.selectedRegionId > 1) {
        SoundEngine.getInstance().click();
        this.selectedRegionId--;
        SaveManager.getInstance().setSelectedRegion(this.selectedRegionId);
        this.townBg.setTexture(`town_bg_${this.selectedRegionId}`);
        this.townBg.setDisplaySize(width, height);
        this.renderRegionCard(width, height);
      }
    });
    this.regionCardContainer.add(leftBtn);

    const rightBtn = this.add.text(width / 2 + 200, cardY, '▶', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '32px',
      color: this.selectedRegionId < 14 ? '#ffd000' : '#444444',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    rightBtn.on('pointerdown', () => {
      if (this.selectedRegionId < 14) {
        SoundEngine.getInstance().click();
        this.selectedRegionId++;
        SaveManager.getInstance().setSelectedRegion(this.selectedRegionId);
        this.townBg.setTexture(`town_bg_${this.selectedRegionId}`);
        this.townBg.setDisplaySize(width, height);
        this.renderRegionCard(width, height);
      }
    });
    this.regionCardContainer.add(rightBtn);
  }

  private createBottomButtons(width: number, height: number): void {
    const bottomY = height - 140;

    // 1. 차원문 출정 버튼
    const startBtn = this.add.graphics();
    startBtn.fillStyle(0xd4a338, 1);
    startBtn.fillRoundedRect(width / 2 - 190, bottomY, 380, 56, 8);
    startBtn.lineStyle(2, 0xfff0a0, 1);
    startBtn.strokeRoundedRect(width / 2 - 190, bottomY, 380, 56, 8);

    const startText = this.add.text(width / 2, bottomY + 28, 'ENTER PORTAL (START BATTLE)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '17px',
      color: '#0c0908',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const startHitArea = this.add.zone(width / 2, bottomY + 28, 380, 56).setInteractive({ useHandCursor: true });
    startHitArea.on('pointerdown', () => {
      const save = SaveManager.getInstance().getData();
      if (this.selectedRegionId > save.highestClearedRegion + 1) {
        SoundEngine.getInstance().playTone(180, 'sawtooth', 0.15, 0.15);
        return;
      }
      SoundEngine.getInstance().click();
      SoundEngine.getInstance().stopBgm();

      // BattleScene과 UIScene 병렬 실행
      this.scene.start('BattleScene', { regionId: this.selectedRegionId });
      this.scene.launch('UIScene');
    });

    // 2. 영혼 각인의 제단 열기 버튼
    const altarBtn = this.add.graphics();
    altarBtn.fillStyle(0x231b15, 0.95);
    altarBtn.fillRoundedRect(width / 2 - 190, bottomY + 68, 380, 48, 8);
    altarBtn.lineStyle(1, 0x00ffaa, 1);
    altarBtn.strokeRoundedRect(width / 2 - 190, bottomY + 68, 380, 48, 8);

    this.add.text(width / 2, bottomY + 92, 'ALTAR OF SOULS (UPGRADES)', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#00ffaa',
    }).setOrigin(0.5);

    const altarHitArea = this.add.zone(width / 2, bottomY + 92, 380, 48).setInteractive({ useHandCursor: true });
    altarHitArea.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.openAltarModal(width, height);
    });
  }

  // 영혼 각인의 제단 모달
  private openAltarModal(width: number, height: number): void {
    if (this.altarModalContainer) {
      this.altarModalContainer.destroy();
    }

    this.altarModalContainer = this.add.container(0, 0);
    this.altarModalContainer.setDepth(100);

    // 모달 배경 딤
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setInteractive();
    this.altarModalContainer.add(dim);

    // 제단 패널 (한옥 나무 창호 프레임)
    const panel = drawHanokFrame(this, 20, 42, width - 40, height - 84, {
      bgColor: 0x18120e,
      bgAlpha: 0.96,
      accentColor: 0xd4a338,
      radius: 8,
    });
    this.altarModalContainer.add(panel);

    const title = this.add.text(width / 2, 68, 'ALTAR OF SOULS (PERMANENT)', {
      fontFamily: 'Cinzel, serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.altarModalContainer.add(title);

    // 닫기 버튼
    const closeBtn = this.add.text(width - 48, 68, 'X', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#f5ede2',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      if (this.altarModalContainer) {
        this.altarModalContainer.destroy();
        this.altarModalContainer = undefined;
      }
      this.updateGoldText();
    });
    this.altarModalContainer.add(closeBtn);

    // 탭 버튼
    const isCombat = this.currentAltarTab === 'combat';
    const tabY = 96;
    const tabW = 210;
    const tabH = 34;

    // 1. 전투 특성 탭
    const combatTab = this.add.graphics();
    combatTab.fillStyle(isCombat ? 0x3d2714 : 0x18120e, 1);
    combatTab.lineStyle(isCombat ? 2 : 1, isCombat ? 0xffd000 : 0x543b28, 1);
    combatTab.fillRoundedRect(35, tabY, tabW, tabH, 6);
    combatTab.strokeRoundedRect(35, tabY, tabW, tabH, 6);
    this.altarModalContainer.add(combatTab);

    const combatText = this.add.text(35 + tabW / 2, tabY + tabH / 2, 'COMBAT TRAITS (9)', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: isCombat ? '#ffd000' : '#887564',
    }).setOrigin(0.5);
    this.altarModalContainer.add(combatText);

    const combatHit = this.add.zone(35 + tabW / 2, tabY + tabH / 2, tabW, tabH).setInteractive({ useHandCursor: true });
    combatHit.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.currentAltarTab = 'combat';
      this.openAltarModal(width, height);
    });
    this.altarModalContainer.add(combatHit);

    // 2. 생존 및 성장 탭
    const survivalX = width - 35 - tabW;
    const survivalTab = this.add.graphics();
    survivalTab.fillStyle(!isCombat ? 0x3d2714 : 0x18120e, 1);
    survivalTab.lineStyle(!isCombat ? 2 : 1, !isCombat ? 0xffd000 : 0x543b28, 1);
    survivalTab.fillRoundedRect(survivalX, tabY, tabW, tabH, 6);
    survivalTab.strokeRoundedRect(survivalX, tabY, tabW, tabH, 6);
    this.altarModalContainer.add(survivalTab);

    const survivalText = this.add.text(survivalX + tabW / 2, tabY + tabH / 2, 'SURVIVAL & GROWTH (9)', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: !isCombat ? '#ffd000' : '#887564',
    }).setOrigin(0.5);
    this.altarModalContainer.add(survivalText);

    const survivalHit = this.add.zone(survivalX + tabW / 2, tabY + tabH / 2, tabW, tabH).setInteractive({ useHandCursor: true });
    survivalHit.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.currentAltarTab = 'survival';
      this.openAltarModal(width, height);
    });
    this.altarModalContainer.add(survivalHit);

    const items = isCombat ? COMBAT_TRAITS : SURVIVAL_TRAITS;
    const save = SaveManager.getInstance().getData();

    items.forEach((item, idx) => {
      const rowY = 138 + idx * 80;
      const curLv = item.category === 'talent' ? save.talents[item.id] || 0 : save.traits[item.id] || 0;
      const isMax = curLv >= item.maxLevel;
      const cost = getAltarUpgradeCost(curLv, item);

      const rowBox = this.add.graphics();
      rowBox.fillStyle(0x231b15, 0.92);
      rowBox.lineStyle(1, 0x543b28, 1);
      rowBox.fillRoundedRect(35, rowY, width - 70, 72, 6);
      rowBox.strokeRoundedRect(35, rowY, width - 70, 72, 6);
      this.altarModalContainer!.add(rowBox);

      const nameText = this.add.text(48, rowY + 9, `${item.name} (Lv.${curLv}/${item.maxLevel})`, {
        fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
        fontSize: '15px',
        color: isMax ? '#ffd000' : '#00ffaa',
      });
      this.altarModalContainer!.add(nameText);

      const descText = this.add.text(48, rowY + 30, item.desc, {
        fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
        fontSize: '12px',
        color: '#b8a692',
      });
      this.altarModalContainer!.add(descText);

      const bonusText = this.add.text(48, rowY + 50, formatAltarBonus(item, curLv), {
        fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
        fontSize: '12px',
        color: curLv > 0 ? '#ffd000' : '#66594d',
      });
      this.altarModalContainer!.add(bonusText);

      // 강화 버튼
      const canAfford = save.gold >= cost && !isMax;
      const upBtn = this.add.graphics();
      upBtn.fillStyle(isMax ? 0x33281f : canAfford ? 0xd4a338 : 0x444444, 1);
      if (canAfford) {
        upBtn.lineStyle(1.5, 0xffd000, 1);
      }
      upBtn.fillRoundedRect(width - 150, rowY + 15, 100, 42, 6);
      if (canAfford) {
        upBtn.strokeRoundedRect(width - 150, rowY + 15, 100, 42, 6);
      }
      this.altarModalContainer!.add(upBtn);

      const btnText = this.add.text(width - 100, rowY + 36, isMax ? 'MAX' : `${cost.toLocaleString()} G`, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: isMax ? '#ffd000' : canAfford ? '#0c0908' : '#888888',
      }).setOrigin(0.5);
      this.altarModalContainer!.add(btnText);

      if (canAfford) {
        const hit = this.add.zone(width - 100, rowY + 36, 100, 42).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          if (SaveManager.getInstance().upgradeAltarItem(item.id, item.category === 'talent', cost)) {
            SoundEngine.getInstance().playTone(1046, 'square', 0.1, 0.15, 1318);
            this.openAltarModal(width, height);
            this.updateGoldText();
          }
        });
        this.altarModalContainer!.add(hit);
      }
    });
  }

  private updateGoldText(): void {
    const save = SaveManager.getInstance().getData();
    this.goldText.setText(`${save.gold.toLocaleString()} G`);
  }

  // 오프라인 방치 보상 알림창
  private checkOfflineReward(width: number, height: number): void {
    const reward = SaveManager.getInstance().calculateOfflineReward();
    if (reward.gold <= 0) return;

    SaveManager.getInstance().addGold(reward.gold);
    this.updateGoldText();

    const popup = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75).setInteractive();
    popup.add(dim);

    const box = drawHanokFrame(this, width / 2 - 180, height / 2 - 120, 360, 240, {
      bgColor: 0x18120e,
      bgAlpha: 0.97,
      accentColor: 0x00ffaa,
      radius: 8,
    });
    popup.add(box);

    popup.add(this.add.text(width / 2, height / 2 - 80, 'EXPEDITION COMPLETE!', {
      fontFamily: 'Cinzel, serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00ffaa',
    }).setOrigin(0.5));

    popup.add(this.add.text(width / 2, height / 2 - 35, `Your undead legion raided portals for\n${reward.elapsedMinutes} min while you were away.`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#f5ede2',
      align: 'center',
    }).setOrigin(0.5));

    popup.add(this.add.text(width / 2, height / 2 + 20, `+${reward.gold.toLocaleString()} Gold Earned!`, {
      fontFamily: 'Inter, sans-serif',
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffd000',
    }).setOrigin(0.5));

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0x00ffaa, 1);
    confirmBtn.fillRoundedRect(width / 2 - 75, height / 2 + 55, 150, 42, 6);
    popup.add(confirmBtn);

    popup.add(this.add.text(width / 2, height / 2 + 76, 'CLAIM', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      color: '#0c0908',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    const hit = this.add.zone(width / 2, height / 2 + 76, 150, 42).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      SoundEngine.getInstance().gemPickup();
      popup.destroy();
    });
    popup.add(hit);
  }
}
