import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';
import { buildColorSpecs, SEED_SHAPE_DEFAULTS } from '../src/games/slimeworld/App';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const colorTargets = (data['color_targets'] ?? []) as Array<Record<string, unknown>>;
const shapeTargets = (data['shape_targets'] ?? []) as Array<Record<string, unknown>>;
const accentTargets = (data['accent_targets'] ?? []) as Array<Record<string, unknown>>;
const regionLocks = (data['region_locks'] ?? []) as Array<Record<string, unknown>>;
const colorSpecs = buildColorSpecs(data);

const rosterTabSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/RosterTab.tsx'),
  'utf8'
);

function makeStarter(color: SlimeColor, id: string, name: string, generation: number = 1): Slime {
  const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
  if (!raw) throw new Error(`create_seed_slime returned null for ${color}`);
  const lua = raw as Record<string, unknown>;
  const shapeDefaults = SEED_SHAPE_DEFAULTS[color];
  return {
    id, name, color, pattern: 'Solid',
    level: Number(lua['level'] ?? 1), xp: 0,
    stats: lua['stats'] as Slime['stats'],
    role: 'idle', generation,
    colorSaturation: 100, hue: Number(lua['hue'] ?? 0), saturation: Number(lua['saturation'] ?? 100),
    diffusionRatio: Number(lua['diffusion_ratio'] ?? 20),
    amplitude: Number(lua['amplitude'] ?? 40),
    accentHue: Number(lua['accent_hue'] ?? 0),
    vertexCount: Number(lua['vertex_count'] ?? shapeDefaults.vertexCount),
    irregularity: Number(lua['irregularity'] ?? shapeDefaults.irregularity),
    createdAt: 1, lockedRole: null, garrisonedAt: null, stage: 'Hatchling',
  };
}

function makeState(slimes: Slime[], credits: number): LabState {
  const color = slimes[0].color;
  return {
    cycle: 1, credits, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes, contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null,
    planetRegion: generatePlanetRegion(),
    wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: { Red: 50, Blue: 50, Yellow: 50, Purple: 50, Orange: 50, Green: 50, Gray: 50 } as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {},
    targetRegentInventory: {},
    petitions: [],
    colorCodex: { [color]: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>,
    patternCodex: { Solid: { discovered: true } },
    regionUnlocks: {},
    shownTutorials: {},
    startingColor: color,
  } as LabState;
}

describe('SlimeWorld compounding breeding tax UI surfacing', () => {
  // §3.7: Player sees the offspring generation and cost before committing to breed
  it('test_ui_shows_projected_cost_before_breed', () => {
    // Source-level: RosterTab computes offspringGeneration and cost via
    // calculate_breeding_cost, and surfaces both before the hatch button.
    expect(rosterTabSource).toContain('offspringGeneration');
    expect(rosterTabSource).toContain('calculate_breeding_cost');
    expect(rosterTabSource).toContain('prediction.generation');
    expect(rosterTabSource).toContain('prediction.cost');
    expect(rosterTabSource).toContain('prediction.canAfford');
    // The cost is shown with a "Gen N — M Credits" or "Free" label
    expect(rosterTabSource).toContain('Gen {prediction.generation}');
    // Insufficient funds shows a specific pre-commit warning, not just post-failure
    expect(rosterTabSource).toContain('Insufficient funds');
  });

  // §3.8: Clear, specific failure message on insufficient credits
  it('test_ui_shows_insufficient_funds_message', () => {
    // Bridge-level: breeding a generation-3 offspring with insufficient
    // credits returns a specific error naming the generation and cost.
    const color: SlimeColor = 'Red';
    const starters = [
      makeStarter(color, 'a', 'Alpha', 2),
      makeStarter(color, 'b', 'Beta', 1),
    ];
    const state = makeState(starters, 5);
    const [raw, error] = call(
      session,
      'initiate_breeding',
      stateToLua(state),
      'a', 'b', 0,
      colorTargets, null,
      shapeTargets, null,
      colorSpecs, regionLocks, accentTargets,
    ) as [Record<string, unknown> | null, string | null];

    expect(raw).toBeNull();
    expect(error).toBeTruthy();
    expect(String(error)).toMatch(/insufficient credits/i);
    expect(String(error)).toMatch(/generation 3/i);
    expect(String(error)).toMatch(/15 credits/i);
    expect(String(error)).toMatch(/need 10 more/i);
  });

  // Verify calculate_breeding_cost is callable from TS bridge and returns
  // the expected compounding values.
  it('test_calculate_breeding_cost_compounds_correctly', () => {
    const cases: Array<[number, number]> = [
      [1, 0],
      [2, 0],
      [3, 15],
      [4, 23],
      [5, 34],
      [6, 51],
    ];
    for (const [gen, expected] of cases) {
      const [cost] = call(session, 'calculate_breeding_cost', gen) as [number];
      expect(cost, `calculate_breeding_cost(${gen})`).toBe(expected);
    }
  });
});
