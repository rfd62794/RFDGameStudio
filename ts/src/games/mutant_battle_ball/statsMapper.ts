/**
 * Stat mapper: converts MBB's 4-stat model (speed, power, accuracy,
 * endurance) + Cyber-Organic lean into sportsSim's 10-stat PlayerStats.
 *
 * This is the foundation for all sportsSim system integrations —
 * DisposalSystem needs kickSkill/handballSkill/markingSkill/jumpReach,
 * CombatSystem needs strength/toughness/cyberArmor, UniversalDecisionSystem
 * needs aggression.
 *
 * Mapping rationale:
 * - speed → speed (direct)
 * - power → strength (direct, renamed)
 * - endurance → toughness (direct, renamed)
 * - accuracy → kickSkill, handballSkill, markingSkill (all derive from
 *   accuracy — it's the "precision" stat in MBB)
 * - cyberOrganicLean → organicRatio (inverted: MBB uses 0=organic/100=cyber,
 *   sportsSim uses 0=mech/1=organic)
 * - cyberArmor → derived from cyberOrganicLean + endurance (more cyber =
 *   more armor, but needs endurance as base)
 * - jumpReach → derived from speed + power (athleticism)
 * - aggression → derived from power (more powerful = more aggressive)
 */

import type { PlayerStats } from '../../engine/shared/sportsSim';

// MBB's computed stats (from calculateStats)
export interface MbbStats {
  speed: number;
  power: number;
  accuracy: number;
  endurance: number;
  maxHealth: number;
}

/**
 * Maps MBB's 4 stats + cyber-organic lean to sportsSim's 10 PlayerStats.
 *
 * @param mbbStats MBB's computed stats (speed, power, accuracy, endurance)
 * @param cyberOrganicLean 0-100 (0=organic, 100=cyber). Averaged across
 *   all 6 parts. Undefined = 50 (neutral).
 */
export function mapToPlayerStats(
  mbbStats: MbbStats,
  cyberOrganicLean: number | undefined,
): PlayerStats {
  const lean = cyberOrganicLean ?? 50;
  const organicRatio = 1 - (lean / 100); // MBB: 0=organic/100=cyber → sportsSim: 0=mech/1=organic

  // Combat stat normalization: MBB's calculateStats sums across 6 parts,
  // producing stats in the 300+ range. CombatSystem expects 0-100 (per
  // types.ts comments and constants.ts player templates). We divide
  // combat-relevant stats by PART_SLOTS.length (6) to get per-part
  // averages in the expected range. Disposal stats (kickSkill, etc.) are
  // left un-normalized because DisposalSystem was already calibrated for
  // MBB's summed stats.
  const combatNormalize = 6; // PART_SLOTS.length

  return {
    speed: mbbStats.speed,
    strength: mbbStats.power / combatNormalize,
    toughness: mbbStats.endurance / combatNormalize,

    // Cyber-organic derived
    cyberArmor: ((lean / 100) * mbbStats.endurance) / combatNormalize,
    organicRatio,

    // Accuracy-derived disposal skills (NOT normalized — DisposalSystem
    // was calibrated for MBB's summed stats)
    kickSkill: mbbStats.accuracy,
    handballSkill: mbbStats.accuracy * 1.1,
    markingSkill: mbbStats.accuracy * 0.9,

    // Athleticism-derived (NOT normalized — used by DisposalSystem)
    jumpReach: mbbStats.speed * 0.5 + mbbStats.power * 0.3,

    // Power-derived playstyle (normalized for CombatSystem)
    aggression: (mbbStats.power * 0.6 + 30) / combatNormalize,
  };
}

/**
 * Computes the average cyber-organic lean across all parts.
 * Used at agent creation time to derive the PlayerStats.
 */
export function averageCyberOrganicLean(
  parts: Record<string, { cyberOrganicLean?: number } | null> | undefined,
): number | undefined {
  if (!parts) return undefined;
  let total = 0;
  let count = 0;
  for (const key of Object.keys(parts)) {
    const part = parts[key];
    if (part && part.cyberOrganicLean !== undefined) {
      total += part.cyberOrganicLean;
      count++;
    }
  }
  return count > 0 ? total / count : undefined;
}
