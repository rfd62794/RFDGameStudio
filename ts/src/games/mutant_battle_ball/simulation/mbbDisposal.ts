// MBB Disposal — steering force computation, agent movement, and
// disposal decision logic.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All function bodies are byte-identical to the original monolith.

import type { Ball, Vector2D } from '../../../engine/shared/sportsSim';
import { CONFIG, Agent, MbbState } from './mbbConfig';
import { clamp, distance, limitVector } from './mbbMath';
import { forceSeek, forceArrive, forceFlee, forceInterpose } from './mbbSteering';
import { getCarrier, nearestEnemy } from './mbbAgent';

// ── Movement (DELIBERATELY REPLACED with steering) ───────────────────
//
// The Lua movement was direct position-stepping toward a target point
// (move_toward). This replaces it with force-based steering: compute
// steering forces per role, sum, limit, integrate into velocity, then
// apply velocity to position. This produces smoother, more realistic
// pursuit and evasion — tacklers curve toward the carrier, carriers
// weave away from threats, escorts slide into blocking positions.

export function computeAgentForces(ag: Agent, st: MbbState): [number, number] {
  const m = st.config.match;
  const courtW = m.court_width, courtH = m.court_height, ezDepth = m.end_zone_depth;
  const sw = CONFIG.steering;
  const maxSpeed = ag.speed * 0.5 * (ag.role === 'carrier' ? m.carrier_speed_mult : 1);
  const maxForce = maxSpeed * sw.max_force_ratio;
  let fx = 0, fy = 0;

  if (ag.role === 'carrier') {
    // Seek toward own end zone
    const targetX = st.possession === 'player' ? (courtW - ezDepth / 2) : (ezDepth / 2);
    const targetY = courtH / 2;
    const [sx, sy] = forceSeek(ag.x, ag.y, targetX, targetY, sw.carrier_seek_weight, maxForce);
    fx += sx; fy += sy;

    // Flee from nearby tacklers (inverse-distance weighted)
    const [nearest, nd] = nearestEnemy(ag, st.agents);
    if (nearest && nd < sw.carrier_flee_radius) {
      const [flx, fly] = forceFlee(ag.x, ag.y, nearest.x, nearest.y, sw.carrier_flee_weight, maxForce, sw.carrier_flee_radius * sw.carrier_flee_radius);
      fx += flx; fy += fly;
    }
  } else if (ag.role === 'tackler') {
    // Pursue the carrier (seek to carrier's current position)
    const carrier = getCarrier(st.agents, st.ball);
    if (carrier) {
      const [px, py] = forceSeek(ag.x, ag.y, carrier.x, carrier.y, sw.tackler_pursue_weight, maxForce);
      fx += px; fy += py;
    }
  } else if (ag.role === 'escort') {
    // Interpose between carrier and nearest tackler to the carrier
    const carrier = getCarrier(st.agents, st.ball);
    if (carrier) {
      const [nearestTackler] = nearestEnemy(carrier, st.agents);
      if (nearestTackler) {
        const [ix, iy] = forceInterpose(ag.x, ag.y, ag.vx, ag.vy, carrier.x, carrier.y, nearestTackler.x, nearestTackler.y, sw.escort_interpose_weight, maxSpeed, maxForce, sw.escort_arrive_radius);
        fx += ix; fy += iy;
      } else {
        // No threat — stay near the carrier
        const [sx, sy] = forceArrive(ag.x, ag.y, ag.vx, ag.vy, carrier.x, carrier.y, sw.escort_interpose_weight, maxSpeed, maxForce, sw.escort_arrive_radius, 0);
        fx += sx; fy += sy;
      }
    }
  }

  return [fx, fy];
}

export function moveAgent(ag: Agent, st: MbbState, dt: number): void {
  const m = st.config.match;
  const courtW = m.court_width, courtH = m.court_height;
  const maxSpeed = ag.speed * 0.5 * (ag.role === 'carrier' ? m.carrier_speed_mult : 1);
  const maxForce = maxSpeed * CONFIG.steering.max_force_ratio;

  const [fx, fy] = computeAgentForces(ag, st);
  const [lfx, lfy] = limitVector(fx, fy, maxForce);
  ag.vx += lfx * dt;
  ag.vy += lfy * dt;
  const [lvx, lvy] = limitVector(ag.vx, ag.vy, maxSpeed);
  ag.vx = lvx; ag.vy = lvy;

  // Drag — velocity retention per tick (dt-scaled)
  const drag = Math.pow(CONFIG.steering.drag, dt / 0.1);
  ag.vx *= drag; ag.vy *= drag;

  ag.x = clamp(ag.x + ag.vx * dt, 0, courtW);
  ag.y = clamp(ag.y + ag.vy * dt, 0, courtH);
}

// ── Disposal decision logic ──────────────────────────────────────────
//
// The carrier decides whether to dispose based on:
// 1. Anti-camping pressure (approaching carry limit → must touch-bounce)
// 2. Tackler threat (nearby tackler → consider handball to open teammate)
// 3. Strategic kicking (open teammate ahead → kick downfield)
// 4. Random disposal pressure (occasional kicks/handballs to create flow)

export interface DisposalDecision {
  method: 'kick' | 'handball' | 'touch_bounce';
  target: Vector2D;
}

export function decideDisposal(carrier: Agent, st: MbbState): DisposalDecision | null {
  const rules = CONFIG.disposal;
  const m = st.config.match;
  const courtW = m.court_width, courtH = m.court_height, ezDepth = m.end_zone_depth;

  // Cooldown: don't dispose if recently disposed (prevents spam)
  if (carrier.disposalCooldownTicks > 0) return null;

  // Don't dispose if close to the end zone — prioritize scoring.
  // Uses 3x end zone depth to give a wide "scoring range" where the
  // carrier keeps running instead of disposing.
  const inScoringRange = (st.possession === 'player' && carrier.x > courtW - ezDepth * 3) ||
                         (st.possession === 'opponent' && carrier.x < ezDepth * 3);
  if (inScoringRange) return null;

  // 1. Anti-camping: must touch-bounce if approaching carry limit
  if (carrier.distanceCarriedWithoutTouch >= rules.maxCarryDistanceWithoutTouch * 0.85) {
    // Touch-bounce to reset carry distance, unless very close to end zone
    const inEndZoneCamping = (st.possession === 'player' && carrier.x > courtW - ezDepth) ||
                      (st.possession === 'opponent' && carrier.x < ezDepth);
    if (!inEndZoneCamping) {
      return { method: 'touch_bounce', target: { x: carrier.x, y: carrier.y } };
    }
  }

  // 2. Tackler threat: only consider disposal when actually being tackled
  // (tackledTicks > 0). This means the tackler is actively pressing the
  // carrier, not just nearby. This preserves the core "run and score" loop
  // while adding disposals as a pressure-release valve for real tackle
  // situations.
  let nearestEnemyDist = Infinity;
  for (const en of st.agents) {
    if (en.team !== carrier.team && en.status === 'active') {
      const d = distance(carrier.x, carrier.y, en.x, en.y);
      if (d < nearestEnemyDist) nearestEnemyDist = d;
    }
  }
  const tacklerPressure = carrier.tackledTicks > 0;

  // 3. Find open teammate for a pass
  const teammates = st.agents.filter(ag =>
    ag.team === carrier.team && ag.id !== carrier.id && ag.status === 'active',
  );

  if (tacklerPressure && teammates.length > 0) {
    // Under pressure — look for a handball target (short, fast).
    // ONLY handball to a teammate who is AHEAD (toward opponent end zone).
    // Handballing backward kills scoring momentum.
    let bestMate: Agent | null = null;
    let bestScore = -Infinity;
    for (const mate of teammates) {
      const d = distance(carrier.x, carrier.y, mate.x, mate.y);
      if (d > 18) continue; // Handball max range
      // Teammate must be ahead (toward opponent end zone)
      const isAhead = st.possession === 'player'
        ? mate.x > carrier.x
        : mate.x < carrier.x;
      if (!isAhead) continue;
      // Prefer teammates who are further ahead and open
      const aheadBonus = st.possession === 'player'
        ? (mate.x - carrier.x) * 0.5
        : (carrier.x - mate.x) * 0.5;
      // Check if any enemy is near the teammate (openness)
      let nearestEnemyToMate = Infinity;
      for (const en of st.agents) {
        if (en.team !== carrier.team && en.status === 'active') {
          const ed = distance(mate.x, mate.y, en.x, en.y);
          if (ed < nearestEnemyToMate) nearestEnemyToMate = ed;
        }
      }
      const openness = Math.min(nearestEnemyToMate, 10);
      const score = aheadBonus + openness - d * 0.3;
      if (score > bestScore) { bestScore = score; bestMate = mate; }
    }
    if (bestMate) {
      return { method: 'handball', target: { x: bestMate.x, y: bestMate.y } };
    }
  }

  // 4. Strategic kick: disabled by default. The carrier primarily runs
  // with the ball. Strategic kicks are too disruptive to the scoring flow
  // in MBB's small court. They can be re-enabled via config if desired.
  // (Kept as commented-out code for future tuning.)
  // if (!tacklerPressure && inBackHalf && st.prng() < 0.001) { ... }

  // 5. Under heavy pressure with no teammate — kick to space downfield
  // This is the pressure-release valve: if the tackler is right on top of
  // the carrier and no teammate is ahead for a handball, kick to space.
  if (tacklerPressure && nearestEnemyDist < m.tackle_range * 0.5) {
    const maxAdvance = 15;
    const targetX = st.possession === 'player'
      ? Math.min(courtW - ezDepth * 2, carrier.x + maxAdvance + st.prng() * 5)
      : Math.max(ezDepth * 2, carrier.x - maxAdvance - st.prng() * 5);
    const targetY = courtH * (0.2 + st.prng() * 0.6);
    return { method: 'kick', target: { x: targetX, y: targetY } };
  }

  return null; // Continue running with the ball
}
