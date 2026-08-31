"""Tests for floor_claim_diff.py."""

from studio_mcp.pipeline_audit.floor_claim_diff import diff_floor_claim


def test_floor_claim_diff_detects_real_mismatch() -> None:
    cmd = 'python -c "print(\'==== 2 passed, 1 failed in 1s ====\')"'
    claimed = {"passed": 3, "failed": 0, "skipped": 0}
    result = diff_floor_claim(cmd, claimed)

    assert result["matches"] is False
    assert result["real"]["passed"] == 2
    assert result["real"]["failed"] == 1
    assert result["real"]["skipped"] == 0
    assert result["mismatch_detail"] is not None
    assert "passed 2 vs 3" in result["mismatch_detail"]


def test_floor_claim_diff_confirms_real_match() -> None:
    cmd = 'python -c "print(\'==== 5 passed in 1s ====\')"'
    claimed = {"passed": 5, "failed": 0, "skipped": 0}
    result = diff_floor_claim(cmd, claimed)

    assert result["matches"] is True
    assert result["real"]["passed"] == 5
    assert result["real"]["failed"] == 0
    assert result["real"]["skipped"] == 0
    assert result["mismatch_detail"] is None
