import { describe, it, expect } from 'vitest';
import { mulberry32, hashStringToSeed } from '../src/engine/artGen/seededRandom';
import { mulberry32 as slimeMulberry32, hashStringToSeed as slimeHashStringToSeed } from '../src/games/slimeworld/components/SlimeVisual';

describe('artGen seededRandom extraction', () => {
  it('mulberry32 produces the same sequence as SlimeVisual', () => {
    const seeds = [0, 1, 12345, 0xdeadbeef, 0x7fffffff];
    for (const seed of seeds) {
      const a = mulberry32(seed);
      const b = slimeMulberry32(seed);
      for (let i = 0; i < 100; i++) {
        expect(a()).toBe(b());
      }
    }
  });

  it('hashStringToSeed produces the same values as SlimeVisual', () => {
    const inputs = ['', 'slime-1', 'Sparkling Husk', 'node_0_0', 'a longer string with numbers 123'];
    for (const str of inputs) {
      expect(hashStringToSeed(str)).toBe(slimeHashStringToSeed(str));
    }
  });
});
