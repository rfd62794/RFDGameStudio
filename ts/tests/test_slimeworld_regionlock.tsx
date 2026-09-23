import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, slimeToLua, type LabState, type Slime, type PlanetNode, type SlimeColor,
} from '../src/games/slimeworld/types';
import { generatePlanetRegion } from '../src/games/slimeworld/planetRegion';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const regionLocks = data['region_locks'] as Array<Record<string, unknown>>;
const colorTargets = data['color_targets'] as Array<Record<string, unknown>>;
const shapeTargets = data['shape_targets'] as Array<Record<string, unknown>>;
const accentTargets = data['accent_targets'] as Array<Record<string, unknown>>;

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

function makeSlime(overrides: Partial<Slime> = {}): Slime {
  return {
    id: 's1', name: 'Test', color: 'Red', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
    ...overrides,
  };
}

function makeNode(id: string, isCapitol = false): PlanetNode {
  return {
    id, name: id, cellShape: '', labelX: 0, labelY: 0, neighbors: [],
    ownerColor: null, pressure: {}, strength: 0.5, isCapitol, isSupplied: true,
    distanceFromCenter: 50, discovered: true, garrisonSlimeId: null,
  };
}

function makeState(overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [makeSlime()], contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false,
    colorRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    petitions: [],
    ...overrides,
  };
}

describe('SlimeWorld Region Lock-Down', () => {
  // §3.1: Every ID in region_locks resolves to a real, existing color/shape/accent entry
  it('test_region_lock_data_references_real_targets', () => {
    expect(regionLocks).toBeTruthy();
    expect(regionLocks.length).toBe(18);

    const colorIds = new Set(colorTargets.map(t => t['id']));
    const accentIds = new Set(accentTargets.map(t => t['id']));

    for (const lock of regionLocks) {
      const colorTargetId = lock['color_target_id'] as string | null;
      if (colorTargetId !== null) {
        expect(colorIds.has(colorTargetId)).toBe(true);
      }

      const accentTargetIds = lock['accent_target_ids'] as string[];
      for (const aid of accentTargetIds) {
        expect(accentIds.has(aid)).toBe(true);
      }

      const shapeTier = lock['shape_tier'];
      if (shapeTier !== null) {
        const tierNum = shapeTier as number;
        const matching = shapeTargets.filter(t => t['tier'] === tierNum);
        expect(matching.length).toBeGreaterThan(0);
      }
    }
  });

  // §3.2: 4 new nodes get real, computed (not hand-placed) neighbor lists
  it('test_new_map_nodes_have_real_neighbors', () => {
    const region = generatePlanetRegion();
    const newIds = ['node_rival_a', 'node_rival_b', 'node_rival_c', 'node_convergence'];
    for (const id of newIds) {
      const node = region.nodes.find((n: PlanetNode) => n.id === id);
      expect(node).toBeTruthy();
      expect(node!.neighbors.length).toBeGreaterThan(0);
      // Verify each neighbor is a real node ID in the region
      for (const neighborId of node!.neighbors) {
        const neighbor = region.nodes.find((n: PlanetNode) => n.id === neighborId);
        expect(neighbor).toBeTruthy();
      }
    }
  });

  // §3.3: A bred slime matching a region's full composite lock → region marked unlocked
  it('test_region_unlocks_on_matching_breed', () => {
    // guild_ember_marsh: center_hue=30, tolerance=15, sat 65-100
    // shape_tier 1: e.g. shape_triangle (vertex_count=3, irregularity 0-15)
    // accent_solid: diffusion 0-10
    const slime = makeSlime({
      hue: 30, saturation: 80, vertexCount: 3, irregularity: 10,
      diffusionRatio: 5, amplitude: 40,
    });
    const state = makeState({ slimes: [slime] });
    const luaState = stateToLua(state);

    const [result, error] = luaResult(
      call(session, 'check_region_unlocks', luaState, slimeToLua(slime),
        regionLocks, colorTargets, shapeTargets, accentTargets)
    );
    // check_region_unlocks returns a table (array) of newly unlocked node_ids
    expect(error).toBeNull();
    expect(result).toBeTruthy();
    const unlocked = result as Record<string, unknown>;
    // The return is a Lua array — check that node_frontier_a is in the results
    const unlockedArray = Object.values(unlocked);
    expect(unlockedArray).toContain('node_frontier_a');
  });

  // §3.4: No code path re-locks an already-unlocked region
  it('test_region_unlock_is_permanent', () => {
    const slime = makeSlime({
      hue: 30, saturation: 80, vertexCount: 3, irregularity: 10,
      diffusionRatio: 5, amplitude: 40,
    });
    // Pre-unlock node_frontier_a
    const state = makeState({ slimes: [slime] });
    state.regionUnlocks = { node_frontier_a: true };
    const luaState = stateToLua(state);

    const [result, error] = luaResult(
      call(session, 'check_region_unlocks', luaState, slimeToLua(slime),
        regionLocks, colorTargets, shapeTargets, accentTargets)
    );
    expect(error).toBeNull();
    // Should not re-unlock node_frontier_a (it's already unlocked)
    const unlockedArray = Object.values(result as Record<string, unknown>);
    expect(unlockedArray).not.toContain('node_frontier_a');
    // But the region is still unlocked in state
    const [stateResult] = luaResult(
      call(session, 'is_region_unlocked', luaState, 'node_frontier_a')
    );
    expect(stateResult).toBeTruthy();
  });

  // §3.5: Convergence stays locked until all prerequisites are met, even with a matching Metallic slime
  it('test_convergence_requires_all_skip_regions', () => {
    // Metallic accent: diffusion 43-47, amplitude 68-72
    const metallicSlime = makeSlime({
      hue: 0, saturation: 50, vertexCount: 4, irregularity: 10,
      diffusionRatio: 45, amplitude: 70,
    });

    // Without prerequisites met — should NOT unlock
    const stateWithout = makeState({ slimes: [metallicSlime] });
    const luaWithout = stateToLua(stateWithout);
    const [resultWithout] = luaResult(
      call(session, 'check_region_unlocks', luaWithout, slimeToLua(metallicSlime),
        regionLocks, colorTargets, shapeTargets, accentTargets)
    );
    const unlockedWithout = Object.values(resultWithout as Record<string, unknown>);
    expect(unlockedWithout).not.toContain('node_convergence');

    // With all prerequisites met — should unlock
    const allPrereqs: Record<string, boolean> = {};
    const convergenceLock = regionLocks.find(l => l['node_id'] === 'node_convergence')!;
    const prereqs = convergenceLock['prerequisites'] as string[];
    for (const id of prereqs) { allPrereqs[id] = true; }
    const stateWith = makeState({ slimes: [metallicSlime] });
    stateWith.regionUnlocks = allPrereqs;
    const luaWith = stateToLua(stateWith);
    const [resultWith] = luaResult(
      call(session, 'check_region_unlocks', luaWith, slimeToLua(metallicSlime),
        regionLocks, colorTargets, shapeTargets, accentTargets)
    );
    const unlockedWith = Object.values(resultWith as Record<string, unknown>);
    expect(unlockedWith).toContain('node_convergence');
  });

  // §3.6: launch_exploration/launch_mediation cleanly refuse a locked, non-capitol node
  it('test_mission_blocked_on_locked_region', () => {
    const state = makeState();
    state.planetRegion = {
      nodes: [makeNode('node_frontier_a'), makeNode('node_cap', true)],
      generatedAt: Date.now(),
    };
    const luaState = stateToLua(state);

    // node_frontier_a is locked (not in region_unlocks, not a capitol)
    const [explorationResult, explorationError] = luaResult(
      call(session, 'launch_exploration', luaState, 'node_frontier_a', ['s1'], regionLocks)
    );
    expect(explorationResult).toBeNull();
    expect(explorationError).toBeTruthy();

    const [mediationResult, mediationError] = luaResult(
      call(session, 'launch_mediation', luaState, 'node_frontier_a', ['s1'], regionLocks)
    );
    expect(mediationResult).toBeNull();
    expect(mediationError).toBeTruthy();
  });

  // §3.7: Real success case — both a Capitol target and a newly-unlocked region
  it('test_mission_allowed_on_unlocked_or_capitol', () => {
    const state = makeState();
    state.planetRegion = {
      nodes: [makeNode('node_frontier_a'), makeNode('node_cap', true)],
      generatedAt: Date.now(),
    };
    state.regionUnlocks = { node_frontier_a: true };
    const luaState = stateToLua(state);

    // Capitol node — should succeed
    const [capResult, capError] = luaResult(
      call(session, 'launch_exploration', luaState, 'node_cap', ['s1'], regionLocks)
    );
    expect(capError).toBeNull();
    expect(capResult).toBeTruthy();
    expect(String((capResult as Record<string, unknown>)['target_node_id'])).toBe('node_cap');

    // Unlocked node — should succeed
    const [unlockedResult, unlockedError] = luaResult(
      call(session, 'launch_mediation', luaState, 'node_frontier_a', ['s1'], regionLocks)
    );
    expect(unlockedError).toBeNull();
    expect(unlockedResult).toBeTruthy();
    expect(String((unlockedResult as Record<string, unknown>)['target_node_id'])).toBe('node_frontier_a');
  });
});
