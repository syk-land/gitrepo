import { t, getLang, toggleLang } from '../core/I18n';
import Phaser from 'phaser';
import { REGIONS_DATA } from '../data/regionsData';
import { SaveManager } from '../core/SaveManager';
import { SoundEngine } from '../core/SoundEngine';
import { COMBAT_TRAITS, SURVIVAL_TRAITS, getAltarUpgradeCost, formatAltarBonus } from '../data/altarData';
import { RELICS_DATA } from '../data/relicsData';
import { MAX_EQUIPPED_RELICS } from '../core/SaveManager';
import { drawHanokFrame } from '../utils/HanokFrameBuilder';

export class HubScene extends Phaser.Scene {
  private selectedRegionId: number = 1;
  private townBg!: Phaser.GameObjects.Image;
  private goldText!: Phaser.GameObjects.Text;
  private regionCardContainer!: Phaser.GameObjects.Container;
  private altarModalContainer?: Phaser.GameObjects.Container;
  private relicModalContainer?: Phaser.GameObjects.Container;
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

    this.add.text(20, 15, t('💀 사령군주 거점', '💀 Necro Lord Hub'), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '18px',
      color: '#ffd000',
    });

    const save = SaveManager.getInstance().getData();
    this.goldText = this.add.text(width - 25, 20, `💰 ${save.gold.toLocaleString()} G`, {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '16px',
      color: '#00ffaa',
    }).setOrigin(1, 0);

    const langLabel = getLang() === 'ko' ? '🌐 KR / en' : '🌐 kr / EN';
    const langBtn = this.add.text(width - 25, 42, langLabel, {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '12px',
      color: '#ffd000',
      backgroundColor: '#231b15',
      padding: { x: 6, y: 2 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    langBtn.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      toggleLang();
    });
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
    const title = this.add.text(width / 2, cardY - 45, t(`[제 ${region.regionId} 구역] ${region.gateName}`, `[Zone ${region.regionId}] ${region.gateName}`), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '15px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.regionCardContainer.add(title);

    const name = this.add.text(width / 2, cardY - 15, region.name, {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '18px',
      color: '#f5ede2',
      align: 'center',
      wordWrap: { width: 380 },
    }).setOrigin(0.5);
    this.regionCardContainer.add(name);

    // 보스 정보 및 상태
    const bossInfo = this.add.text(width / 2, cardY + 45, t(`👑 보스: ${region.boss}`, `👑 Boss: ${region.boss}`), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#ff2a6d',
    }).setOrigin(0.5);
    this.regionCardContainer.add(bossInfo);

    const stars = save.regionStars?.[this.selectedRegionId] ?? (isCleared ? 1 : 0);
    const starStr = stars > 0 ? '★'.repeat(Math.min(3, stars)) + '☆'.repeat(Math.max(0, 3 - stars)) : '☆☆☆';
    const bestEndless = save.bestEndlessTime?.[this.selectedRegionId];
    const endlessStr = bestEndless ? t(`  |  ♾️ 최고 ${Math.floor(bestEndless / 60)}분 ${bestEndless % 60}초`, `  |  ♾️ Best ${Math.floor(bestEndless / 60)}m ${bestEndless % 60}s`) : '';
    const missionText = this.add.text(width / 2, cardY + 72, `${starStr}${endlessStr}`, {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '13px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.regionCardContainer.add(missionText);

    const statusBadge = this.add.text(width / 2, cardY + 104, isCleared ? t('🏆 차원문 평정 완료', '🏆 Gate Conquered') : isUnlocked ? t('⚔️ 정복 가능', '⚔️ Ready to Conquer') : t('🔒 이전 차원문 클리어 필요', '🔒 Clear previous gate first'), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '15px',
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

    const startText = this.add.text(width / 2, bottomY + 28, t('⚔️ 차원문 출정 (전투 개시)', '⚔️ Enter Gate (Start Battle)'), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '18px',
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

    // 2. 영혼 각인의 제단 + 보스 영혼 유물 버튼 (2분할)
    const altarBtn = this.add.graphics();
    altarBtn.fillStyle(0x231b15, 0.95);
    altarBtn.fillRoundedRect(width / 2 - 190, bottomY + 68, 185, 48, 8);
    altarBtn.lineStyle(1, 0x00ffaa, 1);
    altarBtn.strokeRoundedRect(width / 2 - 190, bottomY + 68, 185, 48, 8);

    this.add.text(width / 2 - 97, bottomY + 92, t('⚱️ 영혼 제단', '⚱️ Soul Altar'), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#00ffaa',
    }).setOrigin(0.5);

    const altarHitArea = this.add.zone(width / 2 - 97, bottomY + 92, 185, 48).setInteractive({ useHandCursor: true });
    altarHitArea.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.openAltarModal(width, height);
    });

    const equippedCount = (SaveManager.getInstance().getData().equippedRelics ?? []).length;
    const relicBtn = this.add.graphics();
    relicBtn.fillStyle(0x231829, 0.95);
    relicBtn.fillRoundedRect(width / 2 + 5, bottomY + 68, 185, 48, 8);
    relicBtn.lineStyle(1, 0xcc66ff, 1);
    relicBtn.strokeRoundedRect(width / 2 + 5, bottomY + 68, 185, 48, 8);

    this.add.text(width / 2 + 97, bottomY + 92, t(`🔮 영혼 유물 (${equippedCount}/${MAX_EQUIPPED_RELICS})`, `🔮 Soul Relics (${equippedCount}/${MAX_EQUIPPED_RELICS})`), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#ee99ff',
    }).setOrigin(0.5);

    const relicHitArea = this.add.zone(width / 2 + 97, bottomY + 92, 185, 48).setInteractive({ useHandCursor: true });
    relicHitArea.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.openRelicModal(width, height);
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

    const title = this.add.text(width / 2, 68, t('⚱️ 영혼 각인의 제단 (영구 특성)', '⚱️ Altar of Soul Imprints (Permanent Traits)'), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '18px',
      color: '#ffd000',
    }).setOrigin(0.5);
    this.altarModalContainer.add(title);

    // 닫기 버튼
    const closeBtn = this.add.text(width - 48, 68, '✖', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '22px',
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

    // 탭 버튼 [⚔️ 전투 특성 (9종)] / [🛡️ 생존 및 성장 (9종)]
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

    const combatText = this.add.text(35 + tabW / 2, tabY + tabH / 2, t('⚔️ 전투 특성 (9종)', '⚔️ Combat Traits (9)'), {
      fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
      fontSize: '14px',
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

    const survivalText = this.add.text(survivalX + tabW / 2, tabY + tabH / 2, t('🛡️ 생존 및 성장 (9종)', '🛡️ Survival & Growth (9)'), {
      fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
      fontSize: '14px',
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

      const btnText = this.add.text(width - 100, rowY + 36, isMax ? t('만렙 달성', 'MAX') : `${cost.toLocaleString()} G`, {
        fontFamily: 'NeoDunggeunmo, Pretendard, monospace',
        fontSize: '13px',
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
    this.goldText.setText(`💰 ${save.gold.toLocaleString()} G`);
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

    popup.add(this.add.text(width / 2, height / 2 - 80, t('💀 사령 군단 원정 완료!', '💀 Legion Expedition Complete!'), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '18px',
      color: '#00ffaa',
    }).setOrigin(0.5));

    popup.add(this.add.text(width / 2, height / 2 - 35, t(`${reward.elapsedMinutes}분 동안 사령들이 차원문을 탐색하여\n전리품을 수확했습니다.`, `Your minions explored the gate for ${reward.elapsedMinutes} min\nand harvested loot.`), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#f5ede2',
      align: 'center',
    }).setOrigin(0.5));

    popup.add(this.add.text(width / 2, height / 2 + 20, t(`💰 +${reward.gold.toLocaleString()} 마력석 획득!`, `💰 +${reward.gold.toLocaleString()} Mana Stones gained!`), {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '17px',
      color: '#ffd000',
    }).setOrigin(0.5));

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0x00ffaa, 1);
    confirmBtn.fillRoundedRect(width / 2 - 75, height / 2 + 55, 150, 42, 6);
    popup.add(confirmBtn);

    popup.add(this.add.text(width / 2, height / 2 + 76, t('확인', 'OK'), {
      fontFamily: 'NeoDunggeunmo, monospace',
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

  private openRelicModal(width: number, height: number): void {
    if (this.relicModalContainer) {
      this.relicModalContainer.destroy();
    }
    this.relicModalContainer = this.add.container(0, 0).setDepth(110);

    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.84).setInteractive();
    this.relicModalContainer.add(dim);

    const panelW = Math.min(460, width - 24);
    const panelH = Math.min(560, height - 60);
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2;

    const frame = drawHanokFrame(this, panelX, panelY, panelW, panelH, {
      bgColor: 0x18120e,
      bgAlpha: 0.97,
      accentColor: 0xcc66ff,
      radius: 8,
    });
    this.relicModalContainer.add(frame);

    const save = SaveManager.getInstance().getData();
    const unlocked = new Set(save.unlockedRelics ?? []);
    const equipped = new Set(save.equippedRelics ?? []);

    const title = this.add.text(
      width / 2,
      panelY + 26,
      t(`🔮 보스 영혼 유물 (${equipped.size}/${MAX_EQUIPPED_RELICS} 장착)`, `🔮 Boss Soul Relics (${equipped.size}/${MAX_EQUIPPED_RELICS} equipped)`),
      {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '17px',
        color: '#ee99ff',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);
    this.relicModalContainer.add(title);

    const closeBtn = this.add.text(panelX + panelW - 22, panelY + 22, '✕', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '20px',
      color: '#ff6677',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      SoundEngine.getInstance().click();
      this.relicModalContainer?.destroy();
      this.relicModalContainer = undefined;
    });
    this.relicModalContainer.add(closeBtn);

    // 최대 7개씩 2페이지 또는 상위 7개 표시 (현재 해금 우선 정렬)
    const sorted = [...RELICS_DATA].sort((a, b) => {
      const aUnl = unlocked.has(a.id) ? 0 : 1;
      const bUnl = unlocked.has(b.id) ? 0 : 1;
      return aUnl - bUnl || a.regionId - b.regionId;
    }).slice(0, 7);

    sorted.forEach((relic, idx) => {
      const rowY = panelY + 66 + idx * 66;
      const isUnl = unlocked.has(relic.id);
      const isEq = equipped.has(relic.id);

      const rowBg = this.add.graphics();
      rowBg.fillStyle(isEq ? 0x2c1b3d : 0x211915, 0.95);
      rowBg.lineStyle(1.5, isEq ? 0x00ffaa : isUnl ? 0x9966cc : 0x444444, 1);
      rowBg.fillRoundedRect(panelX + 16, rowY, panelW - 32, 58, 6);
      rowBg.strokeRoundedRect(panelX + 16, rowY, panelW - 32, 58, 6);
      this.relicModalContainer!.add(rowBg);

      const nameTxt = this.add.text(
        panelX + 28,
        rowY + 8,
        t(`[${relic.regionId}구역] ${relic.name}${isEq ? ' ✅ 장착 중' : isUnl ? '' : ' 🔒 미해금'}`, `[Zone ${relic.regionId}] ${relic.name}${isEq ? ' ✅ Equipped' : isUnl ? '' : ' 🔒 Locked'}`),
        {
          fontFamily: 'NeoDunggeunmo, monospace',
          fontSize: '13px',
          color: isEq ? '#00ffaa' : isUnl ? '#ffd000' : '#777777',
        }
      );
      this.relicModalContainer!.add(nameTxt);

      const descTxt = this.add.text(panelX + 28, rowY + 30, relic.desc, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '11px',
        color: isUnl ? '#e8dfd5' : '#666666',
        wordWrap: { width: panelW - 60 },
      });
      this.relicModalContainer!.add(descTxt);

      if (isUnl) {
        const hit = this.add.zone(width / 2, rowY + 29, panelW - 32, 58).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          SoundEngine.getInstance().click();
          SaveManager.getInstance().toggleEquipRelic(relic.id);
          this.openRelicModal(width, height);
        });
        this.relicModalContainer!.add(hit);
      }
    });
  }
}
