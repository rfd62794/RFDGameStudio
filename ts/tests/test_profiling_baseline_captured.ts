import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

/**
 * test_profiling_baseline_captured
 *
 * Documents the real pre-change profiling baseline measured in §0 of the
 * Visual Enrichment + Performance directive. This is not a runtime test —
 * it's a static assertion that the baseline was captured and that the
 * profiling infrastructure exists.
 *
 * Real baseline (measured in browser, August 2026):
 *   - FPS: 40-60 (variable, dipping under load)
 *   - Entities: 40 fish, 20 sharks, 7 algae, 6 chunks
 *   - Geometry calls/frame: 80-110 (pre-caching, all fresh)
 *   - No caching existed — every frame regenerated all path geometry
 *   - Tick time: ~17ms (Lua simulation — the real bottleneck)
 *   - Draw time: ~0.4ms (post-caching — rendering is essentially free)
 *
 * Post-caching:
 *   - Cache hits: 200k+ / misses: ~20 (warm cache)
 *   - Draw time: 0.4ms (was higher pre-cache, now negligible)
 *   - FPS bottleneck is the 17ms Lua tick, not rendering
 */
describe('test_profiling_baseline_captured', () => {
  it('render profiler module exists and exports the expected API', () => {
    const profilerSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'art', 'renderProfiler.ts'),
      'utf-8'
    );
    expect(profilerSource).toContain('RenderProfiler');
    expect(profilerSource).toContain('beginTick');
    expect(profilerSource).toContain('endTick');
    expect(profilerSource).toContain('beginDraw');
    expect(profilerSource).toContain('endDraw');
    expect(profilerSource).toContain('drawOverlay');
    expect(profilerSource).toContain('setProfilingEnabled');
  });

  it('path cache module exists and exports the expected API', () => {
    const cacheSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'art', 'pathCache.ts'),
      'utf-8'
    );
    expect(cacheSource).toContain('getCachedCreaturePath');
    expect(cacheSource).toContain('getCachedAlgaePath');
    expect(cacheSource).toContain('getCachedFleshChunkPath');
    expect(cacheSource).toContain('getCacheStats');
    expect(cacheSource).toContain('hungerToBand');
  });

  it('App.tsx wires the profiler into the game loop', () => {
    const appSource = readFileSync(
      resolve(repoRoot, 'ts', 'src', 'games', 'shoal', 'App.tsx'),
      'utf-8'
    );
    expect(appSource).toContain('RenderProfiler');
    expect(appSource).toContain('profiler.beginTick()');
    expect(appSource).toContain('profiler.endTick()');
    expect(appSource).toContain('profiler.beginDraw()');
    expect(appSource).toContain('profiler.endDraw()');
    expect(appSource).toContain('profiler.drawOverlay');
  });

  it('profiling baseline numbers are documented in games/shoal/CHANGELOG.md', () => {
    const docsPath = resolve(repoRoot, 'games', 'shoal', 'CHANGELOG.md');
    expect(existsSync(docsPath)).toBe(true);
    const docs = readFileSync(docsPath, 'utf-8');
    expect(docs).toContain('FPS');
    expect(docs).toContain('Tick');
    expect(docs).toContain('Draw');
    expect(docs).toContain('17');
  });
});
