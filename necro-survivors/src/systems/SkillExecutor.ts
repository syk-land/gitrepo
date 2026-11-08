import Phaser from 'phaser';
import { SkillData, SkillLevelData } from '../data/types';
import { ISkillCaster } from '../entities/ISkillCaster';
import { Projectile } from '../entities/Projectile';
import { Enemy } from '../entities/Enemy';
import { SpatialHashGrid } from '../core/SpatialHashGrid';

export class SkillExecutor {
  public static execute(
    caster: ISkillCaster,
    skill: SkillData,
    level: number,
    scene: Phaser.Scene,
    grid: SpatialHashGrid<Enemy>,
    projectiles: Projectile[],
    onSpawnMinion?: (minionId: string, count: number) => void
  ): void {
    const lvIndex = Math.min(level - 1, skill.levels.length - 1);
    const lvData: SkillLevelData = skill.levels[lvIndex];
    if (!lvData) return;

    const casterPos = caster.getPosition();
    const stats = caster.getEffectiveStats();

    // 1. 소환 스킬인 경우 군단 소환 콜백 트리거
    if (skill.category === 'summon' && skill.summonMinionId && onSpawnMinion) {
      const minionCount = lvData.projectileCount + stats.bonusMinionCount;
      onSpawnMinion(skill.summonMinionId, minionCount);
      return;
    }

    // 2. 발사 투사체 수 계산 (기본 + 패시브 추가 투사체)
    const totalProjectiles = Math.max(1, lvData.projectileCount + stats.bonusProjectiles);
    const finalDamage = Math.round(stats.damageMul * lvData.damageCoeff * 45);
    const finalRadius = Math.round(lvData.areaRadius * stats.areaMul);
    const finalKnockback = lvData.knockbackForce;
    const finalSpeed = 340 * stats.projectileSpeedMul;

    // 타겟팅 방향 결정
    let baseDirX = caster.getFacingDirection().x || 1;
    let baseDirY = caster.getFacingDirection().y || 0;

    if (skill.targeting === 'nearest') {
      const nearest = grid.findNearest(casterPos.x, casterPos.y, 450);
      if (nearest) {
        const dx = nearest.x - casterPos.x;
        const dy = nearest.y - casterPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        baseDirX = dx / dist;
        baseDirY = dy / dist;
      }
    } else if (skill.targeting === 'highest_hp') {
      const highest = grid.findHighestHp(casterPos.x, casterPos.y, 500);
      if (highest) {
        const dx = highest.x - casterPos.x;
        const dy = highest.y - casterPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        baseDirX = dx / dist;
        baseDirY = dy / dist;
      }
    } else if (skill.targeting === 'random') {
      const ang = Math.random() * Math.PI * 2;
      baseDirX = Math.cos(ang);
      baseDirY = Math.sin(ang);
    }

    // 3. 투사체 생성 (부채꼴 분기 또는 다중 공전)
    if (skill.behavior === 'orbit') {
      // 궤도 회전형 (본 아머, 휠윈드)
      const angleStep = (Math.PI * 2) / totalProjectiles;
      for (let i = 0; i < totalProjectiles; i++) {
        const p = new Projectile(
          scene,
          skill.id,
          casterPos.x,
          casterPos.y,
          'orbit',
          finalDamage,
          lvData.pierceCount,
          lvData.duration,
          finalRadius,
          finalKnockback,
          1,
          0,
          finalSpeed,
          lvData.statusEffect,
          caster,
          i * angleStep
        );
        projectiles.push(p);
      }
    } else if (skill.behavior === 'ground_zone' || skill.behavior === 'instant_strike') {
      // 장판형 / 즉시 낙하형 (블랙홀, 성역, 단두대)
      const count = Math.min(3, totalProjectiles);
      for (let i = 0; i < count; i++) {
        let spawnX = casterPos.x;
        let spawnY = casterPos.y;

        if (skill.targeting === 'nearest') {
          const nearest = grid.findNearest(casterPos.x, casterPos.y, 350);
          if (nearest) {
            spawnX = nearest.x + (Math.random() * 40 - 20);
            spawnY = nearest.y + (Math.random() * 40 - 20);
          }
        } else if (skill.targeting === 'random') {
          const randDist = 60 + Math.random() * 120;
          const randAng = Math.random() * Math.PI * 2;
          spawnX = casterPos.x + Math.cos(randAng) * randDist;
          spawnY = casterPos.y + Math.sin(randAng) * randDist;
        }

        const p = new Projectile(
          scene,
          skill.id,
          spawnX,
          spawnY,
          skill.behavior,
          finalDamage,
          lvData.pierceCount,
          lvData.duration,
          finalRadius,
          finalKnockback,
          0,
          0,
          0,
          lvData.statusEffect
        );
        projectiles.push(p);
      }
    } else {
      // 직선 / 부채꼴 / 유도 / 연쇄형
      const baseAngle = Math.atan2(baseDirY, baseDirX);
      const spreadStep = 0.14; // 약 8도 간격 부채꼴 분산
      const startAngle = baseAngle - ((totalProjectiles - 1) * spreadStep) / 2;

      for (let i = 0; i < totalProjectiles; i++) {
        const curAngle = startAngle + i * spreadStep;
        const dirX = Math.cos(curAngle);
        const dirY = Math.sin(curAngle);

        const p = new Projectile(
          scene,
          skill.id,
          casterPos.x,
          casterPos.y,
          skill.behavior,
          finalDamage,
          lvData.pierceCount,
          lvData.duration,
          finalRadius,
          finalKnockback,
          dirX,
          dirY,
          finalSpeed,
          lvData.statusEffect
        );
        projectiles.push(p);
      }
    }
  }
}
