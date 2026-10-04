# Slime Coin: make the Exchange button's cost, counter and error handling match the Lua

## Read first

`ts/src/games/slime_coin/App.tsx` (lines 1-19 imports, 353-376 the Exchange button; the file is 425 lines),
`games/slime_coin/logic.lua` (lines 310-340 only: `exchange()`, READ ONLY), `ts/tests/test_slime_coin_exchange.ts`
(all of it, about 90 lines: the session setup and the `call` pattern to mirror), `ts/tests/test_slime_coin_bridge.ts`
(lines 1-14 only: the header comment). `ts/src/hooks/useLuaCall.ts` is quoted in section 1; do not open it.
Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

PR #106 fixed the Lua `exchange()` (`games/slime_coin/logic.lua` lines 311-339): limit `exchanges_used >= 3`,
base cost 5, growth 1.5, `local cost = math.floor(base_cost * cost_growth ^ GAME_STATE.exchanges_used)`, so it charges
5, 7, 11. An independent review found the UI in `ts/src/games/slime_coin/App.tsx` is wrong in three ways. The
current lines (origin/main `84959165`), lines 353-376:

```tsx
      {state.phase === 'playing' && state.hand_in === 0 && state.exchanges_used < 3 && (
        <div className="sc-exchange">
          <button
            className="btn-exchange"
            onClick={() => {
              const result = call('exchange') as { tokens: number; hand_in: number } | null;
              if (result) {
                sound.playExchange();
                setState(prev => prev ? {
                  ...prev,
                  tokens: result.tokens,
                  hand_in: result.hand_in,
                  exchanges_used: (prev.exchanges_used ?? 0) + 1,
                } : prev);
              }
            }}
          >
            Exchange ({state.exchanges_used ?? 0}/3) — Cost: {
              [5, 8, 12][state.exchanges_used ?? 0] ?? 12
            } tokens
          </button>
        </div>
      )}
```

1. Label (lines 370-372): the hard-coded table `[5, 8, 12]` shows 8 and 12 for the second and third exchange; the
   Lua charges 7 and 11.
2. Error shape (lines 358-359): `call('exchange')` returns the first Lua result table, or `null` when the Lua call
   raised (`useLuaCall` in `ts/src/hooks/useLuaCall.ts`: `return results[0] ?? null;` inside a `try`, `catch` sets
   an error string and returns `null`). A refused exchange returns a table `{error = 'Insufficient tokens'}` or
   `{error = 'Max exchanges reached this round'}`; `if (result)` treats that as success, plays the sound and writes
   `undefined` into `tokens` and `hand_in`.
3. Optimistic counter (line 365): `exchanges_used: (prev.exchanges_used ?? 0) + 1` increments locally instead of
   taking the authoritative value. A successful Lua result is
   `{success = true, cost, shots_added = 5, hand_in, tokens, exchanges_used}` (logic.lua lines 330-337), so
   `result.exchanges_used` is available.

The Lua does NOT expose the next exchange cost: `get_state_summary()` (logic.lua line 906) carries
`exchanges_used` only (verified: the only `cost` for exchange is the local inside `exchange()` and the returned
table). Editing the Lua is out of scope, so the UI computes the cost with the same formula in a tiny pure helper, and
a test pins the helper to the real Lua so the two cannot drift silently.

Also stale: the header comment of `ts/tests/test_slime_coin_bridge.ts`, lines 10-11:

```
 * `exchange()` is deliberately not tested: it calls `math.pow`, which is nil
 * under Lua 5.3 (known defect, reported to Robert — not fixed here).
```

It is no longer true; `ts/tests/test_slime_coin_exchange.ts` covers `exchange()`.

## 2. Scope

In scope, exactly these files:
- `ts/src/games/slime_coin/utils/exchangeCost.ts` <!-- new: ts/src/games/slime_coin/utils/exchangeCost.ts -->
- `ts/tests/test_slime_coin_exchange_cost.ts` <!-- new: ts/tests/test_slime_coin_exchange_cost.ts -->
- `ts/src/games/slime_coin/App.tsx` (the import block, the Exchange `onClick` and the label only; lines 353-376 plus
  one import line)
- `ts/tests/test_slime_coin_bridge.ts` (header comment lines 10-11 only)

Out of scope: `games/slime_coin/*.lua` (any file), the 3-exchange limit and the `< 3` / `/3` literals, the tuning
numbers, the `tick` handler's `exchanges_used` sync (App.tsx line 131), `styles.css`, `types.ts`, and any new UI state.

## 3. The work

1. New `ts/src/games/slime_coin/utils/exchangeCost.ts` <!-- new: ts/src/games/slime_coin/utils/exchangeCost.ts -->.
   One job: the exchange cost formula. Header comment in the style of `ts/src/games/slime_coin/utils/bestScore.ts` (a `//` line naming the
   file, a note that it mirrors `exchange()` in `games/slime_coin/logic.lua` and that
   `ts/tests/test_slime_coin_exchange_cost.ts` pins it to the Lua). Contents:

```ts
export const EXCHANGE_BASE_COST = 5;
export const EXCHANGE_COST_GROWTH = 1.5;

/** Token cost of the next exchange when `exchangesUsed` have been made this round. */
export function exchangeCost(exchangesUsed: number): number {
  return Math.floor(EXCHANGE_BASE_COST * EXCHANGE_COST_GROWTH ** exchangesUsed);
}
```

2. `ts/src/games/slime_coin/App.tsx`: add `import { exchangeCost } from './utils/exchangeCost';` directly after the
   existing line `import { sound } from './utils/sound';`. Replace the `onClick` body and the label so the block reads
   exactly:

```tsx
            onClick={() => {
              const result = call('exchange') as {
                success?: boolean; error?: string;
                tokens: number; hand_in: number; exchanges_used: number;
              } | null;
              if (result?.success) {
                sound.playExchange();
                setState(prev => prev ? {
                  ...prev,
                  tokens: result.tokens,
                  hand_in: result.hand_in,
                  exchanges_used: result.exchanges_used,
                } : prev);
              }
            }}
          >
            Exchange ({state.exchanges_used ?? 0}/3) — Cost: {
              exchangeCost(state.exchanges_used ?? 0)
            } tokens
          </button>
```

   A refused exchange (`{error = ...}`) or a raised Lua error (`null`) changes nothing: no sound, no state update.
   Do NOT add a message state or any new UI element: App.tsx has no inline-message pattern near this button (the
   only error text in the file's neighbours is `useLuaCall`'s `error`, which this component does not render), and a
   refused click is rare because the button already hides at 3 exchanges. App.tsx must grow by no more than about 6
   lines (425 now; it must stay under 600).
3. New `ts/tests/test_slime_coin_exchange_cost.ts` <!-- new: ts/tests/test_slime_coin_exchange_cost.ts -->.
   Header comment: what it guards (the UI cost helper equals the Lua cost, so a change to either side fails here).
   Copy the `sessionWithTokens` helper from `ts/tests/test_slime_coin_exchange.ts` (same imports: `describe, it,
   expect` from `vitest`; `loadGame, call` from `../src/engine/runtime`; `LuaExecutor` from
   `../src/engine/executor`; `type GameSession` from `../src/engine/types`; plus
   `exchangeCost, EXCHANGE_BASE_COST, EXCHANGE_COST_GROWTH` from `../src/games/slime_coin/utils/exchangeCost`). It is
   not exported there; copy it, do not edit that file. Tests (`call` returns an ARRAY; the first element is the table):
   - a. With 100 tokens, for `n` in 0..2: `exchangeCost(n)` equals the `cost` returned by the real
     `call(session, 'exchange')` for exchange number `n` (call it three times in sequence), and the sequence is
     `[5, 7, 11]`.
   - b. `exchangeCost(0)`, `(1)`, `(2)` equal `5`, `7`, `11` directly (pure, no Lua), and the constants are
     `5` and `1.5`.
4. `ts/tests/test_slime_coin_bridge.ts`: replace header lines 10-11 (only) with:

```
 * `exchange()` is covered in ts/tests/test_slime_coin_exchange.ts (and the UI cost
 * helper in ts/tests/test_slime_coin_exchange_cost.ts), not here.
```

   Keep the leading ` * ` and the surrounding blank ` *` lines as they are.

## 4. What NOT to do

- Do not edit any `.lua` file, the exchange tuning, the 3-exchange limit, or `ts/tests/test_slime_coin_exchange.ts`.
- Do not add React state, toasts, messages, CSS or a new component for the error case.
- Do not touch App.tsx outside the import line, the `onClick` and the label; do not refactor the `tick` handler.
- Do not keep a hard-coded cost table anywhere in `App.tsx`; do not read cost from `get_state_summary` (it has none).
- Do not run the full test suite or `tsc` across the repo; the full suite is a reviewer-side step.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_slime_coin_exchange.ts test_slime_coin_bridge.ts
cd ts && npx vitest run test_slime_coin_exchange_cost.ts test_slime_coin_exchange.ts test_slime_coin_bridge.ts
```

Reference, run when this directive was written on main at commit `84959165`: `uv run python --version` gave
`Python 3.12.12`, and the second line gave `Test Files  2 passed (2)` and `Tests  13 passed (13)`. Run that second
line once BEFORE you change anything and paste its tail, to confirm the form works in your worktree. After the work,
the third line must end at 13 plus your new tests (13 + 2 = 15 passed, 3 files). The `cd ts && npx vitest run
<bare-filename>` form is the only form that finds tests here; `ts/tests/...` paths find none. Then use Grep to show:
`App.tsx` has no `[5, 8, 12]` (pattern `8, 12`, zero matches), has exactly one `exchangeCost(` call, and has
`result?.success`.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects. The only allowed
  exceptions are the fixed `cd ts && npx vitest run ...` lines in section 5. Do not use `ls`,
  `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or
  web tool beyond the Read, Glob and Grep tools inside the worktree. Do not hunt: everything you need is
  quoted in this directive; if a quoted line or a cited path is not where it says, STOP and write why in
  the Status row.
- Work only on branch `directive/rfdgamestudio-slime-coin-exchange-ui-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report (and, where the file type allows, in
  a header comment).
- New logic goes in small new modules (one job per file, SOLID/SRP/KISS); no file you create or grow may
  pass 600 lines; edit files that are already over 600 lines in place, same line count.
- Free models only wherever any model configuration is touched (none is expected).
- Do not run `agentflow lint` or any other `agentflow` CLI. Do NOT run `uv run python -m studio.demos index`
  (the sandbox refuses it, and none of the work here changes the demo registry, so none is needed).
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the
  working directory.
- If the pre-push hook (or any hook) fails on a test unrelated to your change, stop and write
  `ready for controller finish` in the Status row; do not bypass the hook.
- Done means (the Status row): you stopped at `Review` after committing on the directive branch, with one
  line in the log giving the test pass counts. You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] `exchangeCost.ts` exists and `exchangeCost(0..2)` is 5, 7, 11; the new test proves it equals the Lua `cost`
      for n = 0..2.
- [ ] `App.tsx`: label uses `exchangeCost(...)`; `onClick` updates state only when `result?.success`; the counter
      is `result.exchanges_used`; no `[5, 8, 12]` remains; file under 600 lines.
- [ ] Bridge test header lines 10-11 replaced as in section 3 item 4 and nothing else in that file changed.
- [ ] `git status` shows exactly four files: the two new ones, `App.tsx`, and `test_slime_coin_bridge.ts`; no
      `.lua` file changed.
- [ ] The third vitest line in section 5 passes (15 tests, 3 files).
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass counts.
      The run does not mark Done and does not merge.

## 8. Report

Findings first: the three UI fixes and what the new test proves. Then evidence: the real output tails of the
before-change and after-change vitest runs and the Grep results. Then one recommended action per open item: a
browser click-through of the Exchange button (insufficient tokens, three exchanges, label text 5 / 7 / 11) is a
reviewer-side step; whether a refused click deserves a visible message is a product call for the reviewer. List every
created file with `<!-- new: path -->`. State that nothing was deployed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching
  anything; editing `.gitignore` or any `dist`/`dist-*` directory; changing gameplay, rules, balance or art
  beyond what this directive names; editing any `.lua` file; touching any demo other than the one named in this
  directive; running `agentflow` commands or `uv run python -m studio.demos index`.

## Required from User

none. Deploying is Robert's.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 · robert-claude-laptop · none → Queued — follow-up from the review of merged PR #106: Exchange button label shows 8/12 vs charged 7/11, error result treated as success, optimistic counter
<!-- queue:end -->
