"""
strategist.py — APJ Strategist Agent

Single responsibility: read the Archivist's CoherenceReport and produce a
ranked three-option SessionPlan (Recommended / Divert / Alt) for the session.

Input:  CoherenceReport fields (compact — not full corpus re-read)
Output: SessionPlan saved to docs/session_logs/ + printed to CLI

Design mirrors Archivist exactly:
- Plain string Agent (no output_type — Ollama tool-calling incompatibility)
- Example-driven JSON prompt for 3b reliability
- Silent fallback if Ollama unreachable — sessions never fail to start
"""

from __future__ import annotations

import asyncio
import json
import re
import yaml
from datetime import datetime
from pathlib import Path
from typing import Optional

from loguru import logger
from pydantic import BaseModel, Field

from src.tools.apj.agents.archivist import CoherenceReport
from src.tools.apj.agents.model_router import ModelRouter
from src.tools.apj.agents.base_agent import AgentConfig, BaseAgent

try:
    from pydantic_ai import Agent
except ImportError:
    Agent = None  # type: ignore

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_SESSION_LOGS_DIR = _PROJECT_ROOT / "docs" / "session_logs"

# ---------------------------------------------------------------------------
# Constitutional Laws (shared context)
# ---------------------------------------------------------------------------
_FOUR_LAWS = """
The Four Constitutional Laws of rpgCore:
  LAW 1 — No demo-specific logic in src/shared/. Shared code must be generic.
  LAW 2 — No content gating between demos. Each demo is self-contained.
  LAW 3 — Every new scene must inherit from a scene template in src/shared/engine/scene_templates/.
  LAW 4 — The test floor is 402 passing tests. Do not regress below this.
"""

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

class SessionOption(BaseModel):
    """One ranked option in a Session Plan."""

    label: str = Field(
        description="Role of this option: 'Headlong' (direct path), 'Divert' (address risk), or 'Alt' (smaller scope)."
    )
    title: str = Field(
        description="Short name for this session option, e.g. 'Combat Polish Pass'."
    )
    rationale: str = Field(
        description="Why this option, and what it prioritises."
    )
    tasks: list[str] = Field(
        description="Concrete ordered steps. Name real files, test targets, commit messages."
    )
    risk: str = Field(
        description="'Low', 'Medium', or 'High'."
    )
    milestone_impact: str = Field(
        description="Which milestone this option advances (e.g. 'M8 — Dungeon Crawler Frame')."
    )


class SessionPlan(BaseModel):
    """Ranked session plan produced by the Strategist."""

    recommended: SessionOption = Field(
        description="Strategist's top pick — advances highest-priority Active Milestone."
    )
    alternatives: list[SessionOption] = Field(
        description="Exactly two alternatives: one Divert (address risk), one Alt (smaller scope)."
    )
    open_questions: list[str] = Field(
        default_factory=list,
        description="Decisions only the Overseer can make before work begins."
    )
    archivist_risks_addressed: list[str] = Field(
        default_factory=list,
        description="Which specific Archivist open_risks this plan addresses."
    )
    corpus_hash: str = Field(
        default="",
        description="Carried from the Archivist report for session continuity."
    )


# ---------------------------------------------------------------------------
# Strategist
# ---------------------------------------------------------------------------

_GOOD_PLAN_EXAMPLE = json.dumps({
    "recommended": {
        "label": "Headlong",
        "title": "Combat Polish Pass",
        "rationale": "M8 is the active milestone. Combat polish is the highest-value unblocked task. Low risk, high visibility.",
        "tasks": [
            "Fix floating damage numbers in src/apps/dungeon/scenes/combat_scene.py",
            "Add hero portrait render to active combat slot",
            "Run pytest — target 408 passing",
            "Commit: polish: dungeon combat — damage numbers, hero portrait"
        ],
        "risk": "Low",
        "milestone_impact": "M8 — Dungeon Crawler Frame"
    },
    "alternatives": [
        {
            "label": "Divert",
            "title": "Milestone Triage",
            "rationale": "Archivist found two Active tasks with no linked Milestone. Fixing this removes planning debt and corrects the APJ corpus for future sessions.",
            "tasks": [
                "Read TASKS.md Active section — identify the two unlinked tasks",
                "Check MILESTONES.md Active — find appropriate milestone or create one",
                "Update MILESTONES.md and cross-reference TASKS.md",
                "Run python -m src.tools.apj session start — verify Archivist no longer flags it"
            ],
            "risk": "Low",
            "milestone_impact": "M10 — Portfolio Pass (planning hygiene)"
        },
        {
            "label": "Alt",
            "title": "APJ Handoff Integration",
            "rationale": "Wire the last Archivist report into the handoff block. Smaller scope, high leverage — every future session starts with context.",
            "tasks": [
                "Read src/tools/apj/journal.py get_handoff()",
                "Load last archivist report from docs/session_logs/",
                "Append session_primer to handoff output",
                "Add test: test_handoff_includes_archivist_primer"
            ],
            "risk": "Low",
            "milestone_impact": "M3 — APJ Toolchain Live (enhancement)"
        }
    ],
    "open_questions": [
        "Should the combat polish target M8 completion this session or is a partial polish acceptable?",
        "Is the milestone triage Divert a prerequisite before any feature work, or can it run parallel?"
    ],
    "archivist_risks_addressed": [
        "Two Active tasks with no corresponding Active Milestone — addressed by Divert option"
    ],
    "corpus_hash": ""
}, indent=2)


def _load_prompt(filename: str) -> str:
    """Load a prompt file from docs/agents/prompts/. Returns empty string if missing."""
    path = _PROJECT_ROOT / "docs" / "agents" / "prompts" / filename
    if path.exists():
        return path.read_text(encoding="utf-8")
    logger.warning(f"Prompt file missing: {filename} \u2014 using empty string")
    return ""


class Strategist:
    """
    The APJ Strategist: reads Archivist findings and produces a ranked Session Plan.

    Design:
    - Input: CoherenceReport fields only (not full corpus — compact prompt for 3b)
    - Output: SessionPlan with Recommended + 2 alternatives
    - Plain string Agent, example-driven JSON prompt
    - Silent fallback if Ollama unreachable
    - Saves plan to docs/session_logs/
    """

    def __init__(self, model_name: str = "base_agent_router") -> None:
        self.model_name = model_name
        self.config = self._load_config()
        logger.info(f"Strategist initialized (model={model_name}, preference={self.config.model_preference})")

    def _load_config(self) -> AgentConfig:
        path = _PROJECT_ROOT / "docs" / "agents" / "configs" / "strategist.yaml"
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return AgentConfig.model_validate(data)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run(self, archivist_report: CoherenceReport) -> SessionPlan:
        """
        Synchronous entry point. Reads Archivist findings, plans session.

        Args:
            archivist_report: The CoherenceReport from Archivist.run().

        Returns:
            SessionPlan — always, even if Ollama is down.
        """
        try:
            plan = self._execute_run(archivist_report)
        except Exception as exc:
            logger.warning(
                f"Strategist: LLM call failed ({exc}). "
                "Using fallback plan."
            )
            plan = self._fallback_plan(archivist_report)

        self._save_plan(plan)
        return plan

    # ------------------------------------------------------------------
    # Internal: prompt assembly
    # ------------------------------------------------------------------

    @staticmethod
    def _build_prompt(report: CoherenceReport) -> str:
        """Compact Archivist summary as Strategist input — not full corpus."""
        risks = "\n".join(f"  - {r}" for r in report.open_risks) or "  None reported."
        flags = "\n".join(f"  - {f}" for f in report.constitutional_flags) or "  None reported."
        return (
            "Plan the next work session for rpgCore based on this Archivist Coherence Report.\n\n"
            f"SESSION PRIMER:\n  {report.session_primer}\n\n"
            f"QUEUED FOCUS:\n  {report.queued_focus}\n\n"
            f"OPEN RISKS:\n{risks}\n\n"
            f"CONSTITUTIONAL FLAGS:\n{flags}\n\n"
            "Produce a SessionPlan with:\n"
            "  - recommended: advance the most important Active Milestone\n"
            "  - alternatives[0] (Divert): address the most critical open risk\n"
            "  - alternatives[1] (Alt): a smaller, lower-risk alternative\n"
            "Do not recommend options that violate the Four Constitutional Laws."
        )

    # ------------------------------------------------------------------
    # Internal: agent
    # ------------------------------------------------------------------

    # _get_agent is deprecated in favor of ModelRouter.route

    @staticmethod
    def _extract_json(raw: str) -> str:
        """Extract JSON from response — handles fenced blocks or raw text."""
        fenced = re.search(r"```(?:json)?\s*({.*?})\s*```", raw, re.DOTALL)
        if fenced:
            return fenced.group(1)
        braces = re.search(r"({.*})", raw, re.DOTALL)
        if braces:
            return braces.group(1)
        return raw.strip()

    def _execute_run(self, report: CoherenceReport) -> SessionPlan:
        """Execute the agent logic: build prompt -> call router -> parse JSON."""
        system_prompt = (
            _load_prompt("strategist_system.md")
            + "\n\n"
            + _load_prompt("strategist_fewshot.md")
        )
        prompt = system_prompt + "\n\nTASK:\n" + self._build_prompt(report)
        
        logger.info("Strategist: invoking ModelRouter...")
        raw_text = ModelRouter.route(self.config, prompt)
        logger.debug(f"Strategist: raw response length={len(raw_text)} chars")

        json_str = self._extract_json(raw_text)
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Strategist: JSON parse failed — {exc}\nRaw: {raw_text[:300]}"
            ) from exc

        plan = SessionPlan.model_validate(data)
        plan.corpus_hash = report.corpus_hash  # carry forward for continuity
        logger.info(
            f"Strategist: plan complete — "
            f"recommended='{plan.recommended.title}', "
            f"{len(plan.alternatives)} alternatives, "
            f"{len(plan.open_questions)} open questions"
        )
        return plan

    # ------------------------------------------------------------------
    # Internal: fallback
    # ------------------------------------------------------------------

    def _fallback_plan(self, report: CoherenceReport) -> SessionPlan:
        """Deterministic stub plan when Ollama is offline. Sessions never fail."""
        logger.warning("Strategist: generating fallback plan (Ollama offline)")
        return SessionPlan(
            recommended=SessionOption(
                label="Headlong",
                title="Review Archivist Findings",
                rationale="Ollama was unreachable — fallback plan. Start by reviewing the Archivist report manually.",
                tasks=[
                    "Read docs/session_logs/ for last archivist report",
                    "Triage open_risks manually",
                    "Verify Ollama is running: ollama list",
                    "Re-run: python -m src.tools.apj session start"
                ],
                risk="Low",
                milestone_impact="N/A — fallback session"
            ),
            alternatives=[
                SessionOption(
                    label="Divert",
                    title="Fix Ollama Connection",
                    rationale="Strategist requires Ollama. Restore connection first.",
                    tasks=["Run: ollama serve", "Run: ollama pull llama3.2:3b"],
                    risk="Low",
                    milestone_impact="N/A"
                ),
                SessionOption(
                    label="Alt",
                    title="Manual Journal Update",
                    rationale="Work without AI assist — update journal and tasks manually.",
                    tasks=[
                        "python -m src.tools.apj handoff",
                        "python -m src.tools.apj tasks --next",
                        "python -m src.tools.apj update"
                    ],
                    risk="Low",
                    milestone_impact="N/A"
                )
            ],
            open_questions=["Is Ollama running? (ollama list)"],
            archivist_risks_addressed=[],
            corpus_hash=report.corpus_hash,
        )

    # ------------------------------------------------------------------
    # Internal: persistence
    # ------------------------------------------------------------------

    def _save_plan(self, plan: SessionPlan, log_dir: Optional[Path] = None) -> None:
        """Write the Session Plan to docs/session_logs/."""
        target_dir = log_dir if log_dir is not None else _SESSION_LOGS_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        plan_path = target_dir / f"{timestamp}_strategist.md"

        def _fmt_option(opt: SessionOption, icon: str) -> list[str]:
            lines = [
                f"\n{icon} {opt.label.upper()} — {opt.title} [{opt.risk} Risk]",
                f"  Advances: {opt.milestone_impact}",
                f"  Rationale: {opt.rationale}",
                "  Tasks:"
            ]
            lines += [f"    {i+1}. {t}" for i, t in enumerate(opt.tasks)]
            return lines

        doc_lines = [
            f"# Strategist Session Plan — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            f"**Model:** {self.model_name}  ",
            f"**Corpus Hash:** `{plan.corpus_hash}`\n",
            "## Session Options",
        ]

        doc_lines += _fmt_option(plan.recommended, "[R]")
        for alt in plan.alternatives:
            icon = "[D]" if alt.label == "Divert" else "[A]"
            doc_lines += _fmt_option(alt, icon)

        doc_lines.append("\n## Open Questions")
        if plan.open_questions:
            doc_lines += [f"- {q}" for q in plan.open_questions]
        else:
            doc_lines.append("_None._")

        doc_lines.append("\n## Archivist Risks Addressed")
        if plan.archivist_risks_addressed:
            doc_lines += [f"- {r}" for r in plan.archivist_risks_addressed]
        else:
            doc_lines.append("_None explicitly addressed._")

        plan_path.write_text("\n".join(doc_lines), encoding="utf-8")
        try:
            display_path = plan_path.relative_to(_PROJECT_ROOT)
        except ValueError:
            display_path = plan_path
        logger.info(f"Strategist: plan saved -> {display_path}")
