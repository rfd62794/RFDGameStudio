# Dissonance: a headless bot plays whole runs through the real Lua session (Size S)

**Depends on:** `Lua_Executor_Stack_Reserve_Directive` (must be merged first: without it the bot's first reward call throws `Error: false`). **Why Dissonance:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `dissonance` (Replan item 1).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/dissonance/DIRECTION.md` (Replan 1), `ts/src/games/dissonance/App.tsx` (lines 113-236: every Lua call the game makes), `ts/src/games/dissonance/types.ts` (`RunState`, `RewardSlot`, `CombatTurnResult`), `ts/tests/test_slime_coin_bridge.ts` (the pattern for calling a real Lua session from vitest).

Precondition check, first thing: `ts/src/engine/executor.ts` must contain the text `lua.lua_checkstack(this.L, 4);`. If not, the dependency has not merged: STOP and write that in the Status row.

## 1. Why this exists

Dissonance's logic is 2,638 lines of Lua (`games/dissonance/logic/`; `run_state.lua` alone is 1,494). The tests cover art regeneration, run controls and recovery, but nothing plays a run, so a softlock, a negative resource or a crash in any phase would ship unseen (Tier B item B4, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md`).
This run adds one test: a bot calls the same Lua functions the UI calls, in the same order (enter node, play first card in hand, claim all rewards, rest, take essence, leave stores, accept anomalies) until the run ends.

Measured on origin/main `d3084de0` with the executor fix applied (prototype of the bot below, seeds 1 to 4, floor 1): seeds 1 and 2 end in `victory`, seeds 3 and 4 end in `game_over`, each in 20 to 30 steps, with `playerHp` between 0 and `playerMaxHp` and `essence` at least 0 at every step. So both outcomes are reachable.

## 2. Scope

1. New test `<!-- new: ts/tests/test_dissonance_bot_run.ts -->` and nothing else.

## 3. The work

**Create `ts/tests/test_dissonance_bot_run.ts`** with exactly this content:

```ts
// new: ts/tests/test_dissonance_bot_run.ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';
import type { CombatTurnResult, DeckCard, RewardSlot, RunState } from '../src/games/dissonance/types';

/**
 * A simple bot plays whole Dissonance runs through the real Lua session, the same calls
 * ts/src/games/dissonance/App.tsx makes: it always plays the first card in hand, takes every
 * reward, rests, takes essence, leaves shops and accepts anomalies. The test checks that no
 * call fails, no run gets stuck, no number goes negative or non-finite, and that both a win
 * and a loss are reachable.
 */

const MAX_STEPS = 500;

function lua<T>(session: GameSession, fn: string, ...args: unknown[]): T | null {
  return ((call(session, fn, ...args) as unknown[])[0] ?? null) as T | null;
}

function expectSane(run: RunState): void {
  expect(Number.isFinite(run.playerHp)).toBe(true);
  expect(run.playerHp).toBeGreaterThanOrEqual(0);
  expect(run.playerHp).toBeLessThanOrEqual(run.playerMaxHp);
  expect(Number.isFinite(run.essence)).toBe(true);
  expect(run.essence).toBeGreaterThanOrEqual(0);
  if (run.enemy) expect(Number.isFinite(run.enemy.hp)).toBe(true);
}

/** One step of the bot: returns the next run state, or null if a Lua call failed. */
function step(session: GameSession, data: Record<string, unknown>, run: RunState): RunState | null {
  switch (run.status) {
    case 'not_started': {
      if (!run.visitedNodeIds.includes(run.currentNodeId)) {
        return lua<RunState>(session, 'enter_active_node', run, run.deckCardIds, data);
      }
      const node = run.nodes.find((n) => n.id === run.currentNodeId);
      const target = node?.connectsTo?.[0];
      if (!target) return null;
      const moved = lua<RunState>(session, 'select_branch', run, target);
      return moved && lua<RunState>(session, 'enter_active_node', moved, moved.deckCardIds, data);
    }
    case 'combat': {
      const card = run.deckState.hand[0];
      const result = lua<CombatTurnResult>(session, 'resolve_combat_turn', run, card, data);
      if (!result) return null;
      const next = result.nextState;
      if (result.fightWon !== true) return next;
      const slots = lua<RewardSlot[]>(
        session,
        'generate_fixed_reward',
        next.playerMaxHp,
        next.deckCardIds,
        next.boons.map((b) => b.id),
        next.relics,
        next.enemy?.tier ?? 'basic',
        data,
        next.nextRewardBias ?? null,
      );
      if (!slots) return null;
      let cur = next;
      for (const slot of slots) cur = lua<RunState>(session, 'apply_reward_slot', cur, slot, data) ?? cur;
      return lua<RunState>(session, 'advance_node', cur);
    }
    case 'rest_craft': {
      const rested = lua<RunState>(session, 'apply_rest', run) ?? run;
      return lua<RunState>(session, 'advance_node', rested);
    }
    case 'treasure': {
      const taken = lua<RunState>(session, 'resolve_treasure', run, 'essence', data) ?? run;
      return lua<RunState>(session, 'advance_node', taken);
    }
    case 'store': {
      const left = lua<RunState>(session, 'resolve_store', run, null, data) ?? run;
      return lua<RunState>(session, 'advance_node', left);
    }
    case 'anomaly': {
      const done = lua<RunState>(session, 'resolve_anomaly', run, data) ?? run;
      return lua<RunState>(session, 'advance_node', done);
    }
    default:
      return null;
  }
}

function playRun(seed: number): { status: string; steps: number } {
  const session = loadGame('dissonance', seed);
  const data = session.files.data as Record<string, unknown>;
  const deckSize = ((data.run as { deck_size?: number } | undefined)?.deck_size) ?? 8;
  const pool = lua<DeckCard[]>(session, 'build_card_pool', data) ?? [];
  const deckIds = pool.slice(0, deckSize).map((c) => c.id);
  let run = lua<RunState>(session, 'create_run', deckIds, seed, 1, 0, data);
  expect(run).not.toBeNull();
  let steps = 0;
  while (run && run.status !== 'victory' && run.status !== 'game_over') {
    expectSane(run);
    expect(steps).toBeLessThan(MAX_STEPS);
    run = step(session, data, run);
    expect(run, `a Lua call failed at step ${steps} of seed ${seed}`).not.toBeNull();
    steps++;
  }
  expectSane(run as RunState);
  return { status: (run as RunState).status, steps };
}

describe('Dissonance bot run through the real Lua session', () => {
  const outcomes: Record<number, string> = {};

  for (const seed of [1, 2, 3, 4]) {
    it(`seed ${seed}: the run ends, with sane numbers and no failed call`, () => {
      const { status } = playRun(seed);
      outcomes[seed] = status;
      expect(['victory', 'game_over']).toContain(status);
    }, 60000);
  }

  it('both a win and a loss are reachable', () => {
    const results = Object.values(outcomes);
    expect(results).toContain('victory');
    expect(results).toContain('game_over');
  });
});
```

Notes: the Lua session seeds its random numbers from the seed, so each seed plays out the same way every time. If a different seed set is needed to keep one win and one loss, do not edit the bot's play; change the seed list and say so in the Report. The deck is the first `deck_size` cards of `build_card_pool`; the `id` field (not `cardId`) is what `create_run` takes (that is what `DeckBuildPhase` passes).

## 4. What NOT to do

- Change nothing under `ts/src/` or `games/` (no Lua, no engine, no UI). If the bot fails because the game has a bug, STOP: do not fix it and do not weaken the test; write the failing seed, step and Lua error text in the Status row and the Report.
- No new dependencies, no snapshot files, no `Math.random` (the bot is deterministic).
- Do not edit other `test_dissonance_*` files, protected repos, `archive/`, `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`. No deploys.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

```
cd ts && npx vitest run test_dissonance_bot_run.ts
```
Expected (verified on the prototype with the executor fix in place): `Test Files  1 passed (1)` / `Tests  5 passed (5)`, about 5 seconds.
```
cd ts && npx vitest run test_dissonance_zero_regression.ts test_dissonance_run_controls.ts test_dissonance_recovery_manifest.ts
```
Expected: all passed, same counts as before this run (nothing under `ts/src/` changes, so the zero-regression test cannot be affected).
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the file in place; needs the gitignored `ts/src/games/game-metadata.json` that the dispatcher copies).

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

- [ ] `ts/tests/test_dissonance_bot_run.ts` exists with the content above; `cd ts && npx vitest run test_dissonance_bot_run.ts` passes with 5 tests (real tail pasted).
- [ ] The three-file regression command passes and `cd ts && npx tsc --noEmit` is clean (real tails pasted).
- [ ] `git status` shows only the one new file.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the outcome per seed you observed (win or loss, steps) and whether any call failed. Evidence second: real tails. Recommended action: review, merge. If the bot found a game bug, the report is the deliverable: name the seed, the step number and the exact Lua error, and recommend a fix directive.

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
| Status | Review |
| Assigned to | devin |
| Branch | directive/queue-sync3 |
| Base branch | - |

**Status log**
- 2026-10-04 13:39 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: implementation already merged on main as efb01a88 via PR #177 (bot plays whole runs through real Lua); this commit is queue-row sync only, no code change
<!-- queue:end -->
