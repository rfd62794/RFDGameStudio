// @vitest-environment node
//
// Directive Tracker — generateDirectiveMarkdown tests
//
// Covers the real behaviour of ts/src/status/generateDirectiveMarkdown.ts:
//   - the static skeleton (generated-file marker, title, intro, legend)
//   - the Summary table: one row per entry, per-outcome counts, state labels
//   - the Round History section: per-entry detail blocks, R<n> rows, symbols
//   - the empty cases: no entries at all, and an entry with zero rounds
//   - pipe escaping inside table cells (name, project, note)

import { describe, it, expect } from 'vitest';
import { generateDirectiveMarkdown } from '../src/status/generateDirectiveMarkdown';
import { DIRECTIVE_TRACKER } from '../src/status/directiveTracker.data';
import type { DirectiveEntry, DirectiveState } from '../src/status/directiveTypes';

function makeEntry(overrides: Partial<DirectiveEntry> = {}): DirectiveEntry {
  return {
    name: 'Test Directive',
    project: 'Test Project',
    state: 'verified',
    lastUpdated: '2026-09-23',
    rounds: [],
    ...overrides,
  };
}

function summaryRows(md: string): string[] {
  return md.split('\n').filter(l => l.startsWith('| **'));
}

function roundRows(md: string): string[] {
  return md.split('\n').filter(l => /^\| R\d+ \|/.test(l));
}

describe('generateDirectiveMarkdown skeleton', () => {
  it('emits the generated-file marker, title, section headings and legend', () => {
    const md = generateDirectiveMarkdown([makeEntry()]);
    expect(md).toContain('<!-- GENERATED FILE');
    expect(md).toContain('# RFD Game Studio — Directive Tracker');
    expect(md).toContain('## Summary');
    expect(md).toContain('## Round History');
    expect(md).toContain('*Legend: ✓ Correct · ✗ Fabricated / Wrong Hypothesis · ◐ Partial*');
  });

  it('empty entry list still produces the full skeleton with an empty summary table', () => {
    const md = generateDirectiveMarkdown([]);
    expect(md).toContain('| Directive | Project | State | Rounds | Fabricated | Wrong Hypothesis | Partial | Correct | Last Updated |');
    // The per-round table header is emitted inside the per-entry loop, so
    // with no entries the Round History section has a heading but no tables.
    expect(md).toContain('## Round History');
    expect(md).not.toContain('| Round | Outcome | Note |');
    expect(summaryRows(md)).toHaveLength(0);
    expect(roundRows(md)).toHaveLength(0);
    expect(md).not.toContain('### ');
  });
});

describe('generateDirectiveMarkdown summary table', () => {
  it('produces one row per entry with per-outcome counts and the state label', () => {
    const md = generateDirectiveMarkdown([makeEntry({
      name: 'Mixed Outcomes',
      project: 'Some Project',
      state: 'dispatched',
      lastUpdated: '2026-09-20',
      rounds: [
        { roundNumber: 1, outcome: 'fabricated', note: 'n1' },
        { roundNumber: 2, outcome: 'fabricated', note: 'n2' },
        { roundNumber: 3, outcome: 'wrong-hypothesis', note: 'n3' },
        { roundNumber: 4, outcome: 'partial', note: 'n4' },
        { roundNumber: 5, outcome: 'correct', note: 'n5' },
      ],
    })]);
    expect(summaryRows(md)).toEqual([
      '| **Mixed Outcomes** | Some Project | Dispatched | 5 | 2 | 1 | 1 | 1 | 2026-09-20 |',
    ]);
  });

  it('maps every DirectiveState to its label in both the summary row and the detail block', () => {
    const states: DirectiveState[] = ['drafted', 'dispatched', 'verified', 'closed'];
    const labels = ['Drafted', 'Dispatched', 'Verified', 'Closed'];
    const md = generateDirectiveMarkdown(
      states.map((state, i) => makeEntry({ name: `S${i}`, state })),
    );
    for (const label of labels) {
      expect(md).toContain(`| ${label} |`);
      expect(md).toContain(`- **State:** ${label}`);
    }
  });

  it('preserves entry order in both the summary and the round history', () => {
    const md = generateDirectiveMarkdown([
      makeEntry({ name: 'First' }),
      makeEntry({ name: 'Second' }),
    ]);
    expect(md.indexOf('**First**')).toBeLessThan(md.indexOf('**Second**'));
    expect(md.indexOf('### First')).toBeLessThan(md.indexOf('### Second'));
  });
});

describe('generateDirectiveMarkdown round history', () => {
  it('emits a detail block with project, state label and total rounds per entry', () => {
    const md = generateDirectiveMarkdown([makeEntry({
      name: 'Blocked Thing',
      project: 'Some Game',
      state: 'drafted',
      rounds: [{ roundNumber: 1, outcome: 'partial', note: 'half done' }],
    })]);
    expect(md).toContain('### Blocked Thing');
    expect(md).toContain('- **Project:** Some Game');
    expect(md).toContain('- **State:** Drafted');
    expect(md).toContain('- **Total rounds:** 1');
  });

  it('renders each round with its outcome symbol and label', () => {
    const md = generateDirectiveMarkdown([makeEntry({
      rounds: [
        { roundNumber: 1, outcome: 'fabricated', note: 'fabricated note' },
        { roundNumber: 2, outcome: 'wrong-hypothesis', note: 'wrong hyp note' },
        { roundNumber: 3, outcome: 'partial', note: 'partial note' },
        { roundNumber: 4, outcome: 'correct', note: 'correct note' },
      ],
    })]);
    expect(roundRows(md)).toEqual([
      '| R1 | ✗ Fabricated | fabricated note |',
      '| R2 | ✗ Wrong Hypothesis | wrong hyp note |',
      '| R3 | ◐ Partial | partial note |',
      '| R4 | ✓ Correct | correct note |',
    ]);
  });

  it('entry with zero rounds shows 0 counts and an empty round table', () => {
    const md = generateDirectiveMarkdown([makeEntry({ name: 'No Rounds Yet' })]);
    expect(summaryRows(md)).toEqual([
      '| **No Rounds Yet** | Test Project | Verified | 0 | 0 | 0 | 0 | 0 | 2026-09-23 |',
    ]);
    expect(md).toContain('- **Total rounds:** 0');
    expect(md).toContain('| Round | Outcome | Note |');
    expect(roundRows(md)).toHaveLength(0);
  });
});

describe('generateDirectiveMarkdown pipe escaping', () => {
  it('escapes pipes in name, project and note inside table cells', () => {
    const md = generateDirectiveMarkdown([makeEntry({
      name: 'A | B',
      project: 'P | Q',
      rounds: [{ roundNumber: 1, outcome: 'correct', note: 'x | y' }],
    })]);
    expect(summaryRows(md)).toEqual([
      '| **A \\| B** | P \\| Q | Verified | 1 | 0 | 0 | 0 | 1 | 2026-09-23 |',
    ]);
    expect(roundRows(md)).toEqual(['| R1 | ✓ Correct | x \\| y |']);
    // escapePipe is only applied to table cells; the ### heading keeps the
    // raw name because pipes do not break markdown headings.
    expect(md).toContain('### A | B');
  });
});

describe('generateDirectiveMarkdown on real DIRECTIVE_TRACKER data', () => {
  it('produces one summary row and one detail section per entry', () => {
    const md = generateDirectiveMarkdown(DIRECTIVE_TRACKER);
    expect(summaryRows(md)).toHaveLength(DIRECTIVE_TRACKER.length);
    for (const e of DIRECTIVE_TRACKER) {
      expect(md).toContain(`### ${e.name}`);
      expect(md).toContain(`**${e.name}**`);
    }
  });

  it('round history row count equals the total rounds across all entries', () => {
    const md = generateDirectiveMarkdown(DIRECTIVE_TRACKER);
    const totalRounds = DIRECTIVE_TRACKER.reduce((n, e) => n + e.rounds.length, 0);
    expect(totalRounds).toBeGreaterThan(0);
    expect(roundRows(md)).toHaveLength(totalRounds);
  });
});
