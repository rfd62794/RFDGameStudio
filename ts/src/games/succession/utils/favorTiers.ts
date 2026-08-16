import { FigureState, ClaimantId } from '../engine/types';

export type FavorTier =
  | 'Uncommitted / Even'
  | 'Slight Lean'
  | 'Decisive Favor'
  | 'Unyielding Backing';

export interface ClaimantStanding {
  claimantId: ClaimantId;
  name: string;
  isPlayer: boolean;
  tier: FavorTier | 'Contender' | 'Trailing' | 'Distant' | 'Far Behind';
  description: string;
}

export interface FigureQualitativeStanding {
  tier: FavorTier;
  leaderId: ClaimantId | null;
  leaderName: string | null;
  leadMargin: number;
  label: string;
  claimantStandings: ClaimantStanding[];
}

/**
 * Maps numeric favor scores across the 3 claimants for a Council figure into
 * qualitative standing tiers, removing arithmetic calculation from active play.
 *
 * Tiers:
 * - Uncommitted / Even: Standings within 3 points of each other (or all zero).
 * - Slight Lean: Lead of 4–15 points.
 * - Decisive Favor: Lead of 16–30 points.
 * - Unyielding Backing: Lead of 31+ points.
 */
export function getFigureQualitativeStanding(figure: FigureState): FigureQualitativeStanding {
  const claimantsList: { id: ClaimantId; name: string; isPlayer: boolean; favor: number }[] = [
    { id: 'player', name: 'You', isPlayer: true, favor: figure.favor.player },
    { id: 'aldric', name: 'Lord Aldric', isPlayer: false, favor: figure.favor.aldric },
    { id: 'vivienne', name: 'Lady Vivienne', isPlayer: false, favor: figure.favor.vivienne },
  ];

  claimantsList.sort((a, b) => b.favor - a.favor);

  const top1 = claimantsList[0];
  const top2 = claimantsList[1];

  const leadMargin = top1.favor - top2.favor;

  let tier: FavorTier = 'Uncommitted / Even';
  let leaderId: ClaimantId | null = null;
  let leaderName: string | null = null;
  let label = 'Uncommitted / Even';

  if (top1.favor === 0 || leadMargin <= 3) {
    tier = 'Uncommitted / Even';
    leaderId = null;
    leaderName = null;
    label = top1.favor === 0 ? 'Uncommitted' : 'Evenly Contested';
  } else if (leadMargin >= 4 && leadMargin <= 15) {
    tier = 'Slight Lean';
    leaderId = top1.id;
    leaderName = top1.name;
    label = top1.isPlayer ? 'Slight Lean toward You' : `Slight Lean toward ${top1.name}`;
  } else if (leadMargin >= 16 && leadMargin <= 30) {
    tier = 'Decisive Favor';
    leaderId = top1.id;
    leaderName = top1.name;
    label = top1.isPlayer ? 'Decisive Favor for You' : `Decisive Favor for ${top1.name}`;
  } else {
    tier = 'Unyielding Backing';
    leaderId = top1.id;
    leaderName = top1.name;
    label = top1.isPlayer ? 'Unyielding Backing for You' : `Unyielding Backing for ${top1.name}`;
  }

  // Generate per-claimant qualitative descriptions
  const claimantStandings: ClaimantStanding[] = claimantsList.map((c) => {
    if (tier === 'Uncommitted / Even') {
      return {
        claimantId: c.id,
        name: c.name,
        isPlayer: c.isPlayer,
        tier: 'Uncommitted / Even',
        description: top1.favor === 0 ? 'Uncommitted' : 'Even Standing',
      };
    }

    if (c.id === leaderId) {
      return {
        claimantId: c.id,
        name: c.name,
        isPlayer: c.isPlayer,
        tier,
        description: tier,
      };
    }

    const deficit = top1.favor - c.favor;
    if (deficit <= 3) {
      return {
        claimantId: c.id,
        name: c.name,
        isPlayer: c.isPlayer,
        tier: 'Contender',
        description: 'Close Contender',
      };
    }
    if (deficit <= 15) {
      return {
        claimantId: c.id,
        name: c.name,
        isPlayer: c.isPlayer,
        tier: 'Trailing',
        description: 'Trailing Narrowly',
      };
    }
    if (deficit <= 30) {
      return {
        claimantId: c.id,
        name: c.name,
        isPlayer: c.isPlayer,
        tier: 'Distant',
        description: 'Substantial Deficit',
      };
    }
    return {
      claimantId: c.id,
      name: c.name,
      isPlayer: c.isPlayer,
      tier: 'Far Behind',
      description: 'Severely Outpaced',
    };
  });

  return {
    tier,
    leaderId,
    leaderName,
    leadMargin,
    label,
    claimantStandings,
  };
}
