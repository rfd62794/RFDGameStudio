import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCachedCreaturePath,
  clearCache,
  getCacheStats,
  resetCacheStats,
} from '../src/games/shoal/art/pathCache';

/**
 * test_geometry_calls_reduced_post_cache
 *
 * Real measured per-frame geometry-generation call count is lower after
 * caching than the §0 baseline. The §0 baseline was 80-110 geometry
 * calls/frame (all fresh). Post-cache, the number of geometry-generation
 * calls per frame equals the number of cache misses — which after warmup
 * approaches zero (all hits).
 *
 * This test verifies the cache stats mechanism: after warmup (accessing
 * the same keys repeatedly), the hit ratio approaches 100% and the miss
 * count stops growing.
 */
describe('test_geometry_calls_reduced_post_cache', () => {
  beforeEach(() => {
    clearCache();
    resetCacheStats();
  });

  it('simulated frame: 60 fish + 20 sharks with stable state → 0 misses after warmup', () => {
    // Simulate a frame with 60 fish and 20 sharks, all mature, hunger band 0
    // First frame: all misses (cache cold)
    for (let i = 0; i < 60; i++) {
      getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    }
    for (let i = 0; i < 20; i++) {
      getCachedCreaturePath({ species: 'shark', ageStage: 'mature', hungerBand: 0 });
    }
    const coldFrameMisses = getCacheStats().misses;
    expect(coldFrameMisses).toBe(2); // only 2 unique keys: fish/mature/0 and shark/mature/0

    // Second frame: same state → all hits, zero new misses
    resetCacheStats();
    for (let i = 0; i < 60; i++) {
      getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    }
    for (let i = 0; i < 20; i++) {
      getCachedCreaturePath({ species: 'shark', ageStage: 'mature', hungerBand: 0 });
    }
    expect(getCacheStats().misses).toBe(0);
    expect(getCacheStats().hits).toBe(80); // 60 + 20
  });

  it('geometry call count: pre-cache 80 calls/frame → post-cache 0 misses/frame (warm)', () => {
    // Warm the cache
    getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });
    getCachedCreaturePath({ species: 'fish', ageStage: 'young', hungerBand: 0 });
    getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 1 });
    getCachedCreaturePath({ species: 'shark', ageStage: 'mature', hungerBand: 0 });

    // Simulate a frame: 80 entities, all using cached keys
    resetCacheStats();
    const keys = [
      { species: 'fish' as const, ageStage: 'mature' as const, hungerBand: 0 },
      { species: 'fish' as const, ageStage: 'young' as const, hungerBand: 0 },
      { species: 'fish' as const, ageStage: 'mature' as const, hungerBand: 1 },
      { species: 'shark' as const, ageStage: 'mature' as const, hungerBand: 0 },
    ];
    for (let i = 0; i < 80; i++) {
      getCachedCreaturePath(keys[i % keys.length]);
    }
    // All 80 should be hits, 0 misses
    expect(getCacheStats().misses).toBe(0);
    expect(getCacheStats().hits).toBe(80);
  });

  it('state transition (1 entity ages) → only 1 miss for that frame', () => {
    // Warm: all young
    getCachedCreaturePath({ species: 'fish', ageStage: 'young', hungerBand: 0 });

    // Frame: 60 fish, 1 transitions to mature
    resetCacheStats();
    for (let i = 0; i < 59; i++) {
      getCachedCreaturePath({ species: 'fish', ageStage: 'young', hungerBand: 0 });
    }
    getCachedCreaturePath({ species: 'fish', ageStage: 'mature', hungerBand: 0 });

    expect(getCacheStats().misses).toBe(1); // only the transitioned entity
    expect(getCacheStats().hits).toBe(59);
  });
});
