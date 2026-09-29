/**
 * Shared procedural SFX — engine.
 *
 * Generalized from gladiator_arena/utils/soundEffects.ts (Web Audio API,
 * lazy context) and slither_rogue/utils/sound.ts (tone-spec helper,
 * gesture unlock). One singleton per page; every game plays named events
 * from the shared registry (or ones it registers itself).
 *
 * Autoplay policy: `muted` starts true — the engine cannot produce sound
 * (or even create an AudioContext) until `unlock()` runs inside a user
 * gesture, either called directly by a game or bound once via
 * `autoUnlock()`. Audio unavailable (no AudioContext, SSR, tests) never
 * throws and never crashes the game.
 */
import { BUILTIN_SFX_EVENTS } from './events';
import type { GainEnvelope, SfxEventDef, SfxNoise, SfxTone } from './types';

/** exponentialRampToValueAtTime can never reach 0 — this is the floor. */
export const SFX_MIN_GAIN = 0.005;

/**
 * Gain envelope for one note: optional linear-ish attack up to `peak`,
 * then an exponential decay to the floor over the remaining duration.
 * Pure math so tests can assert it without an AudioContext.
 */
export function gainEnvelope(vol: number, attack: number, dur: number): GainEnvelope {
  const peak = Math.min(Math.max(vol, SFX_MIN_GAIN), 1);
  const a = Math.max(0, Math.min(attack, Math.max(dur, 0)));
  const end = Math.max(dur, a, 0.001);
  return {
    start: a > 0 ? SFX_MIN_GAIN : peak,
    peak,
    attackEnd: a,
    end,
  };
}

export class SfxEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted: boolean = true;
  private volume: number = 1;
  private readonly events = new Map<string, SfxEventDef>();
  private autoUnlockBound = false;

  constructor() {
    for (const [name, def] of Object.entries(BUILTIN_SFX_EVENTS)) {
      this.events.set(name, def);
    }
  }

  /** Register (or overwrite) a named event. */
  public register(name: string, def: SfxEventDef) {
    this.events.set(name, def);
  }

  public has(name: string): boolean {
    return this.events.has(name);
  }

  public listEvents(): string[] {
    return [...this.events.keys()];
  }

  /** Lazily create/resume the AudioContext; null when unavailable. */
  private ensureCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Call inside a user-gesture handler: clears the default mute and
   * creates/resumes the context while the gesture is still live.
   */
  public unlock() {
    this.muted = false;
    this.ensureCtx();
  }

  /**
   * Bind a one-time pointerdown/keydown listener that calls unlock().
   * Games call this once on mount; sound stays off until the player's
   * first interaction, satisfying browser autoplay policy.
   */
  public autoUnlock() {
    if (this.autoUnlockBound || typeof window === 'undefined') return;
    this.autoUnlockBound = true;
    const handler = () => {
      window.removeEventListener('pointerdown', handler);
      window.removeEventListener('keydown', handler);
      this.unlock();
    };
    window.addEventListener('pointerdown', handler);
    window.addEventListener('keydown', handler);
  }

  /**
   * User-facing mute toggle (separate from the autoplay gate). Pure flag —
   * unmuting does not create the context; playback still inits lazily so
   * games that default to sound-on keep gesture-safe behaviour.
   */
  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /** Master volume multiplier 0..1 applied to every note. */
  public setVolume(volume: number) {
    this.volume = Math.min(Math.max(volume, 0), 1);
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Play a named event from the registry, or an inline event def.
   * Unknown names and muted/unavailable audio are silent no-ops.
   */
  public play(nameOrDef: string | SfxEventDef) {
    if (this.muted) return;
    const def = typeof nameOrDef === 'string' ? this.events.get(nameOrDef) : nameOrDef;
    if (!def) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    for (const note of def) {
      if ((note as SfxNoise).kind === 'noise') {
        this.noise(note as SfxNoise);
      } else {
        this.tone(note as SfxTone);
      }
    }
  }

  private tone(note: SfxTone) {
    const ctx = this.ctx;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + (note.at ?? 0);
    const env = gainEnvelope(note.vol * this.volume, note.attack ?? 0, note.dur);

    osc.type = note.type;
    osc.frequency.setValueAtTime(Math.max(note.from, 1), t0);
    if (note.to !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(note.to, 1), t0 + env.end);
    }

    gain.gain.setValueAtTime(env.start, t0);
    if (env.attackEnd > 0) {
      gain.gain.exponentialRampToValueAtTime(env.peak, t0 + env.attackEnd);
    }
    gain.gain.exponentialRampToValueAtTime(SFX_MIN_GAIN, t0 + env.end);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t0);
    osc.stop(t0 + env.end + 0.02);
  }

  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const len = Math.max(1, Math.floor(ctx.sampleRate * 0.5));
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buf;
    }
    return this.noiseBuffer;
  }

  private noise(note: SfxNoise) {
    const ctx = this.ctx;
    if (!ctx) return;

    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);

    const gain = ctx.createGain();
    const t0 = ctx.currentTime + (note.at ?? 0);
    const env = gainEnvelope(note.vol * this.volume, note.attack ?? 0, note.dur);

    gain.gain.setValueAtTime(env.start, t0);
    if (env.attackEnd > 0) {
      gain.gain.exponentialRampToValueAtTime(env.peak, t0 + env.attackEnd);
    }
    gain.gain.exponentialRampToValueAtTime(SFX_MIN_GAIN, t0 + env.end);

    if (note.filterType) {
      const filter = ctx.createBiquadFilter();
      filter.type = note.filterType;
      filter.frequency.setValueAtTime(Math.max(note.filterFreq ?? 1000, 10), t0);
      if (note.filterQ !== undefined) {
        filter.Q.setValueAtTime(note.filterQ, t0);
      }
      src.connect(filter);
      filter.connect(gain);
    } else {
      src.connect(gain);
    }
    gain.connect(ctx.destination);

    src.start(t0);
    src.stop(t0 + env.end + 0.02);
  }
}
