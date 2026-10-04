# Derby Sim: a headless race-and-betting test that proves the book and the bank behave

**Depends on:** none.

**Read first** (everything this run needs is pasted below; these are the files to open):
`games/horse_racing/logic.lua` (`create_race`, `simulate_race`; read only), `games/horse_racing/data.yaml` (`stable:` and `race:` blocks; read only), `ts/src/games/horse_racing/utils/bets.ts` (`isBetWin`),
`ts/tests/test_horse_racing_polish.ts` (the existing test; it mostly reads source text), `docs/demos/horse_racing/DIRECTION.md` (Replan Phase 2).

## 1. Why this exists

Derby Sim has no test that actually runs races and checks the money. `ts/tests/test_horse_racing_polish.ts` asserts source text and chip labels; `docs/demos/horse_racing/DIRECTION.md` asks for
"a headless balance test: N races with a flat-bet strategy, assert no negative funds, bankruptcy reachable, odds sum sane (overround 1.12)".
The facts the test relies on, all measured on origin/main `889dd21e` through the repo's real runtime (`loadGame('horse_racing')`):

- `data.yaml`: `stable.starting_funds: 1000`, `race.field_size: 6`, `race.overround: 1.12`.
- `create_race(horse, data)` returns `(race, err)`; `race.participants` holds 6 entries, the first is the player horse, each with an `odds` number; `race.distance` is a number.
- `simulate_race(participants, { distance })` returns the results ordered 1st to last, each `{ rank, horse_id, ... }`.
- A prototype run of 200 races gave, for the sum of 1/odds per race, a minimum of 1.114 and a maximum of 1.126 (the configured overround is 1.12), and the starter horse won 13 of 200 races at flat 20-unit Win bets.
- 200 races take about 40 seconds to collect; the test below uses 60 races (about 14 seconds) to stay quick. The final test passed 4 of 4.

## 2. Scope

1. New test `<!-- new: ts/tests/test_horse_racing_headless_balance.ts -->`. Nothing else changes.

## 3. The work

Create `<!-- new: ts/tests/test_horse_racing_headless_balance.ts -->` with exactly this content:

```ts
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { isBetWin } from '../src/games/horse_racing/utils/bets';

const session = loadGame('horse_racing');
const data = session.files.data as Record<string, unknown>;
const stable = data['stable'] as Record<string, number>;
const raceCfg = data['race'] as Record<string, number>;

type Horse = Record<string, unknown>;
type Participant = { horse: Horse; odds: number };
type Outcome = { oddsSum: number; fieldSize: number; ranks: number[]; myRank: number; myOdds: number };

function starter(): Horse {
  const starters = data['starter_horses'] as Horse[];
  return { ...starters[0], player_owned: true };
}

function oneRace(horse: Horse): Outcome {
  const [race, err] = call(session, 'create_race', horse, data) as [Record<string, unknown> | null, string | null];
  if (!race || err) throw new Error(`create_race failed: ${err}`);
  const participants = Object.values(race['participants'] as Record<string, Participant>);
  const distance = race['distance'] as number;
  const results = Object.values(
    call(session, 'simulate_race', participants, { distance })[0] as Record<string, { rank: number; horse_id: string }>
  );
  return {
    oddsSum: participants.reduce((sum, p) => sum + 1 / p.odds, 0),
    fieldSize: participants.length,
    ranks: results.map(r => r.rank).sort((a, b) => a - b),
    myRank: results.find(r => r.horse_id === (horse['id'] as string))?.rank ?? 99,
    myOdds: participants[0].odds,
  };
}

describe('horse_racing headless balance (60 simulated races)', () => {
  const RACES = 60;
  const horse = starter();
  const outcomes: Outcome[] = Array.from({ length: RACES }, () => oneRace(horse));

  it('every race has a full field and ranks 1..N with no gaps or ties', () => {
    for (const o of outcomes) {
      expect(o.fieldSize).toBe(raceCfg['field_size']);
      expect(o.ranks).toEqual(Array.from({ length: o.fieldSize }, (_, i) => i + 1));
    }
  });

  it('the book keeps the house edge: implied probabilities sum near the configured overround', () => {
    const target = raceCfg['overround'];
    for (const o of outcomes) {
      expect(o.oddsSum).toBeGreaterThan(target - 0.07);
      expect(o.oddsSum).toBeLessThan(target + 0.07);
    }
  });

  it('a flat 20-unit Win bet never produces negative or non-finite funds', () => {
    let funds = stable['starting_funds'];
    for (const o of outcomes) {
      const bet = Math.min(20, funds);
      funds -= bet;
      if (isBetWin('Win', o.myRank)) funds += bet * o.myOdds;
      expect(Number.isFinite(funds)).toBe(true);
      expect(funds).toBeGreaterThanOrEqual(0);
    }
  });

  it('going all-in every race reaches bankruptcy (funds under 50) within the run', () => {
    let funds = stable['starting_funds'];
    let wentBankrupt = false;
    for (const o of outcomes) {
      if (funds < 50) { wentBankrupt = true; break; }
      const bet = funds;
      funds -= bet;
      if (isBetWin('Win', o.myRank)) funds += bet * o.myOdds;
    }
    expect(wentBankrupt || funds < 50).toBe(true);
  });
});
```

## 4. What NOT to do

- Do not edit any source, Lua or YAML file. If the test fails against the real code, that is a finding: STOP, set the Status row to Blocked, and paste the failing output.
- Do not raise `RACES` above 60 (collection time grows linearly) or add random seeding or mocks.
- Do not delete the source-text assertions in `test_horse_racing_polish.ts` (a later directive may trim duplicates).
- Do not touch the engine, other tests, or other games.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified: `Python 3.12.12`).

Baseline (verified 2026-10-04 on origin/main `889dd21e`):
```
cd ts && npx vitest run test_horse_racing_polish.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  10 passed (10)`.

New test (verified on the prototype of exactly the content above):
```
cd ts && npx vitest run test_horse_racing_headless_balance.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  4 passed (4)`; `Duration` about 20 s (14 s of it collecting).

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

- [ ] `ts/tests/test_horse_racing_headless_balance.ts` exists with the content in section 3 and `cd ts && npx vitest run test_horse_racing_headless_balance.ts` shows 4 passed (real tail pasted).
- [ ] The baseline command in section 5 still shows 10 passed (real tail pasted).
- [ ] No file other than the new test changed.
- [ ] The Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the test passes or the exact failing assertion. Evidence second: real tails of `uv run python --version` and both vitest commands.
Then say plainly what the test checks (full field, ranks 1 to N, the book near the 1.12 overround, flat bets never negative, all-in reaches bankruptcy) and what it does not (breeding, market prices, cooldowns, the UI).
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
| Status | In progress |
| Assigned to | devin |
| Branch | directive/rfdgamestudio-horse-racing-headless-balance-tes-0ec495 |
| Base branch | - |
| Base commit | 1e19d4c5204df3cd551e5aea778c047cd9eaac7d |

**Status log**
- 2026-10-04 13:26 · robert-claude-laptop · none → Queued
- 2026-10-04 14:39 · robert-claude-laptop · Queued → Approved — lint override: lint false positives (verified; fix in AgentFlow PR #534 pending); author ran baseline+after proofs; Robert 2026-10-04 approved all recommendations
- 2026-10-04 15:37 · dispatcher · Approved → In progress — dispatched devin on personal-laptop in C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-horse-racing-headless-balance-tes-0ec495; lane=default; model=swe-2-high; persona=steady-builder
- 2026-10-04 15:38 · dispatcher · worktree C:\GitHub\.worktrees\RFDGameStudio--rfdgamestudio-horse-racing-headless-balance-tes-0ec495; copied ts/src/games/game-metadata.json; provisioned: uv sync --frozen
<!-- queue:end -->
