/**
 * Adapter layer — reconciles MBB's canonical Part/BrandId/QualityTier
 * types with the Chimera Paper Doll Studio's internal type names.
 *
 * The Chimera rendering system uses capitalized Brand names ('Trueflame')
 * and spaced QualityTier names ('Brand New') in its hand-authored SVG
 * assets (51KB of `brand === 'Trueflame'` string comparisons). Rather
 * than rewriting all of those, this adapter converts at the API boundary.
 *
 * MBB's types (in shared/partSlots.ts) are the canonical types for the
 * studio. The Chimera system's types are internal to the rendering
 * module. No two parallel type systems exist for the same concepts —
 * MBB's types are authoritative, the Chimera types are rendering-internal.
 */

import type { Part, BrandId, QualityTier, PartSlot } from '../shared/partSlots';
import type {
  Brand as ChimeraBrand,
  QualityTier as ChimeraQualityTier,
  SlotType,
  CreaturePart,
  CreatureConfig,
  BodyArchetype,
  FacingDirection,
  CreaturePose,
} from './chimeraTypes';
import { calculatePose } from './chimeraAnimationEngine';
import type { AnimationType } from './chimeraTypes';

// ── Brand mapping ────────────────────────────────────────────────────

const BRAND_ID_TO_CHIMERA: Record<BrandId, ChimeraBrand> = {
  trueflame: 'Trueflame',
  icevault: 'Icevault',
  quicksilver: 'Quicksilver',
  prismworks: 'Prismworks',
  mirefaith: 'Mirefaith',
  tidalcapital: 'Tidalcapital',
};

const CHIMERA_TO_BRAND_ID: Record<ChimeraBrand, BrandId> = {
  Trueflame: 'trueflame',
  Icevault: 'icevault',
  Quicksilver: 'quicksilver',
  Prismworks: 'prismworks',
  Mirefaith: 'mirefaith',
  Tidalcapital: 'tidalcapital',
};

export function toChimeraBrand(brandId: BrandId | undefined): ChimeraBrand {
  if (!brandId) return 'Trueflame'; // default
  return BRAND_ID_TO_CHIMERA[brandId] ?? 'Trueflame';
}

export function toBrandId(chimeraBrand: ChimeraBrand): BrandId {
  return CHIMERA_TO_BRAND_ID[chimeraBrand] ?? 'trueflame';
}

// ── Quality Tier mapping ─────────────────────────────────────────────

const QUALITY_TO_CHIMERA: Record<QualityTier, ChimeraQualityTier> = {
  brand_new: 'Brand New',
  refurbished: 'Refurbished',
  malfunctioning: 'Malfunctioning',
};

export function toChimeraQuality(quality: QualityTier | undefined): ChimeraQualityTier {
  if (!quality) return 'Brand New';
  return QUALITY_TO_CHIMERA[quality] ?? 'Brand New';
}

// ── Slot mapping ─────────────────────────────────────────────────────

const SLOT_TO_CHIMERA: Record<PartSlot, SlotType> = {
  head: 'head',
  chest: 'chest',
  left_arm: 'leftArm',
  right_arm: 'rightArm',
  left_leg: 'leftLeg',
  right_leg: 'rightLeg',
};

const CHIMERA_TO_SLOT: Record<SlotType, PartSlot> = {
  head: 'head',
  chest: 'chest',
  leftArm: 'left_arm',
  rightArm: 'right_arm',
  leftLeg: 'left_leg',
  rightLeg: 'right_leg',
};

export function toChimeraSlot(slot: PartSlot): SlotType {
  return SLOT_TO_CHIMERA[slot];
}

export function toPartSlot(chimeraSlot: SlotType): PartSlot {
  return CHIMERA_TO_SLOT[chimeraSlot];
}

// ── Part → CreaturePart conversion ───────────────────────────────────

export function partToCreaturePart(part: Part): CreaturePart {
  return {
    brand: toChimeraBrand(part.brand),
    quality: toChimeraQuality(part.qualityTier),
    cyberOrganic: part.cyberOrganicLean ?? 50,
  };
}

// ── Parts → CreatureConfig conversion ────────────────────────────────

/**
 * Convert MBB's PartsBySlot (Record<PartSlot, Part | null>) into a
 * Chimera CreatureConfig for rendering.
 *
 * If any slot is null, a default part is synthesized with the given
 * fallback brand and neutral cyber-organic lean.
 */
export function partsToCreatureConfig(
  id: string,
  name: string,
  parts: Record<string, Part | null>,
  archetype?: BodyArchetype,
): CreatureConfig {
  const slots: Record<SlotType, CreaturePart> = {
    head: { brand: 'Trueflame', quality: 'Brand New', cyberOrganic: 50 },
    chest: { brand: 'Trueflame', quality: 'Brand New', cyberOrganic: 50 },
    leftArm: { brand: 'Trueflame', quality: 'Brand New', cyberOrganic: 50 },
    rightArm: { brand: 'Trueflame', quality: 'Brand New', cyberOrganic: 50 },
    leftLeg: { brand: 'Trueflame', quality: 'Brand New', cyberOrganic: 50 },
    rightLeg: { brand: 'Trueflame', quality: 'Brand New', cyberOrganic: 50 },
  };

  const slotMap: Record<string, SlotType> = {
    head: 'head',
    chest: 'chest',
    left_arm: 'leftArm',
    right_arm: 'rightArm',
    left_leg: 'leftLeg',
    right_leg: 'rightLeg',
  };

  for (const [slotKey, part] of Object.entries(parts)) {
    const chimeraSlot = slotMap[slotKey];
    if (chimeraSlot && part) {
      slots[chimeraSlot] = partToCreaturePart(part);
    }
  }

  // Derive archetype from parts if not provided — default to humanoid
  const resolvedArchetype: BodyArchetype = archetype ?? 'humanoid';

  return {
    id,
    name,
    archetype: resolvedArchetype,
    slots,
  };
}

// ── Default pose helper ──────────────────────────────────────────────

export function getDefaultPose(
  creature: CreatureConfig,
  animation: AnimationType = 'idle',
  t: number = 0,
  facing: FacingDirection = 'side_right',
): CreaturePose {
  const hasMalfunction = Object.values(creature.slots).some(
    s => s.quality === 'Malfunctioning',
  );
  const dominantBrand = getDominantBrandFromCreature(creature);
  return calculatePose(animation, t, creature.archetype, hasMalfunction, dominantBrand, facing);
}

// ── Dominant brand helper (re-exported from chimeraBrands) ───────────

function getDominantBrandFromCreature(creature: CreatureConfig): ChimeraBrand {
  const counts: Record<ChimeraBrand, number> = {
    Trueflame: 0,
    Icevault: 0,
    Quicksilver: 0,
    Prismworks: 0,
    Mirefaith: 0,
    Tidalcapital: 0,
  };
  if (!creature || !creature.slots) return 'Trueflame';
  if (creature.slots.chest) counts[creature.slots.chest.brand] += 2;
  if (creature.slots.head) counts[creature.slots.head.brand] += 1;
  if (creature.slots.leftArm) counts[creature.slots.leftArm.brand] += 1;
  if (creature.slots.rightArm) counts[creature.slots.rightArm.brand] += 1;
  if (creature.slots.leftLeg) counts[creature.slots.leftLeg.brand] += 1;
  if (creature.slots.rightLeg) counts[creature.slots.rightLeg.brand] += 1;
  let maxBrand: ChimeraBrand = creature.slots.chest?.brand || 'Trueflame';
  let maxCount = -1;
  for (const [b, c] of Object.entries(counts)) {
    if (c > maxCount) { maxCount = c; maxBrand = b as ChimeraBrand; }
  }
  return maxBrand;
}
