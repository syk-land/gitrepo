import Phaser from 'phaser';
import { CombatStats } from '../data/types';
import { ISkillCaster, Vector2 } from './ISkillCaster';
import { ALL_SKILLS_MAP } from '../data/skillsData';
import { ALL_ALTAR_MAP, getAltarEffectiveValue } from '../data/altarData';
import { RELICS_MAP } from '../data/relicsData';
import { DASH_CONFIG, FEVER_CONFIG } from '../data/fieldEventsData';
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

  // 그림자 대시 (회피기)
  public dashCooldown: number = 0;
  public dashMaxCooldown: number = DASH_CONFIG.baseCooldown;
  public isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashDirX: number = 1;
  private dashDirY: number = 0;

  // 런 한정 버프 (저주 제단, 피버, 대시 치명타 유물)
  public runDamageBonus: number = 0;
  public feverTimer: number = 0;
  public dashCritBoostTimer: number = 0;
  public tookDamageDuringBoss: boolean = false;

  public sprite: Phaser.GameObjects.Sprite;
  private footShadow: Phaser.GameObjects.Ellipse;
  private necroAuraRing: Phaser.GameObjects.Ellipse;
  public hpBarGraphics: Phaser.GameObjects.Graphics;
  public facingDir: Vector2 = { x: 1, y: 0 };
  private moveTimer: number = 0;
  private currentBounceY: number = 0;

  public knockbackVx: number = 0;
  public knockbackVy: number = 0;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    const initialStats = this.getEffectiveStats();
    this.maxHp = initialStats.maxHp;
    this.hp = this.maxHp;

    this.footShadow = scene.add.ellipse(x, y + 24, 30, 10, 0x000000, 0.5).setDepth(23);
    this.necroAuraRing = scene.add
      .ellipse(x, y + 24, 44, 15, 0x00ffaa, 0.14)
      .setStrokeStyle(1.5, 0x00ffaa, 0.45)
      .setDepth(24);

    this.sprite = scene.add.sprite(x, y, 'hero_nemesis');
    this.sprite.setDisplaySize(54, 54);
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

  public triggerDash(inputX: number, inputY: number): boolean {
    if (this.dashCooldown > 0 || this.isDashing || this.hp <= 0) return false;

    const stats = this.getEffectiveStats();
    const hasMask = SaveManager.getInstance().hasEquippedRelicEffect('dash_crit_boost');
    const cdMul = 1 - (1 - stats.cooldownMul) * 0.5;
    this.dashMaxCooldown = Math.max(
      DASH_CONFIG.minCooldown,
      DASH_CONFIG.baseCooldown * cdMul * (hasMask ? 0.75 : 1.0)
    );
    this.dashCooldown = this.dashMaxCooldown;

    const len = Math.sqrt(inputX * inputX + inputY * inputY);
    if (len > 0.05) {
      this.dashDirX = inputX / len;
      this.dashDirY = inputY / len;
      this.facingDir = { x: this.dashDirX, y: this.dashDirY };
    } else {
      this.dashDirX = this.facingDir.x || 1;
      this.dashDirY = this.facingDir.y || 0;
    }

    // 1지역 보스 유물: 대시 출발 지점에 맹독 장판 생성
    if (
      SaveManager.getInstance().hasEquippedRelicEffect('dash_poison_zone') &&
      typeof (this.scene as any).spawnDashPoisonZone === 'function'
    ) {
      (this.scene as any).spawnDashPoisonZone(this.x, this.y);
    }

    // 6지역 보스 유물: 대시 직후 2초간 치명타 확률 +25%
    if (hasMask) {
      this.dashCritBoostTimer = 2.0;
    }

    this.isDashing = true;
    this.dashTimer = DASH_CONFIG.duration;
    this.invulnTimer = Math.max(this.invulnTimer, DASH_CONFIG.invulnSec);
    SoundEngine.getInstance().playTone(540, 'triangle', 0.12, 0.22, 220);

    // 그림자 잔상 3개 연출
    for (let i = 0; i < DASH_CONFIG.afterimageCount; i++) {
      this.scene.time.delayedCall(i * 55, () => {
        if (!this.sprite.active) return;
        const ghost = this.scene.add
          .sprite(this.x, this.y, 'hero_nemesis')
          .setDisplaySize(54, 54)
          .setFlipX(this.sprite.flipX)
          .setTint(0x00ffaa)
          .setAlpha(0.55)
          .setDepth(24);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          duration: 240,
          onComplete: () => ghost.destroy(),
        });
      });
    }

    return true;
  }

  public getEffectiveStats(): CombatStats {
    const save = SaveManager.getInstance().getData();

    const stats: CombatStats = {
      maxHp: 200,
      hpRegenPerSec: 1.0,
      armor: 5,
      moveSpeed: 165,
      pickupRadius: 95,
      damageMul: 1.0 + this.runDamageBonus,
      critRate: 0.15 + (this.dashCritBoostTimer > 0 ? 0.25 : 0),
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

    // 1. 영혼 각인의 제단 적용
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

    // 2. 장착 보스 영혼 유물 3슬롯 적용
    for (const relicId of save.equippedRelics ?? []) {
      const relic = RELICS_MAP.get(relicId);
      if (!relic?.statBonuses) continue;
      for (const [key, val] of Object.entries(relic.statBonuses)) {
        if (typeof val !== 'number') continue;
        const statKey = key as keyof CombatStats;
        (stats[statKey] as number) = ((stats[statKey] as number) ?? 0) + val;
      }
    }

    // 3. 인게임 패시브 스킬 적용
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

    // 4. 연속 처치 피버 버프 적용
    if (this.feverTimer > 0) {
      stats.moveSpeed = Math.round(stats.moveSpeed * (1 + FEVER_CONFIG.moveSpeedBonus));
      stats.cooldownMul = Math.max(0.25, stats.cooldownMul * (1 - FEVER_CONFIG.cooldownBonus));
    }

    stats.cooldownMul = Math.max(0.25, stats.cooldownMul);
    return stats;
  }

  public takeDamage(amount: number, knockbackDirX: number = 0, knockbackDirY: number = 0): boolean {
    if (this.invulnTimer > 0 || this.isDashing || this.hp <= 0) return false;

    const stats = this.getEffectiveStats();
    const finalDamage = Math.max(5, Math.round(amount - stats.armor));
    this.hp = Math.max(0, this.hp - finalDamage);
    this.invulnTimer = 0.65;

    if ((this.scene as any)?.waveSpawner?.bossInstance?.active) {
      this.tookDamageDuringBoss = true;
    }

    if (knockbackDirX !== 0 || knockbackDirY !== 0) {
      const knockbackSpeed = 420;
      this.knockbackVx = knockbackDirX * knockbackSpeed;
      this.knockbackVy = knockbackDirY * knockbackSpeed;
    }

    this.sprite.setTint(0xff3333);
    setTimeout(() => {
      if (this.sprite && this.sprite.active) this.sprite.clearTint();
    }, 120);

    if (typeof (this.scene as any).showDamageText === 'function') {
      (this.scene as any).showDamageText(this.x, this.y - 30, `-${finalDamage}`, 0xff3333, false);
    }

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
    if (this.isDashing) {
      this.x += this.dashDirX * DASH_CONFIG.speed * dt;
      this.y += this.dashDirY * DASH_CONFIG.speed * dt;
      this.sprite.setFlipX(this.dashDirX < 0);
      this.sprite.setPosition(this.x, this.y);
      this.footShadow.setPosition(this.x, this.y + 24);
      this.necroAuraRing.setPosition(this.x, this.y + 24);
      this.renderHpBar(0);
      return;
    }

    const stats = this.getEffectiveStats();
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0.05) {
      const nx = dx / len;
      const ny = dy / len;
      this.facingDir = { x: nx, y: ny };

      this.x += nx * stats.moveSpeed * dt;
      this.y += ny * stats.moveSpeed * dt;

      this.sprite.setFlipX(nx < 0);

      this.moveTimer += dt * 12;
      this.currentBounceY = Math.abs(Math.sin(this.moveTimer)) * -4.0;
      this.sprite.setPosition(this.x, this.y + this.currentBounceY);
      this.sprite.setRotation(Math.sin(this.moveTimer) * 0.055);
      this.footShadow.setPosition(this.x, this.y + 24);
      this.necroAuraRing.setPosition(this.x, this.y + 24);
      this.renderHpBar(this.currentBounceY);
    } else {
      this.moveTimer += dt * 4.5;
      this.currentBounceY = Math.abs(Math.sin(this.moveTimer)) * -2.2;
      this.sprite.setPosition(this.x, this.y + this.currentBounceY);
      this.sprite.setRotation(0);
      this.footShadow.setPosition(this.x, this.y + 24);
      this.necroAuraRing.setPosition(this.x, this.y + 24);
      this.renderHpBar(this.currentBounceY);
    }
  }

  public update(dt: number): void {
    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }
    if (this.feverTimer > 0) {
      this.feverTimer = Math.max(0, this.feverTimer - dt);
      this.necroAuraRing.setStrokeStyle(2.5, 0xffd000, 0.85);
    } else {
      this.necroAuraRing.setStrokeStyle(1.5, 0x00ffaa, 0.45);
    }
    if (this.dashCritBoostTimer > 0) {
      this.dashCritBoostTimer = Math.max(0, this.dashCritBoostTimer - dt);
    }

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
      this.sprite.setAlpha(Math.floor(this.invulnTimer * 16) % 2 === 0 ? 0.45 : 1.0);
      if (this.invulnTimer <= 0) {
        this.sprite.setAlpha(1.0);
      }
    }

    const stats = this.getEffectiveStats();
    this.maxHp = stats.maxHp;
    if (this.hp < stats.maxHp) {
      this.hp = Math.min(stats.maxHp, this.hp + stats.hpRegenPerSec * dt);
    }

    if (this.ultCooldown > 0) {
      this.ultCooldown = Math.max(0, this.ultCooldown - dt);
    }

    this.renderHpBar(this.currentBounceY);
  }

  public renderHpBar(bounceY: number = 0): void {
    if (!this.hpBarGraphics || !this.sprite.active) return;
    this.hpBarGraphics.clear();

    const barW = 42;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y + bounceY - 34;

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
