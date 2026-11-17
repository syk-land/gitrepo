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
    const isShield = skill.id === 'necro_armor' || skill.id === 'awakened_armor';
    const isAxe = skill.id === 'ber_whirlwind' || skill.id === 'awakened_whirlwind';
    // 회전도끼/발키리는 다중 유지이므로 틱 데미지를 조정 (일회용 홀리 방패는 강력 45)
    const baseDamageScale = isShield && lvData.pierceCount < 999 ? 45 : isAxe || (isShield && lvData.pierceCount >= 999) ? 14 : 25;
    const finalDamage = Math.round(stats.damageMul * lvData.damageCoeff * baseDamageScale);
    const finalRadius = Math.round(lvData.areaRadius * stats.areaMul);
    const finalKnockback = lvData.knockbackForce;
    const finalSpeed = 340 * stats.projectileSpeedMul;

    // 타겟팅 방향 결정 (화면 내 유효한 적 우선 조준)
    const cam = scene.cameras?.main;
    const isValidTarget = (e: Enemy) => {
      if (!e.active) return false;
      if (!cam) return true;
      return Math.abs(e.x - cam.midPoint.x) <= cam.width * 0.58 &&
             Math.abs(e.y - cam.midPoint.y) <= cam.height * 0.58;
    };

    let baseDirX = caster.getFacingDirection().x || 1;
    let baseDirY = caster.getFacingDirection().y || 0;

    if (skill.targeting === 'nearest' || skill.id === 'sm_dragon') {
      const candidates = grid.queryRadius(casterPos.x, casterPos.y, 520).filter(isValidTarget);
      let nearest: Enemy | null = null;
      let minD = Infinity;
      for (const e of candidates) {
        const d = (e.x - casterPos.x) ** 2 + (e.y - casterPos.y) ** 2;
        if (d < minD) {
          minD = d;
          nearest = e;
        }
      }
      if (nearest) {
        const dx = nearest.x - casterPos.x;
        const dy = nearest.y - casterPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        baseDirX = dx / dist;
        baseDirY = dy / dist;
      }
    } else if (skill.targeting === 'highest_hp') {
      const candidates = grid.queryRadius(casterPos.x, casterPos.y, 500).filter(isValidTarget);
      let highest: Enemy | null = null;
      let maxHp = -1;
      for (const e of candidates) {
        if (e.hp > maxHp) {
          maxHp = e.hp;
          highest = e;
        }
      }
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

    // 인게임 전용 투사체 VFX 텍스처 우선 적용 (UI 아이콘과 분리)
    const vfxKey = scene.textures.exists(`vfx_${skill.id}`) ? `vfx_${skill.id}` : skill.id;

    // 3. 투사체 생성 (부채꼴 분기 또는 다중 공전)
    if (skill.behavior === 'orbit') {
      const currentOrbiters = projectiles.filter((p) => p.active && p.skillId === skill.id);
      const maxAllowed = totalProjectiles;
      const isPermanentOrbit = lvData.pierceCount >= 999;

      if (isPermanentOrbit) {
        // [영구 공전체: 회전 도끼 / 발키리 부대 등]: 수량이 변경되면 기존 것을 정리하고 360도 균등 재배치
        if (currentOrbiters.length !== maxAllowed) {
          for (const oldP of currentOrbiters) {
            oldP.destroyVisuals();
            oldP.active = false;
          }
          for (let i = 0; i < maxAllowed; i++) {
            const angleOffset = ((Math.PI * 2) / maxAllowed) * i;
            const p = new Projectile(
              scene,
              vfxKey,
              casterPos.x,
              casterPos.y,
              'orbit',
              finalDamage,
              999, // 영구 유지 무한 관통
              9999,
              finalRadius,
              finalKnockback,
              1,
              0,
              finalSpeed,
              lvData.statusEffect,
              caster,
              angleOffset,
              skill.id,
              stats.critRate,
              stats.critDamage
            );
            projectiles.push(p);
          }
        }
      } else {
        // [홀리 아머 방패]: 피격 시 소모되는 일회용 방패! 쿨타임마다 최대 보관 수량까지 보충
        if (currentOrbiters.length < maxAllowed) {
          const needed = maxAllowed - currentOrbiters.length;
          // 1, 2개일 때는 1개씩, 4, 8, 16개일 때는 한번에 최소 2~4개씩 빠르게 보충
          const batch = Math.min(needed, Math.max(1, Math.floor(maxAllowed / 4)));
          const baseAngle = currentOrbiters.length > 0 ? currentOrbiters[0].orbitAngle : 0;
          for (let i = 0; i < batch; i++) {
            const p = new Projectile(
              scene,
              vfxKey,
              casterPos.x,
              casterPos.y,
              'orbit',
              finalDamage,
              lvData.pierceCount, // 레벨별 타격 횟수 후 파괴
              lvData.duration || 9999,
              finalRadius,
              finalKnockback,
              1,
              0,
              finalSpeed,
              lvData.statusEffect,
              caster,
              0,
              skill.id,
              stats.critRate,
              stats.critDamage
            );
            projectiles.push(p);
            currentOrbiters.push(p);
          }
          // 전체 방패 각도 360도 균등 재정렬
          for (let i = 0; i < currentOrbiters.length; i++) {
            currentOrbiters[i].orbitAngle = baseAngle + ((Math.PI * 2) / currentOrbiters.length) * i;
          }
        }
      }
    } else if (skill.behavior === 'ground_zone' || skill.behavior === 'instant_strike') {
      // 장판형 / 즉시 낙하형
      const isSelfAoe = skill.targeting === 'self_aoe'; // 죽음의 손아귀, 성역 등 캐릭터 중심 시전
      const count = isSelfAoe ? 1 : Math.min(3, totalProjectiles);

      for (let i = 0; i < count; i++) {
        let spawnX = casterPos.x;
        let spawnY = casterPos.y;

        if (!isSelfAoe) {
          if (skill.targeting === 'nearest') {
            const nearest = grid.findNearest(casterPos.x, casterPos.y, 350);
            if (nearest && isValidTarget(nearest)) {
              spawnX = nearest.x + (Math.random() * 40 - 20);
              spawnY = nearest.y + (Math.random() * 40 - 20);
            }
          } else if (skill.targeting === 'random') {
            const randDist = 60 + Math.random() * 120;
            const randAng = Math.random() * Math.PI * 2;
            spawnX = casterPos.x + Math.cos(randAng) * randDist;
            spawnY = casterPos.y + Math.sin(randAng) * randDist;
          }
        }

        const p = new Projectile(
          scene,
          vfxKey,
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
          lvData.statusEffect,
          isSelfAoe ? caster : undefined, // 캐릭터 중심 시전기는 플레이어 좌표 실시간 추종
          0,
          skill.id,
          stats.critRate,
          stats.critDamage
        );
        projectiles.push(p);
      }
    } else if (skill.id === 'necro_bone_storm' || skill.id === 'awakened_dragon') {
      // [본 스톰 / 진 청룡참]: 전방위 360도 균등 방사
      const step = (Math.PI * 2) / totalProjectiles;
      const speedMul = skill.id === 'necro_bone_storm' ? 1.15 : 1.0;
      const jitter = skill.id === 'necro_bone_storm' ? 0.12 : 0;
      for (let i = 0; i < totalProjectiles; i++) {
        const curAngle = i * step + Math.random() * jitter;
        const dirX = Math.cos(curAngle);
        const dirY = Math.sin(curAngle);

        const p = new Projectile(
          scene,
          vfxKey,
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
          finalSpeed * speedMul,
          lvData.statusEffect,
          undefined,
          0,
          skill.id,
          stats.critRate,
          stats.critDamage
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
          vfxKey,
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
          lvData.statusEffect,
          undefined,
          0,
          skill.id,
          stats.critRate,
          stats.critDamage
        );
        projectiles.push(p);
      }
    }
  }
}
