"""game_metadata.py — git-derived date/version extraction for the arcade lobby.

All date and version data is derived from git history and VERSION files at
build time. The generated output is written to ts/src/games/game-metadata.json
and is intentionally gitignored.
"""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# External repos whose git history is the source of truth for a game.
# Keys must match GAME_PATHS.
_EXTERNAL_REPOS: dict[str, Path] = {
    "slimebreeder": Path(r"C:\Github\SlimeBreeder"),
}

# One entry per game, pointing at every real path that constitutes it.
# Standalone (embedUrl) demos only have an examples/ path. Lua-ported
# games have both games/{slug}/ and ts/src/games/{slug}/.
GAME_PATHS: dict[str, list[str]] = {
    "horse_racing": ["games/horse_racing", "ts/src/games/horse_racing"],
    "slither_rogue": ["games/slither_rogue", "ts/src/games/slither_rogue"],
    "mutant_battle_ball": ["games/mutant_battle_ball", "ts/src/games/mutant_battle_ball"],
    "slime_coin": ["games/slime_coin", "ts/src/games/slime_coin"],
    "chimera_wilds": ["games/chimera_wilds", "ts/src/games/chimera_wilds"],
    "scrapcrawl": ["games/scrapcrawl", "ts/src/games/scrapcrawl"],
    "brewfield": ["games/brewfield", "ts/src/games/brewfield"],
    "voiddrift": ["ts/src/games/voiddrift"],  # config only, real source is external
    "ledger": ["examples/ledger"],
    "shoal": ["games/shoal", "ts/src/games/shoal"],
    "trinity_siege": ["examples/trinity-siege"],
    "slimebreeder": [],  # external repo, see _EXTERNAL_REPOS
}


def _run_git(cwd: Path, args: list[str]) -> str:
    """Run a git command and return stripped stdout."""
    result = subprocess.run(
        ["git", *args],
        capture_output=True,
        text=True,
        cwd=str(cwd),
    )
    return result.stdout.strip()


def _git_dates(cwd: Path, paths: list[str]) -> tuple[str, str]:
    """Return (created_iso, last_updated_iso) across all given paths, or ("", "") if none tracked."""
    if not paths:
        return "", ""
    all_last: list[str] = []
    all_first: list[str] = []
    for p in paths:
        last = _run_git(cwd, ["log", "-1", "--format=%cI", "--", p])
        if last:
            all_last.append(last)
        first_log = _run_git(cwd, ["log", "--diff-filter=A", "--format=%cI", "--", p])
        if first_log:
            all_first.extend(first_log.splitlines())
    last_updated = max(all_last) if all_last else ""
    created = min(all_first) if all_first else ""
    return created, last_updated


def _read_version(cwd: Path, paths: list[str]) -> str:
    """Return the first VERSION file found under the given paths, or a default."""
    for p in paths:
        version_file = cwd / p / "VERSION"
        if version_file.exists():
            return version_file.read_text(encoding="utf-8").strip()
    return "0.1.0"


def generate_game_metadata() -> dict[str, dict[str, object]]:
    """Produce the game metadata object derived from git and VERSION files."""
    result: dict[str, dict[str, object]] = {}

    for game_id, paths in GAME_PATHS.items():
        created = ""
        last_updated = ""
        version = "0.1.0"
        tracked = False

        external_repo = _EXTERNAL_REPOS.get(game_id)
        if external_repo and external_repo.exists() and (external_repo / ".git").exists():
            created, last_updated = _git_dates(external_repo, ["."])
            version = _read_version(external_repo, ["."])
            tracked = True
        elif paths:
            created, last_updated = _git_dates(REPO_ROOT, paths)
            version = _read_version(REPO_ROOT, paths)
            tracked = bool(last_updated)

        result[game_id] = {
            "created": created,
            "last_updated": last_updated,
            "version": version,
            "tracked": tracked,
        }

    return result


def write_game_metadata() -> Path:
    """Generate and write ts/src/games/game-metadata.json."""
    metadata = generate_game_metadata()
    out_path = REPO_ROOT / "ts" / "src" / "games" / "game-metadata.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return out_path


if __name__ == "__main__":
    out_path = write_game_metadata()
    metadata = generate_game_metadata()
    print(f"Wrote metadata for {len(metadata)} games to {out_path}")
