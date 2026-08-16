/**
 * Generates docs/state/DirectiveTracker.md from
 * ts/src/status/directiveTracker.data.ts.
 *
 * Matches the exact pattern of generate-status-board.ts.
 *
 * Usage (from ts/):
 *   npx vite-node tools/generate-directive-tracker.ts
 *
 * Or from repo root:
 *   npx vite-node ts/tools/generate-directive-tracker.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DIRECTIVE_TRACKER } from '../src/status/directiveTracker.data';
import { generateDirectiveMarkdown } from '../src/status/generateDirectiveMarkdown';

const markdown = generateDirectiveMarkdown(DIRECTIVE_TRACKER);

// Write to docs/state/DirectiveTracker.md (resolve relative to ts/ dir, up one to repo root)
const outputPath = resolve(__dirname, '..', '..', 'docs', 'state', 'DirectiveTracker.md');
writeFileSync(outputPath, markdown, 'utf-8');

console.log(`Directive tracker generated: ${outputPath}`);
console.log(`Entries: ${DIRECTIVE_TRACKER.length}`);
