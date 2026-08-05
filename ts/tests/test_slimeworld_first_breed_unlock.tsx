import { describe, expect, it } from 'vitest';
import { loadGame, call, getStaticList } from '../src/engine/runtime';
import { luaSlimeToTs, slimeToLua, stateToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';
import { buildColorSpecs, SEED_SHAPE_DEFAULTS, startingTargetRegentForColor, initialState } from '../src/games/slimeworld/App';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const colorTargets = getStaticList(session, 'color_targets') as Array<Record<string, unknown>>;
const shapeTargets = getStaticList(session, 'shape_targets') as Array<Record<string, unknown>>;
const accentTargets = getStaticList(session, 'accent_targets') as Array<Record<string, unknown>>;
const regionLocks = (data['region_locks'] ?? []) as Array<Record<string, unknown>>;
const colorSpecs = buildColorSpecs(data);

function makeStarter(color: SlimeColor, id: string, name: string): Slime {
  const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
  if (!raw) throw new Error(`create_seed_slime returned null for ${color}`);
  const lua = luaSlimeToTs(raw);
  const shapeDefaults = SEED_SHAPE_DEFAULTS[color];
  return {
    ...lua,
    id,
    name,
    diffusionRatio: lua.diffusionRatio || 20,
    amplitude: lua.amplitude || 40,
    accentHue: lua.accentHue || (color === 'Red' ? 0 : color === 'Yellow' ? 120 : 300),
    vertexCount: lua.vertexCount || shapeDefaults.vertexCount,
    irregularity: lua.irregularity || shapeDefaults.irregularity,
    createdAt: 1,
    stage: 'Hatchling',
  } as Slime;
}

function makeState(starters: Slime[], activeTargetRegent: string | null = null): LabState {
  const color = starters[0].color;
  return {
    cycle: 1,
    credits: 100,
    rosterCap: 10,
    breedingSuccessRateModifier: 0,
    slimes: starters,
    contracts: [],
    zones: [],
    activeDispatch: null,
    logs: [],
    activeMediation: null,
    activeExploration: null,
    planetRegion: generatePlanetRegion(),
    wildsUnlocked: false,
    hasAutoFeeder: false,
    colorRelationships: { Red: 50, Blue: 50, Yellow: 50, Purple: 50, Orange: 50, Green: 50, Gray: 50 },
    recentMarketSales: [],
    regentInventory: {},
    colorRegentInventory: {},
    targetRegentInventory: activeTargetRegent ? { [activeTargetRegent]: 1 } : {},
    favors: [],
    petitions: [],
    colorCodex: { [color]: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>,
    patternCodex: { Solid: { discovered: true }, Stripe: { discovered: false }, Polka: { discovered: false }, Glow: { discovered: false }, Crown: { discovered: false }, Ringed: { discovered: false }, Nebula: { discovered: false }, Obsidian: { discovered: false } },
    regionUnlocks: {},
    shownTutorials: {},
    startingColor: color,
    activeTargetRegent,
  } as LabState;
}

function breed(starters: Slime[], activeTargetRegent: string | null = null) {
  const state = makeState(starters, activeTargetRegent);
  const value = call(
    session,
    'initiate_breeding',
    stateToLua(state),
    starters[0].id,
    starters[1].id,
    0,
    colorTargets,
    activeTargetRegent,
    shapeTargets,
    null,
    colorSpecs,
    regionLocks,
    accentTargets,
  );
  return value as [Record<string, unknown> | null, string | null];
}

describe('First-breed region unlock', () => {
  it('diffusionRatio survives the TS to Lua bridge as diffusion_ratio', () => {
    const slime: Slime = makeStarter('Red', 'test_0', 'Test');
    slime.diffusionRatio = 25;
    const raw = slimeToLua(slime);
    expect(raw.diffusion_ratio).toBe(25);
    expect(raw.diffusionRatio).toBeUndefined();
  });

  it('without a target regent, same-color starter pairs do not unlock a region', () => {
    const colors: SlimeColor[] = ['Red', 'Blue', 'Yellow'];
    for (const color of colors) {
      const starters = [makeStarter(color, 'starter_0', 'Alpha'), makeStarter(color, 'starter_1', 'Beta')];
      const [raw, error] = breed(starters, null);
      expect(error).toBeNull();
      expect(raw).not.toBeNull();
      const regionUnlocks = (raw!['region_unlocks'] ?? []) as string[];
      expect(regionUnlocks.length).toBe(0);
    }
  });

  it('with the correct starting target regent, all three starting colors unlock on first breed', () => {
    const cases: Array<[SlimeColor, string, string]> = [
      ['Red', 'guild_ember_marsh', 'node_frontier_a'],
      ['Yellow', 'guild_marsh_gale', 'node_frontier_b'],
      ['Blue', 'guild_tide_ember', 'node_frontier_f'],
    ];

    for (const [color, targetId, expectedNode] of cases) {
      const starters = [makeStarter(color, 'starter_0', 'Alpha'), makeStarter(color, 'starter_1', 'Beta')];
      const [raw, error] = breed(starters, targetId);
      expect(error, `breeding error for ${color}: ${error}`).toBeNull();
      expect(raw, `breeding returned null for ${color}`).not.toBeNull();
      const regionUnlocks = (raw!['region_unlocks'] ?? []) as string[];
      expect(regionUnlocks, `expected ${color} to unlock ${expectedNode}, got ${regionUnlocks}`).toContain(expectedNode);
    }
  });

  it('startingTargetRegentForColor maps each starting color to its nearest frontier target', () => {
    expect(startingTargetRegentForColor('Red', data)).toBe('guild_ember_marsh');
    expect(startingTargetRegentForColor('Yellow', data)).toBe('guild_marsh_gale');
    expect(startingTargetRegentForColor('Blue', data)).toBe('guild_crystal_tide');
  });

  it('initialState seeds the target regent inventory for the chosen starting color', () => {
    const originalRandom = Math.random;
    try {
      const cases: Array<[number, SlimeColor, string]> = [
        [0, 'Red', 'guild_ember_marsh'],
        [0.5, 'Blue', 'guild_crystal_tide'],
        [0.99, 'Yellow', 'guild_marsh_gale'],
      ];

      for (const [seed, expectedColor, expectedTarget] of cases) {
        Math.random = () => seed;
        const state = initialState(session);
        expect(state.startingColor).toBe(expectedColor);
        expect(state.targetRegentInventory).toEqual({ [expectedTarget]: 1 });
      }
    } finally {
      Math.random = originalRandom;
    }
  });

  it('first-breed success rate is 100% across repeated rolls for all three colors', () => {
    const cases: Array<[SlimeColor, string]> = [
      ['Red', 'node_frontier_a'],
      ['Yellow', 'node_frontier_b'],
      ['Blue', 'node_frontier_e'],
    ];

    for (const [color, expectedNode] of cases) {
      let successes = 0;
      const iterations = 5;
      for (let i = 0; i < iterations; i++) {
        const starters = [
          makeStarter(color, `starter_0_${i}`, 'Alpha'),
          makeStarter(color, `starter_1_${i}`, 'Beta'),
        ];
        const targetId = startingTargetRegentForColor(color, data);
        const [raw, error] = breed(starters, targetId);
        expect(error, `iteration ${i} for ${color}: ${error}`).toBeNull();
        if (raw && (raw['region_unlocks'] as string[] ?? []).includes(expectedNode)) {
          successes++;
        }
      }
      expect(successes).toBe(iterations);
    }
  });
});
