/**
 * Gladiator Arena — Gladiator Agent Universal Decision Engine
 * 
 * Reusable Universal Decision System with combat weights:
 * Evaluates candidate actions each turn, scores them based on current anatomy efficiencies,
 * fighter personality, weapon traits, crowd favor, opponent vulnerability, and bench status.
 */

import { ActionScore, ActionType, Gladiator } from '../types';
import { calculateCompatibility, getGladiatorAnatomySummary } from '../../engine/shared/anatomy';

export interface DecisionContext {
  actor: Gladiator;
  opponent: Gladiator;
  round: number;
  crowdFavor: number;
  opponentVulnerable: boolean;
  opponentStunned: boolean;
  actorVulnerable: boolean;
  actorStunned: boolean;
  hasAdrenaline: boolean;
  isTeamBout: boolean;
  availableTeammates: Gladiator[];
}

/**
 * Independent implementation, structurally compatible with MBB/Sports-Sim's real
 * scored-utility decision architecture by design intent -- not literal shared code.
 * AI Studio sessions have no filesystem access to other repos; genuine
 * code-sharing (moving this into ts/src/engine/shared/) is real future
 * work once this gets ported into the main studio monorepo.
 */
export function evaluateAgentDecision(context: DecisionContext): {
  chosenAction: ActionType;
  allScores: ActionScore[];
  reasoning: string;
} {
  const {
    actor,
    opponent,
    round,
    crowdFavor,
    opponentVulnerable,
    opponentStunned,
    actorVulnerable,
    hasAdrenaline,
    isTeamBout,
    availableTeammates,
  } = context;

  const actorAnatomy = getGladiatorAnatomySummary(actor);
  const opponentAnatomy = getGladiatorAnatomySummary(opponent);
  const compatibility = calculateCompatibility(actor);

  // Compute aggregate stats from active parts
  const totalPower = Object.values(actor.parts).reduce((sum, p) => sum + p.power, 0);
  const totalSpeed = Object.values(actor.parts).reduce((sum, p) => sum + p.speed, 0);
  const totalArmor = Object.values(actor.parts).reduce((sum, p) => sum + p.armor, 0);

  const scores: ActionScore[] = [];

  // ==========================================
  // 1. QUICK ATTACK
  // Fast, reliable, low recoil risk.
  // Favored by high-speed builds, when opponent is low HP, or when actor has damaged arms.
  // ==========================================
  let quickAttackScore = 45;
  quickAttackScore += totalSpeed * 1.5;
  quickAttackScore += (1 - opponentAnatomy.overallHpRatio) * 30; // Finish off low HP enemy
  if (actorAnatomy.armEfficiency < 0.6) {
    quickAttackScore += 20; // Damaged arms can't handle heavy swings
  }
  if (actor.personality === 'tactician') quickAttackScore += 15;
  if (actor.personality === 'brawler') quickAttackScore += 10;
  
  scores.push({
    action: 'quick_attack',
    score: Math.round(quickAttackScore),
    reason: opponentAnatomy.overallHpRatio < 0.3 
      ? 'Target is heavily wounded; striking fast to finish them off.' 
      : 'High agility favors rapid, low-risk strikes.',
  });

  // ==========================================
  // 2. POWER ATTACK
  // High damage, armor penetration.
  // FAILED VIOLENCE (Blood Bowl): high recoil and vulnerability if missed.
  // Favored by high-power builds, when opponent is stunned/vulnerable, or berserkers.
  // ==========================================
  let powerAttackScore = 35;
  powerAttackScore += totalPower * 2.2;
  if (opponentVulnerable) powerAttackScore += 45;
  if (opponentStunned) powerAttackScore += 35;
  if (hasAdrenaline) powerAttackScore += 30;
  if (actor.personality === 'berserker') powerAttackScore += 35;
  if (actorAnatomy.armEfficiency < 0.5) powerAttackScore -= 30; // Can't power swing with broken arm
  if (actorVulnerable) powerAttackScore -= 15; // Risky while already off-balance

  scores.push({
    action: 'power_attack',
    score: Math.round(Math.max(5, powerAttackScore)),
    reason: opponentVulnerable
      ? 'Enemy is off-balance! Unleashing maximum power attack!'
      : totalPower > 25
      ? 'Heavy hydraulic/biomuscular build favors devastating crushing blows.'
      : 'Committing to a high-impact offensive strike.',
  });

  // ==========================================
  // 3. CHARGE
  // Momentum-based engagement. Staggers and closes distance.
  // Favored on Round 1, by brawlers/berserkers, and with high leg efficiency.
  // ==========================================
  let chargeScore = 25;
  if (round === 1) chargeScore += 35; // Opening clash
  chargeScore += totalSpeed * 1.2 * actorAnatomy.legEfficiency;
  if (actor.personality === 'brawler') chargeScore += 25;
  if (actor.personality === 'berserker') chargeScore += 20;
  if (actorAnatomy.legEfficiency < 0.6) chargeScore -= 40; // Can't charge with broken legs

  scores.push({
    action: 'charge',
    score: Math.round(Math.max(0, chargeScore)),
    reason: round === 1 
      ? 'Opening engagement: Charging to seize arena momentum and stagger target.' 
      : 'Using kinetic speed to slam through defenses.',
  });

  // ==========================================
  // 4. DEFEND / PARRY
  // Reduces incoming damage by 60%, boosts counter-attack window.
  // Favored when low HP, actor is vulnerable, high armor builds, or survivors.
  // ==========================================
  let defendScore = 20;
  defendScore += totalArmor * 1.4;
  if (actorAnatomy.overallHpRatio < 0.4) defendScore += 40;
  if (actorVulnerable) defendScore += 35; // Reset stance
  if (actor.personality === 'survivor') defendScore += 30;
  if (actor.personality === 'tactician') defendScore += 20;

  scores.push({
    action: 'defend',
    score: Math.round(defendScore),
    reason: actorVulnerable 
      ? 'Vulnerable from recoil; raising defensive guard to recover balance.' 
      : actorAnatomy.overallHpRatio < 0.35 
      ? 'Critical anatomical damage; assuming defensive turtle stance.' 
      : 'Bracing against opponent offense.',
  });

  // ==========================================
  // 5. TAUNT
  // Flares the crowd! +20 Crowd Favor, Adrenaline (+15% crit on next hit).
  // Favored by Showman personality, when health is dominant, or crowd favor is low.
  // ==========================================
  let tauntScore = 15;
  if (actor.personality === 'showman') tauntScore += 45;
  if (crowdFavor < 0) tauntScore += 25; // Play to the crowd
  if (actorAnatomy.overallHpRatio > opponentAnatomy.overallHpRatio + 0.3) tauntScore += 25; // Dominating
  if (hasAdrenaline) tauntScore -= 30; // Already hyped
  if (actorAnatomy.overallHpRatio < 0.3) tauntScore -= 40; // Too injured to gloat

  scores.push({
    action: 'taunt',
    score: Math.round(Math.max(0, tauntScore)),
    reason: actor.personality === 'showman'
      ? 'The arena demands a show! Hyping the crowd for bonus adrenaline & purse.'
      : 'Ridiculing the opponent to gain psychological advantage and crowd favor.',
  });

  // ==========================================
  // 6. TAG OUT (Team Bouts Only)
  // Calls a fresh Frame from the bench!
  // Favored when active gladiator is severely injured/crippled and bench has healthy fighters.
  // ==========================================
  if (isTeamBout && availableTeammates.length > 0) {
    const healthyTeammates = availableTeammates.filter(t => {
      const sum = getGladiatorAnatomySummary(t);
      return !sum.isKnockedOut && sum.overallHpRatio > 0.5;
    });

    let tagScore = 0;
    if (actorAnatomy.overallHpRatio < 0.35 && healthyTeammates.length > 0) {
      tagScore += 65 + (0.4 - actorAnatomy.overallHpRatio) * 100;
    }
    if ((actorAnatomy.armEfficiency < 0.3 || actorAnatomy.legEfficiency < 0.3) && healthyTeammates.length > 0) {
      tagScore += 40;
    }
    if (actor.personality === 'tactician' || actor.personality === 'survivor') {
      tagScore += 20;
    }
    if (actor.personality === 'berserker') {
      tagScore -= 30; // Berserkers hate retreating
    }

    scores.push({
      action: 'tag_out',
      score: Math.round(tagScore),
      reason: actorAnatomy.overallHpRatio < 0.35 
        ? 'Severe structural trauma! Tagging out for a fresh combatant.' 
        : 'Rotating squad to maintain frontline pressure.',
    });
  }

  // Sort candidate actions by highest score
  scores.sort((a, b) => b.score - a.score);

  const winningAction = scores[0];

  return {
    chosenAction: winningAction.action,
    allScores: scores,
    reasoning: winningAction.reason,
  };
}
