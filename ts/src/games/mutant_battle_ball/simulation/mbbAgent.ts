// MBB Agent — entity creation, stat calculation, role assignment.
// Extracted from mbbSimulation.ts as part of module decomposition.
//
// All function bodies are byte-identical to the original monolith.

import type { Part, PartsBySlot } from '../../../engine/shared/partSlots';
import type { Mutant } from '../types';
import { getEffectivePartStats, rollMalfunctioningFailure } from '../brandModifiers';
import type { Ball } from '../../../engine/shared/sportsSim';
import { mapToPlayerStats, averageCyberOrganicLean } from '../statsMapper';
import { PART_SLOTS, Agent } from './mbbConfig';
import { dist2 } from './mbbMath';

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

export function makeAgent(mutant: Mutant | Record<string, unknown>, team: 'player' | 'opponent', idx: number, courtH: number, prng: () => number, teamSize: number = 2): Agent {
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
        const part = (parts as unknown as Record<string, Part | null>)[slot];
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
  // Compute sportsSim PlayerStats from MBB stats + cyber-organic lean
  const cyberLean = m.parts ? averageCyberOrganicLean(m.parts as Record<string, { cyberOrganicLean?: number } | null>) : undefined;
  const playerStats = mapToPlayerStats(stats, cyberLean);

  return {
    id: (m.id as string) || `${team}_${idx}`,
    name: (m.name as string) || 'Unknown',
    team,
    color: (m.color as string) || '#ffffff',
    x: team === 'player' ? 30 : 70,
    // Spread agents vertically across the court. For 2v2: 0.33 and 0.67.
    // For 6v6: evenly distributed at 1/7, 3/7, 5/7, 5/7, 3/7, 1/7 (mirrored).
    y: courtH * ((idx + 0.5) / (teamSize + 1)),
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
    // sportsSim integration fields
    playerStats,
    distanceCarriedWithoutTouch: 0,
    tackledTicks: 0,
    tackledByPlayerId: null,
    markProtectionTicks: 0,
    disposalCooldownTicks: 0,
    combatCooldownTicks: 0,
    statsMatch: {
      kicks: 0, handballs: 0, marks: 0, tackles: 0,
      hitsInflicted: 0, injuriesInflicted: 0, casualtiesCaused: 0,
      turnoversConceded: 0, goals: 0, distanceRun: 0,
    },
  };
}

export function assignRoles(agents: Agent[], possession: 'player' | 'opponent', ball: Ball): void {
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

export function getCarrier(agents: Agent[], ball: Ball): Agent | null {
  if (ball.state !== 'held' || !ball.carrierId) return null;
  for (const ag of agents) {
    if (ag.id === ball.carrierId && ag.status === 'active') return ag;
  }
  return null;
}

export function nearestEnemy(agent: Agent, agents: Agent[]): [Agent | null, number] {
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
