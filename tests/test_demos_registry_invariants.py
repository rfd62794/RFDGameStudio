# new: Phase 1 D1.2 -- invariants that replace the hand-kept demo_lists_snapshot.json.
"""The demo lists are derived from the registry; these checks keep the registry, examples/ and docs/demos/ consistent."""
import shutil

import pytest

from studio_mcp.demos import registry as reg
from studio_mcp.paths import REPO_ROOT

pytestmark = pytest.mark.skipif(shutil.which("npx") is None, reason="needs Node to export the registry")

GAMES_DIR = REPO_ROOT / "ts" / "src" / "games"
# docs/demos/<id>/SCOPE.md folders for planned demos that have no ts/src/games/<id>/config.ts yet.
# Update this set when one gains a config (the test below then tells you to remove it).
DOCS_ONLY = {"anycreature", "turboshells", "voidrift_station_sim", "voidrift_web_renderer"}


@pytest.fixture(scope="module")
def games():
    return reg.load_registry(refresh=True)


def test_every_example_source_has_a_tracked_folder(games):
    for game in reg.demo_entries(games):
        source = game["source"]
        if source["kind"] == "example":
            package = REPO_ROOT / "examples" / source["slug"] / "package.json"
            assert package.is_file(), f"{game['gameId']}: source slug {source['slug']!r} has no {package.relative_to(REPO_ROOT)}"


def test_demo_slugs_and_static_names_are_one_to_one(games):
    names = reg.demo_static_names(games)
    assert len(set(names.values())) == len(names), names
    assert list(names) == reg.example_demos(games)


def test_every_scope_file_belongs_to_a_game_folder_or_the_planned_list():
    folders = {p.parent.name for p in GAMES_DIR.glob("*/config.ts")}
    scoped = {p.parent.name for p in (REPO_ROOT / "docs" / "demos").glob("*/SCOPE.md")}
    assert scoped - folders == DOCS_ONLY
