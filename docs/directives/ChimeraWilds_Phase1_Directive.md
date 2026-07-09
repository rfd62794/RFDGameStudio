# Chimera Wilds — Phase 1 Directive: Minimal Encounter Loop

*July 2026 | Read fully before executing anything.*

---

> ⛔ **STOP:** This is a new game in an existing, certified studio. Before
> touching anything, run both existing floors and report raw output:
> `uv run pytest -v` (expect 86 passed) and `cd ts && npx vitest run`
> (expect 39 passed). If either differs from these numbers, stop and report
> the discrepancy before writing any code — that means something changed in
> the studio since the last recon and needs to be understood first.
>
> **PowerShell reminder, since this has already caused one blocked session:**
> this environment is PowerShell, not cmd. Chain commands with `;`, not
> `&&`. `cd` does not need `/d`. Do not route through `cmd /c` unless a
> command genuinely requires it.

---

## §0 Context

**What this delivers:** A new, standalone four-file game — `games/chimera_wilds/`
— where the player faces a single randomly-assembled six-part enemy per
encounter and the fight resolves via one D20 roll against a derived score.
No economy, no roster, no player progression. This tests exactly one thing:
does a procedurally-assembled enemy feel meaningfully different from a fixed
difficulty number. Nothing else is built until that's answered.

**This is not a ScrapCrawl port.** ScrapCrawl's `examples/` copy is untouched
and stays that way — nothing here reads from or writes to it. This is a new
game from scratch, reusing one thing from Mutant Battle Ball (its part
catalog data, copied once) and the studio's already-proven shared TS
infrastructure (GameShell, TabManager, hooks, base UI components).

**Explicitly NOT in scope for this phase:**
- Player economy, currency, crafting, or persistence of any kind
- A roster, recruitment, or anything that survives between encounters
- `accuracy` and `speed` stats — present in the copied catalog data, unused
  in this phase's resolution formula
- MBB's actual match simulation (tackle/block/possession/substitution) —
  irrelevant here, not reused, not referenced
- `engine/systems/` of any kind — this game is fully self-contained per
  the `engine_systems: []` precedent set by `slither_rogue` and `slime_coin`
- PyGame renderer — TS only this phase, matching how new games have
  actually been built recently (2v, 2w), not every game's original path

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/chimera_wilds/data.yaml` | New | Part catalog (copied from MBB, see §2), baseline player stats |
| `games/chimera_wilds/logic.lua` | New | `assemble_chimera`, `resolve_encounter` |
| `games/chimera_wilds/ui.yaml` | New | Single-screen layout, shared vocabulary only |
| `games/chimera_wilds/systems.yaml` | New | One system, `engine_systems: []` |
| `ts/src/games/chimera_wilds/types.ts` | New | Render-side types |
| `ts/src/games/chimera_wilds/config.ts` | New | Registry entry, color, lazy-loaded App |
| `ts/src/games/chimera_wilds/App.tsx` | New | Uses `GameShell`; no `TabManager` needed — single screen |
| `ts/src/games/chimera_wilds/styles.css` | New | Game-specific only, imports tokens/base per ADR-008 |
| `ts/src/games/registry.ts` | Modify | Register `chimera_wilds` |
| `ts/src/engine/loader.ts` | Modify | Add YAML imports to `GAME_ASSETS`, matching the existing per-game pattern |
| `tests/test_chimera_wilds.py` | New | Python integration tests |
| `ts/tests/test_arcade.ts` | Modify | Add registry tests, matching the 2v/2w pattern |
| `docs/state/current.md` | Modify | New phase entry |
| `games/mutant_battle_ball/**`, `examples/**`, every other existing game | Read-only | Do not touch under any circumstance |

---

## §2 Implementation

### `games/chimera_wilds/data.yaml`

Copy the twelve real parts from `games/mutant_battle_ball/data.yaml` verbatim
— same `id`, `slot`, `accuracy`, `endurance`, `power`, `speed` fields. This is
a one-time copy per ADR-005 ("shared code is copy-pasted once and owned by
the game"), not a reference or import. Add:

```yaml
game:
  id: chimera_wilds
  name: Chimera Wilds
  version: "1.0"
  studio: RFDGameStudio

part_slots: [head, chest, left_arm, right_arm, left_leg, right_leg]
parts:
  # copied verbatim from mutant_battle_ball/data.yaml — same 12 entries

baseline_player:
  power: 20
  endurance: 20
```

> ⚠️ RULE: These are the real MBB numbers, not placeholders — no "tune
> later" flag needed on the copied parts themselves. `baseline_player`
> values ARE first-pass and should be flagged as tunable in the completion
> report.

### `games/chimera_wilds/logic.lua`

```lua
-- assemble_chimera(parts_table) -> { total_power, total_endurance, part_ids }
-- parts_table: one PartDefinition per slot (all six required)
-- Returns nil, "Missing slot: {slot}" if any slot absent — mirrors
-- validate_entity's error-return convention rather than throwing.
function assemble_chimera(parts_table)

-- resolve_encounter(player_power, player_endurance, chimera, roll) -> { won, score, chimera_score }
-- roll: integer 1-20, passed in (studio convention — Lua doesn't own RNG,
-- caller does, exactly like ScrapCrawl's D20 pattern)
-- score = roll + player_power + player_endurance
-- chimera_score = chimera.total_power + chimera.total_endurance
-- won = score >= chimera_score
function resolve_encounter(player_power, player_endurance, chimera, roll)
```

> ⚠️ RULE: Verb prefixes follow ADR-007 exactly — `assemble_` isn't one of
> the six locked verbs (`generate_/create_/destroy_`, `apply_/update_/breed_`,
> `resolve_/simulate_`, etc). Closest fit is Entity (`generate_` family) since
> it constructs a new thing from parts. If a naming call is needed, default to
> `generate_chimera` instead of `assemble_chimera` to stay inside the locked
> vocabulary — flag this choice explicitly in the completion report either way,
> since it's a real ADR-007 compliance decision, not a formatting preference.

### `games/chimera_wilds/systems.yaml`

```yaml
engine_version: "1.0"
engine_systems: []   # self-contained, matches slither_rogue/slime_coin precedent

systems:
  - id: encounter
    description: "Chimera assembly and single-roll combat resolution"
    functions:
      - generate_chimera   # or assemble_chimera, per the ⚠️ RULE above
      - resolve_encounter

entities:
  chimera:
    description: "A randomly-assembled six-part enemy, disposed after one encounter"
    systems: [encounter]
    schema_ref: data.yaml#parts
```

### `games/chimera_wilds/ui.yaml`

Single screen. Shared vocabulary only per ADR-008 — no new game-specific
types this phase:

- `panel` containing the current chimera's assembled part names (`label` ×6)
- `stat_display` for the chimera's derived score
- `action_button` — "Face the Wilds" — triggers a new random assembly + roll
- `badge` — Win/Loss result
- `history_list` — log of past encounters this session (in-memory only, not
  persisted — resets on page reload, and that's fine, nothing here claims
  otherwise)

### `ts/src/games/chimera_wilds/App.tsx`

Uses `GameShell` from `ts/src/components/`. Does NOT use `TabManager` — one
screen, no tabs, don't import infrastructure this game doesn't need. Calls
`resolve_encounter` via the existing `useLuaCall` hook, same pattern as every
other game in `ts/src/games/`.

---

## §3 Test Anchors

Target additions: **8 Python, 4 TypeScript.** Final floors: **94 passed
(Python), 43 passed (TypeScript)** — both 0 failed, 0 skipped.

| Test | Suite | Behaviour |
|---|---|---|
| `test_assemble_chimera_sums_all_six_slots` | Python | Correct totals from known parts |
| `test_assemble_chimera_rejects_missing_slot` | Python | Returns nil + error, doesn't crash |
| `test_resolve_encounter_win_when_score_exceeds_chimera` | Python | Deterministic roll, known inputs |
| `test_resolve_encounter_loss_when_score_below_chimera` | Python | Same, inverted |
| `test_resolve_encounter_boundary_equal_score_is_win` | Python | `>=`, not `>` — confirm the boundary |
| `test_data_yaml_parts_match_mbb_source_values` | Python | Spot-check at least 3 copied parts against the real MBB source, confirm the copy is accurate not just present |
| `test_studio_validate_game_chimera_wilds` | Python | `studio_validate_game('chimera_wilds')` → `valid=True` |
| `test_systems_yaml_engine_systems_empty` | Python | Confirms the self-contained decision is actually reflected in the file, not just described in prose |
| `test_registry_chimera_wilds_registered` | TypeScript | Present in `ts/src/games/registry.ts` |
| `test_config_lazy_loads_app` | TypeScript | Matches existing per-game config pattern |
| `test_app_renders_without_crash` | TypeScript | Basic mount test |
| `test_encounter_button_triggers_lua_call` | TypeScript | `useLuaCall` invoked on click |

---

## §4 Completion Criteria

- [ ] Pre-flight floors confirmed BEFORE any change (§0 STOP block)
- [ ] Python floor: `uv run pytest -v` → **94 passed, 0 failed** — raw output
- [ ] TS floor: `cd ts && npx vitest run` → **43 passed, 0 failed** — raw output
- [ ] `studio_validate_game('chimera_wilds')` → `{'valid': True, 'issues': []}` — raw output
- [ ] `npx vite build` → exits 0
- [ ] Manual trace: three consecutive encounters, raw output showing different
      part assemblies and different outcomes — not a single cherry-picked
      success
- [ ] Explicit statement: which verb was used, `assemble_chimera` or
      `generate_chimera`, and why — per the ⚠️ RULE in §2
- [ ] Confirm via diff: zero files touched under `examples/` or
      `games/mutant_battle_ball/` — paste the diff, empty output required
- [ ] `docs/state/current.md` updated with a new phase entry following the
      exact format of the existing 2v/2w entries — not a new format invented
      for this game

---

## §5 Quick Reference

| Item | Value | Notes |
|---|---|---|
| Game id | `chimera_wilds` | New, standalone |
| Part source | `mutant_battle_ball/data.yaml`, copied once | Real values, not placeholders |
| Stats used | `power`, `endurance` | `accuracy`, `speed` present, unused this phase |
| Combat model | Single D20 roll, `>=` comparison | No HP, no rounds |
| `engine_systems` | `[]` | Self-contained, matches majority precedent |
| Persistence | None | In-memory history only, resets on reload |
| Shared infra used | `GameShell`, `useLuaCall`, `ui/components` base library | Real, already-proven, per ADR-008 |
| Shared infra NOT used | `TabManager` | Single screen, don't import what isn't needed |
| `examples/scrapcrawl` | Untouched | Confirmed pure, stays that way |
| Deferred | Player progression, roster, Mind/Soul, Mad Science Lab, LLM-sculpted content | All contingent on this phase proving the encounter is worth building on |

---

*Chimera Wilds Phase 1 Directive*
*RFD IT Services Ltd. | July 2026*
*A new game, not a port. Prove the encounter before anything is built to outlive it.*
