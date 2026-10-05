# Slime Coin: make the pocket-coin shop buttons work and show the real prices (Size S)

**Depends on:** none. **Why now:** found while preparing the Slime Coin directives on 2026-10-04 (Robert's standing rule: a bug found is fixed or routed with a fix brief in the same pass). Fits DIRECTION.md's verdict ("its Lua fails silently ... more tests beat more features").

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/slime_coin/components/ShopModal.tsx` (whole file), `ts/src/games/slime_coin/App.tsx` (lines 380-400), `games/slime_coin/logic.lua` (lines 341-372: `shop_purchase`), `ts/tests/test_slime_coin_exchange.ts` (lines 1-40: how a test grants tokens).

## 1. Why this exists

Between rounds the shop offers four buttons. The Lua is `shop_purchase(item_type, item_id)` with `item_type` one of `pocket_coin`, `hand_upgrade`, `card`. The screen calls `call('shop_purchase', itemId)` with only the button id, so three of the four buttons send a wrong type:

Measured on origin/main `d3084de0` (2026-10-04), real Lua, fresh session:
```
shop_purchase('pocket_boom')            -> {"error":"Unknown item type"}
shop_purchase('hand_upgrade')           -> {"error":"Insufficient tokens"}      (this one is understood)
shop_purchase('pocket_coin', 'boom')    -> {"error":"Insufficient tokens"}      (the correct call)
```
So Blast, Magnet and Echo Slime can never be bought. Worse, `App.tsx` treats any non-null answer as success and writes `result.tokens` (undefined on an error) into the token count. Two more mismatches: the buttons show prices 15, 15, 10 and 25, but the Lua charges 10 for every pocket coin and 20 for Hand +2 (`logic.lua` lines 343-359), so Blast and Magnet look unaffordable when they are not, and Hand +2 charges less than it says. And a successful purchase is never reflected in the screen's pocket-coin counts or hand size, because the screen discards everything but `tokens`.

## 2. Scope

1. New module `<!-- new: ts/src/games/slime_coin/shopItems.ts -->`: the item list (Lua prices) and a `buyShopItem` that maps a button to the right Lua call and reports success only when Lua does.
2. `ts/src/games/slime_coin/components/ShopModal.tsx`: use the shared list.
3. `ts/src/games/slime_coin/App.tsx`: use `buyShopItem`, and keep pocket coins and hand size in sync.
4. New test `<!-- new: ts/tests/test_slime_coin_shop.ts -->`.

## 3. The work

**Step 1: create `ts/src/games/slime_coin/shopItems.ts`:**

```ts
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
```

**Step 2: apply this diff** to `ShopModal.tsx` and `App.tsx` (the Edit tool keeps line endings; nothing else changes):

```diff
diff --git a/ts/src/games/slime_coin/App.tsx b/ts/src/games/slime_coin/App.tsx
index 20ee3749..d2118a4b 100644
--- a/ts/src/games/slime_coin/App.tsx
+++ b/ts/src/games/slime_coin/App.tsx
@@ -19,2 +19,3 @@ import PocketPicker from './components/PocketPicker';
 import CoinPrimer from './components/CoinPrimer';
+import { buyShopItem } from './shopItems';
 import './styles.css';
@@ -386,6 +387,11 @@ export default function App({ session }: GameRendererProps) {
           onPurchase={(itemId) => {
-            const result = call('shop_purchase', itemId) as { tokens: number } | null;
-            if (result) {
+            const result = buyShopItem(call, itemId);
+            if (result.ok) {
               sound.playExchange();
-              setState(prev => prev ? { ...prev, tokens: result.tokens } : prev);
+              setState(prev => prev ? {
+                ...prev,
+                tokens: result.tokens,
+                pocket_coins: result.pocketCoins ?? prev.pocket_coins,
+                max_hand_in: result.maxHandIn ?? prev.max_hand_in,
+              } : prev);
             }
diff --git a/ts/src/games/slime_coin/components/ShopModal.tsx b/ts/src/games/slime_coin/components/ShopModal.tsx
index 4d386634..ab218a38 100644
--- a/ts/src/games/slime_coin/components/ShopModal.tsx
+++ b/ts/src/games/slime_coin/components/ShopModal.tsx
@@ -1,3 +1,4 @@
 import { Modal } from '../../../ui/components';
-import type { ChipCard, ShopItem } from '../types';
+import type { ChipCard } from '../types';
+import { SHOP_ITEMS } from '../shopItems';
 
@@ -13,9 +14,2 @@ export default function ShopModal({
 }: ShopModalProps) {
-  const shopItems: ShopItem[] = [
-    { id: 'pocket_boom',    name: 'Blast Slime',   description: '+1 pocket coin',   cost: 15, item_type: 'pocket_coin' },
-    { id: 'pocket_pull',    name: 'Magnet Slime',  description: '+1 pocket coin',   cost: 15, item_type: 'pocket_coin' },
-    { id: 'pocket_echo',    name: 'Echo Slime',    description: '+1 pocket coin',   cost: 10, item_type: 'pocket_coin' },
-    { id: 'hand_upgrade',   name: 'Hand +2',       description: '+2 max hand size', cost: 25, item_type: 'hand_upgrade' },
-  ];
-
   return (
@@ -51,3 +45,3 @@ export default function ShopModal({
         <div className="shop-items">
-          {shopItems.map(item => (
+          {SHOP_ITEMS.map(item => (
             <button
```

**Step 3: create `ts/tests/test_slime_coin_shop.ts`:**

```ts
// new: ts/tests/test_slime_coin_shop.ts
/**
 * Slime Coin shop. The screen's buttons are named pocket_boom / pocket_pull / pocket_echo /
 * hand_upgrade, but the Lua takes shop_purchase(item_type, item_id). Before this fix the pocket
 * buttons sent the button name as the type, so Lua answered "Unknown item type" every time and
 * the screen then wrote an undefined token count. These tests run the real Lua with tokens
 * granted through a `test_set_tokens` helper appended at load time (same trick as
 * test_slime_coin_exchange.ts).
 */
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { LuaExecutor } from '../src/engine/executor';
import type { GameSession } from '../src/engine/types';
import { SHOP_ITEMS, buyShopItem } from '../src/games/slime_coin/shopItems';

function sessionWithTokens(tokens: number): GameSession {
  const base = loadGame('slime_coin', 42);
  const executor = new LuaExecutor(
    base.files.logic + '\nfunction test_set_tokens(n) GAME_STATE.tokens = n end',
    42,
    base.files.engineSource,
  );
  const session: GameSession = { ...base, executor };
  call(session, 'init_game', {});
  call(session, 'test_set_tokens', tokens);
  return session;
}

const bound = (session: GameSession) => (fn: string, ...args: unknown[]) => call(session, fn, ...args)[0];

describe('buyShopItem with a stubbed Lua', () => {
  it('sends pocket coins as (pocket_coin, coin id) and hand upgrades as (hand_upgrade)', () => {
    const calls: unknown[][] = [];
    const stub = (fn: string, ...args: unknown[]) => {
      calls.push([fn, ...args]);
      return { success: true, tokens: 5 };
    };
    buyShopItem(stub, 'pocket_pull');
    buyShopItem(stub, 'hand_upgrade');
    expect(calls).toEqual([
      ['shop_purchase', 'pocket_coin', 'pull'],
      ['shop_purchase', 'hand_upgrade'],
    ]);
  });

  it('reports success only when Lua says so, and passes the new numbers through', () => {
    const ok = buyShopItem(() => ({ success: true, tokens: 7, pocket_coins: { boom: 2 }, max_hand_in: 12 }), 'pocket_boom');
    expect(ok).toEqual({ ok: true, tokens: 7, pocketCoins: { boom: 2 }, maxHandIn: 12 });
    expect(buyShopItem(() => ({ error: 'Insufficient tokens' }), 'pocket_boom')).toEqual({ ok: false, error: 'Insufficient tokens' });
    expect(buyShopItem(() => null, 'pocket_boom')).toEqual({ ok: false, error: 'Purchase failed' });
    expect(buyShopItem(() => ({ success: true }), 'pocket_boom').ok).toBe(false);
    expect(buyShopItem(() => ({ success: true, tokens: 1 }), 'nope')).toEqual({ ok: false, error: 'Unknown item' });
  });
});

describe('the shop against the real Lua', () => {
  it('no shop button is answered with "Unknown item type"', () => {
    const session = sessionWithTokens(0);
    for (const item of SHOP_ITEMS) {
      expect(buyShopItem(bound(session), item.id)).toEqual({ ok: false, error: 'Insufficient tokens' });
    }
  });

  it('each button costs what its label says: refused one token short, bought at the exact price', () => {
    for (const item of SHOP_ITEMS) {
      const short = sessionWithTokens(item.cost - 1);
      expect(buyShopItem(bound(short), item.id).ok, `${item.id} one short`).toBe(false);
      const exact = sessionWithTokens(item.cost);
      const result = buyShopItem(bound(exact), item.id);
      expect(result.ok, `${item.id} exact`).toBe(true);
      if (result.ok) expect(result.tokens).toBe(0);
    }
  });

  it('a pocket coin purchase adds one coin of that type', () => {
    const session = sessionWithTokens(30);
    const result = buyShopItem(bound(session), 'pocket_boom');
    expect(result.ok && result.pocketCoins?.boom).toBe(2);
    expect(result.ok && result.tokens).toBe(20);
  });
});
```

## 4. What NOT to do

- Do not change the Lua. The Lua prices are the rule; the screen follows. If you believe a price is wrong, say so in the Report.
- Do not add chips or cards to the shop (the `card` branch of the Lua stays unused by this screen), and do not touch `types.ts` (its old `ShopItem` interface may stay unused).
- No new dependencies, no deploys, no builds, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_slime_coin
```
Real tail: `Test Files  4 passed (4)` / `Tests  22 passed (22)`.

After editing, same command. Expected (verified on the prototype): `Test Files  5 passed (5)` / `Tests  27 passed (27)` (5 new). If the blurb directive or the sweep directive merged first, add their new tests; nothing may fail.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`).

Note: the new test file cannot show a "fails before" run on its own (it imports the new module); the bug evidence is the measured Lua output in section 1. Clicking the buttons in a browser is the controller's step after merge (Controller finish).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`) and `cd ts && npx tsc --noEmit`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files marked CRLF keep CRLF (the Edit tool preserves it). New files may use either; use CRLF to match.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The new module, the test and the two edits exist exactly as specified.
- [ ] `cd ts && npx vitest run test_slime_coin` passes with 5 new tests (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the four files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files and the counts. Evidence second: real tails. Controller finish: play to the first shop with at least 10 tokens, buy a Blast Slime, confirm the token count drops by 10 and the pocket-coin picker shows one more Blast (screenshot at 1280 and 390 px). Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-slime-coin-shop-purchase-fix-directive |
| Base branch | - |
| Base commit | c274dc81f292296dcbed4549bdd58fb967b764e9 |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
- 2026-10-04 19:00 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions (demo_lists_snapshot.json) and a gitignored generated file (game-metadata.json), verified by hand
- 2026-10-05 00:19 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slime-coin-shop-purchase-fix-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 00:20 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slime-coin-shop-purchase-fix-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
