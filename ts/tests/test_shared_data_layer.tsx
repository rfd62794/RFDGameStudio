import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame, getStaticList } from '../src/engine/runtime';
import { RuntimeError } from '../src/engine/types';

const session = loadGame('slimeworld');

const slimedexSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/components/SlimeDexTab.tsx'),
  'utf8'
);

const gameLogicSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/gameLogic.ts'),
  'utf8'
);

describe('Shared Data Layer — getStaticList', () => {
  it('test_getStaticList_returns_real_color_targets', () => {
    const colorTargets = getStaticList(session, 'color_targets') as Array<Record<string, unknown>>;
    expect(colorTargets.length).toBe(17);
    expect(colorTargets[0]['id']).toBe('guild_ember_marsh');
    expect(colorTargets[16]['id']).toBe('skip_marsh_tundra_tide');
    expect(colorTargets[0]).toHaveProperty('center_hues');
    expect(colorTargets[0]).toHaveProperty('saturation_min');
    expect(colorTargets[0]).toHaveProperty('saturation_max');
    expect(colorTargets[0]).toHaveProperty('tolerance');
  });

  it('test_getStaticList_returns_real_shape_targets', () => {
    const shapeTargets = getStaticList(session, 'shape_targets') as Array<Record<string, unknown>>;
    expect(shapeTargets.length).toBe(23);
    expect(shapeTargets[0]['id']).toBe('shape_triangle');
    expect(shapeTargets[22]['id']).toBe('shape_prismatic');
    expect(shapeTargets[0]).toHaveProperty('vertex_count');
    expect(shapeTargets[0]).toHaveProperty('vertex_tolerance');
    expect(shapeTargets[0]).toHaveProperty('irregularity_max');
  });

  it('test_getStaticList_throws_on_missing_key', () => {
    expect(() => getStaticList(session, 'nonexistent_key')).toThrow(RuntimeError);
    expect(() => getStaticList(session, 'nonexistent_key')).toThrow(/Static list not found/);
  });

  it('test_slimedex_renders_from_live_data', () => {
    expect(slimedexSource).toContain('getStaticList');
    expect(slimedexSource).toContain("getStaticList(session, 'color_targets')");
    expect(slimedexSource).toContain("getStaticList(session, 'shape_targets')");
    expect(slimedexSource).not.toContain('COLOR_TARGETS');
    expect(slimedexSource).not.toContain('SHAPE_TARGETS');
    expect(slimedexSource).toContain('center_hues');
    expect(slimedexSource).toContain('saturation_min');
    expect(slimedexSource).toContain('saturation_max');
    expect(slimedexSource).toContain('vertex_count');
    expect(slimedexSource).toContain('irregularity_min');
    expect(slimedexSource).toContain('irregularity_max');
    expect(gameLogicSource).not.toContain('COLOR_TARGETS');
    expect(gameLogicSource).not.toContain('SHAPE_TARGETS');
  });
});
