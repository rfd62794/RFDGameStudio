// new: ts/src/games/slimeworld/ranch/model/state.ts
import type { RanchState } from './types';

/** A fresh ranch: empty pen, empty pockets, nothing discovered, no sales. */
export function newRanchState(): RanchState {
  return {
    pen: [],
    fruit: {},
    plorts: {},
    collection: [],
    plortCredit: 0,
    actionCount: 0,
    sales: [],
    nextId: 1,
  };
}

/** Add fruit to the basket (the Foraging trip, a later step, will call this). Returns a new state. */
export function addFruit(state: RanchState, fruitId: string, count: number): RanchState {
  if (count <= 0) return state;
  return { ...state, fruit: { ...state.fruit, [fruitId]: (state.fruit[fruitId] ?? 0) + count } };
}
