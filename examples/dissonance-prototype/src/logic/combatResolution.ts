import { RunState, DeckCard, DeckState } from '../types';
import { 
  resolve_combination, 
  getEnemyIntent, 
  getCardName, 
  getComboKey, 
  drawHand, 
  getSecondaryType, 
  getTypeMultiplier 
} from '../utils';
import { applySynergyMechanic } from './builds';

export interface CombatResolutionParams {
  playedCard: DeckCard;
  runState: RunState;
  liveDifficultyMultiplier: number;
  phase2Triggered: boolean;
  phase3Triggered: boolean;
}

export interface CombatResolutionResult {
  nextState: RunState;
  fightWon: boolean | null; // true if enemy defeated, false if player defeated, null if ongoing
  isBoss: boolean;
  phase2Triggered: boolean;
  phase3Triggered: boolean;
}

export function executeTurnResolution({
  playedCard,
  runState,
  liveDifficultyMultiplier,
  phase2Triggered: initialP2,
  phase3Triggered: initialP3
}: CombatResolutionParams): CombatResolutionResult {
  let phase2Triggered = initialP2;
  let phase3Triggered = initialP3;

  const currentEnemy = runState.enemy!;
  const primary = playedCard.el1;
  const secondary = playedCard.el2;
  const component = playedCard.component;
  const seed = runState.seed;

  let result = resolve_combination(primary, secondary, component, seed);
  const hasNoFizzleBoon = runState.boons?.some(b => b.id === 'no_fizzle');
  if (result.relationType === 'opposed' && hasNoFizzleBoon && !result.opposedSuccess) {
    const valueBeforeMultiplier = result.baseValue;
    const modifiedValue = Math.round(valueBeforeMultiplier * 1.5);
    result = {
      ...result,
      opposedSuccess: true,
      multiplier: 1.5,
      modifiedValue,
      message: `🔥 (No-Fizzle Boon Bypass) Opposed Resonance Success! Combined ${primary.toUpperCase()} & ${secondary?.toUpperCase()} with ${component.toUpperCase()}. Stable fusion achieved by Master Boon! 1.5x multiplier applied. Total: ${modifiedValue}.`
    };
  }

  // Fracture Warden Signature Effect: Caller-level Opposed Success Suppression
  const isFractureWarden = currentEnemy.name.includes('Fracture Warden');
  if (result.relationType === 'opposed' && isFractureWarden && result.opposedSuccess && !hasNoFizzleBoon) {
    const temp = (seed * 1103515245 + 12345) & 0x7fffffff;
    const roll = temp / 0x7fffffff;
    if (roll >= 0.25) {
      const valueBeforeMultiplier = result.baseValue;
      const modifiedValue = Math.round(valueBeforeMultiplier * 0.5);
      result = {
        ...result,
        opposedSuccess: false,
        multiplier: 0.5,
        modifiedValue,
        message: `⚠️ (Fracture Warden Aura) Opposed Resonance Suppressed! Combined ${primary.toUpperCase()} & ${secondary?.toUpperCase()} with ${component.toUpperCase()}. Unstable reaction forced by Fracture Warden (25% success threshold). 0.5x penalty applied. Total: ${modifiedValue}.`
      };
    }
  }

  // Cracked Mirror Relic
  const hasCrackedMirror = runState.relics?.includes('cracked_mirror');
  if (result.relationType === 'opposed' && hasCrackedMirror) {
    const newMult = result.multiplier + 0.25;
    const modifiedValue = Math.round(result.baseValue * newMult);
    result = {
      ...result,
      multiplier: newMult,
      modifiedValue,
      message: result.message + ` ⚡ (Cracked Mirror Relic: Opposed ${result.opposedSuccess ? 'Success' : 'Fail'} multiplier increased by +0.25x to ${newMult.toFixed(2)}x!)`
    };
  }

  // Same Amplify Boon
  const hasSameAmplify = runState.boons?.some(b => b.id === 'same_amplify');
  if (result.relationType === 'same' && hasSameAmplify) {
    const newMult = result.multiplier + 1.0;
    const modifiedValue = Math.round(result.baseValue * newMult);
    result = {
      ...result,
      multiplier: newMult,
      modifiedValue,
      message: result.message + ` 🔥 (Same-Amplify Boon: Same-relation multiplier increased by +1.0x to ${newMult.toFixed(1)}x!)`
    };
  }

  // Active Build Synergy Mechanics (Caller-level)
  const { 
    result: synergyResult, 
    nextMechanicState, 
    logMessages: synergyLogs, 
    extraPlayerShield: synergyShield 
  } = applySynergyMechanic(runState.activeBuild, playedCard, result, runState);
  result = synergyResult;

  let nextPlayerHp = runState.playerHp;
  let nextPlayerShield = runState.playerShield + (synergyShield || 0);
  let nextEnemyHp = currentEnemy.hp;
  let nextEnemyShield = 0;
  let nextEnemyDoT = currentEnemy.dot;

  const logsList: string[] = [];
  logsList.push(`[Player Turn] Played Card: "${getCardName(primary, secondary, component)}" (${primary.toUpperCase()}${secondary ? ' + ' + secondary.toUpperCase() : ''} + ${component.toUpperCase()})`);
  logsList.push(`↳ ${result.message}`);
  if (synergyLogs.length > 0) {
    synergyLogs.forEach(msg => logsList.push(`↳ ${msg}`));
  }

  const comboKey = getComboKey(primary, secondary, component);
  const updatedCombinationCounts = {
    ...runState.combinationCounts,
    [comboKey]: (runState.combinationCounts[comboKey] || 0) + 1
  };

  let finalEffectValue = result.modifiedValue;

  // Apply Active Typed Boons
  let boonAmount = 0;
  if (runState.boons && runState.boons.length > 0) {
    runState.boons.forEach(boon => {
      let matches = false;
      if (boon.targetType === 'element') {
        if (primary === boon.targetId || secondary === boon.targetId) {
          matches = true;
        }
      } else if (boon.targetType === 'action') {
        if (component === boon.targetId) {
          matches = true;
        }
      } else if (boon.targetType === 'combination') {
        if (playedCard.relationType === boon.targetId) {
          matches = true;
        } else if (
          boon.targetId === `${primary}_${component}` ||
          (secondary && boon.targetId === `${secondary}_${component}`)
        ) {
          matches = true;
        }
      }

      if (matches && boon.modifier !== undefined) {
        boonAmount += boon.modifier;
        logsList.push(`🔥 Active Boon (${boon.id}): +${boon.modifier} effectiveness from "${boon.targetId.toUpperCase()}" modifier.`);
      }
    });
  }
  finalEffectValue += boonAmount;

  // Secondary Type Multiplier
  const cardSecType = getSecondaryType(playedCard.relationType);
  const typeMult = getTypeMultiplier(cardSecType, {
    vulnerable: currentEnemy.vulnerable,
    resistant: currentEnemy.resistant
  });

  if (typeMult !== 1.0) {
    finalEffectValue = Math.round(finalEffectValue * typeMult);
    if (typeMult > 1.0) {
      logsList.push(`🎯 TYPE ADVANTAGE! ${cardSecType?.toUpperCase()} vs Vulnerable target (${currentEnemy.vulnerable?.toUpperCase()}): 1.3x multiplier applied -> ${finalEffectValue}.`);
    } else {
      logsList.push(`🛡️ TYPE RESISTANCE! ${cardSecType?.toUpperCase()} vs Resistant target (${currentEnemy.resistant?.toUpperCase()}): 0.7x multiplier applied -> ${finalEffectValue}.`);
    }
  }

  if (component === 'sever') {
    const damage = finalEffectValue;
    nextEnemyHp = Math.max(0, nextEnemyHp - damage);
    logsList.push(`💥 Dealt ${damage} damage to ${currentEnemy.name}.`);
  } else if (component === 'mend') {
    const heal = finalEffectValue;
    nextPlayerHp = Math.min(runState.playerMaxHp, nextPlayerHp + heal);
    logsList.push(`💚 Healed player for ${heal} HP (Current: ${nextPlayerHp}/${runState.playerMaxHp}).`);
  } else if (component === 'guard') {
    const shield = finalEffectValue;
    nextPlayerShield += shield;
    logsList.push(`🛡️ Shielded player for +${shield} (Total Shield: ${nextPlayerShield}).`);

    const hasGuardReflect = runState.boons?.some(b => b.id === 'guard_reflect');
    if (hasGuardReflect) {
      nextEnemyHp = Math.max(0, nextEnemyHp - shield);
      logsList.push(`⚡ (Guard Reflect Boon) Reflected ${shield} Shield value as direct damage to ${currentEnemy.name}!`);
    }
  } else if (component === 'unmake') {
    nextEnemyDoT = { duration: 3, damage: finalEffectValue };
    logsList.push(`🌌 Afflicted ${currentEnemy.name} with Void Rot DoT (${finalEffectValue} damage/turn for 3 turns).`);
  }

  if (result.bonusEffect) {
    const bonus = result.bonusEffect;
    if (bonus.type === 'damage') {
      nextEnemyHp = Math.max(0, nextEnemyHp - bonus.value);
      logsList.push(`↳ Adjacent Bonus (Heat): Dealt +${bonus.value} extra damage.`);
    } else if (bonus.type === 'shield') {
      nextPlayerShield += bonus.value;
      logsList.push(`↳ Adjacent Bonus (Ash/Cinder): Gained +${bonus.value} extra Shield.`);
    } else if (bonus.type === 'heal') {
      nextPlayerHp = Math.min(runState.playerMaxHp, nextPlayerHp + bonus.value);
      logsList.push(`↳ Adjacent Bonus (Spark): Healed +${bonus.value} extra HP.`);
    }
  }

  const hasAnchorOfAsh = component === 'guard' && runState.relics?.includes('anchor_of_ash');
  const bonusEssence = hasAnchorOfAsh ? 1 : 0;
  const nextEssence = runState.essence + 1 + bonusEssence;
  if (hasAnchorOfAsh) {
    logsList.push(`💎 Earned +1 Run Essence (+1 bonus from "Anchor of Ash" Relic).`);
  } else {
    logsList.push(`💎 Earned +1 Run Essence (secured immediately).`);
  }

  let nextHand = runState.deckState.hand.filter(c => c.id !== playedCard.id);
  let nextDiscard = [...runState.deckState.discard, playedCard];
  let nextDrawPile = [...runState.deckState.drawPile];

  let nextDeckState: DeckState = {
    drawPile: nextDrawPile,
    hand: nextHand,
    discard: nextDiscard
  };

  const handSize = runState.relics?.includes('cracked_core') ? 6 : 5;

  const currentNode = runState.nodes.find(n => n.id === runState.currentNodeId);
  const isBossNode = currentNode?.type === 'boss';

  // Enemy Defeated Check
  if (nextEnemyHp <= 0) {
    const victoryBonus = isBossNode ? 30 : 15;
    const finalEssence = nextEssence + victoryBonus;

    logsList.push(`🎉 Enemy Defeated! Granting +${victoryBonus} flat victory Essence.`);
    nextDeckState = drawHand(nextDeckState, handSize);

    const nextState: RunState = {
      ...runState,
      playerHp: nextPlayerHp,
      playerShield: nextPlayerShield,
      essence: finalEssence,
      combinationCounts: updatedCombinationCounts,
      deckState: nextDeckState,
      enemy: {
        ...currentEnemy,
        hp: 0,
        dot: null
      },
      logs: [...runState.logs, ...logsList, `Advance to reward/timeline sequence when ready.`]
    };

    return {
      nextState,
      fightWon: true,
      isBoss: isBossNode,
      phase2Triggered,
      phase3Triggered
    };
  }

  // Boss Phase Thresholds after player action
  let nextEnemySecondaryType = currentEnemy.secondaryType ?? null;
  let nextEnemyVulnerable = currentEnemy.vulnerable ?? null;
  let nextEnemyResistant = currentEnemy.resistant ?? null;

  if (isBossNode && nextEnemyHp > 0) {
    const thresh66 = Math.round(currentEnemy.maxHp * 0.66);
    const thresh33 = Math.round(currentEnemy.maxHp * 0.33);

    if (nextEnemyHp <= thresh33) {
      nextEnemySecondaryType = 'burst';
      nextEnemyVulnerable = 'hybrid';
      nextEnemyResistant = 'volatile';
      if (!phase3Triggered) {
        phase3Triggered = true;
        nextPlayerHp = Math.max(1, nextPlayerHp - 5);
        logsList.push(`🚨 CRITICAL INSTABILITY: "The resonant frequency shatters further under pressure." (Phase 3 Shift)`);
        logsList.push(`💥 INSTABILITY PULSE: Fractured Echo shifts to BURST (Vulnerable: HYBRID, Resistant: VOLATILE) and deals 5 direct pressure damage to Player!`);
      }
    } else if (nextEnemyHp <= thresh66) {
      nextEnemySecondaryType = 'volatile';
      nextEnemyVulnerable = 'burst';
      nextEnemyResistant = 'hybrid';
      if (!phase2Triggered) {
        phase2Triggered = true;
        nextEnemyHp = Math.min(currentEnemy.maxHp, nextEnemyHp + 12);
        logsList.push(`⚠️ SYSTEM INTEGRITY FLICKER: "Something in the pattern shifts. Fractured Echo is coming apart differently now." (Phase 2 Shift)`);
        logsList.push(`🛡️ DEFENSIVE FLARE: Fractured Echo shifts to VOLATILE (Vulnerable: BURST, Resistant: HYBRID) and restores +12 HP!`);
      }
    } else {
      nextEnemySecondaryType = 'hybrid';
      nextEnemyVulnerable = 'burst';
      nextEnemyResistant = 'volatile';
    }
  }

  // Enemy Turn Simulation
  logsList.push(`[Enemy Turn] ${currentEnemy.name} acts.`);

  if (nextEnemyDoT && nextEnemyDoT.duration > 0) {
    const dotDmg = nextEnemyDoT.damage;
    nextEnemyHp = Math.max(0, nextEnemyHp - dotDmg);
    const remainingDuration = nextEnemyDoT.duration - 1;
    logsList.push(`⏳ Void Rot burns ${currentEnemy.name} for ${dotDmg} damage. (${remainingDuration} turns remaining)`);
    
    if (remainingDuration === 0) {
      nextEnemyDoT = null;
    } else {
      nextEnemyDoT = { duration: remainingDuration, damage: dotDmg };
    }

    if (nextEnemyHp <= 0) {
      const victoryBonus = isBossNode ? 30 : 15;
      const finalEssence = nextEssence + victoryBonus;

      logsList.push(`🎉 Enemy collapsed under Void Rot DoT! Granting +${victoryBonus} victory Essence.`);
      nextDeckState = drawHand(nextDeckState, handSize);

      const nextState: RunState = {
        ...runState,
        playerHp: nextPlayerHp,
        playerShield: nextPlayerShield,
        essence: finalEssence,
        combinationCounts: updatedCombinationCounts,
        deckState: nextDeckState,
        enemy: {
          ...currentEnemy,
          hp: 0,
          dot: null
        },
        logs: [...runState.logs, ...logsList, `Advance to reward/timeline sequence when ready.`]
      };

      return {
        nextState,
        fightWon: true,
        isBoss: isBossNode,
        phase2Triggered,
        phase3Triggered
      };
    } else if (isBossNode) {
      const thresh66 = Math.round(currentEnemy.maxHp * 0.66);
      const thresh33 = Math.round(currentEnemy.maxHp * 0.33);

      if (nextEnemyHp <= thresh33 && !phase3Triggered) {
        phase3Triggered = true;
        nextPlayerHp = Math.max(1, nextPlayerHp - 5);
        logsList.push(`🚨 CRITICAL INSTABILITY: "The resonant frequency shatters further under pressure." (Phase 3 Shift)`);
        logsList.push(`💥 INSTABILITY PULSE: Fractured Echo discharges a violent shockwave, dealing 5 direct pressure damage to Player!`);
      } else if (nextEnemyHp <= thresh66 && !phase2Triggered) {
        phase2Triggered = true;
        nextEnemyHp = Math.min(currentEnemy.maxHp, nextEnemyHp + 12);
        logsList.push(`⚠️ SYSTEM INTEGRITY FLICKER: "Something in the pattern shifts. Fractured Echo is coming apart differently now." (Phase 2 Shift)`);
        logsList.push(`🛡️ DEFENSIVE FLARE: The core reconstructs defensive arrays, restoring +12 HP!`);
      }
    }
  }

  // Rootbound Guardian Signature Effect
  if (currentEnemy.name.includes('Rootbound Guardian') && nextEnemyHp > 0) {
    const healAmt = 4;
    nextEnemyHp = Math.min(currentEnemy.maxHp, nextEnemyHp + healAmt);
    logsList.push(`🌿 Rootbound Guardian self-heals for +${healAmt} HP (${nextEnemyHp}/${currentEnemy.maxHp}).`);
  }

  // Cinderlord Sentinel Signature Effect
  if (currentEnemy.name.includes('Cinderlord Sentinel') && nextEnemyHp > 0) {
    nextEnemyShield += 6;
    logsList.push(`🛡️ Cinderlord Sentinel stacks +6 Shield uninterrupted (Total Shield: ${nextEnemyShield}).`);
  }

  const enemyIntent = currentEnemy.intent;
  if (enemyIntent.type === 'attack' || enemyIntent.type === 'heavy_attack') {
    const baseDmg = enemyIntent.value;
    const enemyDmg = Math.max(1, Math.round(baseDmg * liveDifficultyMultiplier));
    const dmgBlocked = Math.min(nextPlayerShield, enemyDmg);
    const finalDmg = enemyDmg - dmgBlocked;
    nextPlayerShield -= dmgBlocked;
    nextPlayerHp = Math.max(0, nextPlayerHp - finalDmg);

    logsList.push(`⚔️ Enemy used ${enemyIntent.description} (${enemyDmg} scaled dmg, x${liveDifficultyMultiplier.toFixed(2)}). Blocked ${dmgBlocked} shield. Took ${finalDmg} damage!`);
  } else if (enemyIntent.type === 'shield') {
    nextEnemyShield += enemyIntent.value;
    logsList.push(`🛡️ Enemy used ${enemyIntent.description}, gaining ${enemyIntent.value} Shield.`);
  } else if (enemyIntent.type === 'dot_attack') {
    const baseDmg = enemyIntent.value;
    const enemyDmg = Math.max(1, Math.round(baseDmg * liveDifficultyMultiplier));
    nextPlayerHp = Math.max(0, nextPlayerHp - enemyDmg);
    logsList.push(`☣️ Enemy used ${enemyIntent.description}. Player took ${enemyDmg} scaled dmg!`);
  }

  // Steadfast Ember safety net logic
  const hasSteadfastEmber = runState.relics?.includes('steadfast_ember');
  const isEmberConsumed = runState.usedRelicIds?.includes('steadfast_ember');
  let updatedUsedRelicIds = [...(runState.usedRelicIds || [])];

  if (nextPlayerHp <= 0 && hasSteadfastEmber && !isEmberConsumed) {
    nextPlayerHp = 1;
    updatedUsedRelicIds.push('steadfast_ember');
    logsList.push(`✨ RELIC TRIGGERED: "Steadfast Ember" flared with energy! Prevented collapse and stabilized frequency at 1 HP.`);
  }

  // Player Defeated Check
  if (nextPlayerHp <= 0) {
    logsList.push(`💀 CRITICAL ERROR: Your physical frequency collapsed. Run Failed!`);
    const nextState: RunState = {
      ...runState,
      playerHp: 0,
      playerShield: 0,
      essence: 0,
      combinationCounts: updatedCombinationCounts,
      status: 'game_over',
      logs: [...runState.logs, ...logsList]
    };

    return {
      nextState,
      fightWon: false,
      isBoss: isBossNode,
      phase2Triggered,
      phase3Triggered
    };
  }

  nextPlayerShield = 0;
  nextDeckState = drawHand(nextDeckState, handSize);

  const nextTurnCount = runState.turnCount + 1;
  let nextEnemyIntent = getEnemyIntent(currentEnemy.name, nextTurnCount);

  if (currentEnemy.behaviorTypeIds?.includes('weaver')) {
    const weaverCycle = (nextTurnCount - 1) % 3;
    if (weaverCycle === 0) {
      nextEnemySecondaryType = 'burst';
      nextEnemyVulnerable = 'hybrid';
      nextEnemyResistant = 'volatile';
    } else if (weaverCycle === 1) {
      nextEnemySecondaryType = 'hybrid';
      nextEnemyVulnerable = 'burst';
      nextEnemyResistant = 'volatile';
    } else {
      nextEnemySecondaryType = 'volatile';
      nextEnemyVulnerable = 'burst';
      nextEnemyResistant = 'hybrid';
    }
  }

  if (isBossNode && nextEnemyHp > 0) {
    const thresh66 = Math.round(currentEnemy.maxHp * 0.66);
    const thresh33 = Math.round(currentEnemy.maxHp * 0.33);
    if (nextEnemyHp <= thresh33) {
      nextEnemyIntent = { type: 'heavy_attack', value: 16, description: `Shattered Scream!!! (16 Dmg)` };
    } else if (nextEnemyHp <= thresh66) {
      nextEnemyIntent = { type: 'shield', value: 12, description: `Stabilized Ward (12 Shield)` };
    }
  }

  const nextState: RunState = {
    ...runState,
    playerHp: nextPlayerHp,
    playerShield: nextPlayerShield,
    essence: nextEssence,
    usedRelicIds: updatedUsedRelicIds,
    combinationCounts: updatedCombinationCounts,
    seed: (runState.seed * 1103515245 + 12345) & 0x7fffffff,
    turnCount: nextTurnCount,
    deckState: nextDeckState,
    enemy: {
      ...currentEnemy,
      hp: nextEnemyHp,
      dot: nextEnemyDoT,
      intent: nextEnemyIntent,
      secondaryType: nextEnemySecondaryType,
      vulnerable: nextEnemyVulnerable,
      resistant: nextEnemyResistant,
    },
    logs: [
      ...runState.logs, 
      ...logsList, 
      `-------------------------`,
      `[Turn ${nextTurnCount}] The enemy prepares: ${nextEnemyIntent.description}.`
    ]
  };

  return {
    nextState,
    fightWon: null,
    isBoss: isBossNode,
    phase2Triggered,
    phase3Triggered
  };
}
