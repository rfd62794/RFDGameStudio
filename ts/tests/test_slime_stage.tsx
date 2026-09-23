import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua,
  luaSlimeToTs,
  type LabState,
  type Slime,
  type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

function buildColorSpecs(data: Record<string, unknown>): Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> {
  const specs: Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> = {};
  const cultures = data['cultures'] as Record<string, Record<string, unknown>>;
  if (cultures) {
    for (const key of Object.keys(cultures)) {
      const c = cultures[key];
      const color = c['color'] as string;
      specs[color] = { base_stats: c['base_stats'] as Record<string, number>, growth: c['growth'] as Record<string, number> };
    }
  }
  const neutralTraits = data['neutral_traits'] as Record<string, Record<string, unknown>>;
  if (neutralTraits) {
    const gray = neutralTraits['gray'];
    if (gray) specs['Gray'] = { base_stats: gray['base_stats'] as Record<string, number>, growth: gray['growth'] as Record<string, number> };
  }
  return specs;
}

const colorSpecs = buildColorSpecs(session.files.data as Record<string, unknown>);

function makeSlime(id: string, createdAt: number, stage: Slime['stage'] = undefined): Slime {
  return {
    id, name: `Slime-${id}`, color: 'Red', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt, lockedRole: null, garrisonedAt: null, stage,
  };
}

function makeState(overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [makeSlime('s1', 0)],
    contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    ...overrides,
  };
}

describe('Stage — compute_stage formula, via the real Lua bridge (not a mock)', () => {
  it('test_compute_stage_hatchling_at_zero_cycles', () => {
    const [stage] = call(session, 'compute_stage', 0, 0);
    expect(stage).toBe('Hatchling');
  });

  it('test_compute_stage_boundary_transitions', () => {
    // Thresholds: Hatchling=0, Juvenile=5, Young=15, Prime=30, Veteran=60, Elder=100
    const cases: Array<[number, string]> = [
      [4, 'Hatchling'], [5, 'Juvenile'],
      [14, 'Juvenile'], [15, 'Young'],
      [29, 'Young'], [30, 'Prime'],
      [59, 'Prime'], [60, 'Veteran'],
      [99, 'Veteran'], [100, 'Elder'],
    ];
    for (const [cyclesAlive, expected] of cases) {
      const [stage] = call(session, 'compute_stage', cyclesAlive, 0);
      expect(stage).toBe(expected);
    }
  });

  it('test_compute_stage_elder_at_max', () => {
    const [stage] = call(session, 'compute_stage', 100000, 0);
    expect(stage).toBe('Elder');
  });

  it('test_stage_updates_live_through_real_bridge', () => {
    // Real, mandatory anchor: full LabState -> stateToLua -> advance_cycle
    // -> luaSlimeToTs round trip. Not a Lua-only construction.
    const state = makeState({
      cycle: 59,
      slimes: [makeSlime('s1', 0)], // created at cycle 0; state.cycle will become 60 after advance_cycle
    });
    const luaState = stateToLua(state);
    const [raw] = call(session, 'advance_cycle', luaState, colorSpecs);
    expect(raw).toBeTruthy();
    const result = raw as Record<string, unknown>;
    const slimes = result['slimes'] as Array<Record<string, unknown>>;
    const s1raw = slimes.find(s => s['id'] === 's1');
    expect(s1raw).toBeTruthy();

    const s1 = luaSlimeToTs(s1raw!);
    // cycle became 60 (59 + 1), created_at = 0 -> cycles_alive = 60 -> Veteran
    expect(s1.stage).toBe('Veteran');
  });

  it('test_stage_bug_reintroduction_sanity_check', () => {
    // Sanity check per directive: if Stage were derived from Level instead
    // of cycles-in-service, a level-5 slime with zero cycles in service
    // would NOT be Hatchling. Confirm the real fix ties Stage to cycles,
    // not level — a slime with high level but freshly created must still
    // read Hatchling.
    const state = makeState({
      cycle: 0,
      slimes: [{ ...makeSlime('s1', 0), level: 50 }],
    });
    const luaState = stateToLua(state);
    const [raw] = call(session, 'advance_cycle', luaState, colorSpecs);
    const result = raw as Record<string, unknown>;
    const slimes = result['slimes'] as Array<Record<string, unknown>>;
    const s1 = luaSlimeToTs(slimes.find(s => s['id'] === 's1')!);
    // cycle becomes 1, created_at = 0 -> cycles_alive = 1 -> still Hatchling
    // despite level 50 — proves Stage is cycle-driven, not level-driven.
    expect(s1.stage).toBe('Hatchling');
  });
});

describe('Elder Breeding Tax — 0.85x on offspring stats, via the real Lua bridge', () => {
  it('test_elder_breeding_tax_applies_only_at_elder', () => {
    // Control: neither parent Elder -> untaxed stats
    const [untaxedChild] = call(
      session, 'initiate_breeding',
      { slimes: [
          { id: 'pa', color: 'Red', hue: 0, saturation: 100, level: 5, generation: 0, pattern: 'Solid', stage: 'Prime', vertex_count: 4, irregularity: 10, diffusion_ratio: 20, amplitude: 40 },
          { id: 'pb', color: 'Blue', hue: 300, saturation: 100, level: 5, generation: 0, pattern: 'Solid', stage: 'Prime', vertex_count: 4, irregularity: 10, diffusion_ratio: 20, amplitude: 40 },
        ], cycle: 1, credits: 1000, roster_cap: 10 },
      'pa', 'pb', 0, {}, null, {}, null, colorSpecs,
    ) as [Record<string, unknown> | null, string | null];
    expect(untaxedChild).toBeTruthy();
    const untaxedStats = untaxedChild!['stats'] as Record<string, number>;

    // Elder parent -> taxed stats (0.85x of the same formula output)
    const [taxedChild] = call(
      session, 'initiate_breeding',
      { slimes: [
          { id: 'pa', color: 'Red', hue: 0, saturation: 100, level: 5, generation: 0, pattern: 'Solid', stage: 'Elder', vertex_count: 4, irregularity: 10, diffusion_ratio: 20, amplitude: 40 },
          { id: 'pb', color: 'Blue', hue: 300, saturation: 100, level: 5, generation: 0, pattern: 'Solid', stage: 'Prime', vertex_count: 4, irregularity: 10, diffusion_ratio: 20, amplitude: 40 },
        ], cycle: 1, credits: 1000, roster_cap: 10 },
      'pa', 'pb', 0, {}, null, {}, null, colorSpecs,
    ) as [Record<string, unknown> | null, string | null];
    expect(taxedChild).toBeTruthy();
    const taxedStats = taxedChild!['stats'] as Record<string, number>;

    // Same parent genetics (symmetric hue/saturation) -> pre-tax stats would
    // be identical; taxed child's stats must be strictly lower.
    expect(taxedStats['hp']).toBeLessThan(untaxedStats['hp']);
    expect(taxedStats['hp']).toBe(Math.floor(untaxedStats['hp'] * 0.85));
    expect(taxedStats['atk']).toBe(Math.floor(untaxedStats['atk'] * 0.85));
  });

  it('test_elder_breeding_tax_real_bridge', () => {
    // Real, mandatory anchor: full TS LabState with real Slime objects at
    // Elder-eligible age, through stateToLua -> initiate_breeding -> TS.
    const elderParent = { ...makeSlime('pa', 0), color: 'Red' as SlimeColor, stage: 'Elder' as const };
    const youngParent = { ...makeSlime('pb', 0), color: 'Blue' as SlimeColor, hue: 300, stage: 'Prime' as const };
    const state = makeState({
      cycle: 100,
      credits: 1000,
      rosterCap: 10,
      slimes: [elderParent, youngParent],
    });
    const luaState = stateToLua(state);
    const [rawChild, error] = call(session, 'initiate_breeding', luaState, 'pa', 'pb', 0, {}, null, {}, null, colorSpecs) as [Record<string, unknown> | null, string | null];
    expect(error).toBeFalsy();
    expect(rawChild).toBeTruthy();
    const child = luaSlimeToTs(rawChild!);

    // Compare against a control breeding with no Elder parent, same inputs.
    const controlState = makeState({
      cycle: 100,
      credits: 1000,
      rosterCap: 10,
      slimes: [{ ...elderParent, stage: 'Prime' as const }, youngParent],
    });
    const controlLuaState = stateToLua(controlState);
    const [rawControl] = call(session, 'initiate_breeding', controlLuaState, 'pa', 'pb', 0, {}, null, {}, null, colorSpecs) as [Record<string, unknown> | null, string | null];
    const controlChild = luaSlimeToTs(rawControl!);

    expect(child.stats.hp).toBeLessThan(controlChild.stats.hp);
    expect(child.stats.hp).toBe(Math.floor(controlChild.stats.hp * 0.85));
  });
});
