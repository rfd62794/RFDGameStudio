# mutant_battle_ball: make the match-symmetry tests repeatable (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/tests/test_mbb_match_rendering_point_cap_symmetry.ts`, `ts/tests/test_mbb_balanced_zero_score.ts` (it already seeds `Math.random` with `mulberry32`), `ts/src/games/mutant_battle_ball/simulation/mbbMath.ts` (`makePrng`), `docs/demos/mutant_battle_ball/DIRECTION.md` (Replan step 2).

## 1. Why this exists

The pipeline audit saw stochastic failures in two MBB balance tests, `test_symmetric_opportunity_post_fix` and `test_controlled_match_isolates_brand_effect`. The cause is recorded in the tests themselves: sportsSim's CombatSystem, BallSystem and DisposalSystem draw from raw `Math.random()`, so the same seed gives a different match each run.
Measured on origin/main `889dd21e` (2026-10-04): `test_symmetric_opportunity_post_fix` (in `test_mbb_balanced_zero_score.ts`) already seeds `Math.random` with `mulberry32(12345)`; `test_mbb_match_rendering_point_cap_symmetry.ts` does NOT (apart from one test that swaps `Math.random` by hand around two runs), and its `test_controlled_match_isolates_brand_effect` block runs 10 and 5 real matches on the raw stream with a very wide pass band (at most a 9-1 split). Eight repeated runs of both files all passed (46 tests each), so the flake is rare; seeding removes it entirely.
Note the older roadmap item "stats 2-3x too high from parts-summing" is partly stale: `ts/src/games/mutant_battle_ball/statsMapper.ts` already divides power, endurance, cyber armor and aggression by 6 before the combat system sees them. This directive does not change any stat.

## 2. Scope

1. `ts/tests/test_mbb_match_rendering_point_cap_symmetry.ts`: one import line and one top-level seeding block. Nothing else.

## 3. The work

The file uses CRLF; keep it.

1. Change the first line `import { describe, expect, it } from 'vitest';` to `import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';`.
2. Directly after the line `import type { Mutant } from '../src/games/mutant_battle_ball/types';` add (the existing `makePrng` import from `mbbMath` is already in the file):

```ts

// sportsSim's CombatSystem/BallSystem/DisposalSystem draw from raw Math.random(), so every match in this
// file is replayed from one fixed stream: same seed, same match, no run-to-run flake.
beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(makePrng(4242));
});
afterEach(() => {
  vi.restoreAllMocks();
});
```

## 4. What NOT to do

- Do not change any assertion, threshold (`<= 8`), seed passed to `initMatch`, or test body. Do not edit `test_mbb_balanced_zero_score.ts` (already seeded).
- Do not change the simulation, `statsMapper.ts` or any stat. No new tests in this directive.
- Do not remove the existing `Math.random = makePrng(777)` swaps in the point-cap test: they still work (they restore the spy afterwards).
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (verified 2026-10-04): `cd ts && npx vitest run test_mbb_match_rendering_point_cap_symmetry.ts` gives `Tests  36 passed (36)`; the printed `[symmetric match] player wins: N/10` line is not stable between runs.

After editing, run the same command THREE times. Real result from the prototype (2026-10-04), identical every time: `[symmetric match] player wins: 7/10, opponent wins: 3/10` and `Tests  36 passed (36)`.
```
cd ts && npx vitest run test_mbb_match_rendering_point_cap_symmetry.ts
```
Regression check: `cd ts && npx vitest run test_mbb_` gives `Test Files  11 passed (11)` / `Tests  202 passed (202)`.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `npm run build:*`, `vite-node` or
  `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge, see Controller finish).
  Do not use `npx tsc` as a check: in a fresh worktree it reports unrelated errors about the gitignored `game-metadata.json`.
- Do not run `git merge origin/main`. If you need to know whether main moved, use `git fetch origin` then `git rev-list --count HEAD..origin/main`.
- Files you edit use CRLF line endings; keep them (the Edit tool preserves them). New files may use either; use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] The file has the new import and the seeding block and nothing else changed.
- [ ] Three consecutive runs print the same `[symmetric match] ...` line and pass 36 tests (real tails pasted).
- [ ] `cd ts && npx vitest run test_mbb_` still passes (real tail pasted).
- [ ] No file outside the one in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the three identical lines. Evidence second: real tails. Recommended action: review and merge.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/queue-sync4 |
| Base branch | - |

**Status log**
- 2026-10-04 13:26 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: already merged on main via PR #155 (ffff7aae); row sync only, no code change
<!-- queue:end -->
