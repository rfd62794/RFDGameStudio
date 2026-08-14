import { describe, it, expect } from 'vitest';
import { WHEEL_ORDER, getOpposite, getAdjacent } from '../src/games/planetofgreed/wheelTopology';
import { CultureId } from '../src/games/planetofgreed/types';

describe('wheelTopology', () => {
  it('test_wheel_opposite_ember_tundra: Ember and Tundra resolve as mutual opposites', () => {
    // The locked "Fault Line" rival pair from Design.md v0.1/v0.2.
    expect(getOpposite('ember')).toBe('tundra');
    expect(getOpposite('tundra')).toBe('ember');
  });

  it('test_wheel_opposite_full_ring: all 6 opposite pairs resolve correctly and symmetrically', () => {
    // A opposite B implies B opposite A, for every culture. Also confirms
    // the two new pairs the ring math produces: Marsh<->Crystal, Gale<->Tide.
    const expectedPairs: [CultureId, CultureId][] = [
      ['ember', 'tundra'],
      ['marsh', 'crystal'],
      ['gale', 'tide'],
    ];
    for (const [a, b] of expectedPairs) {
      expect(getOpposite(a)).toBe(b);
      expect(getOpposite(b)).toBe(a);
    }
    // Full symmetry over the whole ring.
    for (const c of WHEEL_ORDER) {
      expect(getOpposite(getOpposite(c))).toBe(c);
    }
    // No culture is its own opposite.
    for (const c of WHEEL_ORDER) {
      expect(getOpposite(c)).not.toBe(c);
    }
  });

  it('test_wheel_adjacent_correct: adjacent pairs match ring order, wrap correctly at both ends', () => {
    // Adjacent = ring neighbors in WHEEL_ORDER, wrapping at both ends.
    const expected: { c: CultureId; adj: [CultureId, CultureId] }[] = [
      { c: 'ember', adj: ['tide', 'marsh'] },   // index 0: wrap back to tide(5), forward to marsh(1)
      { c: 'marsh', adj: ['ember', 'gale'] },   // index 1
      { c: 'gale', adj: ['marsh', 'tundra'] },  // index 2
      { c: 'tundra', adj: ['gale', 'crystal'] },// index 3
      { c: 'crystal', adj: ['tundra', 'tide'] },// index 4
      { c: 'tide', adj: ['crystal', 'ember'] }, // index 5: forward wraps to ember(0)
    ];
    for (const { c, adj } of expected) {
      expect(getAdjacent(c)).toEqual(adj);
    }
    // Adjacency is symmetric: if X is in getAdjacent(Y), then Y is in getAdjacent(X).
    for (const c of WHEEL_ORDER) {
      for (const n of getAdjacent(c)) {
        expect(getAdjacent(n)).toContain(c);
      }
    }
    // No culture is adjacent to itself, and a culture's opposite is never
    // one of its adjacents (the ring has 6 nodes, opposite is 3 away).
    for (const c of WHEEL_ORDER) {
      const adj = getAdjacent(c);
      expect(adj).not.toContain(c);
      expect(adj).not.toContain(getOpposite(c));
    }
  });
});
