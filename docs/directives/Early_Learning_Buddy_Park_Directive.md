# early_learning_buddy: mark it parked on the board and in its scope note (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/status/board.data.ts` (the `early_learning_buddy` row), `ts/src/status/types.ts`, `ts/src/status/generateMarkdown.ts`, `ts/src/pages/StatusBoardPage.tsx`, `docs/demos/early_learning_buddy/SCOPE.md` and `DIRECTION.md` (verdict PARK).

## 1. Why this exists

Robert approved all recommendations on 2026-10-04, including PARK for Early Learning Buddy: it is a voice learning companion for young children that needs a Gemini server and a children's-data review, which a solo, no-servers studio should not run. Its own `config.ts` says it stays unlisted. The board still says it is `active`, which contradicts that.
Measured on origin/main `889dd21e`: `board.data.ts` row `early_learning_buddy` has `status: 'active'` and `lastUpdated: '2026-08-16'`; `ProjectStatus` (`ts/src/status/types.ts`) has no `parked` value (`active`, `shipped_mature`, `shipped_deliberately_paused`, `blocked`, `status_unconfirmed`, `retired`); the two `Record<ProjectStatus, ...>` label tables (`generateMarkdown.ts` `STATUS_LABELS`, `StatusBoardPage.tsx` `STATUS_BADGE_VARIANT` and `STATUS_LABELS`) must gain the new key or the build breaks. Nothing is deleted: the code stays, unlisted.

## 2. Scope

1. `ts/src/status/types.ts`: add `'parked'` to `ProjectStatus`.
2. `ts/src/status/generateMarkdown.ts`: `parked: 'Parked'` in `STATUS_LABELS`.
3. `ts/src/pages/StatusBoardPage.tsx`: `parked: 'muted'` in `STATUS_BADGE_VARIANT` and `parked: 'Parked'` in `STATUS_LABELS`.
4. `ts/src/status/board.data.ts`: rewrite the `early_learning_buddy` row.
5. `docs/demos/early_learning_buddy/SCOPE.md`: one appended line.
6. New test `<!-- new: ts/tests/test_board_row_early_learning_buddy.ts -->`.

## 3. The work

TypeScript files use CRLF; keep it.

1. `types.ts`: add the line `  | 'parked'` directly after `  | 'shipped_deliberately_paused'` in the `ProjectStatus` union.
2. `generateMarkdown.ts`: add `  parked: 'Parked',` directly after the `shipped_deliberately_paused: 'Shipped/Deliberately Paused',` line.
3. `StatusBoardPage.tsx`: add `  parked: 'muted',` directly after `shipped_deliberately_paused: 'green',` and `  parked: 'Parked',` directly after `shipped_deliberately_paused: 'Shipped/Paused',`.
4. `board.data.ts`: replace the row's `status: 'active',` with `status: 'parked',`, its `currentState` with
`'Voice-powered learning companion for young children. Intentionally unlisted from the public arcade; needs a Gemini server and a privacy review for child users before it could ever ship.'`,
add the line `    nextAction: 'Private experiment until Robert decides to ship it; then its own repo, server decision and privacy review first.',` and change `lastUpdated: '2026-08-16',` to `lastUpdated: '2026-10-04',`. Leave `id`, `name`, `category` and the `capabilities` line exactly as they are.
5. Append to the end of `docs/demos/early_learning_buddy/SCOPE.md` (a new final line, CRLF): `Tier: N/A, parked (2026-10-04, Robert's approval of the PARK verdict). Not in the registry, not polished, not published; the code stays in ts/src/games/early_learning_buddy.`
6. Create `ts/tests/test_board_row_early_learning_buddy.ts` with exactly:

```ts
// new: ts/tests/test_board_row_early_learning_buddy.ts
import { describe, it, expect } from 'vitest';
import { STATUS_BOARD } from '../src/status/board.data';
import { generateMarkdown } from '../src/status/generateMarkdown';

describe('status board row: early_learning_buddy', () => {
  const row = STATUS_BOARD.find(e => e.id === 'early_learning_buddy')!;

  it('is parked, says it is unlisted, and names the next step', () => {
    expect(row.status).toBe('parked');
    expect(row.currentState).toContain('unlisted');
    expect(row.nextAction).toBeTruthy();
  });
  it('the markdown generator labels a parked row "Parked"', () => {
    expect(generateMarkdown(STATUS_BOARD)).toContain('Parked');
  });
});
```

## 4. What NOT to do

- Do not register the game, add it to the arcade, add privacy text, deploy a server or touch `ts/src/games/early_learning_buddy/**` (parked means no spend).
- Do not edit any other board row (trinity_siege has its own directive), the registry, or the status tooling beyond the three label tables.
- Do not regenerate `docs/state/StatusBoard.md` (controller step).
- No protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (verified 2026-10-04, the combined board-row prototype test against origin/main `889dd21e`): the `early_learning_buddy` assertions fail (`status` is `active`, no `Parked` label).

After editing:
```
cd ts && npx vitest run test_board_row_early_learning_buddy.ts test_status_board.ts test_site_status_pages.ts test_generate_site_status_pages.ts test_registry_export.ts
```
Real tail from a prototype of exactly these edits (2026-10-04): `Test Files  5 passed (5)` / `Tests  40 passed (40)` (new board test 2, status-board 11, site-status 18, generator 6, registry export 3).

Source check (Grep tool, one call): `ts/src/status/board.data.ts` contains `status: 'parked'` once; `docs/demos/early_learning_buddy/SCOPE.md` ends with the `Tier: N/A, parked` line.

**Controller finish (after merge):** regenerate `docs/state/StatusBoard.md` with the repo's status generator.

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

- [ ] `parked` exists in the type and in all three label tables; the board row is parked with a next action.
- [ ] The SCOPE.md line is appended.
- [ ] The five test files pass (real tail pasted).
- [ ] No file outside the six in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what changed (type, labels, row, SCOPE line). Evidence second: real tails. Note for Robert: the question "is this a product you intend to ship (own repo and server decision) or a private experiment?" stays open; the recommended default (private, parked) is what this records.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/queue-sync4 |
| Base branch | - |

**Status log**
- 2026-10-04 13:19 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified S-size status-board edit + test; Devin-shaped, no sandbox needs.
- 2026-10-04 · devin-cleanroom · Queued → Review: already merged on main via PR #156 (9afc0621); row sync only, no code change
- 2026-10-04 20:56 · robert-claude-laptop · Review → Done
<!-- queue:end -->
