# RFDGameStudio — Phase 2 Directive: TypeScript Runtime

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run pytest before touching any file.
> Must report 15 passed, 0 failed, 0 skipped.
> If count differs, stop and report — do not proceed.
> Command: `uv run pytest -v`

---

## §0 Context

**What exists:**
- Phase 1 certified: Python runtime, loader, validator, executor, 15/0/0 floor
- `games/horse_racing/` — three canonical game files (data.yaml, ui.yaml, logic.lua)
- `examples/` — working TypeScript/React horse racing game (reference implementation)
- Known bug: `games/horse_racing/ui.yaml` line 168 — `history_item:` mapping key at
  wrong indentation level (inside sequence, should be sibling of `content:`)

**What this phase delivers:**
- Day-one fix of `games/horse_racing/ui.yaml` canonical bug
- TypeScript runtime in `ts/` — Vite + React project
- fengari Lua executor: loads logic.lua, calls pure Lua functions from TypeScript
- TypeScript loader: reads data.yaml and ui.yaml, returns typed objects
- TypeScript runtime bridge: `loadGame()`, `call()`, `getSchema()` — same contract
  as the Python runtime (SDD §4.1)
- Horse racing game playable in browser — stable tab, betting tab, race runs,
  result displays
- `examples/` is the reference implementation — match its behavior, not its
  architecture. The examples version has logic in React components. Phase 2 pulls
  all logic into Lua via fengari.
- Vitest test floor: 12 passing, 0 failing, 0 skipping

**What is NOT in scope:**
- No breeding tab implementation (data model only)
- No history tab persistence (no localStorage, no backend)
- No CSS polish beyond functional layout
- No Rust runtime (Phase 5)
- No MCP integration (Phase 3)
- No Python runtime changes — Phase 1 floor stays at 15/0/0
- No new games
- No itch.io deployment

---

## §1 Scope Statement

**Day-one fix (before any TypeScript work):**

| File | Status | Action |
|---|---|---|
| `games/horse_racing/ui.yaml` | Modify (bug fix only) | Dedent `history_item:` one level — sibling of `content:`, not inside it |
| `tests/fixtures/horse_racing/ui.yaml` | Modify | Apply same fix to fixture copy |

**TypeScript project:**

| File | Status | Action |
|---|---|---|
| `ts/package.json` | New | Vite + React + fengari + vitest |
| `ts/vite.config.ts` | New | Vite config, WASM support, assets |
| `ts/tsconfig.json` | New | Strict TypeScript config |
| `ts/src/engine/loader.ts` | New | Reads data.yaml + ui.yaml, returns typed objects |
| `ts/src/engine/executor.ts` | New | fengari wrapper, Lua function calls |
| `ts/src/engine/runtime.ts` | New | GameSession, loadGame(), call(), getSchema() |
| `ts/src/engine/types.ts` | New | GameFiles, GameSession, RuntimeError interfaces |
| `ts/src/components/StableTab.tsx` | New | Horse card grid from ui.yaml spec |
| `ts/src/components/BettingTab.tsx` | New | Race info, odds, bet controls |
| `ts/src/components/RaceTrack.tsx` | New | SVG race animation or static result display |
| `ts/src/App.tsx` | New | Tab shell wired to ui.yaml layout |
| `ts/src/main.tsx` | New | Vite entry point |
| `ts/src/index.css` | New | Minimal functional styles only |
| `ts/tests/test_loader.ts` | New | Vitest — loader tests |
| `ts/tests/test_executor.ts` | New | Vitest — executor + Lua call tests |
| `ts/tests/test_runtime.ts` | New | Vitest — integration tests |

**Read-only — do not touch:**
`studio/loader.py`, `studio/validator.py`, `studio/executor.py`, `studio/runtime.py`,
`games/horse_racing/data.yaml`, `games/horse_racing/logic.lua`,
`tests/test_loader.py`, `tests/test_executor.py`, `tests/test_runtime.py`

If a bug is found in any read-only file, report it. Do not fix it.

---

## §2 Implementation

### Day-One Fix: games/horse_racing/ui.yaml

Line 168 — `history_item:` is currently at the same indentation level as sequence
items under `content:`. It should be dedented one level to be a sibling of `content:`.

```yaml
# BEFORE (broken):
  history:
    content:
      - type: race_history_list
        data_source: game_state.race_history
        item_template: history_item
        empty_state: "No races completed yet."
      history_item:           # ← wrong: inside sequence block

# AFTER (fixed):
  history:
    content:
      - type: race_history_list
        data_source: game_state.race_history
        item_template: history_item
        empty_state: "No races completed yet."
    history_item:             # ← correct: sibling of content:
```

Apply the same fix to `tests/fixtures/horse_racing/ui.yaml`.
After fix: verify `uv run pytest -v` still reports 15/0/0 before proceeding.

---

### ts/src/engine/types.ts

```typescript
export interface GameFiles {
  gameId: string;
  data: Record<string, unknown>;
  ui: Record<string, unknown>;
  logic: string;            // raw Lua source
}

export interface GameSession {
  gameId: string;
  files: GameFiles;
  executor: LuaExecutor;    // opaque — not exported from runtime
}

export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuntimeError';
  }
}

export class LuaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LuaError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

---

### ts/src/engine/loader.ts

Reads data.yaml and ui.yaml as static assets bundled by Vite.
Reads logic.lua as a raw string asset.

```typescript
import yaml from 'js-yaml';   // add js-yaml to package.json
import { GameFiles, ValidationError } from './types';

// Vite ?raw imports — bundled at build time
import dataRaw from '../../../games/horse_racing/data.yaml?raw';
import uiRaw from '../../../games/horse_racing/ui.yaml?raw';
import logicRaw from '../../../games/horse_racing/logic.lua?raw';

export function loadGameFiles(gameId: string): GameFiles {
  const data = yaml.load(dataRaw) as Record<string, unknown>;
  const ui = yaml.load(uiRaw) as Record<string, unknown>;
  validateData(data, gameId);
  return { gameId, data, ui, logic: logicRaw };
}

function validateData(data: Record<string, unknown>, gameId: string): void {
  const game = data['game'] as Record<string, unknown> | undefined;
  if (!game) throw new ValidationError('Missing required key: game');
  if (!game['id']) throw new ValidationError('Missing required key: game.id');
  if (!game['name']) throw new ValidationError('Missing required key: game.name');
  if (!game['version']) throw new ValidationError('Missing required key: game.version');
  if (!game['studio']) throw new ValidationError('Missing required key: game.studio');
  if (game['id'] !== gameId) {
    throw new ValidationError(
      `game.id mismatch: expected "${gameId}", got "${game['id']}"`
    );
  }
}
```

> ⚠️ RULE: loader.ts uses Vite `?raw` static imports only. No fetch(), no fs,
> no runtime file I/O. All three files are bundled at build time.

> ⚠️ RULE: loader.ts validates the studio contract (game.id/name/version/studio).
> It does not validate game-specific schemas. Same split as Python validator.py.

---

### ts/src/engine/executor.ts

fengari Lua bridge. Wraps the fengari API.

```typescript
import { lua, lauxlib, lualib } from 'fengari-web';
import { LuaError } from './types';

export class LuaExecutor {
  private L: unknown;  // fengari Lua state

  constructor(luaSource: string, seed: number = 42) {
    this.L = lauxlib.luaL_newstate();
    lualib.luaL_openlibs(this.L);
    this.seedRandom(seed);
    const result = lauxlib.luaL_dostring(this.L, luaSource);
    if (result !== lua.LUA_OK) {
      const err = lua.lua_tostring(this.L, -1);
      throw new LuaError(`Lua load error: ${err}`);
    }
  }

  call(fnName: string, ...args: unknown[]): unknown {
    lua.lua_getglobal(this.L, fnName);
    if (lua.lua_type(this.L, -1) !== lua.LUA_TFUNCTION) {
      lua.lua_pop(this.L, 1);
      throw new LuaError(`Lua function not found: ${fnName}`);
    }
    for (const arg of args) {
      this.pushValue(arg);
    }
    const status = lua.lua_pcall(this.L, args.length, 1, 0);
    if (status !== lua.LUA_OK) {
      const err = lua.lua_tostring(this.L, -1);
      lua.lua_pop(this.L, 1);
      throw new LuaError(`Lua error in ${fnName}: ${err}`);
    }
    const result = this.pullValue(-1);
    lua.lua_pop(this.L, 1);
    return result;
  }

  private seedRandom(seed: number): void {
    const src = `math.randomseed(${seed})`;
    lauxlib.luaL_dostring(this.L, src);
  }

  private pushValue(val: unknown): void { /* push JS value onto Lua stack */ }
  private pullValue(idx: number): unknown { /* pull Lua value to JS */ }
}
```

> ⚠️ RULE: All fengari imports are contained in executor.ts. No other file imports
> from fengari-web directly. If fengari fails to load, the error surfaces here.

> ⚠️ RULE: RNG seed is set in the constructor before luaSource is loaded.
> Tests always pass seed=42. Never let Lua seed its own RNG.

> ⚠️ RULE: pushValue and pullValue handle: string, number, boolean, null/nil,
> plain objects (→ Lua tables), arrays (→ Lua sequence tables). Reject functions
> and class instances with a LuaError.

---

### ts/src/engine/runtime.ts

Public API. Same contract as Python runtime.py (SDD §4.1).

```typescript
import { GameFiles, GameSession, RuntimeError } from './types';
import { loadGameFiles } from './loader';
import { LuaExecutor } from './executor';

export function loadGame(gameId: string, seed: number = 42): GameSession {
  const files: GameFiles = loadGameFiles(gameId);
  const executor = new LuaExecutor(files.logic, seed);
  return { gameId, files, executor };
}

export function call(session: GameSession, fnName: string, ...args: unknown[]): unknown {
  return session.executor.call(fnName, ...args);
}

export function getSchema(session: GameSession, entity: string): Record<string, unknown> {
  const schemas = session.files.data['schemas'] as Record<string, unknown> | undefined;
  if (!schemas) throw new RuntimeError('data.yaml missing "schemas" key');
  const schema = schemas[entity] as Record<string, unknown> | undefined;
  if (!schema) throw new RuntimeError(`Schema not found: ${entity}`);
  return schema['fields'] ? schema['fields'] as Record<string, unknown> : schema;
}
```

> ⚠️ RULE: runtime.ts is the only module callers import. App.tsx, components,
> and tests import from './engine/runtime' only — never from loader, executor,
> or types directly except for type imports.

---

### React Components

Components read their structure from `ui.yaml` via the session's `files.ui`.
They do not hardcode tab names, field labels, or component order.

**App.tsx** — reads `ui.yaml layout.tabs`, renders a tab per entry, routes to the
appropriate component. Tab order comes from the yaml array order.

**StableTab.tsx** — renders a horse card grid. Horse data comes from Lua:
`call(session, "get_stable", gameState)`. Card fields come from `ui.yaml`.

**BettingTab.tsx** — renders current race, participant odds, bet input.
Race simulation: `call(session, "simulate_race", field, bets)`.
Result displays inline after race completes.

**RaceTrack.tsx** — SVG or simple CSS animation showing race result.
Reference the `examples/` implementation for visual behavior.
Logic (who wins, by how much) comes from Lua. Rendering only in this component.

> ⚠️ RULE: No game logic in React components. Components call Lua functions and
> render results. If a component is making a decision about game rules, that
> decision belongs in logic.lua.

---

## §3 Test Anchors

**Python floor (must stay green — run first):**
`uv run pytest -v` → 15 passed, 0 failed, 0 skipped

**TypeScript floor (new):**
`cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped

All TypeScript tests mock fengari — no real Lua VM in tests.
Use `vi.mock('fengari-web')` to stub the Lua bridge.

| # | Test Name | File | Behavior |
|---|---|---|---|
| 1 | `test_loader_returns_game_files` | test_loader.ts | Returns object with gameId, data, ui, logic |
| 2 | `test_loader_parses_game_id` | test_loader.ts | data.game.id === "horse_racing" |
| 3 | `test_loader_parses_ui_tabs` | test_loader.ts | ui.layout.tabs is an array with length > 0 |
| 4 | `test_loader_logic_is_string` | test_loader.ts | logic field is non-empty string |
| 5 | `test_loader_missing_game_id_throws` | test_loader.ts | ValidationError on data missing game.id |
| 6 | `test_executor_call_returns_value` | test_executor.ts | Mocked call("clamp", 5, 0, 10) returns 5 |
| 7 | `test_executor_missing_function_throws` | test_executor.ts | LuaError on unknown function name |
| 8 | `test_executor_lua_error_throws` | test_executor.ts | LuaError on Lua runtime error |
| 9 | `test_runtime_load_game_returns_session` | test_runtime.ts | loadGame returns object with gameId and files |
| 10 | `test_runtime_call_delegates_to_executor` | test_runtime.ts | call() reaches executor.call() |
| 11 | `test_runtime_get_schema_returns_fields` | test_runtime.ts | getSchema(session, "horse") has "stats" key |
| 12 | `test_runtime_get_schema_missing_throws` | test_runtime.ts | RuntimeError on unknown entity |

> ⚠️ RULE: No real fengari Lua VM in any TypeScript test. All executor behavior
> is mocked. Lua correctness is proven by the Python executor tests (Phase 1)
> and by the browser smoke test (completion criteria below).

---

## §4 Completion Criteria

- [ ] `uv run pytest -v` → 15 passed, 0 failed, 0 skipped (Python floor unchanged)
- [ ] `games/horse_racing/ui.yaml` line 168 bug fixed in canonical file
- [ ] `tests/fixtures/horse_racing/ui.yaml` same fix applied
- [ ] `cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vite build` → exits 0, no TypeScript errors
- [ ] `cd ts && npx vite dev` → browser opens, Stable tab loads horse cards
- [ ] Place a bet in the browser → race simulates → result displays
- [ ] All horse names, stats, and odds come from Lua (not hardcoded in React)
- [ ] Tab structure matches `ui.yaml layout.tabs` order exactly
- [ ] `docs/state/current.md` updated to Phase 2 certified state

**Proof required:**
- Raw `uv run pytest -v` output (15/0/0)
- Raw `npx vitest run` output (12/0/0)
- Browser screenshot: Stable tab with horse cards visible
- Browser screenshot: Race result after placing a bet

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Python floor | 15 / 0 / 0 (unchanged from Phase 1) |
| TypeScript floor | 12 / 0 / 0 (new) |
| TypeScript runtime path | `ts/src/engine/` |
| Lua bridge | fengari-web |
| Build tool | Vite + React |
| Test runner | Vitest |
| Day-one task | Fix ui.yaml line 168 before any other change |
| Reference impl | `examples/` — match behavior, not architecture |
| No logic in components | All rules stay in logic.lua |
| TS fengari mock rule | `vi.mock('fengari-web')` in all executor tests |
| Phase 3 target | Claude tool integration via MCP |

---

*RFDGameStudio Phase 2 | June 2026 | RFD IT Services Ltd.*
*Fix ui.yaml first. Python floor before TypeScript work. Logic stays in Lua.*
