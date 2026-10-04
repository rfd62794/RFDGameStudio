import json
import zipfile

import pytest

from studio_mcp.demos import naming, register


@pytest.mark.parametrize("name,slug", [
    ("systemic-extract (12).zip", "systemic-extract"),
    (r"C:\Users\x\Downloads\systemic-extract (12).zip", "systemic-extract"),
    ("My Cool Game.zip", "my-cool-game"),
    ("systemic-extract_v0.1.0R2.zip", "systemic-extract"),
    ("Neon__Drift!!.ZIP", "neon-drift"),
])
def test_slug_from_zip(name, slug):
    assert naming.slug_from_zip(name) == slug


def test_slug_from_zip_rejects_empty():
    with pytest.raises(ValueError):
        naming.slug_from_zip("(3).zip")


def test_game_id():
    assert naming.game_id("7-days-to-fry") == "7_days_to_fry"


def test_import_name_is_a_valid_identifier():
    assert register.import_name("systemic_extract") == "systemicExtractConfig"
    assert register.import_name("7_days_to_fry") == "demo7DaysToFryConfig"


def test_color_is_deterministic_and_from_the_palette():
    assert register.color_for("systemic-extract") == register.color_for("systemic-extract")
    assert register.color_for("systemic-extract") in register.PALETTE


def test_render_config_ts():
    ts = register.render_config_ts("neon_drift", "neon-drift", 'Neon "Drift"', "A racer.", 370)
    assert "gameId: \"neon_drift\"," in ts
    assert "  order: 370," in ts
    assert "label: \"Neon \\\"Drift\\\"\"," in ts
    assert "status: 'external'," in ts
    assert "source: { kind: 'example', slug: \"neon-drift\" }," in ts
    assert "embedUrl: '/arcade/neon_drift/'," in ts
    assert ts.endswith("export default config;\n")


def test_read_zip_metadata(tmp_path):
    z = tmp_path / "g.zip"
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("metadata.json", json.dumps({"name": "Neon Drift", "description": "A racer."}))
    assert register.read_zip_metadata(z) == {"name": "Neon Drift", "description": "A racer."}
    empty = tmp_path / "e.zip"
    with zipfile.ZipFile(empty, "w") as f:
        f.writestr("index.html", "")
    assert register.read_zip_metadata(empty) == {}


def test_write_registration(tmp_path):
    games = tmp_path / "ts" / "src" / "games"
    games.mkdir(parents=True)
    registry_text = "export const GAME_REGISTRY = collectConfigs(import.meta.glob(['./*/config.ts']));\n"
    (games / "registry.ts").write_text(registry_text, encoding="utf-8", newline="")
    (games / "ledger").mkdir()
    (games / "ledger" / "config.ts").write_text("  gameId: 'ledger',\n  order: 140,\n", encoding="utf-8")
    gitignore_text = "examples/*\n"
    (tmp_path / ".gitignore").write_text(gitignore_text, encoding="utf-8")
    z = tmp_path / "g.zip"
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("metadata.json", json.dumps({"name": "Neon Drift", "description": "A racer."}))
    changed = register.write_registration(tmp_path, "neon_drift", "neon-drift", z)
    assert changed == ["ts/src/games/neon_drift/config.ts"]
    assert "  order: 150," in (games / "neon_drift" / "config.ts").read_text(encoding="utf-8")
    assert (games / "registry.ts").read_text(encoding="utf-8") == registry_text
    assert (tmp_path / ".gitignore").read_text(encoding="utf-8") == gitignore_text
    assert "label: \"Neon Drift\"," in (games / "neon_drift" / "config.ts").read_text(encoding="utf-8")
    assert register.write_registration(tmp_path, "neon_drift", "neon-drift", z) == []
