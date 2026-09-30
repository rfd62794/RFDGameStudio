/**
 * Web Audio API Procedural Sound Synthesizer
 * Instant tactile sound effects for coin launches, vat collects,
 * card offers, token exchanges, and the end-of-run sting.
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

  /** Coin launched from a shooter — short muffled blip. */
  public playFire() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 320, to: 200, dur: 0.07, vol: 0.08 });
  }

  /** Coin dropped into the vat — bright ding; pitch climbs with combo. */
  public playCollect(combo: number = 0) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const lift = Math.min(combo, 20) * 12;
    this.tone({ type: 'sine', from: 880 + lift, to: 1320 + lift, dur: 0.1, vol: 0.12 });
    if (combo >= 10) {
      this.tone({ type: 'sine', from: 1760 + lift, at: 0.06, dur: 0.12, vol: 0.08 });
    }
  }

  /** Card offer opened — soft two-note chime. */
  public playCardOffer() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sine', from: 392, dur: 0.18, vol: 0.1 });
    this.tone({ type: 'sine', from: 588, at: 0.1, dur: 0.22, vol: 0.1 });
  }

  /** Chip card picked — ascending three-note arpeggio. */
  public playCardPick() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      this.tone({ type: 'sine', from: freq, at: i * 0.08, dur: 0.2, vol: 0.12 });
    });
  }

  /** Token-for-hand exchange — metallic two-tone clank. */
  public playExchange() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'square', from: 520, to: 260, dur: 0.08, vol: 0.1 });
    this.tone({ type: 'sine', from: 1040, to: 780, at: 0.06, dur: 0.12, vol: 0.08 });
  }

  /** Run concluded — ascending fanfare on target met, descending sting otherwise. */
  public playRunEnd(won: boolean) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    const notes = won ? [392.0, 523.25, 659.25, 783.99] : [392.0, 311.13, 261.63];
    notes.forEach((freq, i) => {
      this.tone({ type: 'triangle', from: freq, at: i * 0.14, dur: 0.28, vol: 0.12 });
    });
  }

  /** Menu confirmation — short bright tick. */
  public playUiConfirm() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 660, to: 990, dur: 0.08, vol: 0.1 });
  }
}

export const sound = new SoundEngine();
