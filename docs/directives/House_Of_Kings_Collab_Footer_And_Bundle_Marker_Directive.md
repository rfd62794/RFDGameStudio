# House of Kings: Collab: drop the dev footer and mark the generated server bundle

**Depends on:** none

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/house_of_kings_collab/DIRECTION.md` (Replan item 1), `ts/src/games/house_of_kings_collab/App.tsx` (lines 8-16 and 280-295 only),
`ts/src/games/house_of_kings_collab/server/Dockerfile`, `ts/tests/test_house_of_kings_blurb.ts` (the pattern for the new test).

## 1. Why this exists

House of Kings: Collab is parked as an architecture showcase (Robert approved the PARK verdict, 2026-10-04: no public hosting; `docs/demos/house_of_kings_collab/DIRECTION.md`). Two leftovers make it look unfinished and noisy. Measured on origin/main `afb1cefe`:
- A development footer on the player-facing shell: `ts/src/games/house_of_kings_collab/App.tsx` lines 285-290 render "House of Kings: Collab — Phase 1 First Real Content (August 2026)" under every screen, including the sign-in landing page.
- A generated 12 MB artifact in source control: `ts/src/games/house_of_kings_collab/server/bundle.js` is 12,294,017 bytes (250,795 lines), tracked, and copied into the container by `ts/src/games/house_of_kings_collab/server/Dockerfile` line 6 (`COPY bundle.js ./bundle.js`). It is generated output (a CommonJS bundle that starts `"use strict"; var __create = Object.create; ...`) and floods every diff and code search. `git check-attr -a` on it shows nothing set, and the repo has no `.gitattributes` file at all.

Decision for the bundle (this run): keep it tracked and MARK it as generated. Reason, verified: untracking a tracked file with `git rm --cached` and then merging deletes the file from the working tree of every other checkout, and the Dockerfile needs it present (the direction note allows either: "untrack ... or the marker present"). The marker makes GitHub collapse it and git hide its diffs; history already holds the bytes either way.

## 2. Scope

1. `ts/src/games/house_of_kings_collab/App.tsx`: remove the `footer` prop and the now-unused `Sparkles` import.
2. New file `<!-- new: .gitattributes -->` at the repo root with exactly one line.
3. New test `<!-- new: ts/tests/test_house_of_kings_cleanup.ts -->`.

## 3. The work

`App.tsx` is a CRLF file; keep its endings. `.gitattributes` uses LF.

**Step 1: `App.tsx`.** Apply this prototype diff (context lines are unchanged):

```diff
--- a/ts/src/games/house_of_kings_collab/App.tsx
+++ b/ts/src/games/house_of_kings_collab/App.tsx
@@ -10,7 +10,7 @@ import { TaskView } from './components/TaskView';
 import { VerificationPanel } from './components/VerificationPanel';
 import { AdminPanel } from './components/AdminPanel';
 import { isAdminUser } from './lib/adminGate';
-import { Shield, Sparkles, User as UserIcon, LogOut, CheckCircle2, ShieldCheck, Crown } from 'lucide-react';
+import { Shield, User as UserIcon, LogOut, CheckCircle2, ShieldCheck, Crown } from 'lucide-react';
 
 export default function App({ session }: GameRendererProps) {
   void session; // destructured per contract; game is self-contained
@@ -282,12 +282,6 @@ export default function App({ session }: GameRendererProps) {
           {houseName ? `House: ${houseName}` : 'Server-Authoritative Task Engine'}
         </span>
       }
-      footer={
-        <div className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
-          <Sparkles className="w-3.5 h-3.5 text-amber-500/60" />
-          <span>House of Kings: Collab — Phase 1 First Real Content (August 2026)</span>
-        </div>
-      }
     >
       <main className="flex-1 p-4 sm:p-6 md:p-8">
         {!user ? (
```

**Step 2: `.gitattributes`.** Create `.gitattributes` at the repository root (it does not exist today) containing exactly this one line and a trailing newline:
```
ts/src/games/house_of_kings_collab/server/bundle.js linguist-generated=true -diff
```
Check it with `git check-attr -a ts/src/games/house_of_kings_collab/server/bundle.js`; the prototype printed `diff: unset` and `linguist-generated: true`.

**Step 3: the test.** Create `ts/tests/test_house_of_kings_cleanup.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_house_of_kings_cleanup.ts
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const root = (rel: string) => new URL(`../../${rel}`, import.meta.url);

describe('test_house_of_kings_cleanup', () => {
  it('the player-facing shell carries no development-phase footer', () => {
    const app = readFileSync(root('ts/src/games/house_of_kings_collab/App.tsx'), 'utf8');
    expect(app).not.toContain('Phase 1 First Real Content');
    expect(app).not.toContain('August 2026');
    expect(app).not.toContain('footer={');
  });

  it('the generated server bundle is marked as generated and hidden from diffs', () => {
    const attributes = readFileSync(root('.gitattributes'), 'utf8');
    expect(attributes).toContain('ts/src/games/house_of_kings_collab/server/bundle.js linguist-generated=true -diff');
  });

  it('the Dockerfile still copies the bundle it needs', () => {
    expect(existsSync(root('ts/src/games/house_of_kings_collab/server/bundle.js'))).toBe(true);
    const dockerfile = readFileSync(root('ts/src/games/house_of_kings_collab/server/Dockerfile'), 'utf8');
    expect(dockerfile).toContain('COPY bundle.js ./bundle.js');
  });
});
```

## 4. What NOT to do

- Do not delete, move, regenerate or edit `ts/src/games/house_of_kings_collab/server/bundle.js`, the Dockerfile, or anything under `ts/src/games/house_of_kings_collab/server/`. Do not run `git rm --cached` on it.
- Do not change the landing page, the signed-in views, the `Phase 10/11/14/15/16` labels inside them, `config.ts` (blurb and status stay), the admin gate, or the Firebase files.
- No hosting, deploy or Cloud Run work, no backend changes, no signed-out demo mode with fake data, no Lua, no engine changes, no protected repos, no player layer or cloud saves.
- Do not touch `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

Baseline, real, before editing (origin/main `afb1cefe`): `cd ts && npx vitest run test_house_of_kings` gives `Test Files  3 passed (3)` / `Tests  34 passed (34)`.
With the new test file in place but `App.tsx` unchanged, the footer test fails (`1 failed | 36 passed (37)`); that is the test doing its job.

After editing:
```
cd ts && npx vitest run test_house_of_kings
```
Real tail from the prototype of exactly these edits: `Test Files  4 passed (4)` / `Tests  37 passed (37)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; none mentions `house_of_kings_collab` (leaving the `Sparkles` import would add a 5th error, an unused import).

Controller step, not this run: screenshot of the signed-out landing page at 1280x720 and 390x844 (footer gone).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]` (and `uv run pytest ...` where named below). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`, any `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- Match each file's existing line endings (the Edit tool preserves them); do not convert.
- `examples/` folders are AI Studio exports (untrusted code). New logic goes in small new modules; no file over 600 lines unless it already is (then do not grow it by more than the lines named here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `App.tsx` has no `footer` prop and no `Sparkles` import; the root `.gitattributes` holds the one line; `server/bundle.js` is untouched and still tracked.
- [ ] `cd ts && npx vitest run test_house_of_kings` passes: 4 files, 37 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether any quoted line differed from the file. Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`, plus the `git check-attr` output.
Then say plainly that the bundle stays tracked (marked generated, not removed) and why, and what was not run (screenshots).

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/queue-sync4 |
| Base branch | - |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review: already merged on main via PR #175 (81d58d1b); row sync only, no code change
<!-- queue:end -->
