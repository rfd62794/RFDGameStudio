# SlimeWorld — Directive: Player-Aligned as the Single Canonical Signal

*August 2 2026 (revised before execution) | Corrects real, shipped behavior in `resolve_force_claim`, `resolve_bribe_claim`, `resolve_convert_claim`, and `check_fealty_transition` — all four currently overwrite (or, for Force/Bribe, are the reason others overwrite) a node's cultural color to Gray as the sole signal of player control. This revision replaces that dual-meaning overload with one canonical flag used identically by all four paths.*

---

> ⛔ **STOP:** Run the full suite before touching anything. Must report
> the real current floor (563+ Python, 257+ TypeScript depending on what
> Region Lock-Down has landed since) — reconfirm live, do not assume.

---

## §0 Context

Confirmed via direct source read: `resolve_force_claim`, `resolve_bribe_claim`,
`resolve_convert_claim` (all in `territory.lua`), and `check_fealty_transition`
(in `favors.lua`) all currently set `owner_color = "Gray"` on success —
identical outcome regardless of method, and `owner_color == "Gray"` is
also the real signal every downstream system checks for "this node is
already player-controlled" (`favors.lua:36`'s Favor-generation gate,
`territory.lua:43,47`'s pressure-exclusion checks).

**Real design decision, settled this session:** Force and Bribe should
keep erasing cultural identity to Gray — raw coercion doing that is
thematically correct. Convert and Fealty should not — they're the
relationship-based outcomes, and the current thesis holds that a region
keeps its own identity even once it's genuinely yours.

**Revised once more, before any code was touched — a real simplification,
not a style change.** The first draft of this directive had Force/Bribe
signal "this is mine" via `owner_color == "Gray"` while Convert/Fealty
signaled it via a new, separate `player_aligned` flag — two different
signals, requiring every gate check in the game to correctly OR them
together, which is exactly the kind of thing a future session misses.
**`player_aligned` is now the single canonical signal for all four
paths.** Force and Bribe still overwrite `owner_color` to Gray — that
erasure stays, on purpose — but now ALSO set `player_aligned = true`,
identically to Convert and Fealty. Every downstream check reads
`player_aligned` only, never `owner_color`, for "is this mine." Gray
goes back to meaning only what it always should have: cultural/genetic
identity, sometimes erased by conquest, always preserved by relationship.

**In scope, all four:** `resolve_force_claim`, `resolve_bribe_claim`
(gain `player_aligned = true`, `owner_color` unchanged — still Gray),
`resolve_convert_claim`, `check_fealty_transition` (gain
`player_aligned = true`, `owner_color` now PRESERVED instead of
overwritten). Garrison assignment (`assign_garrison`) — confirmed via
source read to never touch `owner_color` at all; needs no code fix, only
a documentation/framing update (a Mayor represents `player_aligned`, not
a color change).

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| `games/slimeworld/territory.lua` | Modify (narrow) | `resolve_force_claim`: add `player_aligned = true` to the returned node. `owner_color = "Gray"` stays exactly as-is. |
| `games/slimeworld/territory.lua` | Modify (narrow) | `resolve_bribe_claim`: same — add `player_aligned = true`, `owner_color` unchanged |
| `games/slimeworld/territory.lua` | Modify (narrow) | `resolve_convert_claim`: remove the `owner_color = "Gray"` overwrite entirely; add `player_aligned = true` instead |
| `games/slimeworld/favors.lua` | Modify (narrow) | `check_fealty_transition`: remove the `owner_color = "Gray"` overwrite; add `player_aligned = true` alongside the existing `fealty_locked = true` |
| `games/slimeworld/favors.lua` | Modify (narrow) | Favor-generation gate (`favors.lua:36`): replace the `owner_color ~= "Gray"` check with `not node.player_aligned` — single canonical check, not an OR |
| `games/slimeworld/territory.lua` | Modify (narrow) | Pressure-exclusion checks (`territory.lua:43,47`): same replacement — `player_aligned` only, `owner_color == "Gray"` no longer consulted for this purpose anywhere |
| `ts/src/games/slimeworld/types.ts` | Modify | Bridge the new `player_aligned` field, same pattern as `fealty_locked` |
| `tests/*`, `ts/tests/*` | Modify | New anchors per §3 |

**Read-only:** `assign_garrison` — unchanged, was never the source of the
issue.

---

## §2 Implementation

> ⚠️ RULE: `player_aligned` is additive to `owner_color`, never a
> replacement for it as a data field — but it IS a full replacement for
> `owner_color == "Gray"` as a *signal*. After this directive, nothing in
> the codebase should check literal Gray to determine player control.
> Grep for every remaining `== "Gray"` / `~= "Gray"` comparison after
> implementation and confirm each one is either (a) genuine color/genetic
> logic (breeding, desaturation) or (b) converted to check
> `player_aligned` — report both categories, don't just fix the two
> named above and assume completeness.

> ⚠️ RULE: A Converted or Fealty-locked node's `owner_color` must equal
> whatever it was immediately before the claim/transition — confirm via
> test, not code inspection alone, since the whole point of this
> directive is that identity survives.

---

## §3 Test Anchors

| Test name | Target | Behaviour |
|---|---|---|
| test_force_claim_sets_player_aligned_and_gray | resolve_force_claim | Success → owner_color = Gray (unchanged) AND player_aligned = true (new) |
| test_bribe_claim_sets_player_aligned_and_gray | resolve_bribe_claim | Same |
| test_convert_claim_preserves_owner_color | resolve_convert_claim | Success → owner_color unchanged from pre-claim value, player_aligned true |
| test_fealty_transition_preserves_owner_color | check_fealty_transition | Same, at the Fealty transition point |
| test_player_aligned_node_stops_generating_favors | favors.lua gate | Any player_aligned node (regardless of owner_color) produces no new Favor |
| test_player_aligned_node_excluded_from_pressure_contest | pressure sim | Same real exclusion, checked against player_aligned only |
| test_no_remaining_gray_based_control_checks | full codebase grep | Real, scripted confirmation that no control-logic branch still checks literal Gray — report the grep output as proof |

Target: **X passing, 0 failing, 0 skipped**, real pre-flight floor plus
anchors above.

---

## §4 Completion Criteria

- [ ] All four paths (Force, Bribe, Convert, Fealty) confirmed to set
      `player_aligned = true` on success
- [ ] Convert and Fealty confirmed to preserve real owner_color via test
- [ ] Force and Bribe confirmed to still set Gray via regression test
- [ ] Every real control-logic check in the codebase confirmed to read
      `player_aligned`, not `owner_color == "Gray"` — full grep output
      pasted into the completion report, not just the two named checks
- [ ] TS bridge for `player_aligned` real and tested
- [ ] Full suite green, real floor reported
- [ ] `docs/state/current.md` updated

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Single canonical signal | `player_aligned` — set true by all four paths (Force, Bribe, Convert, Fealty) |
| Owner_color meaning, restored | Purely cultural/genetic identity — Gray for Force/Bribe (erased, on purpose), preserved for Convert/Fealty |
| Why this revision over the first draft | Dual-signal (Gray-or-flag) required every check to OR correctly; single-signal removes that regression class entirely |
| Garrison/Mayor | No code change — reframed only, never touched owner_color to begin with |
