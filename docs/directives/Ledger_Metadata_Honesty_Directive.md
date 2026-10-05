# Ledger: remove the Gemini capability claim the game never uses (Size S)

**Depends on:** none. **Why Ledger:** Robert's 2026-10-04 approval of the DIRECTION.md verdict for `ledger` (KEEP-AS-IS; replan item 2, "honest labels").

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/ledger/DIRECTION.md` (Replan 2), `examples/ledger/metadata.json` (whole file, 6 lines).

## 1. Why this exists

`examples/ledger/metadata.json` is the AI Studio export's manifest. It advertises a capability the game does not have:

```
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
```

Measured on origin/main `d3084de0` (2026-10-04): a Grep of `examples/ledger/src` for `GEMINI`, `GoogleGenAI` and `genai` finds nothing; no Ledger source file calls Gemini (the `@google/genai` dependency is only listed in its `package.json`). The claim is untrue and invites the wrong question ("does it need a key?"). It changes nothing in play.
Scope note on the rest of DIRECTION.md for Ledger, so nobody re-opens it: the loss reason line (replan item 3) already exists. `DefeatDialog` in `examples/ledger/src/components/GameDialogs.tsx` shows a headline per reason (`BANKRUPT` or `TIME ELAPSED`), a sentence saying why, the cash left and the unpaid debt; the 10-03 audit text that said "no reason shown" is stale. The Playwright smoke (replan item 1) needs a browser and is the controller's step.

## 2. Scope

1. `examples/ledger/metadata.json`: one line.
2. New test `<!-- new: ts/tests/test_ledger_metadata.ts -->`.

## 3. The work

**Step 1: edit `examples/ledger/metadata.json`.** Replace only the last property so the file reads:

```diff
@@ -2,5 +2,5 @@
   "name": "Ledger",
   "description": "A high-tension trading and appraisal game of compounding debt, partial information, and volatile markets. Inspect walk-ins, bid on Dutch auctions, and clear your loan in 10 days.",
   "requestFramePermissions": [],
-  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
+  "majorCapabilities": []
 }
```

**Step 2: create `ts/tests/test_ledger_metadata.ts`:**

```ts
// new: ts/tests/test_ledger_metadata.ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const metadata = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../examples/ledger/metadata.json'), 'utf8'),
) as { name: string; description: string; majorCapabilities: string[] };

describe('ledger metadata', () => {
  it('names the game and describes the 10-day run in 60 words or fewer', () => {
    expect(metadata.name).toBe('Ledger');
    expect(metadata.description).toContain('10 days');
    expect(metadata.description.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
  });

  it('claims no capability the game does not use (it makes no Gemini call)', () => {
    expect(metadata.majorCapabilities).toEqual([]);
  });
});
```

## 4. What NOT to do

- Do not change `name`, `description` or `requestFramePermissions`, any file under `examples/ledger/src/`, `package.json` (leave the unused dependency; removing it needs an install, which the sandbox refuses), or the registry config (`ts/src/games/ledger/config.ts`).
- No other example's `metadata.json` (they are separate decisions).
- No builds, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_ledger
```
Real tail: `Test Files  1 passed (1)` / `Tests  5 passed (5)`.

After editing, same command. Expected (verified on the prototype): `Test Files  2 passed (2)` / `Tests  7 passed (7)`.
The new test fails before step 1: real output with the test present and the metadata unedited: `Tests  1 failed | 1 passed (2)`, the failing one being "claims no capability the game does not use".
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified; needs the gitignored `ts/src/games/game-metadata.json`).

(`uv run pytest -q tests/test_game_metadata.py` also passed on the prototype, 16 tests, but takes about 2.5 minutes: run it only if time allows and paste the tail; it is the controller's check otherwise.)

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

- [ ] `examples/ledger/metadata.json` has `"majorCapabilities": []` and nothing else changed; `ts/tests/test_ledger_metadata.ts` exists.
- [ ] `cd ts && npx vitest run test_ledger` shows 2 files / 7 tests passing (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the two files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the two files and the counts. Evidence second: real tails. Controller finish: after merge, the embed needs no rebuild for this (metadata is not shipped to players). Recommended action: review, merge.

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
| Branch | directive/queue-sync4 |
| Base branch | - |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: already merged on main via PR #154 (86334ac1); row sync only, no code change
<!-- queue:end -->
