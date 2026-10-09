// new: ts/src/games/slimeworld/ranch/model/feeding.ts
import { fruitById } from '../data/fruit';
import type { RanchState, RuleResult } from './types';

/**
 * Feed one fruit to a slime in the pen: the fruit is spent, the slime yields exactly one plort of
 * its species (instant, no timer), and the slime leans toward the fruit's element for its next mix.
 * Counts as one Hub action.
 */
export function feedSlime(state: RanchState, slimeId: string, fruitId: string): RuleResult<{ state: RanchState }> {
  const slime = state.pen.find((s) => s.id === slimeId);
  if (!slime) return { ok: false, reason: `no slime ${slimeId} in the pen` };
  const fruit = fruitById(fruitId);
  if (!fruit) return { ok: false, reason: `unknown fruit ${fruitId}` };
  if ((state.fruit[fruitId] ?? 0) < 1) return { ok: false, reason: `no ${fruitId} to feed` };

  const lean = { ...slime.lean, [fruit.element]: (slime.lean[fruit.element] ?? 0) + 1 };
  return {
    ok: true,
    state: {
      ...state,
      fruit: { ...state.fruit, [fruitId]: state.fruit[fruitId] - 1 },
      plorts: { ...state.plorts, [slime.speciesId]: (state.plorts[slime.speciesId] ?? 0) + 1 },
      pen: state.pen.map((s) => (s.id === slimeId ? { ...s, lean } : s)),
      actionCount: state.actionCount + 1,
    },
  };
}
