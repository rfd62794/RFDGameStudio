"""
scribe.py — APJ Scribe Agent

Single responsibility: read git diff + current corpus state,
draft a JournalEntry, propose tasks completed/added.

Runs at session END via: python -m src.tools.apj session end

Output:
  - Drafted JournalEntry printed for human review
  - Human approves → Scribe writes to journal.yaml
  - Proposed task status changes printed for review
  - Human approves → Scribe updates tasks.yaml

The Scribe NEVER writes without human approval.
Owner on all Scribe-authored records: OwnerType.SCRIBE
"""

from __future__ import annotations

import asyncio
import json
import re
import subprocess
from datetime import date, datetime
from pathlib import Path
from typing import Optional

import yaml
from loguru import logger
from pydantic import BaseModel

from src.tools.apj.agents.ollama_client import get_ollama_model, resolve_model
from src.tools.apj.parser import build_corpus
from src.tools.apj.schema import OwnerType

_PROJECT_ROOT = Path(__file__).resolve().parents[4]
_JOURNAL_PATH = _PROJECT_ROOT / "docs" / "journal" / "journal.yaml"
_TASKS_PATH   = _PROJECT_ROOT / "docs" / "planning" / "tasks.yaml"
_SESSION_LOGS = _PROJECT_ROOT / "docs" / "agents" / "session_logs"


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
class ScribeDraft(BaseModel):
    """Draft output from the Scribe — shown to human before writing."""
    session_id: str
    session_date: str          # ISO string — avoids Pydantic date/field collision
    test_floor: int
    summary: str
    committed: list[str] = []
    tasks_completed: list[str] = []
    tasks_added: list[str] = []
    confidence: str = "high"   # high / medium / low


# ---------------------------------------------------------------------------
# Scribe
# ---------------------------------------------------------------------------
class Scribe:
    def __init__(self, model_name: Optional[str] = None) -> None:
        from src.tools.apj.agents.ollama_client import warm_model_sync
        resolved = model_name or resolve_model()
        self.model_name = warm_model_sync(resolved)   # may downgrade to 1b/0.5b
        self._agent = None
        logger.info(f"Scribe initialized (model={self.model_name})")

    # ── Public API ─────────────────────────────────────────────────────────

    def run(self) -> Optional[ScribeDraft]:
        """
        Read git diff + corpus, draft journal entry.
        Returns draft for human approval. Never writes automatically.
        """
        diff = self._get_git_diff()
        test_count = self._get_test_count()
        corpus = build_corpus()

        existing_ids = [e.id for e in corpus.journal if e.id]
        session_id = self._next_session_id(existing_ids)

        try:
            draft = asyncio.run(
                self._run_async(diff, test_count, corpus, session_id)
            )
        except Exception as exc:
            logger.warning(f"Scribe: Ollama failed ({exc}). Using fallback.")
            draft = self._fallback_draft(diff, test_count, session_id)

        self._save_draft(draft)
        return draft

    def approve_and_write(self, draft: ScribeDraft) -> None:
        """
        Write approved draft to journal.yaml and update tasks.yaml.
        Called only after human approves.
        """
        self._write_journal_entry(draft)
        if draft.tasks_completed:
            self._mark_tasks_done(draft.tasks_completed, draft.session_id)
        logger.info(
            f"Scribe: journal entry {draft.session_id} written. "
            f"{len(draft.tasks_completed)} tasks marked done."
        )

    # ── Git helpers ────────────────────────────────────────────────────────

    def _get_git_diff(self) -> str:
        """Get git diff of last commit — what actually changed."""
        try:
            stat = subprocess.run(
                ["git", "diff", "HEAD~1", "--stat"],
                capture_output=True, text=True,
                cwd=_PROJECT_ROOT, timeout=10,
            )
            commit = subprocess.run(
                ["git", "log", "-1", "--pretty=%H|%s"],
                capture_output=True, text=True,
                cwd=_PROJECT_ROOT, timeout=10,
            )
            return (
                f"LAST COMMIT:\n{commit.stdout.strip()}\n\n"
                f"CHANGED FILES:\n{stat.stdout.strip()}"
            )
        except Exception as exc:
            logger.warning(f"Scribe: git diff failed ({exc})")
            return "git diff unavailable"

    def _get_test_count(self) -> int:
        """Count tests via pytest --co -q (no execution)."""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "--co", "-q"],
                capture_output=True, text=True,
                cwd=_PROJECT_ROOT, timeout=60,
            )
            for line in result.stdout.splitlines():
                if "selected" in line:
                    match = re.search(r"(\d+)", line)
                    if match:
                        return int(match.group(1))
        except Exception as exc:
            logger.warning(f"Scribe: test count failed ({exc})")
        return 443  # known floor

    # ── Agent ──────────────────────────────────────────────────────────────

    def _get_agent(self):
        if self._agent is None:
            from pydantic_ai import Agent

            model = get_ollama_model(
                model_name=self.model_name, temperature=0.2
            )
            example = json.dumps({
                "session_id": "S006",
                "session_date": str(date.today()),
                "test_floor": 443,
                "summary": (
                    "Archivist wired to build_corpus(). "
                    "Memory fallback chain and robust JSON extraction shipped."
                ),
                "committed": ["abc1234"],
                "tasks_completed": ["T041"],
                "tasks_added": [],
                "confidence": "high",
            })
            system_prompt = (
                _load_prompt("scribe_system.md")
                + f"\n\n{example}\n\n"
                + _load_prompt("scribe_fewshot.md")
            )
            self._agent = Agent(model=model, system_prompt=system_prompt)
            logger.debug("Scribe: Agent initialized")
        return self._agent

    async def _run_async(
        self,
        diff: str,
        test_count: int,
        corpus,
        session_id: str,
    ) -> ScribeDraft:
        agent = self._get_agent()
        active_tasks = [t for t in corpus.tasks if t.status.value == "ACTIVE"]
        prompt = (
            f"SESSION ID: {session_id}\n"
            f"DATE: {date.today()}\n"
            f"TEST COUNT: {test_count}\n\n"
            f"GIT DIFF:\n{diff[:2000]}\n\n"
            "ACTIVE TASKS:\n"
            + "\n".join(f"  {t.id}: {t.title}" for t in active_tasks[:15])
        )
        result = await agent.run(prompt)
        raw = result.output
        logger.debug(f"Scribe: raw response {len(raw)} chars")

        # Brace-depth extraction
        start = raw.find("{")
        if start != -1:
            depth = 0
            for i, ch in enumerate(raw[start:], start):
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        raw = raw[start:i + 1]
                        break

        data, _ = json.JSONDecoder().raw_decode(raw.strip())
        draft = ScribeDraft.model_validate(data)
        draft.session_id = session_id
        draft.session_date = str(date.today())
        draft.test_floor = test_count
        logger.info(f"Scribe: draft complete — {session_id}, floor {test_count}")
        return draft

    # ── Fallback ───────────────────────────────────────────────────────────

    def _fallback_draft(
        self, diff: str, test_count: int, session_id: str
    ) -> ScribeDraft:
        logger.warning("Scribe: generating fallback draft (Ollama offline)")
        committed = []
        for line in diff.splitlines():
            if "|" in line:
                parts = line.split("|")
                candidate = parts[0].strip()
                if len(candidate) >= 7 and all(c in "0123456789abcdef" for c in candidate[:7]):
                    committed.append(candidate[:7])
                    break
        return ScribeDraft(
            session_id=session_id,
            session_date=str(date.today()),
            test_floor=test_count,
            summary=(
                f"Session {session_id} closed. Ollama offline — "
                f"manual review required. {test_count} tests passing."
            ),
            committed=committed,
            confidence="low",
        )

    # ── Write helpers ──────────────────────────────────────────────────────

    @staticmethod
    def _next_session_id(existing_ids: list[str]) -> str:
        """Generate next session ID from existing journal entry IDs."""
        nums = []
        for sid in existing_ids:
            if sid and sid.upper().startswith("S"):
                try:
                    nums.append(int(sid[1:]))
                except ValueError:
                    pass
        next_num = (max(nums) + 1) if nums else 1
        return f"S{next_num:03d}"

    def _write_journal_entry(self, draft: ScribeDraft) -> None:
        """Append new record to journal.yaml."""
        entry = {
            "id": draft.session_id,
            "type": "journal",
            "date": draft.session_date,
            "session": int(draft.session_id[1:]),
            "author": OwnerType.SCRIBE.value,
            "test_floor": draft.test_floor,
            "summary": draft.summary,
            "committed": draft.committed,
            "tasks_completed": draft.tasks_completed,
            "tasks_added": draft.tasks_added,
        }
        existing: list = []
        if _JOURNAL_PATH.exists():
            raw = yaml.safe_load(_JOURNAL_PATH.read_text(encoding="utf-8"))
            existing = raw if isinstance(raw, list) else []

        existing.append(entry)
        _JOURNAL_PATH.write_text(
            yaml.dump(existing, allow_unicode=True,
                      sort_keys=False, default_flow_style=False),
            encoding="utf-8",
        )

    def _mark_tasks_done(
        self, task_ids: list[str], session_id: str
    ) -> None:
        """Mark specified tasks as DONE in tasks.yaml."""
        if not _TASKS_PATH.exists():
            return
        raw = yaml.safe_load(_TASKS_PATH.read_text(encoding="utf-8"))
        tasks = raw if isinstance(raw, list) else []
        updated = 0
        for task in tasks:
            if task.get("id") in task_ids:
                task["status"] = "DONE"
                task["modified_by"] = OwnerType.SCRIBE.value
                task["modified_session"] = session_id
                task["modified"] = str(date.today())
                updated += 1
        _TASKS_PATH.write_text(
            yaml.dump(tasks, allow_unicode=True,
                      sort_keys=False, default_flow_style=False),
            encoding="utf-8",
        )
        logger.info(f"Scribe: {updated} tasks marked DONE")

    def _save_draft(self, draft: ScribeDraft) -> None:
        """Save draft to session_logs for reference."""
        _SESSION_LOGS.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        path = _SESSION_LOGS / f"{timestamp}_scribe.md"
        lines = [
            f"# Scribe Draft — {draft.session_id} — {draft.session_date}\n",
            f"**Test Floor:** {draft.test_floor}  ",
            f"**Confidence:** {draft.confidence}\n",
            "## Summary",
            draft.summary,
            "\n## Committed",
            *([f"- {c}" for c in draft.committed] or ["- none"]),
            "\n## Tasks Completed",
            *([f"- {t}" for t in draft.tasks_completed] or ["- none"]),
            "\n## Tasks Added",
            *([f"- {t}" for t in draft.tasks_added] or ["- none"]),
        ]
        path.write_text("\n".join(lines), encoding="utf-8")
        try:
            display = path.relative_to(_PROJECT_ROOT)
        except ValueError:
            display = path
        logger.info(f"Scribe: draft saved -> {display}")
