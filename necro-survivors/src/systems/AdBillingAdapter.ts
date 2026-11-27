import { Capacitor } from '@capacitor/core';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { SaveManager } from '../core/SaveManager';

// Google official test rewarded ad unit ID (replaced via VITE_ADMOB_* env vars once Necro AdMob units are created)
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';
const VITE_ENV = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) ?? {};
const ADMOB_REWARDED_IDS = {
  revive: VITE_ENV.VITE_ADMOB_REVIVE_ID || TEST_REWARDED_ID,
  reroll: VITE_ENV.VITE_ADMOB_REROLL_ID || TEST_REWARDED_ID,
  double: VITE_ENV.VITE_ADMOB_DOUBLE_ID || TEST_REWARDED_ID,
} as const;

type RewardPlacement = keyof typeof ADMOB_REWARDED_IDS;

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
  private admobInitialized = false;

  private constructor() {}

  public static getInstance(): AdBillingAdapter {
    if (!AdBillingAdapter.instance) {
      AdBillingAdapter.instance = new AdBillingAdapter();
    }
    return AdBillingAdapter.instance;
  }

  private async runNativeRewardedAd(placement: RewardPlacement): Promise<boolean> {
    try {
      if (!this.admobInitialized) {
        await AdMob.initialize({});
        this.admobInitialized = true;
      }
      const adId = ADMOB_REWARDED_IDS[placement] || TEST_REWARDED_ID;
      let rewarded = false;
      const handles = await Promise.all([
        AdMob.addListener(RewardAdPluginEvents.Showed, () => {
          window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_PAUSE' } }));
        }),
        AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        }),
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
        }),
        AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
          window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
        }),
      ]);
      try {
        await AdMob.prepareRewardVideoAd({ adId });
        await AdMob.showRewardVideoAd();
        return rewarded;
      } catch {
        window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
        return true;
      } finally {
        await Promise.all(handles.map((h) => h.remove().catch(() => {})));
      }
    } catch {
      window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
      return true;
    }
  }

  private runRewardedAd(placement: RewardPlacement = 'revive'): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      return this.runNativeRewardedAd(placement);
    }
    const w = window as unknown as {
      __cgSdkReady?: boolean;
      CrazyGames?: {
        SDK?: {
          ad?: { requestAd?: (type: 'midgame' | 'rewarded', cb: { adStarted?: () => void; adFinished?: () => void; adError?: () => void }) => void };
          game?: { gameplayStart?: () => void; gameplayStop?: () => void };
        };
      };
    };
    if (w.__cgSdkReady && w.CrazyGames?.SDK?.ad?.requestAd) {
      return new Promise((resolve) => {
        try { w.CrazyGames?.SDK?.game?.gameplayStop?.(); } catch {}
        try {
          w.CrazyGames!.SDK!.ad!.requestAd!('rewarded', {
            adStarted: () => window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_PAUSE' } })),
            adFinished: () => {
              window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
              try { w.CrazyGames?.SDK?.game?.gameplayStart?.(); } catch {}
              resolve(true);
            },
            adError: () => {
              window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
              try { w.CrazyGames?.SDK?.game?.gameplayStart?.(); } catch {}
              resolve(true);
            },
          });
        } catch {
          resolve(true);
        }
      });
    }
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
    if (Capacitor.isNativePlatform()) return;
    try {
      const w = window as unknown as {
        __cgSdkReady?: boolean;
        CrazyGames?: {
          SDK?: {
            ad?: { requestAd?: (type: 'midgame' | 'rewarded', cb: { adStarted?: () => void; adFinished?: () => void; adError?: () => void }) => void };
            game?: { gameplayStart?: () => void; gameplayStop?: () => void };
          };
        };
      };
      if (w.__cgSdkReady && w.CrazyGames?.SDK?.ad?.requestAd) {
        try { w.CrazyGames?.SDK?.game?.gameplayStop?.(); } catch {}
        w.CrazyGames.SDK.ad.requestAd('midgame', {
          adStarted: () => window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_PAUSE' } })),
          adFinished: () => {
            window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
            try { w.CrazyGames?.SDK?.game?.gameplayStart?.(); } catch {}
          },
          adError: () => {
            window.dispatchEvent(new CustomEvent('gm-sdk-event', { detail: { name: 'SDK_GAME_START' } }));
            try { w.CrazyGames?.SDK?.game?.gameplayStart?.(); } catch {}
          },
        });
        return;
      }
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
    return this.runRewardedAd('revive');
  }

  // Rewarded Ad 2: Fate Reroll
  public async showRerollAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) return true;
    return this.runRewardedAd('reroll');
  }

  // Rewarded Ad 3: 2x Portal Loot
  public async showDoubleRewardAd(): Promise<boolean> {
    const save = SaveManager.getInstance().getData();
    if (save.hasAdFreePass) return true;
    return this.runRewardedAd('double');
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
