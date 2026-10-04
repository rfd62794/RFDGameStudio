// exchangeCost.ts — Slime Coin exchange cost formula (UI mirror of the Lua).
// Mirrors exchange() in games/slime_coin/logic.lua (base 5, growth 1.5, floored);
// ts/tests/test_slime_coin_exchange_cost.ts pins it to the real Lua so the two
// cannot drift silently.
// <!-- new: ts/src/games/slime_coin/utils/exchangeCost.ts -->

export const EXCHANGE_BASE_COST = 5;
export const EXCHANGE_COST_GROWTH = 1.5;

/** Token cost of the next exchange when `exchangesUsed` have been made this round. */
export function exchangeCost(exchangesUsed: number): number {
  return Math.floor(EXCHANGE_BASE_COST * EXCHANGE_COST_GROWTH ** exchangesUsed);
}
