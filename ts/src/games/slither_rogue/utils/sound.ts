/**
 * Web Audio API Procedural Sound Synthesizer
 * Instant tactile sound effects for eating, stealing, shield breaks,
 * evolution picks, and the end-of-run sting.
 *
 * Migrated to engine/shared/sfx (Polish_Shared_Sfx): the per-game class
 * is now a thin facade over the shared SfxEngine — same public API and
 * note parameters, no duplicated engine internals. The AudioContext is
 * still created lazily inside the first play call, which a browser only
 * honours after a user gesture, so the game stays silent until the
 * player first interacts.
 */
import { SfxEngine } from '../../../engine/shared/sfx';

class SlitherRogueSound extends SfxEngine {
  constructor() {
    super();
    // This game defaults sound ON; the context is still created lazily
    // inside the first play call (a user gesture by construction).
    this.setMuted(false);
    this.register('sr_eat', [
      { type: 'sine', from: 480, to: 720, dur: 0.09, vol: 0.12 },
    ]);
    this.register('sr_eat_golden', [
      { type: 'sine', from: 480, to: 720, dur: 0.09, vol: 0.12 },
      { type: 'sine', from: 960, to: 1440, at: 0.07, dur: 0.14, vol: 0.1 },
    ]);
    this.register('sr_steal', [
      { type: 'triangle', from: 260, to: 520, dur: 0.15, vol: 0.12 },
    ]);
    this.register('sr_stolen', [
      { type: 'sawtooth', from: 200, to: 70, dur: 0.22, vol: 0.16 },
    ]);
    this.register('sr_shield_break', [
      { type: 'square', from: 900, to: 300, dur: 0.12, vol: 0.1 },
      { type: 'sine', from: 1200, to: 1600, at: 0.05, dur: 0.1, vol: 0.08 },
    ]);
    this.register('sr_evolve_offer', [
      { type: 'sine', from: 392, dur: 0.18, vol: 0.1 },
      { type: 'sine', from: 588, at: 0.1, dur: 0.22, vol: 0.1 },
    ]);
    this.register('sr_evolve', [
      { type: 'sine', from: 523.25, dur: 0.2, vol: 0.12 },
      { type: 'sine', from: 659.25, at: 0.08, dur: 0.2, vol: 0.12 },
      { type: 'sine', from: 783.99, at: 0.16, dur: 0.2, vol: 0.12 },
    ]);
    this.register('sr_game_over', [
      { type: 'triangle', from: 392.0, dur: 0.3, vol: 0.12 },
      { type: 'triangle', from: 311.13, at: 0.16, dur: 0.3, vol: 0.12 },
      { type: 'triangle', from: 261.63, at: 0.32, dur: 0.3, vol: 0.12 },
    ]);
    this.register('sr_ui_confirm', [
      { type: 'triangle', from: 660, to: 990, dur: 0.08, vol: 0.1 },
    ]);
  }

  /** Call from a user-gesture handler so the context can start running. */
  public unlock() {
    if (this.isMuted()) return;
    super.unlock();
  }

  public setEnabled(enabled: boolean) {
    this.setMuted(!enabled);
  }

  public isSoundEnabled(): boolean {
    return !this.isMuted();
  }

  /** Fruit eaten — quick rising blip; golden fruit adds a sparkle note. */
  public playEat(isGolden: boolean = false) {
    this.play(isGolden ? 'sr_eat_golden' : 'sr_eat');
  }

  /** Player bit an NPC joint and stole its tail — rising confirmation. */
  public playSteal() {
    this.play('sr_steal');
  }

  /** An NPC head hit the player's joints — descending hurt sting. */
  public playStolen() {
    this.play('sr_stolen');
  }

  /** Shield charge absorbed a joint hit — hard square ping. */
  public playShieldBreak() {
    this.play('sr_shield_break');
  }

  /** Evolution modal opened — soft two-note chime. */
  public playEvolveOffer() {
    this.play('sr_evolve_offer');
  }

  /** Evolution card picked — ascending three-note arpeggio. */
  public playEvolve() {
    this.play('sr_evolve');
  }

  /** Run concluded — descending three-note sting. */
  public playGameOver() {
    this.play('sr_game_over');
  }

  /** Launch-run confirmation — short bright tick. */
  public playUiConfirm() {
    this.play('sr_ui_confirm');
  }
}

export const sound = new SlitherRogueSound();
