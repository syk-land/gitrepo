import Phaser from 'phaser';
import { REGIONS_DATA } from '../data/regionsData';
import { MINIONS_DATA } from '../data/minionsData';
import { ALL_SKILLS_MAP } from '../data/skillsData';

import { MapTextureGenerator } from '../utils/MapTextureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 로딩 진행률 UI
    const titleText = this.add.text(width / 2, height / 2 - 80, '💀 목적을 잃지 않는 사령군주 : 서바이버즈', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '20px',
      color: '#00ffaa',
    }).setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2 - 40, '1,950개 도트 에셋 및 차원문 동기화 중...', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '14px',
      color: '#ffd000',
    }).setOrigin(0.5);

    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    progressBox.fillStyle(0x18120e, 0.85);
    progressBox.lineStyle(2, 0xd4a338, 1);
    progressBox.strokeRect(width / 2 - 160, height / 2, 320, 24);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 24);

    const percentText = this.add.text(width / 2, height / 2 + 12, '0%', {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '13px',
      color: '#f5ede2',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ffaa, 1);
      progressBar.fillRect(width / 2 - 156, height / 2 + 4, 312 * value, 16);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      percentText.destroy();
      titleText.destroy();
      subText.destroy();
    });

    // 1. 주인공 사령군주 (최미남)
    this.load.image('hero_nemesis', 'assets/agents/agent_male_nemesis.png');

    // 2. 소환수 군단 5종
    for (const minion of Object.values(MINIONS_DATA)) {
      this.load.image(minion.id, minion.sprite);
    }

    // 3. 차원문 1~14지역 배경 및 84종 괴수 에셋 일괄 등록
    for (let r = 1; r <= 14; r++) {
      this.load.image(`battle_bg_${r}`, `assets/ui/regions/battle_bg_${r}.png`);
      this.load.image(`town_bg_${r}`, `assets/ui/regions/town_bg_${r}.png`);

      // 괴수 4종 + 수문장 + 보스
      for (let m = 1; m <= 4; m++) {
        this.load.image(`m_${r}_${m}`, `assets/monsters/m_${r}_${m}.png`);
      }
      this.load.image(`m_${r}_named`, `assets/monsters/m_${r}_named.png`);
      this.load.image(`m_${r}_boss`, `assets/monsters/m_${r}_boss.png`);
    }

    // 4. 스킬 UI 아이콘 & 인게임 투사체 VFX
    for (const skill of ALL_SKILLS_MAP.values()) {
      this.load.image(skill.id, skill.icon);
    }

    // 인게임 전용 전투 투사체/공격 VFX (전방 방향성 및 전장 스케일 최적화)
    const inGameVfxList = [
      'necro_spear', 'necro_bone_storm', 'necro_lich_curse', 'necro_armor', 'dk_grip', 'storm_chain',
      'sniper_shot', 'psi_blackhole', 'cryo_nova', 'ber_whirlwind',
      'sm_dragon', 'psi_drone', 'priest_sanctuary',
      'awakened_spear', 'awakened_armor', 'awakened_grip', 'awakened_chain',
      'awakened_sniper', 'awakened_blackhole', 'awakened_cryo', 'awakened_whirlwind',
      'awakened_dragon', 'awakened_sanctuary'
    ];
    for (const id of inGameVfxList) {
      this.load.image(`vfx_${id}`, `assets/skills/vfx/vfx_${id}.png`);
    }
    this.load.image('vfx_minion_arrow', 'assets/skills/vfx/vfx_minion_arrow.png');
    this.load.image('vfx_minion_mage', 'assets/skills/vfx/vfx_minion_mage.png');
    this.load.image('vfx_minion_drone', 'assets/skills/vfx/vfx_minion_drone.png');

    // 5. 게이트 및 UI 프레임, 드랍 아이템
    this.load.image('item_parchment', 'assets/ui/item_parchment.png');

    const gateTypes = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
    for (const g of gateTypes) {
      this.load.image(`gate_${g}`, `assets/ui/gates/gate_${g}.png`);
    }

    this.load.image('ui_joseon_frame', 'assets/ui/ui_joseon_frame_cropped.png');
    this.load.image('ui_hanji_card', 'assets/ui/ui_hanji_card_cropped.png');
    this.load.image('ui_hanji_tile', 'assets/ui/ui_hanji_center_tile.png');
  }

  create(): void {
    MapTextureGenerator.generateAll(this);
    this.scene.start('HubScene');
  }
}
