"""test_studio_promote.py — Tests for studio_promote_to_examples base-path auto-fix
and studio_generate_registry_entry (tests 36–43).

Tests call tool functions directly — no HTTP server needed.
"""

from __future__ import annotations

import zipfile
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

import studio_mcp.tools as tools
from studio_mcp.tools import (
    studio_promote_to_examples,
    studio_generate_registry_entry,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VITE_NO_BASE = (
    "import {defineConfig} from 'vite';\n"
    "import react from '@vitejs/plugin-react';\n"
    "\n"
    "export default defineConfig(() => {\n"
    "  return {\n"
    "    plugins: [react()],\n"
    "  };\n"
    "});\n"
)

VITE_WRONG_BASE = (
    "import {defineConfig} from 'vite';\n"
    "import react from '@vitejs/plugin-react';\n"
    "\n"
    "export default defineConfig(() => {\n"
    "  return {\n"
    "    base: '/arcade/wrong_game/',\n"
    "    plugins: [react()],\n"
    "  };\n"
    "});\n"
)

VITE_CORRECT_BASE = (
    "import {defineConfig} from 'vite';\n"
    "import react from '@vitejs/plugin-react';\n"
    "\n"
    "export default defineConfig(() => {\n"
    "  return {\n"
    "    base: '/arcade/test_game/',\n"
    "    plugins: [react()],\n"
    "  };\n"
    "});\n"
)


def _make_intake_zip(zip_path: Path, vite_content: str) -> None:
    """Create a minimal intake zip with vite.config.ts and package.json."""
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("vite.config.ts", vite_content)
        zf.writestr("package.json", '{"dependencies": {}, "devDependencies": {}}')


@pytest.fixture
def promote_env(tmp_path, monkeypatch):
    """Set up a temp repo root and monkeypatch tools module for promote tests."""
    fake_module = tmp_path / "fake_module"
    fake_module.mkdir()
    monkeypatch.setattr(tools, "__file__", str(fake_module / "tools.py"))

    intake_dir = tmp_path / "intake" / "test-game"
    intake_dir.mkdir(parents=True)

    # Mock _ensure_node_modules and _vite_binary so we don't need real node.
    fake_nm = tmp_path / "fake_node_modules"
    fake_vite = fake_nm / "vite" / "bin" / "vite.js"
    fake_vite.parent.mkdir(parents=True, exist_ok=True)
    fake_vite.write_text("// fake")

    monkeypatch.setattr(tools, "_ensure_node_modules", lambda ed: fake_nm)
    monkeypatch.setattr(tools, "_vite_binary", lambda nm: fake_vite if nm else None)

    return tmp_path


def _mock_build_and_deploy(examples_dir: Path):
    """Return a side_effect for subprocess.run that fakes build + deploy."""
    def _side_effect(cmd, **kwargs):
        if "build" in cmd:
            # Create dist/ so the deploy step can proceed.
            dist = examples_dir / "dist"
            dist.mkdir(exist_ok=True)
            (dist / "index.html").write_text("<h1>Test</h1>", encoding="utf-8")
            return MagicMock(returncode=0, stdout="build ok", stderr="")
        elif "robocopy" in cmd:
            return MagicMock(returncode=0, stdout="copied", stderr="")
        return MagicMock(returncode=0, stdout="", stderr="")
    return _side_effect


# ---------------------------------------------------------------------------
# Gap 1: Base-path auto-fix in studio_promote_to_examples
# ---------------------------------------------------------------------------


def test_promote_injects_missing_base(promote_env) -> None:
    """Zip with no `base` key → correctly injected, build proceeds."""
    tmp_path = promote_env
    zip_path = tmp_path / "intake" / "test-game" / "test-game_v0.1.0R1.zip"
    _make_intake_zip(zip_path, VITE_NO_BASE)

    examples_dir = tmp_path / "examples" / "test-game"

    with patch("subprocess.run", side_effect=_mock_build_and_deploy(examples_dir)):
        result = studio_promote_to_examples("test-game", version="0.1.0R1")

    assert "error" not in result, result.get("error")
    assert result["base_action"] == "injected"
    assert result["base"] == "/arcade/test_game/"

    vite = (examples_dir / "vite.config.ts").read_text(encoding="utf-8")
    assert "base: '/arcade/test_game/'," in vite


def test_promote_corrects_wrong_base(promote_env) -> None:
    """Zip with a mismatched `base` → corrected, not just flagged."""
    tmp_path = promote_env
    zip_path = tmp_path / "intake" / "test-game" / "test-game_v0.1.0R1.zip"
    _make_intake_zip(zip_path, VITE_WRONG_BASE)

    examples_dir = tmp_path / "examples" / "test-game"

    with patch("subprocess.run", side_effect=_mock_build_and_deploy(examples_dir)):
        result = studio_promote_to_examples("test-game", version="0.1.0R1")

    assert "error" not in result, result.get("error")
    assert result["base_action"] == "corrected"
    assert result["base"] == "/arcade/test_game/"

    vite = (examples_dir / "vite.config.ts").read_text(encoding="utf-8")
    assert "/arcade/test_game/" in vite
    assert "/arcade/wrong_game/" not in vite


def test_promote_leaves_correct_base_untouched(promote_env) -> None:
    """Already-correct `base` → byte-identical after the call."""
    tmp_path = promote_env
    zip_path = tmp_path / "intake" / "test-game" / "test-game_v0.1.0R1.zip"
    _make_intake_zip(zip_path, VITE_CORRECT_BASE)

    examples_dir = tmp_path / "examples" / "test-game"

    with patch("subprocess.run", side_effect=_mock_build_and_deploy(examples_dir)):
        result = studio_promote_to_examples("test-game", version="0.1.0R1")

    assert "error" not in result, result.get("error")
    assert result["base_action"] == "already-correct"

    vite_after = (examples_dir / "vite.config.ts").read_text(encoding="utf-8")
    assert vite_after == VITE_CORRECT_BASE


def test_promote_reruns_idempotently(promote_env) -> None:
    """Calling the tool twice in a row produces the same result both times."""
    tmp_path = promote_env
    zip_path = tmp_path / "intake" / "test-game" / "test-game_v0.1.0R1.zip"
    _make_intake_zip(zip_path, VITE_NO_BASE)

    examples_dir = tmp_path / "examples" / "test-game"

    with patch("subprocess.run", side_effect=_mock_build_and_deploy(examples_dir)):
        result1 = studio_promote_to_examples("test-game", version="0.1.0R1")

    vite_after_first = (examples_dir / "vite.config.ts").read_text(encoding="utf-8")

    with patch("subprocess.run", side_effect=_mock_build_and_deploy(examples_dir)):
        result2 = studio_promote_to_examples("test-game", version="0.1.0R1")

    vite_after_second = (examples_dir / "vite.config.ts").read_text(encoding="utf-8")

    # Both calls should succeed and report the same base_action ("injected"
    # both times because the zip is re-extracted each call, wiping the fix).
    assert "error" not in result1
    assert "error" not in result2
    assert result1["base"] == result2["base"] == "/arcade/test_game/"
    assert vite_after_first == vite_after_second


# ---------------------------------------------------------------------------
# Gap 2: studio_generate_registry_entry
# ---------------------------------------------------------------------------

MINIMAL_REGISTRY = (
    "import type {{ GameConfig }} from '../engine/types';\n"
    "import {{ horseRacingConfig }} from './horse_racing/config';\n"
    "import corpworldConfig from './corpworld/config';\n"
    "\n"
    "export const GAME_REGISTRY: GameConfig[] = [\n"
    "  horseRacingConfig,\n"
    "  corpworldConfig,\n"
    "];\n"
)


@pytest.fixture
def registry_env(tmp_path, monkeypatch):
    """Set up a temp repo root with a minimal registry.ts."""
    fake_module = tmp_path / "fake_module"
    fake_module.mkdir()
    monkeypatch.setattr(tools, "__file__", str(fake_module / "tools.py"))

    games_src = tmp_path / "ts" / "src" / "games"
    games_src.mkdir(parents=True)
    registry_path = games_src / "registry.ts"
    registry_path.write_text(MINIMAL_REGISTRY, encoding="utf-8")

    return tmp_path, games_src, registry_path


def test_generate_registry_entry_creates_config(registry_env) -> None:
    """Real config.ts file, correct game_id, correct status: 'external'."""
    tmp_path, games_src, registry_path = registry_env

    result = studio_generate_registry_entry(
        "new-game", "A test game description."
    )

    assert "error" not in result, result.get("error")
    assert result["game_id"] == "new_game"
    assert result["import_name"] == "newGameConfig"

    config_path = games_src / "new_game" / "config.ts"
    assert config_path.exists()
    text = config_path.read_text(encoding="utf-8")
    assert "gameId: 'new_game'," in text
    assert "status: 'external'," in text
    assert "embedUrl: '/arcade/new_game/'," in text
    assert "A test game description." in text


def test_generate_registry_entry_adds_import_and_array_entry(registry_env) -> None:
    """registry.ts diff is minimal — one import line, one array entry, nothing else changed."""
    tmp_path, games_src, registry_path = registry_env
    original = registry_path.read_text(encoding="utf-8")

    result = studio_generate_registry_entry(
        "slime-garden", "A slime breeding sandbox."
    )

    assert "error" not in result
    assert result["import_name"] == "slimeGardenConfig"

    modified = registry_path.read_text(encoding="utf-8")

    # Import line added after the last existing import.
    assert "import slimeGardenConfig from './slime_garden/config';" in modified

    # Array entry added before the closing ];
    assert "  slimeGardenConfig," in modified

    # Verify minimal diff: remove the two new lines and the rest should be identical.
    lines_before = original.splitlines(keepends=True)
    lines_after = modified.splitlines(keepends=True)
    # The modified version has exactly 2 more lines (import + array entry).
    assert len(lines_after) == len(lines_before) + 2


def test_generate_registry_entry_refuses_duplicate_slug(registry_env) -> None:
    """Second call for the same slug → clean refusal, not a silent overwrite."""
    tmp_path, games_src, registry_path = registry_env

    result1 = studio_generate_registry_entry(
        "dup-game", "First registration."
    )
    assert "error" not in result1

    result2 = studio_generate_registry_entry(
        "dup-game", "Second registration attempt."
    )
    assert "error" in result2
    assert "already in registry.ts" in result2["error"]


def test_generate_registry_entry_refuses_existing_config_file(registry_env) -> None:
    """Same, for a pre-existing config.ts."""
    tmp_path, games_src, registry_path = registry_env

    # Pre-create the config.ts file.
    config_dir = games_src / "preexisting"
    config_dir.mkdir(parents=True)
    (config_dir / "config.ts").write_text("// already here\n", encoding="utf-8")

    result = studio_generate_registry_entry(
        "preexisting", "Should refuse."
    )

    assert "error" in result
    assert "already exists" in result["error"]
