// MBB Combat — four-tier severity ladder via sportsSim's CombatSystem.
//
// This is a CONSCIOUS DEPARTURE from Lua parity. The original MBB combat
// (resolveTackle/resolveBlock/applyWound) was binary: possession change
// or wound. The real design intent was Blood Bowl's four-tier severity
// ladder (stunned → down → casualty → fatal) with genuine failed-violence
// consequences. This module replaces the Lua-parity combat with real calls
// into sportsSim's CombatSystem.
//
// The Lua source files remain as historical reference for MBB's pre-sportsSim
// combat, not the ongoing spec, from this point forward.

import type { Agent, MbbState } from './mbbConfig';
import { CONFIG } from './mbbConfig';
import { CombatSystem } from '../../../engine/shared/sportsSim';
import type { CombatResult, InjurySeverity } from '../../../engine/shared/sportsSim';
import { agentToPlayer, syncPlayerToAgent } from '../playerAdapter';

// ── Post-combat event emission ────────────────────────────────────────
//
// CombatSystem.executeAttack mutates the Player objects (injuryState,
// stunTicksRemaining, ball state). syncPlayerToAgent maps those back to
// Agent.status and Agent.stunTimer. This helper just pushes the MBB-
// specific events (agent_down for down/casualty/fatal) after the sync.

function emitSeverityEvents(agent: Agent, severity: InjurySeverity, st: MbbState): void {
  switch (severity) {
    case 'down':
      st.events.push({ type: 'agent_down', agent_id: agent.id, team: agent.team, fatal: false });
      break;
    case 'casualty':
      st.events.push({ type: 'agent_down', agent_id: agent.id, team: agent.team, fatal: false, severity: 'casualty' });
      break;
    case 'fatal':
      st.events.push({ type: 'agent_down', agent_id: agent.id, team: agent.team, fatal: true, severity: 'fatal' });
      break;
    // stunned: no agent_down event — agent recovers automatically
  }
}

// ── Tackle: tackler attacks carrier ──────────────────────────────────
//
// Replaces the old resolveTackle + applyWound. The tackler executes an
// attack on the carrier via CombatSystem. The result determines:
//   - hit_success: carrier takes severity damage, ball goes loose
//   - armor_held: carrier's armor absorbed the hit, no possession change
//   - attacker_blunder: tackler is stunned, turnover to carrier's team

export interface TackleResult {
  outcome: 'hit_success' | 'armor_held' | 'attacker_blunder';
  severity: InjurySeverity;
  possessionChange: boolean;  // Did possession change?
  newCarrierId: string | null; // Who has the ball now (if anyone)
  turnoverToTeam: 'player' | 'opponent' | null; // Turnover direction
}

export function executeTackle(
  tackler: Agent,
  carrier: Agent,
  st: MbbState,
): TackleResult {
  const tacklerPlayer = agentToPlayer(tackler, tackler.playerStats);
  const carrierPlayer = agentToPlayer(carrier, carrier.playerStats);

  const result: CombatResult = CombatSystem.executeAttack(
    tacklerPlayer,
    carrierPlayer,
    st.ball,
    CONFIG.combat,
    st.tickCount,
  );

  // Sync player state changes back to agents (maps injuryState → status)
  syncPlayerToAgent(tacklerPlayer, tackler);
  syncPlayerToAgent(carrierPlayer, carrier);

  // Push combat events to MBB event log
  for (const ev of result.events) {
    st.events.push({
      type: ev.type,
      agent_id: ev.primaryPlayerId,
      team: ev.team === 'teamA' ? 'player' : 'opponent',
      description: ev.description,
      severity: ev.severity,
      is_turnover: ev.isTurnover,
    });
  }

  if (result.outcome === 'hit_success') {
    // Carrier took severity damage — CombatSystem already called
    // BallSystem.looseBall if carrier had the ball. Sync already mapped
    // injuryState to agent.status. Just emit the MBB event.
    emitSeverityEvents(carrier, result.severity, st);
    // MBB-specific: the CombatSystem's loose-ball scatter direction is
    // biased away from the attacker (toward the tackler's end zone),
    // creating a systematic asymmetry. We override the scatter velocity
    // to be random (no directional bias), so the loose-ball recovery is
    // a fair contest. The four-tier severity ladder still applies to
    // the carrier.
    st.ball.state = 'loose';
    st.ball.carrierId = null;
    st.ball.lastCarrierId = carrier.id;
    st.ball.velocity = { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 };
    st.ball.height = 0;
    st.ball.looseTicks = 0;
    return {
      outcome: 'hit_success',
      severity: result.severity,
      possessionChange: true,
      newCarrierId: null, // Ball is loose — fair contest
      turnoverToTeam: null,
    };
  } else if (result.outcome === 'attacker_blunder') {
    // Tackler blundered — sync already set tackler.status = 'stunned'
    // Ball stays with carrier (CombatSystem only drops ball if attacker
    // had it, which the tackler didn't)
    return {
      outcome: 'attacker_blunder',
      severity: 'none',
      possessionChange: false,
      newCarrierId: st.ball.carrierId, // Carrier keeps the ball
      turnoverToTeam: carrier.team, // Turnover TO the carrier's team
    };
  }

  // armor_held — no damage, no possession change
  return {
    outcome: 'armor_held',
    severity: 'none',
    possessionChange: false,
    newCarrierId: st.ball.carrierId,
    turnoverToTeam: null,
  };
}

// ── Block: escort attacks tackler ─────────────────────────────────────
//
// Replaces the old resolveBlock. The escort executes an attack on the
// tackler via CombatSystem. This is the escort's intercept behavior —
// blocking the tackler before they reach the carrier.

export interface BlockResult {
  outcome: 'hit_success' | 'armor_held' | 'attacker_blunder';
  severity: InjurySeverity;
}

export function executeBlock(
  escort: Agent,
  tackler: Agent,
  st: MbbState,
): BlockResult {
  const escortPlayer = agentToPlayer(escort, escort.playerStats);
  const tacklerPlayer = agentToPlayer(tackler, tackler.playerStats);

  const result: CombatResult = CombatSystem.executeAttack(
    escortPlayer,
    tacklerPlayer,
    st.ball,
    CONFIG.combat,
    st.tickCount,
  );

  // Sync player state changes back to agents
  syncPlayerToAgent(escortPlayer, escort);
  syncPlayerToAgent(tacklerPlayer, tackler);

  // Push combat events to MBB event log
  for (const ev of result.events) {
    st.events.push({
      type: ev.type,
      agent_id: ev.primaryPlayerId,
      team: ev.team === 'teamA' ? 'player' : 'opponent',
      description: ev.description,
      severity: ev.severity,
      is_turnover: ev.isTurnover,
    });
  }

  // Emit MBB-specific events for down/casualty/fatal
  if (result.outcome === 'hit_success') {
    emitSeverityEvents(tackler, result.severity, st);
  } else if (result.outcome === 'attacker_blunder') {
    // Escort blundered — sync already set escort.status = 'stunned'
  }

  return {
    outcome: result.outcome,
    severity: result.severity,
  };
}

// ── Stun recovery ─────────────────────────────────────────────────────
//
// Called each tick for stunned agents. Decrements stun timer and
// restores to active when expired. Down/casualty/fatal agents don't
// recover (they're out of the match).

export function updateStunRecovery(agent: Agent, dt: number): void {
  if (agent.status === 'stunned') {
    agent.stunTimer -= dt;
    if (agent.stunTimer <= 0) {
      agent.status = 'active';
      agent.stunTimer = 0;
    }
  }
}
