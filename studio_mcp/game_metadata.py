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

from studio_mcp.demos import registry as demo_registry


def game_paths() -> dict[str, list[str]]:
    """Every registered game → the paths whose git history dates it (derived; spec §4)."""
    return demo_registry.game_paths(demo_registry.load_registry(), REPO_ROOT)


def external_repos() -> dict[str, Path]:
    """Games whose history lives in a sibling repo (derived from `source.kind == 'sibling'`)."""
    return demo_registry.external_repos(demo_registry.load_registry())


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


def _git_dates(cwd: Path, paths: list[str], exclude_files: list[str] | None = None) -> tuple[str, str]:
    """Return (created_iso, last_updated_iso) across all given paths, or ("", "") if none tracked.

    exclude_files: real file basenames (e.g. "config.ts") to exclude from
    the `last_updated` computation via git's ":(exclude)" pathspec magic,
    per path. This exists because `GameConfig`'s registry-presentation
    fields (label/description/genre/tags/color) live in the same
    config.ts that also matters for real content -- a purely cosmetic
    metadata edit there (e.g. adding a `genre` tag) should not bump
    `last_updated` to today and bury the real date of the last actual
    gameplay/content change. `created` intentionally still considers
    these files -- the file existing at all is still real signal for
    when the game was first added, cosmetic or not.
    """
    if not paths:
        return "", ""
    exclude_files = exclude_files or []
    all_last: list[str] = []
    all_first: list[str] = []
    for p in paths:
        last_pathspecs = [p] + [f":(exclude){p}/{ef}" for ef in exclude_files]
        last = _run_git(cwd, ["log", "-1", "--format=%cI", "--", *last_pathspecs])
        if not last and exclude_files:
            # Real fallback: some real, tracked demos (e.g. 7_days_to_fry,
            # antsim_redux, facility_escape) have NO tracked TS-side file
            # other than config.ts -- excluding it there would leave zero
            # real signal. Falling back to the unexcluded date for that
            # path only means it can still bump on a cosmetic-only edit,
            # but only for games with no other real file to fall back on.
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


def _load_existing_deployed_versions(out_path: Path) -> dict[str, str]:
    """Read deployed_version values from the current on-disk metadata file.

    Carried forward for the same reason as pipeline_stage: a full regeneration
    rebuilds version/created/last_updated/tracked from git, so without this
    carry-forward the real deployed version recorded by studio_deploy_arcade
    would be silently wiped.
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
        game_id: info["deployed_version"]
        for game_id, info in existing.items()
        if isinstance(info, dict) and info.get("deployed_version")
    }


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


def _load_existing_curated_fields(out_path: Path) -> dict[str, dict[str, object]]:
    """Read `genre`/`tags` from the current on-disk metadata file, if any.

    Arcade Metadata Expansion (Aug 23 2026): `genre`/`tags` are curated
    by hand in each game's real, version-controlled `GameConfig`
    (ts/src/games/*/config.ts) -- this Python-side JSON file only carries
    a synced copy for cross-pipeline visibility. Same real risk as
    pipeline_stage: a full regeneration rebuilds created/last_updated/
    version/tracked fresh from git every time, so without this explicit
    carry-forward, any hand-added genre/tags would be silently wiped on
    the next regen. Never raises -- a missing or corrupt file just means
    nothing to carry forward.
    """
    if not out_path.exists():
        return {}
    try:
        existing = json.loads(out_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    if not isinstance(existing, dict):
        return {}
    result: dict[str, dict[str, object]] = {}
    for game_id, info in existing.items():
        if not isinstance(info, dict):
            continue
        curated: dict[str, object] = {}
        if info.get("genre"):
            curated["genre"] = info["genre"]
        if info.get("tags"):
            curated["tags"] = info["tags"]
        if curated:
            result[game_id] = curated
    return result


def generate_game_metadata(
    existing_stages: dict[str, str] | None = None,
    existing_curated: dict[str, dict[str, object]] | None = None,
    existing_deployed_versions: dict[str, str] | None = None,
) -> dict[str, dict[str, object]]:
    """Produce the game metadata object derived from git and VERSION files.

    existing_stages: game_id -> pipeline_stage, carried forward from the
    current on-disk file so this rebuild never resets real pipeline
    progress. Defaults to "ai_studio" for any game with no recorded stage.

    existing_curated: game_id -> {"genre": ..., "tags": [...]}, carried
    forward the same way -- see _load_existing_curated_fields.
    """
    existing_stages = existing_stages or {}
    existing_curated = existing_curated or {}
    existing_deployed_versions = existing_deployed_versions or {}
    result: dict[str, dict[str, object]] = {}

    repos = external_repos()
    for game_id, paths in game_paths().items():
        created = ""
        last_updated = ""
        version = "0.1.0"
        tracked = False

        external_repo = repos.get(game_id)
        if external_repo and external_repo.exists() and (external_repo / ".git").exists():
            created, last_updated = _git_dates(external_repo, ["."])
            version = _read_version(external_repo, ["."])
            tracked = True
        elif paths:
            created, last_updated = _git_dates(REPO_ROOT, paths, exclude_files=["config.ts"])
            version = _read_version(REPO_ROOT, paths)
            tracked = bool(last_updated)

        entry: dict[str, object] = {
            "created": created,
            "last_updated": last_updated,
            "version": version,
            "tracked": tracked,
            "pipeline_stage": existing_stages.get(game_id, _DEFAULT_PIPELINE_STAGE),
            "deployed_version": existing_deployed_versions.get(game_id, ""),
        }
        entry.update(existing_curated.get(game_id, {}))
        result[game_id] = entry

    return result


def write_game_metadata() -> Path:
    """Generate and write ts/src/games/game-metadata.json.

    Preserves any existing pipeline_stage and curated genre/tags per
    game across the rebuild.
    """
    out_path = _METADATA_PATH
    existing_stages = _load_existing_pipeline_stages(out_path)
    existing_curated = _load_existing_curated_fields(out_path)
    existing_deployed_versions = _load_existing_deployed_versions(out_path)
    metadata = generate_game_metadata(existing_stages, existing_curated, existing_deployed_versions)
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


def record_deployed_version(game_id: str, version: str, out_path: Path | None = None) -> bool:
    """Record the deployed_version for game_id in the on-disk metadata file.

    Called only after a real, confirmed successful deploy -- never speculatively.
    Returns True if a write happened, False otherwise.
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

    data[game_id]["deployed_version"] = version
    out_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return True


if __name__ == "__main__":
    out_path = write_game_metadata()
    metadata = generate_game_metadata()
    print(f"Wrote metadata for {len(metadata)} games to {out_path}")
