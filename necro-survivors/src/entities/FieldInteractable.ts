import Phaser from 'phaser';
import { CURSED_SHRINE_CONFIG, FIELD_PROP_CONFIG, FieldDropType, rollFieldDropType } from '../data/fieldEventsData';

export class FieldProp {
  public x: number;
  public y: number;
  public radius: number = FIELD_PROP_CONFIG.propRadius;
  public active: boolean = true;
  public isBroken: boolean = false;
  public dropType: FieldDropType;

  private graphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private pulseTimer: number = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.dropType = rollFieldDropType();

    this.graphics = scene.add.graphics().setDepth(14);
    this.label = scene.add
      .text(x, y - 24, '🏺 영혼 항아리', {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '10px',
        color: '#ffe28a',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(15);

    this.redraw();
  }

  private redraw(): void {
    this.graphics.clear();
    if (!this.isBroken) {
      // 파괴 전: 붉은 금테 항아리/화로
      this.graphics.fillStyle(0x5c2e1f, 0.95);
      this.graphics.fillCircle(this.x, this.y, 16);
      this.graphics.lineStyle(2, 0xffd066, 0.9);
      this.graphics.strokeCircle(this.x, this.y, 16);
      this.graphics.fillStyle(0xffaa33, 0.7);
      this.graphics.fillCircle(this.x, this.y - 4, 6);
    } else {
      // 파괴 후 드랍 아이템 표시
      const colorMap: Record<FieldDropType, number> = {
        meat: 0xff5566,
        magnet: 0x33ccff,
        bomb: 0xff8800,
        gold: 0xffd700,
      };
      this.graphics.fillStyle(colorMap[this.dropType], 0.9);
      this.graphics.fillCircle(this.x, this.y, 12);
      this.graphics.lineStyle(2, 0xffffff, 0.9);
      this.graphics.strokeCircle(this.x, this.y, 12);
    }
  }

  public breakProp(): void {
    if (this.isBroken || !this.active) return;
    this.isBroken = true;
    const labelMap: Record<FieldDropType, string> = {
      meat: '🍖 회복 육포',
      magnet: '🧲 영혼 자석',
      bomb: '💣 영혼 폭탄',
      gold: '💰 골드 주머니',
    };
    this.label.setText(labelMap[this.dropType]);
    this.redraw();
  }

  public update(dt: number): void {
    if (!this.active) return;
    if (this.isBroken) {
      this.pulseTimer += dt * 5;
      this.label.setY(this.y - 24 + Math.sin(this.pulseTimer) * 3);
    }
  }

  public destroy(): void {
    this.active = false;
    this.graphics.destroy();
    this.label.destroy();
  }
}

export class CursedShrine {
  public x: number;
  public y: number;
  public radius: number = CURSED_SHRINE_CONFIG.captureRadius;
  public progress: number = 0; // 0.0 ~ 1.0
  public active: boolean = true;

  private graphics: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;

    this.graphics = scene.add.graphics().setDepth(9);
    this.label = scene.add
      .text(x, y - 34, '⛩️ 저주받은 제단 (점령 0%)', {
        fontFamily: 'NeoDunggeunmo, monospace',
        fontSize: '12px',
        color: '#ff66cc',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(16);

    this.redraw();
  }

  public update(dt: number, playerX: number, playerY: number, captureSpeedMul: number = 1.0): boolean {
    if (!this.active) return false;

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const inside = dx * dx + dy * dy <= this.radius * this.radius;

    if (inside) {
      this.progress = Math.min(
        1,
        this.progress + (dt * captureSpeedMul) / CURSED_SHRINE_CONFIG.captureDurationSec
      );
      this.label.setText(`⛩️ 저주 제단 점령 중 (${Math.round(this.progress * 100)}%)`);
      this.redraw();
      if (this.progress >= 1) {
        this.active = false;
        return true;
      }
    }
    return false;
  }

  private redraw(): void {
    const g = this.graphics;
    g.clear();
    g.fillStyle(0x661188, 0.16);
    g.fillCircle(this.x, this.y, this.radius);
    g.lineStyle(2, 0xcc44ff, 0.65);
    g.strokeCircle(this.x, this.y, this.radius);

    if (this.progress > 0) {
      g.lineStyle(5, 0x00ffaa, 0.95);
      g.beginPath();
      g.arc(
        this.x,
        this.y,
        this.radius - 4,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * this.progress,
        false
      );
      g.strokePath();
    }

    // 중앙 제단 기둥 심볼
    g.fillStyle(0xff44aa, 0.85);
    g.fillCircle(this.x, this.y, 12);
  }

  public destroy(): void {
    this.active = false;
    this.graphics.destroy();
    this.label.destroy();
  }
}
