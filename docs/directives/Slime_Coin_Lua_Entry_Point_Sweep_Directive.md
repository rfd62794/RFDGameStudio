# Slime Coin: sweep every Lua entry point once under the shipped runtime (Size S)

**Depends on:** none. **Why Slime Coin:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `slime_coin` (Replan item 1).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/slime_coin/DIRECTION.md` (Replan 1), `ts/tests/test_slime_coin_bridge.ts` and `ts/tests/test_slime_coin_exchange.ts` (the existing patterns), `games/slime_coin/logic.lua` (lines 256-375 and 857-905: the entry points).

## 1. Why this exists

Slime Coin's logic is Lua run by fengari, which is Lua 5.3. On 2026-10-04 `exchange()` called `math.pow`, which is nil in 5.3, so the Exchange button silently did nothing in a live demo (fixed in `Slime_Coin_Exchange_Lua_Fix_Directive`). The existing tests cover init, round end, card select, exchange and the shop's error branches, but never fire a coin: the whole physics path (`fire_coin`, shelf and floor physics, landing effects, scoring) runs only in a browser. Another 5.3 incompatibility there would ship unseen.
Measured on origin/main `d3084de0`: one `tick_game` call with coins on the board costs about 0.17 seconds in this runtime (200 ticks took 34 seconds), so a full 15-round headless run is too slow for a test; the sweep below uses about 60 physics ticks (12 seconds measured).

## 2. Scope

1. New test `<!-- new: ts/tests/test_slime_coin_lua_sweep.ts -->` and nothing else.

## 3. The work

**Create `ts/tests/test_slime_coin_lua_sweep.ts`** with exactly this content:

```ts
// new: ts/tests/test_slime_coin_lua_sweep.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';

/**
 * Sweep: every Lua entry point the game uses, called at least once under the shipped
 * (fengari, Lua 5.3) runtime. This is the check that would have caught the `math.pow` bug
 * (nil in Lua 5.3) in exchange(). Physics runs are short on purpose: one tick costs about
 * 0.15 seconds in this runtime.
 */

type Row = Record<string, unknown>;

function lua(session: GameSession, fn: string, ...args: unknown[]): Row {
  return (call(session, fn, ...args) as Row[])[0];
}

function finiteNumbers(row: Row): void {
  for (const key of ['score', 'target_score', 'tokens', 'hand_in']) {
    if (typeof row[key] === 'number') expect(Number.isFinite(row[key])).toBe(true);
  }
}

describe('Slime Coin Lua entry-point sweep', () => {
  it('firing and physics: basic coins, then each pocket coin, then the round ends', () => {
    const session = loadGame('slime_coin', 11);
    expect(lua(session, 'init_game', {}).success).toBe(true);
    let last: Row = {};
    for (let i = 0; i < 40; i++) {
      last = lua(session, 'tick_game', 0.016, { fire: i % 4 === 0, side: i % 8 === 0 ? 'left' : 'right' });
      expect(last.phase).toBe('playing');
      finiteNumbers(last);
    }
    for (const pocket of ['boom', 'pull', 'echo', 'giga']) {
      last = lua(session, 'tick_game', 0.016, { fire: true, side: 'right', pocket_coin_type: pocket });
      finiteNumbers(last);
    }
    for (let i = 0; i < 20; i++) {
      last = lua(session, 'tick_game', 0.016, {});
      finiteNumbers(last);
    }
    expect(last.score as number).toBeGreaterThanOrEqual(0);
    const ended = lua(session, 'end_round');
    expect((ended.offered_cards as unknown[]).length).toBe(3);
    expect(lua(session, 'get_state_summary').phase).toBe('card_select');
  }, 120000);

  it('every chip card can be selected, and the run reaches its end', () => {
    const session = loadGame('slime_coin', 12);
    lua(session, 'init_game', {});
    const cards = ['zombie_slime', 'crystal_burst', 'heavy_impact', 'bubble_chain', 'tar_cluster', 'iron_path'];
    for (const id of cards) {
      lua(session, 'end_round');
      expect(lua(session, 'select_card', id).card_id).toBe(id);
    }
    expect(lua(session, 'get_state_summary').owned_chips).toEqual(cards);
  });

  it('exchange and shop_purchase answer in every branch without a Lua error', () => {
    const session = loadGame('slime_coin', 13);
    lua(session, 'init_game', {});
    expect(lua(session, 'exchange').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'hand_upgrade').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'pocket_coin', 'boom').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'card', 'heavy_impact').error).toBe('Insufficient tokens');
    expect(lua(session, 'shop_purchase', 'nonsense').error).toBe('Unknown item type');
  });
});
```

## 4. What NOT to do

- Change nothing under `ts/src/` or `games/` (no Lua fixes). If a call throws a Lua error (a 5.3 incompatibility), STOP: do not fix it and do not weaken the test; write the function name and the exact error text in the Status row and the Report.
- Do not raise the tick counts (time) or add a full-run test. No snapshot files, no new dependencies.
- Do not edit the other `test_slime_coin_*` files, protected repos, `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`. No deploys.

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

After editing, same command. Expected (verified on the prototype): `Test Files  5 passed (5)` / `Tests  25 passed (25)`; the new file takes about 12 to 20 seconds.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

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

- [ ] `ts/tests/test_slime_coin_lua_sweep.ts` exists as above; `cd ts && npx vitest run test_slime_coin` passes with 5 files / 25 tests (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` is clean (real tail pasted); `git status` shows only the one new file.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the file and the counts, and any Lua error found (function, text). Say plainly what the sweep does NOT reach: the shop's success branches (tokens cannot be set without a test helper; see `Slime_Coin_Shop_Purchase_Fix_Directive`, which covers them) and a full 15-round run. Evidence second: real tails. Recommended action: review, merge.

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
| Status | Done |
| Assigned to | devin |
| Branch | directive/queue-sync4 |
| Base branch | - |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: already merged on main via PR #163 (689225d3); row sync only, no code change
- 2026-10-04 20:58 · robert-claude-laptop · Review → Done
<!-- queue:end -->
