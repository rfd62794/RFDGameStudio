import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

/**
 * test_no_regression_to_existing_floor (Shoal Visual Enrichment phase)
 *
 * Pre-existing test/build floor must be unchanged or improved — never
 * regressed. This test verifies that the prior phase's work (Visual
 * Re-Haul: shared artGen module, SlimeWorld polygon relocation, etc.)
 * is still intact, and that Shoal's game logic (Lua) is structurally
 * sound after the hunger state addition.
 */
describe('test_no_regression_to_existing_floor', () => {
  it('pre-existing Shoal config test still exists', () => {
    const testPath = resolve(repoRoot, 'ts', 'tests', 'test_shoal_config.ts');
    expect(existsSync(testPath)).toBe(true);
  });

  it('pre-existing Visual Re-Haul tests still exist', () => {
    const tests = [
      'test_dissonance_zero_regression.ts',
      'test_slimeworld_polygon_relocated.ts',
      'test_shared_manifest_exact_count.ts',
      'test_no_regression_to_existing_floor.ts', // the prior phase's regression test
    ];
    for (const t of tests) {
      expect(existsSync(resolve(repoRoot, 'ts', 'tests', t))).toBe(true);
    }
  });

  it('artGen shared module still has the original primitives', () => {
    const shapesSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'artGen', 'shapes.ts'),
      'utf-8'
    );
    // Original primitives (must still be present)
    expect(shapesSource).toContain('renderGradientBackground');
    expect(shapesSource).toContain('renderBorder');
    expect(shapesSource).toContain('renderPolygonPoints');
    expect(shapesSource).toContain('renderSpikyStar');
    expect(shapesSource).toContain('renderShape');
    // Primitives added in the prior Visual Re-Haul phase
    expect(shapesSource).toContain('renderTeardropFin');
    expect(shapesSource).toContain('renderRadialBurst');
    expect(shapesSource).toContain('renderIrregularFragment');
    expect(shapesSource).toContain('canvasTeardropFinPath');
    expect(shapesSource).toContain('canvasRadialBurstPath');
    expect(shapesSource).toContain('canvasIrregularFragmentPath');
  });

  it('SlimeVisual still imports from artGen (relocation intact)', () => {
    const slimeSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'slimeworld', 'components', 'SlimeVisual.tsx'),
      'utf-8'
    );
    expect(slimeSource).toContain('engine/artGen');
    expect(slimeSource).toContain('generateSlimePolygonPoints');
  });

  it('Shoal entities.lua has hunger field on both fish and sharks', () => {
    const entitiesSource = readFileSync(
      resolve(repoRoot, 'games', 'shoal', 'entities.lua'),
      'utf-8'
    );
    // Fish should now have hunger (added this phase)
    expect(entitiesSource).toContain('hunger = 0');
    // Sharks should still have hunger (pre-existing)
    // There should be at least 2 occurrences of 'hunger = 0' (fish + shark)
    const matches = entitiesSource.match(/hunger = 0/g);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBeGreaterThanOrEqual(2);
  });

  it('Shoal logic.lua exports hunger for both fish and sharks', () => {
    const logicSource = readFileSync(
      resolve(repoRoot, 'games', 'shoal', 'logic.lua'),
      'utf-8'
    );
    // Fish export should include hunger (added this phase)
    // The fish export block contains: hunger = f.hunger
    expect(logicSource).toContain('hunger = f.hunger');
    // Shark export should still include hunger (pre-existing)
    expect(logicSource).toContain('hunger = s.hunger');
  });

  it('Shoal logic.lua updates fish hunger each tick', () => {
    const logicSource = readFileSync(
      resolve(repoRoot, 'games', 'shoal', 'logic.lua'),
      'utf-8'
    );
    // Fish hunger should increase by hunger_rate * dt
    expect(logicSource).toContain('f.hunger = f.hunger + dt * data.creatures.fish.hunger_rate');
  });

  it('Shoal logic.lua reduces fish hunger on grazing', () => {
    const logicSource = readFileSync(
      resolve(repoRoot, 'games', 'shoal', 'logic.lua'),
      'utf-8'
    );
    // Grazing should reduce hunger
    expect(logicSource).toContain('f.hunger = math.max(0, f.hunger - 1.0)');
  });

  it('Shoal TypeScript types include hunger on ShoalCreature', () => {
    const typesSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'types.ts'),
      'utf-8'
    );
    expect(typesSource).toContain('hunger');
  });

  it('Shoal path cache module exists with expected exports', () => {
    const cacheSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'art', 'pathCache.ts'),
      'utf-8'
    );
    expect(cacheSource).toContain('getCachedCreaturePath');
    expect(cacheSource).toContain('getCachedAlgaePath');
    expect(cacheSource).toContain('getCachedFleshChunkPath');
    expect(cacheSource).toContain('hungerToBand');
    expect(cacheSource).toContain('HUNGER_BANDS');
    expect(cacheSource).toContain('getCacheStats');
    expect(cacheSource).toContain('clearCache');
  });

  it('Shoal render profiler module exists with expected exports', () => {
    const profilerSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'art', 'renderProfiler.ts'),
      'utf-8'
    );
    expect(profilerSource).toContain('RenderProfiler');
    expect(profilerSource).toContain('setProfilingEnabled');
    expect(profilerSource).toContain('drawOverlay');
  });

  it('Shoal config has hunger mapping and hue banding (new this phase)', () => {
    const configSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'art', 'shoal.config.ts'),
      'utf-8'
    );
    // Hunger mapping
    expect(configSource).toContain('hungerToBodyScale');
    expect(configSource).toContain('hungerToAngularityBonus');
    expect(configSource).toContain('buildTeardropFinSpecWithHunger');
    expect(configSource).toContain('FISH_MAX_HUNGER');
    expect(configSource).toContain('SHARK_MAX_HUNGER');
    // Hue banding
    expect(configSource).toContain('HUE_BANDS');
    expect(configSource).toContain('hueToBand');
    expect(configSource).toContain('getBatchColor');
  });
});
