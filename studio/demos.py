"""demos.py — every demo is a child project the swarm can address.

The swarm keys everything by repo, so dozens of game folders shared one
direction, one roadmap and one test command. This module publishes what
the studio's demos are, where each one's files live, and how to verify
one demo without running the whole suite — the studio's side of the
"each demo is a child of the studio" contract. AgentFlow's side (the
Repo/child-id address, per-child direction and caps) lands separately;
nothing here depends on it.

Everything is derived from evidence already in the repo:

    ts/src/games/arcade-manifest.json   generated arcade list (gitignored —
                                        absent is normal, fields degrade)
    ts/src/games/game-metadata.json     git-derived tracking data (also
                                        gitignored — absent is normal)
    ts/src/games/<id>/                  a demo's primary folder
    games/<id>/                         the Lua four-file folder (doubles as
                                        the demo's docs_path)

    uv run python -m studio.demos list           # every demo, sorted by id
    uv run python -m studio.demos paths <id>     # a demo's working area
    uv run python -m studio.demos check <id>     # its verify command
    uv run python -m studio.demos index          # write docs/children.json
    uv run python -m studio.demos problems       # index/folder/test gaps

Findings are reported by problems(), never raised — a mismatch is data,
not an error.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

TS_GAMES_REL = Path("ts") / "src" / "games"
LUA_GAMES_REL = Path("games")
EXAMPLES_REL = Path("examples")
INTAKE_REL = Path("intake")
GDD_REL = Path("docs") / "gdd"
TS_TESTS_REL = Path("ts") / "tests"
PY_TESTS_REL = Path("tests")

MANIFEST_REL = TS_GAMES_REL / "arcade-manifest.json"
METADATA_REL = TS_GAMES_REL / "game-metadata.json"
CHILDREN_INDEX_REL = Path("docs") / "children.json"

# pipeline_stage values written only on confirmed real deploys (see
# studio_mcp.game_metadata): website_collection = on the site,
# itch_published = pushed to itch.io. Either means the demo shipped.
DEPLOYED_STAGES = {"website_collection", "itch_published"}

_LITERAL_RE = r"""['"]([^'"]+)['"]"""


@dataclass(frozen=True)
class Demo:
    """One addressable child project of the studio."""

    id: str            # gameId — the swarm's child-id
    label: str         # manifest label, else config.ts label, else the id
    path: str          # repo-relative primary folder
    stage: str         # manifest status, else config status, else pipeline stage
    published: bool    # pipeline stage reached a real deploy target
    docs_path: str | None  # games/<id>/ when that folder exists, else None


def _read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def _load_json(path: Path) -> dict:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _literal(text: str, key: str) -> str | None:
    m = re.search(rf"(?m)^\s*{re.escape(key)}\s*:\s*{_LITERAL_RE}", text)
    return m.group(1) if m else None


def _norm(name: str | None) -> str:
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def _manifest_games(root: Path) -> dict[str, dict] | None:
    """gameId -> manifest entry. None when the file is absent — it is
    generated (gitignored), so absent is normal, not an error."""
    data = _load_json(root / MANIFEST_REL)
    if not data:
        return None
    games: dict[str, dict] = {}
    for entry in data.get("games", []):
        if not isinstance(entry, dict):
            continue
        game_id = entry.get("gameId") or entry.get("slug")
        if game_id:
            games[str(game_id)] = entry
    return games


def _metadata(root: Path) -> dict[str, dict] | None:
    """gameId -> tracking entry. None when the file is absent."""
    data = _load_json(root / METADATA_REL)
    return data or None


def _config_fields(config_path: Path) -> dict[str, str | None]:
    """Plain string literals out of a config.ts; no TypeScript is executed."""
    text = _read(config_path) or ""
    return {
        "gameId": _literal(text, "gameId"),
        "label": _literal(text, "label"),
        "status": _literal(text, "status"),
    }


def _dirs(base: Path) -> set[str]:
    if not base.is_dir():
        return set()
    return {p.name for p in base.iterdir() if p.is_dir()}


def _rel(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def list_demos(root: Path = REPO_ROOT) -> tuple[Demo, ...]:
    """Every demo the repo's own evidence admits, sorted by id.

    A demo in the manifest with no folder, or a folder in neither index,
    is still listed — problems() reports the mismatch instead of dropping
    it silently.
    """
    manifest = _manifest_games(root) or {}
    metadata = _metadata(root) or {}
    ts_dirs = _dirs(root / TS_GAMES_REL)
    lua_dirs = _dirs(root / LUA_GAMES_REL)

    demos: list[Demo] = []
    for demo_id in sorted(set(manifest) | set(metadata) | ts_dirs | lua_dirs):
        cfg = _config_fields(root / TS_GAMES_REL / demo_id / "config.ts")
        entry = manifest.get(demo_id, {})
        meta = metadata.get(demo_id, {})
        meta = meta if isinstance(meta, dict) else {}

        label = entry.get("label") or cfg["label"] or demo_id
        stage = entry.get("status") or cfg["status"] or meta.get("pipeline_stage") or "unknown"
        pipeline = entry.get("pipelineStage") or meta.get("pipeline_stage") or ""
        if demo_id in ts_dirs or demo_id not in lua_dirs:
            path = f"ts/src/games/{demo_id}"
        else:
            path = f"games/{demo_id}"
        demos.append(Demo(
            id=demo_id,
            label=str(label),
            path=path,
            stage=str(stage),
            published=pipeline in DEPLOYED_STAGES,
            docs_path=f"games/{demo_id}" if demo_id in lua_dirs else None,
        ))
    return tuple(demos)


def _name_match(demo_id: str, filename: str) -> bool:
    """True when the file's test_<tokens> stem carries every token of the
    demo id — test_slimeworld_stats is slimeworld's, but
    test_dissonance_shared_ui is not dissonance_prototype's."""
    stem = re.sub(r"\.(py|ts|tsx)$", "", filename)
    stem = stem.removeprefix("test_")
    return set(demo_id.split("_")).issubset(set(stem.split("_")))


def _references_demo(demo_id: str, text: str) -> bool:
    """True when the file names the demo's own folder — an import like
    '../src/games/slimeworld/types' or a Lua path like
    'games/shoal/data.yaml'. The trailing boundary keeps 'dissonance'
    from claiming 'dissonance_prototype'."""
    return bool(re.search(rf"games/{re.escape(demo_id)}(?![\w-])", text))


def _test_files(root: Path, demo_ids: set[str]) -> dict[str, list[str]]:
    """demo_id -> repo-relative test files, matched by filename tokens or
    by a real reference to the demo's folder in the file's contents.

    The repo's own audit (docs/gdd/TEST_SUITE_CLASSIFICATION.md) showed
    TS test names do not follow a clean prefix convention, so filename
    alone is not enough; content reference is the second half of the rule.
    """
    matched: dict[str, list[str]] = {d: [] for d in demo_ids}
    suites = ((root / PY_TESTS_REL, (".py",)), (root / TS_TESTS_REL, (".ts", ".tsx")))
    for base, suffixes in suites:
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file() or path.suffix not in suffixes:
                continue
            if not path.name.startswith("test_"):
                continue
            rel = _rel(path, root)
            text: str | None = None
            for demo_id in demo_ids:
                if _name_match(demo_id, path.name):
                    matched[demo_id].append(rel)
                    continue
                if text is None:
                    text = _read(path) or ""
                if _references_demo(demo_id, text):
                    matched[demo_id].append(rel)
    return matched


def _doc_files(root: Path, demo_id: str, label: str) -> list[str]:
    """docs/gdd files whose name carries the demo's id or label —
    best-effort (WireAndRust_Design.md will not match wire_rust)."""
    base = root / GDD_REL
    if not base.is_dir():
        return []
    keys = {_norm(demo_id), _norm(label)} - {""}
    return [
        _rel(f, root) for f in sorted(base.iterdir())
        if f.is_file() and any(k in _norm(f.name) for k in keys)
    ]


def demo_paths(demo_id: str, root: Path = REPO_ROOT) -> tuple[str, ...]:
    """The code, data, docs and test paths that belong to one demo — what a
    per-demo directive would declare as its working area. Shared engine
    paths are excluded by construction: nothing outside the demo's own
    folders, docs and test files is ever collected."""
    demo = next((d for d in list_demos(root) if d.id == demo_id), None)
    label = demo.label if demo else demo_id

    paths: set[str] = set()
    candidates = [
        TS_GAMES_REL / demo_id,
        LUA_GAMES_REL / demo_id,
        EXAMPLES_REL / demo_id,
        EXAMPLES_REL / demo_id.replace("_", "-"),
        INTAKE_REL / demo_id.replace("_", "-"),
        PY_TESTS_REL / "fixtures" / demo_id,
    ]
    for rel in candidates:
        if (root / rel).is_dir():
            paths.add(rel.as_posix())

    paths.update(_doc_files(root, demo_id, label))
    paths.update(_test_files(root, {demo_id}).get(demo_id, []))
    return tuple(sorted(paths))


def demo_check(demo_id: str, root: Path = REPO_ROOT) -> str:
    """The single command that verifies one demo: a vitest filter over that
    demo's real test files under ts/tests/ today. Returned, not run. When
    no file matches, the conventional test_<id> filter is emitted anyway —
    vitest reporting 'no test files' is itself a real signal."""
    files = _test_files(root, {demo_id}).get(demo_id, [])
    filters = [
        f.removeprefix("ts/") for f in files if f.startswith("ts/tests/")
    ]
    if not filters:
        filters = [f"test_{demo_id}"]
    return "cd ts && npx vitest run " + " ".join(sorted(filters))


def write_children_index(
    path: Path = CHILDREN_INDEX_REL,
    root: Path = REPO_ROOT,
) -> Path:
    """Write the swarm-facing children index. Deterministic: sorted by id,
    two-space indent, one trailing newline — regenerating with no real
    change produces no diff."""
    if not path.is_absolute():
        path = root / path
    children = [
        {"id": d.id, "path": d.path, "label": d.label}
        for d in list_demos(root)
    ]
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"version": 1, "children": children}, indent=2) + "\n",
                    encoding="utf-8")
    return path


def problems(root: Path = REPO_ROOT) -> list[str]:
    """Index/folder/test mismatches across the demo set. Findings, not
    exceptions — every entry is a string a human or agent can act on."""
    manifest = _manifest_games(root)
    metadata = _metadata(root)
    demos = list_demos(root)
    tests = _test_files(root, {d.id for d in demos})
    out: list[str] = []

    if manifest is not None:
        for demo in demos:
            if demo.id in manifest and not (root / demo.path).is_dir() and not (
                demo.docs_path and (root / demo.docs_path).is_dir()
            ):
                out.append(f"{demo.id}: listed in arcade-manifest.json but has no demo folder")

    indexes = [n for n, d in (("arcade-manifest.json", manifest),
                              ("game-metadata.json", metadata)) if d is not None]
    for demo in demos:
        in_manifest = manifest is not None and demo.id in manifest
        in_metadata = metadata is not None and demo.id in metadata
        if (root / demo.path).is_dir() and not in_manifest and not in_metadata:
            absent = " and ".join(indexes) if indexes else "any index (none present)"
            out.append(f"{demo.id}: demo folder exists but is absent from {absent}")
        if metadata is not None and not in_metadata:
            out.append(f"{demo.id}: missing from game-metadata.json")
        if not tests.get(demo.id):
            out.append(f"{demo.id}: no test file found")
    return sorted(out)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="demos",
                                   description="Address each demo as a child of the studio")
    parser.add_argument("--root", type=Path, default=REPO_ROOT,
                        help="repo root (tests point this at a fixture)")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list", help="every demo, sorted by id")
    for name in ("paths", "check"):
        p = sub.add_parser(name, help=f"demo {name} for one id")
        p.add_argument("id")
    sub.add_parser("index", help="write docs/children.json")
    sub.add_parser("problems", help="index/folder/test mismatches")
    args = parser.parse_args(argv if argv is not None else sys.argv[1:])

    if args.command == "list":
        for d in list_demos(args.root):
            print(f"{d.id}\t{d.stage}\t{str(d.published).lower()}\t{d.path}\t{d.label}")
    elif args.command == "paths":
        for p in demo_paths(args.id, args.root):
            print(p)
    elif args.command == "check":
        print(demo_check(args.id, args.root))
    elif args.command == "index":
        print(f"Wrote {write_children_index(root=args.root)}")
    elif args.command == "problems":
        found = problems(args.root)
        if not found:
            print("No problems found.")
        for p in found:
            print(p)
    return 0


if __name__ == "__main__":
    sys.exit(main())
