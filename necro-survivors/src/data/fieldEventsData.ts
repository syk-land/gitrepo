export type FieldDropType = 'meat' | 'magnet' | 'bomb' | 'gold';

export const DASH_CONFIG = {
  baseCooldown: 3.5,
  minCooldown: 1.8,
  duration: 0.22,
  speed: 520,
  invulnSec: 0.24,
  afterimageCount: 3,
};

export const EXTRACTION_CONFIG = {
  baseChance: 0.5,
  necroBranchChance: 1.0,
  lifetimeSec: 20.0,
  maxTempMinions: 4,
};

export const FIELD_PROP_CONFIG = {
  spawnIntervalSec: 45,
  maxActiveProps: 4,
  propRadius: 22,
  dropWeights: [
    { type: 'meat' as FieldDropType, weight: 25 },
    { type: 'magnet' as FieldDropType, weight: 20 },
    { type: 'bomb' as FieldDropType, weight: 15 },
    { type: 'gold' as FieldDropType, weight: 40 },
  ],
  meatHealRatio: 0.3,
  goldBonusBase: 120,
};

export const CURSED_SHRINE_CONFIG = {
  spawnIntervalSec: 120,
  captureRadius: 110,
  captureDurationSec: 5.0,
  runDamageBonusPerShrine: 0.15,
};

export const FEVER_CONFIG = {
  killsRequired: 100,
  durationSec: 10.0,
  moveSpeedBonus: 0.2,
  cooldownBonus: 0.2,
};

export const HITSTOP_CONFIG = {
  durationMs: 35,
  timeScale: 0.08,
};

export function rollFieldDropType(): FieldDropType {
  const total = FIELD_PROP_CONFIG.dropWeights.reduce((acc, w) => acc + w.weight, 0);
  let r = Math.random() * total;
  for (const item of FIELD_PROP_CONFIG.dropWeights) {
    r -= item.weight;
    if (r <= 0) return item.type;
  }
  return 'gold';
}
