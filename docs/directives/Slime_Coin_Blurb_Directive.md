# Slime Coin: an honest, inviting blurb on the card and the title screen (Size S)

**Depends on:** none. **Why Slime Coin:** Robert's 2026-10-04 approval of the DIRECTION.md plan for `slime_coin` (Replan item 2; the 390 px board check in that item needs a browser and is the controller's step, see the Report).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/slime_coin/DIRECTION.md` (Replan 2), `ts/src/games/slime_coin/config.ts` (whole file), `ts/src/games/slime_coin/App.tsx` (lines 258-270), `ts/src/games/slime_coin/components/CoinPrimer.tsx` (what the game really offers: vat scoring, card shop, pocket coins).

## 1. Why this exists

The arcade card and the title screen both say "Real-time coin pusher with shooter, two-layer board, and chip synergies", which is how the code is organised, not what a player gets (`DIRECTION.md`: "inside baseball"). The real product is a 15-round run with a rising target, chip cards and a token shop. The text is typed twice (`config.ts` line 10 and `App.tsx` line 264), so it can drift; this run gives both one source.

## 2. Scope

1. New module `<!-- new: ts/src/games/slime_coin/blurb.ts -->`: the one blurb.
2. `ts/src/games/slime_coin/config.ts` and `ts/src/games/slime_coin/App.tsx`: use it.
3. New test `<!-- new: ts/tests/test_slime_coin_blurb.tsx -->`.

## 3. The work

**Step 1: create `ts/src/games/slime_coin/blurb.ts`:**

```ts
// new: ts/src/games/slime_coin/blurb.ts
/** One description for the arcade card and the title screen, so they cannot drift apart. */
export const SLIME_COIN_BLURB =
  'Fire slime coins onto the board and push them into your vat to beat a rising target score. Across 15 rounds, pick chip cards and spend tokens in the shop to build combos that pay out big.';
```

**Step 2: apply this diff** to `config.ts` and `App.tsx` (the Edit tool keeps line endings; nothing else changes; the title screen's `tagline` stays):

```diff
diff --git a/ts/src/games/slime_coin/App.tsx b/ts/src/games/slime_coin/App.tsx
index 20ee3749..95a02a2e 100644
--- a/ts/src/games/slime_coin/App.tsx
+++ b/ts/src/games/slime_coin/App.tsx
@@ -19,2 +19,3 @@ import PocketPicker from './components/PocketPicker';
 import CoinPrimer from './components/CoinPrimer';
+import { SLIME_COIN_BLURB } from './blurb';
 import './styles.css';
@@ -263,3 +264,3 @@ export default function App({ session }: GameRendererProps) {
           tagline="Real-time coin pusher"
-          pitch="Real-time coin pusher with shooter, two-layer board, and chip synergies."
+          pitch={SLIME_COIN_BLURB}
           menuItems={[
diff --git a/ts/src/games/slime_coin/config.ts b/ts/src/games/slime_coin/config.ts
index 09ee851f..27b25a66 100644
--- a/ts/src/games/slime_coin/config.ts
+++ b/ts/src/games/slime_coin/config.ts
@@ -4,2 +4,3 @@ import React from 'react';
 import type { GameConfig } from '../../engine/types';
+import { SLIME_COIN_BLURB } from './blurb';
 
@@ -9,3 +10,3 @@ export const slimeCoinConfig: GameConfig = {
   label: 'SlimeCoin',
-  description: 'Real-time coin pusher with shooter, two-layer board, and chip synergies',
+  description: SLIME_COIN_BLURB,
   color: '#a855f7',
```

**Step 3: create `ts/tests/test_slime_coin_blurb.tsx`:**

```tsx
// new: ts/tests/test_slime_coin_blurb.tsx
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import config from '../src/games/slime_coin/config';
import { SLIME_COIN_BLURB } from '../src/games/slime_coin/blurb';
import App from '../src/games/slime_coin/App';
import { loadGame } from '../src/engine/runtime';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SlimeCoin blurb', () => {
  const text = SLIME_COIN_BLURB.toLowerCase();

  it('is 60 words or fewer and sells the 15-round run', () => {
    expect(SLIME_COIN_BLURB.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(60);
    expect(text).toContain('15 rounds');
  });

  it('has no inside-baseball or developer wording', () => {
    for (const banned of ['shooter', 'two-layer', 'synerg', 'phase', 'directive', 'prototype', 'todo']) {
      expect(text).not.toContain(banned);
    }
  });

  it('is the text on the arcade card and on the title screen', async () => {
    expect(config.description).toBe(SLIME_COIN_BLURB);
    const session = loadGame('slime_coin', 1);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<App session={session} />);
    });
    expect(container.textContent).toContain(SLIME_COIN_BLURB);
    root.unmount();
  });
});
```

## 4. What NOT to do

- No change to the Lua, to `types.ts`, to other components, to status (`dev` stays) or to `genre` (the taxonomy gap comment in `config.ts` stays).
- Do not change the blurb wording (it is checked: 60 words or fewer, mentions 15 rounds, no developer wording).
- No new dependencies, no deploys, no builds, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline before editing (origin/main `d3084de0`, 2026-10-04):
```
cd ts && npx vitest run test_slime_coin
```
Real tail: `Test Files  4 passed (4)` / `Tests  22 passed (22)`.
```
cd ts && npx vitest run test_arcade_registry_directive.ts test_collect_configs.ts test_arcade_metadata_expansion.ts test_registry_export.ts test_arcade_manifest.ts
```
Real tail: `Test Files  5 passed (5)` / `Tests  47 passed | 1 skipped (48)` (these read registry descriptions; they must stay the same).

After editing, the same two commands. Expected (verified on the prototype): `Test Files  5 passed (5)` / `Tests  25 passed (25)` for the first (3 new); the second unchanged.
```
cd ts && npx tsc --noEmit
```
Expected: no output, exit 0 (verified; needs the gitignored `ts/src/games/game-metadata.json`).

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

- [ ] `blurb.ts` and `test_slime_coin_blurb.tsx` exist; the diff is applied; both vitest commands show the expected tails (real tails pasted).
- [ ] `cd ts && npx tsc --noEmit` is clean (real tail pasted); `git status` shows only the four files in Scope.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the four files and the counts. Evidence second: real tails. Controller finish: Playwright screenshot of the title screen and of a round at 390x844 (does the board fit its frame? the DIRECTION.md phone item), plus a `docs/demos/slime_coin/SCOPE.md` "Phone layout:" line from the result. Recommended action: review, merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.
