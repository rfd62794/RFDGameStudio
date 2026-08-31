"""Tests for import_fixer.pattern_detector — §3 test anchors."""

from __future__ import annotations

import textwrap
from pathlib import Path

from studio_mcp.import_fixer.bound_manifest import BoundEntry
from studio_mcp.import_fixer.pattern_detector import (
    MatchStatus,
    detect_bound_mismatch,
    detect_silent_fallback,
)
from studio_mcp.import_fixer.pattern_catalog import PatternName


# ---------------------------------------------------------------------------
# Pattern 1: bound mismatch
# ---------------------------------------------------------------------------


def test_detect_bound_mismatch_finds_real_planetforge_case(tmp_path: Path) -> None:
    """Scratch copy of slimeEngine.ts with the bound manually reverted to
    [0, 10] should return clean_match against the manifest entry."""
    scratch = tmp_path / "slimeEngine.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            export function clampTier(value: number): number {
              return Math.max(0, Math.min(10, Math.trunc(value)));
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    entries = [
        BoundEntry(
            file=str(scratch).replace("\\", "/"),
            symbol="clampTier",
            locked_min=0,
            locked_max=3,
            source="test",
        )
    ]
    result = detect_bound_mismatch(scratch, manifest_entries=entries)

    assert result.status == MatchStatus.CLEAN_MATCH
    assert result.pattern == PatternName.BOUND_MISMATCH
    assert result.symbol == "clampTier"
    assert result.current_min == 0
    assert result.current_max == 10
    assert result.locked_min == 0
    assert result.locked_max == 3


def test_detect_bound_mismatch_no_manifest_entry_is_no_clean_match(
    tmp_path: Path,
) -> None:
    """A clamp with no manifest entry must return no_clean_match, never a guess."""
    scratch = tmp_path / "file.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            export function clampX(v: number): number {
              return Math.max(0, Math.min(99, Math.trunc(v)));
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    result = detect_bound_mismatch(scratch, manifest_entries=[])

    assert result.status == MatchStatus.NO_CLEAN_MATCH
    assert result.reason is not None
    assert "no manifest entry" in result.reason.lower() or "no clamp" in result.reason.lower()


def test_detect_bound_mismatch_already_correct_is_no_clean_match(
    tmp_path: Path,
) -> None:
    """A clamp that already matches the manifest has nothing to fix."""
    scratch = tmp_path / "file.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            export function clampTier(value: number): number {
              return Math.max(0, Math.min(3, Math.trunc(value)));
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    entries = [
        BoundEntry(
            file=str(scratch).replace("\\", "/"),
            symbol="clampTier",
            locked_min=0,
            locked_max=3,
            source="test",
        )
    ]
    result = detect_bound_mismatch(scratch, manifest_entries=entries)

    assert result.status == MatchStatus.NO_CLEAN_MATCH
    assert "already match" in (result.reason or "").lower()


def test_detect_bound_mismatch_variable_bound_is_ambiguous(tmp_path: Path) -> None:
    """A clamp using a variable instead of a literal is ambiguous."""
    scratch = tmp_path / "file.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            const MAX = 10;
            export function clampTier(value: number): number {
              return Math.max(0, Math.min(MAX, Math.trunc(value)));
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    entries = [
        BoundEntry(
            file=str(scratch).replace("\\", "/"),
            symbol="clampTier",
            locked_min=0,
            locked_max=3,
            source="test",
        )
    ]
    result = detect_bound_mismatch(scratch, manifest_entries=entries)

    assert result.status == MatchStatus.AMBIGUOUS


# ---------------------------------------------------------------------------
# Pattern 2: silent fallback
# ---------------------------------------------------------------------------


def test_detect_silent_fallback_finds_real_pattern(tmp_path: Path) -> None:
    """Synthetic TS fixture matching tonight's real `default: return null` shape."""
    scratch = tmp_path / "switch.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            function handle(x: 'a' | 'b'): number {
              switch (x) {
                case 'a': return 1;
                case 'b': return 2;
                default: return 0;
              }
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    results = detect_silent_fallback(scratch)
    clean = [r for r in results if r.status == MatchStatus.CLEAN_MATCH]

    assert len(clean) == 1
    assert clean[0].pattern == PatternName.SILENT_FALLBACK
    assert "return" in (clean[0].reason or "").lower()


def test_detect_silent_fallback_ignores_logging_default(tmp_path: Path) -> None:
    """A default branch that logs then throws is correct, not a bug."""
    scratch = tmp_path / "switch.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            function handle(x: 'a' | 'b'): number {
              switch (x) {
                case 'a': return 1;
                case 'b': return 2;
                default:
                  console.log('unhandled');
                  throw new Error('unhandled case');
              }
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    results = detect_silent_fallback(scratch)
    clean = [r for r in results if r.status == MatchStatus.CLEAN_MATCH]
    throws = [r for r in results if "throws" in (r.reason or "").lower()]

    assert len(clean) == 0
    assert len(throws) == 1
    assert throws[0].status == MatchStatus.NO_CLEAN_MATCH


def test_detect_silent_fallback_logs_before_return_is_ambiguous(
    tmp_path: Path,
) -> None:
    """A default that logs before returning a value is ambiguous."""
    scratch = tmp_path / "switch.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            function handle(x: 'a' | 'b'): number {
              switch (x) {
                case 'a': return 1;
                case 'b': return 2;
                default:
                  console.log('falling through');
                  return 0;
              }
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    results = detect_silent_fallback(scratch)
    amb = [r for r in results if r.status == MatchStatus.AMBIGUOUS]

    assert len(amb) == 1
    assert "log" in (amb[0].reason or "").lower()
