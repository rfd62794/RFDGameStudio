"""loader.py — Reads the three game files for a given game_id.

Single responsibility: read three files, return three objects.
No validation beyond YAML parsing. Validation lives in validator.py.
"""

from __future__ import annotations

from pathlib import Path

import yaml

GAMES_DIR = Path(__file__).parent.parent / "games"


class GameFiles:
    """Container for the three parsed game definition files."""

    def __init__(self, game_id: str, data: dict, ui: dict, logic: str) -> None:
        self.game_id = game_id
        self.data = data      # parsed data.yaml
        self.ui = ui          # parsed ui.yaml
        self.logic = logic    # raw Lua source string


def load_game_files(game_id: str, games_dir: Path | None = None) -> GameFiles:
    """Load data.yaml, ui.yaml, logic.lua for *game_id*.

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

    return GameFiles(game_id=game_id, data=data, ui=ui, logic=logic)
