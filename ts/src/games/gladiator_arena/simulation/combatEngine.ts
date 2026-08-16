/**
 * Gladiator Arena — Turn-Based Combat Simulation Engine
 * 
 * Executes full agent-driven bouts with turn-by-turn resolution,
 * continuous RimWorld anatomy damage, Blood Bowl failed-violence recoil,
 * cyber-organic malfunction rolls, crowd favor swings, and tag-team rotations.
 */

import { ActionType, ArenaOpponent, BodySlot, BoutState, CombatLogEntry, Gladiator, SeverityLevel } from '../types';
import { evaluateAgentDecision } from './agentDecisionEngine';
import {
  applyDamageToSlot,
  calculateCompatibility,
  getGladiatorAnatomySummary,
  rollHitSlot,
  rollMalfunction,
} from '../../engine/shared/anatomy';

/**
 * Initializes a new Bout State for 1v1 Solo or Tag-Team Squad matches
 */
export function initializeBout(
  playerRoster: Gladiator[],
  opponent: ArenaOpponent
): BoutState {
  // Deep clone gladiators so combat mutations don't prematurely corrupt store until match end
  const clonedPlayerRoster: Gladiator[] = JSON.parse(JSON.stringify(playerRoster));
  const clonedEnemyRoster: Gladiator[] = JSON.parse(JSON.stringify(opponent.gladiators));

  const isTeamBout = clonedPlayerRoster.length > 1 || clonedEnemyRoster.length > 1;

  return {
    id: `bout-${Date.now()}`,
    opponent,
    isTeamBout,
    playerRoster: clonedPlayerRoster,
    enemyRoster: clonedEnemyRoster,
    activePlayerIndex: 0,
    activeEnemyIndex: 0,
    round: 1,
    crowdFavor: 0,
    isFinished: false,
    winner: null,
    logs: [
      {
        id: `log-start-${Date.now()}`,
        round: 1,
        turnNumber: 0,
        actorId: 'system',
        actorName: 'Arena Master',
        actorIsPlayer: true,
        action: 'taunt',
        hit: false,
        crit: false,
        damageDealt: 0,
        message: isTeamBout
          ? `📢 THE GATES OPEN! Tag-Team Clash: ${playerRoster[0].name} enters the ring against ${clonedEnemyRoster[0].name}!`
          : `📢 THE GATES OPEN! Solo Bout: ${playerRoster[0].name} stands ready to face ${clonedEnemyRoster[0].name} in ${opponent.name}!`,
      },
    ],
    currentTurnActor: 'player',
    playerDefenseActive: false,
    enemyDefenseActive: false,
    playerVulnerable: false,
    enemyVulnerable: false,
    playerStunned: false,
    enemyStunned: false,
    playerAdrenalineNextCrit: false,
    enemyAdrenalineNextCrit: false,
  };
}

/**
 * Advances the simulation by exactly one single turn / combat step
 */
export function executeNextCombatTurn(state: BoutState): BoutState {
  if (state.isFinished) return state;

  const nextState: BoutState = JSON.parse(JSON.stringify(state));
  const player = nextState.playerRoster[nextState.activePlayerIndex];
  const enemy = nextState.enemyRoster[nextState.activeEnemyIndex];

  if (!player || !enemy) {
    nextState.isFinished = true;
    return nextState;
  }

  const playerAnatomy = getGladiatorAnatomySummary(player);
  const enemyAnatomy = getGladiatorAnatomySummary(enemy);

  // Check if either is already knocked out before turn starts
  if (playerAnatomy.isKnockedOut) {
    handleKnockout(nextState, 'player');
    return nextState;
  }
  if (enemyAnatomy.isKnockedOut) {
    handleKnockout(nextState, 'enemy');
    return nextState;
  }

  // Determine which actor acts this turn
  // If turn is start of a round, calculate Initiative based on Speed + Leg Efficiency + Synergy
  const isPlayerTurn = nextState.currentTurnActor === 'player';
  const actor = isPlayerTurn ? player : enemy;
  const target = isPlayerTurn ? enemy : player;
  const isActorPlayer = isPlayerTurn;

  const turnNum = nextState.logs.length + 1;

  // Handle Stun
  if (isPlayerTurn && nextState.playerStunned) {
    nextState.playerStunned = false;
    nextState.logs.push({
      id: `log-stun-${turnNum}`,
      round: nextState.round,
      turnNumber: turnNum,
      actorId: actor.id,
      actorName: actor.name,
      actorIsPlayer: isActorPlayer,
      action: 'defend',
      hit: false,
      crit: false,
      damageDealt: 0,
      message: `💫 ${actor.name} is REELING from concussive shock and loses their turn recovering balance!`,
    });
    nextState.currentTurnActor = 'enemy';
    return nextState;
  } else if (!isPlayerTurn && nextState.enemyStunned) {
    nextState.enemyStunned = false;
    nextState.logs.push({
      id: `log-stun-${turnNum}`,
      round: nextState.round,
      turnNumber: turnNum,
      actorId: actor.id,
      actorName: actor.name,
      actorIsPlayer: isActorPlayer,
      action: 'defend',
      hit: false,
      crit: false,
      damageDealt: 0,
      message: `💫 ${actor.name} is REELING from concussive shock and loses their turn recovering balance!`,
    });
    nextState.currentTurnActor = 'player';
    nextState.round += 1;
    return nextState;
  }

  // ==================================================
  // 1. Cyber-Organic Malfunction Dice Roll Check
  // ==================================================
  const malfunction = rollMalfunction(actor);
  if (malfunction.triggered && malfunction.effect) {
    // Malfunction deals slight self damage or stumbles
    const malfSlot = malfunction.slotAffected || 'torso';
    actor.parts[malfSlot].currentHp = Math.max(1, actor.parts[malfSlot].currentHp - 3);

    nextState.logs.push({
      id: `log-malf-${turnNum}`,
      round: nextState.round,
      turnNumber: turnNum,
      actorId: actor.id,
      actorName: actor.name,
      actorIsPlayer: isActorPlayer,
      action: 'defend',
      hit: false,
      crit: false,
      damageDealt: 0,
      malfunctionTriggered: true,
      malfunctionEffect: malfunction.effect,
      message: `⚠️ COMPATIBILITY MALFUNCTION! ${malfunction.effect}`,
    });
  }

  // ==================================================
  // 2. Gladiator Agent Decision Evaluation
  // ==================================================
  const benchTeammates = isPlayerTurn
    ? nextState.playerRoster.filter((_, i) => i !== nextState.activePlayerIndex)
    : nextState.enemyRoster.filter((_, i) => i !== nextState.activeEnemyIndex);

  const decisionContext = {
    actor,
    opponent: target,
    round: nextState.round,
    crowdFavor: nextState.crowdFavor,
    opponentVulnerable: isPlayerTurn ? nextState.enemyVulnerable : nextState.playerVulnerable,
    opponentStunned: isPlayerTurn ? nextState.enemyStunned : nextState.playerStunned,
    actorVulnerable: isPlayerTurn ? nextState.playerVulnerable : nextState.enemyVulnerable,
    actorStunned: isPlayerTurn ? nextState.playerStunned : nextState.enemyStunned,
    hasAdrenaline: isPlayerTurn ? nextState.playerAdrenalineNextCrit : nextState.enemyAdrenalineNextCrit,
    isTeamBout: nextState.isTeamBout,
    availableTeammates: benchTeammates,
  };

  const decision = evaluateAgentDecision(decisionContext);
  const action = decision.chosenAction;

  // Clear vulnerability of actor as they take new action
  if (isPlayerTurn) nextState.playerVulnerable = false;
  else nextState.enemyVulnerable = false;

  // Reset defense at start of active turn
  if (isPlayerTurn) nextState.playerDefenseActive = false;
  else nextState.enemyDefenseActive = false;

  // Stats calculation
  const actorStats = calculateEffectiveStats(actor);
  const targetDefense = isPlayerTurn ? nextState.enemyDefenseActive : nextState.playerDefenseActive;

  // ==================================================
  // 3. Action Execution
  // ==================================================
  if (action === 'tag_out' && benchTeammates.length > 0) {
    // Find next viable teammate
    const nextIdx = isPlayerTurn
      ? nextState.playerRoster.findIndex((g, i) => i !== nextState.activePlayerIndex && !getGladiatorAnatomySummary(g).isKnockedOut)
      : nextState.enemyRoster.findIndex((g, i) => i !== nextState.activeEnemyIndex && !getGladiatorAnatomySummary(g).isKnockedOut);

    if (nextIdx !== -1) {
      if (isPlayerTurn) nextState.activePlayerIndex = nextIdx;
      else nextState.activeEnemyIndex = nextIdx;

      const freshTeammate = isPlayerTurn ? nextState.playerRoster[nextIdx] : nextState.enemyRoster[nextIdx];

      nextState.logs.push({
        id: `log-tag-${turnNum}`,
        round: nextState.round,
        turnNumber: turnNum,
        actorId: actor.id,
        actorName: actor.name,
        actorIsPlayer: isActorPlayer,
        action: 'tag_out',
        hit: true,
        crit: false,
        damageDealt: 0,
        tagTeammateId: freshTeammate.id,
        tagTeammateName: freshTeammate.name,
        message: `🔄 TACTICAL TAG-OUT! ${actor.name} retreats to the bench as ${freshTeammate.name} vaults into the arena! [Reason: ${decision.reasoning}]`,
      });

      advanceTurnActor(nextState);
      return nextState;
    }
  }

  if (action === 'defend') {
    if (isPlayerTurn) nextState.playerDefenseActive = true;
    else nextState.enemyDefenseActive = true;

    nextState.logs.push({
      id: `log-def-${turnNum}`,
      round: nextState.round,
      turnNumber: turnNum,
      actorId: actor.id,
      actorName: actor.name,
      actorIsPlayer: isActorPlayer,
      action: 'defend',
      hit: true,
      crit: false,
      damageDealt: 0,
      message: `🛡️ ${actor.name} assumes a reinforced defensive guard (+60% damage reduction & counter-parry ready). [${decision.reasoning}]`,
    });

    advanceTurnActor(nextState);
    return nextState;
  }

  if (action === 'taunt') {
    const favorDelta = isPlayerTurn ? 20 : -20;
    nextState.crowdFavor = Math.min(100, Math.max(-100, nextState.crowdFavor + favorDelta));

    if (isPlayerTurn) nextState.playerAdrenalineNextCrit = true;
    else nextState.enemyAdrenalineNextCrit = true;

    nextState.logs.push({
      id: `log-taunt-${turnNum}`,
      round: nextState.round,
      turnNumber: turnNum,
      actorId: actor.id,
      actorName: actor.name,
      actorIsPlayer: isActorPlayer,
      action: 'taunt',
      hit: true,
      crit: false,
      damageDealt: 0,
      crowdFavorDelta: favorDelta,
      message: `🔥 ${actor.name} roars at the audience, hyping the crowd! Gains +Adrenaline Surge (Next strike has +25% Crit chance)! [${decision.reasoning}]`,
    });

    advanceTurnActor(nextState);
    return nextState;
  }

  // Attack Actions: quick_attack, power_attack, charge
  let baseHitChance = 0.85;
  let damageMultiplier = 1.0;
  let recoilRisk = 0;
  let actionName = 'Quick Attack';

  if (action === 'quick_attack') {
    baseHitChance = 0.90 + (actorStats.accuracy / 100);
    damageMultiplier = 0.75;
    actionName = 'Quick Attack';
  } else if (action === 'power_attack') {
    baseHitChance = 0.70 + (actorStats.accuracy / 100);
    damageMultiplier = 1.30;
    recoilRisk = 0.15; // Blood Bowl Failed Violence
    actionName = 'Power Attack';
  } else if (action === 'charge') {
    baseHitChance = 0.80 + (actorStats.speed / 120);
    damageMultiplier = 1.05;
    actionName = 'Slam Charge';
  }

  // Target evasion
  const targetStats = calculateEffectiveStats(target);
  const targetEvasion = (targetStats.speed / 200) * (targetDefense ? 1.5 : 1.0);
  const finalHitChance = Math.min(0.96, Math.max(0.25, baseHitChance - targetEvasion));

  const isHit = Math.random() < finalHitChance;

  if (!isHit) {
    // ==========================================
    // Blood Bowl Failed Violence Recoil
    // ==========================================
    let recoilMsg = '';
    if (action === 'power_attack') {
      if (isPlayerTurn) nextState.playerVulnerable = true;
      else nextState.enemyVulnerable = true;

      const recoilSelfDmg = Math.round(actorStats.power * 0.2);
      actor.parts.torso.currentHp = Math.max(1, actor.parts.torso.currentHp - recoilSelfDmg);
      recoilMsg = ` 💥 FAILED VIOLENCE: The heavy swing overextended! ${actor.name} takes ${recoilSelfDmg} recoil strain and is VULNERABLE next round!`;
    }

    nextState.logs.push({
      id: `log-miss-${turnNum}`,
      round: nextState.round,
      turnNumber: turnNum,
      actorId: actor.id,
      actorName: actor.name,
      actorIsPlayer: isActorPlayer,
      action,
      hit: false,
      crit: false,
      damageDealt: 0,
      message: `💨 ${actor.name} unleashed a ${actionName} on ${target.name}, but MISSED completely!${recoilMsg}`,
    });

    advanceTurnActor(nextState);
    return nextState;
  }

  // Hit Succeeded! Calculate Damage & Anatomy Slot
  const hasAdrenaline = isPlayerTurn ? nextState.playerAdrenalineNextCrit : nextState.enemyAdrenalineNextCrit;
  const critRoll = Math.random() * 100;
  const isCrit = critRoll < (actorStats.critChance + (hasAdrenaline ? 25 : 0));

  // Reset adrenaline
  if (isPlayerTurn) nextState.playerAdrenalineNextCrit = false;
  else nextState.enemyAdrenalineNextCrit = false;

  const targetSlot = rollHitSlot();
  const targetPart = target.parts[targetSlot];

  let rawDamage = (actorStats.power * damageMultiplier) + (Math.random() * 5 - 2);
  if (isCrit) rawDamage *= 1.5;
  if (targetDefense) rawDamage *= 0.50; // Defend reduces incoming damage by 50%
  if (isPlayerTurn ? nextState.enemyVulnerable : nextState.playerVulnerable) {
    rawDamage *= 1.30; // Target was vulnerable!
  }

  const damageResult = applyDamageToSlot(targetPart, rawDamage, isCrit);

  actor.totalDamageDealt += damageResult.actualDamage;

  // Stun chance on heavy power attacks or charge
  if ((action === 'power_attack' && damageResult.severity === 'stunned') || (action === 'charge' && Math.random() < 0.45)) {
    if (isPlayerTurn) nextState.enemyStunned = true;
    else nextState.playerStunned = true;
  }

  // Crowd Favor Adjustment
  let favorDelta = 0;
  if (isCrit) favorDelta = isPlayerTurn ? 12 : -12;
  else if (damageResult.severity === 'crippled' || damageResult.severity === 'dismembered') {
    favorDelta = isPlayerTurn ? 15 : -15;
  } else {
    favorDelta = isPlayerTurn ? 4 : -4;
  }
  nextState.crowdFavor = Math.min(100, Math.max(-100, nextState.crowdFavor + favorDelta));

  const critTag = isCrit ? '💥 CRITICAL BLOW!' : '';
  const slotName = targetSlot.replace('_', ' ').toUpperCase();

  nextState.logs.push({
    id: `log-hit-${turnNum}`,
    round: nextState.round,
    turnNumber: turnNum,
    actorId: actor.id,
    actorName: actor.name,
    actorIsPlayer: isActorPlayer,
    targetId: target.id,
    targetName: target.name,
    targetSlot,
    action,
    hit: true,
    crit: isCrit,
    damageDealt: damageResult.actualDamage,
    severity: damageResult.severity,
    crowdFavorDelta: favorDelta,
    message: `${critTag} ⚔️ ${actor.name} lands a ${actionName} on ${target.name}'s [${slotName}] for ${damageResult.actualDamage} dmg! (${damageResult.logDescription})`,
  });

  // Check target knockout
  const targetAnatomyAfter = getGladiatorAnatomySummary(target);
  if (targetAnatomyAfter.isKnockedOut) {
    handleKnockout(nextState, isPlayerTurn ? 'enemy' : 'player');
    return nextState;
  } else if (targetSlot === 'head' && damageResult.newPartHp === 0) {
    // Non-lethal head fracture / concussion: stuns target for 1 turn
    if (isPlayerTurn) nextState.enemyStunned = true;
    else nextState.playerStunned = true;
  }

  advanceTurnActor(nextState);
  return nextState;
}

function advanceTurnActor(state: BoutState) {
  if (state.currentTurnActor === 'player') {
    state.currentTurnActor = 'enemy';
  } else {
    state.currentTurnActor = 'player';
    state.round += 1;
  }
}

function handleKnockout(state: BoutState, knockedOutSide: 'player' | 'enemy') {
  const isPlayer = knockedOutSide === 'player';
  const roster = isPlayer ? state.playerRoster : state.enemyRoster;
  const currentIdx = isPlayer ? state.activePlayerIndex : state.activeEnemyIndex;
  const defeatedGladiator = roster[currentIdx];

  const turnNum = state.logs.length + 1;

  state.logs.push({
    id: `log-ko-${turnNum}`,
    round: state.round,
    turnNumber: turnNum,
    actorId: defeatedGladiator.id,
    actorName: defeatedGladiator.name,
    actorIsPlayer: isPlayer,
    action: 'defend',
    hit: false,
    crit: false,
    damageDealt: 0,
    severity: 'dismembered',
    message: `💀 COLLAPSE! ${defeatedGladiator.name} has suffered catastrophic anatomical failure and COLLAPSES into the arena sand!`,
  });

  // Check if team has another conscious fighter
  const nextViableIdx = roster.findIndex((g, i) => i !== currentIdx && !getGladiatorAnatomySummary(g).isKnockedOut);

  if (nextViableIdx !== -1) {
    if (isPlayer) state.activePlayerIndex = nextViableIdx;
    else state.activeEnemyIndex = nextViableIdx;

    const nextFighter = roster[nextViableIdx];
    state.logs.push({
      id: `log-reinforce-${turnNum + 1}`,
      round: state.round,
      turnNumber: turnNum + 1,
      actorId: nextFighter.id,
      actorName: nextFighter.name,
      actorIsPlayer: isPlayer,
      action: 'charge',
      hit: false,
      crit: false,
      damageDealt: 0,
      message: `⚡ SQUAD ROTATION: ${nextFighter.name} rushes into the arena to take the fallen fighter's place!`,
    });
  } else {
    // Bout Concludes!
    state.isFinished = true;
    state.winner = isPlayer ? 'enemy' : 'player';

    const winnerName = isPlayer ? state.enemyRoster[0].name : state.playerRoster[0].name;
    state.logs.push({
      id: `log-victory-${turnNum + 2}`,
      round: state.round,
      turnNumber: turnNum + 2,
      actorId: 'system',
      actorName: 'Arena Master',
      actorIsPlayer: !isPlayer,
      action: 'taunt',
      hit: false,
      crit: false,
      damageDealt: 0,
      message: `🏆 MATCH DECIDED! Victory belongs to ${winnerName}! The crowd erupts in pandemonium!`,
    });
  }
}

/**
 * Calculates aggregate stats adjusted for arm/leg/head efficiencies and synergy bonuses
 */
export function calculateEffectiveStats(gladiator: Gladiator) {
  const anatomy = getGladiatorAnatomySummary(gladiator);
  const compatibility = calculateCompatibility(gladiator);

  const basePower = Object.values(gladiator.parts).reduce((sum, p) => sum + p.power, 0);
  const baseSpeed = Object.values(gladiator.parts).reduce((sum, p) => sum + p.speed, 0);
  const baseArmor = Object.values(gladiator.parts).reduce((sum, p) => sum + p.armor, 0);
  const baseAccuracy = Object.values(gladiator.parts).reduce((sum, p) => sum + p.accuracy, 0);
  const baseCrit = Object.values(gladiator.parts).reduce((sum, p) => sum + p.critChance, 0);

  // Arm efficiency scales power
  const effectivePower = Math.max(2, Math.round(
    basePower * (0.35 + anatomy.armEfficiency * 0.65) * (1 + compatibility.synergyBonus.powerPercent / 100)
  ));

  // Leg efficiency scales speed
  const effectiveSpeed = Math.max(1, Math.round(
    baseSpeed * (0.30 + anatomy.legEfficiency * 0.70) * (1 + compatibility.synergyBonus.speedPercent / 100)
  ));

  // Head efficiency scales accuracy
  const effectiveAccuracy = Math.max(0, Math.round(
    baseAccuracy * (0.40 + anatomy.headEfficiency * 0.60)
  ));

  return {
    power: effectivePower,
    speed: effectiveSpeed,
    armor: baseArmor,
    accuracy: effectiveAccuracy,
    critChance: baseCrit,
  };
}
