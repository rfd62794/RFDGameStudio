import { describe, it, expect } from 'vitest';
import { resolveVerdict } from '../src/games/succession/engine/verdict';
import { FigureState, ClaimantId } from '../src/games/succession/engine/types';

const CLAIMANTS: ClaimantId[] = ['player', 'aldric', 'vivienne'];

describe('verdict', () => {
  it('resolveVerdict_awards_figure_to_highest_favor_non_exposed', () => {
    const figures: FigureState[] = [
      {
        id: 'chancellor',
        favor: { player: 30, aldric: 20, vivienne: 10 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'archbishop',
        favor: { player: 10, aldric: 40, vivienne: 20 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'commander',
        favor: { player: 15, aldric: 10, vivienne: 35 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
    ];

    const verdict = resolveVerdict(figures, CLAIMANTS);

    expect(verdict.perFigureWinner).toEqual({
      chancellor: 'player',
      archbishop: 'aldric',
      commander: 'vivienne',
    });
  });

  it('resolveVerdict_skips_exposed_claimant_even_with_highest_favor', () => {
    const figures: FigureState[] = [
      {
        id: 'chancellor',
        favor: { player: 50, aldric: 30, vivienne: 20 },
        mostRecentClaim: null,
        exposedAgainst: ['player'], // Player is exposed here
      },
      {
        id: 'archbishop',
        favor: { player: 10, aldric: 30, vivienne: 20 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'commander',
        favor: { player: 10, aldric: 20, vivienne: 30 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
    ];

    const verdict = resolveVerdict(figures, CLAIMANTS);

    // Chancellor skips player and awards to aldric
    expect(verdict.perFigureWinner.chancellor).toBe('aldric');
  });

  it('resolveVerdict_majority_true_at_2_of_3', () => {
    const figures: FigureState[] = [
      {
        id: 'chancellor',
        favor: { player: 40, aldric: 20, vivienne: 10 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'archbishop',
        favor: { player: 35, aldric: 25, vivienne: 15 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'commander',
        favor: { player: 10, aldric: 15, vivienne: 50 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
    ];

    const verdict = resolveVerdict(figures, CLAIMANTS);

    expect(verdict.isMajority).toBe(true);
    expect(verdict.overallWinner).toBe('player');
  });

  it('resolveVerdict_deadlock_resolves_by_fewest_contradictions', () => {
    // 1-1-1 split: player wins chancellor, aldric wins archbishop, vivienne wins commander.
    // player has 0 contradictions, aldric has 1 contradiction, vivienne has 1 contradiction.
    const figures: FigureState[] = [
      {
        id: 'chancellor',
        favor: { player: 30, aldric: 10, vivienne: 5 },
        mostRecentClaim: null,
        exposedAgainst: ['aldric'], // aldric caught here
      },
      {
        id: 'archbishop',
        favor: { player: 5, aldric: 30, vivienne: 10 },
        mostRecentClaim: null,
        exposedAgainst: ['vivienne'], // vivienne caught here
      },
      {
        id: 'commander',
        favor: { player: 5, aldric: 10, vivienne: 30 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
    ];

    const verdict = resolveVerdict(figures, CLAIMANTS);

    expect(verdict.isMajority).toBe(false);
    expect(verdict.overallWinner).toBe('player');
  });

  it('resolveVerdict_full_deadlock_returns_no_winner', () => {
    // 1-1-1 split AND everyone has 0 contradictions
    const figures: FigureState[] = [
      {
        id: 'chancellor',
        favor: { player: 30, aldric: 10, vivienne: 5 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'archbishop',
        favor: { player: 5, aldric: 30, vivienne: 10 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
      {
        id: 'commander',
        favor: { player: 5, aldric: 10, vivienne: 30 },
        mostRecentClaim: null,
        exposedAgainst: [],
      },
    ];

    const verdict = resolveVerdict(figures, CLAIMANTS);

    expect(verdict.isMajority).toBe(false);
    expect(verdict.overallWinner).toBe(null);
  });
});
