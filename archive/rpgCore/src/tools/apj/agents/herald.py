"""
herald.py — APJ Herald Agent

Single responsibility: take an approved SessionPlan from the Strategist and
produce a ready-to-paste IDE agent directive.

The directive answers exactly one question:
  "What exact instructions should the IDE agent receive?"

Design mirrors Archivist/Strategist exactly:
  - __init__ uses warm_model_sync chain (auto-downgrades 3b→1b→0.5b)
  - Plain string Agent, example-driven JSON prompt
  - _run_async uses brace-depth JSON extraction
  - _fallback_directive — deterministic stub if Ollama fails
  - _save_directive — saves to docs/session_logs/YYYYMMDD_HHMMSS_herald.md
  - run() is always synchronous, always returns a HeraldDirective

Sessions NEVER fail — if Ollama is down, the fallback runs and the directive
is still useful (references the recommended option's tasks literally).
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

from src.tools.apj.agents.model_router import ModelRouter
from src.tools.apj.agents.strategist import SessionPlan
from src.tools.apj.agents.base_agent import BaseAgent, AgentConfig
from src.tools.apj.inventory.context_builder import ContextBuilder

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_SESSION_LOGS_DIR = _PROJECT_ROOT / "docs" / "session_logs"


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

class HeraldDirective(BaseModel):
    """Structured output from the Herald — ready-to-paste IDE agent directive."""

    session_id: str = Field(
        description="Session identifier carried from the SessionPlan corpus_hash or recommended title slug."
    )
    title: str = Field(
        description="Short human-readable name for this directive, e.g. 'Loot System v1'."
    )
    preamble: str = Field(
        description="Opening line of the directive. Always: 'Run `python -m src.tools.apj handoff`.'",
        default="Run `python -m src.tools.apj handoff`."
    )
    context: str = Field(
        description=(
            "What the agent needs to know BEFORE coding: existing patterns, "
            "file locations, schemas to follow, design doc references."
        )
    )
    tasks: list[str] = Field(
        description=(
            "Numbered, atomic task steps. Each step MUST reference a specific file path. "
            "Every task must be verifiable."
        )
    )
    verification: str = Field(
        description="Exact pytest command + manual smoke test steps."
    )
    commit_message: str = Field(
        description="Conventional commits format: feat/fix/docs/refactor: description"
    )
    confidence: str = Field(
        description="'high' if plan was clear and specific, 'medium' if gaps exist, 'low' if plan was ambiguous.",
        default="medium"
    )


# ---------------------------------------------------------------------------
# Few-shot example
# ---------------------------------------------------------------------------
_EXAMPLE_DIRECTIVE = json.dumps({
    "session_id": "S006",
    "title": "Loot System v1 — Item Drops and Equipment Slots",
    "preamble": "Run `python -m src.tools.apj handoff`.",
    "context": (
        "Loot system spec is in docs/reference/DUNGEON_DESIGN.md. "
        "Data contracts (ItemDrop, RarityTier, EquipmentSlot) are defined in the Port Notes section. "
        "Existing combat system is in src/shared/engine/combat/. "
        "Follow the dataclass pattern used in src/shared/engine/combat/combat_result.py. "
        "Do not add pygame calls to any shared/ file."
    ),
    "tasks": [
        "1. Create src/shared/engine/loot/__init__.py — empty package marker",
        "2. Create src/shared/engine/loot/item.py — ItemDrop, RarityTier, EquipmentSlot dataclasses from DUNGEON_DESIGN.md Port Notes section",
        "3. Create src/shared/engine/loot/drop_table.py — DropTable class: standard_drop(), elite_drop(), boss_drop() following rarity rules from DUNGEON_DESIGN.md Loot System v1 section",
        "4. Create tests/unit/test_loot.py — test_item_drop_creation, test_rarity_tiers, test_drop_table_standard, test_drop_table_boss_guaranteed_rare",
        "5. Run pytest — target 452 passing (448 + 4 new)"
    ],
    "verification": (
        "uv run pytest tests/unit/test_loot.py -v. "
        "Manual: python -c \"from src.shared.engine.loot.item import ItemDrop, RarityTier; print(RarityTier.RARE)\""
    ),
    "commit_message": "feat: loot system v1 — ItemDrop, RarityTier, DropTable, 4 tests",
    "confidence": "high"
}, indent=2)

_BAD_DIRECTIVE_EXAMPLE = """
EXAMPLE of a BAD directive (do not do this):
{
  "tasks": [
    "1. Implement the loot system",
    "2. Add some tests",
    "3. Make sure it works"
  ]
}
The bad example has no file paths, no specificity, no verification. Every task must name a file.
"""

_HERALD_SYSTEM_PROMPT = (
    "You are the HERALD for rpgCore. You receive an approved SessionPlan "
    "and produce a single ready-to-paste IDE agent directive.\n\n"
    "Your job is to answer: \"What exact instructions should the IDE agent receive?\"\n\n"
    "Rules:\n"
    "- Always start directive with: Run `python -m src.tools.apj handoff`.\n"
    "- Reference specific file paths — never say \"the combat system\", "
    "say \"src/apps/dungeon/scenes/combat_scene.py\"\n"
    "- Every task must be verifiable — include the exact pytest target\n"
    "- Commit message must be conventional commits format: "
    "feat/fix/docs/refactor: description\n"
    "- context section: what the agent needs to know BEFORE coding "
    "(existing patterns, file locations, schema to follow)\n"
    "- tasks section: numbered steps, each referencing a specific file\n"
    "- verification: pytest command + manual smoke test steps\n"
    "- Never invent file paths — only reference paths that exist in the project\n"
    "- confidence: high if plan was clear, medium if gaps exist, "
    "low if plan was ambiguous\n\n"
    "OUTPUT: Reply with ONLY a JSON object in exactly this shape "
    "(fill every field with real values — do NOT copy the example):\n\n"
    f"{_EXAMPLE_DIRECTIVE}\n\n"
    f"{_BAD_DIRECTIVE_EXAMPLE}\n\n"
    "CRITICAL: Output ONLY the JSON object. No prose, no markdown fences, "
    "no explanation. Start with { and end with }."
)


# ---------------------------------------------------------------------------
# Herald
# ---------------------------------------------------------------------------

class Herald(BaseAgent):
    """
    The APJ Herald: converts an approved SessionPlan into a ready-to-paste
    IDE agent directive. Grounded in real codebase context via ContextBuilder.
    """

    def __init__(self, model_name: str = "base_agent_router") -> None:
        self.model_name = model_name
        self.config = self._load_config()
        logger.info(f"Herald initialized (model={self.model_name})")

    def _load_config(self) -> AgentConfig:
        path = _PROJECT_ROOT / "docs" / "agents" / "configs" / "herald.yaml"
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f)
        return AgentConfig.model_validate(data)

    # ── Public API ──────────────────────────────────────────────────────────

    def run(self, plan: SessionPlan) -> HeraldDirective:
        """
        Takes a SessionPlan, enriches with ContextBuilder, and produces a HeraldDirective.
        """
        # extract intent from recommended task title
        intent = plan.recommended.title if plan.recommended else "general session work"
        
        # build context slice from real codebase
        try:
            builder = ContextBuilder(_PROJECT_ROOT)
            context_slice = builder.build(intent)
            context_text = context_slice.to_prompt_text()
        except Exception as e:
            logger.warning(f"Herald: ContextBuilder failed — {e}")
            context_text = ""
        
        # inject context into task string
        task = self._build_task(plan, context_text)
        
        try:
            directive = self._execute_run(task)
            # Ensure it's a HeraldDirective (ModelRouter returns output field)
            if not isinstance(directive, HeraldDirective):
                directive = HeraldDirective.model_validate(directive.model_dump())
            return directive
        except Exception as exc:
            logger.warning(f"Herald: LLM call failed ({exc}). Using fallback.")
            return self._fallback_directive(plan)

    def _build_task(self, plan: SessionPlan, context: str) -> str:
        """Combine session plan and codebase context into a single task string."""
        recommended = plan.recommended
        tasks_text = "\n".join(recommended.tasks) if recommended else ""
        return (
            f"SESSION PLAN:\n"
            f"Title: {recommended.title}\n"
            f"Rationale: {recommended.rationale}\n"
            f"Tasks:\n{tasks_text}\n"
            f"\n{context}"
        )

    # ── Agent ───────────────────────────────────────────────────────────────

    # _get_agent is deprecated in favor of ModelRouter.route

    # BaseAgent's _build_prompt is used with the comprehensive 'task' string
    # constructed in run() above.


    @staticmethod
    def _extract_json(raw: str) -> str:
        """
        Extract first complete JSON object from response.
        Brace-depth tracking — same approach as Archivist/Scribe.
        """
        fenced = re.search(r"```(?:json)?\s*({.*?})\s*```", raw, re.DOTALL)
        if fenced:
            return fenced.group(1)

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

        return raw[start:].strip()

    def _execute_run(self, task: str) -> HeraldDirective:
        """Execute the agent logic: build prompt -> call router -> parse JSON."""
        system_prompt = (
            _load_prompt("herald_system.md")
            + "\n\n"
            + _load_prompt("herald_fewshot.md")
        )
        prompt = system_prompt + "\n\nTASK:\n" + self._build_prompt(task)
        
        logger.info("Herald: invoking ModelRouter...")
        raw_text = ModelRouter.route(self.config, prompt)
        logger.debug(f"Herald: raw response length={len(raw_text)} chars")

        json_str = self._extract_json(raw_text)
        try:
            # raw_decode stops at the first complete JSON object
            data, _ = json.JSONDecoder().raw_decode(json_str.strip())
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Herald: JSON parse failed — {exc}\nRaw: {raw_text[:300]}"
            ) from exc

        directive = HeraldDirective.model_validate(data)
        # Always enforce preamble — model may modify it
        directive.preamble = "Run `python -m src.tools.apj handoff`."
        logger.info(
            f"Herald: directive complete — '{directive.title}' "
            f"[{directive.confidence}], {len(directive.tasks)} tasks"
        )
        return directive

    # ── Fallback ────────────────────────────────────────────────────────────

    def _fallback_directive(self, plan: SessionPlan) -> HeraldDirective:
        """
        Deterministic stub directive built from SessionPlan.recommended.
        Used when Ollama is unreachable — never fails.
        Tasks are carried directly from the Strategist (may lack file paths).
        """
        logger.warning("Herald: generating fallback directive (Ollama offline)")
        rec = plan.recommended
        # Carry Strategist tasks as-is — they may be less specific but are honest
        numbered_tasks = [
            f"{i+1}. {t}" for i, t in enumerate(rec.tasks)
        ]
        return HeraldDirective(
            session_id=plan.corpus_hash[:8] or "FALLBACK",
            title=rec.title,
            preamble="Run `python -m src.tools.apj handoff`.",
            context=(
                f"[FALLBACK — Ollama offline] Strategist recommended: {rec.title}. "
                f"Milestone: {rec.milestone_impact}. "
                "File paths were not enriched — review DUNGEON_DESIGN.md and LIVING_WORLD.md manually."
            ),
            tasks=numbered_tasks,
            verification="uv run pytest --tb=no -q",
            commit_message=f"feat: {rec.title.lower().replace(' ', '-')}",
            confidence="low",
        )

    # ── Persistence ─────────────────────────────────────────────────────────

    def _save_directive(
        self, directive: HeraldDirective, log_dir: Optional[Path] = None
    ) -> Path:
        """Write the HeraldDirective to docs/session_logs/ as markdown."""
        target_dir = log_dir if log_dir is not None else _SESSION_LOGS_DIR
        target_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        directive_path = target_dir / f"{timestamp}_herald.md"

        lines = [
            f"# Herald Directive — {directive.title}\n",
            f"**Session:** {directive.session_id}  ",
            f"**Confidence:** {directive.confidence}  ",
            f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
            "## Preamble",
            directive.preamble,
            "\n## Context",
            directive.context,
            "\n## Tasks",
        ]
        lines += [f"{t}" for t in directive.tasks]
        lines += [
            "\n## Verification",
            directive.verification,
            "\n## Commit",
            f"`{directive.commit_message}`",
        ]

        directive_path.write_text("\n".join(lines), encoding="utf-8")
        try:
            display_path = directive_path.relative_to(_PROJECT_ROOT)
        except ValueError:
            display_path = directive_path
        logger.info(f"Herald: directive saved → {display_path}")
        return directive_path
