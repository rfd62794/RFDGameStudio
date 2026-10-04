// new: ts/src/games/slither_rogue/utils/runTip.ts
// One plain, encouraging line for the end-of-run card. Runs end on the timer (nobody "dies"),
// so the line talks about what to try next, not what went wrong.
export interface RunTipInput {
  score: number;          // fruits eaten
  peakLength: number;
  currentLength: number;  // length when the timer ran out
  evolutionsCount: number;
}

export function runTip(r: RunTipInput): string {
  if (r.score === 0) return 'Steer toward the glowing fruit: eating it grows your snake and fills the evolution meter.';
  if (r.evolutionsCount === 0) return 'Keep eating: every few fruits you get to pick an evolution card.';
  if (r.peakLength > 0 && r.currentLength * 2 < r.peakLength) {
    return 'Rival snakes took a big bite of your tail. A Shield card blocks a steal, or give rivals more room.';
  }
  return 'Nice run! Try a different evolution card first and see how the arena changes.';
}
