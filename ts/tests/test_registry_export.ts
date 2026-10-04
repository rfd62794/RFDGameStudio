import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';
import { buildRegistryExport } from '../src/arcade-manifest/registryExport';

const REPO_ROOT = resolve(import.meta.dirname, '..', '..');

describe('registry export', () => {
  const exp = buildRegistryExport(GAME_REGISTRY, () => 'T');

  it('lists every registry game in order', () => {
    expect(exp.games.map(g => g.gameId)).toEqual(GAME_REGISTRY.map(g => g.gameId));
    expect(exp.generatedAt).toBe('T');
  });

  it('carries source for exactly the games whose config declares one', () => {
    const declared = GAME_REGISTRY.filter(g => g.source).map(g => [g.gameId, g.source]);
    expect(exp.games.filter(g => g.source).map(g => [g.gameId, g.source])).toEqual(declared);
    expect(declared.length).toBeGreaterThan(0);
  });

  it('points every example source at a tracked examples/<slug>/package.json, and names every sibling repo', () => {
    for (const g of exp.games) {
      if (g.source?.kind === 'example') expect(existsSync(resolve(REPO_ROOT, 'examples', g.source.slug, 'package.json')), g.gameId).toBe(true);
      if (g.source?.kind === 'sibling') expect(g.source.repo, g.gameId).toBeTruthy();
    }
  });

  it('flags component games and keeps embedUrl', () => {
    const byId = Object.fromEntries(exp.games.map(g => [g.gameId, g]));
    expect(byId.shoal.hasComponent).toBe(true);
    expect(byId.systemic_extract.hasComponent).toBe(false);
    expect(byId.systemic_extract.embedUrl).toBe('/arcade/systemic_extract/');
  });
});
