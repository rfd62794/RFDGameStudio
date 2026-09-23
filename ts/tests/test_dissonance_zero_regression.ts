import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  generateCardSVG,
  generateRelicSVG,
  generateEnemySVG,
  buildIdManifest,
  loadDissonanceData,
} from '../src/games/dissonance/art/dissonanceGenerator';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');
const OUT_DIR = resolve(repoRoot, 'ts', 'public', 'assets', 'dissonance');

/**
 * test_dissonance_zero_regression
 *
 * The single most important test in this directive. All 106 output files
 * (56 cards + 12 relics + 38 enemies), post-refactor, must be byte-identical
 * to the pre-refactor baseline. The pre-refactor baseline was captured in
 * the STOP rule as a SHA256 manifest; this test regenerates all 106 SVGs
 * from data.yaml using the refactored TypeScript generator (which consumes
 * the shared artGen module + dissonance.config.ts) and compares each one
 * to the committed file on disk.
 *
 * If this test fails, the refactor introduced a visual regression. Do NOT
 * adjust the test to accept a difference — fix the generator.
 */
describe('test_dissonance_zero_regression', () => {
  const data = loadDissonanceData(repoRoot);

  it('generates all 106 SVGs (56 cards + 12 relics + 38 enemies)', () => {
    const manifest = buildIdManifest(data);
    expect(manifest.cards.length).toBe(56);
    expect(manifest.relics.length).toBe(12);
    expect(manifest.enemies.length).toBe(38);
    expect(manifest.cards.length + manifest.relics.length + manifest.enemies.length).toBe(106);
  });

  it.each(
    buildIdManifest(data).cards.map((id) => [id] as const)
  )('card %s matches committed SVG byte-for-byte', (id) => {
    const generated = generateCardSVG(
      data.named_cards!.find((c) => c.id === id)!
    );
    const committed = readFileSync(resolve(OUT_DIR, 'cards', `${id}.svg`), 'utf-8').replace(/\r\n/g, '\n');
    expect(generated).toBe(committed);
  });

  it.each(
    buildIdManifest(data).relics.map((id) => [id] as const)
  )('relic %s matches committed SVG byte-for-byte', (id) => {
    const generated = generateRelicSVG(
      data.relics!.find((r) => r.id === id)!
    );
    const committed = readFileSync(resolve(OUT_DIR, 'relics', `${id}.svg`), 'utf-8').replace(/\r\n/g, '\n');
    expect(generated).toBe(committed);
  });

  it.each(
    buildIdManifest(data).enemies.map((id) => [id] as const)
  )('enemy %s matches committed SVG byte-for-byte', (id) => {
    // Find the enemy in any of the enemy sections
    let enemy: Record<string, unknown> | undefined;
    for (const section of ['basic', 'behavior_roster', 'legacy_named', 'bosses']) {
      enemy = data.enemies?.[section]?.find((e) => e.id === id);
      if (enemy) break;
    }
    expect(enemy).toBeDefined();
    const generated = generateEnemySVG(enemy!);
    const committed = readFileSync(resolve(OUT_DIR, 'enemies', `${id}.svg`), 'utf-8').replace(/\r\n/g, '\n');
    expect(generated).toBe(committed);
  });
});
