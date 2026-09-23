/**
 * Brand / Quality Tier / Cyber-Organic stat modifiers for Mutant Battle Ball.
 *
 * Three real, fully-locked identity systems that were previously
 * designed-not-built. This module implements the real stat-affecting
 * mechanics — not cosmetic labels.
 *
 * Wired into `calculateStats()` in mbbSimulation.ts, not a parallel
 * pipeline.
 */

import type { Part, BrandId, QualityTier } from '../../engine/shared/partSlots';

// ── Brand signatures ─────────────────────────────────────────────────
//
// Each Brand has a real mechanical signature — a stat it leans into.
// The modifier is +15% to that stat. Mirefaith (Adaptability) gets a
// smaller bonus spread across all four stats — it's the generalist brand.

export const BRAND_SIGNATURES: Record<BrandId, {
  label: string;
  signature: string;
  statKey: 'accuracy' | 'endurance' | 'power' | 'speed' | 'all' | 'momentum';
  modifier: number;
}> = {
  trueflame:   { label: 'Trueflame',   signature: 'Power',      statKey: 'power',        modifier: 0.15 },
  icevault:    { label: 'Icevault',    signature: 'Endurance',  statKey: 'endurance',    modifier: 0.15 },
  quicksilver: { label: 'Quicksilver', signature: 'Agility',    statKey: 'speed',        modifier: 0.15 },
  prismworks:  { label: 'Prismworks',  signature: 'Precision',  statKey: 'accuracy',     modifier: 0.15 },
  mirefaith:   { label: 'Mirefaith',   signature: 'Adaptability', statKey: 'all',        modifier: 0.05 },
  tidalcapital:{ label: 'Tidalcapital',signature: 'Momentum',   statKey: 'momentum',     modifier: 0.12 },
};

// ── Quality Tier multipliers ─────────────────────────────────────────
//
// Brand New:    100% stats (no penalty)
// Refurbished:  85% stats (15% penalty — reflects lost OEM match)
// Malfunctioning: 70% stats (30% penalty) + instability risk

export const QUALITY_MULTIPLIERS: Record<QualityTier, number> = {
  brand_new:      1.00,
  refurbished:    0.85,
  malfunctioning: 0.70,
};

export const QUALITY_LABELS: Record<QualityTier, string> = {
  brand_new:      'Brand New',
  refurbished:    'Refurbished',
  malfunctioning: 'Malfunctioning',
};

// ── Cyber/Organic lean trade-off ─────────────────────────────────────
//
// 0-100 continuous spectrum (0=organic, 100=cyber, 50=neutral).
// Cyber lean: +stat ceiling increase, +Malfunctioning failure risk
// Organic lean: -stat ceiling, -Malfunctioning failure risk (more reliable)
//
// Stat modifier:  (lean - 50) / 50 * 0.15  →  range -0.15 to +0.15
// Failure chance: 0.10 + (lean - 50) / 50 * 0.10  →  range 0% to 20%
//   (only applies to Malfunctioning parts, rolled per match)

export const CYBER_ORGANIC_NEUTRAL = 50;

export function cyberOrganicStatMultiplier(lean: number | undefined): number {
  const l = lean ?? CYBER_ORGANIC_NEUTRAL;
  return 1.0 + (l - CYBER_ORGANIC_NEUTRAL) / CYBER_ORGANIC_NEUTRAL * 0.15;
}

export function malfunctioningFailureChance(lean: number | undefined): number {
  const l = lean ?? CYBER_ORGANIC_NEUTRAL;
  return 0.10 + (l - CYBER_ORGANIC_NEUTRAL) / CYBER_ORGANIC_NEUTRAL * 0.10;
}

// ── Per-part modifier application ────────────────────────────────────
//
// Given a part's base stats, apply Brand + Quality + Cyber/Organic
// modifiers and return the effective stats. This is called per-part
// inside calculateStats() before summing.

export interface EffectivePartStats {
  accuracy: number;
  endurance: number;
  power: number;
  speed: number;
}

export function getEffectivePartStats(part: Part): EffectivePartStats {
  let { accuracy, endurance, power, speed } = part;

  // 1. Brand modifier
  if (part.brand) {
    const sig = BRAND_SIGNATURES[part.brand];
    if (sig.statKey === 'all') {
      // Mirefaith: small bonus to all four stats
      accuracy  *= 1 + sig.modifier;
      endurance *= 1 + sig.modifier;
      power     *= 1 + sig.modifier;
      speed     *= 1 + sig.modifier;
    } else if (sig.statKey === 'momentum') {
      // Tidalcapital: Momentum = speed + power hybrid
      speed *= 1 + sig.modifier;
      power *= 1 + sig.modifier;
    } else {
      // Single-stat brands
      switch (sig.statKey) {
        case 'accuracy':  accuracy  *= 1 + sig.modifier; break;
        case 'endurance': endurance *= 1 + sig.modifier; break;
        case 'power':     power     *= 1 + sig.modifier; break;
        case 'speed':     speed     *= 1 + sig.modifier; break;
      }
    }
  }

  // 2. Quality Tier multiplier (applied to all stats uniformly)
  const qualityMult = QUALITY_MULTIPLIERS[part.qualityTier ?? 'brand_new'];
  accuracy  *= qualityMult;
  endurance *= qualityMult;
  power     *= qualityMult;
  speed     *= qualityMult;

  // 3. Cyber/Organic lean stat modifier
  const leanMult = cyberOrganicStatMultiplier(part.cyberOrganicLean);
  accuracy  *= leanMult;
  endurance *= leanMult;
  power     *= leanMult;
  speed     *= leanMult;

  return { accuracy, endurance, power, speed };
}

// ── Malfunctioning failure roll ──────────────────────────────────────
//
// Called per Malfunctioning part at match start. If the roll fails,
// the part's stats are halved for the duration of the match (it's
// malfunctioning — it works, but badly). This is the "live-risk state."

export function rollMalfunctioningFailure(
  part: Part,
  prng: () => number
): boolean {
  if (part.qualityTier !== 'malfunctioning') return false;
  const chance = malfunctioningFailureChance(part.cyberOrganicLean);
  return prng() < chance;
}

// ── Repair: permanent OEM loss ───────────────────────────────────────
//
// When a part is repaired, it permanently loses its Brand New stamp.
// A Brand New part becomes Refurbished. A Refurbished part stays
// Refurbished (it's already lost OEM). A Malfunctioning part becomes
// Refurbished (repair fixes the malfunction but doesn't restore OEM).

export function repairPart(part: Part): Part {
  if (part.qualityTier === 'brand_new') {
    return { ...part, qualityTier: 'refurbished' };
  }
  if (part.qualityTier === 'malfunctioning') {
    return { ...part, qualityTier: 'refurbished' };
  }
  return part; // Already refurbished — no further change
}

export function repairOemLossWarning(part: Part): string | null {
  if (part.qualityTier === 'brand_new') {
    return 'WARNING: Repairing this Brand New part will permanently strip its OEM stamp. It becomes Refurbished (15% stat penalty) and can never be Brand New again.';
  }
  if (part.qualityTier === 'malfunctioning') {
    return 'Repairing this Malfunctioning part will fix the malfunction but result in Refurbished status (15% stat penalty). The OEM stamp is already lost.';
  }
  return null; // Already Refurbished — no further OEM loss
}
