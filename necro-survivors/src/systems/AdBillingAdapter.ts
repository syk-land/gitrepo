import { SaveManager } from '../core/SaveManager';

declare global {
  interface Window {
    __ysdk?: {
      adv?: {
        showFullscreenAdv?: (opts?: unknown) => void;
        showRewardedVideo?: (opts?: unknown) => void;
      };
    };
    sdk?: {
      showBanner?: () => void;
      showAd?: (type?: string) => void;
    };
    ShowAds?: (type?: string) => void;
  }
}

export class AdBillingAdapter {
  private static instance: AdBillingAdapter;

  private constructor() {}

  public static getInstance(): AdBillingAdapter {
    if (!AdBillingAdapter.instance) {
      AdBillingAdapter.instance = new AdBillingAdapter();
    }
    return AdBillingAdapter.instance;
  }

  private runRewardedAd(): Promise<boolean> {
    if (window.__ysdk?.adv?.showRewardedVideo) {
      return new Promise((resolve) => {
        let rewarded = false;
        try {
          window.__ysdk!.adv!.showRewardedVideo!({
            callbacks: {
              onRewarded: () => { rewarded = true; },
              onClose: () => resolve(rewarded),
              onError: () => resolve(true),
            },
          });
        } catch {
          resolve(true);
        }
      });
    }

    const gmReady =
      (window.sdk && typeof window.sdk.showBanner === 'function') ||
      typeof window.ShowAds === 'function';
    if (!gmReady) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        window.removeEventListener('gm-sdk-event', onEvt);
        resolve(ok);
      };
      const onEvt = (e: Event) => {
        const name = (e as CustomEvent).detail?.name as string | undefined;
        if (!name) return;
        if (
          name === 'SDK_REWARDED_WATCH_COMPLETE' ||
          name === 'SDK_REWARDED_FINISHED' ||
          name === 'AD_REWARDED' ||
          name === 'AD_FINISHED' ||
          name === 'AD_COMPLETE' ||
          name === 'AD_CANCELED' ||
          name === 'AD_ERROR' ||
          name === 'SDK_REWARDED_NOT_AVAILABLE' ||
          name === 'SDK_GAME_START'
        ) {
          finish(true);
        } else if (name === 'AD_SKIPPED') {
          finish(false);
        }
      };
      const timer = setTimeout(() => finish(true), 8000);
      window.addEventListener('gm-sdk-event', onEvt);
      try {
        if (window.sdk && typeof window.sdk.showBanner === 'function') {
          window.sdk.showBanner();
        } else if (typeof window.ShowAds === 'function') {
          window.ShowAds('rewarded');
        } else {
          finish(true);
        }
      } catch {
        finish(true);
      }
    });
  }

  public showInterstitial(): void {
    try {
      if (window.__ysdk?.adv?.showFullscreenAdv) {
        window.__ysdk.adv.showFullscreenAdv({});
        return;
      }
      if (window.sdk && typeof window.sdk.showBanner === 'function') {
        window.sdk.showBanner();
      } else if (typeof window.ShowAds === 'function') {
        window.ShowAds();
      }
    } catch {
      // silent fallback
    }
  }

  // Rewarded Ad 1: Soul Rewind Revive (1x per run)
  public async showReviveAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) return true;
    return this.runRewardedAd();
  }

  // Rewarded Ad 2: Fate Reroll
  public async showRerollAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) return true;
    return this.runRewardedAd();
  }

  // Rewarded Ad 3: 2x Portal Loot
  public async showDoubleRewardAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) return true;
    return this.runRewardedAd();
  }

  public async buyAdFreePass(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    save.hasAdFreePass = true;
    SaveManager.getInstance().save();
    return true;
  }

  public async buyStarterPack(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    save.gold += 15000;
    save.traits['trait_undead_cmd'] = Math.max(3, save.traits['trait_undead_cmd'] || 3);
    SaveManager.getInstance().save();
    return true;
  }
}
