// MBB Tick — match simulation tick orchestration.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All function bodies are byte-identical to the original monolith.

import type { MatchState } from '../types';
import type { Ball } from '../../../engine/shared/sportsSim';
import { BallSystem, DisposalSystem } from '../../../engine/shared/sportsSim';
import { agentToPlayer, syncPlayerToAgent } from '../playerAdapter';
import { CONFIG, Agent, MbbState } from './mbbConfig';
import { distance } from './mbbMath';
import { forceSeek } from './mbbSteering';
import { assignRoles, getCarrier } from './mbbAgent';
import { resolveTackle, resolveBlock, applyWound } from './mbbCombat';
import { computeAgentForces, moveAgent, decideDisposal } from './mbbDisposal';
import { buildMatchRenderState } from './mbbRender';

// ── Tick (faithful game-rules port with both fixes) ──────────────────

export function tickMatchInternal(st: MbbState, dt: number): MatchState {
  if (st.state !== 'playing') return buildMatchRenderState(st);

  st.events = [];
  st.timeRemaining -= dt;
  if (st.timeRemaining <= 0) {
    st.state = 'ended';
    st.events.push({ type: 'match_ended', score_player: st.scorePlayer, score_opponent: st.scoreOpponent });
    return buildMatchRenderState(st);
  }

  const m = st.config.match;
  const courtW = m.court_width, courtH = m.court_height;
  const tackleR = m.tackle_range, blockR = m.block_range, stunT = m.tackle_stun_time, ezDepth = m.end_zone_depth;

  let carrier = getCarrier(st.agents, st.ball);
  assignRoles(st.agents, st.possession, st.ball);
  st.tickCount++;

  // Agent movement + stun recovery
  for (const ag of st.agents) {
    if (ag.status === 'stunned') {
      ag.stunTimer -= dt;
      if (ag.stunTimer <= 0) ag.status = 'active';
    } else if (ag.status === 'active') {
      const prevX = ag.x, prevY = ag.y;
      moveAgent(ag, st, dt);
      // Track distance run for stats
      const moved = distance(prevX, prevY, ag.x, ag.y);
      ag.statsMatch.distanceRun += moved;
      if (ag.role === 'carrier') {
        // Ball tracks carrier position
        st.ball.pos.x = ag.x;
        st.ball.pos.y = ag.y;
        // Accumulate carry distance for anti-camping rule
        ag.distanceCarriedWithoutTouch += moved;
      }
      // Decrement mark protection ticks
      if (ag.markProtectionTicks > 0) ag.markProtectionTicks--;
      // Decrement disposal cooldown
      if (ag.disposalCooldownTicks > 0) ag.disposalCooldownTicks--;
    }
  }

  // ── In-flight ball physics + interception ───────────────────────
  // When the ball is in_flight (from a kick or handball), update its
  // physics and evaluate interception/mark contests every tick.
  // Agents still move while the ball is in flight — they chase the
  // ball's predicted landing position.
  if (st.ball.state === 'in_flight') {
    // Update ball physics
    st.ball.pos.x += st.ball.velocity.x * dt;
    st.ball.pos.y += st.ball.velocity.y * dt;
    st.ball.height += st.ball.zVelocity * dt;
    st.ball.zVelocity -= 9.81 * dt;
    st.ball.hangTimeRemaining = Math.max(0, st.ball.hangTimeRemaining - 1);

    // Wall bouncing (keep ball in court, but clamp away from corners
    // to prevent the ball getting trapped in a corner)
    const wallMargin = 5;
    if (st.ball.pos.x < wallMargin) { st.ball.pos.x = wallMargin; st.ball.velocity.x *= -0.65; }
    if (st.ball.pos.x > courtW - wallMargin) { st.ball.pos.x = courtW - wallMargin; st.ball.velocity.x *= -0.65; }
    if (st.ball.pos.y < wallMargin) { st.ball.pos.y = wallMargin; st.ball.velocity.y *= -0.65; }
    if (st.ball.pos.y > courtH - wallMargin) { st.ball.pos.y = courtH - wallMargin; st.ball.velocity.y *= -0.65; }

    // Ball landed or hang time expired → goes loose
    if (st.ball.height <= 0 || st.ball.hangTimeRemaining <= 0) {
      st.ball.height = 0;
      st.ball.zVelocity = 0;
      st.ball.state = 'loose';
      st.ball.velocity.x *= 0.65;
      st.ball.velocity.y *= 0.65;
      st.ball.bounceCount++;
      st.events.push({ type: 'ball_bounced', pos: { x: st.ball.pos.x, y: st.ball.pos.y } });
    } else {
      // Evaluate in-flight interception/mark contests
      const players = st.agents
        .filter(ag => ag.status === 'active')
        .map(ag => agentToPlayer(ag, ag.playerStats));
      const contestResult = DisposalSystem.evaluateInFlightContests(
        st.ball, players, CONFIG.disposal, st.tickCount,
      );
      if (contestResult.securedBy) {
        // Sync the winner's state back to the underlying agent
        const winnerAgent = st.agents.find(ag => ag.id === contestResult.securedBy!.id);
        if (winnerAgent) {
          syncPlayerToAgent(contestResult.securedBy, winnerAgent);
          st.possession = winnerAgent.team;
          assignRoles(st.agents, st.possession, st.ball);
        }
        if (contestResult.event) {
          st.events.push({
            type: contestResult.event.type,
            agent_id: contestResult.event.primaryPlayerId,
            team: contestResult.event.team === 'teamA' ? 'player' : 'opponent',
            description: contestResult.event.description,
            is_turnover: contestResult.event.isTurnover,
          });
        }
      }
    }

    // Agents move while ball is in flight — they chase the ball's
    // current position (to intercept or pick up after it lands).
    // Temporarily set all agents to chase the ball by giving them a
    // loose-ball seek target.
    for (const ag of st.agents) {
      if (ag.status === 'stunned') {
        ag.stunTimer -= dt;
        if (ag.stunTimer <= 0) ag.status = 'active';
      } else if (ag.status === 'active') {
        // All agents seek the ball while it's in flight
        const maxSpeed = ag.speed * 0.5;
        const maxForce = maxSpeed * CONFIG.steering.max_force_ratio;
        const [fx, fy] = forceSeek(ag.x, ag.y, st.ball.pos.x, st.ball.pos.y, 1.0, maxForce);
        ag.vx += fx * dt;
        ag.vy += fy * dt;
        // Clamp speed
        const sp = Math.hypot(ag.vx, ag.vy);
        if (sp > maxSpeed) { ag.vx = ag.vx / sp * maxSpeed; ag.vy = ag.vy / sp * maxSpeed; }
        ag.x += ag.vx * dt;
        ag.y += ag.vy * dt;
        // Clamp to court
        ag.x = Math.max(2, Math.min(courtW - 2, ag.x));
        ag.y = Math.max(2, Math.min(courtH - 2, ag.y));
        if (ag.markProtectionTicks > 0) ag.markProtectionTicks--;
        if (ag.disposalCooldownTicks > 0) ag.disposalCooldownTicks--;
      }
    }

    // Check if any agent went down — pause for substitution
    for (const ev of st.events) {
      if (ev.type === 'agent_down') { st.state = 'paused_sub'; break; }
    }
    return buildMatchRenderState(st);
  }

  // ── Carrier disposal decision ───────────────────────────────────
  // The carrier decides whether to dispose (kick/handball) based on:
  // 1. Anti-camping pressure (approaching 15m carry limit)
  // 2. Nearby tackler threat (within tackle range)
  // 3. Open teammate available for a pass
  if (carrier && carrier.status === 'active' && st.ball.state === 'held') {
    const disposalAction = decideDisposal(carrier, st);
    if (disposalAction) {
      const player = agentToPlayer(carrier, carrier.playerStats);
      let result: { success: boolean; event: { description: string; type: string } } | null = null;
      if (disposalAction.method === 'kick') {
        result = DisposalSystem.executeKick(player, disposalAction.target, st.ball, CONFIG.disposal, st.tickCount);
      } else if (disposalAction.method === 'handball') {
        result = DisposalSystem.executeHandball(player, disposalAction.target, st.ball, CONFIG.disposal, st.tickCount);
      } else if (disposalAction.method === 'touch_bounce') {
        result = DisposalSystem.executeTouchBounce(player, st.ball, st.tickCount);
      }
      if (result) {
        syncPlayerToAgent(player, carrier);
        // Set cooldown — 200 ticks (10s) before another disposal
        carrier.disposalCooldownTicks = 200;
        st.events.push({
          type: result.event.type,
          agent_id: carrier.id,
          team: carrier.team,
          description: result.event.description,
        });
        // Ball is now in_flight (kick/handball) or still held (touch_bounce)
        // Re-fetch carrier since the ball may no longer be held
        carrier = getCarrier(st.agents, st.ball);
        assignRoles(st.agents, st.possession, st.ball);
      }
    }

    // Anti-camping and holding-the-ball turnover checks
    if (carrier && carrier.status === 'active' && st.ball.state === 'held') {
      const player = agentToPlayer(carrier, carrier.playerStats);
      const turnover = DisposalSystem.evaluateTurnoverRules(player, st.ball, CONFIG.disposal, st.tickCount);
      if (turnover.turnover) {
        syncPlayerToAgent(player, carrier);
        if (turnover.event) {
          st.events.push({
            type: turnover.event.type,
            agent_id: carrier.id,
            team: carrier.team,
            description: turnover.event.description,
            is_turnover: true,
          });
        }
        // Possession changes — ball is now loose
        st.possession = st.possession === 'player' ? 'opponent' : 'player';
        assignRoles(st.agents, st.possession, st.ball);
        carrier = getCarrier(st.agents, st.ball);
      }
    }
  }

  // Scoring check
  if (carrier) {
    let scored = false;
    if (st.possession === 'player' && carrier.x > courtW - ezDepth) {
      st.scorePlayer++;
      scored = true;
      st.events.push({ type: 'scored', team: 'player', score_player: st.scorePlayer, score_opponent: st.scoreOpponent });
    } else if (st.possession === 'opponent' && carrier.x < ezDepth) {
      st.scoreOpponent++;
      scored = true;
      st.events.push({ type: 'scored', team: 'opponent', score_player: st.scorePlayer, score_opponent: st.scoreOpponent });
    }

    if (scored) {
      // Point cap check: if either team reaches the cap, match ends
      // immediately. Does not run remaining time. This is a real win
      // condition, not just a time-based end.
      const pointCap = m.point_cap ?? CONFIG.match.point_cap;
      if (st.scorePlayer >= pointCap || st.scoreOpponent >= pointCap) {
        st.state = 'ended';
        st.events.push({ type: 'match_ended', score_player: st.scorePlayer, score_opponent: st.scoreOpponent, reason: 'point_cap' });
        return buildMatchRenderState(st);
      }

      // Reset positions, switch possession to conceding team.
      //
      // STRUCTURAL FIX: The old code did a discrete "find a valid teammate"
      // assignment that failed silently when both receiving-team agents
      // were 'down', permanently orphaning the ball. Now the ball uses the
      // sportsSim Ball entity: if a valid receiver exists, the ball is
      // assigned directly (preserving gameplay feel); if BOTH receivers
      // are down, the ball transitions to 'loose' via BallSystem.looseBall()
      // and is recovered naturally via the continuous pickup check below.
      // The both-down soft-lock is now structurally impossible.
      st.possession = st.possession === 'player' ? 'opponent' : 'player';
      let resetCarrier: Agent | null = null;
      // Count active agents per team for vertical spreading
      const playerAgents = st.agents.filter(a => a.team === 'player');
      const opponentAgents = st.agents.filter(a => a.team === 'opponent');
      let playerIdx = 0, opponentIdx = 0;
      for (const ag of st.agents) {
        // A stunned agent is still in the play (it recovers); only a
        // downed agent is out. Requiring "active" here meant that if the
        // whole conceding team was stunned at the moment of the score the
        // ball was assigned to no one and permanently lost, stalling the
        // match.
        if (ag.team === st.possession && ag.status !== 'down' && !resetCarrier) {
          resetCarrier = ag;
        }
        // Spread agents vertically across the court, each at a distinct Y
        const teamList = ag.team === 'player' ? playerAgents : opponentAgents;
        const idxInTeam = ag.team === 'player' ? playerIdx++ : opponentIdx++;
        ag.x = ag.team === 'player' ? 30 : 70;
        ag.y = courtH * ((idxInTeam + 0.5) / teamList.length);
        ag.vx = 0; ag.vy = 0;
      }
      st.ball.pos.x = 50;
      st.ball.pos.y = courtH / 2;
      if (resetCarrier) {
        // Direct assignment — preserves original gameplay feel
        st.ball.state = 'held';
        st.ball.carrierId = resetCarrier.id;
        st.ball.lastCarrierId = resetCarrier.id;
        st.ball.velocity = { x: 0, y: 0 };
        st.ball.height = 1.0;
        st.ball.looseTicks = 0;
        st.ball.pos.x = resetCarrier.x;
        st.ball.pos.y = resetCarrier.y;
      } else {
        // Both receiving-team agents are down — ball goes loose.
        // The continuous pickup check below will recover it once any
        // active agent reaches it. This is the structural fix for the
        // both-down soft-lock bug.
        BallSystem.looseBall(st.ball, null, { x: 0, y: 0 });
      }
      assignRoles(st.agents, st.possession, st.ball);
    }
  }

  // Continuous loose-ball pickup — checked every tick.
  // Any active, non-downed agent within pickup radius can recover the ball.
  // This is the structural replacement for the discrete assignment that
  // could fail when both receiving-team agents were down.
  if (st.ball.state === 'loose') {
    const pickupRadius = 5.0; // MBB-specific pickup radius
    let bestAgent: Agent | null = null;
    let bestDist = Infinity;
    for (const ag of st.agents) {
      if (ag.status !== 'active' && ag.status !== 'stunned') continue;
      if (ag.status === 'stunned') continue; // Stunned agents can't pick up
      const d = distance(ag.x, ag.y, st.ball.pos.x, st.ball.pos.y);
      if (d < pickupRadius && d < bestDist) {
        bestDist = d;
        bestAgent = ag;
      }
    }
    if (bestAgent) {
      st.ball.state = 'held';
      st.ball.carrierId = bestAgent.id;
      st.ball.lastCarrierId = bestAgent.id;
      st.ball.velocity = { x: 0, y: 0 };
      st.ball.height = 1.0;
      st.ball.looseTicks = 0;
      st.possession = bestAgent.team;
      st.events.push({ type: 'ball_pickup', agent_id: bestAgent.id, team: bestAgent.team });
      assignRoles(st.agents, st.possession, st.ball);
    }
  }

  // Collision detection: blocks and tackles
  // FIX (root cause #1): Re-fetch the carrier: the scoring block above
  // may have switched possession and reset positions, leaving the earlier
  // `carrier` local pointing at the previous (now-tackler) agent.
  // Operating on that stale reference caused a self-tackle that flipped
  // possession straight back to the scoring team every tick.
  carrier = getCarrier(st.agents, st.ball);
  if (carrier) {
    // Track tackle pressure on the carrier for holding-the-ball rule
    let underTacklePressure = false;
    for (const ag of st.agents) {
      if (ag.status === 'active' && ag.role === 'tackler') {
        const d = distance(ag.x, ag.y, carrier.x, carrier.y);

        // Track tackle pressure if tackler is within range
        if (d < tackleR * 1.2) {
          underTacklePressure = true;
          carrier.tackledTicks++;
          carrier.tackledByPlayerId = ag.id;
        }

        // Escort intercept: check if any escort is near the tackler
        let intercepted = false;
        for (const esc of st.agents) {
          if (esc.status === 'active' && esc.role === 'escort') {
            const ed = distance(esc.x, esc.y, ag.x, ag.y);
            if (ed < blockR) {
              const outcome = resolveBlock(esc, ag, st.prng);
              if (outcome === 'block_success') {
                ag.status = 'stunned';
                ag.stunTimer = stunT;
                st.events.push({ type: 'block', blocker_id: esc.id, tackler_id: ag.id });
              } else {
                applyWound(esc, 'heavy', st, st.prng);
              }
              intercepted = true;
              break;
            }
          }
        }

        if (!intercepted && d < tackleR) {
          const outcome = resolveTackle(ag, carrier, st.prng);
          if (outcome === 'possession_change' || outcome === 'wound') {
            if (outcome === 'wound') applyWound(carrier, 'limb_loss', st, st.prng);
            // Only change possession if carrier is still active
            if (carrier.status === 'active') {
              // Ball transitions to the tackler via Ball state machine
              st.ball.carrierId = ag.id;
              st.ball.lastCarrierId = carrier.id;
              st.possession = ag.team;
              assignRoles(st.agents, st.possession, st.ball);
              st.events.push({ type: 'tackle_success', tackler_id: ag.id, carrier_id: carrier.id, possession: st.possession });
              // FIX: Ball has moved; stop iterating so we don't tackle
              // the now-stale carrier reference again this tick.
              break;
            }
          } else {
            ag.status = 'stunned';
            ag.stunTimer = stunT * 0.5;
            st.events.push({ type: 'tackle_fail', tackler_id: ag.id });
          }
        }
      }
    }
    // Reset tackle pressure if no tackler was pressing this tick
    if (!underTacklePressure) {
      carrier.tackledTicks = 0;
      carrier.tackledByPlayerId = null;
    }
  }

  // Check if any agent went down — pause for substitution
  for (const ev of st.events) {
    if (ev.type === 'agent_down') {
      st.state = 'paused_sub';
      break;
    }
  }

  return buildMatchRenderState(st);
}
