/**
 * Export the arcade manifest for the website.
 *
 * Usage (from ts/):
 *   npx vite-node tools/export-arcade-manifest.ts
 *
 * Imports the real GAME_REGISTRY (no parsing of TypeScript), reads
 * game-metadata.json, the studio status entries and devlog sources, and writes
 * ts/src/games/arcade-manifest.json (gitignored, like game-metadata.json).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';
import { SITE_STATUS_ENTRIES } from '../src/status/site-pages.data';
import { buildArcadeManifest } from '../src/arcade-manifest/buildManifest';

const repoRoot = resolve(__dirname, '..', '..');
const metadataPath = resolve(repoRoot, 'ts', 'src', 'games', 'game-metadata.json');
const haveMetadata = existsSync(metadataPath);
if (!haveMetadata) console.warn(`No ${metadataPath}; versions and dates will be null.`);

const readText = (rel: string): string | null => {
  const path = resolve(repoRoot, rel);
  return existsSync(path) ? readFileSync(path, 'utf-8') : null;
};

const manifest = buildArcadeManifest({
  registry: GAME_REGISTRY,
  metadata: haveMetadata ? JSON.parse(readFileSync(metadataPath, 'utf-8')) : {},
  statusEntries: SITE_STATUS_ENTRIES,
  readText,
});

const out = resolve(repoRoot, 'ts', 'src', 'games', 'arcade-manifest.json');
writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
for (const s of manifest.skipped) console.warn(`devlog entry skipped (no date): ${s}`);
console.log(`Wrote ${out} (${manifest.games.length} games)`);
