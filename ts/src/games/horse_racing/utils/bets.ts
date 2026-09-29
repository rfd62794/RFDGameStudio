/**
 * Bet settlement display rules — single source for "did this bet win".
 * Shared by BettingTab (Bet Results panel) and RaceTrack (results table).
 * Win pays on rank 1, Place on top 2, Show on top 3.
 */
import type { Bet } from '../types';

export function isBetWin(type: Bet['type'], rank: number | undefined | null): boolean {
  if (rank == null) return false;
  if (type === 'Win') return rank === 1;
  if (type === 'Place') return rank <= 2;
  return rank <= 3;
}
