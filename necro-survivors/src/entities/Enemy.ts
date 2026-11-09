import Phaser from 'phaser';
import { SpatialEntity, SpatialHashGrid } from '../core/SpatialHashGrid';

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
  public active: boolean = true;

  public sprite: Phaser.GameObjects.Sprite;
  private flashTimer: number = 0;

  // 상태이상 타이머
  public freezeTimer: number = 0;
  public slowTimer: number = 0;
  public slowRatio: number = 0;
  public stunTimer: number = 0;
  public bleedTimer: number = 0;
  public bleedDps: number = 0;

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
    onKilled?: (enemy: Enemy) => void
  ) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.hp = hp;
    this.maxHp = hp;
    this.atk = atk;
    this.speed = speed;
    this.expValue = exp;
    this.goldValue = gold;
    this.isNamed = isNamed;
    this.isBoss = isBoss;
    this.onKilled = onKilled;

    this.sprite = scene.add.sprite(x, y, textureKey);
    // 표시 크기 조정
    if (isBoss) {
      this.sprite.setDisplaySize(110, 110);
    } else if (isNamed) {
      this.sprite.setDisplaySize(72, 72);
    } else {
      this.sprite.setDisplaySize(48, 48);
    }
    this.sprite.setDepth(15);
  }

  public takeDamage(amount: number, knockbackDx: number = 0, knockbackDy: number = 0): boolean {
    if (!this.active || this.hp <= 0) return false;

    // 화면 1.2배 범위 밖 몬스터는 피격 및 사망 방지 (Issue 6)
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

    this.hp -= amount;

    // 넉백 적용 및 스프라이트 좌표 즉시 동기화 (Issue 5)
    if (knockbackDx !== 0 || knockbackDy !== 0) {
      const bossKnockbackResist = this.isBoss ? 0.15 : this.isNamed ? 0.4 : 1.0;
      this.x += knockbackDx * bossKnockbackResist;
      this.y += knockbackDy * bossKnockbackResist;
      this.sprite.setPosition(this.x, this.y);
    }

    // 피격 화이트 플래시 (0.06초)
    this.sprite.setTintFill(0xffffff);
    this.flashTimer = 0.06;

    if (this.hp <= 0) {
      this.hp = 0;
      this.active = false;
      this.sprite.setVisible(false);
      if (this.onKilled) {
        this.onKilled(this);
      }
      return true; // 처치됨
    }
    return false;
  }

  public applyStatus(type: 'slow' | 'freeze' | 'stun' | 'bleed' | 'pull', duration: number, value: number = 0.4): void {
    if (!this.active) return;
    if (type === 'freeze') {
      this.freezeTimer = Math.max(this.freezeTimer, duration);
      this.sprite.setTint(0x00f0ff);
    } else if (type === 'slow') {
      this.slowTimer = Math.max(this.slowTimer, duration);
      this.slowRatio = value;
      this.sprite.setTint(0x3388ff);
    } else if (type === 'stun') {
      this.stunTimer = Math.max(this.stunTimer, duration);
      this.sprite.setTint(0xffd000);
    } else if (type === 'bleed') {
      this.bleedTimer = Math.max(this.bleedTimer, duration);
      this.bleedDps = value;
    }
  }

  public update(
    dt: number,
    targetX: number,
    targetY: number,
    grid: SpatialHashGrid<Enemy>
  ): void {
    if (!this.active || this.hp <= 0) return;

    // 피격 플래시 복구
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.sprite.clearTint();
        if (this.freezeTimer > 0) this.sprite.setTint(0x00f0ff);
        else if (this.slowTimer > 0) this.sprite.setTint(0x3388ff);
      }
    }

    // 빙결 및 기절 체크
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      return;
    }
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      return;
    }

    // 출혈 피해
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.hp -= this.bleedDps * dt * 50;
      if (this.hp <= 0) {
        this.hp = 0;
        this.active = false;
        this.sprite.setVisible(false);
        if (this.onKilled) {
          this.onKilled(this);
        }
        return;
      }
    }

    // 이동 속도 계산 (둔화 적용)
    let currentSpeed = this.speed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      currentSpeed *= 1 - this.slowRatio;
    }

    // 타겟(플레이어 또는 가까운 소환수)을 향해 이동
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // 몬스터 방향 전환 (좌우 flipX)
    this.sprite.setFlipX(dx < 0);

    this.x += (dx / dist) * currentSpeed * dt;
    this.y += (dy / dist) * currentSpeed * dt;

    // 몬스터 간 부드러운 밀어내기 (Soft Separation - 렉 없는 공간 해싱 기반)
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

    this.sprite.setPosition(this.x, this.y);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
