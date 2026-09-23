from datetime import date
from typing import Literal
from pydantic import BaseModel
from .enums import MilestoneStatus, OwnerType


class Milestone(BaseModel):
    id: str
    type: Literal["milestone"] = "milestone"
    title: str
    status: MilestoneStatus
    goals: list[str] = []
    tasks: list[str] = []
    owner: OwnerType = OwnerType.HUMAN
    created_by: OwnerType = OwnerType.SYSTEM
    created_session: str = "S000"
    modified_by: OwnerType = OwnerType.SYSTEM
    modified_session: str = "S000"
    created: date
    modified: date
