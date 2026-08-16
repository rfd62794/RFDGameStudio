import { describe, it, expect } from 'vitest';
import { applyFavorGain, applyPlayerWhisper } from '../src/games/succession/engine/favor';
import { FigureState, Claim } from '../src/games/succession/engine/types';
import { CLAIM_THEMES } from '../src/games/succession/data/claimThemes';

function createTestFigure(initialPlayerFavor = 0): FigureState {
  return {
    id: 'chancellor',
    favor: {
      player: initialPlayerFavor,
      aldric: 10,
      vivienne: 10,
    },
    mostRecentClaim: null,
    exposedAgainst: [],
  };
}

describe('favor', () => {
  it('applyFavorGain_increases_target_claimant_favor_only', () => {
    const figure = createTestFigure(5);
    const updated = applyFavorGain(figure, 'player', 15);

    expect(updated.favor.player).toBe(20);
  });

  it('applyFavorGain_does_not_affect_other_claimants', () => {
    const figure = createTestFigure(5);
    const updated = applyFavorGain(figure, 'player', 15);

    expect(updated.favor.aldric).toBe(10);
    expect(updated.favor.vivienne).toBe(10);
  });

  it('applyPlayerWhisper_increases_favor_when_no_contradiction', () => {
    const figure = createTestFigure(5);
    const claim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
    };

    const result = applyPlayerWhisper(figure, claim, 20, CLAIM_THEMES);

    expect(result.exposed).toBe(false);
    expect(result.figure.favor.player).toBe(25);
    expect(result.figure.mostRecentClaim).toEqual(claim);
    expect(result.figure.exposedAgainst).toEqual([]);
  });

  it('applyPlayerWhisper_marks_exposed_and_grants_no_favor_on_contradiction', () => {
    const initialFigure: FigureState = {
      ...createTestFigure(10),
      mostRecentClaim: {
        figureId: 'chancellor',
        themeId: 'noble_pedigree',
        segment: 1,
      },
    };

    const contradictingClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 2,
    };

    const result = applyPlayerWhisper(initialFigure, contradictingClaim, 20, CLAIM_THEMES);

    expect(result.exposed).toBe(true);
    expect(result.figure.favor.player).toBe(10); // Unchanged
    expect(result.figure.exposedAgainst).toContain('player');
  });

  it('applyPlayerWhisper_updates_mostRecentClaim_even_when_exposed', () => {
    const initialFigure: FigureState = {
      ...createTestFigure(10),
      mostRecentClaim: {
        figureId: 'chancellor',
        themeId: 'noble_pedigree',
        segment: 1,
      },
    };

    const contradictingClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 2,
    };

    const result = applyPlayerWhisper(initialFigure, contradictingClaim, 20, CLAIM_THEMES);

    expect(result.exposed).toBe(true);
    expect(result.figure.mostRecentClaim).toEqual(contradictingClaim);
  });

  it('applyPlayerWhisper_exposure_is_permanent', () => {
    const initialFigure: FigureState = {
      ...createTestFigure(10),
      mostRecentClaim: {
        figureId: 'chancellor',
        themeId: 'noble_pedigree',
        segment: 1,
      },
    };

    const firstContradiction: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 2,
    };

    const firstResult = applyPlayerWhisper(initialFigure, firstContradiction, 20, CLAIM_THEMES);
    expect(firstResult.figure.exposedAgainst).toEqual(['player']);

    // Now whisper noble_pedigree again, which opposes common_origins (the new mostRecentClaim)
    const secondContradiction: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 3,
    };

    const secondResult = applyPlayerWhisper(firstResult.figure, secondContradiction, 20, CLAIM_THEMES);
    expect(secondResult.figure.exposedAgainst).toEqual(['player']);
    expect(secondResult.figure.exposedAgainst.length).toBe(1);
  });
});
