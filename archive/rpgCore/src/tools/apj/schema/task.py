from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, model_validator
from .enums import TaskStatus, TaskScope, OwnerType


class Task(BaseModel):
    id: str
    type: Literal["task"] = "task"
    title: str
    status: TaskStatus
    scope: TaskScope
    demo: Optional[str] = None
    milestone: Optional[str] = None

    # Ownership
    created_by: OwnerType = OwnerType.SYSTEM
    created_session: str = "S000"
    modified_by: OwnerType = OwnerType.SYSTEM
    modified_session: str = "S000"

    # Session scheduling
    target_session: Optional[str] = None
    deferred_from: Optional[str] = None
    deferred_reason: Optional[str] = None

    created: date
    modified: date
    tags: list[str] = []

    @model_validator(mode="after")
    def validate_demo_scope(self) -> "Task":
        if self.scope == TaskScope.DEMO and not self.demo:
            raise ValueError("scope=demo requires demo field")
        if self.scope == TaskScope.SHARED and self.demo:
            raise ValueError("scope=shared cannot reference demo — LAW 1")
        return self
