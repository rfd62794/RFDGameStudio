# Gladiator Arena: a Grand Champion card when the last champion falls

**Depends on:** `Gladiator_Bout_Result_Next_Step_Directive.md` merged first (both edit the import block and the result modal of `ArenaCombatView.tsx`, a few lines apart; running in order avoids a conflict).

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/gladiator_arena/components/ArenaCombatView.tsx` (the imports near line 12, the modal near lines 743-776), `ts/src/games/gladiator_arena/simulation/championLadder.ts` (`ARENA_TIERS`; read only),
`docs/demos/gladiator_arena/DIRECTION.md` (Replan Phase 3).

## 1. Why this exists

Gladiator Arena has five tiers; the career test already reaches tier 5. When a player beats the tier 5 champion ("Overlord Kronos", id `tier5-champion`, `championLadder.ts` line 343) nothing marks it: the modal shows the same VICTORY card as any bout.
`docs/demos/gladiator_arena/DIRECTION.md` asks for "an end screen when tier 5 is cleared (new season / keep playing)". The ladder already stays open after the last champion (there is no locked state), so the honest and smallest version is a celebratory card in the result modal that says so.
No new save data and no new game phase: the card appears only in the modal for that victory.

## 2. Scope

1. New module `<!-- new: ts/src/games/gladiator_arena/utils/campaignEnd.ts -->`.
2. `ts/src/games/gladiator_arena/components/ArenaCombatView.tsx`: one import and one block in the modal.
3. New test `<!-- new: ts/tests/test_gladiator_arena_campaign_end.ts -->`.

## 3. The work

**Step 1.** Create `<!-- new: ts/src/games/gladiator_arena/utils/campaignEnd.ts -->` with exactly:

```ts
import { ARENA_TIERS } from '../simulation/championLadder';

/** True when the bout opponent is the champion of the last tier on the ladder. */
export function isFinalChampion(opponentId: string): boolean {
  const lastTier = ARENA_TIERS[ARENA_TIERS.length - 1];
  return lastTier.champion.id === opponentId;
}

export const CAMPAIGN_COMPLETE_TITLE = 'You are the Grand Champion!';
export const CAMPAIGN_COMPLETE_BODY =
  'You have beaten the champion of every tier. The ladder stays open: keep fighting for gold, glory and a spotless record.';
```

**Step 2.** Apply exactly this diff to `ArenaCombatView.tsx` (context lines are real; if one differs, STOP and say so in the Status row; the file uses CRLF line endings, keep them). The block goes between the victory/defeat heading and the purse breakdown:

```diff
diff --git a/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx b/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx
index cf7f1255..adee19cd 100644
--- a/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx
+++ b/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx
@@ -9,6 +9,7 @@ import { useGame } from '../context/GameContext';
 import { BodyPart } from '../types';
 import { AnatomyPaperDoll } from './AnatomyPaperDoll';
 import { StickFighter, FighterPose } from './StickFighter';
+import { CAMPAIGN_COMPLETE_BODY, CAMPAIGN_COMPLETE_TITLE, isFinalChampion } from '../utils/campaignEnd';
 import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
 import { 
   Swords, 
@@ -772,6 +773,13 @@ export const ArenaCombatView: React.FC = () => {
               )}
             </div>
 
+            {isVictory && isFinalChampion(activeBout.opponent.id) && (
+              <div id="campaign-complete-card" className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/60 text-center flex flex-col gap-1">
+                <span className="text-sm font-extrabold text-amber-300 uppercase tracking-wide">{CAMPAIGN_COMPLETE_TITLE}</span>
+                <span className="text-xs text-amber-100">{CAMPAIGN_COMPLETE_BODY}</span>
+              </div>
+            )}
+
             {/* Financial Purse Breakdown */}
             {isVictory && (
               <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col gap-2 font-mono text-xs">
```

**Step 3.** Create `<!-- new: ts/tests/test_gladiator_arena_campaign_end.ts -->` with exactly:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARENA_TIERS } from '../src/games/gladiator_arena/simulation/championLadder';
import {
  CAMPAIGN_COMPLETE_BODY,
  CAMPAIGN_COMPLETE_TITLE,
  isFinalChampion,
} from '../src/games/gladiator_arena/utils/campaignEnd';

const viewSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/gladiator_arena/components/ArenaCombatView.tsx'),
  'utf8'
);

describe('gladiator_arena end of the ladder', () => {
  it('the ladder has five tiers and the last champion is the final one', () => {
    expect(ARENA_TIERS).toHaveLength(5);
    expect(isFinalChampion('tier5-champion')).toBe(true);
    expect(isFinalChampion(ARENA_TIERS[4].champion.id)).toBe(true);
  });

  it('no other champion or opponent counts as the final one', () => {
    for (const tier of ARENA_TIERS.slice(0, 4)) {
      expect(isFinalChampion(tier.champion.id)).toBe(false);
    }
    for (const opponent of ARENA_TIERS[4].opponents) {
      expect(isFinalChampion(opponent.id)).toBe(false);
    }
  });

  it('the end card copy is warm, short and says the ladder stays open', () => {
    expect(CAMPAIGN_COMPLETE_TITLE).toContain('Grand Champion');
    expect(CAMPAIGN_COMPLETE_BODY).toContain('ladder stays open');
    expect(CAMPAIGN_COMPLETE_BODY.length).toBeLessThan(200);
  });

  it('the result modal shows the end card only for a victory over the final champion', () => {
    expect(viewSource).toContain('isVictory && isFinalChampion(activeBout.opponent.id)');
    expect(viewSource).toContain('id="campaign-complete-card"');
  });
});
```

## 4. What NOT to do

- Do not add a new game phase, a new save field, a "new season" system, or change `GameContext`, the ladder, tiers, purses or combat.
- Do not edit `championLadder.ts` (read only) or any other part of `ArenaCombatView.tsx`.
- Do not touch `ts/tests/test_gladiator_arena_tier_a.ts`.
- Do not add a cover image and do not deploy.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_gladiator_arena_tier_a.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  15 passed (15)`.

After editing (verified on a prototype of exactly this change, on the base without the next-step directive):
```
cd ts && npx vitest run test_gladiator_arena_campaign_end.ts test_gladiator_arena_tier_a.ts
```
Real tail: `Test Files  2 passed (2)` / `Tests  19 passed (19)`.

Type check:
```
cd ts && npx tsc --noEmit
```
Real baseline and prototype result are identical: 4 errors, all `Cannot find module '../games/game-metadata.json'` (a generated file absent from a fresh worktree). Any error mentioning `gladiator_arena` is yours: fix it.

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

- [ ] `utils/campaignEnd.ts` and the test file exist as specified; `ArenaCombatView.tsx` matches the diff and nothing else changed in it.
- [ ] `cd ts && npx vitest run test_gladiator_arena_campaign_end.ts test_gladiator_arena_tier_a.ts` shows 2 files, 19 tests passed (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three files. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: the card is only seen after beating the tier 5 champion in a real run. Controller finish: Robert or Claude rebuilds with `npm run build:gladiator_arena` and checks it by hand (or accepts the unit test for the end card).
Recommended action: review and merge.

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding any embed or dist; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; Lua additions; engine changes under `ts/src/engine/`; any player-layer or cloud-save work.

## Required from User

none. Review and merge are Robert's or Claude's after the run.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Done |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-gladiator-tier5-end-card-directive |
| Base branch | - |
| Base commit | 9f613255c109bfd28aecfade9750514801b5799a |

**Status log**
- 2026-10-04 13:23 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified worktree-only build; dispatch after Gladiator_Bout_Result_Next_Step merges (shared ArenaCombatView edits).
- 2026-10-04 20:52 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions and a gitignored generated file (game-metadata.json); verified pattern across this directive family
- 2026-10-04 20:52 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-gladiator-tier5-end-card-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 20:53 · dispatcher · In progress → Blocked — setup failed before spawn: setup command 'uv sync --frozen' exited 1: on `itch-publisher`
- 2026-10-05 · devin-cleanroom-overseer · Blocked → Review — rescued the env-blocked dispatch (laptop `uv sync` os error 1142): `utils/campaignEnd.ts` + `tests/test_gladiator_arena_campaign_end.ts` created verbatim; `ArenaCombatView.tsx` got exactly the spec'd import + campaign-complete card block between the result heading and the purse breakdown (rebased over merged dep Gladiator_Bout_Result_Next_Step PR #202 — import kept alongside `nextStepAfterBout`). Verified: `cd ts && npx vitest run test_gladiator_arena_campaign_end.ts test_gladiator_arena_tier_a.ts` → `Test Files 2 passed (2)` / `Tests 19 passed (19)` (4 new + 15 baseline); `cd ts && npx tsc --noEmit` → 9 errors, all `Cannot find module` in `arcade/game-metadata.json` (baseline, generated file absent from fresh worktrees) + `engine/schemas/*` zod drift (declared-but-uninstalled, same env drift noted on chimera_wilds; zero in scope files, zero mentioning gladiator_arena). The card is only seen after beating the tier 5 champion in a real run. Controller finish: Robert or Claude rebuilds `npm run build:gladiator_arena` and checks by hand (or accepts the unit test). Recommended action: review and merge.
- 2026-10-04 21:17 · robert-claude-laptop · Review → Done
<!-- queue:end -->
