# RFDGameStudio — Phase Lua-Modular: Engine Primitives Consolidation

*June 2026 | Structural refactor. No behavior changes. Read fully before executing.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Must report **86 passed, 0 failed** (pytest) and **39 passed, 0 failed** (vitest).
> If counts differ, stop and report — do not proceed.

---

## §0 Context

Four games share a Lua engine. Three gaps identified across game logic files:

1. **`collect()` is local in two games** — defined in `horse_racing/logic.lua`
   and `slime_coin/logic.lua` as local functions. Every directive calls it
   "mandatory" but it's not in the engine. It belongs in
   `engine/primitives/action.lua` where it loads before all game logic.

2. **`copy_table` duplicates `copy_entity`** — `engine/primitives/entity.lua`
   already exports `copy_entity(entity)` (shallow copy). `slime_coin/logic.lua`
   defines a local `copy_table(list)` that does the same thing. slime_coin
   should use the engine primitive.

3. **`atan2` wrapper is local to slither_rogue** — `slither_rogue/utils.lua`
   defines `atan2(y, x)` for Lua 5.2+ compatibility (`math.atan` replaced
   `math.atan2` in 5.2). If any future game needs atan2, it would have to
   redefine it. Belongs in `engine/primitives/movement.lua`.

**No behavior changes.** No YAML changes. No TypeScript changes.
No Python changes. Floors must not regress.

---

## §1 Scope

| File | Action |
|---|---|
| `engine/primitives/action.lua` | Add `collect(t)` function |
| `engine/primitives/movement.lua` | Add `atan2(y, x)` wrapper |
| `games/horse_racing/logic.lua` | Remove local `collect`, use engine version |
| `games/slime_coin/logic.lua` | Remove local `copy_table`, use `copy_entity`; remove local `collect` if present |
| `games/slither_rogue/utils.lua` | Remove local `atan2`, use engine version |

**Read-only — do not touch:**
`engine/primitives/entity.lua` (keep `copy_entity` as-is),
`engine/primitives/consequence.lua`,
`engine/primitives/lifecycle.lua`,
`engine/primitives/physics.lua`,
`engine/primitives/resolution.lua`,
`engine/systems/`,
`games/mutant_battle_ball/`,
`games/horse_racing/data.yaml`,
`games/slither_rogue/data.yaml`,
`games/slime_coin/data.yaml`,
all TypeScript files, all Python files, all test files.

---

## §2 Implementation

### Step 1: Add `collect(t)` to `engine/primitives/action.lua`

Append to the end of `action.lua`:

```lua
-- Collect a Python list proxy (or any Lua table) into a Lua-native sequence.
-- Required when receiving list arguments from lupa (Python→Lua bridge).
-- lupa proxies do not support the # operator — rawlen returns 0.
-- Always use collect() before iterating or measuring Python-origin lists.
--
-- t: any table or lupa list proxy
-- Returns: Lua-native sequence table
function collect(t)
  local out = {}
  for _, v in ipairs(t) do out[#out+1] = v end
  return out
end
```

> ⚠️ RULE: `collect` is a global function. Do NOT use `local function collect`.
> It must be available to all game logic files that load after action.lua.

---

### Step 2: Add `atan2(y, x)` to `engine/primitives/movement.lua`

READ `engine/primitives/movement.lua` first. Append to the end:

```lua
-- Lua 5.2+ compatibility wrapper for atan2.
-- math.atan2(y, x) was removed in Lua 5.2; math.atan(y, x) is the replacement.
-- Use this wrapper in any game that needs arctangent of two arguments.
function atan2(y, x)
  return math.atan(y, x)
end
```

> ⚠️ RULE: This is a global wrapper. Do NOT use `local function atan2`.

---

### Step 3: Update `games/horse_racing/logic.lua`

Find and remove the local `collect` definition:

```lua
-- REMOVE THIS BLOCK:
local function collect(t)
  local out = {}
  for _, v in ipairs(t) do out[#out+1] = v end
  return out
end
```

The engine's `collect` (now in `action.lua`) is available as a global.
All call sites `collect(data.race_classes)` etc. remain unchanged.

> ⚠️ RULE: Only remove the local definition. Do NOT touch any call sites.
> Do NOT change any other logic in horse_racing/logic.lua.

---

### Step 4: Update `games/slime_coin/logic.lua`

**4a — Remove local `copy_table` (if present):**

Find and remove the local `copy_table` definition:

```lua
-- REMOVE THIS BLOCK:
local function copy_table(list)
  local result = {}
  for i, v in pairs(list) do
    result[i] = v
  end
  return result
end
```

**4b — Replace all `copy_table(...)` calls with `copy_entity(...)`:**

The engine's `copy_entity(entity)` is identical in behavior — shallow copy
of any table. Replace every call site:

```lua
-- BEFORE:
local shelf_coins = copy_table(GAME_STATE.shelf_coins)
local floor_coins = copy_table(GAME_STATE.floor_coins)
local obstacles   = copy_table(GAME_STATE.obstacles)
local owned       = copy_table(GAME_STATE.owned_chips)

-- AFTER:
local shelf_coins = copy_entity(GAME_STATE.shelf_coins)
local floor_coins = copy_entity(GAME_STATE.floor_coins)
local obstacles   = copy_entity(GAME_STATE.obstacles)
local owned       = copy_entity(GAME_STATE.owned_chips)
```

Search for ALL occurrences of `copy_table` in slime_coin/logic.lua and
replace each one with `copy_entity`. There should be approximately 8-12
call sites.

**4c — Remove local `collect` (if present in slime_coin/logic.lua):**

If `slime_coin/logic.lua` defines its own local `collect`, remove it.
The engine version is now available as a global.

> ⚠️ RULE: Do NOT change the `next_id()` function — it is a sequential
> counter intentionally different from `generate_id()`. Keep it as-is.

> ⚠️ RULE: The `copy_entity` function is a shallow copy (one level deep).
> Verify that slime_coin's use of `copy_table` was also shallow (it was —
> `for i, v in pairs(list) do result[i] = v end` is shallow). The behavior
> is identical.

---

### Step 5: Update `games/slither_rogue/utils.lua`

Find and remove the local `atan2` wrapper:

```lua
-- REMOVE THIS LINE:
function atan2(y, x) return math.atan(y, x) end
```

The engine's `atan2` (now in `movement.lua`) is available as a global.
All call sites in slither_rogue files (collision.lua, physics.lua, etc.)
remain unchanged.

> ⚠️ RULE: Only remove the definition. Do NOT touch any atan2 call sites
> in any slither_rogue file. Do NOT touch any other function in utils.lua.

---

## §3 Load Order Verification

The engine primitives load before game logic. Verify the runtime loads
primitives in this order (check `engine/loader.py` or `engine/runtime.ts`
if needed):

1. `engine/primitives/action.lua` — includes `collect`
2. `engine/primitives/entity.lua` — includes `copy_entity`, `generate_id`
3. `engine/primitives/movement.lua` — includes `atan2`
4. Other primitives
5. Engine systems
6. Game logic files

If `action.lua` loads before game logic files, `collect` will be available
as a global. If the load order is wrong, the engine will throw a nil error
on `collect`. Verify load order before running tests.

---

## §4 Completion Criteria

- [ ] `pytest -v` → **86 passed, 0 failed** (unchanged)
- [ ] `npx vitest run` → **39 passed, 0 failed** (unchanged)
- [ ] `engine/primitives/action.lua` contains global `collect(t)` function
- [ ] `engine/primitives/movement.lua` contains global `atan2(y, x)` wrapper
- [ ] `horse_racing/logic.lua` has NO local `collect` definition
- [ ] `slime_coin/logic.lua` has NO local `copy_table` definition
- [ ] `slime_coin/logic.lua` has NO `copy_table(` call sites — all replaced with `copy_entity(`
- [ ] `slither_rogue/utils.lua` has NO local `atan2` definition
- [ ] All four games load and run without Lua errors in the browser
- [ ] No YAML files modified
- [ ] No TypeScript files modified
- [ ] No Python files modified

---

## §5 What This Phase Does NOT Do

- No `next_id()` changes — sequential counter is correct for slime_coin
- No `get_state_summary()` standardization — game-specific fields are correct
- No YAML consolidation — game data is correctly game-specific
- No slither_rogue multi-file restructuring — intentional for complexity
- No mutant_battle_ball changes — no duplication found there
- No new engine systems
