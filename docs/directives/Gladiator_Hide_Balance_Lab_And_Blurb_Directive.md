# Gladiator Arena: hide the Balance Lab from players and write a plain blurb

**Depends on:** none (it does not touch `ts/tests/test_gladiator_arena_tier_a.ts`, which `Gladiator_Career_Test_Tighten_Directive.md` edits).

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/gladiator_arena/App.tsx` (the `ArenaTab` type near line 45, the tab `nav` near lines 200-262, the tab content near line 340), `ts/src/games/gladiator_arena/config.ts`,
`docs/demos/gladiator_arena/DIRECTION.md` (Replan Phase 1).

## 1. Why this exists

The one clear player-facing defect in Gladiator Arena is shipped developer tooling and jargon (`docs/demos/gladiator_arena/DIRECTION.md`, verdict TRIM): a fifth tab called "Balance Lab" tells a player they are looking at a simulator,
and the registry blurb says "continuous anatomy damage, Blood Bowl recoil, and agent-driven decision AI". Today's blurb (`config.ts` line 10, 35 words):
```
  description: 'Assemble cyber-organic gladiator frames. Manage your roster across a 5-tier champion ladder. Turn-based tactical combat with continuous anatomy damage, Blood Bowl recoil, and agent-driven decision AI.',
```
Robert's decision (2026-10-04, approval of all direction recommendations): hide the Balance Lab from the player navigation behind `?dev=1`, keep every file (the career test uses the harness), and replace the blurb.
`BalanceReportView` stays imported and works exactly as before when `?dev=1` is in the address.

## 2. Scope

1. `ts/src/games/gladiator_arena/config.ts`: replace the `description` value only.
2. `ts/src/games/gladiator_arena/App.tsx`: three small edits described below.
3. New test `<!-- new: ts/tests/test_gladiator_arena_player_facing.ts -->`.

## 3. The work

**Step 1: blurb.** Replace the `description` line with exactly (40 words):
```
  description: 'Build cyber-organic gladiator frames, manage your roster and climb a five-tier champion ladder. You never swing the sword: you decide what it is attached to. Bouts play out on their own, with real wounds, repairs and a rematch always waiting.',
```

**Step 2: App.tsx.** Apply exactly this diff (the context is real; if a removed line differs from the file, STOP and say so in the Status row). The file uses CRLF line endings; keep them.
Note that the diff re-indents the whole Balance Lab button by two spaces when it is wrapped in `{showDevTools && ( ... )}`.

```diff
diff --git a/ts/src/games/gladiator_arena/App.tsx b/ts/src/games/gladiator_arena/App.tsx
index 8767c176..b2e6211d 100644
--- a/ts/src/games/gladiator_arena/App.tsx
+++ b/ts/src/games/gladiator_arena/App.tsx
@@ -49,6 +49,14 @@ const GladiatorArenaApp: React.FC = () => {
   const mode = env.VITE_STANDALONE === 'true' ? 'standalone' : 'arcade';
   const arcadeBaseUrl = env.VITE_ARCADE_BASE_URL;
   const [currentTab, setCurrentTab] = useState<ArenaTab>('roster');
+  // Balance Lab is developer tooling: hidden from players, reachable with ?dev=1.
+  const [showDevTools] = useState<boolean>(() => {
+    try {
+      return new URLSearchParams(window.location.search).get('dev') === '1';
+    } catch {
+      return false;
+    }
+  });
   const { activeBout, gold, roster, currentTierId, wins, losses, resetGame } = useGame();
   const [soundMuted, setSoundMuted] = useState(!sound.isSoundEnabled());
   const [showResetConfirm, setShowResetConfirm] = useState(false);
@@ -245,16 +253,18 @@ const GladiatorArenaApp: React.FC = () => {
                 <span className="hidden sm:inline">Arena Bouts</span>
               </button>
 
-              <button
-                id="tab-balance-btn"
-                onClick={() => setCurrentTab('balance')}
-                aria-label="Balance Lab"
-                title="Balance Lab"
-                className={tabCls('balance', 'bg-emerald-600 text-stone-950 font-bold shadow', 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-950/30')}
-              >
-                <Activity className="w-4 h-4" />
-                <span className="hidden sm:inline">Balance Lab</span>
-              </button>
+              {showDevTools && (
+                <button
+                  id="tab-balance-btn"
+                  onClick={() => setCurrentTab('balance')}
+                  aria-label="Balance Lab"
+                  title="Balance Lab"
+                  className={tabCls('balance', 'bg-emerald-600 text-stone-950 font-bold shadow', 'text-stone-400 hover:text-emerald-300 hover:bg-emerald-950/30')}
+                >
+                  <Activity className="w-4 h-4" />
+                  <span className="hidden sm:inline">Balance Lab</span>
+                </button>
+              )}
 
               <span className="text-xs text-amber-400/90 flex items-center gap-1 font-medium whitespace-nowrap px-2">
                 <Trophy className="w-3 h-3 text-amber-400" />
@@ -337,7 +347,7 @@ const GladiatorArenaApp: React.FC = () => {
           {currentTab === 'forge' && <ShopView />}
           {currentTab === 'medbay' && <MedbayView />}
           {currentTab === 'ladder' && <LadderView />}
-          {currentTab === 'balance' && (
+          {currentTab === 'balance' && showDevTools && (
             <div className="max-w-7xl mx-auto px-4 py-6">
               <BalanceReportView />
             </div>
diff --git a/ts/src/games/gladiator_arena/config.ts b/ts/src/games/gladiator_arena/config.ts
index 96deb8aa..4cab7b07 100644
--- a/ts/src/games/gladiator_arena/config.ts
+++ b/ts/src/games/gladiator_arena/config.ts
@@ -5,7 +5,7 @@ export const gladiatorArenaConfig: GameConfig = {
   gameId:      'gladiator_arena',
   order: 240,
   label:       'Gladiator Arena',
-  description: 'Assemble cyber-organic gladiator frames. Manage your roster across a 5-tier champion ladder. Turn-based tactical combat with continuous anatomy damage, Blood Bowl recoil, and agent-driven decision AI.',
+  description: 'Build cyber-organic gladiator frames, manage your roster and climb a five-tier champion ladder. You never swing the sword: you decide what it is attached to. Bouts play out on their own, with real wounds, repairs and a rematch always waiting.',
   color:       '#f59e0b',
   status:      'dev',
   genre:       'combat-arena',
```

**Step 3: test.** Create `<!-- new: ts/tests/test_gladiator_arena_player_facing.ts -->` with exactly:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../src/games/gladiator_arena/config';

const appSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/gladiator_arena/App.tsx'),
  'utf8'
);

describe('gladiator_arena player-facing copy and tabs', () => {
  it('blurb is 60 words or fewer, plain, and free of developer jargon', () => {
    const description = config.description ?? '';
    expect(description.trim().split(/\s+/).length).toBeLessThanOrEqual(60);
    for (const jargon of ['Blood Bowl', 'agent-driven', 'decision AI', 'continuous anatomy']) {
      expect(description).not.toContain(jargon);
    }
  });

  it('hides the Balance Lab tab and its view unless ?dev=1 is in the address', () => {
    expect(appSource).toContain("new URLSearchParams(window.location.search).get('dev') === '1'");
    const buttonIdx = appSource.indexOf('id="tab-balance-btn"');
    expect(buttonIdx).toBeGreaterThan(-1);
    expect(appSource.lastIndexOf('{showDevTools && (', buttonIdx)).toBeGreaterThan(buttonIdx - 400);
    expect(appSource).toContain("currentTab === 'balance' && showDevTools");
  });

  it('keeps the four player tabs', () => {
    for (const id of ['tab-roster-btn', 'tab-forge-btn', 'tab-medbay-btn', 'tab-ladder-btn']) {
      expect(appSource).toContain(`id="${id}"`);
    }
  });
});
```

## 4. What NOT to do

- Do not delete `BalanceReportView`, `balanceHarness`, or any simulation file; do not change the `ArenaTab` type or any combat, forge or ladder logic.
- Do not rename tabs, add tabs, or change the player tabs' behaviour.
- Do not touch `ts/tests/test_gladiator_arena_tier_a.ts`, `test_gladiator_shell_opening.ts`, the engine, or other games.
- Do not change `status` (stays `dev`), `label`, `gameId`, `tags` or `order` in the config.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline, before editing (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_gladiator_arena_tier_a.ts test_gladiator_shell_opening.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  35 passed (35)`.

After editing (verified on a prototype of exactly this change):
```
cd ts && npx vitest run test_gladiator_arena_player_facing.ts test_gladiator_arena_tier_a.ts test_gladiator_shell_opening.ts
```
Real tail: `Test Files  3 passed (3)` / `Tests  38 passed (38)`.

Type check:
```
cd ts && npx tsc --noEmit
```
Real baseline and prototype result are identical: 4 errors, all `Cannot find module '../games/game-metadata.json'` (a generated file absent from a fresh worktree). Any error mentioning `gladiator_arena` is yours: fix it.

Source checks (Grep tool, one call each): `ts/src/games/gladiator_arena/config.ts` no longer contains `Blood Bowl` or `agent-driven`.

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

- [ ] The config blurb and the three `App.tsx` edits are exactly as specified; nothing else changed in those files.
- [ ] `ts/tests/test_gladiator_arena_player_facing.ts` exists; the three-file vitest command shows 3 files, 38 tests passed (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files changed. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: the tab count (4 without the flag, 5 with `?dev=1`) needs a browser. Controller finish: Robert or Claude rebuilds with `npm run build:gladiator_arena`, opens the page with and without `?dev=1`, counts the tabs, and takes the screenshot.
Recommended action: review, merge, then the controller's check.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.
