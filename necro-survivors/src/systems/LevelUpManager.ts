import { SkillData } from '../data/types';
import { Player } from '../entities/Player';
import { ACTIVE_SKILLS, PASSIVE_SKILLS, AWAKENED_SKILLS, ALL_SKILLS_MAP } from '../data/skillsData';

export interface LevelUpChoice {
  skill: SkillData;
  isNew: boolean;
  currentLevel: number;
  nextLevel: number;
  synergyHint?: string; // e.g. "🌟 [본 스피어 각성 재료]"
  isFallback?: boolean;
}

export class LevelUpManager {
  private static maxActiveSlots = 6;
  private static maxPassiveSlots = 6;

  public static getChoices(player: Player, count: number = 3): LevelUpChoice[] {
    const ownedActives = Array.from(player.activeSkills.keys());
    const ownedPassives = Array.from(player.passiveSkills.keys());

    // 1단계: 획득 가능한 후보군 필터링 (일반 레벨업은 액티브 무기만 제시, 각성재료 패시브는 정예/보스 선택권에서 획득)
    const allAvailableSkills = [...ACTIVE_SKILLS];

    const candidates = allAvailableSkills.filter((skill) => {
      // 이미 이 스킬에서 진화한 각성 스킬을 보유하고 있다면 원본 스킬은 재등장하지 않음
      for (const awakened of AWAKENED_SKILLS) {
        if (awakened.evolvesFrom === skill.id && player.activeSkills.has(awakened.id)) {
          return false;
        }
      }

      // 1-1. 상위 스킬(Tier 2) 규칙: 선행 하위 스킬을 3레벨 이상 달성해야만 후보군에 등장!
      if (skill.tier === 2 && skill.prerequisiteSkillId) {
        const prereqLv = player.activeSkills.get(skill.prerequisiteSkillId) ?? 0;
        const requiredLv = skill.prerequisiteLevel ?? 3;
        if (prereqLv < requiredLv) {
          return false;
        }
      }

      const isActive = skill.category === 'weapon' || skill.category === 'summon';
      const curLv = isActive
        ? player.activeSkills.get(skill.id) ?? 0
        : player.passiveSkills.get(skill.id) ?? 0;

      // 만렙 스킬 제외
      if (curLv >= skill.maxLevel) return false;

      // 미보유 스킬인데 슬롯이 꽉 찼으면 제외
      if (curLv === 0) {
        if (isActive && ownedActives.length >= this.maxActiveSlots) return false;
        if (!isActive && ownedPassives.length >= this.maxPassiveSlots) return false;
      }

      return true;
    });

    // 2레벨 초반 가이드: 해골 군단 소환이 아직 없으면 무조건 1자리 확정 배정
    const guaranteedChoices: SkillData[] = [];
    if (player.level === 2 && !player.activeSkills.has('necro_legion')) {
      const legionSkill = ALL_SKILLS_MAP.get('necro_legion');
      if (legionSkill) {
        guaranteedChoices.push(legionSkill);
      }
    }

    // ⭐ 상위 스킬(Tier 2) 해금 즉시 확정 노출:
    // 하위 스킬을 3레벨 달성했으나 아직 미보유한 상위 스킬이 있다면 다음 레벨업에 즉시 1자리 확정 배정!
    if (guaranteedChoices.length < count && ownedActives.length < this.maxActiveSlots) {
      const unlockedTier2 = candidates.find((skill) => {
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

    // 2단계: 가중치 비복원 추출 (보유 스킬 1.8배, 사령 고유 1.3배 우대)
    const pickedSkills = this.pickWeighted(candidates, player, count, guaranteedChoices);

    // 3단계: 초보자 친화 짝꿍 패시브 각성 배지 및 결과 포맷팅
    const result: LevelUpChoice[] = pickedSkills.map((skill) => {
      const isActive = skill.category === 'weapon' || skill.category === 'summon';
      const curLv = isActive
        ? player.activeSkills.get(skill.id) ?? 0
        : player.passiveSkills.get(skill.id) ?? 0;

      let synergyHint: string | undefined;

      // 상위 스킬 배지 및 해금 안내
      if (skill.tier === 2 && skill.prerequisiteSkillId) {
        const prereqSkill = ALL_SKILLS_MAP.get(skill.prerequisiteSkillId);
        synergyHint = `🌟 [상위 무기! ${prereqSkill ? prereqSkill.name : ''} 연계 심화]`;
      } else if (skill.tier === 1 && curLv < 3) {
        const upperSkill = ACTIVE_SKILLS.find((s) => s.prerequisiteSkillId === skill.id);
        if (upperSkill) {
          synergyHint = `🔒 [Lv.3 달성 시 상위 무기 '${upperSkill.name}' 해금!]`;
        }
      }

      // 패시브 카드인 경우: 플레이어가 소유한 액티브의 짝꿍인지 체크
      if (skill.category === 'passive') {
        for (const activeId of ownedActives) {
          const activeSkill = ALL_SKILLS_MAP.get(activeId);
          if (activeSkill && activeSkill.requiredPassiveId === skill.id) {
            synergyHint = `🌟 [${activeSkill.name} 각성 재료]`;
            break;
          }
        }
      } else if (isActive && skill.requiredPassiveId && !synergyHint) {
        // 액티브 카드인 경우: 각성에 필요한 재료 패시브 안내
        const hasPartner = (player.passiveSkills.get(skill.requiredPassiveId) ?? 0) > 0;
        const partnerPassive = ALL_SKILLS_MAP.get(skill.requiredPassiveId);
        if (hasPartner && partnerPassive) {
          synergyHint = `🌟 [각성 재료 (${partnerPassive.name}) 보유!]`;
        } else if (partnerPassive) {
          synergyHint = `💡 [각성 필요 재료: ${partnerPassive.name}]`;
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

    // 4단계: 선택지 고갈 시 폴백 보상 카드 자동 채우기 (치킨, 마력석)
    while (result.length < count) {
      const isChicken = result.length % 2 === 0;
      result.push({
        skill: {
          id: isChicken ? 'fallback_chicken' : 'fallback_gold',
          name: isChicken ? '🍗 한밤의 치킨' : '💰 마력석 주머니',
          icon: isChicken ? 'assets/ui/items_sets/set_necro_core.png' : 'assets/ui/gates/gate_gold.png',
          category: 'passive',
          isNecroSignature: false,
          targeting: 'self_aoe',
          behavior: 'straight',
          maxLevel: 999,
          levels: [
            {
              level: 1,
              description: isChicken ? '체력 50% 즉시 회복' : '마력석 +500 골드 즉시 획득',
              damageCoeff: 0,
              cooldown: 0,
              projectileCount: 0,
              areaRadius: 0,
              pierceCount: 0,
              duration: 0,
              knockbackForce: 0,
            },
          ],
        },
        isNew: false,
        currentLevel: 1,
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
    guaranteed: SkillData[]
  ): SkillData[] {
    const pool = candidates.filter((c) => !guaranteed.some((g) => g.id === c.id));
    const picked = [...guaranteed];

    while (picked.length < count && pool.length > 0) {
      const weights = pool.map((skill) => {
        let w = skill.isNecroSignature ? 130 : 100;
        const curLv =
          skill.category === 'passive'
            ? player.passiveSkills.get(skill.id) ?? 0
            : player.activeSkills.get(skill.id) ?? 0;
        if (curLv > 0) {
          w *= 1.8; // 보유 스킬 레벨업 우대
        } else if (skill.tier === 2 && skill.prerequisiteSkillId) {
          // 선행 스킬 3레벨 달성으로 해금된 상위 스킬은 높은 출현 가중치 부여
          w = 350;
        }
        return w;
      });

      const totalWeight = weights.reduce((acc, w) => acc + w, 0);
      let roll = Math.random() * totalWeight;
      let chosenIdx = pool.length - 1; // 안전장치 기본값

      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) {
          chosenIdx = i;
          break;
        }
      }

      picked.push(pool[chosenIdx]);
      pool.splice(chosenIdx, 1); // 비복원 추출
    }

    return picked;
  }
}
