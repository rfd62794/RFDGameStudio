"""
archivist.py — APJ Archivist Agent

Single responsibility: read the APJ corpus and produce a Coherence Report
before every session. The report surfaces drift, risks, and constitutional
violations so the developer starts each session oriented.

Constitutional Four Laws (what the Archivist watches for):
  1. Demo-specific logic creeping into src/shared/
  2. Content gating between demos
  3. New scenes not inheriting from scene templates
  4. Test count below the current floor (442)

Offline fallback: if Ollama is unreachable, produces a deterministic stub
from structured Corpus data. Sessions NEVER fail to start.

Phase 5: replaced raw markdown reads with build_corpus() from the parser.
constitutional_flags now populated from deterministic validation even when
Ollama is offline — the fallback is no longer blind.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import yaml
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from loguru import logger
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from src.tools.apj.agents.model_router import ModelRouter
from src.tools.apj.agents.base_agent import AgentConfig, BaseAgent
from src.tools.apj.parser import build_corpus, validate_corpus
from src.tools.apj.schema import Corpus

# ---------------------------------------------------------------------------
# Project root — four levels up from src/tools/apj/agents/
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[4]

# Where session reports are saved
_SESSION_LOGS_DIR = _PROJECT_ROOT / "docs" / "agents" / "session_logs"

# Constitutional laws (injected into the Archivist's system prompt)
_FOUR_LAWS = """
The Four Constitutional Laws of rpgCore:
  LAW 1 — No demo-specific logic in src/shared/. Shared code must be generic.
  LAW 2 — No content gating between demos. Each demo is self-contained.
  LAW 3 — Every new scene must inherit from a scene template in src/shared/engine/scene_templates/.
  LAW 4 — The test floor is 442 passing tests. Do not regress below this.
"""

# Specific questions the Archivist must answer when populating risks and flags.
_FOCUS_QUESTIONS = [
    "Are all Goals in the corpus linked to at least one Milestone?",
    "Are there Active tasks with no corresponding Active or Queued Milestone?",
    "Are there Milestones marked Active with no corresponding Tasks?",
    "Does the latest journal entry's test_floor match the current floor of 442?",
    "Are there any tasks scoped as 'shared' that reference a specific demo name?",
    "Are there Goals marked complete with no evidence in the journal?",
    "Does any task description suggest src/shared/ pollution (LAW 1)?",
]

# Few-shot example for the system prompt
_GOOD_REPORT_EXAMPLE = """
EXAMPLE of a correct, high-quality CoherenceReport:
{
  "session_primer": "rpgCore has 442 passing tests across six playable demos including the Dungeon Crawler with a working combat loop. The corpus parser shipped last session and confirmed live structured validation.",
  "open_risks": [
    "G3 in corpus has no linked Milestone \u2014 orphaned goal, should be linked or retired",
    "Two tasks marked Active have no corresponding Active Milestone"
  ],
  "queued_focus": "Link G3 to Milestone M5 or mark it deferred",
  "constitutional_flags": [
    "LAW 1 VIOLATION \u2014 T047 is scoped shared but references slime_breeder in title"
  ],
  "corpus_hash": ""
}

EXAMPLE of a BAD report (do not do this):
{
  "constitutional_flags": [
    "LAW 1 \u2014 No demo-specific logic in src/shared/",
    "LAW 4 \u2014 The test floor is 442 passing tests"
  ]
}
The bad example flags laws WITHOUT evidence. Only flag violations you can cite specifically.
"""


def _load_prompt(filename: str) -> str:
    """Load a prompt file from docs/agents/prompts/. Returns empty string if missing."""
    path = _PROJECT_ROOT / "docs" / "agents" / "prompts" / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    logger.warning(f"Prompt file missing: {filename} \u2014 using empty string")
    return ""


# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------
class CoherenceReport(BaseModel):
    """Structured output from the Archivist agent."""

    session_primer: str = Field(
        description="2-sentence summary of current project state and momentum."
    )
    open_risks: list[str] = Field(
        default_factory=list,
        description="Detected blockers, spec drift, broken references, or orphaned goals.",
    )
    queued_focus: str = Field(
        description="Single top-priority task recommendation for this session."
    )
    constitutional_flags: list[str] = Field(
        default_factory=list,
        description=(
            "Any patterns in the corpus that violate the Four Constitutional Laws: "
            "demo logic in shared, content gating, scenes not using templates, "
            "or test count at risk."
        ),
    )
    corpus_hash: str = Field(
        description="SHA256 of the combined corpus content for change detection."
    )


# ---------------------------------------------------------------------------
# Archivist
# ---------------------------------------------------------------------------
class Archivist:
    """
    The APJ Archivist: reads the project corpus and generates a Coherence Report.

    Phase 5 design:
    - Calls build_corpus() to get a validated, structured Corpus
    - Runs deterministic CorpusValidator before Ollama — violations are facts
    - Falls back to a deterministic stub if Ollama is unreachable
    - constitutional_flags always populated from validation (offline or online)
    - Always saves the report to docs/agents/session_logs/
    - Never raises — sessions must always be able to start
    """

    def __init__(self, model_name: str = "base_agent_router") -> None:
        self.model_name = model_name
        self.config = self._load_config()
        logger.info(f"Archivist initialized (model={model_name}, preference={self.config.model_preference})")

    def _load_config(self) -> AgentConfig:
        path = _PROJECT_ROOT / "docs" / "agents" / "configs" / "archivist.yaml"
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return AgentConfig.model_validate(data)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self) -> CoherenceReport:
        """
        Synchronous entry point. Reads corpus, validates, calls Ollama, saves report.

        Returns:
            CoherenceReport — always, even if Ollama is down.
        """
        corpus, corpus_hash = self._get_corpus()

        # Deterministic validation runs regardless of Ollama availability
        validation_result = validate_corpus(corpus)
        if validation_result.errors:
            logger.warning(
                f"Archivist: {validation_result.error_count} validation error(s) detected"
            )

        try:
            report = self._execute_run(corpus, corpus_hash, validation_result.errors)
        except Exception as exc:
            logger.warning(f"Archivist: LLM call failed ({exc}). Using fallback.")
            report = self._fallback_report(corpus, corpus_hash, validation_result.errors)

        self._save_report(report)
        return report

    # ------------------------------------------------------------------
    # Internal: corpus handling
    # ------------------------------------------------------------------

    def _get_corpus(self) -> tuple[Corpus, str]:
        """Build validated Corpus from YAML docs via the parser."""
        corpus = build_corpus()
        logger.debug(
            f"Archivist: corpus loaded — "
            f"{len(corpus.goals)} goals, {len(corpus.milestones)} milestones, "
            f"{len(corpus.tasks)} tasks, {len(corpus.sessions)} sessions"
        )
        return corpus, corpus.corpus_hash

    @staticmethod
    def _build_prompt(corpus: Corpus, validation_errors: list[str]) -> str:
        """Build Archivist prompt from structured Corpus + deterministic errors."""

        # Summarize corpus state
        active_goals = [g for g in corpus.goals if g.status.value == "ACTIVE"]
        active_milestones = [m for m in corpus.milestones if m.status.value == "ACTIVE"]
        active_tasks = [t for t in corpus.tasks if t.status.value == "ACTIVE"]
        queued_tasks = [t for t in corpus.tasks if t.status.value == "QUEUED"]

        # Latest session
        latest_session = None
        if corpus.sessions:
            latest_session = sorted(
                corpus.sessions,
                key=lambda s: s.session_date or date.min,
            )[-1]

        test_floor = corpus.journal[-1].test_floor if corpus.journal else "unknown"

        # Discover design reference docs so the LLM can cite them in recommendations
        _ref_dir = _PROJECT_ROOT / "docs" / "reference"
        _ref_docs = sorted(p.name for p in _ref_dir.glob("*.md")) if _ref_dir.exists() else []
        _ref_note = (
            "  " + ", ".join(f"docs/reference/{n}" for n in _ref_docs)
            if _ref_docs else "  None found."
        )

        corpus_summary = f"""
PROJECT STATE (structured corpus):
  Goals:      {len(corpus.goals)} total, {len(active_goals)} ACTIVE
  Milestones: {len(corpus.milestones)} total, {len(active_milestones)} ACTIVE
  Tasks:      {len(corpus.tasks)} total, {len(active_tasks)} ACTIVE, {len(queued_tasks)} QUEUED
  Sessions:   {len(corpus.sessions)} recorded
  Test floor: {test_floor}
  Latest session: {latest_session.id + " — " + latest_session.focus if latest_session else "none"}

DESIGN REFERENCE DOCS (docs/reference/ — cite these when making recommendations):
{_ref_note}

ACTIVE GOALS:
{chr(10).join(f"  {g.id}: {g.title} → {g.milestone or 'no milestone'}" for g in active_goals) or "  None"}

ACTIVE MILESTONES:
{chr(10).join(f"  {m.id}: {m.title}" for m in active_milestones) or "  None"}

ACTIVE TASKS (first 10):
{chr(10).join(f"  {t.id}: {t.title} [{t.scope.value}]" for t in active_tasks[:10]) or "  None"}

VALIDATION ERRORS (deterministic — confirmed violations, include in constitutional_flags):
{chr(10).join(f"  - {e}" for e in validation_errors) if validation_errors else "  None detected."}
"""

        questions = "\n".join(
            f"  {i + 1}. {q}" for i, q in enumerate(_FOCUS_QUESTIONS)
        )

        return (
            "Analyze this APJ project state and produce a CoherenceReport.\n\n"
            + corpus_summary
            + f"\n\nANSWER THESE QUESTIONS for open_risks and constitutional_flags:\n{questions}\n\n"
            + "Validation errors above are CONFIRMED violations — include them directly in constitutional_flags.\n"
            + "Do not flag laws without evidence."
        )

    # ------------------------------------------------------------------
    # Internal: agent
    # ------------------------------------------------------------------

    # _get_agent is deprecated in favor of ModelRouter.route

    @staticmethod
    def _extract_json(raw: str) -> str:
        """
        Extract first complete JSON object from response.
        Uses brace-depth tracking — stops at the matching closing brace,
        ignoring any prose the model appends after the JSON.
        """
        # Try fenced code block first: ```json ... ``` or ``` ... ```
        fenced = re.search(r"```(?:json)?\s*({.*?})\s*```", raw, re.DOTALL)
        if fenced:
            return fenced.group(1)

        # Find first { and track depth to its matching }
        start = raw.find("{")
        if start == -1:
            return raw.strip()

        depth = 0
        for i, char in enumerate(raw[start:], start):
            if char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    return raw[start:i + 1]

        # Unclosed brace — return from start and let the caller handle it
        return raw[start:].strip()

    def _execute_run(
        self,
        corpus: Corpus,
        corpus_hash: str,
        validation_errors: list[str],
    ) -> CoherenceReport:
        """Execute the agent logic: build prompt -> call router -> parse JSON."""
        example = json.dumps({
            "session_primer": (
                "The project has 442 passing tests with the corpus parser live. "
                "Momentum is on the Archivist wiring and agent swarm."
            ),
            "open_risks": [
                "G3 has no linked milestone — orphaned",
                "Two Active tasks have no corresponding Active Milestone",
            ],
            "queued_focus": (
                "Link G3 to Milestone M5 or mark deferred in goals.yaml"
            ),
            "constitutional_flags": [
                "LAW 1: T047 scoped shared but title references slime_breeder directly"
            ],
            "corpus_hash": "",
        }, indent=2)
        system_prompt = (
            _load_prompt("archivist_system.md")
            + f"\n\n{example}\n\n"
            + _load_prompt("archivist_fewshot.md")
        )
        prompt = system_prompt + "\n\nTASK:\n" + self._build_prompt(corpus, validation_errors)
        
        logger.info("Archivist: invoking ModelRouter...")
        raw_text = ModelRouter.route(self.config, prompt)
        logger.debug(f"Archivist: raw response length={len(raw_text)} chars")

        json_str = self._extract_json(raw_text)
        try:
            # raw_decode stops at the first complete JSON object — tolerates
            # any trailing prose the model appends after the closing brace.
            data, _ = json.JSONDecoder().raw_decode(json_str.strip())
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Archivist: JSON parse failed — {exc}\nRaw: {raw_text[:300]}"
            ) from exc

        report = CoherenceReport.model_validate(data)
        report.corpus_hash = corpus_hash  # Always use computed hash

        # Merge deterministic validation errors into constitutional_flags
        # so confirmed violations appear even if Ollama missed them
        for error in validation_errors:
            if error not in report.constitutional_flags:
                report.constitutional_flags.append(error)

        logger.info(
            f"Archivist: report complete — "
            f"{len(report.open_risks)} risks, "
            f"{len(report.constitutional_flags)} constitutional flags"
        )
        return report

    # ------------------------------------------------------------------
    # Internal: fallback
    # ------------------------------------------------------------------

    def _fallback_report(
        self,
        corpus: Corpus,
        corpus_hash: str,
        validation_errors: list[str],
    ) -> CoherenceReport:
        """
        Deterministic stub report built from structured Corpus.
        Used when Ollama is unreachable — never fails.
        constitutional_flags still populated from validation (not blind).
        """
        logger.warning("Archivist: generating fallback report from structured corpus (Ollama offline)")

        latest_journal = corpus.journal[-1] if corpus.journal else None
        primer = (
            f"{latest_journal.summary[:120]}..."
            if latest_journal
            else "Project corpus loaded. Ollama was offline — review corpus manually."
        )

        return CoherenceReport(
            session_primer=(
                f"{primer} "
                "[FALLBACK — Ollama unreachable. No AI analysis performed.]"
            ),
            open_risks=["Ollama was unreachable at session start — AI analysis skipped."],
            queued_focus="Verify Ollama is running (ollama list) then re-run session start.",
            constitutional_flags=validation_errors,  # deterministic even in fallback
            corpus_hash=corpus_hash,
        )

    # ------------------------------------------------------------------
    # Internal: persistence
    # ------------------------------------------------------------------

    def _save_report(self, report: CoherenceReport, log_dir: Optional[Path] = None) -> None:
        """Write the Coherence Report to docs/agents/session_logs/."""
        target_dir = log_dir if log_dir is not None else _SESSION_LOGS_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = target_dir / f"{timestamp}_archivist.md"

        lines = [
            f"# Archivist Coherence Report — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"**Model:** {self.model_name}  ",
            f"**Corpus Hash:** `{report.corpus_hash}`\n",
            "## Session Primer",
            report.session_primer,
            "\n## Queued Focus",
            f"> {report.queued_focus}",
            "\n## Open Risks",
        ]

        if report.open_risks:
            lines += [f"- {r}" for r in report.open_risks]
        else:
            lines.append("_None detected._")

        lines.append("\n## Constitutional Flags")
        if report.constitutional_flags:
            lines += [f"- ⚠️ {f}" for f in report.constitutional_flags]
        else:
            lines.append("_No violations detected._")

        report_path.write_text("\n".join(lines), encoding="utf-8")
        try:
            display_path = report_path.relative_to(_PROJECT_ROOT)
        except ValueError:
            display_path = report_path
        logger.info(f"Archivist: report saved → {display_path}")
