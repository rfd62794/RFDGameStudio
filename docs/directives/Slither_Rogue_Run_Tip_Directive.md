# slither_rogue: one encouraging "try this next" line on the end-of-run card (S)

**Depends on:** none (it touches `App.tsx` and `GameOverModal.tsx`; the hygiene directive touches `GameHUD.tsx`, so they do not conflict).
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/slither_rogue/components/GameOverModal.tsx`, `ts/src/games/slither_rogue/App.tsx` (the `GameOverModal` usage at the end), `games/slither_rogue/data.yaml` (the evolution card ids), `docs/demos/slither_rogue/DIRECTION.md` (Replan step 3).

## 1. Why this exists

The direction's step 3 wants the game-over card to say why the run went the way it did ("cause of death"). That premise is wrong for this game, measured on origin/main `889dd21e` by reading `games/slither_rogue/logic.lua` and `collision.lua`: nobody dies. The only `game_over` event fires when `time_left` reaches 0 (`logic.lua`, `tick_game`); a rival snake hitting yours STEALS your tail from the hit point down (a `metrics_update` event with a shorter `current_length`) and a Shield card blocks it. So the useful, honest line is a tip about what to try next, not a cause of death.
The card today shows grade, three stats (Total Fruits, Peak Length, Evolutions) and a high-score form; `App.tsx` already tracks `currentLength`, `peakLength`, `score` and `level` (evolutions = `level - 1`).

## 2. Scope

1. New module `<!-- new: ts/src/games/slither_rogue/utils/runTip.ts -->`: one pure function.
2. `ts/src/games/slither_rogue/components/GameOverModal.tsx`: a new prop and one line of text.
3. `ts/src/games/slither_rogue/App.tsx`: pass `currentLength`.
4. New test `<!-- new: ts/tests/test_slither_rogue_run_tip.ts -->`.

## 3. The work

The edited files use CRLF; keep it.

**Step 1: `runTip.ts`.** Create it with exactly:

```ts
// new: ts/src/games/slither_rogue/utils/runTip.ts
// One plain, encouraging line for the end-of-run card. Runs end on the timer (nobody "dies"),
// so the line talks about what to try next, not what went wrong.
export interface RunTipInput {
  score: number;          // fruits eaten
  peakLength: number;
  currentLength: number;  // length when the timer ran out
  evolutionsCount: number;
}

export function runTip(r: RunTipInput): string {
  if (r.score === 0) return 'Steer toward the glowing fruit: eating it grows your snake and fills the evolution meter.';
  if (r.evolutionsCount === 0) return 'Keep eating: every few fruits you get to pick an evolution card.';
  if (r.peakLength > 0 && r.currentLength * 2 < r.peakLength) {
    return 'Rival snakes took a big bite of your tail. A Shield card blocks a steal, or give rivals more room.';
  }
  return 'Nice run! Try a different evolution card first and see how the arena changes.';
}
```

**Step 2: `GameOverModal.tsx`.** Four edits: add `import { runTip } from '../utils/runTip';` under `import type { HighScore } from '../types';`; add `currentLength: number;` to `GameOverModalProps` (after `peakLength: number;`); add `currentLength` to the destructured props (after `peakLength`); and directly under the line `<p className="sr-grade-desc">{grade.description}</p>` add `<p className="sr-grade-desc">{runTip({ score, peakLength, currentLength, evolutionsCount })}</p>`.

**Step 3: `App.tsx`.** In the `<GameOverModal ... />` usage add `currentLength={currentLength}` on its own line after `peakLength={peakLength}`.

**Step 4: test.** Create `ts/tests/test_slither_rogue_run_tip.ts` with exactly:

```ts
// new: ts/tests/test_slither_rogue_run_tip.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runTip } from '../src/games/slither_rogue/utils/runTip';

describe('slither_rogue runTip', () => {
  it('nudges a player who ate nothing', () => {
    expect(runTip({ score: 0, peakLength: 5, currentLength: 5, evolutionsCount: 0 })).toMatch(/fruit/i);
  });
  it('points a player with no evolution toward the cards', () => {
    expect(runTip({ score: 6, peakLength: 9, currentLength: 9, evolutionsCount: 0 })).toMatch(/evolution card/i);
  });
  it('mentions the Shield card when rivals took more than half the tail', () => {
    expect(runTip({ score: 20, peakLength: 30, currentLength: 12, evolutionsCount: 3 })).toMatch(/Shield/);
  });
  it('is encouraging otherwise, and never says died, dead or failed', () => {
    const tips = [
      runTip({ score: 20, peakLength: 30, currentLength: 28, evolutionsCount: 3 }),
      runTip({ score: 0, peakLength: 5, currentLength: 5, evolutionsCount: 0 }),
      runTip({ score: 20, peakLength: 30, currentLength: 12, evolutionsCount: 3 }),
    ];
    for (const t of tips) expect(t).not.toMatch(/\b(died|dead|death|failed|fail)\b/i);
    expect(tips[0]).toMatch(/^Nice run/);
  });
  it('is wired into the game-over card', () => {
    const modal = readFileSync(resolve(import.meta.dirname, '../src/games/slither_rogue/components/GameOverModal.tsx'), 'utf8');
    const app = readFileSync(resolve(import.meta.dirname, '../src/games/slither_rogue/App.tsx'), 'utf8');
    expect(modal).toContain("from '../utils/runTip'");
    expect(modal).toContain('runTip({');
    expect(app).toContain('currentLength={currentLength}');
  });
});
```

## 4. What NOT to do

- No change to any `.lua` file, to `GameCanvas.tsx`, `GameHUD.tsx` or the sound code. Do not add a "cause of death", a death event or any new game state: the run ends on the timer.
- No new evolution cards (out of scope until the loop retains players). Do not rename existing card text on the modal.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04): `cd ts && npx vitest run test_slither_rogue_run_tip.ts` fails to load (0 tests; `runTip.ts` does not exist).

After editing:
```
cd ts && npx vitest run test_slither_rogue_run_tip.ts test_slither_rogue_sound.ts
```
Real tail from a prototype of exactly these edits (2026-10-04): `Test Files  2 passed (2)` / `Tests  17 passed (17)` (5 tip tests, 12 sound tests).

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>.ts`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `npm run build:*`, `vite-node` or
  `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge, see Controller finish).
  Do not use `npx tsc` as a check: in a fresh worktree it reports unrelated errors about the gitignored `game-metadata.json`.
- Do not run `git merge origin/main`. If you need to know whether main moved, use `git fetch origin` then `git rev-list --count HEAD..origin/main`.
- Files you edit use CRLF line endings; keep them (the Edit tool preserves them). New files may use either; use CRLF to match.
- New behaviour goes in small new modules (SRP/KISS); no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `runTip.ts` exists as pasted; `GameOverModal.tsx` and `App.tsx` are edited as specified.
- [ ] Both test files pass (real tail pasted).
- [ ] No file outside the four in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the four tip texts as shipped. Evidence second: the real vitest tail. Say plainly that the cover screenshot and the Playwright start-to-game-over smoke are NOT done by this run (controller steps after `Slither_Rogue_Hygiene_Build_Directive` has added the build script).

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.
