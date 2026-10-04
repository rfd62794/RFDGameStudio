# Gladiator Arena: tighten the career-simulation tests and test useArmedConfirm (tests only)

## Read first

`ts/tests/test_gladiator_arena_tier_a.ts` (all 122 lines, the file you edit), `ts/src/games/gladiator_arena/simulation/balanceHarness.ts`
(lines 392-480, 505-530 and 600-747 only; the file is 747 lines), `ts/src/games/gladiator_arena/utils/useArmedConfirm.ts` (all 36 lines),
`ts/tests/test_choke_point_restart.ts` (lines 1-35: the repo's React `act` pattern), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md`
(the Tier B section only, for the intent). Everything you need is quoted or summarised below; do not search for anything else.

## 1. Why this exists

Review of the merged Gladiator Arena Tier A work found two thin spots.

1. The career-simulation block (`ts/tests/test_gladiator_arena_tier_a.ts`, describe `test_gladiator_arena_career_logic`, lines 70-122)
   runs `runCareerProgressionSimulation(5)` unseeded and asserts only `careersSimulated === 5`, then that
   `avgGoldEarned`, `completionRatePercent`, `medianBoutsToClear` and the five `tierClearRates` are finite and `>= 0`
   (lines 79-99). The Tier B intent is: no negative gold, tier 5 reachable or an explicit documented ceiling, no softlock.
2. `useArmedConfirm` (`ts/src/games/gladiator_arena/utils/useArmedConfirm.ts`), the two-step confirm behind the New Game
   button, has only a source-text anchor (`App.tsx` contains the string, test lines 57-68) and no behavioural test:

```ts
export function useArmedConfirm(onConfirm: () => void, ms = 3000) {
  const [armed, setArmed] = useState(false);
  ...
  const trigger = useCallback(() => {
    ...
    if (armed) {
      setArmed(false);
      onConfirmRef.current();
    } else {
      setArmed(true);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setArmed(false);
      }, ms);
    }
  }, [armed, ms]);

  return { armed, trigger };
}
```

What the harness actually does (read, do not take on trust). `runCareerProgressionSimulation(careersCount = 40, playerPersonality = 'brawler')`
(balanceHarness.ts line 434) has NO seed option; its randomness is `Math.random()` (in the harness, `combatEngine.ts`,
`championLadder.ts` and `forgeEconomy.ts`). Stubbing `Math.random` with a seeded generator makes it deterministic:
measured, two runs with the same seed gave identical results (`{"1":100,"2":100,"3":40,"4":40,"5":40}`, avgGoldEarned 2384
for 5 careers at seed 1). A career starts with 180 gold; each career is capped by `const maxCareerBouts = 65;`
(line 473), so the harness cannot loop forever (that cap is the softlock guard). Gold itself is internal: it is
guarded by construction (repairs pay `Math.min(gold, ...)`, scar removal needs `gold > 100` and pays at most
`gold - 60`, a shop upgrade needs `part.cost <= gold`), and the report exposes only aggregates, so "no negative gold"
can only be asserted through the report's non-negative aggregates; say so in the report. The report fields
(`CareerProgressionReport`, lines 408-430) are: `careersSimulated`, `completionRatePercent` (share of careers that
beat the tier 5 champion), `medianBoutsToClear` (0 when nobody completes), `avgGoldEarned`, `avgGoldSpentOnRepairs`,
`avgGoldSpentOnUpgrades`, `avgScarsPerCareer`, `tierClearRates` (keys 1-5, percent), `progressionCurve` (5 entries
with `avgBoutsRequired`), `balanceDiagnostic.status`.

Measured with a mulberry32 seed stub (`vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed))`) over 20 careers,
on origin/main `77fdba94d78ca1f5b00b360e7329ce845fe130ca`:

| seed | completionRatePercent | medianBoutsToClear | tierClearRates 1..5 | avgGoldEarned | repairs / upgrades | status |
|---|---|---|---|---|---|---|
| 1 | 45 | 28 | 90, 90, 45, 45, 45 | 2482 | 1584 / 446 | ECONOMIC_SPIRAL |
| 2 | 25 | 29 | 80, 75, 30, 30, 25 | 1713 | 1216 / 381 | ECONOMIC_SPIRAL |
| 3 | 35 | 30 | 80, 75, 35, 35, 35 | 1991 | 1478 / 309 | ECONOMIC_SPIRAL |

Tier 5 is reachable at every measured seed; a 20-career run takes about 1.5 seconds. The status
`ECONOMIC_SPIRAL` (repairs above 1.4x upgrades) is a real balance finding, not a test failure: report it, do not
assert `HEALTHY`, and do not change the harness.

The mulberry32 generator used for the measurement (copy it into the test file; it is 8 lines, no new module):

```ts
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

## 2. Scope

Tests only. In scope, exactly: the edited existing file `ts/tests/test_gladiator_arena_tier_a.ts` (the
`test_gladiator_arena_career_logic` describe only; keep the build-wiring and source-anchor describes unchanged) and
one new file `ts/tests/test_gladiator_use_armed_confirm.ts` <!-- new: ts/tests/test_gladiator_use_armed_confirm.ts -->.
Out of scope: the harness and every other file under `ts/src/games/gladiator_arena/`, balance changes, the
`runBalanceSimulation` assertions (leave them as they are), and any other demo.

## 3. The work

1. `ts/tests/test_gladiator_arena_tier_a.ts` is `// @vitest-environment node`; keep that. Add `vi` to the vitest import
   and the `mulberry32` helper above. In `test_gladiator_arena_career_logic`, run the career simulation under the
   seeded stub: in `beforeAll` do `vi.spyOn(Math, 'random').mockImplementation(mulberry32(1))`, then
   `career = runCareerProgressionSimulation(20)`, then `vi.restoreAllMocks()` (restore before the unseeded
   `runBalanceSimulation` line, which keeps running as it does today). Replace the three thin career `it`s (lines
   79-99) with these, deriving every bound from section 1 and the harness, with a comment on each bound saying where
   it comes from:
   - `careersSimulated === 20`;
   - determinism: a second `runCareerProgressionSimulation(20)` under a fresh `mulberry32(1)` stub gives identical
     `tierClearRates`, `completionRatePercent`, `medianBoutsToClear` and `avgGoldEarned` (do not compare `timestamp`);
   - economy non-negative: `avgGoldEarned`, `avgGoldSpentOnRepairs`, `avgGoldSpentOnUpgrades` and `avgScarsPerCareer` are
     finite and `>= 0`, `avgGoldEarned > 0`; a comment states that per-career gold is guarded in the harness and
     not observable, which is why the aggregates are the proxy;
   - tier 5 reachable: `tierClearRates[5] > 0`, and `completionRatePercent === tierClearRates[5]` (both count a defeated
     tier 5 champion, harness lines 525 and 617), and `medianBoutsToClear` is between 5
     and 65 inclusive (5 tiers at least one bout each; 65 is `maxCareerBouts`, the documented ceiling);
   - funnel shape: every `tierClearRates[t]` is in 0-100, `tierClearRates[t + 1] <= tierClearRates[t]` for t = 1..4,
     and `tierClearRates[1] >= 70` (the harness's own bar: below 70 it reports TOO_DIFFICULT);
   - no softlock: the report has 5 `progressionCurve` entries and each `avgBoutsRequired` is finite and `<= 65`; the whole
     `beforeAll` completes inside the test timeout (give the `beforeAll` an explicit 30000 ms timeout);
   - diagnostic is well-formed: `balanceDiagnostic.status` is one of `HEALTHY`, `TOO_DIFFICULT`, `TOO_EASY`,
     `ECONOMIC_SPIRAL`, and `recommendations.length > 0` (do NOT assert a specific status; add a comment recording
     that seeds 1-3 measured ECONOMIC_SPIRAL on origin/main).
   Keep the `tierClearRates` loop test only if it adds something these do not; otherwise remove it. If a measured
   value differs in your run, assert what the harness does and report it.
2. New test `ts/tests/test_gladiator_use_armed_confirm.ts` <!-- new: ts/tests/test_gladiator_use_armed_confirm.ts -->.
   No pragma (the repo default environment is jsdom, `ts/vite.config.ts` line 80). The repo has no `renderHook`;
   its React pattern is `createRoot` from `react-dom/client` plus `act` from `react-dom/test-utils` (see
   `ts/tests/test_choke_point_restart.ts`), so mount a tiny probe component that calls the hook and stores the result.
   This skeleton was run and passes; build on it, without extracting or changing the hook:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useArmedConfirm } from '../src/games/gladiator_arena/utils/useArmedConfirm';

type Handle = { armed: boolean; trigger: () => void };

function mount(onConfirm: () => void, ms?: number) {
  const handle: { current: Handle | null } = { current: null };
  function Probe() {
    handle.current = useArmedConfirm(onConfirm, ms);
    return null;
  }
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => { root.render(React.createElement(Probe)); });
  return { handle, unmount: () => act(() => { root.unmount(); }) };
}

describe('useArmedConfirm', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  // tests here
});
```

   Tests (all with fake timers; wrap every `trigger()` and every `vi.advanceTimersByTime(...)` in `act`):
   - starts disarmed (`armed === false`, `onConfirm` not called);
   - first `trigger()` arms (`armed === true`) and does not call `onConfirm`;
   - second `trigger()` inside the window confirms: `onConfirm` called exactly once, `armed === false`, and the
     pending timeout is cleared (a further `advanceTimersByTime(5000)` calls nothing more);
   - timeout disarms: with `ms = 3000`, after `advanceTimersByTime(2999)` still armed, after one more ms disarmed,
     `onConfirm` never called;
   - after a timeout, the next `trigger()` arms again rather than confirming;
   - the default window is 3000 ms (mount without the `ms` argument and repeat the 2999 / +1 check);
   - unmount while armed clears the timer: after `unmount()`, `vi.getTimerCount()` is 0 and advancing timers calls
     nothing (if React's own scheduler leaves a timer in the count, assert instead that `onConfirm` is not called
     and say so in the report).
   If a repo hook-test pattern did not exist you would test only the pure logic; it does (the `act` pattern above),
   so use it. Do not extract the hook or change `useArmedConfirm.ts`.

## 4. What NOT to do

- Do not change `balanceHarness.ts`, `useArmedConfirm.ts`, or any other game file; do not add a seed option to the harness.
- Do not assert exact balance numbers (rates, gold) from the table: use the derived ranges and invariants, so a future
  balance pass does not need a test rewrite. Do not assert `status === 'HEALTHY'`.
- Do not leave `Math.random` stubbed: restore it (`vi.restoreAllMocks()`) before any unseeded code runs.
- Do not touch the build-wiring and source-anchor describes of `test_gladiator_arena_tier_a.ts`, and do not edit
  `test_gladiator_shell_opening.ts`.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_gladiator_arena_tier_a.ts test_gladiator_use_armed_confirm.ts test_gladiator_shell_opening.ts
```

Reference, run when this directive was written: `uv run python --version` gave `Python 3.12.12`; the harness-proof
command `cd ts && npx vitest run test_arcade_manifest.ts test_voiddrift_redux_chrome.ts` gave `Test Files  2 passed (2)`
and `Tests  14 passed (14)`. Run that proof command once first and paste its real tail, to confirm the form works in
your worktree. The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here;
`ts/tests/...` paths find none. Run the three-file command twice and confirm the same pass counts both times (the
seeded career run must not be flaky). A failure that also fails on a clean main is pre-existing: record it, do not
fix it.

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
- Work only on branch `directive/rfdgamestudio-gladiator-career-test-tighten-directive`. Never commit to main, never push, never deploy.
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

- [ ] The career describe runs under a seeded `Math.random` stub, restores it, and asserts the checks in section 3
      (determinism, non-negative economy aggregates, tier 5 reachable with the 65-bout ceiling documented, funnel
      shape, no softlock, well-formed diagnostic), each bound derived and commented.
- [ ] `ts/tests/test_gladiator_use_armed_confirm.ts` covers arm, confirm, timeout, re-arm, default window and unmount.
- [ ] The three-file vitest line passes twice with identical counts; `git status` shows exactly two files: the
      edited `ts/tests/test_gladiator_arena_tier_a.ts` and the created `ts/tests/test_gladiator_use_armed_confirm.ts`.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass
      counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: what each tightened assertion now guards, the observed career numbers at seed 1, and the
`ECONOMIC_SPIRAL` diagnostic as an open balance finding (repairs vs upgrades). State plainly that "no negative gold"
is asserted via aggregates because per-career gold is not exposed. Then evidence: the real output tails of the
proof command and both runs of the three-file vitest line. Then one recommended action per open item (for example: a
future harness option to expose per-career minimum gold and a seed parameter, and a balance pass on repair costs).
List every created file with `<!-- new: path -->`. State that no game code was changed and that nothing was deployed.

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
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-gladiator-career-test-tighten-directive |
| Base branch | - |
| Base commit | 8ad04494653f60ee072382b62dd845bb089e40cb |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 · robert-claude-laptop · none → Queued — wave-1 review follow-up: tighten career-simulation assertions to the Tier B intent, add useArmedConfirm behaviour test
- 2026-10-04 05:48 · robert-claude-laptop · Queued → Approved — lint override: sole error is ts/tests/test_gladiator_use_armed_confirm.ts, a file the run creates and marks new; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
- 2026-10-04 05:58 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-gladiator-career-test-tighten-directive; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
