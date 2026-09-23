import { describe, it, expect } from 'vitest';
import { applyFavorGain, applyWhisper, applyRepeatDecay } from '../src/games/succession/engine/favor';
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
      claimantId: 'player',
    };

    const result = applyWhisper(figure, 'player', claim, 20, CLAIM_THEMES);

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
        claimantId: 'player',
      },
    };

    const contradictingClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 2,
      claimantId: 'player',
    };

    const result = applyWhisper(initialFigure, 'player', contradictingClaim, 20, CLAIM_THEMES);

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
        claimantId: 'player',
      },
    };

    const contradictingClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 2,
      claimantId: 'player',
    };

    const result = applyWhisper(initialFigure, 'player', contradictingClaim, 20, CLAIM_THEMES);

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
        claimantId: 'player',
      },
    };

    const firstContradiction: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 2,
      claimantId: 'player',
    };

    const firstResult = applyWhisper(initialFigure, 'player', firstContradiction, 20, CLAIM_THEMES);
    expect(firstResult.figure.exposedAgainst).toEqual(['player']);

    // Now whisper noble_pedigree again, which opposes common_origins (the new mostRecentClaim)
    const secondContradiction: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 3,
      claimantId: 'player',
    };

    const secondResult = applyWhisper(firstResult.figure, 'player', secondContradiction, 20, CLAIM_THEMES);
    expect(secondResult.figure.exposedAgainst).toEqual(['player']);
    expect(secondResult.figure.exposedAgainst.length).toBe(1);
  });

  it('applyWhisper_works_identically_for_player_as_before', () => {
    const figure = createTestFigure(5);
    const claim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
      claimantId: 'player',
    };

    const result = applyWhisper(figure, 'player', claim, 20, CLAIM_THEMES);

    expect(result.exposed).toBe(false);
    expect(result.figure.favor.player).toBe(25);
    expect(result.figure.mostRecentClaim).toEqual(claim);
    expect(result.figure.exposedAgainst).toEqual([]);
  });

  it('applyWhisper_applies_to_any_claimant_id', () => {
    const figure = createTestFigure(5);
    const claim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
      claimantId: 'aldric',
    };

    const result = applyWhisper(figure, 'aldric', claim, 15, CLAIM_THEMES);

    expect(result.exposed).toBe(false);
    expect(result.figure.favor.aldric).toBe(25);
    expect(result.figure.favor.player).toBe(5);
    expect(result.figure.mostRecentClaim).toEqual(claim);
    expect(result.figure.exposedAgainst).toEqual([]);
  });

  it('applyRepeatDecay_returns_full_value_at_zero_repeats', () => {
    expect(applyRepeatDecay(20, 0)).toBe(20);
  });

  it('applyRepeatDecay_halves_on_each_consecutive_repeat_down_to_floor', () => {
    expect(applyRepeatDecay(20, 1)).toBe(10);
    expect(applyRepeatDecay(20, 2)).toBe(5); // floor: 20 * 0.25
    expect(applyRepeatDecay(20, 3)).toBe(5); // still floored, does not go to 0
    expect(applyRepeatDecay(20, 10)).toBe(5); // floor holds indefinitely
  });

  it('applyWhisper_decays_favor_on_consecutive_same_theme_repeat', () => {
    const figure = createTestFigure(0);
    const claim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
      claimantId: 'player',
    };

    const first = applyWhisper(figure, 'player', claim, 20, CLAIM_THEMES);
    expect(first.figure.favor.player).toBe(20); // full value, first use

    const repeatClaim: Claim = { ...claim, segment: 2 };
    const second = applyWhisper(first.figure, 'player', repeatClaim, 20, CLAIM_THEMES);
    expect(second.figure.favor.player).toBe(30); // +10 (halved) on first repeat

    const secondRepeatClaim: Claim = { ...claim, segment: 3 };
    const third = applyWhisper(second.figure, 'player', secondRepeatClaim, 20, CLAIM_THEMES);
    expect(third.figure.favor.player).toBe(35); // +5 (floored) on second repeat
  });

  it('applyWhisper_restores_full_value_immediately_on_theme_switch', () => {
    // CLAIM_THEMES gives every figure exactly two mutually-opposing themes,
    // so a real in-game theme switch always triggers contradiction exposure
    // first (see ADR-001/ADR-002) — there is no non-contradicting second
    // theme to switch to at the same figure. To isolate the repeat-decay
    // reset logic from the contradiction engine, mostRecentClaim (which
    // drives checkContradiction) and repeatTracker (which drives decay) are
    // independent fields on FigureState — set mostRecentClaim to null so no
    // contradiction fires, while priming repeatTracker as if two prior
    // repeats already happened, then switch themes and confirm full value.
    const figure: FigureState = {
      ...createTestFigure(30),
      mostRecentClaim: null,
      repeatTracker: { player: { themeId: 'noble_pedigree', count: 2 } },
    };

    const switchClaim: Claim = {
      figureId: 'chancellor',
      themeId: 'common_origins',
      segment: 3,
      claimantId: 'player',
    };
    const result = applyWhisper(figure, 'player', switchClaim, 20, CLAIM_THEMES);

    expect(result.exposed).toBe(false);
    expect(result.figure.favor.player).toBe(50); // 30 + 20 full value, not decayed
    expect(result.figure.repeatTracker?.player).toEqual({ themeId: 'common_origins', count: 1 });
  });

  it('applyWhisper_repeat_decay_applies_identically_to_player_and_rival', () => {
    const figure = createTestFigure(0);
    const claim: Claim = {
      figureId: 'chancellor',
      themeId: 'noble_pedigree',
      segment: 1,
      claimantId: 'aldric',
    };

    const first = applyWhisper(figure, 'aldric', claim, 20, CLAIM_THEMES);
    expect(first.figure.favor.aldric).toBe(30); // 10 (baseline) + 20 full value

    const repeatClaim: Claim = { ...claim, segment: 2 };
    const second = applyWhisper(first.figure, 'aldric', repeatClaim, 20, CLAIM_THEMES);
    // Same decay curve as the player test above: +10, not +20
    expect(second.figure.favor.aldric).toBe(40);
  });
});
