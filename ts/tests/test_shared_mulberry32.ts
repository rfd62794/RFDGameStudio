import { describe, it, expect } from 'vitest';
import { mulberry32, hashStringToSeed } from '../src/engine/shared/seededRandom';
import { mulberry32 as artGenMulberry32, hashStringToSeed as artGenHashStringToSeed } from '../src/engine/artGen/seededRandom';
import { mulberry32 as slimeMulberry32, hashStringToSeed as slimeHashStringToSeed } from '../src/games/slimeworld/components/SlimeVisual';

/**
 * test_mulberry32_output_unchanged
 *
 * The shared module's mulberry32 must produce byte-identical output
 * sequences to both the artGen original and SlimeVisual's re-export,
 * for a range of seeds. This proves the canonical-copy move didn't
 * change the algorithm.
 */
describe('test_mulberry32_output_unchanged', () => {
  const seeds = [0, 1, 42, 12345, 0xdeadbeef, 0x7fffffff, 0xffffffff];

  it('shared mulberry32 matches artGen mulberry32 for 100 iterations per seed', () => {
    for (const seed of seeds) {
      const shared = mulberry32(seed);
      const artGen = artGenMulberry32(seed);
      for (let i = 0; i < 100; i++) {
        expect(shared()).toBe(artGen());
      }
    }
  });

  it('shared mulberry32 matches SlimeVisual mulberry32 for 100 iterations per seed', () => {
    for (const seed of seeds) {
      const shared = mulberry32(seed);
      const slime = slimeMulberry32(seed);
      for (let i = 0; i < 100; i++) {
        expect(shared()).toBe(slime());
      }
    }
  });

  it('shared hashStringToSeed matches artGen and SlimeVisual for all test inputs', () => {
    const inputs = ['', 'slime-1', 'Sparkling Husk', 'node_0_0', 'a longer string with numbers 123'];
    for (const str of inputs) {
      expect(hashStringToSeed(str)).toBe(artGenHashStringToSeed(str));
      expect(hashStringToSeed(str)).toBe(slimeHashStringToSeed(str));
    }
  });
});
