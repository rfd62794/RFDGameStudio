import { describe, it, expect } from 'vitest';
import { initializeFragments, onHouseEliminated } from '../src/games/planetofgreed/fragmentSystem';
import { Corporation, CultureId } from '../src/games/planetofgreed/types';

function makeCorp(id: string, cultureId: CultureId): Corporation {
  return {
    id,
    name: id,
    color: '#000000',
    borderColor: '#000000',
    bgClass: '',
    textClass: '',
    isPlayer: false,
    cultureId,
    treasury: 0,
    scoutedCells: {},
    rank: 1,
    fragments: [], // initializeFragments will set this
  };
}

describe('fragmentSystem', () => {
  it('test_fragment_init_one_each: all 6 Houses start with exactly 1 fragment, their own', () => {
    const cultures: CultureId[] = ['ember', 'marsh', 'gale', 'tundra', 'crystal', 'tide'];
    const corps = cultures.map((c) => makeCorp(`ai-${c}`, c));
    initializeFragments(corps);

    expect(corps.length).toBe(6);
    for (const corp of corps) {
      expect(corp.fragments.length).toBe(1);
      expect(corp.fragments).toEqual([corp.cultureId]);
    }
    // No shared fragments across Houses at start -- each holds only its own.
    const allFragments = corps.flatMap((c) => c.fragments);
    expect(new Set(allFragments).size).toBe(6);
  });

  it('test_fragment_transfer_on_elimination: eliminated House fragments fully transfer, eliminated ends empty', () => {
    const ember = makeCorp('ai-ember', 'ember');
    const tundra = makeCorp('ai-tundra', 'tundra');
    initializeFragments([ember, tundra]);

    // Tundra eliminates Ember. Ember had [ember]; Tundra had [tundra].
    onHouseEliminated(ember, tundra);

    expect(ember.fragments).toEqual([]); // cleared, not dangling
    expect(tundra.fragments).toEqual(['tundra', 'ember']); // inherited
  });

  it('test_fragment_chain_transfer: A eliminates B (who already absorbed C) -> A ends with 3 fragments, not 2', () => {
    const a = makeCorp('ai-ember', 'ember');
    const b = makeCorp('ai-marsh', 'marsh');
    const c = makeCorp('ai-gale', 'gale');
    initializeFragments([a, b, c]);

    // First: B eliminates C. B now holds [marsh, gale]; C is empty.
    onHouseEliminated(c, b);
    expect(b.fragments).toEqual(['marsh', 'gale']);
    expect(c.fragments).toEqual([]);

    // Then: A eliminates B. A inherits ALL of B's fragments (marsh + gale),
    // plus keeps its own (ember) -> 3 total, not 2.
    onHouseEliminated(b, a);
    expect(a.fragments).toEqual(['ember', 'marsh', 'gale']);
    expect(a.fragments.length).toBe(3);
    expect(b.fragments).toEqual([]); // B cleared after transfer
  });
});
