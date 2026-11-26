import Phaser from 'phaser';
import { EnemyProjectileSpec } from '../data/types';

export class EnemyProjectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public radius: number;
  public damage: number;
  public lifeTimer: number;
  public active: boolean = true;

  private outerCircle: Phaser.GameObjects.Arc;
  private innerCircle: Phaser.GameObjects.Arc;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    spec: EnemyProjectileSpec
  ) {
    this.x = x;
    this.y = y;
    const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
    this.vx = (dirX / len) * spec.speed;
    this.vy = (dirY / len) * spec.speed;
    this.radius = spec.radius;
    this.damage = spec.damage;
    this.lifeTimer = spec.duration;

    this.outerCircle = scene.add
      .circle(x, y, spec.radius + 3, spec.color, 0.35)
      .setDepth(21);
    this.innerCircle = scene.add
      .circle(x, y, spec.radius, 0xffffff, 0.92)
      .setStrokeStyle(2, spec.color, 1)
      .setDepth(22);
  }

  public update(dt: number): void {
    if (!this.active) return;

    this.lifeTimer -= dt;
    if (this.lifeTimer <= 0) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.outerCircle.setPosition(this.x, this.y);
    this.innerCircle.setPosition(this.x, this.y);
  }

  public deactivate(): void {
    this.active = false;
  }

  public destroy(): void {
    this.outerCircle.destroy();
    this.innerCircle.destroy();
  }
}
