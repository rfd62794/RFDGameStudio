# SlimeWorld -- Directive: Random Starting Color Foundation

*August 3 2026 | Read fully before executing anything. This is the
foundational piece everything else in tonight's onboarding redesign
depends on -- later directives (post-breed reward, purchase restrictions,
Economy's second-region gate, breeding cost) all assume this exists
first. Get this one right before any of those get written.*

---

> STOP: Confirm the real, current test floor before touching anything.

---

## Section 0 -- Context

Confirmed via direct source read this session: starters currently come
from data.yaml's lab.starter_slimes -- static config, not runtime logic.
INITIAL_ZONES in App.tsx hardcodes zone_cinder (Red) as
isUnlocked: true, all three others (zone_sulphur/Yellow,
zone_abyssal/Blue, zone_jungle/Green) as isUnlocked: false. The Ember
Station opening beat and T1/T2 tutorial text are hardcoded to Red/Ember
specifically ("Ember is your home," "Red Slimes... solidify their
core").

The real, precise design, per Robert directly: at new-game start,
randomly assign ONE color from {Red, Blue, Yellow} -- not all six, not
config-driven, a genuine runtime random pick. Generate two starter
slimes of that color. Only the zone matching that color starts
isUnlocked: true; the other three (including the two starting-pool
colors not picked, plus Green) stay locked. The player is focused
entirely on one zone, one color, until their first successful breed.

Why Red/Blue/Yellow specifically, not all six: these three map to the
lowest-difficulty zones (recommendedLevel 1, 2, 4 respectively) -- Green
sits at level 6, a real, existing difficulty step up. This wasn't
arbitrary; respect it, don't expand the random pool to all four defined
zones.

Real, necessary consequence, not scope creep: since the starting color
is now variable, the hardcoded Red/Ember text in the opening beat and
T1/T2 tutorials will be actively wrong for 2 out of 3 players. This
directive must parameterize that text by the real assigned color -- this
is mechanical templating (swap a hardcoded color/zone name for a
variable), not a creative rewrite. The deeper world-building gap (zero
Dissonance/Echo connection anywhere) stays exactly as deferred before --
don't expand into that here.

Not in scope, explicitly deferred to their own directives, already
identified:
- The post-first-breed reward (2 more Strays, same color) -- real,
  separate follow-up.
- purchase_seed_slime restrictions (color-locked to unlocked regions,
  cooldown) -- real, separate follow-up.
- Economy's gate needing to be the SECOND region specifically, not the
  first -- real, separate correction to already-shipped code.
- Breeding cost after first breed -- real, separate, now-locked follow-up.
- Exactly how long "locked to that associated Region for a bit" lasts
  beyond the first breed -- Robert said "for a bit," not a specific
  duration. Do not invent a number. If this directive needs to make a
  concrete choice about when additional zones open beyond the starting
  one, flag it explicitly as a judgment call requiring confirmation,
  don't silently pick a value.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| ts/src/games/slimeworld/App.tsx -- initialState | Modify | Replace static data.yaml-driven starter color with a real runtime random pick from {Red, Blue, Yellow}; generate 2 starters of that color |
| ts/src/games/slimeworld/App.tsx -- INITIAL_ZONES | Modify | isUnlocked becomes dynamic, keyed to the real assigned starting color, not hardcoded to zone_cinder |
| Ember Station opening beat text (App.tsx) | Modify | Parameterize by the real assigned color -- mechanical templating, not a rewrite |
| ts/src/games/slimeworld/tutorial.ts | Modify | T1/T2 content parameterized by real assigned color, same principle |

Read-only -- do not touch: data.yaml's lab.starter_slimes entry itself
(superseded by runtime logic, but don't delete it without confirming
nothing else reads it); T3 content (already fairly color-agnostic per
earlier read, confirm rather than assume); zone
recommendedLevel/difficulty/reward values.

---

## Section 2 -- Implementation

RULE: The random pick must happen once, at genuine new-game creation,
and then persist as part of real saved state for the rest of that
playthrough -- not re-rolled on every load. Confirm where this value
needs to live in LabState so it survives save/load and Hard Reset
correctly (Hard Reset should trigger a NEW random pick, per what a
brand-new game does -- confirm this composes correctly with the
already-shipped Hard Reset directive).

RULE: Confirm the real, current create_seed_slime call signature before
generating starters -- this session's earlier work already confirmed it
takes (color, pattern, color_specs); reuse that exact pattern, don't
diverge from how starters are currently constructed elsewhere in the
same function.

RULE: isUnlocked for the three non-selected zones among Red/Blue/Yellow,
plus Green, should all be false at start -- only the one real,
randomly-selected match is true. Confirm this against the real, current
INITIAL_ZONES array structure, don't assume the shape.

RULE: For the text parameterization -- read the real, current T1 content
('Ember is your home. Two regions -- Thornward and Abyssal Ember -- lie
within reach...') and the real Ember Station beat text before writing
replacements. Given the starting color is now variable, "Ember"
specifically (which is the Red culture's name) can't stay hardcoded if
the player started Blue or Yellow -- confirm what the real, correct
place-name equivalent is for each of the three colors (likely already
exists somewhere -- Marsh/Gale/Tundra/Crystal/Tide are the other five
culture names confirmed earlier this session; Yellow maps to "Gale,"
Blue maps to "Tide," per the real Genesis Ore mapping already locked in
this project's design history). Do not invent new place names -- use the
ones that already exist.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_starting_color_is_one_of_three_valid_options | Real random pick lands on Red, Blue, or Yellow only -- never Green, never any of the other three colors |
| test_two_starters_match_assigned_color | Both generated starters share the real assigned color |
| test_only_matching_zone_unlocked_at_start | Real check: exactly one zone has isUnlocked: true, and it matches the assigned color; all others false |
| test_starting_color_persists_across_save_load | Real bridge test: save, reload, confirm the same color persisted, not re-rolled |
| test_hard_reset_rerolls_starting_color | Real integration test: Hard Reset produces a fresh random pick, composing correctly with the already-shipped reset directive |
| test_opening_beat_text_matches_assigned_color | The real displayed text references the correct place name for whichever color was actually assigned, not always "Ember" |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] Random pick confirmed genuinely random across real test runs (not
      silently always defaulting to Red)
- [ ] Zone isUnlocked confirmed dynamic and correct for all three
      possible starting colors
- [ ] Text parameterization confirmed correct for all three real place
      names (not just tested against the Red/Ember case)
- [ ] Save/load and Hard Reset composition confirmed via real tests, not
      assumed
- [ ] git diff --stat confirms only the files in Section 1 touched
- [ ] Report explicitly: any place where "for a bit" required a concrete
      decision this directive had to make -- flagged for Robert's review,
      not silently resolved

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Random pool | Red, Blue, Yellow only -- not Green, not all six |
| Why this pool | These three map to the lowest-difficulty zones (level 1/2/4); Green is a real, existing step up (level 6) |
| Real place-name mapping, don't invent new ones | Red->Ember, Yellow->Gale, Blue->Tide |
| This directive is the foundation for | Post-breed reward, purchase restrictions, Economy's second-region gate, breeding cost -- all real, separate follow-ups |
| Explicitly not decided here | Exact duration of "locked to that region for a bit" beyond first breed |
