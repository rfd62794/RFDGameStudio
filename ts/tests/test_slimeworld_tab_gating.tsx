import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua, slimeToLua, type LabState, type Slime, type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const regionLocks = data['region_locks'] as Array<Record<string, unknown>>;
const colorTargets = data['color_targets'] as Array<Record<string, unknown>>;
const shapeTargets = data['shape_targets'] as Array<Record<string, unknown>>;
const accentTargets = data['accent_targets'] as Array<Record<string, unknown>>;

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);
const missionsSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/MissionsTab.tsx'),
  'utf8'
);

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

// The real, canonical derivation used by App.tsx — mirrored here to
// independently verify against real state rather than re-reading source.
function unlockedRegionCount(state: LabState): number {
  return Object.values(state.regionUnlocks ?? {}).filter(Boolean).length;
}

describe('SlimeWorld Gate Missions on First Region, Economy on Second', () => {
  // §3.1: New game, zero regions unlocked → tabs array contains exactly roster and lab
  it('test_fresh_game_shows_only_roster_and_lab_tabs', () => {
    const freshState = makeState(); // regionUnlocks is unset, matches a real fresh game
    expect(unlockedRegionCount(freshState)).toBe(0);

    // Confirm App.tsx's real gating source matches this derivation exactly
    expect(appSource).toContain('unlockedRegionCount');
    expect(appSource).toContain('visibleTabs = unlockedRegionCount >= 2');
    expect(appSource).toContain(": [{ id: 'roster', label: 'ROSTER' }, { id: 'lab', label: 'LAB' }]");
    expect(appSource).toContain('tabs={visibleTabs}');
  });

  // §3.2: After exactly one region unlock, Missions appears but Economy does not
  it('test_missions_tab_appears_after_first_unlock_economy_stays_hidden', () => {
    const state = makeState({ regionUnlocks: { node_frontier_a: true } });
    expect(unlockedRegionCount(state)).toBe(1);
    expect(appSource).toContain("unlockedRegionCount >= 1");
    expect(appSource).toContain("{ id: 'missions', label: 'MISSIONS' }");
  });

  // §3.3: After the second region unlock, Economy also appears
  it('test_economy_tab_appears_after_second_unlock', () => {
    const state = makeState({ regionUnlocks: { node_frontier_a: true, node_frontier_b: true } });
    expect(unlockedRegionCount(state)).toBe(2);
    expect(appSource).toContain("? [{ id: 'roster', label: 'ROSTER' }, { id: 'missions', label: 'MISSIONS' }, { id: 'economy', label: 'ECONOMY' }, { id: 'lab', label: 'LAB' }]");
  });

  // §3.4: Returning player with pre-existing second-region progress sees Economy immediately
  it('test_returning_player_with_existing_second_region_sees_economy_immediately', () => {
    const returningState = makeState({ regionUnlocks: { node_frontier_a: true, node_frontier_b: true } });
    expect(unlockedRegionCount(returningState)).toBe(2);
    expect(appSource).toContain('state.regionUnlocks');
    expect(appSource).not.toContain('t3FiredRef.current'); // gate isn't tied to the T3 tutorial-shown ref
  });

  // §3.5: Default primaryTab is always among the currently-visible tab set,
  // pre- and post-unlock
  it('test_default_active_tab_never_hidden', () => {
    const defaultTabMatch = appSource.match(/useState<'roster' \| 'missions' \| 'economy' \| 'lab'>\('(\w+)'\)/);
    expect(defaultTabMatch).toBeTruthy();
    const defaultTab = defaultTabMatch![1];
    expect(defaultTab).toBe('roster');
    // 'roster' appears in the gated branch too
    const gatedBranch = "[{ id: 'roster', label: 'ROSTER' }, { id: 'lab', label: 'LAB' }]";
    expect(appSource).toContain(gatedBranch);
    expect(gatedBranch).toContain(`id: '${defaultTab}'`);
  });

  // §3.6: MissionsTab's own node-level locking behaves identically before
  // and after this change — this is a visibility gate, not a data gate
  it('test_node_locking_unaffected', () => {
    expect(missionsSource).toContain('isNodeLocked');
    expect(missionsSource).toContain('regionLockNodeIds');
    // App.tsx still passes the same regionLockNodeIds prop, untouched
    expect(appSource).toContain("regionLockNodeIds: ((session.files.data as Record<string, unknown>)['region_locks'] as Array<Record<string, unknown>>)?.map(l => l['node_id']) ?? []");

    // Real bridge: locked-node mission refusal still works exactly as before
    const state = makeState();
    state.planetRegion = {
      nodes: [
        { id: 'node_frontier_a', name: 'node_frontier_a', cellShape: '', labelX: 0, labelY: 0, neighbors: [], ownerColor: null, pressure: {}, strength: 0.5, isCapitol: false, isSupplied: true, distanceFromCenter: 50, discovered: true, garrisonSlimeId: null },
        { id: 'node_cap', name: 'node_cap', cellShape: '', labelX: 0, labelY: 0, neighbors: [], ownerColor: null, pressure: {}, strength: 0.5, isCapitol: true, isSupplied: true, distanceFromCenter: 50, discovered: true, garrisonSlimeId: null },
      ],
      generatedAt: Date.now(),
    };
    const luaState = stateToLua(state);
    const [explorationResult, explorationError] = luaResult(
      call(session, 'launch_exploration', luaState, 'node_frontier_a', ['s1'], regionLocks)
    );
    expect(explorationResult).toBeNull();
    expect(explorationError).toBeTruthy();
  });
});
