import { SaveData } from '../data/types';
import { ALL_ALTAR_MAP } from '../data/altarData';
import { getRelicByRegion } from '../data/relicsData';

const SAVE_KEY = 'PROJECT_NECRO_SURVIVORS_SAVE_V1';
export const MAX_EQUIPPED_RELICS = 3;

export class SaveManager {
  private static instance: SaveManager;
  private data: SaveData;

  private constructor() {
    this.data = this.load();
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public getData(): SaveData {
    return this.data;
  }

  private getDefaultData(): SaveData {
    return {
      version: 2,
      gold: 1500,
      highestClearedRegion: 0,
      selectedRegion: 1,
      traits: {
        trait_undead_cmd: 1,
        trait_iron_body: 1,
      },
      talents: {
        talent_merchant: 1,
      },
      masterSlotId: null,
      hasAdFreePass: false,
      lastLogoutTime: Date.now(),
      unlockedRelics: [],
      equippedRelics: [],
      bestEndlessTime: {},
      regionStars: {},
    };
  }

  public load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.getDefaultData();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      const merged: SaveData = {
        ...this.getDefaultData(),
        ...parsed,
        version: 2,
        traits: { ...this.getDefaultData().traits, ...(parsed.traits || {}) },
        talents: { ...this.getDefaultData().talents, ...(parsed.talents || {}) },
        unlockedRelics: Array.isArray(parsed.unlockedRelics) ? [...parsed.unlockedRelics] : [],
        equippedRelics: Array.isArray(parsed.equippedRelics)
          ? parsed.equippedRelics.slice(0, MAX_EQUIPPED_RELICS)
          : [],
        bestEndlessTime: parsed.bestEndlessTime ? { ...parsed.bestEndlessTime } : {},
        regionStars: parsed.regionStars ? { ...parsed.regionStars } : {},
      };

      // 기존 클리어 유저 보스 영혼 유물 소급 해금
      for (let r = 1; r <= merged.highestClearedRegion; r++) {
        const relic = getRelicByRegion(r);
        if (relic && !merged.unlockedRelics!.includes(relic.id)) {
          merged.unlockedRelics!.push(relic.id);
        }
        if ((merged.regionStars![r] ?? 0) < 1) {
          merged.regionStars![r] = 1;
        }
      }

      return merged;
    } catch {
      return this.getDefaultData();
    }
  }

  public save(): void {
    try {
      this.data.lastLogoutTime = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {}
  }

  public addGold(amount: number): void {
    this.data.gold = Math.max(0, this.data.gold + amount);
    this.save();
  }

  public spendGold(amount: number): boolean {
    if (this.data.gold >= amount) {
      this.data.gold -= amount;
      this.save();
      return true;
    }
    return false;
  }

  public markRegionCleared(regionId: number, stars: number = 1): string | null {
    if (regionId > this.data.highestClearedRegion) {
      this.data.highestClearedRegion = regionId;
    }
    if (!this.data.regionStars) this.data.regionStars = {};
    this.data.regionStars[regionId] = Math.max(this.data.regionStars[regionId] ?? 0, stars);

    if (!this.data.unlockedRelics) this.data.unlockedRelics = [];
    const relic = getRelicByRegion(regionId);
    let newlyUnlocked: string | null = null;
    if (relic && !this.data.unlockedRelics.includes(relic.id)) {
      this.data.unlockedRelics.push(relic.id);
      newlyUnlocked = relic.id;
    }

    this.save();
    return newlyUnlocked;
  }

  public recordEndlessTime(regionId: number, totalSec: number): void {
    if (!this.data.bestEndlessTime) this.data.bestEndlessTime = {};
    const prev = this.data.bestEndlessTime[regionId] ?? 0;
    if (totalSec > prev) {
      this.data.bestEndlessTime[regionId] = Math.floor(totalSec);
    }
    if (totalSec >= 600) {
      if (!this.data.regionStars) this.data.regionStars = {};
      this.data.regionStars[regionId] = Math.max(this.data.regionStars[regionId] ?? 0, 3);
    }
    this.save();
  }

  public toggleEquipRelic(relicId: string): boolean {
    const unlocked = this.data.unlockedRelics ?? [];
    if (!unlocked.includes(relicId)) return false;
    if (!this.data.equippedRelics) this.data.equippedRelics = [];

    const idx = this.data.equippedRelics.indexOf(relicId);
    if (idx >= 0) {
      this.data.equippedRelics.splice(idx, 1);
      this.save();
      return true;
    }

    if (this.data.equippedRelics.length >= MAX_EQUIPPED_RELICS) {
      return false;
    }
    this.data.equippedRelics.push(relicId);
    this.save();
    return true;
  }

  public hasEquippedRelicEffect(effect: string): boolean {
    const equipped = this.data.equippedRelics ?? [];
    for (const id of equipped) {
      const regionNum = parseInt(id.replace('relic_boss_', ''), 10);
      const relic = getRelicByRegion(regionNum);
      if (relic && relic.specialEffect === effect) return true;
    }
    return false;
  }

  public setSelectedRegion(regionId: number): void {
    this.data.selectedRegion = regionId;
    this.save();
  }

  public upgradeAltarItem(id: string, isTalent: boolean, cost: number): boolean {
    if (!this.spendGold(cost)) return false;

    const maxLv = ALL_ALTAR_MAP.get(id)?.maxLevel ?? 10;
    if (isTalent) {
      const cur = this.data.talents[id] || 0;
      this.data.talents[id] = Math.min(maxLv, cur + 1);
    } else {
      const cur = this.data.traits[id] || 0;
      this.data.traits[id] = Math.min(maxLv, cur + 1);
    }
    this.save();
    return true;
  }

  public setMasterSlot(id: string | null): void {
    this.data.masterSlotId = id;
    this.save();
  }

  public calculateOfflineReward(): { elapsedMinutes: number; gold: number } {
    const now = Date.now();
    const diffMs = now - (this.data.lastLogoutTime || now);
    const maxMs = 12 * 60 * 60 * 1000;
    const clampedMs = Math.min(diffMs, maxMs);
    const elapsedMinutes = Math.floor(clampedMs / 60000);

    if (elapsedMinutes < 5) {
      return { elapsedMinutes: 0, gold: 0 };
    }

    const stageMultiplier = Math.max(1, this.data.highestClearedRegion + 1);
    const gold = Math.floor(elapsedMinutes * 12 * stageMultiplier);
    return { elapsedMinutes, gold };
  }
}
