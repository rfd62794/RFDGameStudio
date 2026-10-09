import { mulberry32 } from '../../engine/shared/seededRandom';

// Injected random/clock inputs for the turn engine. This is the ONLY
// planetofgreed module allowed to name Math.random or Date.now: the UI
// passes defaultContext, headless replays pass makeContext(seed).
export type Rng = () => number;

export interface EngineContext {
  rng: Rng;
  now: () => number;
}

export const defaultContext: EngineContext = { rng: Math.random, now: Date.now };

/** A deterministic context: mulberry32(seed) for rng, and a counter for now (starts at 1_000_000, +1 per call). */
export function makeContext(seed: number): EngineContext {
  const rng = mulberry32(seed);
  let counter = 1_000_000;
  return {
    rng,
    now: () => counter++
  };
}

export function randomInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

export function pickOne<T>(rng: Rng, items: readonly T[]): T {
  return items[randomInt(rng, items.length)];
}
