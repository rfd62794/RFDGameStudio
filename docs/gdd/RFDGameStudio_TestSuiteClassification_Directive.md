# RFDGameStudio -- Directive: Test Suite Classification + Selective Scoping

*August 2026 | Read fully before executing anything. Motivated directly by
a real incident this session: running the TypeScript suite from the wrong
working directory silently produced a smaller, plausible-looking result (49
tests, 8 "failures") instead of the real one (251 tests, all passing) -- no
error, just a quietly wrong answer. As the studio grows past nine games and
800+ combined tests, this exact failure mode gets both easier to hit and
more expensive to run around blind every time.*

---

> STOP: Confirm the real, current full-suite floor for both stacks before
> touching anything -- Python from the repo root, TypeScript from ts/
> specifically (confirm this is still the correct working directory for
> TS; do not assume it is unchanged from this session).

---

## Section 0 -- Context: the real engineering principle this rests on

This is the same structural truth that governs Rust's own crate/workspace
system, and Bazel/Buck/Nx-style monorepo build graphs generally: a change
to something one unit depends on has to invalidate every real dependent,
while a change isolated to one unit only needs to re-verify that unit.
Splitting Rust crates for build-time reduction works because most crates
are NOT shared dependencies of everything else -- the win comes from
correctly identifying which few things are genuinely load-bearing across
many consumers versus which are leaves.

This project already has a real, documented instance of exactly this
shape: ADR-005's revision on shared Lua modules -- a shared module change
requires re-verifying every real pinned consumer, not just itself, because
the coupling risk is real, not theoretical. This directive's classification
work must respect that same boundary. A test-scoping system that lets
someone skip shared-engine tests while iterating on one game would quietly
defeat a safeguard this project already fought to establish.

Confirmed real state, this session, not assumed:
- Python tests live flat in tests/, mostly already following a clean
  per-game naming convention (test_brewfield.py, test_chimera_wilds.py,
  test_scrapcrawl.py, etc.), genuinely mixed in the same directory with
  real shared-engine tests (test_executor.py, test_runtime.py,
  test_loader.py, test_shared_lua_primitives.py,
  test_multi_return_detector.py, test_intake.py, test_scaffold.py,
  test_generic_renderer.py, test_integration.py, test_pygame_renderer.py
  -- this list is a real starting sample from this session's own partial
  observation, not a claimed-complete inventory; Section 2 requires a full
  audit).
- Zero existing pytest.ini, zero conftest.py, zero marker infrastructure
  anywhere.
- TypeScript tests live under ts/tests/, real examples confirmed this
  session include both clearly SlimeWorld-scoped files
  (test_slime_stage.tsx, test_dispatch_resolution.tsx,
  test_mediation_launch.tsx, test_mission_serialization.tsx,
  test_starter_slime_stats.tsx) and clearly shared/engine files
  (test_multi_return_bridge.ts, test_multi_return_proof.ts -- both
  exercise executor.ts, used by every game, not SlimeWorld-specific).
  Same caveat: real starting sample, not a complete inventory.
- No vitest.config.ts exists in the real ts/ tree (only an unrelated
  example project, examples/scrapcrawl/, has one) -- vitest is running on
  pure auto-discovery defaults right now.

Not in scope, deferred:
- Any workspace/project-splitting restructure (vitest's test.projects, or
  an equivalent pytest plugin) -- heavier, riskier change; this directive
  is classification + selective invocation only, not a build-system
  redesign.
- Retrofitting pytest-testmon or any coverage-based automatic dependency
  tracking -- real, standard tooling, worth naming as a future option, but
  adds an extra dependency and its own real learning curve; not this phase.
- Any change to CI/automated pipelines, if any exist -- this directive is
  about the local, manual iteration loop only.

---

## Section 1 -- Scope Statement

| File | Status | Action |
|---|---|---|
| conftest.py (repo root, new) | New | Auto-apply a marker to each collected Python test based on filename pattern |
| pytest.ini (new) | New | Register all real markers found during the audit, avoid pytest's unknown-marker warnings |
| scripts/test_scope.py (or equivalent -- confirm the project's real convention for small utility scripts) | New | Real, working utility: given a game name, runs pytest -m "{game} or shared" -- never just -m {game} alone |
| A real classification doc (e.g. docs/gdd/TEST_SUITE_CLASSIFICATION.md) | New | The actual audit result -- every existing test file, real bucket assigned, reasoning for anything ambiguous |
| TypeScript: investigate vitest --changed for the real installed version | Investigation, not necessarily code | See Section 2 |

Read-only -- do not touch: No existing test file's actual test logic
changes as part of this directive -- this is classification and tooling
around the existing suite, not a rewrite of it.

---

## Section 2 -- Implementation

### Python -- full audit first, before writing any marker code

```powershell
Get-ChildItem tests -Filter "*.py" | Select-Object Name
```

Classify every real file found (not just the sample list in Section 0)
into exactly one of: a specific game name, or shared. For any file where
the correct bucket is not obvious from the name alone (e.g., a file that
tests something that is arguably both -- a per-game usage of a shared
primitive), open it and check what it actually imports/exercises before
deciding. Report every ambiguous case explicitly in the classification
doc -- do not silently guess.

### conftest.py -- auto-marking, not hand-tagging every test

```python
import pytest
import os

# Real classification -- populated from the Section 2 audit, not guessed.
# Maps filename prefix/pattern -> marker name.
GAME_TEST_FILES = {
    "test_brewfield.py": "brewfield",
    "test_chimera_wilds.py": "chimera_wilds",
    "test_scrapcrawl.py": "scrapcrawl",
    "test_slimeworld": "slimeworld",  # prefix match, multiple real files
    # ... complete this from the real Section 2 audit, not this partial example
}

SHARED_TEST_FILES = {
    "test_executor.py", "test_runtime.py", "test_loader.py",
    "test_shared_lua_primitives.py", "test_multi_return_detector.py",
    "test_intake.py", "test_scaffold.py", "test_generic_renderer.py",
    "test_integration.py", "test_pygame_renderer.py",
    # ... complete this from the real Section 2 audit
}

def pytest_collection_modifyitems(items):
    for item in items:
        filename = os.path.basename(str(item.fspath))
        if filename in SHARED_TEST_FILES:
            item.add_marker(pytest.mark.shared)
            continue
        for pattern, game in GAME_TEST_FILES.items():
            if filename.startswith(pattern.replace(".py", "")):
                item.add_marker(getattr(pytest.mark, game))
                break
```

RULE: This is a starting shape, not the final code -- the real
GAME_TEST_FILES/SHARED_TEST_FILES dictionaries must be populated from the
actual Section 2 audit of every real file, not left as this partial
example. Report the complete, real mapping in the classification doc.

### pytest.ini -- register every real marker used

```ini
[pytest]
markers =
    shared: engine-level tests that must run regardless of which game changed
    brewfield: Brewfield-specific tests
    chimera_wilds: Chimera Wilds-specific tests
    slimeworld: SlimeWorld-specific tests
    ; ... one line per real game found in the audit, not this partial list
```

### scripts/test_scope.py -- the actual selective-run tool

```python
"""Run tests scoped to one game plus the always-required shared suite.
Never runs a game's tests in isolation from shared -- that would silently
skip the exact coverage this project's own ADR-005 already established
as necessary."""
import subprocess
import sys

def main():
    if len(sys.argv) != 2:
        print("Usage: python scripts/test_scope.py <game_name>")
        sys.exit(1)
    game = sys.argv[1]
    subprocess.run(["pytest", "-m", f"{game} or shared", "-v"])

if __name__ == "__main__":
    main()
```

RULE: Confirm the real invocation works against at least two different
real games (not just SlimeWorld) before considering this done -- run
python scripts/test_scope.py brewfield and
python scripts/test_scope.py slimeworld, confirm each produces the
correct, real subset (that game's tests + all shared tests, nothing from
any other game), and paste the real terminal output for both, not just one.

### TypeScript -- investigate before implementing

```powershell
cd ts
Get-Content package.json | Select-String "vitest"
npx vitest --version
```

RULE: Confirm the real installed vitest version, then check its real,
current documentation (not assumed from general knowledge) for the exact
--changed flag syntax and behavior for that version. If it works as
expected (diffs against git, runs only tests whose real import graph
touches what changed), demonstrate it live against a small, real,
reversible change and paste the actual output. If it does NOT work
cleanly for this project's structure, report that honestly and propose
the simpler fallback (directory/glob-based invocation matching the
existing per-game file naming) rather than forcing a tool that does not
fit -- do not spend excessive time fighting a mismatched feature.

---

## Section 3 -- Completion Criteria

- [ ] Full, real audit of every Python test file in tests/, each assigned
      a bucket, every ambiguous case explicitly reasoned through -- not
      just the partial sample list from Section 0
- [ ] conftest.py + pytest.ini real, complete, matching the real audit
- [ ] scripts/test_scope.py (or equivalent) confirmed working against at
      least two different real games, real terminal output pasted for both
- [ ] Full suite still runs clean and unchanged when invoked normally
      (pytest with no marker filter) -- confirm this explicitly; the
      classification must be purely additive, never accidentally exclude
      anything from the real full run
- [ ] TypeScript --changed investigated against the real installed
      version; either demonstrated working with real output, or explicitly
      reported as not viable with a concrete fallback proposed
- [ ] Real classification doc written, complete, not a partial example
- [ ] docs/gdd/SlimeWorld_Design_Rev2.md or an equivalent project-level
      doc gets a short pointer to this new tooling, so a future session
      knows it exists rather than rediscovering the same wrong-directory
      trap this session hit

---

## Section 4 -- Quick Reference

| Fact | Value |
|---|---|
| Motivating incident | Wrong working directory produced a silently smaller, wrong TS result this session |
| The real principle | Same as Rust crate splitting / Bazel build graphs -- shared dependents must always re-verify, isolated units do not |
| Already-established precedent for this rule | This project's own ADR-005 revision on shared Lua modules |
| Confirmed zero existing infrastructure | No markers, no conftest.py, no pytest.ini, no vitest.config.ts in the real tree |
| Never do | Run one game's tests in isolation from shared -- always game or shared, never game alone |
| Explicitly deferred | Workspace/project splitting, pytest-testmon, CI changes |
