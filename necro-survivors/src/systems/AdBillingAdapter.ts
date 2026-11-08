import { SaveManager } from '../core/SaveManager';

export class AdBillingAdapter {
  private static instance: AdBillingAdapter;

  private constructor() {}

  public static getInstance(): AdBillingAdapter {
    if (!AdBillingAdapter.instance) {
      AdBillingAdapter.instance = new AdBillingAdapter();
    }
    return AdBillingAdapter.instance;
  }

  // 보상형 광고 1: 영혼 역행 부활 (판당 1회)
  public async showReviveAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) {
      return true; // 광고 프리 패스 보유 시 광고 없이 즉시 패스
    }
    return new Promise((resolve) => {
      // 모바일 웹/로컬 개발 환경에서는 1초 타이머 후 보상 지급 (모의 모드)
      setTimeout(() => {
        resolve(true);
      }, 700);
    });
  }

  // 보상형 광고 2: 운명 재굴림 (Reroll)
  public async showRerollAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) {
      return true;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  // 보상형 광고 3: 차원문 전리품 2배
  public async showDoubleRewardAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) {
      return true;
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 800);
    });
  }

  // 인앱결제 1: 광고 영구 제거 패스
  public async buyAdFreePass(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    save.hasAdFreePass = true;
    SaveManager.getInstance().save();
    return true;
  }

  // 인앱결제 2: 사령군주 스타터 팩 (15,000 마력석 + 사령의 권능 Lv.3)
  public async buyStarterPack(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    save.gold += 15000;
    save.traits['trait_undead_cmd'] = Math.max(3, save.traits['trait_undead_cmd'] || 3);
    SaveManager.getInstance().save();
    return true;
  }
}
