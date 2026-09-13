from enum import Enum


class GoalStatus(str, Enum):
    ACTIVE     = "ACTIVE"
    PLANNED    = "PLANNED"
    DEFERRED   = "DEFERRED"
    COMPLETE   = "COMPLETE"
    SUPERSEDED = "SUPERSEDED"
    PARKED     = "PARKED"


class MilestoneStatus(str, Enum):
    ACTIVE   = "ACTIVE"
    QUEUED   = "QUEUED"
    PLANNED  = "PLANNED"
    COMPLETE = "COMPLETE"
    BLOCKED  = "BLOCKED"
    PARKED   = "PARKED"


class TaskStatus(str, Enum):
    ACTIVE  = "ACTIVE"
    QUEUED  = "QUEUED"
    DONE    = "DONE"
    BLOCKED = "BLOCKED"


class TaskScope(str, Enum):
    SHARED  = "shared"
    DEMO    = "demo"
    TOOLING = "tooling"
    DOCS    = "docs"


class OwnerType(str, Enum):
    # Human roles
    HUMAN      = "human"       # kept for YAML backward compat
    DESIGNER   = "designer"
    OVERSEER   = "overseer"
    # Agent roles
    ARCHIVIST  = "archivist"
    STRATEGIST = "strategist"
    SCRIBE     = "scribe"
    CURATOR    = "curator"
    DIRECTOR   = "director"
    # System
    SYSTEM     = "system"


class SessionStatus(str, Enum):
    PLANNED  = "PLANNED"
    ACTIVE   = "ACTIVE"
    COMPLETE = "COMPLETE"
    SKIPPED  = "SKIPPED"
