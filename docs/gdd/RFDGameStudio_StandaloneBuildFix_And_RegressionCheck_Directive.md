# RFDGameStudio -- Directive: Retroactive Standalone Build Fix + Permanent Regression Check

*August 5 2026 | Read fully before executing anything. This directive
has two real, connected parts: fix the five known-broken games using the
exact pattern already proven tonight on SlimeWorld, then add the one
thing that makes "default standard going forward" actually mean
something rather than "true until someone forgets."*

---

> STOP: Confirm the real, current test floor. Confirm SlimeWorld's fix
> is still in place and working (per tonight's independent verification
> -- 21 real .lua files in dist-slimeworld, CSS at ~125KB) before using
> it as the reference pattern.

---

## Section 0 -- Context: real, confirmed facts, don't re-derive

The correct pattern already exists and has existed since July 28.
studio_scaffold_game (studio_mcp/scaffold.py) generates standalone
entries using import.meta.glob for game Lua files, engine primitives,
and engine systems -- confirmed via direct source read, this was correct
from the moment the tool was created. Any game scaffolded from July 28
onward already has this right.

Six games predate the scaffold tool and were hand-written on July 25,
before the correct pattern existed -- confirmed via git log
--diff-filter=A on each: brewfield, chimera_wilds, mutant_battle_ball,
scrapcrawl, slime_coin, slimeworld, all created at or near
2026-07-25 19:43:02. Of these, slimeworld was fixed tonight. The other
five are confirmed still broken -- verified directly, none contain
import.meta.glob in their real entry.tsx.

The shared infrastructure fixes tonight already cover all games, not
just SlimeWorld:
- copyGameAssetsPlugin in ts/vite.standalone.factory.ts -- copies raw
  game files into any game's build output, already shared, already
  correct for all six.
- The @source directives added to ts/src/index.css -- already shared,
  already fixes the Tailwind scanning gap for all games' standalone
  builds.

This means fixing the five remaining games is narrower than SlimeWorld's
original fix was -- the shared plumbing (file copying, Tailwind
scanning) is already correct studio-wide. What's left is purely
per-game: rewrite each of the five entry.tsx files to use
import.meta.glob, matching the exact real pattern already proven in
ts/src/standalone/slimeworld/entry.tsx.

Not in scope, explicitly deferred:
- Any change to studio_mcp/scaffold.py itself -- already correct,
  confirmed, not touched.
- Any change to copyGameAssetsPlugin or the @source CSS fix -- already
  shared and correct, not touched.
- Any game-specific logic changes beyond the entry-point rewrite.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| ts/src/standalone/brewfield/entry.tsx | Modify | Rewrite using SlimeWorld's proven import.meta.glob pattern |
| ts/src/standalone/chimera_wilds/entry.tsx | Modify | Same |
| ts/src/standalone/mutant_battle_ball/entry.tsx | Modify | Same |
| ts/src/standalone/scrapcrawl/entry.tsx | Modify | Same |
| ts/src/standalone/slime_coin/entry.tsx | Modify | Same |
| New test (location per this project's real convention -- likely tests/test_standalone_build_integrity.py or the TS equivalent, confirm before creating) | New | Real, automated check -- see Section 2b |

Read-only -- do not touch: studio_mcp/scaffold.py,
vite.standalone.factory.ts's copyGameAssetsPlugin, ts/src/index.css's
@source directives -- all already correct, confirmed tonight.

---

## Section 2 -- Implementation

### Section 2a -- Per-game entry.tsx fixes

RULE: Use ts/src/standalone/slimeworld/entry.tsx (already fixed and
independently verified tonight) as the exact reference pattern -- don't
re-derive the glob syntax from scratch per game. The only thing that
changes per game is the gameId and the corresponding import paths.

RULE: Each game's App import and data.yaml/ui.yaml/systems.yaml raw
imports may have real, per-game differences (not every game necessarily
has all three files, or may have additional real files) -- confirm each
game's actual real file set via source read before assuming they all
match SlimeWorld's exact shape. Report any real per-game structural
difference found, don't silently force-fit a pattern that doesn't match.

RULE: For each of the five, rebuild fresh, confirm via real file-count
check (matching tonight's verification method) that the resulting
dist-{gameId} actually contains every expected .lua file plus
data.yaml/ui.yaml/systems.yaml. Don't move to the next game until the
current one is confirmed real and complete.

RULE: HTTP 200 and a successful build exit code are explicitly NOT
sufficient verification, per tonight's own hard lesson. Each of the five
needs a real, functional check -- same standard as SlimeWorld's
Playwright verification -- confirming the game actually loads Lua files
and renders without console errors, not just that files exist on disk.

### Section 2b -- The permanent regression check

This is the real, structural piece that makes the fix durable rather
than a one-time cleanup. Requirements, not a prescribed implementation --
this is a real engineering judgment call for Devin to make and justify:

RULE: The check must verify the actual BUILT output, not just
source-code patterns. A check that greps entry.tsx for the string
import.meta.glob would be faster but weaker -- it could be satisfied by
a glob pattern that's technically present but scoped wrong (e.g.,
globbing the wrong directory), and wouldn't have caught tonight's bug as
reliably as inspecting real build output does. Prefer verifying
dist-{gameId} actually contains the required files after a real build,
even though it costs more (each build takes real wall-clock time,
confirmed ~5-6s for SlimeWorld).

RULE: Given the real cost of rebuilding every game, this check likely
belongs in the "shared"/infrastructure category from this project's own
existing test-classification system (conftest.py's markers,
scripts/test_scope.py) rather than running on every fast local
iteration -- confirm the real, current marker convention and tag this
appropriately. Report the real tradeoff you chose (always-run vs. a
slower/separate pre-publish check) and why, don't silently pick one
without justifying it.

RULE: The check must cover every real game with a standalone entry --
loop over the real, actual contents of ts/src/standalone/, don't
hardcode a list of six game names that will silently stop covering new
games as they're added.

---

## Section 3 -- Test Anchors

| Test name | Behaviour |
|---|---|
| test_brewfield_standalone_build_has_all_lua_files | Real rebuild, real file-count check, matching tonight's SlimeWorld verification method |
| test_chimera_wilds_standalone_build_has_all_lua_files | Same |
| test_mutant_battle_ball_standalone_build_has_all_lua_files | Same |
| test_scrapcrawl_standalone_build_has_all_lua_files | Same |
| test_slime_coin_standalone_build_has_all_lua_files | Same |
| test_all_standalone_games_pass_build_integrity_check | The real, permanent regression check itself -- loops over every real game in ts/src/standalone/, not a hardcoded list |
| test_build_integrity_check_would_have_caught_original_bug | A real, deliberate regression test: temporarily revert one game's entry.tsx to a manual-import pattern, confirm the check fails; restore it, confirm the check passes again. Proves the check actually works, not just that it exists. |

---

## Section 4 -- Completion Criteria

- [ ] Real pre-flight and final floor reported
- [ ] All five games' entry.tsx rewritten, each confirmed via real
      rebuild + real file-count check, not assumed from the pattern
      match alone
- [ ] All five confirmed via real functional check (Playwright or
      equivalent) -- zero console "file not found" errors, actual
      rendering confirmed
- [ ] Any real per-game structural difference from SlimeWorld's pattern
      reported explicitly, not silently forced to fit
- [ ] Permanent regression check built, covers every real game
      dynamically (not a hardcoded list), tagged appropriately in the
      existing test-classification system
- [ ] The regression check's own real effectiveness proven via the
      deliberate-revert test in Section 3 -- not just "the check
      exists," but "the check actually catches the bug it exists to
      catch"
- [ ] git diff --stat confirms only the files in Section 1 touched
- [ ] Report explicitly: real tradeoff chosen for how/when the
      regression check runs, and why

---

## Section 5 -- Quick Reference

| Fact | Value |
|---|---|
| Correct pattern, already proven | ts/src/standalone/slimeworld/entry.tsx, fixed and independently verified tonight |
| Already correct studio-wide, don't touch | scaffold.py (since July 28), copyGameAssetsPlugin, the @source CSS fix |
| Five real, confirmed-broken games | brewfield, chimera_wilds, mutant_battle_ball, scrapcrawl, slime_coin |
| Why they're broken | All predate the scaffold tool by 3 days (created 2026-07-25, tool created 2026-07-28) |
| What makes this permanent, not a one-time fix | A real, build-output-based regression check -- not a source-pattern grep |
| Verification standard | Real functional check, zero console errors -- HTTP 200 and successful build exit code are NOT sufficient |
