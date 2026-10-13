// @vitest-environment node
//
// docs/GRAPHICS.md — boundary doc honesty check (roadmap M6.1)
//
// Verifies:
//   1. The six required ## sections exist, in order
//   2. Every backticked token that names a repo path exists on disk
//   3. The "Who uses what" table has at least 14 rows and every row's path exists
//   4. The words vector, raster and canvas each appear in "## The rule"
//

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = resolve(dirname(__filename), '..', '..');

const docPath = resolve(repoRoot, 'docs', 'GRAPHICS.md');
const doc = readFileSync(docPath, 'utf8');

const REQUIRED_SECTIONS = [
  '## The model',
  '## The rule',
  '## Who uses what',
  '## Budgets',
  '## Open decisions',
  '## How to change this',
];

function sectionBody(heading: string): string {
  const start = doc.indexOf(heading);
  if (start === -1) return '';
  const rest = doc.slice(start + heading.length);
  const next = rest.search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next);
}

function repoPathTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const match of text.matchAll(/`([^`]+)`/g)) {
    const token = match[1].trim();
    if (/^(ts|docs|scripts|examples|games)\//.test(token)) tokens.push(token);
  }
  return tokens;
}

function pathExists(token: string): boolean {
  return existsSync(resolve(repoRoot, token));
}

describe('docs/GRAPHICS.md', () => {
  it('has the six required sections, in order', () => {
    const headings = doc
      .split('\n')
      .map(line => line.trimEnd())
      .filter(line => line.startsWith('## '));
    expect(headings).toEqual(REQUIRED_SECTIONS);
  });

  it('names only repo paths that exist', () => {
    const tokens = repoPathTokens(doc);
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.filter(token => !pathExists(token))).toEqual([]);
  });

  it('has a Who uses what table with at least 14 rows, every path real', () => {
    const body = sectionBody('## Who uses what');
    const rows = body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('|') && line.endsWith('|'))
      .filter(line => !/^\|[\s:-]+\|/.test(line))
      .filter(line => !/^\|\s*Technology\s*\|/.test(line));
    expect(rows.length).toBeGreaterThanOrEqual(14);
    for (const row of rows) {
      const cells = row
        .split('|')
        .slice(1, -1)
        .map(cell => cell.trim());
      const pathMatch = /`([^`]+)`/.exec(cells[1]);
      expect(pathMatch, `row's Path cell is backticked: ${row}`).not.toBeNull();
      expect(pathExists(pathMatch![1]), `path exists: ${pathMatch![1]}`).toBe(true);
    }
  });

  it('states vector, raster and canvas in the rule', () => {
    const body = sectionBody('## The rule').toLowerCase();
    for (const word of ['vector', 'raster', 'canvas']) {
      expect(body).toContain(word);
    }
  });
});
