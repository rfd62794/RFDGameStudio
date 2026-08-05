"""scripts/test_scope.py — Run tests scoped to one game plus the always-
required shared suite.

Never runs a game's tests in isolation from `shared` -- that would silently
skip the exact coverage this project's own ADR-005 (shared Lua module
revision) already established as necessary: a change to something shared
has to invalidate every real dependent, but iterating on one game's own
tests should never accidentally exclude the shared engine coverage that
game itself depends on.

Usage:
    python scripts/test_scope.py <game_name>
    python scripts/test_scope.py <game_name> --include-e2e

Real game names (see docs/gdd/TEST_SUITE_CLASSIFICATION.md for the full
audit): brewfield, chimera_wilds, dissonance, scrapcrawl, shoal,
slimeworld, slither_rogue.

Note: horse_racing, mutant_battle_ball, and slime_coin have no dedicated
marker -- no test file in tests/ is exclusively theirs (their coverage
lives inside multi-game shared-bucketed files: test_integration.py,
test_shared_lua_primitives.py, test_studio_mcp.py, test_pygame_renderer.py).
Running test_scope.py for one of these names will only run `shared` tests.

By default, E2E tests (marker `e2e`) are excluded from scoped runs
because they require a running dev server. Pass --include-e2e to include
them, or run `pytest -m e2e` directly for a targeted E2E-only run.
"""
from __future__ import annotations

import subprocess
import sys

KNOWN_GAMES = {
    "brewfield", "chimera_wilds", "dissonance", "scrapcrawl",
    "shoal", "slimeworld", "slither_rogue",
}

UNMARKED_GAMES = {"horse_racing", "mutant_battle_ball", "slime_coin"}


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python scripts/test_scope.py <game_name> [--include-e2e]")
        sys.exit(1)

    game = sys.argv[1]
    include_e2e = "--include-e2e" in sys.argv

    if game in UNMARKED_GAMES:
        print(
            f"WARNING: '{game}' has no dedicated test-file marker — its "
            f"coverage lives inside shared-bucketed multi-game files. "
            f"This run will only execute the shared suite."
        )
    elif game not in KNOWN_GAMES:
        print(
            f"WARNING: '{game}' is not a recognized marker in "
            f"docs/gdd/TEST_SUITE_CLASSIFICATION.md — pytest will still "
            f"run this (unknown markers just match nothing), but double "
            f"check the spelling."
        )

    # By default, exclude E2E tests from scoped runs (they need a dev
    # server and are slow). Include them only with --include-e2e.
    marker_expr = f"({game} or shared)"
    if not include_e2e:
        marker_expr += " and not e2e"

    # Use sys.executable -m pytest (not a bare "pytest" on PATH) so this
    # always runs against the same interpreter/environment invoking this
    # script -- the exact "wrong environment produced a silently different
    # result" failure mode this directive exists to prevent.
    result = subprocess.run([sys.executable, "-m", "pytest", "-m", marker_expr, "-v"])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
