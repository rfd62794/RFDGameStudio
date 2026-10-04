# Lua executor: reserve stack space so a big data argument no longer throws "Error: false" (Size S)

**Depends on:** none. **Why now:** found while writing the Dissonance bot-run directive on 2026-10-04 (Robert's standing rule: a bug found is fixed or routed with a fix brief in the same pass). This is the one engine-file change in the Dissonance plan: one added line, one added type line, one test-mock line, and a regression test. It is shared by every Lua-driven game, so the verification below includes the other games' bridge tests.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/engine/executor.ts` (lines 43-100: `call` and `pushValue`), `ts/src/fengari-web.d.ts` (the `LuaApi` interface), `ts/tests/test_executor.ts` (lines 1-35: the fengari mock), `ts/src/games/dissonance/App.tsx` (lines 137-156: the call that fails).

## 1. Why this exists

In Dissonance, winning a fight makes `App.tsx` call the Lua function `generate_fixed_reward` with seven arguments, the sixth being the whole game data table (`session.files.data`, nested 7 levels deep). In the real Lua runtime that call throws before the reward screen can be built.
`useLuaCall` swallows the error and returns `null`, so the app keeps `run.status === 'reward'` while `rewardSlots` stays `null`, and no reward panel renders (`App.tsx`: the reward phase needs both). A player who wins their first fight is looking at a blank panel.

Measured on origin/main `d3084de0` (2026-10-04), calling the real session from vitest with the real data table:

```
loadGame('dissonance', 1); call(session, 'generate_fixed_reward', 40, ['a'], [], [], 'basic', data, null)
-> Error: false      (thrown by luai_apicheck, via lua_pushnumber, from LuaExecutor.pushValue in executor.ts)
the same call with data replaced by {} -> ok
```

Cause: fengari's C API does not grow the Lua stack on its own. The executor pushes each argument and, recursively, each nested table key and value, without ever calling `lua_checkstack`; the default stack has about 20 free slots, and 7 arguments plus a depth-7 table needs more. (`resolve_combat_turn(run, card, data)` has fewer arguments and fits, which is why combat itself works.)

## 2. Scope

1. `ts/src/engine/executor.ts`: one added call in `pushValue`.
2. `ts/src/fengari-web.d.ts`: one added line declaring `lua_checkstack`.
3. `ts/tests/test_executor.ts`: one added line in the fengari mock (the mock has no `lua_checkstack`, so the executor tests would otherwise throw).
4. New test `<!-- new: ts/tests/test_lua_executor_deep_args.ts -->`.

## 3. The work

**Step 1: `ts/src/engine/executor.ts`.** Apply exactly this diff (keep the file's line endings; it adds four lines at the top of `pushValue`):

```diff
diff --git a/ts/src/engine/executor.ts b/ts/src/engine/executor.ts
index b140cf72..9dcaf729 100644
--- a/ts/src/engine/executor.ts
+++ b/ts/src/engine/executor.ts
@@ -68,6 +68,10 @@ export class LuaExecutor {
   }
 
   private pushValue(val: unknown): void {
+    // fengari's C API does not grow the stack by itself: a deeply nested table argument
+    // (for example the whole game data table) overflows the default 20 slots and throws
+    // "Error: false" from lua_pushnumber. Reserve room before every push.
+    lua.lua_checkstack(this.L, 4);
     if (val === null || val === undefined) {
       lua.lua_pushnil(this.L);
     } else if (typeof val === 'boolean') {
```

**Step 2: `ts/src/fengari-web.d.ts`.** The file starts with a byte-order mark and uses LF; keep both. Apply exactly:

```diff
diff --git a/ts/src/fengari-web.d.ts b/ts/src/fengari-web.d.ts
index 088b0a23..e2569530 100644
--- a/ts/src/fengari-web.d.ts
+++ b/ts/src/fengari-web.d.ts
@@ -9,6 +9,7 @@
     LUA_TFUNCTION: number;
     lua_type(L: unknown, idx: number): number;
     lua_gettop(L: unknown): number;
+    lua_checkstack(L: unknown, n: number): number;
     lua_pop(L: unknown, n: number): void;
     lua_pushnil(L: unknown): void;
     lua_pushboolean(L: unknown, b: number): void;
```

**Step 3: `ts/tests/test_executor.ts`.** Add one line to the mock's `lua` object, right after `lua_pop: vi.fn(),`:

```diff
diff --git a/ts/tests/test_executor.ts b/ts/tests/test_executor.ts
index 6e8bc647..7a0f015b 100644
--- a/ts/tests/test_executor.ts
+++ b/ts/tests/test_executor.ts
@@ -10,6 +10,7 @@ vi.mock('fengari-web', () => {
       lua_type: vi.fn(),
       lua_gettop: vi.fn(() => 1),
       lua_pop: vi.fn(),
+      lua_checkstack: vi.fn(() => 1),
       lua_pushnil: vi.fn(),
       lua_pushboolean: vi.fn(),
       lua_pushnumber: vi.fn(),
```

**Step 4: create `ts/tests/test_lua_executor_deep_args.ts`:**

```ts
// new: ts/tests/test_lua_executor_deep_args.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';

/**
 * Regression test: a Lua call with several arguments, one of them the whole game data table
 * (nested 7 levels deep for Dissonance), used to throw "Error: false" from lua_pushnumber
 * because the executor never reserved Lua stack space. In the game, that call is the one that
 * builds the reward screen after a won fight.
 */
describe('LuaExecutor with deeply nested arguments', () => {
  it('generate_fixed_reward accepts the real Dissonance data table as its sixth argument', () => {
    const session = loadGame('dissonance', 1);
    const data = session.files.data as Record<string, unknown>;
    const [slots] = call(session, 'generate_fixed_reward', 40, ['spark_none_sever'], [], [], 'basic', data, null) as Array<
      Array<{ kind: string }>
    >;
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(['heal', 'card', 'benefit', 'relic']).toContain(slot.kind);
    }
  });
});
```

## 4. What NOT to do

- No other change to `executor.ts` (not `call`, not `pullValue`, no error-handling changes, no logging). No change to any `.lua` file, to `loader.ts` or `runtime.ts`.
- Do not change any game's `App.tsx`; the fix is below the games.
- Do not catch or hide the error anywhere: the point is that the call stops failing.
- No new dependencies, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_executor.ts test_runtime.ts test_loader.ts
```
Real tail: `Test Files  3 passed (3)` / `Tests  22 passed (22)`.
```
cd ts && npx vitest run test_slime_coin test_lua test_executor test_runtime test_loader test_dissonance_run test_dissonance_shared
```
Real tail: `Test Files  10 passed (10)` / `Tests  64 passed (64)` (the filters are substrings: they cover every Slime Coin bridge test, the Lua field-safety test, the executor/runtime/loader tests and two Dissonance UI tests).

The new test fails before the fix, which proves it guards the bug. Real output with the new test file present and `executor.ts` unfixed:
```
FAIL  tests/test_lua_executor_deep_args.ts > LuaExecutor with deeply nested arguments > generate_fixed_reward accepts the real Dissonance data table as its sixth argument
Error: false
Test Files  1 failed (1)   Tests  1 failed (1)
```
(You may run the new test once before step 1 to see this; it is the only place a failing run is expected.)

After all four steps:
```
cd ts && npx vitest run test_lua_executor_deep_args.ts test_executor.ts test_runtime.ts test_loader.ts
```
Expected: `Test Files  4 passed (4)` / `Tests  23 passed (23)`.
```
cd ts && npx vitest run test_slime_coin test_lua test_executor test_runtime test_loader test_dissonance_run test_dissonance_shared
```
Expected: `Test Files  11 passed (11)` / `Tests  65 passed (65)` (the new file is one more match for the `test_lua` filter).
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0. Without Step 2 this reports `Property 'lua_checkstack' does not exist on type 'LuaApi'`.

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

- [ ] The four edits exist exactly as specified; `git diff --stat` shows `executor.ts`, `fengari-web.d.ts`, `test_executor.ts` and the new test, nothing else.
- [ ] The after-commands pass with the counts above (real tails pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files; confirm whether the new test failed before the fix with `Error: false` (paste it). Evidence second: real tails. Then say plainly that this changes a shared engine file used by every Lua game, that the substring-filter command above exercised Slime Coin and Dissonance bridges, and that a full `npx vitest run` is the controller's step after merge. Recommended action: review, merge, then the Dissonance bot-run directive can start (it needs this fix).

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
