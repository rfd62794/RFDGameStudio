// new: ts/tests/test_slimeworld_ranch_rules.ts
import { describe, it, expect } from 'vitest';
import { mulberry32 } from '../src/engine/shared/seededRandom';
import { ALL_SPECIES, LARGO_SPECIES, NATIVE_SPECIES, speciesById } from '../src/games/slimeworld/ranch/data/species';
import { RECIPES, findRecipe } from '../src/games/slimeworld/ranch/data/recipes';
import { FRUIT, fruitById } from '../src/games/slimeworld/ranch/data/fruit';
import { PEN_CAPACITY, PALETTE_SIZE } from '../src/games/slimeworld/ranch/data/constants';
import { addFruit, newRanchState } from '../src/games/slimeworld/ranch/model/state';
import { catchSlime } from '../src/games/slimeworld/ranch/model/slimes';
import { feedSlime } from '../src/games/slimeworld/ranch/model/feeding';
import { mixSlimes, mutationChance } from '../src/games/slimeworld/ranch/model/mixing';
import { floodMultiplier, plortPrice, recentSales, sellPlorts } from '../src/games/slimeworld/ranch/model/market';
import { describeRanch } from '../src/games/slimeworld/ranch/debug/describeRanch';
import type { RanchState } from '../src/games/slimeworld/ranch/model/types';

function caught(state: RanchState, speciesId: string, seed = 1): RanchState {
  const r = catchSlime(state, speciesId, mulberry32(seed));
  if (!r.ok) throw new Error(r.reason);
  return r.state;
}

describe('ranch data integrity', () => {
  it('has 6 native species, 15 Largo species and 15 recipes', () => {
    expect(NATIVE_SPECIES).toHaveLength(6);
    expect(LARGO_SPECIES).toHaveLength(15);
    expect(RECIPES).toHaveLength(15);
  });

  it('species ids are unique and every colour index fits the palette', () => {
    const ids = ALL_SPECIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of ALL_SPECIES) expect(s.colorIndex).toBeLessThan(PALETTE_SIZE);
  });

  it('every preferred fruit exists', () => {
    for (const s of ALL_SPECIES) expect(fruitById(s.preferredFruit), s.id).toBeDefined();
    expect(FRUIT).toHaveLength(6);
  });

  it('every recipe joins two different natives to a Largo species, and each pair has exactly one recipe', () => {
    const nativeIds = NATIVE_SPECIES.map((s) => s.id);
    const largoIds = LARGO_SPECIES.map((s) => s.id);
    const seen = new Set<string>();
    for (const r of RECIPES) {
      expect(nativeIds).toContain(r.a);
      expect(nativeIds).toContain(r.b);
      expect(r.a).not.toBe(r.b);
      expect(largoIds).toContain(r.result);
      const key = [r.a, r.b].sort().join('+');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(15);
  });

  it('a Largo plort is worth round((a + b) / 2) + 4', () => {
    for (const r of RECIPES) {
      const a = speciesById(r.a)!.plortValue;
      const b = speciesById(r.b)!.plortValue;
      expect(speciesById(r.result)!.plortValue, r.result).toBe(Math.round((a + b) / 2) + 4);
    }
  });

  it('findRecipe ignores order and refuses a same-species pair', () => {
    expect(findRecipe('pip', 'bloom')?.result).toBe('largo_pip_bloom');
    expect(findRecipe('bloom', 'pip')?.result).toBe('largo_pip_bloom');
    expect(findRecipe('pip', 'pip')).toBeUndefined();
  });
});

describe('catching and the pen', () => {
  it('a caught slime joins the pen, fills the collection and takes the species defaults', () => {
    const s = caught(newRanchState(), 'pip');
    expect(s.pen).toHaveLength(1);
    expect(s.pen[0].speciesId).toBe('pip');
    expect(s.pen[0].traits.affinity).toBe('meadow');
    expect(s.collection).toEqual(['pip']);
    expect(s.nextId).toBe(2);
  });

  it('is deterministic for a seed and never mutates the input state', () => {
    const start = newRanchState();
    const a = catchSlime(start, 'dew', mulberry32(9));
    const b = catchSlime(start, 'dew', mulberry32(9));
    expect(a).toEqual(b);
    expect(start.pen).toHaveLength(0);
  });

  it('refuses an unknown species and a full pen without changing anything', () => {
    expect(catchSlime(newRanchState(), 'nope', mulberry32(1)).ok).toBe(false);
    let s = newRanchState();
    for (let i = 0; i < PEN_CAPACITY; i += 1) s = caught(s, 'pip', i + 1);
    const full = catchSlime(s, 'bloom', mulberry32(1));
    expect(full).toEqual({ ok: false, reason: 'pen is full' });
  });
});

describe('feeding', () => {
  it('spends one fruit, yields exactly one plort of the slime species, and counts as a Hub action', () => {
    let s = caught(newRanchState(), 'pip');
    s = addFruit(s, 'sunfruit', 2);
    const r = feedSlime(s, s.pen[0].id, 'sunfruit');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.fruit.sunfruit).toBe(1);
    expect(r.state.plorts.pip).toBe(1);
    expect(r.state.actionCount).toBe(1);
    expect(r.state.pen[0].lean.meadow).toBe(1);
  });

  it('refuses with no fruit, an unknown fruit or an unknown slime', () => {
    const s = caught(newRanchState(), 'pip');
    expect(feedSlime(s, s.pen[0].id, 'sunfruit').ok).toBe(false);
    expect(feedSlime(addFruit(s, 'sunfruit', 1), 'slime-99', 'sunfruit').ok).toBe(false);
    expect(feedSlime(addFruit(s, 'sunfruit', 1), s.pen[0].id, 'moonroot').ok).toBe(false);
  });

  it('never leaves a negative resource across a long feeding run', () => {
    let s = addFruit(caught(newRanchState(), 'pip'), 'sunfruit', 5);
    for (let i = 0; i < 20; i += 1) {
      const r = feedSlime(s, s.pen[0].id, 'sunfruit');
      if (r.ok) s = r.state;
    }
    expect(s.fruit.sunfruit).toBe(0);
    expect(s.plorts.pip).toBe(5);
  });
});

describe('market flood-decay pricing', () => {
  it('floodMultiplier is 1 with no sales, falls 0.12 per sale and never below 0.3', () => {
    expect(floodMultiplier(0)).toBe(1);
    expect(floodMultiplier(1)).toBeCloseTo(0.88, 10);
    expect(floodMultiplier(3)).toBeCloseTo(0.64, 10);
    expect(floodMultiplier(50)).toBe(0.3);
  });

  it('the base price is the plort value', () => {
    expect(plortPrice(newRanchState(), 'pip')).toBe(10);
    expect(plortPrice(newRanchState(), 'nope')).toBeUndefined();
  });

  it('selling a batch prices each unit after the sales before it, and credits the proceeds', () => {
    const s = { ...newRanchState(), plorts: { hoar: 3 } };
    const r = sellPlorts(s, 'hoar', 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // 20 x 1.0 = 20, 20 x 0.88 = 17.6 -> 17, 20 x 0.76 = 15.2 -> 15
    expect(r.earned).toBe(20 + 17 + 15);
    expect(r.state.plortCredit).toBe(52);
    expect(r.state.plorts.hoar).toBe(0);
    expect(r.state.actionCount).toBe(1);
  });

  it('the flood fades with Hub actions, not with time', () => {
    let s: RanchState = { ...newRanchState(), plorts: { pip: 1 } };
    const sold = sellPlorts(s, 'pip', 1);
    if (!sold.ok) throw new Error(sold.reason);
    s = sold.state;
    expect(recentSales(s.sales, 'pip', s.actionCount)).toBe(1);
    expect(plortPrice(s, 'pip')).toBe(8); // 10 x 0.88 = 8.8 -> 8
    s = { ...s, actionCount: s.actionCount + 5 };
    expect(recentSales(s.sales, 'pip', s.actionCount)).toBe(0);
    expect(plortPrice(s, 'pip')).toBe(10);
  });

  it('refuses to sell what is not owned and caps the quantity at what is owned', () => {
    expect(sellPlorts(newRanchState(), 'pip', 1).ok).toBe(false);
    const r = sellPlorts({ ...newRanchState(), plorts: { pip: 2 } }, 'pip', 99);
    expect(r.ok && r.sold).toBe(2);
  });
});

describe('mixing', () => {
  function twoInPen(a: string, b: string): RanchState {
    return caught(caught(newRanchState(), a, 3), b, 4);
  }

  it('mutationChance is the base, +0.2 per leaning fruit, capped at 0.85', () => {
    expect(mutationChance(0)).toBeCloseTo(0.05, 10);
    expect(mutationChance(2)).toBeCloseTo(0.45, 10);
    expect(mutationChance(10)).toBe(0.85);
  });

  it('turns two natives into the recipe species and consumes both parents', () => {
    const s = twoInPen('pip', 'flurry');
    const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(5));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.child.speciesId).toBe('largo_pip_flurry');
    expect(r.state.pen).toHaveLength(1);
    expect(r.state.pen[0].id).toBe(r.child.id);
    expect(r.state.collection).toContain('largo_pip_flurry');
    expect(r.state.actionCount).toBe(1);
  });

  it('each trait comes from one of the two parents when nothing mutates', () => {
    const s = twoInPen('pip', 'flurry');
    for (let seed = 1; seed <= 40; seed += 1) {
      const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(seed));
      if (!r.ok || r.mutated) continue;
      const [a, b] = s.pen;
      expect([a.traits.colorIndex, b.traits.colorIndex]).toContain(r.child.traits.colorIndex);
      expect([a.traits.size, b.traits.size]).toContain(r.child.traits.size);
      expect([a.traits.affinity, b.traits.affinity]).toContain(r.child.traits.affinity);
    }
  });

  it('refuses a same-species pair, a missing slime and the same slime twice, changing nothing', () => {
    const same = twoInPen('pip', 'pip');
    expect(mixSlimes(same, same.pen[0].id, same.pen[1].id, mulberry32(1)).ok).toBe(false);
    const s = twoInPen('pip', 'bloom');
    expect(mixSlimes(s, s.pen[0].id, 'slime-99', mulberry32(1)).ok).toBe(false);
    expect(mixSlimes(s, s.pen[0].id, s.pen[0].id, mulberry32(1)).ok).toBe(false);
    expect(s.pen).toHaveLength(2);
  });

  it('feeding frost fruit before a mix makes a frost child far more often than not feeding', () => {
    function frostRate(fed: boolean): number {
      let hits = 0;
      const runs = 400;
      for (let seed = 1; seed <= runs; seed += 1) {
        let s = twoInPen('pip', 'bloom'); // both meadow
        if (fed) {
          s = addFruit(s, 'icepear', 4);
          for (const slime of [...s.pen]) {
            for (let i = 0; i < 2; i += 1) {
              const f = feedSlime(s, slime.id, 'icepear');
              if (f.ok) s = f.state;
            }
          }
        }
        const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(seed));
        if (r.ok && r.child.traits.affinity === 'frost') hits += 1;
      }
      return hits / runs;
    }
    expect(frostRate(true)).toBeGreaterThan(0.7); // 4 fruit -> 0.85 cap
    expect(frostRate(false)).toBeLessThan(0.1); // base 0.05, half of which is a frost pick
  });

  it('mutation changes traits only: the child species is always the recipe result', () => {
    const s = twoInPen('dew', 'sleet');
    for (let seed = 1; seed <= 60; seed += 1) {
      const r = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(seed));
      expect(r.ok && r.child.speciesId).toBe('largo_dew_sleet');
    }
  });

  it('is deterministic for a seed', () => {
    const s = twoInPen('bloom', 'hoar');
    const a = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(77));
    const b = mixSlimes(s, s.pen[0].id, s.pen[1].id, mulberry32(77));
    expect(a).toEqual(b);
  });
});

describe('debug harness', () => {
  it('describeRanch prints the pen, collection, plorts with prices and fruit', () => {
    let s = addFruit(caught(newRanchState(), 'pip'), 'sunfruit', 1);
    const fed = feedSlime(s, s.pen[0].id, 'sunfruit');
    if (!fed.ok) throw new Error(fed.reason);
    s = fed.state;
    const lines = describeRanch(s);
    expect(lines[0]).toBe('actions 1, plortCredit 0');
    expect(lines[1]).toBe('collection 1/21');
    expect(lines.some((l) => l.startsWith('pen slime-1 Pip'))).toBe(true);
    expect(lines).toContain('plort pip x1 at 10 each');
  });
});
