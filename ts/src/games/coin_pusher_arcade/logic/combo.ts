// logic/combo.ts — combo window bookkeeping (pure).

// Record a push-off at `now` and report the live streak length: every fall
// timestamp still inside `windowMs` counts, matching the example's
// filter-then-count behaviour.
export function recordFall(
  falls: number[],
  now: number,
  windowMs: number
): { falls: number[]; combo: number } {
  const kept = falls.filter(t => now - t <= windowMs);
  kept.push(now);
  return { falls: kept, combo: kept.length };
}
