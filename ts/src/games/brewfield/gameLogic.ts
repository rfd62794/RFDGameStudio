import type {
  ElementType,
  ComponentType,
  ResidueTag,
  BrewResult,
  CombinationType,
} from './types';

export const ELEMENT_ORDER: ElementType[] = ['fire', 'air', 'water', 'earth'];

export function getElementColor(element: ElementType): string {
  switch (element) {
    case 'fire':
      return '#ef4444';
    case 'water':
      return '#38bdf8';
    case 'earth':
      return '#10b981';
    case 'air':
      return '#c084fc';
  }
}

export function getComponentColor(component: ComponentType): string {
  switch (component) {
    case 'strike':
      return '#f43f5e';
    case 'ward':
      return '#3b82f6';
    case 'mend':
      return '#10b981';
    case 'blight':
      return '#d946ef';
  }
}

export function getElementForResidueTag(tag: ResidueTag): ElementType {
  switch (tag) {
    case 'burning':
      return 'fire';
    case 'soaked':
      return 'water';
    case 'fortified':
      return 'earth';
    case 'windswept':
      return 'air';
  }
}

export function getRelation(el1: ElementType, el2: ElementType): CombinationType {
  if (el1 === el2) return 'same';
  const idx1 = ELEMENT_ORDER.indexOf(el1);
  const idx2 = ELEMENT_ORDER.indexOf(el2);
  if (idx1 === -1 || idx2 === -1) return 'single';
  const diff = Math.abs(idx1 - idx2);
  if (diff === 2) return 'opposed';
  return 'adjacent';
}

/**
 * Client-side brew preview. Mirrors the Lua solve_brew logic for UI tooltips.
 * Actual combat resolution uses the Lua runtime.
 */
export function solveBrew(
  el1: ElementType | null,
  el2: ElementType | null,
  component: ComponentType,
  seed: number
): BrewResult {
  const primary = el1 || el2 || 'water';
  const secondary = el1 && el2 && el1 !== el2 ? el2 : null;

  let combination: CombinationType = 'single';
  if (el1 && el2) {
    combination = getRelation(el1, el2);
  }

  let baseDamage = 0;
  let baseShield = 0;
  let baseHeal = 0;
  let baseDotDamage = 0;
  let baseDotDuration = 0;

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

  if (component === 'strike') {
    baseDamage = 6;
    if (primary === 'fire') {
      baseDamage = 8;
    } else if (primary === 'water') {
      baseDamage = 4;
      slowStrength = 3;
      slowTurns = 1;
    } else if (primary === 'earth') {
      baseDamage = 6;
      baseShield = 3;
    } else if (primary === 'air') {
      baseDamage = 3;
    }
  } else if (component === 'ward') {
    baseShield = 5;
    if (primary === 'fire') {
      retaliateDamage = 3;
    } else if (primary === 'water') {
      baseShield = 7;
      baseHeal = 2;
    } else if (primary === 'earth') {
      baseShield = 9;
      decayingShield = 4;
    } else if (primary === 'air') {
      baseShield = 3;
      dodgeGranted = 1;
    }
  } else if (component === 'mend') {
    baseHeal = 5;
    if (primary === 'fire') {
      baseHeal = 3;
      cauterize = true;
    } else if (primary === 'water') {
      baseHeal = 8;
    } else if (primary === 'earth') {
      baseHeal = 5;
      baseShield = 2;
    } else if (primary === 'air') {
      baseHeal = 5;
      cauterize = true;
    }
  } else if (component === 'blight') {
    baseDotDamage = 3;
    baseDotDuration = 3;
    if (primary === 'fire') {
      baseDotDamage = 0;
      baseDotDuration = 0;
      detonateNextTurn = true;
    } else if (primary === 'water') {
      baseDotDamage = 1;
      baseDotDuration = 3;
      stripBuffs = true;
    } else if (primary === 'earth') {
      baseDotDamage = 3;
      baseDotDuration = 3;
      weaknessStacks = 2;
    } else if (primary === 'air') {
      baseDotDamage = 3;
      baseDotDuration = 3;
      ticksActiveDoTs = true;
    }
  }

  let multiplier = 1.0;
  let flavorText = '';
  let reactionTitle = '';

  if (combination === 'same') {
    multiplier = 1.5;
    reactionTitle = `AMPLIFIED ${primary.toUpperCase()} ${component.toUpperCase()}`;
    flavorText = 'Combining two of the same element charges the brew to 150% potency!';
  } else if (combination === 'adjacent' && secondary) {
    reactionTitle = `HYBRIDIZED ${primary.toUpperCase()}-${secondary.toUpperCase()} ${component.toUpperCase()}`;
    flavorText = `The adjacent elements harmonize. The dominant element (${primary}) is boosted by a minor aspect of ${secondary}!`;

    if (secondary === 'fire') {
      if (component === 'strike') {
        baseDamage += 2;
      } else if (component === 'blight') {
        baseDotDamage += 1;
      } else {
        retaliateDamage += 2;
      }
    } else if (secondary === 'water') {
      if (component === 'mend') {
        baseHeal += 2;
      } else {
        baseShield += 1;
      }
    } else if (secondary === 'earth') {
      baseShield += 2;
      if (decayingShield > 0) {
        decayingShield += 2;
      }
    } else if (secondary === 'air') {
      if (component === 'strike') {
        baseDamage += 1;
      }
      cauterize = true;
    }
  } else if (combination === 'opposed' && secondary) {
    const rngVal = Math.sin(seed) * 10000;
    const isSuccess = rngVal - Math.floor(rngVal) >= 0.5;
    if (isSuccess) {
      multiplier = 1.5;
      reactionTitle = `VOLATILE SURGE! ${primary.toUpperCase()} VS ${secondary.toUpperCase()}`;
      flavorText = 'Opposed elements clash violently, sparking a powerful SURGE (+50% potency)! No residue tag is deposited.';
    } else {
      multiplier = 0.5;
      reactionTitle = `VOLATILE FIZZLE! ${primary.toUpperCase()} VS ${secondary.toUpperCase()}`;
      flavorText = 'Opposed elements clashed and canceled each other out, resulting in a FIZZLE (50% potency)! No residue tag is deposited.';
    }
  } else {
    reactionTitle = `PURE ${primary.toUpperCase()} ${component.toUpperCase()}`;
    flavorText = `A single-element brew focused entirely on ${primary}.`;
  }

  const applyMult = (v: number): number => (v === 0 ? 0 : Math.ceil(v * multiplier));

  const finalDamage = applyMult(baseDamage);
  const finalShield = applyMult(baseShield);
  const finalHeal = applyMult(baseHeal);
  const finalDotDamage = applyMult(baseDotDamage);
  const finalRetaliate = applyMult(retaliateDamage);
  const finalDecaying = applyMult(decayingShield);
  const finalSlow = applyMult(slowStrength);
  const finalWeakness = applyMult(weaknessStacks);

  const effectParts: string[] = [];
  if (finalDamage > 0) {
    if (primary === 'air' && component === 'strike') {
      effectParts.push(`Deals ${Math.ceil(finalDamage / 2)} damage twice (Total: ${finalDamage} DMG).`);
    } else {
      effectParts.push(`Deals ${finalDamage} Damage.`);
    }
  }
  if (finalShield > 0) {
    effectParts.push(`Grants ${finalShield} Shield.`);
  }
  if (finalHeal > 0) {
    effectParts.push(`Restores ${finalHeal} HP.`);
  }
  if (detonateNextTurn) {
    effectParts.push('Applies volatile fuse: deals 8 damage on next turn.');
  } else if (finalDotDamage > 0) {
    effectParts.push(`Applies Blight DoT: deals ${finalDotDamage} DMG/turn for ${baseDotDuration} turns.`);
  }
  if (primary === 'fire' && component === 'strike') {
    effectParts.push('Applies Burning residue.');
  }
  if (finalSlow > 0) {
    effectParts.push(`Reduces enemy's next intent by -${finalSlow} DMG.`);
  }
  if (finalRetaliate > 0) {
    effectParts.push(`Grants Retaliation (deals ${finalRetaliate} back on next hit).`);
  }
  if (finalDecaying > 0) {
    effectParts.push(`${finalDecaying} Shield persists to the next turn.`);
  }
  if (dodgeGranted > 0) {
    effectParts.push('Grants Evasion (50% chance to dodge the next attack).');
  }
  if (cauterize) {
    effectParts.push('Cleanses all negative debuffs (cauterize).');
  }
  if (stripBuffs) {
    effectParts.push('Clears any active shields from the enemy.');
  }
  if (finalWeakness > 0) {
    effectParts.push(`Applies Root: reduces enemy attack intents by -${finalWeakness} DMG.`);
  }
  if (ticksActiveDoTs) {
    effectParts.push('Forces all currently active Residue DoTs to tick immediately.');
  }

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
    dotDuration: baseDotDuration,
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
    description: `${flavorText} Effect: ${effectParts.join(' ')}`,
    color: getElementColor(primary),
  };
}
