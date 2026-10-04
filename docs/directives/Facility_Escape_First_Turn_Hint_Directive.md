# facility_escape: a three-line hint before the first move (S)

**Depends on:** `Facility_Escape_Player_Wording_Directive` (merged first: both edit `examples/facility-escape/src/App.tsx`).
**Read first** (everything this run needs is pasted below; these are the files to open):
`examples/facility-escape/src/App.tsx` (the playing state, search for `State B`), `docs/demos/facility_escape/DIRECTION.md` (Replan step 2).

## 1. Why this exists

A newcomer has no hint that the guards' sightlines are the whole game (direction: "whether a newcomer understands that sightlines are the whole game is unverified... no hint on turn one"). The how-to text lives on the start screen only, which a player skips.
Measured on origin/main `889dd21e`: the playing state (`gameState.gameState === 'playing'`) opens straight onto the board with no hint; `gameState.roomNumber` and `gameState.turnCount` exist (App.tsx lines 52 and 101 initialise them).
Already present, do not rebuild: a `Room {n}/{MAX_ROOMS}` indicator and a final result card with rooms cleared, turns and hearts. (The direction's "room counter" and "final result card" items are already done.)

## 2. Scope

1. New module `<!-- new: examples/facility-escape/src/utils/firstTurnHint.ts -->`: the three lines and the rule for when to show them.
2. `examples/facility-escape/src/App.tsx`: import it and render the hint at the top of the playing state.
3. New test `<!-- new: ts/tests/test_facility_escape_first_turn_hint.ts -->`.

## 3. The work

`App.tsx` uses CRLF; keep it.

**Step 1: `examples/facility-escape/src/utils/firstTurnHint.ts`.** Create it with exactly:

```ts
/** Three plain lines shown once, before the player's first move in Room 1. */
export const FIRST_TURN_HINT: readonly string[] = [
  'Guards show their next move before you act.',
  'Stay out of their sightline.',
  'Reach the exit at the top-right.',
];

export function shouldShowFirstTurnHint(roomNumber: number, turnCount: number): boolean {
  return roomNumber === 1 && turnCount === 0;
}
```

**Step 2: `App.tsx`.** Two edits:
1. Directly under `import GameLog from './components/GameLog';` add `import { FIRST_TURN_HINT, shouldShowFirstTurnHint } from './utils/firstTurnHint';`.
2. Directly under the line `<div className="w-full flex flex-col gap-4">` that opens the playing state (the one right after `{gameState.gameState === 'playing' && (`), add:
```tsx
            {shouldShowFirstTurnHint(gameState.roomNumber, gameState.turnCount) && (
              <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 text-xs font-mono text-sky-200" role="note">
                {FIRST_TURN_HINT.map(line => (<p key={line}>{line}</p>))}
              </div>
            )}
```
The hint disappears by itself after the first move (`turnCount` becomes 1) and never shows in Room 2 or later.

**Step 3: `ts/tests/test_facility_escape_first_turn_hint.ts`.** Create it with exactly:

```ts
// new: ts/tests/test_facility_escape_first_turn_hint.ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FIRST_TURN_HINT, shouldShowFirstTurnHint } from '../../examples/facility-escape/src/utils/firstTurnHint';

describe('facility_escape first-turn hint', () => {
  it('shows only in Room 1 before the first move', () => {
    expect(shouldShowFirstTurnHint(1, 0)).toBe(true);
    expect(shouldShowFirstTurnHint(1, 1)).toBe(false);
    expect(shouldShowFirstTurnHint(2, 0)).toBe(false);
  });
  it('is exactly three plain lines', () => {
    expect(FIRST_TURN_HINT).toHaveLength(3);
    expect(FIRST_TURN_HINT.join(' ').toLowerCase()).toContain('guards show their next move');
  });
  it('is wired into App.tsx', () => {
    const app = readFileSync(resolve(import.meta.dirname, '../../examples/facility-escape/src/App.tsx'), 'utf8');
    expect(app).toContain("from './utils/firstTurnHint'");
    expect(app).toContain('shouldShowFirstTurnHint(gameState.roomNumber, gameState.turnCount)');
  });
});
```

## 4. What NOT to do

- No change to the solver, generator, guard AI, physics or turn engine, or to `types.ts`. No tutorial system, no dismiss button, no persistence of "seen" (the rule above is enough).
- Do not change any player wording outside the new hint (the previous directive owns that).
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04): `cd ts && npx vitest run test_facility_escape_first_turn_hint.ts` fails to load (0 tests; `firstTurnHint.ts` does not exist).

After editing:
```
cd ts && npx vitest run test_facility_escape_first_turn_hint.ts test_facility_escape_player_copy.ts
```
Real tail from a prototype of exactly these edits on top of the wording directive (2026-10-04): `Test Files  2 passed (2)` / `Tests  5 passed (5)`.

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

- [ ] `firstTurnHint.ts` exists as pasted; `App.tsx` imports it and renders the note at the top of the playing state.
- [ ] Both test files pass (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the three hint lines as shipped. Evidence second: the real vitest tail. Say plainly that the Playwright check (cold load reaches the first move within 60 seconds with the hint visible) and the 390x844 phone check are NOT done by this run; the controller does them after rebuilding the embed.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Approved |
| Assigned to | devin |
| Branch | - |
| Base branch | - |

**Status log**
- 2026-10-04 13:20 · agentflow-tick · none → Queued — suggested by heartbeat: Fully pasted S change for Devin; dispatch only after Facility_Escape_Player_Wording_Directive merges (same App.tsx).
- 2026-10-04 19:03 · robert-claude-laptop · Queued → Approved — lint override: path hit is a 'do not edit' mention (demo_lists_snapshot.json), verified by hand
<!-- queue:end -->
