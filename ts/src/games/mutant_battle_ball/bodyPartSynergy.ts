/**
 * Body Part Synergy — Neo Battlopolis overhaul.
 *
 * Two cross-part mechanics that sit on top of the per-part Brand /
 * Quality / Cyber-Organic modifiers (brandModifiers.ts):
 *
 * 1. Brand Trinity — the "six-Brand Trinity" set bonus. When a mutant
 *    equips 3+ parts of the same Brand, that Brand's signature is
 *    re-applied at the mutant level (the signature effectively
 *    doubles). With 6 slots, at most two Trinities can be active.
 *
 * 2. Cyber-Organic lean compatibility — the "Body Part Synergy" proper.
 *    A mutant whose parts share a uniform lean resonates (bonus to
 *    speed/power); a mutant mixing cyber and organic parts pays a
 *    dissonance penalty. The math is consumed from the shared engine
 *    module `engine/shared/anatomy` (calculateLeanCompatibility) — the
 *    same tier model Gladiator Arena's combat uses — with MBB's 0-100
 *    lean scale converted to the anatomy scale (-1..+1) at the boundary.
 *
 * Wired into calculateStats() in mbbAgent.ts — the single stat
 * pipeline, not a parallel one.
 */

import type { Part, PartsBySlot, BrandId } from '../../engine/shared/partSlots';
import { PART_SLOTS } from '../../engine/shared/partSlots';
import { calculateLeanCompatibility, type LeanCompatibility } from '../../engine/shared/anatomy';
import { applyBrandSignature, type EffectivePartStats } from './brandModifiers';

/** Parts of one Brand needed to activate its Trinity set bonus. */
export const TRINITY_THRESHOLD = 3;

export const COMPATIBILITY_TIER_LABELS: Record<LeanCompatibility['compatibilityTier'], string> = {
  pure_synergy:       'Pure Synergy',
  stable:             'Stable',
  dissonant:          'Dissonant',
  critical_rejection: 'Critical Rejection',
};

export interface MutantSynergyReport {
  /** Equipped-part count per Brand (0-6). Parts without a brand count nowhere. */
  brandCounts: Record<BrandId, number>;
  /** Brands meeting the Trinity threshold on this mutant. */
  trinityBrands: BrandId[];
  /**
   * Cyber-Organic lean compatibility, or null when no equipped part
   * declares a lean (nothing to measure — neutral, no bonus/penalty).
   */
  compatibility: LeanCompatibility | null;
  /** Combined multiplicative stat modifiers (Trinity * lean synergy). */
  statMultipliers: EffectivePartStats;
}

/**
 * Converts MBB's cyberOrganicLean (0-100: 0 organic, 50 neutral,
 * 100 cyber) to the shared anatomy scale (-1.0 organic .. +1.0 cyber).
 */
export function mbbLeanToAnatomyScale(lean: number): number {
  return (lean - 50) / 50;
}

/**
 * Computes the full Body Part Synergy report for a mutant's equipped
 * parts. Pure function — safe for the sim pipeline and for UI render.
 */
export function getMutantSynergy(
  parts: PartsBySlot | Record<string, Part | null> | undefined | null,
): MutantSynergyReport {
  const brandCounts: Record<BrandId, number> = {
    trueflame: 0, icevault: 0, quicksilver: 0,
    prismworks: 0, mirefaith: 0, tidalcapital: 0,
  };
  const leans: number[] = [];

  if (parts) {
    for (const slot of PART_SLOTS) {
      const part = (parts as Record<string, Part | null>)[slot];
      if (!part) continue;
      if (part.brand) brandCounts[part.brand] += 1;
      if (part.cyberOrganicLean !== undefined) {
        leans.push(mbbLeanToAnatomyScale(part.cyberOrganicLean));
      }
    }
  }

  const trinityBrands = (Object.keys(brandCounts) as BrandId[])
    .filter(brand => brandCounts[brand] >= TRINITY_THRESHOLD);

  // Trinity: each active Brand re-applies its signature at mutant level.
  let statMultipliers: EffectivePartStats = { accuracy: 1, endurance: 1, power: 1, speed: 1 };
  for (const brand of trinityBrands) {
    statMultipliers = applyBrandSignature(statMultipliers, brand);
  }

  // Lean compatibility: resonance bonus or dissonance penalty on
  // speed/power, from the shared anatomy tier model.
  const compatibility = leans.length > 0 ? calculateLeanCompatibility(leans) : null;
  if (compatibility) {
    statMultipliers.speed *= 1 + compatibility.synergyBonus.speedPercent / 100;
    statMultipliers.power *= 1 + compatibility.synergyBonus.powerPercent / 100;
  }

  return { brandCounts, trinityBrands, compatibility, statMultipliers };
}
