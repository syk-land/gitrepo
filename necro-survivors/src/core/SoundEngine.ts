// =========================================================================
// 8-bit retro chiptune synthesizer audio engine (SoundEngine.ts)
// 100% Web Audio API with cached noise buffer, SFX throttling & lifecycle
// =========================================================================

const AUDIO_PREF_KEY = 'necro_survivors_audio_enabled';

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  public enabled: boolean = true;
  private bgmTimer: number | null = null;
  private bgmMode: 'hub' | 'battle' | null = null;
  private bgmStep: number = 0;
  private gemPitchCounter: number = 0;
  private lastSfxTime: Record<string, number> = {};
  private hiddenSuspended: boolean = false;
  private adSuspended: boolean = false;

  private constructor() {
    this.enabled = this.loadAudioPreference();
    this.bindLifecycleEvents();
  }

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  private loadAudioPreference(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(AUDIO_PREF_KEY);
        if (raw === '0' || raw === 'false') return false;
      }
    } catch {
      // Ignore storage access errors in restricted iframes
    }
    return true;
  }

  private saveAudioPreference(enabled: boolean): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(AUDIO_PREF_KEY, enabled ? '1' : '0');
      }
    } catch {
      // Ignore storage write errors
    }
  }

  private bindLifecycleEvents(): void {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const handleHidden = () => {
      this.hiddenSuspended = true;
      this.pauseBgmTimerOnly();
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    };

    const handleVisible = () => {
      if (!this.hiddenSuspended) return;
      this.hiddenSuspended = false;
      if (this.enabled && !this.adSuspended) {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        this.resumeBgmIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        handleHidden();
      } else {
        handleVisible();
      }
    });

    window.addEventListener('pagehide', handleHidden);
    window.addEventListener('pageshow', handleVisible);

    // Pause/resume audio cleanly during GameMonetize / Yandex ad breaks
    window.addEventListener('gm-sdk-event', (e: Event) => {
      const name = (e as CustomEvent).detail?.name as string | undefined;
      if (name === 'SDK_GAME_PAUSE') {
        this.adSuspended = true;
        this.pauseBgmTimerOnly();
        if (this.ctx && this.ctx.state === 'running') {
          this.ctx.suspend().catch(() => {});
        }
      } else if (name === 'SDK_GAME_START') {
        this.adSuspended = false;
        if (this.enabled && !this.hiddenSuspended) {
          if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
          }
          this.resumeBgmIfNeeded();
        }
      }
    });
  }

  private canPlay(key: string, minIntervalMs: number): boolean {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const prev = this.lastSfxTime[key] ?? 0;
    if (now - prev < minIntervalMs) return false;
    this.lastSfxTime[key] = now;
    return true;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.saveAudioPreference(enabled);

    if (!enabled) {
      this.pauseBgmTimerOnly();
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else if (!this.hiddenSuspended && !this.adSuspended) {
      this.init();
      this.resumeBgmIfNeeded();
    }
  }

  public toggleMute(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  public init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.ensureNoiseBuffer();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.enabled && !this.hiddenSuspended && !this.adSuspended) {
      this.ctx.resume().catch(() => {});
    }
  }

  private ensureNoiseBuffer(): void {
    if (!this.ctx || this.noiseBuffer) return;
    try {
      const sampleRate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < sampleRate; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    } catch {
      this.noiseBuffer = null;
    }
  }

  public playTone(
    freq: number,
    type: OscillatorType = 'square',
    duration: number = 0.1,
    vol: number = 0.12,
    slideTo: number | null = null
  ): void {
    if (!this.enabled || this.hiddenSuspended || this.adSuspended) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, slideTo), now + duration);
      }
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  public playNoise(duration: number = 0.15, vol: number = 0.15): void {
    if (!this.enabled || this.hiddenSuspended || this.adSuspended) return;
    this.init();
    if (!this.ctx) return;
    this.ensureNoiseBuffer();
    if (!this.noiseBuffer) return;

    try {
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = this.noiseBuffer;
      if (duration > this.noiseBuffer.duration) {
        whiteNoise.loop = true;
      }
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      whiteNoise.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch {}
  }

  // --- SFX Presets (with per-SFX cooldown throttling for dense waves) ---
  public click(): void {
    this.playTone(880, 'square', 0.04, 0.08, 1200);
  }

  public hit(): void {
    if (!this.canPlay('hit', 45)) return;
    this.playTone(220, 'triangle', 0.06, 0.12, 90);
  }

  public crit(): void {
    if (!this.canPlay('crit', 70)) return;
    this.playTone(587, 'square', 0.08, 0.14, 1174);
    setTimeout(() => this.playTone(1174, 'square', 0.1, 0.14, 1760), 50);
  }

  public skill(): void {
    if (!this.canPlay('skill', 60)) return;
    this.playTone(440, 'triangle', 0.14, 0.12, 880);
  }

  public shoot(): void {
    if (!this.canPlay('shoot', 55)) return;
    this.playTone(720, 'square', 0.05, 0.07, 300);
  }

  public gemPickup(): void {
    if (!this.canPlay('gemPickup', 45)) return;
    this.gemPitchCounter = (this.gemPitchCounter + 1) % 6;
    const baseFreqs = [523, 587, 659, 698, 784, 880];
    const freq = baseFreqs[this.gemPitchCounter];
    this.playTone(freq, 'sine', 0.07, 0.08, freq * 1.2);
  }

  public corpseBurst(): void {
    if (!this.canPlay('corpseBurst', 80)) return;
    this.playTone(140, 'sawtooth', 0.28, 0.22, 35);
    this.playNoise(0.2, 0.22);
  }

  public killStreak(): void {
    if (!this.canPlay('killStreak', 250)) return;
    [587, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.playTone(f, 'triangle', 0.11, 0.14, f * 1.15), i * 55)
    );
  }

  public levelUp(): void {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      setTimeout(() => this.playTone(f, 'square', 0.12, 0.15), i * 70)
    );
  }

  public chestOpen(): void {
    [440, 554, 659, 880, 1108, 1318, 1760].forEach((f, i) =>
      setTimeout(() => this.playTone(f, 'square', 0.14, 0.18), i * 60)
    );
  }

  public bossWarning(): void {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(330, 'sawtooth', 0.35, 0.22, 180);
      }, i * 350);
    }
  }

  public victory(): void {
    [523, 587, 659, 784, 1046, 1318, 1568].forEach((f, i) =>
      setTimeout(() => this.playTone(f, 'triangle', 0.18, 0.18), i * 100)
    );
  }

  private pauseBgmTimerOnly(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private resumeBgmIfNeeded(): void {
    if (!this.bgmMode || !this.enabled || this.hiddenSuspended || this.adSuspended) return;
    if (this.bgmTimer !== null) return;
    this.startBgmInterval(this.bgmMode);
  }

  private startBgmInterval(mode: 'hub' | 'battle'): void {
    const hubNotes = [220, 261, 329, 261, 196, 220, 261, 196];
    const battleNotes = [110, 110, 130, 146, 164, 146, 130, 110, 98, 98, 110, 130, 146, 164, 196, 164];

    this.bgmTimer = window.setInterval(() => {
      if (!this.enabled || this.hiddenSuspended || this.adSuspended) return;
      if (mode === 'hub') {
        const note = hubNotes[this.bgmStep % hubNotes.length];
        this.playTone(note, 'sine', 0.35, 0.04);
        if (this.bgmStep % 2 === 0) {
          this.playTone(note * 1.5, 'triangle', 0.2, 0.02);
        }
      } else {
        const note = battleNotes[this.bgmStep % battleNotes.length];
        this.playTone(note, 'triangle', 0.16, 0.06);
        if (this.bgmStep % 4 === 0) {
          this.playTone(note * 0.5, 'sawtooth', 0.25, 0.08);
          this.playNoise(0.04, 0.03);
        }
      }
      this.bgmStep++;
    }, 280);
  }

  public startBgm(mode: 'hub' | 'battle' = 'hub'): void {
    if (this.bgmMode === mode && this.bgmTimer !== null) return;
    this.pauseBgmTimerOnly();
    this.bgmMode = mode;
    this.bgmStep = 0;
    if (!this.enabled || this.hiddenSuspended || this.adSuspended) return;
    this.startBgmInterval(mode);
  }

  public stopBgm(): void {
    this.pauseBgmTimerOnly();
    this.bgmMode = null;
    this.bgmStep = 0;
  }
}
