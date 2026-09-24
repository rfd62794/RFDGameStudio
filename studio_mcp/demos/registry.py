"""registry.py — the registry export as the single source for demo lists (spec §4).

GAME_REGISTRY (TypeScript) is exported configs-only to ts/src/games/registry-export.json
by ts/tools/export-registry.ts; everything that used to be a hand-kept list is derived here.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from studio_mcp.paths import REPO_ROOT, sibling_repo

TS_DIR = REPO_ROOT / "ts"
GAMES_DIR = TS_DIR / "src" / "games"
REGISTRY_EXPORT = GAMES_DIR / "registry-export.json"


def _newest_source_mtime() -> float:
    files = [GAMES_DIR / "registry.ts", *GAMES_DIR.glob("*/config.ts")]
    return max(f.stat().st_mtime for f in files if f.exists())


def export_registry(run=subprocess.run) -> Path:
    npx = shutil.which("npx") or "npx"  # resolves npx.cmd on Windows; no shell needed
    proc = run([npx, "vite-node", "tools/export-registry.ts"], cwd=str(TS_DIR),
               capture_output=True, text=True, encoding="utf-8", errors="replace")
    if proc.returncode != 0 or not REGISTRY_EXPORT.exists():
        raise RuntimeError("registry export failed:\n" + ((proc.stdout or "") + (proc.stderr or ""))[-2000:])
    return REGISTRY_EXPORT


def load_registry(path: Path = REGISTRY_EXPORT, refresh: bool = True, run=subprocess.run) -> list[dict]:
    """Registry games in order; re-exports first when the file is missing or older than any config."""
    if refresh and (not path.exists() or path.stat().st_mtime < _newest_source_mtime()):
        export_registry(run)
    return json.loads(path.read_text(encoding="utf-8"))["games"]


def demo_entries(games: list[dict]) -> list[dict]:
    return [g for g in games if (g.get("source") or {}).get("kind") in ("example", "sibling")]


def demo_key(game: dict) -> str:
    source = game["source"]
    return source["slug"] if source["kind"] == "example" else game["gameId"]


def example_demos(games: list[dict]) -> list[str]:
    return [demo_key(g) for g in demo_entries(games)]


def demo_static_names(games: list[dict]) -> dict[str, str]:
    return {demo_key(g): g["gameId"] for g in demo_entries(games)}


def external_demo_paths(games: list[dict]) -> dict[str, Path]:
    return {demo_key(g): sibling_repo(g["source"]["repo"]) for g in demo_entries(games)
            if g["source"]["kind"] == "sibling"}


def external_repos(games: list[dict]) -> dict[str, Path]:
    return {g["gameId"]: sibling_repo(g["source"]["repo"]) for g in demo_entries(games)
            if g["source"]["kind"] == "sibling"}


def game_paths(games: list[dict], repo_root: Path) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for g in games:
        gid = g["gameId"]
        paths = []
        if (repo_root / "games" / gid).is_dir():
            paths.append(f"games/{gid}")
        paths.append(f"ts/src/games/{gid}")
        source = g.get("source") or {}
        if source.get("kind") == "example":
            paths.append(f"examples/{source['slug']}")
        intake = gid.replace("_", "-")
        if (repo_root / "intake" / intake).is_dir():
            paths.append(f"intake/{intake}")
        result[gid] = paths
    return result


def find_by_slug(games: list[dict], slug: str) -> dict | None:
    for g in demo_entries(games):
        if demo_key(g) == slug:
            return g
    return None
