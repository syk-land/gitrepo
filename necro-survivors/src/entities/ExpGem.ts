import Phaser from 'phaser';

export class ExpGem {
  public x: number;
  public y: number;
  public expValue: number;
  public goldValue: number;
  public active: boolean = true;
  private sprite: Phaser.GameObjects.Arc;
  private glowSprite: Phaser.GameObjects.Arc;
  private isAttracted: boolean = false;
  private attractSpeed: number = 0;
  private recoilTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, exp: number = 10, gold: number = 2) {
    this.x = x;
    this.y = y;
    this.expValue = exp;
    this.goldValue = gold;

    // 색상 결정: 10 미만 청록, 50 미만 황금, 50 이상 보라/루비
    const color = this.getColorForExp(exp);

    this.glowSprite = scene.add.circle(x, y, 10, color, 0.4).setDepth(11);
    this.sprite = scene.add.circle(x, y, 5, color, 1.0).setDepth(12);
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

    const color = this.getColorForExp(exp);
    this.sprite.setPosition(x, y).setFillStyle(color, 1.0).setVisible(true);
    this.glowSprite.setPosition(x, y).setFillStyle(color, 0.35).setVisible(true);
  }

  public merge(otherExp: number, otherGold: number): void {
    this.expValue += otherExp;
    this.goldValue += otherGold;
    const color = this.getColorForExp(this.expValue);
    this.sprite.setFillStyle(color, 1.0);
    this.glowSprite.setFillStyle(color, 0.35);
    this.sprite.setScale(Math.min(2.0, 1.0 + this.expValue * 0.005));
  }

  public update(dt: number, playerX: number, playerY: number, pickupRadius: number): boolean {
    if (!this.active) return false;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distSq = dx * dx + dy * dy;

    // 자석 범위 안으로 진입
    if (!this.isAttracted && distSq <= pickupRadius * pickupRadius) {
      this.isAttracted = true;
      this.recoilTimer = 0.08; // 0.08초 살짝 반동
    }

    if (this.isAttracted) {
      if (this.recoilTimer > 0) {
        this.recoilTimer -= dt;
        // 살짝 뒤로 물러나는 쥬스 연출
        const dist = Math.sqrt(distSq) || 1;
        this.x -= (dx / dist) * 40 * dt;
        this.y -= (dy / dist) * 40 * dt;
      } else {
        // 플레이어를 향해 가속
        this.attractSpeed += 800 * dt;
        const dist = Math.sqrt(distSq) || 1;
        this.x += (dx / dist) * this.attractSpeed * dt;
        this.y += (dy / dist) * this.attractSpeed * dt;

        // 플레이어에게 닿음 (수집 완료)
        if (dist <= 24) {
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
    this.attractSpeed = 450;
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
