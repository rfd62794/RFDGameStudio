"""test_studio_mcp.py — Tests for studio_mcp tools (tests 22–35).

Tests call tool functions directly — no HTTP server needed.
"""

from __future__ import annotations

import pytest

from studio_mcp.tools import (
    studio_call,
    studio_get_schema,
    studio_get_systems,
    studio_load_game,
    studio_run_headless,
    studio_validate_game,
    studio_run_tests,
    studio_write_arcade_index,
    studio_write_arcade_page,
    studio_deploy_arcade,
)


# ---------------------------------------------------------------------------
# Test 22
# ---------------------------------------------------------------------------

def test_load_game_returns_session_id() -> None:
    result = studio_load_game("horse_racing")
    assert "session_id" in result
    assert result["game_id"] == "horse_racing"
    assert isinstance(result["session_id"], str)
    assert len(result["session_id"]) > 0


# ---------------------------------------------------------------------------
# Test 23
# ---------------------------------------------------------------------------

def test_load_game_invalid_id_returns_error() -> None:
    result = studio_load_game("game_that_does_not_exist")
    assert "error" in result
    assert "session_id" not in result


# ---------------------------------------------------------------------------
# Test 24
# ---------------------------------------------------------------------------

def test_call_clamp_returns_correct_value() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_call(sid, "clamp", {"val": 5, "min_val": 0, "max_val": 10})
    assert "error" not in result, result.get("error")
    assert result["result"] == 5


# ---------------------------------------------------------------------------
# Test 25
# ---------------------------------------------------------------------------

def test_call_unknown_function_returns_error() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_call(sid, "function_that_does_not_exist")
    assert "error" in result
    assert "result" not in result


# ---------------------------------------------------------------------------
# Test 26
# ---------------------------------------------------------------------------

def test_get_schema_horse_returns_fields() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_get_schema(sid, "horse")
    assert "error" not in result, result.get("error")
    assert result["entity"] == "horse"
    assert "stats" in result["schema"]


# ---------------------------------------------------------------------------
# Test 27
# ---------------------------------------------------------------------------

def test_get_systems_returns_manifest() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    result = studio_get_systems(sid)
    assert "error" not in result, result.get("error")
    assert "systems" in result
    assert isinstance(result["systems"], list)
    assert len(result["systems"]) > 0


# ---------------------------------------------------------------------------
# Test 28
# ---------------------------------------------------------------------------

def test_run_headless_generate_horse_10_iterations() -> None:
    load = studio_load_game("horse_racing", seed=42)
    sid = load["session_id"]
    data = load  # reuse session

    import yaml
    from pathlib import Path
    game_data_path = Path(__file__).parent.parent / "games" / "horse_racing" / "data.yaml"
    game_data = yaml.safe_load(game_data_path.read_text(encoding="utf-8"))

    options = {"min_stat": 25, "max_stat": 65, "generation": 1, "player_owned": False}
    coat_colors = game_data["coat_colors"]
    silk_colors = game_data["silk_colors"]
    prefixes = game_data["name_prefixes"]
    suffixes = game_data["name_suffixes"]

    result = studio_run_headless(
        sid,
        "generate_horse",
        10,
        args={"options": options, "coat_colors": coat_colors,
              "silk_colors": silk_colors, "prefixes": prefixes, "suffixes": suffixes},
        seed_start=1,
    )
    assert "error" not in result, result.get("error")
    assert result["iterations"] == 10
    assert len(result["results"]) == 10


# ---------------------------------------------------------------------------
# Test 29
# ---------------------------------------------------------------------------

def test_studio_validate_game_horse_racing() -> None:
    """studio_validate_game returns valid=True for horse_racing."""
    result = studio_validate_game('horse_racing')
    assert result.get('valid') is True
    assert result.get('game_id') == 'horse_racing'
    issues = result.get('issues', [])
    errors = [i for i in issues if i.get('severity') == 'error']
    assert len(errors) == 0


# ---------------------------------------------------------------------------
# Test 30
# ---------------------------------------------------------------------------

def test_studio_run_tests_returns_structure() -> None:
    """studio_run_tests returns dict with passed/failed keys."""
    result = studio_run_tests(game_id='horse_racing')
    assert 'passed' in result or 'error' in result
    if 'passed' in result:
        assert isinstance(result['passed'], int)
        assert isinstance(result['failed'], int)
        assert 'floor_met' in result


# ---------------------------------------------------------------------------
# Test 31
# ---------------------------------------------------------------------------

def test_write_arcade_index_creates_file(tmp_path, monkeypatch) -> None:
    """studio_write_arcade_index writes _index.md with valid frontmatter."""
    import studio_mcp.tools as tools
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", tmp_path)

    result = studio_write_arcade_index("RFDGameStudio", "Four games, one engine.")

    assert "error" not in result
    index_path = tmp_path / "content" / "games" / "rfdgamestudio" / "_index.md"
    assert index_path.exists()
    text = index_path.read_text(encoding="utf-8")
    assert 'title: "RFDGameStudio"' in text
    assert 'description: "Four games, one engine."' in text


# ---------------------------------------------------------------------------
# Test 32
# ---------------------------------------------------------------------------

def test_write_arcade_page_rejects_unknown_game_id(tmp_path, monkeypatch) -> None:
    """studio_write_arcade_page returns error for unregistered game_id."""
    import studio_mcp.tools as tools
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", tmp_path)

    result = studio_write_arcade_page(
        game_id="not_a_real_game",
        slug="fake-game",
        title="Fake",
        demo_link="/arcade/rfdgamestudio/?game=fake",
    )

    assert "error" in result
    assert "not_a_real_game" in result["error"]
    # No file should have been written
    assert not (tmp_path / "content" / "games" / "rfdgamestudio" / "fake-game.md").exists()


# ---------------------------------------------------------------------------
# Test 33
# ---------------------------------------------------------------------------

def test_write_arcade_page_creates_file_with_demo_link(tmp_path, monkeypatch) -> None:
    """studio_write_arcade_page writes a .md file with demo_link in frontmatter."""
    import studio_mcp.tools as tools
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", tmp_path)

    result = studio_write_arcade_page(
        game_id="horse_racing",
        slug="horse-racing",
        title="Horse Racing",
        demo_link="/arcade/rfdgamestudio/?game=horse_racing",
        engine="Lua + TypeScript",
        controls_hint="Click to bet.",
    )

    assert "error" not in result
    page_path = tmp_path / "content" / "games" / "rfdgamestudio" / "horse-racing.md"
    assert page_path.exists()
    text = page_path.read_text(encoding="utf-8")
    assert 'demo_link: "/arcade/rfdgamestudio/?game=horse_racing"' in text
    assert 'engine: "Lua + TypeScript"' in text
    assert 'controls_hint: "Click to bet."' in text


# ---------------------------------------------------------------------------
# Test 34
# ---------------------------------------------------------------------------

def test_deploy_arcade_errors_without_dist(tmp_path, monkeypatch) -> None:
    """studio_deploy_arcade returns error when ts/dist/ does not exist."""
    import studio_mcp.tools as tools

    # Monkeypatch __file__ parent so dist_dir points to a nonexistent path
    fake_module_dir = tmp_path / "fake_module"
    fake_module_dir.mkdir()
    monkeypatch.setattr(tools, "__file__", str(fake_module_dir / "tools.py"))
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", tmp_path / "site")

    result = studio_deploy_arcade()

    assert "error" in result
    assert "ts/dist/" in result["error"]


# ---------------------------------------------------------------------------
# Test 35
# ---------------------------------------------------------------------------

def test_deploy_arcade_copies_files_when_dist_exists(tmp_path, monkeypatch) -> None:
    """studio_deploy_arcade copies dist/ files and invokes hugo + deploy."""
    from unittest.mock import patch, MagicMock
    import studio_mcp.tools as tools

    # Create a fake dist/ with some files
    fake_module_dir = tmp_path / "fake_module"
    fake_module_dir.mkdir()
    dist_dir = fake_module_dir.parent / "ts" / "dist"
    # __file__ is fake_module/tools.py, so parent.parent is fake_module's parent
    # dist_dir = Path(__file__).parent.parent / "ts" / "dist"
    # = fake_module.parent / "ts" / "dist" = tmp_path / "ts" / "dist"
    dist_dir = tmp_path / "ts" / "dist"
    dist_dir.mkdir(parents=True)
    (dist_dir / "index.html").write_text("<h1>Game</h1>", encoding="utf-8")
    (dist_dir / "assets").mkdir()
    (dist_dir / "assets" / "game.js").write_text("console.log('hi')", encoding="utf-8")

    # Create fake example demo dist/ directories
    for demo_slug in tools._EXAMPLE_DEMOS:
        demo_dist = tmp_path / "examples" / demo_slug / "dist"
        demo_dist.mkdir(parents=True)
        (demo_dist / "index.html").write_text(f"<h1>{demo_slug}</h1>", encoding="utf-8")

    site_repo = tmp_path / "site"
    site_repo.mkdir()
    monkeypatch.setattr(tools, "__file__", str(fake_module_dir / "tools.py"))
    monkeypatch.setattr(tools, "_SITE_REPO_PATH", site_repo)

    # Don't let metadata/verification hit git or the network in this test.
    monkeypatch.setattr(tools, "write_game_metadata", lambda: None)
    monkeypatch.setattr(tools, "verify_arcade_deploy", lambda: {"ok": True, "games": {}})

    mock_build = MagicMock(returncode=0, stdout="", stderr="")
    mock_deploy = MagicMock(returncode=0, stdout="160 files uploaded")

    with patch("subprocess.run", side_effect=[mock_build, mock_deploy]):
        result = studio_deploy_arcade()

    assert "error" not in result
    assert result["copied_files"] >= 2
    assert result["build"]["returncode"] == 0
    assert result["deploy"]["returncode"] == 0
    # Verify files were actually copied
    target = site_repo / "static" / "arcade" / "rfdgamestudio"
    assert (target / "index.html").exists()
    assert (target / "assets" / "game.js").exists()
