// new: ts/src/games/slimeworld/ranch/model/mixing.ts
import {
  BASE_MUTATION_CHANCE,
  MUTABLE_AFFINITIES,
  MUTATION_CAP,
  MUTATION_PER_FRUIT,
} from '../data/constants';
import { findRecipe } from '../data/recipes';
import { speciesById } from '../data/species';
import { discover } from './slimes';
import type { Affinity, Lean, RanchState, Rng, RuleResult, Slime } from './types';

/** Fruit of each mutable element fed to both parents combined. */
function combinedLean(a: Lean, b: Lean): Array<{ element: Affinity; count: number }> {
  return MUTABLE_AFFINITIES.map((element) => ({
    element,
    count: (a[element] ?? 0) + (b[element] ?? 0),
  }));
}

/** Chance the child's affinity mutates: base, plus a bonus per leaning fruit, capped. Pure. */
export function mutationChance(leaningFruit: number): number {
  return Math.min(MUTATION_CAP, BASE_MUTATION_CHANCE + MUTATION_PER_FRUIT * leaningFruit);
}

/**
 * Mix two slimes from the pen by the recipe table. Both parents are consumed (PROPOSED rule, open
 * question 10 in the direction doc). Each trait comes from one parent at 50/50; then the affinity may
 * mutate toward the element the parents were fed most (ties go to the first in MUTABLE_AFFINITIES),
 * or toward a random mutable element when no fruit leaning applies. Mutation changes traits only,
 * never the species. Rng call order is fixed: colour, size, affinity, mutation roll, then (only for
 * an unleaned mutation) the element pick.
 */
export function mixSlimes(
  state: RanchState,
  slimeIdA: string,
  slimeIdB: string,
  rng: Rng
): RuleResult<{ state: RanchState; child: Slime; mutated: boolean }> {
  if (slimeIdA === slimeIdB) return { ok: false, reason: 'pick two different slimes' };
  const a = state.pen.find((s) => s.id === slimeIdA);
  const b = state.pen.find((s) => s.id === slimeIdB);
  if (!a || !b) return { ok: false, reason: 'both slimes must be in the pen' };
  const recipe = findRecipe(a.speciesId, b.speciesId);
  if (!recipe) return { ok: false, reason: `no recipe for ${a.speciesId} + ${b.speciesId}` };
  const species = speciesById(recipe.result);
  if (!species) return { ok: false, reason: `recipe result ${recipe.result} is not a species` };

  const pick = <T>(x: T, y: T): T => (rng() < 0.5 ? x : y);
  const traits = {
    colorIndex: pick(a.traits.colorIndex, b.traits.colorIndex),
    size: pick(a.traits.size, b.traits.size),
    affinity: pick(a.traits.affinity, b.traits.affinity),
  };

  const leans = combinedLean(a.lean, b.lean);
  const dominant = leans.reduce((best, cur) => (cur.count > best.count ? cur : best), leans[0]);
  const mutated = rng() < mutationChance(dominant.count);
  if (mutated) {
    traits.affinity =
      dominant.count > 0
        ? dominant.element
        : MUTABLE_AFFINITIES[Math.floor(rng() * MUTABLE_AFFINITIES.length)];
  }

  const child: Slime = { id: `slime-${state.nextId}`, speciesId: species.id, traits, lean: {} };
  return {
    ok: true,
    child,
    mutated,
    state: {
      ...state,
      pen: [...state.pen.filter((s) => s.id !== a.id && s.id !== b.id), child],
      collection: discover(state.collection, species.id),
      actionCount: state.actionCount + 1,
      nextId: state.nextId + 1,
    },
  };
}
