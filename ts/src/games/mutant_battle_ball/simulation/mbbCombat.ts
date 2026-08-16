// MBB Combat — tackle/block resolution and wound application.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All function bodies are byte-identical to the original monolith.
// This is the Lua-parity combat layer — Part B will replace it with
// sportsSim's CombatSystem four-tier severity ladder.

import type { Agent, MbbState } from './mbbConfig';
import { prngInt } from './mbbMath';

export function resolveTackle(tackler: Agent, carrier: Agent, prng: () => number): 'possession_change' | 'wound' | 'fail' {
  const atk = prng() * tackler.power;
  const def = prng() * (carrier.endurance * 0.6 + carrier.accuracy * 0.4);
  if (atk > def) {
    const woundRoll = (tackler.power - carrier.endurance) / 100;
    if (prng() < Math.max(0, woundRoll)) return 'wound';
    return 'possession_change';
  }
  return 'fail';
}

export function resolveBlock(escort: Agent, tackler: Agent, prng: () => number): 'block_success' | 'block_fail' {
  const atk = prng() * escort.power;
  const def = prng() * tackler.power;
  return atk > def ? 'block_success' : 'block_fail';
}

export function applyWound(agent: Agent, woundType: 'limb_loss' | 'heavy', st: MbbState, prng: () => number): void {
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
