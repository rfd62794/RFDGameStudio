"""Push HTML5 builds to itch.io with butler."""

from __future__ import annotations

import os
import subprocess
from collections.abc import Callable
from pathlib import Path

from .config import load_game_config

# Called as on_published(game_name, version) after a confirmed successful push.
PublishedHook = Callable[[str, str | None], None]


def _is_dist_stale(dist_dir: Path, source_dir: Path) -> bool:
    """Compare dist/'s newest file against source's newest real file.

    Returns True if dist/ predates the source it's supposed to represent.
    A missing dist_dir is treated as stale.
    """
    if not dist_dir.exists():
        return True
    if not source_dir.exists():
        return False
    dist_newest = max((f.stat().st_mtime for f in dist_dir.rglob("*") if f.is_file()), default=0)
    source_newest = max((f.stat().st_mtime for f in source_dir.rglob("*") if f.is_file()), default=0)
    return dist_newest < source_newest


def _read_version(version_file: Path) -> str | None:
    """Return the stripped contents of a VERSION file, or None."""
    if version_file and version_file.exists():
        return version_file.read_text(encoding="utf-8").strip()
    return None


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


def _notify(on_published: PublishedHook | None, game_name: str, version: str | None) -> None:
    """Run the caller's post-publish hook.

    The push has already succeeded, so a hook error is printed but never turns
    it into a reported failure.
    """
    if on_published is None:
        return
    try:
        on_published(game_name, version)
    except Exception as exc:
        print(f"Warning: post-publish hook failed for {game_name}: {exc}")


def push(
    game_name: str,
    config_path: str | os.PathLike[str] | None = None,
    dry_run: bool = False,
    on_published: PublishedHook | None = None,
) -> bool:
    """Push a game's build to itch.io via butler.

    Args:
        game_name: Key from games.yaml
        config_path: Path to games.yaml (see config.resolve_config_path)
        dry_run: If True, print command without executing
        on_published: Called with (game_name, version) only after a real,
            successful push

    Returns:
        True on success (or dry run), False on failure
    """
    try:
        game_config = load_game_config(game_name, config_path)
    except KeyError as e:
        print(f"Error: {e}")
        return False

    build_dir = Path(game_config["build_dir"])
    itchio_slug = game_config["itchio_slug"]
    channel = game_config["channel"]
    source_dir = Path(game_config["source_dir"]) if game_config.get("source_dir") else None
    version_file = Path(game_config["version_file"]) if game_config.get("version_file") else None

    # Freshness check: fail loudly if build_dir is older than source_dir.
    if source_dir and _is_dist_stale(build_dir, source_dir):
        print(
            f"Error: {build_dir} is older than {source_dir}. "
            "Build first."
        )
        return False

    version = _read_version(version_file) if version_file else None

    command = ["butler", "push", str(build_dir), f"{itchio_slug}:{channel}"]
    if version:
        command.extend(["--userversion", version])

    if dry_run:
        print(f"Would execute: {' '.join(command)}")
        return True

    try:
        result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    except FileNotFoundError:
        print("Error: butler not found. Install from https://itch.io/docs/butler/")
        return False

    if result.returncode != 0:
        print(f"Failed to push {game_name}: {result.stderr}")
        return False

    print(f"Successfully pushed {game_name} to itch.io")
    _notify(on_published, game_name, version)
    return True
