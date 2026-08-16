import {
  Vector2D,
  Ball,
  Player,
  CourtConfig,
  ScoringWeights,
  ScoringBreakdown,
  PositionCandidate,
} from './types';

export interface GameStateContext {
  ball: Ball;
  players: Map<string, Player>;
  court: CourtConfig;
  carrier: Player | null;
  currentTick: number;
}

export class UniversalDecisionSystem {
  /**
   * Universal position scoring function.
   * Every player, every tick, evaluates candidate positions through this exact scoring mechanism.
   * Role and situation determine the weights passed in — never changing which code path runs.
   */
  public static scorePosition(
    candidatePos: Vector2D,
    player: Player,
    gameState: GameStateContext,
    weights: ScoringWeights
  ): { score: number; breakdown: ScoringBreakdown } {
    const court = gameState.court;
    const isTeamA = player.team === 'teamA';
    
    // Defending goal (Team A defends Left x=0, Team B defends Right x=width)
    const defGoalX = isTeamA ? 0 : court.width;
    const defGoalY = court.height / 2;

    // Attacking goal (Team A attacks Right x=width, Team B attacks Left x=0)
    const attGoalX = isTeamA ? court.width : 0;
    const attGoalY = court.height / 2;

    const allPlayers = Array.from(gameState.players.values());
    const activeOpponents = allPlayers.filter(
      (p) => p.team !== player.team && p.injuryState === 'none'
    );

    // =========================================================================
    // 1. FACTOR: GOAL PROXIMITY (Defending Own Goal)
    // =========================================================================
    // Rewards holding defensive depth near own goal or between ball/threat and own goal
    const distToDefGoal = Math.hypot(candidatePos.x - defGoalX, candidatePos.y - defGoalY);
    const maxDefDist = court.width * 0.8;
    let goalProximityScore = Math.max(0, 100 * (1 - distToDefGoal / maxDefDist));

    // Bonus for central defensive positioning (protecting corridor in front of goal)
    const yCenterDev = Math.abs(candidatePos.y - defGoalY);
    if (yCenterDev < court.goalWidth * 1.5) {
      goalProximityScore += 15;
    }
    goalProximityScore = Math.min(100, Math.max(0, goalProximityScore));

    // =========================================================================
    // 2. FACTOR: BALL THREAT (Pressuring Ball / Carrier)
    // =========================================================================
    // Target ball or predicted flight target
    const targetBallPos =
      gameState.ball.state === 'in_flight' && gameState.ball.flightTarget
        ? gameState.ball.flightTarget
        : gameState.ball.pos;

    const distToBall = Math.hypot(candidatePos.x - targetBallPos.x, candidatePos.y - targetBallPos.y);
    const maxBallThreatDist = court.width * 0.6;
    const ballThreatScore = Math.min(100, Math.max(0, 100 * (1 - distToBall / maxBallThreatDist)));

    // =========================================================================
    // 3. FACTOR: OPENNESS (Distance from Nearest Opponent / Finding Space)
    // =========================================================================
    let minOpponentDist = 999;
    for (const opp of activeOpponents) {
      const d = Math.hypot(candidatePos.x - opp.pos.x, candidatePos.y - opp.pos.y);
      if (d < minOpponentDist) minOpponentDist = d;
    }
    // 0m = 0 pts, 12m+ = 100 pts
    const opennessScore = Math.min(100, Math.max(0, (minOpponentDist / 12) * 100));

    // =========================================================================
    // 4. FACTOR: PASSING LANE (Viable, Unobstructed Target for Teammate Carrier)
    // =========================================================================
    let passingLaneScore = 0;
    const carrier = gameState.carrier;

    if (carrier && carrier.team === player.team && carrier.id !== player.id) {
      const distFromCarrier = Math.hypot(candidatePos.x - carrier.pos.x, candidatePos.y - carrier.pos.y);
      
      // Optimal kicking/handball receiving distance is 12m - 32m
      let distanceFit = 0;
      if (distFromCarrier >= 8 && distFromCarrier <= 38) {
        distanceFit = 1 - Math.abs(distFromCarrier - 22) / 18;
      } else if (distFromCarrier < 8) {
        distanceFit = distFromCarrier / 8; // penalize crowding carrier
      }

      // Forward direction bonus: receiving downfield towards attacking goal
      const attackDir = isTeamA ? 1 : -1;
      const downfieldProgress = (candidatePos.x - carrier.pos.x) * attackDir;
      const forwardFactor = downfieldProgress > 0 ? Math.min(1.2, 0.4 + (downfieldProgress / 20)) : 0.1;

      // Obstruction penalty: check if any opponent blocks the line segment from carrier to candidate
      let obstructionPenalty = 0;
      for (const opp of activeOpponents) {
        const perpDist = this.pointToSegmentDistance(opp.pos, carrier.pos, candidatePos);
        if (perpDist < 3.0) {
          // Opponent directly in the passing lane
          obstructionPenalty += (3.0 - perpDist) * 25;
        }
      }

      passingLaneScore = Math.min(
        100,
        Math.max(0, (distanceFit * 60 + forwardFactor * 40) - obstructionPenalty)
      );
    }

    // =========================================================================
    // 5. FACTOR: ATTACK PROGRESS (Advancing Toward Opponent Goal)
    // =========================================================================
    const distToAttGoal = Math.hypot(candidatePos.x - attGoalX, candidatePos.y - attGoalY);
    const maxAttDist = court.width;
    let attackProgressScore = Math.max(0, 100 * (1 - distToAttGoal / maxAttDist));
    
    // Central goal corridor bonus
    const attYCenterDev = Math.abs(candidatePos.y - attGoalY);
    if (attYCenterDev < court.goalWidth * 1.5) {
      attackProgressScore += 10;
    }
    attackProgressScore = Math.min(100, Math.max(0, attackProgressScore));

    // =========================================================================
    // 6. FACTOR: MARK ASSIGNMENT (Goal-Side Positioning on Assigned Opponent)
    // =========================================================================
    let markAssignmentScore = 0;
    if (player.markedOpponentId) {
      const markedOpponent = gameState.players.get(player.markedOpponentId);
      if (markedOpponent && markedOpponent.injuryState === 'none') {
        // Compute ideal goal-side intercept point between opponent and defending goal
        const oppPos = markedOpponent.pos;
        const toGoalX = defGoalX - oppPos.x;
        const toGoalY = defGoalY - oppPos.y;
        const toGoalLen = Math.hypot(toGoalX, toGoalY) || 1;

        // Position 3.0 meters goal-side of the opponent along the line of sight to goal
        const goalSideBuffer = 3.2;
        const idealGoalSidePos: Vector2D = {
          x: oppPos.x + (toGoalX / toGoalLen) * goalSideBuffer,
          y: oppPos.y + (toGoalY / toGoalLen) * goalSideBuffer,
        };

        const distToGoalSide = Math.hypot(
          candidatePos.x - idealGoalSidePos.x,
          candidatePos.y - idealGoalSidePos.y
        );

        // Being close to the goal-side intercept point scores up to 100
        const proximityToIdeal = Math.max(0, 100 * (1 - distToGoalSide / 18));

        // Penalty if candidate is on the wrong side (closer to opponent's attacking goal than opponent)
        const candidateToDefGoal = Math.hypot(candidatePos.x - defGoalX, candidatePos.y - defGoalY);
        const oppToDefGoal = Math.hypot(oppPos.x - defGoalX, oppPos.y - defGoalY);
        const wrongSidePenalty = candidateToDefGoal > oppToDefGoal ? 35 : 0;

        markAssignmentScore = Math.min(100, Math.max(0, proximityToIdeal - wrongSidePenalty));
      }
    }

    // =========================================================================
    // TOTAL WEIGHTED UTILITY CALCULATION
    // =========================================================================
    const breakdown: ScoringBreakdown = {
      goalProximity: goalProximityScore,
      ballThreat: ballThreatScore,
      openness: opennessScore,
      passingLane: passingLaneScore,
      attackProgress: attackProgressScore,
      markAssignment: markAssignmentScore,
      totalScore:
        goalProximityScore * weights.goalProximity +
        ballThreatScore * weights.ballThreat +
        opennessScore * weights.openness +
        passingLaneScore * weights.passingLane +
        attackProgressScore * weights.attackProgress +
        markAssignmentScore * weights.markAssignment,
    };

    return {
      score: breakdown.totalScore,
      breakdown,
    };
  }

  /**
   * Determines the scoring weights for a player based on universal context:
   * possession state, role inclinations, and tactical situation.
   */
  public static determineScoringWeights(
    player: Player,
    gameState: GameStateContext
  ): ScoringWeights {
    const carrier = gameState.carrier;
    const isCarrier = carrier?.id === player.id;
    const ownTeamHasBall = carrier && carrier.team === player.team && !isCarrier;
    const oppTeamHasBall = carrier && carrier.team !== player.team;
    const ballIsLoose = !carrier || gameState.ball.state === 'loose';

    // -------------------------------------------------------------------------
    // CONTEXT 1: CURRENT BALL CARRIER
    // -------------------------------------------------------------------------
    if (isCarrier) {
      return {
        attackProgress: 1.0,
        openness: 0.7,      // Avoid clustered defenders while driving
        goalProximity: 0.0,
        ballThreat: 0.0,
        passingLane: 0.0,
        markAssignment: 0.0,
      };
    }

    // -------------------------------------------------------------------------
    // CONTEXT 2: OFF-BALL ATTACKER (Own Team in Possession)
    // -------------------------------------------------------------------------
    if (ownTeamHasBall) {
      switch (player.role) {
        case 'receiver':
          return {
            openness: 0.95,
            passingLane: 1.0,
            attackProgress: 0.85,
            goalProximity: 0.0,
            ballThreat: 0.0,
            markAssignment: 0.0,
          };
        case 'chaser':
          return {
            openness: 0.85,
            passingLane: 0.80,
            attackProgress: 0.70,
            goalProximity: 0.05,
            ballThreat: 0.0,
            markAssignment: 0.0,
          };
        case 'enforcer':
          return {
            openness: 0.50,
            passingLane: 0.40,
            attackProgress: 0.60,
            goalProximity: 0.10,
            ballThreat: 0.0,
            markAssignment: 0.0, // Can lead or screen
          };
        case 'ruckman':
          return {
            openness: 0.70,
            passingLane: 0.75,
            attackProgress: 0.55,
            goalProximity: 0.15,
            ballThreat: 0.0,
            markAssignment: 0.0,
          };
        case 'sweeper':
        default:
          return {
            openness: 0.60,
            passingLane: 0.50,
            attackProgress: 0.35,
            goalProximity: 0.45, // Sweeper maintains defensive cover for turnovers
            ballThreat: 0.0,
            markAssignment: 0.0,
          };
      }
    }

    // -------------------------------------------------------------------------
    // CONTEXT 3: DEFENDER (Opponent in Possession)
    // -------------------------------------------------------------------------
    if (oppTeamHasBall && carrier) {
      // Determine if this player is the nearest active defender to the carrier (Primary Pressurer)
      const allTeammates = Array.from(gameState.players.values()).filter(
        (p) => p.team === player.team && p.injuryState === 'none'
      );
      
      let isPrimaryPressurer = false;
      let minPressDist = 999;
      let pressurerId = '';

      for (const tm of allTeammates) {
        const d = Math.hypot(tm.pos.x - carrier.pos.x, tm.pos.y - carrier.pos.y);
        if (d < minPressDist) {
          minPressDist = d;
          pressurerId = tm.id;
        }
      }
      if (pressurerId === player.id) {
        isPrimaryPressurer = true;
      }

      if (isPrimaryPressurer) {
        // Primary Pressurer hunts and closes down the carrier directly
        return {
          ballThreat: 1.0,
          goalProximity: 0.30,
          markAssignment: 0.10,
          openness: 0.0,
          passingLane: 0.0,
          attackProgress: 0.0,
        };
      }

      // Enforcer role specific tuning: higher desire to punish targets
      if (player.role === 'enforcer') {
        return {
          markAssignment: 0.90,
          ballThreat: 0.40,
          goalProximity: 0.50,
          openness: 0.0,
          passingLane: 0.0,
          attackProgress: 0.0,
        };
      }

      // Sweeper role: high goal-line anchor and marking dangerous deep targets
      if (player.role === 'sweeper') {
        return {
          markAssignment: 0.85,
          goalProximity: 0.90,
          ballThreat: 0.20,
          openness: 0.0,
          passingLane: 0.0,
          attackProgress: 0.0,
        };
      }

      // Standard Off-Ball Marker (receivers, chasers, ruckmen on defense)
      return {
        markAssignment: 1.0,
        goalProximity: 0.70,
        ballThreat: 0.25,
        openness: 0.0,
        passingLane: 0.0,
        attackProgress: 0.0,
      };
    }

    // -------------------------------------------------------------------------
    // CONTEXT 4: LOOSE BALL SCRAMBLE / BALL IN FLIGHT
    // -------------------------------------------------------------------------
    if (ballIsLoose) {
      if (player.role === 'sweeper') {
        return {
          ballThreat: 0.75,
          goalProximity: 0.55,
          openness: 0.30,
          attackProgress: 0.20,
          passingLane: 0.0,
          markAssignment: 0.0,
        };
      }
      return {
        ballThreat: 1.0,
        openness: 0.0, // Fix 1: Zero out openness so players commit to contested loose ball recovery without orbiting
        attackProgress: 0.35,
        goalProximity: 0.20,
        passingLane: 0.0,
        markAssignment: 0.0,
      };
    }

    // Default neutral weights
    return {
      goalProximity: 0.4,
      ballThreat: 0.6,
      openness: 0.4,
      passingLane: 0.3,
      attackProgress: 0.4,
      markAssignment: 0.4,
    };
  }

  /**
   * Generates a spatial candidate pool of potential target positions.
   */
  public static generateCandidates(
    player: Player,
    gameState: GameStateContext
  ): Vector2D[] {
    const court = gameState.court;
    const candidates: Vector2D[] = [];

    // 1. Current position (holding ground)
    candidates.push({ x: player.pos.x, y: player.pos.y });

    // 2. Radial movement exploration (8 directions x 3 distances)
    const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, -(3 * Math.PI) / 4, -Math.PI / 2, -Math.PI / 4];
    const distances = [3.5, 7.5, 15.0];

    for (const dist of distances) {
      for (const angle of angles) {
        candidates.push({
          x: player.pos.x + Math.cos(angle) * dist,
          y: player.pos.y + Math.sin(angle) * dist,
        });
      }
    }

    // 3. Goal-Side Anchor for Assigned Mark
    if (player.markedOpponentId) {
      const opp = gameState.players.get(player.markedOpponentId);
      if (opp) {
        const isTeamA = player.team === 'teamA';
        const defGoalX = isTeamA ? 0 : court.width;
        const defGoalY = court.height / 2;
        const dx = defGoalX - opp.pos.x;
        const dy = defGoalY - opp.pos.y;
        const len = Math.hypot(dx, dy) || 1;

        // Candidate 1: Direct goal-side block (3m)
        candidates.push({
          x: opp.pos.x + (dx / len) * 3.5,
          y: opp.pos.y + (dy / len) * 3.5,
        });
        // Candidate 2: Deeper defensive sag (7m)
        candidates.push({
          x: opp.pos.x + (dx / len) * 7.5,
          y: opp.pos.y + (dy / len) * 7.5,
        });
      }
    }

    // 4. Ball/Carrier pressure candidates
    const ballPos = gameState.ball.pos;
    candidates.push({ x: ballPos.x, y: ballPos.y });
    if (gameState.carrier) {
      candidates.push({ x: gameState.carrier.pos.x, y: gameState.carrier.pos.y });
    }

    // 5. Attacking Downfield Lead Pockets (Flanks, Center Corridor, Deep Lead)
    const isTeamA = player.team === 'teamA';
    const attackDir = isTeamA ? 1 : -1;
    candidates.push({ x: player.pos.x + attackDir * 12, y: court.height * 0.25 });
    candidates.push({ x: player.pos.x + attackDir * 12, y: court.height * 0.75 });
    candidates.push({ x: player.pos.x + attackDir * 18, y: court.height * 0.5 });
    candidates.push({ x: player.pos.x + attackDir * 28, y: court.height * 0.5 });

    // 6. Defensive Arc Anchors
    const defGoalX = isTeamA ? 0 : court.width;
    candidates.push({ x: defGoalX + (isTeamA ? 12 : -12), y: court.height * 0.5 });
    candidates.push({ x: defGoalX + (isTeamA ? 16 : -16), y: court.height * 0.3 });
    candidates.push({ x: defGoalX + (isTeamA ? 16 : -16), y: court.height * 0.7 });

    // Clamp all candidates within court boundaries (with 1.5m margin)
    return candidates.map((c) => ({
      x: Math.max(1.5, Math.min(court.width - 1.5, c.x)),
      y: Math.max(1.5, Math.min(court.height - 1.5, c.y)),
    }));
  }

  /**
   * Evaluates all candidates for a player and selects the best position based on utility scores.
   */
  public static evaluateBestPosition(
    player: Player,
    gameState: GameStateContext
  ): { bestPos: Vector2D; weights: ScoringWeights; bestCandidate: PositionCandidate; allEvaluated: PositionCandidate[] } {
    const weights = this.determineScoringWeights(player, gameState);
    const candidatePositions = this.generateCandidates(player, gameState);

    let highestScore = -Infinity;
    let bestPos: Vector2D = { x: player.pos.x, y: player.pos.y };
    let bestBreakdown: ScoringBreakdown | undefined;

    const evaluatedCandidates: PositionCandidate[] = [];

    for (const cPos of candidatePositions) {
      const { score, breakdown } = this.scorePosition(cPos, player, gameState, weights);
      evaluatedCandidates.push({ pos: cPos, score, breakdown });

      if (score > highestScore) {
        highestScore = score;
        bestPos = cPos;
        bestBreakdown = breakdown;
      }
    }

    const bestCandidate: PositionCandidate = {
      pos: bestPos,
      score: highestScore,
      breakdown: bestBreakdown,
    };

    return {
      bestPos,
      weights,
      bestCandidate,
      allEvaluated: evaluatedCandidates,
    };
  }

  /**
   * Dynamically assigns 1-to-1 man marks for defending players against dangerous opposing attackers.
   */
  public static updateManMarkAssignments(
    players: Map<string, Player>,
    carrier: Player | null,
    court: CourtConfig
  ): void {
    const allPlayers = Array.from(players.values());

    const teams: ('teamA' | 'teamB')[] = ['teamA', 'teamB'];

    for (const defTeam of teams) {
      const attTeam: 'teamA' | 'teamB' = defTeam === 'teamA' ? 'teamB' : 'teamA';
      
      const defenders = allPlayers.filter(
        (p) => p.team === defTeam && p.injuryState === 'none'
      );
      const attackers = allPlayers.filter(
        (p) => p.team === attTeam && p.injuryState === 'none'
      );

      // If opponents don't have ball or are all down, clear marks
      if (!carrier || carrier.team !== attTeam || attackers.length === 0) {
        for (const def of defenders) {
          def.markedOpponentId = null;
        }
        continue;
      }

      // Find primary pressurer (closest to carrier)
      let primaryPressurer: Player | null = null;
      let minPressDist = 999;
      for (const def of defenders) {
        const d = Math.hypot(def.pos.x - carrier.pos.x, def.pos.y - carrier.pos.y);
        if (d < minPressDist) {
          minPressDist = d;
          primaryPressurer = def;
        }
      }

      // Primary pressurer targets the carrier
      if (primaryPressurer) {
        primaryPressurer.markedOpponentId = carrier.id;
      }

      // Non-carrier attackers sorted by goal threat (closeness to defender's goal)
      const defGoalX = defTeam === 'teamA' ? 0 : court.width;
      const dangerousAttackers = attackers
        .filter((a) => a.id !== carrier.id)
        .sort((a, b) => {
          const distA = Math.abs(a.pos.x - defGoalX);
          const distB = Math.abs(b.pos.x - defGoalX);
          return distA - distB; // Closest to goal first
        });

      // Remaining defenders to assign
      const offBallDefenders = defenders.filter((d) => d.id !== primaryPressurer?.id);
      const assignedAttackerIds = new Set<string>();

      for (const def of offBallDefenders) {
        // Find nearest unassigned dangerous attacker
        let bestTarget: Player | null = null;
        let minDist = 999;

        for (const att of dangerousAttackers) {
          if (!assignedAttackerIds.has(att.id)) {
            const d = Math.hypot(def.pos.x - att.pos.x, def.pos.y - att.pos.y);
            if (d < minDist) {
              minDist = d;
              bestTarget = att;
            }
          }
        }

        // If all attackers assigned, fallback to closest any attacker
        if (!bestTarget && dangerousAttackers.length > 0) {
          bestTarget = dangerousAttackers[0];
        }

        if (bestTarget) {
          def.markedOpponentId = bestTarget.id;
          assignedAttackerIds.add(bestTarget.id);
        } else {
          def.markedOpponentId = carrier.id;
        }
      }
    }
  }

  /**
   * Helper: Shortest distance from point P to line segment AB.
   */
  private static pointToSegmentDistance(p: Vector2D, a: Vector2D, b: Vector2D): number {
    const l2 = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2);
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = a.x + t * (b.x - a.x);
    const projY = a.y + t * (b.y - a.y);
    return Math.hypot(p.x - projX, p.y - projY);
  }
}
