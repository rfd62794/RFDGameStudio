"""test_studio_catalogue.py — Tests for scripts/studio_catalogue.py.

Everything runs against a fixture tree built under tmp_path — never the real
ts/src/games/, which changes underfoot.
"""
from __future__ import annotations

import json
from pathlib import Path

import scripts.studio_catalogue as sc


def _write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _config(game_id: str, label: str | None = "Game", status: str = "dev", extra: str = "") -> str:
    label_line = f"  label: '{label}',\n" if label is not None else ""
    status_line = f"  status: '{status}',\n" if status is not None else ""
    return (
        "import type { GameConfig } from '../../engine/types';\n"
        "const config: GameConfig = {\n"
        f"  gameId: '{game_id}',\n"
        f"{label_line}"
        f"{status_line}"
        f"{extra}"
        "};\n"
        "export default config;\n"
    )


def _registry(*slugs: str) -> str:
    return "".join(f"import c{i} from './{s}/config';\n" for i, s in enumerate(slugs))


def _tracker(*rows: tuple[str, str]) -> str:
    out = (
        "# Tracker\n\n"
        "| # | Game | Primary Genre | Secondary Genre | Status | Renderer | Notes |\n"
        "|---|---|---|---|---|---|---|\n"
    )
    for i, (name, status) in enumerate(rows, 1):
        out += f"| {i} | {name} | G | S | {status} | R | n |\n"
    return out


def _site(*slugs: str) -> str:
    games = [{"gameId": s, "slug": s.replace("_", "-"), "stack": []} for s in slugs]
    return json.dumps({"games": games})


def make_tree(tmp_path: Path, games: dict, registry: str = "", shared: tuple = (),
              tracker: str = "", site: str | None = "") -> tuple[Path, Path]:
    """games maps slug -> {"config": str, "files": {relpath: str}}. Returns
    (root, site_arcade_path); when site is None the path is left unwritten."""
    gdir = tmp_path / "ts" / "src" / "games"
    for slug, spec in games.items():
        _write(gdir / slug / "config.ts", spec["config"])
        for rel, text in spec.get("files", {}).items():
            _write(gdir / slug / rel, text)
    _write(gdir / "registry.ts", registry)
    for name in shared:
        _write(tmp_path / "ts" / "src" / "engine" / "shared" / name, "export {};\n")
    _write(tmp_path / "GENRE_TRACKER.md", tracker)
    site_path = tmp_path / "site" / "data" / "arcade.json"
    if site is not None:
        _write(site_path, site)
    return tmp_path, site_path


def test_orphan_reported_p1(tmp_path) -> None:
    root, site = make_tree(
        tmp_path,
        games={"ghost": {"config": _config("ghost")}},
        registry=_registry(),
        site=_site(),
    )
    cat = sc.build_catalogue(root, site)
    orphan = [f for f in cat["findings"] if f["kind"] == "orphan" and f["slug"] == "ghost"]
    assert orphan and orphan[0]["p"] == 1


def test_retired_still_in_registry_reported(tmp_path) -> None:
    root, site = make_tree(
        tmp_path,
        games={"old": {"config": _config("old", status="retired")}},
        registry=_registry("old"),
        site=_site("old"),
    )
    cat = sc.build_catalogue(root, site)
    hits = [f for f in cat["findings"] if f["kind"] == "retired-but-listed" and f["slug"] == "old"]
    assert hits and hits[0]["p"] == 1


def test_sole_consumer_one_game_reported_two_not(tmp_path) -> None:
    root, site = make_tree(
        tmp_path,
        games={
            "a": {"config": _config("a"), "files": {
                "logic.ts": "import { x } from '../../engine/shared/only_one';\n"
                            "import { y } from '../../engine/shared/two_use';\n"}},
            "b": {"config": _config("b"), "files": {
                "logic.ts": "import { y } from '../../engine/shared/two_use';\n"}},
        },
        registry=_registry("a", "b"),
        shared=("only_one.ts", "two_use.ts"),
        site=_site(),
    )
    cat = sc.build_catalogue(root, site)
    sole = {f["module"] for f in cat["findings"] if f["kind"] == "sole-consumer"}
    assert "only_one" in sole
    assert "two_use" not in sole


def test_unparseable_label_is_null_and_counted_gap(tmp_path) -> None:
    cfg = (
        "import type { GameConfig } from '../../engine/types';\n"
        "const LABEL = 'Late Label';\n"
        "const config: GameConfig = {\n"
        "  gameId: 'mystery',\n"
        "  label: LABEL,\n"
        "  status: 'dev',\n"
        "};\n"
        "export default config;\n"
    )
    root, site = make_tree(
        tmp_path,
        games={"mystery": {"config": cfg}},
        registry=_registry("mystery"),
        site=_site(),
    )
    cat = sc.build_catalogue(root, site)
    row = next(g for g in cat["games"] if g["slug"] == "mystery")
    assert row["label"] is None
    assert cat["gaps"] >= 1


def test_check_exits_1_on_p1(tmp_path, capsys) -> None:
    root, site = make_tree(
        tmp_path,
        games={"ghost": {"config": _config("ghost")}},
        registry=_registry(),
        site=_site(),
    )
    assert sc.main(["--root", str(root), "--site-arcade", str(site), "--check"]) == 1


def test_check_exits_0_without_p1(tmp_path, capsys) -> None:
    root, site = make_tree(
        tmp_path,
        games={"ok": {"config": _config("ok")}},
        registry=_registry("ok"),
        site=_site("ok"),
    )
    assert sc.main(["--root", str(root), "--site-arcade", str(site), "--check"]) == 0


def test_missing_site_arcade_degrades_to_null(tmp_path) -> None:
    root, site = make_tree(
        tmp_path,
        games={"g": {"config": _config("g")}},
        registry=_registry("g"),
        site=None,
    )
    cat = sc.build_catalogue(root, site)
    assert cat["games"][0]["published"] is None


def test_status_conflict_with_tracker(tmp_path) -> None:
    root, site = make_tree(
        tmp_path,
        games={"g": {"config": _config("g", label="My Game", status="dev")}},
        registry=_registry("g"),
        tracker=_tracker(("My Game", "STABLE")),
        site=_site("g"),
    )
    cat = sc.build_catalogue(root, site)
    kinds = {f["kind"] for f in cat["findings"] if f["slug"] == "g"}
    assert "status-conflict" in kinds


def test_json_findings_carry_stable_kind(tmp_path, capsys) -> None:
    root, site = make_tree(
        tmp_path,
        games={"ghost": {"config": _config("ghost")}},
        registry=_registry(),
        site=_site(),
    )
    sc.main(["--root", str(root), "--site-arcade", str(site), "--json"])
    data = json.loads(capsys.readouterr().out)
    assert data["findings"] and all(f["kind"] for f in data["findings"])
