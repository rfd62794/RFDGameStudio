import type { CultureId } from './types';

/**
 * Culture stat asymmetry — per-House gameplay modifiers derived from
 * each House's narrative description (flavorText.ts).
 *
 * DESIGN GROUNDING (honestly labeled):
 *
 * Directly traced from narrative:
 *   Ember:   "most aggressive believers in the rush" → +1 unit on Expand
 *   Tundra:  "fortifies them against everyone" → cheaper Fortify, higher fort cap
 *   Marsh:   "half-worshipping what grows in the dark" → higher base opinion, stronger Unrest
 *   Gale:    "moves Ore faster than anyone" → faster transits
 *   Tide:    "finances every other House's operations" → higher income per cell
 *   Crystal: "maps the Ore's structure at atomic resolution" → bonus unit at Annual Report
 *
 * Reasonable extrapolations to complete mirror-pair structure:
 *   Ember's Fortify cost +$5k: impatience with defense, implied by "let the fire spread"
 *   Tundra's Expand cost +$5k: reluctance to expose territory, implied by "every other House is the wrong hands"
 *   Crystal's opinion starts 45: clinical/instrumental posture, implied by "must understand what it does"
 *   Gale's fort max 2: no long-term investment in place, implied by "cynical exploiters"
 *   Tide's transit 6 days: financial House moves money not convoys, structural mirror with Gale
 *
 * All modifiers are modest, same order of magnitude — no doubled rates or
 * 100% multipliers. Verified by the balance harness (test_planetofgreed_house_stats.ts).
 */

export interface HouseStats {
  cultureId: CultureId;

  // Expansion
  expandBonusUnits: number;      // extra units sent on Expand (Ember +1)
  expandCost: number;            // cost to issue Expand order (0 = free, Tundra $5k)

  // Defense
  fortifyCost: number;           // cost to Fortify (Tundra 15k, Ember 25k, default 20k)
  fortifyMax: number;            // max fortification level (Tundra 4, Gale 2, default 3)

  // Economy
  incomePerCell: number;         // weekly income per owned cell (Tide 12k, default 10k)
  transitDays: number;           // days for unit transits (Gale 2, Tide 6, default 4)
  annualBonusUnits: number;      // bonus units at Annual Report (Crystal +1, default 0)

  // Population Balance
  baseOpinion: number;           // starting publicOpinion (Marsh 60, Crystal 45, default 50)
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
    fortifyMax: 3,             // default
    incomePerCell: 10000,      // default
    transitDays: 4,            // default
    annualBonusUnits: 0,       // default
    baseOpinion: 50,           // default
    unrestBoost: 8,            // default
  },
  tundra: {
    cultureId: 'tundra',
    expandBonusUnits: 0,       // default
    expandCost: 5000,          // EXTRAPOLATED: reluctance to expose territory
    fortifyCost: 15000,        // DIRECT: "fortifies them against everyone"
    fortifyMax: 4,             // DIRECT: stronger fortifications
    incomePerCell: 10000,      // default
    transitDays: 4,            // default
    annualBonusUnits: 0,       // default
    baseOpinion: 50,           // default
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
    incomePerCell: 12000,      // DIRECT: "finances every other House's operations"
    transitDays: 6,            // EXTRAPOLATED: financial House, not logistics
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
