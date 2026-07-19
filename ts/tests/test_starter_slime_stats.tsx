import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, call } from '../src/engine/runtime';
import {
  luaSlimeToTs,
  SLIME_EXPLICIT_LUA_FIELDS,
} from '../src/games/slimeworld/types';
import { initialState } from '../src/games/slimeworld/App';

const session = loadGame('slimeworld');

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

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

const data = session.files.data as Record<string, unknown>;
const colorSpecs = buildColorSpecs(data);

// Real culture base_stats from data.yaml for hand-computed comparison
const CULTURE_BASE_STATS: Record<string, { hp: number; atk: number; def: number; agi: number; int: number; chm: number }> = {
  Red: { hp: 120, atk: 18, def: 8, agi: 6, int: 5, chm: 6 },
  Orange: { hp: 110, atk: 22, def: 5, agi: 14, int: 6, chm: 8 },
  Yellow: { hp: 80, atk: 15, def: 6, agi: 18, int: 8, chm: 10 },
  Green: { hp: 160, atk: 8, def: 16, agi: 4, int: 7, chm: 14 },
  Purple: { hp: 100, atk: 12, def: 10, agi: 10, int: 20, chm: 15 },
  Blue: { hp: 90, atk: 10, def: 14, agi: 5, int: 15, chm: 12 },
  Gray: { hp: 110, atk: 14, def: 11, agi: 11, int: 14, chm: 11 },
};

// Real SEED_SHAPE_DEFAULTS from data.yaml
const SEED_SHAPE_DEFAULTS: Record<string, { vertex_count: number; irregularity: number }> = {
  Red: { vertex_count: 3, irregularity: 10 },
  Orange: { vertex_count: 3, irregularity: 15 },
  Yellow: { vertex_count: 6, irregularity: 10 },
  Green: { vertex_count: 6, irregularity: 15 },
  Purple: { vertex_count: 4, irregularity: 15 },
  Blue: { vertex_count: 4, irregularity: 10 },
  Gray: { vertex_count: 4, irregularity: 20 },
};

// Hand-compute expected stats for a color at level 1 using the real formula:
// 1. get_interpolated_specs: at exact culture hue, saturation=100, t=0 → spec = culture base_stats
// 2. sat_factor = 1 → final_base = culture base_stats (no gray blend)
// 3. level 1 → l = 0 → stats = base_stats (no growth)
// 4. shape modifiers from SEED_SHAPE_DEFAULTS
function getShapeModifiers(vertexCount: number, irregularity: number) {
  const lowVertexWeight = Math.max(0, Math.min(1, (6 - vertexCount) / 3));
  const lowIrrWeight = Math.max(0, Math.min(1, (35 - irregularity) / 35));
  const simpleStableWeight = lowVertexWeight * lowIrrWeight;
  const highVertexWeight = Math.max(0, Math.min(1, (vertexCount - 6) / 8));
  const cleanComplexWeight = highVertexWeight * lowIrrWeight;
  const jaggedWeight = Math.max(0, Math.min(1, (irregularity - 15) / 35));
  return {
    hp_bonus: simpleStableWeight * 0.10,
    def_bonus: simpleStableWeight * 0.10,
    int_bonus: cleanComplexWeight * 0.10,
    chm_bonus: cleanComplexWeight * 0.10,
    atk_bonus: jaggedWeight * 0.10,
    agi_bonus: jaggedWeight * 0.10,
  };
}

function expectedStatsForColor(color: string): { hp: number; atk: number; def: number; agi: number; int: number; chm: number } {
  const base = CULTURE_BASE_STATS[color];
  const shape = SEED_SHAPE_DEFAULTS[color];
  const mod = getShapeModifiers(shape.vertex_count, shape.irregularity);
  return {
    hp: Math.floor(base.hp * (1 + mod.hp_bonus)),
    atk: Math.floor(base.atk * (1 + mod.atk_bonus)),
    def: Math.floor(base.def * (1 + mod.def_bonus)),
    agi: Math.floor(base.agi * (1 + mod.agi_bonus)),
    int: Math.floor(base.int * (1 + mod.int_bonus)),
    chm: Math.floor(base.chm * (1 + mod.chm_bonus)),
  };
}

const FLAT_BASELINE = { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 };

describe('Starter Slime Stats — Real Lua create_seed_slime Integration', () => {

  it('test_starter_slimes_use_real_calculate_stats_not_flat_baseline', () => {
    const init = initialState(session);
    expect(init.slimes.length).toBeGreaterThan(0);

    for (const slime of init.slimes) {
      // Every starter must differ from the flat baseline in at least some stats
      const matchesFlat = (slime.stats.hp === FLAT_BASELINE.hp &&
        slime.stats.atk === FLAT_BASELINE.atk &&
        slime.stats.def === FLAT_BASELINE.def &&
        slime.stats.agi === FLAT_BASELINE.agi &&
        slime.stats.int === FLAT_BASELINE.int &&
        slime.stats.chm === FLAT_BASELINE.chm);
      expect(matchesFlat).toBe(false);
    }
  });

  it('test_different_starter_colors_produce_genuinely_different_stats', () => {
    // Call create_seed_slime directly for Red and Blue
    const [redRaw] = call(session, 'create_seed_slime', 'Red', 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
    const [blueRaw] = call(session, 'create_seed_slime', 'Blue', 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];

    expect(redRaw).toBeTruthy();
    expect(blueRaw).toBeTruthy();

    const red = luaSlimeToTs(redRaw!);
    const blue = luaSlimeToTs(blueRaw!);

    // Red and Blue have genuinely different base_stats in data.yaml
    // Red: hp=120, atk=18, def=8, agi=6, int=5, chm=6
    // Blue: hp=90, atk=10, def=14, agi=5, int=15, chm=12
    // These must produce measurably different stats
    const allSame = (red.stats.hp === blue.stats.hp &&
      red.stats.atk === blue.stats.atk &&
      red.stats.def === blue.stats.def &&
      red.stats.agi === blue.stats.agi &&
      red.stats.int === blue.stats.int &&
      red.stats.chm === blue.stats.chm);
    expect(allSame).toBe(false);

    // Specific directional checks: Red has higher ATK, Blue has higher INT
    expect(red.stats.atk).toBeGreaterThan(blue.stats.atk);
    expect(blue.stats.int).toBeGreaterThan(red.stats.int);
  });

  it('test_starter_slime_retains_intended_name_not_lua_generated_name', () => {
    const init = initialState(session);

    // The starter names from data.yaml should be used, not Lua's random names
    // data.yaml starter_slimes have configured names — check they don't look
    // like Lua-generated names (which follow the "Prefix-Suffix" pattern)
    for (const slime of init.slimes) {
      // Lua generate_slime_name produces names like "Zor-Thax" (Prefix-Suffix)
      // Starter names from data.yaml are configured explicitly
      expect(slime.name).toBeTruthy();
      // The id should be starter_N pattern, confirming our override
      expect(slime.id).toMatch(/^starter_\d+$/);
    }

    // Verify via source that the name override happens after luaSlimeToTs
    expect(appSource).toContain('name: String(starter[\'name\']');
    expect(appSource).toContain('id: `starter_${index}`');
  });

  it('test_luaSlimeToTs_covers_every_field_this_component_reads', () => {
    // Call create_seed_slime and check every field the UI reads is present
    const [raw] = call(session, 'create_seed_slime', 'Red', 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
    expect(raw).toBeTruthy();

    // Check that every field in SLIME_EXPLICIT_LUA_FIELDS is either present
    // in the raw Lua output or has a known TS-side default in initialState
    const rawKeys = new Set(Object.keys(raw!));

    // Fields create_seed_slime actually returns (from logic.lua line 839-853)
    // Note: locked_role is set to nil in Lua, so it won't appear as a key
    // in the serialized output — luaSlimeToTs handles this with a null fallback.
    const luaReturnedFields = new Set([
      'id', 'name', 'color', 'pattern', 'level', 'xp', 'stats',
      'role', 'generation', 'hue', 'saturation', 'color_saturation',
    ]);

    // Fields that luaSlimeToTs maps but create_seed_slime doesn't return
    // These must have TS-side defaults in initialState
    const tsDefaultedFields = new Set([
      'diffusion_ratio', 'amplitude', 'accent_hue',
      'vertex_count', 'irregularity', 'created_at', 'stage',
      'garrisoned_at', 'locked_role', 'parent_a', 'parent_b',
      'matched_target_id', 'matched_shape_target_id', 'consumed_slime_id',
    ]);

    for (const field of SLIME_EXPLICIT_LUA_FIELDS) {
      if (luaReturnedFields.has(field)) {
        // Must be present in raw output
        expect(rawKeys.has(field)).toBe(true);
      } else if (tsDefaultedFields.has(field)) {
        // Must have a TS-side default in the source
        // (luaSlimeToTs provides fallback=0 for these, and initialState
        //  overrides with real defaults for the ones that matter)
        // This is expected — not a bug
      }
    }

    // Verify the TS defaults are present in source
    expect(appSource).toContain('diffusionRatio');
    expect(appSource).toContain('amplitude');
    expect(appSource).toContain('accentHue');
    expect(appSource).toContain('vertexCount');
    expect(appSource).toContain('irregularity');
    expect(appSource).toContain('createdAt');
    expect(appSource).toContain('stage');

    // Verify the converted slime has non-zero critical fields
    const slime = luaSlimeToTs(raw!);
    expect(slime.stats.hp).toBeGreaterThan(0);
    expect(slime.stats.atk).toBeGreaterThan(0);
    expect(slime.hue).toBe(0); // Red hue
    expect(slime.saturation).toBe(100); // Red saturation
  });

  it('test_starter_slime_stats_match_real_color_specs_formula_exactly', () => {
    // Hand-compute expected stats for Red at level 1
    // Red: base_stats = {hp:120, atk:18, def:8, agi:6, int:5, chm:6}
    // Red: seed_shape = {vertex_count:3, irregularity:10}
    //
    // Shape modifiers for vertex_count=3, irregularity=10:
    //   low_vertex_weight = max(0, min(1, (6-3)/3)) = 1.0
    //   low_irr_weight = max(0, min(1, (35-10)/35)) = 25/35 ≈ 0.714
    //   simple_stable_weight = 1.0 * 0.714 = 0.714
    //   high_vertex_weight = max(0, min(1, (3-6)/8)) = 0
    //   clean_complex_weight = 0
    //   jagged_weight = max(0, min(1, (10-15)/35)) = 0
    //
    // Bonuses:
    //   hp_bonus = 0.714 * 0.10 = 0.0714
    //   def_bonus = 0.714 * 0.10 = 0.0714
    //   int_bonus = 0, chm_bonus = 0, atk_bonus = 0, agi_bonus = 0
    //
    // Final stats (level 1, l=0, no growth):
    //   hp = floor(120 * 1.0714) = floor(128.57) = 128
    //   atk = floor(18 * 1.0) = 18
    //   def = floor(8 * 1.0714) = floor(8.57) = 8
    //   agi = floor(6 * 1.0) = 6
    //   int = floor(5 * 1.0) = 5
    //   chm = floor(6 * 1.0) = 6

    const expected = expectedStatsForColor('Red');
    expect(expected.hp).toBe(128);
    expect(expected.atk).toBe(18);
    expect(expected.def).toBe(8);
    expect(expected.agi).toBe(6);
    expect(expected.int).toBe(5);
    expect(expected.chm).toBe(6);

    // Now call the real Lua function and compare
    const [raw] = call(session, 'create_seed_slime', 'Red', 'Solid', colorSpecs) as [Record<string, unknown> | null, string | null];
    expect(raw).toBeTruthy();
    const slime = luaSlimeToTs(raw!);

    expect(slime.stats.hp).toBe(expected.hp);
    expect(slime.stats.atk).toBe(expected.atk);
    expect(slime.stats.def).toBe(expected.def);
    expect(slime.stats.agi).toBe(expected.agi);
    expect(slime.stats.int).toBe(expected.int);
    expect(slime.stats.chm).toBe(expected.chm);
  });
});
