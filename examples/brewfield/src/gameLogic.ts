/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  ElementType, 
  ComponentType, 
  CombinationType, 
  ResidueTag, 
  ResidueStatus, 
  BrewResult, 
  EnemyState, 
  EnemyIntent, 
  PlayerState, 
  RunNode 
} from './types';

// Element Wheel Cycle: Fire -> Air -> Water -> Earth -> Fire
const ELEMENT_ORDER: ElementType[] = ['fire', 'air', 'water', 'earth'];

export function getRelation(el1: ElementType, el2: ElementType): CombinationType {
  if (el1 === el2) return 'same';
  
  const idx1 = ELEMENT_ORDER.indexOf(el1);
  const idx2 = ELEMENT_ORDER.indexOf(el2);
  
  const diff = Math.abs(idx1 - idx2);
  if (diff === 2) return 'opposed';
  return 'adjacent';
}

export function isOpposed(el1: ElementType, el2: ElementType): boolean {
  return getRelation(el1, el2) === 'opposed';
}

export function isAdjacent(el1: ElementType, el2: ElementType): boolean {
  return getRelation(el1, el2) === 'adjacent';
}

export function getResidueTagForElement(element: ElementType): ResidueTag {
  switch (element) {
    case 'fire': return 'burning';
    case 'water': return 'soaked';
    case 'earth': return 'fortified';
    case 'air': return 'windswept';
  }
}

export function getElementForResidueTag(tag: ResidueTag): ElementType {
  switch (tag) {
    case 'burning': return 'fire';
    case 'soaked': return 'water';
    case 'fortified': return 'earth';
    case 'windswept': return 'air';
  }
}

export function getElementColor(el: ElementType): string {
  switch (el) {
    case 'fire': return '#ef4444'; // Red
    case 'water': return '#38bdf8'; // Blue/Sky
    case 'earth': return '#10b981'; // Emerald/Green
    case 'air': return '#c084fc'; // Purple/Violet
  }
}

export function getComponentColor(comp: ComponentType): string {
  switch (comp) {
    case 'strike': return '#f43f5e'; // Rose
    case 'ward': return '#3b82f6'; // Blue
    case 'mend': return '#10b981'; // Green
    case 'blight': return '#d946ef'; // Fuchsia
  }
}

/**
 * Solves the alchemical brew combination based on selected elements and a component.
 * Seed-based RNG is provided to resolve the Opposed/Volatile coin flips.
 */
export function solveBrew(
  el1: ElementType | null, 
  el2: ElementType | null, 
  component: ComponentType,
  seed: number // used to make the flip deterministic/repeatable per turn
): BrewResult {
  // If no elements are selected, default to a neutral reaction using water (or fire)
  const primary: ElementType = el1 || el2 || 'water';
  const secondary: ElementType | null = el1 && el2 && el1 !== el2 ? el2 : null;
  
  let combination: CombinationType = 'single';
  if (el1 && el2) {
    combination = getRelation(el1, el2);
  }

  // Base Potencies
  let baseDamage = 0;
  let baseShield = 0;
  let baseHeal = 0;
  let baseDotDamage = 0;
  let baseDotDuration = 0;

  // Secondary/special effects
  let slowStrength = 0;
  let slowTurns = 0;
  let dodgeGranted = 0;
  let retaliateDamage = 0;
  let decayingShield = 0;
  let cauterize = false;
  let detonateNextTurn = false;
  let stripBuffs = false;
  let weaknessStacks = 0;
  let ticksActiveDoTs = false;

  // Load properties based on Element x Component Table
  if (component === 'strike') {
    baseDamage = 6;
    if (primary === 'fire') {
      baseDamage = 8; // +dmg, applies Burn
    } else if (primary === 'water') {
      baseDamage = 4; // -dmg, slows next intent
      slowStrength = 3;
      slowTurns = 1;
    } else if (primary === 'earth') {
      baseDamage = 6; // normal dmg, grants self 1 Ward stack
      baseShield = 3; 
    } else if (primary === 'air') {
      baseDamage = 3; // hits twice (we'll represent this as hits twice in description, 2x3 damage)
    }
  } 
  
  else if (component === 'ward') {
    baseShield = 5;
    if (primary === 'fire') {
      retaliateDamage = 3; // retaliatory shield
    } else if (primary === 'water') {
      baseShield = 7; // bigger shield + slight heal
      baseHeal = 2;
    } else if (primary === 'earth') {
      baseShield = 9; // largest shield, decays slowest
      decayingShield = 4;
    } else if (primary === 'air') {
      baseShield = 3; // smaller shield, grants dodge charge
      dodgeGranted = 1;
    }
  } 
  
  else if (component === 'mend') {
    baseHeal = 5;
    if (primary === 'fire') {
      baseHeal = 3; // reduced heal, cleanses
      cauterize = true;
    } else if (primary === 'water') {
      baseHeal = 8; // strongest heal
    } else if (primary === 'earth') {
      baseHeal = 5; // heal + small lingering shield
      baseShield = 2;
    } else if (primary === 'air') {
      baseHeal = 5; // instant heal + cleanse
      cauterize = true;
    }
  } 
  
  else if (component === 'blight') {
    baseDotDamage = 3;
    baseDotDuration = 3;
    if (primary === 'fire') {
      baseDotDamage = 0;
      baseDotDuration = 0;
      detonateNextTurn = true; // detonates in 1 turn for double total DoT (8 damage next turn)
    } else if (primary === 'water') {
      baseDotDamage = 1; // weak DoT, strips enemy buff (clears shields)
      baseDotDuration = 3;
      stripBuffs = true;
    } else if (primary === 'earth') {
      baseDotDamage = 3; // DoT + reduces enemy attack power
      baseDotDuration = 3;
      weaknessStacks = 2;
    } else if (primary === 'air') {
      baseDotDamage = 3; // DoT spreads easily, ticks with other active DoTs
      baseDotDuration = 3;
      ticksActiveDoTs = true;
    }
  }

  // Calculate reaction multipliers
  let multiplier = 1.0;
  let flavorText = '';
  let reactionTitle = '';

  if (combination === 'same') {
    multiplier = 1.5;
    reactionTitle = `AMPLIFIED ${primary.toUpperCase()} ${component.toUpperCase()}`;
    flavorText = `Combining two of the same element charges the brew to 150% potency!`;
  } else if (combination === 'adjacent' && secondary) {
    reactionTitle = `HYBRIDIZED ${primary.toUpperCase()}-${secondary.toUpperCase()} ${component.toUpperCase()}`;
    flavorText = `The adjacent elements harmonize. The dominant element (${primary}) is boosted by a minor aspect of ${secondary}!`;
    
    // Apply Hybridization bonuses
    if (secondary === 'fire') {
      if (component === 'strike') baseDamage += 2;
      else if (component === 'blight') baseDotDamage += 1;
      else retaliateDamage += 2;
    } else if (secondary === 'water') {
      if (component === 'mend') baseHeal += 2;
      else baseShield += 1;
    } else if (secondary === 'earth') {
      baseShield += 2;
      if (decayingShield > 0) decayingShield += 2;
    } else if (secondary === 'air') {
      if (component === 'strike') baseDamage += 1; // minor double-hit effect/add DMG
      cauterize = true; // adds a tiny cleanse
    }
  } else if (combination === 'opposed' && secondary) {
    // Volatile roll (Coin flip)
    const rngVal = Math.sin(seed) * 10000;
    const isSuccess = (rngVal - Math.floor(rngVal)) >= 0.5;
    
    if (isSuccess) {
      multiplier = 1.5;
      reactionTitle = `VOLATILE SURGE! ${primary.toUpperCase()} vs ${secondary.toUpperCase()}`;
      flavorText = `Opposed elements clash violently, sparking a powerful SURGE (+50% potency)! No residue tag is deposited.`;
    } else {
      multiplier = 0.5;
      reactionTitle = `VOLATILE FIZZLE! ${primary.toUpperCase()} vs ${secondary.toUpperCase()}`;
      flavorText = `Opposed elements clashed and canceled each other out, resulting in a FIZZLE (50% potency)! No residue tag is deposited.`;
    }
  } else {
    reactionTitle = `PURE ${primary.toUpperCase()} ${component.toUpperCase()}`;
    flavorText = `A single-element brew focused entirely on ${primary}.`;
  }

  // Resolve final stats (round up on multiplier)
  const finalDamage = Math.ceil(baseDamage * multiplier);
  const finalShield = Math.ceil(baseShield * multiplier);
  const finalHeal = Math.ceil(baseHeal * multiplier);
  const finalDotDamage = Math.ceil(baseDotDamage * multiplier);
  const finalDotDuration = baseDotDuration; // Duration usually constant
  const finalRetaliate = Math.ceil(retaliateDamage * multiplier);
  const finalDecaying = Math.ceil(decayingShield * multiplier);
  const finalSlow = Math.ceil(slowStrength * multiplier);
  const finalWeakness = Math.ceil(weaknessStacks * multiplier);

  // Generate human description
  let effectDescParts: string[] = [];
  if (finalDamage > 0) {
    if (primary === 'air' && component === 'strike') {
      effectDescParts.push(`Deals ${Math.ceil(finalDamage/2)} damage twice (Total: ${finalDamage} DMG).`);
    } else {
      effectDescParts.push(`Deals ${finalDamage} Damage.`);
    }
  }
  if (finalShield > 0) effectDescParts.push(`Grants ${finalShield} Shield.`);
  if (finalHeal > 0) effectDescParts.push(`Restores ${finalHeal} HP.`);
  
  if (detonateNextTurn) {
    effectDescParts.push(`Applies volatile fuse: deals 8 damage on next turn.`);
  } else if (finalDotDamage > 0) {
    effectDescParts.push(`Applies Blight DoT: deals ${finalDotDamage} DMG/turn for ${finalDotDuration} turns.`);
  }

  if (primary === 'fire' && component === 'strike') effectDescParts.push(`Applies Burning residue.`);
  if (finalSlow > 0) effectDescParts.push(`Reduces enemy's next intent by -${finalSlow} DMG.`);
  if (finalRetaliate > 0) effectDescParts.push(`Grants Retaliation (deals ${finalRetaliate} back on next hit).`);
  if (finalDecaying > 0) effectDescParts.push(`${finalDecaying} Shield persists to the next turn.`);
  if (dodgeGranted > 0) effectDescParts.push(`Grants Evasion (50% chance to dodge the next attack).`);
  if (cauterize) effectDescParts.push(`Cleanses all negative debuffs (cauterize).`);
  if (stripBuffs) effectDescParts.push(`Clears any active shields from the enemy.`);
  if (finalWeakness > 0) effectDescParts.push(`Applies Root: reduces enemy attack intents by -${finalWeakness} DMG.`);
  if (ticksActiveDoTs) effectDescParts.push(`Forces all currently active Residue DoTs to tick immediately.`);

  const color = getElementColor(primary);

  return {
    name: reactionTitle,
    combination,
    primaryElement: primary,
    secondaryElement: secondary,
    component,
    damage: finalDamage,
    shield: finalShield,
    heal: finalHeal,
    dotDamage: finalDotDamage,
    dotDuration: finalDotDuration,
    slowStrength: finalSlow,
    slowTurns,
    dodgeGranted,
    retaliateDamage: finalRetaliate,
    decayingShield: finalDecaying,
    cauterize,
    detonateNextTurn,
    stripBuffs,
    weaknessStacks: finalWeakness,
    ticksActiveDoTs,
    description: `${flavorText} Effect: ${effectDescParts.join(' ')}`,
    color
  };
}

/**
 * Executes a residue field update step when a new element brew resolves.
 * Returns the updated list of active residue tags (maximum of 2 slots).
 */
export function updateResidueField(
  currentResidues: ResidueStatus[],
  resultantElement: ElementType | null,
  isVolatile: boolean
): { updated: ResidueStatus[]; log: string } {
  // If the brew was Volatile (opposed elements clashing), no residue tag is applied!
  if (isVolatile || !resultantElement) {
    return {
      updated: currentResidues,
      log: isVolatile 
        ? "The clashing elements neutralized each other—no new residue could solidify in the cauldron."
        : "No element was infused—the residue field remains unchanged."
    };
  }

  const newTag = getResidueTagForElement(resultantElement);
  const opposedTag = getResidueTagForElement(
    resultantElement === 'fire' ? 'water' :
    resultantElement === 'water' ? 'fire' :
    resultantElement === 'air' ? 'earth' : 'air'
  );

  let updated = [...currentResidues];
  let log = "";

  // 1. Same element: AMPLIFY existing tag
  const existingIdx = updated.findIndex(r => r.tag === newTag);
  if (existingIdx !== -1) {
    const currentLvl = updated[existingIdx].level;
    const newLvl = Math.min(3, currentLvl + 1);
    updated[existingIdx] = { tag: newTag, level: newLvl };
    log = `Fused with existing elements: Amplified the cauldron's [${newTag.toUpperCase()}] residue to Level ${newLvl}!`;
    return { updated, log };
  }

  // 2. Opposed element: CLEAR the opposed tag
  const opposedIdx = updated.findIndex(r => r.tag === opposedTag);
  if (opposedIdx !== -1) {
    updated = updated.filter((_, idx) => idx !== opposedIdx);
    log = `Chemical annihilation: The incoming [${newTag.toUpperCase()}] elements completely cleared the opposed [${opposedTag.toUpperCase()}] residue!`;
    return { updated, log };
  }

  // 3. Unrelated element: ADD to field
  if (updated.length < 2) {
    updated.push({ tag: newTag, level: 1 });
    log = `A new sediment settles: Deposited [${newTag.toUpperCase()}] residue (Level 1) into the cauldron field.`;
  } else {
    // Field is full (2 slots) - must replace one.
    // Fortified (Earth) resists being overwritten as easily!
    const fortifiedIdx = updated.findIndex(r => r.tag === 'fortified');
    
    if (fortifiedIdx !== -1) {
      // There is a Fortified tag in the field! Let's see if we can overwrite the OTHER tag first.
      const otherIdx = fortifiedIdx === 0 ? 1 : 0;
      if (updated[otherIdx].tag !== 'fortified') {
        // Replace the other tag instead!
        log = `The enduring [FORTIFIED] residue resists decay! Overwrote the less-stable [${updated[otherIdx].tag.toUpperCase()}] tag with [${newTag.toUpperCase()}].`;
        updated[otherIdx] = { tag: newTag, level: 1 };
      } else {
        // Both are fortified (rare, but possible if players somehow duplicate). 
        // Decay the first fortified level by 1, rather than erasing it.
        if (updated[0].level > 1) {
          updated[0].level -= 1;
          log = `The thick [FORTIFIED] shell absorbed the overwrite, diminishing to Level ${updated[0].level}.`;
        } else {
          log = `The thick [FORTIFIED] residue was finally worn down and replaced by [${newTag.toUpperCase()}].`;
          updated[0] = { tag: newTag, level: 1 };
        }
      }
    } else {
      // Normal replacement: replace the oldest tag (first element in list)
      const replacedTag = updated[0].tag;
      updated.shift();
      updated.push({ tag: newTag, level: 1 });
      log = `Cauldron overflow: Replaced the oldest residue [${replacedTag.toUpperCase()}] with new [${newTag.toUpperCase()}] tag.`;
    }
  }

  return { updated, log };
}

/**
 * Creates the linear run map consisting of 8 standard nodes followed by a final boss node.
 */
export function generateRunNodes(): RunNode[] {
  return [
    { id: 1, type: 'fight', name: 'Alchemical Chamber', description: 'A restless Ashling dwells here, feeding on residual sparks.', enemyArchetype: 'ashling', completed: false },
    { id: 2, type: 'forage', name: 'Shattered Herbarium', description: 'Search the mossy drawers for wild alchemical ingredients.', completed: false },
    { id: 3, type: 'fight', name: 'The Obsidian Hearth', description: 'An animated Bulwark blocks the path, encased in ancient stone.', enemyArchetype: 'bulwark', completed: false },
    { id: 4, type: 'forage', name: 'Overgrown Drainage', description: 'Condensation pools here, teeming with water and air sediments.', completed: false },
    { id: 5, type: 'rest', name: 'The Purging Flame', description: 'A quiet furnace remains lit. Rest your bones and stoke your cauldron.', completed: false },
    { id: 6, type: 'fight', name: 'Cinder Ruins', description: 'A volatile hybrid of fire and earth blocks the gate.', enemyArchetype: 'molten_ashling', completed: false },
    { id: 7, type: 'forage', name: 'Antechamber Shelf', description: 'A dusty collection of preserved compounds lies ripe for harvesting.', completed: false },
    { id: 8, type: 'rest', name: 'The Hall of Solace', description: 'The calm before the storm. Stabilize your core.', completed: false },
    { id: 9, type: 'fight', name: 'The Cauldron Heart', description: 'The giant rootbound guardian of the ruin awaits. Defeat it to cleanse the cauldron hall!', enemyArchetype: 'rootbound', completed: false }
  ];
}

/**
 * Returns a fresh state for a specific enemy archetype based on progress.
 */
export function instantiateEnemy(archetype: 'ashling' | 'bulwark' | 'molten_ashling' | 'rootbound', turn: number = 1): EnemyState {
  const seed = turn + Math.random() * 10;
  
  switch (archetype) {
    case 'ashling':
      return {
        id: 'enemy_ashling',
        name: 'Ashling (Cinder Beast)',
        archetype: 'ashling',
        hp: 16,
        maxHp: 16,
        shield: 0,
        intent: getEnemyIntent('ashling', 1)
      };
    case 'bulwark':
      return {
        id: 'enemy_bulwark',
        name: 'Bulwark (Stone Golem)',
        archetype: 'bulwark',
        hp: 20,
        maxHp: 20,
        shield: 0,
        intent: getEnemyIntent('bulwark', 1)
      };
    case 'molten_ashling':
      return {
        id: 'enemy_molten',
        name: 'Pyre Bulwark (Molten Golem)',
        archetype: 'molten_ashling',
        hp: 26,
        maxHp: 26,
        shield: 0,
        intent: getEnemyIntent('molten_ashling', 1)
      };
    case 'rootbound':
      return {
        id: 'enemy_rootbound',
        name: 'Rootbound Guardian (Hall Boss)',
        archetype: 'rootbound',
        hp: 40,
        maxHp: 40,
        shield: 0,
        intent: getEnemyIntent('rootbound', 1)
      };
  }
}

/**
 * Computes the telegraphed move for an enemy based on the current turn.
 */
export function getEnemyIntent(
  archetype: 'ashling' | 'bulwark' | 'molten_ashling' | 'rootbound',
  turn: number
): EnemyIntent {
  const index = (turn - 1) % 4; // Loop patterns of 4 turns

  if (archetype === 'ashling') {
    const patterns: EnemyIntent[] = [
      { action: 'attack', value: 6, description: 'Scorching Strike (6 DMG)' },
      { action: 'attack', value: 8, description: 'Flame Burst (8 DMG)' },
      { action: 'defend', value: 4, description: 'Embershield (Gain 4 Shield)' },
      { action: 'attack', value: 7, description: 'Cinder Splash (7 DMG)' }
    ];
    return patterns[index];
  } 
  
  else if (archetype === 'bulwark') {
    const patterns: EnemyIntent[] = [
      { action: 'defend', value: 6, description: 'Iron Defense (Gain 6 Shield)' },
      { action: 'attack', value: 5, description: 'Shield Slam (5 DMG)' },
      { action: 'defend', value: 8, description: 'Fortify Core (Gain 8 Shield)' },
      { action: 'attack', value: 7, description: 'Crushing Blow (7 DMG)' }
    ];
    return patterns[index];
  } 
  
  else if (archetype === 'molten_ashling') {
    const patterns: EnemyIntent[] = [
      { action: 'defend', value: 5, description: 'Molten Plating (Gain 5 Shield)' },
      { action: 'attack', value: 8, description: 'Magma Slam (8 DMG)' },
      { action: 'special', value: 3, description: 'Spit Fire (Deals 4 DMG, applies 1 Burn debuff to player)' },
      { action: 'attack', value: 10, description: 'Pyre Eruption (10 DMG)' }
    ];
    return patterns[index];
  } 
  
  else { // rootbound
    const patterns: EnemyIntent[] = [
      { action: 'attack', value: 6, description: 'Vines of Restraint (Deals 6 DMG, restrains player)' },
      { action: 'heal', value: 8, description: 'Tidal Rejuvenation (Heals 8 HP)' },
      { action: 'attack', value: 12, description: 'Gale-Force Slam (12 DMG)' },
      { action: 'special', value: 5, description: 'Siphon Sap (Deals 5 DMG, heals self for 5 HP)' }
    ];
    return patterns[index];
  }
}
