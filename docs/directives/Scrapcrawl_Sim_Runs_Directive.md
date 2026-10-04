# scrapcrawl: simulated runs through the real Lua, and the tuned odds written down (S)

**Depends on:** none.
**Read first** (everything this run needs is pasted below; these are the files to open):
`games/scrapcrawl/logic.lua` (`resolve_fight`, `craft`, `move_player`), `games/scrapcrawl/data.yaml`, `ts/src/games/scrapcrawl/utils/runEnd.ts`, `ts/tests/test_scrapcrawl_run_end.ts` (how the real Lua is driven with an injected roll), `docs/demos/scrapcrawl/DIRECTION.md` (Replan step 1).

## 1. Why this exists

`docs/demos/scrapcrawl/DIRECTION.md` says the run's odds "were never checked end to end": 10 player HP, 2 per lost fight, D20 rolls against room difficulty. This directive checks them and pins them, so a later change cannot quietly make the run unwinnable or trivial.
Measured on origin/main `889dd21e` (2026-10-04), through the real `games/scrapcrawl/logic.lua` with a seeded D20 (`resolve_fight`'s 4th argument) and a fixed scrap reward (5th argument), over 200 fixed seeds per strategy:

- the run has FOUR fight rooms (`scrap_pit` 8, `vent_stack` 12, `chemical_leak` 15, `furnace_core` 18) plus Home Base; the older note of "five rooms, three difficulties" is stale;
- a crawler that never crafts wins 35.0 percent of runs; a crawler that buys a Beat Stick (cost 10 scrap) whenever it has none wins 75.0 percent. Real output line: `SIM unarmed=0.350 crafted=0.750`.

So the placeholders are already a reasonable shape: losing is common without gear, and crafting is clearly worth doing, which is the game's hook. No number needs to change; this directive proves it and records it.

## 2. Scope

1. New test only: `<!-- new: ts/tests/test_scrapcrawl_sim_runs.ts -->`. No source file changes.

## 3. The work

Create `ts/tests/test_scrapcrawl_sim_runs.ts` with exactly this content:

```ts
// new: ts/tests/test_scrapcrawl_sim_runs.ts
//
// Simulated runs through the REAL games/scrapcrawl/logic.lua with a seeded D20
// (resolve_fight's 4th arg) and a fixed scrap reward (5th arg), so every number
// below is reproducible. Rules come from utils/runEnd.ts (10 HP, 2 per lost fight).
import { describe, it, expect } from 'vitest';
import { loadGame, call } from '../src/engine/runtime';
import { newRun, applyFight, applyMove, PLAYER_MAX_HP, LOSS_DAMAGE } from '../src/games/scrapcrawl/utils/runEnd';
import type { RunOutcome } from '../src/games/scrapcrawl/utils/runEnd';

type Rooms = Record<string, { id: string; interaction_types?: string[]; difficulty?: number }>;
type Player = Record<string, any>;

function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CHAIN = ['home_base', 'scrap_pit', 'vent_stack', 'chemical_leak', 'furnace_core'];

/** One run. useCraft: buy a Beat Stick at Home Base whenever scrap allows and the weapon is missing or broken. */
function simulate(seed: number, useCraft: boolean): RunOutcome {
  const session = loadGame('scrapcrawl');
  const data = session.files.data as { rooms: Rooms };
  const rooms = data.rooms;
  const rnd = seeded(seed);
  let player = call(session, 'init_player')[0] as Player;
  let run = newRun();
  const move = (id: string) => {
    player = call(session, 'move_player', data, player, id)[0] as Player;
    run = applyMove(run, rooms, id);
  };
  const walkHome = () => {
    while (player.currentRoomId !== 'home_base') {
      const i = CHAIN.indexOf(player.currentRoomId);
      move(i === CHAIN.length - 1 ? 'home_base' : CHAIN[i - 1]);
    }
  };
  for (let step = 0; step < 400 && run.outcome === 'playing'; step++) {
    const target = CHAIN.find(id => id !== 'home_base' && !run.clearedRoomIds.includes(id))!;
    const weapon = player.equipped.weapon;
    const noWeapon = !weapon || weapon.life === 0;
    if (useCraft && player.currentRoomId === 'home_base' && noWeapon && player.scrap >= 10) {
      player = call(session, 'craft', data, player, rooms.home_base, 'beatStick', 1)[0] as Player;
    }
    const here = CHAIN.indexOf(player.currentRoomId);
    if (here < CHAIN.indexOf(target)) { move(CHAIN[here + 1]); continue; }
    if (useCraft && run.hp <= 4 && noWeapon && player.scrap >= 10) { walkHome(); continue; }
    const roll = Math.floor(rnd() * 20) + 1;
    const reward = 3 + Math.floor(rnd() * 6);
    const res = call(session, 'resolve_fight', data, player, rooms[player.currentRoomId], roll, reward)[0] as { won: boolean; player: Player };
    player = res.player;
    run = applyFight(run, rooms, player.currentRoomId, res.won);
  }
  return run.outcome;
}

function winRate(useCraft: boolean, n = 200): number {
  let wins = 0;
  for (let i = 0; i < n; i++) if (simulate(5000 + i, useCraft) === 'won') wins++;
  return wins / n;
}

describe('scrapcrawl simulated runs', () => {
  it('keeps the tuned run numbers: 10 HP, 2 per lost fight', () => {
    expect(PLAYER_MAX_HP).toBe(10);
    expect(LOSS_DAMAGE).toBe(2);
  });

  it('a run is winnable and losable with fixed seeds', () => {
    const outcomes = new Set<RunOutcome>();
    for (let i = 0; i < 40; i++) outcomes.add(simulate(5000 + i, false));
    expect(outcomes.has('won')).toBe(true);
    expect(outcomes.has('lost')).toBe(true);
    expect(outcomes.has('playing')).toBe(false);
  });

  it('crafting a Beat Stick clearly helps: unarmed wins 20-50%, crafting wins 60-90%', () => {
    const unarmed = winRate(false);
    const crafted = winRate(true);
    console.log('SIM unarmed=' + unarmed.toFixed(3) + ' crafted=' + crafted.toFixed(3));
    expect(unarmed).toBeGreaterThanOrEqual(0.2);
    expect(unarmed).toBeLessThanOrEqual(0.5);
    expect(crafted).toBeGreaterThanOrEqual(0.6);
    expect(crafted).toBeLessThanOrEqual(0.9);
    expect(crafted).toBeGreaterThan(unarmed);
  });
});
```

If a band assertion fails on your machine (the runs are seeded, so it should not), do NOT widen the band: STOP and write the printed `SIM unarmed=... crafted=...` line in the Status row.

## 4. What NOT to do

- No change to `games/scrapcrawl/logic.lua`, `data.yaml`, `runEnd.ts`, `App.tsx` or any component. The Lua stays frozen; any future rule goes in TS beside `runEnd.ts`.
- No change to `PLAYER_MAX_HP` or `LOSS_DAMAGE` (the test pins 10 and 2; changing them is a design decision for Robert).
- Do not touch `examples/scrapcrawl` (the preserved, unwired AI Studio origin).
- Do not leave the `console.log` out: it is the evidence line and is intentional.
- No deploys, no protected repos, no player-layer or cloud-save work.

## 5. Verification

```
uv run python --version
```
Expected: `Python 3.12.x`. Verified on this machine: `Python 3.12.12`.

This test adds coverage and passes on origin/main as is (there is no red step):
```
cd ts && npx vitest run test_scrapcrawl_sim_runs.ts
```
Real tail from the prototype (2026-10-04, about 6 to 10 seconds): `SIM unarmed=0.350 crafted=0.750`, `Test Files  1 passed (1)`, `Tests  3 passed (3)`.
Regression check: `cd ts && npx vitest run test_scrapcrawl_run_end.ts` gives `Test Files  1 passed (1)` / `Tests  6 passed (6)`.

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

- [ ] `ts/tests/test_scrapcrawl_sim_runs.ts` exists with the content above; the vitest line shows 3 passed and the `SIM` line is pasted.
- [ ] `test_scrapcrawl_run_end.ts` still passes (real tail pasted).
- [ ] No other file changed.
- [ ] The Status row is set to Review with a one-line log entry.

## Sandbox needs

none

## 8. Report

Findings first: the two win rates printed (unarmed and crafted). Evidence second: real tails. Recommended action: review and merge; `Scrapcrawl_Carry_Over_Directive` is independent.

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`; adding Lua code or changing the engine; any player-layer or save-to-cloud work.

## Required from User

none.
