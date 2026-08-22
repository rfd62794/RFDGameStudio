import { GameState, PlayerMoveType } from '../types/gameState';
import { OnboardingTipId } from '../content/onboardingTips';
import { TOTAL_SEGMENTS } from '../data/gameConstants';

/**
 * Real-state-derived onboarding trigger decision (ADR-005). This is the
 * exact function App.tsx calls from its move handlers — extracted here
 * so tests can exercise the real trigger logic end-to-end against real
 * GameState produced by the real gameOrchestration.ts functions, not a
 * reimplementation or a mocked ticker.
 *
 * "Already seen" is never a separate boolean flag that could desync
 * from reality — it's derived directly from the real ticker (for
 * moveType tips) or the real segment counter (for the verdict-approach
 * tip), so a stale check can't outlive the state it's supposed to
 * reflect. This directly guards against both real Time Served Phase 11
 * bugs: firing regardless of the real condition, and re-firing on every
 * revisit because the trigger never checked real prior state.
 *
 * The verdict-approach tip takes priority whenever both conditions
 * apply to the same call — the final-turn explanation is more
 * contextually urgent than a move-specific one.
 */
export function determineTip(
  gameState: GameState,
  moveType: PlayerMoveType,
  tipId: OnboardingTipId
): OnboardingTipId | null {
  if (gameState.segment === TOTAL_SEGMENTS) {
    return 'verdictApproach';
  }
  const alreadyDone = gameState.ticker.some(
    (t) => t.claimantId === 'player' && t.moveType === moveType
  );
  return alreadyDone ? null : tipId;
}
