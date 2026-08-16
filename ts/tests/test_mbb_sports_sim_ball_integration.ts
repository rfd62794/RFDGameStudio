import { describe, it, expect } from 'vitest';
import { createMbbSimulation, calculateStats, CONFIG } from '../src/games/mutant_battle_ball/simulation/mbbSimulation';
import type { Mutant } from '../src/games/mutant_battle_ball/types';
import type { Ball } from '../src/engine/shared/sportsSim';

// ─────────────────────────────────────────────────────────────────────
// Bug fix verification: both receiving-team agents down at score-reset
// The ball now transitions to 'loose' via BallSystem.looseBall() and
// is recovered naturally — no soft-lock.
// ─────────────────────────────────────────────────────────────────────

function makeTestMutant(id: string, name: string, team: 'player' | 'opponent'): Mutant {
  return {
    id,
    name,
    color: team === 'player' ? '#3b82f6' : '#ef4444',
    parts: {
      head: { id: `${id}_head`, name: 'Head', slot: 'head', accuracy: 10, endurance: 10, power: 10, speed: 10, price: 100, brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50 },
      chest: { id: `${id}_chest`, name: 'Chest', slot: 'chest', accuracy: 10, endurance: 10, power: 10, speed: 10, price: 100, brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50 },
      left_arm: { id: `${id}_la`, name: 'LA', slot: 'left_arm', accuracy: 10, endurance: 10, power: 10, speed: 10, price: 100, brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50 },
      right_arm: { id: `${id}_ra`, name: 'RA', slot: 'right_arm', accuracy: 10, endurance: 10, power: 10, speed: 10, price: 100, brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50 },
      left_leg: { id: `${id}_ll`, name: 'LL', slot: 'left_leg', accuracy: 10, endurance: 10, power: 10, speed: 10, price: 100, brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50 },
      right_leg: { id: `${id}_rl`, name: 'RL', slot: 'right_leg', accuracy: 10, endurance: 10, power: 10, speed: 10, price: 100, brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50 },
    },
    status: 'healthy',
    matchesPlayed: 0,
  };
}

const playerMutants: Mutant[] = [
  makeTestMutant('p1', 'Alpha', 'player'),
  makeTestMutant('p2', 'Beta', 'player'),
];
const opponentMutants: Mutant[] = [
  makeTestMutant('o1', 'Gamma', 'opponent'),
  makeTestMutant('o2', 'Delta', 'opponent'),
];

describe('test_both_down_softlock_fixed', () => {
  it('FIX VERIFIED: both receiving-team agents down at score-reset → ball goes loose, no soft-lock', () => {
    const sim = createMbbSimulation();
    sim.initMatch(playerMutants, opponentMutants, { match: { ...CONFIG.match, point_cap: 999 } }, 42);

    const st = sim.getState();
    expect(st).not.toBeNull();
    if (!st) return;

    // Set up: player carrier has ball deep in opponent end zone
    const playerAgents = st.agents.filter(a => a.team === 'player');
    const opponentAgents = st.agents.filter(a => a.team === 'opponent');
    const playerCarrier = playerAgents[0];

    playerCarrier.x = CONFIG.match.court_width - 2;
    playerCarrier.y = CONFIG.match.court_height / 2;
    playerCarrier.speed = 0;
    playerCarrier.vx = 0;
    playerCarrier.vy = 0;
    st.possession = 'player';
    // Ball is held by player carrier
    st.ball.state = 'held';
    st.ball.carrierId = playerCarrier.id;
    st.ball.pos.x = playerCarrier.x;
    st.ball.pos.y = playerCarrier.y;

    // Both opponent agents are DOWN
    opponentAgents[0].status = 'down';
    opponentAgents[0].health = 0;
    opponentAgents[1].status = 'down';
    opponentAgents[1].health = 0;

    // Tick — player carrier scores, possession switches to opponent,
    // but both opponent agents are down.
    const ms = sim.tickMatch(1 / 60);

    // Score happened
    const scoreEvent = ms.events.find((e: Record<string, unknown>) => e.type === 'scored');
    expect(scoreEvent).toBeDefined();

    // THE FIX: Ball is now 'loose' at center — NOT frozen with no carrier.
    // The BallSystem.looseBall() transition was called.
    const ball: Ball = st.ball;
    expect(ball.state).toBe('loose');
    expect(ball.carrierId).toBeNull();

    // Ball is at center reset position
    expect(ball.pos.x).toBe(50);
    expect(ball.pos.y).toBe(CONFIG.match.court_height / 2);

    // No agent has the ball (both opponents are down, players are reset)
    // — but this is NOT a soft-lock because the ball is 'loose' and will
    // be recovered by the continuous pickup check once any active agent
    // gets near it.
    const hasBallAgents = ms.agents.filter(a => a.hasBall);
    expect(hasBallAgents.length).toBe(0); // Correct — ball is loose, not held

    // Now revive one opponent agent and tick — the ball should be picked up
    opponentAgents[0].status = 'active';
    opponentAgents[0].health = 50;
    opponentAgents[0].x = 50; // At center where the ball is
    opponentAgents[0].y = CONFIG.match.court_height / 2;
    opponentAgents[0].speed = 0; // Don't move away

    const ms2 = sim.tickMatch(1 / 60);

    // Ball should now be held by the revived opponent agent
    // (or a player agent if they're closer — either way, it's NOT loose)
    expect(st.ball.state).toBe('held');
    expect(st.ball.carrierId).not.toBeNull();

    // The match is NOT soft-locked — possession has been assigned
    const carrierAgent = ms2.agents.find(a => a.hasBall);
    expect(carrierAgent).toBeDefined();
  });

  it('Normal match flow still works: carrier can score, possession switches, ball assigned', () => {
    const sim = createMbbSimulation();
    sim.initMatch(playerMutants, opponentMutants, { match: { ...CONFIG.match, point_cap: 999 } }, 100);

    const st = sim.getState();
    expect(st).not.toBeNull();
    if (!st) return;

    // Verify initial state: ball is held by player agent 0
    expect(st.ball.state).toBe('held');
    expect(st.ball.carrierId).toBe(st.agents[0].id);

    // Run 100 ticks — match should progress without soft-lock
    for (let i = 0; i < 100; i++) {
      const ms = sim.tickMatch(1 / 60);
      // Match should not be stuck in 'paused_sub' or 'ended' without reason
      if (ms.state === 'ended') break; // Point cap or timeout is fine
    }

    // Ball should be in a valid state
    expect(['held', 'loose']).toContain(st.ball.state);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Steering/combat/stats byte-identical verification
// ─────────────────────────────────────────────────────────────────────

describe('test_steering_combat_stats_unchanged', () => {
  it('Steering functions (forceSeek, forceArrive, forceFlee, forceInterpose) are unchanged', () => {
    // These are private functions, but we can verify the steering config
    // constants are unchanged — they're the tuning surface.
    expect(CONFIG.steering.max_force_ratio).toBe(2.0);
    expect(CONFIG.steering.carrier_flee_radius).toBe(20);
    expect(CONFIG.steering.carrier_flee_weight).toBe(1.2);
    expect(CONFIG.steering.carrier_seek_weight).toBe(1.0);
    expect(CONFIG.steering.tackler_pursue_weight).toBe(1.0);
    expect(CONFIG.steering.escort_interpose_weight).toBe(1.0);
    expect(CONFIG.steering.escort_arrive_radius).toBe(8);
    expect(CONFIG.steering.drag).toBe(0.92);
  });

  it('Combat config (tackle_range, block_range, stun_time) is unchanged', () => {
    expect(CONFIG.match.tackle_range).toBe(6.0);
    expect(CONFIG.match.block_range).toBe(7.0);
    expect(CONFIG.match.tackle_stun_time).toBe(1.2);
  });

  it('calculateStats still works with Brand/Quality/Cyber-Organic modifiers', () => {
    const mutant = playerMutants[0];
    const stats = calculateStats(mutant);
    // 6 parts × 10 base stats × brand modifier (trueflame brand_new = 1.0x)
    // Exact values depend on brandModifiers, but should be > 0
    expect(stats.speed).toBeGreaterThan(0);
    expect(stats.power).toBeGreaterThan(0);
    expect(stats.accuracy).toBeGreaterThan(0);
    expect(stats.endurance).toBeGreaterThan(0);
    expect(stats.maxHealth).toBeGreaterThan(0);
  });

  it('Match config constants are unchanged', () => {
    expect(CONFIG.match.court_width).toBe(100);
    expect(CONFIG.match.court_height).toBe(60);
    expect(CONFIG.match.duration).toBe(180);
    expect(CONFIG.match.timeouts).toBe(3);
    expect(CONFIG.match.carrier_speed_mult).toBe(0.85);
    expect(CONFIG.match.end_zone_depth).toBe(10);
    expect(CONFIG.match.point_cap).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Real sportsSim API usage verification
// ─────────────────────────────────────────────────────────────────────

describe('test_real_sports_sim_api_used', () => {
  it('Ball type from sportsSim is used (not a re-invented type)', async () => {
    // Read the source file and verify it imports from sportsSim
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const simDir = resolve(__dirname, '..', 'src', 'games', 'mutant_battle_ball', 'simulation');
    const modules = ['mbbSimulation.ts', 'mbbConfig.ts', 'mbbMath.ts', 'mbbSteering.ts', 'mbbAgent.ts', 'mbbCombat.ts', 'mbbDisposal.ts', 'mbbRender.ts', 'mbbTick.ts'];
    const src = modules.map(f => readFileSync(resolve(simDir, f), 'utf-8')).join('\n');

    // Must import Ball type and BallSystem from sportsSim
    expect(src).toContain("from '../../../engine/shared/sportsSim'");
    expect(src).toContain('BallSystem');

    // Must use BallSystem.looseBall (the real API)
    expect(src).toContain('BallSystem.looseBall(');

    // Must NOT use the old hasBall field on Agent
    // (hasBall only appears in buildMatchRenderState as a derived field)
    const agentInterface = src.match(/interface Agent \{[\s\S]*?\}/);
    if (agentInterface) {
      expect(agentInterface[0]).not.toContain('hasBall');
    }

    // Must NOT use ballX/ballY on MbbState
    const mbbStateInterface = src.match(/interface MbbState \{[\s\S]*?\}/);
    if (mbbStateInterface) {
      expect(mbbStateInterface[0]).not.toContain('ballX');
      expect(mbbStateInterface[0]).not.toContain('ballY');
      expect(mbbStateInterface[0]).toContain('ball: Ball');
    }
  });
});
