"""verdict_synthesizer.py — synthesize a verdict from the four non-LLM checks."""

from __future__ import annotations

import json
import re
from typing import Any

from .openrouter_client import OpenRouterClient

VALID_VERDICTS = {"CERTIFIED", "UNVERIFIABLE"}


def _allowed_verdict(text: str) -> str | None:
    text = text.strip().upper()
    # Normalize hyphen-adjacent whitespace so "BLOCKED - x", "BLOCKED- x",
    # and "BLOCKED -x" are all recognized as valid BLOCKED verdicts.
    text = re.sub(r"\s*-\s*", "-", text)
    if text in VALID_VERDICTS:
        return text
    if text.startswith("BLOCKED-"):
        return text
    return None


def build_prompt(findings: dict[str, Any]) -> str:
    """Build a structured prompt for the LLM from the four check components."""
    prompt = (
        "You are verifying whether an AI Studio zip export actually implements "
        "what was asked for. Review the structured findings below and produce "
        "exactly one verdict line: CERTIFIED, BLOCKED-[reason], or UNVERIFIABLE. "
        "No other output except the verdict and one sentence of reasoning.\n\n"
    )

    rev = findings.get("revision_diff", {})
    if rev.get("no_prior_revision"):
        prompt += "- No prior revision exists to diff against.\n"
    else:
        prompt += f"- Diffed against prior revision: {rev.get('prior_path')}\n"
        prompt += f"- Files changed: {len(rev.get('diffs', {}))}\n"
        prompt += f"- Changed functions: {rev.get('changed_functions', [])}\n"

    concept = findings.get("concept_grep", {})
    if concept.get("no_source_directive_found"):
        prompt += "- No source directive/prompt was found on disk for this zip.\n"
    else:
        prompt += f"- Source directive: {concept.get('directive_path')}\n"
        prompt += f"- Concept coverage in zip: {concept.get('concept_coverage')}\n"
        prompt += f"- Suspiciously clean/uniform: {concept.get('suspiciously_clean')}\n"
        unmatched = concept.get("unmatched_concepts", [])
        if unmatched:
            prompt += f"- Unmatched concepts (found in directive but not in zip): {unmatched}\n"

    caller = findings.get("caller_check", {})
    prompt += f"- Changed functions with zero call sites: {caller.get('unused_functions', [])}\n"

    narrative = findings.get("narrative", {})
    if narrative.get("found"):
        prompt += f"- Completion narrative found in zip ({narrative.get('path')}): {narrative.get('summary', '')}\n"
    else:
        prompt += "- No completion narrative artifact found inside the zip.\n"

    prompt += (
        "\nReturn ONLY one of: CERTIFIED, BLOCKED-[reason], UNVERIFIABLE. "
        "UNVERIFIABLE is correct when there is no prior revision to diff and no "
        "source directive to check, and nothing else contradicts the narrative. "
        "BLOCKED is correct only if you can point to concrete evidence of fabrication, "
        "unused changed code, or a contradiction between the narrative and the files."
    )
    return prompt


def synthesize_verdict(
    findings: dict[str, Any],
    client: OpenRouterClient | None = None,
) -> dict[str, Any]:
    """Call OpenRouter with structured findings and parse the verdict."""
    client = client or OpenRouterClient()
    prompt = build_prompt(findings)
    messages = [
        {"role": "system", "content": "You are a strict verification assistant."},
        {"role": "user", "content": prompt},
    ]

    raw_response = client.complete(messages)
    content = client.get_content(raw_response)
    verdict = _allowed_verdict(content.split("\n")[0]) if content else None

    return {
        "verdict": verdict or "UNVERIFIABLE",
        "reasoning": content.strip() if content else "No response from model.",
        "raw_response": raw_response,
        "model": getattr(client, "model", "unknown"),
        "prompt": prompt,
    }


def find_narrative_artifact(source_dir: Any) -> dict[str, Any]:
    """Look inside the source tree for a README/current.md style narrative artifact.

    Works for either a zip-extraction scratch directory or a tracked directory.
    """
    from pathlib import Path

    candidates = ["README.md", "docs/state/current.md", "docs/state/STATUS.md", "CHANGES.md"]
    for candidate in candidates:
        path = Path(source_dir) / candidate
        if path.exists():
            text = path.read_text(encoding="utf-8", errors="replace")
            return {
                "found": True,
                "path": candidate,
                "summary": " ".join(text.split()[:100]),
                "word_count": len(text.split()),
            }
    return {"found": False, "path": None, "summary": "", "word_count": 0}
