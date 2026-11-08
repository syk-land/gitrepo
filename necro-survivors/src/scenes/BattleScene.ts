import Phaser from 'phaser';
import { RegionData, SkillData } from '../data/types';
import { REGIONS_DATA } from '../data/regionsData';
import { Player } from '../entities/Player';
import { MinionUnit } from '../entities/MinionUnit';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { ExpGem } from '../entities/ExpGem';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { WaveSpawner } from '../systems/WaveSpawner';
import { SkillExecutor } from '../systems/SkillExecutor';
import { SoundEngine } from '../core/SoundEngine';
import { MINIONS_DATA } from '../data/minionsData';
import { ALL_SKILLS_MAP, AWAKENED_SKILLS } from '../data/skillsData';
import { UIScene } from './UIScene';

export class BattleScene extends Phaser.Scene {
  public regionId: number = 1;
  public region!: RegionData;
  public player!: Player;
  public minions: MinionUnit[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public expGems: ExpGem[] = [];
  public spatialGrid = new SpatialHashGrid<Enemy>(128);
  public waveSpawner!: WaveSpawner;

  private tileBg!: Phaser.GameObjects.TileSprite;
  public isPaused: boolean = false;
  public killCount: number = 0;
  public earnedGold: number = 0;
  public recentCorpses: { x: number; y: number; time: number }[] = [];

  // 조이스틱 이동 입력 벡터 (UIScene에서 매 프레임 전달)
  public inputVector = { x: 0, y: 0 };

  // 진화 보물상자 객체
  private evolutionChest: Phaser.GameObjects.Sprite | null = null;

  constructor() {
    super('BattleScene');
  }

  init(data: { regionId: number }): void {
    this.regionId = data.regionId || 1;
    this.region = REGIONS_DATA[this.regionId] || REGIONS_DATA[1];
    this.killCount = 0;
    this.earnedGold = 0;
    this.isPaused = false;
    this.minions = [];
    this.enemies = [];
    this.projectiles = [];
    this.expGems = [];
    this.recentCorpses = [];
    this.evolutionChest = null;
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. 360도 무한 타일 배경 (뱀서 전용 맵별 심리스 타일 텍스처)
    const textureKey = this.textures.exists(`battle_tile_${this.regionId}`)
      ? `battle_tile_${this.regionId}`
      : `battle_bg_${this.regionId}`;
    this.tileBg = this.add.tileSprite(width / 2, height / 2, width, height, textureKey);
    this.tileBg.setOrigin(0.5, 0.5);
    this.tileBg.setScrollFactor(0);
    this.tileBg.setDepth(0);

    // 2. 플레이어 생성 및 카메라 추적
    this.player = new Player(this, 0, 0);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // 기본 사역마(해골 병사 2구) 즉시 소환 배치
    this.syncMinionCount('skeleton_warrior', 2);

    // 3. 웨이브 스포너 초기화
    this.waveSpawner = new WaveSpawner(
      this,
      this.region,
      this.player,
      this.enemies,
      (named) => this.onNamedSpawned(named),
      (boss) => this.onBossSpawned(boss)
    );

    // 4. BGM 전투 모드 가동
    SoundEngine.getInstance().startBgm('battle');
  }

  public update(_time: number, delta: number): void {
    if (this.isPaused) return;
    const dt = delta / 1000;

    // 1. 무한 타일 배경 카메라 동기화
    this.tileBg.tilePositionX = this.cameras.main.scrollX;
    this.tileBg.tilePositionY = this.cameras.main.scrollY;

    // 2. 플레이어 이동 및 상태 갱신
    this.player.move(this.inputVector.x, this.inputVector.y, dt);
    this.player.update(dt);

    // 시체 수명 갱신 (시체 폭발 연쇄용)
    for (let i = this.recentCorpses.length - 1; i >= 0; i--) {
      this.recentCorpses[i].time -= dt;
      if (this.recentCorpses[i].time <= 0) {
        this.recentCorpses.splice(i, 1);
      }
    }

    // 3. 몬스터 공간 해싱 그리드 재구성 (매 프레임 고속 재할당)
    this.spatialGrid.clear();
    for (const enemy of this.enemies) {
      if (enemy.active) {
        this.spatialGrid.insert(enemy);
      }
    }

    // 4. 자동 스킬 쿨타임 및 공격 발사
    this.updateSkillCooldowns(dt);

    // 5. 몬스터 이동, 피격, 밀어내기 업데이트
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      // 플레이어 또는 가장 가까운 소환수를 향해 이동
      enemy.update(dt, this.player.x, this.player.y, this.spatialGrid);

      // 플레이어와의 접촉 피격 판정 (Section 6.1)
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distSq = dx * dx + dy * dy;
      const touchRadius = 24 + enemy.radius;

      if (distSq <= touchRadius * touchRadius) {
        if (this.player.takeDamage(enemy.atk)) {
          this.handleGameOver();
          return;
        }
      }
    }

    // 6. 소환수 군단 AI 업데이트
    for (const minion of this.minions) {
      minion.updateAI(dt, this.spatialGrid, (caster, target) => {
        // 원거리 해골 궁수/마법사/드론 발사
        SoundEngine.getInstance().shoot();
        const stats = caster.getEffectiveStats();
        const p = new Projectile(
          this,
          'necro_spear',
          caster.x,
          caster.y,
          'straight',
          Math.round(stats.damageMul * 30),
          1,
          1.8,
          16,
          25,
          target.x - caster.x,
          target.y - caster.y,
          360
        );
        this.projectiles.push(p);
      });
    }

    // 7. 투사체 업데이트
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) {
        p.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      p.update(dt, this.spatialGrid);
    }

    // 8. 경험치 보석 업데이트 & 수집
    const pickupRad = this.player.getEffectiveStats().pickupRadius;
    for (let i = this.expGems.length - 1; i >= 0; i--) {
      const gem = this.expGems[i];
      if (!gem.active) {
        gem.destroy();
        this.expGems.splice(i, 1);
        continue;
      }

      const collected = gem.update(dt, this.player.x, this.player.y, pickupRad);
      if (collected) {
        SoundEngine.getInstance().gemPickup();
        this.earnedGold += gem.goldValue;
        const leveledUp = this.player.addExp(gem.expValue);
        if (leveledUp) {
          this.triggerLevelUp();
        }
      }
    }

    // 9. 웨이브 스포너 진행
    this.waveSpawner.update(dt, this.cameras.main);

    // 10. 진화 보물상자 접촉 판정
    if (this.evolutionChest && this.evolutionChest.active) {
      const cdx = this.evolutionChest.x - this.player.x;
      const cdy = this.evolutionChest.y - this.player.y;
      if (cdx * cdx + cdy * cdy <= 36 * 36) {
        this.triggerChestReward();
      }
    }
  }

  // 액티브 스킬 자동 발사 루프
  private updateSkillCooldowns(dt: number): void {
    const stats = this.player.getEffectiveStats();

    for (const [skillId, level] of this.player.activeSkills.entries()) {
      const skill = ALL_SKILLS_MAP.get(skillId);
      if (!skill || level <= 0) continue;

      let cd = this.player.skillCooldowns.get(skillId) ?? 0;
      cd -= dt;

      if (cd <= 0) {
        const lvData = skill.levels[Math.min(level - 1, skill.levels.length - 1)];
        // 쿨타임 재설정
        cd = (lvData?.cooldown ?? 2.0) * stats.cooldownMul;

        SkillExecutor.execute(
          this.player,
          skill,
          level,
          this,
          this.spatialGrid,
          this.projectiles,
          (minionId, count) => this.syncMinionCount(minionId, count)
        );
      }

      this.player.skillCooldowns.set(skillId, cd);
    }
  }

  // 군단 개체수 동기화
  public syncMinionCount(minionId: string, targetCount: number): void {
    const def = MINIONS_DATA[minionId] || MINIONS_DATA['skeleton_warrior'];
    const currentMatches = this.minions.filter((m) => m.def.id === minionId);

    if (currentMatches.length < targetCount) {
      const needed = targetCount - currentMatches.length;
      for (let i = 0; i < needed; i++) {
        const minion = new MinionUnit(
          this,
          def,
          this.player.x + (Math.random() * 40 - 20),
          this.player.y + (Math.random() * 40 - 20),
          this.minions.length,
          () => ({
            x: this.player.x,
            y: this.player.y,
            stats: this.player.getEffectiveStats(),
            facing: this.player.facingDir,
          })
        );
        this.minions.push(minion);
      }
    }
  }

  // 적 처치 시 보석/마력석 드랍 및 시체 저장, 상자 드랍
  public onEnemyKilled(enemy: Enemy): void {
    this.killCount++;
    this.showDamageText(enemy.x, enemy.y - 20, `💀 ${this.killCount}`, 0x00ffaa);

    // 시체 좌표 등록 (시체 폭발 연쇄 탄약)
    this.recentCorpses.push({ x: enemy.x, y: enemy.y, time: 20 });
    if (this.recentCorpses.length > 35) this.recentCorpses.shift();

    // 바닥 혈흔/뼈 잔해 연출 (depth: 2)
    const splat = this.add.circle(enemy.x, enemy.y, 8, 0x4a1218, 0.6).setDepth(2);
    this.tweens.add({
      targets: splat,
      alpha: 0,
      duration: 3500,
      onComplete: () => splat.destroy(),
    });

    // 보석 생성 및 300개 초과 시 병합 (Section 5.3)
    if (this.expGems.length > 250) {
      const nearestGem = this.expGems[0];
      if (nearestGem && nearestGem.active) {
        nearestGem.merge(enemy.expValue, enemy.goldValue);
      }
    } else {
      const gem = new ExpGem(this, enemy.x, enemy.y, enemy.expValue, enemy.goldValue);
      this.expGems.push(gem);
    }

    // 5웨이브 수문장 처치 시 각성 확정 보물상자 스폰
    if (enemy.isNamed) {
      this.spawnEvolutionChest(enemy.x, enemy.y);
      // 전체 자석 발동 (필드 모든 보석 흡수)
      for (const gem of this.expGems) {
        gem.forceAttractAll();
      }
    }

    // 6웨이브 최종 보스 처치 시 즉시 스테이지 클리어!
    if (enemy.isBoss) {
      this.handleStageClear();
    }
  }

  private spawnEvolutionChest(x: number, y: number): void {
    this.evolutionChest = this.add.sprite(x, y, 'gate_gold');
    this.evolutionChest.setDisplaySize(42, 42);
    this.evolutionChest.setDepth(22);

    // 보물상자 황금빛 펄스 애니메이션
    this.tweens.add({
      targets: this.evolutionChest,
      scale: 1.25,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });
  }

  private triggerChestReward(): void {
    if (!this.evolutionChest) return;
    this.evolutionChest.destroy();
    this.evolutionChest = null;

    SoundEngine.getInstance().chestOpen();

    // 각성 가능한 액티브 스킬 탐색 (Lv.5 만렙 + 짝꿍 패시브 보유)
    let candidateAwakened: SkillData | null = null;
    for (const awakened of AWAKENED_SKILLS) {
      if (!awakened.evolvesFrom || !awakened.requiredPassiveId) continue;
      const baseLv = this.player.activeSkills.get(awakened.evolvesFrom) ?? 0;
      const hasPartnerPassive = (this.player.passiveSkills.get(awakened.requiredPassiveId) ?? 0) > 0;

      if (baseLv >= 5 && hasPartnerPassive) {
        candidateAwakened = awakened;
        break;
      }
    }

    // 각성 조건이 맞으면 진화 스킬 지급, 아니면 대량 마력석(+2000 G) 및 치킨
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (candidateAwakened) {
      // 액티브 스킬 교체
      this.player.activeSkills.delete(candidateAwakened.evolvesFrom!);
      this.player.activeSkills.set(candidateAwakened.id, 1);
      this.player.skillCooldowns.set(candidateAwakened.id, 0);
      uiScene.showChestModal(candidateAwakened);
    } else {
      this.earnedGold += 2000;
      this.player.hp = this.player.maxHp;
      uiScene.showChestModal(null);
    }
  }

  // 레벨업 모달 트리러
  public triggerLevelUp(): void {
    SoundEngine.getInstance().levelUp();
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showLevelUpModal();
  }

  // 하단 수동 필살기 버튼 시전 (시체 폭발 또는 진 블리자드)
  public triggerManualUlt(): void {
    if (this.player.ultCooldown > 0) return;

    this.player.ultCooldown = this.player.ultMaxCooldown;
    const stats = this.player.getEffectiveStats();

    if (this.player.isJinBlizzard()) {
      // 각성 궁극기: ❄️ 진(眞) 블리자드 (화면 전체 4초 완전 빙결 + 혹한 얼음창 폭격 + 연쇄 폭발)
      this.cameras.main.shake(350, 0.025);
      this.cameras.main.flash(200, 80, 220, 255);
      SoundEngine.getInstance().playTone(960, 'sawtooth', 0.6, 0.35, 180);

      const blizzardDmg = Math.round(stats.damageMul * 480);
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        enemy.applyStatus('freeze', 4.0);
        enemy.takeDamage(blizzardDmg, 0, 0);
        this.showDamageText(enemy.x, enemy.y - 15, `❄️ ${blizzardDmg}`, 0x00f0ff);
      }

      // 화면 곳곳에 거대 얼음창 8개 낙하 VFX
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const ix = this.player.x + Math.cos(angle) * 160;
        const iy = this.player.y + Math.sin(angle) * 160;
        this.spawnIceSpearVFX(ix, iy);
      }

      // 사역마 및 필드 시체 동시 연쇄 폭발
      this.explodeAllMinions();
      this.explodeCorpsesChain();
    } else {
      // 기본 필살기: 💥 사령 시체 폭발 (사령 충격파 + 필드 시체 연쇄 + 소환수 자폭)
      this.cameras.main.shake(300, 0.02);
      this.cameras.main.flash(180, 220, 30, 40);
      SoundEngine.getInstance().corpseBurst();

      // 1. 사령군주 본체 중심 강력 암흑 충격파
      this.createNovaVFX(this.player.x, this.player.y, 250, 0xff2244);
      const novaEnemies = this.spatialGrid.queryRadius(this.player.x, this.player.y, 250);
      const novaDmg = Math.round(stats.damageMul * 320);
      for (const enemy of novaEnemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        enemy.takeDamage(novaDmg, (dx / dist) * 120, (dy / dist) * 120);
        this.showDamageText(enemy.x, enemy.y - 15, `💥 ${novaDmg}`, 0xff3344);
      }

      // 2. 필드 시체 연쇄 폭발
      this.explodeCorpsesChain();

      // 3. 소환수 자폭 돌격 폭발
      this.explodeAllMinions();
    }
  }

  // 필드 시체 연쇄 폭발 (최대 10구 순차 폭발)
  public explodeCorpsesChain(): void {
    const stats = this.player.getEffectiveStats();
    const burstDmg = Math.round(stats.damageMul * 260);

    const corpsesToExplode = this.recentCorpses
      .filter((c) => {
        const dx = c.x - this.player.x;
        const dy = c.y - this.player.y;
        return dx * dx + dy * dy <= 480 * 480;
      })
      .slice(0, 10);

    // 시체 소진
    this.recentCorpses = this.recentCorpses.filter((c) => !corpsesToExplode.includes(c));

    corpsesToExplode.forEach((corpse, idx) => {
      this.time.delayedCall(idx * 25, () => {
        SoundEngine.getInstance().playTone(180 + idx * 25, 'triangle', 0.2, 0.15);
        this.createNovaVFX(corpse.x, corpse.y, 160, 0xd42828);

        const hits = this.spatialGrid.queryRadius(corpse.x, corpse.y, 160);
        for (const enemy of hits) {
          if (!enemy.active) continue;
          const dx = enemy.x - corpse.x;
          const dy = enemy.y - corpse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          enemy.takeDamage(burstDmg, (dx / dist) * 80, (dy / dist) * 80);
          this.showDamageText(enemy.x, enemy.y - 15, `💥 ${burstDmg}`, 0xff5533);
        }
      });
    });
  }

  // 폭발 팽창 충격파 및 파편 비산 VFX
  public createNovaVFX(x: number, y: number, maxRadius: number, color: number): void {
    // 팽창 링 그래픽
    const ring = this.add.graphics().setDepth(24);
    ring.lineStyle(4, color, 0.9);
    ring.strokeCircle(x, y, 16);

    const core = this.add.circle(x, y, 24, color, 0.6).setDepth(24);

    this.tweens.add({
      targets: core,
      scale: maxRadius / 24,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => core.destroy(),
    });

    this.tweens.addCounter({
      from: 16,
      to: maxRadius,
      duration: 350,
      ease: 'Quad.easeOut',
      onUpdate: (tween) => {
        const curR = tween.getValue() || 16;
        ring.clear();
        ring.lineStyle(Math.max(1, 4 * (1 - curR / maxRadius)), color, 0.9 * (1 - curR / maxRadius));
        ring.strokeCircle(x, y, curR);
      },
      onComplete: () => ring.destroy(),
    });

    // 12개 비산 파편
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12 + Math.random() * 0.4;
      const dist = Phaser.Math.Between(maxRadius * 0.4, maxRadius);
      const spark = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.9).setDepth(25);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: Phaser.Math.Between(250, 400),
        ease: 'Cubic.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  // 혹한의 얼음창 투하 VFX
  private spawnIceSpearVFX(targetX: number, targetY: number): void {
    const spear = this.add.line(targetX, targetY - 140, 0, 0, 0, 48, 0x7acaff).setLineWidth(3).setDepth(26);
    this.tweens.add({
      targets: spear,
      y: targetY,
      duration: 180,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        spear.destroy();
        this.createNovaVFX(targetX, targetY, 120, 0x00f0ff);
      },
    });
  }

  private explodeAllMinions(): void {
    const stats = this.player.getEffectiveStats();
    const burstDmg = Math.round(stats.damageMul * 220);
    for (const minion of this.minions) {
      minion.triggerCorpseExplosion(burstDmg, this.spatialGrid);
    }
  }

  private onNamedSpawned(named: Enemy): void {
    SoundEngine.getInstance().bossWarning();
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showBossWarning(`⚠️ [수문장 네임드 강림] ${this.region.named}`);
  }

  private onBossSpawned(boss: Enemy): void {
    SoundEngine.getInstance().bossWarning();
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showBossWarning(`⚠️ [지역 최종 보스 출현] ${this.region.boss}`);
  }

  public handleStageClear(): void {
    SoundEngine.getInstance().victory();
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showResultModal(true);
  }

  public handleGameOver(): void {
    SoundEngine.getInstance().playTone(130, 'sawtooth', 0.5, 0.2, 50);
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showResultModal(false);
  }

  public showDamageText(x: number, y: number, text: string, color: number): void {
    const t = this.add.text(x, y, text, {
      fontFamily: 'NeoDunggeunmo, monospace',
      fontSize: '15px',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: t,
      y: y - 28,
      alpha: 0,
      duration: 600,
      onComplete: () => t.destroy(),
    });
  }
}
