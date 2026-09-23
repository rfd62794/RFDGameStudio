// @vitest-environment node
//
// Tests for ts/tools/generate-site-status-pages.ts — the script that
// materializes the pure generateAllSitePages() output into
// docs/site-status-pages/ (the staging dir ported by sync_status_pages.py).
//
// The script runs at import time and has no exports, so node:fs is mocked
// before the dynamic import and assertions inspect the recorded calls.

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(() => ['stale-page.md', 'notes.txt']),
  unlinkSync: vi.fn(),
}));

import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { SITE_STATUS_HUB, SITE_STATUS_ENTRIES } from '../src/status/site-pages.data';
import { generateAllSitePages } from '../src/status/generateSitePages';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const stagingDir = resolve(repoRoot, 'docs', 'site-status-pages');
const expectedPages = generateAllSitePages(SITE_STATUS_HUB, SITE_STATUS_ENTRIES);

beforeAll(async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await import('../tools/generate-site-status-pages');
});

describe('generate-site-status-pages tool', () => {
  it('creates the docs/site-status-pages staging dir recursively', () => {
    expect(mkdirSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledWith(stagingDir, { recursive: true });
  });

  it('scans the staging dir for pages from earlier runs', () => {
    expect(readdirSync).toHaveBeenCalledTimes(1);
    expect(readdirSync).toHaveBeenCalledWith(stagingDir);
  });

  it('removes stale .md files but leaves non-markdown files alone', () => {
    expect(unlinkSync).toHaveBeenCalledTimes(1);
    expect(unlinkSync).toHaveBeenCalledWith(resolve(stagingDir, 'stale-page.md'));
    expect(unlinkSync).not.toHaveBeenCalledWith(resolve(stagingDir, 'notes.txt'));
  });

  it('writes every generated page into the staging dir as utf-8', () => {
    expect(writeFileSync).toHaveBeenCalledTimes(expectedPages.size);
    for (const [filename, content] of expectedPages) {
      expect(writeFileSync).toHaveBeenCalledWith(
        resolve(stagingDir, filename),
        content,
        'utf-8',
      );
    }
  });

  it('writes the hub page plus one detail page per non-game entry', () => {
    const written = vi.mocked(writeFileSync).mock.calls.map(([p]) => p);
    expect(written).toContain(resolve(stagingDir, `${SITE_STATUS_HUB.id}.md`));
    for (const entry of SITE_STATUS_ENTRIES.filter(e => !e.gameId)) {
      expect(written).toContain(resolve(stagingDir, `${entry.id}.md`));
    }
    for (const entry of SITE_STATUS_ENTRIES.filter(e => e.gameId)) {
      expect(written).not.toContain(resolve(stagingDir, `${entry.id}.md`));
    }
  });

  it('reports the page count and staging dir on completion', () => {
    expect(console.log).toHaveBeenCalledWith(`\nTotal pages: ${expectedPages.size}`);
    expect(console.log).toHaveBeenCalledWith(`Staging dir: ${stagingDir}`);
  });
});
