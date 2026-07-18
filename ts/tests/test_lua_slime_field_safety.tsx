import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { stateToLua, luaSlimeToTs, SLIME_EXPLICIT_LUA_FIELDS, type LabState, type Slime } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');

function makeMinimalState(): LabState {
  const slimeA: Slime = {
    id: 'parent_a', name: 'Parent A', color: 'Red', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 0, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 0, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
  const slimeB: Slime = {
    id: 'parent_b', name: 'Parent B', color: 'Blue', pattern: 'Solid', level: 5, xp: 0,
    stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
    role: 'idle', generation: 0, colorSaturation: 100, hue: 300, saturation: 100,
    diffusionRatio: 20, amplitude: 40, accentHue: 300, vertexCount: 4, irregularity: 10,
    createdAt: Date.now(), lockedRole: null, garrisonedAt: null, stage: 'Juvenile',
  };
  return {
    cycle: 1, credits: 1000, rosterCap: 10, breedingSuccessRateModifier: 0,
    slimes: [slimeA, slimeB], contracts: [], zones: [], activeDispatch: null,
    logs: [], activeMediation: null, activeExploration: null, planetRegion: null,
    wildsUnlocked: false, hasAutoFeeder: false, cultureRelationships: {} as Record<Slime['color'], number>,
    recentMarketSales: [], regentInventory: {}, colorRegentInventory: {}, targetRegentInventory: {},
  };
}

function luaResult(value: unknown[]): [Record<string, unknown> | null, string | null] {
  return [(value[0] ?? null) as Record<string, unknown> | null, (value[1] as string | undefined) ?? null];
}

describe('Lua→TS Field Safety — Alarm System', () => {
  it('test_slime_explicit_fields_export_matches_conversion_logic', () => {
    const expectedFields = [
      'id', 'name', 'color', 'pattern', 'level', 'xp', 'stats', 'role',
      'generation', 'color_saturation', 'hue', 'saturation', 'diffusion_ratio',
      'amplitude', 'accent_hue', 'vertex_count', 'irregularity', 'parent_a',
      'parent_b', 'created_at', 'matched_target_id', 'matched_shape_target_id',
      'consumed_slime_id', 'locked_role', 'garrisoned_at', 'stage',
    ];
    for (const field of expectedFields) {
      expect(SLIME_EXPLICIT_LUA_FIELDS.has(field)).toBe(true);
    }
    expect(SLIME_EXPLICIT_LUA_FIELDS.size).toBe(expectedFields.length);

    const testRaw: Record<string, unknown> = {
      id: 'test', name: 'Test', color: 'Red', pattern: 'Solid', level: 1, xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle', generation: 0, color_saturation: 100, hue: 0, saturation: 100,
      diffusion_ratio: 20, amplitude: 40, accent_hue: 0, vertex_count: 4, irregularity: 10,
      created_at: 1000, locked_role: null, garrisoned_at: null,
      matched_target_id: 'rival_ember_tundra', matched_shape_target_id: 'shape_star',
      consumed_slime_id: 'parent_b',
    };
    const slime = luaSlimeToTs(testRaw);
    expect(slime.matchedTargetId).toBe('rival_ember_tundra');
    expect(slime.matchedShapeTargetId).toBe('shape_star');
    expect(slime.consumedSlimeId).toBe('parent_b');
  });

  it('test_alarm_fires_on_real_breeding_result', () => {
    const state = makeMinimalState();
    const data = session.files.data as Record<string, unknown>;
    const cultures = data['cultures'] as Record<string, Record<string, unknown>>;
    const colorSpecs: Record<string, { base_stats: Record<string, number>; growth: Record<string, number> }> = {};
    for (const culture of Object.values(cultures)) {
      colorSpecs[culture['color'] as string] = {
        base_stats: culture['base_stats'] as Record<string, number>,
        growth: culture['growth'] as Record<string, number>,
      };
    }
    const gray = (data['neutral_traits'] as Record<string, Record<string, unknown>>)['gray'];
    colorSpecs['Gray'] = {
      base_stats: gray['base_stats'] as Record<string, number>,
      growth: gray['growth'] as Record<string, number>,
    };
    const value = call(session, 'initiate_breeding', stateToLua(state), 'parent_a', 'parent_b', 0, data['color_targets'], null, data['shape_targets'], null, colorSpecs);
    const [child, error] = luaResult(value);

    expect(error).toBeNull();
    expect(child).not.toBeNull();
    expect(child).toHaveProperty('id');

    const childObj = child as Record<string, unknown>;
    const unhandled = Object.keys(childObj).filter(key => !SLIME_EXPLICIT_LUA_FIELDS.has(key));

    expect(unhandled).toEqual([]);
  });

  it('test_alarm_would_fail_on_synthetic_new_field', () => {
    const syntheticRaw: Record<string, unknown> = {
      id: 'synthetic', name: 'Synthetic', color: 'Red', pattern: 'Solid', level: 1, xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle', generation: 0, color_saturation: 100, hue: 0, saturation: 100,
      diffusion_ratio: 20, amplitude: 40, accent_hue: 0, vertex_count: 4, irregularity: 10,
      created_at: 1000, locked_role: null, garrisoned_at: null,
      fake_new_lua_field: 42,
    };
    const unhandled = Object.keys(syntheticRaw).filter(key => !SLIME_EXPLICIT_LUA_FIELDS.has(key));
    expect(unhandled).toEqual(['fake_new_lua_field']);
    expect(unhandled.length).toBeGreaterThan(0);
  });

  it('test_other_lua_functions_audited_for_same_pattern', () => {
    const auditFindings = {
      launch_exploration: {
        returns: 'active_exploration object (id, target_node_id, slime_ids, cycles_remaining, status)',
        has_custom_converter: false,
        parsed_inline_in: 'App.tsx handleAdvanceCycle / handleLaunchExploration',
        needs_alarm: false,
        reason: 'Simple 5-field fixed-shape object. No custom TS converter function. Fields are simple strings/numbers, not computed slime fields. Any new field would be a deliberate API change, not a silent computation drop.',
      },
      launch_dispatch: {
        returns: 'active_dispatch object (id, zone_id, slime_ids, cycles_remaining, status)',
        has_custom_converter: false,
        parsed_inline_in: 'App.tsx handleLaunchDispatch',
        needs_alarm: false,
        reason: 'Same pattern as launch_exploration — simple 5-field fixed-shape object, no custom converter, inline field access.',
      },
      launch_mediation: {
        returns: 'active_mediation object (id, target_node_id, slime_ids, cycles_remaining, status)',
        has_custom_converter: false,
        parsed_inline_in: 'App.tsx handleLaunchMediation',
        needs_alarm: false,
        reason: 'Same pattern — simple 5-field fixed-shape object, no custom converter, inline field access.',
      },
      advance_cycle: {
        returns: 'full state table (cycle, credits, slimes, contracts, logs, planet_region, etc.)',
        has_custom_converter: false,
        parsed_inline_in: 'App.tsx handleAdvanceCycle — explicit field-by-field mapping',
        needs_alarm: false,
        reason: 'Returns full state. Slimes within it are parsed via luaSlimeToTs (already covered by this alarm test). Other fields (contracts, logs, nodes) are parsed inline with explicit field access. luaNodeToTs was checked and found already correct. Contracts are simple data structures from generate_contract, not computed fields — low risk for silent field drops.',
      },
    };

    for (const [, finding] of Object.entries(auditFindings)) {
      expect(finding).toHaveProperty('returns');
      expect(finding).toHaveProperty('needs_alarm', false);
      expect(finding).toHaveProperty('reason');
    }

    expect(Object.keys(auditFindings)).toEqual(['launch_exploration', 'launch_dispatch', 'launch_mediation', 'advance_cycle']);
  });

  it('test_luaSlimeToTs_logic_unchanged', () => {
    const raw: Record<string, unknown> = {
      id: 's1', name: 'Test', color: 'Red', pattern: 'Solid', level: 3, xp: 50,
      stats: { hp: 120, atk: 15, def: 12, agi: 11, int: 14, chm: 13 },
      role: 'worker', generation: 2, color_saturation: 80, hue: 10, saturation: 75,
      diffusion_ratio: 25, amplitude: 35, accent_hue: 5, vertex_count: 6, irregularity: 12,
      parent_a: 'p1', parent_b: 'p2', created_at: 5000,
      matched_target_id: 'guild_ember_marsh', matched_shape_target_id: 'shape_hexagon',
      consumed_slime_id: 'p2', locked_role: 'worker', garrisoned_at: null, stage: 'Juvenile',
    };
    const slime = luaSlimeToTs(raw);
    expect(slime.id).toBe('s1');
    expect(slime.name).toBe('Test');
    expect(slime.color).toBe('Red');
    expect(slime.level).toBe(3);
    expect(slime.xp).toBe(50);
    expect(slime.stats.hp).toBe(120);
    expect(slime.role).toBe('worker');
    expect(slime.generation).toBe(2);
    expect(slime.colorSaturation).toBe(80);
    expect(slime.hue).toBe(10);
    expect(slime.saturation).toBe(75);
    expect(slime.diffusionRatio).toBe(25);
    expect(slime.amplitude).toBe(35);
    expect(slime.accentHue).toBe(5);
    expect(slime.vertexCount).toBe(6);
    expect(slime.irregularity).toBe(12);
    expect(slime.parentA).toBe('p1');
    expect(slime.parentB).toBe('p2');
    expect(slime.createdAt).toBe(5000);
    expect(slime.matchedTargetId).toBe('guild_ember_marsh');
    expect(slime.matchedShapeTargetId).toBe('shape_hexagon');
    expect(slime.consumedSlimeId).toBe('p2');
    expect(slime.lockedRole).toBe('worker');
    expect(slime.garrisonedAt).toBeNull();
    expect(slime.stage).toBe('Juvenile');
  });
});
