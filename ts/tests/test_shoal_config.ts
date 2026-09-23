import { describe, it, expect } from 'vitest';
import {
  buildTeardropFinSpec,
  buildAlgaeSpec,
  buildFleshChunkSpec,
  inheritHue,
  applyAgeSaturation,
  AGE_CURVE,
  ageStageFromCreature,
  DEFAULT_DRIFT_RANGE,
} from '../src/games/shoal/art/shoal.config';
import { renderTeardropFin, renderRadialBurst, renderIrregularFragment } from '../src/engine/artGen/shapes';

/**
 * test_shoal_config_produces_distinct_species_shapes
 *
 * Fish, shark, algae, and fleshChunk each produce visually distinguishable
 * output. This is a shape-family check, not a pixel comparison — we verify
 * that the generated SVG strings are different from each other and use the
 * expected shape primitives.
 */
describe('test_shoal_config_produces_distinct_species_shapes', () => {
  it('fish and shark produce different teardrop-fin specs', () => {
    const fishSpec = buildTeardropFinSpec('fish', 'mature', 0);
    const sharkSpec = buildTeardropFinSpec('shark', 'mature', 0);
    expect(fishSpec.scale).toBeLessThan(sharkSpec.scale);
    expect(fishSpec.angularity).toBeLessThan(sharkSpec.angularity);
    expect(fishSpec.dorsalFin).toBe(false);
    expect(sharkSpec.dorsalFin).toBe(true);
  });

  it('fish and shark produce different SVG output', () => {
    const fishSpec = buildTeardropFinSpec('fish', 'mature', 0);
    const sharkSpec = buildTeardropFinSpec('shark', 'mature', 0);
    const fishSvg = renderTeardropFin(fishSpec);
    const sharkSvg = renderTeardropFin(sharkSpec);
    expect(fishSvg).not.toBe(sharkSvg);
  });

  it('algae produces radial burst output (not teardrop)', () => {
    const spec = buildAlgaeSpec(3, '#10b981', 0);
    const svg = renderRadialBurst(spec);
    expect(svg).toContain('<polygon');
    expect(svg).toContain('fill="#10b981"');
  });

  it('fleshChunk produces irregular fragment output (not teardrop or radial burst)', () => {
    const spec = buildFleshChunkSpec('#f43f5e', 0);
    const svg = renderIrregularFragment(spec);
    expect(svg).toContain('<polygon');
    expect(svg).toContain('fill="#f43f5e"');
  });

  it('all four species produce mutually distinct SVG output', () => {
    const fishSvg = renderTeardropFin(buildTeardropFinSpec('fish', 'mature', 0));
    const sharkSvg = renderTeardropFin(buildTeardropFinSpec('shark', 'mature', 0));
    const algaeSvg = renderRadialBurst(buildAlgaeSpec(3, '#10b981', 0));
    const fleshSvg = renderIrregularFragment(buildFleshChunkSpec('#f43f5e', 0));

    const svgs = [fishSvg, sharkSvg, algaeSvg, fleshSvg];
    // Every pair must be different
    for (let i = 0; i < svgs.length; i++) {
      for (let j = i + 1; j < svgs.length; j++) {
        expect(svgs[i]).not.toBe(svgs[j]);
      }
    }
  });

  it('shark output includes dorsal fin path (3 paths), fish does not (2 paths)', () => {
    const fishSvg = renderTeardropFin(buildTeardropFinSpec('fish', 'mature', 0));
    const sharkSvg = renderTeardropFin(buildTeardropFinSpec('shark', 'mature', 0));
    const fishPathCount = (fishSvg.match(/<path/g) || []).length;
    const sharkPathCount = (sharkSvg.match(/<path/g) || []).length;
    expect(fishPathCount).toBe(2); // body + tail
    expect(sharkPathCount).toBe(3); // body + tail + dorsal
  });
});

/**
 * test_shoal_lineage_color_inheritance
 *
 * A generated offspring's base hue is within expected mutation-drift range
 * of its parent's, across N seeded trials.
 */
describe('test_shoal_lineage_color_inheritance', () => {
  it('offspring hue is within drift range of parent', () => {
    const parentHue = 180; // cyan
    const trials = 100;
    for (let i = 0; i < trials; i++) {
      const offspringId = `offspring_${i}`;
      const offspringHue = inheritHue(parentHue, offspringId, DEFAULT_DRIFT_RANGE);
      // Compute shortest angular distance
      let diff = Math.abs(offspringHue - parentHue);
      if (diff > 180) diff = 360 - diff;
      expect(diff).toBeLessThanOrEqual(DEFAULT_DRIFT_RANGE);
    }
  });

  it('same offspring id always produces the same hue (deterministic)', () => {
    const parentHue = 45;
    const offspringId = 'test_offspring_001';
    const hue1 = inheritHue(parentHue, offspringId);
    const hue2 = inheritHue(parentHue, offspringId);
    const hue3 = inheritHue(parentHue, offspringId);
    expect(hue1).toBe(hue2);
    expect(hue2).toBe(hue3);
  });

  it('different offspring ids produce different hues (not all clones)', () => {
    const parentHue = 200;
    const hues = new Set<number>();
    for (let i = 0; i < 50; i++) {
      hues.add(inheritHue(parentHue, `offspring_${i}`));
    }
    // With ±15 degree drift and 50 trials, we should get many distinct hues
    expect(hues.size).toBeGreaterThan(10);
  });

  it('hue wraps correctly around 0/360 boundary', () => {
    const parentHue = 5; // near 0
    const offspringHue = inheritHue(parentHue, 'edge_test_1', 15);
    expect(offspringHue).toBeGreaterThanOrEqual(0);
    expect(offspringHue).toBeLessThan(360);
    // Should be in range [350, 20] (wrapping)
    const diff = offspringHue < 180 ? offspringHue : 360 - offspringHue;
    expect(diff).toBeLessThanOrEqual(20); // within drift + small tolerance
  });
});

/**
 * test_shoal_age_curve_monotonic
 *
 * Saturation/scale values move through young→mature→old in the specified
 * direction, no reversals.
 */
describe('test_shoal_age_curve_monotonic', () => {
  it('saturation: young < mature, old < mature (reduced at both ends)', () => {
    expect(AGE_CURVE.young.saturationMultiplier).toBeLessThan(AGE_CURVE.mature.saturationMultiplier);
    expect(AGE_CURVE.old.saturationMultiplier).toBeLessThan(AGE_CURVE.mature.saturationMultiplier);
  });

  it('scale: young < mature, old = mature (post-growth, no shrink)', () => {
    expect(AGE_CURVE.young.scaleMultiplier).toBeLessThan(AGE_CURVE.mature.scaleMultiplier);
    expect(AGE_CURVE.old.scaleMultiplier).toBe(AGE_CURVE.mature.scaleMultiplier);
  });

  it('mature has full saturation (1.0) and full scale (1.0)', () => {
    expect(AGE_CURVE.mature.saturationMultiplier).toBe(1.0);
    expect(AGE_CURVE.mature.scaleMultiplier).toBe(1.0);
  });

  it('applyAgeSaturation produces lower saturation for young/old vs mature', () => {
    const hue = 180;
    const baseSat = 0.8;
    const matureColor = applyAgeSaturation(hue, baseSat, 'mature');
    const youngColor = applyAgeSaturation(hue, baseSat, 'young');
    const oldColor = applyAgeSaturation(hue, baseSat, 'old');
    // Extract saturation percentage from hsl() string
    const extractSat = (hsl: string) => parseFloat(hsl.match(/,\s*(\d+)%/)?.[1] ?? '0');
    expect(extractSat(matureColor)).toBeGreaterThan(extractSat(youngColor));
    expect(extractSat(matureColor)).toBeGreaterThan(extractSat(oldColor));
  });

  it('ageStageFromCreature maps mature=true to mature, false to young', () => {
    expect(ageStageFromCreature(true)).toBe('mature');
    expect(ageStageFromCreature(false)).toBe('young');
  });

  it('teardrop fin scale is smaller for young than mature', () => {
    const youngSpec = buildTeardropFinSpec('fish', 'young', 0);
    const matureSpec = buildTeardropFinSpec('fish', 'mature', 0);
    expect(youngSpec.scale).toBeLessThan(matureSpec.scale);
  });
});
