import { t } from '../core/I18n';
import { BossPatternId, EnemyBehaviorType, WaveFormationType } from './types';

export interface ArchetypeTuning {
  speedMul: number;
  triggerDist: number;
  telegraphSec: number;
  dashSpeedMul: number;
  dashDuration: number;
  cooldownSec: number;
  fireInterval: number;
  preferredDist: number;
  projSpeed: number;
  projDamageMul: number;
  projColor: number;
  explodeDelay: number;
  explodeRadius: number;
  explodeDamageMul: number;
}

export const ENEMY_ARCHETYPE_CONFIG: Record<EnemyBehaviorType, ArchetypeTuning> = {
  chaser: {
    speedMul: 1.0,
    triggerDist: 0,
    telegraphSec: 0,
    dashSpeedMul: 1.0,
    dashDuration: 0,
    cooldownSec: 0,
    fireInterval: 0,
    preferredDist: 0,
    projSpeed: 0,
    projDamageMul: 0,
    projColor: 0xff5555,
    explodeDelay: 0,
    explodeRadius: 0,
    explodeDamageMul: 0,
  },
  charger: {
    speedMul: 1.05,
    triggerDist: 220,
    telegraphSec: 0.6,
    dashSpeedMul: 2.4,
    dashDuration: 0.42,
    cooldownSec: 3.4,
    fireInterval: 0,
    preferredDist: 0,
    projSpeed: 0,
    projDamageMul: 0,
    projColor: 0xff4422,
    explodeDelay: 0,
    explodeRadius: 0,
    explodeDamageMul: 0,
  },
  ranged: {
    speedMul: 0.9,
    triggerDist: 320,
    telegraphSec: 0.35,
    dashSpeedMul: 1.0,
    dashDuration: 0,
    cooldownSec: 0,
    fireInterval: 2.8,
    preferredDist: 260,
    projSpeed: 225,
    projDamageMul: 0.85,
    projColor: 0xff66cc,
    explodeDelay: 0,
    explodeRadius: 0,
    explodeDamageMul: 0,
  },
  exploder: {
    speedMul: 1.12,
    triggerDist: 0,
    telegraphSec: 0,
    dashSpeedMul: 1.0,
    dashDuration: 0,
    cooldownSec: 0,
    fireInterval: 0,
    preferredDist: 0,
    projSpeed: 0,
    projDamageMul: 0,
    projColor: 0xff8800,
    explodeDelay: 0.45,
    explodeRadius: 75,
    explodeDamageMul: 1.35,
  },
};

export interface BossPatternConfig {
  cooldownSec: number;
  telegraphSec: number;
  dashSpeed: number;
  dashDuration: number;
  ringCount: number;
  ringRadius: number;
  ringDamageMul: number;
  barrageCount: number;
  barrageProjSpeed: number;
  barrageDamageMul: number;
  phase2HpRatio: number;
}

export const BOSS_PATTERN_CONFIG: Record<BossPatternId, BossPatternConfig> = {
  telegraph_dash: {
    cooldownSec: 5.5,
    telegraphSec: 0.8,
    dashSpeed: 390,
    dashDuration: 0.55,
    ringCount: 0,
    ringRadius: 0,
    ringDamageMul: 1.35,
    barrageCount: 0,
    barrageProjSpeed: 0,
    barrageDamageMul: 0,
    phase2HpRatio: 0.5,
  },
  aoe_ring: {
    cooldownSec: 6.2,
    telegraphSec: 1.0,
    dashSpeed: 0,
    dashDuration: 0,
    ringCount: 4,
    ringRadius: 72,
    ringDamageMul: 1.25,
    barrageCount: 0,
    barrageProjSpeed: 0,
    barrageDamageMul: 0,
    phase2HpRatio: 0.5,
  },
  radial_barrage: {
    cooldownSec: 5.8,
    telegraphSec: 0.65,
    dashSpeed: 0,
    dashDuration: 0,
    ringCount: 0,
    ringRadius: 0,
    ringDamageMul: 0,
    barrageCount: 10,
    barrageProjSpeed: 220,
    barrageDamageMul: 0.9,
    phase2HpRatio: 0.5,
  },
};

export const MAX_ENEMY_PROJECTILES = 60;

export const WAVE_SCALING_CONFIG = {
  // baseEnemyHp(110 ~ 720) 기준 웨이브별 배율 (초반 경쾌한 처치 유지)
  waveHpMul: [0, 0.42, 0.65, 0.92, 1.25, 1.6, 2.0],
  waveAtkMul: [0, 0.7, 0.85, 1.0, 1.18, 1.38, 1.6],
  eliteHpMul: 5.5,
  eliteAtkMul: 1.45,
  namedHpMul: 20.0,
  namedAtkMul: 1.6,
  bossHpMul: 48.0,
  bossAtkMul: 2.0,
  endlessHpStepPerMin: 0.35,
  endlessAtkStepPerMin: 0.2,
};

export interface WaveFormationEvent {
  triggerTimeSec: number;
  type: WaveFormationType;
  count: number;
  bannerText: string;
}

export const WAVE_FORMATION_EVENTS: WaveFormationEvent[] = [
  {
    triggerTimeSec: 100,
    type: 'ring',
    count: 16,
    bannerText: t('⚠️ 포위망 형성! 사방에서 괴수가 몰려옵니다!', '⚠️ Encirclement! Monsters swarm from every side!'),
  },
  {
    triggerTimeSec: 200,
    type: 'pincer_rush',
    count: 12,
    bannerText: t('⚠️ 양측 협공 러시! 좌우 돌파에 대비하세요!', '⚠️ Pincer Rush! Brace for a breakthrough from left and right!'),
  },
  {
    triggerTimeSec: 300,
    type: 'ring',
    count: 20,
    bannerText: t('⚠️ 대군단 포위! 돌파구를 열어 탈출하세요!', '⚠️ Grand Legion Siege! Break through and escape!'),
  },
];

export function getBehaviorForMonsterIndex(monsterIdx: number, wave: number): EnemyBehaviorType {
  if (wave <= 1) return 'chaser';
  switch (monsterIdx) {
    case 2:
      return 'charger';
    case 3:
      return 'ranged';
    case 4:
      return 'exploder';
    case 1:
    default:
      return 'chaser';
  }
}
