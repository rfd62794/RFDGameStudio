/**
 * Part-slot type system — shared between games that use a 6-slot
 * body-part assembly model with 4 core stats.
 *
 * Extracted from Chimera Wilds and Mutant Battle Ball, which both use
 * the identical 6-slot structure (head, chest, left_arm, right_arm,
 * left_leg, right_leg) and 4-stat structure (accuracy, endurance,
 * power, speed). The reconciliation adopts Mutant Battle Ball's
 * stricter typed union for `slot` and required `price` field, confirmed
 * safe against all real Chimera Wilds data (12 parts, all with prices,
 * all with valid slot names).
 *
 * Games that use this system:
 *   - Chimera Wilds:  random part assembly for one-shot encounters
 *   - Mutant Battle Ball: persistent roster management with match simulation
 *
 * The Part type is shared; the surrounding Part *system* (assembly,
 * combat, injury) is genuinely per-game and not extracted here.
 */

export type PartSlot = 'head' | 'chest' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';

/** MBB-specific Brand identities with real mechanical signatures. */
export type BrandId = 'trueflame' | 'icevault' | 'quicksilver' | 'prismworks' | 'mirefaith' | 'tidalcapital';

/** MBB-specific Quality Tier — affects stat multiplier + Malfunctioning instability. */
export type QualityTier = 'brand_new' | 'refurbished' | 'malfunctioning';

export interface Part {
  id: string;
  name: string;
  slot: PartSlot;
  accuracy: number;
  endurance: number;
  power: number;
  speed: number;
  price: number;
  description?: string;
  /** MBB-only: Brand identity (Trueflame/Icevault/etc.). Undefined for non-MBB parts. */
  brand?: BrandId;
  /** MBB-only: Quality tier. Undefined = treated as brand_new. */
  qualityTier?: QualityTier;
  /** MBB-only: Cyber/Organic lean, 0-100 (0=organic, 100=cyber). Undefined = 50 (neutral). */
  cyberOrganicLean?: number;
}

/** Record of all 6 slots to a Part or null (for empty slot assemblies). */
export interface PartsBySlot {
  head:      Part | null;
  chest:     Part | null;
  left_arm:  Part | null;
  right_arm: Part | null;
  left_leg:  Part | null;
  right_leg: Part | null;
}

/** The canonical slot list, in display order. */
export const PART_SLOTS: readonly PartSlot[] = [
  'head',
  'chest',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
] as const;
