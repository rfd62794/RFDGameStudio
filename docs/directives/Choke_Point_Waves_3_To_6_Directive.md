# choke_point: waves 3 to 6 and a Brute, in data only (M)

**Depends on:** `Choke_Point_Wave_Solvability_Directive` (merged first: without its Lua fix waves after the first never spawn).
**Read first** (everything this run needs is pasted below; these are the files to open):
`games/choke_point/data.yaml`, `ts/src/games/choke_point/types.ts`, `ts/tests/test_choke_point_waves.ts` (created by the dependency), `docs/demos/choke_point/DIRECTION.md` (verdict POLISH, Replan step 2).

## 1. Why this exists

Choke Point is a 2-wave game: about a minute, then nothing to chase (`docs/demos/choke_point/DIRECTION.md`). The direction is "more waves and one enemy type, in YAML only, with a test proving the win is reachable".
Measured on origin/main `889dd21e`: `games/choke_point/data.yaml` defines waves 1 and 2 only (lines 31 to 59), enemy types `crawler` and `blaster`, towers Barricade (cost 3) and Autocannon (cost 5, damage 3), start energy 10 and +5 per turn. Enemies move one cell left per turn from x = 6; only an enemy at (2,3) attacks the core; a turret fires at the nearest enemy in its row.
The solvability test from the dependency plays the real Lua with a baseline strategy ("one Autocannon at x = 2 in every enemy row, as soon as energy allows") and currently expects waves `[1, 2]`.

## 2. Scope

1. `games/choke_point/data.yaml`: add waves 3, 4, 5, 6 after wave 2, using enemy types `crawler`, `blaster` and one new type `brute` (same behaviour as the others: it walks, it attacks the thing in front of it; it just has more hit points).
2. `ts/src/games/choke_point/types.ts`: add `'brute'` to the `EnemyType` union.
3. `ts/tests/test_choke_point_waves.ts`: change the wave expectation from two waves to six.

## 3. The work

All three edited files use CRLF; keep it.

**Step 1: `games/choke_point/data.yaml`.** Append exactly this at the end of the `waves:` list (after wave 2's last enemy, same 2-space indentation as waves 1 and 2):

```yaml
  3:
    enemies:
      - type: crawler
        spawn_turn: 1
        spawn_y: 2
        hp: 6
      - type: crawler
        spawn_turn: 1
        spawn_y: 4
        hp: 6
      - type: blaster
        spawn_turn: 2
        spawn_y: 3
        hp: 8
      - type: crawler
        spawn_turn: 3
        spawn_y: 1
        hp: 6
  4:
    enemies:
      - type: crawler
        spawn_turn: 1
        spawn_y: 5
        hp: 6
      - type: blaster
        spawn_turn: 1
        spawn_y: 3
        hp: 8
      - type: crawler
        spawn_turn: 2
        spawn_y: 2
        hp: 6
      - type: blaster
        spawn_turn: 3
        spawn_y: 4
        hp: 8
  5:
    enemies:
      - type: brute
        spawn_turn: 1
        spawn_y: 3
        hp: 12
      - type: crawler
        spawn_turn: 2
        spawn_y: 1
        hp: 6
      - type: crawler
        spawn_turn: 2
        spawn_y: 5
        hp: 6
      - type: blaster
        spawn_turn: 3
        spawn_y: 2
        hp: 8
  6:
    enemies:
      - type: brute
        spawn_turn: 1
        spawn_y: 2
        hp: 12
      - type: brute
        spawn_turn: 1
        spawn_y: 4
        hp: 12
      - type: blaster
        spawn_turn: 2
        spawn_y: 3
        hp: 8
      - type: crawler
        spawn_turn: 3
        spawn_y: 1
        hp: 6
      - type: crawler
        spawn_turn: 3
        spawn_y: 5
        hp: 6
```

**Step 2: `ts/src/games/choke_point/types.ts`.** Change `export type EnemyType = 'crawler' | 'blaster';` to `export type EnemyType = 'crawler' | 'blaster' | 'brute';`.

**Step 3: `ts/tests/test_choke_point_waves.ts`.** In the first test (`a baseline strategy ... wins and passes through every wave`) change `expect([...r.seenWaves].sort()).toEqual([1, 2]);` to `expect([...r.seenWaves].sort()).toEqual([1, 2, 3, 4, 5, 6]);`. Change nothing else in the file.

## 4. What NOT to do

- No new tower classes and no Lua changes: new tower classes need new Lua mechanics, which ADR-013 rules out. `logic.lua` is not edited in this directive.
- No change to `constants:` (grid size, energy, core HP), to the existing `towers:` entries or to waves 1 and 2.
- No UI change (`App.tsx`): the wave counter and the star card are the next directive. The enemy name already renders from `enemy.type`, so `brute` needs no UI work.
- Do not weaken the test (do not lower the number of waves, add turns, or relax assertions) to make it pass; if the baseline strategy cannot win six waves, STOP and write the failing numbers in the Status row.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (with the dependency merged; the test file still expects two waves): `cd ts && npx vitest run test_choke_point_waves.ts` gives `Test Files  1 passed (1)` / `Tests  4 passed (4)`.
If you change only the expectation to six waves first, it fails with `expected [ 1, 2 ] to deeply equal [ 1, 2, 3, 4, 5, 6 ]`; that is the expected red step.

After editing, the same command. Real tail from a prototype of exactly these edits on top of the dependency (2026-10-04): `Test Files  1 passed (1)` / `Tests  4 passed (4)` (the baseline strategy wins all six waves).
```
cd ts && npx vitest run test_choke_point_waves.ts
```
Regression check: `cd ts && npx vitest run test_choke_point_restart.ts test_choke_point_ui.ts` gives `Tests  4 passed (4)`.

Source check (Grep tool, one call): `games/choke_point/data.yaml` has `  6:` as a wave key and `type: brute` three times (wave 5 once, wave 6 twice).

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

- [ ] `data.yaml` has waves 3 to 6 exactly as pasted; `types.ts` lists `'brute'`.
- [ ] `test_choke_point_waves.ts` expects waves 1 to 6 and `cd ts && npx vitest run test_choke_point_waves.ts` passes (real tail pasted).
- [ ] The two existing choke_point tests still pass (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: that the baseline strategy wins all six waves (or the failing numbers if it does not). Evidence second: real tails. Recommended action: review, merge, then `Choke_Point_Wave_Counter_Stars_Directive`.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.
