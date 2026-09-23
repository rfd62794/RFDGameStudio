"""Cross-pipeline version consistency report.

Compares, for every game in games.yaml:
- SOURCE version (``version`` from the metadata file, else the game's version_file)
- DEPLOYED version (``deployed_version`` from the metadata file)
- LIVE version (from `butler status {slug}:{channel}`, Butler's own build counter)

The metadata file is optional JSON keyed by game name, for example
``{"shoal": {"version": "2.31.0", "deployed_version": "2.31.0"}}``.

Outputs a markdown table and JSON details.
"""

from __future__ import annotations

import datetime
import json
import os
import subprocess
from collections.abc import Callable
from pathlib import Path

import yaml

from .config import load_games


def load_metadata(metadata_path: str | os.PathLike[str] | None) -> dict[str, dict]:
    if not metadata_path:
        return {}
    path = Path(metadata_path)
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    return data if isinstance(data, dict) else {}


def _read_version(version_file: Path | None) -> str | None:
    if version_file and version_file.exists():
        return version_file.read_text(encoding="utf-8").strip()
    return None


def _butler_status(itchio_slug: str, channel: str) -> dict[str, object]:
    """Run butler status and parse the version column, if possible."""
    try:
        result = subprocess.run(
            ["butler", "status", f"{itchio_slug}:{channel}"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
        )
    except FileNotFoundError:
        return {"ok": False, "error": "butler not found"}

    if result.returncode != 0:
        error_text = (result.stderr.strip() or result.stdout.strip())
        # Butler prints a multi-line upgrade banner before the real error.
        # Keep only the last non-empty line.
        for line in reversed(error_text.splitlines()):
            if line.strip():
                error_text = line.strip()
                break
        return {"ok": False, "error": error_text}

    # Look for the VERSION column in the ASCII table. Butler prints a trailing
    # '|' after the version value, so the version sits in the second-to-last
    # column, not the last one.
    version: str | None = None
    for line in result.stdout.splitlines():
        parts = line.split("|")
        if len(parts) >= 5 and parts[1].strip() == channel:
            version = parts[-2].strip()
            break
    return {"ok": True, "version": version}


def build_report(
    config_path: str | os.PathLike[str] | None = None,
    metadata_path: str | os.PathLike[str] | None = None,
    butler_status: Callable[[str, str], dict[str, object]] = _butler_status,
) -> dict[str, object]:
    metadata = load_metadata(metadata_path)
    try:
        games_config = load_games(config_path)
    except (OSError, yaml.YAMLError, ValueError):
        games_config = {}
    rows: list[dict[str, object]] = []
    errors: list[str] = []

    for game_name, cfg in games_config.items():
        meta = metadata.get(game_name)
        if not isinstance(meta, dict):
            meta = {}

        source_version = meta.get("version", "")
        if not source_version and cfg.get("version_file"):
            source_version = _read_version(Path(cfg["version_file"])) or ""

        deployed_version = meta.get("deployed_version", "") or ""

        live = butler_status(cfg["itchio_slug"], cfg["channel"])
        live_version = (live.get("version") or "") if live["ok"] else ""
        live_error = live.get("error", "") if not live["ok"] else ""

        consistent = bool(source_version) and source_version == deployed_version == live_version
        rows.append(
            {
                "game_name": game_name,
                "itchio_slug": cfg["itchio_slug"],
                "source_version": source_version,
                "deployed_version": deployed_version,
                "live_version": live_version,
                "live_error": live_error,
                "consistent": consistent,
            }
        )
        if live_error:
            errors.append(f"{game_name}: {live_error}")

    return {"games": rows, "errors": errors}


def format_markdown(report: dict[str, object]) -> str:
    lines = [
        "# Cross-Pipeline Version Consistency Report",
        "",
        f"Generated: {datetime.datetime.now(datetime.timezone.utc).isoformat()}",
        "",
        "| Game | Source VERSION | Deployed VERSION | Live itch.io VERSION | Consistent | Notes |",
        "|---|---|---|---|---|---|",
    ]
    for row in report["games"]:
        notes = row["live_error"] if row["live_error"] else ""
        notes = notes.replace("\n", " ")
        lines.append(
            f"| {row['game_name']} | {row['source_version']} | {row['deployed_version']} | "
            f"{row['live_version']} | {row['consistent']} | {notes} |"
        )
    if report["errors"]:
        lines.extend(["", "## Errors", ""])
        for err in report["errors"]:
            lines.append(f"- {err}")
    return "\n".join(lines)


if __name__ == "__main__":
    print(format_markdown(build_report()))
