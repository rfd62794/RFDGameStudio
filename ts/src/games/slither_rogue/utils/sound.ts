/**
 * Web Audio API Procedural Sound Synthesizer
 * Instant tactile sound effects for eating, stealing, shield breaks,
 * evolution picks, and the end-of-run sting.
 *
 * Local engine following gladiator_arena/utils/soundEffects.ts — migrate to
 * engine/shared/sfx when that shared module lands (Polish_Shared_Sfx).
 * The AudioContext is created lazily inside the first play call, which a
 * browser only honours after a user gesture, so the game stays silent
 * until the player first interacts.
 */

type ToneOpts = {
  type: OscillatorType;
  from: number;
  to?: number;
  at?: number;
  dur: number;
  vol: number;
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /** Call from a user-gesture handler so the context can start running. */
  public unlock() {
    if (!this.enabled) return;
    this.initCtx();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.enabled;
  }

  private tone({ type, from, to, at = 0, dur, vol }: ToneOpts) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime + at;

    osc.type = type;
    osc.frequency.setValueAtTime(from, now);
    if (to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), now + dur);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + dur);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  /** Fruit eaten — quick rising blip; golden fruit adds a sparkle note. */
  public playEat(isGolden: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sine', from: 480, to: 720, dur: 0.09, vol: 0.12 });
    if (isGolden) {
      this.tone({ type: 'sine', from: 960, to: 1440, at: 0.07, dur: 0.14, vol: 0.1 });
    }
  }

  /** Player bit an NPC joint and stole its tail — rising confirmation. */
  public playSteal() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 260, to: 520, dur: 0.15, vol: 0.12 });
  }

  /** An NPC head hit the player's joints — descending hurt sting. */
  public playStolen() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sawtooth', from: 200, to: 70, dur: 0.22, vol: 0.16 });
  }

  /** Shield charge absorbed a joint hit — hard square ping. */
  public playShieldBreak() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'square', from: 900, to: 300, dur: 0.12, vol: 0.1 });
    this.tone({ type: 'sine', from: 1200, to: 1600, at: 0.05, dur: 0.1, vol: 0.08 });
  }

  /** Evolution modal opened — soft two-note chime. */
  public playEvolveOffer() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sine', from: 392, dur: 0.18, vol: 0.1 });
    this.tone({ type: 'sine', from: 588, at: 0.1, dur: 0.22, vol: 0.1 });
  }

  /** Evolution card picked — ascending three-note arpeggio. */
  public playEvolve() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      this.tone({ type: 'sine', from: freq, at: i * 0.08, dur: 0.2, vol: 0.12 });
    });
  }

  /** Run concluded — descending three-note sting. */
  public playGameOver() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    [392.0, 311.13, 261.63].forEach((freq, i) => {
      this.tone({ type: 'triangle', from: freq, at: i * 0.16, dur: 0.3, vol: 0.12 });
    });
  }

  /** Launch-run confirmation — short bright tick. */
  public playUiConfirm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 660, to: 990, dur: 0.08, vol: 0.1 });
  }
}

export const sound = new SoundEngine();
