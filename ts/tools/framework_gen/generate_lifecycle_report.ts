import { resolve } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { detectLifecycles } from './lifecycle_detector';
import { generateLifecycleReport } from './lifecycle_report';

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const luaPath = resolve(REPO_ROOT, 'games/slimeworld/logic.lua');
const luaText = readFileSync(luaPath, 'utf8');

const detection = detectLifecycles(luaPath, luaText);
const report = generateLifecycleReport({
  detection,
  manifestPath: resolve(REPO_ROOT, 'docs/slimegarden_recovery_manifest.md'),
  sourcePath: resolve(REPO_ROOT, 'intake/slimegarden/extracted/src/gameLogic.ts'),
});

const outPath = resolve(REPO_ROOT, 'docs/slimeworld_lifecycle_report.md');
writeFileSync(outPath, report, 'utf8');

console.log(`Report written to ${outPath}`);
console.log(`Flagged: ${detection.flaggedCount}, Resolved: ${detection.resolvedCount}`);
