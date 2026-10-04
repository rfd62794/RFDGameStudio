# Shoal: reef report on the extinction screen, and an honest "not saved" note (Size M)

**Depends on:** none (this run edits `App.tsx` and `TitleScreen.tsx`; the headless-test directive edits only tests). **Why Shoal:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `shoal` (Replan items 1 and 3).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/shoal/DIRECTION.md` (Replan 1 and 3), `ts/src/games/shoal/App.tsx` (lines 150-200 and 285-325), `ts/src/games/shoal/components/TitleScreen.tsx` (lines 72-110), `ts/src/ui/components/EndStateScreen.tsx` (props, lines 11-22).

## 1. Why this exists

Two gaps in the reef, both found in `docs/demos/shoal/DIRECTION.md`:

1. A visit has no receipt. When every fish and shark is gone, `App.tsx` shows `EndStateScreen` with four numbers (ticks, peak fish, peak sharks, seed) and a flavour line that says nothing about what happened or what to try next. A 30-second visitor leaves with no "I did something" feeling.
2. Nothing says the reef is not saved. Only the first-run tutorial flag is persisted (`loadSave`/`writeSave` of `shoal_tutorial_seen`); a reload silently loses the reef.

This run adds a small pure module that builds a friendlier report (more numbers, plus one sentence about what happened and one idea to try), wires it into the existing extinction screen, and adds one honest line to the title screen.
No new mechanics, no new entities, no saving (the cheaper label option was chosen in DIRECTION.md).

Current extinction-screen code in `ts/src/games/shoal/App.tsx` (lines 290-318):

```tsx
        <EndStateScreen
          won={false}
          headline="The Reef Went Silent"
          flavorLine="No fish, no sharks — just empty water and the algae waiting for whatever you seed next."
          stats={[
            { label: 'Ticks Survived', value: endSnapshot.ticks },
            { label: 'Peak Fish', value: endSnapshot.peakFish },
            { label: 'Peak Sharks', value: endSnapshot.peakSharks },
            { label: 'Seed', value: endSnapshot.seed },
          ]}
          onRestart={handleReplay}
          restartLabel="Seed a New Reef"
        />
```

## 2. Scope

1. New module `<!-- new: ts/src/games/shoal/utils/reefReport.ts -->`: `buildReefReport`.
2. `ts/src/games/shoal/App.tsx`: track the peak algae count, store the algae left, use the report on the extinction screen.
3. `ts/src/games/shoal/components/TitleScreen.tsx`: one added paragraph.
4. New test `<!-- new: ts/tests/test_shoal_reef_report.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/shoal/utils/reefReport.ts`** with exactly this content:

```ts
// new: ts/src/games/shoal/utils/reefReport.ts
/** What the player sees when a reef goes silent: a short report and one thing to try next. */
export interface ReefEndSnapshot {
  seed: number;
  ticks: number;
  peakFish: number;
  peakSharks: number;
  peakAlgae: number;
  endAlgae: number;
}

export interface ReefReportStat {
  label: string;
  value: number;
}

export interface ReefReport {
  stats: ReefReportStat[];
  /** One sentence: what happened and one idea for the next reef. */
  nudge: string;
}

export function buildReefReport(s: ReefEndSnapshot): ReefReport {
  let nudge: string;
  if (s.endAlgae === 0) {
    nudge = 'The algae ran out before the school did. Next time, seed algae near the fish early.';
  } else if (s.peakSharks * 4 >= s.peakFish) {
    nudge = 'The sharks outpaced the school. Try a Lush Garden, or drop fewer sharks.';
  } else {
    nudge = 'The school faded with algae to spare. Try dropping fish into open water to restart the cycle.';
  }
  return {
    stats: [
      { label: 'Ticks Survived', value: s.ticks },
      { label: 'Peak Fish', value: s.peakFish },
      { label: 'Peak Sharks', value: s.peakSharks },
      { label: 'Peak Algae', value: s.peakAlgae },
      { label: 'Algae Left', value: s.endAlgae },
      { label: 'Seed', value: s.seed },
    ],
    nudge,
  };
}
```

**Step 2: edit `App.tsx` and `TitleScreen.tsx`.** Both files use CRLF; the Edit tool keeps it. Apply exactly this diff (context lines are for locating; do not change anything else):

```diff
diff --git a/ts/src/games/shoal/App.tsx b/ts/src/games/shoal/App.tsx
index cb16ae00..c43bd6ab 100644
--- a/ts/src/games/shoal/App.tsx
+++ b/ts/src/games/shoal/App.tsx
@@ -17,2 +17,4 @@ import { sound } from './utils/sound';
 import { detectReefEvents } from './utils/reefEvents';
+import { buildReefReport } from './utils/reefReport';
+import type { ReefEndSnapshot } from './utils/reefReport';
 import { clientToCanvas, clientToWorld } from './utils/pointerWorld';
@@ -156,8 +158,3 @@ export default function App({ session }: GameRendererProps) {
   const [reefEnded, setReefEnded] = useState(false);
-  const [endSnapshot, setEndSnapshot] = useState<{
-    seed: number;
-    ticks: number;
-    peakFish: number;
-    peakSharks: number;
-  } | null>(null);
+  const [endSnapshot, setEndSnapshot] = useState<ReefEndSnapshot | null>(null);
   const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
@@ -170,3 +167,3 @@ export default function App({ session }: GameRendererProps) {
   const lifeSeenRef = useRef(false);
-  const peaksRef = useRef({ fish: 0, sharks: 0 });
+  const peaksRef = useRef({ fish: 0, sharks: 0, algae: 0 });
 
@@ -176,2 +173,3 @@ export default function App({ session }: GameRendererProps) {
     if (s.shark_count > peaksRef.current.sharks) peaksRef.current.sharks = s.shark_count;
+    if (s.algae_count > peaksRef.current.algae) peaksRef.current.algae = s.algae_count;
     if (s.fish_count + s.shark_count > 0) {
@@ -185,2 +183,4 @@ export default function App({ session }: GameRendererProps) {
         peakSharks: peaksRef.current.sharks,
+        peakAlgae: peaksRef.current.algae,
+        endAlgae: s.algae_count,
       });
@@ -193,3 +193,3 @@ export default function App({ session }: GameRendererProps) {
     lifeSeenRef.current = false;
-    peaksRef.current = { fish: 0, sharks: 0 };
+    peaksRef.current = { fish: 0, sharks: 0, algae: 0 };
     setReefEnded(false);
@@ -290,2 +290,3 @@ export default function App({ session }: GameRendererProps) {
   if (reefEnded && endSnapshot) {
+    const report = buildReefReport(endSnapshot);
     return (
@@ -308,9 +309,4 @@ export default function App({ session }: GameRendererProps) {
           headline="The Reef Went Silent"
-          flavorLine="No fish, no sharks — just empty water and the algae waiting for whatever you seed next."
-          stats={[
-            { label: 'Ticks Survived', value: endSnapshot.ticks },
-            { label: 'Peak Fish', value: endSnapshot.peakFish },
-            { label: 'Peak Sharks', value: endSnapshot.peakSharks },
-            { label: 'Seed', value: endSnapshot.seed },
-          ]}
+          flavorLine={`No fish, no sharks left. ${report.nudge}`}
+          stats={report.stats}
           onRestart={handleReplay}
diff --git a/ts/src/games/shoal/components/TitleScreen.tsx b/ts/src/games/shoal/components/TitleScreen.tsx
index 0ce14583..1528b705 100644
--- a/ts/src/games/shoal/components/TitleScreen.tsx
+++ b/ts/src/games/shoal/components/TitleScreen.tsx
@@ -105,2 +105,5 @@ export default function TitleScreen({ session, onStart, onHowToPlay }: TitleScre
           </p>
+          <p className="shoal-title-hint" data-testid="shoal-session-note">
+            Your reef is not saved. It lives in this tab until you leave or start a new one.
+          </p>
         </div>
```

**Step 3: create `ts/tests/test_shoal_reef_report.tsx`** with exactly this content:

```tsx
// new: ts/tests/test_shoal_reef_report.tsx
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { buildReefReport } from '../src/games/shoal/utils/reefReport';

vi.mock('../src/games/shoal/components/ReefPreview', () => ({
  default: () => null,
}));

import TitleScreen from '../src/games/shoal/components/TitleScreen';

const base = { seed: 7, ticks: 1200, peakFish: 80, peakSharks: 4, peakAlgae: 60, endAlgae: 25 };

describe('buildReefReport', () => {
  it('lists six stats in a fixed order', () => {
    const r = buildReefReport(base);
    expect(r.stats.map((s) => s.label)).toEqual([
      'Ticks Survived',
      'Peak Fish',
      'Peak Sharks',
      'Peak Algae',
      'Algae Left',
      'Seed',
    ]);
    expect(r.stats.map((s) => s.value)).toEqual([1200, 80, 4, 60, 25, 7]);
  });

  it('no algae left: the nudge is about seeding algae', () => {
    expect(buildReefReport({ ...base, endAlgae: 0 }).nudge).toContain('algae ran out');
  });

  it('many sharks for the school size: the nudge is about the sharks', () => {
    expect(buildReefReport({ ...base, peakFish: 20, peakSharks: 8 }).nudge).toContain('sharks outpaced');
  });

  it('otherwise: the nudge is about dropping fish into open water', () => {
    expect(buildReefReport(base).nudge).toContain('dropping fish');
  });
});

describe('Shoal title screen session note', () => {
  it('tells the player the reef is not saved', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<TitleScreen session={undefined as never} onStart={() => {}} onHowToPlay={() => {}} />);
    });
    const note = container.querySelector('[data-testid="shoal-session-note"]');
    expect(note?.textContent).toContain('is not saved');
    root.unmount();
  });
});
```

## 4. What NOT to do

- No new simulation code, no change to `shoalSimulation.ts`, `types.ts` or the sim's `Stats` shape (the report uses the existing `fish_count`, `shark_count`, `algae_count`, `seed`).
- No saving of reef state (no `writeSave` beyond the existing tutorial flag): the label is the chosen option.
- Do not add lineage counts, new entities, or new buttons. Do not change the "Seed a New Reef" label or the "The Reef Went Silent" headline (other tests assert them).
- Player-facing text stays plain and encouraging: no words like phase, directive, tick-rate or gameId in new strings.
- Do not edit any `test_shoal_*` file except creating the new one. No Lua, no engine changes, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`; no Python is changed).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_shoal_chrome_polish.ts test_shoal_new_reef_control.ts test_shoal_config.ts
```
Real tail: `Test Files  3 passed (3)` / `Tests  48 passed (48)` (25 + 7 + 16).

After editing:
```
cd ts && npx vitest run test_shoal_reef_report.tsx test_shoal_chrome_polish.ts test_shoal_new_reef_control.ts test_shoal_config.ts
```
Expected (verified on the prototype): `Test Files  4 passed (4)` / `Tests  53 passed (53)` (5 new). Those source-text tests still pass because the strings they look for are untouched; if the headless-test directive merged first, the chrome-polish count is lower, so compare "all passed", not the number.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

The visual check (screenshots at 1280 and 390 px) needs a browser and a build, so it is the controller's step after merge: say so under Controller finish in your report. Do not try to run a browser.

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

- [ ] `reefReport.ts` and `test_shoal_reef_report.tsx` exist as above; `App.tsx` uses `buildReefReport`; `TitleScreen.tsx` has the `shoal-session-note` paragraph.
- [ ] The three-file baseline command and the four-file after command pass (real tails pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git diff --stat` shows only the four files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files and the new test count. Evidence second: real tails of the vitest and tsc commands. Controller finish: Playwright screenshots of the extinction screen at 1280 and 390 px (the six-stat row must not overflow at 390), and a build (`npm run build:shoal`), both after merge. Recommended action: review, merge.

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
| Branch | directive/shoal-reef-report |
| Base branch | - |

**Status log**
- 2026-10-04 13:40 · robert-claude-laptop · none → Queued
- 2026-10-04 · devin-cleanroom · Queued → Review — reefReport.ts (6 stats + nudge) wired into extinction screen; peak/end algae tracked; shoal-session-note paragraph added. `npx vitest run test_shoal_reef_report.tsx test_shoal_chrome_polish.ts test_shoal_new_reef_control.ts test_shoal_config.ts` → 4 files / 45 passed (chrome-polish lower per spec allowance: headless-test directive merged); `npx tsc --noEmit` → clean exit 0 with game-metadata.json present. git diff --stat: App.tsx + TitleScreen.tsx only + 2 new files. Controller finish: Playwright screenshots 1280/390px (six-stat row must not overflow at 390), npm run build:shoal after merge.
<!-- queue:end -->
