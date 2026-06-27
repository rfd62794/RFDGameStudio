# RFDGameStudio — Phase 2i Directive: Lua File Split

*June 2026 | Read fully before executing anything.*
*Pure refactor. Zero behavior change. Floors must hold throughout.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 42 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

Phase 2h certified the `GAME_STATE` / `tick_game` architecture in a single
`logic.lua` file (~500 lines). That file now owns physics, collision, AI, rendering,
utilities, and discrete helpers — too much for one file as the game grows.

This phase splits it into six files loaded in dependency order. The loader
concatenates them into one string before the Lua VM sees it — same as how
`engine/primitives/` and `engine/systems/` work today. No new Lua semantics.
No behavior change.

**Backward compatibility:** `horse_racing` has no `lua_files` key in
`systems.yaml`. The loader falls back to `logic.lua` alone. No horse_racing
changes needed.

---

## §1 Dependency Order

Concatenation order is the load order. Every file may only call functions defined
in files earlier in the list.

```
1. utils.lua      — clamp, dist2, normalize_angle, build_segments,
                    spawn_fruit_from_config
2. state.lua      — GAME_STATE global, _calc_effects, init_game,
                    update_evolution_effects
3. physics.lua    — _update_player, _follow, _update_npcs, _decay_acid_drops
4. collision.lua  — _collisions  (calls _follow, spawn_fruit_from_config)
5. render.lua     — build_render_state
6. logic.lua      — tick_game, discrete helpers (check_evolution_trigger,
                    select_evolution_pool, calculate_grade, spawn_fruit,
                    generate_npc, decide_npc_action)
```

---

## §2 Scope

| File | Action |
|---|---|
| `games/slither_rogue/logic.lua` | Split into 6 files — then this file keeps only what's in §2.6 |
| `games/slither_rogue/utils.lua` | New |
| `games/slither_rogue/state.lua` | New |
| `games/slither_rogue/physics.lua` | New |
| `games/slither_rogue/collision.lua` | New |
| `games/slither_rogue/render.lua` | New |
| `games/slither_rogue/systems.yaml` | Add `lua_files` key |
| `studio/loader.py` | Read `lua_files`, concatenate in order |
| `ts/src/engine/loader.ts` | Read `lua_files`, concatenate in order |
| `tests/fixtures/slither_rogue/` | Sync all 6 files + systems.yaml |

**Read-only — do not touch:**
`games/horse_racing/`, `engine/`, all test files except fixture sync,
`studio/executor.py`, `studio/runtime.py`, `ts/src/engine/executor.ts`,
`ts/src/engine/runtime.ts`.

---

## §3 systems.yaml Change

Add `lua_files` key listing the six files in load order:

```yaml
lua_files:
  - utils.lua
  - state.lua
  - physics.lua
  - collision.lua
  - render.lua
  - logic.lua
```

Place this block at the top of `systems.yaml`, before `engine_version`.

---

## §4 File Split

Read the current `logic.lua` in full before creating any file.
Copy exact function bodies verbatim — no rewrites, no renames.

### §4.1 utils.lua

Functions to extract:
- `clamp(v, lo, hi)`
- `dist2(x1, y1, x2, y2)`
- `normalize_angle(a)`
- `build_segments(x, y, angle, length, radius)`
- `spawn_fruit_from_config(cfg)`

Add header comment:
```lua
-- Slither Rogue — Utilities
-- Pure functions. No global state. No side effects.
-- Loaded first — all other files may call these.
```

### §4.2 state.lua

Functions to extract:
- `GAME_STATE = nil` (the global declaration)
- `_calc_effects(active, cards)`
- `init_game(config)`
- `update_evolution_effects(active_evolutions)`

Add header comment:
```lua
-- Slither Rogue — State
-- GAME_STATE global and all functions that initialize or mutate it.
-- Depends on: utils.lua
```

### §4.3 physics.lua

Functions to extract:
- `_update_player(st, dt, input)`
- `_follow(snake)`
- `_update_npcs(st, dt)`
- `_decay_acid_drops(st, dt)`

Add header comment:
```lua
-- Slither Rogue — Physics
-- Per-tick movement, segment following, NPC AI, acid decay.
-- Depends on: utils.lua, state.lua
```

### §4.4 collision.lua

Functions to extract:
- `_collisions(st)`

Add header comment:
```lua
-- Slither Rogue — Collision
-- Fruit eating, segment stealing, venom effects.
-- Depends on: utils.lua, state.lua, physics.lua (_follow)
```

### §4.5 render.lua

Functions to extract:
- `build_render_state(st)`

Add header comment:
```lua
-- Slither Rogue — Render State
-- Builds the compact flat-array render state returned to TypeScript.
-- Depends on: state.lua (GAME_STATE shape)
```

### §4.6 logic.lua (residual)

After extraction, `logic.lua` retains only:
- `tick_game(dt, input)`
- `check_evolution_trigger(fruits_eaten_since, threshold)`
- `select_evolution_pool(all_cards, count)`
- `calculate_grade(score, thresholds)`
- `spawn_fruit(fruit_config, arena)`
- `generate_npc(npc_profiles, npc_stats, arena, index)`
- `decide_npc_action(npc_head, npc_angle, nearby_fruits, arena)`

Add header comment:
```lua
-- Slither Rogue — Game Logic (entry point)
-- tick_game: main loop called once per frame by TypeScript.
-- Discrete helpers: called by TypeScript on specific game events.
-- Depends on: utils.lua, state.lua, physics.lua, collision.lua, render.lua
```

> ⚠️ RULE: Do not rewrite any function during the split. Copy verbatim.
> The only acceptable changes are adding the header comment and removing
> extracted functions. If a function body changes, the phase is wrong.

---

## §5 Loader Changes

### §5.1 studio/loader.py

In `load_game_files()`, after loading `systems.yaml`, check for `lua_files` key.
If present, load each file in order and concatenate. If absent, load `logic.lua`
as before.

```python
# In load_game_files(), replace the single logic.lua read with:

lua_files = systems_data.get("lua_files", None)

if lua_files:
    # Load each file in declared order, concatenate
    parts = []
    for fname in lua_files:
        fpath = game_dir / fname
        if not fpath.exists():
            raise FileNotFoundError(f"lua_files entry not found: {fpath}")
        parts.append(fpath.read_text(encoding="utf-8"))
    logic = "\n\n".join(parts)
else:
    # Backward compat — single logic.lua
    logic = (game_dir / "logic.lua").read_text(encoding="utf-8")
```

> ⚠️ RULE: `horse_racing/systems.yaml` has no `lua_files` key.
> The loader must fall through to the single `logic.lua` load for horse_racing.
> Verify this by running `uv run pytest -v` after the loader change.

### §5.2 ts/src/engine/loader.ts

Same logic in TypeScript. After importing `systemsRaw`, check for `lua_files`.

```typescript
// In loadGameFiles(), after loading systems:

const systemsData = yaml.load(assets.systems ?? '') as Record<string, unknown> ?? {};
const luaFiles = systemsData['lua_files'] as string[] | undefined;

let logicSource: string;
if (luaFiles && luaFiles.length > 0) {
  // Load each file in declared order via ?raw imports
  // Use a lookup map from filename to ?raw import
  const LUA_FILE_MAP: Record<string, string> = {
    'utils.lua':     srUtilsRaw,
    'state.lua':     srStateRaw,
    'physics.lua':   srPhysicsRaw,
    'collision.lua': srCollisionRaw,
    'render.lua':    srRenderRaw,
    'logic.lua':     srLogicRaw,
  };
  logicSource = luaFiles.map(f => LUA_FILE_MAP[f] ?? '').join('\n\n');
} else {
  logicSource = assets.logic;
}
```

Add the six `?raw` imports at the top of `loader.ts` for `slither_rogue`:

```typescript
// Slither Rogue split Lua files
import srUtilsRaw     from '../../games/slither_rogue/utils.lua?raw';
import srStateRaw     from '../../games/slither_rogue/state.lua?raw';
import srPhysicsRaw   from '../../games/slither_rogue/physics.lua?raw';
import srCollisionRaw from '../../games/slither_rogue/collision.lua?raw';
import srRenderRaw    from '../../games/slither_rogue/render.lua?raw';
import srLogicRaw     from '../../games/slither_rogue/logic.lua?raw';
```

> ⚠️ NOTE: The existing `?raw` import pattern for horse_racing already exists
> in `loader.ts`. Follow the same pattern. IDE may flag `?raw` imports as type
> errors — these are Vite-only and do not affect the build. Ignore them.

> ⚠️ RULE: The `LUA_FILE_MAP` only covers `slither_rogue` files. Any future
> game with `lua_files` will need its files added to this map. This is the
> known limitation of Vite's static `?raw` import system — all files must be
> known at build time.

---

## §6 Fixture Sync

After all six files are created and tested:

```powershell
# Remove old fixture logic.lua and copy all six new files
Remove-Item "tests\fixtures\slither_rogue\logic.lua" -Force
Copy-Item "games\slither_rogue\utils.lua"     "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\state.lua"     "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\physics.lua"   "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\collision.lua" "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\render.lua"    "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\logic.lua"     "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\systems.yaml"  "tests\fixtures\slither_rogue\" -Force
```

After syncing, update `test_slither_rogue.py`:
The existing `LUA_SOURCE` fixture load reads a single `logic.lua`. Change it
to concatenate all six files in dependency order:

```python
# In test_slither_rogue.py, replace the LUA_SOURCE load with:
_lua_files = ["utils.lua", "state.lua", "physics.lua",
              "collision.lua", "render.lua", "logic.lua"]
LUA_SOURCE = "\n\n".join(
    (FIXTURES_DIR / "slither_rogue" / f).read_text(encoding="utf-8")
    for f in _lua_files
)
```

---

## §7 Verification Steps

Run after each step — do not skip:

**After loader.py change (before file split):**
```bash
uv run pytest -v    # must be 42/0/0 — horse_racing unaffected
```

**After file split + systems.yaml change:**
```bash
uv run pytest -v    # must be 42/0/0
```

**After fixture sync + test_slither_rogue.py update:**
```bash
uv run pytest -v    # must be 42/0/0
```

**After loader.ts change:**
```bash
cd ts && npx vite build    # must exit 0
cd ts && npx vitest run    # must be 17/0/0
```

---

## §8 Completion Criteria

- [ ] `uv run pytest -v` → **42 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vitest run` → **17 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vite build` → exits 0
- [ ] `games/slither_rogue/` contains 6 `.lua` files + `systems.yaml`
- [ ] `tests/fixtures/slither_rogue/` contains 6 `.lua` files (no single `logic.lua`)
- [ ] `horse_racing` still loads and plays correctly (`?game=horse_racing`)
- [ ] `slither_rogue` still loads and plays correctly (`?game=slither_rogue`)
- [ ] `grep -n "updatePhysics\|checkCollisions" ts/src/games/slither_rogue/components/GameCanvas.tsx` → zero matches (unchanged from 2h)
- [ ] `docs/state/current.md` updated to Phase 2i certified

**Proof required:**
- Raw `uv run pytest -v` output (42/0/0)
- Raw `npx vitest run` output (17/0/0)
- `ls games/slither_rogue/*.lua` output (6 files listed)

---

## §9 Quick Reference

| Item | Value |
|---|---|
| Python floor | 42 / 0 / 0 (unchanged) |
| TypeScript floor | 17 / 0 / 0 (unchanged) |
| New files | utils.lua, state.lua, physics.lua, collision.lua, render.lua |
| Modified files | logic.lua (residual), systems.yaml, loader.py, loader.ts, test_slither_rogue.py |
| Deleted files | tests/fixtures/slither_rogue/logic.lua (replaced by 6 files) |
| Backward compat | horse_racing unchanged — no lua_files key = single logic.lua |
| Vite constraint | All ?raw imports must be statically known at build time |
| No behavior change | Zero — pure file reorganization |

---

*RFDGameStudio Phase 2i | June 2026 | RFD IT Services Ltd.*
*Same logic. Six files. One VM. The loader stitches, Lua never knows.*
