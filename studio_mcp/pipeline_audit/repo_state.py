"""repo_state.py — read the current arcade registry and cross-reference metadata."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REGISTRY_PATH = REPO_ROOT / "ts" / "src" / "games" / "registry.ts"
METADATA_PATH = REPO_ROOT / "ts" / "src" / "games" / "game-metadata.json"
EXAMPLES_DIR = REPO_ROOT / "examples"


def _extract_registry_games(registry_text: str) -> list[dict[str, str]]:
    """Parse registry.ts imports and the GAME_REGISTRY list into game entries."""
    imports: dict[str, str] = {}
    for line in registry_text.splitlines():
        line = line.strip()
        match = re.match(
            r"^import\s+([A-Za-z0-9_]+)\s+from\s+['\"]\.\/([^/]+)\/config['\"];?$",
            line,
        )
        if match:
            var_name, game_id = match.groups()
            imports[var_name] = game_id

    games: list[dict[str, str]] = []
    in_registry = False
    for line in registry_text.splitlines():
        stripped = line.strip()
        if "export const GAME_REGISTRY" in stripped:
            in_registry = True
            continue
        if in_registry and stripped.startswith("]"):
            break
        if in_registry:
            match = re.match(r"^([A-Za-z0-9_]+),?$", stripped)
            if match:
                var_name = match.group(1)
                game_id = imports.get(var_name)
                if game_id:
                    games.append({"id": game_id, "config_export": var_name})
    return games


def _load_metadata(path: Path = METADATA_PATH) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return data if isinstance(data, dict) else {}


def read_repo_state(
    registry_path: Path = REGISTRY_PATH,
    metadata_path: Path = METADATA_PATH,
    examples_dir: Path = EXAMPLES_DIR,
) -> dict[str, Any]:
    """Return the current state of the arcade registry with metadata cross-reference."""
    registry_text = registry_path.read_text(encoding="utf-8")
    games = _extract_registry_games(registry_text)
    metadata = _load_metadata(metadata_path)

    for game in games:
        meta = metadata.get(game["id"], {})
        game["pipeline_stage"] = meta.get("pipeline_stage", "ai_studio")
        game["version"] = meta.get("version", "0.1.0")
        game["created"] = meta.get("created", "")
        game["last_updated"] = meta.get("last_updated", "")
        game["tracked"] = meta.get("tracked", False)

    examples: list[str] = []
    if examples_dir.exists():
        examples = sorted(
            p.name for p in examples_dir.iterdir() if p.is_dir()
        )

    return {
        "registry_path": str(registry_path),
        "metadata_path": str(metadata_path),
        "examples_dir": str(examples_dir),
        "games": games,
        "examples": examples,
        "game_count": len(games),
    }
