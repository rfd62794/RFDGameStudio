import { describe, it, expect } from 'vitest';
import { createMbbSimulation, calculateStats, CONFIG } from '../src/games/mutant_battle_ball/simulation/mbbSimulation';
import type { Mutant } from '../src/games/mutant_battle_ball/types';

// ─────────────────────────────────────────────────────────────────────
// Bug reproduction: both receiving-team agents down at score-reset
// ─────────────────────────────────────────────────────────────────────

function makeTestMutant(id: string, name: string, team: 'player' | 'opponent'): Mutant {
  return {
    id,
    name,
    color: team === 'player' ? '#3b82f6' : '#ef4444',
    parts: {
      head: { id: `${id}_head`, name: 'Head', slot: 'head', brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50, baseStats: { accuracy: 10, endurance: 10, power: 10, speed: 10 } },
      chest: { id: `${id}_chest`, name: 'Chest', slot: 'chest', brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50, baseStats: { accuracy: 10, endurance: 10, power: 10, speed: 10 } },
      left_arm: { id: `${id}_la`, name: 'LA', slot: 'left_arm', brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50, baseStats: { accuracy: 10, endurance: 10, power: 10, speed: 10 } },
      right_arm: { id: `${id}_ra`, name: 'RA', slot: 'right_arm', brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50, baseStats: { accuracy: 10, endurance: 10, power: 10, speed: 10 } },
      left_leg: { id: `${id}_ll`, name: 'LL', slot: 'left_leg', brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50, baseStats: { accuracy: 10, endurance: 10, power: 10, speed: 10 } },
      right_leg: { id: `${id}_rl`, name: 'RL', slot: 'right_leg', brand: 'trueflame', qualityTier: 'brand_new', cyberOrganicLean: 50, baseStats: { accuracy: 10, endurance: 10, power: 10, speed: 10 } },
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

describe('test_both_down_softlock_reproduction', () => {
  it('CONFIRMS BUG (pre-fix): both receiving-team agents down at score-reset → no carrier, ball frozen', () => {
    const sim = createMbbSimulation();
    sim.initMatch(playerMutants, opponentMutants, { match: { ...CONFIG.match, point_cap: 999 } }, 42);

    // Get internal state to manipulate agents directly
    const st = sim.getState();
    expect(st).not.toBeNull();
    if (!st) return;

    // Simulate the scenario: player team scores, possession switches to
    // opponent (the receiving/conceding team), but BOTH opponent agents
    // are 'down' at the moment of the score reset.
    //
    // Force the scenario:
    // 1. Give the ball to a player carrier near the end zone
    const playerAgents = st.agents.filter(a => a.team === 'player');
    const opponentAgents = st.agents.filter(a => a.team === 'opponent');
    const playerCarrier = playerAgents[0];

    // Set up: player carrier has ball near opponent end zone
    playerCarrier.hasBall = true;
    playerCarrier.x = CONFIG.match.court_width - 2; // Deep in end zone
    playerCarrier.y = CONFIG.match.court_height / 2;
    playerCarrier.speed = 0; // Prevent movement during tick
    playerCarrier.vx = 0;
    playerCarrier.vy = 0;
    st.possession = 'player';
    st.ballX = playerCarrier.x;
    st.ballY = playerCarrier.y;

    // Both opponent agents are DOWN
    opponentAgents[0].status = 'down';
    opponentAgents[0].health = 0;
    opponentAgents[1].status = 'down';
    opponentAgents[1].health = 0;

    // Now tick — player carrier should score, possession switches to
    // opponent, but both opponent agents are down → no carrier assigned
    const ms = sim.tickMatch(1 / 60);

    // Check: did the score happen?
    const scoreEvent = ms.events.find((e: Record<string, unknown>) => e.type === 'scored');
    expect(scoreEvent).toBeDefined();

    // THE BUG: After the score, possession switched to 'opponent', but
    // no opponent agent has the ball (both are down). The ball is frozen
    // at center (50, 30) with no carrier.
    //
    // Verify the bug exists:
    const opponentAgentsPost = ms.agents.filter(a => a.team === 'opponent');
    const hasBallAgents = opponentAgentsPost.filter(a => a.hasBall);
    expect(hasBallAgents.length).toBe(0); // BUG: no one has the ball

    // Ball is at center reset position
    expect(ms.ballX).toBe(50);
    expect(ms.ballY).toBe(CONFIG.match.court_height / 2);

    // No carrier exists — the match will soft-lock from this point
    const anyCarrier = ms.agents.find(a => a.hasBall);
    expect(anyCarrier).toBeUndefined(); // BUG CONFIRMED: no carrier
  });
});
