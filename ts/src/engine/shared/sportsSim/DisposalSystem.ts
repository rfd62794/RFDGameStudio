import { Ball, Player, Vector2D, DisposalRules, SimEvent } from './types';
import { BallSystem } from './BallSystem';

export const HORIZONTAL_INTERCEPT_RANGE = 2.0;  // meters — how far a player's body/arms genuinely extend
export const BASE_REACH_HEIGHT = 2.0;           // meters — standing reach without jumping
export const MAX_JUMP_BONUS = 1.5;              // meters — additional reach at jumpReach = 100

export function effectiveReachHeight(player: Player): number {
  return BASE_REACH_HEIGHT + (player.stats.jumpReach / 100) * MAX_JUMP_BONUS;
}

export class DisposalSystem {
  /**
   * Executes a Kick disposal.
   * Long range, higher flight arc, rewards clean marks.
   */
  public static executeKick(
    carrier: Player,
    targetPos: Vector2D,
    ball: Ball,
    _rules: DisposalRules,
    tick: number
  ): { success: boolean; event: SimEvent } {
    const dx = targetPos.x - carrier.pos.x;
    const dy = targetPos.y - carrier.pos.y;
    const rawDistance = Math.hypot(dx, dy);

    // Skill-based accuracy and distance scaling
    const skillFactor = carrier.stats.kickSkill / 100;
    const maxKickDist = 20 + skillFactor * 35; // 20m - 55m range
    const actualDistance = Math.min(rawDistance, maxKickDist);

    // Angular error inversely proportional to skill
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * (1 - skillFactor) * 0.4;
    const speed = 18 + skillFactor * 10; // 18m/s - 28m/s

    const flightDurationSec = actualDistance / speed;
    const totalHangTimeTicks = Math.max(8, Math.round(flightDurationSec * 20));

    // Release ball
    ball.state = 'in_flight';
    ball.carrierId = null;
    ball.lastCarrierId = carrier.id;
    ball.lastPossessionTeam = carrier.team;
    ball.flightOrigin = { ...carrier.pos };
    ball.flightTarget = {
      x: carrier.pos.x + Math.cos(angle) * actualDistance,
      y: carrier.pos.y + Math.sin(angle) * actualDistance,
    };
    ball.disposalType = 'kick';
    ball.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    // Arc calculation: apex height based on hang time
    ball.height = 1.2;
    ball.zVelocity = 0.5 * 9.81 * flightDurationSec + 2.5; // Upward boost
    ball.totalHangTime = totalHangTimeTicks;
    ball.hangTimeRemaining = totalHangTimeTicks;
    ball.bounceCount = 0;
    ball.looseTicks = 0;

    // Reset carrier metrics
    carrier.distanceCarriedWithoutTouch = 0;
    carrier.statsMatch.kicks++;

    const event: SimEvent = {
      id: `kick-${tick}-${carrier.id}`,
      tick,
      type: 'disposal_kick',
      description: `${carrier.name} launched a ${actualDistance.toFixed(1)}m deep KICK downfield!`,
      team: carrier.team,
      primaryPlayerId: carrier.id,
      pos: { ...carrier.pos },
    };

    return { success: true, event };
  }

  /**
   * Executes a Handball disposal.
   * Short-to-medium range, flat, fast punch off the palm. Low flight arc, minimal intercept window.
   */
  public static executeHandball(
    carrier: Player,
    targetPos: Vector2D,
    ball: Ball,
    _rules: DisposalRules,
    tick: number
  ): { success: boolean; event: SimEvent } {
    const dx = targetPos.x - carrier.pos.x;
    const dy = targetPos.y - carrier.pos.y;
    const rawDistance = Math.hypot(dx, dy);

    const skillFactor = carrier.stats.handballSkill / 100;
    const maxDist = 6 + skillFactor * 12; // 6m - 18m
    const actualDistance = Math.min(rawDistance, maxDist);

    // Tight precision for handball
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * (1 - skillFactor) * 0.15;
    const speed = 14 + skillFactor * 8; // 14m/s - 22m/s

    const flightDurationSec = actualDistance / speed;
    const totalHangTimeTicks = Math.max(4, Math.round(flightDurationSec * 20));

    ball.state = 'in_flight';
    ball.carrierId = null;
    ball.lastCarrierId = carrier.id;
    ball.lastPossessionTeam = carrier.team;
    ball.flightOrigin = { ...carrier.pos };
    ball.flightTarget = {
      x: carrier.pos.x + Math.cos(angle) * actualDistance,
      y: carrier.pos.y + Math.sin(angle) * actualDistance,
    };
    ball.disposalType = 'handball';
    ball.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    ball.height = 1.0;
    ball.zVelocity = 1.0; // Flat direct trajectory
    ball.totalHangTime = totalHangTimeTicks;
    ball.hangTimeRemaining = totalHangTimeTicks;
    ball.bounceCount = 0;
    ball.looseTicks = 0;

    carrier.distanceCarriedWithoutTouch = 0;
    carrier.statsMatch.handballs++;

    const event: SimEvent = {
      id: `handball-${tick}-${carrier.id}`,
      tick,
      type: 'disposal_handball',
      description: `${carrier.name} punched a rapid HANDBALL (${actualDistance.toFixed(1)}m) to teammate!`,
      team: carrier.team,
      primaryPlayerId: carrier.id,
      pos: { ...carrier.pos },
    };

    return { success: true, event };
  }

  /**
   * Executes a Touch / Bounce action while running.
   * AFL 15m anti-camping compliance: Carrier briefly slows to touch the ball to turf, resetting carry distance.
   */
  public static executeTouchBounce(
    carrier: Player,
    _ball: Ball,
    tick: number
  ): { success: boolean; event: SimEvent } {
    carrier.distanceCarriedWithoutTouch = 0;
    carrier.velocity.x *= 0.7; // slight momentary speed cost
    carrier.velocity.y *= 0.7;

    const event: SimEvent = {
      id: `touch-${tick}-${carrier.id}`,
      tick,
      type: 'touch_bounce',
      description: `${carrier.name} touched the ball to ground (Anti-Camping Bounce executed).`,
      team: carrier.team,
      primaryPlayerId: carrier.id,
      pos: { ...carrier.pos },
    };

    return { success: true, event };
  }

  /**
   * Fix 3: Real In-Flight Interception & Mark Contest Evaluation.
   * Runs every tick the ball is 'in_flight'.
   * Every active player (attacker or defender) within HORIZONTAL_INTERCEPT_RANGE (2.0m)
   * can contest if the ball's current height is <= player's effectiveReachHeight().
   */
  public static evaluateInFlightContests(
    ball: Ball,
    players: Map<string, Player> | Player[],
    rules: DisposalRules,
    tick: number
  ): { securedBy: Player | null; event?: SimEvent } {
    if (ball.state !== 'in_flight') {
      return { securedBy: null };
    }

    const playerList = Array.isArray(players) ? players : Array.from(players.values());

    interface ContestCandidate {
      player: Player;
      isDefender: boolean;
      dist2D: number;
      reachHeight: number;
      contestScore: number;
      netAdvantage: number;
    }

    const eligibleCandidates: ContestCandidate[] = [];

    for (const player of playerList) {
      if (player.injuryState !== 'none') continue; // Downed or casualty players cannot jump

      // Horizontal 2D proximity check
      const dist2D = Math.hypot(player.pos.x - ball.pos.x, player.pos.y - ball.pos.y);
      if (dist2D > HORIZONTAL_INTERCEPT_RANGE) continue;

      // Vertical 3D Reach Gate (Crucial: ball height must not exceed player's effective jump reach)
      const reachHeight = effectiveReachHeight(player);
      if (ball.height > reachHeight) {
        continue; // Ball is physically too high for this player to reach
      }

      const isDefender = player.team !== ball.lastPossessionTeam;

      if (isDefender) {
        // Defender aerial interception contest roll
        const interceptSkill = (player.stats.jumpReach * 0.5) + (player.stats.markingSkill * 0.5) + (Math.random() * 25);
        const flightResistance = 40 + (ball.height * 5) + (Math.hypot(ball.velocity.x, ball.velocity.y) * 0.6) + (Math.random() * 25);
        const netAdvantage = interceptSkill - flightResistance;

        eligibleCandidates.push({
          player,
          isDefender: true,
          dist2D,
          reachHeight,
          contestScore: interceptSkill,
          netAdvantage,
        });
      } else {
        // Teammate receiver clean mark / reception roll
        const receiverSkill = (player.stats.markingSkill * 0.7) + (player.stats.jumpReach * 0.3) + (Math.random() * 25);
        const flightResistance = 35 + (ball.height * 4) + (Math.random() * 20);
        const netAdvantage = receiverSkill - flightResistance;

        eligibleCandidates.push({
          player,
          isDefender: false,
          dist2D,
          reachHeight,
          contestScore: receiverSkill,
          netAdvantage,
        });
      }
    }

    if (eligibleCandidates.length === 0) {
      return { securedBy: null };
    }

    // Rank candidates by highest net advantage
    eligibleCandidates.sort((a, b) => b.netAdvantage - a.netAdvantage);
    const top = eligibleCandidates[0];

    // Must achieve positive net advantage to secure the ball out of mid-air
    if (top.netAdvantage < 0) {
      // Failed contest: ball continues its trajectory undisturbed
      return { securedBy: null };
    }

    const winner = top.player;

    // Secure the in-flight ball
    ball.state = 'held';
    ball.carrierId = winner.id;
    ball.lastCarrierId = winner.id;
    ball.lastPossessionTeam = winner.team;
    ball.velocity = { x: 0, y: 0 };
    ball.height = 1.0;
    ball.hangTimeRemaining = 0;
    ball.looseTicks = 0;

    winner.distanceCarriedWithoutTouch = 0;
    winner.tackledTicks = 0;
    winner.tackledByPlayerId = null;

    if (top.isDefender) {
      // Interception turnover
      winner.statsMatch.marks++;
      winner.statsMatch.turnoversConceded = Math.max(0, winner.statsMatch.turnoversConceded);

      const event: SimEvent = {
        id: `intercept-${tick}-${winner.id}`,
        tick,
        type: 'interception_taken',
        description: `INTERCEPTION! ${winner.name} (#${winner.number}, ${winner.team.toUpperCase()}) leaped (${top.reachHeight.toFixed(2)}m reach) and SNATCHED the in-flight ball out of the air at ${ball.height.toFixed(1)}m! TURNOVER!`,
        team: winner.team,
        primaryPlayerId: winner.id,
        pos: { ...ball.pos },
        isTurnover: true,
      };

      return { securedBy: winner, event };
    } else {
      // Teammate reception / Mark
      winner.statsMatch.marks++;

      let isProtectedMark = false;
      if (ball.disposalType === 'kick' && ball.flightOrigin) {
        const kickDist = Math.hypot(winner.pos.x - ball.flightOrigin.x, winner.pos.y - ball.flightOrigin.y);
        if (kickDist >= rules.minKickDistanceForMark) {
          winner.markProtectionTicks = rules.markProtectionDurationTicks;
          isProtectedMark = true;
        }
      }

      const event: SimEvent = {
        id: `mark-${tick}-${winner.id}`,
        tick,
        type: 'mark_taken',
        description: isProtectedMark
          ? `CLEAN MARK! ${winner.name} secured the in-flight kick at ${ball.height.toFixed(1)}m (${top.reachHeight.toFixed(2)}m reach)! Protected tempo granted.`
          : `CLEAN RECEPTION! ${winner.name} hauled in the pass out of the air at ${ball.height.toFixed(1)}m!`,
        team: winner.team,
        primaryPlayerId: winner.id,
        pos: { ...ball.pos },
      };

      return { securedBy: winner, event };
    }
  }

  /**
   * Helper evaluation for single player mark test.
   */
  public static evaluateMark(
    ball: Ball,
    player: Player,
    rules: DisposalRules,
    tick: number
  ): { isMark: boolean; event?: SimEvent } {
    const result = this.evaluateInFlightContests(ball, [player], rules, tick);
    return { isMark: !!result.securedBy, event: result.event };
  }

  /**
   * Enforces the AFL 15m anti-camping rule and "Holding the Ball" turnover rules.
   */
  public static evaluateTurnoverRules(
    carrier: Player,
    ball: Ball,
    rules: DisposalRules,
    tick: number
  ): { turnover: boolean; reason?: 'anti_camping' | 'holding_the_ball'; event?: SimEvent } {
    // 1. Anti-Camping Check: Carrier ran > maxCarryDistanceWithoutTouch without bounce
    if (carrier.distanceCarriedWithoutTouch >= rules.maxCarryDistanceWithoutTouch) {
      // Penalty: Turnover! Ball drops loose at carrier's position
      BallSystem.looseBall(ball, carrier, {
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3,
      });

      carrier.statsMatch.turnoversConceded++;
      carrier.distanceCarriedWithoutTouch = 0;

      const event: SimEvent = {
        id: `turnover-camping-${tick}-${carrier.id}`,
        tick,
        type: 'anti_camping_turnover',
        description: `ANTI-CAMPING PENALTY! ${carrier.name} ran ${rules.maxCarryDistanceWithoutTouch}m without bouncing! Turnover conceded.`,
        team: carrier.team,
        primaryPlayerId: carrier.id,
        pos: { ...carrier.pos },
        isTurnover: true,
      };

      return { turnover: true, reason: 'anti_camping', event };
    }

    // 2. Holding the Ball Check: Tackled for too long without disposal
    if (carrier.tackledTicks >= rules.maxTackleHoldTicks) {
      BallSystem.looseBall(ball, carrier, {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
      });

      carrier.statsMatch.turnoversConceded++;
      carrier.tackledTicks = 0;
      const tacklerId = carrier.tackledByPlayerId;

      const event: SimEvent = {
        id: `turnover-holding-${tick}-${carrier.id}`,
        tick,
        type: 'holding_the_ball_turnover',
        description: `HOLDING THE BALL! ${carrier.name} failed to dispose under tackle pressure! Turnover!`,
        team: carrier.team,
        primaryPlayerId: carrier.id,
        secondaryPlayerId: tacklerId || undefined,
        pos: { ...carrier.pos },
        isTurnover: true,
      };

      return { turnover: true, reason: 'holding_the_ball', event };
    }

    return { turnover: false };
  }
}
