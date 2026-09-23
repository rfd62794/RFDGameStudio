export const HATCH_DURATION_MS = 30_000
export const PEN_UPGRADE_COST = 20
export const DISPLAY_SLOT_COUNT = 2
export const DISPLAY_BASE_RATE = 0.5 // gold per second per colorTier x shapeTier

/** Gold cost to add a new incubation tank slot (Roost from GDD §4.4). */
export const TANK_UPGRADE_COST = 50

/** Probability (0–1) that each trait inherits from the host vs. donor. */
export const BREED_HOST_WEIGHT = 0.60

/**
 * Probability (0–1) that a recipe-matching breed produces the
 * discovery color/shape instead of inheriting a parent trait.
 */
export const BREED_DISCOVERY_CHANCE = 0.40

// ── Regent System ─────────────────────────────────────────────

/** Regents awarded when discovering a trait for the first time, by tier. */
export const DISCOVERY_REGENT_REWARDS: Record<number, number> = {
  2: 5,
  3: 15,
  4: 40,
}

export const REGENT_LOCK_COST: Record<number, number> = {
  1: 2,
  2: 5,
  3: 12,
  4: 25,
}

// ── Wanderer Requests ─────────────────────────────────────────

/** Maximum number of active wanderer requests available at any time. */
export const WANDERER_REQUEST_MAX = 3

/** Multiplier applied to a Slime's base gold value when fulfilled via request. */
export const WANDERER_PREMIUM_MULTI = 3.0
