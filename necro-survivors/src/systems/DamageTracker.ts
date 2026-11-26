import { t } from '../core/I18n';
import { ALL_SKILLS_MAP } from '../data/skillsData';

export interface DamageEntry {
  sourceId: string;
  label: string;
  totalDamage: number;
  dps: number;
  sharePercent: number;
}

const SPECIAL_LABELS: Record<string, string> = {
  corpse_explosion: t('💥 사령 시체 폭발', '💥 Necro Corpse Explosion'),
  jin_blizzard: t('❄️ 진(眞) 마력폭풍', '❄️ True Mana Storm'),
  minion_melee: t('💀 해골 근접 군단', '💀 Skeleton Melee Legion'),
  minion_ranged: t('🏹 소환수 원거리 사격', '🏹 Minion Ranged Fire'),
  reaction_superconduct: t('⚡ 원소반응: 초전도 파쇄', '⚡ Reaction: Superconduct Shatter'),
  reaction_melt: t('🔥 원소반응: 융해 폭염', '🔥 Reaction: Meltdown Blaze'),
  reaction_blood_burst: t('🩸 원소반응: 혈폭', '🩸 Reaction: Blood Burst'),
  reaction_holy_purge: t('✨ 원소반응: 성염 정화', '✨ Reaction: Holy Flame Purge'),
  reaction_overload_railgun: t('⚡ 원소반응: 과부하 레일건', '⚡ Reaction: Overload Railgun'),
  status_bleed: t('🩸 출혈 지속 피해', '🩸 Bleed Damage'),
  status_burn: t('🔥 화상 지속 피해', '🔥 Burn Damage'),
  relic_poison: t('☠️ 유물: 맹독 장판', '☠️ Relic: Venom Zone'),
};

export class DamageTracker {
  private totals = new Map<string, number>();

  public reset(): void {
    this.totals.clear();
  }

  public record(sourceId: string, amount: number): void {
    if (!sourceId || amount <= 0) return;
    this.totals.set(sourceId, (this.totals.get(sourceId) ?? 0) + amount);
  }

  public getGrandTotal(): number {
    let sum = 0;
    for (const v of this.totals.values()) sum += v;
    return sum;
  }

  public getTopEntries(elapsedSec: number, limit: number = 6): DamageEntry[] {
    const safeSec = Math.max(1, elapsedSec);
    const grandTotal = Math.max(1, this.getGrandTotal());

    const list: DamageEntry[] = [];
    for (const [sourceId, totalDamage] of this.totals.entries()) {
      const skill = ALL_SKILLS_MAP.get(sourceId);
      const label = skill ? skill.name : SPECIAL_LABELS[sourceId] || sourceId;
      list.push({
        sourceId,
        label,
        totalDamage: Math.round(totalDamage),
        dps: Math.round(totalDamage / safeSec),
        sharePercent: Math.round((totalDamage / grandTotal) * 1000) / 10,
      });
    }

    list.sort((a, b) => b.totalDamage - a.totalDamage);
    return list.slice(0, limit);
  }
}
