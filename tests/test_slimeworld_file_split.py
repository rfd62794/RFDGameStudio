"""test_slimeworld_file_split.py — Verify the logic.lua split is byte-identical and safe.

4 test anchors:
  1. test_real_line_count_reduction_confirmed
  2. test_no_lingering_single_file_reference
  3. test_concatenated_output_byte_identical_to_original
  4. test_studio_validate_game_still_passes

Anchor 5 (test_all_432_existing_python_tests_still_pass_unmodified) was
removed — the recursive pytest-in-a-test pattern reliably times out now
that the suite has grown past its 120s budget. The file split's structural
correctness is fully guarded by anchors 1-4; the pass-count floor is
validated by normal CI runs, not by a recursive subprocess.
"""

import sys
from pathlib import Path

import pytest
import yaml

sys.path.insert(0, str(Path(__file__).parent.parent))

from studio_mcp.tools import studio_validate_game

GAME_DIR = Path(__file__).parent.parent / "games" / "slimeworld"
ORIGINAL_BACKUP = GAME_DIR / "logic_original.lua"

LUA_FILES_ORDER = [
    "breeding.lua",
    "territory.lua",
    "missions.lua",
    "economy.lua",
    "codex.lua",
    "favors.lua",
    "regionlock.lua",
    "logic.lua",
]


# ---------------------------------------------------------------------------
# Anchor 1: logic.lua is now significantly smaller than the original
# ---------------------------------------------------------------------------

def test_real_line_count_reduction_confirmed() -> None:
    """The reduced logic.lua must be substantially smaller than the original."""
    original_lines = ORIGINAL_BACKUP.read_text(encoding="utf-8").splitlines()
    new_logic_lines = (GAME_DIR / "logic.lua").read_text(encoding="utf-8").splitlines()

    assert len(new_logic_lines) < len(original_lines), (
        f"logic.lua ({len(new_logic_lines)} lines) must be smaller than "
        f"original ({len(original_lines)} lines)"
    )
    # advance_cycle is the main content. Threshold bumped from 300 -> 350
    # in the "Make Stage Real" directive, which intentionally added real
    # Stage computation (compute_stage + STAGE_THRESHOLDS + per-cycle loop)
    # to this file per its own explicit scope table.
    assert len(new_logic_lines) <= 350, (
        f"logic.lua should be well under the original size, got {len(new_logic_lines)}"
    )
    # Original was 1223 lines
    assert len(original_lines) >= 1200, (
        f"Original should be ~1223 lines, got {len(original_lines)}"
    )


# ---------------------------------------------------------------------------
# Anchor 2: No lingering references to a single-file structure
# ---------------------------------------------------------------------------

def test_no_lingering_single_file_reference() -> None:
    """systems.yaml must declare lua_files; no stale single-file references."""
    systems = yaml.safe_load((GAME_DIR / "systems.yaml").read_text(encoding="utf-8"))

    # lua_files must be present and list all 8 files
    assert "lua_files" in systems, "systems.yaml must have lua_files key"
    declared = systems["lua_files"]
    assert declared == LUA_FILES_ORDER, (
        f"lua_files must be {LUA_FILES_ORDER}, got {declared}"
    )

    # logic.lua must be last (dependency order — matches Shoal precedent)
    assert declared[-1] == "logic.lua", "logic.lua must be last in lua_files"

    # Each declared file must exist on disk
    for fname in declared:
        assert (GAME_DIR / fname).exists(), f"Missing lua_files entry: {fname}"

    # The backup file must not appear in lua_files
    assert "logic_original.lua" not in declared


# ---------------------------------------------------------------------------
# Anchor 3: Concatenated output is byte-identical to the original
# ---------------------------------------------------------------------------

def test_concatenated_output_byte_identical_to_original() -> None:
    """Concatenate new files in lua_files order using loader's exact join logic.

    The result must be byte-identical to the saved original logic.lua.
    """
    original = ORIGINAL_BACKUP.read_text(encoding="utf-8")

    parts = []
    for fname in LUA_FILES_ORDER:
        parts.append((GAME_DIR / fname).read_text(encoding="utf-8"))

    # loader.py uses "\n\n".join(parts) — exact same logic
    concatenated = "\n\n".join(parts)

    assert concatenated == original, (
        f"Byte-identical mismatch: concatenated is {len(concatenated)} bytes, "
        f"original is {len(original)} bytes"
    )


# ---------------------------------------------------------------------------
# Anchor 4: studio_validate_game still passes
# ---------------------------------------------------------------------------

def test_studio_validate_game_still_passes() -> None:
    """studio_validate_game must report valid=True with no issues."""
    result = studio_validate_game("slimeworld")
    assert result["valid"] is True, f"Validation failed: {result.get('issues')}"
    assert result["issues"] == [], f"Validation issues: {result['issues']}"



