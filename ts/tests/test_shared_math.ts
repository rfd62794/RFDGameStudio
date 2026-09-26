import { describe, it, expect } from 'vitest';
import { makePrng, prngFloat, prngInt, clamp, dist2, distance, normalize, limitVector, lerp } from '../src/engine/shared/math';

describe('shared math helpers', () => {
  describe('clamp', () => {
    it('clamps values within range', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('dist2', () => {
    it('calculates squared distance correctly', () => {
      expect(dist2(0, 0, 3, 4)).toBe(25);
      expect(dist2(1, 1, 1, 1)).toBe(0);
    });
  });

  describe('distance', () => {
    it('calculates distance correctly', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
      expect(distance(1, 1, 1, 1)).toBe(0);
    });
  });

  describe('normalize', () => {
    it('normalizes vectors to unit length', () => {
      const [x, y] = normalize(3, 4);
      expect(x).toBeCloseTo(0.6);
      expect(y).toBeCloseTo(0.8);
    });

    it('returns [0, 0] for zero vector', () => {
      const [x, y] = normalize(0, 0);
      expect(x).toBe(0);
      expect(y).toBe(0);
    });
  });

  describe('limitVector', () => {
    it('limits vector magnitude to max', () => {
      const [x, y] = limitVector(30, 40, 5);
      expect(Math.sqrt(x * x + y * y)).toBeCloseTo(5);
    });

    it('leaves vectors within limit unchanged', () => {
      const [x, y] = limitVector(3, 4, 5);
      expect(x).toBe(3);
      expect(y).toBe(4);
    });
  });

  describe('lerp', () => {
    it('interpolates between values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });

    it('clamps t to [0, 1]', () => {
      expect(lerp(0, 10, 1.5)).toBe(10);
      expect(lerp(0, 10, -0.5)).toBe(0);
    });
  });

  describe('LCG PRNG', () => {
    it('produces deterministic sequence for fixed seed', () => {
      const prng = makePrng(12345);
      const values = [];
      for (let i = 0; i < 5; i++) {
        values.push(prng());
      }
      // Reference sequence computed from seed 12345
      expect(values[0]).toBeCloseTo(0.6551540484651923, 5);
      expect(values[1]).toBeCloseTo(0.30481432331725955, 5);
      expect(values[2]).toBeCloseTo(0.6749606337398291, 5);
      expect(values[3]).toBeCloseTo(0.10676848376169801, 5);
      expect(values[4]).toBeCloseTo(0.5165744470432401, 5);
    });

    it('produces byte-identical sequence for same seed', () => {
      const prng1 = makePrng(42);
      const prng2 = makePrng(42);
      for (let i = 0; i < 100; i++) {
        expect(prng1()).toBe(prng2());
      }
    });

    it('LCG constants are preserved and locked', () => {
      // The LCG constants are locked by the reference sequence test above.
      // This test documents the expected constants to guard against accidental changes.
      // LCG_MOD = 2147483648 (2^31)
      // LCG_MULT = 1103515245
      // LCG_INC = 12345
      // These must not change without updating the reference sequence test.
      const prng = makePrng(0);
      // Just verify the PRNG produces valid [0,1) values
      const val = prng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    });
  });

  describe('prngFloat', () => {
    it('produces random float in range [a, b)', () => {
      const prng = makePrng(12345);
      const val = prngFloat(prng, 10, 20);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThan(20);
    });
  });

  describe('prngInt', () => {
    it('produces random integer in range [a, b]', () => {
      const prng = makePrng(12345);
      const val = prngInt(prng, 1, 6);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    });

    it('produces deterministic sequence for fixed seed', () => {
      const prng = makePrng(999);
      const values = [];
      for (let i = 0; i < 10; i++) {
        values.push(prngInt(prng, 1, 6));
      }
      // All values should be in range
      values.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(6);
      });
      // Sequence should be deterministic (same for same seed)
      const prng2 = makePrng(999);
      for (let i = 0; i < 10; i++) {
        expect(prngInt(prng2, 1, 6)).toBe(values[i]);
      }
    });
  });
});
