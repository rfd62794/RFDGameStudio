// new: ts/src/games/slimeworld/ranch/model/slimes.ts
import { PEN_CAPACITY } from '../data/constants';
import { speciesById } from '../data/species';
import type { RanchState, Rng, RuleResult, Slime, SlimeSize } from './types';

const SIZES: readonly SlimeSize[] = ['S', 'M', 'L'];

/** Mark a species as discovered (the collection grid). Pure. */
export function discover(collection: readonly string[], speciesId: string): string[] {
  return collection.includes(speciesId) ? [...collection] : [...collection, speciesId];
}

/** Catch a wild slime into the pen: species defaults for colour and affinity, size from the rng. */
export function catchSlime(state: RanchState, speciesId: string, rng: Rng): RuleResult<{ state: RanchState; slime: Slime }> {
  const species = speciesById(speciesId);
  if (!species) return { ok: false, reason: `unknown species ${speciesId}` };
  if (state.pen.length >= PEN_CAPACITY) return { ok: false, reason: 'pen is full' };
  const slime: Slime = {
    id: `slime-${state.nextId}`,
    speciesId,
    traits: {
      colorIndex: species.colorIndex,
      size: SIZES[Math.floor(rng() * SIZES.length)],
      affinity: species.affinity,
    },
    lean: {},
  };
  return {
    ok: true,
    slime,
    state: {
      ...state,
      pen: [...state.pen, slime],
      collection: discover(state.collection, speciesId),
      nextId: state.nextId + 1,
    },
  };
}
