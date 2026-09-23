# SlimeWorld -- Directive: Color/Culture/Strain Naming Correction + Canonical Reference

*August 3 2026 | Read fully before executing anything. This directive was
reframed after real investigation -- the original premise ("buildColorSpecs
is broken") was checked and found false; the real problem underneath it
is narrower and different. Read Section 0 fully; it explains why this
directive is a naming/reference fix, not a runtime conversion system.*

---

> STOP: Confirm the real, current test floor before touching anything.
> Note: a test_shoal.py flaky test
> (test_starvation_fires_across_multiple_independent_seeds) was confirmed
> genuinely order/timing-dependent this session -- passes clean in
> isolation, unrelated to SlimeWorld. If it fails again, don't treat it as
> this directive's problem; re-run it alone to confirm before investigating
> further.

---

## Section 0 -- Context: what was actually found, and why the premise changed

The originally-reported bug does not exist. A prior completion report
claimed buildColorSpecs in App.tsx incorrectly keys specs by culture key
instead of color name. Direct source read this session confirms the real,
current code already does specs[color] = ... where color = c['color'] --
correctly keyed by color name. git log on App.tsx confirms nothing has
touched this function in any recent commit. This was a real misdiagnosis
in a prior report, not an active bug -- worth knowing, but not what this
directive fixes.

What IS real, confirmed via direct investigation across both Lua and TS:
there are three parallel naming schemes for the same six real things, and
only one of them is ever actually load-bearing in game logic:

1. Culture keys (ember, marsh, gale, tundra, crystal, tide) -- confirmed
   real in data.yaml's top-level culture entries, and confirmed via broad
   grep to be used ONLY as display names, node-ID prefixes (node_ember),
   and narrative/tutorial text. Never used for real programmatic state
   lookups anywhere.
2. Color names (Red, Orange, Yellow, Green, Purple, Blue, plus Gray as
   the neutral/unclaimed value) -- confirmed to be the ONLY scheme
   actually used for real state: color_specs[a1.color],
   state.culture_relationships[culture] (where culture is, in every real
   call site checked, actually a color value -- favor.culture =
   node.owner_color, and owner_color is confirmed a color name, never a
   culture key), node.pressure[color], etc.
3. "Strain" names (Cinder Strain, Marsh Strain, Gale Strain, Tundra
   Strain, Crystal Strain, Tide Strain, Void Strain) -- confirmed real in
   ts/src/games/slimeworld/gameLogic.ts, a third, separate flavor-text
   layer keyed by color, used for "specialty" display text only.

The real, live risk: favor.culture and state.culture_relationships are
named as if they hold actual culture keys, but every real value that ever
flows through them is a color name. This is exactly the kind of naming
lie that produces false diagnoses (confirmed -- it already did, directly,
in the report that triggered this directive) and is a genuine risk for a
future session, human or agent, reasonably trusting the name over the
actual behavior.

Not in scope, explicitly deferred:
- Building any new runtime conversion function -- there is nothing live
  to convert between; culture keys never reach real game logic today.
- Changing which scheme game logic actually uses (color stays the real,
  functional key -- that's correct and shouldn't change).
- Any change to buildColorSpecs -- confirmed already correct, not touched
  by this directive.
- Any redesign of the Strain-name flavor-text system itself -- this
  directive documents it exists and where it lives, doesn't change it.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| games/slimeworld/favors.lua | Modify (rename only) | Rename culture field/variable to owner_color (or equivalent accurate name) throughout generate_favors, fulfill_favor_via_mediation, and any other function touching it -- confirm every real call site via source read, do not rename blind |
| Wherever state.culture_relationships is defined/typed | Modify (rename only) | Rename to state.color_relationships (or equivalent) -- confirm every real read/write site across both Lua and TS before renaming, this is state that crosses the bridge |
| ts/src/games/slimeworld/types.ts (or wherever the TS-side type lives) | Modify | Matching rename on the TS side of the bridge |
| New: games/slimeworld/naming_reference.lua (or the project's real convention for a shared constants file -- confirm before inventing a new pattern) | New | The real, canonical, documented six-way (culture key / color name / Strain name) reference table -- see Section 2 |
| New, TS equivalent | New | Same table, TS side, single source both directions can point to in documentation/comments even though only color is ever used at runtime |

Read-only -- do not touch: buildColorSpecs (confirmed already correct);
data.yaml's own real culture entries (source of truth, not being
restructured); the Strain-name flavor text itself in gameLogic.ts -- only
documented, not changed.

---

## Section 2 -- Implementation

### The canonical reference table

This is documentation-grade, not a runtime dependency -- nothing in real
game logic should ever need to import and use this table to convert
anything, because color is already the only scheme that matters at
runtime. Its job is purely to give any future human or agent session one
place to check the real mapping instead of reconstructing it from
data.yaml or guessing:

```lua
-- Reference only. Culture keys and Strain names are display/narrative
-- concepts; color is the only scheme with real runtime meaning. Do not
-- import this table into gameplay logic -- if you find yourself needing
-- to convert a culture key or Strain name INTO a color at runtime, stop
-- and ask why culture keys are reaching this code path at all, since
-- they never have before.
CULTURE_COLOR_STRAIN_REFERENCE = {
    {culture = "ember",   color = "Red",    strain = "Cinder Strain"},
    {culture = "marsh",   color = "Orange", strain = "Marsh Strain"},
    {culture = "gale",    color = "Yellow", strain = "Gale Strain"},
    {culture = "tundra",  color = "Green",  strain = "Tundra Strain"},
    {culture = "crystal", color = "Purple", strain = "Crystal Strain"},
    {culture = "tide",    color = "Blue",   strain = "Tide Strain"},
    -- Gray/"Void Strain" is the neutral/unclaimed value, has no culture key
}
```

RULE: Confirm this table's content against the real, current data.yaml
and gameLogic.ts at execution time -- do not trust the example above as
final, re-derive it from the real source since either file may have
changed since this directive was written.

### Renames

RULE: Every rename in Section 1 must be confirmed via real source read at
every call site before changing -- this touches state that crosses the
Lua<->TS bridge, so a missed call site is a real, live bug, not a
cosmetic miss. Grep for the old name after renaming to confirm zero real
references remain (comments/docs are fine to update too, but confirm no
functional code still references the old name).

RULE: This is a rename, not a behavior change. If any test fails after
renaming, the rename touched something it shouldn't have -- fix the
rename, do not fix the test to match new behavior. git diff should show
renamed identifiers, not logic changes.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_no_functional_code_references_old_culture_field_name | Grep-based: confirm zero real (non-comment) references to the old name remain anywhere in .lua/.ts/.tsx |
| test_favor_generation_unchanged_after_rename | Real bridge test: generate a favor before conceptually noting the rename, confirm identical real behavior after -- proves this was purely cosmetic |
| test_culture_relationships_rename_preserves_fealty_threshold_logic | Real bridge test: confirm Fealty threshold logic (100%, FEALTY_THRESHOLD) still works identically post-rename |
| test_reference_table_matches_real_data_yaml | Confirm the six real entries in the new reference table actually match data.yaml's real current culture->color mapping -- catches future drift if data.yaml ever changes and the reference table doesn't |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported, confirm no unexpected
      regressions (the known flaky Shoal test aside, per the
      top-of-directive note)
- [ ] All real call sites of the renamed field(s) confirmed via source
      read, not assumed complete
- [ ] Reference table created, confirmed accurate against real current
      data.yaml/gameLogic.ts at execution time
- [ ] git diff --stat confirms only renames + the new reference file --
      zero logic changes, confirm explicitly
- [ ] Report explicitly: the real, final list of every file/function
      touched by the rename, so this doesn't need re-auditing later

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Original premise | False -- buildColorSpecs is already correct, confirmed via direct source read |
| Real problem found instead | favor.culture/culture_relationships are named as culture keys, actually always hold color values |
| Three real naming schemes, one load-bearing | Culture keys (display only), color names (the only real runtime key), Strain names (flavor text only) |
| This directive builds | A rename + one canonical documentation-grade reference table |
| This directive does NOT build | Any runtime conversion function -- nothing live crosses between schemes today |
| Known unrelated flaky test | test_shoal.py::test_starvation_fires_across_multiple_independent_seeds -- confirmed passes in isolation |
