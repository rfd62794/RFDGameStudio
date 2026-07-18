import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { luaSlimeToTs, slimeToLua, Slime, LabState } from '../src/games/slimeworld/types';
import { SHAPE_TARGETS, COLOR_TARGETS } from '../src/games/slimeworld/gameLogic';

const typesSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/types.ts'),
  'utf8'
);

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

const slimedexSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/SlimeDexTab.tsx'),
  'utf8'
);

const rosterSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/RosterTab.tsx'),
  'utf8'
);

describe('SlimeWorld Codex Wiring', () => {
  it('test_luaSlimeToTs_parses_matched_target_id', () => {
    const raw = {
      id: 's1', name: 'Test', color: 'Red', pattern: 'Solid', level: 1, xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle', generation: 0, created_at: 1000,
      matched_target_id: 'rival_ember_tide',
    };
    const slime = luaSlimeToTs(raw);
    expect(slime.matchedTargetId).toBe('rival_ember_tide');
  });

  it('test_luaSlimeToTs_parses_matched_shape_target_id', () => {
    const raw = {
      id: 's2', name: 'Test2', color: 'Blue', pattern: 'Solid', level: 1, xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle', generation: 0, created_at: 1000,
      matched_shape_target_id: 'shape_star',
    };
    const slime = luaSlimeToTs(raw);
    expect(slime.matchedShapeTargetId).toBe('shape_star');
  });

  it('test_luaSlimeToTs_parses_consumed_slime_id', () => {
    const raw = {
      id: 's3', name: 'Test3', color: 'Green', pattern: 'Solid', level: 1, xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle', generation: 0, created_at: 1000,
      consumed_slime_id: 'parent_b_001',
    };
    const slime = luaSlimeToTs(raw);
    expect(slime.consumedSlimeId).toBe('parent_b_001');
  });

  it('test_slimeToLua_roundtrips_matched_fields', () => {
    const slime: Slime = {
      id: 's4', name: 'Test4', color: 'Red', pattern: 'Solid', level: 1, xp: 0,
      stats: { hp: 100, atk: 10, def: 10, agi: 10, int: 10, chm: 10 },
      role: 'idle', generation: 0, createdAt: 1000,
      matchedTargetId: 'guild_ember_marsh',
      matchedShapeTargetId: 'shape_hexagon',
      consumedSlimeId: 'parent_b_002',
    };
    const raw = slimeToLua(slime);
    expect(raw['matched_target_id']).toBe('guild_ember_marsh');
    expect(raw['matched_shape_target_id']).toBe('shape_hexagon');
    expect(raw['consumed_slime_id']).toBe('parent_b_002');
  });

  it('test_SHAPE_TARGETS_has_23_entries', () => {
    expect(SHAPE_TARGETS.length).toBe(23);
    expect(SHAPE_TARGETS[0].id).toBe('shape_triangle');
    expect(SHAPE_TARGETS[22].id).toBe('shape_prismatic');
  });

  it('test_app_breeding_handler_updates_codex_on_match', () => {
    expect(appSource).toContain('colorTargetCodex');
    expect(appSource).toContain('shapeTargetCodex');
    expect(appSource).toContain('matchedTargetId');
    expect(appSource).toContain('matchedShapeTargetId');
    expect(appSource).toContain('newColorTargetCodex');
    expect(appSource).toContain('newShapeTargetCodex');
  });

  it('test_slimedex_renders_shape_codex_section', () => {
    expect(slimedexSource).toContain('SHAPE_TARGETS');
    expect(slimedexSource).toContain('shapeTargetCodex');
    expect(slimedexSource).toContain('Morphological Shape Targets');
    expect(slimedexSource).toContain('shapeTarget');
  });

  it('test_roster_surfaces_consumed_slime_id', () => {
    expect(rosterSource).toContain('lastConsumedSlimeId');
    expect(rosterSource).toContain('Specimen Consumed');
  });
});
