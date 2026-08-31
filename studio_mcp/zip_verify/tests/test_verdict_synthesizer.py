"""Tests for verdict_synthesizer.py."""

from typing import Any

import pytest

from studio_mcp.zip_verify.verdict_synthesizer import (
    _allowed_verdict,
    build_prompt,
    synthesize_verdict,
)


class FakeClient:
    def __init__(self, content: str, model: str = "fake-model"):
        self.content = content
        self.model = model

    def complete(self, messages: list[dict[str, str]], temperature: float = 0.1) -> dict[str, Any]:
        return {"choices": [{"message": {"content": self.content}}]}

    def get_content(self, response: dict[str, Any]) -> str:
        return response["choices"][0]["message"]["content"]


def test_verdict_synthesizer_uses_mocked_client():
    fake = FakeClient("UNVERIFIABLE\nNo baseline and no directive.")
    findings = {
        "revision_diff": {"no_prior_revision": True},
        "concept_grep": {"no_source_directive_found": True},
        "caller_check": {"unused_functions": [], "all_called": True},
        "narrative": {"found": False},
    }
    result = synthesize_verdict(findings, client=fake)
    assert result["verdict"] == "UNVERIFIABLE"
    assert "raw_response" in result


def test_verdict_synthesizer_output_is_one_of_three_values():
    for content in ["CERTIFIED", "BLOCKED-fake", "UNVERIFIABLE", "garbage"]:
        fake = FakeClient(content)
        findings = {
            "revision_diff": {"no_prior_revision": True},
            "concept_grep": {"no_source_directive_found": True},
            "caller_check": {"unused_functions": [], "all_called": True},
            "narrative": {"found": False},
        }
        result = synthesize_verdict(findings, client=fake)
        assert result["verdict"] in {"CERTIFIED", "UNVERIFIABLE"} or result["verdict"].startswith("BLOCKED-")


def test_verdict_unverifiable_when_no_baseline_and_no_directive():
    fake = FakeClient("UNVERIFIABLE")
    findings = {
        "revision_diff": {"no_prior_revision": True},
        "concept_grep": {"no_source_directive_found": True},
        "caller_check": {"unused_functions": [], "all_called": True},
        "narrative": {"found": False},
    }
    result = synthesize_verdict(findings, client=fake)
    assert result["verdict"] == "UNVERIFIABLE"


def test_allowed_verdict_rejects_invalid():
    assert _allowed_verdict("CERTIFIED") == "CERTIFIED"
    assert _allowed_verdict("BLOCKED-unused") == "BLOCKED-UNUSED"
    assert _allowed_verdict("maybe") is None


def test_build_prompt_contains_findings():
    findings = {
        "revision_diff": {"no_prior_revision": True},
        "concept_grep": {"no_source_directive_found": True},
        "caller_check": {"unused_functions": [], "all_called": True},
        "narrative": {"found": False},
    }
    prompt = build_prompt(findings)
    assert "No prior revision" in prompt
    assert "No source directive" in prompt


def test_verdict_synthesizer_prompt_includes_unmatched_concepts():
    """The prompt must include the real list of unmatched concepts, not
    just a coverage percentage — so the model can judge relevance
    instead of pattern-matching a number it can't interpret.
    """
    findings = {
        "revision_diff": {"no_prior_revision": True},
        "concept_grep": {
            "no_source_directive_found": False,
            "directive_path": "/fake/directive.md",
            "concept_coverage": 0.63,
            "suspiciously_clean": False,
            "unmatched_concepts": ["off-stream-ui", "hidden", "composite", "overlay"],
        },
        "caller_check": {"unused_functions": [], "all_called": True},
        "narrative": {"found": False},
    }
    prompt = build_prompt(findings)
    assert "off-stream-ui" in prompt
    assert "hidden" in prompt
    assert "composite" in prompt
    assert "overlay" in prompt
    assert "Unmatched concepts" in prompt
