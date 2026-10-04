# Planet of Greed Tier A polish: CorpWorld leftovers, stale roadmap, save-key guard

## Read first

`docs/demos/planetofgreed/SCOPE.md`, `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (Tier A,
items A1-A8), `ts/src/games/planetofgreed/App.tsx` (lines 310-318, 376-381, 1860-1868 only; the file is
1928 lines), `ROADMAP.md` (lines 40-62), `ts/src/games/planetofgreed/houseStats.ts` (lines 1-30),
`ts/src/games/planetofgreed/aiDecisions.ts` (lines 15-70), `ts/tests/test_shared_persistence.ts` (lines 1-20,
the localStorage pattern). Everything you need is quoted below; do not search for anything else.

## 1. Why this exists

Planet of Greed (registry status `dev`, TS-native, 10 dedicated test files `ts/tests/test_planetofgreed_*.ts`
and a standalone build) is shipped and tested; the polish standard found three cleanup items.

1. Player-facing leftover CorpWorld naming. `ts/src/games/planetofgreed/App.tsx` line 1865, in the
   "Planetary Land Grab Dossier" panel (lines 1860-1867):

```tsx
              <h2 className="text-lg font-black text-[#141414] uppercase tracking-tight flex items-center gap-2">
                <Info className="w-5 h-5 text-[#141414]" />
                Planetary Land Grab Dossier
              </h2>
              <p className="text-xs text-[#141414]/60 font-serif italic font-bold">
                Executive operational instructions for CorpWorld commanders.
              </p>
```

   The same file persists saves under the key `'corpworld_state'`, left over from the fork. These are the
   only two spots (lines 315 and 379):

```tsx
    const parsed = loadSave<{ selectedCellId?: number | null; isPlanningPhase?: boolean }>('corpworld_state');
```
```tsx
      writeSave('corpworld_state', stateToSave);
```

   **The save key stays exactly `'corpworld_state'`.** Renaming it would orphan every existing player save.
   Do not add a second key and do not add a migration.

2. `ROADMAP.md` is stale. Lines 50-59 (the "Now / Next / Later" file; its own header, lines 3-5, says
   completed items are removed and recorded in CHANGELOG.md) still list as deferred:

```
### Planet of Greed

- **Culture stat asymmetry.** Six symmetric Houses under-sell a real
  choice. Resolving this means real balance work with real risk of
  introducing exploits. Deserves its own dedicated pass. Stat values
  have not been touched through any phase. (Deferred since Phase 1,
  restated through Merge & Polish Op v2)
- **AI decision-logic upgrade.** `generateAIWeeklyOrders` remains
  pure-random, zero rival-awareness. Explicitly named as a real,
  separate, unresolved design question. (Deferred since Phase 2)
```

   Both shipped. Evidence to confirm by reading (do not take this on trust): `ts/src/games/planetofgreed/houseStats.ts`
   opens with "Culture stat asymmetry — per-House gameplay modifiers" and records a "BALANCE TUNING HISTORY"
   of three rounds; `ts/src/games/planetofgreed/aiDecisions.ts` exports `WEIGHT_OPPOSITE = 3`,
   `WEIGHT_ADJACENT = 1.5`, `WEIGHT_BASELINE = 1` and `selectWeightedNeighbor`, and `App.tsx` line 735 calls
   `selectWeightedNeighbor(corp, cell, cellsById, corpsById)` inside `generateAIWeeklyOrders`
   (the changelog `ts/src/games/planetofgreed/CHANGELOG.md` line 17 also calls the House-stat work
   "completed"). A second `### Planet of Greed` heading further down `ROADMAP.md` (about line 140, holding the
   itch.io visibility toggle, Robert's call) must not be touched.

3. The phone and desktop screenshot check (A4) has no screenshots recorded (`docs/state/demo-audit-batch2-2026-10-03.md`
   lists "n/v"). A browser is not available to this run; this item is done by the reviewer, not by you.

## 2. Scope

Copied from `docs/demos/planetofgreed/SCOPE.md` (Robert's direction). Class: refine, shipped and tested;
remaining work is cleanup and finishing the ending, not new direction.

Top 3 changes, in order:
1. Fix player-facing CorpWorld text (App.tsx:1865); keep the save key or add a read fallback so old saves survive.
2. Update the ROADMAP.md deferred list to match shipped work.
3. Phone and desktop screenshot pass (audit batch2:18 lists screenshot "n/v").

In scope, exactly these files: `ts/src/games/planetofgreed/App.tsx` (one line), `ROADMAP.md` (lines 50-59
only) and the new test `ts/tests/test_planetofgreed_save_key.ts` <!-- new: ts/tests/test_planetofgreed_save_key.ts -->.

Out of scope (verbatim from SCOPE.md): ending cutscene/narration content, new Houses, combat rule changes
(Circle/Square/Triangle), art replacement, the itch visibility toggle (Robert's, ROADMAP.md:143-146).

Also not touched: the `corpworld_state` key (kept as is), `BoardroomHeader` and `FactionTheme` (shared with
other games), the standalone build files, any other demo.

## 3. The work

Tier A target. A1-A5 are browser checks for the reviewer; A6 already holds (10 test files exist); A7 already
holds: `ts/package.json` has the line below, so add no script.

```
    "build:planetofgreed": "vite build --config vite.planetofgreed.config.ts",
```

1. `ts/src/games/planetofgreed/App.tsx`, line 1865 only: change the text to
   `Executive operational instructions for Planet of Greed commanders.` (same indentation, same tags, same
   line count; App.tsx is far over 600 lines, so no growth). Lines 315 and 379 are not touched.
2. `ROADMAP.md`: replace lines 52-59 (the two bullets quoted above, keeping the `### Planet of Greed` heading
   on line 50 and the blank line after it) with this single bullet, then keep the blank line and
   `### Mutant Battle Ball` that follow:

```
- No deferred items. Culture stat asymmetry (`houseStats.ts`) and the
  wheel-aware AI target selection (`aiDecisions.ts`) shipped; see
  `ts/src/games/planetofgreed/CHANGELOG.md`.
```

3. New test `ts/tests/test_planetofgreed_save_key.ts` <!-- new: ts/tests/test_planetofgreed_save_key.ts -->.
   Guards the two things this directive changes. It reads the source text with `readFileSync` and
   `resolve` from `path`, building the file path from `__dirname` (the ts/tests folder; the target file is
   ts/src/games/planetofgreed/App.tsx, one level up from it; the style used by other tests in this folder, and `__dirname`
   works under the repo's vitest setup) and asserts: (a) the source contains the literal
   `loadSave<{ selectedCellId?: number | null; isPlanningPhase?: boolean }>('corpworld_state')` and
   `writeSave('corpworld_state'`; (b) the source does not contain `CorpWorld commanders`; (c) the source
   contains `Planet of Greed commanders`. Header comment says it exists so a rename of the save key (which
   would orphan player saves) fails loudly. Import only from `vitest`, `fs` and `path`.
4. Do not touch the screenshot pass; say in the report that it was not performed by this run.

## 4. What NOT to do

- Do not rename `'corpworld_state'`, do not add a fallback key or migration, do not touch lines 315 or 379.
- No ending cutscene or narration, no new Houses, no combat or balance changes, no art, no itch toggle.
- Do not edit the second `### Planet of Greed` section of `ROADMAP.md` or any other roadmap line.
- Do not touch `BoardroomHeader` or `FactionTheme`, and do not refactor `App.tsx`.

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_planetofgreed_save_key.ts test_planetofgreed_house_stats.ts test_four_doc_architecture.ts
```

Reference, run when this directive was written against origin/main: `uv run python --version` gave
`Python 3.12.12`; `cd ts && npx vitest run test_planetofgreed_house_stats.ts test_four_doc_architecture.ts` gave `Test Files  2 passed (2)`
and `Tests  32 passed (32)` (the new save-key test adds its own). The `cd ts && npx vitest run <bare-filename>` form is the only form that finds
tests here; `ts/tests/...` paths find none. The full suite (`cd ts && npm test`) and
`cd ts && npm run build:planetofgreed` are reviewer-side steps, not run here. A failure that also fails on a
clean main is pre-existing: record it, do not fix it.

## 6. Rules for this run

- NON-INTERACTIVE. Any tool call that needs a confirmation is rejected and the run ends; do not retry
  another way around it, write why in the Status row.
- ONE simple command per tool call: no `;`, `&&`, `||` or `|` chains and no redirects (the one allowed
  exception is the fixed `cd ts && npx vitest run ...` line in section 5). Do not use `ls`,
  `Get-ChildItem` or `cat`: use Read, Glob and Grep.
- No installs, no downloads, no fetches. Do not read outside this worktree. Do not use a search, memory or
  web tool beyond the Read, Glob and Grep tools inside the worktree. Do not hunt: everything you need is quoted in this
  directive; if a quoted line or a cited path is not where it says, STOP and write why in the Status row.
- Work only on branch `directive/rfdgamestudio-polish-planetofgreed-tiera-directive`. Never commit to main, never push, never deploy.
- No scratch or debug files in the tree; if you need one, put it in `.devin-scratch/`.
- No absolute paths inside this repo's checkout (in code, tests or docs you write).
- Mark every file you create with `<!-- new: path -->` in your report (and, where the file type allows, in
  a header comment).
- New logic goes in small new modules (one job per file); do not grow a file that is already over 600 lines
  (note: edit those in place, same line count).
- Free models only wherever any model configuration is touched (none is expected).
- Do not run `agentflow lint` or any other `agentflow` CLI.
- Never use `git -C`, `git -c`, `git --git-dir` or `git --work-tree`; run git with the worktree as the
  working directory.
- Done means (the Status row): you stopped at `Review` after committing on the directive branch, with one
  line in the log giving the test pass counts. You do not mark Done and you do not merge.

## 7. Completion criteria

- [ ] `ts/src/games/planetofgreed/App.tsx` line 1865 reads `Executive operational instructions for Planet of
      Greed commanders.` and lines 315 and 379 still use `'corpworld_state'` (the new test proves it).
- [ ] `ROADMAP.md` lines 52-59 replaced as specified; the second `### Planet of Greed` section is unchanged.
- [ ] The vitest line in section 5 passes (3 files) and `git status` shows exactly three files changed or
      created: `ts/src/games/planetofgreed/App.tsx`, `ROADMAP.md`, `ts/tests/test_planetofgreed_save_key.ts`.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass
      counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: the three edits and what you confirmed in `houseStats.ts` and `aiDecisions.ts` before
removing the roadmap bullets (quote the lines). Then evidence: the real output tails of the two commands in
section 5. Then one recommended action per open item; state that the A4 phone/desktop screenshot pass was
NOT performed (reviewer-side) and that the placeholder ending (`endingSystem.ts` lines 12-15) is
out of scope. List every created file with `<!-- new: path -->`. State that nothing was deployed.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; touching protected repos; installing or fetching
  anything; editing `.gitignore`, `examples/` or any `dist`/`dist-*` directory; changing gameplay, rules,
  balance or art; touching any demo other than the one named in this directive.

## Required from User

none. Deploying the changed blurb to games.rfditservices.com is Robert's separate step after review and
merge; it is not part of this run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-polish-planetofgreed-tiera-directive |
| Base branch | - |

**Status log**
- 2026-10-03 · robert-claude-laptop · none → Queued — wave 1 Tier A polish for planetofgreed: CorpWorld player text, stale roadmap bullets, save-key guard test; save key corpworld_state kept; docs/demos/planetofgreed/SCOPE.md
- 2026-10-04 00:05 · robert-claude-laptop · Queued → Approved — lint override: sole error(s) are the file the run creates (ts/tests/test_planetofgreed_save_key.ts), marked with a new-file marker; author's dispatch lint on main code gave 0 errors; this queue MCP process still runs pre-fix lint until reconnect
<!-- queue:end -->
