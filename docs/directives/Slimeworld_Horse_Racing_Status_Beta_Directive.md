# SlimeWorld and Derby Sim: label them `beta` until the evidence exists

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/slimeworld/config.ts`, `ts/src/games/horse_racing/config.ts`, `ts/tests/test_arcade_manifest_counts.ts` (the pattern for a registry-reading test),
`docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (section 1: only `shoal` is `stable`).

## 1. Why this exists

The public badge on the arcade card comes from the registry `status`. Two demos carry the amber/green `stable` badge without the Tier B evidence the polish
standard requires (section 1: "`stable` = ready to show (today only `shoal`)"). Measured on origin/main `889dd21e` (2026-10-04):

```
grep -ln "status: *'stable'" ts/src/games/*/config.ts
ts/src/games/horse_racing/config.ts
ts/src/games/shoal/config.ts
ts/src/games/slimeworld/config.ts
```

The two lines to change (line 10 in both files):
```
  status:      'stable',
```
Robert's decision (2026-10-04, approval of the direction recommendations in `docs/demos/slimeworld/DIRECTION.md` and `docs/demos/horse_racing/DIRECTION.md`):
set both to `beta` until Tier B evidence exists. Flipping back to `stable` is a later directive, after the balance tests and a phone pass.
`GameStatus` already includes `'beta'` (`ts/src/engine/types.ts` line 69). No test pins `stable` for either game today: a prototype of this change left
`test_registry_export.ts`, `test_arcade_manifest.ts`, `test_arcade_manifest_counts.ts`, `test_no_regression_to_existing_floor.ts`, `test_arcade_registry_directive.ts`,
`test_collect_configs.ts` and `test_per_game_builds.ts` all green (`Test Files 7 passed (7)`, `Tests 37 passed | 14 skipped (51)`). So this run adds the pinning test.

## 2. Scope

1. `ts/src/games/slimeworld/config.ts`: `status: 'stable'` becomes `status: 'beta'` (that one line).
2. `ts/src/games/horse_racing/config.ts`: the same one-line change.
3. New test `<!-- new: ts/tests/test_demo_status_beta_labels.ts -->`.

## 3. The work

**Step 1.** Change the two `status` lines as described. Change nothing else in either file.

**Step 2.** Create `<!-- new: ts/tests/test_demo_status_beta_labels.ts -->` with exactly this content:

```ts
import { describe, it, expect } from 'vitest';
import slimeworld from '../src/games/slimeworld/config';
import horseRacing from '../src/games/horse_racing/config';
import { GAME_REGISTRY } from '../src/games/registry';

describe('public status labels (Tier B evidence not yet recorded)', () => {
  it('slimeworld is labelled beta', () => {
    expect(slimeworld.status).toBe('beta');
  });

  it('horse_racing is labelled beta', () => {
    expect(horseRacing.status).toBe('beta');
  });

  it('shoal is the only game labelled stable', () => {
    const stable = GAME_REGISTRY.filter(g => g.status === 'stable').map(g => g.gameId);
    expect(stable).toEqual(['shoal']);
  });
});
```

## 4. What NOT to do

- Do not change any other field in either config (blurb, label, order, tags, source).
- Do not edit `ts/src/engine/types.ts`, the registry, or any other game's status.
- Do not run the arcade manifest exporter or any build; do not deploy. The public badge changes only when Robert redeploys the site.
- Do not touch `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.
- Do not "fix" `tests/test_demos.py::test_real_repo_problems_are_strings_and_flag_known_gaps`: it already fails on origin/main (`assert not any(p.startswith("shoal:") ...)`), before and after this change.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

Baseline, before editing (the new test file does not exist yet, so this checks the neighbours):
```
cd ts && npx vitest run test_arcade_manifest_counts.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  5 passed (5)`.

After editing (verified on a prototype of exactly this change, 2026-10-04):
```
cd ts && npx vitest run test_demo_status_beta_labels.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  3 passed (3)`.

Then the regression set (same form; prototype result `Test Files 7 passed (7)`, `Tests 37 passed | 14 skipped (51)`):
```
cd ts && npx vitest run test_registry_export.ts test_arcade_manifest.ts test_arcade_manifest_counts.ts test_no_regression_to_existing_floor.ts test_arcade_registry_directive.ts test_collect_configs.ts test_per_game_builds.ts
```

Source checks (Grep tool, one call each): `ts/src/games/slimeworld/config.ts` and `ts/src/games/horse_racing/config.ts` each contain `status:      'beta'` once and no `'stable'`.

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

- [ ] Both configs say `status:      'beta'` and nothing else in them changed.
- [ ] `ts/tests/test_demo_status_beta_labels.ts` exists and `cd ts && npx vitest run test_demo_status_beta_labels.ts` shows 3 passed (real tail pasted).
- [ ] The regression command in section 5 passes (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the two one-line changes and the new test. Evidence second: real tails of `uv run python --version` and the vitest commands.
Then say plainly: the public badge changes only after the site is rebuilt and deployed (Controller finish, Robert). Controller finish: rerun the arcade manifest exporter,
then redeploy the site; flip each game back to `stable` only in a later directive that cites Tier B evidence.
Recommended action: review, merge, then redeploy.

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
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:14 · robert-claude-laptop · none → Queued
- 2026-10-04 13:17 · robert-claude-laptop · Queued → Approved — lint override: stale MCP lint; author ran baseline+after proofs; Robert 2026-10-04 approved all recommendations
<!-- queue:end -->
