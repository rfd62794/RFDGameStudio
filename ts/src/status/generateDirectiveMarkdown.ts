import type { DirectiveEntry, DirectiveState, RoundOutcome } from './directiveTypes';

const STATE_LABELS: Record<DirectiveState, string> = {
  drafted: 'Drafted',
  dispatched: 'Dispatched',
  verified: 'Verified',
  closed: 'Closed',
};

const OUTCOME_LABELS: Record<RoundOutcome, string> = {
  fabricated: 'Fabricated',
  'wrong-hypothesis': 'Wrong Hypothesis',
  partial: 'Partial',
  correct: 'Correct',
};

const OUTCOME_SYMBOLS: Record<RoundOutcome, string> = {
  fabricated: '✗',
  'wrong-hypothesis': '✗',
  partial: '◐',
  correct: '✓',
};

function escapePipe(text: string): string {
  return text.replace(/\|/g, '\\|');

}

/**
 * Pure function: converts the DIRECTIVE_TRACKER data into the markdown
 * representation used by docs/state/DirectiveTracker.md.
 * No I/O — the writing happens in the generation script.
 *
 * Matches the exact pattern of generateMarkdown.ts for StatusBoard.md.
 */
export function generateDirectiveMarkdown(entries: DirectiveEntry[]): string {
  const sections: string[] = [];

  sections.push('<!-- GENERATED FILE — edit ts/src/status/directiveTracker.data.ts, then run ts/tools/generate-directive-tracker.ts -->');
  sections.push('');
  sections.push('# RFD Game Studio — Directive Tracker');
  sections.push('');
  sections.push('*August 16, 2026 | RFD IT Services Ltd. | Generated from `ts/src/status/directiveTracker.data.ts`.*');
  sections.push('');
  sections.push('> **What this tracks:** the real round history of each directive — how many');
  sections.push('> rounds it took, what each round caught (fabricated completions, wrong');
  sections.push('> hypotheses, partial fixes), and where it ended up. Not a status board');
  sections.push('> (see [StatusBoard.md](./StatusBoard.md) for that) — a record of what goes');
  sections.push('> wrong and how it gets caught, so the same anti-patterns are visible after');
  sections.push('> the session ends.');
  sections.push('');
  sections.push('> **Update trigger:** whenever a submission is verified or found to need');
  sections.push('> another round. This is not a new process step — it is writing down');
  sections.push('> something that is already happening.');
  sections.push('');
  sections.push('---');
  sections.push('');

  // Summary table
  sections.push('## Summary');
  sections.push('');
  sections.push('| Directive | Project | State | Rounds | Fabricated | Wrong Hypothesis | Partial | Correct | Last Updated |');
  sections.push('|---|---|---|---|---|---|---|---|---|');

  for (const e of entries) {
    const fabricated = e.rounds.filter(r => r.outcome === 'fabricated').length;
    const wrongHyp = e.rounds.filter(r => r.outcome === 'wrong-hypothesis').length;
    const partial = e.rounds.filter(r => r.outcome === 'partial').length;
    const correct = e.rounds.filter(r => r.outcome === 'correct').length;
    sections.push(
      `| **${escapePipe(e.name)}** | ${escapePipe(e.project)} | ${STATE_LABELS[e.state]} | ${e.rounds.length} | ${fabricated} | ${wrongHyp} | ${partial} | ${correct} | ${e.lastUpdated} |`,
    );
  }

  sections.push('');
  sections.push('---');
  sections.push('');

  // Per-directive detail
  sections.push('## Round History');
  sections.push('');

  for (const e of entries) {
    sections.push(`### ${e.name}`);
    sections.push('');
    sections.push(`- **Project:** ${e.project}`);
    sections.push(`- **State:** ${STATE_LABELS[e.state]}`);
    sections.push(`- **Total rounds:** ${e.rounds.length}`);
    sections.push('');
    sections.push('| Round | Outcome | Note |');
    sections.push('|---|---|---|');
    for (const r of e.rounds) {
      sections.push(
        `| R${r.roundNumber} | ${OUTCOME_SYMBOLS[r.outcome]} ${OUTCOME_LABELS[r.outcome]} | ${escapePipe(r.note)} |`,
      );
    }
    sections.push('');
  }

  sections.push('---');
  sections.push('');
  sections.push('*Legend: ✓ Correct · ✗ Fabricated / Wrong Hypothesis · ◐ Partial*');

  return sections.join('\n');
}
