/**
 * Web Audio API Procedural Sound Synthesizer
 * Instant tactile sound effects for node traversal, D20 combat,
 * equipment breakage, and workbench crafting.
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

  /** Node traversal — short soft tick. */
  public playMove() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 320, to: 420, dur: 0.07, vol: 0.08 });
  }

  /** Combat won — scavenge payout: rising two-note pickup. */
  public playScavenge() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'triangle', from: 440, to: 660, dur: 0.12, vol: 0.12 });
    this.tone({ type: 'sine', from: 880, to: 1174, at: 0.09, dur: 0.16, vol: 0.1 });
  }

  /** Combat lost — hazard sting: descending buzz. */
  public playHazard() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'sawtooth', from: 220, to: 70, dur: 0.25, vol: 0.14 });
  }

  /** Equipment life hit zero — harsh malfunction buzz. */
  public playBreak() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'square', from: 140, to: 360, dur: 0.08, vol: 0.1 });
    this.tone({ type: 'square', from: 110, to: 60, at: 0.09, dur: 0.18, vol: 0.12 });
  }

  /** Workbench craft — metallic two-tone clank. */
  public playCraft() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    this.tone({ type: 'square', from: 520, to: 260, dur: 0.08, vol: 0.1 });
    this.tone({ type: 'sine', from: 1040, to: 780, at: 0.06, dur: 0.12, vol: 0.08 });
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
