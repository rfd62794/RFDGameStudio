# SlimeGarden: stop the page scrolling sideways on a phone

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`examples/slimegarden/src/App.tsx` (lines 648-652), `docs/demos/slimegarden/DIRECTION.md` (Replan Phase 2), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (A4).

## 1. Why this exists

At 390 px wide the live SlimeGarden page scrolls sideways (polish standard A4: "no horizontal scroll"). The 2026-10-03 audit measured `scrollWidth 476 vs 368` and left the cause open
("one candidate is the decorative blob; unverified"). Measured on 2026-10-04 against the live page `https://games.rfditservices.com/arcade/slimegarden/` in a 390x844 browser:

```
scrollWidth 480 (viewport 390)
elements wider than the viewport, found by script:
  div.absolute.top-24.left-1/4.w-96.h-96  (the blue decorative blob)  width 384, right edge 480
  div.absolute.bottom-24.right-1/4.w-[500px].h-[500px] (the red blob) width 500, right edge 289
```
The blue blob (`left-1/4` plus 384 px) is what pushes the page to 480. Setting `overflow-x: clip` on their parent (the root `div`, line 648 of `App.tsx`) in the live page took `scrollWidth` from 480 to 385 (viewport 390: no sideways scroll), and the sticky header stayed `position: sticky`.
`overflow-x: clip` is used, not `overflow-hidden`, because `overflow-hidden` would make that div the scroll container and break the sticky header.

The root element in the source today (line 648):
```
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white relative font-sans">
```
Tailwind here is v4 (`examples/slimegarden/package.json`: `tailwindcss ^4.1.14`), which has the `overflow-x-clip` utility.

## 2. Scope

1. `examples/slimegarden/src/App.tsx`: add `overflow-x-clip` to that one `className` (one line).
2. New test `<!-- new: ts/tests/test_slimegarden_phone_fit.ts -->`.

## 3. The work

**Step 1.** Change line 648 to exactly:
```
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-slate-700 selection:text-white relative overflow-x-clip font-sans">
```
Change nothing else in the file. The file uses CRLF line endings; keep them.

**Step 2.** Create `<!-- new: ts/tests/test_slimegarden_phone_fit.ts -->` with exactly:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../../examples/slimegarden/src/App.tsx'),
  'utf8'
);

describe('slimegarden phone fit', () => {
  it('clips the decorative background blobs so the page cannot scroll sideways', () => {
    const rootIdx = appSource.indexOf('min-h-screen bg-[#090d16]');
    expect(rootIdx).toBeGreaterThan(-1);
    const rootLine = appSource.slice(rootIdx, appSource.indexOf('>', rootIdx));
    expect(rootLine).toContain('overflow-x-clip');
  });

  it('keeps the two decorative blobs and the sticky header', () => {
    expect(appSource).toContain('top-24 left-1/4 w-96 h-96');
    expect(appSource).toContain('bottom-24 right-1/4 w-[500px] h-[500px]');
    expect(appSource).toContain('sticky top-0 z-30');
  });
});
```

## 4. What NOT to do

- Do not remove or resize the decorative blobs, and do not change the header, the layout classes, or any game logic.
- Do not touch `examples/slimeworld/`, `intake/slimegarden/`, `package.json`, or run any install or build in `examples/`.
- Do not edit the registry blurb or README (a separate directive owns them).
- Do not deploy; the live page changes only after the controller rebuilds the embed.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

After editing (verified on a prototype of exactly this change):
```
cd ts && npx vitest run test_slimegarden_phone_fit.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  2 passed (2)`.

Neighbours (same form): `cd ts && npx vitest run test_registry_export.ts test_arcade_manifest.ts`. Expected: all passed.

Source check (Grep tool): `examples/slimegarden/src/App.tsx` contains `overflow-x-clip` once.

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

- [ ] The one `className` in `App.tsx` has `overflow-x-clip`; nothing else changed in that file.
- [ ] `ts/tests/test_slimegarden_phone_fit.ts` exists; `cd ts && npx vitest run test_slimegarden_phone_fit.ts` shows 2 passed (real tail pasted).
- [ ] The neighbours command passes (real tail pasted).
- [ ] No file outside the two in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the one-class change and the new test. Evidence second: real tails of `uv run python --version` and the vitest commands.
Then say plainly: the fix is proven only in the live page by script; the built result needs a browser. Controller finish: rebuild the embed (`npm run build:demo -- slimegarden`), then Robert or Claude checks scrollWidth at 390x844 is at most 390 and takes the screenshot, then redeploys (Robert).
Recommended action: review, merge, then the controller's rebuild and screenshot.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.
