"""Tests for import_fixer.pattern_detector — §3 test anchors."""

from __future__ import annotations

import subprocess
import textwrap
from pathlib import Path

from studio_mcp.import_fixer.bound_manifest import BoundEntry
from studio_mcp.import_fixer.pattern_detector import (
    MatchStatus,
    detect_bound_mismatch,
    detect_silent_fallback,
    detect_untracked_registry_source,
    detect_mislabeled_add_claim,
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


def test_detect_silent_fallback_excludes_defensive_noop(tmp_path: Path) -> None:
    """A `default: return <param>` that returns the caller's own input
    unchanged is a defensive no-op at a type boundary, not a silent
    fallback. Must be classified no_clean_match, not clean_match.

    This is the real playerAdapter.ts:96 case: mapInjuryToStatus has
    `default: return current` where `current` is the function's second
    parameter — preserving existing state on an unrecognized input,
    not discarding information.
    """
    scratch = tmp_path / "bridge.ts"
    scratch.write_text(
        textwrap.dedent(
            """
            function mapInjuryToStatus(injury: string, current: string): string {
              switch (injury) {
                case 'none': return 'active';
                case 'stunned': return 'stunned';
                case 'down': return 'down';
                case 'casualty': return current === 'subbed' ? 'subbed' : 'down';
                case 'fatal': return 'down';
                default: return current;
              }
            }
            """
        ).strip(),
        encoding="utf-8",
    )
    results = detect_silent_fallback(scratch)
    clean = [r for r in results if r.status == MatchStatus.CLEAN_MATCH]
    defensive = [
        r
        for r in results
        if r.status == MatchStatus.NO_CLEAN_MATCH and "defensive" in (r.reason or "").lower()
    ]

    assert len(clean) == 0
    assert len(defensive) == 1
    assert "current" in (defensive[0].reason or "")


# ---------------------------------------------------------------------------
# Pattern 3: untracked registry source
# ---------------------------------------------------------------------------

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_detect_untracked_registry_source_finds_scratch_reverted_case(
    tmp_path: Path,
) -> None:
    """Scratch git repo with examples/planetforge/ copied but removed from
    the index — simulating pre-fix state. Should return clean_match."""
    scratch_repo = tmp_path / "repo"
    scratch_repo.mkdir()
    subprocess.run(["git", "init"], cwd=scratch_repo, capture_output=True)

    examples_dir = scratch_repo / "examples" / "planetforge" / "src"
    examples_dir.mkdir(parents=True)
    (examples_dir / "engine.ts").write_text("export const x = 1;\n", encoding="utf-8")

    ts_dir = scratch_repo / "ts" / "src" / "games" / "planetforge"
    ts_dir.mkdir(parents=True)
    (ts_dir / "config.ts").write_text("export const gameId = 'planetforge';\n", encoding="utf-8")

    subprocess.run(["git", "add", "ts/src/games/planetforge/config.ts"], cwd=scratch_repo, capture_output=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=scratch_repo, capture_output=True)

    result = detect_untracked_registry_source("planetforge", repo_root=scratch_repo)

    assert result.status == MatchStatus.CLEAN_MATCH
    assert result.pattern == PatternName.UNTRACKED_REGISTRY_SOURCE
    assert "planetforge" in (result.symbol or "")


def test_detect_untracked_registry_source_zip_source_is_no_clean_match() -> None:
    """Real corpworld has an intake zip — untracked examples/ is expected."""
    result = detect_untracked_registry_source("corpworld", repo_root=REPO_ROOT)

    assert result.status == MatchStatus.NO_CLEAN_MATCH
    assert "zip" in (result.reason or "").lower()


def test_detect_untracked_registry_source_properly_ported_is_no_clean_match() -> None:
    """Real succession has many tracked files in ts/src/games/ — properly ported."""
    result = detect_untracked_registry_source("succession", repo_root=REPO_ROOT)

    assert result.status == MatchStatus.NO_CLEAN_MATCH
    assert "ported" in (result.reason or "").lower() or "tracked" in (result.reason or "").lower()


def test_detect_untracked_registry_source_multiple_candidates_is_ambiguous(
    tmp_path: Path,
) -> None:
    """Two untracked candidate dirs matching the same slug → ambiguous."""
    scratch_repo = tmp_path / "repo"
    scratch_repo.mkdir()
    subprocess.run(["git", "init"], cwd=scratch_repo, capture_output=True)

    # Two dirs that both match slug "fakegame" via different variants.
    d1 = scratch_repo / "examples" / "fakegame"
    d1.mkdir(parents=True)
    (d1 / "src").mkdir()
    (d1 / "src" / "a.ts").write_text("export const x = 1;\n", encoding="utf-8")

    d2 = scratch_repo / "examples" / "fake-game"
    d2.mkdir(parents=True)
    (d2 / "src").mkdir()
    (d2 / "src" / "b.ts").write_text("export const x = 1;\n", encoding="utf-8")

    ts_dir = scratch_repo / "ts" / "src" / "games" / "fakegame"
    ts_dir.mkdir(parents=True)
    (ts_dir / "config.ts").write_text("export const gameId = 'fakegame';\n", encoding="utf-8")
    subprocess.run(["git", "add", "ts/src/games/fakegame/config.ts"], cwd=scratch_repo, capture_output=True)
    subprocess.run(["git", "commit", "-m", "init"], cwd=scratch_repo, capture_output=True)

    result = detect_untracked_registry_source("fakegame", repo_root=scratch_repo)

    assert result.status == MatchStatus.AMBIGUOUS
    assert "Multiple" in (result.reason or "")


# ---------------------------------------------------------------------------
# Pattern 4: mislabeled add claim
# ---------------------------------------------------------------------------

def test_detect_mislabeled_add_claim_real_4b05c02_case() -> None:
    """Real commit 4b05c02 claims to add _is_dist_stale, which pre-exists
    as of 4e3ceb0. Should return clean_match."""
    results = detect_mislabeled_add_claim("4b05c02", repo_root=REPO_ROOT)

    clean = [r for r in results if r.status == MatchStatus.CLEAN_MATCH]
    assert len(clean) >= 1

    stale_result = [r for r in clean if r.symbol == "_is_dist_stale"]
    assert len(stale_result) == 1
    assert stale_result[0].extra.get("pre_existing_since") == "4e3ceb0"


def test_detect_mislabeled_add_claim_true_addition_is_no_clean_match() -> None:
    """Real commit 4e3ceb0 genuinely introduced _is_dist_stale — the claim
    is true, so no_clean_match."""
    results = detect_mislabeled_add_claim("4e3ceb0", repo_root=REPO_ROOT)

    for r in results:
        assert r.status == MatchStatus.NO_CLEAN_MATCH
