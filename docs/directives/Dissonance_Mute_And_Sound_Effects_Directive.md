# Dissonance: sound effects with a remembered mute button (Size S)

**Depends on:** none. The shared sound module this uses (`ts/src/engine/shared/sfx/`, from `Polish_Shared_Sfx_Directive`, merged as PR #53) is already on main; verified `ts/src/engine/shared/sfx/index.ts` exists. If the first-fight-hint directive merges first, one line of `App.tsx` (the `GameShell` line) differs from the quoted context; this diff does not touch that line, so apply by intent. **Why Dissonance:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `dissonance` (Replan item 3).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/dissonance/DIRECTION.md` (Replan 3), `ts/src/engine/shared/sfx/index.ts` and `ts/src/engine/shared/sfx/engine.ts` (lines 80-140: `play`, `setMuted`, `autoUnlock`), `ts/src/games/dissonance/App.tsx` (lines 34-60, 137-180, 236-250), `ts/src/games/voiddrift_redux/App.tsx` (lines 125-141: the mute button this copies in spirit).

## 1. Why this exists

Dissonance is silent: `grep` of `App.tsx` and `phases/` finds no sound or mute, and `docs/demos/dissonance/DIRECTION.md` names "silence" as part of its biggest turn-off. The polish standard (Tier B, items B3 feedback and B5 audio) asks for a response to every primary action, a mute control, and a mute choice that survives a reload.
The shared engine (`sfx`) already has named events `click`, `hit`, `win`, `lose` and `pickup` (`ts/src/engine/shared/sfx/events.ts`) and is silent until the player's first click or key press, so autoplay rules are handled.
The engine's own mute is not remembered between visits, and `autoUnlock` unmutes it on the first click, so the player's choice is stored separately and checked before every play. That is why every Dissonance sound goes through one small `playSfx` helper.

## 2. Scope

1. New module `<!-- new: ts/src/games/dissonance/utils/soundPrefs.ts -->`: read and write the saved mute choice.
2. New module `<!-- new: ts/src/games/dissonance/utils/playSfx.ts -->`: play a shared sound unless muted.
3. New component `<!-- new: ts/src/games/dissonance/components/SoundToggle.tsx -->`: the header button.
4. `ts/src/games/dissonance/App.tsx`: unlock sound on mount, play sounds at four moments, always show the toggle.
5. New test `<!-- new: ts/tests/test_dissonance_sound.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/dissonance/utils/soundPrefs.ts`:**

```ts
// new: ts/src/games/dissonance/utils/soundPrefs.ts
import { loadSave, writeSave } from '../../../engine/shared/persistence';

/** localStorage key for the player's choice to mute Dissonance's sound. Default: sound on. */
export const SOUND_MUTED_KEY = 'dissonance_sound_muted';

export function isSoundMuted(): boolean {
  return loadSave<boolean>(SOUND_MUTED_KEY) === true;
}

export function setSoundMuted(muted: boolean): void {
  writeSave(SOUND_MUTED_KEY, muted);
}
```

**Step 2: create `ts/src/games/dissonance/utils/playSfx.ts`:**

```ts
// new: ts/src/games/dissonance/utils/playSfx.ts
import { sfx } from '../../../engine/shared/sfx';
import { isSoundMuted } from './soundPrefs';

/** Plays a shared sound effect unless the player has muted Dissonance. */
export function playSfx(name: string): void {
  if (isSoundMuted()) return;
  sfx.play(name);
}
```

**Step 3: create `ts/src/games/dissonance/components/SoundToggle.tsx`:**

```tsx
// new: ts/src/games/dissonance/components/SoundToggle.tsx
import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../../ui/components';
import { isSoundMuted, setSoundMuted } from '../utils/soundPrefs';

/** Mute button for the header. The choice is remembered between visits. */
export default function SoundToggle() {
  const [muted, setMuted] = useState<boolean>(isSoundMuted);

  const toggle = () => {
    const next = !muted;
    setSoundMuted(next);
    setMuted(next);
  };

  return (
    <Button
      id="dissonance-sound-toggle"
      icon={muted ? <VolumeX style={{ width: '1rem', height: '1rem' }} /> : <Volume2 style={{ width: '1rem', height: '1rem' }} />}
      onClick={toggle}
      variant="neutral"
      size="sm"
      title={muted ? 'Unmute sound' : 'Mute sound'}
    />
  );
}
```

**Step 4: edit `ts/src/games/dissonance/App.tsx`** (the Edit tool keeps its line endings). Apply exactly this diff and nothing else. It plays: a click on New Run, a hit when a card lowers the enemy's health, a plain click when it does not, a win sound when a fight or the run is won, a lose sound when the run is lost, and a pickup sound when rewards are claimed. It also makes the header area always render (it used to be empty on the title screen), so the mute button is reachable everywhere:

```diff
diff --git a/ts/src/games/dissonance/App.tsx b/ts/src/games/dissonance/App.tsx
index e689b2df..b14620db 100644
--- a/ts/src/games/dissonance/App.tsx
+++ b/ts/src/games/dissonance/App.tsx
@@ -7,3 +7,6 @@ import type { AppPhase, CombatTurnResult, DeckCard, OpeningPackItem, RewardSlot,
 import AbandonRunButton from './components/AbandonRunButton';
+import SoundToggle from './components/SoundToggle';
 import { isRunInProgress } from './utils/runControls';
+import { playSfx } from './utils/playSfx';
+import { sfx } from '../../engine/shared/sfx';
 
@@ -45,2 +48,5 @@ export default function App({ session }: GameRendererProps) {
 
+  // Shared SFX stays silent until the first click or key press (browser autoplay rules).
+  useEffect(() => { sfx.autoUnlock(); }, []);
+
   useEffect(() => {
@@ -65,2 +71,3 @@ export default function App({ session }: GameRendererProps) {
   const handleNewRun = useCallback(() => {
+    playSfx('click');
     if (unlockedCardIds.length === 0) {
@@ -140,2 +147,7 @@ export default function App({ session }: GameRendererProps) {
     if (!result) return;
+    const enemyHpBefore = run.enemy?.hp ?? 0;
+    if (result.nextState.status === 'game_over') playSfx('lose');
+    else if (result.nextState.status === 'victory' || result.fightWon === true) playSfx('win');
+    else if ((result.nextState.enemy?.hp ?? 0) < enemyHpBefore) playSfx('hit');
+    else playSfx('click');
     setRun(result.nextState);
@@ -159,2 +171,3 @@ export default function App({ session }: GameRendererProps) {
     if (!run || !rewardSlots) return;
+    playSfx('pickup');
     let cur = run;
@@ -237,10 +250,13 @@ export default function App({ session }: GameRendererProps) {
 
-  const statusArea = run ? (
+  const statusArea = (
     <>
-      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
-        Floor {run.currentFloor} · Turn {run.turnCount}
-      </span>
-      {isRunInProgress(run.status) && <AbandonRunButton onAbandon={handleAbandon} />}
+      {run && (
+        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
+          Floor {run.currentFloor} · Turn {run.turnCount}
+        </span>
+      )}
+      {run && isRunInProgress(run.status) && <AbandonRunButton onAbandon={handleAbandon} />}
+      <SoundToggle />
     </>
-  ) : undefined;
+  );
 
```

**Step 5: create `ts/tests/test_dissonance_sound.tsx`:**

```tsx
// new: ts/tests/test_dissonance_sound.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/dissonance/App';
import { loadGame } from '../src/engine/runtime';
import { sfx } from '../src/engine/shared/sfx';
import { playSfx } from '../src/games/dissonance/utils/playSfx';
import { SOUND_MUTED_KEY, isSoundMuted, setSoundMuted } from '../src/games/dissonance/utils/soundPrefs';

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('sound preference', () => {
  it('defaults to sound on and remembers a mute', () => {
    expect(isSoundMuted()).toBe(false);
    setSoundMuted(true);
    expect(isSoundMuted()).toBe(true);
    expect(localStorage.getItem(SOUND_MUTED_KEY)).toBe('true');
    setSoundMuted(false);
    expect(isSoundMuted()).toBe(false);
  });

  it('playSfx plays through the shared engine when sound is on and stays silent when muted', () => {
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {});
    playSfx('click');
    expect(play).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledWith('click');
    setSoundMuted(true);
    playSfx('click');
    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe('sound toggle in the header', () => {
  it('is on the title screen, mutes with one click and is still muted after a reload', async () => {
    const session = loadGame('dissonance', 1);
    let { container, root } = await mount(<App session={session} />);
    const toggle = () => container.querySelector('#dissonance-sound-toggle') as HTMLElement | null;
    expect(toggle()).not.toBeNull();
    expect(toggle()?.getAttribute('title')).toBe('Mute sound');

    await act(async () => {
      toggle()?.click();
    });
    expect(toggle()?.getAttribute('title')).toBe('Unmute sound');
    expect(isSoundMuted()).toBe(true);

    // "Reload": new App on the same storage.
    root.unmount();
    document.body.innerHTML = '';
    ({ container, root } = await mount(<App session={session} />));
    expect(container.querySelector('#dissonance-sound-toggle')?.getAttribute('title')).toBe('Unmute sound');
    root.unmount();
  });

  it('a muted player hears nothing when starting a new run', async () => {
    setSoundMuted(true);
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {});
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    const newRun = container.querySelector('#new-run') as HTMLElement;
    await act(async () => {
      newRun.click();
    });
    expect(play).not.toHaveBeenCalled();
    root.unmount();
  });

  it('an unmuted player hears a click when starting a new run', async () => {
    const play = vi.spyOn(sfx, 'play').mockImplementation(() => {});
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    const newRun = container.querySelector('#new-run') as HTMLElement;
    await act(async () => {
      newRun.click();
    });
    expect(play).toHaveBeenCalledWith('click');
    root.unmount();
  });
});
```

## 4. What NOT to do

- No new audio files and no changes to `ts/src/engine/shared/sfx/` (use the shared module as it is; the sounds are procedural).
- No sound in any phase file under `phases/`; only the four `App.tsx` moments above. No music.
- Do not change Lua, `types.ts`, game data, or other games.
- No new dependencies, no deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_dissonance
```
Real tail: `Test Files  3 passed | 1 skipped (4)` / `Tests  122 passed | 2 skipped (124)`.

After editing, same command. Expected (verified on the prototype): `Test Files  4 passed | 1 skipped (5)` / `Tests  127 passed | 2 skipped (129)` (5 new). If the first-fight-hint directive merged first, expect 4 more tests and 1 more file on top of these numbers.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

Hearing the sounds is the controller's step after merge (cold load, click New Run, hear the click; mute, reload, still muted). Say so under Controller finish.

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

- [ ] The three new modules, the test and the `App.tsx` diff are in place exactly as specified.
- [ ] `cd ts && npx vitest run test_dissonance` shows the 5 new tests passing and nothing newly failing (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the five files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the five files and the vitest counts. Evidence second: real tails. Controller finish: listen check in a browser (first click unlocks sound; mute persists across a reload), and a screenshot of the header with the toggle at 390 px (the header now also holds the Abandon button during a run). Recommended action: review, merge.

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
| Status | Blocked |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-dissonance-mute-and-sound-effects-7485ae |
| Base branch | - |
| Base commit | 4daefe169190b88efb18533b5ecece0f82e84b62 |

**Status log**
- 2026-10-04 13:39 · robert-claude-laptop · none → Queued
- 2026-10-05 05:28 · robert-claude-laptop · Queued → Approved — lint override: dispatch-path-missing false positives, verified 2026-10-05: ts/src/games/game-metadata.json is gitignored but copied into every worktree via .agentflow/worktree-files; tests/fixtures/demo_lists_snapshot.json is a stale do-not-edit mention (deleted in c7231fd2), not a read dependency
- 2026-10-05 21:37 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-dissonance-mute-and-sound-effects-7485ae; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-05 21:38 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-dissonance-mute-and-sound-effects-7485ae; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
- 2026-10-05 21:41 · devin · In progress → Blocked — Already done on main: commit 1495038b (merged Oct 4) contains all five scope files matching the spec exactly; branch has no commits beyond main so Review is refused. Re-verified: vitest run test_dissonance -> 8 files passed | 1 skipped, 142 tests passed | 2 skipped (all 5 sound tests pass); tsc --noEmit clean. Safe to mark Done.
<!-- queue:end -->
