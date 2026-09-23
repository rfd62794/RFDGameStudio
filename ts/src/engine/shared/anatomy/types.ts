/**
 * Shared Anatomy Module — Type Definitions
 *
 * Combat-resolution-agnostic types for a continuous per-part efficiency
 * anatomy system (RimWorld-derived), Cyber-Organic compatibility model,
 * and Blood Bowl 4-tier severity ladder.
 *
 * These types are intentionally game-agnostic. A game's local types
 * (e.g. Gladiator, ArenaOpponent) import these and extend them with
 * game-specific fields. The anatomy module functions accept
 * AnatomySubject (structural interface) so any game-local type with
 * `parts: Record<BodySlot, BodyPart>` is compatible.
 */

export type BodySlot = 'head' | 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';

export type PartOrigin = 'organic' | 'cybernetic' | 'hybrid';

export type PartRarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type SeverityLevel = 'normal' | 'bruised' | 'stunned' | 'crippled' | 'permanently_scarred' | 'dismembered';

export interface BodyPart {
  id: string;
  name: string;
  slot: BodySlot;
  origin: PartOrigin;
  /**
   * Cyber-Organic Lean:
   * -1.0 = Pure Organic (Biomuscular, Chitin, Beast Sinew)
   *  0.0 = Balanced Hybrid (Bio-cybernetic weave, Carbon-Bone)
   * +1.0 = Pure Cybernetic (Titanium Servo, Hydraulic Piston, Tesla Core)
   */
  cyberOrganicLean: number;
  maxHp: number;
  currentHp: number;
  /**
   * Permanent scarring from severe trauma (RimWorld-derived).
   * Reduces maximum potential HP until replaced or treated with advanced surgery.
   */
  scarHpPenalty: number;

  // Stat bonuses provided by this part
  power: number;      // Adds to attack damage
  speed: number;      // Adds to initiative & evasion
  armor: number;      // Reduces incoming damage to this part
  accuracy: number;   // Adds to hit chance
  critChance: number; // Percentage (e.g. 5 = 5%)

  rarity: PartRarity;
  cost: number;
  description: string;
  specialTrait?: string; // e.g., 'Bleed Inducer', 'Electro-Shock', 'Adrenaline Spike', 'Reflective Plating'
}

export interface CompatibilityReport {
  averageLean: number;
  variance: number;
  compatibilityTier: 'pure_synergy' | 'stable' | 'dissonant' | 'critical_rejection';
  synergyBonus: {
    speedPercent: number;
    powerPercent: number;
    description: string;
  };
  malfunctionRiskPercent: number; // 0 to 25% chance per turn
  partMismatches: {
    slot: BodySlot;
    partName: string;
    partLean: number;
    mismatch: number;
  }[];
}

/**
 * Minimal structural interface for any entity that has equipped body parts.
 * Game-local types (Gladiator, etc.) satisfy this structurally by having
 * `parts: Record<BodySlot, BodyPart>`. The anatomy module functions accept
 * this interface so they are genuinely game-agnostic.
 */
export interface AnatomySubject {
  parts: Record<BodySlot, BodyPart>;
}
