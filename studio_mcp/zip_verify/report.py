"""report.py — assemble zip verification findings and write a markdown report."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .caller_check import caller_check
from .concept_grep import concept_check
from .openrouter_client import OpenRouterClient
from .revision_diff import diff_revision
from .verdict_synthesizer import find_narrative_artifact, synthesize_verdict
from .zip_reader import extract_zip

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _format_verdict_report(
    slug: str,
    zip_path: Path,
    findings: dict[str, Any],
    verdict: dict[str, Any],
) -> str:
    lines = [
        f"# Zip Verification Report — {slug}",
        "",
        f"**Zip:** `{zip_path}`",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        f"**Model:** {verdict.get('model', 'unknown')}",
        "",
        f"## Verdict: {verdict['verdict']}",
        "",
        f"{verdict.get('reasoning', '')}",
        "",
        "## Component Findings",
        "",
        "### Revision Diff",
    ]

    rev = findings.get("revision_diff", {})
    if rev.get("no_prior_revision"):
        lines.append("- No prior revision available; baseline diff skipped.")
    else:
        lines.append(f"- Prior revision: `{rev.get('prior_path')}`")
        lines.append(f"- Files changed: {len(rev.get('diffs', {}))}")
        lines.append(f"- Changed functions: {rev.get('changed_functions', [])}")

    lines.extend(["", "### Concept Grep"])
    concept = findings.get("concept_grep", {})
    if concept.get("no_source_directive_found"):
        lines.append("- No source directive/prompt found on disk for this slug.")
    else:
        lines.append(f"- Directive: `{concept.get('directive_path')}`")
        lines.append(f"- Concept coverage: {concept.get('concept_coverage')}")
        lines.append(f"- Suspiciously clean/uniform: {concept.get('suspiciously_clean')}")
        if concept.get("matches"):
            lines.append("- Concept matches:")
            for kw, count in concept.get("matches", {}).items():
                lines.append(f"  - `{kw}`: {count}")

    lines.extend(["", "### Caller Check"])
    caller = findings.get("caller_check", {})
    lines.append(f"- Changed functions: {caller.get('changed_functions', [])}")
    lines.append(f"- Unused changed functions: {caller.get('unused_functions', [])}")
    lines.append(f"- All changed functions called: {caller.get('all_called')}")

    lines.extend(["", "### Narrative Artifact"])
    narrative = findings.get("narrative", {})
    if narrative.get("found"):
        lines.append(f"- Found: `{narrative.get('path')}` ({narrative.get('word_count')} words)")
        lines.append(f"> {narrative.get('summary', '')}")
    else:
        lines.append("- No completion narrative artifact found inside the zip.")

    lines.extend(["", "## Raw LLM Response"])
    lines.append(f"```json\n{json.dumps(verdict.get('raw_response', {}), indent=2)}\n```")

    return "\n".join(lines)


class ZipVerifier:
    """Read-only verifier for a single AI Studio zip export."""

    def __init__(
        self,
        zip_path: Path | str,
        client: OpenRouterClient | None = None,
    ):
        self.zip_path = Path(zip_path).resolve()
        self.client = client

    def analyze(self) -> dict[str, Any]:
        """Run all non-LLM checks and return structured findings."""
        scratch, _ = extract_zip(self.zip_path)
        slug = self.zip_path.stem.split("_v")[0]

        rev = diff_revision(self.zip_path)
        narrative = find_narrative_artifact(scratch)
        concept = concept_check(scratch, slug)
        caller = caller_check(scratch, rev.get("changed_functions", []))

        return {
            "slug": slug,
            "zip_path": str(self.zip_path),
            "scratch_dir": str(scratch),
            "revision_diff": rev,
            "narrative": narrative,
            "concept_grep": concept,
            "caller_check": caller,
        }

    def verify(self) -> dict[str, Any]:
        """Run full verification including the LLM verdict."""
        findings = self.analyze()
        verdict = synthesize_verdict(findings, client=self.client)
        return {
            "findings": findings,
            "verdict": verdict,
        }

    def write_report(self, out_dir: Path | str | None = None) -> Path:
        """Run verification and write a markdown report to docs/state/."""
        result = self.verify()
        slug = result["findings"]["slug"]
        out_dir = Path(out_dir or REPO_ROOT / "docs" / "state")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"ZipVerifyReport_{slug}.md"
        out_path.write_text(
            _format_verdict_report(
                slug,
                Path(result["findings"]["zip_path"]),
                result["findings"],
                result["verdict"],
            ),
            encoding="utf-8",
        )
        return out_path


# Re-export for tests/convenience
