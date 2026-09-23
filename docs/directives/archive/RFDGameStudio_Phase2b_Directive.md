# RFDGameStudio — Phase 2b Directive: Full Game Port

*June 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 15 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 12 passed, 0 failed, 0 skipped.
> If either count differs, stop and report — do not proceed.

---

## §0 Context

**What Phase 2 delivered:**
- Python runtime: loader, validator, executor, 15/0/0 floor
- TypeScript runtime: fengari bridge, loader, executor, runtime, 12/0/0 floor
- Vite build exits 0
- ui.yaml line 168 bug fixed (canonical + fixture)

**What is still missing (gap analysis from full example read):**

`data.yaml` gaps:
- `public_studs` array — 4 pre-defined stud horses
- `starter_horses` array — 2 foundation horses (Vanguard Spirit, Starlight Dream)
- `stable.starter_horse_cost`, `stable.max_slots`, `stable.breed_cooldown_ms`, `stable.race_cooldown_ms`
- `betting.place_odds_multiplier`, `betting.place_odds_min`
- `fee` field on each `race_classes` entry
- `starting_funds` is `3000` in current yaml — **change to `1000`** (example value, tighter gameplay)

`logic.lua` gaps (5 missing functions):
- `calculate_place_odds(win_odds)` — Place bet odds formula
- `update_horse_after_race(horse, rank, prize_pool)` — returns updated horse stats
- `settle_bets(bets, standings, prize_pool)` — returns `{bet_payout, horse_earnings}`
- `simulate_race` was added but may not exist — verify before writing new code

`ts/src/engine/types.ts` gaps (3 missing fields):
- `RaceParticipant.final_rank?: number`
- `Bet.type: 'Win' | 'Place'`
- `Bet.payout_odds: number`

Missing component: `Breeder` tab — entirely absent from current build.

**What this phase delivers:**
- All `data.yaml` gaps closed
- All `logic.lua` gaps closed
- All `types.ts` gaps closed
- 6 new Python behavioral equivalence tests (one per new Lua function)
- `BettingTab.tsx` wired to real Lua: `simulate_race` called at race start, results
  predetermined, animation is cinematic only
- `Breeder.tsx` component — sire/dam selection, cost panel, breed button, foal reveal
- `StableTab.tsx` wired to real Lua: sale value from `calculate_horse_price`, horse
  cards rendered from Lua-generated horse data
- Game is playable end-to-end in browser

**What is NOT in scope:**
- No localStorage persistence (in-memory state only for this phase)
- No race animation refactor (cinematic approach is the target but animation timing
  can remain approximate — results must come from Lua)
- No SVGRacer animation changes
- No CSS polish beyond functional layout
- No History tab persistence (renders `raceHistory` state only)
- No Python runtime changes beyond new test anchors

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/horse_racing/data.yaml` | Modify | Close all data gaps per §2.1 |
| `games/horse_racing/logic.lua` | Modify | Add 3–4 missing functions per §2.2 |
| `tests/fixtures/horse_racing/data.yaml` | Modify | Apply same data.yaml changes to fixture copy |
| `tests/test_executor.py` | Modify | Add 6 new behavioral equivalence tests |
| `ts/src/engine/types.ts` | Modify | Add 3 missing fields |
| `ts/src/components/BettingTab.tsx` | Modify | Wire to Lua: call `simulate_race`, receive results |
| `ts/src/components/StableTab.tsx` | Modify | Wire to Lua: call `calculate_horse_price` |
| `ts/src/components/Breeder.tsx` | New | Full breeding UI |
| `ts/src/App.tsx` | Modify | Add Breeder tab, wire race finish settlement |

**Read-only — do not touch:**
`studio/loader.py`, `studio/validator.py`, `studio/executor.py`, `studio/runtime.py`,
`ts/src/engine/loader.ts`, `ts/src/engine/executor.ts`, `ts/src/engine/runtime.ts`,
`tests/test_loader.py`, `tests/test_runtime.py`,
`ts/tests/test_loader.ts`, `ts/tests/test_executor.ts`, `ts/tests/test_runtime.ts`

If a bug is found in any read-only file, report it. Do not fix it.

---

## §2 Implementation

### §2.1 games/horse_racing/data.yaml — Gap Closure

Add or update the following keys. Do not remove any existing keys.

**Constants to add/update:**

```yaml
game:
  id: horse_racing
  name: Derby Sim
  version: "1.2"
  studio: RFDGameStudio
  starting_funds: 1000          # CHANGE from 3000 to 1000

stable:
  max_slots: 12
  starter_horse_cost: 400
  race_cooldown_ms: 90000       # 1.5 minutes
  breed_cooldown_ms: 180000     # 3 minutes

betting:
  place_odds_multiplier: 0.38
  place_odds_min: 1.15

race:
  overround: 1.12
  field_size: 6
  npc_pool_size: 20
  prize_splits:
    first: 0.60
    second: 0.25
    third: 0.15
```

**Add `fee` field to each race_classes entry:**

```yaml
race_classes:
  - name: Maiden
    min: 10
    max: 40
    fee: 0
    prize: 300
  - name: Class III
    min: 35
    max: 55
    fee: 30
    prize: 600
  - name: Class II
    min: 50
    max: 70
    fee: 75
    prize: 1200
  - name: Class I
    min: 65
    max: 85
    fee: 150
    prize: 2500
  - name: Grand Prix
    min: 80
    max: 100
    fee: 300
    prize: 6000
```

**Add `starter_horses` array (from App.tsx initialStarterHorses):**

```yaml
starter_horses:
  - id: horse_starter_sire
    name: Vanguard Spirit
    gender: Stallion
    generation: 1
    speed: 48
    stamina: 52
    acceleration: 45
    temperament: 70
    color_body: "#A15C21"
    color_mane: "#1C1917"
    color_socks: "#A15C21"
    color_silk: "#EF4444"
    runs: 0
    wins: 0
    places: 0
    thirds: 0
    earnings: 0
    cooldown_until: 0
    player_owned: true
    price: 400

  - id: horse_starter_dam
    name: Starlight Dream
    gender: Mare
    generation: 1
    speed: 44
    stamina: 56
    acceleration: 50
    temperament: 78
    color_body: "#FAFAF9"
    color_mane: "#FAFAF9"
    color_socks: "#FAFAF9"
    color_silk: "#3B82F6"
    runs: 0
    wins: 0
    places: 0
    thirds: 0
    earnings: 0
    cooldown_until: 0
    player_owned: true
    price: 400
```

**Add `public_studs` array (from Breeder.tsx PUBLIC_STUDS):**

```yaml
public_studs:
  - id: stud_gold_sovereign
    name: Gold Sovereign
    gender: Stallion
    generation: 1
    speed: 78
    stamina: 66
    acceleration: 74
    temperament: 80
    color_body: "#EAB308"
    color_mane: "#FEF08A"
    color_socks: "#FEF08A"
    color_silk: "#EF4444"
    runs: 24
    wins: 12
    places: 6
    thirds: 3
    earnings: 15400
    cooldown_until: 0
    player_owned: false
    price: 550

  - id: stud_emerald_fury
    name: Emerald Fury
    gender: Stallion
    generation: 2
    speed: 86
    stamina: 84
    acceleration: 80
    temperament: 62
    color_body: "#059669"
    color_mane: "#34D399"
    color_socks: "#059669"
    color_silk: "#8B5CF6"
    runs: 40
    wins: 22
    places: 8
    thirds: 4
    earnings: 32000
    cooldown_until: 0
    player_owned: false
    price: 1100

  - id: stud_steel_breeze
    name: Steel Breeze
    gender: Stallion
    generation: 1
    speed: 52
    stamina: 60
    acceleration: 55
    temperament: 88
    color_body: "#D6D3D1"
    color_mane: "#FAFAF9"
    color_socks: "#A8A29E"
    color_silk: "#3B82F6"
    runs: 10
    wins: 3
    places: 2
    thirds: 1
    earnings: 1800
    cooldown_until: 0
    player_owned: false
    price: 180

  - id: mate_ruby_dream
    name: Ruby Dream
    gender: Mare
    generation: 2
    speed: 82
    stamina: 86
    acceleration: 82
    temperament: 72
    color_body: "#DC2626"
    color_mane: "#F87171"
    color_socks: "#DC2626"
    color_silk: "#10B981"
    runs: 35
    wins: 16
    places: 9
    thirds: 4
    earnings: 24500
    cooldown_until: 0
    player_owned: false
    price: 1050

  - id: mate_sassy_spark
    name: Sassy Spark
    gender: Mare
    generation: 1
    speed: 46
    stamina: 42
    acceleration: 50
    temperament: 90
    color_body: "#91532B"
    color_mane: "#1C1917"
    color_socks: "#1C1917"
    color_silk: "#EC4899"
    runs: 6
    wins: 1
    places: 1
    thirds: 0
    earnings: 450
    cooldown_until: 0
    player_owned: false
    price: 100
```

> ⚠️ RULE: After editing data.yaml, run `uv run pytest -v` — must still report 15/0/0.
> If any existing test fails due to the data.yaml changes, stop and report.
> The validator tests check only `game.id/name/version/studio` — those must not change.

Apply the same changes to `tests/fixtures/horse_racing/data.yaml`.

---

### §2.2 games/horse_racing/logic.lua — Missing Functions

First verify whether `simulate_race` exists. If it does not, add it.

**Function signatures required (verify or add each):**

```lua
-- Runs full headless physics simulation.
-- Returns array of {horse_id, final_rank, finish_time, prize_earnings}
-- sorted by final_rank ascending.
-- ALL race outcome logic lives here. TypeScript never determines winner.
function simulate_race(participants, distance, prize_pool, prize_splits)
```

```lua
-- Calculates place bet odds from win odds.
-- place_odds = max(min_place_odds, win_odds * place_odds_multiplier)
-- Reads multiplier and min from config table passed in.
function calculate_place_odds(win_odds, config)
```

```lua
-- Updates a single horse's career stats after a race.
-- Returns a new horse table with updated runs/wins/places/thirds/earnings.
-- Does not mutate the input horse.
function update_horse_after_race(horse, rank, prize_earnings)
```

```lua
-- Settles all bets for a completed race.
-- bets: array of {horse_id, amount, type, payout_odds}
-- standings: array of {horse_id, final_rank} sorted by rank ascending
-- Returns {bet_payout: int, horse_earnings: table of {horse_id: earnings}}
function settle_bets(bets, standings, prize_pool, prize_splits)
```

> ⚠️ RULE: All four functions must be pure. No I/O, no side effects, no global state.
> Each function takes all its inputs as arguments and returns all its outputs as
> return values. TypeScript applies the returned values to React state.

> ⚠️ RULE: `simulate_race` determines the race winner. TypeScript may run a visual
> animation using the horse stats, but the RESULT (final_rank, finish_time) comes
> exclusively from this function. TypeScript never computes a winner independently.

> ⚠️ RULE: `update_horse_after_race` and `settle_bets` return new values.
> They do NOT modify the input tables.

---

### §2.3 ts/src/engine/types.ts — Gap Closure

Add three missing fields. Do not modify any existing fields.

```typescript
// Add to RaceParticipant:
final_rank?: number;    // set by Lua simulate_race, undefined until race completes

// Add to Bet:
type: 'Win' | 'Place';
payout_odds: number;
```

> ⚠️ RULE: Field names are snake_case. The boundary between snake_case (runtime)
> and camelCase (SVGRacer props) is at the SVGRacer component only.
> All other TypeScript uses snake_case field names from the Lua runtime.

---

### §2.4 BettingTab.tsx — Wire to Lua

Current BettingTab calls fake race logic or no logic. Replace with Lua-driven flow.

**Race flow:**
1. Player places bets (existing UI, add `type: 'Win' | 'Place'` selection)
2. Player clicks "CONFIRM & GO TO TRACK"
3. **Before any animation:** call `simulate_race(participants, distance, prize_pool, prize_splits)` via the runtime
4. Store results in component state: `raceResults: {horse_id, final_rank, finish_time, prize_earnings}[]`
5. Start visual animation — horses move based on their stats (approximate, for display only)
6. When animation completes (or skip is clicked): reveal `raceResults` — ranks and times come from Lua, not from the animation
7. Call `settle_bets(bets, raceResults, prize_pool, prize_splits)` via runtime
8. Pass payout and horse earnings up to App.tsx via `onRaceFinish` callback

> ⚠️ RULE: The animation is a cinematic. It does not determine the outcome.
> `raceResults` from Lua is the authoritative source of truth. If the animation
> shows horse A winning but Lua said horse B won — horse B won.
> Resolve the display by snapping horses to their Lua-determined final positions
> when the animation ends rather than animating to incorrect positions.

**Bet placement UI additions:**
- Add Win/Place toggle per horse (matching BettingOffice.tsx from example)
- Place odds display: call `calculate_place_odds(win_odds, config)` via Lua when 'Place' is selected
- Bet validation: amount must be > 0 and ≤ current funds

---

### §2.5 Breeder.tsx — New Component

Full port of `examples/horse-racing-&-breeding/src/components/Breeder.tsx`.

**Data sources:**
- Available sires: `gameState.horses.filter(h => h.gender === 'Stallion' && h.player_owned)`
  plus `session.files.data.public_studs.filter(h => h.gender === 'Stallion')`
- Available dams: same pattern for Mare
- Cooldown check: `h.cooldown_until < Date.now()` — resting horses are disabled

**Breed action:**
1. Validate: sire selected, dam selected, funds ≥ total cost, stable not full
2. Call `breed_horse(sire, dam, coat_colors, name_suffixes)` via Lua runtime
3. Display foal reveal overlay with inherited stats
4. On confirm: call `onAddOffspring(foal, total_cost)` callback — App.tsx applies state changes

**Cost calculation (TypeScript):**
```
total_cost = BASE_FACILITY_FEE(100) 
  + (sire.player_owned ? 0 : sire.price)
  + (dam.player_owned ? 0 : dam.price)
```

> ⚠️ RULE: `breed_horse` is the Lua function that generates the offspring.
> Cost calculation and cooldown timestamps are TypeScript — they involve
> `Date.now()` and fund arithmetic, not game logic.

> ⚠️ RULE: Do not copy the example's Breeder.tsx JSX directly. Read it as
> reference for behavior. Implement using our snake_case types and our Lua
> runtime calls.

---

### §2.6 App.tsx — Wire Race Settlement

After `onRaceFinish` is called:
1. Call `update_horse_after_race(horse, rank, prize_earnings)` via Lua for each
   horse that ran — apply returned updated horses to state
2. Set `cooldown_until = Date.now() + race_cooldown_ms` for horses that ran
3. Add race to `raceHistory` state
4. Clear `bets` state
5. Generate new race via `create_race` Lua call

Add Breeder tab to tab navigation (after Betting, before History).

---

## §3 Test Anchors

**Python floor (must not regress):**
`uv run pytest -v` → 15 passed, 0 failed, 0 skipped

**New Python tests — behavioral equivalence:**
Add to `tests/test_executor.py`. All use seed=42.
Target after new tests: **21 passed, 0 failed, 0 skipped**

| # | Test Name | Behavior |
|---|---|---|
| 16 | `test_simulate_race_returns_six_results` | `simulate_race(6_participants, 1200, 1200, splits)` returns list of length 6 |
| 17 | `test_simulate_race_ranks_are_1_through_6` | All ranks 1–6 present exactly once |
| 18 | `test_calculate_place_odds_below_win_odds` | `calculate_place_odds(4.0, config)` returns value < 4.0 and ≥ 1.15 |
| 19 | `test_update_horse_after_race_increments_wins` | `update_horse_after_race(horse, 1, 720)` returns horse with `wins = horse.wins + 1` |
| 20 | `test_update_horse_after_race_does_not_mutate` | Input horse `wins` unchanged after call |
| 21 | `test_settle_bets_win_bet_pays_correct_amount` | Win bet on rank-1 horse pays `amount * payout_odds` |

**TypeScript floor (must not regress):**
`cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped

> ⚠️ RULE: Do not modify existing TypeScript tests.
> Do not add new TypeScript tests in this phase — behavioral equivalence is
> covered by the Python tests. TypeScript test expansion is Phase 3.

---

## §4 Completion Criteria

- [ ] `uv run pytest -v` → 21 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vitest run` → 12 passed, 0 failed, 0 skipped
- [ ] `cd ts && npx vite build` → exits 0, no TypeScript errors
- [ ] `data.yaml` has `public_studs` (4 entries), `starter_horses` (2 entries)
- [ ] `data.yaml` has `stable.max_slots`, `stable.starter_horse_cost`, both cooldown values
- [ ] `data.yaml` `starting_funds` is `1000` (not `3000`)
- [ ] `logic.lua` exports `simulate_race`, `calculate_place_odds`, `update_horse_after_race`, `settle_bets`
- [ ] `types.ts` has `RaceParticipant.final_rank`, `Bet.type`, `Bet.payout_odds`
- [ ] Browser: Stable tab shows horse cards with correct stats
- [ ] Browser: Betting tab shows odds — Place odds < Win odds for same horse
- [ ] Browser: Start race → animation plays → result reveals Lua-determined winner
- [ ] Browser: Breeder tab visible and functional — can select sire + dam, see cost, breed
- [ ] Browser: Bred foal appears in Stable tab after claiming
- [ ] `docs/state/current.md` updated to Phase 2b certified state

**Proof required:**
- Raw `uv run pytest -v` output (21/0/0)
- Raw `npx vitest run` output (12/0/0)
- Browser screenshot: Stable tab with at least 2 horse cards
- Browser screenshot: Race result screen showing ranked finish (winner must match Lua call)
- Browser screenshot: Breeder tab with sire and dam selected, cost visible

---

## §5 Quick Reference

| Item | Value |
|---|---|
| Python floor before | 15 / 0 / 0 |
| Python floor after | 21 / 0 / 0 |
| TypeScript floor | 12 / 0 / 0 (unchanged) |
| starting_funds | 1000 (change from 3000) |
| race_cooldown_ms | 90000 |
| breed_cooldown_ms | 180000 |
| stable.max_slots | 12 |
| place_odds_multiplier | 0.38 |
| place_odds_min | 1.15 |
| physics constants | Stay in logic.lua — not in data.yaml |
| Race winner authority | Lua only — TypeScript never computes winner |
| Cooldown timestamps | TypeScript only — Lua never calls Date.now() |
| camelCase boundary | SVGRacer props only — everywhere else snake_case |
| `public_studs` count | 4 (3 stallions, 2 mares — see §2.1) |
| New Lua functions | simulate_race, calculate_place_odds, update_horse_after_race, settle_bets |
| Phase 3 target | Claude MCP tool integration |

---

*RFDGameStudio Phase 2b | June 2026 | RFD IT Services Ltd.*
*Verify both floors before touching any file.*
*Race winner comes from Lua. No exceptions.*
