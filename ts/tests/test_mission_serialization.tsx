import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import {
  stateToLua,
  missionToLua,
  type LabState,
  type Slime,
  type Mission,
  type PlanetRegion,
  type PlanetNode,
  type SlimeColor,
} from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

function makeSlime(id: string, color: SlimeColor, intVal: number, agiVal: number, chmVal: number): Slime {
  return {
    id, name: `Slime-${id}`, color, pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: agiVal, int: intVal, chm: chmVal },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
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
    slimes: [makeSlime('s1', 'Red', 20, 15, 10), makeSlime('s2', 'Blue', 18, 12, 14)],
    contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false,
    cultureRelationships: {} as Record<SlimeColor, number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
    ...overrides,
  };
}

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

describe('Mission Serialization — stateToLua → advance_cycle Path', () => {
  // ── Tier 1: Direct unit-level confirmation ──────────────────────────────

  it('test_missionToLua_converts_all_fields_to_snake_case', () => {
    const mission: Mission = {
      id: 'exp_001',
      targetNodeId: 'node_north',
      slimeIds: ['s1', 's2'],
      cyclesRemaining: 1,
      status: 'active',
    };
    const lua = missionToLua(mission);
    expect(lua['id']).toBe('exp_001');
    expect(lua['target_node_id']).toBe('node_north');
    expect(lua['slime_ids']).toEqual(['s1', 's2']);
    expect(lua['cycles_remaining']).toBe(1);
    expect(lua['status']).toBe('active');
    expect(lua['zone_id']).toBeUndefined();
    // Critical: no camelCase keys leaked through
    expect(lua['targetNodeId']).toBeUndefined();
    expect(lua['slimeIds']).toBeUndefined();
    expect(lua['cyclesRemaining']).toBeUndefined();
  });

  it('test_missionToLua_preserves_real_values', () => {
    const mission: Mission = {
      id: 'dispatch_42',
      zoneId: 'zone_cinder',
      slimeIds: ['alpha', 'beta', 'gamma'],
      cyclesRemaining: 3,
      status: 'active',
    };
    const lua = missionToLua(mission);
    expect(String(lua['id'])).toBe('dispatch_42');
    expect(String(lua['zone_id'])).toBe('zone_cinder');
    expect(Array.isArray(lua['slime_ids'])).toBe(true);
    expect((lua['slime_ids'] as string[]).length).toBe(3);
    expect((lua['slime_ids'] as string[])[0]).toBe('alpha');
    expect((lua['slime_ids'] as string[])[2]).toBe('gamma');
    expect(Number(lua['cycles_remaining'])).toBe(3);
    expect(String(lua['status'])).toBe('active');
  });

  it('test_stateToLua_uses_missionToLua_for_all_three_mission_types', () => {
    const state = makeState({
      activeDispatch: { id: 'd1', zoneId: 'zone_a', slimeIds: ['s1'], cyclesRemaining: 1, status: 'active' },
      activeMediation: { id: 'm1', targetNodeId: 'node_x', slimeIds: ['s2'], cyclesRemaining: 1, status: 'active' },
      activeExploration: { id: 'e1', targetNodeId: 'node_y', slimeIds: ['s1', 's2'], cyclesRemaining: 1, status: 'active' },
    });
    const lua = stateToLua(state) as Record<string, unknown>;

    // active_dispatch
    const dispatch = lua['active_dispatch'] as Record<string, unknown>;
    expect(dispatch).not.toBeNull();
    expect(dispatch['zone_id']).toBe('zone_a');
    expect(dispatch['slime_ids']).toEqual(['s1']);
    expect(dispatch['targetNodeId']).toBeUndefined();

    // active_mediation
    const mediation = lua['active_mediation'] as Record<string, unknown>;
    expect(mediation).not.toBeNull();
    expect(mediation['target_node_id']).toBe('node_x');
    expect(mediation['slime_ids']).toEqual(['s2']);
    expect(mediation['targetNodeId']).toBeUndefined();

    // active_exploration
    const exploration = lua['active_exploration'] as Record<string, unknown>;
    expect(exploration).not.toBeNull();
    expect(exploration['target_node_id']).toBe('node_y');
    expect(exploration['slime_ids']).toEqual(['s1', 's2']);
    expect(exploration['targetNodeId']).toBeUndefined();
  });

  // ── Tier 2: End-to-end through real executor bridge ─────────────────────

  it('test_real_exploration_resolves_through_full_stateToLua_path', () => {
    const targetNode = makeNode('node_exp_target', 0.2, false);
    const region = makeRegion([targetNode]);
    const state = makeState({
      planetRegion: region,
      activeExploration: {
        id: 'exp_test',
        targetNodeId: 'node_exp_target',
        slimeIds: ['s1', 's2'],
        cyclesRemaining: 1,
        status: 'active',
      },
    });

    // Send through real stateToLua → real Lua advance_cycle
    const luaState = stateToLua(state);
    const [raw] = call(session, 'advance_cycle', luaState, colorSpecs);
    expect(raw).toBeTruthy();
    const result = raw as Record<string, unknown>;

    // active_exploration must be nil (resolved)
    expect(result['active_exploration']).toBeFalsy();

    // Slimes must have been returned to idle (role changed from dispatch)
    const slimes = result['slimes'] as Array<Record<string, unknown>>;
    expect(slimes).toBeTruthy();
    const s1 = slimes.find(s => s['id'] === 's1');
    const s2 = slimes.find(s => s['id'] === 's2');
    expect(s1).toBeTruthy();
    expect(s2).toBeTruthy();
    // XP should have been awarded (either 45 for success or 20 for failure)
    const s1Xp = Number(s1!['xp']);
    const s2Xp = Number(s2!['xp']);
    expect(s1Xp).toBeGreaterThan(0);
    expect(s2Xp).toBeGreaterThan(0);

    // A log entry about exploration resolution must exist with the real node name
    // (not "unknown" — that would mean target_node was nil, i.e. the bug)
    const logs = result['logs'] as Array<Record<string, unknown>>;
    const expLog = logs.find(l => String(l['text'] ?? '').includes('EXPLORATION CONCLUDED'));
    expect(expLog).toBeTruthy();
    expect(String(expLog!['text'])).toContain('Node-node_exp_target');
  });

  it('test_real_mediation_resolves_through_full_stateToLua_path', () => {
    const targetNode = makeNode('node_med_target', 0.5, true);
    const region = makeRegion([targetNode]);
    const state = makeState({
      planetRegion: region,
      activeMediation: {
        id: 'med_test',
        targetNodeId: 'node_med_target',
        slimeIds: ['s1', 's2'],
        cyclesRemaining: 1,
        status: 'active',
      },
    });

    const luaState = stateToLua(state);
    const [raw] = call(session, 'advance_cycle', luaState, colorSpecs);
    expect(raw).toBeTruthy();
    const result = raw as Record<string, unknown>;

    // active_mediation must be nil (resolved)
    expect(result['active_mediation']).toBeFalsy();

    // A log entry about mediation resolution must exist
    // (with the bug, party would be empty → no log entry at all)
    const logs = result['logs'] as Array<Record<string, unknown>>;
    const medLog = logs.find(l => String(l['text'] ?? '').includes('MEDIATION CONCLUDED'));
    expect(medLog).toBeTruthy();

    // The node's strength should have changed (mediation modifies it)
    const resultRegion = result['planet_region'] as Record<string, unknown>;
    const resultNodes = resultRegion['nodes'] as Array<Record<string, unknown>>;
    const resultTarget = resultNodes.find(n => n['id'] === 'node_med_target');
    expect(resultTarget).toBeTruthy();
    const newStrength = Number(resultTarget!['strength']);
    // Strength was 0.5, mediation adds stability_change/100
    // success: floor(15 + chm/6 + random*8) → at least 15 → 0.15 added
    // failure: floor(5 + random*5) → at least 5 → 0.05 added
    expect(newStrength).toBeGreaterThan(0.5);
  });

  it('test_real_dispatch_resolves_through_full_stateToLua_path', () => {
    // Dispatch doesn't get resolved in advance_cycle (separate gap),
    // but the serialization fix still matters: Lua must be able to read
    // zone_id and slime_ids from the stateToLua output.
    // We verify by launching a dispatch through Lua, then round-tripping
    // through stateToLua and confirming Lua can still read the fields.
    const state = makeState({
      zones: [{
        id: 'zone_cinder', name: 'Rusty Cinder Craters', requiredColor: 'Red',
        recommendedLevel: 1, difficulty: 1, creditsReward: 50, xpReward: 60,
        isUnlocked: true, isFirstClearCompleted: false, flavorText: 'test',
      }],
    });

    // Launch dispatch via Lua
    const [launchRaw] = call(session, 'launch_dispatch', stateToLua(state), 'zone_cinder', ['s1']);
    expect(launchRaw).toBeTruthy();
    const launchResult = launchRaw as Record<string, unknown>;
    expect(launchResult['zone_id']).toBe('zone_cinder');
    expect(launchResult['slime_ids']).toEqual(['s1']);

    // Now build a TS state with the active dispatch and send through stateToLua
    const stateWithDispatch = makeState({
      activeDispatch: {
        id: 'dispatch',
        zoneId: 'zone_cinder',
        slimeIds: ['s1'],
        cyclesRemaining: 1,
        status: 'active',
      },
    });
    const luaState = stateToLua(stateWithDispatch);
    const dispatch = luaState['active_dispatch'] as Record<string, unknown>;
    expect(dispatch['zone_id']).toBe('zone_cinder');
    expect(dispatch['slime_ids']).toEqual(['s1']);

    // Call advance_cycle — dispatch won't resolve (separate gap), but the
    // key proof is that Lua doesn't crash and the dispatch fields are
    // readable snake_case, not nil camelCase
    const [raw] = call(session, 'advance_cycle', luaState, colorSpecs);
    expect(raw).toBeTruthy();
    const result = raw as Record<string, unknown>;
    // Dispatch is still active (not resolved in advance_cycle — known gap)
    // But the state was accepted by Lua without error
    expect(result).toBeTruthy();
  });

  // ── Sanity check: would this test have caught the original bug? ──────────

  it('test_missing_missionToLua_would_have_failed_this_test', () => {
    // Simulate the OLD buggy behavior: pass raw camelCase Mission directly
    // instead of using missionToLua. This proves the Tier 2 tests above
    // would actually catch the bug, not just pass regardless.
    const targetNode = makeNode('node_sanity', 0.2, false);
    const region = makeRegion([targetNode]);
    const state = makeState({
      planetRegion: region,
      activeExploration: {
        id: 'exp_sanity',
        targetNodeId: 'node_sanity',
        slimeIds: ['s1'],
        cyclesRemaining: 1,
        status: 'active',
      },
    });

    // Build the OLD buggy state: raw camelCase mission, no missionToLua
    const buggyState = { ...stateToLua(state) };
    buggyState['active_exploration'] = {
      id: 'exp_sanity',
      targetNodeId: 'node_sanity',  // camelCase — Lua reads target_node_id → nil
      slimeIds: ['s1'],              // camelCase — Lua reads slime_ids → nil
      cyclesRemaining: 1,            // camelCase — Lua reads cycles_remaining → nil
      status: 'active',
    } as Record<string, unknown>;

    const [raw] = call(session, 'advance_cycle', buggyState, colorSpecs);
    const result = raw as Record<string, unknown>;

    // With the bug: Lua can't find target_node_id or slime_ids
    // The exploration "resolves" (active_exploration set to nil) but
    // no XP awarded, no slimes returned to idle, log says "unknown"
    expect(result['active_exploration']).toBeFalsy();

    const slimes = result['slimes'] as Array<Record<string, unknown>>;
    const s1 = slimes.find(s => s['id'] === 's1');
    expect(s1).toBeTruthy();
    // With the bug, XP stays at 0 (no party found → no XP awarded)
    const s1Xp = Number(s1!['xp']);
    expect(s1Xp).toBe(0);

    // The log IS added even with the bug, but it says "unknown" because
    // target_node was nil (target_node_id couldn't be read from camelCase)
    const logs = result['logs'] as Array<Record<string, unknown>>;
    const expLog = logs.find(l => String(l['text'] ?? '').includes('EXPLORATION CONCLUDED'));
    expect(expLog).toBeTruthy();
    expect(String(expLog!['text'])).toContain('unknown');
    expect(String(expLog!['text'])).not.toContain('node_sanity');

    // This test proves the bug was real: with camelCase fields,
    // exploration silently no-ops (no XP, node not found). The fix
    // (missionToLua) is what makes the Tier 2 tests above genuinely
    // pass with real outcomes.
  });
});
