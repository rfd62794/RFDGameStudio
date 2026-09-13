"""
doc_parser.py — APJ Corpus Parser (pure YAML edition)

Reads .yaml planning documents directly into validated Pydantic objects.
Replaces frontmatter extraction with yaml.safe_load() — simpler and faster.
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path
from typing import Union

import yaml
from loguru import logger
from pydantic import ValidationError

from src.tools.apj.schema import (
    Goal, Milestone, Task, JournalEntry, Corpus, Session,
)

_PROJECT_ROOT = Path(__file__).resolve().parents[4]

_DOC_PATHS = {
    "goals":      _PROJECT_ROOT / "docs" / "GOALS.md",
    "milestones": _PROJECT_ROOT / "docs" / "MILESTONES.md",
    "tasks":      _PROJECT_ROOT / "docs" / "TASKS.md",
    "journal":    _PROJECT_ROOT / "docs" / "journal"  / "journal.yaml",
    "sessions":   _PROJECT_ROOT / "docs" / "planning" / "sessions.yaml",
}

DocRecord = Union[Goal, Milestone, Task, JournalEntry, Session]

TYPE_MAP = {
    "goal":      Goal,
    "milestone": Milestone,
    "task":      Task,
    "journal":   JournalEntry,
    "session":   Session,
}


class ParseError(Exception):
    """Raised when a record cannot be parsed."""
    pass


def _parse_record(data: dict) -> DocRecord:
    """Deserialize a dict into the correct Pydantic model from TYPE_MAP."""
    record_type = str(data.get("type", "")).lower()
    model = TYPE_MAP.get(record_type)
    if not model:
        raise ParseError(f"Unknown type '{record_type}'")
    try:
        return model(**data)
    except ValidationError as e:
        raise ParseError(
            f"Validation failed for {record_type} "
            f"'{data.get('id', '?')}': {e}"
        ) from e


def parse_file(path: Path) -> list[DocRecord]:
    """
    Parse all records from a pure YAML file.
    Accepts a YAML list or a single mapping.
    Logs warnings for unparseable records, never raises.
    """
    if not path.exists():
        logger.debug(f"DocParser: {path.name} not found — skipping")
        return []

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not raw:
        return []

    records_data = raw if isinstance(raw, list) else [raw]
    records = []

    for data in records_data:
        if not isinstance(data, dict):
            continue
        try:
            records.append(_parse_record(data))
        except ParseError as e:
            logger.warning(f"DocParser: skipped record in {path.name} — {e}")

    logger.debug(f"DocParser: {path.name} → {len(records)} records")
    return records


def build_corpus() -> Corpus:
    """
    Read all APJ planning YAML documents and build a validated Corpus.
    Missing files produce empty collections — never raises.
    """
    goals: list[Goal] = []
    milestones: list[Milestone] = []
    tasks: list[Task] = []
    journal: list[JournalEntry] = []
    sessions: list[Session] = []

    all_text: list[str] = []

    for key, path in _DOC_PATHS.items():
        records = parse_file(path)
        if path.exists():
            all_text.append(path.read_text(encoding="utf-8"))
        for record in records:
            if isinstance(record, Goal):
                goals.append(record)
            elif isinstance(record, Milestone):
                milestones.append(record)
            elif isinstance(record, Task):
                tasks.append(record)
            elif isinstance(record, JournalEntry):
                journal.append(record)
            elif isinstance(record, Session):
                sessions.append(record)

    corpus_hash = hashlib.sha256(
        "\n".join(all_text).encode("utf-8")
    ).hexdigest()

    corpus = Corpus(
        goals=goals,
        milestones=milestones,
        tasks=tasks,
        journal=journal,
        sessions=sessions,
        parsed_at=datetime.now(),
        corpus_hash=corpus_hash,
    )
    logger.info(
        f"DocParser: corpus built — {len(goals)} goals, "
        f"{len(milestones)} milestones, {len(tasks)} tasks, "
        f"{len(journal)} journal, {len(sessions)} sessions"
    )
    return corpus
