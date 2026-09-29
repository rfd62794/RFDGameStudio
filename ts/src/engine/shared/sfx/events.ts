/**
 * Shared procedural SFX — built-in event registry.
 *
 * Generic, game-agnostic events. Games may also register their own
 * names via sfx.register(); these cover the common cases
 * (UI confirmations, hits, pickups, wins/losses).
 */
import type { SfxEventDef } from './types';

/** Short UI tick — button press, tab switch, launch confirmation. */
const CLICK: SfxEventDef = [
  { type: 'triangle', from: 660, to: 990, dur: 0.08, vol: 0.1 },
];

/** Two-note soft chime — modal opened, choice offered, selection made. */
const CONFIRM: SfxEventDef = [
  { type: 'sine', from: 392, dur: 0.18, vol: 0.1 },
  { type: 'sine', from: 588, at: 0.1, dur: 0.22, vol: 0.1 },
];

/** Impact thud — collision, hit landed, damage taken. */
const HIT: SfxEventDef = [
  { type: 'triangle', from: 180, to: 30, dur: 0.18, vol: 0.18 },
];

/** Heavier sawtooth impact — critical hit, breaking blow. */
const CRIT: SfxEventDef = [
  { type: 'sawtooth', from: 350, to: 40, dur: 0.35, vol: 0.3 },
];

/** Three bright sine notes — coins, sale, payout, purchase. */
const COIN: SfxEventDef = [
  { type: 'sine', from: 987, dur: 0.2, vol: 0.12 },
  { type: 'sine', from: 1318, at: 0.08, dur: 0.2, vol: 0.12 },
  { type: 'sine', from: 1567, at: 0.16, dur: 0.2, vol: 0.12 },
];

/** Ascending three-note arpeggio — victory, level up, goal scored. */
const WIN: SfxEventDef = [
  { type: 'sine', from: 523.25, dur: 0.2, vol: 0.12 },
  { type: 'sine', from: 659.25, at: 0.08, dur: 0.2, vol: 0.12 },
  { type: 'sine', from: 783.99, at: 0.16, dur: 0.24, vol: 0.12 },
];

/** Descending three-note sting — defeat, game over, run ended. */
const LOSE: SfxEventDef = [
  { type: 'triangle', from: 392.0, dur: 0.3, vol: 0.12 },
  { type: 'triangle', from: 311.13, at: 0.16, dur: 0.3, vol: 0.12 },
  { type: 'triangle', from: 261.63, at: 0.32, dur: 0.34, vol: 0.12 },
];

/** Rising triangle confirmation — steal, grab, equip, evolve pick. */
const PICKUP: SfxEventDef = [
  { type: 'triangle', from: 260, to: 520, dur: 0.15, vol: 0.12 },
];

/** Quick rising blip — eat, collect, small reward. */
const BLIP: SfxEventDef = [
  { type: 'sine', from: 480, to: 720, dur: 0.09, vol: 0.12 },
];

/** Hard square ping plus sparkle — shield break, alarm, error. */
const ALERT: SfxEventDef = [
  { type: 'square', from: 900, to: 300, dur: 0.12, vol: 0.1 },
  { type: 'sine', from: 1200, to: 1600, at: 0.05, dur: 0.1, vol: 0.08 },
];

/** Low square wobble — malfunction, denied action, invalid input. */
const ERROR: SfxEventDef = [
  { type: 'square', from: 120, to: 90, dur: 0.2, vol: 0.12 },
  { type: 'square', from: 380, at: 0.04, to: 140, dur: 0.16, vol: 0.06 },
];

/** Slow rising sawtooth — crowd cheer, fanfare swell. */
const CHEER: SfxEventDef = [
  { type: 'sawtooth', from: 220, to: 440, dur: 0.6, vol: 0.08, attack: 0.4 },
];

/** Filtered noise burst — splash, whoosh, explosion body. */
const SPLASH: SfxEventDef = [
  { kind: 'noise', dur: 0.25, vol: 0.14, filterType: 'lowpass', filterFreq: 900 },
];

/** Short airy noise — swoosh, dash, card flick. */
const WHOOSH: SfxEventDef = [
  { kind: 'noise', dur: 0.12, vol: 0.1, filterType: 'bandpass', filterFreq: 1800, filterQ: 1.2 },
];

export const BUILTIN_SFX_EVENTS: Record<string, SfxEventDef> = {
  click: CLICK,
  confirm: CONFIRM,
  hit: HIT,
  crit: CRIT,
  coin: COIN,
  win: WIN,
  lose: LOSE,
  pickup: PICKUP,
  blip: BLIP,
  alert: ALERT,
  error: ERROR,
  cheer: CHEER,
  splash: SPLASH,
  whoosh: WHOOSH,
};
