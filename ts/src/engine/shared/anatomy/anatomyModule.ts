/**
 * Shared Anatomy Module
 *
 * Design Principles:
 * 1. Combat-resolution-agnostic: Receives "this part took X damage" and calculates continuous efficiency,
 *    scarring, and malfunction rolls without caring if it came from turn-based rounds or real-time ticks.
 * 2. RimWorld continuous per-part efficiency model: efficiency = currentHp / (maxHp - scarHpPenalty).
 * 3. Cyber-Organic Lean & Compatibility: Compares part lean vs frame average; evaluates malfunction risks.
 * 4. Blood Bowl 4-Tier Severity Ladder: Quantifies injury consequence and permanence.
 */

import type { BodyPart, BodySlot, CompatibilityReport, AnatomySubject, SeverityLevel } from './types';

export const BODY_SLOTS: BodySlot[] = [
  'head',
  'torso',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
];

export const SLOT_WEIGHTS: Record<BodySlot, { hitProbability: number; vital: boolean; name: string }> = {
  head: { hitProbability: 0.15, vital: true, name: 'Head' },
  torso: { hitProbability: 0.35, vital: true, name: 'Torso' },
  left_arm: { hitProbability: 0.125, vital: false, name: 'Left Arm' },
  right_arm: { hitProbability: 0.125, vital: false, name: 'Right Arm' },
  left_leg: { hitProbability: 0.125, vital: false, name: 'Left Leg' },
  right_leg: { hitProbability: 0.125, vital: false, name: 'Right Leg' },
};

/**
 * Calculates continuous efficiency for a single body part (0.0 to 1.0)
 * Takes permanent scarring penalty into account.
 */
export function calculatePartEfficiency(part: BodyPart): number {
  const effectiveMaxHp = Math.max(1, part.maxHp - part.scarHpPenalty);
  if (effectiveMaxHp <= 0) return 0;
  const rawEfficiency = Math.max(0, part.currentHp) / effectiveMaxHp;
  return Math.min(1.0, Math.max(0.0, rawEfficiency));
}

/**
 * Calculates overall vital status and functional metrics for a Gladiator
 */
export function getGladiatorAnatomySummary(gladiator: AnatomySubject) {
  const parts = gladiator.parts;
  const efficiencies = {
    head: calculatePartEfficiency(parts.head),
    torso: calculatePartEfficiency(parts.torso),
    left_arm: calculatePartEfficiency(parts.left_arm),
    right_arm: calculatePartEfficiency(parts.right_arm),
    left_leg: calculatePartEfficiency(parts.left_leg),
    right_leg: calculatePartEfficiency(parts.right_leg),
  };

  const totalCurrentHp = BODY_SLOTS.reduce((sum, slot) => sum + parts[slot].currentHp, 0);
  const totalMaxHp = BODY_SLOTS.reduce((sum, slot) => sum + parts[slot].maxHp, 0);
  const totalScars = BODY_SLOTS.reduce((sum, slot) => sum + parts[slot].scarHpPenalty, 0);

  // Arm efficiency affects attack damage output (average of both arms, weighted towards better one)
  const armEfficiency = (efficiencies.left_arm + efficiencies.right_arm) / 2;
  // Leg efficiency affects evasion, initiative, and movement/charge
  const legEfficiency = (efficiencies.left_leg + efficiencies.right_leg) / 2;
  // Head efficiency affects accuracy and tactical decision clarity
  const headEfficiency = efficiencies.head;
  // Torso efficiency affects endurance and damage absorption
  const torsoEfficiency = efficiencies.torso;

  // Gladiator is knocked out if:
  // 1. Torso (Core Powerplant / Heart Chassis) is destroyed (0 HP)
  // 2. Total vital HP is depleted (0 HP)
  // 3. Head is destroyed (0 HP) AND overall vital frame is crippled (total HP <= 25% or Torso <= 35%)
  const isTorsoDestroyed = parts.torso.currentHp <= 0;
  const isTotalHpDepleted = totalCurrentHp <= 0;
  const isCriticalHeadTrauma = parts.head.currentHp <= 0 && (totalCurrentHp <= totalMaxHp * 0.25 || parts.torso.currentHp <= parts.torso.maxHp * 0.35);

  const isKnockedOut = isTorsoDestroyed || isTotalHpDepleted || isCriticalHeadTrauma;

  return {
    efficiencies,
    totalCurrentHp,
    totalMaxHp,
    totalScars,
    overallHpRatio: totalMaxHp > 0 ? totalCurrentHp / totalMaxHp : 0,
    armEfficiency,
    legEfficiency,
    headEfficiency,
    torsoEfficiency,
    isKnockedOut,
  };
}

/**
 * Calculates Cyber-Organic Compatibility across all equipped parts on a Frame.
 * Lean is mapped from -1.0 (Pure Organic) to +1.0 (Pure Cybernetic).
 */
export function calculateCompatibility(gladiator: AnatomySubject): CompatibilityReport {
  const parts = gladiator.parts;
  const slotList = BODY_SLOTS;
  const leans = slotList.map(slot => parts[slot].cyberOrganicLean);

  // Calculate Mean Lean
  const averageLean = leans.reduce((a, b) => a + b, 0) / leans.length;

  // Calculate Variance
  const variance = Math.sqrt(
    leans.reduce((sum, lean) => sum + Math.pow(lean - averageLean, 2), 0) / leans.length
  );

  let compatibilityTier: CompatibilityReport['compatibilityTier'] = 'stable';
  let synergyBonus = { speedPercent: 0, powerPercent: 0, description: 'Stable alignment' };
  let malfunctionRiskPercent = 0;

  if (variance <= 0.25) {
    compatibilityTier = 'pure_synergy';
    const isCyber = averageLean > 0.3;
    const isBio = averageLean < -0.3;
    synergyBonus = {
      speedPercent: isBio ? 15 : 10,
      powerPercent: isCyber ? 15 : 10,
      description: isCyber
        ? 'Pure Cybernetic Neural Overclock: +15% Power, +10% Speed'
        : isBio
        ? 'Pure Biomuscular Resonance: +15% Speed, +10% Power'
        : 'Harmonic Hybrid Resonance: +10% Speed, +10% Power',
    };
    malfunctionRiskPercent = 0;
  } else if (variance <= 0.55) {
    compatibilityTier = 'stable';
    synergyBonus = { speedPercent: 0, powerPercent: 0, description: 'Normal operation. Minimal bio-mechanical friction.' };
    malfunctionRiskPercent = 2; // Negligible
  } else if (variance <= 0.85) {
    compatibilityTier = 'dissonant';
    synergyBonus = { speedPercent: -5, powerPercent: 0, description: 'System Dissonance: -5% Speed' };
    malfunctionRiskPercent = 10; // 10% chance per turn of minor jitter
  } else {
    compatibilityTier = 'critical_rejection';
    synergyBonus = { speedPercent: -15, powerPercent: -10, description: 'Severe Bio-Mechanical Rejection!' };
    malfunctionRiskPercent = 22; // 22% chance per turn of severe malfunction
  }

  const partMismatches = slotList.map(slot => {
    const part = parts[slot];
    return {
      slot,
      partName: part.name,
      partLean: part.cyberOrganicLean,
      mismatch: Math.abs(part.cyberOrganicLean - averageLean),
    };
  });

  return {
    averageLean,
    variance,
    compatibilityTier,
    synergyBonus,
    malfunctionRiskPercent,
    partMismatches,
  };
}

/**
 * Independent implementation, structurally compatible with MBB's real
 * malfunction mechanic by design intent -- not literal shared code.
 */
export function rollMalfunction(gladiator: AnatomySubject): { triggered: boolean; effect: string | null; slotAffected?: BodySlot } {
  const report = calculateCompatibility(gladiator);
  if (report.malfunctionRiskPercent <= 0) {
    return { triggered: false, effect: null };
  }

  const roll = Math.random() * 100;
  if (roll < report.malfunctionRiskPercent) {
    // Find the most mismatched part
    const sorted = [...report.partMismatches].sort((a, b) => b.mismatch - a.mismatch);
    const worstMismatch = sorted[0];
    const isCyberPart = worstMismatch.partLean > 0;

    const effects = isCyberPart
      ? [
          '⚡ Neural feedback loop locked hydraulic actuators! Turn delayed.',
          '⚡ Overheated capacitor vented smoke, throwing off targeting calibration.',
          '⚡ Power surge blew a chassis relay, inflicting 4 self-shock damage.',
        ]
      : [
          '🩸 Bio-rejection spasm caused muscular seizure! Action stumbled.',
          '🩸 Synthetic neuro-toxin buildup caused blurred vision.',
          '🩸 Grafted flesh tore at junction point, inflicting 4 bleed trauma.',
        ];

    const chosenEffect = effects[Math.floor(Math.random() * effects.length)];

    return {
      triggered: true,
      effect: `${worstMismatch.partName} (${worstMismatch.slot.replace('_', ' ')}): ${chosenEffect}`,
      slotAffected: worstMismatch.slot,
    };
  }

  return { triggered: false, effect: null };
}

export interface DamageResult {
  slotTargeted: BodySlot;
  rawDamage: number;
  actualDamage: number;
  armorReduced: number;
  newPartHp: number;
  isCrippled: boolean;
  newScarPenalty: number;
  severity: SeverityLevel;
  logDescription: string;
}

/**
 * Pure damage applicator to a specific body slot.
 * Computes armor mitigation, continuous HP reduction, permanent scarring (RimWorld),
 * and Blood Bowl severity tiers.
 */
export function applyDamageToSlot(
  targetPart: BodyPart,
  rawDamage: number,
  isCrit: boolean = false
): DamageResult {
  // Armor mitigates raw damage (effective armor reduces up to 70% of raw damage)
  const armorMitigation = Math.min(rawDamage * 0.70, targetPart.armor * 1.25);
  const actualDamage = Math.max(1, Math.round(rawDamage - armorMitigation));

  const previousHp = targetPart.currentHp;
  const newPartHp = Math.max(0, previousHp - actualDamage);
  const hpLost = previousHp - newPartHp;

  targetPart.currentHp = newPartHp;

  // Determine Severity Ladder & RimWorld Scarring
  let severity: SeverityLevel = 'normal';
  let newScarPenalty = 0;
  let logDescription = '';

  const damageRatio = actualDamage / Math.max(1, targetPart.maxHp);

  if (newPartHp === 0) {
    // Part is completely broken/crippled
    if (damageRatio > 0.7 || isCrit) {
      severity = 'dismembered';
      // High permanent scar trauma
      newScarPenalty = Math.max(2, Math.round(targetPart.maxHp * 0.35));
      logDescription = `DEVASTATING TRAUMA! ${targetPart.name} was catastrophically crushed, leaving a permanent ${newScarPenalty} HP scar!`;
    } else {
      severity = 'crippled';
      newScarPenalty = Math.max(1, Math.round(targetPart.maxHp * 0.2));
      logDescription = `CRITICAL HIT! ${targetPart.name} was completely crippled (0 HP)!`;
    }
  } else if (damageRatio >= 0.45 || isCrit) {
    severity = 'stunned';
    // Chance of minor scar
    if (Math.random() < 0.35) {
      newScarPenalty = Math.max(1, Math.round(targetPart.maxHp * 0.1));
      logDescription = `HEAVY IMPACT! ${targetPart.name} took severe damage and sustained a permanent scar of ${newScarPenalty} HP!`;
    } else {
      logDescription = `HEAVY IMPACT! ${targetPart.name} took heavy concussive damage!`;
    }
  } else if (damageRatio >= 0.2) {
    severity = 'bruised';
    logDescription = `Solid hit to ${targetPart.name}.`;
  } else {
    severity = 'normal';
    logDescription = `Glancing blow to ${targetPart.name}.`;
  }

  // Apply scar to the part
  targetPart.scarHpPenalty = Math.min(
    targetPart.maxHp - 2, // never allow scar to reduce max HP below 2
    targetPart.scarHpPenalty + newScarPenalty
  );

  return {
    slotTargeted: targetPart.slot,
    rawDamage,
    actualDamage,
    armorReduced: Math.round(armorMitigation),
    newPartHp,
    isCrippled: newPartHp <= 0,
    newScarPenalty,
    severity,
    logDescription,
  };
}

/**
 * Selects a targeted body slot based on aiming profile or weighted natural scatter
 */
export function rollHitSlot(targetedSlot?: BodySlot): BodySlot {
  if (targetedSlot && Math.random() < 0.65) {
    return targetedSlot;
  }

  const roll = Math.random();
  let cumulative = 0;

  for (const slot of BODY_SLOTS) {
    cumulative += SLOT_WEIGHTS[slot].hitProbability;
    if (roll <= cumulative) {
      return slot;
    }
  }

  return 'torso';
}
