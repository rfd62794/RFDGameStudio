"""bound_manifest.py — load and validate the human-authored bound manifest.

The manifest is the *only* source of truth for what a numeric bound
should be. The fixer never infers this from context, a comment, or
"what looks reasonable" — only from an explicit entry a human wrote.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover — PyYAML is a stdlib-adjacent dep
    yaml = None  # type: ignore


@dataclass(frozen=True)
class BoundEntry:
    file: str
    symbol: str
    locked_min: int
    locked_max: int
    source: str


def load_bound_manifest(path: Path | str = "bound_manifest.yaml") -> list[BoundEntry]:
    """Load and validate the manifest. Returns a list of BoundEntry.

    Raises ValueError if any entry is missing required fields or has
    a non-integer bound.
    """
    if yaml is None:
        raise RuntimeError("PyYAML is required to load bound_manifest.yaml")

    manifest_path = Path(path)
    if not manifest_path.exists():
        return []

    raw = yaml.safe_load(manifest_path.read_text(encoding="utf-8"))
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ValueError("bound_manifest.yaml must be a list of entries")

    entries: list[BoundEntry] = []
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            raise ValueError(f"manifest entry {i} is not a mapping")
        for field in ("file", "symbol", "locked_min", "locked_max", "source"):
            if field not in item:
                raise ValueError(f"manifest entry {i} missing field: {field}")
        if not isinstance(item["locked_min"], int) or not isinstance(item["locked_max"], int):
            raise ValueError(f"manifest entry {i} bounds must be integers")
        entries.append(
            BoundEntry(
                file=item["file"],
                symbol=item["symbol"],
                locked_min=int(item["locked_min"]),
                locked_max=int(item["locked_max"]),
                source=item["source"],
            )
        )
    return entries


def find_entry(
    entries: list[BoundEntry], file: str, symbol: str
) -> BoundEntry | None:
    """Return the manifest entry matching (file, symbol), or None."""
    for e in entries:
        if e.file == file and e.symbol == symbol:
            return e
    return None
