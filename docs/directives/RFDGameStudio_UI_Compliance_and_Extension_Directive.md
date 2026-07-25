# RFDGameStudio — Shared UI Layer: Compliance, Retrofit, and Extension

*July 2026 | Read fully before executing anything. Governed by ADR-008 (Accepted),
which this directive enforces and extends. Not a new ADR — ADR-008 already
authorizes everything here except the three new template additions in §2.3,
which are logged as an extension to its component registry, not a policy change.*

---

> ⛔ **STOP:** Run the real Python + TypeScript test suites before touching any file.
> Certified floor: **502 Python, 201 TypeScript.**
> If the count you get differs, stop and report the real number.

---

## §0 Context

`ts/src/ui/` (`tokens.css`, `base.css`, and `components/` — `Button`, `Panel`,
`StatBar`, `Badge`, `TabBar`, `Card`, `Modal`, `EmptyState`, `ErrorBox`) already
exists, fully built, exactly per ADR-008. **It is not being used.** Direct
inspection this session found zero imports from `ts/src/ui/components` in
Brewfield's `App.tsx` (the studio's own first, reference port) or in Dissonance's
newly-built `TitlePhase.tsx`/`RewardPhase.tsx`. Both hand-roll buttons, panels,
and stat displays that the shared library already provides. This is not a
tonight-specific gap — it appears to trace back to ADR-008's own Phase 2f
migration, which built the library but never completed the migration onto it.

**The rule going forward, stated plainly because it has apparently been silently
ignored since the library was built: if a shared component already exists that
covers a given piece of UI, it must be used. A phase or game component may not
hand-roll a button, panel, badge, card, modal, tab bar, or stat display that
`ts/src/ui/components` already provides.** This is not a new rule — it is
ADR-008's Layer 1/Layer 2 contract, restated because it has not been followed.

**Why this is one directive, not a pure retrofit:** the twelve confirmed
`examples/` originals are real evidence for *what else* belongs in the shared
registry, beyond ADR-008's original nine components. Extending the registry
correctly, using the same real-evidence discipline as the prior analysis pass,
should happen before or alongside the retrofit — not as a separate, later
afterthought that requires touching the same files twice.

---

## §1 Scope Statement

| Target | Status | Action |
|---|---|---|
| `ts/src/ui/components/*` | Modify (additive only) | Add three new shared templates per §2.3 — do not change existing nine components' public APIs without a real, separate reason |
| `ts/src/games/brewfield/App.tsx` + its bespoke components | Modify | Retrofit onto shared components where a direct equivalent exists |
| `ts/src/games/dissonance/phases/*.tsx` | Modify | Retrofit — highest priority, smallest, most recent, still actively being built |
| `ts/src/games/slimeworld`, `shoal`, `horse_racing`, `mutant_battle_ball`, `slither_rogue`, `scrapcrawl` | Audit first, retrofit as a second pass | Do not block this directive's completion on all six — report compliance status per game, retrofit in priority order below |
| `examples/*` | Read-only | Reference only, for extracting the three new template shapes |

---

## §2 Implementation

### §2.1 — Audit pass (do this first, across every finished game)

For each game listed in §1, grep its `App.tsx` and any phase/component files for
imports from `ts/src/ui/components`. Report, per game: which of the nine existing
components are used, which are hand-rolled instead, and a rough count of
duplicated instances (e.g., "Brewfield hand-rolls 6 distinct button styles that
`Button` already covers").

### §2.2 — Retrofit, in this priority order

1. **Dissonance's already-built phases** (`TitlePhase`, `RewardPhase`, and the
   rest built this session) — highest priority. Smallest surface, freshest
   context, and every additional phase built on the non-compliant pattern makes
   the eventual retrofit larger for no reason. Do this before building any
   further Dissonance phases (Treasure/Store/Anomaly/RunEnd/etc.).
2. **Brewfield** — the studio's own reference implementation. Its non-compliance
   is the most consequential, since every later game may have modeled itself on
   it. Bringing it into compliance makes it a correct reference again.
3. **SlimeWorld, Shoal, horse_racing, mutant_battle_ball, slither_rogue,
   scrapcrawl** — real work, lower urgency. Scope as a follow-up pass once §2.2.1
   and §2.2.2 are confirmed clean; do not let this directive's completion block
   on all six if time-boxing is needed, per the same allowance already used on
   the renderer directive.

**Retrofit rule:** replace hand-rolled markup with the shared component only
where the shared component's actual API covers the need. Do not force a shared
component to fit where it genuinely doesn't (e.g., `EnemySection`'s stat display
may need more specialized layout than plain `StatBar` provides — if so, compose
`StatBar` inside a game-specific wrapper rather than distorting `StatBar` itself
to fit one game's edge case).

### §2.3 — Extend the registry: three new shared templates, evidence-backed

Real, repeated evidence from confirmed examples and finished ports — not
invented, not guessed:

1. **`TitleScreen`** — shared shape for Brewfield's `IntroScreen` and Dissonance's
   `TitlePhase`. Both are: a title, a short pitch/subtitle, an optional in-
   character quote block, and a vertical menu of primary actions (New Run/
   Continue/etc.). Extract the shared shape; pass title text, pitch text, quote,
   and menu items as props. Game-specific: the exact wording, the menu item list,
   any game-specific visual flourish (Brewfield's stone palette vs. Dissonance's
   amber palette — palette itself should already come from `tokens.css`, not be
   hand-set per game).

2. **`EndStateScreen`** — shared shape for Brewfield's `GameOverScreen` and
   Dissonance's still-unbuilt `RunEndPhase`. Both need: a win/loss state, a
   headline, a short flavor line, a stats summary block, and a restart/continue
   action. Building this now means Dissonance's `RunEndPhase` — flagged
   elsewhere as having received zero dedicated design attention all project —
   gets a real, considered shape for free, instead of being built bespoke a
   second time.

3. **`ProgressIndicator`** — shared shape for Brewfield's `MapProgress` and
   Dissonance's `MapPhase` chrome (the visual frame — position markers, current-
   node highlight, connective lines — not the underlying node-graph data itself,
   which stays game-specific per the earlier analysis directive's findings).

For each, build by diffing the two real reference implementations side by side
(Brewfield's + Dissonance's), same method as the prior analysis directive —
extract what's structurally identical, pass what differs as props. Do not design
either template from imagination; both real references already exist.

> ⚠️ RULE: these three are genuine template-level additions to ADR-008's Layer 1
> registry, not game-specific components. Once built, retrofit Brewfield's
> `IntroScreen`/`GameOverScreen`/`MapProgress` and Dissonance's
> `TitlePhase`/`MapPhase` chrome onto them in the same pass as §2.2 — building a
> new shared template and not immediately using it in the two games that
> motivated it would repeat tonight's exact "built, never wired" disease one more
> time.

---

## §3 Test Anchors

| Test name | Target | Behavior |
|---|---|---|
| `test_ui_audit_report_covers_all_games` | audit output | Every game in §1 has a reported compliance status |
| `test_dissonance_title_phase_uses_shared_titlescreen` | TitlePhase.tsx | Imports and renders via the new `TitleScreen` template |
| `test_dissonance_reward_phase_uses_shared_components` | RewardPhase.tsx | Uses `Card`/`Badge`/`Button` from `ts/src/ui/components`, not hand-rolled equivalents |
| `test_brewfield_intro_uses_shared_titlescreen` | Brewfield IntroScreen | Retrofit confirmed |
| `test_brewfield_gameover_uses_shared_endstatescreen` | Brewfield GameOverScreen | Retrofit confirmed |
| `test_titlescreen_renders_with_variable_menu_items` | TitleScreen.tsx | Confirms the template is genuinely parameterized, not hardcoded to one game's menu |
| `test_endstatescreen_renders_win_and_loss_states` | EndStateScreen.tsx | Both states covered |
| `test_progressindicator_renders_generic_node_graph` | ProgressIndicator.tsx | Confirms it accepts arbitrary node/connection data, not Brewfield- or Dissonance-shaped data specifically |

Target: all passing, 0 failing, 0 skipped, on top of the existing 502/201 floor.

---

## §4 Completion Criteria

- [ ] Audit complete and reported for every game in §1
- [ ] Dissonance's built phases retrofitted onto shared components (§2.2.1)
- [ ] Brewfield retrofitted onto shared components (§2.2.2)
- [ ] Three new shared templates (`TitleScreen`, `EndStateScreen`,
      `ProgressIndicator`) built from real diffed references, not imagined
- [ ] Both motivating games (Brewfield, Dissonance) actually use the new
      templates — not just the pre-existing nine components
- [ ] Real floor reported, at or above 502/201 plus this directive's new anchors
- [ ] `docs/state/current.md` updated, and a note added that ADR-008 compliance
      is now real for at least Dissonance and Brewfield, with remaining games'
      status honestly reported (not silently assumed compliant)

---

## §5 Quick Reference

| Fact | Value |
|---|---|
| Governing ADR | ADR-008 (Accepted) — this directive enforces and extends it |
| Existing shared components (already built, confirmed on disk) | `Button`, `Panel`, `StatBar`, `Badge`, `TabBar`, `Card`, `Modal`, `EmptyState`, `ErrorBox` |
| New templates this directive adds | `TitleScreen`, `EndStateScreen`, `ProgressIndicator` |
| Confirmed non-compliant before this directive | Brewfield (`App.tsx`), Dissonance (`TitlePhase.tsx`, `RewardPhase.tsx`) |
| Retrofit priority | Dissonance's built phases → Brewfield → the rest |
| Pre-flight floor | 502 Python / 201 TypeScript |

---

*RFDGameStudio — Shared UI Layer Compliance & Extension Directive | RFD IT Services Ltd. | July 2026*
*If it already exists, reuse it. If it doesn't exist and repeats twice, that's when it gets built.*
