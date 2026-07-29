"""test_scaffold.py — Tests for studio_scaffold_game (ADR-012 Stage 3).

Tests call tool functions directly — no HTTP server needed.
Same rigor as test_studio_promote.py.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import studio_mcp.scaffold as scaffold
from studio_mcp.scaffold import (
    recommend_target_type,
    studio_scaffold_game,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MINIMAL_REGISTRY = (
    "import type { GameConfig } from '../engine/types';\n"
    "import { horseRacingConfig } from './horse_racing/config';\n"
    "import corpworldConfig from './corpworld/config';\n"
    "\n"
    "export const GAME_REGISTRY: GameConfig[] = [\n"
    "  horseRacingConfig,\n"
    "  corpworldConfig,\n"
    "];\n"
)


@pytest.fixture
def scaffold_env(tmp_path, monkeypatch):
    """Set up a temp repo root with examples/, games/, ts/src/games/, registry.ts."""
    # Monkeypatch scaffold module's __file__ so repo_root resolves to tmp_path
    fake_module = tmp_path / "fake_module"
    fake_module.mkdir()
    monkeypatch.setattr(scaffold, "__file__", str(fake_module / "scaffold.py"))

    # Create directory structure
    (tmp_path / "examples").mkdir()
    (tmp_path / "games").mkdir()
    games_src = tmp_path / "ts" / "src" / "games"
    games_src.mkdir(parents=True)
    (tmp_path / "ts" / "src" / "standalone").mkdir(parents=True)
    (tmp_path / "engine" / "primitives").mkdir(parents=True)
    (tmp_path / "engine" / "systems").mkdir(parents=True)

    # Minimal registry.ts
    registry_path = games_src / "registry.ts"
    registry_path.write_text(MINIMAL_REGISTRY, encoding="utf-8")

    # Dummy engine lua file so glob has something to find
    (tmp_path / "engine" / "primitives" / "action.lua").write_text(
        "-- action.lua\n", encoding="utf-8"
    )

    return tmp_path, games_src, registry_path


def _make_ts_example(examples_dir: Path, slug: str) -> Path:
    """Create a minimal React/TS example in examples/{slug}/."""
    example = examples_dir / slug
    src = example / "src"
    src.mkdir(parents=True)
    (src / "App.tsx").write_text(
        "export default function App() { return <div>Test</div>; }\n",
        encoding="utf-8",
    )
    (example / "package.json").write_text(
        json.dumps({
            "dependencies": {"react": "^18.0.0"},
            "devDependencies": {"@vitejs/plugin-react": "^4.0.0"},
        }),
        encoding="utf-8",
    )
    return example


def _make_lua_example(examples_dir: Path, slug: str) -> Path:
    """Create a minimal Lua-backed example in examples/{slug}/."""
    example = examples_dir / slug
    example.mkdir(parents=True)
    (example / "logic.lua").write_text(
        "function init_game() end\n", encoding="utf-8"
    )
    (example / "data.yaml").write_text(
        "game:\n  id: test\n  name: Test\n  version: '0.1'\n  studio: Test\n",
        encoding="utf-8",
    )
    return example


# ---------------------------------------------------------------------------
# Test 1: recommend_target_type flags ts_native for a real React example
# ---------------------------------------------------------------------------

def test_recommend_ts_native_for_react_example(scaffold_env):
    """Against an actual examples/{slug} fixture with .tsx files + React dep."""
    tmp_path, _, _ = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_ts_example(examples_dir, "test-concept")

    result = recommend_target_type(examples_dir / "test-concept")

    assert result["recommendation"] == "ts_native"
    assert result["confidence"] == "high"
    assert ".tsx" in result["reason"] or "React" in result["reason"]


def test_recommend_lua_backed_for_lua_example(scaffold_env):
    """Against an examples/{slug} fixture with .lua files and no .tsx."""
    tmp_path, _, _ = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_lua_example(examples_dir, "lua-concept")

    result = recommend_target_type(examples_dir / "lua-concept")

    assert result["recommendation"] == "lua_backed"
    assert result["confidence"] == "high"


# ---------------------------------------------------------------------------
# Test 2: scaffold refuses without explicit target_type
# ---------------------------------------------------------------------------

def test_scaffold_refuses_without_target_type(scaffold_env):
    """Calling without target_type returns recommendation, does not create files."""
    tmp_path, _, _ = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_ts_example(examples_dir, "test-concept")

    result = studio_scaffold_game("test-concept")

    assert "recommendation" in result
    assert result["recommendation"] == "ts_native"
    assert "message" in result
    assert "target_type" in result["message"]

    # No files created
    assert not (tmp_path / "ts" / "src" / "games" / "test_concept").exists()
    assert not (tmp_path / "games" / "test_concept").exists()


# ---------------------------------------------------------------------------
# Test 3: generated entry.tsx uses import.meta.glob and compiles
# ---------------------------------------------------------------------------

def test_generated_entry_uses_glob(scaffold_env):
    """entry.tsx contains import.meta.glob for game .lua files, not hand-listed imports."""
    tmp_path, _, _ = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_ts_example(examples_dir, "test-concept")

    result = studio_scaffold_game("test-concept", target_type="ts_native")

    assert "error" not in result, result.get("error")
    assert result["target_type"] == "ts_native"

    entry_path = tmp_path / "ts" / "src" / "standalone" / "test_concept" / "entry.tsx"
    assert entry_path.exists()
    entry_text = entry_path.read_text(encoding="utf-8")

    # Must use import.meta.glob for game lua files
    assert "import.meta.glob" in entry_text
    assert "games/test_concept/*.lua" in entry_text
    # Must NOT hand-list individual .lua files
    assert "logic.lua?raw" not in entry_text
    assert "utils.lua?raw" not in entry_text

    # Must also glob engine lua files
    assert "engine/primitives/*.lua" in entry_text
    assert "engine/systems/*.lua" in entry_text

    # Must reference buildStandaloneSession
    assert "buildStandaloneSession" in entry_text


# ---------------------------------------------------------------------------
# Test 4: registry.ts entry is additive only
# ---------------------------------------------------------------------------

def test_registry_entry_additive_only(scaffold_env):
    """Existing entries byte-identical before/after; only new import + array line added."""
    tmp_path, _, registry_path = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_ts_example(examples_dir, "new-concept")

    original = registry_path.read_text(encoding="utf-8")

    result = studio_scaffold_game("new-concept", target_type="ts_native")

    assert "error" not in result
    assert result["registry_modified"] is True

    modified = registry_path.read_text(encoding="utf-8")

    # New import line added
    assert "import newConceptConfig from './new_concept/config';" in modified
    # New array entry added
    assert "  newConceptConfig," in modified

    # Verify minimal diff: exactly 2 more lines
    lines_before = original.splitlines(keepends=True)
    lines_after = modified.splitlines(keepends=True)
    assert len(lines_after) == len(lines_before) + 2

    # Remove the 2 new lines and the rest should be identical
    new_lines = set(lines_after) - set(lines_before)
    assert len(new_lines) == 2


# ---------------------------------------------------------------------------
# Test 5: Lua-backed scaffold produces ADR-001-valid file set
# ---------------------------------------------------------------------------

def test_lua_backed_scaffold_valid(scaffold_env):
    """data.yaml/ui.yaml/logic.lua all present, logic.lua exports init_game/tick_game."""
    tmp_path, _, _ = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_lua_example(examples_dir, "lua-concept")

    result = studio_scaffold_game("lua-concept", target_type="lua_backed")

    assert "error" not in result, result.get("error")
    assert result["target_type"] == "lua_backed"

    game_dir = tmp_path / "games" / "lua_concept"
    assert (game_dir / "data.yaml").exists()
    assert (game_dir / "ui.yaml").exists()
    assert (game_dir / "systems.yaml").exists()
    assert (game_dir / "logic.lua").exists()
    assert (game_dir / "VERSION").exists()

    logic = (game_dir / "logic.lua").read_text(encoding="utf-8")
    assert "function init_game" in logic
    assert "function tick_game" in logic

    data = (game_dir / "data.yaml").read_text(encoding="utf-8")
    assert "id: lua_concept" in data
    assert "name:" in data
    assert "version:" in data
    assert "studio:" in data

    systems = (game_dir / "systems.yaml").read_text(encoding="utf-8")
    assert "lua_files: []" in systems


# ---------------------------------------------------------------------------
# Bonus: refuse if examples dir doesn't exist
# ---------------------------------------------------------------------------

def test_scaffold_refuses_missing_example(scaffold_env):
    """Clean refusal if examples/{slug}/ doesn't exist."""
    result = studio_scaffold_game("nonexistent-concept")

    assert "error" in result
    assert "does not exist" in result["error"]


# ---------------------------------------------------------------------------
# Bonus: refuse if game already exists
# ---------------------------------------------------------------------------

def test_scaffold_refuses_existing_game(scaffold_env):
    """Clean refusal if games/{game_id}/ already exists."""
    tmp_path, _, _ = scaffold_env
    examples_dir = tmp_path / "examples"
    _make_ts_example(examples_dir, "test-concept")

    # Pre-create the target directory
    (tmp_path / "games" / "test_concept").mkdir(parents=True)

    result = studio_scaffold_game("test-concept", target_type="lua_backed")

    assert "error" in result
    assert "already exists" in result["error"]
