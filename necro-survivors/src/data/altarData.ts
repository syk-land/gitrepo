import { TraitTalentDef } from './types';

// =========================================================================
// 1. 특성 10종 (Traits) - 기본 신체 및 직업 능력 강화
// =========================================================================
export const TRAITS_DATA: TraitTalentDef[] = [
  { id: 'trait_iron_body', name: '🛡️ 육체의 기억', category: 'trait', desc: '최대 체력 및 방어력 증가', baseVal: 0.10, statKey: 'maxHp', maxLevel: 10 },
  { id: 'trait_hawk_eye', name: '🦅 매의 눈', category: 'trait', desc: '치명타 확률 및 치명타 피해 증가', baseVal: 0.05, statKey: 'critRate', maxLevel: 10 },
  { id: 'trait_shadow_step', name: '💨 잔상 보법', category: 'trait', desc: '이동 속도 및 회피 기동 증가', baseVal: 0.06, statKey: 'moveSpeed', maxLevel: 10 },
  { id: 'trait_mana_flow', name: '🌀 마력 호흡', category: 'trait', desc: '경험치 자석 반경 및 흡인력 증가', baseVal: 0.15, statKey: 'pickupRadius', maxLevel: 10 },
  { id: 'trait_undead_cmd', name: '💀 사령의 권능', category: 'trait', desc: '소환수 군단 공격력 및 체력 강화', baseVal: 0.12, statKey: 'minionDamageMul', maxLevel: 10 },
  { id: 'trait_frost_heart', name: '❄️ 극한의 심장', category: 'trait', desc: '모든 공격력 및 속성 피해 증폭', baseVal: 0.10, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_boss_slayer', name: '⚔️ 학살자의 투기', category: 'trait', desc: '보스 및 수문장 대상 추가 피해', baseVal: 0.12, statKey: 'damageMul', maxLevel: 10 },
  { id: 'trait_blood_vamp', name: '🩸 포식자의 본능', category: 'trait', desc: '초당 체력 회복량 증가', baseVal: 1.5, statKey: 'hpRegenPerSec', maxLevel: 10 },
  { id: 'trait_thorn_armor', name: '🌵 가시 갑옷', category: 'trait', desc: '기본 고정 방어력 증가', baseVal: 3.0, statKey: 'armor', maxLevel: 10 },
  { id: 'trait_holy_grace', name: '🌟 신성한 은총', category: 'trait', desc: '추가 투사체 속도 및 비행거리 증가', baseVal: 0.08, statKey: 'projectileSpeedMul', maxLevel: 10 },
];

// =========================================================================
// 2. 재능 10종 (Talents) - 전장 유틸리티 및 특수 효과
// =========================================================================
export const TALENTS_DATA: TraitTalentDef[] = [
  { id: 'talent_merchant', name: '💰 거상의 안목', category: 'talent', desc: '전투 중 마력석(골드) 획득량 증가', baseVal: 0.15, statKey: 'goldMul', maxLevel: 10 },
  { id: 'talent_exp_surge', name: '📖 마력 흡수 폭주', category: 'talent', desc: '처치 경험치 획득량 증가', baseVal: 0.12, statKey: 'expMul', maxLevel: 10 },
  { id: 'talent_cooldown', name: '⏱️ 초월적 연산', category: 'talent', desc: '모든 액티브 스킬 쿨타임 감소', baseVal: 0.04, statKey: 'cooldownMul', maxLevel: 10 },
  { id: 'talent_gate_breaker', name: '💥 차원문 파쇄자', category: 'talent', desc: '등장하는 모든 괴수의 체력 감소', baseVal: 0.04, statKey: 'enemyHpReduction', maxLevel: 10 },
  { id: 'talent_blacksmith', name: '🔨 군단 무기고', category: 'talent', desc: '소환수 기본 공격력 증폭', baseVal: 0.10, statKey: 'minionDamageMul', maxLevel: 10 },
  { id: 'talent_relic_finder', name: '💎 심연의 직관', category: 'talent', desc: '스킬 및 폭발 효과 범위 증가', baseVal: 0.08, statKey: 'areaMul', maxLevel: 10 },
  { id: 'talent_double_cast', name: '⚡ 이중 영창', category: 'talent', desc: '투사체 1발 추가 발사 확률', baseVal: 0.05, statKey: 'doubleCastChance', maxLevel: 10 },
  { id: 'talent_immortal_will', name: '🛡️ 불멸의 의지', category: 'talent', desc: '체력 30% 이하 시 받는 피해 감소', baseVal: 0.05, statKey: 'lowHpDamageReduction', maxLevel: 10 },
  { id: 'talent_legion_surge', name: '🪖 망자의 군세', category: 'talent', desc: '해골 소환수 최대 유지 수 증가', baseVal: 0.2, statKey: 'bonusMinionCount', maxLevel: 10 },
  { id: 'talent_overcharge', name: '🔮 마력 과충전', category: 'talent', desc: '수동 필살기(시체 폭발) 쿨타임 감소', baseVal: 0.05, statKey: 'cooldownMul', maxLevel: 10 },
];

export const ALL_ALTAR_MAP: Map<string, TraitTalentDef> = new Map([
  ...TRAITS_DATA.map((t) => [t.id, t] as [string, TraitTalentDef]),
  ...TALENTS_DATA.map((t) => [t.id, t] as [string, TraitTalentDef]),
]);

// 강화 비용 계산 공식: Cost(Lv) = 500 * Lv^2
export function getAltarUpgradeCost(currentLevel: number): number {
  return 500 * currentLevel * currentLevel;
}

// 레벨별 효과 배율 계산: BaseVal * (1 + 0.5 * (Lv - 1))
export function getAltarEffectiveValue(
  def: TraitTalentDef,
  level: number,
  isMasterEquipped: boolean
): number {
  if (level <= 0) return 0;
  const mult = 1 + 0.5 * (level - 1);
  let val = def.baseVal * mult;
  if (isMasterEquipped) {
    val *= 1.5; // 만렙 영혼 각인 슬롯 특전 1.5배 증폭
  }
  return val;
}
