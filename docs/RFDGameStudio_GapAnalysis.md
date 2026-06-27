# RFDGameStudio — Horse Racing Prototype Gap Analysis

*June 2026 | Current state: Phase 2c certified*

---

## Critical Architectural Gaps (violations of the three-file contract)

### GAP-001: `create_race` missing from logic.lua

**Severity:** Critical — architectural violation

The SDD requires all game logic to live in logic.lua. `create_race` — which selects
a race class based on current horse stats, generates NPC horses, assigns gates, and
calculates entry fees — does not exist in Lua. It is currently implemented in
TypeScript (App.tsx), violating ADR-001 and ADR-002.

**Impact:** Race class selection rules cannot be ported to PyGame or Rust without
rewriting TypeScript. Claude cannot reason about race generation from the three files.

**Fix:** Add `create_race(player_horses, npc_pool, race_classes, distances, data)` to
logic.lua. Returns a full Race object. TypeScript calls this function and renders the
result. App.tsx should contain zero race creation logic.

---

## Functional Missing Features

### GAP-002: No persistence

**Severity:** High — game is unplayable across sessions

State (horses, funds, history) resets on every page refresh. There is no localStorage
persistence, no backend, and no session save/restore.

**Note:** ADR explicitly excluded localStorage in Phase 2. This was correct for
prototyping. It becomes a Phase 4 deliverable before the second game ships.

**Fix:** Add `localStorage` save/restore for the game state object in App.tsx.
The schema is already defined in data.yaml — serialize the state dict to JSON on
every state change, restore on mount. No Lua changes required.

---

### GAP-003: Race class enforcement not wired

**Severity:** Medium — the class ladder has no teeth

data.yaml defines `stat_min` and `stat_max` per race class. These values are not
enforced. A Maiden horse (stats 10-40) can currently enter a Grand Prix (stats 80-100)
with no restriction.

**Fix:** `create_race` in Lua (GAP-001 fix) should enforce class eligibility by
filtering NPC pool and flagging if the player's horse is ineligible. TypeScript
surfaces the ineligibility as a disabled race entry with a tooltip.

---

### GAP-004: Slot unlocking not implemented

**Severity:** Low — declared in data.yaml, dead code

`stable.unlock_cost_per_slot: 500` and `stable.starting_slots: 3` are in data.yaml
but not implemented. The stable currently shows all horses with no slot limit.

**Fix:** Cap stable display at `starting_slots`. Add "Unlock Slot" button that
deducts `unlock_cost_per_slot` from funds. One line of Lua for validation, one
UI element in StableTab.

---

### GAP-005: Bankruptcy / emergency grant not implemented

**Severity:** Medium — unrecoverable game states exist

If a player loses all funds and has no horses, the game becomes unrecoverable silently.
The extraction matrix noted an emergency grant of $250 when `funds < 50 && playerHorses.length === 0`.

**Fix:** TypeScript check in App.tsx after every state change. If trigger condition
met, inject emergency grant and surface a UI banner. No Lua required.

---

### GAP-006: `calculate_payouts` and `settle_bets` overlap

**Severity:** Low — redundancy risk

Both functions compute prize distribution. `calculate_payouts` returns
`{horse_id: prize}`. `settle_bets` also computes `horse_earnings` internally.
Two paths to the same output.

**Fix:** Deprecate `calculate_payouts`. Have `settle_bets` be the single source of
prize distribution truth. All callers use `settle_bets`.

---

## Fix Priority

| Gap | Severity | Effort | Phase |
|---|---|---|---|
| GAP-001: create_race in Lua | Critical | Medium | Phase 2d |
| GAP-002: Persistence | High | Low | Phase 2d |
| GAP-003: Class enforcement | Medium | Low | Phase 2d (depends on GAP-001) |
| GAP-005: Bankruptcy | Medium | Low | Phase 2d |
| GAP-004: Slot unlocking | Low | Low | Phase 2d |
| GAP-006: Payouts overlap | Low | Trivial | Phase 2d |

---

## What Is NOT Missing

The following are fully implemented and verified:

- `generate_horse` — stat generation, color profile, name generation ✓
- `breed_horses` — stat inheritance, mutation, color inheritance ✓
- `calculate_odds` — distance-weighted, overround applied ✓
- `simulate_race` — full headless physics loop, lupa-safe ✓
- `tick_race` — per-tick physics for animation reference ✓
- `calculate_place_odds` — Win/Place/Show odds ✓
- `calculate_show_odds` ✓
- `update_horse_after_race` — pure, no mutation ✓
- `settle_bets` — Win/Place/Show settlement ✓
- `calculate_horse_price` — career-weighted valuation ✓
- `sell_horse` ✓
- Public studs, starter horses, coat colors, name pools ✓
- Race distance stat weights ✓

---

*Gap analysis complete. All six gaps are fixable in a single Phase 2d directive.*
