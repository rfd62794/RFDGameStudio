# Derby Sim: Continue vs New Game on the title, and a standalone build script

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/horse_racing/App.tsx` (the `SAVE_KEY` line near line 24, the save-loading `useEffect` near lines 165-190, `handleNewGame` near line 193, the title screen near line 515),
`ts/src/standalone/chimera_wilds/entry.tsx` and `ts/vite.chimera_wilds.config.ts` (the pattern for a Lua-backed standalone), `ts/tests/test_horse_racing_polish.ts` (existing; must stay green and unchanged),
`docs/demos/horse_racing/DIRECTION.md` (Replan Phase 1).

## 1. Why this exists

Two Tier A gaps (`docs/superpowers/specs/2026-10-03-demo-polish-standard.md` A3 and A7), both listed in `docs/demos/horse_racing/DIRECTION.md`:

1. **No real reset.** The title's "New Game" button only dismisses the title (`handleNewGame` sets `showTitle` false and maybe shows the tutorial); it never clears the saved career in `localStorage` key `derby_sim_state_v1`.
   A player with a bad save (for example the bankrupt loop) has no honest way to start over, and a returning player sees "New Game" when they mean "Continue".
2. **No `build:horse_racing`.** `ts/package.json` has no such script, so the demo cannot be built standalone like `build:chimera_wilds`.

Measured on origin/main `889dd21e`: `ts/package.json` line 13 is `"build:chimera_wilds": "vite build --config vite.chimera_wilds.config.ts",` and there is no horse_racing script;
the title today (`App.tsx`): `menuItems={[ { id: 'new-game', label: 'New Game', variant: 'primary', onClick: handleNewGame }, ]}`.
`vite.chimera_wilds.config.ts` is `makeStandaloneConfig('chimera_wilds')`; Derby Sim is Lua-backed the same way (`games/horse_racing/` has `data.yaml`, `ui.yaml`, `systems.yaml`, `logic.lua`), so its standalone entry is the chimera entry with the game id swapped (the two files differ only in that id; verified by `diff`).
A prototype of this whole change was built by the author with `npm run build:horse_racing`: it printed `built in 13.30s` and wrote `ts/dist-horse_racing/` (gitignored). You do not run builds; the controller does.

## 2. Scope

1. New module `<!-- new: ts/src/games/horse_racing/utils/careerSave.ts -->` (the save key moves here, plus two small helpers).
2. `ts/src/games/horse_racing/App.tsx`: import the key, drop the local constant, add `Continue` / confirmed `New Game`.
3. Build wiring: `ts/package.json` (one script line), new `<!-- new: ts/vite.horse_racing.config.ts -->`, new `<!-- new: ts/src/standalone/horse_racing/entry.tsx -->`, new `<!-- new: ts/src/standalone/horse_racing/index.html -->`.
4. New test `<!-- new: ts/tests/test_horse_racing_new_game.ts -->`.

## 3. The work

**Step 1.** Create `<!-- new: ts/src/games/horse_racing/utils/careerSave.ts -->` with exactly:

```ts
import { clearSave, loadSave } from '../../../engine/shared/persistence';

export const SAVE_KEY = 'derby_sim_state_v1';

/** True when a usable career is saved (at least one horse). */
export function hasSavedCareer(): boolean {
  const saved = loadSave<{ horses?: unknown }>(SAVE_KEY);
  return saved !== null && Array.isArray(saved.horses) && saved.horses.length > 0;
}

/** Erase the saved career. The tutorial-seen flag is a separate key and is kept. */
export function wipeSavedCareer(): void {
  clearSave(SAVE_KEY);
}
```

**Step 2.** Apply exactly this diff to `ts/src/games/horse_racing/App.tsx` and `ts/package.json` (context lines are real; if one differs, STOP and say so in the Status row; both files use CRLF line endings, keep them):

```diff
diff --git a/ts/package.json b/ts/package.json
index 17ae41d3..f37501b6 100644
--- a/ts/package.json
+++ b/ts/package.json
@@ -11,6 +11,7 @@
     "build:shoal:y8": "vite build --config vite.shoal.config.ts --mode y8",
     "build:slimeworld": "vite build --config vite.slimeworld.config.ts",
     "build:chimera_wilds": "vite build --config vite.chimera_wilds.config.ts",
+    "build:horse_racing": "vite build --config vite.horse_racing.config.ts",
     "build:mutant_battle_ball": "vite build --config vite.mutant_battle_ball.config.ts",
     "build:scrapcrawl": "vite build --config vite.scrapcrawl.config.ts",
     "build:slime_coin": "vite build --config vite.slime_coin.config.ts",
diff --git a/ts/src/games/horse_racing/App.tsx b/ts/src/games/horse_racing/App.tsx
index 64e02c87..e17e5e72 100644
--- a/ts/src/games/horse_racing/App.tsx
+++ b/ts/src/games/horse_racing/App.tsx
@@ -11,6 +11,7 @@ import { loadSave, writeSave } from '../../engine/shared/persistence';
 import { navigateTo } from '../../arcade/routing';
 import { STANDALONE_BUILD_GAMES } from '../../games/registry';
 import { sound } from './utils/sound';
+import { SAVE_KEY, hasSavedCareer, wipeSavedCareer } from './utils/careerSave';
 import StableTab from './components/StableTab';
 import BettingTab from './components/BettingTab';
 import BreederTab from './components/BreederTab';
@@ -21,7 +22,6 @@ import { TitleScreen } from '../../ui/components/TitleScreen';
 import { resolveViewport, buildBoundsMap, type LayoutNode } from '../../engine/ui_resolver';
 import { interpretLayout, type RegionsMap } from '../../engine/ui_interpreter';
 
-const SAVE_KEY = 'derby_sim_state_v1';
 const TUTORIAL_SEEN_KEY = 'derby_sim_tutorial_seen';
 
 interface DerbySave {
@@ -150,6 +150,8 @@ export default function App({ session }: GameRendererProps) {
   const [error, setError] = useState<string | null>(null);
   const [gameState, setGameState] = useState<GameState | null>(null);
   const [showTitle, setShowTitle] = useState(true);
+  const [hasSave] = useState<boolean>(() => hasSavedCareer());
+  const [confirmingNewGame, setConfirmingNewGame] = useState(false);
   const [activeTab, setActiveTab] = useState<string>('stable');
   const [isRacingActive, setIsRacingActive] = useState(false);
   const [pendingBets, setPendingBets] = useState<Bet[]>([]);
@@ -204,6 +206,20 @@ export default function App({ session }: GameRendererProps) {
     }
   }, [triggerTutorial]);
 
+  // New Game on a title that already has a career: a confirmed wipe, then a fresh stable.
+  const handleStartOver = useCallback(() => {
+    if (!confirmingNewGame) {
+      setConfirmingNewGame(true);
+      return;
+    }
+    const stableCfg = (session.files.data as Record<string, unknown>)['stable'] as Record<string, unknown>;
+    wipeSavedCareer();
+    setUnlockedSlots((stableCfg['starting_slots'] as number) ?? 3);
+    setGameState(buildInitialState(session));
+    setConfirmingNewGame(false);
+    handleNewGame();
+  }, [confirmingNewGame, session, handleNewGame]);
+
   const handleDismissTutorial = useCallback(() => {
     writeSave(TUTORIAL_SEEN_KEY, true);
     completeTutorial();
@@ -519,7 +535,10 @@ export default function App({ session }: GameRendererProps) {
           title="Derby Sim"
           tagline="Race · Breed · Bet"
           pitch="Race, breed, and bet on horses. Win/Place/Show betting, genetics system, career tracking."
-          menuItems={[
+          menuItems={hasSave ? [
+            { id: 'continue', label: 'Continue', variant: 'primary', onClick: handleNewGame },
+            { id: 'new-game', label: confirmingNewGame ? 'Erase my stable and start over?' : 'New Game', variant: confirmingNewGame ? 'danger' : 'secondary', onClick: handleStartOver },
+          ] : [
             { id: 'new-game', label: 'New Game', variant: 'primary', onClick: handleNewGame },
           ]}
         />
```
With a saved career the title shows `Continue` (primary) and `New Game` (secondary). The first click on `New Game` changes its label to "Erase my stable and start over?" (danger style); a second click wipes the save and starts a fresh stable; any other action leaves the save alone.
Without a save the title is unchanged: one `New Game` button.

**Step 3.** Create `<!-- new: ts/vite.horse_racing.config.ts -->` with exactly:
```ts
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig('horse_racing');
```

**Step 4.** Create `<!-- new: ts/src/standalone/horse_racing/entry.tsx -->` with exactly:
```tsx
import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/horse_racing/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/horse_racing/data.yaml?raw';
import uiRaw from '../../../../games/horse_racing/ui.yaml?raw';
import systemsRaw from '../../../../games/horse_racing/systems.yaml?raw';

const gameLuaModules = import.meta.glob('../../../../games/horse_racing/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toGameLuaFiles(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    out[modulePath.split('/').pop()!] = content;
  }
  return out;
}

const engineLuaModules = import.meta.glob('../../../../engine/primitives/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const engineSystemModules = import.meta.glob('../../../../engine/systems/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toEngineLuaFiles(
  modules: Record<string, string>,
  subdir: string
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    const fileName = modulePath.split('/').pop()!;
    out[`${subdir}/${fileName}`] = content;
  }
  return out;
}

const gameId = 'horse_racing';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: toGameLuaFiles(gameLuaModules),
  engineLuaFiles: {
    ...toEngineLuaFiles(engineLuaModules, 'primitives'),
    ...toEngineLuaFiles(engineSystemModules, 'systems'),
  },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
```

**Step 5.** Create `<!-- new: ts/src/standalone/horse_racing/index.html -->` with exactly:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Derby Sim</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.tsx"></script>
  </body>
</html>
```

**Step 6.** Create `<!-- new: ts/tests/test_horse_racing_new_game.ts -->` with exactly:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SAVE_KEY, hasSavedCareer, wipeSavedCareer } from '../src/games/horse_racing/utils/careerSave';

const appSource = readFileSync(resolve(import.meta.dirname, '../src/games/horse_racing/App.tsx'), 'utf8');
const root = resolve(import.meta.dirname, '..');

describe('horse_racing Continue / New Game', () => {
  beforeEach(() => localStorage.clear());

  it('uses the same save key the game has always used', () => {
    expect(SAVE_KEY).toBe('derby_sim_state_v1');
  });

  it('hasSavedCareer is false with no save or an empty stable, true with a horse', () => {
    expect(hasSavedCareer()).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ funds: 5, horses: [], race_history: [], unlocked_slots: 3 }));
    expect(hasSavedCareer()).toBe(false);
    localStorage.setItem(SAVE_KEY, '{broken');
    expect(hasSavedCareer()).toBe(false);
    localStorage.setItem(SAVE_KEY, JSON.stringify({ funds: 5, horses: [{ id: 'h1' }], race_history: [], unlocked_slots: 3 }));
    expect(hasSavedCareer()).toBe(true);
  });

  it('wipeSavedCareer clears the career but keeps the tutorial-seen flag', () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ horses: [{ id: 'h1' }] }));
    localStorage.setItem('derby_sim_tutorial_seen', 'true');
    wipeSavedCareer();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    expect(hasSavedCareer()).toBe(false);
    expect(localStorage.getItem('derby_sim_tutorial_seen')).toBe('true');
  });

  it('the title offers Continue and a two-step New Game when a career exists', () => {
    expect(appSource).toContain("id: 'continue', label: 'Continue'");
    expect(appSource).toContain('Erase my stable and start over?');
    expect(appSource).toContain('wipeSavedCareer()');
    expect(appSource).toContain('const handleStartOver');
  });

  it('a first-time player still sees a single New Game button', () => {
    expect(appSource).toContain("{ id: 'new-game', label: 'New Game', variant: 'primary', onClick: handleNewGame }");
  });

  it('has a standalone build wired: script, vite config, entry and page', () => {
    const pkg = readFileSync(resolve(root, 'package.json'), 'utf8');
    expect(pkg).toContain('"build:horse_racing": "vite build --config vite.horse_racing.config.ts"');
    expect(readFileSync(resolve(root, 'vite.horse_racing.config.ts'), 'utf8')).toContain("makeStandaloneConfig('horse_racing')");
    const entry = readFileSync(resolve(root, 'src/standalone/horse_racing/entry.tsx'), 'utf8');
    expect(entry).toContain("import App from '../../games/horse_racing/App'");
    expect(entry).toContain("const gameId = 'horse_racing'");
    expect(readFileSync(resolve(root, 'src/standalone/horse_racing/index.html'), 'utf8')).toContain('<title>Derby Sim</title>');
  });
});
```

## 4. What NOT to do

- Do not change `logic.lua`, `data.yaml`, `ui.yaml`, `systems.yaml`, any engine Lua (no Lua additions), game rules, cooldowns, or odds.
- Do not change the status label here (a separate directive owns it) or the registry blurb.
- Do not edit `ts/tests/test_horse_racing_polish.ts`; do not run `npm run build:horse_racing` (the sandbox refuses builds; the controller runs it).
- Do not clear `derby_sim_tutorial_seen` when wiping the career.
- Do not touch the bankruptcy flow, `emergency_grant_shown`, or `docs/children.json`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline, before editing (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_horse_racing_polish.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  10 passed (10)`.

After editing (verified on a prototype of exactly this change):
```
cd ts && npx vitest run test_horse_racing_new_game.ts test_horse_racing_polish.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  16 passed (16)`.

Type check:
```
cd ts && npx tsc --noEmit
```
Real baseline and prototype result are identical: 4 errors, all `Cannot find module '../games/game-metadata.json'` (a generated file absent from a fresh worktree). Any error mentioning `horse_racing` is yours: fix it.

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

- [ ] The seven files in Scope exist or are changed exactly as specified; nothing else changed.
- [ ] `cd ts && npx vitest run test_horse_racing_new_game.ts test_horse_racing_polish.ts` shows 2 files, 16 tests passed (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files changed and created. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: the build and the click-through were not run in this sandbox. Controller finish: Robert or Claude runs `cd ts && npm run build:horse_racing` (expected to exit 0 and print `built in`), opens the build, checks Continue and the two-step New Game with and without a save, and takes the title screenshot.
Recommended action: review, merge, then the controller's build and check.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.
