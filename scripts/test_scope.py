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

Real game names (see docs/gdd/TEST_SUITE_CLASSIFICATION.md for the full
audit): brewfield, chimera_wilds, dissonance, scrapcrawl, shoal,
slimeworld, slither_rogue.

Note: horse_racing, mutant_battle_ball, and slime_coin have no dedicated
marker -- no test file in tests/ is exclusively theirs (their coverage
lives inside multi-game shared-bucketed files: test_integration.py,
test_shared_lua_primitives.py, test_studio_mcp.py, test_pygame_renderer.py).
Running test_scope.py for one of these names will only run `shared` tests.
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
    if len(sys.argv) != 2:
        print("Usage: python scripts/test_scope.py <game_name>")
        sys.exit(1)

    game = sys.argv[1]
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

    result = subprocess.run(["pytest", "-m", f"{game} or shared", "-v"])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
