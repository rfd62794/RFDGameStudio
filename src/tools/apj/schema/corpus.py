from datetime import datetime
from pydantic import BaseModel
from .goal import Goal
from .milestone import Milestone
from .task import Task
from .journal import JournalEntry
from .session import Session
from .enums import TaskScope


class CorpusValidator:

    def validate(self, corpus: "Corpus") -> list[str]:
        errors = []

        goal_ids = {g.id for g in corpus.goals}
        milestone_ids = {m.id for m in corpus.milestones}

        # Orphaned goals
        for goal in corpus.goals:
            if goal.milestone and goal.milestone not in milestone_ids:
                errors.append(
                    f"{goal.id} references unknown milestone '{goal.milestone}'"
                )

        # LAW 1 — enforced at model level via Task validator
        # Additional cross-doc check
        for task in corpus.tasks:
            if task.scope == TaskScope.DEMO and not task.demo:
                errors.append(f"{task.id} scope=demo but demo field not set")

        # Milestone consistency
        for milestone in corpus.milestones:
            for goal_id in milestone.goals:
                if goal_id not in goal_ids:
                    errors.append(
                        f"{milestone.id} references unknown goal '{goal_id}'"
                    )

        # LAW 4 — test floor
        if corpus.journal:
            latest = sorted(corpus.journal, key=lambda e: e.date)[-1]
            if latest.test_floor < 411:
                errors.append(
                    f"LAW 4 — test floor {latest.test_floor} below current floor 411"
                )

        return errors


class Corpus(BaseModel):
    goals: list[Goal] = []
    milestones: list[Milestone] = []
    tasks: list[Task] = []
    journal: list[JournalEntry] = []
    sessions: list[Session] = []
    parsed_at: datetime
    corpus_hash: str = ""

    def validate_corpus(self) -> list[str]:
        return CorpusValidator().validate(self)
