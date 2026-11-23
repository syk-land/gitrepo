import { TraitTalentDef } from './types';

export const COMBAT_TRAITS: TraitTalentDef[] = [
  { id: 'trait_might', name: 'Attack Power', category: 'trait', desc: 'All skill damage +10%', baseVal: 0.10, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_cooldown', name: 'Cooldown Haste', category: 'trait', desc: 'All skill cooldowns -4%', baseVal: 0.04, statKey: 'cooldownMul', maxLevel: 10 },
  { id: 'trait_bonus_projectiles', name: 'Extra Projectiles', category: 'trait', desc: '+1 projectile on all skills (Max +2)', baseVal: 1, statKey: 'bonusProjectiles', maxLevel: 2 },
  { id: 'trait_hawk_eye', name: 'Crit Chance', category: 'trait', desc: 'Critical hit rate +5%', baseVal: 0.05, statKey: 'critRate', maxLevel: 10 },
  { id: 'trait_crit_damage', name: 'Crit Damage', category: 'trait', desc: 'Critical damage multiplier +15%', baseVal: 0.15, statKey: 'critDamage', maxLevel: 10 },
  { id: 'trait_area', name: 'Skill Area', category: 'trait', desc: 'All skill & explosion AoE +8%', baseVal: 0.08, statKey: 'areaMul', maxLevel: 10 },
  { id: 'trait_holy_grace', name: 'Projectile Speed', category: 'trait', desc: 'Projectile flight speed +8%', baseVal: 0.08, statKey: 'projectileSpeedMul', maxLevel: 10 },
  { id: 'trait_undead_cmd', name: 'Minion Attack', category: 'trait', desc: 'Undead summon attack +12%', baseVal: 0.12, statKey: 'minionDamageMul', maxLevel: 10 },
  { id: 'trait_minion_hp', name: 'Minion Max HP', category: 'trait', desc: 'Undead summon max HP +15%', baseVal: 0.15, statKey: 'minionHpMul', maxLevel: 10 },
];

export const SURVIVAL_TRAITS: TraitTalentDef[] = [
  { id: 'trait_start_level', name: 'Starting Level', category: 'talent', desc: 'Start battles with bonus levels (Max +2)', baseVal: 1, statKey: 'startLevel', maxLevel: 2 },
  { id: 'trait_iron_body', name: 'Max HP', category: 'talent', desc: 'Player max HP +20', baseVal: 0.10, statKey: 'maxHp', maxLevel: 10 },
  { id: 'trait_armor', name: 'Armor', category: 'talent', desc: 'Flat damage reduction +3', baseVal: 3.0, statKey: 'armor', maxLevel: 10 },
  { id: 'trait_hp_regen', name: 'HP Regen', category: 'talent', desc: 'HP regeneration +1.5/sec', baseVal: 1.5, statKey: 'hpRegenPerSec', maxLevel: 10 },
  { id: 'trait_shadow_step', name: 'Move Speed', category: 'talent', desc: 'Movement speed +10px/s', baseVal: 0.06, statKey: 'moveSpeed', maxLevel: 10 },
  { id: 'trait_mana_flow', name: 'Magnet Radius', category: 'talent', desc: 'EXP gem pickup range +15px', baseVal: 0.15, statKey: 'pickupRadius', maxLevel: 10 },
  { id: 'trait_minion_count', name: 'Legion Size', category: 'talent', desc: 'All summon counts +10% (Max +100%)', baseVal: 0.10, statKey: 'minionCountMul', maxLevel: 10 },
  { id: 'talent_merchant', name: 'Gold Greed', category: 'talent', desc: 'Battle gold earned +15%', baseVal: 0.15, statKey: 'goldMul', maxLevel: 10 },
  { id: 'talent_exp_surge', name: 'EXP Surge', category: 'talent', desc: 'Monster kill EXP +12%', baseVal: 0.12, statKey: 'expMul', maxLevel: 10 },
];

export const TRAITS_DATA: TraitTalentDef[] = COMBAT_TRAITS;
export const TALENTS_DATA: TraitTalentDef[] = SURVIVAL_TRAITS;

export const LEGACY_ALTAR_ITEMS: TraitTalentDef[] = [
  { id: 'trait_frost_heart', name: 'Frost Heart', category: 'trait', desc: 'Boost all attack power', baseVal: 0.10, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_boss_slayer', name: 'Boss Slayer', category: 'trait', desc: 'Bonus damage vs bosses', baseVal: 0.12, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_blood_vamp', name: 'Blood Instinct', category: 'trait', desc: 'HP regen per second', baseVal: 1.5, statKey: 'hpRegenPerSec', maxLevel: 10 },
  { id: 'trait_thorn_armor', name: 'Thorn Armor', category: 'trait', desc: 'Flat armor increase', baseVal: 3.0, statKey: 'armor', maxLevel: 10 },
  { id: 'talent_cooldown', name: 'Hyper Focus', category: 'talent', desc: 'Reduce skill cooldowns', baseVal: 0.04, statKey: 'cooldownMul', maxLevel: 10 },
  { id: 'talent_gate_breaker', name: 'Gate Breaker', category: 'talent', desc: 'Reduce enemy HP', baseVal: 0.04, statKey: 'enemyHpReduction', maxLevel: 10 },
  { id: 'talent_blacksmith', name: 'Legion Armory', category: 'talent', desc: 'Boost minion attack', baseVal: 0.10, statKey: 'minionDamageMul', maxLevel: 10 },
  { id: 'talent_relic_finder', name: 'Abyssal Sight', category: 'talent', desc: 'Boost skill area', baseVal: 0.08, statKey: 'areaMul', maxLevel: 10 },
  { id: 'talent_double_cast', name: 'Double Cast', category: 'talent', desc: 'Extra projectile chance', baseVal: 0.05, statKey: 'doubleCastChance', maxLevel: 10 },
  { id: 'talent_immortal_will', name: 'Immortal Will', category: 'talent', desc: 'Damage reduction', baseVal: 0.05, statKey: 'lowHpDamageReduction', maxLevel: 10 },
  { id: 'talent_legion_surge', name: 'Legion Surge', category: 'talent', desc: 'Summon count +10%', baseVal: 0.10, statKey: 'minionCountMul', maxLevel: 10 },
  { id: 'talent_overcharge', name: 'Overcharge', category: 'talent', desc: 'Reduce ultimate cooldown', baseVal: 0.05, statKey: 'cooldownMul', maxLevel: 10 },
];

export const ALL_ALTAR_MAP: Map<string, TraitTalentDef> = new Map([
  ...COMBAT_TRAITS.map((t) => [t.id, t] as [string, TraitTalentDef]),
  ...SURVIVAL_TRAITS.map((t) => [t.id, t] as [string, TraitTalentDef]),
  ...LEGACY_ALTAR_ITEMS.map((t) => [t.id, t] as [string, TraitTalentDef]),
]);

export function getAltarUpgradeCost(currentLevel: number, def?: TraitTalentDef): number {
  if (def?.id === 'trait_start_level') {
    return currentLevel <= 0 ? 5000 : 18000;
  }
  if (def?.id === 'trait_bonus_projectiles') {
    return currentLevel <= 0 ? 8000 : 25000;
  }
  const nextLevel = Math.max(1, currentLevel + 1);
  return Math.round(300 * Math.pow(nextLevel, 1.7));
}

export function getAltarEffectiveValue(
  def: TraitTalentDef,
  level: number,
  isMasterEquipped: boolean
): number {
  if (level <= 0) return 0;
  if (def.id === 'trait_start_level' || def.id === 'trait_bonus_projectiles') {
    return level;
  }
  if (def.statKey === 'minionCountMul' || def.id === 'trait_minion_count' || def.id === 'talent_legion_surge') {
    let rate = Math.min(1.0, level * 0.10);
    if (isMasterEquipped) rate = Math.min(1.5, rate * 1.5);
    return rate;
  }
  const mult = 1 + 0.5 * (level - 1);
  let val = def.baseVal * mult;
  if (isMasterEquipped) {
    val *= 1.5;
  }
  return val;
}

export function formatAltarBonus(def: TraitTalentDef, level: number): string {
  if (level <= 0) return 'Current: Locked (Lv.0)';
  const val = getAltarEffectiveValue(def, level, false);
  switch (def.statKey) {
    case 'bonusProjectiles':
      return level >= 2 ? 'Current: +2 Projectiles (MAX)' : 'Current: +1 Projectile';
    case 'startLevel':
      return level >= 2 ? 'Current: Start at Lv.3' : 'Current: Start at Lv.2';
    case 'damageMul':
      return `Current: +${Math.round(val * 100)}% Attack`;
    case 'cooldownMul':
      return `Current: -${Math.round(val * 100)}% Cooldown`;
    case 'maxHp':
      return `Current: +${Math.round(200 * val)} HP`;
    case 'armor':
      return `Current: +${Math.round(val)} Armor`;
    case 'hpRegenPerSec':
      return `Current: +${val.toFixed(1)} HP/s`;
    case 'critRate':
      return `Current: +${Math.round(val * 100)}% Crit Rate`;
    case 'critDamage':
      return `Current: +${Math.round(val * 100)}% Crit DMG`;
    case 'moveSpeed':
      return `Current: +${Math.round(165 * val)} Speed`;
    case 'pickupRadius':
      return `Current: +${Math.round(95 * val)}px Magnet`;
    case 'areaMul':
      return `Current: +${Math.round(val * 100)}% AoE`;
    case 'projectileSpeedMul':
      return `Current: +${Math.round(val * 100)}% Proj Speed`;
    case 'minionDamageMul':
      return `Current: +${Math.round(val * 100)}% Minion ATK`;
    case 'minionHpMul':
      return `Current: +${Math.round(val * 100)}% Minion HP`;
    case 'minionCountMul':
    case 'bonusMinionCount':
      return level >= 10 ? 'Current: +100% Legion Size (MAX)' : `Current: +${Math.round(val * 100)}% Legion Size`;
    case 'goldMul':
      return `Current: +${Math.round(val * 100)}% Gold`;
    case 'expMul':
      return `Current: +${Math.round(val * 100)}% EXP`;
    default:
      return `Current: Lv.${level}`;
  }
}
