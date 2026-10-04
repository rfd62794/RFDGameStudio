# Derby Sim: no waiting between your first three races

**Depends on:** `Horse_Racing_Continue_New_Game_And_Build_Directive.md` merged first (both add an import right after the `sound` import in `ts/src/games/horse_racing/App.tsx`; running in order avoids a conflict).

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/horse_racing/App.tsx` (the import block near line 12, `handleRaceComplete` near lines 318-360, the tutorial near line 673), `games/horse_racing/data.yaml` (`stable:` block; read only),
`ts/tests/test_horse_racing_polish.ts` (existing; the tutorial must keep 3 to 5 lines), `docs/demos/horse_racing/DIRECTION.md` (Replan Phase 3).

## 1. Why this exists

`docs/demos/horse_racing/DIRECTION.md` names the biggest turn-off: real-time rest timers (90 s after a race, 180 s for breeding) in a game a visitor wants to sample for five minutes. `data.yaml` `stable.race_cooldown_ms` is `90000`.
Robert's decision (2026-10-04, approval of all direction recommendations): skip the race rest for the first three races, then explain it. Breeding rest is not changed.

Today `handleRaceComplete` (`App.tsx`) reads the config and sets the rest like this:
```
    const raceCooldownMs = (stableCfg['race_cooldown_ms'] as number) ?? 90000;
    ...
    const cooldownUntil = Date.now() + raceCooldownMs;
```
`gameState.race_history` already holds every finished race (length 0 before the first), and `gameState` is in that callback's dependency list. The tutorial already has the maximum 5 lines, so the explanation replaces the wording of the third line instead of adding a sixth:
```
              <li>Purses and winning bets feed your Stable Bank — horses need rest between runs.</li>
```

## 2. Scope

1. New module `<!-- new: ts/src/games/horse_racing/utils/raceCooldown.ts -->`.
2. `ts/src/games/horse_racing/App.tsx`: one import, one changed line, one changed tutorial line.
3. New test `<!-- new: ts/tests/test_horse_racing_first_races.ts -->`.

## 3. The work

**Step 1.** Create `<!-- new: ts/src/games/horse_racing/utils/raceCooldown.ts -->` with exactly:

```ts
/** Races at the start of a career that need no rest, so a first visit reaches a result quickly. */
export const FREE_FIRST_RACES = 3;

/** Rest time (ms) after a race, given how many races are already in the history. */
export function raceCooldownFor(racesAlreadyRun: number, cooldownMs: number): number {
  return racesAlreadyRun < FREE_FIRST_RACES ? 0 : cooldownMs;
}
```

**Step 2.** Apply exactly this diff to `App.tsx` (context lines are real; if one differs, STOP and say so in the Status row; the file uses CRLF line endings, keep them):

```diff
diff --git a/ts/src/games/horse_racing/App.tsx b/ts/src/games/horse_racing/App.tsx
index 64e02c87..eda91021 100644
--- a/ts/src/games/horse_racing/App.tsx
+++ b/ts/src/games/horse_racing/App.tsx
@@ -11,6 +11,7 @@ import { loadSave, writeSave } from '../../engine/shared/persistence';
 import { navigateTo } from '../../arcade/routing';
 import { STANDALONE_BUILD_GAMES } from '../../games/registry';
 import { sound } from './utils/sound';
+import { raceCooldownFor } from './utils/raceCooldown';
 import StableTab from './components/StableTab';
 import BettingTab from './components/BettingTab';
 import BreederTab from './components/BreederTab';
@@ -327,7 +328,7 @@ export default function App({ session }: GameRendererProps) {
       results,
       timestamp: Date.now(),
     };
-    const cooldownUntil = Date.now() + raceCooldownMs;
+    const cooldownUntil = Date.now() + raceCooldownFor(gameState.race_history.length, raceCooldownMs);
 
     setGameState(prev => {
       if (!prev) return prev;
@@ -672,7 +673,7 @@ export default function App({ session }: GameRendererProps) {
             <ul className="hr-tutorial">
               <li>Pick a horse in the Betting office, place Win/Place/Show bets, and run the race.</li>
               <li>Win pays the listed odds; Place (top 2) and Show (top 3) pay less for safer finishes.</li>
-              <li>Purses and winning bets feed your Stable Bank — horses need rest between runs.</li>
+              <li>Purses and winning bets feed your Stable Bank. Your first three races need no rest; after that, horses rest between runs.</li>
               <li>Breed a stallion and a mare in the Breeding Lab to raise the next generation.</li>
               <li>Your stable autosaves after every race.</li>
             </ul>
```

**Step 3.** Create `<!-- new: ts/tests/test_horse_racing_first_races.ts -->` with exactly:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FREE_FIRST_RACES, raceCooldownFor } from '../src/games/horse_racing/utils/raceCooldown';

const appSource = readFileSync(resolve(import.meta.dirname, '../src/games/horse_racing/App.tsx'), 'utf8');

describe('horse_racing quick first races', () => {
  it('the first three races need no rest', () => {
    expect(FREE_FIRST_RACES).toBe(3);
    for (const alreadyRun of [0, 1, 2]) {
      expect(raceCooldownFor(alreadyRun, 90000)).toBe(0);
    }
  });

  it('from the fourth race on, the configured rest applies', () => {
    expect(raceCooldownFor(3, 90000)).toBe(90000);
    expect(raceCooldownFor(40, 90000)).toBe(90000);
  });

  it('App uses the helper for race rest and the tutorial explains it', () => {
    expect(appSource).toContain('raceCooldownFor(gameState.race_history.length, raceCooldownMs)');
    expect(appSource).toContain('Your first three races need no rest');
  });

  it('breeding rest is unchanged', () => {
    expect(appSource).toContain('Date.now() + breedCooldownMs');
  });
});
```

## 4. What NOT to do

- Do not change `data.yaml`, `logic.lua`, odds, prizes, the breeding rest (`breedCooldownMs`), or the cooldown ticker.
- Do not add a sixth tutorial line (the existing polish test allows 3 to 5) and do not change other tutorial lines.
- Do not touch `ts/tests/test_horse_racing_polish.ts` or the status label.
- Do not deploy.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_horse_racing_polish.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  10 passed (10)`.

After editing (verified on a prototype of exactly this change, on the base without the Continue/New Game directive):
```
cd ts && npx vitest run test_horse_racing_first_races.ts test_horse_racing_polish.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  14 passed (14)`.

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

- [ ] The helper, the three `App.tsx` changes and the test are exactly as specified; nothing else changed.
- [ ] `cd ts && npx vitest run test_horse_racing_first_races.ts test_horse_racing_polish.ts` shows 2 files, 14 tests passed (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three changes. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: this changes a game rule (rest between the first three races) by Robert's approval, and a cold-load run to a finished race in under 60 seconds needs a browser. Controller finish: Robert or Claude builds with `npm run build:horse_racing` (added by the Continue/New Game directive), plays three races back to back, then a fourth to see the rest, and takes the cover screenshot (the covers step).
Recommended action: review, merge, then the controller's check.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.
