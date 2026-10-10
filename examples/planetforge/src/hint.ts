// new: examples/planetforge/src/hint.ts

/**
 * The one first-step line, shown only before the ring has started ticking.
 * Returns null once the world is running or has moved, so it never nags.
 */
export function firstStepHint(currentTick: number, isPlaying: boolean): string | null {
  if (currentTick > 0 || isPlaying) return null;
  return 'Press Play to start the ring, then pick a tile and raise an element to see what it does.';
}
