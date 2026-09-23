from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel
from .enums import SessionStatus


class Session(BaseModel):
    id: str                               # S001, S012
    type: Literal["session"] = "session"
    session_date: Optional[date] = None   # renamed from 'date' to avoid Pydantic V2 field/type collision
    status: SessionStatus
    test_floor: Optional[int] = None
    focus: str = ""
    tasks_planned: list[str] = []
    tasks_completed: list[str] = []
    tasks_deferred: list[str] = []
