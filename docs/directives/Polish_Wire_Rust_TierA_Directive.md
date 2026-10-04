# Wire & Rust Tier A: a way to win, a Restart button, seeded dice, and a build script

**Depends on:** none.
**Queue-neutral:** this file carries no Queue block; the controller queues it. Decided by Robert's 2026-10-04 approval of all recommendations (`docs/demos/wire_rust/DIRECTION.md`, Phase 1: "complete the loop"; the short fenced attempt, then a keep-or-retire call).

**Read first** (everything this run needs is pasted below; these are the files to open):
`docs/demos/wire_rust/DIRECTION.md`, `games/wire_rust/data.yaml` (whole file, 73 lines), `games/wire_rust/logic.lua` (whole file, read only), `ts/src/games/wire_rust/App.tsx`, `ts/src/games/wire_rust/types.ts`,
`ts/src/engine/shared/seededRandom.ts` (lines 1-30), `ts/src/standalone/choke_point/entry.tsx`, `ts/tests/test_wire_rust_ui.ts`, `tests/test_wire_rust.py`.

## 1. Why this exists

Wire & Rust (`wire_rust`, status `dev`) is a small deck-builder: pick a scrap part, roll a D20 plus the part's bonus plus a chemistry bonus against the room's difficulty. `docs/demos/wire_rust/DIRECTION.md` calls it a stub of its own design: "no real choice and no ending ... you can only die".
Measured in the code (origin/main `d3084de0`):
- No win. The Control Room (`games/wire_rust/data.yaml`, `control_room`, difficulty 20, `interaction_types: [rest]`) is just another room; `App.tsx` ends a run only when `state.player.hp <= 0`.
- No Restart during play. The only reset is the game-over "Reboot Core" button (`App.tsx`, `handleReset`); audit batch2 failed A3 (`docs/state/demo-audit-batch2-2026-10-03.md`: "7 of 15 show no restart/new-game label").
- Unseeded dice: `App.tsx` rolls with `Math.floor(Math.random() * 20) + 1`.
- No `build:wire_rust` script (A7).
Rooms and connections today: `junk_heap` (6) to `rust_pit` (10) or `wire_maze` (12); both lead to `reactor_core` (16), which leads to `control_room` (20).
Design for the win (kept inside TypeScript; this run adds NO Lua): the Control Room stays locked until the player wins a challenge in the Reactor Core; entering the Control Room wins the run. The dice become `rollD20(seed, turn)` on a seed stored in the run state, so a whole run is replayable.
Measured with a prototype of this change over seeds 1 to 40: a "best card, then take the exit" player won 40 of 40 runs; a "weakest card, never leaves the Reactor Core" player lost 40 of 40, so both outcomes are reachable.
Honest note for the report: wins are easy at this stage (a win in the Reactor Core usually takes one or two cards). Making the game harder or deeper is the next directive (deck evolution), not this one.

## 2. Scope

Copied from `docs/demos/wire_rust/DIRECTION.md` Phase 1: "ADD: in-play Restart, a win at the Control Room, a result screen, `build:wire_rust`, seeded RNG via a seed in game state. Verify: build exits 0; a headless test of N seeded runs reaches both a win and a loss."

1. New module `<!-- new: ts/src/games/wire_rust/run.ts -->` (pure run rules: new run, move, play card, dice, status).
2. `ts/src/games/wire_rust/types.ts`: three fields on `WireRustGameState`.
3. `ts/src/games/wire_rust/App.tsx`: use `run.ts`, add Restart, the locked Control Room and the win screen.
4. New files `<!-- new: ts/vite.wire_rust.config.ts -->`, `<!-- new: ts/src/standalone/wire_rust/entry.tsx -->`, `<!-- new: ts/src/standalone/wire_rust/index.html -->`, and one line in `ts/package.json`.
5. New test `<!-- new: ts/tests/test_wire_rust_run.ts -->`.

## 3. The work

Files under `ts/` use CRLF line endings; keep them (the Edit tool preserves them).

**Step 1: `types.ts`.** In `interface WireRustGameState`, after `  message: string;` add:
```
  /** Room ids whose challenge the player has won this run. */
  cleared: string[];
  /** Seeds every D20 roll of this run. */
  seed: number;
  /** Cards played so far; with the seed it fixes the next roll. */
  turn: number;
```
**Step 2: `run.ts`**, exactly:
```
import type { GameSession } from '../../engine/types';
import { call } from '../../engine/runtime';
import { mulberry32 } from '../../engine/shared/seededRandom';
import type { CardId, EncounterResult, PlayerState, Room, WireRustGameState } from './types';

export const GATE_ROOM = 'reactor_core';
export const GOAL_ROOM = 'control_room';

export type RunStatus = 'playing' | 'won' | 'lost';

/** The D20 for a given turn of a given run. Same seed and turn always give the same roll. */
export function rollD20(seed: number, turn: number): number {
  return Math.floor(mulberry32(seed + turn * 7919)() * 20) + 1;
}

/** The Control Room opens only after the Reactor Core challenge has been won. */
export function canEnterRoom(cleared: readonly string[], roomId: string): boolean {
  return roomId !== GOAL_ROOM || cleared.includes(GATE_ROOM);
}

export function runStatus(state: Pick<WireRustGameState, 'player'>): RunStatus {
  if (state.player.hp <= 0) return 'lost';
  return state.player.current_room_id === GOAL_ROOM ? 'won' : 'playing';
}

function roomsOf(session: GameSession): Record<string, Room> {
  const data = session.files.data as Record<string, unknown>;
  return (data.rooms ?? {}) as Record<string, Room>;
}

export function newRun(session: GameSession, seed: number = Math.floor(Math.random() * 0x7fffffff)): WireRustGameState {
  const data = session.files.data as Record<string, unknown>;
  const rooms = roomsOf(session);
  const player = call(session, 'init_game', data)[0] as PlayerState;
  return {
    player,
    currentRoom: rooms[player.current_room_id] ?? rooms.junk_heap,
    combatHistory: [],
    message: 'Scrapyard entered.',
    cleared: [],
    seed,
    turn: 0,
  };
}

/** Returns the same state object when the move is not allowed. */
export function applyMove(session: GameSession, state: WireRustGameState, roomId: string): WireRustGameState {
  if (!canEnterRoom(state.cleared, roomId)) return state;
  const data = session.files.data as Record<string, unknown>;
  const next = call(session, 'move_room', data, state.player, roomId)[0] as PlayerState | null;
  if (!next || next.current_room_id === state.player.current_room_id) return state;
  const rooms = roomsOf(session);
  return {
    ...state,
    player: next,
    currentRoom: rooms[next.current_room_id] ?? state.currentRoom,
    message: `Moved to ${rooms[next.current_room_id]?.name ?? roomId}`,
  };
}

export interface PlayOutcome {
  state: WireRustGameState;
  result: EncounterResult | null;
}

export function applyPlayCard(session: GameSession, state: WireRustGameState, cardId: CardId): PlayOutcome {
  const data = session.files.data as Record<string, unknown>;
  const roll = rollD20(state.seed, state.turn);
  const result = call(session, 'resolve_encounter', data, state.player, cardId, roll)[0] as EncounterResult | null;
  if (!result) return { state, result: null };

  const cards = (data.cards ?? {}) as Record<string, { combat_mod?: number }>;
  const cardMod = cards[cardId]?.combat_mod ?? 0;
  const math = `D20 ${roll} + card ${cardMod} + chem ${result.bonus} = ${result.total_score} vs ${result.difficulty}`;
  const logMsg = result.won
    ? `[WIN] ${state.currentRoom.name}: ${math} — salvage stored!`
    : `[LOSS] ${state.currentRoom.name}: ${math} — core integrity damaged.`;

  return {
    result,
    state: {
      ...state,
      player: result.player,
      combatHistory: [logMsg, ...state.combatHistory.slice(0, 49)],
      message: result.won ? 'Encounter resolved' : 'Core hit',
      cleared: result.won && !state.cleared.includes(state.currentRoom.id)
        ? [...state.cleared, state.currentRoom.id]
        : state.cleared,
      turn: state.turn + 1,
    },
  };
}
```
**Step 3: `App.tsx`, edits in order.**
1. Imports. Replace `import type { GameRendererProps, GameSession } from '../../engine/types';` with `import type { GameRendererProps } from '../../engine/types';`. Replace `import type { Room, PlayerState, EncounterResult, WireRustGameState, CardId } from './types';` with:
```
import type { Room, CardId } from './types';
import { GATE_ROOM, applyMove, applyPlayCard, canEnterRoom, newRun, runStatus } from './run';
```
2. Delete the function `buildInitialState` (from `function buildInitialState(session: GameSession): WireRustGameState {` through its closing `}`); `run.ts` `newRun` replaces it. Change `useGameState(session, buildInitialState)` to `useGameState(session, newRun)`.
3. Replace the three handlers `handleMove`, `handlePlayCard` and `handleReset` (from `  const handleMove = useCallback(` through the `  }, [session, setState]);` that ends `handleReset`) with:
```
  const handleMove = useCallback((roomId: string) => {
    if (!state) return;
    const next = applyMove(session, state, roomId);
    if (next === state) return;
    sfx.play('whoosh');
    setState(next);
  }, [state, session, setState]);

  const handlePlayCard = useCallback((cardId: CardId) => {
    if (!state) return;
    const { state: next, result } = applyPlayCard(session, state, cardId);
    if (!result) return;
    sfx.play(result.won ? 'win' : 'lose');
    setState(next);
  }, [state, session, setState]);

  const handleReset = useCallback(() => {
    setState(newRun(session));
    sfx.play('click');
  }, [session, setState]);

  const handleRestart = useCallback(() => {
    handleReset();
    setShowTitle(true);
  }, [handleReset]);

```
(`useLuaCall`'s `call` stays: the synergy memo still uses it. `data` and `rooms` stay: navigation uses them.)
4. Replace `  const isGameOver = state.player.hp <= 0;` with:
```
  const status = runStatus(state);
  const isGameOver = status === 'lost';
  const isWon = status === 'won';
```
5. Win screen. Replace the opening `      {isGameOver ? (` of the JSX conditional with the following, so the existing game-over card and the grid are unchanged:
```
      {isWon ? (
        <Card className="max-w-md mx-auto mt-12 p-6 border-emerald-500 bg-emerald-950/20 text-center">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">SYSTEM ONLINE</h2>
          <p className="text-slate-300 mb-2">You reached the Control Room and brought the scrapyard back to life.</p>
          <p className="text-slate-400 text-sm mb-6">
            Core integrity {state.player.hp} HP, {state.player.scrap} scrap, {state.cleared.length} rooms cleared.
          </p>
          <Button
            onClick={handleRestart}
            variant="primary"
            className="w-full justify-center"
            label="Play Again"
            icon={<RefreshCw className="mr-2 h-4 w-4" />}
          />
        </Card>
      ) : isGameOver ? (
```
6. Locked Control Room. Replace the navigation `{state.currentRoom.connections.map(connId => ( <Button ... /> ))}` with:
```
                {state.currentRoom.connections.map(connId => {
                  const open = canEnterRoom(state.cleared, connId);
                  return (
                    <Button
                      key={connId}
                      onClick={() => handleMove(connId)}
                      disabled={!open}
                      variant="secondary"
                      className="justify-between"
                      label={open ? `Move to ${rooms[connId]?.name || connId}` : `${rooms[connId]?.name || connId} (locked)`}
                      icon={
                        <span className="ml-2">
                          <Badge variant="muted" label={open ? `Threat ${rooms[connId]?.difficulty}` : `Win in ${rooms[GATE_ROOM]?.name ?? GATE_ROOM} first`} />
                        </span>
                      }
                    />
                  );
                })}
```
7. Restart during play and the goal line. In the Location card, replace the inner `<div className="flex flex-col gap-2"> <div className="flex justify-between text-sm"> ...Room Threat... </div> </div>` with the same div plus two lines before its closing tag:
```
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span>Room Threat:</span>
                  <span className="text-yellow-500 font-bold">{state.currentRoom.difficulty}</span>
                </div>
                <p className="text-xs text-slate-400">Goal: reach the Control Room. It opens once you win in the Reactor Core.</p>
                <Button onClick={handleRestart} variant="secondary" size="sm" label="Restart" />
              </div>
```

**Step 4: build script.** Mirror `choke_point` (a Lua-backed standalone, built and checked once before this directive was written: `built in 15.02s`, exit 0, `assets/index-DTsEc5CM.js 480.41 kB`).
- `ts/vite.wire_rust.config.ts`:
```
import { makeStandaloneConfig } from './vite.standalone.factory';

export default makeStandaloneConfig('wire_rust');
```
- `ts/src/standalone/wire_rust/entry.tsx` (a copy of `ts/src/standalone/choke_point/entry.tsx` with the id changed):
```
import ReactDOM from 'react-dom/client';
import '../../index.css';
import App from '../../games/wire_rust/App';
import { buildStandaloneSession } from '../../engine/standaloneLoader';

import dataRaw from '../../../../games/wire_rust/data.yaml?raw';
import uiRaw from '../../../../games/wire_rust/ui.yaml?raw';
import systemsRaw from '../../../../games/wire_rust/systems.yaml?raw';

const gameLuaModules = import.meta.glob('../../../../games/wire_rust/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toGameLuaFiles(modules: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    out[modulePath.split('/').pop()!] = content;
  }
  return out;
}

const engineLuaModules = import.meta.glob('../../../../engine/primitives/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const engineSystemModules = import.meta.glob('../../../../engine/systems/*.lua', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function toEngineLuaFiles(
  modules: Record<string, string>,
  subdir: string
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [modulePath, content] of Object.entries(modules)) {
    const fileName = modulePath.split('/').pop()!;
    out[`${subdir}/${fileName}`] = content;
  }
  return out;
}

const gameId = 'wire_rust';

const session = buildStandaloneSession({
  gameId,
  dataRaw,
  uiRaw,
  systemsRaw,
  gameLuaFiles: toGameLuaFiles(gameLuaModules),
  engineLuaFiles: {
    ...toEngineLuaFiles(engineLuaModules, 'primitives'),
    ...toEngineLuaFiles(engineSystemModules, 'systems'),
  },
});

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<App session={session} />);
}
```
- `ts/src/standalone/wire_rust/index.html`:
```
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wire &amp; Rust</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.tsx"></script>
  </body>
</html>
```
- `ts/package.json`: add this line directly after the existing `"build:choke_point": ...` line (line 21), keeping the trailing comma:
```
    "build:wire_rust": "vite build --config vite.wire_rust.config.ts",
```
The build writes `ts/dist-wire_rust/` (gitignored): do not commit it.

**Step 5: test**, exactly `ts/tests/test_wire_rust_run.ts` (40 seeds, two strategies, about 2.5 seconds):
```
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadGame } from '../src/engine/runtime';
import type { GameSession } from '../src/engine/types';
import type { CardId, WireRustGameState } from '../src/games/wire_rust/types';
import {
  GATE_ROOM,
  GOAL_ROOM,
  applyMove,
  applyPlayCard,
  canEnterRoom,
  newRun,
  rollD20,
  runStatus,
} from '../src/games/wire_rust/run';

const root = resolve(import.meta.dirname, '..');
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8');

const COMBAT_MOD: Record<string, number> = { copper_rod: 2, zinc_plate: 1, iron_block: 3, lead_solder: 0 };
const MAX_STEPS = 400;
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);

/** best: strongest card, takes the exit once the gate is won. grinder: weakest card, never leaves the Reactor Core. */
type Strategy = 'best' | 'grinder';

function pickCard(hand: string[], strategy: Strategy): CardId {
  const sorted = [...hand].sort((a, b) => COMBAT_MOD[b] - COMBAT_MOD[a]);
  return (strategy === 'best' ? sorted[0] : sorted[sorted.length - 1]) as CardId;
}

/** Plays one seeded run to the end and returns the final state plus the number of steps taken. */
function playRun(seed: number, strategy: Strategy): { state: WireRustGameState; steps: number } {
  const session: GameSession = loadGame('wire_rust', seed);
  let state = newRun(session, seed);
  let steps = 0;
  while (runStatus(state) === 'playing' && steps < MAX_STEPS) {
    steps++;
    const here = state.currentRoom.id;
    const gateCleared = state.cleared.includes(GATE_ROOM);
    if (gateCleared && strategy === 'best') {
      state = applyMove(session, state, GOAL_ROOM);
      continue;
    }
    if (here === 'junk_heap') {
      state = applyMove(session, state, 'rust_pit');
    } else if (here === 'rust_pit') {
      state = applyMove(session, state, GATE_ROOM);
    } else if (here === GATE_ROOM) {
      if (state.player.hand.length === 0) {
        state = applyMove(session, state, 'rust_pit');
      } else {
        state = applyPlayCard(session, state, pickCard(state.player.hand, strategy)).state;
      }
    }
  }
  return { state, steps };
}

describe('Wire & Rust seeded D20', () => {
  it('same seed and turn give the same roll, always 1 to 20', () => {
    expect(rollD20(7, 3)).toBe(rollD20(7, 3));
    for (let t = 0; t < 200; t++) {
      const r = rollD20(99, t);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(20);
    }
    const distinct = new Set(Array.from({ length: 50 }, (_, t) => rollD20(5, t)));
    expect(distinct.size).toBeGreaterThan(5);
  });
});

describe('Wire & Rust run rules', () => {
  it('locks the Control Room until the Reactor Core is won', () => {
    expect(canEnterRoom([], GOAL_ROOM)).toBe(false);
    expect(canEnterRoom(['rust_pit'], GOAL_ROOM)).toBe(false);
    expect(canEnterRoom([GATE_ROOM], GOAL_ROOM)).toBe(true);
    expect(canEnterRoom([], 'rust_pit')).toBe(true);
  });

  it('applyMove refuses a locked room and returns the same state', () => {
    const session = loadGame('wire_rust', 1);
    const state = newRun(session, 1);
    expect(applyMove(session, state, GOAL_ROOM)).toBe(state);
  });

  it('reports won in the Control Room and lost at 0 HP', () => {
    const session = loadGame('wire_rust', 1);
    const state = newRun(session, 1);
    expect(runStatus(state)).toBe('playing');
    expect(runStatus({ player: { ...state.player, current_room_id: GOAL_ROOM } })).toBe('won');
    expect(runStatus({ player: { ...state.player, hp: 0 } })).toBe('lost');
  });
});

describe('Wire & Rust headless runs (40 seeds)', () => {
  it('every run ends, never goes negative, and both a win and a loss are reachable', () => {
    let wins = 0;
    let losses = 0;
    for (const seed of SEEDS) {
      for (const strategy of ['best', 'grinder'] as Strategy[]) {
        const { state, steps } = playRun(seed, strategy);
        expect(steps, `seed ${seed} ${strategy} did not end`).toBeLessThan(MAX_STEPS);
        expect(state.player.hp).toBeGreaterThanOrEqual(0);
        expect(state.player.scrap).toBeGreaterThanOrEqual(0);
        const status = runStatus(state);
        expect(status).not.toBe('playing');
        if (strategy === 'best') expect(status, `seed ${seed} best`).toBe('won');
        else expect(status, `seed ${seed} grinder`).toBe('lost');
        if (status === 'won') wins++;
        else losses++;
      }
    }
    expect(wins).toBe(SEEDS.length);
    expect(losses).toBe(SEEDS.length);
  });

  it('the same seed and strategy replays identically', () => {
    const a = playRun(11, 'best');
    const b = playRun(11, 'best');
    expect(b.state.combatHistory).toEqual(a.state.combatHistory);
    expect(b.state.player.hp).toBe(a.state.player.hp);
  });
});

describe('Wire & Rust Tier A wiring', () => {
  const app = read('src/games/wire_rust/App.tsx');

  it('has a Restart button that returns to the title, and a win screen', () => {
    expect(app).toContain('label="Restart"');
    expect(app).toMatch(/handleRestart = useCallback\(\(\) => \{\s*handleReset\(\);\s*setShowTitle\(true\);/);
    expect(app).toContain('SYSTEM ONLINE');
    expect(app).toContain('label="Play Again"');
  });

  it('no longer rolls with Math.random in the app', () => {
    expect(app).not.toContain('Math.random');
  });

  it('has the standalone files and the build script', () => {
    expect(existsSync(resolve(root, 'vite.wire_rust.config.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/wire_rust/entry.tsx'))).toBe(true);
    expect(existsSync(resolve(root, 'src/standalone/wire_rust/index.html'))).toBe(true);
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    expect(scripts['build:wire_rust']).toBe('vite build --config vite.wire_rust.config.ts');
  });
});
```

## 4. What NOT to do

- NO Lua additions or edits: do not touch `games/wire_rust/logic.lua`, `data.yaml`, `systems.yaml`, `ui.yaml` or anything under `engine/`. Moving this game's logic to TypeScript is a studio-level decision outside this plan.
- No scrap spending, no deck changes, no card loss (the next directive owns deck evolution).
- No new rooms, cards or balance numbers.
- No changes to other games, the shared UI components, the registry or `config.ts`.
- No deploys, no protected repos, no player-layer or cloud saves.
- Do not edit `ts/tests/test_wire_rust_ui.ts` or `tests/test_wire_rust.py`; they must keep passing unchanged.

## 5. Verification

```
uv run python --version
```
Expected `Python 3.12.x`; verified here: `Python 3.12.12`.

Baseline, before editing (origin/main `d3084de0`):
```
cd ts && npx vitest run test_wire_rust_ui.ts
```
Real tail: `Test Files  1 passed (1)` / `Tests  2 passed (2)`.
```
uv run pytest tests/test_wire_rust.py -q
```
Real tail: `4 passed`.

After editing:
```
cd ts && npx vitest run test_wire_rust_run.ts test_wire_rust_ui.ts
```
Real prototype tail: `Test Files  2 passed (2)` / `Tests  11 passed (11)` (9 new). Run the pytest line again: still `4 passed`.
Type check, prints nothing when clean: `cd ts && npx tsc --noEmit` (a lone missing `game-metadata.json` import error means the worktree lacks that gitignored file: write that in the Status row, do not hunt).
Source check (Grep tool): `App.tsx` contains no `Math.random`; `ts/package.json` contains `"build:wire_rust"` once.

## 6. Rules for this run

- This run is NON-INTERACTIVE. A tool call that needs a confirmation is rejected and the run ends mid-task.
- ONE simple command per tool call. No `;`, `&&`, `||`, `|` chains and no redirects, with the single exception of
  the sanctioned verification line form `cd ts && npx vitest run <bare-filename>` (several bare filenames may follow one `vitest run`), `cd ts && npx tsc --noEmit`, `uv run python --version` and (only where a Verification section names it) `uv run pytest tests/test_wire_rust.py -q`. Do not use `ls`, `Get-ChildItem`
  or `cat`: use Read, Glob and Grep. Use the bare test filename as the filter (a path filter finds no tests). No live process probing.
- Do not install, download or fetch anything. Do not read outside this worktree. Do not search or hunt for facts: every
  path and quoted line you need is above. If a path is missing or a quoted line differs from the file, STOP and write why in the Status row.
- Do NOT run `npm run build:*`, `vite-node`, `agentflow` commands or `uv run python -m studio.demos index` (the sandbox refuses them; the controller runs builds and exporters after merge).
- Do not run `git merge origin/main`.
- Never commit to main, never push, never deploy. Work stays on your `directive/<slug>` branch; commit there. Only Robert merges.
- Do not create scratch or debug files in the repo; use `.devin-scratch/` if you need one.
- No absolute paths inside this repo's checkout in any file you write; use repo-relative paths.
- Files under `ts/` and `docs/` use CRLF line endings in the worktree; keep them (the Edit tool preserves them). New files may use either; git normalizes line endings on commit.
- New logic goes in small new modules; no file over 600 lines.
- Status row meanings: when every Completion criteria box is checked and the verification tails are in the log line,
  set the row to **Review** (this is "Done" for the run). Never set it to Done: only Robert or Claude marks Done after merge.
  If you stop partway, set it to Blocked and write why.

## 7. Completion criteria

- [ ] A Restart button is visible during play and returns to the title; a run ends in a "SYSTEM ONLINE" win screen with Play Again when the Control Room is entered, and the Control Room is locked until the Reactor Core is won.
- [ ] Dice come from `rollD20(seed, turn)`; `App.tsx` has no `Math.random`.
- [ ] `ts/vite.wire_rust.config.ts`, `ts/src/standalone/wire_rust/entry.tsx` and `index.html` exist; `ts/package.json` has `build:wire_rust`.
- [ ] `cd ts && npx vitest run test_wire_rust_run.ts test_wire_rust_ui.ts` and the pytest line pass (real tails pasted); `cd ts && npx tsc --noEmit` prints nothing.
- [ ] No file outside the Scope list changed (no Lua); the Status row is set to Review with a one-line log entry.

## 8. Report

Findings first: the files and the real test counts. Evidence second: the real tails. Say plainly that wins are easy today and that Lua's own `math.random` (hand shuffles, scrap amounts) is still seeded only once per page load by the loader.
**Controller finish (after merge):** `cd ts && npm run build:wire_rust` must exit 0 (the sandbox refuses `npm run build:*`), then desktop and 390-wide screenshots of the title, mid-run with the locked Control Room, and the win screen.
Recommended action: review, merge, then the deck-evolution directive (`Wire_Rust_Deck_Evolution_Directive.md`).

## Sandbox needs

none

## Forbidden Actions

- Committing to or pushing main; pushing at all; deploying; installing or fetching anything; reading outside the worktree; touching protected repos; editing `archive/`, `docs/children.json` or `tests/fixtures/demo_lists_snapshot.json`.

## Required from User

none.

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Review |
| Assigned to | devin |
| Branch | directive/wr-tiera |
| Base branch | - |

**Status log**
- 2026-10-04 13:29 · robert-claude-laptop · none → Queued
- 2026-10-04 18:04 · devin · Queued → Review — run.ts (seeded D20, locked Control Room, win status) + App.tsx Restart/win screen + standalone trio + build:wire_rust; vitest 2 files / 11 passed (spec-exact), pytest 4 passed, tsc clean (metadata present); build + screenshots deferred to controller
<!-- queue:end -->
