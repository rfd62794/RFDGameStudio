import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, type LabState, type Slime, type SlimeColor } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const colorTargets = (data['color_targets'] ?? []) as Array<Record<string, unknown>>;
const regionLocks = (data['region_locks'] ?? []) as Array<Record<string, unknown>>;

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

function makeState(overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1,
    credits: 1000,
    rosterCap: 10,
    breedingSuccessRateModifier: 0,
    slimes: [],
    contracts: [],
    zones: [],
    activeDispatch: null,
    logs: [],
    activeMediation: null,
    activeExploration: null,
    planetRegion: null,
    wildsUnlocked: false,
    hasAutoFeeder: false,
    colorRelationships: { Red: 50, Blue: 50, Yellow: 50, Purple: 50, Orange: 50, Green: 50, Gray: 50 } as Record<SlimeColor, number>,
    recentMarketSales: [],
    regentInventory: {},
    colorRegentInventory: {},
    targetRegentInventory: {},
    petitions: [],
    colorCodex: {},
    patternCodex: {},
    regionUnlocks: {},
    shownTutorials: {},
    ...overrides,
  } as LabState;
}

function buildColorSpecs(gameData: Record<string, unknown>): Record<string, unknown> {
  const specs: Record<string, unknown> = {};
  const colorList = (gameData['color_specs'] ?? []) as Array<Record<string, unknown>>;
  for (const spec of colorList) {
    specs[spec['color'] as string] = spec;
  }
  return specs;
}

const colorSpecs = buildColorSpecs(data);

describe('SlimeWorld purchase_seed_slime restrictions and cooldown', () => {
  it('test_purchase_seed_slime_rejects_color_outside_unlocked_regions', () => {
    const state = makeState({ regionUnlocks: {} });
    const [raw, err] = luaResult(
      call(session, 'purchase_seed_slime', stateToLua(state), 'Red', colorSpecs, regionLocks, colorTargets)
    );
    expect(raw).toBeNull();
    expect(err).toBeTruthy();
    expect(err).toMatch(/not available from unlocked regions/i);
  });

  it('test_purchase_seed_slime_accepts_color_within_unlocked_regions', () => {
    // Unlock node_frontier_a (guild_ember_marsh, center hue 30 → Red + Orange within 60°)
    const state = makeState({ regionUnlocks: { node_frontier_a: true } });
    const [raw, err] = luaResult(
      call(session, 'purchase_seed_slime', stateToLua(state), 'Red', colorSpecs, regionLocks, colorTargets)
    );
    expect(err).toBeNull();
    expect(raw).not.toBeNull();
    expect((raw as Record<string, unknown>)['color']).toBe('Red');
  });

  it('test_purchase_seed_slime_eligibility_updates_after_new_region_unlock', () => {
    // Initially only node_frontier_a unlocked → Red/Orange available, Yellow not.
    const stateOne = makeState({ regionUnlocks: { node_frontier_a: true } });
    const [, errYellowOne] = luaResult(
      call(session, 'purchase_seed_slime', stateToLua(stateOne), 'Yellow', colorSpecs, regionLocks, colorTargets)
    );
    expect(errYellowOne).toBeTruthy();

    // Unlock node_frontier_b too (guild_marsh_gale, center hue 90 → Orange + Yellow)
    const stateTwo = makeState({ regionUnlocks: { node_frontier_a: true, node_frontier_b: true } });
    const [raw, errYellowTwo] = luaResult(
      call(session, 'purchase_seed_slime', stateToLua(stateTwo), 'Yellow', colorSpecs, regionLocks, colorTargets)
    );
    expect(errYellowTwo).toBeNull();
    expect(raw).not.toBeNull();
    expect((raw as Record<string, unknown>)['color']).toBe('Yellow');
  });

  it('test_purchase_seed_slime_cooldown_blocks_repeat_purchase', () => {
    const state = makeState({ regionUnlocks: { node_frontier_a: true } });
    const luaState = stateToLua(state);

    const [first, errFirst] = luaResult(
      call(session, 'purchase_seed_slime', luaState, 'Red', colorSpecs, regionLocks, colorTargets)
    );
    expect(errFirst).toBeNull();
    expect(first).not.toBeNull();

    // Same cycle: cooldown should block.
    const [second, errSecond] = luaResult(
      call(session, 'purchase_seed_slime', luaState, 'Red', colorSpecs, regionLocks, colorTargets)
    );
    expect(second).toBeNull();
    expect(errSecond).toBeTruthy();
    expect(errSecond).toMatch(/cooldown/i);
  });

  it('test_purchase_seed_slime_cooldown_clears_after_elapsed_cycles', () => {
    const state = makeState({ regionUnlocks: { node_frontier_a: true }, cycle: 1 });
    const luaState = stateToLua(state);

    const [first, errFirst] = luaResult(
      call(session, 'purchase_seed_slime', luaState, 'Red', colorSpecs, regionLocks, colorTargets)
    );
    expect(errFirst).toBeNull();
    expect(first).not.toBeNull();

    // Cooldown is 3 cycles: purchase at cycle 1 can next buy at cycle 4.
    state.cycle = 4;
    const [second, errSecond] = luaResult(
      call(session, 'purchase_seed_slime', stateToLua(state), 'Red', colorSpecs, regionLocks, colorTargets)
    );
    expect(errSecond).toBeNull();
    expect(second).not.toBeNull();
  });
});
