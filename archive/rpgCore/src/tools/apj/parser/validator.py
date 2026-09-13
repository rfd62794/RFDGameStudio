"""
validator.py — Corpus Validation Runner

Runs CorpusValidator against a parsed Corpus and returns
structured ValidationResult with categorized errors.
"""

from __future__ import annotations

from pydantic import BaseModel
from loguru import logger

from src.tools.apj.schema import Corpus, CorpusValidator


class ValidationResult(BaseModel):
    errors: list[str] = []
    warnings: list[str] = []
    passed: bool = True
    error_count: int = 0

    def summary(self) -> str:
        if self.passed:
            return "Corpus valid — no violations detected."
        return (
            f"{self.error_count} violation(s) detected: "
            + "; ".join(self.errors[:3])
            + ("..." if len(self.errors) > 3 else "")
        )


def validate_corpus(corpus: Corpus) -> ValidationResult:
    """
    Run full corpus validation. Returns ValidationResult.
    Never raises — validation errors are data, not exceptions.
    """
    raw_errors = CorpusValidator().validate(corpus)

    result = ValidationResult(
        errors=raw_errors,
        passed=len(raw_errors) == 0,
        error_count=len(raw_errors),
    )

    if result.passed:
        logger.info("Validator: corpus clean — no violations")
    else:
        for error in result.errors:
            logger.warning(f"Validator: {error}")

    return result
