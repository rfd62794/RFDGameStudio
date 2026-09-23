# ScrapCrawl (RFDGameStudio) — Phase A: Core Loop Port

*July 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** Verify baseline before touching anything — do not trust the
> number below without re-running it yourself first. Confirmed this session:
> `163 passed` (Python, `uv run pytest -q`), `45 passed` (TypeScript, `cd ts
> && npx vitest run`), both exit 0. `games/scrapcrawl/` does not exist yet —
> confirm that's still true before creating it, in case something changed
> between this directive being written and executed.

---

## §0 Context

**What this delivers:** ScrapCrawl's real, independently-verified core loop —
room navigation, the Scrap→Craft→Equipment economy with durability, D20
combat with win-only Proficiency — ported faithfully from its proven Google
AI Studio TypeScript implementation into RFDGameStudio's real four-file
contract. This is a port, not a redesign: every numeric constant, every rule,
every edge case comes from the original's certified behavior (67 tests,
independently re-executed multiple times across this project). Where this
directive's pseudocode and the original disagree, the original wins — go
back to the source values, don't improvise.

**Two conditions from the immediately preceding decision, both binding:**

1. **Do not wire this into `engine/systems/genetics.lua` or any other shared
   engine system.** `engine_systems: []`, matching majority precedent. The
   whole reason this port is happening now rather than being used as
   evidence for resolving ADR-005 is that doing so would manufacture the
   exact contamination Chimera Wilds already produced once — building this
   to resemble something existing, then citing the resemblance as proof
   later. Port it as its own thing. If it happens to resemble
   `engine/systems/` later, on its own, without anyone designing toward
   that, that's real evidence — anything else isn't.
2. **The LLM-sculpting layer's data-only discipline is not being touched or
   discussed this phase**, because it's not in this phase at all — see
   deferred list below. Flagging only so nobody drifts toward "let's just
   wire in a little Gemini call while we're in here."

**Explicitly NOT in scope for Phase A (deferred, not forgotten):**
- Roster, companion recruitment, breeding — Phase B
- LLM-sculpted room content — Phase C
- Any connection to Chimera Wilds' part-assembly system — unrelated pivot,
  do not cross-pollinate the two
- Any new mechanics beyond what ScrapCrawl's Phase 1 already proved —
  this is a faithful port, not an opportunity to "improve" the design
  mid-translation

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/scrapcrawl/data.yaml` | New | Room graph, catalog, constants — real values, see §2 |
| `games/scrapcrawl/logic.lua` | New | Room/move, craft, resolve_fight, init/wipe |
| `games/scrapcrawl/ui.yaml` | New | Shared ADR-008 vocabulary only |
| `games/scrapcrawl/systems.yaml` | New | `engine_systems: []` |
| `ts/src/games/scrapcrawl/{types.ts, config.ts, App.tsx, styles.css}` | New | Real shared TS infra — `GameShell`, `useLuaCall`, `useGameState` |
| `ts/src/games/registry.ts` | Modify | Register `scrapcrawl` |
| `ts/src/engine/loader.ts` | Modify | Add YAML imports |
| `tests/test_scrapcrawl.py` | New | Python integration tests |
| `ts/tests/test_arcade.ts` | Modify | Registry tests, matching existing per-game pattern |
| `docs/state/current.md` | Modify | New phase entry — mark **CERTIFIED**, not PENDING, when actually done (see the last phase's own correction for why this matters) |
| `examples/scrapcrawl/**`, `games/chimera_wilds/**`, `games/mutant_battle_ball/**` | Read-only | Do not touch under any circumstance |

---

## §2 Implementation — real values, ported not invented

### `games/scrapcrawl/data.yaml`

**Rooms** (5, matching the original's graph exactly): `home_base` (interactions:
home/craft/rest), `scrap_pit`, `vent_stack`, `chemical_leak`, `furnace_core`
(all fight rooms). Port the original's exact connection topology and
difficulty values — do not invent new ones.

**Catalog** — four entries, real tier costs from the certified original:
```yaml
catalog:
  beatStick: { slot: weapon, tierCost: {1: 10, 2: 25}, maxLife: {1: 10, 2: 18} }
  shield:    { slot: shield, tierCost: {1: 10, 2: 25}, maxLife: {1: 10, 2: 18} }
  bodyArmor: { slot: armor,  tierCost: {1: 10, 2: 25}, maxLife: {1: 10, 2: 18} }
  tool:      { tierCost: {1: 20} }   # no slot — flips tier2_unlocked, not equippable
```

**Constants:**
```yaml
constants:
  proficiency_xp_ceiling: 500
  scrap_reward_min: 3
  scrap_reward_max: 8
  unarmed_baseline_atk: 2
  tier2_cap: 2   # hard ceiling, no Tier 3
```

> ⚠️ RULE: These numbers are not placeholders. They're the real, tested
> values from ScrapCrawl's certified TS implementation. Do not "round them
> nicely" or adjust them during translation — a port that quietly changes
> balance numbers isn't a port, it's an undisclosed redesign.

### `games/scrapcrawl/logic.lua`

Port these functions faithfully. **Verb-naming decisions needed — flag your
choice explicitly in the completion report, same discipline as Chimera
Wilds' `generate_chimera` decision:**

| Original TS | ADR-007 fit | Notes |
|---|---|---|
| `move(player, roomId)` | Movement (`move_`) | Clean fit: `move_player` |
| `canMoveTo` | — | No clean verb match. Recommend `can_move_to`, flag as non-compliant like `craft` below, don't force a bad fit |
| `craft`/`canCraft` | — | Neither `craft_` nor `can_craft_` are locked verbs. Recommend keeping as-is and flagging, per the same precedent Chimera Wilds set for `assemble_`/`generate_` |
| `resolveFight` | Resolution (`resolve_`) | **Direct match — `resolve_fight` is literally ADR-007's own worked example.** No decision needed here. |
| `initPlayer` | Lifecycle (`init_`) | Clean fit: `init_player` |
| `wipe` | — | Doesn't cleanly fit any locked verb (it's a partial reset, not a full `destroy_`+`init_`). Recommend `reset_position`, flag as a naming call, not a forced fit |

> ⚠️ RULE: `resolve_fight`'s formula must be ported exactly:
> `D20 roll + growthFactor(proficiencyXp) * weapon_atk` vs room difficulty,
> unarmed baseline `atk = 2` when no weapon or weapon `life <= 0`. This is
> the single most load-bearing piece of game feel in the original — get the
> formula wrong and the port technically "works" while playing completely
> differently.

> ⚠️ RULE: Proficiency XP increments **only on win** — this was a real bug
> in the original's Phase 1 that took two audit rounds to actually fix (see
> ScrapCrawl's own Phase 2 history). Port the corrected behavior from the
> start. Do not reproduce the bug and then "discover" it again.

> ⚠️ RULE: Tool-crafted Tier 2 unlock is shared across all three gear slots
> simultaneously — one Tool, one flag, not three independent unlocks. And
> Tier 1 cost must stay flat regardless of `tier2_unlocked` state — this was
> an explicit design guarantee in the original, write the test for it (§3).

### `games/scrapcrawl/ui.yaml`

Shared ADR-008 vocabulary only, no new game-specific types needed this
phase — the original's screens map cleanly: `stat_display` (scrap count),
`panel`/`label`/`badge` (current room), `action_button` (Fight/Craft/Rest),
`data_table` (equipment), `stat_bar` (durability/proficiency), `history_list`
(combat trace), `card_grid`/`card` (crafting catalog).

### `ts/src/games/scrapcrawl/App.tsx`

`GameShell`, `useLuaCall`, `useGameState` — same pattern as Chimera Wilds and
every other real game in `ts/src/games/`. Hand-written JSX with game-specific
CSS classes is the studio's actual established practice (confirmed directly
against `mutant_battle_ball`'s own certified components) — don't hold this
port to a `ui/components` base-library standard nothing else in the studio
meets either.

---

## §3 Test Anchors

Target: **25 new tests** (Python). Final floor: **188 passed** (163 + 25),
**0 failed, 0 skipped**. TS floor: add the standard 4 registry/config/render/
interaction tests, matching Chimera Wilds' pattern — **49 passed** (45 + 4).

| Test name | Behaviour |
|---|---|
| `test_get_room_returns_seeded_room` | Known room resolves |
| `test_can_move_to_true_for_connected_room` | Adjacency check |
| `test_can_move_to_false_for_unconnected_room` | Rejects non-adjacent |
| `test_move_updates_position` | State reflects new room |
| `test_move_rejects_unconnected_no_op` | No-op on invalid move |
| `test_can_craft_true_sufficient_scrap` | Baseline pass |
| `test_can_craft_false_insufficient_scrap` | Rejects underfunded |
| `test_craft_deducts_correct_tier1_cost` | Matches real catalog values |
| `test_craft_tier2_rejected_before_tool` | Gate enforced |
| `test_craft_tool_unlocks_all_three_slots_simultaneously` | One Tool, one flag, all slots |
| `test_tier1_cost_unchanged_after_tier2_unlock` | The explicit guarantee from §2 |
| `test_craft_replaces_existing_slot_item` | Old item discarded |
| `test_resolve_fight_win_awards_scrap_in_range` | 3–8, matches real constants |
| `test_resolve_fight_depletes_weapon_life` | -1 per use |
| `test_resolve_fight_broken_weapon_falls_back_to_unarmed` | atk=2 fallback, no crash |
| `test_proficiency_increments_on_win_only` | The corrected-from-day-one behavior |
| `test_proficiency_unchanged_on_loss` | Companion regression test |
| `test_growth_factor_clamps_floor_0_8` | Matches real curve |
| `test_growth_factor_clamps_ceiling_1_5` | Matches real curve |
| `test_wipe_resets_position_only` | Position resets |
| `test_wipe_preserves_scrap_equipped_proficiency` | Everything else survives |
| `test_data_yaml_catalog_matches_original_tier_costs` | Byte-value check against known original constants, same discipline as Chimera Wilds' MBB byte-equality test |
| `test_data_yaml_room_graph_matches_original_topology` | Same, for room connections |
| `test_systems_yaml_engine_systems_empty` | Confirms the binding condition from §0 is actually reflected in the file |
| `test_studio_validate_game_scrapcrawl` | `valid=True` |

---

## §4 Completion Criteria

- [ ] `188 passed, 0 failed, 0 skipped` (Python) — raw output
- [ ] `49 passed, 0 failed, 0 skipped` (TypeScript) — raw output
- [ ] `npx tsc --noEmit` — confirm zero new errors attributable to
      `scrapcrawl` files specifically (same check as Chimera Wilds)
- [ ] `npx vite build` exits 0
- [ ] `studio_validate_game('scrapcrawl')` → `valid=True, issues=[]`
- [ ] Explicit verb-naming decisions stated for `canMoveTo`, `craft`/
      `canCraft`, and `wipe` — per the table in §2
- [ ] Confirm `git diff --stat` empty for `examples/`, `games/chimera_wilds/`,
      `games/mutant_battle_ball/`
- [ ] `docs/state/current.md` updated and headed **CERTIFIED**, "Current
      Phase" pointer actually updated — not left as PENDING the way this
      needed a second pass last time
- [ ] Manual trace: navigate all 5 rooms, craft a Tier 1 item, fight to a
      win and a loss, craft the Tool, confirm all three Tier 2 slots unlock —
      paste the real console trace, not a summary

---

## §5 Quick Reference

| Item | Value | Source |
|---|---|---|
| Tier costs | `{1: 10, 2: 25}`, Tool `{1: 20}` | Real, from certified original |
| Equipment life | Tier 1: 10, Tier 2: 18 | Real, from certified original |
| Scrap reward | 3–8 | Real, from certified original |
| Proficiency XP ceiling | 500, clamp [0.8, 1.5] | Real, from certified original |
| Unarmed baseline atk | 2 | Real, from certified original |
| `engine_systems` | `[]` | Binding condition, not a default this time |
| Deferred to Phase B | Roster, companions, breeding | |
| Deferred to Phase C | LLM-sculpted content | Data-only discipline preserved, untouched this phase |
| Explicitly excluded | Any wiring to `engine/systems/genetics.lua` | The whole reason this phase exists as a clean port |

---

*ScrapCrawl (RFDGameStudio) — Phase A Directive*
*RFD IT Services Ltd. | July 2026*
*Port what's proven. Don't improve it mid-translation, and don't build it to resemble anything on purpose.*
