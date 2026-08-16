/**
 * Gladiator Arena — Frame & Forge Economy
 * 
 * Implements the compounding cost curve for owning multiple Frames,
 * shop inventory generation, scrap value evaluation, and surgical pricing.
 */

import { BodyPart, BodySlot, CompatibilityReport, Gladiator } from '../types';
import { SHOP_PART_CATALOG, STARTER_PARTS } from '../data/defaultParts';
import { calculateCompatibility } from '../../engine/shared/anatomy';

/**
 * Calculates compounding cost for purchasing an additional Frame chassis
 * Frame 1: Starter (free)
 * Frame 2: 250 Gold
 * Frame 3: 550 Gold
 * Frame 4: 1,150 Gold
 * Frame 5: 2,400 Gold
 */
export function getNextFrameCost(currentFrameCount: number): number {
  if (currentFrameCount < 1) return 0;
  return Math.round(250 * Math.pow(2.1, currentFrameCount - 1));
}

/**
 * Generates a randomized rotating shop inventory based on player's ladder progress
 */
export function generateShopInventory(ladderTier: number): BodyPart[] {
  // Filter available parts by tier / rarity
  const available = SHOP_PART_CATALOG.filter(part => {
    if (ladderTier <= 1) return part.rarity === 'common' || part.rarity === 'uncommon';
    if (ladderTier === 2) return part.rarity !== 'legendary';
    return true; // Tier 3+ can see all rarities
  });

  // Pick 6-8 distinct parts ensuring good slot distribution
  const shuffled = [...available].sort(() => 0.5 - Math.random());
  
  // Ensure at least one part for distinct slots
  const selected: BodyPart[] = [];
  const coveredSlots = new Set<BodySlot>();

  for (const part of shuffled) {
    if (!coveredSlots.has(part.slot) || selected.length < 6) {
      selected.push({
        ...part,
        id: `${part.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        currentHp: part.maxHp,
        scarHpPenalty: 0,
      });
      coveredSlots.add(part.slot);
    }
    if (selected.length >= 8) break;
  }

  return selected;
}

/**
 * Evaluates the scrap value of an unequipped part
 */
export function getPartScrapValue(part: BodyPart): number {
  const baseValue = Math.max(10, Math.round(part.cost * 0.45));
  // Reduce value if part has scars or damage
  const damageDiscount = (part.maxHp - part.currentHp) * 0.2;
  const scarDiscount = part.scarHpPenalty * 1.5;
  return Math.max(5, Math.round(baseValue - damageDiscount - scarDiscount));
}

/**
 * Simulates equipping a candidate part on a Gladiator to preview compatibility changes
 */
export function previewEquipCompatibility(
  gladiator: Gladiator,
  candidatePart: BodyPart
): {
  currentReport: CompatibilityReport;
  newReport: CompatibilityReport;
  varianceDelta: number;
  malfunctionRiskDelta: number;
} {
  const currentReport = calculateCompatibility(gladiator);

  // Clone gladiator with candidate part in target slot
  const hypotheticalGladiator: Gladiator = {
    ...gladiator,
    parts: {
      ...gladiator.parts,
      [candidatePart.slot]: candidatePart,
    },
  };

  const newReport = calculateCompatibility(hypotheticalGladiator);

  return {
    currentReport,
    newReport,
    varianceDelta: newReport.variance - currentReport.variance,
    malfunctionRiskDelta: newReport.malfunctionRiskPercent - currentReport.malfunctionRiskPercent,
  };
}

/**
 * Calculates Medbay repair costs
 */
export function calculateSurgeryCosts(gladiator: Gladiator) {
  const parts = gladiator.parts;
  let totalMissingHp = 0;
  let totalScars = 0;

  const perPartCost: Record<BodySlot, { repairHpCost: number; scarRemovalCost: number }> = {
    head: { repairHpCost: 0, scarRemovalCost: 0 },
    torso: { repairHpCost: 0, scarRemovalCost: 0 },
    left_arm: { repairHpCost: 0, scarRemovalCost: 0 },
    right_arm: { repairHpCost: 0, scarRemovalCost: 0 },
    left_leg: { repairHpCost: 0, scarRemovalCost: 0 },
    right_leg: { repairHpCost: 0, scarRemovalCost: 0 },
  };

  (Object.keys(parts) as BodySlot[]).forEach(slot => {
    const p = parts[slot];
    const missingHp = (p.maxHp - p.scarHpPenalty) - p.currentHp;
    if (missingHp > 0) {
      totalMissingHp += missingHp;
      perPartCost[slot].repairHpCost = Math.max(1, Math.ceil(missingHp * 0.35));
    }
    if (p.scarHpPenalty > 0) {
      totalScars += p.scarHpPenalty;
      // Scars require regenerative bio-gel / servo alignment
      perPartCost[slot].scarRemovalCost = Math.max(8, p.scarHpPenalty * 6);
    }
  });

  const totalPatchCost = Math.ceil(totalMissingHp * 0.35);
  const totalScarRemovalCost = totalScars * 6;

  return {
    totalMissingHp,
    totalScars,
    totalPatchCost,
    totalScarRemovalCost,
    perPartCost,
  };
}

/**
 * Creates a freshly forged new Gladiator Frame with starter limb equipment
 */
export function createNewFrameGladiator(
  frameNumber: number,
  customName?: string,
  personality?: Gladiator['personality']
): Gladiator {
  const personalities: Gladiator['personality'][] = ['berserker', 'tactician', 'showman', 'brawler', 'survivor'];
  const titles = ['the Ironclad', 'the Savage', 'the Unbroken', 'the Wire-Ripper', 'the Pit-Hound', 'the Chrome-Biter'];
  const defaultNames = ['Goliath', 'Valkyrie', 'Razor', 'Brutus', 'Apex', 'Rust-Jaw', 'Krag', 'Titan', 'Viper'];

  const name = customName || defaultNames[(frameNumber - 1) % defaultNames.length];
  const title = titles[(frameNumber - 1) % titles.length];
  const chosenPersonality = personality || personalities[Math.floor(Math.random() * personalities.length)];

  // Clone starter parts with unique IDs
  const parts: Record<BodySlot, BodyPart> = {
    head: { ...STARTER_PARTS.head, id: `frame-${frameNumber}-head-${Date.now()}` },
    torso: { ...STARTER_PARTS.torso, id: `frame-${frameNumber}-torso-${Date.now()}` },
    left_arm: { ...STARTER_PARTS.left_arm, id: `frame-${frameNumber}-larm-${Date.now()}` },
    right_arm: { ...STARTER_PARTS.right_arm, id: `frame-${frameNumber}-rarm-${Date.now()}` },
    left_leg: { ...STARTER_PARTS.left_leg, id: `frame-${frameNumber}-lleg-${Date.now()}` },
    right_leg: { ...STARTER_PARTS.right_leg, id: `frame-${frameNumber}-rleg-${Date.now()}` },
  };

  return {
    id: `frame-gladiator-${frameNumber}-${Date.now()}`,
    name,
    title,
    personality: chosenPersonality,
    frameId: `FRAME-0${frameNumber}`,
    parts,
    wins: 0,
    losses: 0,
    kills: 0,
    totalDamageDealt: 0,
  };
}
