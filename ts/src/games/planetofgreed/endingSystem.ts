import { Corporation, EndingEvent } from './types';

// Phase 3: Rank-1 ending trigger.
//
// Checked at every Annual Report (not only the campaign-final one). If the
// PLAYER's House is Rank 1, fire ENDING_TRIGGERED with the player's current
// Fragment count and halt further cycling. An AI House reaching Rank 1
// does NOT trigger anything this phase (Design.md v0.2 doesn't specify
// AI-victory behavior -- continue the campaign as normal; flagged as a gap
// in the completion report, not invented here).
//
// The payload {fragmentCount, total} is the full extent of this phase's
// ending implementation -- no cutscene, no narration, no new screen beyond
// a minimal placeholder. Real ending content is out of scope (Design.md
// v0.2 §Ending, §MVP Scope).

export const TOTAL_FRAGMENTS = 6;

// Returns an EndingEvent if the player's House is currently Rank 1, else
// null. Pure function -- does not mutate state or halt cycling itself;
// the caller (App.tsx) is responsible for setting campaignOver and
// storing the event on GameState.
//
// `corps` must have fresh ranks (caller runs computeRank first).
// `playerHouseId` is the player's corp id (PLAYER_CORP_ID in App.tsx).
export function checkEnding(
  corps: Corporation[],
  playerHouseId: string,
): EndingEvent | null {
  const player = corps.find((c) => c.id === playerHouseId);
  if (!player) return null;

  // Only the PLAYER reaching Rank 1 triggers. An AI House at Rank 1 does
  // not fire the player ending event.
  if (player.rank !== 1) return null;

  const fragmentCount = player.fragments.length;
  return {
    type: 'ENDING_TRIGGERED',
    fragmentCount,
    total: TOTAL_FRAGMENTS,
  };
}
