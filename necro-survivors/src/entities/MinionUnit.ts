import Phaser from 'phaser';
import { MinionDef, CombatStats } from '../data/types';
import { ISkillCaster, Vector2 } from './ISkillCaster';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { Enemy } from './Enemy';

export class MinionUnit implements ISkillCaster {
  public x: number;
  public y: number;
  public hp: number;
  public maxHp: number;
  public state: 'ALIVE' | 'DEAD_RESPAWNING' = 'ALIVE';
  public respawnTimer: number = 0;
  public invulnTimer: number = 0;
  public attackCooldown: number = 0;

  public def: MinionDef;
  public sprite: Phaser.GameObjects.Sprite;
  public hpBar: Phaser.GameObjects.Graphics;
  private floatTimer: number = Math.random() * Math.PI * 2;
  private orbitAngle: number = 0;
  private orbitIndex: number = 0;
  private facingDir: Vector2 = { x: 1, y: 0 };
  private ownerGetter: () => { x: number; y: number; stats: CombatStats; facing: Vector2 };

  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    def: MinionDef,
    x: number,
    y: number,
    orbitIndex: number,
    ownerGetter: () => { x: number; y: number; stats: CombatStats; facing: Vector2 }
  ) {
    this.scene = scene;
    this.def = def;
    this.x = x;
    this.y = y;
    this.orbitIndex = orbitIndex;
    this.orbitAngle = orbitIndex * 2.39996; // 황금비(Golden Angle) 각도로 겹침 완전 방지
    this.ownerGetter = ownerGetter;

    const stats = this.getEffectiveStats();
    this.maxHp = Math.round(stats.maxHp * def.baseHpRatio * stats.minionHpMul);
    this.hp = this.maxHp;

    this.sprite = scene.add.sprite(x, y, def.id);
    if (def.id === 'arthur') {
      this.sprite.setDisplaySize(60, 60);
    } else {
      this.sprite.setDisplaySize(44, 44);
    }
    this.sprite.setDepth(18);

    this.hpBar = scene.add.graphics();
    this.hpBar.setDepth(19);
  }

  public getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  public getFacingDirection(): Vector2 {
    return this.facingDir;
  }

  private getLegionLevel(): number {
    const player = (this.scene as any)?.player;
    if (!player?.activeSkills) return 0;
    if (player.activeSkills.has('awakened_legion')) return 5;
    return player.activeSkills.get('necro_legion') ?? 0;
  }

  public getEffectiveStats(): CombatStats {
    const owner = this.ownerGetter();
    const isSkeleton = this.def.id !== 'drone';
    const legionLv = isSkeleton ? this.getLegionLevel() : 0;
    const legionAtkBonus = legionLv >= 4 ? 1.30 : 1.0;
    const legionHpBonus = legionLv >= 2 ? 1.25 : 1.0;
    return {
      ...owner.stats,
      damageMul: owner.stats.damageMul * this.def.baseAtkRatio * owner.stats.minionDamageMul * legionAtkBonus,
      minionHpMul: owner.stats.minionHpMul * legionHpBonus,
    };
  }

  public isAlive(): boolean {
    return this.state === 'ALIVE';
  }

  public getCasterName(): string {
    return this.def.name;
  }

  // 소환수 원콤 방지 보호 규칙: 1타 최대 25% 피해 제한 + 0.35초 무적
  public takeDamage(amount: number): boolean {
    if (this.state !== 'ALIVE' || this.invulnTimer > 0) return false;

    const maxDamageCap = this.maxHp * 0.25;
    const finalDamage = Math.min(amount, maxDamageCap);
    this.hp -= finalDamage;
    this.invulnTimer = 0.35;

    this.sprite.setTintFill(0xffffff);
    setTimeout(() => {
      if (this.sprite.active) {
        if (this.state === 'ALIVE') this.sprite.clearTint();
      }
    }, 60);

    if (this.hp <= 0) {
      const stats = this.getEffectiveStats();
      let respawn = this.def.respawnSeconds || 3.5;
      if (this.def.id !== 'drone' && this.getLegionLevel() >= 5) {
        respawn *= 0.5;
      }
      if (stats.cooldownMul < 1) {
        respawn *= Math.max(0.4, stats.cooldownMul);
      }
      this.die(respawn);
      return true;
    }
    return false;
  }

  public die(respawnSeconds: number): void {
    this.hp = 0;
    this.state = 'DEAD_RESPAWNING';
    this.respawnTimer = respawnSeconds;
    this.sprite.setAlpha(0.35);
    this.sprite.setTint(0x777777);
    this.hpBar.clear();
  }

  public triggerCorpseExplosion(burstDmg: number, grid: SpatialHashGrid<Enemy>): void {
    if (this.state !== 'ALIVE') return;

    // 소환수 보조 충격파 시각 이펙트 (문제점 10: 소환물 생존 유지)
    if (typeof (this.scene as any).createNovaVFX === 'function') {
      (this.scene as any).createNovaVFX(this.x, this.y, 140, 0x00ffaa);
    }

    // 주변 적들에게 사령 충격파 피해
    const enemies = grid.queryRadius(this.x, this.y, 140);
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      enemy.takeDamage(burstDmg, (dx / dist) * 75, (dy / dist) * 75);
      if (typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(enemy.x, enemy.y - 15, `💥 ${burstDmg}`, 0x00ffaa);
      }
    }

    // 소환수는 죽지 않고 전투를 지속함
  }

  public updateAI(
    dt: number,
    grid: SpatialHashGrid<Enemy>,
    onRangedAttack?: (minion: MinionUnit, target: Enemy) => void
  ): void {
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
    }

    // 사망 중이면 부활 카운트다운 (플레이어 근처를 반투명 영혼으로 부드럽게 추종)
    if (this.state === 'DEAD_RESPAWNING') {
      this.respawnTimer -= dt;
      const owner = this.ownerGetter();
      this.x = Phaser.Math.Linear(this.x, owner.x, 0.08);
      this.y = Phaser.Math.Linear(this.y, owner.y, 0.08);
      this.sprite.setPosition(this.x, this.y);

      if (this.respawnTimer <= 0) {
        this.state = 'ALIVE';
        const respawnStats = this.getEffectiveStats();
        this.maxHp = Math.round(respawnStats.maxHp * this.def.baseHpRatio * respawnStats.minionHpMul);
        this.hp = this.maxHp;
        this.sprite.setAlpha(1.0);
        this.sprite.clearTint();
        // 부활 연출: 플레이어 바로 옆으로 소환
        this.x = owner.x + (Math.random() * 40 - 20);
        this.y = owner.y + (Math.random() * 40 - 20);
        this.sprite.setPosition(this.x, this.y);
      }
      return;
    }

    const owner = this.ownerGetter();

    if (this.def.combatRole === 'melee_blocker') {
      // 1. 근접 길막형 (해골 전사, 아서): 플레이어 반경 180px 내 적에게 돌격
      const nearestEnemy = grid.findNearest(owner.x, owner.y, 180);

      if (nearestEnemy && nearestEnemy.active) {
        const dx = nearestEnemy.x - this.x;
        const dy = nearestEnemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        this.facingDir = { x: dx / dist, y: dy / dist };
        this.sprite.setFlipX(dx < 0);

        if (dist > this.def.attackRange) {
          this.x += (dx / dist) * this.def.moveSpeed * dt;
          this.y += (dy / dist) * this.def.moveSpeed * dt;
        }

        // 공격 및 길막 바리케이드 충돌
        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0 && dist <= this.def.attackRange + 15) {
          this.attackCooldown = this.def.attackInterval;
          const stats = this.getEffectiveStats();
          const dmg = Math.round(stats.damageMul * 35);
          nearestEnemy.takeDamage(dmg, (dx / dist) * 35, (dy / dist) * 35);
          if (typeof (this.scene as any).showDamageText === 'function') {
            (this.scene as any).showDamageText(nearestEnemy.x, nearestEnemy.y - 12, `${dmg}`, 0xffd000);
          }
        }

        // 적을 몸으로 밀어내며 플레이어 보호 (바리케이드 물리)
        if (dist < this.def.bodyRadius + nearestEnemy.radius) {
          const pushForce = 35 * dt;
          nearestEnemy.x += (dx / dist) * pushForce;
          nearestEnemy.y += (dy / dist) * pushForce;
        }
      } else {
        // 주변에 적이 없으면 플레이어 전방 반원 대형으로 복귀 (방진 다층 분산)
        const forwardX = owner.facing.x || 1;
        const forwardY = owner.facing.y || 0;
        const spreadRadius = 35 + (this.orbitIndex % 3) * 18;
        const targetX = owner.x + forwardX * 60 + Math.cos(this.orbitAngle) * spreadRadius;
        const targetY = owner.y + forwardY * 60 + Math.sin(this.orbitAngle) * spreadRadius;

        const fdx = targetX - this.x;
        const fdy = targetY - this.y;
        const fDist = Math.sqrt(fdx * fdx + fdy * fdy) || 1;

        if (fDist > 10) {
          this.x += (fdx / fDist) * this.def.moveSpeed * 1.1 * dt;
          this.y += (fdy / fDist) * this.def.moveSpeed * 1.1 * dt;
          this.sprite.setFlipX(fdx < 0);
        }
      }
    } else {
      // 2. 원거리 공전형 (해골 궁수, 마법사, 드론): 플레이어 주위 다층 공전 (겹침 방지)
      const orbitRadius = 65 + (this.orbitIndex % 3) * 22;
      this.orbitAngle += dt * 1.8;
      const targetX = owner.x + Math.cos(this.orbitAngle) * orbitRadius;
      const targetY = owner.y + Math.sin(this.orbitAngle) * orbitRadius;

      this.x = Phaser.Math.Linear(this.x, targetX, 0.15);
      this.y = Phaser.Math.Linear(this.y, targetY, 0.15);

      // 사거리 내 가장 가까운 적 탐색 및 원거리 발사
      this.attackCooldown -= dt;
      const targetEnemy = grid.findNearest(this.x, this.y, this.def.attackRange);

      if (targetEnemy && targetEnemy.active) {
        const dx = targetEnemy.x - this.x;
        const dy = targetEnemy.y - this.y;
        this.sprite.setFlipX(dx < 0);
        this.facingDir = { x: dx, y: dy };

        if (this.attackCooldown <= 0) {
          let interval = this.def.attackInterval;
          if (this.def.id === 'drone') {
            const pSkills = (this.scene as any)?.player?.activeSkills;
            if (pSkills?.has('awakened_drone')) {
              interval *= 0.65;
            } else {
              const dLv = pSkills?.get('psi_drone') ?? 1;
              if (dLv >= 5) interval *= 0.70;
              else if (dLv >= 2) interval *= 0.80;
            }
          }
          this.attackCooldown = interval;
          if (onRangedAttack) {
            onRangedAttack(this, targetEnemy);
          }
        }
      }
    }

    this.floatTimer += dt * 3.5;
    const hoverY = Math.sin(this.floatTimer) * 3.5;

    this.sprite.setPosition(this.x, this.y + hoverY);
    this.renderHpBar(hoverY);
  }

  private renderHpBar(hoverY: number = 0): void {
    this.hpBar.clear();
    if (this.state !== 'ALIVE' || this.hp >= this.maxHp) return;

    const barW = 32;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y + hoverY - 26;

    this.hpBar.fillStyle(0x000000, 0.7);
    this.hpBar.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBar.fillStyle(0x00ffaa, 1.0);
    this.hpBar.fillRect(barX, barY, barW * ratio, barH);
  }

  public destroy(): void {
    this.sprite.destroy();
    this.hpBar.destroy();
  }
}
