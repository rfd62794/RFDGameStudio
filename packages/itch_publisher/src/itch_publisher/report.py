"""Cross-pipeline version consistency report.

Compares, for every configured itch.io game:
- SOURCE version (from RFDGameStudio game-metadata.json or the configured version_file)
- DEPLOYED version (from game-metadata.json deployed_version)
- LIVE version (from `butler status {slug}:{channel}`, Butler's own build counter)

Outputs a markdown table and JSON details.
"""

from __future__ import annotations

import datetime
import json
import subprocess
from pathlib import Path

import yaml

_RFDGAMESTUDIO_PATH = Path(
    __import__("os").environ.get("RFDGAMESTUDIO_PATH", r"C:\Github\RFDGameStudio")
)
_GAME_METADATA_PATH = _RFDGAMESTUDIO_PATH / "ts" / "src" / "games" / "game-metadata.json"
_CONFIG_PATH = Path(__file__).resolve().parent / "config" / "games.yaml"

_GAME_ID_ALIASES = {"voidrift": "voiddrift"}


def load_game_metadata() -> dict[str, dict]:
    if not _GAME_METADATA_PATH.exists():
        return {}
    try:
        data = json.loads(_GAME_METADATA_PATH.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    if not isinstance(data, dict):
        return {}
    return data


def load_games_config() -> dict[str, dict]:
    if not _CONFIG_PATH.exists():
        return {}
    try:
        config = yaml.safe_load(_CONFIG_PATH.read_text(encoding="utf-8"))
    except (yaml.YAMLError, OSError):
        return {}
    if not isinstance(config, dict):
        return {}
    return config.get("games", {})


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


def build_report() -> dict[str, object]:
    metadata = load_game_metadata()
    games_config = load_games_config()
    rows: list[dict[str, object]] = []
    errors: list[str] = []

    for game_name, cfg in games_config.items():
        game_id = _GAME_ID_ALIASES.get(game_name, game_name)
        meta = metadata.get(game_id, {})

        source_version = meta.get("version", "")
        if not source_version and cfg.get("version_file"):
            source_version = _read_version(Path(cfg["version_file"])) or ""

        deployed_version = meta.get("deployed_version", "") or ""

        live = _butler_status(cfg["itchio_slug"], cfg["channel"])
        live_version = live.get("version", "") if live["ok"] else ""
        live_error = live.get("error", "") if not live["ok"] else ""

        consistent = bool(source_version) and source_version == deployed_version == live_version
        rows.append(
            {
                "game_name": game_name,
                "game_id": game_id,
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
    report = build_report()
    print(format_markdown(report))
