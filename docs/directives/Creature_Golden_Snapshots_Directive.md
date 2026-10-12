# Creature system: golden SVG snapshots, same seed same creature forever (roadmap M5.2, Size S-M)

**Depends on:** none. `docs/CREATURE_SYSTEM.md` (roadmap M5.1) already exists on main and names the entry points this run uses. Adds one test file and a folder of committed golden files; changes no source.

**Read first:** `docs/CREATURE_SYSTEM.md`, `docs/ROADMAP.md` (step M5.2), `ts/src/engine/paperDoll/index.ts` (exports), `ts/src/engine/paperDoll/composer.ts` (`composeFigure` at line 62 and `renderFigureSvg` at line 580), `ts/src/engine/paperDoll/creaturePresets.ts` (`CREATURE_PRESETS`, six archetypes), `ts/src/engine/paperDoll/proportionPresets.ts` (`PROPORTION_PRESETS`, `PROPORTION_PRESET_ORDER`), and `ts/tests/test_character_viewer.ts` (lines 30-100: how a `CompositionInput` is built from `PART_SLOTS` in `ts/src/engine/shared/partSlots.ts`).

## 1. Why this exists

Roadmap M5.2 (approved 2026-09-22): shared systems are only safe to change when a change that alters output fails a test. The Paper Doll composer feeds Chimera Wilds, Mutant Battle Ball, Character Viewer and the Technique Showcase, and the M6 pixel-art work will rebuild its output path. Today `renderFigureSvg` is only checked for containing `<svg` and for differing between body plans (`ts/tests/test_character_viewer.ts`); nothing fails if a coordinate, colour or shape drifts. One person cannot hand-check 27 demos after a renderer refactor, so the check has to be a committed file diff.

## 2. Scope

1. New test `ts/tests/test_creature_golden_snapshots.ts` <!-- new: ts/tests/test_creature_golden_snapshots.ts --> and a new folder `ts/tests/golden/creature/` <!-- new: ts/tests/golden/creature/ --> holding the goldens as `.svg` files (the extension keeps vitest from treating them as tests; `ts/vite.config.ts` includes only `tests/**/*.{ts,tsx}`).
2. The fixed set, all rendered through the public `renderFigureSvg` (never `composeFigure` internals) at width and height 200: for each of the six `CREATURE_PRESETS` entries, seeds 42 and 1337, using that preset's `bodyPlan`, with the plan's `shapeMappings` replaced by the preset's `shapes` (the same override `buildBodyPlan` does in `test_character_viewer.ts`), its `proportions`, colours all one fixed hex per slot, and parts from the dummy-parts pattern. That is 12 goldens named `<preset id>_seed<seed>.svg`. Add three more using `humanoidBilateral` with `PROPORTION_PRESETS` entries (first, middle and last of `PROPORTION_PRESET_ORDER`) at seed 42, named `proportion_<name>_seed42.svg`. Fifteen goldens in total.
3. Test behaviour: for each case, render, normalise line endings to `\n`, and compare with the committed file; on mismatch the failure message names the file and says how to re-bless. Blessing: when the environment variable `UPDATE_GOLDEN` is `1` the test writes the file instead of comparing (use `process.env`, keep the write path inside `ts/tests/golden/creature/`). Without it the test never writes. A missing golden file is a failure, not an auto-create.
4. Two extra assertions in the same file: rendering the same input twice in one process gives byte-identical output (catches hidden `Math.random` or `Date.now`), and the 15 outputs are pairwise distinct (catches a preset silently collapsing to another).
5. A short section appended to `docs/CREATURE_SYSTEM.md`: "Golden snapshots" - where they live, that any diff is either intended (re-bless with `UPDATE_GOLDEN=1` in the same commit and say why in the commit message) or a regression, and that M6 pixel work extends the same folder.

## 3. The work

Write the test first; with no goldens it fails on every case (red). A non-interactive run cannot set environment variables, so the first blessing uses a temporary constant: declare `const BLESS_MISSING = true;` near the top of the test, and make the compare step write the file when it is absent and `BLESS_MISSING` is true. Run the test once (it writes the 15 files), then use Edit to change the constant to `false` and add a comment: "Set UPDATE_GOLDEN=1 to re-bless; a missing golden is a failure." Re-run; all 15 compare green. The permanent re-bless path is the `UPDATE_GOLDEN` environment variable from Scope item 3. Open two goldens with Read and confirm they are real SVG with differing content (the report states file sizes in bytes).

If any render includes a random or time-dependent value (the double-render assertion fails), do NOT stub it in the test: stop, set the Status row to Blocked, and report the exact source line. That is a defect in the renderer and its own directive.

## 4. What NOT to do

- Do not change any file under `ts/src/`, `games/` or `examples/`.
- Do not snapshot React component output (`PaperDoll`, `SvgCreatureRenderer`) here; the string function is the stable contract. Note in the report whether `renderToStaticMarkup` of `SvgCreatureRenderer` looks deterministic, as input for a later run.
- Do not use vitest's `toMatchSnapshot` or `toMatchFileSnapshot`; the committed `.svg` files are the artefact a human diffs.
- Do not add a dependency.

## 5. Verification

Baseline first: `cd ts && npx vitest run` once; record pass and fail counts and failing file names. Then:

```text
cd ts && npx vitest run test_creature_golden_snapshots.ts
cd ts && npx vitest run test_character_viewer.ts test_paper_doll.ts test_paper_doll_proportion_presets.ts
cd ts && npx tsc --noEmit
cd ts && npx vitest run
```

Expected: the new file passes 15 comparison cases plus the two extra assertions; the other listed files are unchanged and green; full failing set equals the baseline or is smaller; `tsc` has no new errors. Also state that you ran the new file twice in a row with identical results.

## Sandbox needs

- Exec(cd ts && npx vitest run)
- Exec(cd ts && npx vitest run test_creature_golden_snapshots.ts)
- Exec(cd ts && npx vitest run test_character_viewer.ts test_paper_doll.ts test_paper_doll_proportion_presets.ts)
- Exec(cd ts && npx tsc --noEmit)

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

## Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of the sanctioned verification line forms `cd ts && npx vitest run <bare-filename> [<bare-filename> ...]` and `cd ts && npx tsc --noEmit`. Use Read, Glob and Grep, not `ls`/`cat`. Use the bare test filename as the filter.
- Do not install, download or fetch anything. Do not read outside this worktree. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do not run `git merge origin/main`. Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one. Deleting files is not permitted.
- No absolute paths inside this repo in any file you write; use repo-relative paths. New text files use CRLF, except the golden `.svg` files which keep `\n` (the test normalises either way).
- New logic goes in small new modules (SOLID/SRP/KISS), one responsibility per file.
- When every Completion criteria box is checked and the verification tails are in the log line, set the Status row to **Review**. Never set it to Done. If you stop partway, set it to Blocked and write why.

## Completion criteria

- [ ] `ts/tests/test_creature_golden_snapshots.ts` and 15 golden `.svg` files exist; the test fails with the goldens absent and passes with them.
- [ ] Double-render and pairwise-distinct assertions pass.
- [ ] Verification commands pass as described (real tails pasted); full failing set equals or is smaller than baseline.
- [ ] `docs/CREATURE_SYSTEM.md` has the "Golden snapshots" section.
- [ ] `git diff --stat` shows only the test, the golden folder, and `docs/CREATURE_SYSTEM.md`.
- [ ] Status row set to Review with a one-line log entry.

## Report

Findings first: golden count and total bytes, whether any render was non-deterministic, and your read on `SvgCreatureRenderer` determinism. Evidence second: real tails of the vitest and tsc commands. Recommended action: review, merge.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-12 · robert-claude-laptop · none → Draft — roadmap M5.2 (approved 2026-09-22) had no directive; M5.1 doc is on main; prerequisite for the M6 pixel work
- 2026-10-12 07:03 · robert-claude-laptop · Draft → Queued
<!-- queue:end -->
