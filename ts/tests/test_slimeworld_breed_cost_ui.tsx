import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';
import { buildColorSpecs, SEED_SHAPE_DEFAULTS, startingTargetRegentForColor } from '../src/games/slimeworld/App';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const colorTargets = (data['color_targets'] ?? []) as Array<Record<string, unknown>>;
const shapeTargets = (data['shape_targets'] ?? []) as Array<Record<string, unknown>>;
const accentTargets = (data['accent_targets'] ?? []) as Array<Record<string, unknown>>;
const regionLocks = (data['region_locks'] ?? []) as Array<Record<string, unknown>>;
const colorSpecs = buildColorSpecs(data);

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);
const rosterTabSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/RosterTab.tsx'),
  'utf8'
);

function makeStarter(color: SlimeColor, id: string, name: string): Slime {
  const [raw] = call(session, 'create_seed_slime', color, 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
  if (!raw) throw new Error(`create_seed_slime returned null for ${color}`);
  const lua = raw as Record<string, unknown>;
  const shapeDefaults = SEED_SHAPE_DEFAULTS[color];
  return {
    id, name, color, pattern: 'Solid',
    level: Number(lua['level'] ?? 1), xp: 0,
    stats: lua['stats'] as Slime['stats'],
    role: 'idle', generation: 0,
    colorSaturation: 100, hue: Number(lua['hue'] ?? 0), saturation: Number(lua['saturation'] ?? 100),
    diffusionRatio: Number(lua['diffusion_ratio'] ?? 20),
    amplitude: Number(lua['amplitude'] ?? 40),
    accentHue: Number(lua['accent_hue'] ?? 0),
    vertexCount: Number(lua['vertex_count'] ?? shapeDefaults.vertexCount),
    irregularity: Number(lua['irregularity'] ?? shapeDefaults.irregularity),
    createdAt: 1, lockedRole: null, garrisonedAt: null, stage: 'Hatchling',
  };
}

function makeState(color: SlimeColor): LabState {
  const activeTargetRegent = startingTargetRegentForColor(color, data);
  return {
    cycle: 1, credits: 0, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [], contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null,
    planetRegion: generatePlanetRegion(),
    wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: { Red: 50, Blue: 50, Yellow: 50, Purple: 50, Orange: 50, Green: 50, Gray: 50 } as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {},
    targetRegentInventory: { [activeTargetRegent]: 1 },
    petitions: [],
    colorCodex: { [color]: { discovered: true } } as Record<SlimeColor, { discovered: boolean }>,
    patternCodex: { Solid: { discovered: true } },
    regionUnlocks: {},
    shownTutorials: {},
    startingColor: color,
    hasReceivedFirstBreedReward: true,
  } as LabState;
}

describe('SlimeWorld breeding cost UI surfacing', () => {
  // §3.6: The breed UI already shows the flat cost pre-commit (reusing the
  // existing "Breeding Tax" display convention in RosterTab).
  it('test_ui_shows_breeding_cost_pre_commit', () => {
    expect(rosterTabSource).toContain('Breeding Tax:');
    expect(rosterTabSource).toContain('10 Credits');
  });

  // §3.6: A failed breed due to insufficient funds must surface the specific
  // Lua error message through the existing warning/ErrorBox path, not a
  // generic "Breeding failed" fallback.
  it('test_ui_shows_insufficient_funds_message', () => {
    // Source-level: handleInitiateBreeding passes the Lua error straight to
    // setWarning rather than substituting a generic string.
    const handlerMatch = appSource.match(/if \(!raw \|\| error\) \{ setWarning\(error \?\? 'Breeding failed\.'\);[\s\S]*?\}/);
    expect(handlerMatch).toBeTruthy();

    // Source-level: the warning is rendered through ErrorBox when present.
    expect(appSource).toContain('{warning && <ErrorBox message={warning} />}');

    // Bridge-level: the actual error from Lua names the cost and shortfall.
    const color: SlimeColor = 'Red';
    const state = makeState(color);
    const starters = [makeStarter(color, 'a', 'A'), makeStarter(color, 'b', 'B')];
    const [raw, error] = call(
      session,
      'initiate_breeding',
      stateToLua({ ...state, slimes: starters }),
      'a', 'b', 0, colorTargets, startingTargetRegentForColor(color, data),
      shapeTargets, null, colorSpecs, regionLocks, accentTargets,
    ) as [Record<string, unknown> | null, string | null];

    expect(raw).toBeNull();
    expect(error).toBeTruthy();
    expect(String(error)).toMatch(/insufficient credits/i);
    expect(String(error)).toMatch(/10 credits/i);
    expect(String(error)).toMatch(/need \d+ more/i);
  });
});
