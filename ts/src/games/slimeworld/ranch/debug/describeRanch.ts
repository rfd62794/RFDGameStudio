// new: ts/src/games/slimeworld/ranch/debug/describeRanch.ts
import { ALL_SPECIES, speciesById } from '../data/species';
import { plortPrice } from '../model/market';
import type { RanchState } from '../model/types';

/**
 * The debug harness for step 1: a plain-text dump of a ranch, one line per fact. No React, no DOM.
 * Tests and a human at a console use it to see what the rules did; real screens come in later steps.
 */
export function describeRanch(state: RanchState): string[] {
  const lines: string[] = [];
  lines.push(`actions ${state.actionCount}, plortCredit ${state.plortCredit}`);
  lines.push(`collection ${state.collection.length}/${ALL_SPECIES.length}`);
  for (const slime of state.pen) {
    const name = speciesById(slime.speciesId)?.name ?? slime.speciesId;
    lines.push(
      `pen ${slime.id} ${name} size ${slime.traits.size} affinity ${slime.traits.affinity} color ${slime.traits.colorIndex}`
    );
  }
  for (const [speciesId, count] of Object.entries(state.plorts)) {
    if (count > 0) lines.push(`plort ${speciesId} x${count} at ${plortPrice(state, speciesId)} each`);
  }
  for (const [fruitId, count] of Object.entries(state.fruit)) {
    if (count > 0) lines.push(`fruit ${fruitId} x${count}`);
  }
  return lines;
}
