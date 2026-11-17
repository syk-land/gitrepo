import Phaser from 'phaser';

export class ExpGem {
  public x: number;
  public y: number;
  public expValue: number;
  public goldValue: number;
  public active: boolean = true;
  private sprite: Phaser.GameObjects.Sprite;
  private glowSprite: Phaser.GameObjects.Arc;
  private isAttracted: boolean = false;
  private attractSpeed: number = 0;
  private recoilTimer: number = 0;
  public lifeTimer: number = 40.0; // 40초 후 자동 소멸 (미수집 렉 방지 및 보석 생성 유지)

  constructor(scene: Phaser.Scene, x: number, y: number, exp: number = 10, gold: number = 2) {
    this.x = x;
    this.y = y;
    this.expValue = exp;
    this.goldValue = gold;

    // 색상 및 16비트 보석 텍스처 결정
    const color = this.getColorForExp(exp);
    const texKey = this.getTextureForExp(exp);

    this.glowSprite = scene.add.circle(x, y, 11, color, 0.28).setDepth(11);
    this.sprite = scene.add.sprite(x, y, texKey).setDisplaySize(20, 20).setDepth(12);
  }

  private getTextureForExp(exp: number): string {
    if (exp >= 100) return 'gem_ruby';
    if (exp >= 40) return 'gem_gold';
    if (exp >= 20) return 'gem_jade';
    return 'gem_cyan';
  }

  private getColorForExp(exp: number): number {
    if (exp >= 100) return 0xff2a6d; // 붉은 루비
    if (exp >= 40) return 0xffd000;  // 황금 보석
    if (exp >= 20) return 0x00ffaa;  // 비취색 보석
    return 0x00f0ff;                // 시안 청옥
  }

  public reset(x: number, y: number, exp: number, gold: number = 2): void {
    this.x = x;
    this.y = y;
    this.expValue = exp;
    this.goldValue = gold;
    this.active = true;
    this.isAttracted = false;
    this.attractSpeed = 0;
    this.recoilTimer = 0;
    this.lifeTimer = 40.0;

    const color = this.getColorForExp(exp);
    const texKey = this.getTextureForExp(exp);
    this.sprite.setTexture(texKey).setPosition(x, y).setDisplaySize(20, 20).setVisible(true).setAlpha(1.0);
    this.glowSprite.setPosition(x, y).setFillStyle(color, 0.28).setVisible(true).setAlpha(0.28);
  }

  public merge(otherExp: number, otherGold: number): void {
    this.expValue += otherExp;
    this.goldValue += otherGold;
    this.lifeTimer = 40.0; // 병합 시 수명 연장
    const color = this.getColorForExp(this.expValue);
    const texKey = this.getTextureForExp(this.expValue);
    this.sprite.setTexture(texKey);
    this.glowSprite.setFillStyle(color, 0.28);
    const sz = Math.min(30, 20 + this.expValue * 0.06);
    this.sprite.setDisplaySize(sz, sz);
  }

  public update(dt: number, playerX: number, playerY: number, pickupRadius: number): boolean {
    if (!this.active) return false;

    // 1. 미수집 수명 체크 (문제점 11: 일정시간 이상 안먹은 경험치/골드 삭제)
    if (!this.isAttracted) {
      this.lifeTimer -= dt;
      if (this.lifeTimer <= 0) {
        this.destroyVisuals();
        this.active = false;
        return false;
      }
      if (this.lifeTimer < 5.0) {
        const blinkAlpha = Math.floor(this.lifeTimer * 6) % 2 === 0 ? 0.2 : 0.8;
        this.sprite.setAlpha(blinkAlpha);
        this.glowSprite.setAlpha(blinkAlpha * 0.4);
      }
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;

    // 2. 자석 범위 안으로 진입
    if (!this.isAttracted && distSq <= pickupRadius * pickupRadius) {
      this.isAttracted = true;
      this.recoilTimer = 0.04;
      this.attractSpeed = 360; // 즉시 빠른 초속 부여
      this.sprite.setAlpha(1.0);
      this.glowSprite.setAlpha(0.35);
    }

    if (this.isAttracted) {
      if (this.recoilTimer > 0) {
        this.recoilTimer -= dt;
        const dist = Math.sqrt(distSq) || 1;
        this.x -= (dx / dist) * 25 * dt;
        this.y -= (dy / dist) * 25 * dt;
      } else {
        // 플레이어를 향해 빠른 가속 (문제점 7: 흡인력 체감 강화)
        this.attractSpeed = Math.min(1600, this.attractSpeed + 1400 * dt);
        const dist = Math.sqrt(distSq) || 1;
        this.x += (dx / dist) * this.attractSpeed * dt;
        this.y += (dy / dist) * this.attractSpeed * dt;

        // 플레이어에게 닿음 (수집 완료)
        if (dist <= 28) {
          this.destroyVisuals();
          this.active = false;
          return true;
        }
      }

      this.sprite.setPosition(this.x, this.y);
      this.glowSprite.setPosition(this.x, this.y);
    }

    return false;
  }

  public forceAttractAll(): void {
    this.isAttracted = true;
    this.recoilTimer = 0;
    this.attractSpeed = 650;
  }

  public destroyVisuals(): void {
    this.sprite.setVisible(false);
    this.glowSprite.setVisible(false);
  }

  public destroy(): void {
    this.sprite.destroy();
    this.glowSprite.destroy();
  }
}
