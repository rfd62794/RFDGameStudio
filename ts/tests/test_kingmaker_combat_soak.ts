// @vitest-environment node
// new: ts/tests/test_kingmaker_combat_soak.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { simulateCombat } from '../../examples/kingmaker-squads/src/utils/combatEngine';
import { createUnit } from '../../examples/kingmaker-squads/src/data/archetypes';
import type { UnitArchetype, UnitState } from '../../examples/kingmaker-squads/src/types';

const ARCHETYPES: UnitArchetype[] = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
const RANKS = ['recruit', 'veteran', 'elite'] as const;
type Rank = (typeof RANKS)[number];

/** Small seeded generator so every run of this file plays the same fights (combat uses Math.random for initiative, heals and crits). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function squad(archetype: UnitArchetype, size: number, rank: Rank): UnitState[] {
  return Array.from({ length: size }, (_, i) => createUnit(archetype, `${archetype}-${rank}-${i}`, rank));
}

/** Every archetype pairing at every rank, in squads of 1, 3 and 5. */
function allMatchups(): Array<{ label: string; player: UnitState[]; enemy: UnitState[] }> {
  const out: Array<{ label: string; player: UnitState[]; enemy: UnitState[] }> = [];
  for (const a of ARCHETYPES) {
    for (const b of ARCHETYPES) {
      for (const rank of RANKS) {
        for (const size of [1, 3, 5]) {
          out.push({ label: `${size}x ${rank} ${a} vs ${size}x ${rank} ${b}`, player: squad(a, size, rank), enemy: squad(b, size, rank) });
        }
      }
    }
  }
  return out;
}

describe('test_kingmaker_combat_soak', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a lone recruit pawn against a lone recruit bishop ends instead of looping forever (regression)', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(1));
    const result = simulateCombat(squad('pawn', 1, 'recruit'), squad('bishop', 1, 'recruit'));
    expect(['player', 'enemy']).toContain(result.winner);
    expect(result.frames.length).toBeGreaterThan(0);
  });

  it('every matchup ends with a winner who has a survivor (no softlock)', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(7));
    for (const m of allMatchups()) {
      const result = simulateCombat(m.player, m.enemy);
      expect(['player', 'enemy'], m.label).toContain(result.winner);
      const winners = result.winner === 'player' ? result.playerSurvivors : result.enemySurvivors;
      expect(winners.length, `${m.label}: winner has no survivors`).toBeGreaterThan(0);
      expect(result.frames.length, `${m.label}: no frames recorded`).toBeGreaterThan(0);
    }
  });

  it('both outcomes are reachable: some matchups go to the player and some to the enemy', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(11));
    const winners = new Set(allMatchups().map((m) => simulateCombat(m.player, m.enemy).winner));
    expect(winners.has('player')).toBe(true);
    expect(winners.has('enemy')).toBe(true);
  });

  it('a higher rank beats an equal squad of a lower rank for every archetype', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(3));
    for (const a of ARCHETYPES) {
      const result = simulateCombat(squad(a, 3, 'elite'), squad(a, 3, 'recruit'));
      expect(result.winner, `elite ${a} vs recruit ${a}`).toBe('player');
    }
  });
});
