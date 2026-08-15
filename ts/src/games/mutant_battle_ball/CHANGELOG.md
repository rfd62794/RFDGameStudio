# Mutant Battle Ball — Changelog

Full detail for changes to Mutant Battle Ball.
Studio-wide summary: [`/CHANGELOG.md`](../../../CHANGELOG.md)
Roadmap: [`/ROADMAP.md`](../../../ROADMAP.md)

---

## Mutant Battle Ball — Balanced-Speed Zero-Score Investigation — COMPLETED (FALSE ALARM)

**Date:** August 14 2026
**Directive:** Diagnose why the opponent scored 0 with speeds balanced at
50 vs 50 (a different claim than the deferred data-balance issue).

### STOP rule satisfied

Read the real, current `mbbSimulation.ts` fresh — specifically the
Carrier evasion force, the Tackler pursuit force, the `forceInterpose`
Escort behavior, and how the opponent team's own moves get decided.
Ran real, controlled matches with genuinely balanced stats and logged
per-tick state (positions, possession, events) rather than only the
final score.

### Real finding: FALSE ALARM — the prior directive's "balanced" fixture was not balanced

**The "opponent scores 0 with balanced stats" finding from the prior
TS-Native Migration directive was a false alarm caused by the test
fixture, not a logic bug in the simulation.**

The prior directive's "balanced" test used:
- `makePlayerMutant(speedSum=50)` — sums parts across 6 slots, producing:
  - **power=85, endurance=85, accuracy=65, speed=48, maxHealth=85**
- `makeOpponentMutant(speed=50)` — flat stats, producing:
  - **power=30, endurance=35, accuracy=30, speed=50, maxHealth=35**

These are NOT balanced stats. The player had **2.8x more power** (85 vs
30) and **2.4x more endurance** (85 vs 35). The player won 52-0 because
of this massive stat advantage.

### Confirmation: genuinely balanced stats produce symmetric scoring

With GENUINELY identical inputs on both sides (both teams: accuracy=40,
endurance=40, power=40, speed=50, max_health=40):

| Seed | Player | Opponent | Winner |
|---|---|---|---|
| 1 | 27 | 26 | Player (by 1) |
| 42 | 24 | **29** | **Opponent** |
| 100 | 27 | 26 | Player (by 1) |
| 777 | 26 | 27 | Opponent (by 1) |
| 2024 | 23 | **30** | **Opponent** |

The opponent wins 2 of 5 matches. Scores are within 1-7 points every
time. The simulation is **symmetric when given symmetric inputs**.

### Per-tick trace evidence

A full per-tick trace of seed 42 (1801 ticks) was captured. The opponent
had possession for 930 ticks (52% of the match) and scored 29 times.
The first opponent score was traced tick-by-tick: the opponent carrier
moved from x=50.1 to x=10.5 over 22 ticks, reaching the end zone and
scoring.

### Force-weight analysis (all symmetric across teams)

| Parameter | Value | Team-dependent? |
|---|---|---|
| carrier_seek_weight | 1.0 | No (role-based) |
| carrier_flee_weight | 1.2 | No (role-based) |
| carrier_flee_radius | 20 | No (role-based) |
| tackler_pursue_weight | 1.0 | No (role-based) |
| escort_interpose_weight | 1.0 | No (role-based) |
| escort_arrive_radius | 8 | No (role-based) |
| max_force_ratio | 2.0 | No (role-based) |
| drag | 0.92 | No (global) |
| carrier_speed_mult | 0.85 | No (role-based) |

All force weights depend only on the agent's **role** (carrier/tackler/
escort), not on which **team** the agent belongs to. Source code
verification: `computeAgentForces` does not branch on `ag.team` for
force calculation.

### No fix applied — no logic bug existed

**The simulation code was NOT modified.** No logic asymmetry was found.
The "issue" was in the test fixture, not the simulation code.

### Data-balance issue still deferred

The prior fixture's massive stat asymmetry (power 85 vs 30, endurance
85 vs 35) is actually a MORE EXTREME version of the already-deferred
data-balance issue — it shows that the parts-summing approach
(`calculateStats` sums stats across 6 part slots) produces stats that
can be 2-3x higher than flat stats for the same "speed" input value.
This is the data-balance issue, and it remains explicitly deferred,
untouched.

### Test anchors (10 new, all passing)

**New test file:** `ts/tests/test_mbb_balanced_zero_score.ts`

- `test_balanced_stats_confirmed_symmetric` (2 tests)
- `test_real_match_logged_per_tick` (1 test)
- `test_scoring_opportunity_traced` (1 test)
- `test_force_weights_reported` (1 test)
- `test_symmetric_opportunity_post_fix` (1 test)
- `test_no_regression` (3 tests)
- `test_data_balance_still_deferred` (1 test)

**TS floor:** 862/865 passing (88 test files). +10 from previous floor.
3 failures all pre-existing/unrelated. Zero regressions.

---

## Mutant Battle Ball — Production TS-Native Migration + Steering Movement — COMPLETED

**Date:** August 14 2026
**Directive:** Migrate MBB to TS-native production (matching Shoal's
precedent and ADR-013), AND replace the movement layer with real
steering-based movement (seek/flee/arrive/interpose/pursue behaviors).

### What was built

- **TS-native simulation module**: `ts/src/games/mutant_battle_ball/simulation/`
  with `mbbSimulation.ts` — faithful port of Lua logic with steering-based
  movement replacing the original velocity-only system.
- **Steering behaviors**: Carrier seek (toward end zone) + flee (from
  tacklers), Tackler pursue (intercept carrier), Escort interpose (block
  tacklers). All force-based with drag and max-force limiting.
- **Role-based force weights**: All weights depend only on the agent's
  role (carrier/tackler/escort), not on which team — confirmed symmetric.
- **Substitution trigger**: `agent_down` -> `paused_sub` state, working
  correctly.
- **App.tsx migration**: Removed `call` import from `engine/runtime`,
  uses direct TS simulation calls.

### Files

- `ts/src/games/mutant_battle_ball/simulation/mbbSimulation.ts` — new
- `ts/src/games/mutant_battle_ball/App.tsx` — migrated from Lua executor
- `ts/tests/test_mbb_ts_native_migration.ts` — test anchors

**Lua source preserved**: `games/mutant_battle_ball/logic.lua` remains
untouched.

---

## Mutant Battle Ball — Match Engine Investigation — COMPLETED

**Date:** August 14 2026
**Directive:** Robert's own words from the original build session: "the
match never worked." This phase diagnoses *why* before any deeper design
gets built on top of something never confirmed functional.

### What "never worked" actually means — confirmed firsthand

The match does **not** crash or hang. It runs to `match_ended` every
time. The real failure is **degeneracy**: every match ended in a
one-sided blowout (26-0, 67-0, 53-5) where the conceding team almost
never got a real possession.

### Phase 2v test floor — assessed, confirmed unit-only

The original 80/0/0 Python floor covered only unit-level pieces in
isolation. **No test ever ran a full match to completion or asserted
anything about possession, scoring, or substitution.** This is the most
likely real explanation for "tests passed, match didn't work."

### Root cause #1 (logic, FIXED) — stale carrier self-tackle

In `tick_match`, the `carrier` local was captured once at the top of
the tick. The scoring block switches possession and resets positions on
a score but never updated `carrier`. So when the tackle block ran in
the same tick, `carrier` pointed at the agent who *just scored* — now
a *tackler* (possession had flipped). Distance-to-self is 0 < `tackle_r`,
so the agent tackled *itself*, flipping possession right back to the
scoring team.

**Fix:** re-fetch `carrier = get_carrier(st.agents)` immediately before
the tackle block, and `break` after a successful tackle.

### Root cause #2 (logic, FIXED) — ball lost when whole team stunned

The scoring block's reset only assigned the ball to an `active` agent
on the new possessing team. If the entire conceding team was `stunned`
at the moment of the score, the loop found no active agent, assigned
the ball to **no one**, and it was permanently lost.

**Fix:** Changed the reset condition from `ag.status == "active"` to
`ag.status ~= "down"` so a stunned (recoverable) agent can receive
the ball.

### Root cause #3 (data balance, OUT OF SCOPE) — opponent can never score

Even after the two logic fixes, real matches still end ~110-0 because
the opponent never scores. This is **not** a logic bug: a fast-opponent
verification (custom opponent speed 200/180) confirmed the scoring logic
works — the fast opponent scored 38 times. The real cause is data
balance: player starter mutants sum `speed` across all 6 parts (legs
give 30-55 each -> totals 76-104), while opponents carry flat `speed`
28-65. Player tacklers are ~2-3x faster.

### Substitution — trigger works, UI wiring is a separate gap

The substitution *trigger* fires correctly under real conditions:
`agent_down` -> `state = "paused_sub"`. However the UI modal only
offers "Continue Without Sub" and never calls `make_substitution`;
additionally `make_substitution` hardcodes `team = "player"` and the
default roster ships with an empty bench (`bench = []`).

### Minimal fix applied

Only `games/mutant_battle_ball/logic.lua` was modified — three small
edits in `tick_match`. No new mechanics, no rebalancing, no redesign
directions begun.

### Test anchors (5 new, all passing)

- `test_mbb_full_match_runs_to_completion`
- `test_mbb_no_self_tackle_after_score`
- `test_mbb_possession_actually_changes_teams`
- `test_mbb_ball_not_lost_when_team_stunned`
- `test_mbb_substitution_trigger_fires`

**MBB integration tests:** 11/11 passing (6 original + 5 new anchors).

### What this means for the three deferred redesigns

The match engine is now genuinely functional at the logic level. The
remaining degeneracy is data balance (player speed dominance), not
logic. Match Simulation depth, the Fight-Team GM Sim, and Parts
Assembly sharing with Chimera Wilds can now be scoped as real,
separate directives built on something confirmed working.

---

## Mutant Battle Ball — Minimal Real Game Loop — COMPLETED

**Date:** August 14 2026
**Directive:** Confirm whether RosterTab, WorkshopTab, ShopTab, and
InfirmaryTab are currently inert, and if so, build the smallest real,
closed loop — match outcome affects roster, roster affects next match.

### Real per-tab wiring state (confirmed, not assumed)

| Tab | Before | After | Evidence |
|---|---|---|---|
| **RosterTab** | Presentational only | **Unchanged** (presentational) | Zero `setState(` calls in source |
| **WorkshopTab** | Completely inert | **NOW REAL** — select mutant, view parts, equip parts from inventory | `handleEquip` calls `setState`, swaps parts |
| **ShopTab** | Completely inert | **NOW REAL** — browse parts, buy with iron | `handleBuy` calls `setState`, decrements iron |
| **InfirmaryTab** | Completely inert | **Still inert** (deferred) | Zero `setState(` calls |

### Minimal loop built

1. **Match -> reward** (already worked): A won match grants iron
   (60 + 10 per score). A loss grants 25 + 10 per score.
2. **Reward -> shop purchase** (NEW): The Shop lists all parts from
   `data['parts']` with prices. Buying decrements iron and adds part ID
   to `partsInventory`.
3. **Purchase -> roster change** (NEW): The Workshop shows mutants and
   their current parts. Equipping a part swaps it into the mutant's
   `parts` object and returns the old part to inventory.
4. **Changed roster -> next match** (already worked): `handleStartMatch`
   reads `state.activeSquad` -> `state.roster` -> passes mutants to
   `sim.initMatch()`.

### End-to-end loop confirmed via real playthrough

```
Match 1: 70-0 -> iron 120->880 (+760)
  -> bought leg_sprint for 90 (iron: 880->790)
  -> equipped leg_sprint to Alpha (speed 79->104)
Match 2: 90-0 with updated roster (faster Alpha)
```

### Files modified

- `ts/src/games/mutant_battle_ball/components/ShopTab.tsx` — rewritten
  from inert stub to real shop (93 lines)
- `ts/src/games/mutant_battle_ball/components/WorkshopTab.tsx` —
  rewritten from inert stub to real workshop (133 lines)
- `ts/src/games/mutant_battle_ball/App.tsx` — removed `call={noopCall}`
  from ShopTab and WorkshopTab props
- `ts/src/games/mutant_battle_ball/styles.css` — added shop and
  workshop layout styles (139 lines)

### Test anchors (9 new, all passing)

**New test file:** `ts/tests/test_mbb_minimal_game_loop.ts`

- `test_tab_wiring_confirmed` (1 test)
- `test_match_outcome_persists` (1 test)
- `test_reward_granted_and_persisted` (2 tests)
- `test_shop_purchase_changes_roster` (1 test)
- `test_loop_closes_end_to_end` (1 test)
- `test_no_regression` (3 tests)

**TS floor:** 870/874 passing (89 test files). +9 from previous floor.
4 failures all pre-existing/unrelated. Zero regressions.

### What's still deferred

- **InfirmaryTab** — still inert. Injury management is a separate future directive.
- **RosterTab squad selection** — `activeSquad` is still hardcoded.
- **Brand Sets / OEM tiers / Gravekeeper** — the full synergy system.
- **Data-balance issue** — parts-summing vs flat stats, still deferred.
