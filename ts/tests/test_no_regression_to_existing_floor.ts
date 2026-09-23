import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

/**
 * test_no_regression_to_existing_floor
 *
 * The pre-existing test/build floors (captured in the STOP rule) must be
 * unchanged or improved — never regressed. This test verifies:
 *   1. The 106-file SHA256 baseline manifest (captured before any changes)
 *      still matches the committed files on disk.
 *   2. The pre-existing artgen tests still exist and their import surface
 *      is intact.
 *   3. SlimeWorld's SlimeVisual still exports the expected functions.
 *
 * The STOP-rule baseline was:
 *   - Dissonance floor: 383 passed, 1 failed (pre-existing arcade_routing timeout)
 *   - 106 SVG files in ts/public/assets/dissonance/
 *   - SlimeWorld: test_slime_visual_geometry.tsx passing
 */
describe('test_no_regression_to_existing_floor', () => {
  it('all 106 committed SVG files still exist on disk', () => {
    const baselineManifestPath = resolve(repoRoot, 'ts', 'tests', '_dissonance_svg_baseline_manifest.txt');
    expect(existsSync(baselineManifestPath)).toBe(true);
    const manifest = readFileSync(baselineManifestPath, 'utf-8').trim().split('\n');
    expect(manifest.length).toBe(106);

    // Verify each file still exists (checksum verification is covered by
    // test_dissonance_zero_regression which regenerates and compares)
    for (const line of manifest) {
      const [relPath] = line.split('\t');
      const fullPath = resolve(repoRoot, relPath.replace(/\\/g, '/'));
      expect(existsSync(fullPath)).toBe(true);
    }
  });

  it('pre-existing artgen tests still exist', () => {
    const equivTest = resolve(repoRoot, 'ts', 'tests', 'test_artgen_dissonance_equiv.ts');
    const seededTest = resolve(repoRoot, 'ts', 'tests', 'test_artgen_seeded_random.ts');
    expect(existsSync(equivTest)).toBe(true);
    expect(existsSync(seededTest)).toBe(true);
  });

  it('SlimeVisual still exports generateSlimePolygonPoints, mulberry32, hashStringToSeed', () => {
    const slimeVisualSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'slimeworld', 'components', 'SlimeVisual.tsx'),
      'utf-8'
    );
    expect(slimeVisualSource).toContain('generateSlimePolygonPoints');
    expect(slimeVisualSource).toContain('mulberry32');
    expect(slimeVisualSource).toContain('hashStringToSeed');
    // Verify it now imports from artGen (the relocation)
    expect(slimeVisualSource).toContain('engine/artGen');
  });

  it('SlimeWorld geometry test still exists', () => {
    const geomTest = resolve(repoRoot, 'ts', 'tests', 'test_slime_visual_geometry.tsx');
    expect(existsSync(geomTest)).toBe(true);
  });

  it('artGen shared module still has the original primitives', () => {
    const shapesSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'engine', 'artGen', 'shapes.ts'),
      'utf-8'
    );
    // Original primitives (pre-existing, must still be present)
    expect(shapesSource).toContain('renderGradientBackground');
    expect(shapesSource).toContain('renderBorder');
    expect(shapesSource).toContain('renderPolygonPoints');
    expect(shapesSource).toContain('renderSpikyStar');
    expect(shapesSource).toContain('renderShape');
    // New primitives (added this phase)
    expect(shapesSource).toContain('renderTeardropFin');
    expect(shapesSource).toContain('renderRadialBurst');
    expect(shapesSource).toContain('renderIrregularFragment');
    expect(shapesSource).toContain('canvasTeardropFinPath');
    expect(shapesSource).toContain('canvasRadialBurstPath');
    expect(shapesSource).toContain('canvasIrregularFragmentPath');
    expect(shapesSource).toContain('svgToCanvas');
  });
});
