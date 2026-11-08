import { SaveData } from '../data/types';

const SAVE_KEY = 'PROJECT_NECRO_SURVIVORS_SAVE_V1';

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
      version: 1,
      gold: 1500,
      highestClearedRegion: 0, // 0이면 1지역 도전 가능
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
    };
  }

  public load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return this.getDefaultData();
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        ...this.getDefaultData(),
        ...parsed,
        traits: { ...this.getDefaultData().traits, ...(parsed.traits || {}) },
        talents: { ...this.getDefaultData().talents, ...(parsed.talents || {}) },
      };
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

  public markRegionCleared(regionId: number): void {
    if (regionId > this.data.highestClearedRegion) {
      this.data.highestClearedRegion = regionId;
      this.save();
    }
  }

  public setSelectedRegion(regionId: number): void {
    this.data.selectedRegion = regionId;
    this.save();
  }

  public upgradeAltarItem(id: string, isTalent: boolean, cost: number): boolean {
    if (!this.spendGold(cost)) return false;

    if (isTalent) {
      const cur = this.data.talents[id] || 0;
      this.data.talents[id] = Math.min(10, cur + 1);
    } else {
      const cur = this.data.traits[id] || 0;
      this.data.traits[id] = Math.min(10, cur + 1);
    }
    this.save();
    return true;
  }

  public setMasterSlot(id: string | null): void {
    this.data.masterSlotId = id;
    this.save();
  }

  // 오프라인 방치 보상 계산 (최대 12시간)
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
