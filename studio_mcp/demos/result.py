"""result.py — the result every importer stage returns."""
from __future__ import annotations

from dataclasses import asdict, dataclass, field


@dataclass
class StageResult:
    stage: str
    ok: bool
    detail: str = ""
    next_step: str = ""
    data: dict = field(default_factory=dict)

    def as_dict(self) -> dict:
        return asdict(self)
