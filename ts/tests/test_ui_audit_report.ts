import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const AUDIT_PATH = resolve(__dirname, '../../docs/analysis/ui-component-audit.md');

const GAMES = [
  'brewfield',
  'dissonance',
  'slimeworld',
  'shoal',
  'horse_racing',
  'mutant_battle_ball',
  'slither_rogue',
  'scrapcrawl',
];

describe('ui audit report', () => {
  it('covers all games with a compliance status', () => {
    const text = readFileSync(AUDIT_PATH, 'utf-8');

    for (const game of GAMES) {
      expect(text).toContain(game);
    }

    const statusPhrases = ['non-compliant', 'partially compliant', 'mostly compliant', 'compliant'];
    const hasStatus = statusPhrases.some((phrase) => text.toLowerCase().includes(phrase));
    expect(hasStatus).toBe(true);

    // The audit contains every game row at least once in the summary table.
    const gameRowCount = GAMES.filter((g) => text.includes(`| \`${g}\` `)).length;
    expect(gameRowCount).toBe(GAMES.length);
  });
});
