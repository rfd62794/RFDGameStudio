import { describe, it, expect } from 'vitest';
import { checkContradictionAgainstKnown } from '../src/games/succession/engine/gossip';
import { CLAIM_THEMES } from '../src/games/succession/data/claimThemes';
import { Claim } from '../src/games/succession/engine/types';

describe('gossip', () => {
  it('checkContradictionAgainstKnown_true_when_any_claim_opposes', () => {
    // noble_pedigree opposes common_origins
    const allClaims: Claim[] = [
      { figureId: 'chancellor', themeId: 'noble_pedigree', segment: 1 },
    ];

    const result = checkContradictionAgainstKnown(allClaims, 'common_origins', CLAIM_THEMES);
    expect(result).toBe(true);
  });

  it('checkContradictionAgainstKnown_false_when_none_oppose', () => {
    const allClaims: Claim[] = [
      { figureId: 'chancellor', themeId: 'noble_pedigree', segment: 1 },
      { figureId: 'archbishop', themeId: 'divine_favor', segment: 2 },
    ];

    // battle_tested opposes diplomatic_ties; does not oppose noble_pedigree or divine_favor
    const result = checkContradictionAgainstKnown(allClaims, 'battle_tested', CLAIM_THEMES);
    expect(result).toBe(false);
  });

  it('checkContradictionAgainstKnown_false_for_empty_history', () => {
    const allClaims: Claim[] = [];
    const result = checkContradictionAgainstKnown(allClaims, 'noble_pedigree', CLAIM_THEMES);
    expect(result).toBe(false);
  });

  it('checkContradictionAgainstKnown_detects_across_different_figures', () => {
    // Claim was told to chancellor
    const allClaims: Claim[] = [
      { figureId: 'chancellor', themeId: 'noble_pedigree', segment: 1 },
    ];

    // Archbishop has common_origins in domain (opposes noble_pedigree)
    const result = checkContradictionAgainstKnown(allClaims, 'common_origins', CLAIM_THEMES);
    expect(result).toBe(true);
  });
});
