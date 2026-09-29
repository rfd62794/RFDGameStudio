/**
 * Web Audio API Procedural Sound Synthesizer
 * Instant tactile sound effects for node traversal, D20 combat,
 * equipment breakage, and workbench crafting.
 *
 * Migrated to engine/shared/sfx (Polish_Shared_Sfx): the per-game class
 * is now a thin facade over the shared SfxEngine — same public API and
 * note parameters, no duplicated engine internals. The AudioContext is
 * still created lazily inside the first play call, which a browser only
 * honours after a user gesture, so the game stays silent until the
 * player first interacts.
 */
import { SfxEngine } from '../../../engine/shared/sfx';

class ScrapCrawlSound extends SfxEngine {
  constructor() {
    super();
    // This game defaults sound ON; the context is still created lazily
    // inside the first play call (a user gesture by construction).
    this.setMuted(false);
    this.register('sc_move', [
      { type: 'triangle', from: 320, to: 420, dur: 0.07, vol: 0.08 },
    ]);
    this.register('sc_scavenge', [
      { type: 'triangle', from: 440, to: 660, dur: 0.12, vol: 0.12 },
      { type: 'sine', from: 880, to: 1174, at: 0.09, dur: 0.16, vol: 0.1 },
    ]);
    this.register('sc_hazard', [
      { type: 'sawtooth', from: 220, to: 70, dur: 0.25, vol: 0.14 },
    ]);
    this.register('sc_break', [
      { type: 'square', from: 140, to: 360, dur: 0.08, vol: 0.1 },
      { type: 'square', from: 110, to: 60, at: 0.09, dur: 0.18, vol: 0.12 },
    ]);
    this.register('sc_craft', [
      { type: 'square', from: 520, to: 260, dur: 0.08, vol: 0.1 },
      { type: 'sine', from: 1040, to: 780, at: 0.06, dur: 0.12, vol: 0.08 },
    ]);
    this.register('sc_ui_confirm', [
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

  /** Node traversal — short soft tick. */
  public playMove() {
    this.play('sc_move');
  }

  /** Combat won — scavenge payout: rising two-note pickup. */
  public playScavenge() {
    this.play('sc_scavenge');
  }

  /** Combat lost — hazard sting: descending buzz. */
  public playHazard() {
    this.play('sc_hazard');
  }

  /** Equipment life hit zero — harsh malfunction buzz. */
  public playBreak() {
    this.play('sc_break');
  }

  /** Workbench craft — metallic two-tone clank. */
  public playCraft() {
    this.play('sc_craft');
  }

  /** Menu confirmation — short bright tick. */
  public playUiConfirm() {
    this.play('sc_ui_confirm');
  }
}

export const sound = new ScrapCrawlSound();
