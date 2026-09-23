import { Ball, Player, Vector2D, CourtConfig, SimEvent } from './types';

export class BallSystem {
  /**
   * Initializes a ball at a given position or court center.
   */
  public static createBall(court: CourtConfig, initialPos?: Vector2D): Ball {
    return {
      pos: initialPos ? { ...initialPos } : { x: court.width / 2, y: court.height / 2 },
      velocity: { x: 0, y: 0 },
      height: 0,
      zVelocity: 0,
      state: 'loose',
      carrierId: null,
      lastCarrierId: null,
      lastPossessionTeam: null,
      hangTimeRemaining: 0,
      totalHangTime: 0,
      bounceCount: 0,
      looseTicks: 0,
    };
  }

  /**
   * Updates ball position, physics, flight arc, wall collisions, and ground friction.
   */
  public static updateBallPhysics(
    ball: Ball,
    court: CourtConfig,
    activePlayers: Map<string, Player>,
    dt: number = 0.05
  ): { wallBounce: boolean; groundLanding: boolean } {
    let wallBounce = false;
    let groundLanding = false;

    if (ball.state === 'held') {
      const carrier = ball.carrierId ? activePlayers.get(ball.carrierId) : null;
      if (carrier && carrier.injuryState === 'none') {
        // Ball position tracks carrier exactly
        ball.pos.x = carrier.pos.x;
        ball.pos.y = carrier.pos.y;
        ball.velocity.x = carrier.velocity.x;
        ball.velocity.y = carrier.velocity.y;
        ball.height = 1.0; // carried at chest height
        ball.zVelocity = 0;
        ball.looseTicks = 0;
      } else {
        // Defensive check: if carrier became incapacitated or missing, transition to loose immediately!
        this.looseBall(ball, null, { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 });
      }
      return { wallBounce: false, groundLanding: false };
    }

    if (ball.state === 'in_flight') {
      // Advance coordinates along velocity vector
      ball.pos.x += ball.velocity.x * dt;
      ball.pos.y += ball.velocity.y * dt;

      // Vertical arc physics
      ball.height += ball.zVelocity * dt;
      ball.zVelocity -= 9.81 * dt; // Gravity
      ball.hangTimeRemaining = Math.max(0, ball.hangTimeRemaining - 1);

      // Check for ground impact / landing
      if (ball.height <= 0) {
        ball.height = 0;
        ball.zVelocity = 0;
        ball.state = 'loose';
        ball.velocity.x *= 0.65; // Speed loss on first ground bounce
        ball.velocity.y *= 0.65;
        ball.bounceCount++;
        groundLanding = true;
      }
    } else if (ball.state === 'loose') {
      ball.looseTicks++;
      // Ground slide / rolling with friction
      ball.pos.x += ball.velocity.x * dt;
      ball.pos.y += ball.velocity.y * dt;

      // Apply ground friction
      ball.velocity.x *= court.groundFriction;
      ball.velocity.y *= court.groundFriction;

      // Stop jitter
      if (Math.hypot(ball.velocity.x, ball.velocity.y) < 0.08) {
        ball.velocity.x = 0;
        ball.velocity.y = 0;
      }
    }

    // Boundary bounce constraints (Arena walls or boundaries)
    const margin = 0.5;
    if (ball.pos.x < margin) {
      ball.pos.x = margin;
      ball.velocity.x = -ball.velocity.x * court.wallBounceFriction;
      wallBounce = true;
    } else if (ball.pos.x > court.width - margin) {
      ball.pos.x = court.width - margin;
      ball.velocity.x = -ball.velocity.x * court.wallBounceFriction;
      wallBounce = true;
    }

    if (ball.pos.y < margin) {
      ball.pos.y = margin;
      ball.velocity.y = -ball.velocity.y * court.wallBounceFriction;
      wallBounce = true;
    } else if (ball.pos.y > court.height - margin) {
      ball.pos.y = court.height - margin;
      ball.velocity.y = -ball.velocity.y * court.wallBounceFriction;
      wallBounce = true;
    }

    return { wallBounce, groundLanding };
  }

  /**
   * CRITICAL ARCHITECTURAL REQUIREMENT:
   * Transitions ball to 'loose' at the carrier's real position with physical scatter.
   * NEVER requires an explicit successor carrier to be designated.
   */
  public static looseBall(
    ball: Ball,
    carrier: Player | null,
    scatterVelocity?: Vector2D
  ): void {
    if (carrier) {
      ball.pos = { x: carrier.pos.x, y: carrier.pos.y };
      ball.lastCarrierId = carrier.id;
      ball.lastPossessionTeam = carrier.team;
    }
    ball.state = 'loose';
    ball.carrierId = null;
    ball.height = 0.2;
    ball.hangTimeRemaining = 0;
    ball.bounceCount = 0;
    ball.looseTicks = 0;

    if (scatterVelocity) {
      ball.velocity = { ...scatterVelocity };
    } else {
      // Default organic scatter in random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.0;
      ball.velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      };
    }
  }

  /**
   * Proximity-based continuous ball pickup evaluation.
   * Every active, non-downed player within pickupRadius can contest.
   */
  public static evaluateContinuousPickup(
    ball: Ball,
    court: CourtConfig,
    activePlayers: Player[],
    tick: number
  ): { pickedUpBy: Player | null; event?: SimEvent } {
    // Only loose balls or low-flying balls (height <= 1.5m) can be picked up from ground/air contest
    if (ball.state !== 'loose' && (ball.state !== 'in_flight' || ball.height > 1.5)) {
      return { pickedUpBy: null };
    }

    const eligibleContenders: { player: Player; dist: number; score: number }[] = [];

    for (const player of activePlayers) {
      if (player.injuryState !== 'none') continue; // Downed/stunned/casualty cannot pickup

      const dist = Math.hypot(player.pos.x - ball.pos.x, player.pos.y - ball.pos.y);
      if (dist <= court.pickupRadius) {
        // Pickup roll combining agility, speed, and proximity
        const baseSkill = (player.stats.speed * 4) + (player.stats.handballSkill * 0.4) + (player.stats.strength * 0.2);
        const distancePenalty = (1 - (dist / court.pickupRadius)) * 30; // Closer = higher chance
        const roll = Math.random() * 20;
        const totalScore = baseSkill + distancePenalty + roll;

        eligibleContenders.push({ player, dist, score: totalScore });
      }
    }

    if (eligibleContenders.length === 0) {
      return { pickedUpBy: null };
    }

    // Sort by contested score descending
    eligibleContenders.sort((a, b) => b.score - a.score);
    const winner = eligibleContenders[0].player;

    // Secure the ball
    ball.state = 'held';
    ball.carrierId = winner.id;
    ball.lastCarrierId = winner.id;
    ball.lastPossessionTeam = winner.team;
    ball.velocity = { x: 0, y: 0 };
    ball.height = 1.0;
    ball.hangTimeRemaining = 0;
    ball.looseTicks = 0;

    // Reset carrier dynamic counters
    winner.distanceCarriedWithoutTouch = 0;
    winner.tackledTicks = 0;
    winner.tackledByPlayerId = null;

    const event: SimEvent = {
      id: `pickup-${tick}-${winner.id}`,
      tick,
      type: 'ball_pickup',
      description: `${winner.name} (#${winner.number}, ${winner.team.toUpperCase()}) secured the loose ball!`,
      team: winner.team,
      primaryPlayerId: winner.id,
      pos: { ...ball.pos },
    };

    return { pickedUpBy: winner, event };
  }
}
