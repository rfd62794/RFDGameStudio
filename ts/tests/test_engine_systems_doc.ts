// @vitest-environment node
//
// Engine shared systems doc — contract test (roadmap M7.1)
//
// docs/ENGINE_SYSTEMS.md keeps one table row per entry directly inside
// ts/src/engine/shared/. This test fails when the table drifts:
//   1. A shared entry with no row (or a duplicated row)
//   2. A row naming an entry that does not exist
//   3. An Entry point path that does not exist
//   4. A Test value that is neither "none yet" nor an existing file
//   5. A Consumers value that is neither "none yet" nor folder names
//      that each exist under ts/src/games/ or examples/
//   6. A Seeded value outside yes | no | n/a

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

const DOC_PATH = resolve(repoRoot, 'docs', 'ENGINE_SYSTEMS.md');
const SHARED_DIR = resolve(repoRoot, 'ts', 'src', 'engine', 'shared');
const GAMES_DIR = resolve(repoRoot, 'ts', 'src', 'games');
const EXAMPLES_DIR = resolve(repoRoot, 'examples');

interface TableRow {
  system: string;
  entryPoint: string;
  consumers: string;
  test: string;
  seeded: string;
}

function parseTableRows(doc: string): TableRow[] {
  const rows: TableRow[] = [];
  for (const line of doc.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map(cell => cell.trim().replace(/^`+|`+$/g, ''));
    if (cells.length !== 5) continue;
    const [system, entryPoint, consumers, test, seeded] = cells;
    if (system === 'System') continue;
    if (/^:?-+:?$/.test(system)) continue;
    rows.push({ system, entryPoint, consumers, test, seeded });
  }
  return rows;
}

const doc = readFileSync(DOC_PATH, 'utf-8');
const rows = parseTableRows(doc);

const sharedEntries = readdirSync(SHARED_DIR, { withFileTypes: true })
  .map(entry => entry.name)
  .filter(
    name =>
      name !== 'index.ts' &&
      !name.endsWith('.d.ts') &&
      name !== '__tests__',
  );

function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

describe('engine systems doc', () => {
  it('has exactly one row per entry directly inside ts/src/engine/shared/', () => {
    const rowNames = rows.map(row => row.system);
    for (const entry of sharedEntries) {
      expect(
        rowNames.filter(name => name === entry).length,
        `shared entry has no row or duplicate rows: ${entry}`,
      ).toBe(1);
    }
  });

  it('names no entry that does not exist in ts/src/engine/shared/', () => {
    for (const row of rows) {
      expect(sharedEntries, `row names a missing entry: ${row.system}`).toContain(
        row.system,
      );
    }
  });

  it('every Entry point path exists', () => {
    for (const row of rows) {
      expect(
        existsSync(resolve(repoRoot, row.entryPoint)),
        `${row.system} entry point does not exist: ${row.entryPoint}`,
      ).toBe(true);
    }
  });

  it('every Test value is "none yet" or an existing file', () => {
    for (const row of rows) {
      if (row.test === 'none yet') continue;
      expect(
        existsSync(resolve(repoRoot, row.test)),
        `${row.system} test path does not exist: ${row.test}`,
      ).toBe(true);
    }
  });

  it('every Consumers value is "none yet" or existing folders under ts/src/games/ or examples/', () => {
    for (const row of rows) {
      if (row.consumers === 'none yet') continue;
      for (const name of row.consumers.split(',').map(part => part.trim())) {
        const inGames = isDirectory(resolve(GAMES_DIR, name));
        const inExamples = isDirectory(resolve(EXAMPLES_DIR, name));
        expect(
          inGames || inExamples,
          `${row.system} consumer is not a demo folder: ${name}`,
        ).toBe(true);
      }
    }
  });

  it('every Seeded value is one of yes, no, n/a', () => {
    for (const row of rows) {
      expect(
        ['yes', 'no', 'n/a'],
        `${row.system} has an invalid Seeded value: ${row.seeded}`,
      ).toContain(row.seeded);
    }
  });
});
