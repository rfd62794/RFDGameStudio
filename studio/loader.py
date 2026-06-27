"""loader.py — Reads the three game files for a given game_id.

Single responsibility: read three files, return three objects.
No validation beyond YAML parsing. Validation lives in validator.py.
"""

from __future__ import annotations

from pathlib import Path

import yaml

GAMES_DIR = Path(__file__).parent.parent / "games"
ENGINE_DIR = Path(__file__).parent.parent / "engine"

PRIMITIVE_LOAD_ORDER = [
    "primitives/action.lua",
    "primitives/entity.lua",
    "primitives/resolution.lua",
    "primitives/consequence.lua",
    "primitives/movement.lua",
    "primitives/physics.lua",
    "primitives/lifecycle.lua",
]


def load_engine_source(engine_systems: list[str]) -> str:
    """Load engine primitives + declared systems into one Lua source string.

    Loaded before game logic.lua so game code can call engine functions.
    Only systems declared in systems.yaml ``engine_systems`` key are loaded.
    Missing files are silently skipped (engine dir may not exist in tests).
    """
    parts: list[str] = []
    for rel_path in PRIMITIVE_LOAD_ORDER:
        path = ENGINE_DIR / rel_path
        if path.exists():
            parts.append(path.read_text(encoding="utf-8"))
    for system_id in engine_systems:
        sys_path = ENGINE_DIR / "systems" / f"{system_id}.lua"
        if sys_path.exists():
            parts.append(sys_path.read_text(encoding="utf-8"))
    return "\n\n".join(parts)


class GameFiles:
    """Container for the three parsed game definition files."""

    def __init__(
        self,
        game_id: str,
        data: dict,
        ui: dict,
        logic: str,
        engine_source: str = "",
    ) -> None:
        self.game_id = game_id
        self.data = data            # parsed data.yaml
        self.ui = ui                # parsed ui.yaml
        self.logic = logic          # raw game-specific Lua source string
        self.engine_source = engine_source  # engine primitives + systems prepended


def load_game_files(game_id: str, games_dir: Path | None = None) -> GameFiles:
    """Load data.yaml, ui.yaml, logic.lua for *game_id*.

    Also loads engine primitives and any systems listed under ``engine_systems``
    in systems.yaml. Engine source is available as ``GameFiles.engine_source``.

    Raises :class:`FileNotFoundError` with the exact path if any file is missing.
    Raises :class:`yaml.YAMLError` if data.yaml or ui.yaml is malformed.
    """
    root = games_dir if games_dir is not None else GAMES_DIR
    game_dir = root / game_id

    data_path = game_dir / "data.yaml"
    ui_path = game_dir / "ui.yaml"
    lua_path = game_dir / "logic.lua"

    for path in (data_path, ui_path, lua_path):
        if not path.exists():
            raise FileNotFoundError(f"Required game file not found: {path}")

    data = yaml.safe_load(data_path.read_text(encoding="utf-8"))
    ui = yaml.safe_load(ui_path.read_text(encoding="utf-8"))
    logic = lua_path.read_text(encoding="utf-8")

    systems_path = game_dir / "systems.yaml"
    engine_systems: list[str] = []
    if systems_path.exists():
        systems_data = yaml.safe_load(systems_path.read_text(encoding="utf-8")) or {}
        engine_systems = systems_data.get("engine_systems", [])

    engine_source = load_engine_source(engine_systems)

    return GameFiles(
        game_id=game_id,
        data=data,
        ui=ui,
        logic=logic,
        engine_source=engine_source,
    )
