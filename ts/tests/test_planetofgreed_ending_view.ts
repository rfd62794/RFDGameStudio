// new: ts/tests/test_planetofgreed_ending_view.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEndingViewModel, nextChapterHref, NEXT_CHAPTER_ID, NEXT_CHAPTER_LABEL,
} from '../src/games/planetofgreed/endingView';
import { ENDING_TEXT } from '../src/games/planetofgreed/flavorText';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const appSource = readFileSync(resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'), 'utf-8');

describe('test_planetofgreed_ending_view', () => {
  it('builds the summary lines from the finished campaign', () => {
    const vm = buildEndingViewModel({ name: 'Ember Ironworks', rank: 1 }, { type: 'ENDING_TRIGGERED', fragmentCount: 4, total: 6 }, { year: 3 });
    expect(vm).toEqual({
      houseName: 'Ember Ironworks',
      rankLabel: 'Rank 1',
      fragmentsLabel: '4 of 6',
      yearLabel: 'Year 3',
      allFragments: false,
    });
  });

  it('flags a complete set of fragments and clamps the year to the 3-year campaign', () => {
    const vm = buildEndingViewModel({ name: 'Tidewell Capital', rank: 1 }, { type: 'ENDING_TRIGGERED', fragmentCount: 6, total: 6 }, { year: 4 });
    expect(vm.allFragments).toBe(true);
    expect(vm.yearLabel).toBe('Year 3');
    expect(buildEndingViewModel({ name: 'X', rank: 1 }, { type: 'ENDING_TRIGGERED', fragmentCount: 1, total: 6 }, { year: 0 }).yearLabel).toBe('Year 1');
  });

  it('links to Facility Escape in the arcade and shows no link in a standalone build', () => {
    expect(NEXT_CHAPTER_ID).toBe('facility_escape');
    expect(nextChapterHref('arcade', 'https://rfditservices.com/play/?game=planetofgreed#top')).toBe('https://rfditservices.com/play/?game=facility_escape');
    expect(nextChapterHref('standalone', 'https://example.com/')).toBeNull();
  });

  it('player-facing labels are plain and the ending screen wires them in', () => {
    expect(NEXT_CHAPTER_LABEL).toBe('Continue to Facility Escape');
    expect(ENDING_TEXT.restartLabel).toBe('Play again');
    expect(appSource).toContain('data-testid="pog-ending-continue"');
    expect(appSource).toContain('data-testid="pog-ending-summary"');
    // identifiers the e2e tests and older tests rely on stay
    expect(appSource).toContain('data-testid="pog-ending-placeholder"');
    expect(appSource).toContain('data-testid="pog-restart-after-ending"');
    expect(appSource).toContain('pog-ending-fragment-count');
  });
});
