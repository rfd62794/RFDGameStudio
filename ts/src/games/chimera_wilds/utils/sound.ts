/**
 * Web Audio API Procedural Sound Synthesizer
 * Instant tactile effects for the encounter loop — no audio files.
 * The AudioContext is created lazily inside the first play call, which
 * only ever runs from a click handler, so audio stays silent until a
 * user gesture.
 *
 * Migrated to engine/shared/sfx (Polish_Shared_Sfx): the per-game class
 * is now a thin facade over the shared SfxEngine — same public API and
 * note parameters, no duplicated engine internals.
 */
import { SfxEngine } from '../../../engine/shared/sfx';

class ChimeraWildsSound extends SfxEngine {
  constructor() {
    super();
    // This game defaults sound ON; the context is still created lazily
    // inside the first play call (a user gesture by construction).
    this.setMuted(false);
    this.register('cw_roll', [
      { type: 'square', from: 900, dur: 0.06, vol: 0.08 },
      { type: 'square', from: 650, at: 0.07, dur: 0.06, vol: 0.08 },
      { type: 'square', from: 400, at: 0.13, dur: 0.06, vol: 0.08 },
    ]);
    this.register('cw_win', [
      { type: 'sine', from: 523, dur: 0.22, vol: 0.12 },
      { type: 'sine', from: 659, at: 0.09, dur: 0.22, vol: 0.12 },
      { type: 'sine', from: 784, at: 0.18, dur: 0.22, vol: 0.12 },
    ]);
    this.register('cw_loss', [
      { type: 'sawtooth', from: 220, to: 90, dur: 0.4, vol: 0.12 },
    ]);
  }

  public setEnabled(enabled: boolean) {
    this.setMuted(!enabled);
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted();
  }

  /** D20 rattle — three descending square ticks. */
  public playRoll() {
    this.play('cw_roll');
  }

  /** Encounter won — ascending three-note chime. */
  public playWin() {
    this.play('cw_win');
  }

  /** Encounter lost — descending sawtooth sting. */
  public playLoss() {
    this.play('cw_loss');
  }
}

export const sound = new ChimeraWildsSound();
