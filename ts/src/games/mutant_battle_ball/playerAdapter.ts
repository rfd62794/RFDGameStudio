/**
 * Player adapter: bridges MBB's Agent type to sportsSim's Player type.
 *
 * DisposalSystem (and later UniversalDecisionSystem, CombatSystem) operate
 * on Player objects. MBB's Agent has a different shape (x/y instead of pos,
 * 4 stats instead of 10, different status enum). This adapter creates a
 * Player view from an Agent and syncs mutated fields back after
 * DisposalSystem calls.
 *
 * This is an incremental bridge — the thin wrapper refactor (step 7 of
 * the full integration plan) will eventually align Agent with Player
 * directly, making this adapter unnecessary.
 */

import type { Player, PlayerStats, InjurySeverity, TeamSide } from '../../engine/shared/sportsSim';
import type { Agent } from './simulation/mbbSimulation';

/**
 * Creates a sportsSim Player object from an MBB Agent.
 * The Player object shares references to the Agent's stats and dynamic
 * state where possible, so mutations to those fields are reflected on
 * the Agent. Position and velocity are copied — call syncPlayerToAgent
 * after DisposalSystem calls to write them back.
 */
export function agentToPlayer(ag: Agent, playerStats: PlayerStats): Player {
  return {
    id: ag.id,
    name: ag.name,
    number: ag.team === 'player' ? 1 : 2, // MBB doesn't have jersey numbers
    team: ag.team === 'player' ? 'teamA' : 'teamB' as TeamSide,
    pos: { x: ag.x, y: ag.y },
    velocity: { x: ag.vx, y: ag.vy },
    targetPos: null,
    role: mapRoleToSportsSim(ag.role),
    stats: playerStats,
    stamina: ag.health / ag.maxHealth * 100, // Derive stamina from health
    injuryState: mapStatusToInjury(ag.status),
    stunTicksRemaining: ag.stunTimer * 20, // Convert seconds to ticks (20 tps)
    markProtectionTicks: ag.markProtectionTicks ?? 0,
    distanceCarriedWithoutTouch: ag.distanceCarriedWithoutTouch ?? 0,
    tackledTicks: ag.tackledTicks ?? 0,
    tackledByPlayerId: ag.tackledByPlayerId ?? null,
    markedOpponentId: null,
    statsMatch: ag.statsMatch ?? {
      kicks: 0, handballs: 0, marks: 0, tackles: 0,
      hitsInflicted: 0, injuriesInflicted: 0, casualtiesCaused: 0,
      turnoversConceded: 0, goals: 0, distanceRun: 0,
    },
  };
}

/**
 * Syncs mutated fields from a Player object back to the underlying Agent.
 * Called after DisposalSystem methods that mutate the Player.
 */
export function syncPlayerToAgent(player: Player, ag: Agent): void {
  ag.x = player.pos.x;
  ag.y = player.pos.y;
  ag.vx = player.velocity.x;
  ag.vy = player.velocity.y;
  ag.distanceCarriedWithoutTouch = player.distanceCarriedWithoutTouch;
  ag.tackledTicks = player.tackledTicks;
  ag.tackledByPlayerId = player.tackledByPlayerId;
  ag.markProtectionTicks = player.markProtectionTicks;
  ag.statsMatch = player.statsMatch;
  // Injury state sync
  ag.status = mapInjuryToStatus(player.injuryState, ag.status);
  ag.stunTimer = player.stunTicksRemaining / 20; // Convert ticks back to seconds
}

function mapRoleToSportsSim(role: Agent['role']): Player['role'] {
  switch (role) {
    case 'carrier': return 'carrier';
    case 'escort': return 'sweeper'; // Escort maps to sweeper (defensive support)
    case 'tackler': return 'chaser'; // Tackler maps to chaser (pursuit)
    case 'inactive': return 'sweeper'; // Inactive agents default to sweeper
  }
}

function mapStatusToInjury(status: Agent['status']): InjurySeverity {
  switch (status) {
    case 'active': return 'none';
    case 'stunned': return 'stunned';
    case 'down': return 'down';
    case 'subbed': return 'casualty'; // Subbed out = removed from play
  }
}

function mapInjuryToStatus(injury: InjurySeverity, current: Agent['status']): Agent['status'] {
  switch (injury) {
    case 'none': return 'active';
    case 'stunned': return 'stunned';
    case 'down': return 'down';
    case 'casualty': return current === 'subbed' ? 'subbed' : 'down';
    case 'fatal': return 'down'; // MBB doesn't have perma-death; fatal = down
    default: return current;
  }
}
