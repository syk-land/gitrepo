import Phaser from 'phaser';
import { ProjectileBehavior, StatusEffect } from '../data/types';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { Enemy } from './Enemy';
import { ISkillCaster } from './ISkillCaster';

export class Projectile {
  public skillId: string = '';
  public x: number;
  public y: number;
  public active: boolean = true;
  public damage: number;
  public pierceLeft: number;
  public duration: number;
  public areaRadius: number;
  public hitboxRadius: number = 20;
  public knockback: number;
  public behavior: ProjectileBehavior;
  public statusEffect?: { type: 'slow' | 'freeze' | 'stun' | 'bleed' | 'pull'; chance: number; duration: number; value?: number };

  public sprite: Phaser.GameObjects.Sprite;
  private vx: number = 0;
  private vy: number = 0;
  private speed: number = 320;
  private orbitAngle: number = 0;
  private orbitCaster?: ISkillCaster;
  private hitEnemies = new Set<Enemy>();
  private tickTimer: number = 0;

  private scene: Phaser.Scene;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    x: number,
    y: number,
    behavior: ProjectileBehavior,
    damage: number,
    pierce: number,
    duration: number,
    radius: number,
    knockback: number,
    dirX: number = 1,
    dirY: number = 0,
    speed: number = 340,
    statusEffect?: { type: 'slow' | 'freeze' | 'stun' | 'bleed' | 'pull'; chance: number; duration: number; value?: number },
    orbitCaster?: ISkillCaster,
    orbitOffset: number = 0,
    skillId: string = ''
  ) {
    this.scene = scene;
    this.skillId = skillId || textureKey;
    this.x = x;
    this.y = y;
    this.behavior = behavior;
    this.damage = damage;
    this.pierceLeft = pierce;
    this.duration = duration;
    this.areaRadius = radius;
    this.knockback = knockback;
    this.speed = speed;
    this.statusEffect = statusEffect;
    this.orbitCaster = orbitCaster;
    this.orbitAngle = orbitOffset;

    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    this.vx = (dirX / len) * speed;
    this.vy = (dirY / len) * speed;

    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(20);

    // 행동양식별 시각적 크기와 실제 타격 판정(hitboxRadius) 일치화 (문제점 4)
    if (behavior === 'ground_zone') {
      this.hitboxRadius = radius;
      this.sprite.setDisplaySize(radius * 2, radius * 2);
      this.sprite.setAlpha(0.65);
      this.sprite.setDepth(10);
    } else if (behavior === 'cone_slash') {
      this.hitboxRadius = radius;
      this.sprite.setDisplaySize(radius * 2, radius * 2);
      this.sprite.setRotation(Math.atan2(dirY, dirX));
    } else if (behavior === 'orbit') {
      // 궤도 공전체는 회전도끼/뼈방패 스프라이트(48x48)에 맞춰 피격 반경 24px 부여
      this.hitboxRadius = 24;
      this.sprite.setDisplaySize(48, 48);
    } else if (behavior === 'instant_strike') {
      this.hitboxRadius = radius;
      this.sprite.setDisplaySize(radius * 2, radius * 2);
    } else {
      this.hitboxRadius = 18;
      this.sprite.setDisplaySize(36, 36);
      this.sprite.setRotation(Math.atan2(dirY, dirX));
    }
  }

  public update(dt: number, grid: SpatialHashGrid<Enemy>): void {
    if (!this.active) return;

    this.duration -= dt;
    if (this.duration <= 0) {
      this.destroyVisuals();
      this.active = false;
      return;
    }

    if (this.behavior === 'straight' || this.behavior === 'cone_slash') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.sprite.setPosition(this.x, this.y);
      this.checkCollisions(grid);
    } else if (this.behavior === 'homing') {
      const nearest = grid.findNearest(this.x, this.y, 400);
      if (nearest && nearest.active) {
        const dx = nearest.x - this.x;
        const dy = nearest.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        this.vx = Phaser.Math.Linear(this.vx, (dx / dist) * this.speed, 0.1);
        this.vy = Phaser.Math.Linear(this.vy, (dy / dist) * this.speed, 0.1);
        this.sprite.setRotation(Math.atan2(this.vy, this.vx));
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.sprite.setPosition(this.x, this.y);
      this.checkCollisions(grid);
    } else if (this.behavior === 'orbit' && this.orbitCaster) {
      this.orbitAngle += dt * 3.5;
      const center = this.orbitCaster.getPosition();
      this.x = center.x + Math.cos(this.orbitAngle) * this.areaRadius;
      this.y = center.y + Math.sin(this.orbitAngle) * this.areaRadius;
      this.sprite.setPosition(this.x, this.y);
      this.sprite.setRotation(this.orbitAngle + Math.PI / 2);

      // 공전체 0.3초 주기 다단히트 리셋
      this.tickTimer -= dt;
      if (this.tickTimer <= 0) {
        this.tickTimer = 0.3;
        this.hitEnemies.clear();
      }
      this.checkCollisions(grid);
    } else if (this.behavior === 'ground_zone') {
      this.sprite.setRotation(this.sprite.rotation + dt * 0.5);
      this.tickTimer -= dt;
      if (this.tickTimer <= 0) {
        this.tickTimer = 0.25; // 0.25초마다 틱 데미지
        this.hitEnemies.clear();
        this.checkCollisions(grid);
      }
    } else if (this.behavior === 'chain') {
      this.checkChainCollisions(grid);
    } else if (this.behavior === 'instant_strike') {
      this.checkCollisions(grid);
      this.destroyVisuals();
      this.active = false;
    }
  }

  private checkCollisions(grid: SpatialHashGrid<Enemy>): void {
    // 실제 스프라이트 피격 원형 판정: hitboxRadius + enemy.radius (문제점 4 해결)
    const queryR = this.hitboxRadius + 45;
    const hits = grid.queryRadius(this.x, this.y, queryR);

    for (const enemy of hits) {
      if (!enemy.active || this.hitEnemies.has(enemy)) continue;

      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distSq = dx * dx + dy * dy;
      const maxHitDist = this.hitboxRadius + enemy.radius;

      // 시각적 피격 범위와 실제 피격 범위를 완전 일치시킴
      if (distSq > maxHitDist * maxHitDist) continue;

      this.hitEnemies.add(enemy);
      const dist = Math.sqrt(distSq) || 1;

      enemy.takeDamage(this.damage, (dx / dist) * this.knockback, (dy / dist) * this.knockback);
      if (typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(enemy.x, enemy.y - 12, `${this.damage}`, 0xf5ede2);
      }

      if (this.statusEffect && Math.random() <= this.statusEffect.chance) {
        enemy.applyStatus(this.statusEffect.type, this.statusEffect.duration, this.statusEffect.value);
      }

      this.pierceLeft--;
      if (this.pierceLeft <= 0 && this.behavior !== 'orbit' && this.behavior !== 'ground_zone') {
        this.destroyVisuals();
        this.active = false;
        break;
      }
    }
  }

  private checkChainCollisions(grid: SpatialHashGrid<Enemy>): void {
    let currentX = this.x;
    let currentY = this.y;
    const hitList = new Set<Enemy>();

    for (let i = 0; i < this.pierceLeft; i++) {
      const candidates = grid.queryRadius(currentX, currentY, this.areaRadius);
      let nextTarget: Enemy | null = null;
      let minD = Infinity;

      for (const enemy of candidates) {
        if (!enemy.active || hitList.has(enemy)) continue;
        const d = (enemy.x - currentX) ** 2 + (enemy.y - currentY) ** 2;
        if (d < minD) {
          minD = d;
          nextTarget = enemy;
        }
      }

      if (!nextTarget) break;

      hitList.add(nextTarget);
      nextTarget.takeDamage(this.damage, 0, 0);
      if (typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(nextTarget.x, nextTarget.y - 12, `${this.damage}`, 0xbf55ec);
      }
      if (this.statusEffect && Math.random() <= this.statusEffect.chance) {
        nextTarget.applyStatus(this.statusEffect.type, this.statusEffect.duration, this.statusEffect.value);
      }
      currentX = nextTarget.x;
      currentY = nextTarget.y;
    }

    this.destroyVisuals();
    this.active = false;
  }

  public destroyVisuals(): void {
    this.sprite.setVisible(false);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
