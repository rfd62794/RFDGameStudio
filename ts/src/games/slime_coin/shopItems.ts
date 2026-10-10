// new: ts/src/games/slime_coin/shopItems.ts
/**
 * The end-of-round shop. Prices and item kinds mirror `shop_purchase(item_type, item_id)` in
 * games/slime_coin/logic.lua (pocket coin 10 tokens, hand upgrade 20 tokens, card 15 tokens):
 * the Lua is the rule, this list is only what the screen shows.
 */
export interface ShopItemDef {
  /** Button id used by the screen. */
  id: string;
  name: string;
  description: string;
  cost: number;
  /** First argument of the Lua `shop_purchase`. */
  itemType: 'pocket_coin' | 'hand_upgrade' | 'card';
  /** Second argument of the Lua `shop_purchase` (pocket coin id), if any. */
  itemId?: string;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  { id: 'pocket_boom', name: 'Blast Slime', description: '+1 pocket coin', cost: 10, itemType: 'pocket_coin', itemId: 'boom' },
  { id: 'pocket_pull', name: 'Magnet Slime', description: '+1 pocket coin', cost: 10, itemType: 'pocket_coin', itemId: 'pull' },
  { id: 'pocket_echo', name: 'Echo Slime', description: '+1 pocket coin', cost: 10, itemType: 'pocket_coin', itemId: 'echo' },
  { id: 'hand_upgrade', name: 'Hand +2', description: '+2 max hand size', cost: 20, itemType: 'hand_upgrade' },
];

export type LuaCall = (fnName: string, ...args: unknown[]) => unknown;

export type PurchaseResult =
  | { ok: true; tokens: number; pocketCoins?: Record<string, number>; maxHandIn?: number }
  | { ok: false; error: string };

/** Buys one shop item through Lua. Never reports success unless Lua said so. */
export function buyShopItem(call: LuaCall, id: string): PurchaseResult {
  const item = SHOP_ITEMS.find((i) => i.id === id);
  if (!item) return { ok: false, error: 'Unknown item' };
  const args: unknown[] = item.itemId ? [item.itemType, item.itemId] : [item.itemType];
  const result = call('shop_purchase', ...args) as {
    success?: boolean;
    tokens?: number;
    error?: string;
    pocket_coins?: Record<string, number>;
    max_hand_in?: number;
  } | null;
  if (result && result.success === true && typeof result.tokens === 'number') {
    return { ok: true, tokens: result.tokens, pocketCoins: result.pocket_coins, maxHandIn: result.max_hand_in };
  }
  return { ok: false, error: result?.error ?? 'Purchase failed' };
}
