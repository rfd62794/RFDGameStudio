"""
tests/unit/test_apj_schema.py

Unit tests for the APJ schema layer (Phase 1).
Covers: enums, Goal, Milestone, Task, JournalEntry, Corpus, CorpusValidator.
Target: 411 baseline + 11 new = 422 passing.
"""

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from src.tools.apj.schema import (
    Corpus,
    CorpusValidator,
    Goal,
    GoalStatus,
    JournalEntry,
    Milestone,
    MilestoneStatus,
    OwnerType,
    Task,
    TaskScope,
    TaskStatus,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _today() -> date:
    return date(2026, 2, 25)


def _goal(**kwargs) -> Goal:
    defaults = dict(
        id="G1",
        title="Test Goal",
        status=GoalStatus.ACTIVE,
        created=_today(),
        modified=_today(),
    )
    defaults.update(kwargs)
    return Goal(**defaults)


def _milestone(**kwargs) -> Milestone:
    defaults = dict(
        id="M1",
        title="Test Milestone",
        status=MilestoneStatus.ACTIVE,
        created=_today(),
        modified=_today(),
    )
    defaults.update(kwargs)
    return Milestone(**defaults)


def _task(**kwargs) -> Task:
    defaults = dict(
        id="T1",
        title="Test Task",
        status=TaskStatus.ACTIVE,
        scope=TaskScope.TOOLING,
        created=_today(),
        modified=_today(),
    )
    defaults.update(kwargs)
    return Task(**defaults)


def _journal_entry(**kwargs) -> JournalEntry:
    defaults = dict(
        date=_today(),
        session=1,
        test_floor=422,
        summary="Schema layer built.",
    )
    defaults.update(kwargs)
    return JournalEntry(**defaults)


def _corpus(**kwargs) -> Corpus:
    defaults = dict(parsed_at=datetime(2026, 2, 25, 6, 0, 0))
    defaults.update(kwargs)
    return Corpus(**defaults)


# ---------------------------------------------------------------------------
# Goal tests
# ---------------------------------------------------------------------------

def test_goal_valid():
    """A fully valid Goal instantiates without error."""
    g = _goal(id="G99", title="Ship it", status=GoalStatus.COMPLETE)
    assert g.id == "G99"
    assert g.status == GoalStatus.COMPLETE
    assert g.type == "goal"
    assert g.owner == OwnerType.HUMAN


def test_goal_status_enum():
    """An invalid status string raises ValidationError."""
    with pytest.raises(ValidationError):
        _goal(status="INVALID_STATUS")


# ---------------------------------------------------------------------------
# Task tests (LAW 1)
# ---------------------------------------------------------------------------

def test_task_demo_scope_requires_demo():
    """scope=demo without a demo field raises ValidationError."""
    with pytest.raises(ValidationError, match="scope=demo requires demo field"):
        _task(scope=TaskScope.DEMO, demo=None)


def test_task_shared_scope_rejects_demo():
    """scope=shared with a demo field raises ValidationError (LAW 1)."""
    with pytest.raises(ValidationError, match="LAW 1"):
        _task(scope=TaskScope.SHARED, demo="slime_breeder")


# ---------------------------------------------------------------------------
# Milestone tests
# ---------------------------------------------------------------------------

def test_milestone_valid():
    """A fully valid Milestone instantiates correctly."""
    m = _milestone(id="M5", title="APJ Schema", status=MilestoneStatus.QUEUED)
    assert m.id == "M5"
    assert m.type == "milestone"
    assert m.goals == []
    assert m.tasks == []


# ---------------------------------------------------------------------------
# JournalEntry tests
# ---------------------------------------------------------------------------

def test_journal_entry_valid():
    """A valid JournalEntry instantiates with expected defaults."""
    entry = _journal_entry(session=7, test_floor=422, summary="All green.")
    assert entry.session == 7
    assert entry.test_floor == 422
    assert entry.author == OwnerType.SCRIBE
    assert entry.committed == []


# ---------------------------------------------------------------------------
# CorpusValidator tests
# ---------------------------------------------------------------------------

def test_corpus_validator_orphaned_goal():
    """A goal referencing a non-existent milestone is flagged as orphaned."""
    g = _goal(id="G1", milestone="M_GHOST")
    corpus = _corpus(goals=[g])
    errors = corpus.validate_corpus()
    assert any("unknown milestone" in e for e in errors)


def test_corpus_validator_law4():
    """LAW 4: test_floor below 411 triggers an error."""
    entry = _journal_entry(test_floor=400)
    corpus = _corpus(journal=[entry])
    errors = corpus.validate_corpus()
    assert any("LAW 4" in e for e in errors)


def test_corpus_validator_milestone_unknown_goal():
    """A milestone referencing a non-existent goal ID is flagged."""
    m = _milestone(id="M1", goals=["G_GHOST"])
    corpus = _corpus(milestones=[m])
    errors = corpus.validate_corpus()
    assert any("unknown goal" in e for e in errors)


def test_corpus_validate_clean():
    """A fully consistent corpus returns an empty error list."""
    g = _goal(id="G1", milestone="M1")
    m = _milestone(id="M1", goals=["G1"])
    t = _task(id="T1", scope=TaskScope.TOOLING)
    entry = _journal_entry(test_floor=422)
    corpus = _corpus(goals=[g], milestones=[m], tasks=[t], journal=[entry])
    errors = corpus.validate_corpus()
    assert errors == []


def test_corpus_validator_law1_cross_doc():
    """Cross-doc LAW 1 check: scope=demo task with no demo field is caught."""
    # Bypass the model_validator by constructing directly via model_construct
    # to simulate a corrupt/deserialized record that bypassed validation.
    # We also use Corpus.model_construct so Pydantic does NOT re-validate
    # the task list — the validator receives the raw, bad record as-is.
    bad_task = Task.model_construct(
        id="T_BAD",
        type="task",
        title="Bad task",
        status=TaskStatus.ACTIVE,
        scope=TaskScope.DEMO,
        demo=None,       # violates LAW 1, bypassed model_validator
        milestone=None,
        owner=OwnerType.HUMAN,
        created=_today(),
        modified=_today(),
        tags=[],
    )
    corpus = Corpus.model_construct(
        goals=[],
        milestones=[],
        tasks=[bad_task],
        journal=[],
        parsed_at=datetime(2026, 2, 25, 6, 0, 0),
        corpus_hash="",
    )
    errors = corpus.validate_corpus()
    assert any("scope=demo" in e for e in errors)


# ---------------------------------------------------------------------------
# Phase 4 — Session, SessionStatus, OwnerType agent roles, Task tracking
# ---------------------------------------------------------------------------

def test_session_valid():
    """A valid Session instantiates with expected defaults."""
    from src.tools.apj.schema import Session, SessionStatus
    s = Session(id="S001", status=SessionStatus.ACTIVE, test_floor=434)
    assert s.id == "S001"
    assert s.status == SessionStatus.ACTIVE
    assert s.type == "session"
    assert s.tasks_planned == []


def test_session_status_enum():
    """An invalid status string raises ValidationError."""
    from src.tools.apj.schema import Session
    with pytest.raises(ValidationError):
        Session(id="S001", status="INVALID")


def test_owner_type_agent_roles():
    """All agent OwnerType values instantiate without error."""
    from src.tools.apj.schema import OwnerType
    agents = [
        OwnerType.ARCHIVIST, OwnerType.STRATEGIST, OwnerType.SCRIBE,
        OwnerType.CURATOR, OwnerType.DIRECTOR,
    ]
    assert len(agents) == 5
    assert all(isinstance(a, OwnerType) for a in agents)


def test_task_session_tracking():
    """Task with created_session and target_session fields populates correctly."""
    t = _task(
        id="T_TRACK",
        created_session="S001",
        modified_session="S005",
        target_session="S006",
    )
    assert t.created_session == "S001"
    assert t.modified_session == "S005"
    assert t.target_session == "S006"


def test_task_deferred_fields():
    """Task with deferred_from and deferred_reason populates correctly."""
    t = _task(
        id="T_DEF",
        deferred_from="S004",
        deferred_reason="Blocked on parser refactor",
    )
    assert t.deferred_from == "S004"
    assert t.deferred_reason == "Blocked on parser refactor"
