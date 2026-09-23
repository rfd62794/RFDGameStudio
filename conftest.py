"""conftest.py — Auto-marks every collected Python test with a game name or
`shared`, based on the real §2 audit in docs/gdd/TEST_SUITE_CLASSIFICATION.md.

Motivation: as the studio grows past nine games and 800+ combined tests,
running the wrong subset silently (or running one game's tests in
isolation from shared engine coverage) becomes both easier to do and more
expensive to run around blind. This is classification + selective
invocation only — it does not skip anything from a normal, unfiltered
`pytest` run; markers are purely additive.

Per this project's own ADR-005 precedent (shared Lua module changes must
re-verify every real pinned consumer): `scripts/test_scope.py` NEVER runs
a game's tests in isolation from `shared` — always `-m "{game} or shared"`.
"""
from __future__ import annotations

import os

import pytest

# Exact-filename matches -- these test genuinely shared/engine infrastructure
# (studio_mcp tooling, the Lua bridge, the pygame renderer engine, generic
# UI system), even where a few incidentally use one game (often horse_racing)
# as their example fixture. See the classification doc for per-file reasoning
# on every ambiguous case.
SHARED_TEST_FILES = {
    "test_executor.py",
    "test_generic_renderer.py",
    "test_intake.py",
    "test_integration.py",
    "test_loader.py",
    "test_multi_return_detector.py",
    "test_pygame_renderer.py",
    "test_runtime.py",
    "test_scaffold.py",
    "test_shared_lua_primitives.py",
    "test_standalone_build_integrity.py",
    "test_studio_mcp.py",
    "test_studio_promote.py",
    "test_ui_interpreter.py",
    "test_ui_manager.py",
    "test_ui_reconciler.py",
    "test_ui_resolver.py",
    "test_verify.py",
}

# Filename-prefix matches (checked only if the exact filename isn't in
# SHARED_TEST_FILES above) -- real per-game buckets from the §2 audit.
# Order matters only in that longer/more-specific prefixes should be
# listed before shorter ones if a real collision were possible; none exist
# today (no two game names share a common prefix).
GAME_TEST_FILE_PREFIXES = {
    "test_brewfield": "brewfield",
    "test_chimera_wilds": "chimera_wilds",
    "test_dissonance": "dissonance",
    "test_scrapcrawl": "scrapcrawl",
    "test_shoal": "shoal",
    "test_slimeworld": "slimeworld",
    "test_slither_rogue": "slither_rogue",
}


def pytest_collection_modifyitems(items: list[pytest.Item]) -> None:
    for item in items:
        filepath = str(item.fspath)
        filename = os.path.basename(filepath)

        # E2E tests live under tests/e2e/ — always marked e2e + slow,
        # plus the game marker when the filename contains a game prefix.
        if os.sep + "e2e" + os.sep in filepath or "/e2e/" in filepath:
            item.add_marker(pytest.mark.e2e)
            item.add_marker(pytest.mark.slow)
            stem = filename[:-3] if filename.endswith(".py") else filename
            for prefix, game in GAME_TEST_FILE_PREFIXES.items():
                if stem.startswith(prefix):
                    item.add_marker(getattr(pytest.mark, game))
                    break
            else:
                # E2E tests for games whose prefix is embedded differently
                for game_name in GAME_TEST_FILE_PREFIXES.values():
                    if game_name in stem:
                        item.add_marker(getattr(pytest.mark, game_name))
                        break
            continue

        if filename in SHARED_TEST_FILES:
            item.add_marker(pytest.mark.shared)
            continue
        stem = filename[:-3] if filename.endswith(".py") else filename
        for prefix, game in GAME_TEST_FILE_PREFIXES.items():
            if stem.startswith(prefix):
                item.add_marker(getattr(pytest.mark, game))
                break
