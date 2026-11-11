import Phaser from 'phaser';
import { ProjectileBehavior, StatusEffect } from '../data/types';
import { SpatialHashGrid } from '../core/SpatialHashGrid';
import { Enemy } from './Enemy';
import { ISkillCaster } from './ISkillCaster';
import { SoundEngine } from '../core/SoundEngine';

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
  public critRate: number = 0;
  public critDamage: number = 1.5;
  private hasStruck: boolean = false;

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
    skillId: string = '',
    critRate: number = 0,
    critDamage: number = 1.5
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
    this.critRate = critRate;
    this.critDamage = critDamage;

    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    this.vx = (dirX / len) * speed;
    this.vy = (dirY / len) * speed;

    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(20);

    // 행동양식별 시각적 크기와 실제 타격 판정(hitboxRadius) 일치화 (문제점 4)
    if (behavior === 'ground_zone') {
      this.hitboxRadius = radius;
      this.sprite.setDisplaySize(radius * 2, radius * 2);
      this.sprite.setAlpha(0.7);
      this.sprite.setDepth(10);
    } else if (behavior === 'cone_slash') {
      this.hitboxRadius = radius;
      this.sprite.setDisplaySize(radius * 2, radius * 2);
      this.sprite.setRotation(Math.atan2(dirY, dirX));
    } else if (behavior === 'orbit') {
      // 궤도 공전체는 회전도끼/뼈방패 스프라이트(48x48)에 맞춰 피격 반경 24px 부여
      this.hitboxRadius = 24;
      this.sprite.setDisplaySize(50, 50);
    } else if (behavior === 'instant_strike') {
      this.hitboxRadius = radius;
      this.sprite.setDisplaySize(radius * 2, radius * 2);
    } else {
      // 직선 / 유도 / 투사체 형태별 황금 비율 유지
      this.hitboxRadius = 18;
      if (textureKey.includes('spear')) {
        this.sprite.setDisplaySize(54, 27);
      } else if (textureKey.includes('sniper')) {
        this.sprite.setDisplaySize(68, 22);
      } else if (textureKey.includes('arrow')) {
        this.sprite.setDisplaySize(48, 18);
      } else if (textureKey.includes('drone')) {
        this.sprite.setDisplaySize(38, 14);
      } else {
        this.sprite.setDisplaySize(36, 36);
      }
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
      if (this.orbitCaster) {
        const center = this.orbitCaster.getPosition();
        this.x = center.x;
        this.y = center.y;
        this.sprite.setPosition(this.x, this.y);
      }
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
      if (!this.hasStruck) {
        this.hasStruck = true;
        this.checkCollisions(grid);
        // 즉시 시각 효과 트윈 실행 (확산 & 페이드아웃)
        this.scene.tweens.add({
          targets: this.sprite,
          scale: this.sprite.scaleX * 1.5,
          alpha: 0,
          duration: 320,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.destroyVisuals();
            this.active = false;
          },
        });
      }
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

      // 치명타 판정
      let isCrit = false;
      let hitDmg = this.damage;
      if (this.critRate > 0 && Math.random() < this.critRate) {
        isCrit = true;
        hitDmg = Math.round(this.damage * this.critDamage);
      }

      let effKnockback = this.knockback;
      // 캐릭터 중심 흡인 기술(죽음의 손아귀)은 플레이어 접촉 피격 안전 반경(42px) 까지만 적을 끌어당김
      if (effKnockback < 0 && dist < 42) {
        effKnockback = 0;
      }

      const tookDmg = enemy.takeDamage(hitDmg, (dx / dist) * effKnockback, (dy / dist) * effKnockback);
      if (!tookDmg) continue; // 화면 밖 1.2배 무적 적은 관통 및 데미지 미소모!

      if (isCrit) {
        SoundEngine.getInstance().crit();
      }

      if (typeof (this.scene as any).showDamageText === 'function') {
        const textColor = isCrit ? 0xffd000 : 0xf5ede2;
        const textPrefix = isCrit ? '⚡ ' : '';
        (this.scene as any).showDamageText(enemy.x, enemy.y - 12, `${textPrefix}${hitDmg}`, textColor, isCrit);
      }

      if (this.statusEffect && Math.random() <= this.statusEffect.chance) {
        enemy.applyStatus(this.statusEffect.type, this.statusEffect.duration, this.statusEffect.value);
      }

      this.pierceLeft--;
      if (this.pierceLeft <= 0 && this.behavior !== 'ground_zone') {
        this.destroyVisuals();
        this.active = false;
        if (this.behavior === 'orbit' && this.skillId === 'necro_armor' && this.scene) {
          // 일회용 뼈방패 파괴 시 파열 시각효과
          const burst = this.scene.add.circle(this.x, this.y, 14, 0x00f0ff, 0.85).setDepth(25);
          this.scene.tweens.add({
            targets: burst,
            scale: 2.2,
            alpha: 0,
            duration: 180,
            onComplete: () => burst.destroy(),
          });
        }
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

      // 치명타 판정
      let isCrit = false;
      let hitDmg = this.damage;
      if (this.critRate > 0 && Math.random() < this.critRate) {
        isCrit = true;
        hitDmg = Math.round(this.damage * this.critDamage);
      }

      const tookDmg = nextTarget.takeDamage(hitDmg, 0, 0);
      if (!tookDmg) continue;

      if (isCrit) {
        SoundEngine.getInstance().crit();
      }

      // 번개 아크 시각 효과 라인 렌더링
      const line = this.scene.add.line(0, 0, currentX, currentY, nextTarget.x, nextTarget.y, 0x00f0ff)
        .setLineWidth(2.5)
        .setDepth(22)
        .setOrigin(0);

      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 220,
        onComplete: () => line.destroy(),
      });

      if (typeof (this.scene as any).showDamageText === 'function') {
        const textColor = isCrit ? 0xffd000 : 0x00f0ff;
        const textPrefix = isCrit ? '⚡ ' : '';
        (this.scene as any).showDamageText(nextTarget.x, nextTarget.y - 12, `${textPrefix}${hitDmg}`, textColor, isCrit);
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
