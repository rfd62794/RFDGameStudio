"""
tests/unit/test_apj_herald.py — Unit tests for the Herald agent.

All tests are offline — no Ollama required. File I/O uses tmp_path.
Target: 4 tests, bringing total from 448 to 452.
"""

import pytest
from pathlib import Path
from unittest.mock import patch


# ---------------------------------------------------------------------------
# Helpers — minimal SessionPlan for testing
# ---------------------------------------------------------------------------

def _make_plan():
    """Build a minimal valid SessionPlan without touching Ollama."""
    from src.tools.apj.agents.strategist import SessionPlan, SessionOption

    opt = SessionOption(
        label="Headlong",
        title="Loot System v1",
        rationale="Primary milestone deliverable.",
        tasks=[
            "Create src/shared/engine/loot/__init__.py",
            "Create src/shared/engine/loot/item.py with ItemDrop dataclass",
            "Run uv run pytest tests/unit/test_loot.py -v — target 452 passing",
        ],
        risk="Low",
        milestone_impact="M8 — Dungeon Crawler Frame",
    )
    return SessionPlan(
        recommended=opt,
        alternatives=[
            SessionOption(
                label="Divert",
                title="Triage Open Risks",
                rationale="Address Archivist flags first.",
                tasks=["Review docs/session_logs/ for last archivist report"],
                risk="Low",
                milestone_impact="M10 — Portfolio Pass",
            ),
            SessionOption(
                label="Alt",
                title="Doc Update Only",
                rationale="Low-risk docs pass.",
                tasks=["Update docs/reference/DUNGEON_DESIGN.md parking lot"],
                risk="Low",
                milestone_impact="M3 — APJ Toolchain Live",
            ),
        ],
        open_questions=[],
        archivist_risks_addressed=[],
        corpus_hash="abc123def456",
    )


# ---------------------------------------------------------------------------
# 1. Fallback directive produced when Ollama fails
# ---------------------------------------------------------------------------

def test_herald_fallback_directive():
    """Ollama mocked to fail → valid HeraldDirective with confidence='low'."""
    from src.tools.apj.agents.herald import Herald, HeraldDirective

    herald = Herald.__new__(Herald)
    herald.model_name = "llama3.2:1b"
    herald._agent = None

    plan = _make_plan()
    directive = herald._fallback_directive(plan)

    assert isinstance(directive, HeraldDirective)
    assert directive.confidence == "low"
    assert directive.title == "Loot System v1"
    assert directive.preamble == "Run `python -m src.tools.apj handoff`."
    # Fallback carries Strategist tasks
    assert len(directive.tasks) == 3


# ---------------------------------------------------------------------------
# 2. All tasks contain at least one "/" (path indicator)
# ---------------------------------------------------------------------------

def test_herald_directive_has_file_paths():
    """Fallback tasks from a well-formed plan include file path indicators."""
    from src.tools.apj.agents.herald import Herald

    herald = Herald.__new__(Herald)
    herald.model_name = "llama3.2:1b"
    herald._agent = None

    plan = _make_plan()
    directive = herald._fallback_directive(plan)

    # Every task in our test plan references a path with "/"
    for task in directive.tasks:
        assert "/" in task, f"Task has no file path indicator: {task!r}"


# ---------------------------------------------------------------------------
# 3. Commit message starts with a conventional commits prefix
# ---------------------------------------------------------------------------

def test_herald_commit_message_format():
    """commit_message must start with feat/fix/docs/refactor."""
    from src.tools.apj.agents.herald import Herald

    herald = Herald.__new__(Herald)
    herald.model_name = "llama3.2:1b"
    herald._agent = None

    plan = _make_plan()
    directive = herald._fallback_directive(plan)

    valid_prefixes = ("feat:", "fix:", "docs:", "refactor:", "chore:", "test:")
    assert any(
        directive.commit_message.startswith(p) for p in valid_prefixes
    ), f"commit_message has no valid prefix: {directive.commit_message!r}"


# ---------------------------------------------------------------------------
# 4. _save_directive writes to the correct directory
# ---------------------------------------------------------------------------

def test_herald_saves_to_session_logs(tmp_path):
    """_save_directive creates a *_herald.md file in the target directory."""
    from src.tools.apj.agents.herald import Herald, HeraldDirective

    herald = Herald.__new__(Herald)
    herald.model_name = "llama3.2:1b"
    herald._agent = None

    directive = HeraldDirective(
        session_id="S007",
        title="Test Directive",
        preamble="Run `python -m src.tools.apj handoff`.",
        context="Context for the agent.",
        tasks=[
            "1. Create src/shared/engine/loot/__init__.py",
            "2. Run uv run pytest -- target 452",
        ],
        verification="uv run pytest tests/unit/test_loot.py -v",
        commit_message="feat: test directive for herald unit test",
        confidence="high",
    )

    saved_path = herald._save_directive(directive, log_dir=tmp_path)

    assert saved_path.exists()
    assert saved_path.name.endswith("_herald.md")
    content = saved_path.read_text(encoding="utf-8")
    assert "Test Directive" in content
    assert "Run `python -m src.tools.apj handoff`." in content
    assert "feat: test directive for herald unit test" in content
