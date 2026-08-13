import { describe, it, expect } from 'vitest';
import {
  hungerToBodyScale,
  hungerToAngularityBonus,
  buildTeardropFinSpecWithHunger,
  FISH_MAX_HUNGER,
  SHARK_MAX_HUNGER,
} from '../src/games/shoal/art/shoal.config';
import { hungerToBand, HUNGER_BANDS, hungerBandToScale } from '../src/games/shoal/art/pathCache';

/**
 * test_hunger_visual_mapping_monotonic
 *
 * Silhouette scale decreases monotonically as hunger increases toward
 * starve_limit, using real confirmed value ranges.
 *
 * Real ranges (from data.yaml + entities.lua):
 *   Fish: hunger 0 to ~1.0 (hunger_rate 0.05/sec, grazing -1.0)
 *   Shark: hunger 0 to 20 (starve_limit=20, eating -4 or -3)
 */
describe('test_hunger_visual_mapping_monotonic', () => {
  it('FISH_MAX_HUNGER is 1.0 (hunger_rate 0.05 * 20s)', () => {
    expect(FISH_MAX_HUNGER).toBe(1.0);
  });

  it('SHARK_MAX_HUNGER is 20 (starve_limit from data.yaml)', () => {
    expect(SHARK_MAX_HUNGER).toBe(20);
  });

  it('hungerToBodyScale: 0 hunger → 1.0 (full silhouette)', () => {
    expect(hungerToBodyScale(0, FISH_MAX_HUNGER)).toBe(1.0);
    expect(hungerToBodyScale(0, SHARK_MAX_HUNGER)).toBe(1.0);
  });

  it('hungerToBodyScale: max hunger → 0.7 (lean silhouette)', () => {
    expect(hungerToBodyScale(FISH_MAX_HUNGER, FISH_MAX_HUNGER)).toBe(0.7);
    expect(hungerToBodyScale(SHARK_MAX_HUNGER, SHARK_MAX_HUNGER)).toBe(0.7);
  });

  it('hungerToBodyScale is monotonically decreasing for fish (0 → 1.0)', () => {
    let prevScale = 2.0;
    for (let h = 0; h <= FISH_MAX_HUNGER; h += 0.05) {
      const scale = hungerToBodyScale(h, FISH_MAX_HUNGER);
      expect(scale).toBeLessThanOrEqual(prevScale);
      prevScale = scale;
    }
  });

  it('hungerToBodyScale is monotonically decreasing for shark (0 → 20)', () => {
    let prevScale = 2.0;
    for (let h = 0; h <= SHARK_MAX_HUNGER; h += 0.5) {
      const scale = hungerToBodyScale(h, SHARK_MAX_HUNGER);
      expect(scale).toBeLessThanOrEqual(prevScale);
      prevScale = scale;
    }
  });

  it('hungerToAngularityBonus: 0 hunger → 0 bonus angularity', () => {
    expect(hungerToAngularityBonus(0, FISH_MAX_HUNGER)).toBe(0);
    expect(hungerToAngularityBonus(0, SHARK_MAX_HUNGER)).toBe(0);
  });

  it('hungerToAngularityBonus: max hunger → +30 angularity (visibly leaner)', () => {
    expect(hungerToAngularityBonus(FISH_MAX_HUNGER, FISH_MAX_HUNGER)).toBe(30);
    expect(hungerToAngularityBonus(SHARK_MAX_HUNGER, SHARK_MAX_HUNGER)).toBe(30);
  });

  it('hungerToAngularityBonus is monotonically increasing (more hunger = more angular)', () => {
    let prevAng = -1;
    for (let h = 0; h <= SHARK_MAX_HUNGER; h += 0.5) {
      const ang = hungerToAngularityBonus(h, SHARK_MAX_HUNGER);
      expect(ang).toBeGreaterThanOrEqual(prevAng);
      prevAng = ang;
    }
  });

  it('buildTeardropFinSpecWithHunger: starving fish has more angularity than full fish', () => {
    const fullSpec = buildTeardropFinSpecWithHunger('fish', 'mature', 0, 0);
    const starvingSpec = buildTeardropFinSpecWithHunger('fish', 'mature', FISH_MAX_HUNGER, 0);
    expect(starvingSpec.angularity).toBeGreaterThan(fullSpec.angularity);
  });

  it('buildTeardropFinSpecWithHunger: starving shark has more angularity than full shark', () => {
    const fullSpec = buildTeardropFinSpecWithHunger('shark', 'mature', 0, 0);
    const starvingSpec = buildTeardropFinSpecWithHunger('shark', 'mature', SHARK_MAX_HUNGER, 0);
    expect(starvingSpec.angularity).toBeGreaterThan(fullSpec.angularity);
  });

  it('hungerToBand: 0 hunger → band 0 (full)', () => {
    expect(hungerToBand(0, FISH_MAX_HUNGER)).toBe(0);
    expect(hungerToBand(0, SHARK_MAX_HUNGER)).toBe(0);
  });

  it('hungerToBand: max hunger → band 4 (starving)', () => {
    expect(hungerToBand(FISH_MAX_HUNGER, FISH_MAX_HUNGER)).toBe(HUNGER_BANDS - 1);
    expect(hungerToBand(SHARK_MAX_HUNGER, SHARK_MAX_HUNGER)).toBe(HUNGER_BANDS - 1);
  });

  it('hungerBandToScale: band 0 → 1.0, band 4 → 0.7 (monotonic decrease)', () => {
    expect(hungerBandToScale(0)).toBe(1.0);
    expect(hungerBandToScale(HUNGER_BANDS - 1)).toBe(0.7);
    let prev = 2.0;
    for (let b = 0; b < HUNGER_BANDS; b++) {
      const scale = hungerBandToScale(b);
      expect(scale).toBeLessThanOrEqual(prev);
      prev = scale;
    }
  });

  it('hunger values beyond max clamp correctly (no overshoot)', () => {
    expect(hungerToBodyScale(999, SHARK_MAX_HUNGER)).toBe(0.7);
    expect(hungerToBodyScale(-5, SHARK_MAX_HUNGER)).toBe(1.0);
    expect(hungerToAngularityBonus(999, SHARK_MAX_HUNGER)).toBe(30);
    expect(hungerToAngularityBonus(-5, SHARK_MAX_HUNGER)).toBe(0);
  });
});
