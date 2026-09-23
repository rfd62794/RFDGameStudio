import { CombinationResult, CombatIntent, SecondaryType } from '../types';
import { StandardFight, Rest, Boss, composeSequence } from './rooms';
export const EMBER_ELEMENTS = ['ember', 'ash', 'spark', 'cinder'];

export function getSecondaryType(relationType: string): SecondaryType {
  if (relationType === 'same') return 'burst';
  if (relationType === 'adjacent') return 'hybrid';
  if (relationType === 'opposed') return 'volatile';
  return null; // single
}

export const TYPE_ADVANTAGE: Record<string, string> = {
  burst: 'volatile',   // burst beats volatile
  volatile: 'hybrid',  // volatile beats hybrid
  hybrid: 'burst',     // hybrid beats burst
};

export function getTypeMultiplier(cardType: SecondaryType, enemyProfile: { vulnerable?: SecondaryType; resistant?: SecondaryType }): number {
  if (!cardType) return 1.0; // Single always neutral
  if (enemyProfile.vulnerable === cardType) return 1.3;
  if (enemyProfile.resistant === cardType) return 0.7;
  return 1.0;
}

export function canonicalizeElements(el1: string, el2: string | null): [string, string | null] {
  if (!el2) return [el1, null];
  if (el1 === el2) return [el1, el2];
  
  const WHEEL = ['ember', 'ash', 'spark', 'cinder'];
  const i1 = WHEEL.indexOf(el1);
  const i2 = WHEEL.indexOf(el2);
  
  if (i1 === -1 || i2 === -1) return [el1, el2];
  
  return i1 < i2 ? [el1, el2] : [el2, el1];
}

export const EMBER_MODIFIERS: Record<string, Record<string, number>> = {
  ember:  { sever: 2,  mend: -1, guard: -1, unmake: 1 },
  ash:    { sever: 0,  mend: 1,  guard: 1,  unmake: 2 },
  spark:  { sever: 3,  mend: -2, guard: -1, unmake: 0 },
  cinder: { sever: 1,  mend: 0,  guard: 2,  unmake: 1 },
};

// Locked names for future amendments — DO NOT author modifier tables
// or implement selection logic for these yet. Ember only, this pass.
export const FUTURE_CULTURES = {
  gale:    ['gust', 'mist', 'echo', 'squall'],
  marsh:   ['root', 'bloom', 'silt', 'rot'],
  crystal: ['facet', 'prism', 'lattice', 'shard'],
  tundra:  ['frost', 'rime', 'bedrock', 'hollow'],
  tide:    ['tide', 'foam', 'undertow', 'pearl'],
};

// Pure function to resolve a combination of Elements and Components.
// Deterministic given the inputs and the seed. No hidden side-effects.
export function resolve_combination(
  el1: string,
  el2: string | null,
  component: string,
  seed: number
): CombinationResult {
  const elements = ['ember', 'ash', 'spark', 'cinder'];
  const i1 = elements.indexOf(el1);
  const i2 = el2 ? elements.indexOf(el2) : -1;

  // Base values
  let baseVal = 0;
  if (component === 'mend') baseVal = 5;
  else if (component === 'guard') baseVal = 5;
  else if (component === 'sever') baseVal = 6;
  else if (component === 'unmake') baseVal = 3;

  // Primary element modifier table
  const modifiers = EMBER_MODIFIERS;

  const mod = modifiers[el1]?.[component] ?? 0;
  const valueBeforeMultiplier = baseVal + mod;

  let relationType: 'same' | 'adjacent' | 'opposed' | 'single' = 'single';
  let multiplier = 1.0;
  let opposedSuccess: boolean | undefined = undefined;
  let bonusText = '';
  let bonusEffect: { type: 'damage' | 'shield' | 'heal' | 'dot'; value: number } | undefined = undefined;

  if (i2 === -1) {
    relationType = 'single';
    multiplier = 1.0;
  } else if (i1 === i2) {
    relationType = 'same';
    multiplier = 1.5;
  } else {
    const diff = Math.abs(i1 - i2);
    if (diff === 1 || diff === 3) {
      relationType = 'adjacent';
      multiplier = 1.0;
      // Secondary Element Bonus
      if (el2 === 'ember') {
        bonusText = 'Bonus Heat (+2 Damage)';
        bonusEffect = { type: 'damage', value: 2 };
      } else if (el2 === 'ash') {
        bonusText = 'Bonus Ash (+2 Shield)';
        bonusEffect = { type: 'shield', value: 2 };
      } else if (el2 === 'spark') {
        bonusText = 'Bonus Spark (+2 Heal)';
        bonusEffect = { type: 'heal', value: 2 };
      } else if (el2 === 'cinder') {
        bonusText = 'Bonus Cinder (+2 Shield)';
        bonusEffect = { type: 'shield', value: 2 };
      }
    } else if (diff === 2) {
      relationType = 'opposed';
      // LCG random generator using seed
      const temp = (seed * 1103515245 + 12345) & 0x7fffffff;
      const roll = temp / 0x7fffffff;
      if (roll < 0.5) {
        opposedSuccess = true;
        multiplier = 1.5;
      } else {
        opposedSuccess = false;
        multiplier = 0.5;
      }
    }
  }

  const modifiedValue = Math.round(valueBeforeMultiplier * multiplier);

  // Message generation
  let message = '';
  const pName = el1.toUpperCase();
  const sName = el2 ? el2.toUpperCase() : 'NONE';
  const cName = component.toUpperCase();

  if (relationType === 'single') {
    message = `Single Element: Combined ${pName} with ${cName}. Base power: ${baseVal} (${mod >= 0 ? '+' : ''}${mod} from ${pName}). Total: ${modifiedValue}.`;
  } else if (relationType === 'same') {
    message = `Perfect Resonance (Same Elements): Combined ${pName} & ${sName} with ${cName}. 1.5x power multiplier! Total: ${modifiedValue}.`;
  } else if (relationType === 'adjacent') {
    message = `Adjacent Harmony: Combined ${pName} & ${sName} with ${cName}. Base: ${modifiedValue}. Secondary bonus triggered: ${bonusText}.`;
  } else if (relationType === 'opposed') {
    if (opposedSuccess) {
      message = `Opposed Resonance Success! Combined ${pName} & ${sName} with ${cName}. Stable fusion achieved! 1.5x multiplier applied. Total: ${modifiedValue}.`;
    } else {
      message = `Opposed Dissonance Collapse! Combined ${pName} & ${sName} with ${cName}. Unstable reaction. 0.5x penalty applied. Total: ${modifiedValue}.`;
    }
  }

  return {
    baseValue: valueBeforeMultiplier,
    modifiedValue,
    relationType,
    multiplier,
    bonusText,
    bonusEffect,
    opposedSuccess,
    message,
    dotDuration: component === 'unmake' ? 2 : undefined,
    dotDamage: component === 'unmake' ? modifiedValue : undefined,
  };
}

import { ENEMY_POOL, EnemyInstance } from './enemies';

export function getBehaviorTypeIntent(behaviorId: string, turn: number): CombatIntent {
  switch (behaviorId) {
    case 'mirror': {
      const patterns: CombatIntent[] = [
        { type: 'attack', value: 4, description: '[Mirror] Reflective Strike (4 Dmg - Mirror Stance)' },
        { type: 'heavy_attack', value: 7, description: '[Mirror] Echo Slash (7 Dmg - Reflected Action)' },
        { type: 'shield', value: 6, description: '[Mirror] Prism Barrier (6 Shield)' },
        { type: 'attack', value: 5, description: '[Mirror] Shatter Pulse (5 Dmg)' },
      ];
      return patterns[(turn - 1) % 4];
    }
    case 'escalator': {
      // Direct generalization of Molten Ashling's existing Escalating mechanic
      const dmg = Math.round(4 + turn * 1.5);
      return { type: 'attack', value: dmg, description: `[Escalator] Escalating Pulse (${dmg} Dmg - Growing Threat)` };
    }
    case 'weaver': {
      const stances = ['Burst Stance', 'Hybrid Stance', 'Volatile Stance'];
      const st = stances[(turn - 1) % 3];
      return { type: 'attack', value: 5, description: `[Weaver] ${st} Shift (5 Dmg - Shifting Type)` };
    }
    case 'saboteur': {
      const slot = ((turn - 1) % 3) + 1;
      return { type: 'attack', value: 5, description: `[Saboteur] Lock Hand Slot #${slot} (5 Dmg)` };
    }
    case 'parasite': {
      const rot = 2 + Math.floor((turn - 1) / 2);
      return { type: 'dot_attack', value: rot, duration: 3, description: `[Parasite] Corrupting Spore (${rot} Dmg/Turn for 3 Turns)` };
    }
    case 'coin': {
      if (turn % 2 === 1) {
        return { type: 'attack', value: 8, description: '[Coin] Dual Telegraph: Heavy Attack (8 Dmg) OR Counter Shield' };
      } else {
        return { type: 'shield', value: 8, description: '[Coin] Dual Telegraph: Guard (8 Shield) OR Spark Strike' };
      }
    }
    case 'countdown': {
      const cycleStep = ((turn - 1) % 3) + 1;
      if (cycleStep === 1) {
        return { type: 'shield', value: 5, description: '[Countdown] Prime Core (5 Shield - T-minus 2 Turns)' };
      } else if (cycleStep === 2) {
        return { type: 'attack', value: 3, description: '[Countdown] Energy Focus (3 Dmg - T-minus 1 Turn)' };
      } else {
        return { type: 'heavy_attack', value: 16, description: '[Countdown] 💥 DEVASTATING PULSE SPIKE!! (16 Dmg)' };
      }
    }
    case 'tally': {
      const cycleStep = ((turn - 1) % 3) + 1;
      if (cycleStep === 3) {
        return { type: 'heavy_attack', value: 10, description: '[Tally] Punishing Overload! (10 Dmg Threshold Strike)' };
      } else {
        return { type: 'attack', value: 4, description: `[Tally] Resonance Gauge (4 Dmg - Tracking Action Repeats Step ${cycleStep})` };
      }
    }
    default:
      return { type: 'attack', value: 5, description: 'Strike (5 Dmg)' };
  }
}

// Pure function to generate deterministic enemy intents
export function getEnemyIntent(enemyName: string, turn: number): CombatIntent {
  const matchedEnemy = ENEMY_POOL.find(e => e.name === enemyName || e.id === enemyName || enemyName.startsWith(e.name)) as EnemyInstance | undefined;
  if (matchedEnemy && matchedEnemy.behaviorTypeIds && matchedEnemy.behaviorTypeIds.length > 0) {
    const ids = matchedEnemy.behaviorTypeIds;
    if (ids.length === 1) {
      return getBehaviorTypeIntent(ids[0], turn);
    } else {
      // Blended enemy: Turn 1 telegraphs Behavior A (odd turn), Turn 2 telegraphs Behavior B (even turn), alternating
      const activeId = (turn % 2 === 1) ? ids[0] : ids[1];
      return getBehaviorTypeIntent(activeId, turn);
    }
  }

  const t = (turn - 1) % 4; // Cycles of 4 turns

  let multiplier = 1.0;
  if (enemyName.startsWith('Elite')) multiplier = 1.5;
  else if (enemyName.startsWith('Advanced')) multiplier = 1.25;
  else if (enemyName.includes('(Boss)') || enemyName.startsWith('Deep') || enemyName.includes('Echo')) multiplier = 1.8;

  if (enemyName.includes('Drifting Cinder')) {
    const patterns: CombatIntent[] = [
      { type: 'attack', value: 4, description: `Erratic Spark (4 Dmg)` },
      { type: 'shield', value: 5, description: `Cinder Veil (5 Shield)` },
      { type: 'attack', value: 6, description: `Erratic Burst (6 Dmg)` },
      { type: 'dot_attack', value: 2, duration: 2, description: `Cinder Flare (2 Dmg/Turn for 2 Turns)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Sparkling Husk')) {
    const patterns: CombatIntent[] = [
      { type: 'attack', value: 6, description: `Husk Strike (6 Dmg)` },
      { type: 'attack', value: 5, description: `Fast Spark (5 Dmg)` },
      { type: 'attack', value: 4, description: `Husk Jab (4 Dmg)` },
      { type: 'shield', value: 3, description: `Fragile Guard (3 Shield)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Ashbound Wisp')) {
    if (turn === 1) {
      return { type: 'shield', value: 8, description: `Wisp Guard (8 Shield)` };
    }
    const patterns: CombatIntent[] = [
      { type: 'shield', value: 8, description: `Wisp Guard (8 Shield)` },
      { type: 'attack', value: 4, description: `Wisp Lash (4 Dmg)` },
      { type: 'attack', value: 5, description: `Spark Flash (5 Dmg)` },
      { type: 'shield', value: 5, description: `Smoke Screen (5 Shield)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Molten Ashling')) {
    const escalationDmg = 4 + (turn - 1) * 2;
    const patterns: CombatIntent[] = [
      { type: 'attack', value: escalationDmg, description: `Molten Strike (${escalationDmg} Dmg - Escalating)` },
      { type: 'attack', value: escalationDmg + 1, description: `Molten Surge (${escalationDmg + 1} Dmg - Escalating)` },
      { type: 'shield', value: 5, description: `Molten Shell (5 Shield)` },
      { type: 'heavy_attack', value: escalationDmg + 3, description: `Eruption (${escalationDmg + 3} Dmg - Escalating)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Cinder Brute')) {
    if (turn % 3 === 0) {
      return { type: 'heavy_attack', value: 16, description: `Devastating Brute Smash!! (16 Dmg)` };
    }
    const patterns: CombatIntent[] = [
      { type: 'attack', value: 5, description: `Cinder Swipe (5 Dmg)` },
      { type: 'shield', value: 5, description: `Brute Stance (5 Shield)` },
      { type: 'heavy_attack', value: 16, description: `Devastating Brute Smash!! (16 Dmg)` },
    ];
    return patterns[(turn - 1) % 3] || patterns[0];
  } else if (enemyName.includes('Spark Lash')) {
    const patterns: CombatIntent[] = [
      { type: 'attack', value: 6, description: `Double Spark (3x2 Dmg)` },
      { type: 'attack', value: 5, description: `Lash Flutter (5 Dmg)` },
      { type: 'attack', value: 8, description: `Double Lash (4x2 Dmg)` },
      { type: 'shield', value: 4, description: `Spark Shroud (4 Shield)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Ashen Marauder')) {
    const patterns: CombatIntent[] = [
      { type: 'dot_attack', value: 2, duration: 3, description: `Ashen Decay (2 Dmg/Turn for 3 Turns)` },
      { type: 'attack', value: 5, description: `Marauder Slash (5 Dmg)` },
      { type: 'dot_attack', value: 3, duration: 2, description: `Void Rot Mirror (3 Dmg/Turn for 2 Turns)` },
      { type: 'shield', value: 5, description: `Ashen Shroud (5 Shield)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Fracture Warden')) {
    const patterns: CombatIntent[] = [
      { type: 'shield', value: 6, description: `Warden Shield (6 Shield)` },
      { type: 'attack', value: 6, description: `Fracture Strike (6 Dmg)` },
      { type: 'attack', value: 7, description: `Dissonant Pulse (7 Dmg)` },
      { type: 'shield', value: 5, description: `Warden Barrier (5 Shield)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Cinderlord Sentinel')) {
    const patterns: CombatIntent[] = [
      { type: 'attack', value: 5, description: `Sentinel Flame (5 Dmg)` },
      { type: 'attack', value: 6, description: `Sentinel Slash (6 Dmg)` },
      { type: 'heavy_attack', value: 8, description: `Cinder Blast (8 Dmg)` },
      { type: 'attack', value: 6, description: `Sentinel Flame (6 Dmg)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Ashling')) {
    const patterns: CombatIntent[] = [
      { type: 'attack', value: Math.round(3 * multiplier), description: `Quick Spark (${Math.round(3 * multiplier)} Dmg)` },
      { type: 'attack', value: Math.round(5 * multiplier), description: `Flame Leap (${Math.round(5 * multiplier)} Dmg)` },
      { type: 'shield', value: Math.round(2 * multiplier), description: `Smoke Veil (${Math.round(2 * multiplier)} Shield)` },
      { type: 'dot_attack', value: Math.round(1 * multiplier), duration: 2, description: `Ashen Rot (${Math.round(1 * multiplier)} Dmg/Turn for 2 Turns)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Bulwark')) {
    const patterns: CombatIntent[] = [
      { type: 'shield', value: Math.round(6 * multiplier), description: `Iron Wall (${Math.round(6 * multiplier)} Shield)` },
      { type: 'attack', value: Math.round(4 * multiplier), description: `Shield Slam (${Math.round(4 * multiplier)} Dmg)` },
      { type: 'shield', value: Math.round(4 * multiplier), description: `Rocky Shell (${Math.round(4 * multiplier)} Shield)` },
      { type: 'heavy_attack', value: Math.round(7 * multiplier), description: `Heavy Smash! (${Math.round(7 * multiplier)} Dmg)` },
    ];
    return patterns[t] || patterns[0];
  } else if (enemyName.includes('Guardian') || enemyName.includes('Rootbound')) {
    const patterns: CombatIntent[] = [
      { type: 'shield', value: Math.round(6 * multiplier), description: `Root Armor (${Math.round(6 * multiplier)} Shield)` },
      { type: 'attack', value: Math.round(5 * multiplier), description: `Thorn Lash (${Math.round(5 * multiplier)} Dmg)` },
      { type: 'dot_attack', value: Math.round(2 * multiplier), duration: 2, description: `Spore Choke (${Math.round(2 * multiplier)} Dmg/Turn for 2 Turns)` },
      { type: 'heavy_attack', value: Math.round(9 * multiplier), description: `Forest Slam! (${Math.round(9 * multiplier)} Dmg)` },
    ];
    return patterns[t] || patterns[0];
  } else {
    // Fractured Echo / Other Boss
    const patterns: CombatIntent[] = [
      { type: 'dot_attack', value: Math.round(2 * multiplier), duration: 3, description: `Void Rot (${Math.round(2 * multiplier)} Dmg/Turn for 3 Turns)` },
      { type: 'shield', value: Math.round(6 * multiplier), description: `Fracture Shield (${Math.round(6 * multiplier)} Shield)` },
      { type: 'attack', value: Math.round(6 * multiplier), description: `Echo Strike (${Math.round(6 * multiplier)} Dmg)` },
      { type: 'heavy_attack', value: Math.round(10 * multiplier), description: `Dissonance Scream!!! (${Math.round(10 * multiplier)} Dmg)` },
    ];
    return patterns[t] || patterns[0];
  }
}




