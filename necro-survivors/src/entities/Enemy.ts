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
  public isElite: boolean;
  public active: boolean = true;

  public sprite: Phaser.GameObjects.Sprite;
  private shadowArc: Phaser.GameObjects.Ellipse;
  private hpBarGraphics?: Phaser.GameObjects.Graphics;
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
    this.isElite = isElite;
    this.onKilled = onKilled;

    const shadowW = isBoss ? 60 : isNamed ? 40 : isElite ? 34 : 26;
    const shadowH = isBoss ? 20 : isNamed ? 13 : isElite ? 11 : 9;
    this.shadowArc = scene.add.ellipse(x, y + (isBoss ? 38 : isNamed ? 25 : isElite ? 20 : 16), shadowW, shadowH, 0x000000, 0.42).setDepth(13);

    this.sprite = scene.add.sprite(x, y, textureKey);
    // 표시 크기 조정 (2등신 SD 치비 비율)
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

    // 빙결 시각 효과 전용 그래픽스
    this.iceGraphics = scene.add.graphics();
    this.iceGraphics.setDepth(17);

    if (isElite || isNamed || isBoss) {
      this.hpBarGraphics = scene.add.graphics();
      this.hpBarGraphics.setDepth(16);
    }
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

    const effectiveAmount = this.shockTimer > 0 ? Math.round(amount * (1 + this.shockAmp)) : amount;
    this.hp -= effectiveAmount;

    // 빙결 상태에서는 넉백 면제! (얼어붙은 얼음 조각상처럼 제자리에 완전 고정)
    if (this.freezeTimer <= 0 && (knockbackDx !== 0 || knockbackDy !== 0)) {
      const bossKnockbackResist = this.isBoss ? 0.15 : this.isNamed ? 0.4 : this.isElite ? 0.5 : 1.0;
      this.x += knockbackDx * bossKnockbackResist;
      this.y += knockbackDy * bossKnockbackResist;
      this.sprite.setPosition(this.x, this.y);
    }

    // 피격 플래시: 빙결/기절 상태일 때는 고유 색상 플래시, 평상시에는 화이트 플래시
    if (this.freezeTimer > 0) {
      this.sprite.setTint(0x88ffff);
    } else if (this.stunTimer > 0) {
      this.sprite.setTint(0xffea60);
    } else {
      this.sprite.setTintFill(0xffffff);
    }
    this.flashTimer = 0.06;

    if (this.hp <= 0) {
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
      if (this.onKilled) {
        this.onKilled(this);
      }
      return true; // 처치됨
    }
    return false;
  }

  public applyStatus(type: 'slow' | 'freeze' | 'stun' | 'bleed' | 'pull' | 'shock', duration: number, value: number = 0.4): void {
    if (!this.active) return;
    if (type === 'freeze') {
      const wasFrozen = this.freezeTimer > 0;
      this.freezeTimer = Math.max(this.freezeTimer, duration);
      this.sprite.setTint(0x00f0ff);
      if (!wasFrozen && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '❄️ 빙결!', 0x00f0ff, true);
      }
    } else if (type === 'slow') {
      this.slowTimer = Math.max(this.slowTimer, duration);
      this.slowRatio = value;
      if (this.freezeTimer <= 0 && this.stunTimer <= 0) {
        this.sprite.setTint(0x3388ff);
      }
    } else if (type === 'stun') {
      const wasStunned = this.stunTimer > 0;
      this.stunTimer = Math.max(this.stunTimer, duration);
      if (this.freezeTimer <= 0) {
        this.sprite.setTint(0xffd000);
      }
      if (!wasStunned && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '⚡ 기절!', 0xffd000, true);
      }
    } else if (type === 'bleed') {
      const wasBleeding = this.bleedTimer > 0;
      this.bleedTimer = Math.max(this.bleedTimer, duration);
      this.bleedDps = value;
      if (this.freezeTimer <= 0 && this.stunTimer <= 0) {
        this.sprite.setTint(0xff5566);
      }
      if (!wasBleeding && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '🩸 출혈!', 0xff2244, true);
      }
    } else if (type === 'pull') {
      // 흡인 영역 내부: 이동속도 50% 둔화 적용
      this.slowTimer = Math.max(this.slowTimer, duration);
      this.slowRatio = Math.max(this.slowRatio, 0.5);
    } else if (type === 'shock') {
      const wasShocked = this.shockTimer > 0;
      this.shockTimer = Math.max(this.shockTimer, duration);
      this.shockAmp = Math.max(this.shockAmp, value);
      this.slowTimer = Math.max(this.slowTimer, duration);
      this.slowRatio = Math.max(this.slowRatio, 0.30);
      if (this.freezeTimer <= 0 && this.stunTimer <= 0) {
        this.sprite.setTint(0xaa88ff);
      }
      if (!wasShocked && typeof (this.scene as any).showDamageText === 'function') {
        (this.scene as any).showDamageText(this.x, this.y - 20, '⚡ 감전!', 0xbb88ff, true);
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

    // 피격 플래시 복구
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.sprite.clearTint();
        if (this.freezeTimer > 0) this.sprite.setTint(0x00f0ff);
        else if (this.stunTimer > 0) this.sprite.setTint(0xffd000);
        else if (this.shockTimer > 0) this.sprite.setTint(0xaa88ff);
        else if (this.slowTimer > 0) this.sprite.setTint(0x3388ff);
        else if (this.bleedTimer > 0) this.sprite.setTint(0xff5566);
        else if (this.isElite) this.sprite.setTint(0xffd700);
      }
    }

    // 빙결 및 기절 체크
    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;

      // 얼음 결정 & 얼음 큐브 오버레이 실시간 렌더링
      if (this.iceGraphics) {
        this.iceGraphics.clear();
        const boxSize = this.radius * 2.2;
        const boxX = this.x - boxSize / 2;
        const boxY = this.y - boxSize / 2;
        // 반투명 푸른빛 얼음 블록
        this.iceGraphics.fillStyle(0x00f0ff, 0.35);
        this.iceGraphics.fillRoundedRect(boxX, boxY, boxSize, boxSize, 6);
        // 밝은 하늘색 테두리
        this.iceGraphics.lineStyle(2, 0xaaf0ff, 0.85);
        this.iceGraphics.strokeRoundedRect(boxX, boxY, boxSize, boxSize, 6);
        // 얼음 십자 결정
        this.iceGraphics.lineStyle(1.5, 0xffffff, 0.9);
        this.iceGraphics.lineBetween(this.x, boxY + 3, this.x, boxY + boxSize - 3);
        this.iceGraphics.lineBetween(boxX + 3, this.y, boxX + boxSize - 3, this.y);
      }

      if (this.freezeTimer <= 0) {
        this.sprite.clearTint();
        if (this.isElite) this.sprite.setTint(0xffd700);
        if (this.iceGraphics) this.iceGraphics.clear();
      }

      // 빙결 상태에서는 이동 및 방향 전환 완전 정지! (체력바는 유지)
      this.renderHpBar();
      return;
    } else {
      if (this.iceGraphics) {
        this.iceGraphics.clear();
      }
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      if (this.stunTimer <= 0) {
        this.sprite.clearTint();
        if (this.isElite) this.sprite.setTint(0xffd700);
      }
      this.renderHpBar();
      return;
    }

    // 출혈 피해 (0.5초마다 가시적 틱 데미지 발생)
    if (this.bleedTimer > 0) {
      this.bleedTimer -= dt;
      this.bleedTickTimer -= dt;
      if (this.bleedTickTimer <= 0) {
        this.bleedTickTimer = 0.5;
        let bleedDmg = Math.max(1, Math.round(this.bleedDps * 28));
        if (this.shockTimer > 0) {
          bleedDmg = Math.round(bleedDmg * (1 + this.shockAmp));
        }
        this.hp -= bleedDmg;
        if (typeof (this.scene as any).showDamageText === 'function') {
          (this.scene as any).showDamageText(this.x, this.y - 12, `🩸 ${bleedDmg}`, 0xff3355);
        }
      }

      if (this.hp <= 0) {
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
        if (this.onKilled) {
          this.onKilled(this);
        }
        return;
      }
    }

    // 감전 타이머 갱신
    if (this.shockTimer > 0) {
      this.shockTimer -= dt;
      if (this.shockTimer <= 0) {
        this.shockAmp = 0;
      }
    }

    // 이동 속도 계산 (둔화 적용)
    let currentSpeed = this.speed;
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) {
        this.sprite.clearTint();
        if (this.isElite) this.sprite.setTint(0xffd700);
      } else {
        currentSpeed *= 1 - this.slowRatio;
      }
    }

    // 타겟(플레이어 또는 가까운 소환수)을 향해 이동
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // 몬스터 방향 전환: 16비트 몬스터 원본이 좌측(←) 지향이므로 우측(dx > 0) 이동 시 flipX 적용
    this.sprite.setFlipX(dx > 0);

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

    // 뱀서류 걷기 바운스 & 워블 애니메이션
    this.walkAnimTimer += dt * 11;
    const bounceY = Math.abs(Math.sin(this.walkAnimTimer)) * -3.0;
    const wobbleRot = Math.sin(this.walkAnimTimer) * 0.055;

    this.sprite.setPosition(this.x, this.y + bounceY);
    this.sprite.setRotation(wobbleRot);
    this.shadowArc.setPosition(this.x, this.y + (this.isBoss ? 38 : this.isNamed ? 25 : this.isElite ? 20 : 16));
    this.renderHpBar();
  }

  private renderHpBar(): void {
    // 정예 / 수문장 / 보스 머리 위 체력바 실시간 렌더링
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
    this.shadowArc.destroy();
    this.sprite.destroy();
  }
}
