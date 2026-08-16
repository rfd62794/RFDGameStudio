import { describe, it, expect } from 'vitest';
import { checkContradiction } from '../src/games/succession/engine/contradiction';
import { CLAIM_THEMES } from '../src/games/succession/data/claimThemes';
import { Claim } from '../src/games/succession/engine/types';

describe('contradiction', () => {
  it('checkContradiction_true_when_new_theme_opposes_previous', () => {
    const prevClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
    };
    const isContradiction = checkContradiction(prevClaim, 'common_origins', CLAIM_THEMES);
    expect(isContradiction).toBe(true);
  });

  it('checkContradiction_false_when_same_theme_repeated', () => {
    const prevClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
    };
    const isContradiction = checkContradiction(prevClaim, 'noble_pedigree', CLAIM_THEMES);
    expect(isContradiction).toBe(false);
  });

  it('checkContradiction_false_when_no_previous_claim', () => {
    const isContradiction = checkContradiction(null, 'noble_pedigree', CLAIM_THEMES);
    expect(isContradiction).toBe(false);
  });

  it('checkContradiction_false_when_themes_unrelated', () => {
    const prevClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
    };
    // divine_favor belongs to archbishop, does not oppose noble_pedigree
    const isContradiction = checkContradiction(prevClaim, 'divine_favor', CLAIM_THEMES);
    expect(isContradiction).toBe(false);
  });
});
