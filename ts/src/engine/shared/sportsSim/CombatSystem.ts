import { Player, Ball, CombatRules, SimEvent, InjurySeverity, Vector2D } from './types';
import { BallSystem } from './BallSystem';

export interface CombatResult {
  outcome: 'hit_success' | 'armor_held' | 'attacker_blunder';
  severity: InjurySeverity;
  attackerSufferedStun: boolean;
  isTurnover: boolean;
  events: SimEvent[];
}

export class CombatSystem {
  /**
   * Executes a direct physical / cyber combat action (Block, Tackle, Hit).
   * Supports "play the man" regardless of whether the target holds the ball.
   */
  public static executeAttack(
    attacker: Player,
    target: Player,
    ball: Ball,
    rules: CombatRules,
    tick: number
  ): CombatResult {
    const events: SimEvent[] = [];

    // Check if target is protected by a Mark
    if (target.markProtectionTicks > 0) {
      return {
        outcome: 'armor_held',
        severity: 'none',
        attackerSufferedStun: false,
        isTurnover: false,
        events: [],
      };
    }

    attacker.statsMatch.hitsInflicted++;

    // 1. Attack power vs Target Resistance
    const attackPower = (attacker.stats.strength * 0.7) + (attacker.stats.aggression * 0.3) + (Math.random() * 30);
    const targetDefense = (target.stats.toughness * 0.4) + (target.stats.cyberArmor * 0.4) + (target.stamina * 0.2) + (Math.random() * 30);

    const netAdvantage = attackPower - targetDefense;

    // --- CASE A: Attacker Blunder (Blood Bowl failed violence rule) ---
    // If netAdvantage is severely negative (< -20) or a critical roll fails:
    if (netAdvantage < -18 && rules.failedAttackPenalty.causesTurnover) {
      // Counter-reversal! Attacker is stunned or knocked down
      attacker.injuryState = 'stunned';
      attacker.stunTicksRemaining = 40; // 2.0s
      attacker.velocity = { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 3 };

      // If attacker had the ball (e.g. trying to bulldoze), ball drops loose
      if (ball.carrierId === attacker.id) {
        BallSystem.looseBall(ball, attacker);
      }

      attacker.statsMatch.turnoversConceded++;

      const blunderEvent: SimEvent = {
        id: `blunder-${tick}-${attacker.id}`,
        tick,
        type: 'failed_violence_turnover',
        description: `FAILED ATTACK! ${attacker.name} blundered hit on ${target.name} and suffered a counter-stun! TURNOVER conceded.`,
        team: attacker.team,
        primaryPlayerId: attacker.id,
        secondaryPlayerId: target.id,
        pos: { ...attacker.pos },
        isTurnover: true,
      };
      events.push(blunderEvent);

      return {
        outcome: 'attacker_blunder',
        severity: 'none',
        attackerSufferedStun: true,
        isTurnover: true,
        events,
      };
    }

    // --- CASE B: Armor Holds (Knocked off balance but no structural injury) ---
    if (netAdvantage <= 8) {
      // Shoved/tackled off balance, stamina drain
      target.stamina = Math.max(0, target.stamina - 15);
      
      const soakEvent: SimEvent = {
        id: `soak-${tick}-${target.id}`,
        tick,
        type: 'combat_strike',
        description: `${attacker.name} struck ${target.name}, but armor plating held! (${target.stats.organicRatio > 0.5 ? 'Organic resilience' : 'Cybernetic chassis'} absorbed impact).`,
        team: attacker.team,
        primaryPlayerId: attacker.id,
        secondaryPlayerId: target.id,
        pos: { ...target.pos },
      };
      events.push(soakEvent);

      return {
        outcome: 'armor_held',
        severity: 'none',
        attackerSufferedStun: false,
        isTurnover: false,
        events,
      };
    }

    // --- CASE C: Armor Broken -> 4-Tier Severity Ladder Roll ---
    const injuryRoll = Math.random();
    const table = rules.severityTable;
    let severity: InjurySeverity = 'stunned';

    // Calculate thresholds from cumulative odds
    const cumStun = table.stunnedChance;
    const cumDown = cumStun + table.downChance;
    const cumCasualty = cumDown + table.casualtyChance;

    if (injuryRoll < cumStun) {
      severity = 'stunned';
      target.injuryState = 'stunned';
      target.stunTicksRemaining = 50; // 2.5s recovery
    } else if (injuryRoll < cumDown) {
      severity = 'down';
      target.injuryState = 'down';
      target.stunTicksRemaining = 120; // 6s recovery or next drive
    } else if (injuryRoll < cumCasualty) {
      severity = 'casualty';
      target.injuryState = 'casualty'; // REMOVED for remainder of match!
      target.stunTicksRemaining = 999999;
      attacker.statsMatch.casualtiesCaused++;
    } else {
      severity = 'fatal';
      target.injuryState = 'fatal'; // LETHAL annihilation
      target.stunTicksRemaining = 999999;
      attacker.statsMatch.casualtiesCaused++;
    }

    attacker.statsMatch.injuriesInflicted++;

    // CRITICAL STRUCTURAL GUARANTEE:
    // If the victim held the ball, ball becomes immediately loose at their exact spot.
    // Zero discrete recipient search that can fail!
    if (ball.carrierId === target.id) {
      const scatterVel: Vector2D = {
        x: (target.pos.x - attacker.pos.x) * 0.8 + (Math.random() - 0.5) * 4,
        y: (target.pos.y - attacker.pos.y) * 0.8 + (Math.random() - 0.5) * 4,
      };
      BallSystem.looseBall(ball, target, scatterVel);

      const looseEvent: SimEvent = {
        id: `loose-${tick}-${target.id}`,
        tick,
        type: 'ball_loose',
        description: `Ball spilled loose onto the turf as ${target.name} collapsed! Continuous pickup contest active.`,
        pos: { ...ball.pos },
      };
      events.push(looseEvent);
    }

    // Push descriptive narrative event for the specific tier
    let eventType: SimEvent['type'] = 'combat_strike';
    let desc = '';

    const organicDesc = target.stats.organicRatio > 0.6 
      ? 'flesh trauma & bleeding' 
      : (target.stats.organicRatio < 0.4 ? 'chassis rupture & hydraulic oil leak' : 'cyber-organic joint failure');

    switch (severity) {
      case 'stunned':
        eventType = 'combat_stun';
        desc = `💥 STUNNED! ${attacker.name} slammed ${target.name} with crushing force! (${organicDesc}). Recovers shortly.`;
        break;
      case 'down':
        eventType = 'combat_knockdown';
        desc = `⚡ KNOCKED DOWN! ${attacker.name} laid out ${target.name} cold! (${organicDesc}). Out of the play.`;
        break;
      case 'casualty':
        eventType = 'combat_casualty';
        desc = `🚨 CASUALTY! ${attacker.name} inflicted catastrophic damage on ${target.name}! (${organicDesc}). REMOVED FOR REMAINDER OF MATCH!`;
        break;
      case 'fatal':
        eventType = 'combat_fatal';
        desc = `☠️ FATAL CRUSH! ${attacker.name} completely destroyed ${target.name}! Critical destruction. Permanently eliminated!`;
        break;
    }

    const combatEvent: SimEvent = {
      id: `combat-${tick}-${attacker.id}-${target.id}`,
      tick,
      type: eventType,
      description: desc,
      team: attacker.team,
      primaryPlayerId: attacker.id,
      secondaryPlayerId: target.id,
      pos: { ...target.pos },
      severity,
    };
    events.push(combatEvent);

    return {
      outcome: 'hit_success',
      severity,
      attackerSufferedStun: false,
      isTurnover: false,
      events,
    };
  }

  /**
   * Evaluates natural recovery ticks for downed/stunned players.
   */
  public static updatePlayerRecovery(player: Player, tick: number): SimEvent | null {
    if (player.injuryState === 'none') return null;
    if (player.injuryState === 'casualty' || player.injuryState === 'fatal') {
      // Permanent for the match
      return null;
    }

    player.stunTicksRemaining--;

    if (player.stunTicksRemaining <= 0) {
      const prevState = player.injuryState;
      player.injuryState = 'none';
      player.stunTicksRemaining = 0;
      player.stamina = 50; // Returns with half stamina

      return {
        id: `recover-${tick}-${player.id}`,
        tick,
        type: 'combat_strike',
        description: `🛡️ ${player.name} (#${player.number}) recovered from ${prevState} state and stood back up!`,
        team: player.team,
        primaryPlayerId: player.id,
        pos: { ...player.pos },
      };
    }

    return null;
  }
}
