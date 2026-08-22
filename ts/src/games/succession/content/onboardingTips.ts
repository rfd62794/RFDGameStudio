// Onboarding tip content (ADR-005). Every explanation below is sourced
// directly from the real mechanic it describes — see the cited
// file/function for each tip. Do not edit tip text without re-verifying
// against the cited source; these are not independently-written
// tutorial copy.

export type OnboardingTipId =
  | 'whisper'
  | 'appeal'
  | 'evidenceScout'
  | 'discredit'
  | 'verdictApproach';

export interface OnboardingTipContent {
  title: string;
  body: string[];
}

export const ONBOARDING_TIPS: Record<OnboardingTipId, OnboardingTipContent> = {
  // Source: engine/favor.ts applyWhisper + engine/gossip.ts
  // checkContradictionAgainstKnown + data/gameConstants.ts
  // WHISPER_FAVOR_GAIN (20). A Whisper is checked against every claim
  // you've EVER made, to any councilor — not just this one — and a
  // contradiction zeroes the gain and permanently disqualifies you from
  // that councilor's vote (engine/verdict.ts excludes anyone in
  // exposedAgainst from winning that figure).
  whisper: {
    title: 'Whisper: High Reward, Real Risk',
    body: [
      'A Whisper is the biggest single favor gain in the game (+20) — but it is checked against every claim you\'ve ever made to any councilor, not just this one.',
      'If it contradicts an earlier claim, you gain 0 favor and are permanently disqualified from that councilor\'s vote at the final verdict. Pick themes that don\'t oppose what you\'ve already said elsewhere.',
    ],
  },

  // Source: utils/gameOrchestration.ts appealTo. Never touches
  // mostRecentClaim, allClaims, or exposedAgainst — an Appeal records no
  // claim at all, so it can never contradict anything and can never
  // expose you. The real trade-off: guaranteed but smaller (usually +8,
  // see data/gameConstants.ts APPEAL_FAVOR_GAIN) vs. Whisper's larger,
  // riskier +20.
  appeal: {
    title: 'Appeal: Guaranteed, But Smaller',
    body: [
      'An Appeal grants a smaller, flat favor gain — but it plants no claim at all, so it can never contradict anything and can never expose you.',
      'It\'s the safe, guaranteed option when a Whisper\'s contradiction risk isn\'t worth it.',
    ],
  },

  // Source: utils/gameOrchestration.ts scoutForEvidence (fixed rotation
  // via scoutedCount, not player choice) + presentEvidenceTo (no-op if
  // evidence.relevantFigureId !== figureId) + data/gameConstants.ts
  // EVIDENCE_FAVOR_GAIN (30, the largest guaranteed gain in the game).
  evidenceScout: {
    title: 'Scouting: Guaranteed Leverage, Later',
    body: [
      'Scouting adds one piece of evidence to your inventory — the specific item is chosen for you in a fixed order, not picked by you.',
      'Each item is tied to one specific councilor. Presenting it there later guarantees +30 favor with zero contradiction risk — the single largest, safest gain in the game. It does nothing if presented anywhere else.',
    ],
  },

  // Source: utils/gameOrchestration.ts discreditFigure. Reduces one
  // named rival's favor at one chosen councilor by a fixed amount
  // (RIVAL_SLANDER_PENALTY, floored at 0). Grants the player no favor
  // of their own — it costs your entire turn, same as any other move.
  discredit: {
    title: 'Discredit: Spend Your Turn to Sabotage, Not Build',
    body: [
      'Discrediting spends your entire turn — same as any other move — but grants you no favor of your own.',
      'Instead, it directly reduces one chosen rival\'s favor with one chosen councilor by a fixed amount. Pure defense: you\'re trading your own advancement this turn for weakening theirs.',
    ],
  },

  // Source: engine/verdict.ts resolveVerdict. Per-figure winner =
  // highest favor among claimants NOT in that figure's exposedAgainst
  // list. Majority = 2+ figures won outright. No majority falls back to
  // fewest total contradictions across all figures; if that's also
  // tied, the throne sits empty (overallWinner: null).
  verdictApproach: {
    title: 'This Is Your Final Move',
    body: [
      'At the end of this turn, the throne is decided. For each councilor, whoever holds the highest favor wins their backing — unless they\'ve been caught contradicting themselves there, which disqualifies them for that councilor entirely.',
      'Win backing from 2 of the 3 councilors and you take the throne outright. If no one reaches 2, the tiebreaker goes to whoever has been caught contradicting themselves the fewest times overall — and if that\'s still tied, the throne sits empty. No one wins.',
    ],
  },
};
