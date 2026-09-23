"""studio_catalogue.py — make the studio's work addressable.

A cross-game directive has to say "for every game where X, do Y", and until
now nothing could enumerate X: three catalogues disagreed (site,
GENRE_TRACKER.md, and ts/src/games/ itself), a retired game kept a 'stable'
badge for a month, and a finished game sat unimported in registry.ts, invisible to every
downstream consumer. All of it was derivable from files already on disk — so
derive it, and it can never go stale. The only thing hand-maintained anywhere
is judgement; this board carries none.

    python scripts/studio_catalogue.py               # the board, worst first
    python scripts/studio_catalogue.py --json        # machine-readable
    python scripts/studio_catalogue.py --summary     # one line
    python scripts/studio_catalogue.py --check       # exit 1 on any P1
    python scripts/studio_catalogue.py --game shoal  # one game

Findings (each carries a stable machine-readable `kind`):
    P1  orphan                     config.ts exists but registry.ts does not import it
    P1  retired-but-listed         status 'retired' yet still in registry, manifest, or site
    P2  unregistered-but-published on the site but not in the registry
    P2  built-not-published        registered with a non-dev status, absent from the site
    P3  no-stack                   stack absent — the site's "Built with" row renders empty
    P3  status-conflict            config status disagrees with GENRE_TRACKER.md's row
    P4  sole-consumer              an engine/shared module exactly one game imports

Fields that cannot be derived are recorded as null and counted as gaps — a
named gap is useful, a guess is not.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_ARCADE = Path(r"C:\GitHub\RFD_IT_Services_Site\data\arcade.json")

GAMES_REL = Path("ts") / "src" / "games"
TRACKER_REL = Path("GENRE_TRACKER.md")

# Statuses that mean "meant to be on the site" for built-not-published.
# 'dev' and 'tool' are not publishable; 'retired' has its own check.
NON_DEV_STATUSES = {"stable", "beta", "external"}

# GENRE_TRACKER.md uses its own vocabulary. Only these tokens map onto a
# GameConfig status; anything else (VERIFIED, ACTIVE, LIVE/BROKEN, UNLISTED)
# is recorded in `tracker_status` but not compared.
TRACKER_STATUS = {
    "STABLE": "stable",
    "BETA": "beta",
    "DEV": "dev",
    "EXTERNAL": "external",
    "RETIRED": "retired",
    "TOOL": "tool",
}

IMPORT_PATH_RE = re.compile(r"""from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]""")
SHARED_RE = re.compile(r"engine/shared(?:/([A-Za-z0-9_-]+))?")
REACT_RE = re.compile(r"""from\s+['"]react['"]|import\s+React\b""")


def _read(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def _load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _literal(text: str, key: str) -> str | None:
    m = re.search(rf"(?m)^\s*{re.escape(key)}\s*:\s*['\"]([^'\"]+)['\"]", text)
    return m.group(1) if m else None


def _norm(name: str | None) -> str:
    return re.sub(r"[^a-z0-9]", "", (name or "").lower())


def parse_config(path: Path) -> dict:
    """Pull the simple string literals out of a config.ts. No TypeScript is
    executed; anything that is not a plain literal stays null and counts as a
    gap rather than being guessed."""
    text = _read(path) or ""
    stack = None
    m = re.search(r"(?m)^\s*stack\s*:\s*\[([^\]]*)\]", text)
    if m:
        stack = re.findall(r"['\"]([^'\"]+)['\"]", m.group(1))
    return {
        "gameId": _literal(text, "gameId"),
        "label": _literal(text, "label"),
        "status": _literal(text, "status"),
        "section": _literal(text, "arcadeSection") or _literal(text, "section"),
        "stack": stack,
        "has_component": bool(re.search(r"(?m)^\s*component\s*:", text)),
        "embed_url": _literal(text, "embedUrl") or _literal(text, "externalUrl"),
    }


def registry_slugs(path: Path) -> set[str] | None:
    text = _read(path)
    if text is None:
        return None
    return set(re.findall(r"""from\s+['"]\./([A-Za-z0-9_]+)/config['"]""", text))


def manifest_ids(path: Path) -> set[str] | None:
    """arcade-manifest.json is generated (gitignored), so absent is normal —
    the field degrades to null rather than failing."""
    data = _load_json(path)
    if not data:
        return None
    ids = set()
    for g in data.get("games", []):
        for key in ("gameId", "slug"):
            if g.get(key):
                ids.add(str(g[key]))
    return ids


def site_games(path: Path) -> dict | None:
    """Slugs on the published site, normalized: the site uses kebab-case slugs
    ('horse-racing') against snake_case gameIds, so both forms land in `ids`.
    Also carries which entries already provide a non-empty `stack`."""
    data = _load_json(path)
    if not data:
        return None
    ids: set[str] = set()
    stacks: dict[str, bool] = {}
    for g in data.get("games", []):
        keys = {str(g[k]) for k in ("gameId", "slug") if g.get(k)}
        keys |= {k.replace("-", "_") for k in list(keys)}
        ids |= keys
        for k in keys:
            stacks[k] = stacks.get(k, False) or bool(g.get("stack"))
    return {"ids": ids, "stacks": stacks}


def tracker_statuses(path: Path) -> dict[str, str]:
    """GENRE_TRACKER.md 'Game Registry' table, keyed by normalized game name
    (matched against slug, gameId, and label). Raw status text kept as-is."""
    text = _read(path)
    if text is None:
        return {}
    rows: dict[str, str] = {}
    for line in text.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 5 or not cells[0].isdigit():
            continue
        name, status = cells[1], re.sub(r"[*_]", "", cells[4]).strip()
        if name and status:
            rows[_norm(name)] = status
    return rows


def scan_game_dir(gdir: Path) -> dict:
    """Walk the game's .ts/.tsx once: shared-module imports (real import paths
    only — comments mention engine/shared too), Lua-bridge use, React use, and
    a total line count."""
    modules: set[str] = set()
    executor = False
    react = False
    lines = 0
    for f in sorted(gdir.rglob("*")):
        if not f.is_file() or f.suffix not in (".ts", ".tsx"):
            continue
        text = _read(f) or ""
        lines += text.count("\n") + (1 if text and not text.endswith("\n") else 0)
        for m in IMPORT_PATH_RE.finditer(text):
            sm = SHARED_RE.search(m.group(1) or m.group(2) or "")
            if sm:
                modules.add(sm.group(1) or "index")
        if "session.executor" in text:
            executor = True
        if REACT_RE.search(text):
            react = True
    return {"shared": modules, "executor": executor, "react": react, "lines": lines}


def infer_renderer(scan: dict, cfg: dict) -> str:
    """Best-effort from imports alone. A Lua-bridge game also imports React for
    its chrome, so executor wins; embed-only entries have no local component."""
    if scan["executor"]:
        return "lua"
    if scan["react"] or cfg["has_component"]:
        return "react"
    if cfg["embed_url"]:
        return "embed"
    return "unknown"


def build_catalogue(root: Path, site_arcade: Path | None = None) -> dict:
    games_dir = root / GAMES_REL
    site_path = SITE_ARCADE if site_arcade is None else site_arcade

    registry = registry_slugs(games_dir / "registry.ts")
    manifest = manifest_ids(games_dir / "arcade-manifest.json")
    site = site_games(site_path)
    tracker = tracker_statuses(root / TRACKER_REL)

    games: list[dict] = []
    findings: list[dict] = []
    module_consumers: dict[str, list[str]] = {}
    gaps = 0

    game_dirs = sorted(games_dir.iterdir()) if games_dir.is_dir() else []
    for gdir in game_dirs:
        if not gdir.is_dir() or not (gdir / "config.ts").exists():
            continue
        slug = gdir.name
        cfg = parse_config(gdir / "config.ts")
        scan = scan_game_dir(gdir)
        for mod in scan["shared"]:
            module_consumers.setdefault(mod, []).append(slug)

        in_registry = None if registry is None else slug in registry
        in_manifest = None if manifest is None else (slug in manifest or (cfg["gameId"] or "") in manifest)
        published = None if site is None else slug in site["ids"]
        stack_present = bool(cfg["stack"]) or bool(site and site["stacks"].get(slug))
        renderer = infer_renderer(scan, cfg)

        tracker_status = None
        for key in (slug, cfg["gameId"], cfg["label"]):
            if _norm(key) in tracker:
                tracker_status = tracker[_norm(key)]
                break

        row = {
            "slug": slug,
            "gameId": cfg["gameId"],
            "label": cfg["label"],
            "status": cfg["status"],
            "section": cfg["section"],
            "in_registry": in_registry,
            "in_manifest": in_manifest,
            "published": published,
            "shared_modules": sorted(scan["shared"]),
            "renderer": renderer,
            "lines": scan["lines"],
            "stack": cfg["stack"],
            "tracker_status": tracker_status,
        }
        games.append(row)

        gaps += sum(row[k] is None for k in ("gameId", "label", "status", "section",
                                             "in_registry", "in_manifest", "published"))
        gaps += renderer == "unknown"

        if in_registry is False:
            findings.append({"p": 1, "kind": "orphan", "slug": slug,
                             "what": "config.ts exists but registry.ts does not import it"})
        if cfg["status"] == "retired" and (in_registry or in_manifest or published):
            where = [w for w, v in (("registry", in_registry), ("manifest", in_manifest),
                                    ("site", published)) if v]
            findings.append({"p": 1, "kind": "retired-but-listed", "slug": slug,
                             "what": f"status 'retired' but still listed in {', '.join(where)}"})
        if published is True and in_registry is False:
            findings.append({"p": 2, "kind": "unregistered-but-published", "slug": slug,
                             "what": "on the site but not imported by registry.ts"})
        if in_registry is True and cfg["status"] in NON_DEV_STATUSES and published is False:
            findings.append({"p": 2, "kind": "built-not-published", "slug": slug,
                             "what": f"registered with status '{cfg['status']}' but absent from the site"})
        if not stack_present:
            findings.append({"p": 3, "kind": "no-stack", "slug": slug,
                             "what": "no stack - the site's \"Built with\" row renders empty"})
        mapped = TRACKER_STATUS.get((tracker_status or "").upper())
        if mapped and cfg["status"] and mapped != cfg["status"]:
            findings.append({"p": 3, "kind": "status-conflict", "slug": slug,
                             "what": f"config says '{cfg['status']}', GENRE_TRACKER.md says {tracker_status}"})

    for mod, consumers in sorted(module_consumers.items()):
        if len(consumers) == 1:
            findings.append({"p": 4, "kind": "sole-consumer", "slug": consumers[0],
                             "module": mod, "games": consumers,
                             "what": f"engine/shared/{mod} is imported only by {consumers[0]}"})

    findings.sort(key=lambda f: (f["p"], f.get("slug") or "", f.get("module") or ""))
    return {"games": games, "findings": findings, "gaps": gaps}


def summary(cat: dict) -> str:
    findings = cat["findings"]
    if not findings:
        return f"studio: {len(cat['games'])} games, every check clean ({cat['gaps']} gaps)"
    counts: dict[str, int] = {}
    for f in findings:  # findings are already sorted worst-first
        counts[f["kind"]] = counts.get(f["kind"], 0) + 1
    parts = ", ".join(f"{counts[k]} {k}" for k in counts)
    return f"studio: {len(cat['games'])} games, {len(findings)} findings, worst P{findings[0]['p']} - {parts}"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="studio_catalogue")
    parser.add_argument("--game", help="only this slug")
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--summary", action="store_true")
    parser.add_argument("--check", action="store_true", help="exit 1 if any P1 finding exists")
    parser.add_argument("--root", type=Path, default=ROOT, help="repo root (tests point this at a fixture)")
    parser.add_argument("--site-arcade", type=Path, default=SITE_ARCADE,
                        help="site data/arcade.json (absent -> published: null)")
    args = parser.parse_args(argv if argv is not None else sys.argv[1:])

    cat = build_catalogue(args.root, args.site_arcade)
    if args.game:
        cat["games"] = [g for g in cat["games"] if g["slug"] == args.game]
        cat["findings"] = [f for f in cat["findings"]
                           if f.get("slug") == args.game or args.game in (f.get("games") or [])]

    if args.summary:
        print(summary(cat))
    elif args.as_json:
        print(json.dumps(cat, indent=2))
    else:
        if not cat["findings"]:
            print("Every check clean. Nothing to report.")
        for f in cat["findings"]:
            subject = f.get("slug") or f.get("module") or ""
            print(f"P{f['p']}  {f['kind']:<26} {subject:<24} {f['what']}")
        print()
        print(summary(cat))

    if args.check:
        return 1 if any(f["p"] == 1 for f in cat["findings"]) else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
