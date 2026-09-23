/**
 * Person generator v1 — the real, small starting archetype vocabulary.
 *
 * Design boundary (see directive): "role" means a generic archetype, NOT a
 * game-specific title. Succession's Chancellor/Archbishop/Commander MAP ONTO
 * these archetypes; they are not the archetype list. Five archetypes only
 * this phase — adding a sixth to make one figure fit must be flagged, not
 * done silently.
 *
 * Palette values are sourced from the studio's design-token file
 * (ts/src/ui/tokens.css), not invented ad hoc:
 *   ruler    → --accent  #6c8ef7  (authority)
 *   warrior  → --red     #f87171  (martial)
 *   cleric   → --yellow  #fbbf24  (faith/gold)
 *   merchant → --green   #34d399  (commerce/prosperity)
 *   scholar  → --amber   #f59e0b  (knowledge)
 */

export type PersonArchetype =
  | 'ruler' // administrative/political authority
  | 'warrior' // martial/military
  | 'cleric' // religious/faith authority
  | 'merchant' // commercial/trade
  | 'scholar'; // knowledge/deduction-oriented

export const PERSON_ARCHETYPES: readonly PersonArchetype[] = [
  'ruler',
  'warrior',
  'cleric',
  'merchant',
  'scholar',
] as const;

/** Base silhouette shape rendered behind the charge. */
export type SymbolShape = 'circle' | 'shield' | 'diamond' | 'hexagon';

/**
 * A real, simple SVG path-data string drawn inside the base shape as the
 * archetype's identifying mark. Coordinates are authored against a 0..100
 * viewBox so they're shape- and size-independent.
 */
export interface ArchetypeSymbolSpec {
  archetype: PersonArchetype;
  shape: SymbolShape;
  charge: string; // SVG path data (viewBox 0 0 100 100) — the mark inside the shape
  defaultPalette: string; // a real color sourced from tokens.css
}

/**
 * The fixed, real per-archetype base spec. `generateRoleSymbol` layers
 * deterministic seed-driven variation on top of this; the base itself is
 * constant so every archetype has a recognizable, distinct identity even
 * with no seed.
 *
 * Charges are simple, readable SVG paths (viewBox 0 0 100 100):
 *   ruler    → a crown (three points + base band)
 *   warrior  → a crossed-swords pair (two diagonal blades)
 *   cleric   → a holy symbol (ring + vertical staff)
 *   merchant → a coin (ring + central dot)
 *   scholar  → an open book (two pages + spine)
 */
export const ARCHETYPE_BASE_SPECS: Record<PersonArchetype, ArchetypeSymbolSpec> = {
  ruler: {
    archetype: 'ruler',
    shape: 'hexagon',
    // crown: base band + three peaks with jewel dots
    charge: 'M20 62 L80 62 L80 56 L70 56 L70 40 L60 52 L50 36 L40 52 L30 40 L30 56 L20 56 Z',
    defaultPalette: '#6c8ef7',
  },
  warrior: {
    archetype: 'warrior',
    shape: 'shield',
    // crossed swords: two diagonal blades meeting at center
    charge: 'M28 28 L72 72 M72 28 L28 72 M24 24 L34 30 M76 24 L66 30 M24 76 L34 70 M76 76 L66 70',
    defaultPalette: '#f87171',
  },
  cleric: {
    archetype: 'cleric',
    shape: 'diamond',
    // ring + vertical staff: a faith symbol
    charge: 'M50 30 A12 12 0 1 1 49.9 30 Z M50 42 L50 78 M40 60 L60 60',
    defaultPalette: '#fbbf24',
  },
  merchant: {
    archetype: 'merchant',
    shape: 'circle',
    // coin: outer ring + central dot
    charge: 'M50 38 A14 14 0 1 1 49.9 38 Z M50 47 A5 5 0 1 1 49.9 47 Z',
    defaultPalette: '#34d399',
  },
  scholar: {
    archetype: 'scholar',
    shape: 'diamond',
    // open book: two pages + spine
    charge: 'M50 40 L30 46 L30 66 L50 60 L70 66 L70 46 Z M50 40 L50 60',
    defaultPalette: '#f59e0b',
  },
};
