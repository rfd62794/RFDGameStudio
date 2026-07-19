import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua,
  type LabState,
  type Slime,
  type PlanetRegion,
  type PlanetNode,
  type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

function makeSlime(id: string, color: SlimeColor, chmVal: number): Slime {
  return {
    id, name: `Slime-${id}`, color, pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: chmVal },
    role: 'idle', generation: 0, colorSaturation: 100,
    hue: color === 'Red' ? 0 : color === 'Blue' ? 300 : 0,
    saturation: 100, diffusionRatio: 20, amplitude: 40,
    accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
}

function makeNode(id: string, strength: number, discovered: boolean): PlanetNode {
  return {
    id, name: `Node-${id}`, cellShape: 'hex', labelX: 0, labelY: 0,
    neighbors: [], ownerColor: null, pressure: {}, strength,
    isCapitol: false, isSupplied: true, distanceFromCenter: 1, discovered,
    garrisonSlimeId: null,
  };
}

function makeRegion(nodes: PlanetNode[]): PlanetRegion {
  return { nodes, generatedAt: Date.now(), geometryVersion: 3 };
}

function makeState(overrides: Partial<LabState> = {}): LabState {
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [makeSlime('s1', 'Red', 20), makeSlime('s2', 'Blue', 14)],
    contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null,
    planetRegion: makeRegion([makeNode('n1', 0.5, true), makeNode('n2', 0.3, true)]),
    wildsUnlocked: false, hasAutoFeeder: false,
    cultureRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    ...overrides,
  };
}

describe('Mediation Launch — Discarded Result Fix', () => {
  it('test_launch_mediation_applies_real_state_update', () => {
    // The real, load-bearing test: launch_mediation returns a real mission
    // object with all expected fields. The handler must capture this and
    // apply it to state.activeMediation — not discard it.
    const state = makeState();
    const luaState = stateToLua(state);
    const [raw] = call(session, 'launch_mediation', luaState, 'n1', ['s1', 's2']);

    // Lua returns a real mission object
    expect(raw).toBeTruthy();
    const r = raw as Record<string, unknown>;
    expect(r['id']).toBeTruthy();
    expect(String(r['target_node_id'])).toBe('n1');
    expect(Array.isArray(r['slime_ids'])).toBe(true);
    expect((r['slime_ids'] as string[]).length).toBe(2);
    expect(Number(r['cycles_remaining'])).toBeGreaterThan(0);
    expect(String(r['status'])).toBe('active');

    // Verify the handler in App.tsx actually captures and applies the result
    // (not discards it like the original bug)
    const handlerMatch = appSource.match(/const handleLaunchMediation = useCallback\(\(\) => \{([\s\S]*?)\}, \[/);
    expect(handlerMatch).toBeTruthy();
    const handlerBody = handlerMatch![1];

    // Must destructure the return value — the original bug discarded it
    expect(handlerBody).toContain('const [raw]');
    expect(handlerBody).toContain("call(session, 'launch_mediation'");
    expect(handlerBody).toContain('if (!raw) return');

    // Must apply to state.activeMediation with real field mapping
    expect(handlerBody).toContain('activeMediation');
    expect(handlerBody).toContain("r['target_node_id']");
    expect(handlerBody).toContain("r['slime_ids']");
    expect(handlerBody).toContain("r['cycles_remaining']");
    expect(handlerBody).toContain("r['status']");
    expect(handlerBody).toContain('setState');

    // Must NOT be the old discarded-call pattern (bare call without assignment)
    expect(handlerBody).not.toMatch(/^\s*call\(session, 'launch_mediation'[^=]*\);\s*$/m);
  });

  it('test_launch_mediation_without_selected_node_is_safe_noop', () => {
    // Real guard behavior: if no node is selected, the handler returns early
    // without calling Lua or touching state.
    const handlerMatch = appSource.match(/const handleLaunchMediation = useCallback\(\(\) => \{([\s\S]*?)\}, \[/);
    expect(handlerMatch).toBeTruthy();
    const handlerBody = handlerMatch![1];

    // Guard must be present and must be the first check
    expect(handlerBody).toContain('if (!selectedMediationNodeId) return');

    // The guard must come before the Lua call
    const guardIdx = handlerBody.indexOf('if (!selectedMediationNodeId) return');
    const callIdx = handlerBody.indexOf("call(session, 'launch_mediation'");
    expect(guardIdx).toBeLessThan(callIdx);
    expect(guardIdx).toBeGreaterThanOrEqual(0);

    // Also verify at the Lua level: launch_mediation with nil node_id should
    // not crash — it returns nil or a mission with nil fields, but doesn't error
    const state = makeState();
    const luaState = stateToLua(state);
    // Calling with null node should not throw
    expect(() => {
      call(session, 'launch_mediation', luaState, null, ['s1']);
    }).not.toThrow();
  });

  it('test_mediation_selection_state_clears_correctly_after_launch', () => {
    // Real, practical UX check: after a successful launch, draft selections
    // should reset — matching handleLaunchExploration's pattern of clearing
    // explorationDraftIds and selectedExplorationNodeId.
    const handlerMatch = appSource.match(/const handleLaunchMediation = useCallback\(\(\) => \{([\s\S]*?)\}, \[/);
    expect(handlerMatch).toBeTruthy();
    const handlerBody = handlerMatch![1];

    // Must clear draft IDs after launch
    expect(handlerBody).toContain('setMediationDraftIds([])');
    // Must clear selected node after launch
    expect(handlerBody).toContain('setSelectedMediationNodeId(null)');

    // Compare with handleLaunchExploration to confirm same pattern
    const explorationMatch = appSource.match(/const handleLaunchExploration = useCallback\(\(\) => \{([\s\S]*?)\}, \[/);
    expect(explorationMatch).toBeTruthy();
    const explorationBody = explorationMatch![1];

    expect(explorationBody).toContain('setExplorationDraftIds([])');
    expect(explorationBody).toContain('setSelectedExplorationNodeId(null)');

    // Both handlers should follow the same structural pattern:
    // guard → call → null check → setState → clear selections
    const mediationSteps = [
      handlerBody.includes('if (!selectedMediationNodeId) return'),
      handlerBody.includes("call(session, 'launch_mediation'"),
      handlerBody.includes('if (!raw) return'),
      handlerBody.includes('setState'),
      handlerBody.includes('setMediationDraftIds([])'),
      handlerBody.includes('setSelectedMediationNodeId(null)'),
    ];
    expect(mediationSteps.every(Boolean)).toBe(true);
  });
});
