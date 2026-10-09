# SlimeWorld: a visible "New Campaign" button in the header

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/slimeworld/App.tsx` (lines 225-226 the state, lines 355-362 `handleHardReset`, line 633 the header `statusArea`), `ts/src/games/slimeworld/components/OptionsMenu.tsx`,
`ts/tests/test_slimeworld_options_menu_hard_reset.tsx` (existing; must stay green and unchanged), `docs/demos/slimeworld/DIRECTION.md` (Replan, Phase 1).

## 1. Why this exists

A player who wants to start over has to find the small gear icon, then a red "Hard Reset" button inside Options (`OptionsMenu.tsx` line 24). `docs/demos/slimeworld/DIRECTION.md`
lists this under "Biggest turn-off": "reset is buried in Options". The polish standard asks for a visible Start/New Game that returns to the first screen (A3).
SlimeWorld has no title screen, so the cheapest honest fix is a visible, plainly labelled button in the header that opens the confirmation that already exists.

The header today (`App.tsx`, the `statusArea` prop of the main `GameShell`) ends with these two pieces:
```
<span className="flex items-center gap-1"><Coins size={14} /> {state.credits} Biomass</span><button onClick={() => setShowOptionsMenu(true)} className="text-slate-400 hover:text-slate-200" aria-label="Options"><Settings className="w-4 h-4" /></button></div>}
```
The existing two-step confirm (a "Hard Reset" button, then "Confirm Hard Reset" and "Cancel") is kept exactly as is: `test_slimeworld_options_menu_hard_reset.tsx` pins those strings.
Closing the Options menu already resets `pendingHardReset` to false (`onClose={() => { setShowOptionsMenu(false); setPendingHardReset(false); }}`).

## 2. Scope

1. `ts/src/games/slimeworld/App.tsx`: add one button to the header `statusArea`, immediately before the existing Options button.
2. New test `<!-- new: ts/tests/test_slimeworld_new_campaign_entry.tsx -->`.

## 3. The work

**Step 1.** In the header `statusArea`, insert this element directly before `<button onClick={() => setShowOptionsMenu(true)} ... aria-label="Options">` (one line, no other change to that line):

```
<button onClick={() => { setPendingHardReset(true); setShowOptionsMenu(true); }} className="text-slate-400 hover:text-slate-200 text-xs font-mono" aria-label="New Campaign">New Campaign</button>
```

Clicking it opens the Options panel already showing the "Confirm permanent Hard Reset" step with Cancel; nothing is erased until the player confirms. Do not call `handleHardReset` from this button.

**Step 2.** Create `<!-- new: ts/tests/test_slimeworld_new_campaign_entry.tsx -->` with exactly this content:

```tsx
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/slimeworld/App.tsx'),
  'utf8'
);

describe('SlimeWorld New Campaign entry in the header', () => {
  it('shows a visible New Campaign button beside the Options gear', () => {
    expect(appSource).toContain('aria-label="New Campaign">New Campaign</button>');
    expect(appSource.indexOf('aria-label="New Campaign"')).toBeLessThan(appSource.indexOf('aria-label="Options"'));
  });

  it('opens the existing two-step confirm instead of resetting directly', () => {
    expect(appSource).toContain('setPendingHardReset(true); setShowOptionsMenu(true);');
    const handlerIdx = appSource.indexOf('aria-label="New Campaign"');
    const clickStart = appSource.lastIndexOf('<button', handlerIdx);
    expect(appSource.slice(clickStart, handlerIdx)).not.toContain('handleHardReset');
  });
});
```

## 4. What NOT to do

- Do not edit `OptionsMenu.tsx` or `test_slimeworld_options_menu_hard_reset.tsx`; do not rename "Hard Reset" or "Confirm Hard Reset" (the existing test pins them).
- Do not add a title screen, a new game phase, or change `gamePhase` logic. Do not touch the opening beat.
- Do not change save logic (`SAVE_KEY`, `clearSave`, `loadSavedState`).
- Do not touch `games/slimeworld/*.lua` or `*.yaml` (no Lua additions), the engine, or other games.
- Do not change the status label here (a separate directive owns it).

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline, before editing (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_slimeworld_options_menu_hard_reset.tsx test_slimeworld_onboarding.tsx
```
Real tail: `Test Files  2 passed (2)` / `Tests  11 passed (11)`.

After editing (verified on a prototype of exactly this change):
```
cd ts && npx vitest run test_slimeworld_new_campaign_entry.tsx test_slimeworld_options_menu_hard_reset.tsx test_slimeworld_onboarding.tsx test_slimeworld_tab_gating.tsx
```
Real tail: `Test Files  4 passed (4)` / `Tests  19 passed (19)`.

Type check (same form as the repo's other checks):
```
cd ts && npx tsc --noEmit
```
Real baseline and prototype result are identical: 4 errors, all `Cannot find module '../games/game-metadata.json'` (a generated file absent from a fresh worktree; not yours). Any new error mentioning `slimeworld` is yours: fix it.

Source check (Grep tool): `ts/src/games/slimeworld/App.tsx` contains `aria-label="New Campaign"` once.

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

- [ ] The header has a `New Campaign` button before the Options button; `handleHardReset` is not called from it.
- [ ] `ts/tests/test_slimeworld_new_campaign_entry.tsx` exists; the four-file vitest command in section 5 shows `4 passed` files, `19 passed` tests (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] No file outside the two in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the one inserted element and the new test. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: the click behaviour and the header fit at 390 px need a browser; Controller finish: Robert or Claude opens the built page at 1280x720 and 390x844, clicks New Campaign, confirms the Cancel path and the erase path, and takes the screenshot pair. This run builds nothing.
Recommended action: review, merge, then the controller's screenshot check.

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
| Status | Superseded |
| Assigned to | devin |
| Branch | directive/queue-sync4 |
| Base branch | - |
| Base commit | bb3963e46b78c78e4daa6f858bc713fe6cb1776d |

**Status log**
- 2026-10-04 13:28 · robert-claude-laptop · none → Queued
- 2026-10-04 19:04 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions and a gitignored generated file (game-metadata.json), verified by hand
- 2026-10-04 19:48 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-new-campaign-button-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 19:49 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-slimeworld-new-campaign-button-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-04 19:54 · devin · In progress → Blocked — Already on main: the spec-exact change was committed directly to main as b4385ce8 (Robert, 16:03 today - the 'prototype' the directive cites). origin/main..branch = 0 commits, so Review is refused (no delta to review). Re-verified on the worktree: python 3.12.12; vitest 4-file run = 4 files/19 tests passed; tsc --noEmit clean; aria-label="New Campaign" once; only the 2 in-scope files differ in the commit. Recommend mark Done.
- 2026-10-05 · devin-cleanroom · Blocked → Review: impl already on main via PR #162 (f9f76d1d, spec-exact commit b4385ce8); dispatched run's Blocked note verified correct; row sync only
- 2026-10-08 16:00 · robert-claude-laptop · Review → Superseded — superseded_by: commit:b4385ce8 - note: change already on main (b4385ce8); queue-sync4 branch held only status flips
<!-- queue:end -->
