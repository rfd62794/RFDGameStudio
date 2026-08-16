import type { CultureId } from './types';

/**
 * Culture stat asymmetry — per-House gameplay modifiers derived from
 * each House's narrative description (flavorText.ts).
 *
 * DESIGN GROUNDING (honestly labeled):
 *
 * Directly traced from narrative:
 *   Ember:   "most aggressive believers in the rush" → +1 unit on Expand
 *   Tundra:  "fortifies them against everyone" → cheaper Fortify ($10k), higher fort cap (4)
 *             "largest Ore reserves" → income bonus ($12k/cell)
 *   Marsh:   "half-worshipping what grows in the dark" → higher base opinion (60), stronger Unrest (+10)
 *   Gale:    "moves Ore faster than anyone" → faster transits (2 days vs 4)
 *   Tide:    "finances every other House's operations" → higher income ($14k/cell)
 *   Crystal: "maps the Ore's structure at atomic resolution" → bonus unit at Annual Report
 *
 * Reasonable extrapolations to complete mirror-pair structure:
 *   Ember's Fortify cost $25k + fort max 2: impatience with defense, implied by "let the fire spread"
 *   Tundra's base opinion 55: stable, content population implied by hoarding/fortification posture
 *   Crystal's opinion starts 45: clinical/instrumental posture, implied by "must understand what it does"
 *   Gale's fort max 2: no long-term investment in place, implied by "cynical exploiters"
 *   Tide's transit 5 days: financial House moves money not convoys, structural mirror with Gale
 *
 * BALANCE TUNING HISTORY:
 *   Round 1: Ember 35%, Tundra 5%, Tide 5% — Ember's expand bonus too strong,
 *     Tundra's expandCost penalty + Tide's 6-day transit too punishing.
 *   Round 2: Ember 33.3%, Tundra 1.7%, Tide 6.7% — Removed Tundra expandCost,
 *     added Tundra income bonus, reduced Tide transit to 5. Tundra still too weak.
 *   Round 3 (current): Ember 30%, Tundra 6.7%, Tide 6.7% — Boosted Tundra fortify
 *     cost to $10k, income to $12k, opinion to 55. Boosted Tide income to $14k.
 *     Spread is 30% to 6.7% — passes ≤35% threshold but spread is wide.
 *     Root cause: aggression compounds better than defense in all-AI meta.
 *     This is a known limitation of AI-vs-AI simulation — human play may differ.
 *
 * All modifiers are modest, same order of magnitude — no doubled rates or
 * 100% multipliers. Verified by the balance harness (test_planetofgreed_house_stats.ts).
 */

export interface HouseStats {
  cultureId: CultureId;

  // Expansion
  expandBonusUnits: number;      // extra units sent on Expand (Ember +1)
  expandCost: number;            // cost to issue Expand order (0 = free for all Houses)

  // Defense
  fortifyCost: number;           // cost to Fortify (Tundra 10k, Ember 25k, default 20k)
  fortifyMax: number;            // max fortification level (Tundra 4, Ember/Gale 2, default 3)

  // Economy
  incomePerCell: number;         // weekly income per owned cell (Tide 14k, Tundra 12k, default 10k)
  transitDays: number;           // days for unit transits (Gale 2, Tide 5, default 4)
  annualBonusUnits: number;      // bonus units at Annual Report (Crystal +1, default 0)

  // Population Balance
  baseOpinion: number;           // starting publicOpinion (Marsh 60, Tundra 55, Crystal 45, default 50)
  unrestBoost: number;           // Civic Unrest Focus offset (Marsh +10, default +8)
}

export const DEFAULT_HOUSE_STATS: HouseStats = {
  cultureId: 'ember', // placeholder, overridden per-House
  expandBonusUnits: 0,
  expandCost: 0,
  fortifyCost: 20000,
  fortifyMax: 3,
  incomePerCell: 10000,
  transitDays: 4,
  annualBonusUnits: 0,
  baseOpinion: 50,
  unrestBoost: 8,
};

export const HOUSE_STATS: Record<CultureId, HouseStats> = {
  ember: {
    cultureId: 'ember',
    expandBonusUnits: 1,       // DIRECT: "most aggressive believers"
    expandCost: 0,             // default (free Expand)
    fortifyCost: 25000,        // EXTRAPOLATED: impatience with defense
    fortifyMax: 2,             // EXTRAPOLATED: no patience for defensive investment
    incomePerCell: 10000,      // default
    transitDays: 4,            // default
    annualBonusUnits: 0,       // default
    baseOpinion: 50,           // default
    unrestBoost: 8,            // default
  },
  tundra: {
    cultureId: 'tundra',
    expandBonusUnits: 0,       // default
    expandCost: 0,             // default — removed $5k penalty (was over-punishing)
    fortifyCost: 10000,        // DIRECT: "fortifies them against everyone" (reduced from 15k)
    fortifyMax: 4,             // DIRECT: stronger fortifications
    incomePerCell: 12000,      // DIRECT: "largest Ore reserves" → income bonus matching Tide
    transitDays: 4,            // default
    annualBonusUnits: 0,       // default
    baseOpinion: 55,           // EXTRAPOLATED: stable, content population (slight boost)
    unrestBoost: 8,            // default
  },
  marsh: {
    cultureId: 'marsh',
    expandBonusUnits: 0,       // default
    expandCost: 0,             // default
    fortifyCost: 20000,        // default
    fortifyMax: 3,             // default
    incomePerCell: 10000,      // default
    transitDays: 4,            // default
    annualBonusUnits: 0,       // default
    baseOpinion: 60,           // DIRECT: "half-worshipping" → devoted population
    unrestBoost: 10,           // DIRECT: stronger Civic Unrest investment
  },
  gale: {
    cultureId: 'gale',
    expandBonusUnits: 0,       // default
    expandCost: 0,             // default
    fortifyCost: 20000,        // default
    fortifyMax: 2,             // EXTRAPOLATED: no long-term investment in place
    incomePerCell: 10000,      // default
    transitDays: 2,            // DIRECT: "moves Ore faster than anyone"
    annualBonusUnits: 0,       // default
    baseOpinion: 50,           // default
    unrestBoost: 8,            // default
  },
  tide: {
    cultureId: 'tide',
    expandBonusUnits: 0,       // default
    expandCost: 0,             // default
    fortifyCost: 20000,        // default
    fortifyMax: 3,             // default
    incomePerCell: 14000,      // DIRECT: "finances every other House's operations" (boosted from 12k)
    transitDays: 5,            // EXTRAPOLATED: financial House, not logistics (reduced from 6)
    annualBonusUnits: 0,       // default
    baseOpinion: 50,           // default
    unrestBoost: 8,            // default
  },
  crystal: {
    cultureId: 'crystal',
    expandBonusUnits: 0,       // default
    expandCost: 0,             // default
    fortifyCost: 20000,        // default
    fortifyMax: 3,             // default
    incomePerCell: 10000,      // default
    transitDays: 4,            // default
    annualBonusUnits: 1,       // DIRECT: "maps the Ore's structure" → research dividend
    baseOpinion: 45,           // EXTRAPOLATED: clinical/instrumental posture
    unrestBoost: 8,            // default
  },
};

export function getHouseStats(cultureId: CultureId): HouseStats {
  return HOUSE_STATS[cultureId];
}
