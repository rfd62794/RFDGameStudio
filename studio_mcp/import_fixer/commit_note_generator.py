"""commit_note_generator.py — mechanical fix for Pattern 4.

Generates a corrective empty-commit message using only the fields already
returned by commit_claim_audit.audit_addition_claim. No OpenRouter call,
no free text beyond the fixed template.
"""

from __future__ import annotations

from dataclasses import dataclass

from .pattern_detector import DetectionResult, MatchStatus
from .pattern_catalog import PatternName

_TEMPLATE = """Correction: commit {commit_hash} claims to add `{symbol}`, which
already existed as of {pre_existing_since}.

This empty commit records the accurate mapping for git-log archaeology."""


@dataclass
class CommitNote:
    pattern: PatternName
    commit_hash: str
    symbol: str
    message: str
    error: str | None = None


def generate_commit_note(result: DetectionResult) -> CommitNote:
    """Generate the corrective commit message for a mislabeled add claim.

    Uses only the fixed template — no model, no free text.
    """
    if result.status != MatchStatus.CLEAN_MATCH:
        return CommitNote(
            pattern=result.pattern,
            commit_hash=result.file,
            symbol=result.symbol or "",
            message="",
            error=f"Cannot generate note for status {result.status.value}",
        )

    pre_existing_since = result.extra.get("pre_existing_since")
    if not pre_existing_since:
        return CommitNote(
            pattern=result.pattern,
            commit_hash=result.file,
            symbol=result.symbol or "",
            message="",
            error="Missing pre_existing_since in detection result",
        )

    message = _TEMPLATE.format(
        commit_hash=result.file,
        symbol=result.symbol,
        pre_existing_since=pre_existing_since,
    )

    return CommitNote(
        pattern=result.pattern,
        commit_hash=result.file,
        symbol=result.symbol or "",
        message=message,
    )
