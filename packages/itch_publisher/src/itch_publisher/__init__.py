"""itch_publisher — push HTML5 game builds to itch.io with butler.

Self-contained: depends only on click and PyYAML and never imports the
application that uses it. Callers pass the path to a games.yaml registry and,
optionally, an ``on_published`` hook that runs after a confirmed successful
push (for example to record the release in their own metadata).
"""

from .config import load_game_config, load_games, resolve_config_path
from .itchio import check_butler, push

__version__ = "0.2.0"

__all__ = [
    "check_butler",
    "load_game_config",
    "load_games",
    "push",
    "resolve_config_path",
]
