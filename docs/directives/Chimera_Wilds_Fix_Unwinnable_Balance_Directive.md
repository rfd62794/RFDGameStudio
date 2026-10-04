# Chimera Wilds: make the fight winnable (a fresh player wins about half the time)

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`games/chimera_wilds/data.yaml` (last lines: `baseline_player`), `ts/src/games/chimera_wilds/App.tsx` (lines 19-27, `buildInitialState`),
`games/chimera_wilds/logic.lua` (`resolve_encounter`; read only), `docs/demos/chimera_wilds/DIRECTION.md` (Where it is now, Replan Phase 1), `ts/tests/test_shared_mulberry32.ts` (seeded random usage).

## 1. Why this exists

Chimera Wilds cannot be won. A fresh player scores `power + endurance + d20` = 20 + 20 + (1..20) = 41..60 (`games/chimera_wilds/data.yaml` `baseline_player: power 20, endurance 20`;
`resolve_encounter` in `logic.lua`: `won = player_score >= chimera_score`). The 36 possible chimeras (3 heads x 3 chests x 2 x 1 x 2 x 1 parts) score 156..230 (sum of every part's `power + endurance`).
So the win chance is exactly 0%; the record can only read "0W - nL". Existing tests use synthetic numbers (`tests/test_chimera_wilds.py`), so nothing caught it.

Win probability for a baseline total B (player score = B + d20), computed over all 36 chimeras and all 20 rolls, measured with the real `data.yaml` parts:
```
B=165 0.318   B=170 0.407   B=175 0.504   B=180 0.582   B=190 0.699
```
Robert's decision (2026-10-04, approval of the direction recommendation): change the rule so a fresh player wins about half the time. Choose B = 175: `power 90`, `endurance 85`.
This is a data change only: no Lua is added or edited.

## 2. Scope

1. `games/chimera_wilds/data.yaml`: `baseline_player` becomes `power: 90`, `endurance: 85` (the last three lines of the file; nothing else).
2. `ts/src/games/chimera_wilds/App.tsx`: the fallback `?? { power: 20, endurance: 20 };` (line 21) becomes `?? { power: 90, endurance: 85 };`.
3. New test `<!-- new: ts/tests/test_chimera_wilds_balance.ts -->`.

## 3. The work

**Step 1.** Make the two edits above, exactly. The prototype diff of this change:
```
@@ baseline_player:
-  power: 20
-  endurance: 20
+  power: 90
+  endurance: 85
@@ buildInitialState
-    ?? { power: 20, endurance: 20 };
+    ?? { power: 90, endurance: 85 };
```

**Step 2.** Create `<!-- new: ts/tests/test_chimera_wilds_balance.ts -->` with exactly this content:

```ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { mulberry32 } from '../src/engine/shared/seededRandom';

const SLOTS = ['head', 'chest', 'left_arm', 'right_arm', 'left_leg', 'right_leg'];
type Part = { id: string; slot: string };

function pickParts(parts: Part[], rng: () => number): Part[] {
  return SLOTS.map(slot => {
    const options = parts.filter(p => p.slot === slot);
    return options[Math.floor(rng() * options.length)];
  });
}

describe('chimera_wilds balance (a fresh player can win)', () => {
  const session = loadGame('chimera_wilds');
  const data = session.files.data as Record<string, unknown>;
  const baseline = data['baseline_player'] as { power: number; endurance: number };
  const parts = data['parts'] as Part[];

  it('baseline player stats are the tuned values', () => {
    expect(baseline.power + baseline.endurance).toBe(175);
  });

  it('1,000 seeded encounters win between 35% and 65% of the time', () => {
    const rng = mulberry32(2026);
    let wins = 0;
    for (let i = 0; i < 1000; i += 1) {
      const [chimera] = call(session, 'generate_chimera', pickParts(parts, rng)) as [unknown];
      const roll = Math.floor(rng() * 20) + 1;
      const [result] = call(session, 'resolve_encounter', baseline.power, baseline.endurance, chimera, roll) as [{ won: boolean }];
      if (result.won) wins += 1;
    }
    const rate = wins / 1000;
    expect(rate).toBeGreaterThanOrEqual(0.35);
    expect(rate).toBeLessThanOrEqual(0.65);
  });
});
```

## 4. What NOT to do

- Do not edit `logic.lua` or any Lua (no Lua additions), any part's `power`, `endurance`, `accuracy`, `speed` or `price`, or `ts/src/engine/` (the shared Paper Doll).
- Do not change the D20 roll, the win rule, or add choices, a build screen, or progression (a later, separate decision).
- Do not add the persisted record or Reset button here (separate directive).
- Do not edit `tests/test_chimera_wilds.py`; it must stay green unchanged.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline Python tests (before editing; verified 2026-10-04 on origin/main `889dd21e`):
```
uv run pytest tests/test_chimera_wilds.py -q
```
Real tail: `8 passed`. It must still be `8 passed` after editing (verified on the prototype).

New test, after editing (prototype result: win rate 0.528 with seed 2026):
```
cd ts && npx vitest run test_chimera_wilds_balance.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  2 passed (2)`.
The same test against the OLD `data.yaml` fails as it should: `expected 40 to be 175` and `expected 0 to be greater than or equal to 0.35`.

Neighbours (same form): `cd ts && npx vitest run test_chimera_paper_doll_port.ts test_paper_doll_chimeralab_port.ts`. Expected: all passed, as before the change.

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

- [ ] `data.yaml` `baseline_player` is 90 / 85 and the `App.tsx` fallback matches; nothing else changed in those files.
- [ ] `ts/tests/test_chimera_wilds_balance.ts` exists; `cd ts && npx vitest run test_chimera_wilds_balance.ts` shows 2 passed (real tail pasted).
- [ ] `uv run pytest tests/test_chimera_wilds.py -q` shows 8 passed (real tail pasted).
- [ ] The neighbours command in section 5 passes (real tail pasted).
- [ ] No file outside the three in Scope changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the two edits, the measured win rate the test produced, and the old-baseline failure you confirmed (or say you did not rerun it). Evidence second: real tails of every command.
Then say plainly: this changes a game rule by Robert's approval; it is a `dev` demo and nothing public changes until the demo is rebuilt (Controller finish: Robert or Claude rebuilds with `npm run build:chimera_wilds` and plays a few rounds).
Recommended action: review, merge.

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
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-chimera-wilds-fix-unwinnable-bala-c0b987 |
| Base branch | - |
| Base commit | 6ca12552cef28ddaa5804be7c8fa5b3899443bf1 |

**Status log**
- 2026-10-04 13:14 · robert-claude-laptop · none → Queued
- 2026-10-04 13:16 · robert-claude-laptop · Queued → Approved — lint override: stale MCP lint; author ran baseline+after proofs; Robert 2026-10-04 approved all recommendations
- 2026-10-04 13:23 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-chimera-wilds-fix-unwinnable-bala-c0b987; lane=default; model=swe-2-high; persona=steady-builder
<!-- queue:end -->
