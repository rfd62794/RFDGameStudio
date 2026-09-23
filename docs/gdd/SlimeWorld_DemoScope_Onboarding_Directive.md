# SlimeWorld — Directive: Demo Scope & Onboarding (Ember Path)

*August 2 2026 (revised) | Read `docs/gdd/SlimeWorld_RegionLockDown_Directive.md` in FULL first — its real work is unchanged by this document. This revision replaces an earlier draft that leaned on external precedent (Cassette Beasts' dev blog) where real, LOCKED, already-tested RFD convention exists instead — pulled from `KingMaker_UX_Flow_Reference.md`, `Dissonance_Design.md`'s Onboarding section, and `VoidDrift_Phase4a_Tutorial_Directive.md`. Reuse these patterns; do not re-derive structure from a different game's dev blog when this studio already has a tested answer.*

---

> ⛔ **STOP:** Depends on Region Lock-Down being real and complete first
> — confirm its own §4 checklist with real evidence before starting.
> Report the real current floor at kickoff.

---

## §0 Context — three real, locked precedents this directive reuses

**1. The New Game / Hub split (KingMaker, confirmed real, tested 119/119).**
`NewGameScreen → OpeningSequence (short, locked beats) → Hub` on a new
campaign. `NewGameScreen → Hub directly, OpeningSequence never renders`
on Continue. Locked rule: OpeningSequence is reachable ONLY from
NewGameScreen, never from inside a loaded game.

**SlimeWorld's version:** New Game → a short, locked Opening beat
establishing "you start at Ember" (no mechanics taught here — see
precedent 2) → the existing Hub/tab structure, Ember as the active
region. Continue → straight to Hub, restored state, Opening never
renders — reuse KingMaker's exact branch logic, don't re-derive it.

**2. One-job-per-screen, teaching deferred to an always-available layer
(Dissonance, locked).** The entry screen explicitly does not teach
mechanics — "cramming a mechanics lesson onto this screen would break
the one-job-per-screen discipline this design has held everywhere else."
Teaching lives separately: a short line + two choices (dismiss straight
in, or full Instructions on demand), never forced, always one click away.

**SlimeWorld's version:** the Opening beat states only that Ember is
home and two regions are within reach — no breeding-match mechanic
explained here. Mechanic teaching moves to precedent 3.

**3. Trigger-based tutorial fired by real player actions, with an
explicit New Game Guard (VoidDrift Phase 4a, confirmed real,
implemented).** Popups fire on real state changes (reach a location,
open a specific UI, a resource appears), not a fixed timer. **Critical
rule this directive was missing before this revision:** on a loaded
save, every tutorial ID is pre-populated as already-shown, so nothing
re-fires for a returning player.

**SlimeWorld's version — real trigger points, reusing this exact
pattern:** T-1 fires on first view of the Hub (Ember active, Thornward/
Abyssal Ember visible as adjacent-but-locked — teaches that a region
exists and is reachable, not yet how). T-2 fires the first time the
player opens the breeding/roster screen with an unlocked-region target
visible (teaches: breed toward this). T-3 fires on the FIRST successful
region unlock, any region (teaches: permanence — "reaching a region
unlocks it forever," matching Robert's own real, already-stated rule,
echoing Dissonance's own choice to land its Instructions content
specifically on its permanence rule as "the actual sell").

> ⚠️ RULE: New Game Guard is non-negotiable, ported directly from
> VoidDrift's real implementation — a save with any prior region unlock
> or any prior Hub visit must have all three tutorial IDs pre-populated
> as shown on load. Confirm the real save/restore path before
> implementing (VoidDrift's own equivalent lives in
> `src/systems/persistence/save.rs` / `src/scenes/main_menu.rs` — SlimeWorld's
> real equivalent needs to be located, not assumed to be the same path).

**One more real, established convention this directive's UI work must
follow — "Focused Views" (OperatorGame's real, tested tab/sub-tab
structure):** region-lock status belongs as a sub-tab or focused view
within the existing Hub/Missions structure, not a new top-level screen.
Matches this directive's own prior "functional hookup only" instinct,
now grounded in a real, already-shipped convention rather than an
inference.

**Demo-complete definition, unchanged from the prior draft:** the player
breeds a slime matching both Thornward and Abyssal Ember from an Ember
start. Two unlocks, not one — evidence the loop repeats, not a fluke.

---

## §1 Scope Statement

| File | Status | Action |
|---|---|---|
| SlimeWorld's real equivalent of a `NewGameScreen`/opening-beat component (locate real current entry point first — confirm whether one exists or must be added) | Modify or New | Short, locked Opening beat per §0.1 — states Ember is home, nothing more; New Campaign only, never on Continue |
| Real save/restore path (confirm location, do not assume) | Modify (narrow) | New Game Guard: pre-populate all 3 tutorial IDs as shown when restoring an existing save, ported from VoidDrift's real pattern |
| Real Hub/tab component (wherever region-lock status renders per Region Lock-Down) | Modify (narrow) | Add as a focused sub-view within existing structure, not a new top-level screen — confirm real current tab/sub-tab convention before adding |
| New: 3-trigger tutorial system (T-1/T-2/T-3) | New | Reuse VoidDrift's real dismissable-popup + highlight pattern; fire on the real state changes named in §0.3 |
| `tests/*`, `ts/tests/*` | Modify | New anchors per §3 |

**Read-only:** Region Lock-Down's own data/logic (unchanged). VoidDrift's
actual tutorial code (`src/systems/ui/tutorial.rs` etc.) — reuse the
pattern, do not import or modify VoidDrift's own files; SlimeWorld needs
its own real implementation of the same shape.

---

## §2 Implementation

### §2a — Opening beat

Locate SlimeWorld's real current game-start flow before writing
anything — confirm whether an equivalent to `NewGameScreen` already
exists. If none exists, this is new; if one exists, extend it per
KingMaker's branch logic exactly (New Campaign → beat → Hub; Continue →
Hub directly).

> ⚠️ RULE: No mechanic teaching in this beat — matches Dissonance's
> locked discipline. State only that Ember is home and something is
> reachable nearby.

### §2b — New Game Guard

Confirm the real save/restore path, then port VoidDrift's exact
pattern: on restore, pre-populate `shown` for all 3 tutorial IDs.

### §2c — Trigger-based tutorial (T-1/T-2/T-3)

Reuse VoidDrift's real popup+highlight shape. Each trigger fires once,
is dismissable, does not repeat. T-3 (permanence) is the one that
matters most — land explicitly on "this is forever," same choice
Dissonance made for its own Instructions content.

### §2d — Focused-view placement

Confirm SlimeWorld's real current tab/sub-tab structure (or Region
Lock-Down's own addition to it) before placing region-lock status —
it belongs alongside existing focused views, not as a new screen.

---

## §3 Test Anchors

| Test name | Target | Behaviour |
|---|---|---|
| test_new_campaign_shows_opening_beat | Opening flow | New Campaign → beat renders → Hub |
| test_continue_skips_opening_beat | Opening flow | Continue → Hub directly, beat never renders |
| test_new_game_guard_prevents_tutorial_replay | Save/restore | Loaded save → all 3 tutorial IDs pre-shown, zero popups fire |
| test_t1_fires_on_first_hub_view | Tutorial | Fresh game, first Hub view → T-1 fires once |
| test_t3_fires_on_first_region_unlock | Tutorial | First successful unlock, any region → T-3 fires, states permanence |
| test_region_status_renders_as_subview | Focused view | Region-lock status renders within existing tab structure, not a new screen |

Target: **X passing, 0 failing, 0 skipped**, X = Region Lock-Down's real
confirmed floor at kickoff, plus the anchors above.

---

## §4 Completion Criteria

- [ ] Opening-beat branch logic confirmed real, matches KingMaker's exact
      New Campaign/Continue split
- [ ] New Game Guard confirmed real via test — no tutorial replay on load
- [ ] All 3 triggers confirmed real, fire once, on the real state changes
      named in §0.3
- [ ] Region status confirmed rendering as a focused sub-view, not a new
      top-level screen
- [ ] Full suite green: real floor reported
- [ ] `docs/state/current.md` updated
- [ ] `git diff --stat` confirms only this directive's scope touched

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Real precedent for opening flow | KingMaker's NewGameScreen→OpeningSequence→Hub, tested 119/119 |
| Real precedent for teaching discipline | Dissonance's one-job-per-screen rule, teaching deferred and optional |
| Real precedent for tutorial mechanics | VoidDrift Phase 4a — trigger-based, New Game Guard on restore |
| Real precedent for UI placement | OperatorGame's focused-view/sub-tab structure |
| Demo-complete definition | Both Thornward and Abyssal Ember unlocked from an Ember start |
