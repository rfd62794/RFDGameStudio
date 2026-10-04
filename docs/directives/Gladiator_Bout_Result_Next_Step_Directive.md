# Gladiator Arena: tell the player what to do after a bout

**Depends on:** none (it touches only the result modal of `ArenaCombatView.tsx`; `Gladiator_Career_Test_Tighten_Directive.md` edits only tests).

**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/gladiator_arena/components/ArenaCombatView.tsx` (lines 7-13 the imports, lines 743-851 the "Post-Match Victory / Defeat Modal"; the file is 851 lines: touch only these two places),
`ts/src/games/gladiator_arena/utils/useArmedConfirm.ts` (the style of a small util), `docs/demos/gladiator_arena/DIRECTION.md` (Replan Phase 2).

## 1. Why this exists

`docs/demos/gladiator_arena/DIRECTION.md` asks for "a win/loss result card in ArenaCombatView with one next action" (polish standard B3, B6). A result modal already exists: it says VICTORY or DEFEAT, shows the purse and a "Post-Match Trauma & Scarring Report", and ends with one button, "Return to Manager HQ" (`id="return-to-hq-btn"`, the `concludeBout` action).
What is missing is one plain sentence saying what to do next: a player whose frames are damaged does not know the Medbay exists, and a player after a clean win does not know the next step is the ladder.
This directive adds that sentence. It does not add a second button and does not change the existing button or `concludeBout`.

The modal's "Return CTA" block today (lines 837-847):
```
            {/* Return CTA */}
            <button
              id="return-to-hq-btn"
              onClick={concludeBout}
```
The data the sentence needs is already in scope in the modal: `isVictory` (line 64), and `activeBout.playerRoster`, each gladiator `g` with `g.parts` whose `BodyPart` has `currentHp`, `maxHp` and `scarHpPenalty` (already read a few lines above in the trauma report).

## 2. Scope

1. New module `<!-- new: ts/src/games/gladiator_arena/utils/resultNextStep.ts -->` (a pure function).
2. `ts/src/games/gladiator_arena/components/ArenaCombatView.tsx`: one import and one `<p>` in the modal.
3. New test `<!-- new: ts/tests/test_gladiator_arena_result_next_step.ts -->`.

## 3. The work

**Step 1.** Create `<!-- new: ts/src/games/gladiator_arena/utils/resultNextStep.ts -->` with exactly:

```ts
export interface BoutOutcomeSummary {
  isVictory: boolean;
  anyDamaged: boolean;
  anyScarred: boolean;
}

/** One plain sentence telling the player what to do after a bout. */
export function nextStepAfterBout({ isVictory, anyDamaged, anyScarred }: BoutOutcomeSummary): string {
  if (anyScarred) {
    return 'Next: visit the Medbay to repair your frames. Scars are permanent, but the rest can be mended.';
  }
  if (anyDamaged) {
    return 'Next: repair your frames in the Medbay, then pick your next bout.';
  }
  return isVictory
    ? 'Next: your frames are fit to fight. Pick your next bout on the ladder.'
    : 'Next: try again, or visit the Forge to strengthen your frames first.';
}
```

**Step 2.** Apply exactly this diff to `ArenaCombatView.tsx` (context lines are real; if one differs, STOP and say so in the Status row; the file uses CRLF line endings, keep them):

```diff
diff --git a/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx b/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx
index cf7f1255..8dc6d430 100644
--- a/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx
+++ b/ts/src/games/gladiator_arena/components/ArenaCombatView.tsx
@@ -9,6 +9,7 @@ import { useGame } from '../context/GameContext';
 import { BodyPart } from '../types';
 import { AnatomyPaperDoll } from './AnatomyPaperDoll';
 import { StickFighter, FighterPose } from './StickFighter';
+import { nextStepAfterBout } from '../utils/resultNextStep';
 import { getGladiatorAnatomySummary } from '../../../engine/shared/anatomy';
 import { 
   Swords, 
@@ -834,6 +835,14 @@ export const ArenaCombatView: React.FC = () => {
               </div>
             </div>
 
+            <p id="bout-next-step" className="text-xs text-stone-300 text-center">
+              {nextStepAfterBout({
+                isVictory,
+                anyDamaged: activeBout.playerRoster.some(g => (Object.values(g.parts) as BodyPart[]).some(p => p.currentHp < p.maxHp)),
+                anyScarred: activeBout.playerRoster.some(g => (Object.values(g.parts) as BodyPart[]).some(p => p.scarHpPenalty > 0)),
+              })}
+            </p>
+
             {/* Return CTA */}
             <button
               id="return-to-hq-btn"
```

**Step 3.** Create `<!-- new: ts/tests/test_gladiator_arena_result_next_step.ts -->` with exactly:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { nextStepAfterBout } from '../src/games/gladiator_arena/utils/resultNextStep';

const viewSource = readFileSync(
  resolve(import.meta.dirname, '../src/games/gladiator_arena/components/ArenaCombatView.tsx'),
  'utf8'
);

describe('gladiator_arena bout result next step', () => {
  it('sends scarred frames to the Medbay', () => {
    expect(nextStepAfterBout({ isVictory: true, anyDamaged: true, anyScarred: true })).toContain('Medbay');
  });

  it('sends damaged frames to the Medbay, then on to the next bout', () => {
    const text = nextStepAfterBout({ isVictory: false, anyDamaged: true, anyScarred: false });
    expect(text).toContain('Medbay');
    expect(text).toContain('next bout');
  });

  it('after a clean win points to the ladder', () => {
    expect(nextStepAfterBout({ isVictory: true, anyDamaged: false, anyScarred: false })).toContain('ladder');
  });

  it('after a clean loss suggests trying again or the Forge', () => {
    const text = nextStepAfterBout({ isVictory: false, anyDamaged: false, anyScarred: false });
    expect(text).toContain('try again');
    expect(text).toContain('Forge');
  });

  it('every message is one short sentence block with no developer jargon', () => {
    for (const isVictory of [true, false]) {
      for (const anyDamaged of [true, false]) {
        for (const anyScarred of [true, false]) {
          const text = nextStepAfterBout({ isVictory, anyDamaged, anyScarred });
          expect(text.startsWith('Next: ')).toBe(true);
          expect(text.length).toBeLessThan(140);
        }
      }
    }
  });

  it('the result modal shows the next step above the Return button', () => {
    const stepIdx = viewSource.indexOf('id="bout-next-step"');
    expect(stepIdx).toBeGreaterThan(-1);
    expect(stepIdx).toBeLessThan(viewSource.indexOf('id="return-to-hq-btn"'));
  });
});
```

## 4. What NOT to do

- Do not change combat, purse, loot, scar or ladder logic, `concludeBout`, `GameContext`, or the existing buttons and copy of the modal.
- Do not touch any other part of `ArenaCombatView.tsx` (it is 851 lines; this run adds about 9).
- Do not edit `ts/tests/test_gladiator_arena_tier_a.ts` or `test_gladiator_shell_opening.ts`.
- Do not add a cover image (covers are generated by the controller's covers step) and do not deploy.

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
cd ts && npx vitest run test_gladiator_arena_result_next_step.ts test_gladiator_arena_tier_a.ts test_gladiator_shell_opening.ts
```
Real tail: `Test Files  3 passed (3)` / `Tests  41 passed (41)`.

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

- [ ] `utils/resultNextStep.ts` and the test file exist as specified; `ArenaCombatView.tsx` matches the diff and nothing else changed in it.
- [ ] The three-file vitest command shows 3 files, 41 tests passed (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows no new error (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the three files. Evidence second: real tails of `uv run python --version`, vitest and tsc.
Then say plainly: seeing the sentence in the modal needs a played bout in a browser. Controller finish: Robert or Claude rebuilds with `npm run build:gladiator_arena`, plays one bout to a result, and takes a win and a loss screenshot at 1280x720 and 390x844 (also the phone check for this demo, which has not been re-measured since the tab-bar fix).
Recommended action: review, merge, then the controller's check.

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
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:23 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified small TS change with tests; context lines verified against live file
<!-- queue:end -->
