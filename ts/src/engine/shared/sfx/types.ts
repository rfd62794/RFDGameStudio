/**
 * Shared procedural SFX — types.
 *
 * Generalized from gladiator_arena/utils/soundEffects.ts and
 * slither_rogue/utils/sound.ts into the shared engine layer
 * (Polish_Shared_Sfx directive). Web Audio API only — no asset files.
 */

/** A single oscillator note inside an event. */
export interface SfxTone {
  kind?: 'tone';
  type: OscillatorType;
  /** Start frequency in Hz. */
  from: number;
  /** Optional end frequency in Hz (exponential ramp over `dur`). */
  to?: number;
  /** Delay in seconds after the event starts. */
  at?: number;
  /** Note length in seconds. */
  dur: number;
  /** Peak gain 0..1, multiplied by the engine's master volume. */
  vol: number;
  /** Attack ramp in seconds (0 = instant on at `vol`). */
  attack?: number;
}

/** A filtered white-noise burst inside an event (thuds, splashes, static). */
export interface SfxNoise {
  kind: 'noise';
  at?: number;
  dur: number;
  vol: number;
  attack?: number;
  /** Optional biquad filter shaping the noise. */
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterQ?: number;
}

export type SfxNote = SfxTone | SfxNoise;

/** A named sound event: an ordered list of notes scheduled together. */
export type SfxEventDef = SfxNote[];

/** Computed gain keyframes for one note — the envelope math, kept pure. */
export interface GainEnvelope {
  /** Value applied via setValueAtTime at the note start. */
  start: number;
  /** Peak value reached after the attack ramp. */
  peak: number;
  /** Seconds from note start to the peak keyframe. */
  attackEnd: number;
  /** Seconds from note start to the floor keyframe. */
  end: number;
}
