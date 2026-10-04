# Dissonance: a one-time hint on the first fight, and plain-language captions (Size M)

**Depends on:** none. **Why Dissonance:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `dissonance` (Replan item 2). The ordering note in DIRECTION.md says only the hint and the caption cleanup are in this run; the "trim screens" step (Replan 4) waits on a cold-load timing check by the controller.

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/dissonance/DIRECTION.md` (Replan 2, "Player experience today"), `ts/src/games/dissonance/phases/CombatPhase.tsx` (lines 1-6 and 100-135), `ts/src/games/dissonance/phases/OpeningPhase.tsx` (line 39), `ts/src/games/dissonance/App.tsx` (line 248), `ts/src/games/dissonance/components/AbandonRunButton.tsx` (the style of a small component here).

## 1. Why this exists

`docs/demos/dissonance/DIRECTION.md` names the biggest turn-off: the whole game is the rule "cards combine by how their elements relate", and nothing teaches it; a new player is dropped into a fight with a hand of cards and no hint. Separately, two developer phrases reach players:

- `ts/src/games/dissonance/App.tsx` line 248 passes `phase="Renderer Phase A"` to `GameShell`, which shows it as a badge in the header of every screen.
- `ts/src/games/dissonance/phases/OpeningPhase.tsx` line 39 shows the badge `ECHO Core Initialization — First Pack Reveal`.

The redesign spec (`docs/superpowers/specs/2026-10-04-studio-redesign.md`, section a, "No dev-speak") wants a banned-word check on what the player reads. Each combat card already shows its two elements and a relation word (`single`, `same`, `adjacent` or `opposed`; see `CombatPhase.tsx` lines 150-155), so the hint only has to say what those mean.

## 2. Scope

1. New component `<!-- new: ts/src/games/dissonance/components/FirstCombatHint.tsx -->`.
2. `ts/src/games/dissonance/phases/CombatPhase.tsx`: render the hint above the hand.
3. `ts/src/games/dissonance/phases/OpeningPhase.tsx`: replace the badge text.
4. `ts/src/games/dissonance/App.tsx`: drop the `phase` prop on `GameShell`.
5. New test `<!-- new: ts/tests/test_dissonance_plain_words.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/dissonance/components/FirstCombatHint.tsx`:**

```tsx
// new: ts/src/games/dissonance/components/FirstCombatHint.tsx
import { useState } from 'react';
import { Panel, Button } from '../../../ui/components';
import { loadSave, writeSave } from '../../../engine/shared/persistence';

/** localStorage key: set once the player has dismissed the hint, so it shows only on the first fight ever. */
export const COMBAT_HINT_SEEN_KEY = 'dissonance_combat_hint_seen';

export default function FirstCombatHint() {
  const [visible, setVisible] = useState<boolean>(() => loadSave<boolean>(COMBAT_HINT_SEEN_KEY) !== true);

  if (!visible) return null;

  const dismiss = () => {
    writeSave(COMBAT_HINT_SEEN_KEY, true);
    setVisible(false);
  };

  return (
    <Panel padding="sm">
      <div
        id="dissonance-first-combat-hint"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}
      >
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text)' }}>
          Pick a card to play it. Every card pairs two elements, and how they relate (same, neighbouring or opposed)
          shapes what the card does. Try different cards and watch the enemy's health.
        </span>
        <Button id="dissonance-first-combat-hint-dismiss" label="Got it" onClick={dismiss} variant="primary" size="sm" />
      </div>
    </Panel>
  );
}
```

**Step 2: apply this diff** to `CombatPhase.tsx`, `OpeningPhase.tsx` and `App.tsx` (the Edit tool keeps each file's line endings; change nothing else):

```diff
diff --git a/ts/src/games/dissonance/App.tsx b/ts/src/games/dissonance/App.tsx
index e689b2df..3939cbda 100644
--- a/ts/src/games/dissonance/App.tsx
+++ b/ts/src/games/dissonance/App.tsx
@@ -247,3 +247,3 @@ export default function App({ session }: GameRendererProps) {
   return (
-    <GameShell gameLabel="Dissonance Depths" gameId="dissonance" phase="Renderer Phase A" statusArea={statusArea}>
+    <GameShell gameLabel="Dissonance Depths" gameId="dissonance" statusArea={statusArea}>
       <div className="h-full overflow-y-auto bg-slate-950 p-4">
diff --git a/ts/src/games/dissonance/phases/CombatPhase.tsx b/ts/src/games/dissonance/phases/CombatPhase.tsx
index 71365f8f..28023bad 100644
--- a/ts/src/games/dissonance/phases/CombatPhase.tsx
+++ b/ts/src/games/dissonance/phases/CombatPhase.tsx
@@ -3,2 +3,3 @@ import { Card, Panel, StatBar } from '../../../ui/components';
 import type { DeckCard, RunState } from '../types';
+import FirstCombatHint from '../components/FirstCombatHint';
 
@@ -119,2 +120,4 @@ export default function CombatPhase({ run, onPlayCard, data }: CombatPhaseProps)
 
+      <FirstCombatHint />
+
       <div
diff --git a/ts/src/games/dissonance/phases/OpeningPhase.tsx b/ts/src/games/dissonance/phases/OpeningPhase.tsx
index 3dcaa2de..f6486f84 100644
--- a/ts/src/games/dissonance/phases/OpeningPhase.tsx
+++ b/ts/src/games/dissonance/phases/OpeningPhase.tsx
@@ -38,3 +38,3 @@ export default function OpeningPhase({ pack, onComplete }: OpeningPhaseProps) {
       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
-        <Badge label="ECHO Core Initialization — First Pack Reveal" variant="amber" />
+        <Badge label="Your first cards" variant="amber" />
         <h2
```

**Step 3: create `ts/tests/test_dissonance_plain_words.tsx`:**

```tsx
// new: ts/tests/test_dissonance_plain_words.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '../src/games/dissonance/App';
import OpeningPhase from '../src/games/dissonance/phases/OpeningPhase';
import CombatPhase from '../src/games/dissonance/phases/CombatPhase';
import FirstCombatHint, { COMBAT_HINT_SEEN_KEY } from '../src/games/dissonance/components/FirstCombatHint';
import { loadGame } from '../src/engine/runtime';
import type { RunState } from '../src/games/dissonance/types';

const BANNED = ['phase a', 'renderer', 'core initialization', 'directive', 'prototype', 'todo', 'gameid'];

async function mount(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return { container, root };
}

function fightingRun(): RunState {
  return {
    playerHp: 20,
    playerMaxHp: 25,
    playerShield: 0,
    enemy: { name: 'Rust Wisp', hp: 10, maxHp: 10, dot: null, intent: { type: 'attack', value: 3, description: 'Strikes for 3' } },
    deckState: { drawPile: [], hand: [], discard: [] },
    logs: [],
  } as unknown as RunState;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('plain words on the Dissonance screens', () => {
  it('the title screen and the shell header carry no developer wording', async () => {
    const session = loadGame('dissonance', 1);
    const { container, root } = await mount(<App session={session} />);
    const text = (container.textContent ?? '').toLowerCase();
    expect(text).toContain('dissonance depths');
    for (const word of BANNED) expect(text).not.toContain(word);
    root.unmount();
  });

  it('the first-cards screen carries no developer wording', async () => {
    const pack = [{ action: 'sever', element: 'ember', cardId: 'ember_none_sever', name: 'Ember Cut' }];
    const { container, root } = await mount(<OpeningPhase pack={pack} onComplete={() => {}} />);
    const text = (container.textContent ?? '').toLowerCase();
    expect(text).toContain('your first cards');
    for (const word of BANNED) expect(text).not.toContain(word);
    root.unmount();
  });
});

describe('first combat hint', () => {
  it('shows on the first fight, is dismissed with one click, and stays gone', async () => {
    let { container, root } = await mount(<CombatPhase run={fightingRun()} onPlayCard={() => {}} />);
    expect(container.querySelector('#dissonance-first-combat-hint')).not.toBeNull();
    const button = container.querySelector('#dissonance-first-combat-hint-dismiss') as HTMLElement;
    await act(async () => {
      button.click();
    });
    expect(container.querySelector('#dissonance-first-combat-hint')).toBeNull();
    expect(localStorage.getItem(COMBAT_HINT_SEEN_KEY)).toBe('true');
    root.unmount();

    ({ container, root } = await mount(<CombatPhase run={fightingRun()} onPlayCard={() => {}} />));
    expect(container.querySelector('#dissonance-first-combat-hint')).toBeNull();
    root.unmount();
  });

  it('does not show for a player who has already seen it', async () => {
    localStorage.setItem(COMBAT_HINT_SEEN_KEY, 'true');
    const { container, root } = await mount(<FirstCombatHint />);
    expect(container.querySelector('#dissonance-first-combat-hint')).toBeNull();
    root.unmount();
  });
});
```

## 4. What NOT to do

- No change to the Lua (`games/dissonance/`), to `types.ts`, to card or enemy data, or to any other phase file.
- Do not add more hints, a tutorial sequence, or any change to how combat resolves. One hint, one time.
- Do not rename the title, the card names or the "Resonance Capsule Opening" heading: only the two strings in Step 2 change.
- No new dependencies, no deploys, no protected repos. Player-facing copy stays as given (plain, inviting).

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_dissonance
```
Real tail: `Test Files  3 passed | 1 skipped (4)` / `Tests  122 passed | 2 skipped (124)` (the filter matches every `test_dissonance_*` file; one file is skipped by its own design).

After editing, same command. Expected (verified on the prototype): `Test Files  4 passed | 1 skipped (5)` / `Tests  126 passed | 2 skipped (128)` (4 new).
The new test file fails before the edits, which shows it guards the change. Real output with the new test file present and the Step 2 diff NOT applied (hint component present): `Tests  3 failed | 1 passed (4)`: the title-screen wording test, the first-cards wording test and the hint-in-combat test fail, the standalone hint test passes.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified with the changes in place; needs the gitignored `ts/src/games/game-metadata.json`, copied by the dispatcher).

The cold-load Playwright check ("a new player reaches a first played card within 60 seconds") needs a browser and a build, so it is the controller's step after merge. Say so under Controller finish.

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

- [ ] `FirstCombatHint.tsx` and `test_dissonance_plain_words.tsx` exist as above; the three Step 2 edits are applied.
- [ ] `cd ts && npx vitest run test_dissonance` shows 4 new passing tests and nothing newly failing (real tail pasted); `cd ts && npx tsc --noEmit` is clean (real tail pasted).
- [ ] `git status` shows only the five files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the five files and the vitest counts. Evidence second: real tails. Controller finish: Playwright cold load of the Dissonance page, timing from load to the first played card (target 60 seconds or less, the standard's B1), and a screenshot of the first fight at 1280 and 390 px with the hint visible. Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
