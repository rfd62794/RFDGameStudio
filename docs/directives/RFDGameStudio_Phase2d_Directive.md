# RFDGameStudio — Phase 2d Directive: Gap Closure

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 28 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 12 passed, 0 failed, 0 skipped.
> If either count differs, stop and report — do not proceed.

---

## §0 Context

**What exists:**
- Phase 3 certified: Python 28/0/0, TypeScript 12/0/0
- `buildRace()` in `ts/src/App.tsx` contains all race creation logic — random class
  selection, distance selection, NPC generation, venue/type naming, odds wiring.
  This is a critical architectural violation: game rules in a React component.

**What this phase delivers:**
- `create_race` in `logic.lua` — race creation becomes a Lua function
- `can_unlock_slot` in `logic.lua` — slot unlocking validation
- `App.tsx` `buildRace()` replaced with a single Lua call
- Slot unlock UI in `StableTab.tsx`
- Emergency grant check in `App.tsx`
- `calculate_payouts` deprecated in `logic.lua`
- Python floor: 28 → 32
- TypeScript floor: 12 → 15

**What is NOT in scope:**
- No persistence (deferred to Phase 4)
- No new game
- No changes to the Python runtime
- No changes to the MCP server

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/horse_racing/logic.lua` | Modify | Add `create_race`, `can_unlock_slot`; deprecate `calculate_payouts` |
| `games/horse_racing/systems.yaml` | Modify | Add new functions to correct systems |
| `tests/fixtures/horse_racing/logic.lua` | Modify | Sync with game file after Lua changes |
| `tests/test_executor.py` | Modify | Add 4 new behavioral tests |
| `ts/src/App.tsx` | Modify | Replace `buildRace()` with `create_race` Lua call; add emergency grant |
| `ts/src/components/StableTab.tsx` | Modify | Add slot unlock button |
| `ts/src/engine/types.ts` | Modify | Add `max_slots`, `current_slots` to GameState if missing |
| `ts/tests/test_runtime.ts` | Modify | Add 3 new TS tests |

**Read-only — do not touch:**
`studio/`, all existing Python test files except `test_executor.py`,
`ts/tests/test_loader.ts`, `ts/tests/test_executor.ts`.

---

## §2 Implementation

### §2.1 logic.lua — `create_race`

Add after the existing `calculate_odds` function.

```lua
-- Create a complete race from player horse + available data.
-- Selects race class by player horse eligibility, generates NPC field,
-- picks distance and venue name.
--
-- player_horse: Horse table (with speed/stamina/acceleration/temperament)
-- data: full data.yaml parsed table (race_classes, race_distances, race_venues,
--       race_types, coat_colors, silk_colors, name_prefixes, name_suffixes,
--       race.field_size)
--
-- Returns: race_obj, nil         on success
-- Returns: nil, "error string"   if player horse is ineligible for any class
function create_race(player_horse, data)
  local race_classes  = data.race_classes
  local distances     = data.race_distances
  local venues        = data.race_venues
  local types         = data.race_types
  local coat_colors   = data.coat_colors
  local silk_colors   = data.silk_colors
  local prefixes      = data.name_prefixes
  local suffixes      = data.name_suffixes
  local field_size    = (data.race and data.race.field_size) or 6

  -- Check player horse eligibility
  local avg_stat = (player_horse.speed + player_horse.stamina +
                    player_horse.acceleration + player_horse.temperament) / 4

  -- Find eligible classes (player avg stat within class stat_min..stat_max)
  local eligible = {}
  for _, rc in ipairs(race_classes) do
    local min_s = rc.stat_min or rc.min or 0
    local max_s = rc.stat_max or rc.max or 100
    if avg_stat >= min_s and avg_stat <= max_s then
      table.insert(eligible, rc)
    end
  end

  if #eligible == 0 then
    return nil, "Horse avg stat " .. string.format("%.1f", avg_stat) ..
                " is not eligible for any race class"
  end

  -- Pick a random eligible class
  local race_class = eligible[math.random(#eligible)]

  -- Pick a random distance
  local dist_entry = distances[math.random(#distances)]
  local distance   = dist_entry.meters

  -- Build race name
  local venue     = venues[math.random(#venues)]
  local race_type = types[math.random(#types)]
  local race_name = venue .. " " .. race_type

  -- Build participants: player first, then NPC fill
  local participants = {}
  table.insert(participants, {
    horse            = player_horse,
    gate             = 1,
    odds             = 0,
    progress         = 0,
    current_distance = 0,
    current_speed    = 0,
    energy           = 100,
    is_finished      = false,
  })

  local npc_min = race_class.stat_min or race_class.min or 10
  local npc_max = race_class.stat_max or race_class.max or 100
  local npc_opts = { min_stat = npc_min, max_stat = npc_max, generation = 1,
                     player_owned = false }

  while #participants < field_size do
    local npc = generate_horse(npc_opts, coat_colors, silk_colors, prefixes, suffixes)
    table.insert(participants, {
      horse            = npc,
      gate             = #participants + 1,
      odds             = 0,
      progress         = 0,
      current_distance = 0,
      current_speed    = 0,
      energy           = 100,
      is_finished      = false,
    })
  end

  -- Calculate odds for the full field
  local horse_stats = {}
  for _, p in ipairs(participants) do
    table.insert(horse_stats, {
      speed        = p.horse.speed,
      stamina      = p.horse.stamina,
      acceleration = p.horse.acceleration,
      temperament  = p.horse.temperament,
    })
  end
  local odds_arr = calculate_odds(horse_stats, distance)
  for i, p in ipairs(participants) do
    p.odds = odds_arr[i] or 4.0
  end

  -- Prize split
  local prize_split = race_class.prize_split or {0.60, 0.25, 0.15}

  return {
    id          = "race_" .. tostring(math.random(100000, 999999)),
    name        = race_name,
    description = (race_class.name or "Race") .. " · " .. tostring(distance) ..
                  "m · Prize $" .. tostring(race_class.prize_pool or 0),
    distance    = distance,
    race_class  = race_class.name or "Unknown",
    prize_pool  = race_class.prize_pool or 0,
    prize_split = prize_split,
    entry_fee   = race_class.fee or 0,
    participants = participants,
    status      = "scheduled",
  }, nil
end
```

> ⚠️ RULE: `create_race` is the single source of truth for race creation.
> No race creation logic may exist in TypeScript after this phase.
> `buildRace()` in App.tsx must be deleted entirely.

---

### §2.2 logic.lua — `can_unlock_slot`

Add after `create_race`.

```lua
-- Validate whether the player can unlock a stable slot.
-- Returns true if unlockable, false + reason if not.
function can_unlock_slot(current_slots, max_slots, funds, unlock_cost)
  if current_slots >= max_slots then
    return false, "Stable is already at maximum capacity"
  end
  if funds < unlock_cost then
    return false, "Insufficient funds (need $" .. tostring(unlock_cost) .. ")"
  end
  return true, nil
end
```

---

### §2.3 logic.lua — Deprecate `calculate_payouts`

Add a deprecation comment above the existing function. Do not remove it yet.

```lua
-- DEPRECATED: Use settle_bets() instead.
-- settle_bets() returns horse_earnings alongside bet_payout in one call.
-- This function will be removed in Phase 4.
function calculate_payouts(results, prize_pool, prize_split)
  ...existing body unchanged...
end
```

---

### §2.4 systems.yaml — Update

Add `create_race` and `can_unlock_slot` to the correct systems:

```yaml
# Under simulation system functions:
- create_race

# Under market system functions:
- can_unlock_slot
```

---

### §2.5 App.tsx — Replace `buildRace()`

Delete the entire `buildRace()` function (lines ~58-105 approximately).

Replace all call sites with a single Lua call:

```typescript
function buildRace(session: GameSession, playerHorses: Horse[]): CurrentRace | null {
  const data = session.files.data as Record<string, unknown>;
  const playerHorse = playerHorses[0];
  if (!playerHorse) return null;

  const result = call(session, 'create_race', playerHorse, data) as unknown;

  // create_race returns two values: race_obj, error
  // lupa returns them as a tuple array
  const resultArr = Array.isArray(result) ? result : [result, null];
  const raceObj = resultArr[0] as Record<string, unknown> | null;
  const errMsg = resultArr[1] as string | null;

  if (!raceObj || errMsg) {
    console.warn('create_race error:', errMsg);
    return null;
  }

  // Convert participants from Lua table to TypeScript
  const rawParticipants = Object.values(
    raceObj['participants'] as Record<string, unknown>
  ) as Array<Record<string, unknown>>;

  const participants = rawParticipants.map((p, i) => ({
    horse: luaHorseToTs(p['horse'] as Record<string, unknown>),
    gate: (p['gate'] as number) ?? i + 1,
    odds: (p['odds'] as number) ?? 4.0,
    progress: 0,
    current_distance: 0,
    current_speed: 0,
    energy: 100,
    is_finished: false,
  }));

  return {
    id: raceObj['id'] as string,
    name: raceObj['name'] as string,
    description: raceObj['description'] as string,
    distance: raceObj['distance'] as number,
    race_class: raceObj['race_class'] as string,
    prize_pool: raceObj['prize_pool'] as number,
    prize_split: Object.values(raceObj['prize_split'] as Record<string, number>),
    participants,
    status: 'scheduled',
  };
}
```

> ⚠️ RULE: This function is now a thin converter. Zero game logic.
> Class selection, NPC generation, distance pick, name generation — all in Lua.

---

### §2.6 App.tsx — Emergency Grant

After every state update that changes `funds` or `horses`, add:

```typescript
// Emergency grant: inject $250 if broke and horseless
if (newState.funds < 50 && newState.horses.filter(h => h.player_owned).length === 0) {
  newState = {
    ...newState,
    funds: newState.funds + 250,
    emergency_grant_shown: true,
  };
}
```

Add `emergency_grant_shown: boolean` to `GameState` type.
Add a dismissible banner in the App render when `emergency_grant_shown` is true:
`"You're broke and horseless. Here's $250. Don't waste it."`
Dismiss clears `emergency_grant_shown`.

---

### §2.7 StableTab.tsx — Slot Unlock Button

Read `stable.starting_slots` and `stable.unlock_cost_per_slot` from session data.
Track `unlockedSlots` state in App.tsx (starts at `starting_slots`, max `max_slots`).

Add below the horse grid in StableTab:

```tsx
{unlockedSlots < maxSlots && (
  <div className="slot-unlock-panel">
    <span>Stable slots: {horses.length} / {unlockedSlots}</span>
    <button
      disabled={funds < unlockCost || unlockedSlots >= maxSlots}
      onClick={onUnlockSlot}
    >
      Unlock Slot (${unlockCost})
    </button>
  </div>
)}
```

`onUnlockSlot` in App.tsx:
1. Calls `can_unlock_slot(unlockedSlots, maxSlots, funds, unlockCost)` via Lua
2. On `true`: deducts cost, increments `unlockedSlots`
3. On `false`: shows error message

---

## §3 Test Anchors

**Python floor (must stay green first):**
`uv run pytest -v` → 28 passed, 0 failed, 0 skipped

**New Python tests — add to `tests/test_executor.py`:**
Target: **32 passed, 0 failed, 0 skipped**

| # | Test | Behavior |
|---|---|---|
| 29 | `test_create_race_returns_field` | `create_race(starter_horse, data)` returns race with 6 participants |
| 30 | `test_create_race_npc_count` | participants length == `data.race.field_size` (6) |
| 31 | `test_create_race_ineligible_returns_error` | Horse with avg stat 5 returns nil + error string |
| 32 | `test_can_unlock_slot_insufficient_funds` | `can_unlock_slot(3, 12, 10, 500)` returns false |

For tests 29-31: build a minimal `player_horse` dict with stats in Maiden range (10-40).
Build a minimal `data` dict with at least `race_classes`, `race_distances`, `race_venues`,
`race_types`, `coat_colors`, `silk_colors`, `name_prefixes`, `name_suffixes`, `race`.
Use the fixture `data.yaml` loaded via the existing fixture loader.

> ⚠️ RULE: Tests use fixture files, never `games/horse_racing/` directly.
> Sync `tests/fixtures/horse_racing/logic.lua` from the game file before running tests.

**TypeScript floor (must stay green first):**
`cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped

**New TypeScript tests — add to `ts/tests/test_runtime.ts`:**
Target: **15 passed, 0 failed, 0 skipped**

| # | Test | Behavior |
|---|---|---|
| 13 | `test_create_race_via_runtime` | Mocked `call` returns a race object when `fn_name === 'create_race'` |
| 14 | `test_can_unlock_slot_via_runtime` | Mocked `call` returns `[false, "Insufficient funds"]` for low funds |
| 15 | `test_emergency_grant_state` | `emergency_grant_shown` flag exists in GameState type |

---

## §4 Completion Criteria

- [ ] `uv run pytest -v` → 32 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vitest run` → 15 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vite build` → exits 0, no TypeScript errors
- [ ] `create_race` exists in `logic.lua` and `systems.yaml`
- [ ] `can_unlock_slot` exists in `logic.lua` and `systems.yaml`
- [ ] `buildRace()` function deleted from `App.tsx` — grep confirms it does not exist
- [ ] New `buildRace()` wrapper calls `create_race` via Lua only
- [ ] Emergency grant banner visible in browser when triggered
- [ ] Slot unlock button visible in Stable tab
- [ ] `calculate_payouts` has deprecation comment in `logic.lua`
- [ ] `tests/fixtures/horse_racing/logic.lua` synced with game file
- [ ] `docs/state/current.md` updated to Phase 2d certified

**Proof required:**
- Raw `uv run pytest -v` output (32/0/0)
- Raw `npx vitest run` output (15/0/0)
- `grep -n "buildRace" ts/src/App.tsx` — must return zero matches on the old implementation
- Browser screenshot: new race loads from Lua (check class name in race description matches race class list)

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Python floor before | 28 / 0 / 0 |
| Python floor after | 32 / 0 / 0 |
| TypeScript floor before | 12 / 0 / 0 |
| TypeScript floor after | 15 / 0 / 0 |
| New Lua functions | `create_race`, `can_unlock_slot` |
| Deprecated Lua function | `calculate_payouts` (comment only, not removed) |
| Deleted TypeScript | `buildRace()` implementation in App.tsx |
| Emergency grant trigger | `funds < 50 && playerOwnedHorses.length === 0` |
| Emergency grant amount | $250 |
| Slot unlock cost | `data.stable.unlock_cost_per_slot` (500) |
| Max stable slots | `data.stable.max_slots` (12) |
| Starting slots | `data.stable.starting_slots` (3) |
| Phase 4 target | Persistence + second game (Snake) |

---

*RFDGameStudio Phase 2d | June 2026 | RFD IT Services Ltd.*
*`buildRace()` in TypeScript is the last architectural violation. This phase closes it.*
