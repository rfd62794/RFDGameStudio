import { describe, it, expect } from 'vitest';
import { computeCounts } from '../src/arcade-manifest/counts';
import { buildArcadeManifest } from '../src/arcade-manifest/buildManifest';
import { GAME_REGISTRY } from '../src/games/registry';

describe('computeCounts', () => {
  it('counts every game, treats a missing status as dev, and sorts byStatus keys', () => {
    const counts = computeCounts([
      { status: 'stable' },
      { status: 'dev' },
      { status: 'dev' },
      { status: 'tool' },
      { status: 'retired' },
      { status: 'external' },
      {},
    ]);
    expect(counts).toEqual({
      total: 7,
      published: 5,
      playable: 5,
      byStatus: { dev: 3, external: 1, retired: 1, stable: 1, tool: 1 },
    });
  });

  it('returns zeros and an empty byStatus for an empty list', () => {
    expect(computeCounts([])).toEqual({ total: 0, published: 0, playable: 0, byStatus: {} });
  });

  it('real registry: total matches games and registry length', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: () => null });
    expect(m.counts.total).toBe(m.games.length);
    expect(m.counts.total).toBe(GAME_REGISTRY.length);
  });

  it('real registry: published is games minus tool minus retired', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: () => null });
    expect(m.counts.published).toBe(m.games.filter(g => g.status !== 'retired' && g.status !== 'tool').length);
  });

  it('playable leaves out Origin entries and showcases, but keeps every other published game', () => {
    const counts = computeCounts([
      { status: 'stable' },
      { status: 'external', supersededBy: 'planetofgreed' },
      { status: 'dev', tags: ['kingdom-management', 'showcase'] },
      { status: 'dev', tags: ['puzzle'] },
      { status: 'tool' },
      { status: 'retired', tags: ['showcase'] },
    ]);
    expect(counts.published).toBe(4);
    expect(counts.playable).toBe(2);
  });

  it('real registry: playable is published minus Origin entries and showcases', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: () => null });
    const published = m.games.filter(g => g.status !== 'retired' && g.status !== 'tool');
    expect(m.counts.playable).toBe(published.filter(g => !g.supersededBy && !g.tags.includes('showcase')).length);
    expect(m.counts.playable).toBeLessThan(m.counts.published);
    expect(m.games.find(g => g.gameId === 'house_of_kings_collab')?.tags).toContain('showcase');
  });

  it('real registry: byStatus sums to total', () => {
    const m = buildArcadeManifest({ registry: GAME_REGISTRY, metadata: {}, statusEntries: [], readText: () => null });
    expect(Object.values(m.counts.byStatus).reduce((a, b) => a + b, 0)).toBe(m.counts.total);
  });
});
