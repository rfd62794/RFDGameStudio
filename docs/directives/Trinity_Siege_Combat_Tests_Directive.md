# trinity_siege: vouch for the combat table with unit tests, and correct its board row (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`examples/trinity-siege/src/combat.ts`, `examples/trinity-siege/src/types.ts`, `ts/src/status/board.data.ts` (the `trinity_siege` row), `ts/tests/test_systemic_extract_restart.ts` (how a studio test imports from `examples/`), `docs/demos/trinity_siege/DIRECTION.md` (Replan step 1).

## 1. Why this exists

Nobody has tested `combat.ts`, and an older note called its combat "fabricated logic" (removed from the blurb in Tier A, never verified either way). Separately the status board row for `trinity_siege` still describes a different, unbuilt game: `Bevy vs. egui architecture question left unresolved`, status `status_unconfirmed`, last updated 2026-08-15 (`ts/src/status/board.data.ts`, the `trinity_siege` row).
Measured on origin/main `889dd21e` (2026-10-04): the 12 tests below, written against the real `combat.ts`, ALL PASS on current code, so the combat table is sound: `SHAPE_MATRIX` is a Circle > Square > Triangle > Circle cycle (1.5 / 1.0 / 0.5) and symmetric (A vs B plus B vs A = 2.0), `RACE_LEAN` is 1.0 for both sides, `selectBestDefender` picks the counter shape, `resolvePaired` gives breach / both-fall / counter-wins / wall-doubles outcomes, and a wave-5-sized attack (3 + floor(4/2) = 5 units) falls to five counter-shaped defenders.
What the program actually is: a hex-ring wave defence (5 waves, 15 lives) embedded at `/arcade/trinity_siege/`.

## 2. Scope

1. New tests `<!-- new: ts/tests/test_trinity_siege_combat.ts -->` and `<!-- new: ts/tests/test_board_row_trinity_siege.ts -->`.
2. `ts/src/status/board.data.ts`: rewrite the `trinity_siege` row (one entry).

## 3. The work

`board.data.ts` uses CRLF; keep it.

**Step 1: the combat tests.** Create `ts/tests/test_trinity_siege_combat.ts` with exactly:

```ts
// new: ts/tests/test_trinity_siege_combat.ts
//
// Unit tests for the embed's combat table (examples/trinity-siege/src/combat.ts), imported
// directly like test_systemic_extract_restart.ts does. No rendering.
import { describe, it, expect } from 'vitest';
import {
  UnitShape, Race, SHAPE_MATRIX, RACE_LEAN, MAX_WAVES, LIVES_STARTING,
  type Unit, type OrcUnit,
} from '../../examples/trinity-siege/src/types';
import { selectBestDefender, resolvePaired } from '../../examples/trinity-siege/src/combat';

const SHAPES = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE];
const COUNTER: Record<UnitShape, UnitShape> = {
  [UnitShape.CIRCLE]: UnitShape.TRIANGLE,   // Triangle beats Circle
  [UnitShape.SQUARE]: UnitShape.CIRCLE,     // Circle beats Square
  [UnitShape.TRIANGLE]: UnitShape.SQUARE,   // Square beats Triangle
};

const defender = (id: string, shape: UnitShape, strength = 3): Unit => ({
  id, shape, race: Race.PLAYER, baseStrength: strength, currentStrength: strength, lane: 0, segment: 1,
});
const attacker = (id: string, shape: UnitShape, strength = 3): OrcUnit => ({ id, shape, baseStrength: strength });

describe('trinity_siege shape matrix', () => {
  it('is a rock-paper-scissors cycle: each shape beats one, loses to one, ties itself', () => {
    for (const s of SHAPES) {
      expect(SHAPE_MATRIX[s][s]).toBe(1.0);
      const wins = SHAPES.filter(o => SHAPE_MATRIX[s][o] > 1.0);
      const losses = SHAPES.filter(o => SHAPE_MATRIX[s][o] < 1.0);
      expect(wins).toHaveLength(1);
      expect(losses).toHaveLength(1);
    }
  });
  it('is symmetric: if A hits B for 1.5, B hits A for 0.5', () => {
    for (const a of SHAPES) for (const b of SHAPES) {
      expect(SHAPE_MATRIX[a][b] + SHAPE_MATRIX[b][a]).toBe(2.0);
    }
  });
  it('race lean stays in a sane band and neither side gets a free edge', () => {
    for (const v of Object.values(RACE_LEAN)) {
      expect(v).toBeGreaterThanOrEqual(0.5);
      expect(v).toBeLessThanOrEqual(1.5);
    }
    expect(RACE_LEAN.PLAYER).toBe(RACE_LEAN.ORC);
  });
});

describe('trinity_siege selectBestDefender', () => {
  it('picks the counter-shape defender', () => {
    for (const a of SHAPES) {
      const pool = SHAPES.map((s, i) => defender('d' + i, s));
      const idx = selectBestDefender(a, pool);
      expect(pool[idx].shape).toBe(COUNTER[a]);
    }
  });
  it('returns 0 for a single defender', () => {
    expect(selectBestDefender(UnitShape.CIRCLE, [defender('d', UnitShape.CIRCLE)])).toBe(0);
  });
});

describe('trinity_siege resolvePaired', () => {
  it('an undefended lane is breached', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.CIRCLE)], [], false);
    expect(r.breached).toBe(true);
    expect(r.victory).toBe(false);
  });
  it('equal strength, same shape: both fall, defenders hold (victory)', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.SQUARE)], [defender('d', UnitShape.SQUARE)], false);
    expect(r.duels[0].outcome).toBe('both_die');
    expect(r.victory).toBe(true);
  });
  it('the counter shape wins and survives with strength left', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.CIRCLE)], [defender('d', UnitShape.TRIANGLE)], false);
    expect(r.duels[0].outcome).toBe('defender_wins');
    expect(r.victory).toBe(true);
    expect(r.survivingDefenders![0].currentStrength).toBeGreaterThan(0);
  });
  it('the wrong shape loses and the lane is breached', () => {
    const r = resolvePaired(0, [attacker('a', UnitShape.CIRCLE)], [defender('d', UnitShape.SQUARE)], false);
    expect(r.duels[0].outcome).toBe('attacker_wins');
    expect(r.breached).toBe(true);
  });
  it('a wall doubles the defender: a same-shape defender beats an equal attacker', () => {
    const open = resolvePaired(0, [attacker('a', UnitShape.SQUARE)], [defender('d', UnitShape.SQUARE)], false);
    const walled = resolvePaired(0, [attacker('a', UnitShape.SQUARE)], [defender('d', UnitShape.SQUARE)], true);
    expect(open.duels[0].defenderEffectiveStrength).toBe(3);
    expect(walled.duels[0].defenderEffectiveStrength).toBe(6);
    expect(walled.duels[0].outcome).toBe('defender_wins');
  });
});

describe('trinity_siege a wave-5 sized attack is winnable', () => {
  it('five mixed attackers (3 + floor(4/2) = 5, the wave-5 size) fall to five counter-shaped defenders', () => {
    const shapes = [UnitShape.CIRCLE, UnitShape.SQUARE, UnitShape.TRIANGLE, UnitShape.CIRCLE, UnitShape.SQUARE];
    const attackers = shapes.map((s, i) => attacker('a' + i, s));
    const defenders = shapes.map((s, i) => defender('d' + i, COUNTER[s]));
    const r = resolvePaired(0, attackers, defenders, false);
    expect(r.victory).toBe(true);
    expect(r.breached).toBe(false);
  });
  it('the run length constants are the ones the README promises (5 waves, 15 lives)', () => {
    expect(MAX_WAVES).toBe(5);
    expect(LIVES_STARTING).toBe(15);
  });
});
```

**Step 2: the board row.** In `ts/src/status/board.data.ts` replace the whole `trinity_siege` entry, currently

```ts
  {
    id: 'trinity_siege', name: 'Trinity Siege/Combat', category: 'ai_studio_track', status: 'status_unconfirmed',
    currentState: 'Bevy vs. egui architecture question left unresolved.',
    nextAction: 'Direct status check — no longer blocked on the Rust-chassis question, that is confirmed Far Future Dream now.',
    lastUpdated: '2026-08-15', verificationMethod: 'research/inference',
  },
```
with
```ts
  {
    id: 'trinity_siege', name: 'Trinity Siege/Combat', category: 'ai_studio_track', status: 'active',
    currentState: 'Hex-ring wave defense, an AI Studio embed at /arcade/trinity_siege/: shape counters, race leans, 5 waves, 15 lives. The Rust three-faction chassis is Far Future; only the TS embed is maintained.',
    nextAction: 'Cover screenshot and a phone re-measure (browser steps).',
    lastUpdated: '2026-10-04', verificationMethod: 'direct file read',
  },
```
(Keep the surrounding entries exactly as they are, including the em dash characters elsewhere in the file.)

**Step 3: the board test.** Create `ts/tests/test_board_row_trinity_siege.ts` with exactly:

```ts
// new: ts/tests/test_board_row_trinity_siege.ts
import { describe, it, expect } from 'vitest';
import { STATUS_BOARD } from '../src/status/board.data';

describe('status board row: trinity_siege', () => {
  const row = STATUS_BOARD.find(e => e.id === 'trinity_siege')!;

  it('describes the game that exists (the hex-ring embed), not the unbuilt Rust chassis', () => {
    expect(row.status).toBe('active');
    expect(row.currentState).toContain('Hex-ring');
    expect(row.currentState).not.toMatch(/Bevy vs\. egui/);
  });
  it('still says the Rust three-faction chassis is Far Future', () => {
    expect(row.currentState).toContain('Far Future');
  });
});
```

## 4. What NOT to do

- No change to `combat.ts`, `types.ts` or any file under `examples/trinity-siege/` (these are tests of the existing code; if one fails, STOP and write the failing assertion text in the Status row: that would be a real combat bug to report, not to patch).
- No other board row, no change to the board types or markdown generator, and do not regenerate `docs/state/StatusBoard.md` (the controller does, see Controller finish).
- No TS-native rewrite, no new factions, no balance changes. No deploys, no protected repos.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

Baseline, before editing: the combat test passes on origin/main as is (verified 2026-10-04: `Tests  12 passed (12)`; this is coverage, not a red step). The board test fails first: `cd ts && npx vitest run test_board_row_trinity_siege.ts` gives `Test Files  1 failed (1)` (the row still says `Bevy vs. egui`).

After editing:
```
cd ts && npx vitest run test_trinity_siege_combat.ts test_board_row_trinity_siege.ts test_trinity_siege_blurb.ts test_status_board.ts test_site_status_pages.ts test_generate_site_status_pages.ts
```
Real tail from a prototype of the same board edit plus the combat file (2026-10-04): `Test Files  6 passed (6)` / `Tests  52 passed (52)` (the existing status-board and site-status tests stay green with the new row).

**Controller finish (after merge):** regenerate `docs/state/StatusBoard.md` with the repo's status generator (it still contains the old `Bevy vs. egui` text).

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

- [ ] `test_trinity_siege_combat.ts` exists as above and its 12 tests pass.
- [ ] The `trinity_siege` board row is as above; `test_board_row_trinity_siege.ts` passes.
- [ ] The existing status-board, site-status and blurb tests still pass (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the combat table is sound (12 of 12), so the "fabricated logic" worry is closed; the board row now describes the real game. Evidence second: real tails. Recommended action: review, merge; then `Trinity_Siege_Why_It_Won_Directive`.

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
- 2026-10-04 13:28 · robert-claude-laptop · none → Queued
<!-- queue:end -->
