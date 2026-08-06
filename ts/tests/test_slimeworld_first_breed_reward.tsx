import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';
import { buildColorSpecs, startingTargetRegentForColor, SEED_SHAPE_DEFAULTS } from '../src/games/slimeworld/App';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const colorTargets = (data['color_targets'] ?? []) as Array<Record<string, unknown>>;
const shapeTargets = (data['shape_targets'] ?? []) as Array<Record<string, unknown>>;
const accentTargets = (data['accent_targets'] ?? []) as Array<Record<string, unknown>>;
const regionLocks = (data['region_locks'] ?? []) as Array<Record<string, unknown>>;
const colorSpecs = buildColorSpecs(data);

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

function makeStarter(color: SlimeColor, id: string, name: string): Slime {
  const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
  if (!raw) throw new Error(`create_seed_slime returned null for ${color}`);
  const lua = raw as Record<string, unknown>;
  const shapeDefaults = SEED_SHAPE_DEFAULTS[color];
  return {
    id,
    name,
    color,
    pattern: 'Solid',
    level: Number(lua['level'] ?? 1),
    xp: 0,
    stats: lua['stats'] as Slime['stats'],
    role: 'idle',
    generation: 0,
    colorSaturation: 100,
    hue: Number(lua['hue'] ?? 0),
    saturation: Number(lua['saturation'] ?? 100),
    diffusionRatio: Number(lua['diffusion_ratio'] ?? 20),
    amplitude: Number(lua['amplitude'] ?? 40),
    accentHue: Number(lua['accent_hue'] ?? 0),
    vertexCount: Number(lua['vertex_count'] ?? shapeDefaults.vertexCount),
    irregularity: Number(lua['irregularity'] ?? shapeDefaults.irregularity),
    createdAt: 1,
    lockedRole: null,
    garrisonedAt: null,
    stage: 'Hatchling',
  };
}

function makeState(startingColor: SlimeColor, activeTargetRegent: string): LabState {
  return {
    cycle: 1,
    credits: 100,
    rosterCap: 10,
    breedingSuccessRateModifier: 0,
    slimes: [],
    contracts: [],
    zones: [],
    activeDispatch: null,
    logs: [],
    activeMediation: null,
    activeExploration: null,
    planetRegion: generatePlanetRegion(),
    wildsUnlocked: false,
    hasAutoFeeder: false,
    colorRelationships: { Red: 50, Blue: 50, Yellow: 50, Purple: 50, Orange: 50, Green: 50, Gray: 50 } as Record<SlimeColor, number>,
    recentMarketSales: [],
    regentInventory: {},
    colorRegentInventory: {},
    targetRegentInventory: { [activeTargetRegent]: 1 },
    petitions: [],
    colorCodex: { [startingColor]: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>,
    patternCodex: { Solid: { discovered: true } },
    regionUnlocks: {},
    shownTutorials: {},
    startingColor,
  } as LabState;
}

describe('SlimeWorld post-first-breed reward', () => {
  it('test_post_first_breed_reward_grants_two_strays_matching_starting_color', () => {
    const cases: Array<[SlimeColor, string]> = [
      ['Red', startingTargetRegentForColor('Red', data)],
      ['Blue', startingTargetRegentForColor('Blue', data)],
      ['Yellow', startingTargetRegentForColor('Yellow', data)],
    ];

    for (const [color, targetRegent] of cases) {
      const state = makeState(color, targetRegent);
      const starters = [makeStarter(color, 'a', 'A'), makeStarter(color, 'b', 'B')];
      const [raw, error] = luaResult(
        call(
          session,
          'initiate_breeding',
          stateToLua({ ...state, slimes: starters }),
          'a',
          'b',
          0,
          colorTargets,
          targetRegent,
          shapeTargets,
          null,
          colorSpecs,
          regionLocks,
          accentTargets,
        )
      );
      expect(error, `breeding error for ${color}: ${error}`).toBeNull();
      expect(raw, `breeding returned null for ${color}`).not.toBeNull();

      const addedStrays = (raw!['added_strays'] ?? []) as Record<string, unknown>[];
      expect(addedStrays.length, `${color}: expected 2 added strays`).toBe(2);
      for (const stray of addedStrays) {
        expect(stray['color']).toBe(color);
      }
    }
  });

  it('test_post_first_breed_reward_fires_exactly_once', () => {
    const color: SlimeColor = 'Red';
    const targetRegent = startingTargetRegentForColor(color, data);
    const state = makeState(color, targetRegent);
    const starters = [makeStarter(color, 'a', 'A'), makeStarter(color, 'b', 'B')];

    const first = luaResult(
      call(
        session,
        'initiate_breeding',
        stateToLua({ ...state, slimes: starters }),
        'a',
        'b',
        0,
        colorTargets,
        targetRegent,
        shapeTargets,
        null,
        colorSpecs,
        regionLocks,
        accentTargets,
      )
    );
    expect(first[1]).toBeNull();
    expect(first[0]).not.toBeNull();
    const firstStrays = (first[0]!['added_strays'] ?? []) as Record<string, unknown>[];
    expect(firstStrays.length).toBe(2);

    // Second breed on the same state (now flagged) must produce zero new strays.
    const childSlime = first[0]! as Record<string, unknown>;
    const secondStarters = [
      { ...makeStarter(color, 'c', 'C'), hue: childSlime['hue'], saturation: childSlime['saturation'], vertexCount: childSlime['vertex_count'], irregularity: childSlime['irregularity'], diffusionRatio: childSlime['diffusion_ratio'], amplitude: childSlime['amplitude'] } as Slime,
      makeStarter(color, 'd', 'D'),
    ];
    const secondState = stateToLua({
      ...state,
      slimes: [secondStarters[0], secondStarters[1]],
      has_received_first_breed_reward: true,
    });
    const second = luaResult(
      call(
        session,
        'initiate_breeding',
        secondState,
        'c',
        'd',
        0,
        colorTargets,
        targetRegent,
        shapeTargets,
        null,
        colorSpecs,
        regionLocks,
        accentTargets,
      )
    );
    expect(second[1]).toBeNull();
    expect(second[0]).not.toBeNull();
    const secondStrays = (second[0]!['added_strays'] ?? []) as Record<string, unknown>[];
    expect(secondStrays.length).toBe(0);
  });
});
