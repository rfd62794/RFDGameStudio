// Mutant Battle Ball — TS-Native Production Simulation
//
// Game-rules layer: FAITHFUL port of the post-fix logic.lua (commit cb86bf7),
// preserving possession, scoring, tackle detection, substitution, salvage,
// and both verified bug fixes:
//   - Re-fetch carrier before tackle block (stale-carrier self-tackle fix)
//   - Allow stunned agents to receive ball on score reset (ball-loss fix)
//
// Movement layer: DELIBERATELY REPLACED with real steering behaviors
// (seek, arrive, flee, interpose), adapted to MBB's court scale and 2v2
// role dynamics. Not copied from Shoal's reef-sim steering — Shoal's
// implementation was read as the real reference for the force-calculation
// and integration pattern, then MBB-specific behaviors were designed
// against MBB's actual roles (carrier/escort/tackler).
//
// The Lua source files remain in games/mutant_battle_ball/*.lua as
// reference, per studio precedent (CorpWorld, KingMaker Squads, Shoal).

import type { Part, PartSlot, PartsBySlot } from '../../../engine/shared/partSlots';
import type { Mutant, MatchAgent, MatchState } from '../types';
import { getEffectivePartStats, rollMalfunctioningFailure } from '../brandModifiers';
import type { Ball } from '../../../engine/shared/sportsSim';
import { BallSystem } from '../../../engine/shared/sportsSim';

// ── Config (from data.yaml match block) ──────────────────────────────

export const CONFIG = {
  match: {
    court_width: 100,
    court_height: 60,
    duration: 180,
    timeouts: 3,
    tackle_range: 6.0,
    block_range: 7.0,
    carrier_speed_mult: 0.85,
    tackle_stun_time: 1.2,
    end_zone_depth: 10,
    point_cap: 3,
  },
  // Steering tuning — MBB-specific, not Shoal's reef-sim numbers.
  // maxSpeed derives from each agent's speed stat (speed * 0.5, matching
  // the Lua base_spd formula). maxForce controls turn agility; set to
  // 2x maxSpeed so agents can redirect within ~0.5s without snapping.
  steering: {
    max_force_ratio: 2.0,       // maxForce = maxSpeed * ratio
    carrier_flee_radius: 20,    // flee tacklers within this range
    carrier_flee_weight: 1.2,   // evasion slightly outweighs pure seek
    carrier_seek_weight: 1.0,
    tackler_pursue_weight: 1.0,
    escort_interpose_weight: 1.0,
    escort_arrive_radius: 8,    // slow down near the blocking position
    drag: 0.92,                 // per-tick velocity retention (dt-scaled)
  },
};

const PART_SLOTS: PartSlot[] = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];

// ── Math helpers ─────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }
function dist2(ax: number, ay: number, bx: number, by: number): number { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function distance(ax: number, ay: number, bx: number, by: number): number { return Math.sqrt(dist2(ax, ay, bx, by)); }
function normalize(vx: number, vy: number): [number, number] { const m = Math.sqrt(vx * vx + vy * vy); if (m === 0) return [0, 0]; return [vx / m, vy / m]; }
function limitVector(vx: number, vy: number, max: number): [number, number] { const m2 = vx * vx + vy * vy; if (m2 > max * max) { const m = Math.sqrt(m2); return [(vx / m) * max, (vy / m) * max]; } return [vx, vy]; }

// ── LCG PRNG (deterministic, matching Lua math.random semantics) ────
// Lua: math.random() → [0,1); math.random(a,b) → integer in [a,b].

const LCG_MOD = 2147483648, LCG_MULT = 1103515245, LCG_INC = 12345;
const LCG_MULT_HI = Math.floor(LCG_MULT / 65536), LCG_MULT_LO = LCG_MULT % 65536;

function makePrng(seed: number): () => number {
  let s = seed;
  return () => { s = (((s * LCG_MULT_HI) % LCG_MOD) * 65536 + s * LCG_MULT_LO + LCG_INC) % LCG_MOD; return s / LCG_MOD; };
}
function prngFloat(prng: () => number, a: number, b: number): number { return a + prng() * (b - a); }
function prngInt(prng: () => number, a: number, b: number): number { return Math.floor(a + prng() * (b - a + 1)); }

// ── Steering forces ──────────────────────────────────────────────────
//
// Adapted from Shoal's real production pattern (forceSeek/forceArrive/
// forceFlee), with MBB-specific additions (forceInterpose for escort
// blocking — not present in Shoal's fish/shark set).

function forceSeek(x: number, y: number, tx: number, ty: number, weight: number, maxForce: number): [number, number] {
  const dx = tx - x, dy = ty - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [0, 0];
  return [(dx / dist) * weight * maxForce, (dy / dist) * weight * maxForce];
}

function forceArrive(x: number, y: number, vx: number, vy: number, tx: number, ty: number, weight: number, maxSpeed: number, maxForce: number, slowingRadius: number, minSpeed: number): [number, number] {
  const dx = tx - x, dy = ty - y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return [0, 0];
  let desiredSpeed = maxSpeed;
  if (dist < slowingRadius) {
    desiredSpeed = maxSpeed * (dist / slowingRadius);
    if (desiredSpeed < minSpeed) desiredSpeed = minSpeed;
  }
  return [((dx / dist) * desiredSpeed - vx) * weight, ((dy / dist) * desiredSpeed - vy) * weight];
}

function forceFlee(x: number, y: number, tx: number, ty: number, weight: number, maxForce: number, radiusSq: number): [number, number] {
  const dx = x - tx, dy = y - ty;
  const d2 = dx * dx + dy * dy;
  if (d2 === 0 || d2 > radiusSq) return [0, 0];
  const dist = Math.sqrt(d2);
  // Stronger repulsion as the threat gets closer (inverse-distance scaling)
  const intensity = 1 - (dist / Math.sqrt(radiusSq));
  return [(dx / dist) * weight * maxForce * intensity, (dy / dist) * weight * maxForce * intensity];
}

// Interpose: seek to the midpoint between two agents. This is the escort's
// blocking behavior — get between the carrier and the nearest tackler to
// intercept. NOT present in Shoal's fish/shark steering set.
function forceInterpose(x: number, y: number, vx: number, vy: number, ax: number, ay: number, bx: number, by: number, weight: number, maxSpeed: number, maxForce: number, slowingRadius: number): [number, number] {
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  return forceArrive(x, y, vx, vy, mx, my, weight, maxSpeed, maxForce, slowingRadius, 0);
}

// ── Entity types ─────────────────────────────────────────────────────

interface Agent {
  id: string;
  name: string;
  team: 'player' | 'opponent';
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  power: number;
  accuracy: number;
  endurance: number;
  health: number;
  maxHealth: number;
  role: 'carrier' | 'escort' | 'tackler' | 'inactive';
  status: 'active' | 'stunned' | 'down' | 'subbed';
  stunTimer: number;
  mutantId: string;
}

interface MatchConfig {
  match: typeof CONFIG.match;
}

interface MbbState {
  agents: Agent[];
  ball: Ball;
  possession: 'player' | 'opponent';
  scorePlayer: number;
  scoreOpponent: number;
  timeRemaining: number;
  timeoutsLeft: number;
  state: 'playing' | 'paused_sub' | 'timeout' | 'scored' | 'ended';
  events: Array<Record<string, unknown>>;
  config: MatchConfig;
  prng: () => number;
}

// ── Game rules (faithful port from post-fix logic.lua) ───────────────

export function calculateStats(mutant: { parts?: PartsBySlot | Record<string, Part | null> }): { accuracy: number; endurance: number; power: number; speed: number; maxHealth: number } {
  let acc = 0, end = 0, pow = 0, spd = 0;
  const parts = mutant.parts;
  if (parts) {
    for (const slot of PART_SLOTS) {
      const part = (parts as Record<string, Part | null>)[slot];
      if (part) {
        // Apply Brand / Quality Tier / Cyber-Organic modifiers per-part
        const effective = getEffectivePartStats(part);
        acc += effective.accuracy;
        end += effective.endurance;
        pow += effective.power;
        spd += effective.speed;
      }
    }
  }
  return { accuracy: acc, endurance: end, power: pow, speed: spd, maxHealth: Math.max(20, end) };
}

function makeAgent(mutant: Mutant | Record<string, unknown>, team: 'player' | 'opponent', idx: number, courtH: number, prng: () => number): Agent {
  const m = mutant as Record<string, unknown>;
  let stats: { accuracy: number; endurance: number; power: number; speed: number; maxHealth: number };
  if (m.accuracy !== undefined) {
    // Opponent format (flat stats)
    stats = {
      accuracy: m.accuracy as number,
      endurance: m.endurance as number,
      power: m.power as number,
      speed: m.speed as number,
      maxHealth: (m.max_health as number) || (m.endurance as number),
    };
  } else {
    stats = calculateStats({ parts: m.parts as PartsBySlot });
    // Malfunctioning failure roll: per Malfunctioning part, roll at match
    // start. If failed, that part's contribution is halved for the match.
    // This is the "live-risk state" — it works, but badly.
    const parts = m.parts as PartsBySlot | undefined;
    if (parts) {
      let malfunctionPenalty = 0;
      for (const slot of PART_SLOTS) {
        const part = (parts as Record<string, Part | null>)[slot];
        if (part && rollMalfunctioningFailure(part, prng)) {
          // Each failed malfunctioning part halves its effective stat
          // contribution. We approximate by reducing total stats by 1/6
          // per failed part (6 slots).
          malfunctionPenalty += 1 / PART_SLOTS.length;
        }
      }
      if (malfunctionPenalty > 0) {
        const mult = 1 - malfunctionPenalty * 0.5;
        stats = {
          accuracy: stats.accuracy * mult,
          endurance: stats.endurance * mult,
          power: stats.power * mult,
          speed: stats.speed * mult,
          maxHealth: stats.maxHealth * mult,
        };
      }
    }
  }
  return {
    id: (m.id as string) || `${team}_${idx}`,
    name: (m.name as string) || 'Unknown',
    team,
    color: (m.color as string) || '#ffffff',
    x: team === 'player' ? 30 : 70,
    y: courtH * (idx === 1 ? 0.35 : 0.65),
    vx: 0, vy: 0,
    speed: stats.speed,
    power: stats.power,
    accuracy: stats.accuracy,
    endurance: stats.endurance,
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    role: 'escort',
    status: 'active',
    stunTimer: 0,
    mutantId: (m.id as string) || `${team}_${idx}`,
  };
}

function assignRoles(agents: Agent[], possession: 'player' | 'opponent', ball: Ball): void {
  let carrierSet = false;
  for (const ag of agents) {
    if (ag.status !== 'active') {
      ag.role = 'inactive';
    } else if (ag.team === possession) {
      if (!carrierSet && ball.state === 'held' && ball.carrierId === ag.id) {
        ag.role = 'carrier';
        carrierSet = true;
      } else {
        ag.role = 'escort';
      }
    } else {
      ag.role = 'tackler';
    }
  }
}

function getCarrier(agents: Agent[], ball: Ball): Agent | null {
  if (ball.state !== 'held' || !ball.carrierId) return null;
  for (const ag of agents) {
    if (ag.id === ball.carrierId && ag.status === 'active') return ag;
  }
  return null;
}

function nearestEnemy(agent: Agent, agents: Agent[]): [Agent | null, number] {
  let best: Agent | null = null;
  let bestD2 = Infinity;
  for (const ag of agents) {
    if (ag.team !== agent.team && ag.status === 'active') {
      const d2 = dist2(agent.x, agent.y, ag.x, ag.y);
      if (d2 < bestD2) { bestD2 = d2; best = ag; }
    }
  }
  return [best, bestD2 === Infinity ? Infinity : Math.sqrt(bestD2)];
}

function resolveTackle(tackler: Agent, carrier: Agent, prng: () => number): 'possession_change' | 'wound' | 'fail' {
  const atk = prng() * tackler.power;
  const def = prng() * (carrier.endurance * 0.6 + carrier.accuracy * 0.4);
  if (atk > def) {
    const woundRoll = (tackler.power - carrier.endurance) / 100;
    if (prng() < Math.max(0, woundRoll)) return 'wound';
    return 'possession_change';
  }
  return 'fail';
}

function resolveBlock(escort: Agent, tackler: Agent, prng: () => number): 'block_success' | 'block_fail' {
  const atk = prng() * escort.power;
  const def = prng() * tackler.power;
  return atk > def ? 'block_success' : 'block_fail';
}

function applyWound(agent: Agent, woundType: 'limb_loss' | 'heavy', st: MbbState, prng: () => number): void {
  if (woundType === 'limb_loss') {
    agent.power = Math.max(5, agent.power - prngInt(prng, 8, 18));
    agent.speed = Math.max(5, agent.speed - prngInt(prng, 5, 12));
    st.events.push({ type: 'limb_loss', agent_id: agent.id, team: agent.team });
  } else {
    agent.health -= prngInt(prng, 15, 30);
  }
  if (agent.health <= 0) {
    agent.status = 'down';
    st.events.push({ type: 'agent_down', agent_id: agent.id, team: agent.team, fatal: prng() < 0.35 });
  }
}

// ── Movement (DELIBERATELY REPLACED with steering) ───────────────────
//
// The Lua movement was direct position-stepping toward a target point
// (move_toward). This replaces it with force-based steering: compute
// steering forces per role, sum, limit, integrate into velocity, then
// apply velocity to position. This produces smoother, more realistic
// pursuit and evasion — tacklers curve toward the carrier, carriers
// weave away from threats, escorts slide into blocking positions.

function computeAgentForces(ag: Agent, st: MbbState): [number, number] {
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

function moveAgent(ag: Agent, st: MbbState, dt: number): void {
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

// ── Tick (faithful game-rules port with both fixes) ──────────────────

function tickMatchInternal(st: MbbState, dt: number): MatchState {
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

  // Agent movement + stun recovery
  for (const ag of st.agents) {
    if (ag.status === 'stunned') {
      ag.stunTimer -= dt;
      if (ag.stunTimer <= 0) ag.status = 'active';
    } else if (ag.status === 'active') {
      moveAgent(ag, st, dt);
      if (ag.role === 'carrier') {
        // Ball tracks carrier position
        st.ball.pos.x = ag.x;
        st.ball.pos.y = ag.y;
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
      for (const ag of st.agents) {
        // A stunned agent is still in the play (it recovers); only a
        // downed agent is out. Requiring "active" here meant that if the
        // whole conceding team was stunned at the moment of the score the
        // ball was assigned to no one and permanently lost, stalling the
        // match.
        if (ag.team === st.possession && ag.status !== 'down' && !resetCarrier) {
          resetCarrier = ag;
        }
        ag.x = ag.team === 'player' ? 30 : 70;
        ag.y = courtH * (st.prng() * 0.4 + 0.3);
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
    for (const ag of st.agents) {
      if (ag.status === 'active' && ag.role === 'tackler') {
        const d = distance(ag.x, ag.y, carrier.x, carrier.y);

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

function buildMatchRenderState(st: MbbState): MatchState {
  return {
    agents: st.agents.map(ag => ({
      id: ag.id, name: ag.name, team: ag.team, color: ag.color,
      x: ag.x, y: ag.y, role: ag.role, status: ag.status,
      hasBall: st.ball.state === 'held' && st.ball.carrierId === ag.id,
      health: ag.health, maxHealth: ag.maxHealth,
    })),
    ballX: st.ball.pos.x,
    ballY: st.ball.pos.y,
    possession: st.possession,
    scorePlayer: st.scorePlayer,
    scoreOpponent: st.scoreOpponent,
    timeRemaining: st.timeRemaining,
    timeoutsLeft: st.timeoutsLeft,
    state: st.state,
    events: st.events,
  };
}

// ── Public API ───────────────────────────────────────────────────────

export interface MbbSimulation {
  initMatch(playerMutants: Mutant[], opponentMutants: Mutant[], config: MatchConfig, seed?: number): MatchState;
  tickMatch(dt: number): MatchState;
  callTimeout(): boolean;
  resumeMatch(): void;
  makeSubstitution(downedAgentId: string, benchMutant: Mutant): boolean;
  getState(): MbbState | null;
}

export function createMbbSimulation(): MbbSimulation {
  let st: MbbState | null = null;

  return {
    initMatch(playerMutants: Mutant[], opponentMutants: Mutant[], config: MatchConfig, seed?: number): MatchState {
      const m = config.match || CONFIG.match;
      const courtH = m.court_height || CONFIG.match.court_height;
      const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);
      const prng = makePrng(resolvedSeed);

      const agents: Agent[] = [
        makeAgent(playerMutants[0], 'player', 1, courtH, prng),
        makeAgent(playerMutants[1], 'player', 2, courtH, prng),
        makeAgent(opponentMutants[0], 'opponent', 1, courtH, prng),
        makeAgent(opponentMutants[1], 'opponent', 2, courtH, prng),
      ];

      // Create ball and assign to first player agent (initial carrier)
      const ball: Ball = {
        pos: { x: 30, y: courtH * 0.35 },
        velocity: { x: 0, y: 0 },
        height: 1.0,
        zVelocity: 0,
        state: 'held',
        carrierId: agents[0].id,
        lastCarrierId: agents[0].id,
        lastPossessionTeam: null,
        hangTimeRemaining: 0,
        totalHangTime: 0,
        bounceCount: 0,
        looseTicks: 0,
      };

      st = {
        agents,
        ball,
        possession: 'player',
        scorePlayer: 0,
        scoreOpponent: 0,
        timeRemaining: m.duration || CONFIG.match.duration,
        timeoutsLeft: m.timeouts || CONFIG.match.timeouts,
        state: 'playing',
        events: [],
        config,
        prng,
      };
      assignRoles(st.agents, st.possession, st.ball);
      return buildMatchRenderState(st);
    },

    tickMatch(dt: number): MatchState {
      if (!st) throw new Error('call initMatch first');
      return tickMatchInternal(st, dt);
    },

    callTimeout(): boolean {
      if (!st || st.timeoutsLeft <= 0) return false;
      st.timeoutsLeft--;
      st.state = 'timeout';
      return true;
    },

    resumeMatch(): void {
      if (st) st.state = 'playing';
    },

    makeSubstitution(downedAgentId: string, benchMutant: Mutant): boolean {
      if (!st) return false;
      const stats = calculateStats({ parts: benchMutant.parts });
      for (let i = 0; i < st.agents.length; i++) {
        const ag = st.agents[i];
        if (ag.id === downedAgentId) {
          const hadBall = st.ball.state === 'held' && st.ball.carrierId === ag.id;
          st.agents[i] = {
            id: benchMutant.id,
            name: benchMutant.name,
            team: 'player',
            color: benchMutant.color || '#3b82f6',
            x: ag.x, y: ag.y, vx: 0, vy: 0,
            speed: stats.speed, power: stats.power,
            accuracy: stats.accuracy, endurance: stats.endurance,
            health: stats.maxHealth, maxHealth: stats.maxHealth,
            role: ag.role, status: 'active',
            stunTimer: 0, mutantId: benchMutant.id,
          };
          // Update ball carrier reference if the subbed agent had the ball
          if (hadBall) {
            st.ball.carrierId = benchMutant.id;
          }
          st.state = 'playing';
          return true;
        }
      }
      return false;
    },

    getState(): MbbState | null {
      return st;
    },
  };
}

// ── Assemble mutant (faithful port, used by WorkshopTab via future wiring) ──

export function assembleMutant(
  name: string,
  color: string,
  partIds: Record<PartSlot, string>,
  partsCatalogue: Part[],
  prng: () => number
): { mutant: Mutant | null; error: string | null } {
  const parts: Partial<PartsBySlot> = {};
  const partsMap = new Map<string, Part>();
  for (const p of partsCatalogue) partsMap.set(p.id, p);
  for (const slot of PART_SLOTS) {
    const partId = partIds[slot];
    if (!partId) return { mutant: null, error: `Missing part for slot: ${slot}` };
    const part = partsMap.get(partId);
    if (!part) return { mutant: null, error: `Part not found: ${partId}` };
    parts[slot] = part;
  }
  return {
    mutant: {
      id: `mutant_${prngInt(prng, 100000, 999999)}`,
      name,
      color: color || '#6c8ef7',
      parts: parts as PartsBySlot,
      status: 'healthy',
      matchesPlayed: 0,
    },
    error: null,
  };
}

// Exported for testing
export { tickMatchInternal, buildMatchRenderState, makePrng, prngFloat, prngInt };
export type { Agent, MbbState, MatchConfig };
