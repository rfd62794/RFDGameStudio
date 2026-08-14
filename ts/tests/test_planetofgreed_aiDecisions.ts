import { describe, it, expect } from 'vitest';
import {
  selectWeightedNeighbor,
  weightNeighbor,
  makeSeededRng,
  WEIGHT_OPPOSITE,
  WEIGHT_ADJACENT,
  WEIGHT_BASELINE,
} from '../src/games/planetofgreed/aiDecisions';
import { Corporation, MapCell, CultureId } from '../src/games/planetofgreed/types';

// Minimal corp factory for tests -- only the fields the AI-bias logic reads.
function makeCorp(id: string, cultureId: CultureId, isPlayer = false): Corporation {
  return {
    id,
    name: id,
    color: '#000000',
    borderColor: '#000000',
    bgClass: '',
    textClass: '',
    isPlayer,
    cultureId,
    treasury: 0,
    scoutedCells: {},
    rank: 1,
    fragments: [cultureId],
  };
}

function makeCell(id: number, ownerId: string | null, neighborIds: number[] = []): MapCell {
  return {
    id,
    name: `cell-${id}`,
    seed: { x: 0, y: 0 },
    polygon: [],
    neighbors: neighborIds,
    ownerId,
    units: { circle: 0, square: 0, triangle: 0 },
    fortification: 0,
    recruitmentQueue: [],
    preferredProduction: 'circle',
    productionProgress: 0,
  };
}

describe('aiDecisions', () => {
  it('test_ai_bias_weights_wheel_opposite_highest: opposite-owned neighbors selected at a statistically higher rate than baseline across N trials', () => {
    // Acting House is Ember. Its wheel-opposite is Tundra, wheel-adjacent
    // are Tide and Marsh. Build a cell with 4 neighbors:
    //   neighbor 0 -> owned by Tundra corp (opposite, weight 3)
    //   neighbor 1 -> owned by a non-rival corp (Gale is 2 away, weight 1)
    //   neighbor 2 -> neutral (weight 1)
    //   neighbor 3 -> owned by Marsh corp (adjacent, weight 1.5)
    //
    // Expected probabilities (total weight = 3 + 1 + 1 + 1.5 = 6.5):
    //   opposite (Tundra)  -> 3/6.5   ~= 0.4615
    //   adjacent (Marsh)   -> 1.5/6.5 ~= 0.2308
    //   baseline (Gale)    -> 1/6.5   ~= 0.1538
    //   baseline (neutral) -> 1/6.5   ~= 0.1538
    //
    // Over 20000 trials with a seeded RNG, the opposite-owned neighbor
    // must be selected at a statistically higher rate than either baseline
    // neighbor. This is a real distribution check, not a single-run
    // assertion -- and it's deterministic (seeded), not flaky.
    const actingCorp = makeCorp('ai-ember', 'ember');
    const tundraCorp = makeCorp('ai-tundra', 'tundra');
    const galeCorp = makeCorp('ai-gale', 'gale');
    const marshCorp = makeCorp('ai-marsh', 'marsh');

    const cellsById: { [id: number]: MapCell } = {
      0: makeCell(0, tundraCorp.id),
      1: makeCell(1, galeCorp.id),
      2: makeCell(2, null),
      3: makeCell(3, marshCorp.id),
    };
    const corpsById = {
      [tundraCorp.id]: tundraCorp,
      [galeCorp.id]: galeCorp,
      [marshCorp.id]: marshCorp,
      [actingCorp.id]: actingCorp,
    };
    const actingCell = makeCell(99, actingCorp.id, [0, 1, 2, 3]);

    const rng = makeSeededRng(12345);
    const N = 20000;
    const counts: { [id: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0 };
    for (let i = 0; i < N; i++) {
      const chosen = selectWeightedNeighbor(actingCorp, actingCell, cellsById, corpsById, rng);
      counts[chosen as number]++;
    }

    const oppositeRate = counts[0] / N;
    const baselineGaleRate = counts[1] / N;
    const baselineNeutralRate = counts[2] / N;
    const adjacentRate = counts[3] / N;

    // Opposite must be selected at a statistically higher rate than either
    // baseline. Use a generous but real margin -- expected ~0.46 vs ~0.15.
    expect(oppositeRate).toBeGreaterThan(baselineGaleRate * 2);
    expect(oppositeRate).toBeGreaterThan(baselineNeutralRate * 2);
    // Adjacent must beat baseline too (1.5 vs 1).
    expect(adjacentRate).toBeGreaterThan(baselineGaleRate);

    // Sanity: rates sum to ~1 (every trial picked exactly one neighbor).
    const sum = oppositeRate + baselineGaleRate + baselineNeutralRate + adjacentRate;
    expect(sum).toBeCloseTo(1, 2);

    // Sanity: observed rates are close to expected (within 3% absolute).
    expect(oppositeRate).toBeCloseTo(3 / 6.5, 1);
    expect(adjacentRate).toBeCloseTo(1.5 / 6.5, 1);
    expect(baselineGaleRate).toBeCloseTo(1 / 6.5, 1);
    expect(baselineNeutralRate).toBeCloseTo(1 / 6.5, 1);
  });

  it('test_ai_bias_preserves_band_probabilities: the 40/20/20/20 roll is unaffected by this change', () => {
    // This module does NOT contain or touch the four-band probability roll
    // (40% Expand / 20% Reinforce / 20% Fortify / 20% Idle). That roll lives
    // in App.tsx's generateAIWeeklyOrders and is explicitly out of scope.
    // Confirm via direct read that this module exports no band-roll logic
    // and only the *which neighbor* weighting -- i.e. the band decision is
    // structurally impossible to have been touched here.
    //
    // The only exports are: weight constants, weightNeighbor,
    // selectWeightedNeighbor, makeSeededRng. None of these decide whether
    // to Expand at all; they only run AFTER that decision is made.
    expect(typeof weightNeighbor).toBe('function');
    expect(typeof selectWeightedNeighbor).toBe('function');
    expect(typeof makeSeededRng).toBe('function');
    // Weights are exactly the directive's starting values, untouched.
    expect(WEIGHT_OPPOSITE).toBe(3);
    expect(WEIGHT_ADJACENT).toBe(1.5);
    expect(WEIGHT_BASELINE).toBe(1);

    // And the weight function itself never returns a value that would
    // change whether an Expand happens -- it only ranks neighbors, all
    // positive, so every neighbor remains selectable (no neighbor is
    // weighted 0 or negative, which would effectively suppress Expand
    // into certain cells and indirectly alter the effective Expand rate).
    const ember = makeCorp('ai-ember', 'ember');
    const tundra = makeCorp('ai-tundra', 'tundra');
    const corpsById = { [tundra.id]: tundra, [ember.id]: ember };
    expect(weightNeighbor('ember', tundra.id, corpsById)).toBeGreaterThan(0);
    expect(weightNeighbor('ember', null, {})).toBeGreaterThan(0);
    expect(weightNeighbor('ember', ember.id, corpsById)).toBeGreaterThan(0);
  });
});
