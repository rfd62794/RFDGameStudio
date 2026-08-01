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
    """Run a git command and return stripped stdout.

    The repo is trusted (it is this project or a known external repo), so the
    safe.directory check is bypassed for the exact cwd. Git failures are no
    longer silently ignored.
    """
    safe_dir = str(cwd.resolve())
    result = subprocess.run(
        ["git", "-c", f"safe.directory={safe_dir}", *args],
        capture_output=True,
        text=True,
        cwd=str(cwd),
    )
    if result.returncode != 0:
        stderr = result.stderr.strip() if result.stderr else ""
        raise RuntimeError(f"git failed in {cwd}: {stderr}")
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


# Pipeline Stage Tracking (additive, August 2026): where a game currently
# sits in the real, repeated AI Studio -> website -> itch.io sequence.
# Three real values only. Default for any game never explicitly advanced:
# "ai_studio" -- a game untouched by either deploy tool is still sitting
# where it started. This field is NOT derived from git like created/
# last_updated -- it is a side effect written by studio_deploy_arcade
# (-> "website_collection") and the itch.io butler push (-> "itch_published"),
# only on confirmed real success. Not a strict forward-only state machine --
# a real future re-polish pass is a legitimate event, not a regression.
PIPELINE_STAGE_AI_STUDIO = "ai_studio"
PIPELINE_STAGE_WEBSITE_COLLECTION = "website_collection"
PIPELINE_STAGE_ITCH_PUBLISHED = "itch_published"
_DEFAULT_PIPELINE_STAGE = PIPELINE_STAGE_AI_STUDIO

_METADATA_PATH = REPO_ROOT / "ts" / "src" / "games" / "game-metadata.json"


def _load_existing_pipeline_stages(out_path: Path) -> dict[str, str]:
    """Read pipeline_stage values from the current on-disk metadata file, if
    any, so a full regeneration (which rebuilds created/last_updated/version/
    tracked fresh from git every time) never silently wipes real, previously
    recorded pipeline progress. Never raises -- a missing or corrupt file
    just means no prior stages to carry forward.
    """
    if not out_path.exists():
        return {}
    try:
        existing = json.loads(out_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    if not isinstance(existing, dict):
        return {}
    return {
        game_id: info["pipeline_stage"]
        for game_id, info in existing.items()
        if isinstance(info, dict) and info.get("pipeline_stage")
    }


def generate_game_metadata(existing_stages: dict[str, str] | None = None) -> dict[str, dict[str, object]]:
    """Produce the game metadata object derived from git and VERSION files.

    existing_stages: game_id -> pipeline_stage, carried forward from the
    current on-disk file so this rebuild never resets real pipeline
    progress. Defaults to "ai_studio" for any game with no recorded stage.
    """
    existing_stages = existing_stages or {}
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
            "pipeline_stage": existing_stages.get(game_id, _DEFAULT_PIPELINE_STAGE),
        }

    return result


def write_game_metadata() -> Path:
    """Generate and write ts/src/games/game-metadata.json.

    Preserves any existing pipeline_stage per game across the rebuild.
    """
    out_path = _METADATA_PATH
    existing_stages = _load_existing_pipeline_stages(out_path)
    metadata = generate_game_metadata(existing_stages)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return out_path


def advance_pipeline_stage(game_id: str, new_stage: str, out_path: Path | None = None) -> bool:
    """Set game_id's pipeline_stage to new_stage in the on-disk metadata
    file, called only after a real, confirmed successful deploy/publish
    action -- never speculatively.

    Refuses to regress an already-itch_published game back down to
    website_collection (a successful arcade deploy re-verifies the website
    copy, it does not mean the game fell off itch.io). Any other real
    transition, including itch_published -> itch_published again after a
    re-polish, is allowed -- this is a status field, not a one-way gate.

    Returns True if a write happened, False otherwise (missing file,
    unknown game_id, or a refused regression).
    """
    out_path = out_path or _METADATA_PATH
    if not out_path.exists():
        return False
    try:
        data = json.loads(out_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return False
    if not isinstance(data, dict) or game_id not in data:
        return False

    current_stage = data[game_id].get("pipeline_stage", _DEFAULT_PIPELINE_STAGE)
    if current_stage == PIPELINE_STAGE_ITCH_PUBLISHED and new_stage == PIPELINE_STAGE_WEBSITE_COLLECTION:
        return False

    data[game_id]["pipeline_stage"] = new_stage
    out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return True


if __name__ == "__main__":
    out_path = write_game_metadata()
    metadata = generate_game_metadata()
    print(f"Wrote metadata for {len(metadata)} games to {out_path}")
