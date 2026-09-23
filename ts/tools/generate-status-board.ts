/**
 * Generates docs/state/StatusBoard.md from ts/src/status/board.data.ts.
 *
 * Usage (from ts/):
 *   npx vite-node tools/generate-status-board.ts
 *
 * Or from repo root:
 *   npx vite-node ts/tools/generate-status-board.ts
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STATUS_BOARD } from '../src/status/board.data';
import { generateMarkdown } from '../src/status/generateMarkdown';

const markdown = generateMarkdown(STATUS_BOARD);

// Write to docs/state/StatusBoard.md (resolve relative to ts/ dir, up one to repo root)
const outputPath = resolve(__dirname, '..', '..', 'docs', 'state', 'StatusBoard.md');
writeFileSync(outputPath, markdown, 'utf-8');

console.log(`Status board generated: ${outputPath}`);
console.log(`Entries: ${STATUS_BOARD.length}`);
