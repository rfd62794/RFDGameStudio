# SlimeWorld: a headless 200-cycle run that proves the economy cannot break

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/tests/test_slimeworld_tier_worker_income.tsx` (how tests call the Lua rules), `ts/src/games/slimeworld/App.tsx` (`initialState`, `buildColorSpecs`, `handleAdvanceCycle`),
`ts/src/games/slimeworld/types.ts` (`stateToLua`, `luaSlimeToTs`), `docs/demos/slimeworld/DIRECTION.md` (Replan, Phase 3).

## 1. Why this exists

SlimeWorld has 24 test files, but none plays the game forward: no test runs many cycles and checks the economy stays sane. `docs/demos/slimeworld/DIRECTION.md` asks for
"a headless balance/softlock vitest (B4: N cycles with a baseline strategy; no negative Biomass)". This directive adds the first, smallest version of that safety net:
a 200-cycle baseline run that only advances cycles after putting the starter slimes to work. It is deliberately narrow (it does not breed, dispatch or unlock regions);
those paths already have their own tests, and a wider run is a later directive.

Measured on origin/main `889dd21e` with a prototype of the test below (the repo's real runtime, `loadGame('slimeworld')`): after 200 `advance_cycle` calls the cycle counter
reads 201, Biomass went from 100 to 8100 (an example; the starting colour is random per run, so the exact figure moves), the lowest Biomass seen was 100, the roster stayed at 2 slimes of cap 10.
The test passed 4 of 4 on three consecutive runs.

## 2. Scope

1. New test `<!-- new: ts/tests/test_slimeworld_headless_balance.tsx -->`. Nothing else changes.

## 3. The work

Create `<!-- new: ts/tests/test_slimeworld_headless_balance.tsx -->` with exactly this content:

```tsx
import { describe, expect, it } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { buildColorSpecs, initialState } from '../src/games/slimeworld/App';
import { luaSlimeToTs, stateToLua, type LabState } from '../src/games/slimeworld/types';

const session = loadGame('slimeworld');
const data = session.files.data as Record<string, unknown>;
const CYCLES = 200;

function runBaseline(): { state: LabState; minCredits: number; cyclesRun: number } {
  let state = initialState(session);
  // Baseline strategy: put every starter slime to work, then only advance cycles.
  for (const slime of state.slimes) {
    const id = slime.id;
    if (call(session, 'toggle_worker_role', stateToLua(state), id)[0] === true) {
      state = { ...state, slimes: state.slimes.map(s => (s.id === id ? { ...s, lockedRole: 'worker' } : s)) };
    }
  }
  let minCredits = state.credits;
  let cyclesRun = 0;
  for (let i = 0; i < CYCLES; i += 1) {
    const [raw] = call(session, 'advance_cycle', stateToLua(state), buildColorSpecs(data), data['petition'], data['constants']);
    const result = raw as Record<string, unknown>;
    state = {
      ...state,
      cycle: Number(result['cycle'] ?? state.cycle + 1),
      credits: Number(result['credits'] ?? state.credits),
      slimes: Array.isArray(result['slimes']) ? (result['slimes'] as Array<Record<string, unknown>>).map(luaSlimeToTs) : state.slimes,
    };
    minCredits = Math.min(minCredits, state.credits);
    cyclesRun += 1;
  }
  return { state, minCredits, cyclesRun };
}

describe('SlimeWorld headless baseline run (200 cycles, advance only)', () => {
  const run = runBaseline();

  it('advances every cycle without an error', () => {
    expect(run.cyclesRun).toBe(CYCLES);
    expect(run.state.cycle).toBeGreaterThanOrEqual(CYCLES);
  });

  it('pays steady worker income: Biomass grows, but stays in a sane range', () => {
    expect(run.state.credits).toBeGreaterThan(100);
    expect(run.state.credits).toBeLessThan(100000);
  });

  it('never lets Biomass go negative or become NaN', () => {
    expect(run.minCredits).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(run.state.credits)).toBe(true);
  });

  it('keeps every slime stat finite and the roster inside its cap', () => {
    expect(run.state.slimes.length).toBeLessThanOrEqual(run.state.rosterCap);
    for (const slime of run.state.slimes) {
      for (const value of Object.values(slime.stats)) expect(Number.isFinite(value)).toBe(true);
    }
  });
});
```

If a call such as `toggle_worker_role` returns something other than `true` for a starter, the loop simply leaves that slime unlocked; do not change the logic to force it.

## 4. What NOT to do

- Do not edit any source file, Lua file or YAML file. This run only adds the test; if the test fails against the real code, that is a finding: STOP, set the Status row to Blocked, and paste the failing output.
- Do not add breeding, dispatch, region-unlock or petition steps to the run (a later directive).
- Do not add random seeds or mocks of `Math.random`; the starting colour is random by design and the assertions are ranges.
- Do not touch other tests, the engine, or other games.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline (existing neighbours, verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_slimeworld_options_menu_hard_reset.tsx test_slimeworld_onboarding.tsx
```
Real tail: `Test Files  2 passed (2)` / `Tests  11 passed (11)`.

New test (verified on the prototype of exactly the content above, three runs):
```
cd ts && npx vitest run test_slimeworld_headless_balance.tsx
```
Real tail: `Test Files  1 passed (1)` / `Tests  4 passed (4)`.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Allowed commands are only: `uv run pytest ...`, `cd ts && npx vitest run <bare filename>`, `cd ts && npx tsc --noEmit`, `git status`, `git diff`, `git add`, `git commit`.
  Do NOT run `npm run build:*`, `vite-node`, `agentflow lint` or any agentflow command, `git merge`, or `uv run python -m studio.demos index` (the sandbox refuses them).
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files edited use CRLF line endings where the file already has them; keep them (the Edit tool preserves them). Do not convert.
- New logic goes in small new modules; no file over 600 lines.
- Player-facing text (blurbs, buttons, messages) is plain, welcoming and free of developer jargon.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `ts/tests/test_slimeworld_headless_balance.tsx` exists with the content in section 3 and `cd ts && npx vitest run test_slimeworld_headless_balance.tsx` shows 4 passed (real tail pasted).
- [ ] The baseline command in section 5 still passes (real tail pasted).
- [ ] No file other than the new test changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the new test passes or the exact failing assertion. Evidence second: real tails of `uv run python --version` and both vitest commands.
Then say plainly what the test does NOT cover (breeding, dispatch, region unlock, petitions) so nobody reads green as "balanced". Recommended action: review and merge; a wider run is the next directive.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/queue-sync4 |
| Base branch | - |

**Status log**
- 2026-10-04 13:28 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: already merged on main via PR #182 (00a0ea55); row sync only, no code change
- 2026-10-04 20:57 · robert-claude-laptop · Review → Done
<!-- queue:end -->
