import json
import subprocess
import yaml
import os
from pathlib import Path

# Pipeline Stage Tracking (additive, August 2026): RFDGameStudio's
# ts/src/games/game-metadata.json is the real source of truth for where a
# game sits in the AI Studio -> website -> itch.io sequence. This repo is
# separate from RFDGameStudio, so the path is configurable via env var with
# the same "sensible default, overridable" convention already used by
# RFDGameStudio's own SITE_REPO_PATH.
_RFDGAMESTUDIO_PATH = Path(os.environ.get("RFDGAMESTUDIO_PATH", r"C:\Github\RFDGameStudio"))
_GAME_METADATA_PATH = _RFDGAMESTUDIO_PATH / "ts" / "src" / "games" / "game-metadata.json"

# games.yaml game name -> game-metadata.json game_id, where they differ.
# Confirmed real mismatch this session: games.yaml uses "voidrift",
# game-metadata.json/GAME_PATHS uses "voiddrift".
_GAME_ID_ALIASES = {"voidrift": "voiddrift"}


def _mark_itch_published(game_name: str) -> None:
    """Best-effort: record game_name as itch_published in RFDGameStudio's
    game-metadata.json. Called only after a real, confirmed successful
    butler push (never on dry_run, never on failure). Never raises — a
    metadata-write problem must not be reported as a publish failure, and
    must not block the real push this function's caller already completed.
    """
    try:
        if not _GAME_METADATA_PATH.exists():
            return
        data = json.loads(_GAME_METADATA_PATH.read_text(encoding="utf-8"))
        game_id = _GAME_ID_ALIASES.get(game_name, game_name)
        if not isinstance(data, dict) or game_id not in data:
            return
        data[game_id]["pipeline_stage"] = "itch_published"
        _GAME_METADATA_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass


def check_butler() -> bool:
    """Verify butler is installed. Returns True if found."""
    try:
        result = subprocess.run(
            ["butler", "--version"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def load_game_config(game_name: str) -> dict:
    """
    Load game entry from config/games.yaml.
    Raises KeyError if game_name not found.
    """
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "games.yaml")
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
    
    if game_name not in config["games"]:
        raise KeyError(f"Game not found: {game_name}")
    
    return config["games"][game_name]


def push(game_name: str, dry_run: bool = False) -> bool:
    """
    Push build to itch.io via Butler.
    
    Args:
        game_name: Key from games.yaml
        dry_run: If True, print command without executing
    
    Returns:
        True on success, False on failure
    """
    try:
        game_config = load_game_config(game_name)
    except KeyError as e:
        print(f"Error: {e}")
        return False
    
    build_dir = game_config["build_dir"]
    itchio_slug = game_config["itchio_slug"]
    channel = game_config["channel"]
    
    command = ["butler", "push", build_dir, f"{itchio_slug}:{channel}"]
    
    if dry_run:
        print(f"Would execute: {' '.join(command)}")
        return True
    
    try:
        result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
        if result.returncode == 0:
            print(f"Successfully pushed {game_name} to itch.io")
            _mark_itch_published(game_name)
            return True
        else:
            print(f"Failed to push {game_name}: {result.stderr}")
            return False
    except FileNotFoundError:
        print("Error: butler not found. Install from https://itch.io/docs/butler/")
        return False
