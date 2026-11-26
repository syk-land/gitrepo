import Phaser from 'phaser';
import { ElementTag } from '../data/types';
import { ELEMENTAL_REACTIONS, MAX_REACTION_VFX_PER_FRAME, REACTION_COOLDOWN_SEC } from '../data/synergyData';
import { Enemy } from '../entities/Enemy';
import { SpatialHashGrid } from '../core/SpatialHashGrid';

export class ElementalReactionSystem {
  public static applyElementStatus(enemy: Enemy, element: ElementTag): void {
    if (!enemy.active) return;
    if (element === 'fire' && Math.random() < 0.35) {
      enemy.applyStatus('burn', 2.5, 0.45);
    } else if ((element === 'dark' || element === 'necro') && Math.random() < 0.45) {
      enemy.applyStatus('curse', 3.5, 0.15);
    } else if ((element === 'slash' || element === 'spear') && Math.random() < 0.35) {
      enemy.applyStatus('bleed', 3.0, 0.4);
    } else if (element === 'lightning' && Math.random() < 0.35) {
      enemy.applyStatus('shock', 2.5, 0.3);
    }
  }

  public static checkAndTrigger(
    scene: Phaser.Scene,
    enemy: Enemy,
    element: ElementTag,
    baseDamage: number,
    grid: SpatialHashGrid<Enemy>
  ): void {
    if (!enemy.active || enemy.reactionCd > 0) return;

    for (const def of ELEMENTAL_REACTIONS) {
      if (!def.triggerElements.includes(element)) continue;

      const hasStatus =
        (def.requiredStatus === 'freeze' && enemy.freezeTimer > 0) ||
        (def.requiredStatus === 'bleed' && enemy.bleedTimer > 0) ||
        (def.requiredStatus === 'curse' && enemy.curseTimer > 0) ||
        (def.requiredStatus === 'shock' && enemy.shockTimer > 0);

      if (!hasStatus) continue;

      enemy.reactionCd = REACTION_COOLDOWN_SEC;
      const reactionDmg = Math.max(15, Math.round(baseDamage * def.damageMul));
      const battle = scene as any;

      if (typeof battle.canSpawnReactionVfx !== 'function' || battle.canSpawnReactionVfx(MAX_REACTION_VFX_PER_FRAME)) {
        if (typeof battle.createNovaVFX === 'function') {
          battle.createNovaVFX(enemy.x, enemy.y, def.radius, def.color);
        }
        if (typeof battle.showDamageText === 'function') {
          battle.showDamageText(enemy.x, enemy.y - 26, def.badgeText, def.color, true);
        }
      }

      if (def.id === 'melt') {
        // 융해 폭염: 빙결 해제 대신 집중 증폭 피해
        enemy.freezeTimer = 0;
        enemy.takeDamage(reactionDmg, 0, 0, def.sourceId);
        const nearby = grid.queryRadius(enemy.x, enemy.y, def.radius);
        for (const other of nearby) {
          if (other !== enemy && other.active) {
            other.takeDamage(Math.round(reactionDmg * 0.55), 0, 0, def.sourceId);
          }
        }
      } else {
        const hits = grid.queryRadius(enemy.x, enemy.y, def.radius);
        for (const target of hits) {
          if (!target.active) continue;
          target.takeDamage(reactionDmg, 0, 0, def.sourceId);
          if (def.id === 'superconduct') {
            target.applyStatus('shock', 2.5, 0.35);
          } else if (def.id === 'holy_purge') {
            target.applyStatus('stun', 1.5, 0);
          }
        }

        if (def.id === 'blood_burst' && battle.player && battle.player.isAlive()) {
          const maxHp = battle.player.getEffectiveStats().maxHp;
          battle.player.hp = Math.min(maxHp, battle.player.hp + 2);
        }
      }

      return;
    }
  }
}
