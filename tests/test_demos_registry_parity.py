"""Parity: the derived lists reproduce the hand-kept lists they replace (spec §4 migration)."""
import json
import shutil
from pathlib import Path

import pytest

from studio_mcp.demos import registry as reg
from studio_mcp.paths import REPO_ROOT

SNAP = json.loads((Path(__file__).parent / "fixtures" / "demo_lists_snapshot.json").read_text(encoding="utf-8"))
# Snapshot entries intentionally not reproduced, with the reason.
DROPPED = {"brewfield": "not in GAME_REGISTRY (superseded by Dissonance Depths)"}

pytestmark = pytest.mark.skipif(shutil.which("npx") is None, reason="needs Node to export the registry")


@pytest.fixture(scope="module")
def games():
    return reg.load_registry(refresh=True)


def test_deploy_list_matches(games):
    # Order within the demo deploy loop does not matter (each copies to its own folder).
    assert sorted(reg.example_demos(games)) == sorted(SNAP["example_demos"])


def test_static_names_match_for_every_deployed_demo(games):
    expected = {k: v for k, v in SNAP["demo_static_name"].items() if k in SNAP["example_demos"]}
    assert reg.demo_static_names(games) == expected


def test_external_paths_match(games):
    assert {k: v.name for k, v in reg.external_demo_paths(games).items()} == SNAP["demo_external_paths"]
    assert {k: v.name for k, v in reg.external_repos(games).items()} == SNAP["external_repos"]


def test_game_paths_cover_every_old_path(games):
    derived = reg.game_paths(games, REPO_ROOT)
    for game_id, old in SNAP["game_paths"].items():
        if game_id in DROPPED:
            assert game_id not in derived
            continue
        missing = set(old) - set(derived[game_id])
        assert not missing, f"{game_id}: derived paths lack {missing}"
