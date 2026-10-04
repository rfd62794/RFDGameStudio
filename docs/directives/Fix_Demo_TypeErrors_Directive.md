# Fix the pre-existing TypeScript errors that the pre-push hook never catches

## Read first

`ts/tests/test_facility_escape_blurb.ts` (all 26 lines), `ts/src/engine/types.ts` (lines 30-36, the optional
`description?: string`), `examples/ledger/src/utils.ts` (lines 183-232, 249-252, 370-376 only; the file is 534
lines), `ts/tests/test_ledger_utils.ts` (lines 1-30). Everything you need is quoted below; do not search for
anything else.

## 1. Why this exists

`cd ts && npx tsc --noEmit -p .` on a clean origin/main reports errors that never surfaced because the
pre-push hook runs vitest only (vitest does not type-check). Measured against origin/main
`77fdba94d78ca1f5b00b360e7329ce845fe130ca`, with the generated (gitignored) game metadata file present, the
complete list is these six lines (the `game-metadata.json not found` TS2307 lines are a fresh-worktree artifact
and are not in scope):

```
../examples/ledger/src/utils.ts(229,9): error TS6133: 'clueText' is declared but its value is never read.
../examples/ledger/src/utils.ts(251,29): error TS6133: 'day' is declared but its value is never read.
../examples/ledger/src/utils.ts(251,42): error TS6133: 'shopTier' is declared but its value is never read.
../examples/ledger/src/utils.ts(374,11): error TS6133: 'baseRoll' is declared but its value is never read.
tests/test_facility_escape_blurb.ts(16,19): error TS18048: 'config.description' is possibly 'undefined'.
tests/test_facility_escape_blurb.ts(21,19): error TS18048: 'config.description' is possibly 'undefined'.
```

(`examples/ledger` is tracked in git: `git ls-files examples/ledger` lists it.)

The test errors. `ts/tests/test_facility_escape_blurb.ts` lines 15-25 read the optional field directly:

```ts
  it('description is 60 words or fewer', () => {
    const words = config.description.trim().split(/\s+/).length;
```
```ts
  it('description contains none of the 5 dev-note terms (prototype, property-based, telecasted, TODO, TBD)', () => {
    const lower = config.description.toLowerCase();
```

`config.description` is typed `string | undefined` (`description?: string` in `ts/src/engine/types.ts`). The
real value is a non-empty blurb (`ts/src/games/facility_escape/config.ts` line 7).

The ledger errors. In `examples/ledger/src/utils.ts`:

- Line 229: `  const clueText = authenticity === 'counterfeit' ` (statement continues on lines 230-231, ending
  `: AUTHENTIC_CLUES[Math.floor(Math.random() * AUTHENTIC_CLUES.length)];`). Nothing reads it.
- Lines 186-207 define `COUNTERFEIT_CLUES` and `AUTHENTIC_CLUES` (the comment on line 186 reads
  `// Atmospheric clues for counterfeit items (found during inspection)`). Their only use is the unused
  `clueText`, so once `clueText` goes they become unused too (they are not exported). Remove them with it.
- Line 251: `export function generateLot(day: number, shopTier: number, forceType?: 'walk_in' | 'dutch_auction'): Lot {`
  uses neither `day` nor `shopTier`. The callers (`examples/ledger/src/App.tsx` lines 82, 83, 144, 156, 390, 624 and
  `ts/tests/test_ledger_utils.ts` lines 24-25) pass both arguments positionally, so the signature must keep its
  shape: rename the two parameters with a leading underscore (`_day`, `_shopTier`), which TypeScript treats as
  intentionally unused.
- Line 374: `    const baseRoll = Math.random();` (inside `calculateMarketDrift`'s drift step) is never read.

## 2. Scope

In scope, exactly these two files: `ts/tests/test_facility_escape_blurb.ts` and `examples/ledger/src/utils.ts`.
No new files. Out of scope: the TS2307 `game-metadata.json` errors, any other tsc finding, ledger gameplay,
and every other file.

## 3. The work

1. `ts/tests/test_facility_escape_blurb.ts`: inside the `describe`, before the first `it`, add
   `const description = config.description ?? '';`, and use `description` in place of `config.description` on
   the two lines quoted above. Add one new `it('description is present and non-empty', ...)` asserting
   `expect(description.trim().length).toBeGreaterThan(0)`, so a missing blurb still fails loudly (the `?? ''`
   must not make the 60-word and dev-term tests pass vacuously). Keep the existing three tests' meaning.
2. `examples/ledger/src/utils.ts`: (a) delete the `clueText` statement (lines 229-231) and the two clue arrays
   with their comment (lines 186-208, through the blank line after `AUTHENTIC_CLUES`' closing `];`, so that
   `// Generate a randomized item` follows the previous block with one blank line); (b) rename the `generateLot`
   parameters to `_day` and `_shopTier`; (c) delete the `const baseRoll = Math.random();` line.
   Delete by content, not by line number: the numbers shift as you edit.
3. Removing `clueText` and `baseRoll` removes two `Math.random()` calls per use, so random sequences shift. That
   is accepted; if `test_ledger_utils.ts` fails because of it, report the failing assertion rather than
   changing the test.

## 4. What NOT to do

- Do not touch the TS2307 `game-metadata.json` errors, `tsconfig`, the `ts/package.json` scripts, or any other
  file's type errors.
- Do not make `clueText` "used" (do not put clue text into `notes`): that would change gameplay.
- Do not change the `generateLot` parameter order or arity, and do not touch its callers.
- Do not weaken the blurb test (no `as string`, no `!` that hides a missing description).

## 5. Verification

Run each as its own tool call from the worktree root and paste the real output tails in the report:

```
uv run python --version
cd ts && npx vitest run test_facility_escape_blurb.ts test_ledger_utils.ts
cd ts && npx tsc --noEmit -p .
```

Reference, run when this directive was written against origin/main: `uv run python --version` gave
`Python 3.12.12`; `cd ts && npx vitest run test_facility_escape_blurb.ts test_ledger_utils.ts` gave `Test Files  2 passed (2)`
and `Tests  8 passed (8)` (your new test makes it 9); the harness-proof command
`cd ts && npx vitest run test_arcade_manifest.ts test_voiddrift_redux_chrome.ts` gave `Test Files  2 passed (2)` and
`Tests  14 passed (14)`. Run that proof command once first and paste its real tail, to confirm the form works in
your worktree. The `cd ts && npx vitest run <bare-filename>` form is the only form that finds tests here;
`ts/tests/...` paths find none. After your edits, the tsc output must contain no line mentioning
`utils.ts` or `test_facility_escape_blurb.ts`. Any remaining tsc lines (TS2307 for `game-metadata.json`, or
others) are pre-existing: list them, do not fix them.

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
- Work only on branch `directive/rfdgamestudio-fix-demo-typeerrors-directive`. Never commit to main, never push, never deploy.
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

- [ ] `cd ts && npx tsc --noEmit -p .` output no longer mentions `examples/ledger/src/utils.ts` or
      `ts/tests/test_facility_escape_blurb.ts`.
- [ ] `cd ts && npx vitest run test_facility_escape_blurb.ts test_ledger_utils.ts` passes (2 files, 9 tests).
- [ ] `git status` shows exactly two files changed: `ts/tests/test_facility_escape_blurb.ts` and
      `examples/ledger/src/utils.ts`.
- [ ] Committed on the directive branch, not pushed. Status row: `Review`, with one line giving the pass
      counts. The run does not mark Done and does not merge.

## 8. Report

Findings first: the edits made and the full remaining tsc output (every remaining line classified as the
out-of-scope TS2307 class or other). Then evidence: the real output tails of the proof command and of the three
commands in section 5. Then one recommended action per open item (for example: wiring `tsc --noEmit` into the
pre-push hook is a separate decision for Robert; do not do it here). State that nothing was deployed.

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
| Status | Approved |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-fix-demo-typeerrors-directive |
| Base branch | - |
| Base commit | 77fdba94d78ca1f5b00b360e7329ce845fe130ca |
| Head remote | rfd62794/rfdgamestudio |

**Status log**
- 2026-10-04 · robert-claude-laptop · none → Queued — wave-1 review follow-up: tsc errors the vitest-only pre-push hook never caught (facility_escape blurb test, ledger utils unused variables)
- 2026-10-04 05:46 · robert-claude-laptop · Queued → Approved
<!-- queue:end -->
