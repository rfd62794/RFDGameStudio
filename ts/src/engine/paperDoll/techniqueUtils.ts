/**
 * Portable Technique Utilities (from DiceBear + boring-avatars study)
 *
 * Genuinely portable patterns confirmed by reading both open-source
 * repos directly (both MIT licensed — verified from actual LICENSE
 * files, not assumed):
 *
 *   - DiceBear: MIT License, Copyright (c) 2026 Florian Körner
 *   - boring-avatars: MIT License, Copyright (c) 2021 boringdesigners
 *
 * These are small, real technique upgrades — patterns and math, not
 * copied code. The source repos stay read-only, reference only.
 */

// ── From boring-avatars: getDigit pattern ───────────────────────────
//
// Extracts the nth digit from a number (base 10). This is a genuinely
// different approach from artGen's stateful mulberry32 PRNG: it
// extracts multiple deterministic values from a single hash without
// maintaining PRNG state. Simpler, call-order-independent.
//
// Source: boring-avatars/src/lib/utilities.ts (MIT)

/**
 * Extract the nth digit (0-indexed from right) from a number.
 *
 * Example: getDigit(12345, 0) = 5, getDigit(12345, 2) = 3
 *
 * Ported from boring-avatars' getDigit utility.
 */
export function getDigit(number: number, ntn: number): number {
  return Math.floor((number / Math.pow(10, ntn)) % 10);
}

/**
 * Derive a boolean from a specific digit position of a number.
 * Ported from boring-avatars' getBoolean utility.
 */
export function getBoolean(number: number, ntn: number): boolean {
  return !((getDigit(number, ntn) % 2));
}

/**
 * Derive a signed unit value from a number — modulo of a range, with
 * optional sign flip based on digit parity.
 * Ported from boring-avatars' getUnit utility.
 */
export function getUnit(number: number, range: number, index?: number): number {
  const value = number % range;
  if (index && ((getDigit(number, index) % 2) === 0)) {
    return -value;
  }
  return value;
}

// ── From boring-avatars: YIQ contrast formula ───────────────────────
//
// Determines whether black or white text reads better on a given
// background color. Uses the YIQ (luma) formula — a real, standard
// approach for choosing readable overlay colors.
//
// Source: boring-avatars/src/lib/utilities.ts (MIT)

/**
 * Returns '#000000' or '#FFFFFF' — whichever has better contrast
 * against the given hex color. Uses the YIQ luma formula.
 *
 * Ported from boring-avatars' getContrast utility.
 */
export function getContrastColor(hexcolor: string): string {
  let color = hexcolor;
  if (color.slice(0, 1) === '#') {
    color = color.slice(1);
  }
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

// ── From DiceBear: FNV-1a 32-bit hash ───────────────────────────────
//
// A well-known, robust hash function — more uniform distribution than
// artGen's simple hashString. Used by DiceBear to seed its PRNG from
// arbitrary string seeds.
//
// Source: dicebear/src/js/core/src/Prng/Fnv1a.ts (MIT)

/**
 * Returns the unsigned 32-bit FNV-1a hash of the input string.
 *
 * Ported from DiceBear's Fnv1a.hash implementation.
 * Offset basis: 0x811c9dc5, prime: 0x01000193.
 */
export function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ── From DiceBear: Key-based deterministic value ────────────────────
//
// DiceBear's Prng.getValue(key) creates a new Mulberry32 from
// Fnv1a.hash(seed + ':' + key) — so the same key always produces the
// same value regardless of call order. This is genuinely useful for
// paperDoll where you want deterministic per-slot values without
// maintaining PRNG state.
//
// Source: dicebear/src/js/core/src/Prng.ts (MIT)

/**
 * Returns a deterministic float in [0, 1) derived from seed + key.
 * The same seed/key pair always produces the same value, regardless
 * of call order.
 *
 * Ported from DiceBear's Prng.getValue pattern.
 */
export function getDeterministicValue(seed: string, key: string): number {
  const hash = fnv1aHash(seed + ':' + key);
  // Mulberry32 single-step (same as artGen's mulberry32 but stateless)
  const z = (hash + 0x6d2b79f5) | 0;
  let t = Math.imul(z ^ (z >>> 15), z | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ── From DiceBear: Weighted pick ────────────────────────────────────
//
// Picks a key from a weights map proportional to its weight.
// Useful for paperDoll body plan / preset selection.
//
// Source: dicebear/src/js/core/src/Prng.ts (MIT)

/**
 * Picks a key from `weights` proportional to its weight, using a
 * deterministic seed + key for the random draw.
 *
 * Ported from DiceBear's Prng.weightedPick pattern.
 */
export function weightedPick(
  seed: string,
  key: string,
  weights: Record<string, number>,
): string | undefined {
  const keys = Object.keys(weights);
  if (keys.length === 0) return undefined;
  if (keys.length === 1) return keys[0];

  const totalWeight = keys.reduce((sum, k) => sum + weights[k], 0);
  if (totalWeight === 0) return keys[0];

  const threshold = getDeterministicValue(seed, key) * totalWeight;
  let cumulative = 0;
  for (const k of keys) {
    cumulative += weights[k];
    if (threshold < cumulative) return k;
  }
  return keys[keys.length - 1];
}
