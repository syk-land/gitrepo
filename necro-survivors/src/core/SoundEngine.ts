// =========================================================================
// 8비트 레트로 칩튠 신디사이저 사운드 엔진 (SoundEngine.ts)
// 외부 오디오 파일 없이 Web Audio API로 100% 동작
// =========================================================================

export class SoundEngine {
  private static instance: SoundEngine;
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private bgmTimer: number | null = null;
  private bgmMode: 'hub' | 'battle' | null = null;
  private gemPitchCounter: number = 0;

  private constructor() {}

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  public init(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public playTone(
    freq: number,
    type: OscillatorType = 'square',
    duration: number = 0.1,
    vol: number = 0.12,
    slideTo: number | null = null
  ): void {
    if (!this.enabled) return;
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
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      whiteNoise.connect(gain);
      gain.connect(this.ctx.destination);
      whiteNoise.start(now);
    } catch {}
  }

  // --- 효과음 프리셋 ---
  public click(): void {
    this.playTone(880, 'square', 0.04, 0.08, 1200);
  }

  public hit(): void {
    this.playTone(220, 'triangle', 0.06, 0.12, 90);
  }

  public crit(): void {
    this.playTone(587, 'square', 0.08, 0.16, 1174);
    setTimeout(() => this.playTone(1174, 'square', 0.1, 0.16, 1760), 50);
  }

  public skill(): void {
    this.playTone(440, 'triangle', 0.14, 0.12, 880);
  }

  public shoot(): void {
    this.playTone(720, 'square', 0.05, 0.08, 300);
  }

  public gemPickup(): void {
    this.gemPitchCounter = (this.gemPitchCounter + 1) % 6;
    const baseFreqs = [523, 587, 659, 698, 784, 880];
    const freq = baseFreqs[this.gemPitchCounter];
    this.playTone(freq, 'sine', 0.07, 0.08, freq * 1.2);
  }

  public corpseBurst(): void {
    this.playTone(140, 'sawtooth', 0.28, 0.22, 35);
    this.playNoise(0.2, 0.22);
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

  public startBgm(mode: 'hub' | 'battle' = 'hub'): void {
    if (this.bgmMode === mode) return;
    this.stopBgm();
    this.bgmMode = mode;
    if (!this.enabled) return;

    let step = 0;
    const hubNotes = [220, 261, 329, 261, 196, 220, 261, 196];
    const battleNotes = [110, 110, 130, 146, 164, 146, 130, 110, 98, 98, 110, 130, 146, 164, 196, 164];

    this.bgmTimer = window.setInterval(() => {
      if (!this.enabled) return;
      if (mode === 'hub') {
        const note = hubNotes[step % hubNotes.length];
        this.playTone(note, 'sine', 0.35, 0.04);
        if (step % 2 === 0) {
          this.playTone(note * 1.5, 'triangle', 0.2, 0.02);
        }
      } else {
        const note = battleNotes[step % battleNotes.length];
        this.playTone(note, 'triangle', 0.16, 0.06);
        if (step % 4 === 0) {
          this.playTone(note * 0.5, 'sawtooth', 0.25, 0.08);
          this.playNoise(0.04, 0.03);
        }
      }
      step++;
    }, 280);
  }

  public stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmMode = null;
  }
}
