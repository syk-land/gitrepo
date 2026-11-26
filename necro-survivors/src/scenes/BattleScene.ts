import Phaser from 'phaser';
import { EnemyProjectileSpec, RegionData, SkillData } from '../data/types';
import { REGIONS_DATA } from '../data/regionsData';
import { Player } from '../entities/Player';
import { MinionUnit } from '../entities/MinionUnit';
import { Enemy } from '../entities/Enemy';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { Projectile } from '../entities/Projectile';
import { ExpGem } from '../entities/ExpGem';
import { CursedShrine, FieldProp } from '../entities/FieldInteractable';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { WaveSpawner } from '../systems/WaveSpawner';
import { SkillExecutor } from '../systems/SkillExecutor';
import { LevelUpManager } from '../systems/LevelUpManager';
import { DamageTracker } from '../systems/DamageTracker';
import { SoundEngine } from '../core/SoundEngine';
import { SaveManager } from '../core/SaveManager';
import { MINIONS_DATA } from '../data/minionsData';
import { ALL_SKILLS_MAP, AWAKENED_SKILLS } from '../data/skillsData';
import { MAX_ENEMY_PROJECTILES } from '../data/enemyPatternsData';
import {
  CURSED_SHRINE_CONFIG,
  EXTRACTION_CONFIG,
  FEVER_CONFIG,
  FIELD_PROP_CONFIG,
  HITSTOP_CONFIG,
} from '../data/fieldEventsData';
import { UIScene } from './UIScene';

interface CorpseEntry {
  x: number;
  y: number;
  time: number;
  marker: Phaser.GameObjects.Arc;
}

interface PoisonZoneEntry {
  x: number;
  y: number;
  radius: number;
  timeLeft: number;
  tickTimer: number;
  visual: Phaser.GameObjects.Arc;
}

export class BattleScene extends Phaser.Scene {
  public regionId: number = 1;
  public region!: RegionData;
  public player!: Player;
  public minions: MinionUnit[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public enemyProjectiles: EnemyProjectile[] = [];
  public expGems: ExpGem[] = [];
  public fieldProps: FieldProp[] = [];
  public activeShrine: CursedShrine | null = null;
  public spatialGrid = new SpatialHashGrid<Enemy>(128);
  public waveSpawner!: WaveSpawner;
  public damageTracker = new DamageTracker();

  private tileBg!: Phaser.GameObjects.TileSprite;
  public isPaused: boolean = false;
  public killCount: number = 0;
  public feverKillProgress: number = 0;
  public earnedGold: number = 0;
  public recentCorpses: CorpseEntry[] = [];
  private poisonZones: PoisonZoneEntry[] = [];

  private fieldPropTimer: number = 22;
  private cursedShrineTimer: number = 75;
  private reactionVfxThisFrame: number = 0;
  private hitstopActive: boolean = false;
  public newlyUnlockedRelicId: string | null = null;

  public inputVector = { x: 0, y: 0 };

  public evolutionChest: Phaser.GameObjects.Sprite | null = null;
  public awakeningDrops: {
    sprite: Phaser.GameObjects.Sprite;
    label: Phaser.GameObjects.Text;
    x: number;
    y: number;
    active: boolean;
  }[] = [];
  public gameSpeed: number = 1.0;

  constructor() {
    super('BattleScene');
  }

  init(data: { regionId: number }): void {
    this.regionId = data.regionId || 1;
    this.region = REGIONS_DATA[this.regionId] || REGIONS_DATA[1];
    this.killCount = 0;
    this.feverKillProgress = 0;
    this.earnedGold = 0;
    this.isPaused = false;
    this.gameSpeed = 1.0;
    this.minions = [];
    this.enemies = [];
    this.projectiles = [];
    this.enemyProjectiles = [];
    this.expGems = [];
    this.fieldProps = [];
    this.activeShrine = null;
    this.recentCorpses = [];
    this.poisonZones = [];
    this.evolutionChest = null;
    this.awakeningDrops = [];
    this.fieldPropTimer = 22;
    this.cursedShrineTimer = 75;
    this.hitstopActive = false;
    this.newlyUnlockedRelicId = null;
    this.damageTracker.reset();
    LevelUpManager.resetRunState();
  }

  public setGameSpeed(speed: number): void {
    this.gameSpeed = speed;
    this.time.timeScale = speed;
    this.tweens.timeScale = speed;
  }

  public recordDamage(sourceId: string, amount: number): void {
    this.damageTracker.record(sourceId, amount);
  }

  public canSpawnReactionVfx(maxPerFrame: number): boolean {
    if (this.reactionVfxThisFrame >= maxPerFrame) return false;
    this.reactionVfxThisFrame++;
    return true;
  }

  public triggerHitstop(durationMs: number = HITSTOP_CONFIG.durationMs): void {
    if (this.hitstopActive || this.isPaused) return;
    this.hitstopActive = true;
    const prevSpeed = this.gameSpeed;
    this.time.timeScale = HITSTOP_CONFIG.timeScale;
    this.tweens.timeScale = HITSTOP_CONFIG.timeScale;
    window.setTimeout(() => {
      this.hitstopActive = false;
      if (this.scene && this.scene.isActive('BattleScene')) {
        this.time.timeScale = prevSpeed;
        this.tweens.timeScale = prevSpeed;
      }
    }, durationMs);
  }

  create(): void {
    this.setGameSpeed(1.0);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const textureKey = this.textures.exists(`battle_tile_${this.regionId}`)
      ? `battle_tile_${this.regionId}`
      : `battle_bg_${this.regionId}`;
    this.tileBg = this.add.tileSprite(width / 2, height / 2, width, height, textureKey);
    this.tileBg.setOrigin(0.5, 0.5);
    this.tileBg.setScrollFactor(0);
    this.tileBg.setDepth(0);

    this.player = new Player(this, 0, 0);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    this.syncNecroArmy();

    this.waveSpawner = new WaveSpawner(
      this,
      this.region,
      this.player,
      this.enemies,
      (named) => this.onNamedSpawned(named),
      (boss) => this.onBossSpawned(boss)
    );

    SoundEngine.getInstance().startBgm('battle');
  }

  public update(_time: number, delta: number): void {
    if (this.isPaused) return;
    this.reactionVfxThisFrame = 0;

    const rawDt = delta / 1000;
    const speedFactor = this.hitstopActive ? HITSTOP_CONFIG.timeScale : this.gameSpeed;
    const dt = Math.min(0.12, rawDt * speedFactor);

    this.tileBg.tilePositionX = this.cameras.main.scrollX;
    this.tileBg.tilePositionY = this.cameras.main.scrollY;

    this.player.move(this.inputVector.x, this.inputVector.y, dt);
    this.player.update(dt);

    // 시체 영혼 불꽃 수명 갱신
    for (let i = this.recentCorpses.length - 1; i >= 0; i--) {
      this.recentCorpses[i].time -= dt;
      if (this.recentCorpses[i].time <= 0) {
        this.recentCorpses[i].marker.destroy();
        this.recentCorpses.splice(i, 1);
      }
    }

    // 공간 해싱 그리드 재구성
    this.spatialGrid.clear();
    for (const enemy of this.enemies) {
      if (enemy.active) {
        this.spatialGrid.insert(enemy);
      }
    }

    // 1지역 보스 유물 대시 맹독 장판 갱신
    this.updatePoisonZones(dt);

    // 자동 스킬 발사
    this.updateSkillCooldowns(dt);

    // 몬스터 업데이트
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.active) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      let targetX = this.player.x;
      let targetY = this.player.y;
      let nearestMinion: MinionUnit | null = null;
      let minionDistSq = 110 * 110;

      for (const minion of this.minions) {
        if (!minion.isAlive()) continue;
        const mdx = minion.x - enemy.x;
        const mdy = minion.y - enemy.y;
        const dSq = mdx * mdx + mdy * mdy;
        if (dSq < minionDistSq) {
          minionDistSq = dSq;
          nearestMinion = minion;
        }
      }

      if (nearestMinion) {
        targetX = nearestMinion.x;
        targetY = nearestMinion.y;
      }

      enemy.update(dt, targetX, targetY, this.spatialGrid);

      if (enemy.freezeTimer > 0 || enemy.stunTimer > 0) {
        continue;
      }

      if (nearestMinion) {
        const mdx = nearestMinion.x - enemy.x;
        const mdy = nearestMinion.y - enemy.y;
        const mDistSq = mdx * mdx + mdy * mdy;
        const mTouchRadius = nearestMinion.def.bodyRadius + enemy.radius;
        if (mDistSq <= mTouchRadius * mTouchRadius) {
          nearestMinion.takeDamage(enemy.atk * dt * 2.0);
          if (nearestMinion.def.combatRole === 'melee_blocker') {
            const mDist = Math.sqrt(mDistSq) || 1;
            enemy.x -= (mdx / mDist) * 160 * dt;
            enemy.y -= (mdy / mDist) * 160 * dt;
            enemy.sprite.setPosition(enemy.x, enemy.y);
          }
        }
      }

      const pDx = this.player.x - enemy.x;
      const pDy = this.player.y - enemy.y;
      const distSq = pDx * pDx + pDy * pDy;
      const touchRadius = 24 + enemy.radius;

      if (distSq <= touchRadius * touchRadius) {
        const pDist = Math.sqrt(distSq) || 1;
        const dirX = pDx / pDist;
        const dirY = pDy / pDist;

        if (this.player.takeDamage(enemy.atk, dirX, dirY)) {
          this.handleGameOver();
          return;
        }

        if (enemy.freezeTimer <= 0) {
          enemy.x -= dirX * 16;
          enemy.y -= dirY * 16;
          enemy.sprite.setPosition(enemy.x, enemy.y);
        }

        this.cameras.main.shake(80, 0.004);
      }
    }

    // 적 투사체 업데이트 및 충돌 판정
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      if (!ep.active) {
        ep.destroy();
        this.enemyProjectiles.splice(i, 1);
        continue;
      }
      ep.update(dt);
      const pdx = this.player.x - ep.x;
      const pdy = this.player.y - ep.y;
      const hitR = 20 + ep.radius;
      if (pdx * pdx + pdy * pdy <= hitR * hitR) {
        ep.deactivate();
        const dist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        if (this.player.takeDamage(ep.damage, pdx / dist, pdy / dist)) {
          this.handleGameOver();
          return;
        }
        this.cameras.main.shake(70, 0.004);
      }
    }

    // 소환수 군단 업데이트 (임시 부활 소환수 만료 정리 포함)
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const minion = this.minions[i];
      if (minion.expired) {
        minion.destroy();
        this.minions.splice(i, 1);
        continue;
      }
      minion.updateAI(dt, this.spatialGrid, (caster, target) => {
        SoundEngine.getInstance().shoot();
        const stats = caster.getEffectiveStats();

        let texKey = 'vfx_minion_arrow';
        let projSpeed = 440;
        let projDmg = Math.round(stats.damageMul * 32);
        let pierce = 1;
        let knockback = 20;

        if (caster.def.id === 'skeleton_mage') {
          texKey = 'vfx_minion_mage';
          projSpeed = 320;
          projDmg = Math.round(stats.damageMul * 46);
          pierce = 2;
          knockback = 30;
        } else if (caster.def.id === 'drone') {
          texKey = 'vfx_minion_drone';
          const isAwakenedDrone = this.player.activeSkills.has('awakened_drone');
          const droneSkillLv = this.player.activeSkills.get('psi_drone') ?? 1;
          const droneCoeff = isAwakenedDrone
            ? 4.5
            : droneSkillLv >= 5 ? 2.6 : droneSkillLv >= 4 ? 2.0 : droneSkillLv >= 3 ? 1.6 : droneSkillLv >= 2 ? 1.3 : 1.0;
          projSpeed = isAwakenedDrone ? 600 : 520;
          projDmg = Math.round(stats.damageMul * 36 * droneCoeff);
          pierce = isAwakenedDrone ? 8 : droneSkillLv >= 5 ? 5 : droneSkillLv >= 4 ? 3 : 1;
          knockback = 20;
        }

        const p = new Projectile(
          this,
          texKey,
          caster.x,
          caster.y,
          'straight',
          projDmg,
          pierce,
          1.8,
          16,
          knockback,
          target.x - caster.x,
          target.y - caster.y,
          projSpeed
        );
        this.projectiles.push(p);
      });
    }

    // 아군 투사체 업데이트 (+ 파괴 오브젝트 충돌)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p.active) {
        p.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }
      p.update(dt, this.spatialGrid);
      if (this.isPaused) return;

      for (const prop of this.fieldProps) {
        if (!prop.active || prop.isBroken) continue;
        const dx = prop.x - p.x;
        const dy = prop.y - p.y;
        const r = prop.radius + p.hitboxRadius;
        if (dx * dx + dy * dy <= r * r) {
          prop.breakProp();
          SoundEngine.getInstance().playTone(320, 'square', 0.1, 0.15);
        }
      }
    }

    // 필드 파괴 오브젝트 & 저주 제단 갱신
    this.updateFieldEvents(dt);

    // 경험치 보석 업데이트 & 수집
    const effectiveStats = this.player.getEffectiveStats();
    const pickupRad = effectiveStats.pickupRadius;
    const goldMul = effectiveStats.goldMul;
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
        this.earnedGold += Math.round(gem.goldValue * goldMul);
        const leveledUp = this.player.addExp(gem.expValue);
        if (leveledUp) {
          this.triggerLevelUp();
          return;
        }
      }
    }

    // 웨이브 스포너 진행
    this.waveSpawner.update(dt, this.cameras.main);

    // 진화 보물상자 접촉 판정
    if (this.evolutionChest && this.evolutionChest.active) {
      const cdx = this.evolutionChest.x - this.player.x;
      const cdy = this.evolutionChest.y - this.player.y;
      if (cdx * cdx + cdy * cdy <= 36 * 36) {
        this.triggerChestReward();
        if (this.isPaused) return;
      }
    }

    // 각성재료 선택권 접촉 판정
    for (let i = this.awakeningDrops.length - 1; i >= 0; i--) {
      const drop = this.awakeningDrops[i];
      if (!drop.active) {
        drop.sprite.destroy();
        drop.label.destroy();
        this.awakeningDrops.splice(i, 1);
        continue;
      }
      const adx = drop.x - this.player.x;
      const ady = drop.y - this.player.y;
      if (adx * adx + ady * ady <= 38 * 38) {
        drop.active = false;
        drop.sprite.destroy();
        drop.label.destroy();
        this.awakeningDrops.splice(i, 1);
        this.triggerAwakeningSelectorReward();
        return;
      }
    }
  }

  public spawnEnemyProjectile(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    spec: EnemyProjectileSpec
  ): void {
    if (this.enemyProjectiles.length >= MAX_ENEMY_PROJECTILES) return;
    this.enemyProjectiles.push(new EnemyProjectile(this, x, y, dirX, dirY, spec));
  }

  public spawnExploderTelegraph(
    x: number,
    y: number,
    radius: number,
    damage: number,
    delaySec: number
  ): void {
    const warn = this.add.circle(x, y, 10, 0xff5500, 0.35).setStrokeStyle(2, 0xffaa00, 0.9).setDepth(14);
    this.tweens.add({
      targets: warn,
      radius,
      alpha: 0.6,
      duration: delaySec * 1000,
      onComplete: () => {
        warn.destroy();
        if (this.isPaused || !this.player?.isAlive()) return;
        this.createNovaVFX(x, y, radius, 0xff6600);
        const dx = this.player.x - x;
        const dy = this.player.y - y;
        if (dx * dx + dy * dy <= (radius + 16) * (radius + 16)) {
          const d = Math.sqrt(dx * dx + dy * dy) || 1;
          if (this.player.takeDamage(damage, dx / d, dy / d)) {
            this.handleGameOver();
          }
        }
      },
    });
  }

  public triggerBossAoeBlast(x: number, y: number, radius: number, damage: number): void {
    this.createNovaVFX(x, y, radius, 0xff2255);
    SoundEngine.getInstance().playTone(150, 'sawtooth', 0.22, 0.25);
    const dx = this.player.x - x;
    const dy = this.player.y - y;
    if (dx * dx + dy * dy <= (radius + 14) * (radius + 14)) {
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (this.player.takeDamage(damage, dx / d, dy / d)) {
        this.handleGameOver();
      }
      this.cameras.main.shake(120, 0.008);
    }
  }

  public showWaveBanner(msg: string): void {
    const uiScene = this.scene.get('UIScene') as UIScene;
    if (uiScene && typeof uiScene.showBossWarning === 'function') {
      uiScene.showBossWarning(msg);
    }
  }

  public triggerPlayerDash(): void {
    this.player.triggerDash(this.inputVector.x, this.inputVector.y);
  }

  public spawnDashPoisonZone(x: number, y: number): void {
    const visual = this.add.circle(x, y, 68, 0x33dd66, 0.24).setStrokeStyle(2, 0x55ff88, 0.7).setDepth(8);
    this.poisonZones.push({
      x,
      y,
      radius: 68,
      timeLeft: 3.0,
      tickTimer: 0,
      visual,
    });
  }

  private updatePoisonZones(dt: number): void {
    for (let i = this.poisonZones.length - 1; i >= 0; i--) {
      const z = this.poisonZones[i];
      z.timeLeft -= dt;
      z.tickTimer -= dt;
      if (z.timeLeft <= 0) {
        z.visual.destroy();
        this.poisonZones.splice(i, 1);
        continue;
      }
      if (z.tickTimer <= 0) {
        z.tickTimer = 0.45;
        const dmg = Math.round(this.player.getEffectiveStats().damageMul * 22);
        const hits = this.spatialGrid.queryRadius(z.x, z.y, z.radius);
        for (const enemy of hits) {
          if (!enemy.active) continue;
          enemy.applyStatus('slow', 1.2, 0.35);
          enemy.takeDamage(dmg, 0, 0, 'relic_poison');
        }
      }
    }
  }

  private updateFieldEvents(dt: number): void {
    // 1. 파괴 오브젝트 주기적 스폰
    this.fieldPropTimer -= dt;
    if (this.fieldPropTimer <= 0) {
      this.fieldPropTimer = FIELD_PROP_CONFIG.spawnIntervalSec;
      const aliveProps = this.fieldProps.filter((p) => p.active).length;
      if (aliveProps < FIELD_PROP_CONFIG.maxActiveProps) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 240 + Math.random() * 140;
        this.fieldProps.push(
          new FieldProp(this, this.player.x + Math.cos(angle) * dist, this.player.y + Math.sin(angle) * dist)
        );
      }
    }

    for (let i = this.fieldProps.length - 1; i >= 0; i--) {
      const prop = this.fieldProps[i];
      if (!prop.active) {
        prop.destroy();
        this.fieldProps.splice(i, 1);
        continue;
      }
      prop.update(dt);

      const dx = prop.x - this.player.x;
      const dy = prop.y - this.player.y;
      if (dx * dx + dy * dy <= 34 * 34) {
        if (!prop.isBroken) {
          prop.breakProp();
        } else {
          this.collectFieldDrop(prop);
          prop.destroy();
          this.fieldProps.splice(i, 1);
        }
      }
    }

    // 2. 점령형 저주 제단 스폰 & 진행
    if (!this.activeShrine) {
      this.cursedShrineTimer -= dt;
      if (this.cursedShrineTimer <= 0) {
        this.cursedShrineTimer = CURSED_SHRINE_CONFIG.spawnIntervalSec;
        const angle = Math.random() * Math.PI * 2;
        const dist = 300;
        this.activeShrine = new CursedShrine(
          this,
          this.player.x + Math.cos(angle) * dist,
          this.player.y + Math.sin(angle) * dist
        );
        this.showWaveBanner('⛩️ 저주받은 제단 출현! 5초간 점령하면 강력한 버프를 획득합니다.');
      }
    } else {
      const fastCapture = SaveManager.getInstance().hasEquippedRelicEffect('fast_shrine_capture');
      const completed = this.activeShrine.update(dt, this.player.x, this.player.y, fastCapture ? 1.4 : 1.0);
      if (completed) {
        this.player.runDamageBonus += CURSED_SHRINE_CONFIG.runDamageBonusPerShrine;
        this.earnedGold += Math.round(250 * this.player.getEffectiveStats().goldMul);
        SoundEngine.getInstance().chestOpen();
        this.createNovaVFX(this.activeShrine.x, this.activeShrine.y, 160, 0x00ffaa);
        this.showDamageText(this.player.x, this.player.y - 36, '⛩️ 제단 점령! 공격력 +15%', 0x00ffaa, true);
        this.activeShrine.destroy();
        this.activeShrine = null;
      }
    }
  }

  private collectFieldDrop(prop: FieldProp): void {
    const stats = this.player.getEffectiveStats();
    SoundEngine.getInstance().gemPickup();
    if (prop.dropType === 'meat') {
      const heal = Math.round(stats.maxHp * FIELD_PROP_CONFIG.meatHealRatio);
      this.player.hp = Math.min(stats.maxHp, this.player.hp + heal);
      this.showDamageText(this.player.x, this.player.y - 30, `🍖 +${heal} HP`, 0x00ff88, true);
    } else if (prop.dropType === 'magnet') {
      for (const gem of this.expGems) gem.forceAttractAll();
      this.showDamageText(this.player.x, this.player.y - 30, '🧲 전체 보석 흡인!', 0x33ccff, true);
    } else if (prop.dropType === 'bomb') {
      this.cameras.main.flash(180, 255, 180, 60);
      this.triggerHitstop();
      for (const enemy of this.enemies) {
        if (enemy.active && !enemy.isBoss && !enemy.isNamed) {
          enemy.takeDamage(enemy.hp + 999, 0, 0, 'corpse_explosion');
        }
      }
      this.showDamageText(this.player.x, this.player.y - 30, '💣 영혼 폭탄 폭발!', 0xffaa00, true);
    } else {
      const bonus = Math.round((FIELD_PROP_CONFIG.goldBonusBase + this.regionId * 30) * stats.goldMul);
      this.earnedGold += bonus;
      this.showDamageText(this.player.x, this.player.y - 30, `💰 +${bonus} G`, 0xffd700, true);
    }
  }

  private updateSkillCooldowns(dt: number): void {
    const stats = this.player.getEffectiveStats();

    for (const [skillId, level] of this.player.activeSkills.entries()) {
      const skill = ALL_SKILLS_MAP.get(skillId);
      if (!skill || level <= 0) continue;

      let cd = this.player.skillCooldowns.get(skillId) ?? 0;
      cd -= dt;

      if (cd <= 0) {
        const lvData = skill.levels[Math.min(level - 1, skill.levels.length - 1)];
        cd = (lvData?.cooldown ?? 2.0) * stats.cooldownMul;

        SkillExecutor.execute(
          this.player,
          skill,
          level,
          this,
          this.spatialGrid,
          this.projectiles,
          () => this.syncNecroArmy()
        );
      }

      this.player.skillCooldowns.set(skillId, cd);
    }
  }

  public syncNecroArmy(): void {
    const legionLv = this.player.activeSkills.get('necro_legion') ?? 0;
    const hasArthur = this.player.activeSkills.has('awakened_legion');
    const droneLv =
      (this.player.activeSkills.get('psi_drone') ?? 0) ||
      (this.player.activeSkills.has('awakened_drone') ? 1 : 0);
    const stats = this.player.getEffectiveStats();
    const hasStartSkeleton = SaveManager.getInstance().hasEquippedRelicEffect('start_skeleton');

    const countBonusRate = Math.max(0, (stats.minionCountMul ?? 1.0) - 1.0);
    const flatBonus = stats.bonusMinionCount || 0;

    let baseWarriors = hasStartSkeleton ? 1 : 0;
    let baseArchers = 0;
    let baseMages = 0;
    const arthurs = hasArthur ? 1 : 0;
    let baseDrones = 0;

    if (this.player.activeSkills.has('awakened_drone')) baseDrones = 5;
    else if (droneLv >= 5) baseDrones = 3;
    else if (droneLv >= 3) baseDrones = 2;
    else if (droneLv >= 1) baseDrones = 1;

    if (hasArthur) {
      baseWarriors += 3;
      baseArchers = 2;
      baseMages = 1;
    } else if (legionLv > 0) {
      if (legionLv >= 5) {
        baseWarriors += 4;
        baseArchers = 1;
        baseMages = 1;
      } else if (legionLv >= 4) {
        baseWarriors += 3;
        baseArchers = 1;
        baseMages = 1;
      } else if (legionLv >= 3) {
        baseWarriors += 3;
        baseArchers = 1;
      } else if (legionLv >= 2) {
        baseWarriors += 2;
        baseArchers = 1;
      } else {
        baseWarriors += 2;
      }
    }

    let warriors = 0;
    let archers = 0;
    let mages = 0;
    let drones = 0;

    if (baseWarriors > 0) {
      warriors = Math.max(1, Math.round(baseWarriors * (1 + countBonusRate))) + flatBonus;
    }
    if (baseArchers > 0) {
      archers = Math.max(1, Math.round(baseArchers * (1 + countBonusRate)));
    }
    if (baseMages > 0) {
      mages = Math.max(1, Math.round(baseMages * (1 + countBonusRate)));
    }
    if (baseDrones > 0) {
      drones = Math.max(1, Math.round(baseDrones * (1 + countBonusRate)));
    }

    this.ensureMinionCount('skeleton_warrior', warriors);
    this.ensureMinionCount('skeleton_archer', archers);
    this.ensureMinionCount('skeleton_mage', mages);
    if (arthurs > 0) this.ensureMinionCount('arthur', arthurs);
    if (drones > 0) this.ensureMinionCount('drone', drones);
  }

  public ensureMinionCount(minionId: string, targetCount: number): void {
    const def = MINIONS_DATA[minionId] || MINIONS_DATA['skeleton_warrior'];
    const currentMatches = this.minions.filter((m) => !m.isTemporary && m.def.id === minionId);

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

  private tryExtractEliteUndead(enemy: Enemy, x: number, y: number): void {
    const currentTemp = this.minions.filter((m) => m.isTemporary && !m.expired).length;
    if (currentTemp >= EXTRACTION_CONFIG.maxTempMinions) return;

    const hasNecro =
      this.player.activeSkills.has('necro_legion') ||
      this.player.activeSkills.has('necro_lich_curse') ||
      this.player.activeSkills.has('awakened_legion');
    const chance = hasNecro ? EXTRACTION_CONFIG.necroBranchChance : EXTRACTION_CONFIG.baseChance;
    if (Math.random() > chance) return;

    const baseDef = MINIONS_DATA['skeleton_warrior'];
    const extracted = new MinionUnit(
      this,
      baseDef,
      x,
      y,
      this.minions.length,
      () => ({
        x: this.player.x,
        y: this.player.y,
        stats: this.player.getEffectiveStats(),
        facing: this.player.facingDir,
      }),
      {
        textureKey: enemy.textureKey,
        lifeSeconds: EXTRACTION_CONFIG.lifetimeSec,
        hpBonusMul: 1.6,
      }
    );
    this.minions.push(extracted);
    this.createNovaVFX(x, y, 80, 0x44ffcc);
    this.showDamageText(x, y - 28, '💀 사령 추출 성공!', 0x44ffcc, true);
  }

  private hasEvolvableSkill(): boolean {
    for (const awakened of AWAKENED_SKILLS) {
      if (!awakened.evolvesFrom || !awakened.requiredPassiveId) continue;
      if (this.player.activeSkills.has(awakened.id)) continue;
      const baseLv = this.player.activeSkills.get(awakened.evolvesFrom) ?? 0;
      const boneStormLv =
        awakened.id === 'awakened_spear' ? (this.player.activeSkills.get('necro_bone_storm') ?? 0) : 0;
      const hasPartnerPassive = (this.player.passiveSkills.get(awakened.requiredPassiveId) ?? 0) > 0;
      if (hasPartnerPassive && (baseLv >= 5 || boneStormLv >= 5)) {
        return true;
      }
    }
    return false;
  }

  public onEnemyKilled(enemy: Enemy): void {
    this.killCount++;
    this.feverKillProgress++;
    if (this.feverKillProgress >= FEVER_CONFIG.killsRequired) {
      this.feverKillProgress = 0;
      this.player.feverTimer = FEVER_CONFIG.durationSec;
      SoundEngine.getInstance().playTone(880, 'triangle', 0.25, 0.25, 440);
      this.showDamageText(this.player.x, this.player.y - 38, '🔥 영혼 수확 피버! (10초)', 0xffd000, true);
    }

    const dropX = enemy.sprite.x;
    const dropY = enemy.sprite.y;

    // 흡혈 패시브
    const vampLv = this.player.passiveSkills.get('pas_blood_vamp') ?? 0;
    if (vampLv > 0) {
      const heal = vampLv >= 5 ? 6 : vampLv;
      const effectiveMaxHp = this.player.getEffectiveStats().maxHp;
      if (this.player.hp < effectiveMaxHp) {
        this.player.hp = Math.min(effectiveMaxHp, this.player.hp + heal);
        if (Math.random() < 0.25) {
          this.showDamageText(this.player.x, this.player.y - 25, `+${heal} HP`, 0x00ff88);
        }
      }
    }

    if (enemy.isBoss || enemy.isNamed || this.killCount % 10 === 0) {
      this.showDamageText(dropX, dropY - 20, `💀 ${this.killCount}`, 0x00ffaa, true);
    }

    // 시체 영혼 불꽃 마커 등록 (최대 35개)
    const soulMarker = this.add.circle(dropX, dropY, 7, 0x00ffaa, 0.45).setDepth(3);
    this.recentCorpses.push({ x: dropX, y: dropY, time: 20, marker: soulMarker });
    if (this.recentCorpses.length > 35) {
      const oldest = this.recentCorpses.shift();
      oldest?.marker.destroy();
    }

    const gem = new ExpGem(this, dropX, dropY, enemy.expValue, enemy.goldValue);
    this.expGems.push(gem);

    if (this.expGems.length > 300) {
      for (let i = 0; i < 40; i++) {
        const oldGem = this.expGems[i];
        if (oldGem && oldGem.active && oldGem.lifeTimer < 20.0) {
          oldGem.destroy();
          oldGem.active = false;
        }
      }
    }

    if (enemy.isElite || enemy.isNamed || enemy.isBoss) {
      this.triggerHitstop();
    }

    // 정예 처치: 사령 추출 + 3웨이브 이후 각성 가능 시 진화 보물상자 우선 드랍
    if (enemy.isElite) {
      this.tryExtractEliteUndead(enemy, dropX, dropY);
      if (this.waveSpawner.currentWave >= 3 && !this.evolutionChest && this.hasEvolvableSkill()) {
        this.spawnEvolutionChest(dropX, dropY);
      } else {
        this.spawnAwakeningSelectorDrop(dropX, dropY);
      }
    } else if (enemy.isNamed) {
      this.spawnAwakeningSelectorDrop(dropX - 24, dropY);
      this.spawnEvolutionChest(dropX + 24, dropY);
      for (const g of this.expGems) g.forceAttractAll();
    } else if (enemy.isBoss) {
      this.handleStageClear();
    }
  }

  public spawnAwakeningSelectorDrop(x: number, y: number): void {
    const sprite = this.add.sprite(x, y, 'item_parchment');
    sprite.setDisplaySize(38, 38);
    sprite.setDepth(21);

    const label = this.add
      .text(x, y - 24, '📜 각성 비급 양피지', {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '11px',
        color: '#ffd000',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.tweens.add({
      targets: [sprite, label],
      y: '-=6',
      yoyo: true,
      repeat: -1,
      duration: 650,
      ease: 'Sine.easeInOut',
    });

    this.awakeningDrops.push({ sprite, label, x, y, active: true });
  }

  public triggerAwakeningSelectorReward(): void {
    SoundEngine.getInstance().playTone(660, 'sine', 0.25, 0.3, 100);
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showAwakeningSelectorModal();
  }

  private spawnEvolutionChest(x: number, y: number): void {
    if (this.evolutionChest && this.evolutionChest.active) return;
    const chestKey = this.textures.exists('item_evolution_chest') ? 'item_evolution_chest' : 'gate_gold';
    this.evolutionChest = this.add.sprite(x, y, chestKey);
    this.evolutionChest.setDisplaySize(44, 44);
    this.evolutionChest.setDepth(22);

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

    let candidateAwakened: SkillData | null = null;
    let evolvedBaseId: string | null = null;
    for (const awakened of AWAKENED_SKILLS) {
      if (!awakened.evolvesFrom || !awakened.requiredPassiveId) continue;
      if (this.player.activeSkills.has(awakened.id)) continue;
      const baseLv = this.player.activeSkills.get(awakened.evolvesFrom) ?? 0;
      const boneStormLv =
        awakened.id === 'awakened_spear' ? (this.player.activeSkills.get('necro_bone_storm') ?? 0) : 0;
      const hasPartnerPassive = (this.player.passiveSkills.get(awakened.requiredPassiveId) ?? 0) > 0;

      if (hasPartnerPassive && (baseLv >= 5 || boneStormLv >= 5)) {
        candidateAwakened = awakened;
        evolvedBaseId = baseLv >= 5 ? awakened.evolvesFrom : 'necro_bone_storm';
        break;
      }
    }

    const uiScene = this.scene.get('UIScene') as UIScene;
    if (candidateAwakened && evolvedBaseId) {
      this.player.activeSkills.delete(evolvedBaseId);
      this.player.activeSkills.set(candidateAwakened.id, 1);
      this.player.skillCooldowns.set(candidateAwakened.id, 0);
      this.syncNecroArmy();
      uiScene.showChestModal(candidateAwakened);
    } else {
      const chestStats = this.player.getEffectiveStats();
      this.earnedGold += Math.round(2000 * chestStats.goldMul);
      const maxHp = chestStats.maxHp;
      this.player.maxHp = maxHp;
      this.player.hp = maxHp;
      uiScene.showChestModal(null);
    }
  }

  public triggerLevelUp(): void {
    SoundEngine.getInstance().levelUp();
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showLevelUpModal();
  }

  public triggerManualUlt(): void {
    if (this.player.ultCooldown > 0) return;

    this.player.ultCooldown = this.player.ultMaxCooldown;
    const stats = this.player.getEffectiveStats();
    this.triggerHitstop(45);

    if (this.player.isJinBlizzard()) {
      this.cameras.main.shake(350, 0.025);
      this.cameras.main.flash(200, 80, 220, 255);
      SoundEngine.getInstance().playTone(960, 'sawtooth', 0.6, 0.35, 180);

      const blizzardDmg = Math.round(stats.damageMul * 480);
      for (const enemy of this.enemies) {
        if (!enemy.active) continue;
        enemy.applyStatus('freeze', 4.0);
        enemy.takeDamage(blizzardDmg, 0, 0, 'jin_blizzard');
        this.showDamageText(enemy.x, enemy.y - 15, `✨ ${blizzardDmg}`, 0x00f0ff);
      }

      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const ix = this.player.x + Math.cos(angle) * 160;
        const iy = this.player.y + Math.sin(angle) * 160;
        this.spawnIceSpearVFX(ix, iy);
      }

      this.explodeAllMinions();
      this.explodeCorpsesChain();
    } else {
      this.cameras.main.shake(300, 0.02);
      this.cameras.main.flash(180, 220, 30, 40);
      SoundEngine.getInstance().corpseBurst();

      this.createNovaVFX(this.player.x, this.player.y, 250, 0xff2244);
      const novaEnemies = this.spatialGrid.queryRadius(this.player.x, this.player.y, 250);
      const novaDmg = Math.round(stats.damageMul * 320);
      for (const enemy of novaEnemies) {
        if (!enemy.active) continue;
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        enemy.takeDamage(novaDmg, (dx / dist) * 120, (dy / dist) * 120, 'corpse_explosion');
        this.showDamageText(enemy.x, enemy.y - 15, `💥 ${novaDmg}`, 0xff3344);
      }

      this.explodeCorpsesChain();
      this.explodeAllMinions();
    }
  }

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

    this.recentCorpses = this.recentCorpses.filter((c) => !corpsesToExplode.includes(c));

    corpsesToExplode.forEach((corpse, idx) => {
      corpse.marker.destroy();
      this.time.delayedCall(idx * 25, () => {
        SoundEngine.getInstance().playTone(180 + idx * 25, 'triangle', 0.2, 0.15);
        this.createNovaVFX(corpse.x, corpse.y, 160, 0xd42828);

        const hits = this.spatialGrid.queryRadius(corpse.x, corpse.y, 160);
        for (const enemy of hits) {
          if (!enemy.active) continue;
          const dx = enemy.x - corpse.x;
          const dy = enemy.y - corpse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          enemy.takeDamage(burstDmg, (dx / dist) * 80, (dy / dist) * 80, 'corpse_explosion');
          this.showDamageText(enemy.x, enemy.y - 15, `💥 ${burstDmg}`, 0xff5533);
        }
      });
    });
  }

  public createNovaVFX(x: number, y: number, maxRadius: number, color: number): void {
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

  private onNamedSpawned(_named: Enemy): void {
    SoundEngine.getInstance().bossWarning();
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showBossWarning(`⚠️ [수문장 네임드 강림] ${this.region.named}`);
  }

  private onBossSpawned(_boss: Enemy): void {
    SoundEngine.getInstance().bossWarning();
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showBossWarning(`⚠️ [지역 최종 보스 출현] ${this.region.boss}`);
  }

  public startEndlessMode(): void {
    this.waveSpawner.enableEndlessMode();
    this.isPaused = false;
    this.showWaveBanner('♾️ 심연 무한 모드 돌입! 60초마다 괴수가 급격히 강해집니다!');
  }

  public handleStageClear(): void {
    const stars = this.player.tookDamageDuringBoss ? 1 : 2;
    this.newlyUnlockedRelicId = SaveManager.getInstance().markRegionCleared(this.regionId, stars);
    SoundEngine.getInstance().victory();
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showResultModal(true);
  }

  public handleGameOver(): void {
    if (this.waveSpawner.isEndless) {
      SaveManager.getInstance().recordEndlessTime(this.regionId, this.waveSpawner.elapsedTime);
    }
    SoundEngine.getInstance().playTone(130, 'sawtooth', 0.5, 0.2, 50);
    this.isPaused = true;
    const uiScene = this.scene.get('UIScene') as UIScene;
    uiScene.showResultModal(false);
  }

  private activeDamageTextCount: number = 0;

  public showDamageText(x: number, y: number, text: string, color: number, isCrit: boolean = false): void {
    if (this.activeDamageTextCount >= 32 && !isCrit) {
      return;
    }
    this.activeDamageTextCount++;

    const t = this.add
      .text(x, y, text, {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: isCrit ? '17px' : '14px',
        color: '#' + color.toString(16).padStart(6, '0'),
        fontStyle: isCrit ? 'bold' : 'normal',
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.tweens.add({
      targets: t,
      y: y - (isCrit ? 36 : 24),
      alpha: 0,
      duration: isCrit ? 650 : 450,
      onComplete: () => {
        t.destroy();
        this.activeDamageTextCount--;
      },
    });
  }
}
