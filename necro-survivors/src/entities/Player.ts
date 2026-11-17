import Phaser from 'phaser';
import { CombatStats, SkillData } from '../data/types';
import { ISkillCaster, Vector2 } from './ISkillCaster';
import { ALL_SKILLS_MAP } from '../data/skillsData';
import { ALL_ALTAR_MAP, getAltarEffectiveValue } from '../data/altarData';
import { SaveManager } from '../core/SaveManager';
import { SoundEngine } from '../core/SoundEngine';

export class Player implements ISkillCaster {
  public x: number = 0;
  public y: number = 0;
  public hp: number;
  public maxHp: number;
  public invulnTimer: number = 0;
  public level: number = 1;
  public currentExp: number = 0;
  public pendingLevelUps: number = 0;

  // 인벤토리: 액티브 최대 6개, 패시브 최대 6개
  public activeSkills = new Map<string, number>();
  public passiveSkills = new Map<string, number>();
  public skillCooldowns = new Map<string, number>();

  // 하단 수동 필살기 (시체 폭발 / 진 블리자드)
  public ultCooldown: number = 0;
  public readonly ultMaxCooldown: number = 12.0;

  public sprite: Phaser.GameObjects.Sprite;
  private footShadow: Phaser.GameObjects.Ellipse;
  private necroAuraRing: Phaser.GameObjects.Ellipse;
  public hpBarGraphics: Phaser.GameObjects.Graphics;
  public facingDir: Vector2 = { x: 1, y: 0 };
  private moveTimer: number = 0;
  private currentBounceY: number = 0;

  // 피격 넉백 물리 가속도
  public knockbackVx: number = 0;
  public knockbackVy: number = 0;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // 시작 스킬은 게임 시작 시 시작 주무기 선택 모달에서 자유롭게 1종을 선택하여 장착
    const initialStats = this.getEffectiveStats();
    this.maxHp = initialStats.maxHp;
    this.hp = this.maxHp;

    this.footShadow = scene.add.ellipse(x, y + 28, 36, 12, 0x000000, 0.5).setDepth(23);
    this.necroAuraRing = scene.add.ellipse(x, y + 28, 52, 18, 0x00ffaa, 0.14).setStrokeStyle(1.5, 0x00ffaa, 0.45).setDepth(24);

    this.sprite = scene.add.sprite(x, y, 'hero_nemesis');
    this.sprite.setDisplaySize(64, 64);
    this.sprite.setDepth(25);

    this.hpBarGraphics = scene.add.graphics();
    this.hpBarGraphics.setDepth(27);
    this.renderHpBar(0);
  }

  public getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  public getFacingDirection(): Vector2 {
    return this.facingDir;
  }

  public isAlive(): boolean {
    return this.hp > 0;
  }

  public getCasterName(): string {
    return '사령군주 최미남';
  }

  // 기본 스탯 + 영혼 각인의 제단 + 인게임 패시브 실시간 합산
  public getEffectiveStats(): CombatStats {
    const save = SaveManager.getInstance().getData();

    const stats: CombatStats = {
      maxHp: 200,
      hpRegenPerSec: 1.0,
      armor: 5,
      moveSpeed: 165,
      pickupRadius: 95,
      damageMul: 1.0,
      critRate: 0.15,
      critDamage: 1.5,
      cooldownMul: 1.0,
      areaMul: 1.0,
      projectileSpeedMul: 1.0,
      bonusProjectiles: 0,
      startLevel: 0,
      minionDamageMul: 1.0,
      minionHpMul: 1.0,
      bonusMinionCount: 0,
      minionCountMul: 1.0,
      expMul: 1.0,
      goldMul: 1.0,
    };

    // 1. 영혼 각인의 제단 (영구 특성/재능) 적용
    const applyAltarRecords = (records: Record<string, number>) => {
      for (const [id, lv] of Object.entries(records)) {
        const def = ALL_ALTAR_MAP.get(id);
        if (!def || lv <= 0) continue;
        const isMaster = save.masterSlotId === id;
        const val = getAltarEffectiveValue(def, lv, isMaster);
        if (def.statKey in stats) {
          if (def.statKey === 'pickupRadius') {
            stats.pickupRadius += Math.round(95 * val);
          } else if (def.statKey === 'maxHp') {
            stats.maxHp += Math.round(200 * val);
          } else if (def.statKey === 'moveSpeed') {
            stats.moveSpeed += Math.round(165 * val);
          } else if (def.statKey === 'cooldownMul') {
            stats.cooldownMul = Math.max(0.35, stats.cooldownMul - val);
          } else if (def.statKey === 'minionCountMul') {
            stats.minionCountMul = (stats.minionCountMul || 1.0) + val;
          } else if (def.statKey === 'bonusMinionCount') {
            stats.bonusMinionCount += Math.round(val);
          } else if (def.statKey === 'bonusProjectiles') {
            stats.bonusProjectiles += Math.min(2, Math.floor(val));
          } else if (def.statKey === 'startLevel') {
            stats.startLevel = (stats.startLevel || 0) + Math.min(2, Math.floor(val));
          } else {
            (stats[def.statKey as keyof CombatStats] as number) += val;
          }
        }
      }
    };
    applyAltarRecords(save.traits);
    applyAltarRecords(save.talents);

    // 2. 인게임 패시브 스킬 8종 적용
    for (const [skillId, level] of this.passiveSkills.entries()) {
      const skill = ALL_SKILLS_MAP.get(skillId);
      if (!skill || level <= 0) continue;
      const lvData = skill.levels[level - 1];
      if (lvData && lvData.statModifiers) {
        for (const mod of lvData.statModifiers) {
          if (mod.op === 'add') {
            (stats[mod.stat] as number) += mod.value;
          } else if (mod.op === 'mul') {
            (stats[mod.stat] as number) *= mod.value;
          }
        }
      }
    }

    // 쿨타임 하한선 보호 (최소 0.25)
    stats.cooldownMul = Math.max(0.25, stats.cooldownMul);

    return stats;
  }

  public takeDamage(amount: number, knockbackDirX: number = 0, knockbackDirY: number = 0): boolean {
    if (this.invulnTimer > 0 || this.hp <= 0) return false;

    const stats = this.getEffectiveStats();
    const finalDamage = Math.max(5, Math.round(amount - stats.armor));
    this.hp -= finalDamage;
    this.invulnTimer = 0.75; // 0.75초 피격 무적 시간 (i-frame)

    // 피격 시 넉백 물리 가속도 부여 (부드러운 감속 넉백)
    if (knockbackDirX !== 0 || knockbackDirY !== 0) {
      const knockbackSpeed = 420; // 420px/s 넉백 속도
      this.knockbackVx = knockbackDirX * knockbackSpeed;
      this.knockbackVy = knockbackDirY * knockbackSpeed;
    }

    // 피격 붉은색 플래시
    this.sprite.setTint(0xff3333);
    setTimeout(() => {
      if (this.sprite && this.sprite.active) this.sprite.clearTint();
    }, 120);

    // 플레이어 머리 위 피격 데미지 텍스트 팝업
    if (typeof (this.scene as any).showDamageText === 'function') {
      (this.scene as any).showDamageText(this.x, this.y - 30, `-${finalDamage}`, 0xff3333, false);
    }

    // 피격 사운드
    SoundEngine.getInstance().playTone(180, 'sawtooth', 0.15, 0.25);

    this.renderHpBar(0);
    return this.hp <= 0;
  }

  public addExp(amount: number): boolean {
    const stats = this.getEffectiveStats();
    const finalExp = Math.round(amount * stats.expMul);
    this.currentExp += finalExp;

    let leveledUp = false;
    let req = this.getRequiredExp(this.level);

    while (this.currentExp >= req) {
      this.currentExp -= req;
      this.level++;
      this.pendingLevelUps++;
      leveledUp = true;
      req = this.getRequiredExp(this.level);
    }

    return leveledUp;
  }

  public getRequiredExp(level: number): number {
    if (level === 1) return 5;
    if (level === 2) return 12;
    if (level === 3) return 22;
    if (level === 4) return 35;
    if (level === 5) return 52;
    if (level === 6) return 75;
    if (level === 7) return 105;
    if (level === 8) return 145;
    if (level === 9) return 195;
    return 195 + (level - 9) * 60 + Math.floor(Math.pow(level - 9, 1.6)) * 15;
  }

  public move(dx: number, dy: number, dt: number): void {
    const stats = this.getEffectiveStats();
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0.05) {
      const nx = dx / len;
      const ny = dy / len;
      this.facingDir = { x: nx, y: ny };

      this.x += nx * stats.moveSpeed * dt;
      this.y += ny * stats.moveSpeed * dt;

      this.sprite.setFlipX(nx < 0);

      // 이동 중 상하 바운스 및 좌우 기울기 모션 연출 (Enemy.ts와 동일한 경쾌한 호핑 바운스)
      this.moveTimer += dt * 12;
      this.currentBounceY = Math.abs(Math.sin(this.moveTimer)) * -4.0;
      this.sprite.setPosition(this.x, this.y + this.currentBounceY);
      this.sprite.setRotation(Math.sin(this.moveTimer) * 0.055);
      this.footShadow.setPosition(this.x, this.y + 28);
      this.necroAuraRing.setPosition(this.x, this.y + 28);
      this.renderHpBar(this.currentBounceY);
    } else {
      // 대기 중에도 다른 캐릭터처럼 부드러운 숨쉬기/바운스 모션 유지
      this.moveTimer += dt * 4.5;
      this.currentBounceY = Math.abs(Math.sin(this.moveTimer)) * -2.2;
      this.sprite.setPosition(this.x, this.y + this.currentBounceY);
      this.sprite.setRotation(0);
      this.footShadow.setPosition(this.x, this.y + 28);
      this.necroAuraRing.setPosition(this.x, this.y + 28);
      this.renderHpBar(this.currentBounceY);
    }
  }

  public update(dt: number): void {
    // 피격 넉백 물리 업데이트 (부드러운 지수 감쇠)
    if (this.knockbackVx !== 0 || this.knockbackVy !== 0) {
      this.x += this.knockbackVx * dt;
      this.y += this.knockbackVy * dt;
      this.sprite.setPosition(this.x, this.y);
      this.footShadow.setPosition(this.x, this.y + 28);
      this.necroAuraRing.setPosition(this.x, this.y + 28);
      this.renderHpBar(0);

      const decay = Math.exp(-dt * 14);
      this.knockbackVx *= decay;
      this.knockbackVy *= decay;
      if (Math.abs(this.knockbackVx) < 8) this.knockbackVx = 0;
      if (Math.abs(this.knockbackVy) < 8) this.knockbackVy = 0;
    }

    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      // 피격 무적 상태일 때 캐릭터 깜빡임 연출
      this.sprite.setAlpha(Math.floor(this.invulnTimer * 16) % 2 === 0 ? 0.35 : 1.0);
      if (this.invulnTimer <= 0) {
        this.sprite.setAlpha(1.0);
      }
    }

    // 초당 체력 회복 및 최대 체력 동기화
    const stats = this.getEffectiveStats();
    this.maxHp = stats.maxHp;
    if (this.hp < stats.maxHp) {
      this.hp = Math.min(stats.maxHp, this.hp + stats.hpRegenPerSec * dt);
    }

    // 필살기 쿨타임 감소
    if (this.ultCooldown > 0) {
      this.ultCooldown = Math.max(0, this.ultCooldown - dt);
    }

    this.renderHpBar(this.currentBounceY);
  }

  public renderHpBar(bounceY: number = 0): void {
    if (!this.hpBarGraphics || !this.sprite.active) return;
    this.hpBarGraphics.clear();

    const barW = 46;
    const barH = 6;
    const barX = this.x - barW / 2;
    const barY = this.y + bounceY - 38;

    // 바깥 어두운 배경 및 테두리
    this.hpBarGraphics.fillStyle(0x0c0908, 0.85);
    this.hpBarGraphics.lineStyle(1.5, 0x3d3024, 1);
    this.hpBarGraphics.strokeRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);
    this.hpBarGraphics.fillRoundedRect(barX - 1, barY - 1, barW + 2, barH + 2, 2);

    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const fillColor = ratio > 0.5 ? 0x00ff88 : ratio > 0.25 ? 0xffaa00 : 0xff2244;
    this.hpBarGraphics.fillStyle(fillColor, 1.0);
    this.hpBarGraphics.fillRoundedRect(barX, barY, Math.max(2, barW * ratio), barH, 2);
  }

  public isJinBlizzard(): boolean {
    return this.activeSkills.has('awakened_spear');
  }

  public destroy(): void {
    this.footShadow.destroy();
    this.necroAuraRing.destroy();
    this.sprite.destroy();
    this.hpBarGraphics.destroy();
  }
}
