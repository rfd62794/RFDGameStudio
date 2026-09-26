import json
from pathlib import Path

from studio_mcp.demos import registry as reg
from studio_mcp.paths import REPOS_ROOT

FIXTURE = Path(__file__).parent / "fixtures" / "registry_export_sample.json"
GAMES = json.loads(FIXTURE.read_text(encoding="utf-8"))["games"]


def test_demo_lists_come_from_source():
    assert reg.example_demos(GAMES) == ["ledger", "slimebreeder", "systemic-extract"]
    assert reg.demo_static_names(GAMES) == {
        "ledger": "ledger", "slimebreeder": "slimebreeder", "systemic-extract": "systemic_extract"}
    assert reg.external_demo_paths(GAMES) == {"slimebreeder": REPOS_ROOT / "SlimeBreeder"}
    assert reg.external_repos(GAMES) == {"slimebreeder": REPOS_ROOT / "SlimeBreeder"}


def test_game_paths_follow_the_rule(tmp_path):
    (tmp_path / "games" / "shoal").mkdir(parents=True)
    (tmp_path / "intake" / "systemic-extract").mkdir(parents=True)
    paths = reg.game_paths(GAMES, tmp_path)
    assert paths["shoal"] == ["games/shoal", "ts/src/games/shoal"]
    assert paths["ledger"] == ["ts/src/games/ledger", "examples/ledger"]
    assert paths["slimebreeder"] == ["ts/src/games/slimebreeder"]
    assert paths["systemic_extract"] == [
        "ts/src/games/systemic_extract", "examples/systemic-extract", "intake/systemic-extract"]
    assert list(paths) == [g["gameId"] for g in GAMES]


def test_find_by_slug():
    assert reg.find_by_slug(GAMES, "systemic-extract")["gameId"] == "systemic_extract"
    assert reg.find_by_slug(GAMES, "nope") is None


def test_load_registry_refreshes_only_when_stale(tmp_path, monkeypatch):
    out = tmp_path / "registry-export.json"
    out.write_text(FIXTURE.read_text(encoding="utf-8"), encoding="utf-8")
    calls = []
    monkeypatch.setattr(reg, "export_registry", lambda run=None: calls.append(1))
    monkeypatch.setattr(reg, "_newest_source_mtime", lambda: out.stat().st_mtime - 10)
    assert len(reg.load_registry(out)) == 4
    assert calls == []
    monkeypatch.setattr(reg, "_newest_source_mtime", lambda: out.stat().st_mtime + 10)
    reg.load_registry(out)
    assert calls == [1]
