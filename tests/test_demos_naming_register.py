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
    ts = register.render_config_ts("neon_drift", "neon-drift", 'Neon "Drift"', "A racer.")
    assert "gameId: \"neon_drift\"," in ts
    assert "label: \"Neon \\\"Drift\\\"\"," in ts
    assert "status: 'external'," in ts
    assert "source: { kind: 'example', slug: \"neon-drift\" }," in ts
    assert "embedUrl: '/arcade/neon_drift/'," in ts
    assert ts.endswith("export default config;\n")


REGISTRY = (
    "import aConfig from './a/config';\r\n"
    "// demos:imports:begin — keep\r\n"
    "// demos:imports:end\r\n"
    "export const GAME_REGISTRY: GameConfig[] = [\r\n"
    "  aConfig,\r\n"
    "  // demos:begin — demos\r\n"
    "  ledgerConfig,\r\n"
    "  // demos:end\r\n"
    "];\r\n"
)


def test_insert_registry_entry_keeps_crlf_and_is_idempotent():
    once = register.insert_registry_entry(REGISTRY, "neon_drift")
    assert "import neonDriftConfig from './neon_drift/config';\r\n// demos:imports:end" in once
    assert "  ledgerConfig,\r\n  neonDriftConfig,\r\n  // demos:end" in once
    assert register.insert_registry_entry(once, "neon_drift") == once


def test_insert_registry_entry_requires_markers():
    with pytest.raises(ValueError):
        register.insert_registry_entry("export const GAME_REGISTRY = [];\n", "x")


def test_add_gitignore_line():
    text = "examples/*\n!examples/ledger/\n!examples/systemic-extract/\n\n# Screenshots\n"
    out = register.add_gitignore_line(text, "neon-drift")
    assert "!examples/systemic-extract/\n!examples/neon-drift/\n" in out
    assert register.add_gitignore_line(out, "neon-drift") == out


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
    (games / "registry.ts").write_text(REGISTRY, encoding="utf-8", newline="")
    (tmp_path / ".gitignore").write_text("examples/*\n!examples/ledger/\n", encoding="utf-8")
    z = tmp_path / "g.zip"
    with zipfile.ZipFile(z, "w") as f:
        f.writestr("metadata.json", json.dumps({"name": "Neon Drift", "description": "A racer."}))
    changed = register.write_registration(tmp_path, "neon_drift", "neon-drift", z)
    assert changed == ["ts/src/games/neon_drift/config.ts", "ts/src/games/registry.ts", ".gitignore"]
    assert "label: \"Neon Drift\"," in (games / "neon_drift" / "config.ts").read_text(encoding="utf-8")
    assert register.write_registration(tmp_path, "neon_drift", "neon-drift", z) == []
