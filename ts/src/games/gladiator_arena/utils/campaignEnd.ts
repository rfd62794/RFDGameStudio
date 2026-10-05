import { ARENA_TIERS } from '../simulation/championLadder';

/** True when the bout opponent is the champion of the last tier on the ladder. */
export function isFinalChampion(opponentId: string): boolean {
  const lastTier = ARENA_TIERS[ARENA_TIERS.length - 1];
  return lastTier.champion.id === opponentId;
}

export const CAMPAIGN_COMPLETE_TITLE = 'You are the Grand Champion!';
export const CAMPAIGN_COMPLETE_BODY =
  'You have beaten the champion of every tier. The ladder stays open: keep fighting for gold, glory and a spotless record.';
