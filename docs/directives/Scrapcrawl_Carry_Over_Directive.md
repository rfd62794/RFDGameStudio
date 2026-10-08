# scrapcrawl: keep proficiency between runs and show the best win (M)

**Depends on:** none (independent of `Scrapcrawl_Sim_Runs_Directive`; the sim test starts every run from a fresh player, so it is unaffected).
**Read first** (everything this run needs is pasted below; these are the files to open):
`ts/src/games/scrapcrawl/App.tsx`, `ts/src/games/scrapcrawl/components/RunEndScreen.tsx`, `ts/src/games/scrapcrawl/types.ts`, `ts/src/engine/shared/persistence.ts` (the shared save module, ADR-014), `ts/tests/test_scrapcrawl_run_end.ts`, `docs/demos/scrapcrawl/DIRECTION.md` (Replan step 2).

## 1. Why this exists

The game's hook is win-only proficiency, but a restart forgets it, so nothing carries from one run to the next. The direction: "show proficiency as the visible carry-over, keep it across runs via the shared persistence, add best-run".
Measured on origin/main `889dd21e`: `buildInitialState` in `App.tsx` calls `init_player` and uses it as is (proficiency starts at 0 every run); the only persisted value is `scrapcrawl_tutorial_seen`; the run-end card (`RunEndScreen.tsx`) shows rooms cleared, HP and scrap only. The Equipment table in `App.tsx` already has a Proficiency column per slot, so carried proficiency becomes visible with no new UI.

## 2. Scope

1. New module `<!-- new: ts/src/games/scrapcrawl/utils/carryOver.ts -->`: load, save, best win, clear.
2. `ts/src/games/scrapcrawl/App.tsx`: seed new runs, save after a win, record the best win, a title-screen "Reset saved progress" item.
3. `ts/src/games/scrapcrawl/components/RunEndScreen.tsx`: one extra stat line.
4. New test `<!-- new: ts/tests/test_scrapcrawl_carry_over.ts -->`.

## 3. The work

`App.tsx` and `RunEndScreen.tsx` use CRLF; keep it.

**Step 1: `carryOver.ts`.** Create it with exactly:

```ts
// new: ts/src/games/scrapcrawl/utils/carryOver.ts
// What a crawler keeps between runs: weapon/shield/armor proficiency and the best win.
import { loadSave, writeSave, clearSave } from '../../../engine/shared/persistence';
import type { PlayerState, ProficiencyXp } from '../types';

export const PROFICIENCY_KEY = 'scrapcrawl_proficiency';
export const BEST_RUN_KEY = 'scrapcrawl_best_run';

const ZERO_XP: ProficiencyXp = { weapon: 0, shield: 0, armor: 0 };

function cleanXp(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

export function savedProficiency(): ProficiencyXp {
  const raw = loadSave<Partial<ProficiencyXp>>(PROFICIENCY_KEY);
  if (!raw || typeof raw !== 'object') return { ...ZERO_XP };
  return { weapon: cleanXp(raw.weapon), shield: cleanXp(raw.shield), armor: cleanXp(raw.armor) };
}

export function saveProficiency(xp: ProficiencyXp): void {
  writeSave(PROFICIENCY_KEY, { weapon: cleanXp(xp.weapon), shield: cleanXp(xp.shield), armor: cleanXp(xp.armor) });
}

/** A fresh player that starts with the proficiency earned in earlier runs. */
export function withSavedProficiency(player: PlayerState): PlayerState {
  return { ...player, proficiencyXp: savedProficiency() };
}

/** Best winning run so far, as HP left (higher is better); null before the first win. */
export function bestWinHp(): number | null {
  const raw = loadSave<number>(BEST_RUN_KEY);
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

export function recordWin(hpLeft: number): { best: number; improved: boolean } {
  const prev = bestWinHp();
  const improved = prev === null || hpLeft > prev;
  const best = improved ? hpLeft : (prev as number);
  if (improved) writeSave(BEST_RUN_KEY, hpLeft);
  return { best, improved };
}

export function clearCarryOver(): void {
  clearSave(PROFICIENCY_KEY);
  clearSave(BEST_RUN_KEY);
}
```

**Step 2: `App.tsx`.** Five edits:
1. Directly under `import { newRun, applyFight, applyMove, fightRoomIds } from './utils/runEnd';` add `import { withSavedProficiency, saveProficiency, recordWin, clearCarryOver } from './utils/carryOver';`.
2. In `buildInitialState`, change `const player = session.executor.call('init_player')[0] as PlayerState;` to `const player = withSavedProficiency(session.executor.call('init_player')[0] as PlayerState);`.
3. In `handleFight`, directly after the line `if (prevWeaponLife > 0 && nextWeaponLife === 0) sound.playBreak();` add:
```tsx
    if (result.won) saveProficiency(result.player.proficiencyXp);
    const nextRun = applyFight(state.run, rooms, state.currentRoom.id, result.won);
    if (nextRun.outcome === 'won') recordWin(nextRun.hp);
```
and inside the `setState` call below it replace `run: applyFight(prev.run, rooms, prev.currentRoom.id, result.won),` with `run: nextRun,`.
4. Directly above `const handlePrimerBegin = useCallback` add:
```tsx
  const handleResetProgress = useCallback(() => {
    sound.playUiConfirm();
    clearCarryOver();
    setState(buildInitialState(session));
  }, [session, setState]);

```
5. In the title screen's `menuItems`, directly after the `new-game` item add `{ id: 'reset-progress', label: 'Reset saved progress', variant: 'secondary', onClick: handleResetProgress },`.

**Step 3: `RunEndScreen.tsx`.** Three edits: add `import { bestWinHp } from '../utils/carryOver';` under the `runEnd` type import; add `const best = bestWinHp();` under `const won = run.outcome === 'won';`; and in the `stats` array add, after the Scrap entry, `...(best !== null ? [{ label: 'Best win (HP left)', value: best }] : []),`.

**Step 4: test.** Create `ts/tests/test_scrapcrawl_carry_over.ts` with exactly:

```ts
// new: ts/tests/test_scrapcrawl_carry_over.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PROFICIENCY_KEY, BEST_RUN_KEY, savedProficiency, saveProficiency,
  withSavedProficiency, bestWinHp, recordWin, clearCarryOver,
} from '../src/games/scrapcrawl/utils/carryOver';
import type { PlayerState } from '../src/games/scrapcrawl/types';

const basePlayer = (): PlayerState => ({
  currentRoomId: 'home_base', scrap: 0, tier2Unlocked: false, equipped: {},
  proficiencyXp: { weapon: 0, shield: 0, armor: 0 }, roster: [], sculptedCache: {},
});

describe('scrapcrawl carry-over', () => {
  beforeEach(() => { localStorage.clear(); });

  it('starts empty', () => {
    expect(savedProficiency()).toEqual({ weapon: 0, shield: 0, armor: 0 });
    expect(bestWinHp()).toBeNull();
  });

  it('proficiency survives a restart (save, then a fresh player picks it up)', () => {
    saveProficiency({ weapon: 45, shield: 0, armor: 15 });
    expect(withSavedProficiency(basePlayer()).proficiencyXp).toEqual({ weapon: 45, shield: 0, armor: 15 });
  });

  it('ignores corrupt saves', () => {
    localStorage.setItem(PROFICIENCY_KEY, '{not json');
    expect(savedProficiency()).toEqual({ weapon: 0, shield: 0, armor: 0 });
    localStorage.setItem(PROFICIENCY_KEY, JSON.stringify({ weapon: -5, shield: 'x', armor: 7 }));
    expect(savedProficiency()).toEqual({ weapon: 0, shield: 0, armor: 7 });
  });

  it('keeps the best win and only improves upward', () => {
    expect(recordWin(4)).toEqual({ best: 4, improved: true });
    expect(recordWin(2)).toEqual({ best: 4, improved: false });
    expect(recordWin(8)).toEqual({ best: 8, improved: true });
    expect(bestWinHp()).toBe(8);
  });

  it('clearCarryOver forgets both', () => {
    saveProficiency({ weapon: 15, shield: 0, armor: 0 });
    recordWin(6);
    clearCarryOver();
    expect(localStorage.getItem(PROFICIENCY_KEY)).toBeNull();
    expect(localStorage.getItem(BEST_RUN_KEY)).toBeNull();
  });
});

describe('scrapcrawl carry-over wiring', () => {
  const read = (rel: string) => readFileSync(resolve(import.meta.dirname, '../src/games/scrapcrawl', rel), 'utf8');
  it('App seeds new runs from saved proficiency, saves after a win and records the best win', () => {
    const app = read('App.tsx');
    expect(app).toContain('withSavedProficiency(session.executor.call');
    expect(app).toContain('saveProficiency(result.player.proficiencyXp)');
    expect(app).toContain('recordWin(nextRun.hp)');
    expect(app).toContain('Reset saved progress');
  });
  it('the end screen shows the best win', () => {
    expect(read('components/RunEndScreen.tsx')).toContain('Best win (HP left)');
  });
});
```

## 4. What NOT to do

- No change to `games/scrapcrawl/*.lua` or `data.yaml` (Lua stays frozen) or to `runEnd.ts` (its HP numbers are pinned by `Scrapcrawl_Sim_Runs_Directive`).
- Do not persist gear, scrap or the current room: only proficiency and the best win carry over. No cloud save, no accounts, no player layer.
- Do not touch `examples/scrapcrawl`. No new dependency. No sound changes.
- Do not add a new screen or a progress bar: the existing Proficiency column is the display.
- No deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing (the new test against origin/main `889dd21e`, verified 2026-10-04): `cd ts && npx vitest run test_scrapcrawl_carry_over.ts` fails to load (0 tests; `carryOver.ts` does not exist).

After editing:
```
cd ts && npx vitest run test_scrapcrawl_carry_over.ts test_scrapcrawl_run_end.ts
```
Real tail from a prototype of exactly these edits (2026-10-04): `Test Files  2 passed (2)` / `Tests  13 passed (13)` (7 carry-over tests, 6 run-end tests).

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

- [ ] `carryOver.ts` exists as pasted; `App.tsx` and `RunEndScreen.tsx` are edited as specified.
- [ ] Both test files pass (real tail pasted).
- [ ] No file outside the four in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: what now carries across runs and what does not (gear and scrap reset). Evidence second: the real vitest tail. Say plainly that proficiency raises later win odds (up to 1.5x on the weapon, at 15 XP per win, ceiling 500 XP), so repeat players get an easier crawl; whether that is wanted is Robert's call. The browser check (restart keeps proficiency, a win shows the best line) is a controller step after `cd ts && npm run build:scrapcrawl`.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or the demo-lists snapshot fixture under `tests/fixtures/`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-scrapcrawl-carry-over-directive |
| Base branch | - |
| Base commit | 4b63b0d175e7392f735c840d922839f2b371c36b |

**Status log**
- 2026-10-04 13:28 · agentflow-tick · none → Queued — suggested by heartbeat: Fully specified, quoted lines verified against the live App.tsx; worktree-only TS change for Devin
- 2026-10-08 05:29 · robert-claude-laptop · Queued → Approved
- 2026-10-08 05:29 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-scrapcrawl-carry-over-directive; lane=default; model=swe-2-high; persona=steady-builder; agent_id=01M4DDJ19DS657HWJ6DC04ZD9W
- 2026-10-08 05:30 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-scrapcrawl-carry-over-directive; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
