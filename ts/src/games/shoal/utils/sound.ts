/**
 * Web Audio API Procedural Sound Synthesizer
 * Tactile sound effects for reef events: grazing, predator strikes,
 * algae-core turnover, tool placement, and the extinction sting.
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
        try {
          this.ctx = new AudioCtx();
        } catch {
          this.ctx = null;
        }
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

  /** Tool placement (fish/shark/algae/cull click) — soft watery plop. */
  public playSpawn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sine', from: 420, to: 180, dur: 0.09, vol: 0.1 });
  }

  /** A fish grazed a nodule or a shark took a chunk — quiet feeding blip. */
  public playNibble() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sine', from: 560, to: 760, dur: 0.06, vol: 0.07 });
  }

  /** A creature died — predator strike; heavy variant for a shark loss. */
  public playStrike(heavy: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({
      type: 'sawtooth',
      from: heavy ? 140 : 220,
      to: heavy ? 40 : 60,
      dur: heavy ? 0.3 : 0.18,
      vol: heavy ? 0.16 : 0.12,
    });
  }

  /**
   * Reef turnover — an algae core starved out (collapsed) or a decomposed
   * chunk seeded a new one. Shoal has no day/night cycle; this is the
   * ecosystem's real periodic boundary event.
   */
  public playBoundary(collapsed: boolean = false) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    if (collapsed) {
      this.tone({ type: 'sine', from: 330, to: 220, dur: 0.25, vol: 0.09 });
      this.tone({ type: 'sine', from: 220, to: 165, at: 0.14, dur: 0.3, vol: 0.08 });
    } else {
      this.tone({ type: 'sine', from: 262, to: 392, dur: 0.25, vol: 0.09 });
      this.tone({ type: 'sine', from: 392, to: 523, at: 0.14, dur: 0.3, vol: 0.08 });
    }
  }

  /** Reef extinction — every fish and shark gone; descending sting. */
  public playReefEnd() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    [392.0, 311.13, 261.63].forEach((freq, i) => {
      this.tone({ type: 'triangle', from: freq, at: i * 0.16, dur: 0.3, vol: 0.12 });
    });
  }

  /** Menu/tool confirmation — short bright tick. */
  public playUiConfirm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 660, to: 990, dur: 0.08, vol: 0.1 });
  }
}

export const sound = new SoundEngine();
