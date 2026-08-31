"""Tests for import_fixer.commit_note_generator — §3 test anchors."""

from studio_mcp.import_fixer.pattern_catalog import PatternName
from studio_mcp.import_fixer.pattern_detector import DetectionResult, MatchStatus
from studio_mcp.import_fixer.commit_note_generator import generate_commit_note


def test_commit_note_generator_output_matches_template_exactly() -> None:
    """The generated message must be the fixed template, nothing else."""
    result = DetectionResult(
        status=MatchStatus.CLEAN_MATCH,
        pattern=PatternName.MISLABELED_ADD_CLAIM,
        file="4b05c02",
        symbol="_is_dist_stale",
        reason="false claim",
        extra={"pre_existing_since": "4e3ceb0"},
    )

    note = generate_commit_note(result)

    expected = (
        "Correction: commit 4b05c02 claims to add `_is_dist_stale`, which\n"
        "already existed as of 4e3ceb0.\n"
        "\n"
        "This empty commit records the accurate mapping for git-log archaeology."
    )
    assert note.message == expected
    assert note.error is None
    assert note.commit_hash == "4b05c02"
    assert note.symbol == "_is_dist_stale"


def test_commit_note_generator_rejects_non_clean_match() -> None:
    """A non-clean-match result should produce an error, not a message."""
    result = DetectionResult(
        status=MatchStatus.NO_CLEAN_MATCH,
        pattern=PatternName.MISLABELED_ADD_CLAIM,
        file="abc123",
        symbol="foo",
        reason="true claim",
    )

    note = generate_commit_note(result)
    assert note.error is not None
    assert note.message == ""
