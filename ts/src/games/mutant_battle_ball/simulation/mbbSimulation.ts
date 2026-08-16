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
//
// Module decomposition (Part A): the monolith has been split into:
//   mbbConfig.ts    — CONFIG, types (Agent, MbbState, MatchConfig)
//   mbbMath.ts      — math helpers, LCG PRNG
//   mbbSteering.ts  — forceSeek, forceArrive, forceFlee, forceInterpose
//   mbbAgent.ts     — calculateStats, makeAgent, assignRoles, getCarrier, nearestEnemy
//   mbbCombat.ts    — resolveTackle, resolveBlock, applyWound
//   mbbDisposal.ts  — computeAgentForces, moveAgent, decideDisposal
//   mbbRender.ts    — buildMatchRenderState
//   mbbTick.ts      — tickMatchInternal
// This file is the factory + public API entry point only.

import type { Part, PartSlot, PartsBySlot } from '../../../engine/shared/partSlots';
import type { Mutant, MatchState } from '../types';
import type { Ball } from '../../../engine/shared/sportsSim';
import { mapToPlayerStats, averageCyberOrganicLean } from '../statsMapper';

import { CONFIG, PART_SLOTS, Agent, MbbState, MatchConfig } from './mbbConfig';
import { makePrng, prngInt } from './mbbMath';
import { calculateStats, makeAgent, assignRoles } from './mbbAgent';
import { buildMatchRenderState } from './mbbRender';
import { tickMatchInternal } from './mbbTick';

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
      const teamSize = m.team_size || CONFIG.match.team_size;
      const resolvedSeed = seed ?? Math.floor(Math.random() * 2147483647);
      const prng = makePrng(resolvedSeed);

      // Build agents for configurable roster size (2v2 or 6v6)
      const agents: Agent[] = [];
      for (let i = 0; i < teamSize; i++) {
        agents.push(makeAgent(playerMutants[i], 'player', i + 1, courtH, prng, teamSize));
      }
      for (let i = 0; i < teamSize; i++) {
        agents.push(makeAgent(opponentMutants[i], 'opponent', i + 1, courtH, prng, teamSize));
      }

      // Create ball and assign to first player agent (initial carrier)
      const ball: Ball = {
        pos: { x: agents[0].x, y: agents[0].y },
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
        tickCount: 0,
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
          const cyberLean = benchMutant.parts ? averageCyberOrganicLean(benchMutant.parts as unknown as Record<string, { cyberOrganicLean?: number } | null>) : undefined;
          const playerStats = mapToPlayerStats(stats, cyberLean);
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
            playerStats,
            distanceCarriedWithoutTouch: 0,
            tackledTicks: 0,
            tackledByPlayerId: null,
            markProtectionTicks: 0,
            disposalCooldownTicks: 0,
            combatCooldownTicks: 0,
            statsMatch: ag.statsMatch, // Preserve match stats from subbed agent
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

// Re-exports for backward compatibility (tests and consumers import from here)
export { CONFIG, PART_SLOTS } from './mbbConfig';
export { calculateStats } from './mbbAgent';
export { makePrng, prngFloat, prngInt } from './mbbMath';
export { tickMatchInternal } from './mbbTick';
export { buildMatchRenderState } from './mbbRender';
export type { Agent, MbbState, MatchConfig } from './mbbConfig';
