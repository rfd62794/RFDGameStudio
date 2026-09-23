import {
  SportEngineConfig,
  Ball,
  Player,
  SimEvent,
  TeamState,
  TeamSide,
  Vector2D,
  PlayerRole,
} from './types';
import { MBB_ARENA_CONFIG, DEFAULT_PLAYER_ARCHETYPES } from './constants';
import { BallSystem } from './BallSystem';
import { DisposalSystem } from './DisposalSystem';
import { CombatSystem } from './CombatSystem';
import { UniversalDecisionSystem, GameStateContext } from './UniversalDecisionSystem';

export class GameEngine {
  public config: SportEngineConfig;
  public ball: Ball;
  public players: Map<string, Player> = new Map();
  public teamA: TeamState;
  public teamB: TeamState;
  public currentTick: number = 0;
  public isRunning: boolean = false;
  public events: SimEvent[] = [];
  public maxEventsLog: number = 200;

  constructor(customConfig?: Partial<SportEngineConfig>) {
    this.config = { ...MBB_ARENA_CONFIG, ...customConfig };
    this.ball = BallSystem.createBall(this.config.court);
    
    this.teamA = {
      id: 'teamA',
      name: 'Cyber Skulls',
      color: '#3b82f6', // Bright tactical blue
      accentColor: '#60a5fa',
      score: 0,
      goals: 0,
      behinds: 0,
      activeCasualties: 0,
      totalInjuriesInflicted: 0,
    };

    this.teamB = {
      id: 'teamB',
      name: 'Mutant Marauders',
      color: '#ef4444', // Aggressive crimson
      accentColor: '#f87171',
      score: 0,
      goals: 0,
      behinds: 0,
      activeCasualties: 0,
      totalInjuriesInflicted: 0,
    };

    this.initDefaultRoster();
  }

  /**
   * Initializes standard 5v5 or 6v6 squad for both teams based on court size.
   */
  public initDefaultRoster(): void {
    this.players.clear();
    this.currentTick = 0;
    this.events = [];
    this.ball = BallSystem.createBall(this.config.court);

    const w = this.config.court.width;
    const h = this.config.court.height;

    // Team A (Attacking Right -> Goal is at x = w)
    const teamARoles: { name: string; num: number; role: PlayerRole; pos: Vector2D }[] = [
      { name: 'Vex-01', num: 7, role: 'carrier', pos: { x: w * 0.35, y: h * 0.5 } },
      { name: 'Gorgon', num: 99, role: 'enforcer', pos: { x: w * 0.40, y: h * 0.25 } },
      { name: 'Circuit', num: 11, role: 'receiver', pos: { x: w * 0.60, y: h * 0.3 } },
      { name: 'Pulse', num: 23, role: 'chaser', pos: { x: w * 0.55, y: h * 0.7 } },
      { name: 'Titan-X', num: 55, role: 'ruckman', pos: { x: w * 0.45, y: h * 0.5 } },
      { name: 'Aegis', num: 3, role: 'sweeper', pos: { x: w * 0.20, y: h * 0.5 } },
    ];

    // Team B (Attacking Left -> Goal is at x = 0)
    const teamBRoles: { name: string; num: number; role: PlayerRole; pos: Vector2D }[] = [
      { name: 'Slag-Jaw', num: 10, role: 'carrier', pos: { x: w * 0.65, y: h * 0.5 } },
      { name: 'Bone-Crusher', num: 88, role: 'enforcer', pos: { x: w * 0.60, y: h * 0.75 } },
      { name: 'Acid-Spit', num: 14, role: 'receiver', pos: { x: w * 0.40, y: h * 0.7 } },
      { name: 'Raptor', num: 2, role: 'chaser', pos: { x: w * 0.45, y: h * 0.3 } },
      { name: 'Goliath', num: 77, role: 'ruckman', pos: { x: w * 0.55, y: h * 0.5 } },
      { name: 'Dread-Guard', num: 4, role: 'sweeper', pos: { x: w * 0.80, y: h * 0.5 } },
    ];

    teamARoles.forEach(r => this.addPlayer('teamA', r.name, r.num, r.role, r.pos));
    teamBRoles.forEach(r => this.addPlayer('teamB', r.name, r.num, r.role, r.pos));

    this.addEvent({
      id: `match-start-${Date.now()}`,
      tick: 0,
      type: 'match_start',
      description: `MATCH COMMENCED: ${this.config.sportName} on ${this.config.court.name}. Ball dropped at center circle!`,
      pos: { ...this.ball.pos },
    });
  }

  public addPlayer(
    team: TeamSide,
    name: string,
    number: number,
    role: PlayerRole,
    pos: Vector2D,
    customStats?: Partial<Player['stats']>
  ): Player {
    const baseStats = DEFAULT_PLAYER_ARCHETYPES[role];
    const player: Player = {
      id: `${team}_${number}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name,
      number,
      team,
      pos: { ...pos },
      velocity: { x: 0, y: 0 },
      targetPos: null,
      role,
      stats: { ...baseStats, ...customStats },
      stamina: 100,
      injuryState: 'none',
      stunTicksRemaining: 0,
      markProtectionTicks: 0,
      distanceCarriedWithoutTouch: 0,
      tackledTicks: 0,
      tackledByPlayerId: null,
      markedOpponentId: null,
      statsMatch: {
        kicks: 0,
        handballs: 0,
        marks: 0,
        tackles: 0,
        hitsInflicted: 0,
        injuriesInflicted: 0,
        casualtiesCaused: 0,
        turnoversConceded: 0,
        goals: 0,
        distanceRun: 0,
      },
    };

    this.players.set(player.id, player);
    return player;
  }

  public addEvent(event: SimEvent): void {
    this.events.unshift(event);
    if (this.events.length > this.maxEventsLog) {
      this.events.pop();
    }
  }

  /**
   * Core simulation tick loop.
   */
  public step(): void {
    this.currentTick++;
    const dt = 1 / this.config.ticksPerSecond;
    const court = this.config.court;

    // 1. Process Natural Player Recovery & Tick timers
    for (const player of this.players.values()) {
      if (player.markProtectionTicks > 0) {
        player.markProtectionTicks--;
      }

      if (player.injuryState !== 'none') {
        const recoveryEvent = CombatSystem.updatePlayerRecovery(player, this.currentTick);
        if (recoveryEvent) this.addEvent(recoveryEvent);
      }
    }

    // 2. Update Ball Physics (Flight arc, ground friction, wall bounces)
    const physicsResult = BallSystem.updateBallPhysics(
      this.ball,
      court,
      this.players,
      dt
    );

    if (physicsResult.groundLanding) {
      this.addEvent({
        id: `landing-${this.currentTick}`,
        tick: this.currentTick,
        type: 'ball_bounced',
        description: `Ball bounced on the ground and is now loose at (${this.ball.pos.x.toFixed(1)}, ${this.ball.pos.y.toFixed(1)})!`,
        pos: { ...this.ball.pos },
      });
    }

    // 3. Fix 3: Real In-Flight Aerial Contests (Interceptions & Clean Marks with jumpReach gate)
    if (this.ball.state === 'in_flight') {
      const contestResult = DisposalSystem.evaluateInFlightContests(
        this.ball,
        this.players,
        this.config.disposal,
        this.currentTick
      );
      if (contestResult.securedBy && contestResult.event) {
        this.addEvent(contestResult.event);
      }
    }

    // 4. Continuous Ground/Loose Ball Pickup Evaluation
    if (this.ball.state === 'loose') {
      const activeList = Array.from(this.players.values()).filter(p => p.injuryState === 'none');
      const pickupResult = BallSystem.evaluateContinuousPickup(
        this.ball,
        court,
        activeList,
        this.currentTick
      );
      if (pickupResult.pickedUpBy && pickupResult.event) {
        this.addEvent(pickupResult.event);
      }
    }

    // 5. Update AI Agent Behaviors, Movement, Combat, and Disposal
    this.updateAILogic(dt);

    // 6. Check Anti-Camping (AFL 15m) & Holding the Ball Turnover rules for active carrier
    if (this.ball.state === 'held' && this.ball.carrierId) {
      const carrier = this.players.get(this.ball.carrierId);
      if (carrier && carrier.injuryState === 'none') {
        const turnoverCheck = DisposalSystem.evaluateTurnoverRules(
          carrier,
          this.ball,
          this.config.disposal,
          this.currentTick
        );
        if (turnoverCheck.turnover && turnoverCheck.event) {
          this.addEvent(turnoverCheck.event);
        }
      }
    }

    // 7. Check Goals & Score Boundaries
    this.evaluateGoalScoring();

    // 8. Update Casualties Count
    let teamACasualties = 0;
    let teamBCasualties = 0;
    for (const p of this.players.values()) {
      if (p.team === 'teamA' && (p.injuryState === 'casualty' || p.injuryState === 'fatal')) {
        teamACasualties++;
      } else if (p.team === 'teamB' && (p.injuryState === 'casualty' || p.injuryState === 'fatal')) {
        teamBCasualties++;
      }
    }
    this.teamA.activeCasualties = teamACasualties;
    this.teamB.activeCasualties = teamBCasualties;
  }

  /**
   * Universal Agent Decision System:
   * Every player, every tick, evaluates candidate positions through the same scoring mechanism.
   * Role and situation determine the scoring weights passed in — never changing which code path runs.
   */
  private updateAILogic(dt: number): void {
    const court = this.config.court;
    const carrier = this.ball.carrierId ? (this.players.get(this.ball.carrierId) ?? null) : null;

    // 1. Update 1-to-1 Man-Mark Assignments dynamically on defensive turns
    UniversalDecisionSystem.updateManMarkAssignments(this.players, carrier, court);

    // 2. Prepare universal game state context
    const gameState: GameStateContext = {
      ball: this.ball,
      players: this.players,
      court: this.config.court,
      carrier,
      currentTick: this.currentTick,
    };

    // 3. Universal Utility Evaluation for every active player
    for (const player of this.players.values()) {
      // Inactive / downed / casualty players cannot act
      if (player.injuryState !== 'none') {
        player.velocity = { x: 0, y: 0 };
        continue;
      }

      const isCarrier = carrier?.id === player.id;
      const goalX = player.team === 'teamA' ? court.width : 0;
      const goalY = court.height / 2;

      // Evaluate positioning via the Universal Decision System
      const decision = UniversalDecisionSystem.evaluateBestPosition(player, gameState);
      player.targetPos = decision.bestPos;
      player.currentWeights = decision.weights;
      player.currentBreakdown = decision.bestCandidate.breakdown;
      player.candidateEvaluations = decision.allEvaluated;

      // --- CARRIER-SPECIFIC ACTION RESOLUTION (Disposal, Goals, Bounces) ---
      if (isCarrier) {
        // If in mark protection, pause movement to survey open downfield targets
        if (player.markProtectionTicks > 0) {
          player.velocity = { x: 0, y: 0 };
          const openTeammate = this.findBestDisposalTarget(player, gameState);
          if (openTeammate && Math.random() < 0.25) {
            const kickRes = DisposalSystem.executeKick(
              player,
              openTeammate.pos,
              this.ball,
              this.config.disposal,
              this.currentTick
            );
            this.addEvent(kickRes.event);
            continue;
          }
        }

        // Distance to attacking goal line
        const distToGoal = Math.hypot(goalX - player.pos.x, goalY - player.pos.y);

        // Goal Shot opportunity
        if (distToGoal < 32 && Math.random() < 0.15) {
          const goalShotTarget: Vector2D = { x: goalX, y: goalY + (Math.random() - 0.5) * 6 };
          const kickRes = DisposalSystem.executeKick(
            player,
            goalShotTarget,
            this.ball,
            this.config.disposal,
            this.currentTick
          );
          this.addEvent(kickRes.event);
          continue;
        }

        // Check if under heavy tackle pressure -> Quick Handball or Kick release to open teammate
        const nearbyEnemies = this.getOpponentsWithinRadius(player, 3.5);
        if (nearbyEnemies.length > 0) {
          player.tackledTicks++;
          player.tackledByPlayerId = nearbyEnemies[0].id;

          // Attempt disposal under pressure
          if (Math.random() < 0.45) {
            const teammate = this.findBestDisposalTarget(player, gameState);
            if (teammate) {
              const distToMate = Math.hypot(teammate.pos.x - player.pos.x, teammate.pos.y - player.pos.y);
              if (distToMate <= 14 && this.config.disposal.allowedMethods.handball) {
                const hbRes = DisposalSystem.executeHandball(
                  player,
                  teammate.pos,
                  this.ball,
                  this.config.disposal,
                  this.currentTick
                );
                this.addEvent(hbRes.event);
                continue;
              } else if (this.config.disposal.allowedMethods.kick) {
                const kickRes = DisposalSystem.executeKick(
                  player,
                  teammate.pos,
                  this.ball,
                  this.config.disposal,
                  this.currentTick
                );
                this.addEvent(kickRes.event);
                continue;
              }
            }
          }
        } else {
          player.tackledTicks = Math.max(0, player.tackledTicks - 1);
          player.tackledByPlayerId = null;
        }

        // Anti-Camping (AFL 15m rule) compliance: Perform touch/bounce if close to limit
        if (
          this.config.disposal.allowedMethods.touchBounce &&
          player.distanceCarriedWithoutTouch >= this.config.disposal.maxCarryDistanceWithoutTouch * 0.75
        ) {
          const bounceRes = DisposalSystem.executeTouchBounce(player, this.ball, this.currentTick);
          this.addEvent(bounceRes.event);
        }
      }

      // --- COMBAT & VIOLENCE EVALUATION (Enforcers & Tacklers) ---
      if (this.config.combat.violenceAllowed && player.markProtectionTicks <= 0) {
        const strikeRadius = 2.0;
        const enemiesInReach = this.getOpponentsWithinRadius(player, strikeRadius);

        if (enemiesInReach.length > 0 && Math.random() < (player.stats.aggression / 100) * 0.35) {
          // If player has a marked opponent in reach, prioritize striking assigned mark
          const markedInReach = enemiesInReach.find(e => e.id === player.markedOpponentId);
          const targetEnemy = markedInReach || enemiesInReach[0];

          const combatRes = CombatSystem.executeAttack(
            player,
            targetEnemy,
            this.ball,
            this.config.combat,
            this.currentTick
          );

          combatRes.events.forEach((e) => this.addEvent(e));
        }
      }

      // Move player towards targetPos with acceleration & max speed
      this.movePlayerTowards(player, player.targetPos, dt, court);
    }
  }

  private movePlayerTowards(player: Player, target: Vector2D, dt: number, court: SportEngineConfig['court']): void {
    const dx = target.x - player.pos.x;
    const dy = target.y - player.pos.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 0.4) {
      const speed = player.stats.speed * (player.stamina / 100);
      const moveX = (dx / dist) * speed;
      const moveY = (dy / dist) * speed;

      player.velocity.x = moveX;
      player.velocity.y = moveY;

      const stepDist = Math.hypot(moveX * dt, moveY * dt);
      player.pos.x += moveX * dt;
      player.pos.y += moveY * dt;

      player.statsMatch.distanceRun += stepDist;
      if (this.ball.carrierId === player.id) {
        player.distanceCarriedWithoutTouch += stepDist;
      }
    } else {
      player.velocity.x = 0;
      player.velocity.y = 0;
    }

    // Keep within pitch boundaries
    player.pos.x = Math.max(1, Math.min(court.width - 1, player.pos.x));
    player.pos.y = Math.max(1, Math.min(court.height - 1, player.pos.y));
  }

  private findBestDisposalTarget(carrier: Player, gameState?: GameStateContext): Player | null {
    const teammates = Array.from(this.players.values()).filter(
      p => p.team === carrier.team && p.id !== carrier.id && p.injuryState === 'none'
    );
    if (teammates.length === 0) return null;

    // Use passing lane & openness scoring from universal decision system if context is provided
    if (gameState) {
      const scoredMates = teammates.map(tm => {
        const weights = UniversalDecisionSystem.determineScoringWeights(tm, gameState);
        const { score } = UniversalDecisionSystem.scorePosition(tm.pos, tm, gameState, weights);
        return { player: tm, score };
      });
      scoredMates.sort((a, b) => b.score - a.score);
      return scoredMates[0]?.player || null;
    }

    const attackDir = carrier.team === 'teamA' ? 1 : -1;
    teammates.sort((a, b) => {
      const distA = (a.pos.x - carrier.pos.x) * attackDir + a.stats.markingSkill * 0.2;
      const distB = (b.pos.x - carrier.pos.x) * attackDir + b.stats.markingSkill * 0.2;
      return distB - distA;
    });

    return teammates[0] || null;
  }

  private getOpponentsWithinRadius(player: Player, radius: number): Player[] {
    const results: Player[] = [];
    for (const p of this.players.values()) {
      if (p.team !== player.team && p.injuryState === 'none') {
        const dist = Math.hypot(p.pos.x - player.pos.x, p.pos.y - player.pos.y);
        if (dist <= radius) {
          results.push(p);
        }
      }
    }
    return results;
  }

  /**
   * Fix 2: Tiered Goal Scoring Detection.
   * - Held by active carrier when crossing into goal: 3 POINTS (Carried In-Goal / Touchdown).
   * - Any other entry state (kicked into zone, loose ground roll, deflection): 1 POINT.
   * Team A scores on Right Goal (x >= width - 2)
   * Team B scores on Left Goal (x <= 2)
   */
  private evaluateGoalScoring(): void {
    const court = this.config.court;
    const goalTop = (court.height - court.goalWidth) / 2;
    const goalBottom = (court.height + court.goalWidth) / 2;

    const isCarried = this.ball.state === 'held' && !!this.ball.carrierId;
    const pointsAwarded = isCarried ? 3 : 1;
    const scoreTypeLabel = isCarried ? 'CARRIED IN-GOAL (3 PTS)' : 'ENTRY / KICKED GOAL (1 PT)';

    // Check Right Goal (Scored by Team A)
    if (this.ball.pos.x >= court.width - 2 && this.ball.pos.y >= goalTop && this.ball.pos.y <= goalBottom) {
      this.teamA.score += pointsAwarded;
      this.teamA.goals++;
      const scorer = isCarried && this.ball.carrierId
        ? this.players.get(this.ball.carrierId)
        : (this.ball.lastCarrierId ? this.players.get(this.ball.lastCarrierId) : null);
      if (scorer) scorer.statsMatch.goals++;

      this.addEvent({
        id: `goal-teamA-${this.currentTick}`,
        tick: this.currentTick,
        type: isCarried ? 'goal_scored' : 'minor_scored',
        description: `GOAL! ${this.teamA.name} scores ${pointsAwarded} PTS via ${scoreTypeLabel}! (Scorer: ${scorer ? scorer.name : 'Team Effort'})`,
        team: 'teamA',
        pos: { ...this.ball.pos },
      });

      this.resetToCenter();
    }
    // Check Left Goal (Scored by Team B)
    else if (this.ball.pos.x <= 2 && this.ball.pos.y >= goalTop && this.ball.pos.y <= goalBottom) {
      this.teamB.score += pointsAwarded;
      this.teamB.goals++;
      const scorer = isCarried && this.ball.carrierId
        ? this.players.get(this.ball.carrierId)
        : (this.ball.lastCarrierId ? this.players.get(this.ball.lastCarrierId) : null);
      if (scorer) scorer.statsMatch.goals++;

      this.addEvent({
        id: `goal-teamB-${this.currentTick}`,
        tick: this.currentTick,
        type: isCarried ? 'goal_scored' : 'minor_scored',
        description: `GOAL! ${this.teamB.name} scores ${pointsAwarded} PTS via ${scoreTypeLabel}! (Scorer: ${scorer ? scorer.name : 'Team Effort'})`,
        team: 'teamB',
        pos: { ...this.ball.pos },
      });

      this.resetToCenter();
    }
  }

  /**
   * Resets ball to center court for center contest / bounce.
   */
  public resetToCenter(): void {
    this.ball = BallSystem.createBall(this.config.court);
    this.ball.velocity = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 4,
    };
  }
}
