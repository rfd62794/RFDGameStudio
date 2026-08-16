import { FigureState, ClaimantId } from './types';

export interface VerdictResult {
  perFigureWinner: Record<string, ClaimantId | null>;
  overallWinner: ClaimantId | null;
  isMajority: boolean;
}

export function resolveVerdict(
  figures: FigureState[],
  claimantIds: ClaimantId[]
): VerdictResult {
  const perFigureWinner: Record<string, ClaimantId | null> = {};

  figures.forEach((figure) => {
    const eligible = claimantIds
      .filter((id) => !figure.exposedAgainst.includes(id))
      .sort((a, b) => figure.favor[b] - figure.favor[a]);
    perFigureWinner[figure.id] = eligible.length > 0 ? eligible[0] : null;
  });

  const counts: Record<string, number> = {};
  claimantIds.forEach((id) => (counts[id] = 0));
  Object.values(perFigureWinner).forEach((winner) => {
    if (winner) counts[winner]++;
  });

  const majorityWinner = claimantIds.find((id) => counts[id] >= 2) ?? null;
  if (majorityWinner) {
    return { perFigureWinner, overallWinner: majorityWinner, isMajority: true };
  }

  // Deadlock (no one won 2+ figures): resolve by fewest total contradictions.
  const contradictionCounts: Record<string, number> = {};
  claimantIds.forEach((id) => {
    contradictionCounts[id] = figures.filter((f) => f.exposedAgainst.includes(id)).length;
  });
  const minContradictions = Math.min(...Object.values(contradictionCounts));
  const leastExposed = claimantIds.filter((id) => contradictionCounts[id] === minContradictions);

  if (leastExposed.length === 1) {
    return { perFigureWinner, overallWinner: leastExposed[0], isMajority: false };
  }

  // Still tied even on contradictions — the throne sits empty.
  return { perFigureWinner, overallWinner: null, isMajority: false };
}
