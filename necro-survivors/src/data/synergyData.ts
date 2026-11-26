import { t } from '../core/I18n';
import { ElementTag, ReactionId } from './types';

export interface ReactionDef {
  id: ReactionId;
  name: string;
  sourceId: string;
  requiredStatus: 'freeze' | 'bleed' | 'curse' | 'shock';
  triggerElements: ElementTag[];
  damageMul: number;
  radius: number;
  color: number;
  badgeText: string;
}

export const REACTION_COOLDOWN_SEC = 1.2;
export const MAX_REACTION_VFX_PER_FRAME = 6;

export const ELEMENTAL_REACTIONS: ReactionDef[] = [
  {
    id: 'superconduct',
    name: t('초전도 파쇄', 'Superconduct Shatter'),
    sourceId: 'reaction_superconduct',
    requiredStatus: 'freeze',
    triggerElements: ['lightning'],
    damageMul: 2.2,
    radius: 130,
    color: 0x77eeff,
    badgeText: t('⚡❄️ 초전도 파쇄!', '⚡❄️ Superconduct Shatter!'),
  },
  {
    id: 'melt',
    name: t('융해 폭염', 'Meltdown Blaze'),
    sourceId: 'reaction_melt',
    requiredStatus: 'freeze',
    triggerElements: ['fire'],
    damageMul: 2.8,
    radius: 85,
    color: 0xff6622,
    badgeText: t('🔥❄️ 융해 폭염!', '🔥❄️ Meltdown Blaze!'),
  },
  {
    id: 'blood_burst',
    name: t('혈폭', 'Blood Burst'),
    sourceId: 'reaction_blood_burst',
    requiredStatus: 'bleed',
    triggerElements: ['dark', 'necro'],
    damageMul: 1.9,
    radius: 110,
    color: 0xff2255,
    badgeText: t('🩸💀 혈폭!', '🩸💀 Blood Burst!'),
  },
  {
    id: 'holy_purge',
    name: t('성염 정화', 'Holy Flame Purge'),
    sourceId: 'reaction_holy_purge',
    requiredStatus: 'curse',
    triggerElements: ['holy'],
    damageMul: 2.0,
    radius: 140,
    color: 0xffe066,
    badgeText: t('✨ 성염 정화!', '✨ Holy Flame Purge!'),
  },
  {
    id: 'overload_railgun',
    name: t('과부하 레일건', 'Overload Railgun'),
    sourceId: 'reaction_overload_railgun',
    requiredStatus: 'shock',
    triggerElements: ['none', 'sf', 'spear'],
    damageMul: 1.6,
    radius: 95,
    color: 0xbb88ff,
    badgeText: t('⚡ 과부하 관통!', '⚡ Overload Pierce!'),
  },
];

export function getSkillElementTag(skillId: string): ElementTag {
  if (skillId.includes('fire') || skillId.includes('meteor') || skillId.includes('inferno')) return 'fire';
  if (skillId.includes('cryo') || skillId.includes('snowball') || skillId.includes('blizzard')) return 'ice';
  if (skillId.includes('storm') || skillId.includes('thunder') || skillId.includes('chain')) return 'lightning';
  if (skillId.includes('priest') || skillId.includes('armor') || skillId.includes('sanctuary')) return 'holy';
  if (skillId.includes('dk_') || skillId.includes('grip') || skillId.includes('blackhole')) return 'dark';
  if (skillId.includes('legion') || skillId.includes('lich')) return 'necro';
  if (skillId.includes('sm_') || skillId.includes('dragon') || skillId.includes('whirlwind')) return 'slash';
  if (skillId.includes('sniper') || skillId.includes('drone')) return 'sf';
  if (skillId.includes('spear_crimson') || skillId.includes('spear_heaven')) return 'spear';
  return 'none';
}

export function getSynergyHintForNewElement(
  ownedElements: Set<ElementTag>,
  candidateElement: ElementTag
): string | undefined {
  if (candidateElement === 'ice' && (ownedElements.has('lightning') || ownedElements.has('fire'))) {
    return t('⚡🔥 [원소반응: 초전도/융해 시너지]', '⚡🔥 [Reaction: Superconduct/Meltdown Synergy]');
  }
  if (candidateElement === 'lightning' && (ownedElements.has('ice') || ownedElements.has('sf') || ownedElements.has('spear') || ownedElements.has('none'))) {
    return t('⚡ [원소반응: 초전도/과부하 시너지]', '⚡ [Reaction: Superconduct/Overload Synergy]');
  }
  if (candidateElement === 'fire' && ownedElements.has('ice')) {
    return t('🔥❄️ [원소반응: 융해 폭염 시너지]', '🔥❄️ [Reaction: Meltdown Blaze Synergy]');
  }
  if ((candidateElement === 'dark' || candidateElement === 'necro') && (ownedElements.has('slash') || ownedElements.has('spear') || ownedElements.has('holy'))) {
    return t('🩸✨ [원소반응: 혈폭/성염정화 시너지]', '🩸✨ [Reaction: Blood Burst/Holy Flame Purge Synergy]');
  }
  if (candidateElement === 'holy' && (ownedElements.has('dark') || ownedElements.has('necro'))) {
    return t('✨ [원소반응: 성염 정화 시너지]', '✨ [Reaction: Holy Flame Purge Synergy]');
  }
  if ((candidateElement === 'slash' || candidateElement === 'spear') && (ownedElements.has('dark') || ownedElements.has('necro'))) {
    return t('🩸 [원소반응: 혈폭 시너지]', '🩸 [Reaction: Blood Burst Synergy]');
  }
  return undefined;
}
