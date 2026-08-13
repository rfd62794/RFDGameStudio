import { describe, it, expect } from 'vitest';
import { buildIdManifest, loadDissonanceData } from '../src/games/dissonance/art/dissonanceGenerator';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const OUT_DIR = resolve(repoRoot, 'ts', 'public', 'assets', 'dissonance');

/**
 * test_shared_manifest_exact_count
 *
 * Generalized version of Dissonance's own manifest verification pattern.
 * The id-list from data.yaml must generate exactly the expected file count,
 * with no missing or extra files. This is the generic manifest check that
 * any consumer of the shared art module should pass.
 */
describe('test_shared_manifest_exact_count', () => {
  const data = loadDissonanceData(repoRoot);
  const manifest = buildIdManifest(data);

  it('manifest id counts match expected (56 cards, 12 relics, 38 enemies)', () => {
    expect(manifest.cards.length).toBe(56);
    expect(manifest.relics.length).toBe(12);
    expect(manifest.enemies.length).toBe(38);
  });

  it('total manifest ids = 106', () => {
    const total = manifest.cards.length + manifest.relics.length + manifest.enemies.length;
    expect(total).toBe(106);
  });

  it('every manifest id has a corresponding committed SVG file', () => {
    const missing: string[] = [];
    for (const id of manifest.cards) {
      if (!existsSync(resolve(OUT_DIR, 'cards', `${id}.svg`))) missing.push(`cards/${id}`);
    }
    for (const id of manifest.relics) {
      if (!existsSync(resolve(OUT_DIR, 'relics', `${id}.svg`))) missing.push(`relics/${id}`);
    }
    for (const id of manifest.enemies) {
      if (!existsSync(resolve(OUT_DIR, 'enemies', `${id}.svg`))) missing.push(`enemies/${id}`);
    }
    expect(missing).toEqual([]);
  });

  it('no extra committed SVG files beyond the manifest', () => {
    const expectedIds = new Set<string>([
      ...manifest.cards.map((id) => `cards/${id}`),
      ...manifest.relics.map((id) => `relics/${id}`),
      ...manifest.enemies.map((id) => `enemies/${id}`),
    ]);

    const extra: string[] = [];
    for (const sub of ['cards', 'relics', 'enemies']) {
      const dir = resolve(OUT_DIR, sub);
      if (!existsSync(dir)) continue;
      for (const file of readdirSync(dir)) {
        if (file.endsWith('.svg')) {
          const id = `${sub}/${file.replace('.svg', '')}`;
          if (!expectedIds.has(id)) extra.push(id);
        }
      }
    }
    expect(extra).toEqual([]);
  });

  it('no duplicate ids within any kind', () => {
    for (const kind of ['cards', 'relics', 'enemies'] as const) {
      const ids = manifest[kind];
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    }
  });
});
