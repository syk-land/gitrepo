import { t } from '../core/I18n';
import { ElementTag, SkillData } from '../data/types';
import { Player } from '../entities/Player';
import { ACTIVE_SKILLS, AWAKENED_SKILLS, ALL_SKILLS_MAP } from '../data/skillsData';
import { getSkillElementTag, getSynergyHintForNewElement } from '../data/synergyData';
import { SaveManager } from '../core/SaveManager';

export interface LevelUpChoice {
  skill: SkillData;
  isNew: boolean;
  currentLevel: number;
  nextLevel: number;
  synergyHint?: string;
  isFallback?: boolean;
}

export function getActiveBranchId(skillId: string): string {
  const skill = ALL_SKILLS_MAP.get(skillId);
  if (!skill) return skillId;
  if (skill.evolvesFrom) {
    const base = ALL_SKILLS_MAP.get(skill.evolvesFrom);
    if (base) return getActiveBranchId(base.id);
  }
  return skill.prerequisiteSkillId || skill.id;
}

export class LevelUpManager {
  private static maxActiveSlots = 6;
  private static maxPassiveSlots = 6;

  // 런당 리롤 & 제외(밴) 상태
  public static rerollsLeft: number = 2;
  public static banishesLeft: number = 1;
  public static banishedSkillIds = new Set<string>();

  public static resetRunState(): void {
    const extraRerolls = SaveManager.getInstance().hasEquippedRelicEffect('extra_rerolls') ? 2 : 0;
    this.rerollsLeft = 2 + extraRerolls;
    this.banishesLeft = 1;
    this.banishedSkillIds.clear();
  }

  public static consumeReroll(): boolean {
    if (this.rerollsLeft <= 0) return false;
    this.rerollsLeft--;
    return true;
  }

  public static banishSkill(skillId: string): boolean {
    if (this.banishesLeft <= 0) return false;
    this.banishesLeft--;
    this.banishedSkillIds.add(skillId);
    return true;
  }

  public static getChoices(
    player: Player,
    count: number = 3,
    excludeSkillIds?: Set<string>
  ): LevelUpChoice[] {
    const ownedActives = Array.from(player.activeSkills.keys());

    const ownedActiveBranches = new Set<string>();
    const ownedElements = new Set<ElementTag>();
    for (const aId of ownedActives) {
      ownedActiveBranches.add(getActiveBranchId(aId));
      ownedElements.add(getSkillElementTag(aId));
    }

    const allAvailableSkills = [...ACTIVE_SKILLS];

    const candidates = allAvailableSkills.filter((skill) => {
      if (this.banishedSkillIds.has(skill.id)) return false;

      for (const awakened of AWAKENED_SKILLS) {
        if (awakened.evolvesFrom === skill.id && player.activeSkills.has(awakened.id)) {
          return false;
        }
      }
      if (skill.id === 'necro_bone_storm' && player.activeSkills.has('awakened_spear')) {
        return false;
      }

      if (skill.tier === 2 && skill.prerequisiteSkillId) {
        const prereqLv = player.activeSkills.get(skill.prerequisiteSkillId) ?? 0;
        const requiredLv = skill.prerequisiteLevel ?? 3;
        if (prereqLv < requiredLv) return false;
      }

      const isActive = skill.category === 'weapon' || skill.category === 'summon';
      const curLv = isActive
        ? player.activeSkills.get(skill.id) ?? 0
        : player.passiveSkills.get(skill.id) ?? 0;

      if (curLv >= skill.maxLevel) return false;

      if (curLv === 0) {
        if (isActive) {
          if (ownedActives.length >= this.maxActiveSlots) return false;
          const branchId = getActiveBranchId(skill.id);
          if (!ownedActiveBranches.has(branchId) && ownedActiveBranches.size >= 3) {
            return false;
          }
        } else {
          if (player.passiveSkills.size >= this.maxPassiveSlots) return false;
        }
      }

      return true;
    });

    // 리롤 시 직전 선택지와 중복 회피 (충분한 후보가 있을 때만)
    const filteredCandidates =
      excludeSkillIds && candidates.filter((c) => !excludeSkillIds.has(c.id)).length >= count
        ? candidates.filter((c) => !excludeSkillIds.has(c.id))
        : candidates;

    const guaranteedChoices: SkillData[] = [];
    if (guaranteedChoices.length < count && ownedActives.length < this.maxActiveSlots) {
      const unlockedTier2 = filteredCandidates.find((skill) => {
        if (skill.tier !== 2 || !skill.prerequisiteSkillId) return false;
        const curLv = player.activeSkills.get(skill.id) ?? 0;
        if (curLv > 0) return false;
        const prereqLv = player.activeSkills.get(skill.prerequisiteSkillId) ?? 0;
        const requiredLv = skill.prerequisiteLevel ?? 3;
        return prereqLv >= requiredLv;
      });
      if (unlockedTier2) {
        guaranteedChoices.push(unlockedTier2);
      }
    }

    const pickedSkills = this.pickWeighted(filteredCandidates, player, count, guaranteedChoices);

    const result: LevelUpChoice[] = pickedSkills.map((skill) => {
      const isActive = skill.category === 'weapon' || skill.category === 'summon';
      const curLv = isActive
        ? player.activeSkills.get(skill.id) ?? 0
        : player.passiveSkills.get(skill.id) ?? 0;

      let synergyHint: string | undefined;
      const candElem = getSkillElementTag(skill.id);

      if (curLv === 0 && isActive && !ownedActiveBranches.has(getActiveBranchId(skill.id))) {
        const elemHint = getSynergyHintForNewElement(ownedElements, candElem);
        synergyHint = elemHint || t(`🆕 [새 무기 계열 (${ownedActiveBranches.size + 1}/3)]`, `🆕 [New weapon branch (${ownedActiveBranches.size + 1}/3)]`);
      } else if (skill.tier === 2 && skill.prerequisiteSkillId) {
        const prereqSkill = ALL_SKILLS_MAP.get(skill.prerequisiteSkillId);
        if (prereqSkill) {
          synergyHint = t(`⚡ [${prereqSkill.name} 상위 진화]`, `⚡ [${prereqSkill.name} upgrade]`);
        }
      }

      if (!synergyHint && isActive && curLv === 4) {
        const evo = AWAKENED_SKILLS.find((a) => a.evolvesFrom === skill.id);
        if (evo) {
          synergyHint = t(`🌟 [Lv.5 달성 시 '${evo.name}' 각성 조건 충족]`, `🌟 [Reach Lv.5 to unlock '${evo.name}' awakening]`);
        }
      }

      return {
        skill,
        isNew: curLv === 0,
        currentLevel: curLv,
        nextLevel: curLv + 1,
        synergyHint,
      };
    });

    if (result.length === 0) {
      const fallbackSkill: SkillData = {
        id: 'fallback_gold_heal',
        name: t('마력석 보너스 & 체력 회복', 'Mana Stone Bonus & Heal'),
        icon: 'vfx_priest_ult',
        category: 'passive',
        isNecroSignature: false,
        targeting: 'self_aoe',
        behavior: 'instant_strike',
        maxLevel: 99,
        levels: [
          {
            level: 1,
            description: t('체력 35% 회복 및 마력석 +300G 즉시 획득', 'Restore 35% HP and instantly gain +300G Mana Stones'),
            damageCoeff: 0,
            cooldown: 0,
            projectileCount: 0,
            areaRadius: 0,
            pierceCount: 0,
            duration: 0,
            knockbackForce: 0,
          },
        ],
      };
      result.push({
        skill: fallbackSkill,
        isNew: false,
        currentLevel: 0,
        nextLevel: 1,
        isFallback: true,
      });
    }

    return result;
  }

  private static pickWeighted(
    candidates: SkillData[],
    player: Player,
    count: number,
    guaranteed: SkillData[] = []
  ): SkillData[] {
    const picked: SkillData[] = [...guaranteed];
    const pool = candidates.filter((c) => !picked.includes(c));

    while (picked.length < count && pool.length > 0) {
      const weights = pool.map((skill) => {
        const isOwned = player.activeSkills.has(skill.id) || player.passiveSkills.has(skill.id);
        let w = 1.0;
        if (isOwned) w *= 1.8;
        if (skill.isNecroSignature) w *= 1.3;
        return w;
      });

      const totalW = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalW;
      let chosenIdx = 0;

      for (let i = 0; i < pool.length; i++) {
        r -= weights[i];
        if (r <= 0) {
          chosenIdx = i;
          break;
        }
      }

      picked.push(pool[chosenIdx]);
      pool.splice(chosenIdx, 1);
    }

    return picked;
  }
}
