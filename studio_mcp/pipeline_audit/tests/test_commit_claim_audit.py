"""Tests for commit_claim_audit.py using real commits in this repo."""

from pathlib import Path

import pytest

from studio_mcp.pipeline_audit.commit_claim_audit import (
    audit_addition_claim,
    audit_file_list,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
COMMIT_WITH_REAL_FEATURE = "4e3ceb0"
COMMIT_REFACTOR_MISLABELED = "4b05c02"


def test_commit_claim_audit_detects_unclaimed_file() -> None:
    """Commit 4e3ceb0 touched three files; claiming only one should surface
    the two unclaimed ones."""
    result = audit_file_list(
        COMMIT_WITH_REAL_FEATURE,
        claimed_files=["studio_mcp/tools.py"],
        repo_path=REPO_ROOT,
    )

    assert result["matches"] is False
    assert "studio_mcp/tools.py" in result["real"]
    assert result["claimed_not_touched"] == []
    assert "studio_mcp/game_metadata.py" in result["touched_not_claimed"]
    assert "tests/test_cross_pipeline_version_tracking.py" in result["touched_not_claimed"]


def test_commit_claim_audit_addition_claim_false_positive() -> None:
    """Commit 4b05c02's message claims to add _is_dist_stale(), but the symbol
    already existed in 4e3ceb0."""
    result = audit_addition_claim(
        symbol="_is_dist_stale",
        commit_hash=COMMIT_REFACTOR_MISLABELED,
        file_paths=["studio_mcp/tools.py"],
        repo_path=REPO_ROOT,
    )

    assert result["confirmed"] is False
    assert result["pre_existing_since"] == COMMIT_WITH_REAL_FEATURE


def test_commit_claim_audit_addition_claim_true_positive() -> None:
    """Commit 4e3ceb0 genuinely introduced _is_dist_stale()."""
    result = audit_addition_claim(
        symbol="_is_dist_stale",
        commit_hash=COMMIT_WITH_REAL_FEATURE,
        file_paths=["studio_mcp/tools.py"],
        repo_path=REPO_ROOT,
    )

    assert result["confirmed"] is True
    assert result["pre_existing_since"] is None
