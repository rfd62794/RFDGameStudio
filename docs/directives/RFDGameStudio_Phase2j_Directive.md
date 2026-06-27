# RFDGameStudio — Phase 2j Directive: Engine Promotion + Combat System

*June 2026 | Read fully before executing anything.*
*Pure architecture. Zero behavior change. Floors must hold throughout.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 42 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 17 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

Two reusability problems exist after Phase 2i:

**Problem 1 — Duplication:**
`clamp` is defined in `engine/primitives/action.lua` AND in
`games/slither_rogue/utils.lua`. The second definition silently overrides the
first in the Lua VM. This works by accident.

`dist2` and `normalize_angle` in `slither_rogue/utils.lua` are universal math
utilities. Any physics game needs distance calculation and angle normalization.
They belong in the engine, not in a game file.

**Problem 2 — Missing combat system:**
BattleBots will need `resolve_hit`, `calculate_damage`, `apply_damage`.
`engine/systems/market.lua` already exists — BattleBots can reuse `settle_bets`
for bet settlement. The combat system is the only missing engine piece before
BattleBots can be ported from AI Studio.

**What this phase delivers:**
- `dist2` and `normalize_angle` promoted from `utils.lua` to
  `engine/primitives/movement.lua`
- `clamp` removed from `utils.lua` (already in `engine/primitives/action.lua`)
- `slither_rogue/systems.yaml` `engine_systems` updated to reflect actual deps
- `engine/systems/combat.lua` — new stub, BattleBots-ready
- All fixtures synced
- Floors: 42/0/0 and 17/0/0 (unchanged — pure architecture)

---

## §1 Scope

| File | Action |
|---|---|
| `engine/primitives/movement.lua` | Add `dist2`, `normalize_angle` |
| `games/slither_rogue/utils.lua` | Remove `clamp`, `dist2`, `normalize_angle` |
| `games/slither_rogue/systems.yaml` | Update `engine_systems` |
| `engine/systems/combat.lua` | New stub |
| `tests/fixtures/slither_rogue/utils.lua` | Sync |
| `tests/fixtures/slither_rogue/systems.yaml` | Sync |
| `tests/fixtures/engine/systems/combat.lua` | New (if engine fixtures exist) |

**Read-only — do not touch:**
`games/horse_racing/`, `ts/`, all test files except fixture sync,
`studio/`, `studio_mcp/`.

---

## §2 engine/primitives/movement.lua — Add Math Utilities

Add these two functions to the existing file, after `in_bounds`:

```lua
-- Calculate squared distance between two points.
-- Returns: number (avoids sqrt for cheap proximity checks)
function dist2(x1, y1, x2, y2)
  local dx, dy = x1 - x2, y1 - y2
  return dx * dx + dy * dy
end

-- Normalize an angle in radians to the range [-π, π].
-- Returns: number
function normalize_angle(a)
  while a < -math.pi do a = a + math.pi * 2 end
  while a >  math.pi do a = a - math.pi * 2 end
  return a
end
```

> ⚠️ NOTE: `engine/primitives/movement.lua` already has `advance_position`,
> `move_grid`, and `in_bounds`. These two additions extend the existing file.
> The file header comment should be updated to include `dist2` and
> `normalize_angle` in the function list.

---

## §3 games/slither_rogue/utils.lua — Remove Duplicates

Remove these three functions from `utils.lua`:
- `clamp(v, lo, hi)` — already in `engine/primitives/action.lua`
- `dist2(x1, y1, x2, y2)` — now in `engine/primitives/movement.lua`
- `normalize_angle(a)` — now in `engine/primitives/movement.lua`

After removal, `utils.lua` should contain only:
- `build_segments(x, y, angle, length, radius)`
- `spawn_fruit_from_config(cfg)`

Update the header comment:
```lua
-- Slither Rogue — Utilities
-- Game-specific spawn and segment construction helpers.
-- Engine math (clamp, dist2, normalize_angle) available from engine primitives.
-- Loaded first in lua_files — other slither_rogue files may call these.
```

> ⚠️ RULE: Do NOT touch physics.lua, collision.lua, state.lua, render.lua,
> or logic.lua. They already call `clamp`, `dist2`, and `normalize_angle`
> by name — those names now resolve from the engine primitives instead of
> utils.lua. No call sites need updating.

> ⚠️ VERIFICATION: After removing the three functions from utils.lua,
> run `uv run pytest -v` immediately. If any test fails, the engine primitives
> are not loading before the game files. Stop and diagnose before continuing.

---

## §4 games/slither_rogue/systems.yaml — Update engine_systems

Change:
```yaml
engine_systems: []   # No shared engine systems — physics is TypeScript for this game
```

To:
```yaml
engine_systems:      # Engine systems used by slither_rogue
  - movement         # dist2, normalize_angle, advance_position (via primitives)
```

> ⚠️ NOTE: `engine_systems` in `systems.yaml` controls which files from
> `engine/systems/` are loaded (genetics, odds, market, combat). It does NOT
> control which `engine/primitives/` files are loaded — all seven primitives
> are always loaded for every game.
>
> Setting `engine_systems: [movement]` is a declaration of intent (per ADR-007)
> rather than a functional change, since `movement.lua` lives in primitives, not
> systems. The loader already loads all primitives unconditionally.
>
> This is correct behavior — update the comment accordingly:

```yaml
engine_systems: []   # All engine/primitives/ loaded unconditionally.
                     # engine/systems/ files declared here: (none for slither_rogue)
                     # slither_rogue uses: clamp (action), dist2/normalize_angle (movement)
```

---

## §5 engine/systems/combat.lua — New Stub

Create `engine/systems/combat.lua`. This is a stub — function signatures and
contracts only. BattleBots will provide implementations when it ports.

```lua
-- engine/systems/combat.lua
-- Combat resolution system for part-based arena fighters.
-- Used by: BattleBots (Phase 3+)
-- Not used by: horse_racing, slither_rogue
--
-- Function contracts follow ADR-007 naming conventions:
--   resolve_* → contested outcome determination
--   apply_*   → post-resolution state change
--   detect_*  → collision / contact detection

-- ============================================================
-- DAMAGE CALCULATION
-- ============================================================

-- Calculate raw damage from an attack.
-- attacker: { attack_power, weapon_type, reach }
-- defender: { armor, defense_rating }
-- Returns: { raw_damage, blocked, penetrated }
function calculate_damage(attacker, defender)
  -- Stub — implement when BattleBots is ported
  error("calculate_damage: not implemented for this game")
end

-- Apply damage to a bot part.
-- part: { id, name, health, max_health, armor, is_destroyed }
-- damage: number
-- Returns: updated_part (pure — does not mutate input)
function apply_damage(part, damage)
  -- Stub — implement when BattleBots is ported
  error("apply_damage: not implemented for this game")
end

-- ============================================================
-- HIT RESOLUTION
-- ============================================================

-- Determine if an attack connects, given speed and accuracy.
-- attacker: { accuracy, speed }
-- defender: { agility, speed }
-- seed: RNG seed (from runtime)
-- Returns: { hit=bool, glancing=bool }
function resolve_hit(attacker, defender, seed)
  -- Stub — implement when BattleBots is ported
  error("resolve_hit: not implemented for this game")
end

-- ============================================================
-- FIGHT SIMULATION
-- ============================================================

-- Simulate a complete fight between two bots.
-- bot_a, bot_b: full bot tables with parts and stats
-- config: fight config (arena type, time limit)
-- Returns: { winner_id, rounds, damage_log[], bot_a_final, bot_b_final }
-- This is the BattleBots equivalent of simulate_race.
-- TypeScript renders the damage_log as a cinematic sequence.
function simulate_fight(bot_a, bot_b, config)
  -- Stub — implement when BattleBots is ported
  error("simulate_fight: not implemented for this game")
end

-- ============================================================
-- PART DURABILITY
-- ============================================================

-- Check if a part is destroyed (health at or below zero).
-- part: { health }
-- Returns: bool
function is_part_destroyed(part)
  return (part.health or 0) <= 0
end

-- Calculate overall bot effectiveness from part states.
-- Parts that are destroyed reduce effectiveness proportionally.
-- bot: { parts: [] }
-- Returns: float 0.0 to 1.0
function calculate_bot_effectiveness(bot)
  if not bot.parts or #bot.parts == 0 then return 0.0 end
  local total, alive = 0, 0
  for _, part in ipairs(bot.parts) do
    total = total + 1
    if not is_part_destroyed(part) then alive = alive + 1 end
  end
  return alive / total
end
```

> ⚠️ NOTE: `is_part_destroyed` and `calculate_bot_effectiveness` are implemented
> because they are pure, trivial, and stateless. The fight-resolution stubs
> raise errors intentionally — calling them on any game that isn't BattleBots
> would be a bug. This makes the error loud rather than silent.

---

## §6 Fixture Sync

```powershell
# Sync slither_rogue utils.lua and systems.yaml
Copy-Item "games\slither_rogue\utils.lua"    "tests\fixtures\slither_rogue\" -Force
Copy-Item "games\slither_rogue\systems.yaml" "tests\fixtures\slither_rogue\" -Force

# Sync engine movement.lua (if engine fixtures exist)
Copy-Item "engine\primitives\movement.lua" "tests\fixtures\engine\primitives\" -Force

# Sync new combat.lua (create engine/systems/ fixture dir if needed)
New-Item -ItemType Directory -Path "tests\fixtures\engine\systems" -Force | Out-Null
Copy-Item "engine\systems\combat.lua" "tests\fixtures\engine\systems\" -Force
```

> ⚠️ NOTE: Check whether `tests/fixtures/engine/` exists before running the
> engine fixture copies. If it doesn't exist, create it:
> `New-Item -ItemType Directory -Path "tests\fixtures\engine\primitives" -Force | Out-Null`

---

## §7 Verification Steps

**After §2 (movement.lua additions):**
```bash
uv run pytest -v    # 42/0/0
```

**After §3 (utils.lua cleanup):**
```bash
uv run pytest -v    # 42/0/0 — critical check, stop here if anything fails
```

**After §5 (combat.lua stub):**
```bash
uv run pytest -v    # 42/0/0
```

**Final:**
```bash
uv run pytest -v         # 42/0/0
cd ts && npx vitest run  # 17/0/0
cd ts && npx vite build  # exits 0
```

---

## §8 Completion Criteria

- [ ] `uv run pytest -v` → **42 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vitest run` → **17 passed, 0 failed, 0 skipped** (unchanged)
- [ ] `cd ts && npx vite build` → exits 0
- [ ] `engine/primitives/movement.lua` contains `dist2` and `normalize_angle`
- [ ] `games/slither_rogue/utils.lua` contains only `build_segments` and `spawn_fruit_from_config`
- [ ] `engine/systems/combat.lua` exists with 5 function stubs
- [ ] `is_part_destroyed` and `calculate_bot_effectiveness` work correctly
- [ ] `horse_racing` plays correctly (`?game=horse_racing`)
- [ ] `slither_rogue` plays correctly (`?game=slither_rogue`)
- [ ] `docs/state/current.md` updated to Phase 2j certified

**Proof required:**
- Raw `uv run pytest -v` output (42/0/0)
- Raw `npx vitest run` output (17/0/0)
- `cat games/slither_rogue/utils.lua` — must show only 2 functions
- `ls engine/systems/` — must include `combat.lua`

---

## §9 What This Unlocks

After Phase 2j:

**slither_rogue** — no duplication, uses engine math, faster to onboard a second developer

**BattleBots** — `engine/systems/combat.lua` stubs are ready to implement. The pattern is: port the game from AI Studio, fill in the three stubs (`calculate_damage`, `apply_damage`, `resolve_hit`), implement `simulate_fight` as the BattleBots equivalent of `simulate_race`. MarketSystem (`settle_bets`) already handles bet settlement — no new betting logic needed.

**Any future physics game** — `dist2` and `normalize_angle` are now engine-level. Any game that needs proximity detection or angle math calls engine functions, not game files.

---

## §10 Quick Reference

| Item | Value |
|---|---|
| Python floor | 42 / 0 / 0 (unchanged) |
| TypeScript floor | 17 / 0 / 0 (unchanged) |
| Removed from utils.lua | `clamp`, `dist2`, `normalize_angle` |
| Added to movement.lua | `dist2`, `normalize_angle` |
| New engine system | `engine/systems/combat.lua` |
| Implemented stubs | `is_part_destroyed`, `calculate_bot_effectiveness` |
| Error-raising stubs | `calculate_damage`, `apply_damage`, `resolve_hit`, `simulate_fight` |
| No behavior change | Zero — slither_rogue and horse_racing identical after this phase |

---

*RFDGameStudio Phase 2j | June 2026 | RFD IT Services Ltd.*
*Shared math in the engine. Combat system ready for BattleBots.*
*The next game inherits everything this phase establishes.*
