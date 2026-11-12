// =========================================================================
// 《목적을 잃지 않는 사령군주: 서바이버즈》 TypeScript 마스터 타입 정의 (types.ts)
// =========================================================================

export interface CombatStats {
  maxHp: number;
  hpRegenPerSec: number;     // 초당 체력 회복
  armor: number;             // 방어력 (고정 피해 감소)
  moveSpeed: number;         // 기본 160 (px/sec)
  pickupRadius: number;      // 경험치 보석 자석 반경 (기본 90px)
  damageMul: number;         // 공격력 배율 (기본 1.0)
  critRate: number;          // 치명타 확률 (기본 0.15)
  critDamage: number;        // 치명타 피해 배율 (기본 1.5)
  cooldownMul: number;       // 쿨타임 배율 (기본 1.0, 최소 0.25)
  areaMul: number;           // 범위/크기 배율 (기본 1.0)
  projectileSpeedMul: number;// 투사체 속도 배율 (기본 1.0)
  bonusProjectiles: number;  // 추가 투사체 수 (기본 0)
  minionDamageMul: number;   // 소환수 공격력 배율 (기본 1.0)
  minionHpMul: number;       // 소환수 최대체력 배율 (기본 1.0)
  bonusMinionCount: number;  // 추가 해골 소환 개체수 (기본 0)
  minionCountMul?: number;   // 소환수 수량 증폭 배율 (기본 1.0, +10%당 +0.1, 최대 2.0)
  expMul: number;            // 경험치 획득 배율 (기본 1.0)
  goldMul: number;           // 마력석(골드) 획득 배율 (기본 1.0)
  startLevel?: number;       // 초기 시작 레벨 보너스 (기본 0, 최대 2)
}

export type TargetingType =
  | 'nearest'        // 가장 가까운 적
  | 'highest_hp'     // 화면 내 최대 체력이 가장 높은 적 (보스/엘리트 우선)
  | 'random'         // 화면 내 무작위 적
  | 'facing'         // 조이스틱 이동 방향
  | 'circular_orbit' // 시전자 주변 360도 공전
  | 'self_aoe';      // 시전자 중심 장판/폭발

export type ProjectileBehavior =
  | 'straight'       // 직선 비행
  | 'homing'         // 유도 추적
  | 'cone_slash'     // 전방 부채꼴 참격
  | 'ground_zone'    // 지면 설치형 지속 장판 (블랙홀, 성역 등)
  | 'chain'          // 적에게서 적에게로 튕기는 연쇄 벼락
  | 'instant_strike' // 목표 지점 즉시 낙하 (메테오, 빙하, 단두대)
  | 'orbit';         // 시전자 주위 회전

export interface StatusEffect {
  type: 'slow' | 'freeze' | 'stun' | 'bleed' | 'pull';
  chance: number;          // 0.0 ~ 1.0
  duration: number;        // 초
  value?: number;          // 둔화율(0.4) 또는 초당 도트 계수
}

export interface SkillLevelData {
  level: number;             // 1 ~ 5 (각성 스킬은 1 고정)
  description: string;
  damageCoeff: number;       // 기본 공격력 대비 계수 (예: 1.8 = 180%)
  cooldown: number;          // 재사용 대기시간(초)
  projectileCount: number;   // 발사체 수 (소환 스킬은 기본 소환 마릿수)
  areaRadius: number;        // 타격 반경(px) 또는 투사체 크기 배율
  pierceCount: number;       // 관통 횟수 (999 = 무한 관통)
  duration: number;          // 투사체/장판 유지 시간(초)
  knockbackForce: number;    // 넉백 거리(px)
  statusEffect?: StatusEffect;
  statModifiers?: Array<{
    stat: keyof CombatStats;
    op: 'add' | 'mul';
    value: number;           // 레벨당 증가치
  }>;
}

export interface SkillData {
  id: string;
  name: string;
  icon: string;              // assets/pixel_vfx/skills/vfx_*.png
  category: 'weapon' | 'summon' | 'passive' | 'awakened';
  isNecroSignature: boolean; // 강령술사 고유 스킬 여부 (레벨업 가중치 우대)
  targeting: TargetingType;
  behavior: ProjectileBehavior;
  summonMinionId?: string;   // category === 'summon'일 때 소환할 유닛 ID
  evolvesFrom?: string;      // 각성 스킬인 경우 원본 액티브 스킬 ID
  requiredPassiveId?: string;// 각성에 필요한 짝꿍 패시브 ID
  tier?: 1 | 2;              // 1: 하위(기초) 스킬, 2: 상위(심화) 스킬
  prerequisiteSkillId?: string; // 상위 스킬 등장에 필요한 선행 하위 스킬 ID
  prerequisiteLevel?: number;   // 선행 스킬 요구 레벨 (기본 3)
  maxLevel: number;          // 일반 액티브/패시브 = 5, 각성 = 1
  levels: SkillLevelData[];
}

export interface MinionDef {
  id: 'skeleton_warrior' | 'skeleton_archer' | 'skeleton_mage' | 'arthur' | 'drone';
  name: string;
  sprite: string;
  combatRole: 'melee_blocker' | 'ranged_orbit';
  baseHpRatio: number;       // 플레이어 maxHp 대비 비율
  baseAtkRatio: number;      // 플레이어 공격력 대비 비율
  attackInterval: number;    // 공격 주기(초)
  attackRange: number;       // 사거리(px)
  moveSpeed: number;         // 이동 속도(px/sec)
  respawnSeconds: number;    // 사망 후 자동 부활까지 걸리는 시간(초)
  bodyRadius: number;        // 적의 이동을 막는 길막 물리 반경(px)
}

export interface RegionData {
  regionId: number;          // 1 ~ 14
  name: string;
  gateType: 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  gateName: string;
  battleBg: string;          // assets/ui/regions/battle_bg_{r}.png
  monsters: [string, string, string, string]; // W1 ~ W4
  named: string;             // W5 수문장
  boss: string;              // W6 최종 보스
  baseEnemyHp: number;
  baseEnemyAtk: number;
}

export interface TraitTalentDef {
  id: string;
  name: string;
  category: 'trait' | 'talent';
  desc: string;
  baseVal: number;
  statKey: keyof CombatStats | 'enemyHpReduction' | 'doubleCastChance' | 'lowHpDamageReduction';
  maxLevel: number;          // 기본 10
}

export interface SaveData {
  version: number;
  gold: number;
  highestClearedRegion: number; // 0이면 1지역 입장 가능
  selectedRegion: number;
  traits: Record<string, number>; // id -> level (1~10)
  talents: Record<string, number>;
  masterSlotId: string | null;   // 만렙 특성/재능 장착 시 1.5배 증폭
  hasAdFreePass: boolean;
  lastLogoutTime: number;        // 방치 보상 계산용 타임스탬프
}
