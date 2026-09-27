"""test_demos.py — Tests for studio/demos.py.

Everything except the children-index contract test runs against a fixture
tree built under tmp_path — never the real ts/src/games/, which changes
underfoot. The fixture carries two fake demos: one manifest-only (no
folder on disk) and one folder-only (absent from both index files).
"""
from __future__ import annotations

import json
from pathlib import Path

from studio import demos

REPO_ROOT = Path(__file__).resolve().parent.parent


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _config(game_id: str, label: str, status: str = "dev") -> str:
    return (
        "import type { GameConfig } from '../../engine/types';\n"
        "const config: GameConfig = {\n"
        f"  gameId: '{game_id}',\n"
        f"  label: '{label}',\n"
        f"  status: '{status}',\n"
        "};\n"
        "export default config;\n"
    )


def make_repo(tmp_path: Path) -> Path:
    """Fixture repo: `ghost_demo` exists only in the manifest/metadata, and
    `folder_demo` exists only as folders (in neither index)."""
    games = tmp_path / "ts" / "src" / "games"
    _write(games / "arcade-manifest.json", json.dumps({
        "generatedAt": "2026-09-24T00:00:00Z",
        "protocol": "rfd-arcade/1",
        "games": [{
            "gameId": "ghost_demo",
            "label": "Ghost Demo",
            "status": "stable",
            "pipelineStage": "itch_published",
            "tags": [],
            "leaderboards": [],
        }],
        "skipped": [],
    }))
    _write(games / "game-metadata.json", json.dumps({
        "ghost_demo": {
            "created": "2026-01-01T00:00:00-05:00",
            "last_updated": "2026-02-01T00:00:00-05:00",
            "version": "1.0.0",
            "tracked": True,
            "pipeline_stage": "itch_published",
            "deployed_version": "0.1.0",
        },
    }))
    _write(games / "folder_demo" / "config.ts", _config("folder_demo", "Folder Demo", "beta"))
    _write(tmp_path / "games" / "folder_demo" / "data.yaml",
           "game:\n  id: folder_demo\n  name: Folder Demo\n")
    # A shared engine file that must never leak into a demo's path set.
    _write(tmp_path / "ts" / "src" / "engine" / "shared" / "util.ts", "export {};\n")
    # Test files: one name-matched, one matched only by its import of the demo.
    _write(tmp_path / "ts" / "tests" / "test_folder_demo_logic.ts",
           "import { tick } from '../src/games/folder_demo/logic';\n")
    _write(tmp_path / "ts" / "tests" / "test_descriptive_name.ts",
           "import { Sim } from '../src/games/folder_demo/simulation/sim';\n")
    _write(tmp_path / "tests" / "test_folder_demo.py",
           "def test_folder_demo():\n    assert True\n")
    _write(tmp_path / "docs" / "gdd" / "Folder_Demo_Design.md", "# Folder Demo\n")
    return tmp_path


def test_list_demos_sorted_with_fields(tmp_path) -> None:
    root = make_repo(tmp_path)
    found = demos.list_demos(root)
    assert [d.id for d in found] == ["folder_demo", "ghost_demo"]
    by_id = {d.id: d for d in found}

    folder = by_id["folder_demo"]
    assert folder.label == "Folder Demo"          # from config.ts
    assert folder.path == "ts/src/games/folder_demo"
    assert folder.stage == "beta"                 # from config.ts status
    assert folder.published is False              # no pipeline evidence
    assert folder.docs_path == "games/folder_demo"

    ghost = by_id["ghost_demo"]
    assert ghost.label == "Ghost Demo"            # from the manifest
    assert ghost.path == "ts/src/games/ghost_demo"  # canonical, though absent
    assert ghost.stage == "stable"                # manifest status wins
    assert ghost.published is True                # itch_published
    assert ghost.docs_path is None                # no games/<id> folder


def test_demo_paths_are_demo_scoped_only(tmp_path) -> None:
    root = make_repo(tmp_path)
    paths = demos.demo_paths("folder_demo", root)
    assert "ts/src/games/folder_demo" in paths
    assert "games/folder_demo" in paths
    assert "tests/test_folder_demo.py" in paths
    assert "ts/tests/test_folder_demo_logic.ts" in paths
    # matched by content (imports the demo), not by filename
    assert "ts/tests/test_descriptive_name.ts" in paths
    assert "docs/gdd/Folder_Demo_Design.md" in paths
    assert not any("engine" in p for p in paths)
    assert "ts/tests" not in paths  # the shared test dir itself is not a path


def test_demo_check_is_a_vitest_filter_over_real_files(tmp_path) -> None:
    root = make_repo(tmp_path)
    cmd = demos.demo_check("folder_demo", root)
    assert cmd == (
        "cd ts && npx vitest run "
        "tests/test_descriptive_name.ts tests/test_folder_demo_logic.ts"
    )


def test_demo_check_falls_back_to_name_filter(tmp_path) -> None:
    root = make_repo(tmp_path)
    assert demos.demo_check("ghost_demo", root) == "cd ts && npx vitest run test_ghost_demo"


def test_problems_reports_index_and_test_gaps(tmp_path) -> None:
    root = make_repo(tmp_path)
    probs = demos.problems(root)
    assert any("ghost_demo" in p and "folder" in p for p in probs), probs
    assert any("folder_demo" in p and "game-metadata.json" in p for p in probs), probs
    assert any("ghost_demo" in p and "test" in p for p in probs), probs
    assert not any("folder_demo" in p and "test" in p for p in probs), probs


def test_write_children_index_is_byte_stable(tmp_path) -> None:
    root = make_repo(tmp_path)
    first = tmp_path / "a" / "children.json"
    second = tmp_path / "b" / "children.json"
    demos.write_children_index(first, root=root)
    demos.write_children_index(second, root=root)
    assert first.read_bytes() == second.read_bytes()
    payload = json.loads(first.read_text(encoding="utf-8"))
    assert payload["version"] == 1
    assert payload["children"] == [
        {"id": "folder_demo", "path": "ts/src/games/folder_demo", "label": "Folder Demo"},
        {"id": "ghost_demo", "path": "ts/src/games/ghost_demo", "label": "Ghost Demo"},
    ]
    assert first.read_text(encoding="utf-8").endswith("}\n")


def test_children_json_matches_real_repo(tmp_path) -> None:
    regenerated = tmp_path / "children.json"
    demos.write_children_index(regenerated, root=REPO_ROOT)
    committed = REPO_ROOT / "docs" / "children.json"
    assert committed.read_bytes() == regenerated.read_bytes()


def test_real_repo_demos_sorted_and_unique() -> None:
    found = demos.list_demos(REPO_ROOT)
    ids = [d.id for d in found]
    assert ids == sorted(ids)
    assert len(ids) == len(set(ids))
    assert "shoal" in ids


def test_real_repo_problems_are_strings_and_flag_known_gaps() -> None:
    probs = demos.problems(REPO_ROOT)
    assert all(isinstance(p, str) and p for p in probs)
    # early_learning_buddy is deliberately unregistered (config.ts says so):
    # a real folder in no index is exactly what this module exists to surface.
    assert any("early_learning_buddy" in p and "absent from" in p for p in probs)
    assert not any(p.startswith("shoal:") for p in probs)
