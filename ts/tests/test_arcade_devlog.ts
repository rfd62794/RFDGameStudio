import { describe, it, expect } from 'vitest';
import { parseLongDate, parseChangelog, parsePatchNotes, parseIntakeManifest } from '../src/arcade-manifest/devlog';

describe('parseLongDate', () => {
  it('parses both real formats', () => {
    expect(parseLongDate('August 14 2026')).toBe('2026-08-14');
    expect(parseLongDate('August 3, 2026')).toBe('2026-08-03');
  });
  it('returns null for anything else', () => {
    expect(parseLongDate('Aug-14')).toBeNull();
    expect(parseLongDate('Smarch 1 2026')).toBeNull();
  });
});

describe('parseChangelog', () => {
  const text = [
    '# Shoal — Changelog', '', '---', '',
    '## Shoal Production TS-Native Migration — COMPLETED', '', '**Date:** August 14 2026',
    '### Test results', '**Date:** August 1 2026',
    '## Undated Work', '', 'no date here',
    '## Live Deployment — COMPLETED (HANDOFF)', '**Date:** August 13 2026',
  ].join('\r\n');

  it('makes one dated entry per ## heading and strips the COMPLETED suffix', () => {
    expect(parseChangelog(text).entries).toEqual([
      { date: '2026-08-14', title: 'Shoal Production TS-Native Migration', source: 'changelog' },
      { date: '2026-08-13', title: 'Live Deployment', source: 'changelog' },
    ]);
  });
  it('reports headings without a date instead of inventing one', () => {
    expect(parseChangelog(text).skipped).toEqual(['Undated Work']);
  });
});

describe('parsePatchNotes', () => {
  it('uses the file version and the bold date line', () => {
    const r = parsePatchNotes('# Succession — Patch Notes v0.2.0\n\n**August 23, 2026**\n\nBody', 'succession/PATCH_NOTES_v0.2.0.md');
    expect(r.entries).toEqual([{ date: '2026-08-23', title: 'Patch notes v0.2.0', source: 'patch-notes' }]);
  });
  it('skips a file with no date', () => {
    expect(parsePatchNotes('# Notes\n\nBody', 'PATCH_NOTES_v1.0.0.md')).toEqual({ entries: [], skipped: ['Patch notes v1.0.0'] });
  });
});

describe('parseIntakeManifest', () => {
  const text = [
    '# Slimegarden — Intake History', '', 'Current version: 0.1.0R2', '',
    '### 0.1.0R1 — 2026-07-13T18:18:28', '- Hash: abc', '- Note: First intake', '',
    '### 0.1.0R2 � 2026-07-18T09:30:00', '- Source file: x.zip',
    '### garbage heading',
  ].join('\n');

  it('parses each version, tolerating a mis-encoded separator', () => {
    const r = parseIntakeManifest(text);
    expect(r.entries).toEqual([
      { date: '2026-07-13', title: 'v0.1.0R1 — First intake', source: 'intake' },
      { date: '2026-07-18', title: 'v0.1.0R2 — New build', source: 'intake' },
    ]);
    expect(r.skipped).toEqual(['garbage heading']);
  });

  it('shortens long notes', () => {
    const r = parseIntakeManifest(`### 0.1.0R1 — 2026-09-18T21:03:16\n- Note: ${'x'.repeat(200)}`);
    expect(r.entries[0].title.length).toBeLessThanOrEqual(100);
    expect(r.entries[0].title.endsWith('…')).toBe(true);
  });
});
