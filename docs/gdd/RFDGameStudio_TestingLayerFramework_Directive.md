# RFDGameStudio -- Directive: Formalize the Testing Layer Framework

*August 5 2026 | Read fully before executing anything. This directive
formalizes what's mostly already real -- it does not build a testing
framework from scratch. Confirmed via source read: no tests/e2e/
directory or permanent .spec.ts file exists anywhere in the project --
whatever Playwright check just validated the first-breed fix was
ad-hoc, matching the framework proposal's own honest table entry
("Temporary scripts + Playwright"). That's the one real gap this
directive closes carefully -- the rest is connecting things that
already work.*

---

> STOP: Confirm the real, current test floor (Python + TypeScript)
> before touching anything. Confirm the SlimeWorld first-breed fix
> (startingTargetRegentForColor, targetRegentInventory seeding) is
> still in place and the 313 TS tests still pass -- this directive
> builds on top of that work, not instead of it.

---

## Section 0 -- Context: real current state of each layer, don't re-derive

| Layer | Real current state |
|---|---|
| L1/L2 (data/bridge invariants, component wiring) | Already real, already the de facto pattern across ts/tests/*.tsx -- confirmed via this whole week's work. Not built here -- named and lightly formalized. |
| L3 (headless playthrough smoke tests) | The real gap. Confirmed via direct search: zero permanent E2E test files exist anywhere. The check that validated tonight's first-breed fix was real but ad-hoc, not saved. |
| L4 (standalone build integrity) | Already real, already proven tonight on all 7 real standalone games, including a working deliberate-revert regression test. Not touched here -- referenced. |
| L5 (deploy verification) | Already real -- studio_mcp/verify.py's Tier-1/Tier-2 checks, already used successfully for the real SlimeWorld and website deploys this week. Not touched here -- referenced. |

The real, deliberate sequencing for this directive, not negotiable:
formalize the one real, already-validated SlimeWorld E2E flow (first
breed -> region unlock -> Missions/Economy tabs appear) as a permanent
test FIRST. Only after that's real and passing, apply the identical
pattern to exactly ONE additional game, as genuine validation that the
pattern generalizes -- not as a green light to roll it out everywhere.
Do not add data-testid hooks across every interactive element in every
game as part of this directive -- that's real, larger, ongoing
infrastructure cost that hasn't been earned yet by evidence beyond this
one case.

Not in scope, explicitly deferred:
- Blanket data-testid coverage across all games -- deferred until the
  two-game validation (SlimeWorld + one more) proves the pattern is
  worth the maintenance cost.
- Any change to test_standalone_build_integrity.py (L4) or
  studio_mcp/verify.py (L5) -- both already correct, referenced not
  modified.
- CI pipeline configuration itself -- the marker taxonomy work here
  should make a future CI setup straightforward, but wiring actual CI is
  separate, real, future work.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| tests/e2e/test_slimeworld_first_breed_unlock.spec.ts (or the project's real, correct convention -- confirm location before creating) | New | The permanent version of the real, already-validated ad-hoc check |
| ts/src/games/slimeworld/App.tsx and relevant components (RosterTab, MissionsTab, etc.) | Modify (narrow) | Add the minimum real data-testid hooks actually needed for THIS ONE flow -- begin/splicing/pick-starters/hatch/tab-visibility. Nothing beyond what this specific test touches. |
| One additional real game's equivalent flow (choice justified, not arbitrary -- see Section 2) | New | Second permanent E2E test, proving the pattern generalizes |
| ts/tests/_shared/ (or the project's real convention for shared test helpers -- confirm before creating) | New | createStarterPair(), expectBridgeField(), and equivalent L1/L2 shared fixtures -- formalizing patterns already used ad-hoc across existing tests |
| conftest.py / scripts/test_scope.py | Modify (narrow) | Extend the existing, real marker taxonomy to cleanly cover the new E2E layer alongside shared/slow |
| New: a real framework doc (e.g., docs/gdd/TESTING_LAYERS.md) | New | Documents L1-L5, what's real today, what's deliberately deferred, and why -- the actual deliverable that makes this "formalized" rather than tribal knowledge |

Read-only -- do not touch: test_standalone_build_integrity.py,
studio_mcp/verify.py, the first-breed fix itself
(startingTargetRegentForColor, etc.) -- confirmed correct, referenced
only.

---

## Section 2 -- Implementation

RULE: The permanent SlimeWorld E2E test must cover the real, full flow
already validated ad-hoc: Begin -> pick two starters -> Hatch -> confirm
Missions/Economy tabs appear. Match the real, already-proven outcome --
don't re-derive the flow from scratch, formalize what already worked.

RULE: data-testid additions must be scoped to exactly what this one test
needs to click/read -- not a speculative "let's add hooks everywhere
while we're in here." If a future test needs more hooks, that's a
future directive's job.

RULE: Choosing the second game for validation is a real decision --
justify it explicitly, don't pick arbitrarily. A reasonable real
criterion: pick a game with a genuinely different core loop shape than
SlimeWorld's breed-and-unlock structure, so the pattern is proven to
generalize across real variation, not just copy-pasted onto something
structurally identical. Report the real reasoning for whichever game
gets chosen.

RULE: Deterministic random seed overrides (Math.random/Lua
math.randomseed) should be added narrowly, scoped to what the new E2E
and any L1 tests actually need -- not a sweeping, unscoped RNG refactor
across the whole codebase.

RULE: The framework doc (Section 1's last row) must accurately state
what's real today versus deferred -- do not write it as if blanket
data-testid/E2E coverage already exists or is already decided; reflect
the real, current, deliberately-narrow scope of this directive.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_slimeworld_first_breed_to_missions_unlock (E2E) | The real, permanent version of tonight's ad-hoc validation -- full flow, real browser, real assertions on tab visibility |
| Second game's equivalent E2E test | Proves the pattern generalizes to a structurally different game |
| test_shared_fixtures_produce_valid_starter_pairs | Confirms the new L1/L2 shared helpers actually work correctly, not just that they exist |
| test_marker_taxonomy_covers_e2e_layer | Confirms pytest -m "not slow" correctly excludes the new E2E tests from fast local runs, and a full/pre-publish run correctly includes them |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] SlimeWorld's E2E flow formalized as a real, permanent, passing
      test -- not just confirmed working ad-hoc
- [ ] Exactly one additional game's equivalent flow formalized, with the
      choice of game explicitly justified
- [ ] data-testid additions confirmed scoped to only what these two
      tests actually need -- report the real, complete list added,
      don't let it silently expand
- [ ] Shared L1/L2 fixtures created and confirmed working via their own
      real tests
- [ ] Marker taxonomy extended, confirmed via real test-scope runs
- [ ] Framework doc written, accurately reflecting real-today vs.
      deliberately-deferred scope
- [ ] git diff --stat confirms only files in Section 1 touched --
      explicitly confirm test_standalone_build_integrity.py and
      verify.py were NOT modified
- [ ] Report explicitly: real, honest recommendation on whether the
      two-game validation actually justifies broader data-testid
      rollout -- don't assume the answer, report what was actually found

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| What's already real, not built here | L1/L2 patterns, L4 (proven on 7 games), L5 |
| The one real gap this closes | L3 -- permanent E2E tests didn't exist before this directive |
| Real, deliberate limit | Exactly 2 games get E2E coverage from this directive -- SlimeWorld + one justified choice, not a blanket rollout |
| Explicitly deferred | data-testid everywhere, CI pipeline wiring, any change to L4/L5's own already-correct code |
| Real deliverable proving this was "formalized" | docs/gdd/TESTING_LAYERS.md, accurately reflecting real vs. deferred scope |
