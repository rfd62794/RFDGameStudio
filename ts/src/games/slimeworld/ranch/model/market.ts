// new: ts/src/games/slimeworld/ranch/model/market.ts
import {
  FLOOD_DECAY_PER_SALE,
  FLOOD_MULTIPLIER_FLOOR,
  FLOOD_WINDOW_ACTIONS,
} from '../data/constants';
import { speciesById } from '../data/species';
import type { RanchState, RuleResult, SaleRecord } from './types';

/** Sales of this species inside the window, counted in Hub actions (never in real time). */
export function recentSales(sales: readonly SaleRecord[], speciesId: string, actionCount: number): number {
  return sales.filter((s) => s.speciesId === speciesId && s.atAction > actionCount - FLOOD_WINDOW_ACTIONS).length;
}

/** Flood multiplier: max(floor, 1 - recent same-type sales x decay). Same formula as the old game's economy. */
export function floodMultiplier(recent: number): number {
  return Math.max(FLOOD_MULTIPLIER_FLOOR, 1 - recent * FLOOD_DECAY_PER_SALE);
}

/** The price of one plort of this species right now, or undefined for an unknown species. */
export function plortPrice(state: RanchState, speciesId: string): number | undefined {
  const species = speciesById(speciesId);
  if (!species) return undefined;
  return Math.floor(species.plortValue * floodMultiplier(recentSales(state.sales, speciesId, state.actionCount)));
}

/**
 * Sell up to `quantity` plorts of one species. Each unit is priced after the sales before it, so
 * dumping many of one type lowers the price within the batch. The whole batch is one Hub action.
 * Proceeds go to plortCredit.
 */
export function sellPlorts(
  state: RanchState,
  speciesId: string,
  quantity: number
): RuleResult<{ state: RanchState; sold: number; earned: number }> {
  if (!speciesById(speciesId)) return { ok: false, reason: `unknown species ${speciesId}` };
  const owned = state.plorts[speciesId] ?? 0;
  const sold = Math.min(owned, Math.floor(quantity));
  if (sold < 1) return { ok: false, reason: `no ${speciesId} plorts to sell` };

  const action = state.actionCount + 1;
  let working: RanchState = { ...state, actionCount: action };
  let earned = 0;
  for (let i = 0; i < sold; i += 1) {
    earned += plortPrice(working, speciesId) ?? 0;
    working = { ...working, sales: [...working.sales, { speciesId, atAction: action }] };
  }
  return {
    ok: true,
    sold,
    earned,
    state: {
      ...working,
      plorts: { ...state.plorts, [speciesId]: owned - sold },
      plortCredit: state.plortCredit + earned,
    },
  };
}
