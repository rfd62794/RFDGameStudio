# Planet of Greed: an ending screen with a summary, Play again and Continue to Facility Escape

**Depends on:** none

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/planetofgreed/DIRECTION.md` (Replan item 2), `docs/gdd/PlanetOfGreed_Design_v0.2.md` (lines 119-185),
`ts/src/games/planetofgreed/App.tsx` (lines 1810-1865 only), `ts/src/games/planetofgreed/flavorText.ts` (the `ENDING_TEXT` block), `ts/src/games/planetofgreed/endingSystem.ts`, `ts/src/arcade/routing.ts`.

## 1. Why this exists

A player who reaches Rank 1 in Planet of Greed gets an ending screen with the story text and a fragment count, and then only one button, "Begin New Campaign" (`ts/src/games/planetofgreed/App.tsx`, the `gameState.endingEvent` block near line 1818; text in `flavorText.ts` `ENDING_TEXT`). There is no summary of how the campaign went and no way forward: the design says the ending hands off to Chapter 2, Facility Escape
(`docs/gdd/PlanetOfGreed_Design_v0.2.md` lines 127-131), which is already an arcade game (`ts/src/games/facility_escape/config.ts`). `docs/demos/planetofgreed/DIRECTION.md`: "a long campaign ends in a dead end".
Robert's decision (2026-10-04, all recommendations approved): one ending screen with the player's House, Rank, fragments x of 6, "Play again" and "Continue to Facility Escape". Measured on origin/main `afb1cefe`.

Facts you need (verified; do not re-derive):
- The ending overlay already has the stable test ids `pog-ending-placeholder`, `pog-ending-fragment-count`, `pog-restart-after-ending`; the e2e tests (`tests/e2e/test_planetofgreed_e2e.py`, `_v2.py`) and `ts/tests/test_planetofgreed_shell_opening.ts` / `test_planetofgreed_style_split.ts` read them in `App.tsx`. They must stay.
- In `App.tsx`, `mode` is `'standalone'` or `'arcade'` (line 289) and `playerCorp` (line 1557) is in scope where the overlay renders. In the arcade app all games share one page and switch with `?game=<id>` (`ts/src/arcade/routing.ts` `navigateTo`). A standalone (itch) build has no known arcade address, so there the Continue link is simply not shown.
- Baseline, real: `cd ts && npx vitest run test_planetofgreed` gives `Test Files  11 passed (11)` / `Tests  169 passed (169)`.

## 2. Scope

1. New `<!-- new: ts/src/games/planetofgreed/gameLinks.ts -->` (one pure helper) and `<!-- new: ts/src/games/planetofgreed/endingView.ts -->` (pure view model).
2. `ts/src/games/planetofgreed/App.tsx`: the ending overlay only, plus one import line.
3. `ts/src/games/planetofgreed/flavorText.ts`: one string.
4. New test `<!-- new: ts/tests/test_planetofgreed_ending_view.ts -->`.

## 3. The work

`App.tsx` and `flavorText.ts` are CRLF files; keep their endings. New files use CRLF too.

**Step 1: `gameLinks.ts`.** Create with exactly:

```ts
// new: ts/src/games/planetofgreed/gameLinks.ts

/**
 * Link target for another game from inside Planet of Greed. In the arcade app the games share one
 * page and switch with `?game=<id>`. A standalone build has no known arcade address, so it returns
 * null and the screen shows no link rather than a broken one.
 */
export function arcadeGameHref(mode: 'arcade' | 'standalone', currentHref: string, gameId: string): string | null {
  if (mode !== 'arcade') return null;
  const base = currentHref.split('?')[0].split('#')[0];
  return `${base}?game=${gameId}`;
}
```

**Step 2: `endingView.ts`.** Create with exactly:

```ts
// new: ts/src/games/planetofgreed/endingView.ts
import type { Corporation, EndingEvent, GameDate } from './types';
import { arcadeGameHref } from './gameLinks';

/** The chapter the ending hands off to (docs/gdd/PlanetOfGreed_Design_v0.2.md, Chapter 2). */
export const NEXT_CHAPTER_ID = 'facility_escape';
export const NEXT_CHAPTER_LABEL = 'Continue to Facility Escape';

export interface EndingViewModel {
  houseName: string;
  /** e.g. "Rank 1" */
  rankLabel: string;
  /** e.g. "4 of 6" */
  fragmentsLabel: string;
  /** e.g. "Year 3" */
  yearLabel: string;
  allFragments: boolean;
}

/** Pure: everything the ending screen shows about the finished campaign. */
export function buildEndingViewModel(
  player: Pick<Corporation, 'name' | 'rank'>,
  event: EndingEvent,
  date: Pick<GameDate, 'year'>,
): EndingViewModel {
  return {
    houseName: player.name,
    rankLabel: `Rank ${player.rank}`,
    fragmentsLabel: `${event.fragmentCount} of ${event.total}`,
    yearLabel: `Year ${Math.max(1, Math.min(date.year, 3))}`,
    allFragments: event.fragmentCount === event.total,
  };
}

export function nextChapterHref(mode: 'arcade' | 'standalone', currentHref: string): string | null {
  return arcadeGameHref(mode, currentHref, NEXT_CHAPTER_ID);
}
```

**Step 3: `flavorText.ts`.** In `ENDING_TEXT`, change `restartLabel: 'Begin New Campaign',` to `restartLabel: 'Play again',`.

**Step 4: `App.tsx`.** Two edits.
1. After the line `import { checkEnding } from './endingSystem';` add:
`import { buildEndingViewModel, nextChapterHref, NEXT_CHAPTER_LABEL } from './endingView';`
2. In the ending overlay, replace this block (it ends the fragment readout box and the restart button):
```
              <p className="text-[10px] text-amber-100/50 mt-3 italic font-serif leading-relaxed text-left">
                {gameState.endingEvent.fragmentCount === gameState.endingEvent.total
                  ? ENDING_TEXT.fragmentComplete
                  : ENDING_TEXT.fragmentIncomplete}
              </p>
            </div>
            <button
              onClick={handleRequestNewGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-black border-2 border-amber-400 py-3 text-xs font-mono uppercase tracking-widest transition cursor-pointer"
              id="btn-restart-after-ending"
              data-testid="pog-restart-after-ending"
            >
              {ENDING_TEXT.restartLabel}
            </button>
```
with:
```
              <p className="text-[10px] text-amber-100/50 mt-3 italic font-serif leading-relaxed text-left">
                {gameState.endingEvent.fragmentCount === gameState.endingEvent.total
                  ? ENDING_TEXT.fragmentComplete
                  : ENDING_TEXT.fragmentIncomplete}
              </p>
              {(() => {
                const summary = buildEndingViewModel(playerCorp, gameState.endingEvent, gameState.date);
                return (
                  <div className="mt-3 pt-3 border-t border-amber-700/30 text-left text-amber-100/70" data-testid="pog-ending-summary">
                    <div>{summary.houseName} finished at {summary.rankLabel} in {summary.yearLabel}.</div>
                    <div>Fragments gathered: {summary.fragmentsLabel}.</div>
                  </div>
                );
              })()}
            </div>
            <button
              onClick={handleRequestNewGame}
              className="w-full bg-amber-600 hover:bg-amber-500 text-[#1a1a2e] font-black border-2 border-amber-400 py-3 text-xs font-mono uppercase tracking-widest transition cursor-pointer"
              id="btn-restart-after-ending"
              data-testid="pog-restart-after-ending"
            >
              {ENDING_TEXT.restartLabel}
            </button>
            {nextChapterHref(mode, window.location.href) && (
              <a
                href={nextChapterHref(mode, window.location.href) ?? undefined}
                className="block w-full text-center border-2 border-amber-600/70 text-amber-200 hover:bg-amber-900/40 py-3 text-xs font-mono uppercase tracking-widest transition"
                data-testid="pog-ending-continue"
              >
                {NEXT_CHAPTER_LABEL}
              </a>
            )}
```
(The first `<p>` and the closing `</div>` are included only to anchor the edit; they do not change.)

**Step 5: the test.** Create `ts/tests/test_planetofgreed_ending_view.ts` with exactly:

```ts
// new: ts/tests/test_planetofgreed_ending_view.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEndingViewModel, nextChapterHref, NEXT_CHAPTER_ID, NEXT_CHAPTER_LABEL,
} from '../src/games/planetofgreed/endingView';
import { ENDING_TEXT } from '../src/games/planetofgreed/flavorText';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const appSource = readFileSync(resolve(repoRoot, 'ts/src/games/planetofgreed/App.tsx'), 'utf-8');

describe('test_planetofgreed_ending_view', () => {
  it('builds the summary lines from the finished campaign', () => {
    const vm = buildEndingViewModel({ name: 'Ember Ironworks', rank: 1 }, { type: 'ENDING_TRIGGERED', fragmentCount: 4, total: 6 }, { year: 3 });
    expect(vm).toEqual({
      houseName: 'Ember Ironworks',
      rankLabel: 'Rank 1',
      fragmentsLabel: '4 of 6',
      yearLabel: 'Year 3',
      allFragments: false,
    });
  });

  it('flags a complete set of fragments and clamps the year to the 3-year campaign', () => {
    const vm = buildEndingViewModel({ name: 'Tidewell Capital', rank: 1 }, { type: 'ENDING_TRIGGERED', fragmentCount: 6, total: 6 }, { year: 4 });
    expect(vm.allFragments).toBe(true);
    expect(vm.yearLabel).toBe('Year 3');
    expect(buildEndingViewModel({ name: 'X', rank: 1 }, { type: 'ENDING_TRIGGERED', fragmentCount: 1, total: 6 }, { year: 0 }).yearLabel).toBe('Year 1');
  });

  it('links to Facility Escape in the arcade and shows no link in a standalone build', () => {
    expect(NEXT_CHAPTER_ID).toBe('facility_escape');
    expect(nextChapterHref('arcade', 'https://rfditservices.com/play/?game=planetofgreed#top')).toBe('https://rfditservices.com/play/?game=facility_escape');
    expect(nextChapterHref('standalone', 'https://example.com/')).toBeNull();
  });

  it('player-facing labels are plain and the ending screen wires them in', () => {
    expect(NEXT_CHAPTER_LABEL).toBe('Continue to Facility Escape');
    expect(ENDING_TEXT.restartLabel).toBe('Play again');
    expect(appSource).toContain('data-testid="pog-ending-continue"');
    expect(appSource).toContain('data-testid="pog-ending-summary"');
    // identifiers the e2e tests and older tests rely on stay
    expect(appSource).toContain('data-testid="pog-ending-placeholder"');
    expect(appSource).toContain('data-testid="pog-restart-after-ending"');
    expect(appSource).toContain('pog-ending-fragment-count');
  });
});
```

## 4. What NOT to do

- Do not change `endingSystem.ts`, the ending trigger, `checkEnding`, `GameState`, the Annual Report, saves (the `corpworld_state` key stays), or any game rule. The summary only READS `playerCorp`, `endingEvent` and `date`.
- Do not remove or rename `pog-ending-placeholder`, `pog-ending-fragment-count` or `pog-restart-after-ending`.
- Do not rewrite the ending story text (`ENDING_TEXT.title/subtitle/body/fragment*`); only the restart label changes.
- Do not touch `BoardroomHeader`, `FactionTheme` or other shared chrome (other games use them).
- No Lua, no engine changes, no deploys, no protected repos, no player layer or cloud saves. Do not touch `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_planetofgreed_ending_view.ts
```
Real tail from the prototype of these exact files: `Test Files  1 passed (1)` / `Tests  4 passed (4)`.
```
cd ts && npx vitest run test_planetofgreed
```
Real tail from the prototype: `Test Files  12 passed (12)` / `Tests  173 passed (173)` (baseline 11 files / 169 tests plus the 4 new).
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors (generated file); nothing mentions `planetofgreed`.

Controller step, not this run: a screenshot of the ending overlay at 1280x720 and 390x844 (reach Rank 1 or temporarily force `endingEvent`) and a click-through of "Continue to Facility Escape" in the arcade app.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line `cd ts && npx vitest run <bare-filename>.ts [<bare-filename>.ts]` (and `uv run pytest ...` where named below). Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use bare test filenames as filters (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Do not run `agentflow lint` or any agentflow command. Do NOT run `uv run python -m studio.demos index`, any `npm run build:*`, `vite-node`, or `git merge origin/main` (the sandbox refuses them).
- Match each file's existing line endings (the Edit tool preserves them); do not convert.
- `examples/` folders are AI Studio exports (untrusted code). New logic goes in small new modules; no file over 600 lines unless it already is (then do not grow it by more than the lines named here).
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] `gameLinks.ts`, `endingView.ts` and the test exist with the exact content above; `flavorText.ts` has `restartLabel: 'Play again'`.
- [ ] `App.tsx` has the import line and the replaced overlay block; the three old test ids are still present (the existing planetofgreed tests prove it).
- [ ] `cd ts && npx vitest run test_planetofgreed` passes: 12 files, 173 tests (real tail pasted); `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed and whether any quoted line differed from the file. Evidence second: real tails of `uv run python --version`, the two vitest commands and `tsc --noEmit`.
Then state plainly what was not run (screenshots, the live click-through) for the controller; deploying is Robert's.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-planet-of-greed-ending-screen-directive |
| Base branch | - |
| Base commit | 95d302292a085794d8fe9e4cc595ec4c5d13de96 |

**Status log**
- 2026-10-04 14:36 · robert-claude-laptop · none → Queued
- 2026-10-04 19:03 · robert-claude-laptop · Queued → Approved — lint override: path hits are 'do not edit' mentions and a gitignored generated file (game-metadata.json), verified by hand
- 2026-10-04 22:14 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planet-of-greed-ending-screen-directive; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 22:15 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-planet-of-greed-ending-screen-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
