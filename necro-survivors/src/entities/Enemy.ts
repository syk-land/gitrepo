import Phaser from 'phaser';
import { SpatialEntity, SpatialHashGrid } from '../core/SpatialHashGrid';
import { BossPatternId, EnemyBehaviorType, EnemyProjectileSpec } from '../data/types';
import { BOSS_PATTERN_CONFIG, ENEMY_ARCHETYPE_CONFIG } from '../data/enemyPatternsData';

interface AoeTargetZone {
  x: number;
  y: number;
  radius: number;
}

export class Enemy implements SpatialEntity {
  public x: number;
  public y: number;
  public radius: number;
  public hp: number;
  public maxHp: number;
  public atk: number;
  public speed: number;
  public expValue: number;
  public goldValue: number;
  public isNamed: boolean;
  public isBoss: boolean;
  public isElite: boolean;
  public behaviorType: EnemyBehaviorType;
  public readonly textureKey: string;
  public active: boolean = true;

  public sprite: Phaser.GameObjects.Sprite;
  private shadowArc: Phaser.GameObjects.Ellipse;
  private hpBarGraphics?: Phaser.GameObjects.Graphics;
  private telegraphGraphics?: Phaser.GameObjects.Graphics;
  private flashTimer: number = 0;
  private walkAnimTimer: number = Math.random() * Math.PI * 2;

  // 상태이상 타이머
  public freezeTimer: number = 0;
  public slowTimer: number = 0;
  public slowRatio: number = 0;
  public stunTimer: number = 0;
  public bleedTimer: number = 0;
  public bleedDps: number = 0;
  public bleedTickTimer: number = 0;
  public shockTimer: number = 0;
  public shockAmp: number = 0;
  public burnTimer: number = 0;
  public burnDps: number = 0;
  public burnTickTimer: number = 0;
  public curseTimer: number = 0;
  public reactionCd: number = 0;

  // 일반 아키타입 AI 상태 (charger / ranged)
  private aiCooldown: number = 1.2 + Math.random() * 1.2;
  private chargeState: 'idle' | 'telegraph' | 'dash' = 'idle';
  private chargeTimer: number = 0;
  private chargeDirX: number = 0;
  private chargeDirY: number = 0;

  // 네임드/보스 패턴 FSM
  private bossPatternCd: number = 3.5;
  private bossPatternIndex: number = 0;
  private activeBossPattern: BossPatternId | null = null;
  private bossPhaseState: 'idle' | 'telegraph' | 'execute' = 'idle';
  private bossStateTimer: number = 0;
  private bossDashDirX: number = 0;
  private bossDashDirY: number = 0;
  private bossAoeZones: AoeTargetZone[] = [];
  private bossPhase2Triggered: boolean = false;

  public iceGraphics?: Phaser.GameObjects.Graphics;
  public onKilled?: (enemy: Enemy) => void;
  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    x: number,
    y: number,
    hp: number,
    atk: number,
    speed: number,
    radius: number,
    exp: number,
    gold: number,
    isNamed: boolean = false,
    isBoss: boolean = false,
    isElite: boolean = false,
    onKilled?: (enemy: Enemy) => void,
    behaviorType: EnemyBehaviorType = 'chaser'
  ) {
    this.scene = scene;
    this.textureKey = textureKey;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.hp = hp;
    this.maxHp = hp;
    this.atk = atk;
    this.behaviorType = isNamed || isBoss ? 'chaser' : behaviorType;
    const archMul = isNamed || isBoss ? 1.0 : ENEMY_ARCHETYPE_CONFIG[this.behaviorType].speedMul;
    this.speed = speed * archMul;
    this.expValue = exp;
    this.goldValue = gold;
    this.isNamed = isNamed;
    this.isBoss = isBoss;
    this.isElite = isElite;
    this.onKilled = onKilled;

    const shadowW = isBoss ? 60 : isNamed ? 40 : isElite ? 34 : 26;
    const shadowH = isBoss ? 20 : isNamed ? 13 : isElite ? 11 : 9;
    this.shadowArc = scene.add
      .ellipse(x, y + (isBoss ? 38 : isNamed ? 25 : isElite ? 20 : 16), shadowW, shadowH, 0x000000, 0.42)
      .setDepth(13);

    this.sprite = scene.add.sprite(x, y, textureKey);
    if (isBoss) {
      this.sprite.setDisplaySize(96, 96);
    } else if (isNamed) {
      this.sprite.setDisplaySize(64, 64);
    } else if (isElite) {
      this.sprite.setDisplaySize(52, 52);
      this.sprite.setTint(0xffd700);
    } else {
      this.sprite.setDisplaySize(40, 40);
    }
    this.sprite.setDepth(15);

    this.iceGraphics = scene.add.graphics();
    this.iceGraphics.setDepth(17);

    if (isElite || isNamed || isBoss) {
      this.hpBarGraphics = scene.add.graphics();
      this.hpBarGraphics.setDepth(16);
    }

    if (isNamed || isBoss) {
      this.telegraphGraphics = scene.add.graphics();
      this.telegraphGraphics.setDepth(12);
    }
  }

  public takeDamage(
    amount: number,
    knockbackDx: number = 0,
    knockbackDy: number = 0,
    sourceId?: string
  ): boolean {
    if (!this.active || this.hp <= 0) return false;

    const cam = this.scene.cameras?.main;
    if (cam) {
      const midX = cam.midPoint.x;
      const midY = cam.midPoint.y;
      const maxDx = cam.width * 0.6;
      const maxDy = cam.height * 0.6;
      if (Math.abs(this.x - midX) > maxDx || Math.abs(this.y - midY) > maxDy) {
        return false;
      }
    }

    const shockMul = this.shockTimer > 0 ? 1 + this.shockAmp : 1;
    const curseMul = this.curseTimer > 0 ? 1.15 : 1;
    const effectiveAmount = Math.max(1, Math.round(amount * shockMul * curseMul));
    const appliedDamage = Math.min(this.hp, effectiveAmount);
    this.hp -= effectiveAmount;

    if (sourceId && typeof (this.scene as any).recordDamage === 'function') {
      (this.scene as any).recordDamage(sourceId, appliedDamage);
    }

    if (this.freezeTimer <= 0 && (knockbackDx !== 0 || knockbackDy !== 0)) {
      const bossKnockbackResist = this.isBoss ? 0.15 : this.isNamed ? 0.4 : this.isElite ? 0.5 : 1.0;
      this.x += knockbackDx * bossKnockbackResist;
      this.y += knockbackDy * bossKnockbackResist;
      this.sprite.setPosition(this.x, this.y);
    }

    if (this.freezeTimer > 0) {
      this.sprite.setTint(0x88ffff);
    } else if (this.stunTimer > 0) {
      this.sprite.setTint(0xffea60);
    } else {
      this.sprite.setTintFill(0xffffff);
    }
    this.flashTimer = 0.06;

    if (this.hp <= 0) {
      this.handleDeath();
      return true;
    }
    return false;
  }

  private handleDeath(): void {
    this.hp = 0;
    this.active = false;
    this.sprite.setVisible(false);
    this.shadowArc.setVisible(false);
    if (this.hpBarGraphics) {
      this.hpBarGraphics.clear();
      this.hpBarGraphics.destroy();
      this.hpBarGraphics = undefined;
    }
    if (this.iceGraphics) {
      this.iceGraphics.clear();
      this.iceGraphics.destroy();
      this.iceGraphics = undefined;
    }
    if (this.telegraphGraphics) {
      this.telegraphGraphics.clear();
      this.telegraphGraphics.destroy();
      this.telegraphGraphics = undefined;
    }

    // 자폭형 몬스터(exploder) 사망 시 지연 자폭 예고
    if (this.behaviorType === 'exploder' && !this.isBoss && !this.isNamed) {
      const cfg = ENEMY_ARCHETYPE_CONFIG.exploder;
      if (typeof (this.scene as any).spawnExploderTelegraph === 'function') {
        (this.scene as any).spawnExploderTelegraph(
          this.x,
          this.y,
          cfg.explodeRadius,
          Math.round(this.atk * cfg.explodeDamageMul),
          cfg.explodeDelay
        );
      }
    }

    if (this.onKilled) {
      this.onKilled(this);
    }
  }

  public applyStatus(
    type: 'slow' | 'freeze' | 'stun' | 'bleed' | 'pull' | 'shock' | 'burn' | 'curse',
    duration: number,
    value: number = 0.4
  ): void {
    if (!this.active) return;
    if (type === 'freeze') {
      const wasFrozen = this.freezeTimer > 0;
      const effectiveDur = this.isBoss ? duration * 0.4 : this.isNamed ? duration * 0.6 : duration;
      this.freezeTimer = Math.max(this.freezeTimer, effectiveDur);
      this.sprite.setTint(0x00f0ff);
      if (!wasFrozen && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '❄️ 빙결!', 0x00f0ff, true);
      }
    } else if (type === 'slow') {
      this.slowTimer = Math.max(this.slowTimer, duration);
      this.slowRatio = Math.max(this.slowRatio, value);
      if (this.freezeTimer <= 0 && this.stunTimer <= 0) {
        this.sprite.setTint(0x3388ff);
      }
    } else if (type === 'stun') {
      const wasStunned = this.stunTimer > 0;
      const effectiveDur = this.isBoss ? duration * 0.35 : this.isNamed ? duration * 0.55 : duration;
      this.stunTimer = Math.max(this.stunTimer, effectiveDur);
      this.sprite.setTint(0xffd000);
      if (!wasStunned && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '⚡ 기절!', 0xffd000, true);
      }
    } else if (type === 'bleed') {
      this.bleedTimer = Math.max(this.bleedTimer, duration);
      this.bleedDps = Math.max(this.bleedDps, value);
    } else if (type === 'shock') {
      const wasShocked = this.shockTimer > 0;
      this.shockTimer = Math.max(this.shockTimer, duration);
      this.shockAmp = Math.max(this.shockAmp, value);
      this.slowTimer = Math.max(this.slowTimer, duration);
      this.slowRatio = Math.max(this.slowRatio, 0.3);
      if (this.freezeTimer <= 0 && this.stunTimer <= 0) {
        this.sprite.setTint(0xaa88ff);
      }
      if (!wasShocked && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '⚡ 감전!', 0xbb88ff, true);
      }
    } else if (type === 'burn') {
      this.burnTimer = Math.max(this.burnTimer, duration);
      this.burnDps = Math.max(this.burnDps, value);
    } else if (type === 'curse') {
      this.curseTimer = Math.max(this.curseTimer, duration);
      if (this.freezeTimer <= 0 && this.stunTimer <= 0) {
        this.sprite.setTint(0x9955ff);
      }
    }
  }

  public update(
    dt: number,
    targetX: number,
    targetY: number,
    grid: SpatialHashGrid<Enemy>
  ): void {
    if (!this.active || this.hp <= 0) return;

    if (this.reactionCd > 0) {
      this.reactionCd = Math.max(0, this.reactionCd - dt);
    }

    // 피격 플래시 복구
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.restoreTint();
      }
    }

    // 빙결 체크
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      if (this.iceGraphics) {
        this.iceGraphics.clear();
        const boxSize = this.radius * 2.2;
        const boxX = this.x - boxSize / 2;
        const boxY = this.y - boxSize / 2;
        this.iceGraphics.fillStyle(0x00f0ff, 0.35);
        this.iceGraphics.fillRoundedRect(boxX, boxY, boxSize, boxSize, 6);
        this.iceGraphics.lineStyle(2, 0xaaf0ff, 0.85);
        this.iceGraphics.strokeRoundedRect(boxX, boxY, boxSize, boxSize, 6);
        this.iceGraphics.lineStyle(1.5, 0xffffff, 0.9);
        this.iceGraphics.lineBetween(this.x, boxY + 3, this.x, boxY + boxSize - 3);
        this.iceGraphics.lineBetween(boxX + 3, this.y, boxX + boxSize - 3, this.y);
      }
      if (this.freezeTimer <= 0) {
        this.restoreTint();
        if (this.iceGraphics) this.iceGraphics.clear();
      }
      this.renderHpBar();
      return;
    } else if (this.iceGraphics) {
      this.iceGraphics.clear();
    }

    // 기절 체크
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.restoreTint();
      }
      this.renderHpBar();
      return;
    }

    // 출혈 피해 (0.5초 틱)
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.bleedTickTimer -= dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.5;
        let bleedDmg = Math.max(1, Math.round(this.bleedDps * 28));
        if (this.shockTimer > 0) bleedDmg = Math.round(bleedDmg * (1 + this.shockAmp));
        this.hp -= bleedDmg;
        if (typeof (this.scene as any).recordDamage === 'function') {
          (this.scene as any).recordDamage('status_bleed', bleedDmg);
        }
        if (typeof (this.scene as any).showDamageText === 'function') {
          (this.scene as any).showDamageText(this.x, this.y - 12, `🩸 ${bleedDmg}`, 0xff3355);
        }
      }
      if (this.hp <= 0) {
        this.handleDeath();
        return;
      }
    }

    // 화상 피해 (0.5초 틱)
    if (this.burnTimer > 0) {
      this.burnTimer -= dt;
      this.burnTickTimer -= dt;
      if (this.burnTickTimer <= 0) {
        this.burnTickTimer = 0.5;
        let burnDmg = Math.max(1, Math.round(this.burnDps * 24));
        if (this.shockTimer > 0) burnDmg = Math.round(burnDmg * (1 + this.shockAmp));
        this.hp -= burnDmg;
        if (typeof (this.scene as any).recordDamage === 'function') {
          (this.scene as any).recordDamage('status_burn', burnDmg);
        }
        if (typeof (this.scene as any).showDamageText === 'function') {
          (this.scene as any).showDamageText(this.x, this.y - 14, `🔥 ${burnDmg}`, 0xff7722);
        }
      }
      if (this.hp <= 0) {
        this.handleDeath();
        return;
      }
    }

    if (this.shockTimer > 0) {
      this.shockTimer -= dt;
      if (this.shockTimer <= 0) this.shockAmp = 0;
    }

    if (this.curseTimer > 0) {
      this.curseTimer -= dt;
      if (this.curseTimer <= 0) this.restoreTint();
    }

    // 이동 속도 계산 (둔화 적용)
    let currentSpeed = this.speed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.restoreTint();
      } else {
        currentSpeed *= 1 - this.slowRatio;
      }
    }

    // 네임드 / 보스 패턴 업데이트
    if ((this.isNamed || this.isBoss) && this.updateBossFSM(dt, targetX, targetY)) {
      this.syncVisuals(dt, targetX - this.x);
      return;
    }

    // 일반 아키타입 행동 분기
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (this.behaviorType === 'charger') {
      this.updateChargerBehavior(dt, dx, dy, dist, currentSpeed);
    } else if (this.behaviorType === 'ranged') {
      this.updateRangedBehavior(dt, dx, dy, dist, currentSpeed);
    } else {
      this.x += (dx / dist) * currentSpeed * dt;
      this.y += (dy / dist) * currentSpeed * dt;
    }

    // 몬스터 간 부드러운 밀어내기 (Soft Separation)
    const neighbors = grid.queryRadius(this.x, this.y, this.radius * 2);
    for (const neighbor of neighbors) {
      if (neighbor === this || !neighbor.active) continue;
      const ndx = this.x - neighbor.x;
      const ndy = this.y - neighbor.y;
      const nDistSq = ndx * ndx + ndy * ndy;
      const minDist = this.radius + neighbor.radius;
      if (nDistSq < minDist * minDist && nDistSq > 0.001) {
        const nDist = Math.sqrt(nDistSq);
        const overlap = (minDist - nDist) * 0.45;
        this.x += (ndx / nDist) * overlap;
        this.y += (ndy / nDist) * overlap;
      }
    }

    this.syncVisuals(dt, dx);
  }

  private updateChargerBehavior(
    dt: number,
    dx: number,
    dy: number,
    dist: number,
    currentSpeed: number
  ): void {
    const cfg = ENEMY_ARCHETYPE_CONFIG.charger;
    if (this.chargeState === 'telegraph') {
      this.chargeTimer -= dt;
      this.sprite.setTint(Math.floor(this.chargeTimer * 18) % 2 === 0 ? 0xff2222 : 0xffffff);
      if (this.chargeTimer <= 0) {
        this.chargeState = 'dash';
        this.chargeTimer = cfg.dashDuration;
        this.restoreTint();
      }
      return;
    }

    if (this.chargeState === 'dash') {
      this.chargeTimer -= dt;
      this.x += this.chargeDirX * currentSpeed * cfg.dashSpeedMul * dt;
      this.y += this.chargeDirY * currentSpeed * cfg.dashSpeedMul * dt;
      if (this.chargeTimer <= 0) {
        this.chargeState = 'idle';
        this.aiCooldown = cfg.cooldownSec;
      }
      return;
    }

    this.aiCooldown -= dt;
    if (this.aiCooldown <= 0 && dist <= cfg.triggerDist) {
      this.chargeState = 'telegraph';
      this.chargeTimer = cfg.telegraphSec;
      this.chargeDirX = dx / dist;
      this.chargeDirY = dy / dist;
      return;
    }

    this.x += (dx / dist) * currentSpeed * dt;
    this.y += (dy / dist) * currentSpeed * dt;
  }

  private updateRangedBehavior(
    dt: number,
    dx: number,
    dy: number,
    dist: number,
    currentSpeed: number
  ): void {
    const cfg = ENEMY_ARCHETYPE_CONFIG.ranged;
    if (dist > cfg.preferredDist) {
      this.x += (dx / dist) * currentSpeed * dt;
      this.y += (dy / dist) * currentSpeed * dt;
    } else if (dist < cfg.preferredDist * 0.55) {
      this.x -= (dx / dist) * currentSpeed * 0.55 * dt;
      this.y -= (dy / dist) * currentSpeed * 0.55 * dt;
    }

    this.aiCooldown -= dt;
    if (this.aiCooldown <= 0 && dist <= cfg.triggerDist + 60) {
      this.aiCooldown = cfg.fireInterval;
      const spec: EnemyProjectileSpec = {
        speed: cfg.projSpeed,
        radius: 6,
        damage: Math.max(6, Math.round(this.atk * cfg.projDamageMul)),
        duration: 2.6,
        color: cfg.projColor,
      };
      if (typeof (this.scene as any).spawnEnemyProjectile === 'function') {
        (this.scene as any).spawnEnemyProjectile(this.x, this.y, dx, dy, spec);
      }
    }
  }

  private updateBossFSM(dt: number, targetX: number, targetY: number): boolean {
    if (this.isBoss && !this.bossPhase2Triggered && this.hp <= this.maxHp * 0.5) {
      this.bossPhase2Triggered = true;
      if (typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 56, '🔥 보스 광폭화 (2페이즈)!', 0xff2a6d, true);
      }
    }

    if (this.bossPhaseState === 'idle') {
      this.bossPatternCd -= dt;
      if (this.bossPatternCd <= 0) {
        const patterns: BossPatternId[] = this.isBoss
          ? ['telegraph_dash', 'aoe_ring', 'radial_barrage']
          : ['telegraph_dash', 'radial_barrage'];
        const chosen = patterns[this.bossPatternIndex % patterns.length];
        this.bossPatternIndex++;
        this.startBossPattern(chosen, targetX, targetY);
        return true;
      }
      return false;
    }

    if (this.bossPhaseState === 'telegraph') {
      this.bossStateTimer -= dt;
      this.renderBossTelegraph();
      if (this.bossStateTimer <= 0) {
        if (this.telegraphGraphics) this.telegraphGraphics.clear();
        this.executeBossPattern();
      }
      return true;
    }

    if (this.bossPhaseState === 'execute') {
      this.bossStateTimer -= dt;
      if (this.activeBossPattern === 'telegraph_dash') {
        const cfg = BOSS_PATTERN_CONFIG.telegraph_dash;
        this.x += this.bossDashDirX * cfg.dashSpeed * dt;
        this.y += this.bossDashDirY * cfg.dashSpeed * dt;
      }
      if (this.bossStateTimer <= 0) {
        const cfg = this.activeBossPattern ? BOSS_PATTERN_CONFIG[this.activeBossPattern] : null;
        this.bossPhaseState = 'idle';
        this.activeBossPattern = null;
        const phaseMul = this.bossPhase2Triggered ? 0.78 : 1.0;
        this.bossPatternCd = (cfg ? cfg.cooldownSec : 5.5) * phaseMul;
      }
      return true;
    }

    return false;
  }

  private startBossPattern(pattern: BossPatternId, targetX: number, targetY: number): void {
    this.activeBossPattern = pattern;
    this.bossPhaseState = 'telegraph';
    const cfg = BOSS_PATTERN_CONFIG[pattern];
    this.bossStateTimer = cfg.telegraphSec;

    if (pattern === 'telegraph_dash') {
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.bossDashDirX = dx / dist;
      this.bossDashDirY = dy / dist;
    } else if (pattern === 'aoe_ring') {
      this.bossAoeZones = [];
      const count = this.bossPhase2Triggered ? cfg.ringCount + 2 : cfg.ringCount;
      this.bossAoeZones.push({ x: targetX, y: targetY, radius: cfg.ringRadius });
      for (let i = 1; i < count; i++) {
        const angle = ((i - 1) * Math.PI * 2) / (count - 1) + Math.random() * 0.4;
        const offset = 110 + Math.random() * 65;
        this.bossAoeZones.push({
          x: targetX + Math.cos(angle) * offset,
          y: targetY + Math.sin(angle) * offset,
          radius: cfg.ringRadius,
        });
      }
    }
  }

  private renderBossTelegraph(): void {
    if (!this.telegraphGraphics || !this.activeBossPattern) return;
    const g = this.telegraphGraphics;
    g.clear();

    if (this.activeBossPattern === 'telegraph_dash') {
      const len = 240;
      const endX = this.x + this.bossDashDirX * len;
      const endY = this.y + this.bossDashDirY * len;
      g.lineStyle(this.radius * 1.4, 0xff2244, 0.28);
      g.lineBetween(this.x, this.y, endX, endY);
      g.lineStyle(2, 0xff5577, 0.85);
      g.lineBetween(this.x, this.y, endX, endY);
    } else if (this.activeBossPattern === 'aoe_ring') {
      for (const z of this.bossAoeZones) {
        g.fillStyle(0xff2244, 0.22);
        g.fillCircle(z.x, z.y, z.radius);
        g.lineStyle(2, 0xff6688, 0.9);
        g.strokeCircle(z.x, z.y, z.radius);
      }
    } else if (this.activeBossPattern === 'radial_barrage') {
      g.lineStyle(3, 0xff66cc, 0.75);
      g.strokeCircle(this.x, this.y, this.radius + 16);
    }
  }

  private executeBossPattern(): void {
    if (!this.activeBossPattern) return;
    const cfg = BOSS_PATTERN_CONFIG[this.activeBossPattern];

    if (this.activeBossPattern === 'telegraph_dash') {
      this.bossPhaseState = 'execute';
      this.bossStateTimer = cfg.dashDuration;
      return;
    }

    if (this.activeBossPattern === 'aoe_ring') {
      const dmg = Math.round(this.atk * cfg.ringDamageMul);
      for (const z of this.bossAoeZones) {
        if (typeof (this.scene as any).triggerBossAoeBlast === 'function') {
          (this.scene as any).triggerBossAoeBlast(z.x, z.y, z.radius, dmg);
        }
      }
      this.bossAoeZones = [];
      this.bossPhaseState = 'execute';
      this.bossStateTimer = 0.25;
      return;
    }

    if (this.activeBossPattern === 'radial_barrage') {
      const fireVolley = (angleOffset: number) => {
        if (!this.active) return;
        const count = this.bossPhase2Triggered ? cfg.barrageCount + 2 : cfg.barrageCount;
        const spec: EnemyProjectileSpec = {
          speed: cfg.barrageProjSpeed,
          radius: 7,
          damage: Math.max(8, Math.round(this.atk * cfg.barrageDamageMul)),
          duration: 3.0,
          color: 0xff3388,
        };
        for (let i = 0; i < count; i++) {
          const angle = (i * Math.PI * 2) / count + angleOffset;
          if (typeof (this.scene as any).spawnEnemyProjectile === 'function') {
            (this.scene as any).spawnEnemyProjectile(
              this.x,
              this.y,
              Math.cos(angle),
              Math.sin(angle),
              spec
            );
          }
        }
      };

      fireVolley(0);
      if (this.bossPhase2Triggered) {
        this.scene.time.delayedCall(320, () => fireVolley(Math.PI / cfg.barrageCount));
      }
      this.bossPhaseState = 'execute';
      this.bossStateTimer = 0.35;
    }
  }

  private restoreTint(): void {
    this.sprite.clearTint();
    if (this.freezeTimer > 0) this.sprite.setTint(0x00f0ff);
    else if (this.stunTimer > 0) this.sprite.setTint(0xffd000);
    else if (this.shockTimer > 0) this.sprite.setTint(0xaa88ff);
    else if (this.curseTimer > 0) this.sprite.setTint(0x9955ff);
    else if (this.slowTimer > 0) this.sprite.setTint(0x3388ff);
    else if (this.bleedTimer > 0) this.sprite.setTint(0xff5566);
    else if (this.isElite) this.sprite.setTint(0xffd700);
  }

  private syncVisuals(dt: number, dx: number): void {
    this.sprite.setFlipX(dx > 0);
    this.walkAnimTimer += dt * 11;
    const bounceY = Math.abs(Math.sin(this.walkAnimTimer)) * -3.0;
    const wobbleRot = Math.sin(this.walkAnimTimer) * 0.055;

    this.sprite.setPosition(this.x, this.y + bounceY);
    this.sprite.setRotation(wobbleRot);
    this.shadowArc.setPosition(
      this.x,
      this.y + (this.isBoss ? 38 : this.isNamed ? 25 : this.isElite ? 20 : 16)
    );
    this.renderHpBar();
  }

  private renderHpBar(): void {
    if (this.hpBarGraphics && this.active) {
      const ratio = Math.max(0, this.hp / this.maxHp);
      const barW = this.isBoss ? 64 : this.isNamed ? 46 : 36;
      const barH = 5;
      const barX = this.x - barW / 2;
      const barY = this.y - (this.isBoss ? 50 : this.isNamed ? 36 : 30);

      this.hpBarGraphics.clear();
      this.hpBarGraphics.fillStyle(0x0a0a0a, 0.75);
      this.hpBarGraphics.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      this.hpBarGraphics.fillStyle(this.isElite ? 0xffd700 : 0xff2a6d, 1);
      this.hpBarGraphics.fillRect(barX, barY, barW * ratio, barH);
    }
  }

  public destroy(): void {
    if (this.hpBarGraphics) {
      this.hpBarGraphics.destroy();
      this.hpBarGraphics = undefined;
    }
    if (this.iceGraphics) {
      this.iceGraphics.destroy();
      this.iceGraphics = undefined;
    }
    if (this.telegraphGraphics) {
      this.telegraphGraphics.destroy();
      this.telegraphGraphics = undefined;
    }
    this.shadowArc.destroy();
    this.sprite.destroy();
  }
}
