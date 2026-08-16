// MBB Render — match state rendering for UI consumption.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All function bodies are byte-identical to the original monolith.

import type { MatchState } from '../types';
import type { MbbState } from './mbbConfig';

export function buildMatchRenderState(st: MbbState): MatchState {
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
