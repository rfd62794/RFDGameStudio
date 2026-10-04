# new: Phase 1 D1.1b -- read the glob registry from disk, no Node needed.
"""registry_files.py -- which games the glob registry (ts/src/games/registry.ts) collects, without running Node.

registry.ts no longer lists its games: it collects every ts/src/games/<folder>/config.ts, except the
folders named in its negative glob patterns ('!./<folder>/config.ts'), ordered by each config's `order`.
This module mirrors that rule on disk for the Python tools that used to parse registry.ts as text.
"""
from __future__ import annotations

import re
from pathlib import Path

ORDER_STEP = 10
_GAME_ID = re.compile(r"""^[ \t]*gameId:\s*['"]([^'"]+)['"]""", re.M)
_ORDER = re.compile(r"^[ \t]*order:\s*(\d+)\s*,", re.M)
_EXCLUDED = re.compile(r"""['"]!\./([A-Za-z0-9_]+)/config\.ts['"]""")


def uses_glob(registry_text: str) -> bool:
    return "import.meta.glob" in registry_text


def excluded_folders(registry_text: str) -> set[str]:
    return set(_EXCLUDED.findall(registry_text))


def registry_games(games_dir: Path) -> list[dict]:
    """[{"id", "folder", "order"}] for every registered game, sorted by (order, id) like the TypeScript registry."""
    registry = games_dir / "registry.ts"
    excluded = excluded_folders(registry.read_text(encoding="utf-8")) if registry.exists() else set()
    rows = []
    for config in sorted(games_dir.glob("*/config.ts")):
        folder = config.parent.name
        if folder in excluded:
            continue
        text = config.read_text(encoding="utf-8")
        game_id = _GAME_ID.search(text)
        order = _ORDER.search(text)
        rows.append({
            "id": game_id.group(1) if game_id else folder,
            "folder": folder,
            "order": int(order.group(1)) if order else None,
        })
    return sorted(rows, key=lambda r: (r["order"] is None, r["order"] or 0, r["id"]))


def next_order(games_dir: Path) -> int:
    """The order for a new game: the highest existing order plus ORDER_STEP (ORDER_STEP when none)."""
    orders = [r["order"] for r in registry_games(games_dir) if r["order"] is not None]
    return (max(orders) if orders else 0) + ORDER_STEP
