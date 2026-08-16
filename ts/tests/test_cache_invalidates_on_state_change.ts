import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedCreaturePath,
  clearCache,
  getCacheStats,
  resetCacheStats,
  type CreatureCacheKey,
} from '../src/games/shoal/art/pathCache';

/**
 * test_cache_invalidates_on_state_change
 *
 * Age-stage or species change correctly generates a new cached path —
 * doesn't serve stale cached geometry. The cache key includes species,
 * ageStage, and hungerBand, so any state transition produces a cache
 * miss and a new Path2D.
 */
describe('test_cache_invalidates_on_state_change', () => {
  beforeEach(() => {
    clearCache();
    resetCacheStats();
  });

  it('age-stage change (young → mature) produces a cache miss and new path', () => {
    const youngPath = getCachedCreaturePath({ species: 'fish', ageStage: 'young', hungerBand: 0 });
    expect(getCacheStats().misses).toBe(1);

    const maturePath = getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    expect(getCacheStats().misses).toBe(2); // new miss for new key
    expect(getCacheStats().hits).toBe(0);

    expect(youngPath).not.toBe(maturePath); // different objects
  });

  it('species change (fish → shark) produces a cache miss and new path', () => {
    const fishPath = getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    expect(getCacheStats().misses).toBe(1);

    const sharkPath = getCachedCreaturePath({ species: 'shark', ageStage: 'mature', hungerBand: 0 });
    expect(getCacheStats().misses).toBe(2);
    expect(fishPath).not.toBe(sharkPath);
  });

  it('hunger-band change (0 → 4) produces a cache miss and new path', () => {
    const fullPath = getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    expect(getCacheStats().misses).toBe(1);

    const starvingPath = getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 4 });
    expect(getCacheStats().misses).toBe(2);
    expect(fullPath).not.toBe(starvingPath);
  });

  it('same key after clearCache produces a new Path2D (full invalidation)', () => {
    const key: CreatureCacheKey = { species: 'fish', ageStage: 'mature', hungerBand: 0 };
    const path1 = getCachedCreaturePath(key);
    clearCache();
    const path2 = getCachedCreaturePath(key);
    expect(path1).not.toBe(path2); // new object after cache clear
  });

  it('all 3 state dimensions change simultaneously produces exactly 1 miss', () => {
    getCachedCreaturePath({ species: 'fish', ageStage: 'young', hungerBand: 0 });
    getCachedCreaturePath({ species: 'shark', ageStage: 'mature', hungerBand: 4 });
    expect(getCacheStats().misses).toBe(2);
    expect(getCacheStats().hits).toBe(0);
  });

  it('repeated access to same key after state changes still hits cache', () => {
    // Access young
    getCachedCreaturePath({ species: 'fish', ageStage: 'young', hungerBand: 0 });
    // Transition to mature (miss)
    getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    // Access mature again (hit)
    getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    expect(getCacheStats().misses).toBe(2);
    expect(getCacheStats().hits).toBe(1);
  });
});
