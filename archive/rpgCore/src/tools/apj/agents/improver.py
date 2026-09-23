"""
improver.py — APJ Improver Agent

Single responsibility: send agent prompts + recent outputs to a remote model
(OpenRouter/DeepSeek) and return rewrite suggestions. Human approves before
any prompt file is modified.

The Improver NEVER writes prompt files without explicit human approval.
Every run is logged to docs/agents/prompts/quality_log.md.

Dependencies:
  - openrouter_client.is_director_enabled()  — gate check
  - openrouter_client.get_openrouter_model() — model factory
  - openrouter_client.log_usage()            — budget tracking
  - docs/agents/prompts/*_system.md           — prompt files to review
  - docs/session_logs/*_{agent}.md            — last 3 agent outputs for context
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from loguru import logger
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_PROMPTS_DIR  = _PROJECT_ROOT / "docs" / "agents" / "prompts"
_SESSION_LOGS = _PROJECT_ROOT / "docs" / "session_logs"
_QUALITY_LOG  = _PROMPTS_DIR / "quality_log.md"

# ---------------------------------------------------------------------------
# Agent descriptions for the hardening prompt
# ---------------------------------------------------------------------------
AGENT_DESCRIPTIONS: dict[str, str] = {
    "archivist":  "Read project corpus, find drift, flag constitutional violations with specific evidence.",
    "strategist": "Read archivist report, produce ranked session plan with three concrete options.",
    "scribe":     "Read git diff, draft journal entry summarizing what changed this session.",
    "herald":     "Read approved session plan, produce paste-ready IDE agent directive with specific file paths.",
}

# ---------------------------------------------------------------------------
# Sanitizer — strip project-identifying info before remote calls
# ---------------------------------------------------------------------------
SANITIZE_PATTERNS: dict[str, str] = {
    r"rpgCore":                  "PyGame_Engine",
    r"Dungeon Crawler":          "GenericDemo",
    r"Slime Breeder":            "GenericDemo",
    r"Space Trader":             "GenericDemo",
    r"Slime Clan":               "GenericDemo",
    r"Last Appointment":         "GenericDemo",
    r"The Living World":         "ProjectConcept",
    r"The Ring":                 "ProjectHub",
    r"src/apps/\w+/":            "src/apps/demo_name/",
    r"docs/reference/\w+\.md":  "docs/reference/design_doc.md",
}

# ---------------------------------------------------------------------------
# Hardening prompt template
# ---------------------------------------------------------------------------
_HARDENING_PROMPT = """\
You are reviewing a system prompt for a local LLM agent.

Agent job: {agent_one_liner}

Current system prompt:
{prompt}

Recent outputs from this agent:
{session_logs}

Identify:
1. Ambiguities the model might misinterpret
2. Missing constraints causing noise or vague output
3. Few-shot examples that could be stronger
4. Instructions that contradict each other

Produce a rewritten prompt with each change annotated inline.
Return JSON only. No prose before or after.
"""

# ---------------------------------------------------------------------------
# Output schema
# ---------------------------------------------------------------------------

class ImprovementSuggestion(BaseModel):
    """Structured improvement suggestion from the remote model."""

    agent_name: str = Field(description="Which agent this suggestion targets.")
    prompt_file: str = Field(description="Filename of the system prompt, e.g. 'archivist_system.md'.")
    weaknesses: list[str] = Field(
        description="Specific weaknesses identified in the current prompt."
    )
    rewritten_prompt: str = Field(
        description="Full rewritten system prompt with changes applied."
    )
    changes_annotated: list[str] = Field(
        description="Per-change annotations explaining what was changed and why."
    )
    confidence: str = Field(
        description="'high' / 'medium' / 'low' based on clarity of the issues found.",
        default="medium"
    )


# ---------------------------------------------------------------------------
# Improver
# ---------------------------------------------------------------------------

class Improver:
    """
    Sends agent prompts + recent session outputs to a remote model.
    Returns rewrite suggestions. Human approves before any file is written.

    Gate: requires is_director_enabled() to be True. Raises if not.
    Never writes prompt files without explicit human approval via apply().
    """

    def __init__(self) -> None:
        from src.tools.apj.agents.openrouter_client import is_director_enabled
        if not is_director_enabled():
            raise RuntimeError(
                "Director not configured. Improver requires OpenRouter. "
                "Set OPENROUTER_API_KEY in .env and ensure DIRECTOR_APPROVAL_MODE != OFF."
            )
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.model_name = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-r1")
        logger.info(f"Improver initialized (model={self.model_name})")

    # ── Public API ──────────────────────────────────────────────────────────

    def run(self, agent_name: str) -> ImprovementSuggestion:
        """
        Load, sanitize, and send the agent's current system prompt + recent
        session logs to the remote model. Return the improvement suggestion.

        Args:
            agent_name: One of 'archivist', 'strategist', 'scribe', 'herald'.

        Returns:
            ImprovementSuggestion — always, even on parse failure (fallback).
        """
        if agent_name not in AGENT_DESCRIPTIONS:
            raise ValueError(
                f"Unknown agent: {agent_name!r}. "
                f"Valid: {list(AGENT_DESCRIPTIONS.keys())}"
            )

        prompt_file = f"{agent_name}_system.md"
        raw_prompt = self._load_prompt(prompt_file)
        session_logs = self._load_session_logs(agent_name)

        sanitized_prompt = self._sanitize(raw_prompt)
        sanitized_logs   = self._sanitize(session_logs)

        try:
            suggestion = asyncio.run(
                self._run_async(agent_name, prompt_file, sanitized_prompt, sanitized_logs)
            )
        except Exception as exc:
            logger.warning(f"Improver: remote call failed ({exc}). Using fallback.")
            suggestion = self._fallback_suggestion(agent_name, prompt_file, str(exc))

        return suggestion

    def apply(self, suggestion: ImprovementSuggestion) -> None:
        """
        Write the approved prompt rewrite. NEVER called automatically.

        Steps:
        1. Back up current prompt to {agent_name}_system_v{n}.md
        2. Write rewritten_prompt to {agent_name}_system.md
        3. Append to quality_log.md
        """
        prompt_path = _PROMPTS_DIR / suggestion.prompt_file
        backup_path = self._next_backup_path(suggestion.agent_name)

        # Backup current
        if prompt_path.exists():
            backup_path.write_text(
                prompt_path.read_text(encoding="utf-8"), encoding="utf-8"
            )
            logger.info(f"Improver: backup written → {backup_path.name}")

        # Write rewrite
        prompt_path.write_text(suggestion.rewritten_prompt, encoding="utf-8")
        logger.info(f"Improver: prompt updated → {suggestion.prompt_file}")

        # Quality log
        self._append_quality_log(suggestion)

    # ── Internals ───────────────────────────────────────────────────────────

    @staticmethod
    def _load_prompt(filename: str) -> str:
        """Load a prompt file. Returns empty string if missing."""
        path = _PROMPTS_DIR / filename
        if path.exists():
            return path.read_text(encoding="utf-8")
        logger.warning(f"Improver: prompt file not found: {filename}")
        return ""

    def _load_session_logs(self, agent_name: str, n: int = 3) -> str:
        """Load the last n session log files for this agent."""
        if not _SESSION_LOGS.exists():
            return "No session logs found."
        matches = sorted(_SESSION_LOGS.glob(f"*_{agent_name}.md"))[-n:]
        if not matches:
            return f"No session logs found for {agent_name}."
        parts = []
        for path in matches:
            try:
                content = path.read_text(encoding="utf-8")
                parts.append(f"--- {path.name} ---\n{content[:1500]}")
            except Exception as exc:
                logger.warning(f"Improver: could not read {path.name} ({exc})")
        return "\n\n".join(parts)

    @staticmethod
    def _sanitize(text: str) -> str:
        """Apply all sanitizer patterns to strip project-identifying information."""
        for pattern, replacement in SANITIZE_PATTERNS.items():
            text = re.sub(pattern, replacement, text)
        return text

    def _next_backup_path(self, agent_name: str) -> Path:
        """Return the next available versioned backup path."""
        n = 1
        while True:
            candidate = _PROMPTS_DIR / f"{agent_name}_system_v{n}.md"
            if not candidate.exists():
                return candidate
            n += 1

    async def _run_async(
        self,
        agent_name: str,
        prompt_file: str,
        sanitized_prompt: str,
        sanitized_logs: str,
    ) -> ImprovementSuggestion:
        """Call the remote model and parse the JSON response."""
        from pydantic_ai import Agent
        from src.tools.apj.agents.openrouter_client import get_openrouter_model, log_usage

        model = get_openrouter_model()
        one_liner = AGENT_DESCRIPTIONS[agent_name]

        hardening_prompt = _HARDENING_PROMPT.format(
            agent_one_liner=one_liner,
            prompt=sanitized_prompt,
            session_logs=sanitized_logs,
        )

        example_response = json.dumps({
            "agent_name": agent_name,
            "prompt_file": prompt_file,
            "weaknesses": [
                "The output format instruction is ambiguous — 'ONLY JSON' appears after prose instructions",
                "Few-shot example uses placeholder values that may confuse model",
            ],
            "rewritten_prompt": sanitized_prompt,  # placeholder — model replaces this
            "changes_annotated": [
                "Moved 'ONLY JSON' constraint to top of prompt [CHANGE: reduces ambiguity]",
                "Replaced placeholder values in example with realistic corpus data [CHANGE: better few-shot]",
            ],
            "confidence": "high",
        }, indent=2)

        system_prompt = (
            "You are a prompt engineering expert. Analyze the agent system prompt "
            "and recent outputs provided, then return a JSON improvement suggestion.\n\n"
            f"Return ONLY a JSON object in this shape:\n{example_response}\n\n"
            "CRITICAL: Output ONLY the JSON. No prose before or after."
        )

        agent = Agent(model=model, system_prompt=system_prompt)
        logger.info(f"Improver: sending {agent_name} prompt to {self.model_name}...")

        result = await agent.run(hardening_prompt)
        raw: str = result.output

        # Usage logging (best-effort — remote may not expose token counts)
        try:
            log_usage(
                task=f"improver: {agent_name}",
                tokens_in=len(hardening_prompt) // 4,
                tokens_out=len(raw) // 4,
                model=self.model_name,
            )
        except Exception:
            pass

        # Extract JSON
        json_str = self._extract_json(raw)
        try:
            data, _ = json.JSONDecoder().raw_decode(json_str.strip())
        except json.JSONDecodeError as exc:
            raise ValueError(
                f"Improver: JSON parse failed — {exc}\nRaw: {raw[:300]}"
            ) from exc

        suggestion = ImprovementSuggestion.model_validate(data)
        suggestion.agent_name = agent_name
        suggestion.prompt_file = prompt_file
        logger.info(
            f"Improver: suggestion received — "
            f"{len(suggestion.weaknesses)} weaknesses, "
            f"confidence={suggestion.confidence}"
        )
        return suggestion

    @staticmethod
    def _extract_json(raw: str) -> str:
        """Brace-depth JSON extraction — same pattern as other agents."""
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

    def _fallback_suggestion(
        self, agent_name: str, prompt_file: str, error: str
    ) -> ImprovementSuggestion:
        """Return a stub suggestion when remote call fails."""
        logger.warning(f"Improver: returning fallback suggestion for {agent_name}")
        return ImprovementSuggestion(
            agent_name=agent_name,
            prompt_file=prompt_file,
            weaknesses=[f"Remote call failed: {error[:120]}"],
            rewritten_prompt=self._load_prompt(prompt_file),
            changes_annotated=["No changes applied — remote model was unreachable."],
            confidence="low",
        )

    def _append_quality_log(self, suggestion: ImprovementSuggestion) -> None:
        """Append a quality log entry to docs/agents/prompts/quality_log.md."""
        _PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d")
        weaknesses_str = "\n".join(f"  - {w}" for w in suggestion.weaknesses)
        changes_str    = "\n".join(f"  - {c}" for c in suggestion.changes_annotated)

        entry = (
            f"\n## {timestamp} — {suggestion.agent_name}\n"
            f"Model: {self.model_name}\n"
            f"Confidence: {suggestion.confidence}\n"
            f"Weaknesses identified:\n{weaknesses_str}\n"
            f"Changes:\n{changes_str}\n"
        )

        with open(_QUALITY_LOG, "a", encoding="utf-8") as f:
            f.write(entry)
        logger.info(f"Improver: quality log updated → {_QUALITY_LOG.name}")
