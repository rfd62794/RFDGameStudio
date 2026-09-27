/**
 * Write ts/src/games/registry-export.json (configs only; no metadata needed).
 * Usage (from ts/): npx vite-node tools/export-registry.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GAME_REGISTRY } from '../src/games/registry';
import { buildRegistryExport } from '../src/arcade-manifest/registryExport';

const out = resolve(__dirname, '..', 'src', 'games', 'registry-export.json');
writeFileSync(out, `${JSON.stringify(buildRegistryExport(GAME_REGISTRY), null, 2)}\n`, 'utf-8');
console.log(`Wrote ${out} (${GAME_REGISTRY.length} games)`);
