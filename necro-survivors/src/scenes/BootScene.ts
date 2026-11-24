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
    const titleText = this.add.text(width / 2, height / 2 - 80, 'NECRO SURVIVORS', {
      fontFamily: 'Cinzel, serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#00ffaa',
    }).setOrigin(0.5);

    const subText = this.add.text(width / 2, height / 2 - 44, 'Summoning Undead Legion & Portals...', {
      fontFamily: 'Inter, sans-serif',
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
    this.load.image('hero_nemesis', 'assets/agents/agent_male_nemesis.webp');

    // 2. 소환수 군단 5종
    for (const minion of Object.values(MINIONS_DATA)) {
      this.load.image(minion.id, minion.sprite);
    }

    // 3. 차원문 1~14지역 배경, 심리스 바닥 타일 및 84종 괴수 에셋 일괄 등록
    for (let r = 1; r <= 14; r++) {
      this.load.image(`battle_bg_${r}`, `assets/ui/regions/battle_bg_${r}.webp`);
      this.load.image(`town_bg_${r}`, `assets/ui/regions/town_bg_${r}.webp`);
      this.load.image(`battle_tile_${r}`, `assets/ui/tiles/battle_tile_${r}.webp`);

      // 괴수 4종 + 수문장 + 보스
      for (let m = 1; m <= 4; m++) {
        this.load.image(`m_${r}_${m}`, `assets/monsters/m_${r}_${m}.webp`);
      }
      this.load.image(`m_${r}_named`, `assets/monsters/m_${r}_named.webp`);
      this.load.image(`m_${r}_boss`, `assets/monsters/m_${r}_boss.webp`);
    }

    // 4. 스킬 UI 아이콘 & 인게임 투사체 VFX
    for (const skill of ALL_SKILLS_MAP.values()) {
      this.load.image(skill.id, skill.icon);
    }

    // 인게임 전용 전투 투사체/공격 VFX (전방 방향성 및 전장 스케일 최적화, 35종 전체 분리 완료)
    const inGameVfxList = [
      'necro_spear', 'necro_bone_storm', 'necro_lich_curse', 'necro_armor', 'dk_grip', 'storm_chain',
      'sniper_shot', 'psi_blackhole', 'cryo_nova', 'ber_whirlwind',
      'sm_dragon', 'psi_drone', 'priest_sanctuary',
      'awakened_spear', 'awakened_armor', 'awakened_grip', 'awakened_chain',
      'awakened_sniper', 'awakened_blackhole', 'awakened_cryo', 'awakened_whirlwind',
      'awakened_dragon', 'awakened_sanctuary',
      'storm_thunder', 'cryo_snowball', 'fire_ball', 'fire_storm', 'spear_crimson', 'spear_heaven',
      'awakened_thunder', 'awakened_snowball', 'awakened_fireball', 'awakened_firestorm',
      'awakened_spear_crimson', 'awakened_spear_heaven',
    ];
    for (const id of inGameVfxList) {
      this.load.image(`vfx_${id}`, `assets/skills/vfx/vfx_${id}.webp`);
    }
    this.load.image('vfx_minion_arrow', 'assets/skills/vfx/vfx_minion_arrow.webp');
    this.load.image('vfx_minion_mage', 'assets/skills/vfx/vfx_minion_mage.webp');
    this.load.image('vfx_minion_drone', 'assets/skills/vfx/vfx_minion_drone.webp');

    // 5. 게이트 및 UI 프레임, 드랍 아이템 (비급서, 진화 보물상자, 4단계 마력석 보석)
    this.load.image('item_parchment', 'assets/ui/item_parchment.webp');
    this.load.image('item_evolution_chest', 'assets/ui/item_evolution_chest.webp');
    this.load.image('gem_cyan', 'assets/ui/gems/gem_cyan.webp');
    this.load.image('gem_jade', 'assets/ui/gems/gem_jade.webp');
    this.load.image('gem_gold', 'assets/ui/gems/gem_gold.webp');
    this.load.image('gem_ruby', 'assets/ui/gems/gem_ruby.webp');

    const gateTypes = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'diamond'];
    for (const g of gateTypes) {
      this.load.image(`gate_${g}`, `assets/ui/gates/gate_${g}.webp`);
    }
  }

  create(): void {
    MapTextureGenerator.generateAll(this);
    this.scene.start('HubScene');
  }
}
