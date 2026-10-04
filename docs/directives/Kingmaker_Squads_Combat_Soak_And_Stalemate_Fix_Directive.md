# Kingmaker Squads: a combat soak test, and the fix for a combat loop that never ends

**Depends on:** none (DIRECTION.md lists the Restart directive as a dependency; it does not overlap: that run edits the screens and header, this one edits `combatEngine.ts` and import lines)

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/kingmaker_squads/DIRECTION.md` (First three directives, item 3), `docs/superpowers/specs/2026-10-03-demo-polish-standard.md` (B4),
`examples/kingmaker-squads/src/utils/combatEngine.ts` (lines 1-45, 120-160 and 330-380), `ts/tests/test_ledger_utils.ts` (the shape of a ts test that imports an example folder).

## 1. Why this exists

`docs/demos/kingmaker_squads/DIRECTION.md` (directive 3) asks for a headless campaign test (polish standard B4: no softlock, a win and a loss reachable). Reading the code showed the full campaign cannot be run headless today: victory and game over are decided inside a React hook
(`examples/kingmaker-squads/src/hooks/useCombatResolution.ts` lines 127-137, `if (allConquered) nextPhase = 'victory'; else if (playerDefeated) nextPhase = 'game_over'`), and shopping, placement and moves are UI-driven. What IS pure and is the part that can freeze a player is the combat engine: `simulateCombat` in `examples/kingmaker-squads/src/utils/combatEngine.ts`.
So this directive pins combat, and it found a real bug while doing so.

**The bug (measured on origin/main `afb1cefe`, reproduced).** `simulateCombat` loops `while (turnStep <= maxTurns)`, but `turnStep` only advances when a unit acts (a frame is pushed). In a round where nobody can move, attack or heal, nothing advances and the loop repeats forever: the page freezes. Reproduction: one recruit pawn against one recruit bishop
(the formation puts them where the pawn cannot reach and the bishop's diagonal moves do not shorten the distance). A probe over all 225 matchups (5 archetypes against 5, three ranks, squads of 1, 3 and 5) hung on the 19th, `1x recruit pawn vs bishop`, and the new test file never finishes on the unfixed engine (`timeout 40` exit code 124).
The fix is a stalemate guard: if a whole round adds no frame, stop. With it all 225 matchups finish in about 0.5 s.

**Balance finding (reported, NOT changed here).** With the guard, 92 of the 225 seeded matchups end with both sides still alive (stalemate or the 30-step cap), and the existing rule `isPlayerWinner = finalPlayerAlive.length > 0` then awards them to the player: 158 player wins against 67 enemy wins.
Whether a stalemate should favour the defender, the side with more HP left, or nobody is a design call for Robert; this run leaves the rule alone.

Facts you need (verified; do not re-derive):
- Combat uses `Math.random` (initiative, heal chance, crits); the test seeds it so every run plays the same fights.
- `createUnit(archetype, name, rank)` (`examples/kingmaker-squads/src/data/archetypes.ts`) builds a unit; the five archetypes are `pawn|knight|bishop|rook|queen`, ranks `recruit|veteran|elite`.
- The example has its own test runner but no `node_modules` in a worktree, so the new test lives in `ts/tests/` and imports from `../../examples/kingmaker-squads/...` (the pattern in `ts/tests/test_ledger_utils.ts`). Its own suite (`utils/gameLogic.test.ts`, `cityGeneration.test.ts`) was run by the controller with a temporary junction: baseline `Test Files  2 passed (2)` / `Tests  166 passed (166)`, same after the fix.
- Baseline, real: `cd ts && npx tsc --noEmit` prints 4 errors, all `Cannot find module '.../game-metadata.json'`. A ts test that imports the kingmaker example makes ts type-check it under strict `noUnusedLocals`, which flags 10 unused imports in four example files; step 2 removes them (no behaviour change) so the count stays 4.

## 2. Scope

1. `examples/kingmaker-squads/src/utils/combatEngine.ts`: the stalemate guard (step 1) and the unused imports (step 2).
2. `examples/kingmaker-squads/src/data/archetypes.ts`, `examples/kingmaker-squads/src/utils/cityGeneration/cityGenerator.ts`, `examples/kingmaker-squads/src/utils/cityGeneration/patchGenerator.ts`: remove unused imports (step 2).
3. New test `<!-- new: ts/tests/test_kingmaker_combat_soak.ts -->` (step 3).

## 3. The work

All four existing files are CRLF; keep their endings. New file uses CRLF too. DO THE FIX (step 1) BEFORE creating the test: on the unfixed engine the test never finishes and a hung run is a dead run.

**Step 1: stalemate guard in `combatEngine.ts`.** Two edits.
(a) In `simulateCombat`, directly after the line `    if (playerAlive.length === 0 || enemyAlive.length === 0) break;` (the first statement block inside `while (turnStep <= maxTurns) {`) and before the comment `    // Sort turn order by initiative`, insert:
```
    // Stalemate guard: `turnStep` only advances when a unit acts, so a round in which nobody can move,
    // attack or heal would repeat forever. Count the frames before the round and stop if it added none.
    const framesBeforeRound = frames.length;

```
(b) Directly before the line `  const finalPlayerAlive = allUnits.filter((u) => u.team === 'player' && u.currentHp > 0);` the `for (const actor of turnQueue)` loop closes with `    }` and the `while` loop closes with `  }`. Between those two closing braces add:
```

    if (frames.length === framesBeforeRound) break; // stalemate: nobody could act this round
```
so the end of the loop reads:
```
      }
    }

    if (frames.length === framesBeforeRound) break; // stalemate: nobody could act this round
  }

  const finalPlayerAlive = allUnits.filter((u) => u.team === 'player' && u.currentHp > 0);
```
(The `}` that closes the `else if (hasMoved) { ... }` block, then the `}` closing the `for`, then the new line, then the `}` closing the `while`.) Change nothing else about the winner rule.

**Step 2: remove the 10 unused imports (no behaviour change).** Exact edits:
- `examples/kingmaker-squads/src/data/archetypes.ts`: in line 5 change `import { Faction, UnitArchetype, UnitStats, CellType, TerritoryCell, UnitState, Zodiac, HouseId } from '../types';` to the same line without `CellType, `; delete the line `import { generateProceduralCity } from '../utils/cityGeneration/cityGenerator';` (line 75).
- `examples/kingmaker-squads/src/utils/cityGeneration/cityGenerator.ts` line 8: `import { createUnit, HOUSES } from '../../data/archetypes';` becomes `import { createUnit } from '../../data/archetypes';`.
- `examples/kingmaker-squads/src/utils/cityGeneration/patchGenerator.ts` line 1: delete `import { TerritoryCell } from '../../types';`.
- `examples/kingmaker-squads/src/utils/combatEngine.ts`: the first import block `{ CombatAction, CombatFrame, CombatResult, CombatUnit, SynergyBonus, UnitState } from '../types'` loses `CombatAction` and `SynergyBonus`; the `chessMovement` import block `{ GridPos, isOutOfBounds, isSamePos, getSlidingMoves, getKnightMoves, getPawnMoves, getLegalMoves, canAttackFrom }` keeps only `GridPos, isSamePos, getLegalMoves, canAttackFrom`. Leave the `export type { GridPos }` and `export { ... } from './chessMovement'` re-export blocks exactly as they are.

**Step 3: the test.** Create `ts/tests/test_kingmaker_combat_soak.ts` with exactly:

```ts
// @vitest-environment node
// new: ts/tests/test_kingmaker_combat_soak.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { simulateCombat } from '../../examples/kingmaker-squads/src/utils/combatEngine';
import { createUnit } from '../../examples/kingmaker-squads/src/data/archetypes';
import type { UnitArchetype, UnitState } from '../../examples/kingmaker-squads/src/types';

const ARCHETYPES: UnitArchetype[] = ['pawn', 'knight', 'bishop', 'rook', 'queen'];
const RANKS = ['recruit', 'veteran', 'elite'] as const;
type Rank = (typeof RANKS)[number];

/** Small seeded generator so every run of this file plays the same fights (combat uses Math.random for initiative, heals and crits). */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function squad(archetype: UnitArchetype, size: number, rank: Rank): UnitState[] {
  return Array.from({ length: size }, (_, i) => createUnit(archetype, `${archetype}-${rank}-${i}`, rank));
}

/** Every archetype pairing at every rank, in squads of 1, 3 and 5. */
function allMatchups(): Array<{ label: string; player: UnitState[]; enemy: UnitState[] }> {
  const out: Array<{ label: string; player: UnitState[]; enemy: UnitState[] }> = [];
  for (const a of ARCHETYPES) {
    for (const b of ARCHETYPES) {
      for (const rank of RANKS) {
        for (const size of [1, 3, 5]) {
          out.push({ label: `${size}x ${rank} ${a} vs ${size}x ${rank} ${b}`, player: squad(a, size, rank), enemy: squad(b, size, rank) });
        }
      }
    }
  }
  return out;
}

describe('test_kingmaker_combat_soak', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('a lone recruit pawn against a lone recruit bishop ends instead of looping forever (regression)', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(1));
    const result = simulateCombat(squad('pawn', 1, 'recruit'), squad('bishop', 1, 'recruit'));
    expect(['player', 'enemy']).toContain(result.winner);
    expect(result.frames.length).toBeGreaterThan(0);
  });

  it('every matchup ends with a winner who has a survivor (no softlock)', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(7));
    for (const m of allMatchups()) {
      const result = simulateCombat(m.player, m.enemy);
      expect(['player', 'enemy'], m.label).toContain(result.winner);
      const winners = result.winner === 'player' ? result.playerSurvivors : result.enemySurvivors;
      expect(winners.length, `${m.label}: winner has no survivors`).toBeGreaterThan(0);
      expect(result.frames.length, `${m.label}: no frames recorded`).toBeGreaterThan(0);
    }
  });

  it('both outcomes are reachable: some matchups go to the player and some to the enemy', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(11));
    const winners = new Set(allMatchups().map((m) => simulateCombat(m.player, m.enemy).winner));
    expect(winners.has('player')).toBe(true);
    expect(winners.has('enemy')).toBe(true);
  });

  it('a higher rank beats an equal squad of a lower rank for every archetype', () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(3));
    for (const a of ARCHETYPES) {
      const result = simulateCombat(squad(a, 3, 'elite'), squad(a, 3, 'recruit'));
      expect(result.winner, `elite ${a} vs recruit ${a}`).toBe('player');
    }
  });
});
```

## 4. What NOT to do

- Do not change the winner rule, damage, movement, healing, synergies, initiative or any balance number. The only behaviour change is that a stalemate round now ends the fight instead of freezing it.
- Do not edit `examples/kingmaker-squads/src/hooks/*`, `examples/kingmaker-squads/src/App.tsx`, the screens, `HeaderBar.tsx` or `NewGameScreen.tsx` (the Restart directive owns those), `gameLogic.test.ts`, the Origin label, or the registry config. Do NOT hide Kingmaker Squads.
- Do not run the example's own test runner (`npm test` inside the example): a worktree has no `node_modules` for it.
- No Lua, no engine changes, no deploys or rebuilds, no protected repos, no player layer or cloud saves. Do not touch `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json`, `ts/src/games/registry.ts`.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x` (verified on this machine: `Python 3.12.12`).

After editing:
```
cd ts && npx vitest run test_kingmaker_combat_soak.ts
```
Real tail from the prototype of exactly these edits: `Test Files  1 passed (1)` / `Tests  4 passed (4)`, duration about 2.5 s.
```
cd ts && npx tsc --noEmit
```
Real result from the prototype: only the 4 pre-existing `Cannot find module '.../game-metadata.json'` errors; nothing mentions `kingmaker`.

Controller step, not this run: the example's own suite with a temporary `node_modules` junction. Real result on the prototype and on the unchanged code: `Test Files  2 passed (2)` / `Tests  166 passed (166)`.

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

- [ ] The two stalemate-guard edits are in `combatEngine.ts` and the 10 unused imports are gone; the winner rule and everything else in the file are unchanged.
- [ ] `ts/tests/test_kingmaker_combat_soak.ts` exists with the exact content above and `cd ts && npx vitest run test_kingmaker_combat_soak.ts` passes: 4 tests (real tail pasted).
- [ ] `cd ts && npx tsc --noEmit` shows only the 4 pre-existing errors (real tail pasted).
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: files changed, whether any quoted line differed from the file, and the stalemate bug (what it was and that it is fixed). Evidence second: real tails of `uv run python --version`, the vitest command and `tsc --noEmit`.
Then say plainly what was not run (the example's own suite, a browser smoke) and repeat the open design question for Robert: stalemates and step-cap endings (92 of 225 seeded matchups) are currently awarded to the player.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying or rebuilding anything; installing or fetching anything; reading outside the worktree; touching protected repos (TeleseroAdminSuite2026, DialerListPulse); editing `docs/children.json`, `tests/fixtures/demo_lists_snapshot.json`, `ts/package.json` or `ts/src/games/registry.ts` unless this directive names the file; adding Lua; changing `ts/src/engine/`; adding player-layer, cloud-save or account features.

## Required from User

none. Deploying is Robert's, after review.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/kingmaker-combat-soak |
| Base branch | main |

**Status log**
- 2026-10-04 14:35 · robert-claude-laptop · none → Queued
- 2026-10-04 17:10 · devin-cleanroom · Queued → Review — stalemate guard + 10 unused imports + soak test: `vitest run test_kingmaker_combat_soak.ts` → `1 file / 4 passed` (~1s, all 225 matchups finish); `tsc --noEmit` → only the 4 pre-existing game-metadata.json errors
<!-- queue:end -->
