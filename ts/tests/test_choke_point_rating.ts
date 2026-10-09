// new: ts/tests/test_choke_point_rating.ts
import { describe, it, expect } from 'vitest';
import { starsForCoreHp, waveLabel, MAX_STARS } from '../src/games/choke_point/rating';

describe('choke_point rating', () => {
  it('gives 3 stars for 8 or more of 10 core HP, 2 for 5 to 7, 1 for 1 to 4, 0 when breached', () => {
    expect(starsForCoreHp(10, 10)).toBe(3);
    expect(starsForCoreHp(8, 10)).toBe(3);
    expect(starsForCoreHp(7, 10)).toBe(2);
    expect(starsForCoreHp(5, 10)).toBe(2);
    expect(starsForCoreHp(4, 10)).toBe(1);
    expect(starsForCoreHp(1, 10)).toBe(1);
    expect(starsForCoreHp(0, 10)).toBe(0);
  });
  it('never exceeds MAX_STARS and tolerates a bad start value', () => {
    expect(starsForCoreHp(99, 10)).toBeLessThanOrEqual(MAX_STARS);
    expect(starsForCoreHp(5, 0)).toBe(0);
  });
  it('labels the wave and clamps to the last wave', () => {
    expect(waveLabel(1, 6)).toBe('Wave 1 of 6');
    expect(waveLabel(2.0, 6)).toBe('Wave 2 of 6');
    expect(waveLabel(9, 6)).toBe('Wave 6 of 6');
  });
});
