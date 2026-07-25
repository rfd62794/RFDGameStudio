import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const AUDIT_PATH = resolve(__dirname, '../docs/analysis/ui-component-audit.md');

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
      // Each game section includes a status phrase.
      const statusMatch = new RegExp(
        `\\| \\`?${game}\\`? \\|.*\\| (non-compliant|partially compliant|mostly compliant|compliant) \\|`,
        'i'
      );
      expect(text).toMatch(statusMatch);
    }
  });
});
