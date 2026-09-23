/**
 * Succession's first-real-consumer mapping onto the shared person generator
 * archetypes. MAPPING ONLY.
 *
 * ⚠️ This file must NOT be imported into any live Succession UI component
 * (AudienceStage.tsx, ChamberStage.tsx, App.tsx, FigureCard.tsx, …) this
 * directive. Wiring these symbols into the live UI is a deliberate, future
 * phase — after AudienceStage.tsx's in-flight restructure lands.
 *
 * Mappings are sourced from the figures' existing flavor text
 * (courtFigures.ts, claimants.ts) — not invented fresh:
 *
 *   chancellor  → ruler    "Keeper of the King's Seal and Arbiter of the
 *                           High Estates" — administrative/political
 *                           authority. (courtFigures.ts)
 *   archbishop  → cleric   "Primate of the High Sanctum", "Voice of the
 *                           Sacred Order" — religious/faith authority.
 *                           (courtFigures.ts)
 *   commander   → warrior  "Warden of the Iron Gate", "Commander of the
 *                           Fortress Legion" — martial/military.
 *                           (courtFigures.ts)
 *   aldric      → merchant "Scion of House Montfort", "levers family
 *                           coffers and courtly connections", "wealthy
 *                           patrician" — commercial/wealth-driven.
 *                           (claimants.ts)
 *   vivienne    → ruler     "Duchess of the High Reaches", "cunning,
 *                           sharp-witted strategist with quiet allies
 *                           across clergy and high nobility" — political
 *                           operator / administrative authority.
 *                           (claimants.ts)
 *
 * Real finding (flagged, not silently worked around): Succession's cast
 * maps onto 4 of the 5 archetypes — ruler, warrior, cleric, merchant. The
 * `scholar` archetype is unused by this cast. That's a genuine property of
 * the cast, not a gap in the vocabulary; no sixth archetype was needed and
 * none was added. Two figures (chancellor, vivienne) both map to `ruler`,
 * which is permitted — the vocabulary is archetypal, not one-to-one.
 */
import { PersonArchetype } from '../../../engine/shared/personGenerator/archetypes';
import { FigureId, ClaimantId } from '../engine/types';

/**
 * The 5 real Succession cast members with fixed NPC identities: the three
 * court figures plus the two non-player rival claimants. The player
 * claimant is intentionally excluded — its archetype varies by player
 * origin and is not a fixed NPC role.
 */
export type SuccessionCastId = FigureId | Exclude<ClaimantId, 'player'>;

export const FIGURE_ARCHETYPE_MAP: Record<SuccessionCastId, PersonArchetype> = {
  chancellor: 'ruler',
  archbishop: 'cleric',
  commander: 'warrior',
  aldric: 'merchant',
  vivienne: 'ruler',
};

/** Convenience: the FigureId-only subset (the three court figures). */
export const COURT_FIGURE_ARCHETYPE_MAP: Record<FigureId, PersonArchetype> = {
  chancellor: FIGURE_ARCHETYPE_MAP.chancellor,
  archbishop: FIGURE_ARCHETYPE_MAP.archbishop,
  commander: FIGURE_ARCHETYPE_MAP.commander,
};
