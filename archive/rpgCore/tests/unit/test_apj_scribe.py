"""
tests/unit/test_apj_scribe.py — Unit tests for the Scribe agent.

All tests are offline — no Ollama required. File I/O uses tmp_path.
Target: 5 tests, bringing total to 448.
"""

import pytest
from datetime import date
from pathlib import Path


# ---------------------------------------------------------------------------
# Helper — minimal tasks.yaml content
# ---------------------------------------------------------------------------
_TASKS_YAML = """\
- id: T001
  type: task
  title: Test task alpha
  status: ACTIVE
  scope: shared

- id: T002
  type: task
  title: Test task beta
  status: QUEUED
  scope: demo
"""

_JOURNAL_YAML = """\
- id: S001
  type: journal
  date: '2026-02-20'
  session: 1
  author: scribe
  test_floor: 385
  summary: First session.
  committed: []
  tasks_completed: []
  tasks_added: []
"""


# ---------------------------------------------------------------------------
# 1. _next_session_id — existing entries
# ---------------------------------------------------------------------------
def test_scribe_next_session_id():
    """S005 is the highest existing ID → next is S006."""
    from src.tools.apj.agents.scribe import Scribe
    existing = ["S001", "S002", "S003", "S004", "S005"]
    result = Scribe._next_session_id(existing)
    assert result == "S006"


# ---------------------------------------------------------------------------
# 2. _next_session_id — no existing entries
# ---------------------------------------------------------------------------
def test_scribe_next_session_id_empty():
    """No existing journal entries → first ID is S001."""
    from src.tools.apj.agents.scribe import Scribe
    result = Scribe._next_session_id([])
    assert result == "S001"


# ---------------------------------------------------------------------------
# 3. _fallback_draft — Ollama mocked to fail
# ---------------------------------------------------------------------------
def test_scribe_fallback_draft():
    """Fallback draft is a valid ScribeDraft with low confidence."""
    from src.tools.apj.agents.scribe import Scribe, ScribeDraft

    scribe = Scribe.__new__(Scribe)   # bypass __init__ (no Ollama touch)
    scribe.model_name = "llama3.2:1b"
    scribe._agent = None

    draft = scribe._fallback_draft(
        diff="git diff unavailable",
        test_count=443,
        session_id="S006",
    )

    assert isinstance(draft, ScribeDraft)
    assert draft.session_id == "S006"
    assert draft.test_floor == 443
    assert draft.confidence == "low"
    assert "443" in draft.summary
    assert draft.session_date == str(date.today())


# ---------------------------------------------------------------------------
# 4. _write_journal_entry — appends to tmp journal.yaml
# ---------------------------------------------------------------------------
def test_scribe_write_journal_entry(tmp_path, monkeypatch):
    """_write_journal_entry appends a new record to journal.yaml."""
    import yaml
    from src.tools.apj.agents.scribe import Scribe, ScribeDraft, _JOURNAL_PATH

    # Point JOURNAL_PATH to tmp file
    tmp_journal = tmp_path / "journal.yaml"
    tmp_journal.write_text(_JOURNAL_YAML, encoding="utf-8")
    monkeypatch.setattr(
        "src.tools.apj.agents.scribe._JOURNAL_PATH", tmp_journal
    )

    scribe = Scribe.__new__(Scribe)
    scribe.model_name = "llama3.2:1b"
    scribe._agent = None

    draft = ScribeDraft(
        session_id="S006",
        session_date=str(date.today()),
        test_floor=443,
        summary="Phase 5 complete. Archivist wired to build_corpus().",
        committed=["abc1234"],
        tasks_completed=["T001"],
        tasks_added=[],
        confidence="high",
    )

    scribe._write_journal_entry(draft)

    result = yaml.safe_load(tmp_journal.read_text(encoding="utf-8"))
    assert isinstance(result, list)
    assert len(result) == 2          # original + new
    new_entry = result[-1]
    assert new_entry["id"] == "S006"
    assert new_entry["test_floor"] == 443
    assert new_entry["author"] == "scribe"
    assert "abc1234" in new_entry["committed"]


# ---------------------------------------------------------------------------
# 5. _mark_tasks_done — updates task status in tmp tasks.yaml
# ---------------------------------------------------------------------------
def test_scribe_mark_tasks_done(tmp_path, monkeypatch):
    """_mark_tasks_done sets status=DONE on matched task IDs."""
    import yaml
    from src.tools.apj.agents.scribe import Scribe

    tmp_tasks = tmp_path / "tasks.yaml"
    tmp_tasks.write_text(_TASKS_YAML, encoding="utf-8")
    monkeypatch.setattr(
        "src.tools.apj.agents.scribe._TASKS_PATH", tmp_tasks
    )

    scribe = Scribe.__new__(Scribe)
    scribe.model_name = "llama3.2:1b"
    scribe._agent = None

    scribe._mark_tasks_done(["T001"], "S006")

    result = yaml.safe_load(tmp_tasks.read_text(encoding="utf-8"))
    t001 = next(t for t in result if t["id"] == "T001")
    t002 = next(t for t in result if t["id"] == "T002")

    assert t001["status"] == "DONE"
    assert t001["modified_by"] == "scribe"
    assert t001["modified_session"] == "S006"
    assert t002["status"] == "QUEUED"   # untouched
