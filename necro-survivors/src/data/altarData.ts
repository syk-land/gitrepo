import { TraitTalentDef } from './types';

// =========================================================================
// 1. 전투 특성 9종 (공격/쿨타임/투사체개수/치명/범위/소환공격 등)
// =========================================================================
export const COMBAT_TRAITS: TraitTalentDef[] = [
  { id: 'trait_might', name: '⚔️ 공격력 증폭', category: 'trait', desc: '모든 스킬 피해량 +10% 증가', baseVal: 0.10, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_cooldown', name: '⏱️ 쿨타임 단축', category: 'trait', desc: '모든 스킬 기본 쿨타임 -4% 단축', baseVal: 0.04, statKey: 'cooldownMul', maxLevel: 10 },
  { id: 'trait_bonus_projectiles', name: '🔱 투사체 개수 증가', category: 'trait', desc: '모든 발사 스킬 투사체 +1발 추가 발사 (최대 +2발)', baseVal: 1, statKey: 'bonusProjectiles', maxLevel: 2 },
  { id: 'trait_hawk_eye', name: '🎯 치명타 확률', category: 'trait', desc: '치명타 발생 확률 +5% 증가', baseVal: 0.05, statKey: 'critRate', maxLevel: 10 },
  { id: 'trait_crit_damage', name: '💥 치명타 피해', category: 'trait', desc: '치명타 적중 시 피해 배율 +15% 증가', baseVal: 0.15, statKey: 'critDamage', maxLevel: 10 },
  { id: 'trait_area', name: '💎 스킬 범위', category: 'trait', desc: '모든 스킬 및 폭발 효과 범위 +8% 증가', baseVal: 0.08, statKey: 'areaMul', maxLevel: 10 },
  { id: 'trait_holy_grace', name: '🏹 투사체 속도', category: 'trait', desc: '투사체 비행 속도 +8% 증가', baseVal: 0.08, statKey: 'projectileSpeedMul', maxLevel: 10 },
  { id: 'trait_undead_cmd', name: '💀 소환수 공격력', category: 'trait', desc: '해골/사령 소환수 공격력 +12% 증가', baseVal: 0.12, statKey: 'minionDamageMul', maxLevel: 10 },
  { id: 'trait_minion_hp', name: '🪖 소환수 체력', category: 'trait', desc: '해골/사령 소환수 최대 체력 +15% 증가', baseVal: 0.15, statKey: 'minionHpMul', maxLevel: 10 },
];

// =========================================================================
// 2. 생존 및 성장 특성 9종 (초기레벨/체력/방어/재생/이속/자석 등)
// =========================================================================
export const SURVIVAL_TRAITS: TraitTalentDef[] = [
  { id: 'trait_start_level', name: '🌟 초기 레벨 증가', category: 'talent', desc: '출정 시 추가 레벨 획득 후 시작 (최대 +2Lv)', baseVal: 1, statKey: 'startLevel', maxLevel: 2 },
  { id: 'trait_iron_body', name: '❤️ 최대 체력', category: 'talent', desc: '플레이어 최대 체력 +20 HP 증가', baseVal: 0.10, statKey: 'maxHp', maxLevel: 10 },
  { id: 'trait_armor', name: '🛡️ 방어력', category: 'talent', desc: '피격 시 고정 피해 감소 방어력 +3', baseVal: 3.0, statKey: 'armor', maxLevel: 10 },
  { id: 'trait_hp_regen', name: '🩸 체력 재생', category: 'talent', desc: '초당 체력 지속 회복량 +1.5 HP/초', baseVal: 1.5, statKey: 'hpRegenPerSec', maxLevel: 10 },
  { id: 'trait_shadow_step', name: '💨 이동 속도', category: 'talent', desc: '기본 이동 속도 +10px/s 증가', baseVal: 0.06, statKey: 'moveSpeed', maxLevel: 10 },
  { id: 'trait_mana_flow', name: '🌀 자석 반경', category: 'talent', desc: '경험치 보석 흡인 반경 +15px 증가', baseVal: 0.15, statKey: 'pickupRadius', maxLevel: 10 },
  { id: 'trait_minion_count', name: '👥 소환수 수량', category: 'talent', desc: '해골 소환수 최대 유지 수 +1기 증원', baseVal: 0.2, statKey: 'bonusMinionCount', maxLevel: 10 },
  { id: 'talent_merchant', name: '💰 골드 획득', category: 'talent', desc: '전투 중 마력석(골드) 획득량 +15% 증가', baseVal: 0.15, statKey: 'goldMul', maxLevel: 10 },
  { id: 'talent_exp_surge', name: '📖 경험치 획득', category: 'talent', desc: '몬스터 처치 경험치 획득량 +12% 증가', baseVal: 0.12, statKey: 'expMul', maxLevel: 10 },
];

// 하위 호환용 내보내기
export const TRAITS_DATA: TraitTalentDef[] = COMBAT_TRAITS;
export const TALENTS_DATA: TraitTalentDef[] = SURVIVAL_TRAITS;

// 레거시 세이브 호환용 추가 맵
export const LEGACY_ALTAR_ITEMS: TraitTalentDef[] = [
  { id: 'trait_frost_heart', name: '❄️ 극한의 심장', category: 'trait', desc: '모든 공격력 증폭', baseVal: 0.10, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_boss_slayer', name: '⚔️ 학살자의 투기', category: 'trait', desc: '보스 대상 추가 피해', baseVal: 0.12, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_blood_vamp', name: '🩸 포식자의 본능', category: 'trait', desc: '초당 체력 회복량 증가', baseVal: 1.5, statKey: 'hpRegenPerSec', maxLevel: 10 },
  { id: 'trait_thorn_armor', name: '🌵 가시 갑옷', category: 'trait', desc: '기본 고정 방어력 증가', baseVal: 3.0, statKey: 'armor', maxLevel: 10 },
  { id: 'talent_cooldown', name: '⏱️ 초월적 연산', category: 'talent', desc: '모든 액티브 스킬 쿨타임 감소', baseVal: 0.04, statKey: 'cooldownMul', maxLevel: 10 },
  { id: 'talent_gate_breaker', name: '💥 차원문 파쇄자', category: 'talent', desc: '괴수 체력 감소', baseVal: 0.04, statKey: 'enemyHpReduction', maxLevel: 10 },
  { id: 'talent_blacksmith', name: '🔨 군단 무기고', category: 'talent', desc: '소환수 공격력 증폭', baseVal: 0.10, statKey: 'minionDamageMul', maxLevel: 10 },
  { id: 'talent_relic_finder', name: '💎 심연의 직관', category: 'talent', desc: '스킬 효과 범위 증가', baseVal: 0.08, statKey: 'areaMul', maxLevel: 10 },
  { id: 'talent_double_cast', name: '⚡ 이중 영창', category: 'talent', desc: '투사체 1발 추가 확률', baseVal: 0.05, statKey: 'doubleCastChance', maxLevel: 10 },
  { id: 'talent_immortal_will', name: '🛡️ 불멸의 의지', category: 'talent', desc: '피해 감소', baseVal: 0.05, statKey: 'lowHpDamageReduction', maxLevel: 10 },
  { id: 'talent_legion_surge', name: '🪖 망자의 군세', category: 'talent', desc: '해골 소환수 수량 증가', baseVal: 0.2, statKey: 'bonusMinionCount', maxLevel: 10 },
  { id: 'talent_overcharge', name: '🔮 마력 과충전', category: 'talent', desc: '필살기 쿨타임 감소', baseVal: 0.05, statKey: 'cooldownMul', maxLevel: 10 },
];

export const ALL_ALTAR_MAP: Map<string, TraitTalentDef> = new Map([
  ...COMBAT_TRAITS.map((t) => [t.id, t] as [string, TraitTalentDef]),
  ...SURVIVAL_TRAITS.map((t) => [t.id, t] as [string, TraitTalentDef]),
  ...LEGACY_ALTAR_ITEMS.map((t) => [t.id, t] as [string, TraitTalentDef]),
]);

// 강화 비용 계산 공식 (고가치 2단계 특성은 별도 고가 책정)
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

// 레벨별 효과 배율 계산
export function getAltarEffectiveValue(
  def: TraitTalentDef,
  level: number,
  isMasterEquipped: boolean
): number {
  if (level <= 0) return 0;
  if (def.id === 'trait_start_level' || def.id === 'trait_bonus_projectiles') {
    return level;
  }
  const mult = 1 + 0.5 * (level - 1);
  let val = def.baseVal * mult;
  if (isMasterEquipped) {
    val *= 1.5;
  }
  return val;
}

// UI 표시용 현재 수치 포맷팅 헬퍼 (단일 스탯 맞춤 표시)
export function formatAltarBonus(def: TraitTalentDef, level: number): string {
  if (level <= 0) return '현재: 미각인 (Lv.0)';
  const val = getAltarEffectiveValue(def, level, false);
  switch (def.statKey) {
    case 'bonusProjectiles':
      return level >= 2 ? '현재 효과: 투사체 +2발 추가 (최대)' : level === 1 ? '현재 효과: 투사체 +1발 추가' : '현재: 미각인 (추가 없음)';
    case 'startLevel':
      return level >= 2 ? '현재 효과: +2레벨 시작 (Lv.3 출정)' : level === 1 ? '현재 효과: +1레벨 시작 (Lv.2 출정)' : '현재: 미각인 (Lv.1 시작)';
    case 'damageMul':
      return `현재 효과: +${Math.round(val * 100)}% 공격력`;
    case 'cooldownMul':
      return `현재 효과: -${Math.round(val * 100)}% 쿨타임`;
    case 'maxHp':
      return `현재 효과: +${Math.round(200 * val)} HP`;
    case 'armor':
      return `현재 효과: +${Math.round(val)} 방어력`;
    case 'hpRegenPerSec':
      return `현재 효과: +${val.toFixed(1)} HP/초`;
    case 'critRate':
      return `현재 효과: +${Math.round(val * 100)}% 치명타율`;
    case 'critDamage':
      return `현재 효과: +${Math.round(val * 100)}% 치명타피해`;
    case 'moveSpeed':
      return `현재 효과: +${Math.round(165 * val)} 속도`;
    case 'pickupRadius':
      return `현재 효과: +${Math.round(95 * val)}px 자석반경`;
    case 'areaMul':
      return `현재 효과: +${Math.round(val * 100)}% 스킬범위`;
    case 'projectileSpeedMul':
      return `현재 효과: +${Math.round(val * 100)}% 투사체속도`;
    case 'minionDamageMul':
      return `현재 효과: +${Math.round(val * 100)}% 소환수공격`;
    case 'minionHpMul':
      return `현재 효과: +${Math.round(val * 100)}% 소환수체력`;
    case 'bonusMinionCount':
      return `현재 효과: +${Math.floor(val)}기 증원`;
    case 'goldMul':
      return `현재 효과: +${Math.round(val * 100)}% 골드획득`;
    case 'expMul':
      return `현재 효과: +${Math.round(val * 100)}% 경험치획득`;
    default:
      return `현재 적용: Lv.${level}`;
  }
}
