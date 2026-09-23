"""
tests/unit/test_apj_parser.py

Unit tests for the APJ corpus parser (Phase 2 + Phase 4 updates).
Pure YAML edition — uses tmp_path with .yaml files.
Target: 422 baseline + 12 (Phase 2) + 8 (Phase 4) = 442 passing.
"""

from datetime import date, datetime
from pathlib import Path

import pytest
import yaml

from src.tools.apj.parser import (
    ParseError,
    ValidationResult,
    build_corpus,
    parse_file,
    validate_corpus,
)
from src.tools.apj.parser.doc_parser import _parse_record
from src.tools.apj.schema import (
    Corpus,
    Goal,
    GoalStatus,
    Session,
    SessionStatus,
    Task,
    TaskScope,
    TaskStatus,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _write_yaml(tmp_path: Path, name: str, records: list[dict]) -> Path:
    p = tmp_path / name
    p.write_text(
        yaml.dump(records, allow_unicode=True, sort_keys=False),
        encoding="utf-8",
    )
    return p


def _goal_dict(**kwargs) -> dict:
    d = {
        "id": "G1",
        "type": "goal",
        "title": "Ship the Parser",
        "status": "ACTIVE",
        "owner": "human",
        "created": date(2026, 2, 25),
        "modified": date(2026, 2, 25),
        "tags": [],
    }
    d.update(kwargs)
    return d


def _task_dict(**kwargs) -> dict:
    d = {
        "id": "T1",
        "type": "task",
        "title": "Write doc_parser.py",
        "status": "ACTIVE",
        "scope": "tooling",
        "owner": "human",
        "created": date(2026, 2, 25),
        "modified": date(2026, 2, 25),
        "tags": [],
    }
    d.update(kwargs)
    return d


def _session_dict(**kwargs) -> dict:
    d = {
        "id": "S001",
        "type": "session",
        "session_date": date(2026, 2, 25),
        "status": "COMPLETE",
        "test_floor": 434,
        "focus": "Test session",
        "tasks_planned": [],
        "tasks_completed": [],
        "tasks_deferred": [],
    }
    d.update(kwargs)
    return d


# ---------------------------------------------------------------------------
# Record parsing (pure YAML dispatch — Phase 2 core, updated)
# ---------------------------------------------------------------------------

def test_parse_goal_record():
    """Valid goal dict → Goal instance with correct fields."""
    record = _parse_record(_goal_dict(id="G2"))
    assert isinstance(record, Goal)
    assert record.id == "G2"
    assert record.status == GoalStatus.ACTIVE


def test_parse_task_record():
    """Valid task dict → Task instance."""
    record = _parse_record(_task_dict(id="T3", scope="tooling"))
    assert isinstance(record, Task)
    assert record.scope == TaskScope.TOOLING


def test_parse_task_law1_violation_raises():
    """scope=shared with demo field → ParseError (LAW 1)."""
    with pytest.raises(ParseError, match="Validation failed"):
        _parse_record(_task_dict(scope="shared", demo="slime_breeder"))


def test_parse_unknown_type_raises():
    """An unknown type string → ParseError."""
    with pytest.raises(ParseError, match="Unknown type"):
        _parse_record({"id": "X1", "type": "widget"})


# ---------------------------------------------------------------------------
# parse_file — pure YAML
# ---------------------------------------------------------------------------

def test_parse_file_missing_returns_empty(tmp_path):
    """parse_file on a non-existent path returns empty list, never raises."""
    result = parse_file(tmp_path / "does_not_exist.yaml")
    assert result == []


def test_parse_file_skips_invalid_records(tmp_path):
    """A file with one LAW-1-violating record and one valid record: bad is skipped."""
    records = [
        _goal_dict(id="G1"),                           # good
        _task_dict(scope="shared", demo="slime_breeder"),  # bad — LAW 1
    ]
    path = _write_yaml(tmp_path, "varied.yaml", records)
    result = parse_file(path)
    assert len(result) == 1
    assert isinstance(result[0], Goal)


def test_parse_file_reads_yaml_list(tmp_path):
    """pure YAML file with a list of records parses all entries."""
    records = [_goal_dict(id="G1"), _goal_dict(id="G2")]
    path = _write_yaml(tmp_path, "goals.yaml", records)
    result = parse_file(path)
    assert len(result) == 2
    assert {r.id for r in result} == {"G1", "G2"}


# ---------------------------------------------------------------------------
# build_corpus
# ---------------------------------------------------------------------------

def test_build_corpus_empty_docs(tmp_path, monkeypatch):
    """build_corpus with no real docs → empty Corpus, no raise."""
    import src.tools.apj.parser.doc_parser as dp

    monkeypatch.setattr(dp, "_DOC_PATHS", {
        "goals":      tmp_path / "goals.yaml",
        "milestones": tmp_path / "milestones.yaml",
        "tasks":      tmp_path / "tasks.yaml",
        "journal":    tmp_path / "journal.yaml",
        "sessions":   tmp_path / "sessions.yaml",
    })
    corpus = build_corpus()
    assert isinstance(corpus, Corpus)
    assert corpus.goals == []
    assert corpus.tasks == []
    assert corpus.sessions == []


def test_build_corpus_with_goals(tmp_path, monkeypatch):
    """build_corpus with a goals yaml → Corpus.goals populated."""
    import src.tools.apj.parser.doc_parser as dp

    goals_file = _write_yaml(tmp_path, "goals.yaml", [_goal_dict(id="G1")])
    monkeypatch.setattr(dp, "_DOC_PATHS", {
        "goals":      goals_file,
        "milestones": tmp_path / "milestones.yaml",
        "tasks":      tmp_path / "tasks.yaml",
        "journal":    tmp_path / "journal.yaml",
        "sessions":   tmp_path / "sessions.yaml",
    })
    corpus = build_corpus()
    assert len(corpus.goals) == 1
    assert corpus.goals[0].id == "G1"
    assert corpus.corpus_hash


# ---------------------------------------------------------------------------
# validate_corpus
# ---------------------------------------------------------------------------

def test_validate_corpus_clean():
    """A self-consistent corpus → ValidationResult.passed is True."""
    from src.tools.apj.schema import Goal, Milestone, GoalStatus, MilestoneStatus, OwnerType

    g = Goal(
        id="G1", title="Ship it", status=GoalStatus.ACTIVE,
        milestone="M1", owner=OwnerType.HUMAN,
        created=date(2026, 2, 25), modified=date(2026, 2, 25),
    )
    m = Milestone(
        id="M1", title="Phase 1", status=MilestoneStatus.ACTIVE,
        goals=["G1"], owner=OwnerType.HUMAN,
        created=date(2026, 2, 25), modified=date(2026, 2, 25),
    )
    corpus = Corpus(
        goals=[g], milestones=[m], tasks=[], journal=[],
        parsed_at=datetime(2026, 2, 25, 6, 0, 0),
    )
    result = validate_corpus(corpus)
    assert result.passed is True
    assert result.errors == []
    assert "valid" in result.summary()


def test_validate_corpus_orphan():
    """Goal referencing unknown milestone → error in ValidationResult."""
    from src.tools.apj.schema import Goal, GoalStatus, OwnerType

    g = Goal(
        id="G99", title="Orphan", status=GoalStatus.ACTIVE,
        milestone="M_GHOST", owner=OwnerType.HUMAN,
        created=date(2026, 2, 25), modified=date(2026, 2, 25),
    )
    corpus = Corpus(
        goals=[g], milestones=[], tasks=[], journal=[],
        parsed_at=datetime(2026, 2, 25, 6, 0, 0),
    )
    result = validate_corpus(corpus)
    assert result.passed is False
    assert result.error_count == 1
    assert any("unknown milestone" in e for e in result.errors)
    assert "violation" in result.summary()


# ---------------------------------------------------------------------------
# Phase 4 — Session parsing + schema tests
# ---------------------------------------------------------------------------

def test_parse_session_record():
    """Valid session dict → Session instance with correct fields."""
    record = _parse_record(_session_dict(id="S99", status="ACTIVE"))
    assert isinstance(record, Session)
    assert record.id == "S99"
    assert record.status == SessionStatus.ACTIVE
    assert record.test_floor == 434


def test_build_corpus_with_sessions(tmp_path, monkeypatch):
    """sessions.yaml → Corpus.sessions populated."""
    import src.tools.apj.parser.doc_parser as dp

    sessions_file = _write_yaml(tmp_path, "sessions.yaml", [
        _session_dict(id="S001", status="COMPLETE"),
        _session_dict(id="S002", status="ACTIVE"),
    ])
    monkeypatch.setattr(dp, "_DOC_PATHS", {
        "goals":      tmp_path / "goals.yaml",
        "milestones": tmp_path / "milestones.yaml",
        "tasks":      tmp_path / "tasks.yaml",
        "journal":    tmp_path / "journal.yaml",
        "sessions":   sessions_file,
    })
    corpus = build_corpus()
    assert len(corpus.sessions) == 2
    assert corpus.sessions[0].id == "S001"


def test_pure_yaml_parse_file(tmp_path):
    """Pure YAML file (no frontmatter) with multiple records parses cleanly."""
    records = [
        _session_dict(id="S001", status="COMPLETE"),
        _session_dict(id="S002", status="ACTIVE"),
        _session_dict(id="S003", status="PLANNED"),
    ]
    path = _write_yaml(tmp_path, "sessions.yaml", records)
    result = parse_file(path)
    assert len(result) == 3
    assert all(isinstance(r, Session) for r in result)


def test_session_no_date():
    """Session instantiates fine without a session_date (field is optional)."""
    record = _parse_record({
        "id": "S_NODATETEST",
        "type": "session",
        "status": "PLANNED",
        "focus": "Undated session",
    })
    assert isinstance(record, Session)
    assert record.session_date is None
    assert record.status == SessionStatus.PLANNED
