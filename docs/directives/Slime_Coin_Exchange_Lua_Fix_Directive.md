# Slime Coin: fix the Exchange button (math.pow is nil under Lua 5.3) and test it

## Read first

`games/slime_coin/logic.lua` (lines 310-340 only; the file is about 900 lines), `ts/tests/test_slime_coin_bridge.ts`
(all of it, about 115 lines: the setup to mirror), `ts/src/engine/runtime.ts` (lines 1-13: `loadGame`, `call`),
`ts/src/engine/executor.ts` (lines 24-40: the `LuaExecutor` constructor), `ts/src/games/slime_coin/App.tsx`
(lines 353-376 only: the Exchange button). Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

In-game Exchange (spend tokens for 5 more shots) silently does nothing. `games/slime_coin/logic.lua` line 319:

```lua
  local base_cost = 5
  local cost_growth = 1.5
  local cost = math.floor(base_cost * math.pow(cost_growth, GAME_STATE.exchanges_used))
```

`math.pow` does not exist in Lua 5.3 (the version the engine's fengari runs); it is `nil`, so `exchange()` raises
a Lua error. Reproduced against origin/main `77fdba94d78ca1f5b00b360e7329ce845fe130ca` with the real engine:

```
LuaError: Lua error in exchange: [string "-- engine/primitives/action.lua..."]:552: attempt to call a nil value (field 'pow')
```

(The reported line number is into the engine prelude plus `logic.lua`, not `logic.lua` alone.) The UI calls it from
`ts/src/games/slime_coin/App.tsx` line 358 (`const result = call('exchange') as { tokens: number; hand_in: number } | null;`
behind the `btn-exchange` button at lines 353-376, shown when
`state.phase === 'playing' && state.hand_in === 0 && state.exchanges_used < 3`), so the player sees nothing happen.

Two adjacent findings are NOT in scope and are not to be fixed here; put them in the report for the reviewer.
(i) The button label hard-codes the costs (`App.tsx` lines 370-372: `[5, 8, 12][state.exchanges_used ?? 0] ?? 12`) while
the Lua charges 5, 7, 11, so the label will read 8 and 12 for the second and third exchange but charge 7 and 11.
(ii) The `onClick` (lines 358-367) treats any returned table as success (`if (result)`), so an `{error = ...}`
result (insufficient tokens) would still play the sound and overwrite `tokens`/`hand_in` with `undefined`.
The existing bridge test file says so itself, in its header (lines 9-11 of `ts/tests/test_slime_coin_bridge.ts`):
"`exchange()` is deliberately not tested: it calls `math.pow`, which is nil under Lua 5.3 (known defect, reported to
Robert — not fixed here)."

Verified fix (applied and run on a scratch copy before writing this directive): with line 319 changed to
`local cost = math.floor(base_cost * cost_growth ^ GAME_STATE.exchanges_used)` three exchanges succeed and the
fourth returns `{error = 'Max exchanges reached this round'}`. Costs by hand: `floor(5*1.5^0)=5`,
`floor(5*1.5^1)=floor(7.5)=7`, `floor(5*1.5^2)=floor(11.25)=11`.

## 2. Scope

In scope, exactly these files: `games/slime_coin/logic.lua` (ONE line, 319) and the new test
`ts/tests/test_slime_coin_exchange.ts` <!-- new: ts/tests/test_slime_coin_exchange.ts -->. Out of scope: every
other line of `logic.lua`, the shop and chip rules, tuning (the 5 / 1.5 / 3-exchange numbers stay as they are),
`App.tsx`, and `ts/tests/test_slime_coin_bridge.ts` (its stale header comment is the reviewer's to update after
this merges; do not edit it).

There is no Lua snapshot or golden for slime_coin to update (verified: the only tracked Lua file for the game is
`games/slime_coin/logic.lua`; no `*.snap` files exist in the repo). If a grep for `slime_coin` in test fixtures
turns up a stored hash or copy of `logic.lua`, report it and do not edit it.

## 3. The work

1. `games/slime_coin/logic.lua`, line 319 only. Change it to exactly:

```lua
  local cost = math.floor(base_cost * cost_growth ^ GAME_STATE.exchanges_used)
```

   (`^` is the Lua power operator and yields a float; `math.floor` keeps the integer cost.) Same indentation (two
   spaces), same line count.
2. New test `ts/tests/test_slime_coin_exchange.ts` <!-- new: ts/tests/test_slime_coin_exchange.ts -->, mirroring
   the setup of `test_slime_coin_bridge.ts`: `import { describe, it, expect } from 'vitest'`,
   `import { loadGame, call } from '../src/engine/runtime'`, `import { LuaExecutor } from '../src/engine/executor'`,
   `import type { GameSession } from '../src/engine/types'`. Header comment: what it guards (Exchange works and its
   cost grows by x1.5 per use) and why a token grant is injected.

   Tokens start at 0 and `init_game` resets them (`GAME_STATE.tokens = 0`, logic.lua line 187), and earning tokens
   by playing coins into the vat is not deterministic enough for a unit test. So build the session like this and
   do NOT edit `logic.lua` for it:

```ts
function sessionWithTokens(tokens: number): GameSession {
  const base = loadGame('slime_coin', 42);
  const executor = new LuaExecutor(
    base.files.logic + '\nfunction test_set_tokens(n) GAME_STATE.tokens = n end',
    42,
    base.files.engineSource,
  );
  const session: GameSession = { ...base, executor };
  const [init] = call(session, 'init_game', {}) as Array<Record<string, unknown>>;
  expect(init.success).toBe(true);
  call(session, 'test_set_tokens', tokens);
  return session;
}
```

   (Run this shape once before relying on it: it was verified to load and to call `exchange` on origin/main.
   `GAME_STATE` is a global in `logic.lua`, line 6, so the injected function can reach it.)
   Tests (each a fresh `sessionWithTokens`; `call` returns an ARRAY whose first element is the result table):
   - a. With 100 tokens, three successive `call(session, 'exchange')` return `success === true` with `cost` 5, 7
     and 11 in that order, `shots_added === 5`, `exchanges_used` 1, 2, 3, and `tokens` 95, 88, 77.
   - b. `hand_in` rises by 5 per exchange: it starts at 10 (the bridge test asserts this for a fresh session), so the
     three results report 15, 20, 25.
   - c. The fourth call returns `error === 'Max exchanges reached this round'` and changes nothing
     (`get_state_summary` is unchanged in `hand_in`; use `call(session, 'get_state_summary')`).
   - d. With 4 tokens the first call returns `error === 'Insufficient tokens'` and `exchanges_used` stays 0; with
     exactly 5 tokens it succeeds and leaves `tokens === 0`.
   - e. A cost-growth check expressed from the formula rather than hard-coded: for `n` in 0..2 the reported `cost`
     equals `Math.floor(5 * Math.pow(1.5, n))` computed in TypeScript.
   If any observed value differs from the numbers above, assert what the code does and say so in the report.

## 4. What NOT to do

- Do not change the exchange tuning, add a cap, or touch any other `math.` call or any line other than 319.
- Do not edit `ts/tests/test_slime_coin_bridge.ts`, `App.tsx`, or the engine (`ts/src/engine/*`).
- Do not "fix" it by defining `math.pow` in the engine or in the test: the game logic itself must use `^`.
- Do not skip the fix and ship only the test.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_slime_coin_exchange.ts test_slime_coin_bridge.ts
```

Reference, run when this directive was written: `uv run python --version` gave `Python 3.12.12`; the harness-proof
command `cd ts && npx vitest run test_arcade_manifest.ts test_voiddrift_redux_chrome.ts` gave `Test Files  2 passed (2)`
and `Tests  14 passed (14)`. Run that proof command once first and paste its real tail, to confirm the form works in
your worktree. The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here;
`ts/tests/...` paths find none. Before the fix, test a. must fail with the `field 'pow'` error; if you can see that
(write the test first, run it, then fix line 319), paste that failure line too. The existing 8 bridge tests must
still pass, so the two-file run ends at 8 + your new tests. The full suite is a reviewer-side step.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects. The only allowed
  exceptions are the fixed `cd ts && npx vitest run ...` and `cd ts && npx tsc --noEmit -p .` lines in
  section 5. Do not use `ls`, `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or
  web tool beyond the Read, Glob and Grep tools inside the worktree. Do not hunt: everything you need is
  quoted in this directive; if a quoted line or a cited path is not where it says, STOP and write why in
  the Status row.
- Work only on branch `directive/rfdgamestudio-slime-coin-exchange-lua-fix-directive`. Never commit to main, never push, never deploy.
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

- [ ] `games/slime_coin/logic.lua` line 319 reads exactly the line in section 3 and no other line of the file
      changed (`git diff` shows a one-line change).
- [ ] The new test file asserts costs 5, 7, 11, the 4th-call limit, the insufficient-tokens path, and passes
      together with `test_slime_coin_bridge.ts`.
- [ ] `git status` shows exactly two files changed or created: `games/slime_coin/logic.lua` and
      `ts/tests/test_slime_coin_exchange.ts`.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass
      counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: the one-line fix and what the test proved (quote the before-fix `pow` failure if you saw it).
Then evidence: the real output tails of the proof command and the two-file vitest run. Then one recommended action
per open item: the stale header comment in `ts/tests/test_slime_coin_bridge.ts` (lines 9-11) should be updated by
the reviewer once this merges; the two App.tsx findings from section 1 (label costs 8 and 12 versus charged 7 and 11;
unchecked `{error}` result) each need their own small directive; a browser click-through of the Exchange button is a reviewer-side step. List
every created file with `<!-- new: path -->`. State that nothing was deployed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching
  anything; editing `.gitignore` or any `dist`/`dist-*` directory; changing gameplay, rules, balance or art
  beyond what this directive names; touching any demo other than the one named in this directive; running
  `agentflow` commands or `uv run python -m studio.demos index`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-slime-coin-exchange-lua-fix-directive |
| Base branch | - |
| Base commit | 77fdba94d78ca1f5b00b360e7329ce845fe130ca |
| Head commit | - |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 · robert-claude-laptop · none → Queued — wave-1 review follow-up: Exchange calls math.pow (nil in Lua 5.3), fix one line and add the missing exchange test
<!-- queue:end -->
