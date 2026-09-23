from datetime import date
from typing import Optional
from pydantic import BaseModel
from .enums import OwnerType


class JournalEntry(BaseModel):
    id: Optional[str] = None
    date: date
    session: int
    author: OwnerType = OwnerType.SCRIBE
    test_floor: int
    summary: str
    committed: list[str] = []
    tasks_completed: list[str] = []
    tasks_added: list[str] = []
