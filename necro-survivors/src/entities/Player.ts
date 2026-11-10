import Phaser from 'phaser';
import { CombatStats, SkillData } from '../data/types';
import { ISkillCaster, Vector2 } from './ISkillCaster';
import { ALL_SKILLS_MAP } from '../data/skillsData';
import { ALL_ALTAR_MAP, getAltarEffectiveValue } from '../data/altarData';
import { SaveManager } from '../core/SaveManager';

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
  public facingDir: Vector2 = { x: 1, y: 0 };
  private moveTimer: number = 0;

  constructor(scene: Phaser.Scene, x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;

    // 시작 스킬 세팅: 해골 군단 소환은 사령군주 고유 기본 소환수로 장착 (주무기는 시작 모달에서 1개 선택)
    this.activeSkills.set('necro_legion', 1);
    this.skillCooldowns.set('necro_legion', 0);

    const initialStats = this.getEffectiveStats();
    this.maxHp = initialStats.maxHp;
    this.hp = this.maxHp;

    this.sprite = scene.add.sprite(x, y, 'hero_nemesis');
    this.sprite.setDisplaySize(64, 64);
    this.sprite.setDepth(25);
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
      minionDamageMul: 1.0,
      minionHpMul: 1.0,
      bonusMinionCount: 0,
      expMul: 1.0,
      goldMul: 1.0,
    };

    // 1. 영혼 각인의 제단 (영구 특성/재능) 적용
    for (const [id, lv] of Object.entries(save.traits)) {
      const def = ALL_ALTAR_MAP.get(id);
      if (!def || lv <= 0) continue;
      const isMaster = save.masterSlotId === id;
      const val = getAltarEffectiveValue(def, lv, isMaster);
      if (def.statKey in stats) {
        if (def.statKey === 'pickupRadius') {
          stats.pickupRadius += Math.round(95 * val); // 자석 반경 % 증폭 실반영
        } else if (def.statKey === 'maxHp') {
          stats.maxHp += Math.round(200 * val);
        } else if (def.statKey === 'moveSpeed') {
          stats.moveSpeed += Math.round(165 * val);
        } else {
          (stats[def.statKey as keyof CombatStats] as number) += val;
        }
      }
    }
    for (const [id, lv] of Object.entries(save.talents)) {
      const def = ALL_ALTAR_MAP.get(id);
      if (!def || lv <= 0) continue;
      const isMaster = save.masterSlotId === id;
      const val = getAltarEffectiveValue(def, lv, isMaster);
      if (def.statKey in stats) {
        if (def.statKey === 'cooldownMul') {
          stats.cooldownMul = Math.max(0.35, stats.cooldownMul - val);
        } else if (def.statKey === 'bonusMinionCount') {
          stats.bonusMinionCount += Math.floor(val);
        } else {
          (stats[def.statKey as keyof CombatStats] as number) += val;
        }
      }
    }

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

  public takeDamage(amount: number): boolean {
    if (this.invulnTimer > 0 || this.hp <= 0) return false;

    const stats = this.getEffectiveStats();
    const finalDamage = Math.max(5, Math.round(amount - stats.armor));
    this.hp -= finalDamage;
    this.invulnTimer = 0.5; // 0.5초 피격 무적 시간 (i-frame)

    this.sprite.setTintFill(0xffffff);
    setTimeout(() => {
      if (this.sprite.active) this.sprite.clearTint();
    }, 60);

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

      // 이동 중 상하 바운스 모션 연출
      this.moveTimer += dt;
      const bounceY = Math.sin(this.moveTimer * 14) * 3;
      this.sprite.setPosition(this.x, this.y + bounceY);
    } else {
      this.sprite.setPosition(this.x, this.y);
    }
  }

  public update(dt: number): void {
    if (this.invulnTimer > 0) {
      this.invulnTimer -= dt;
      // 반투명 깜빡임
      this.sprite.setAlpha(Math.floor(this.invulnTimer * 20) % 2 === 0 ? 0.4 : 1.0);
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
  }

  public isJinBlizzard(): boolean {
    return this.activeSkills.has('awakened_spear');
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
