import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { auditExports } from './audit.js';
import { generateManifest } from './manifest_report.js';

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const result = auditExports({
  sourcePath: resolve(REPO_ROOT, 'intake/slimegarden/extracted/src/gameLogic.ts'),
  luaPath: resolve(REPO_ROOT, 'games/slimeworld/logic.lua'),
  dataYamlPath: resolve(REPO_ROOT, 'games/slimeworld/data.yaml'),
  tsSlimeworldDir: resolve(REPO_ROOT, 'ts/src/games/slimeworld'),
});

const manifest = generateManifest(result);
const outPath = resolve(REPO_ROOT, 'docs/slimegarden_recovery_manifest.md');
writeFileSync(outPath, manifest, 'utf8');

console.log(`Manifest written to ${outPath}`);
console.log(`Total symbols: ${result.symbols.length}`);
console.log(`RECOVERED: ${result.statusBreakdown.RECOVERED}`);
console.log(`DEFINED_NOT_CALLED: ${result.statusBreakdown.DEFINED_NOT_CALLED}`);
console.log(`NEEDS_HUMAN_REVIEW: ${result.statusBreakdown.NEEDS_HUMAN_REVIEW}`);
