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
    name: '초전도 파쇄',
    sourceId: 'reaction_superconduct',
    requiredStatus: 'freeze',
    triggerElements: ['lightning'],
    damageMul: 2.2,
    radius: 130,
    color: 0x77eeff,
    badgeText: '⚡❄️ 초전도 파쇄!',
  },
  {
    id: 'melt',
    name: '융해 폭염',
    sourceId: 'reaction_melt',
    requiredStatus: 'freeze',
    triggerElements: ['fire'],
    damageMul: 2.8,
    radius: 85,
    color: 0xff6622,
    badgeText: '🔥❄️ 융해 폭염!',
  },
  {
    id: 'blood_burst',
    name: '혈폭',
    sourceId: 'reaction_blood_burst',
    requiredStatus: 'bleed',
    triggerElements: ['dark', 'necro'],
    damageMul: 1.9,
    radius: 110,
    color: 0xff2255,
    badgeText: '🩸💀 혈폭!',
  },
  {
    id: 'holy_purge',
    name: '성염 정화',
    sourceId: 'reaction_holy_purge',
    requiredStatus: 'curse',
    triggerElements: ['holy'],
    damageMul: 2.0,
    radius: 140,
    color: 0xffe066,
    badgeText: '✨ 성염 정화!',
  },
  {
    id: 'overload_railgun',
    name: '과부하 레일건',
    sourceId: 'reaction_overload_railgun',
    requiredStatus: 'shock',
    triggerElements: ['none', 'sf', 'spear'],
    damageMul: 1.6,
    radius: 95,
    color: 0xbb88ff,
    badgeText: '⚡ 과부하 관통!',
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
    return '⚡🔥 [원소반응: 초전도/융해 시너지]';
  }
  if (candidateElement === 'lightning' && (ownedElements.has('ice') || ownedElements.has('sf') || ownedElements.has('spear') || ownedElements.has('none'))) {
    return '⚡ [원소반응: 초전도/과부하 시너지]';
  }
  if (candidateElement === 'fire' && ownedElements.has('ice')) {
    return '🔥❄️ [원소반응: 융해 폭염 시너지]';
  }
  if ((candidateElement === 'dark' || candidateElement === 'necro') && (ownedElements.has('slash') || ownedElements.has('spear') || ownedElements.has('holy'))) {
    return '🩸✨ [원소반응: 혈폭/성염정화 시너지]';
  }
  if (candidateElement === 'holy' && (ownedElements.has('dark') || ownedElements.has('necro'))) {
    return '✨ [원소반응: 성염 정화 시너지]';
  }
  if ((candidateElement === 'slash' || candidateElement === 'spear') && (ownedElements.has('dark') || ownedElements.has('necro'))) {
    return '🩸 [원소반응: 혈폭 시너지]';
  }
  return undefined;
}
