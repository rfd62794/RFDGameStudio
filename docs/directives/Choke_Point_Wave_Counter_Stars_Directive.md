# choke_point: "Wave 2 of 6" counter and a star rating on the win card (S)

**Depends on:** `Choke_Point_Waves_3_To_6_Directive` (merged first: the counter reads the wave count from the data file).
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/choke_point/App.tsx`, `ts/src/games/choke_point/outcome.ts`, `ts/tests/test_choke_point_ui.ts` (how a UI test renders the game), `docs/demos/choke_point/DIRECTION.md` (Replan step 3).

## 1. Why this exists

A player cannot tell how far through the defence they are, and the win card says "DEFENSE HELD" with a single button and no sense of how well they did (`ts/src/games/choke_point/App.tsx`: the victory `Card` at about lines 104 to 110; the Tactical Resources card shows only Energy). Direction: "wave counter, star rating (core HP left), result card with Play again".
Measured on origin/main `889dd21e`: the victory card text is `All waves cleared. The core is intact.` plus a `Play Again` button; no wave number is shown anywhere during play. Core HP starts at `constants.start_core_hp` (10, `games/choke_point/data.yaml`).
(The cover image is a screenshot and needs a browser: it is a controller step, not part of this run.)

## 2. Scope

1. New module `<!-- new: ts/src/games/choke_point/rating.ts -->`: pure `starsForCoreHp` and `waveLabel`.
2. `ts/src/games/choke_point/App.tsx`: show `waveLabel(...)` in the Tactical Resources card and the stars on the victory card.
3. New tests `<!-- new: ts/tests/test_choke_point_rating.ts -->` and `<!-- new: ts/tests/test_choke_point_wave_counter.ts -->`.

## 3. The work

`App.tsx` uses CRLF; keep it.

**Step 1: `ts/src/games/choke_point/rating.ts`.** Create it with exactly:

```ts
/** Star rating for a held defence, from the core hit points left. */
export const MAX_STARS = 3;

export function starsForCoreHp(coreHp: number, startCoreHp: number): number {
  if (coreHp <= 0 || startCoreHp <= 0) return 0;
  const share = coreHp / startCoreHp;
  if (share >= 0.8) return 3;
  if (share >= 0.5) return 2;
  return 1;
}

/** "Wave 2 of 6" for the status line; never past the last wave. */
export function waveLabel(wave: number, totalWaves: number): string {
  const shown = Math.min(Math.max(1, Math.round(wave)), Math.max(1, totalWaves));
  return `Wave ${shown} of ${Math.max(1, totalWaves)}`;
}
```

**Step 2: `App.tsx`.** Four edits:
1. Add `import { MAX_STARS, starsForCoreHp, waveLabel } from './rating';` directly under `import { isVictory } from './outcome';`.
2. Directly under `const isWon = isVictory(state);` add:
```tsx
  const totalWaves = Object.keys((data.waves ?? {}) as Record<string, unknown>).length;
  const startCoreHp = ((data.constants ?? {}) as Record<string, number>).start_core_hp ?? 10;
  const stars = starsForCoreHp(state.core_hp, startCoreHp);
```
3. In the victory card, change `<p className="text-slate-300 mb-6 font-mono">All waves cleared. The core is intact.</p>` to `<p className="text-slate-300 mb-2 font-mono">All waves cleared. The core is intact.</p>` and add directly after it:
```tsx
          <p className="text-3xl mb-6 text-yellow-400" aria-label={`${stars} of ${MAX_STARS} stars`}>{'\u2605'.repeat(stars)}{'\u2606'.repeat(MAX_STARS - stars)}</p>
```
(the `\u2605` and `\u2606` are written as escapes inside the string literal, so the file stays ASCII; do not paste the star characters themselves.)
4. In the Tactical Resources card, directly above `<span className="text-sm">Available Energy:</span>` add `<span className="text-sm">{waveLabel(state.wave, totalWaves)}</span>`.

**Step 3: tests.** Create `ts/tests/test_choke_point_rating.ts` with exactly:

```ts
// new: ts/tests/test_choke_point_rating.ts
import { describe, it, expect } from 'vitest';
import { starsForCoreHp, waveLabel, MAX_STARS } from '../src/games/choke_point/rating';

describe('choke_point rating', () => {
  it('gives 3 stars for 8 or more of 10 core HP, 2 for 5 to 7, 1 for 1 to 4, 0 when breached', () => {
    expect(starsForCoreHp(10, 10)).toBe(3);
    expect(starsForCoreHp(8, 10)).toBe(3);
    expect(starsForCoreHp(7, 10)).toBe(2);
    expect(starsForCoreHp(5, 10)).toBe(2);
    expect(starsForCoreHp(4, 10)).toBe(1);
    expect(starsForCoreHp(1, 10)).toBe(1);
    expect(starsForCoreHp(0, 10)).toBe(0);
  });
  it('never exceeds MAX_STARS and tolerates a bad start value', () => {
    expect(starsForCoreHp(99, 10)).toBeLessThanOrEqual(MAX_STARS);
    expect(starsForCoreHp(5, 0)).toBe(0);
  });
  it('labels the wave and clamps to the last wave', () => {
    expect(waveLabel(1, 6)).toBe('Wave 1 of 6');
    expect(waveLabel(2.0, 6)).toBe('Wave 2 of 6');
    expect(waveLabel(9, 6)).toBe('Wave 6 of 6');
  });
});
```
and `ts/tests/test_choke_point_wave_counter.ts` with exactly:

```ts
// new: ts/tests/test_choke_point_wave_counter.ts
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { loadGame } from '../src/engine/runtime';
import App from '../src/games/choke_point/App';

describe('Choke Point wave counter', () => {
  it('shows "Wave 1 of N" once play starts, N from the data file', async () => {
    const session = loadGame('choke_point');
    const total = Object.keys((session.files.data as { waves: Record<string, unknown> }).waves).length;
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => { root.render(React.createElement(App, { session })); });
    const start = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Establish Connection'));
    await act(async () => { start!.click(); });
    expect(container.textContent).toContain(`Wave 1 of ${total}`);
    root.unmount();
  });
});
```

## 4. What NOT to do

- No change to `logic.lua`, `data.yaml`, `outcome.ts` or `types.ts`. No new mechanics: the star rating is computed from the existing `core_hp`.
- Do not store best stars anywhere (no persistence in this directive). No sound changes.
- Do not rename or remove the existing `Restart`, `Play Again` or `Reset Grid` controls or the text `DEFENSE HELD`.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new tests against origin/main `889dd21e`, verified 2026-10-04): `cd ts && npx vitest run test_choke_point_wave_counter.ts` fails (`Wave 1 of` is not in the page: 1 failed), and `test_choke_point_rating.ts` fails to load (0 tests, `rating.ts` does not exist).

After editing:
```
cd ts && npx vitest run test_choke_point_rating.ts test_choke_point_wave_counter.ts test_choke_point_ui.ts test_choke_point_restart.ts test_choke_point_waves.ts
```
Real tail from a prototype of exactly these edits (2026-10-04, on top of the first two choke_point directives): `Test Files  5 passed (5)` / `Tests  12 passed (12)`.

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

- [ ] `rating.ts` exists as pasted; `App.tsx` shows the wave label and the stars as specified.
- [ ] The five test files above pass (real tail pasted).
- [ ] No file outside the four in Scope (rating.ts, App.tsx, the two new tests) changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the star thresholds as shipped (3 stars at 80 percent or more core HP, 2 at 50 percent or more, 1 otherwise) and the text the player sees. Evidence second: the real vitest tail. Say plainly that the cover screenshot and a Playwright cold-load plus one full win run are NOT done by this run; the controller does them after merge (`cd ts && npm run build:choke_point`, then the browser pass).

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:25 · robert-claude-laptop · none → Queued
<!-- queue:end -->
