# House of Kings: Collab: a static How it works exhibit on the signed-out landing page

**Depends on:** House_Of_Kings_Collab_Footer_And_Bundle_Marker_Directive.md only for the test counts in Verification (the files do not overlap; either order works)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/house_of_kings_collab/DIRECTION.md` (Replan item 2), `ts/src/games/house_of_kings_collab/ARCHITECTURE.md` (section 1, lines 11-55), `ts/src/games/house_of_kings_collab/components/LandingPage.tsx` (lines 1-30 and 100-125),
`ts/tests/test_house_of_kings_blurb.ts` (test pattern).

## 1. Why this exists

A visitor to House of Kings: Collab sees a landing page and a "Sign in with Google" button; whether the backend exists is unknowable from the repo, so a signed-out visitor may be able to do nothing else (`docs/demos/house_of_kings_collab/DIRECTION.md`: "the only action is a login to a service that may not exist"). The game is parked as an architecture showcase (Robert approved the PARK verdict, 2026-10-04),
and the thing worth showing is the idea in `ts/src/games/house_of_kings_collab/ARCHITECTURE.md` section 1: visit-triggered evaluation instead of server background timers. Today the landing page (`ts/src/games/house_of_kings_collab/components/LandingPage.tsx`, 203 lines) describes gameplay ("Kingdom Gameplay Loop") and implementation jargon ("zero-trust server validation", "Atomic Firestore Locks"), but nothing explains the idea in plain words.
Decision (direction item 2): add a static "How it works behind the scenes" exhibit to the landing page, needing no sign-in and no backend. Measured on origin/main `afb1cefe`.

Facts you need (verified; do not re-derive):
- `LandingPage` is rendered by `AuthModal` (`ts/src/games/house_of_kings_collab/components/AuthModal.tsx`) when the user is signed out. It imports icons from `lucide-react` and renders a hero card, then `{/* Feature Architecture Grid */}`, then a `Kingdom Gameplay Loop` block.
- The source idea (ARCHITECTURE.md section 1): every request checks a `lastResolvedAt` timestamp; if 24 hours have passed, one Firestore transaction settles the day (scores, counters, timestamp); concurrent requests see the new timestamp and skip it; no `setInterval`, so nothing runs or costs while the container idles.
- Tests for `.tsx` files in `ts/tests/` exist (for example `test_ui_shared_templates.tsx`); a server-render test needs no DOM: `renderToStaticMarkup` from `react-dom/server` (installed).
- Baseline, real: `cd ts && npx vitest run test_house_of_kings` gives `Test Files  3 passed (3)` / `Tests  34 passed (34)` on origin/main; after the Footer directive it is 4 files / 37 tests.

## 2. Scope

1. New `<!-- new: ts/src/games/house_of_kings_collab/howItWorks.ts -->` (the copy as data) and `<!-- new: ts/src/games/house_of_kings_collab/components/HowItWorks.tsx -->`.
2. `ts/src/games/house_of_kings_collab/components/LandingPage.tsx`: one import and one element.
3. New test `<!-- new: ts/tests/test_house_of_kings_how_it_works.tsx -->`.

## 3. The work

`LandingPage.tsx` is a CRLF file; keep its endings. New files use CRLF too.

**Step 1: `howItWorks.ts`.** Create with exactly:

```ts
// new: ts/src/games/house_of_kings_collab/howItWorks.ts

export interface HowItWorksStep {
  title: string;
  body: string;
}

export const HOW_IT_WORKS_HEADING = 'How it works behind the scenes';

export const HOW_IT_WORKS_INTRO =
  'House of Kings is an exhibit of how to build a shared kingdom game that costs nothing while nobody is playing. Here is the trick, in three steps.';

/** Distilled from ARCHITECTURE.md, section 1 (visit-triggered evaluation). No timers run in the background. */
export const HOW_IT_WORKS_STEPS: ReadonlyArray<HowItWorksStep> = [
  {
    title: 'You visit the kingdom',
    body: 'Each time someone opens the kingdom, the server checks one timestamp: when did this kingdom last settle its day?',
  },
  {
    title: 'The server settles the day, once',
    body: 'If a full day has passed, one safe transaction settles it: scores update, daily counters reset and the clock moves forward. If a hundred players arrive at the same moment, only one settlement happens.',
  },
  {
    title: 'Everyone sees the same result',
    body: 'Nothing runs in the background, so there is nothing to forget, repeat or pay for while the kingdom sleeps.',
  },
];

export const HOW_IT_WORKS_NOTE =
  'This page is an exhibit. Signing in needs its own hosted backend, so you may not be able to play.';
```

**Step 2: `ts/src/games/house_of_kings_collab/components/HowItWorks.tsx`.** Create with exactly:

```tsx
// new: ts/src/games/house_of_kings_collab/components/HowItWorks.tsx
import React from 'react';
import { HOW_IT_WORKS_HEADING, HOW_IT_WORKS_INTRO, HOW_IT_WORKS_STEPS, HOW_IT_WORKS_NOTE } from '../howItWorks';

/** Static exhibit: needs no sign-in and no backend. */
export const HowItWorks: React.FC = () => (
  <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5" aria-labelledby="hok-how-it-works">
    <h2 id="hok-how-it-works" className="text-xl sm:text-2xl font-bold text-amber-100">
      {HOW_IT_WORKS_HEADING}
    </h2>
    <p className="text-sm text-slate-300 leading-relaxed">{HOW_IT_WORKS_INTRO}</p>
    <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
      {HOW_IT_WORKS_STEPS.map((step, i) => (
        <li key={step.title} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <span className="w-6 h-6 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-xs">
            {i + 1}
          </span>
          <span className="font-bold text-slate-200 block">{step.title}</span>
          <p className="text-slate-400">{step.body}</p>
        </li>
      ))}
    </ol>
    <p className="text-xs text-slate-500">{HOW_IT_WORKS_NOTE}</p>
  </section>
);
```

**Step 3: `LandingPage.tsx`.** Apply this prototype diff (context lines are unchanged):

```diff
--- a/ts/src/games/house_of_kings_collab/components/LandingPage.tsx
+++ b/ts/src/games/house_of_kings_collab/components/LandingPage.tsx
@@ -17,6 +17,7 @@ import {
   Clock,
   Lock,
 } from 'lucide-react';
+import { HowItWorks } from './HowItWorks';
 
 interface LandingPageProps {
   onSignedIn?: () => void;
@@ -102,6 +103,9 @@ export const LandingPage: React.FC<LandingPageProps> = () => {
         </div>
       </div>
 
+      {/* Static exhibit: works without sign-in or a backend */}
+      <HowItWorks />
+
       {/* Feature Architecture Grid */}
       <div className="space-y-6">
         <div className="text-center space-y-2">
```

**Step 4: the test.** Create `ts/tests/test_house_of_kings_how_it_works.tsx` with exactly:

```tsx
// @vitest-environment node
// new: ts/tests/test_house_of_kings_how_it_works.tsx
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { HowItWorks } from '../src/games/house_of_kings_collab/components/HowItWorks';
import {
  HOW_IT_WORKS_HEADING, HOW_IT_WORKS_INTRO, HOW_IT_WORKS_STEPS, HOW_IT_WORKS_NOTE,
} from '../src/games/house_of_kings_collab/howItWorks';

describe('test_house_of_kings_how_it_works', () => {
  it('renders the heading, three numbered steps and the honest note without any sign-in', () => {
    const html = renderToStaticMarkup(<HowItWorks />);
    expect(html).toContain(HOW_IT_WORKS_HEADING);
    expect(HOW_IT_WORKS_STEPS.length).toBe(3);
    for (const step of HOW_IT_WORKS_STEPS) {
      expect(html).toContain(step.title);
    }
    expect(html).toContain(HOW_IT_WORKS_NOTE);
  });

  it('copy is plain player language: no internal markers and no jargon', () => {
    const text = [HOW_IT_WORKS_HEADING, HOW_IT_WORKS_INTRO, HOW_IT_WORKS_NOTE, ...HOW_IT_WORKS_STEPS.flatMap((s) => [s.title, s.body])].join(' ');
    for (const marker of ['TODO', 'TBD', 'LEAST-VERIFIED', 'fabricated']) {
      expect(text).not.toContain(marker);
    }
    for (const jargon of ['zero-trust', 'Admin SDK', 'Firestore', 'setInterval', 'Cloud Run']) {
      expect(text.toLowerCase()).not.toContain(jargon.toLowerCase());
    }
  });

  it('the signed-out landing page includes the exhibit', () => {
    const landing = readFileSync(new URL('../src/games/house_of_kings_collab/components/LandingPage.tsx', import.meta.url), 'utf8');
    expect(landing).toContain("import { HowItWorks } from './HowItWorks';");
    expect(landing).toContain('<HowItWorks />');
  });
});
```

## 4. What NOT to do

- Do not add a link to a write-up: none exists yet (the blog is Robert's); when it does he adds one line. Do not invent a URL.
- Do not change the hero, the sign-in button, the signed-in views, `config.ts`, the admin gate, the server, the Dockerfile, or Firebase files. Do not edit `ARCHITECTURE.md`.
- No backend call, no fake or demo data, no signed-out "demo mode" (that would be a rewrite), no hosting or Cloud Run work.
- No Lua, no engine changes, no deploys or rebuilds, no protected repos, no player layer or cloud saves. Do not touch `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_house_of_kings_how_it_works.tsx
```
Real tail from the prototype of exactly these edits: `Test Files  1 passed (1)` / `Tests  3 passed (3)`. With the new files but `LandingPage.tsx` unchanged, the landing-page test fails with `expected 'import React, { useState } from ...' to contain 'import { HowItWorks } ...'`, as intended.
```
cd ts && npx vitest run test_house_of_kings
```
Real tail from the prototype on top of the Footer directive: `Test Files  5 passed (5)` / `Tests  40 passed (40)`.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; none mentions `house_of_kings_collab` (a stray `import React` in the test would add a `TS6133` error, so keep it out).

Controller step, not this run: screenshot of the signed-out landing page at 1280x720 and 390x844 with the new section.

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

- [ ] `howItWorks.ts`, `ts/src/games/house_of_kings_collab/components/HowItWorks.tsx` and the test exist with the exact content above; `LandingPage.tsx` matches the prototype diff.
- [ ] `cd ts && npx vitest run test_house_of_kings` passes: 5 files, 40 tests with the Footer directive merged (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether any quoted line differed from the file. Evidence second: real tails of `uv run python --version`, the vitest commands and `tsc --noEmit`.
Then say plainly what was not run (screenshots) and that there is deliberately no write-up link yet.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, the demo-lists snapshot fixture under `tests/fixtures/`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin-tower |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
- 2026-10-08 17:49 · robert-claude-laptop · Queued → Approved — dispatch deferred to work-tower
<!-- queue:end -->
