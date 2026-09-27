"""test_generate_dissonance_art.py — Tests for scripts/generate_dissonance_art.py.

Everything runs against a fixture data.yaml and an output dir under tmp_path —
never the real games/dissonance/data.yaml or ts/public/assets/dissonance/,
which generate_all would otherwise delete and rewrite.
"""
from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path

import pytest
import yaml

import scripts.generate_dissonance_art as gen


def _write_data(tmp_path: Path, data: dict) -> Path:
    path = tmp_path / "data.yaml"
    path.write_text(yaml.safe_dump(data), encoding="utf-8")
    return path


def _patch_paths(monkeypatch, tmp_path: Path, data: dict) -> Path:
    """Point DATA_PATH at a fixture file and OUT_DIR at tmp_path; returns OUT_DIR."""
    monkeypatch.setattr(gen, "DATA_PATH", _write_data(tmp_path, data))
    out_dir = tmp_path / "out"
    monkeypatch.setattr(gen, "OUT_DIR", out_dir)
    return out_dir


def _svg_root(svg: str) -> ET.Element:
    root = ET.fromstring(svg)
    assert root.tag == "{http://www.w3.org/2000/svg}svg"
    return root


# ---------- generate_card ----------


def test_card_single_element_uses_radial_gradient() -> None:
    svg = gen.generate_card({"id": "c_sever", "el1": "ember", "relationType": "single"})
    _svg_root(svg)
    assert "radialGradient" in svg
    assert 'stop-color="#f97316"' in svg  # ember
    assert 'stop-color="#0f172a"' in svg  # surface


def test_card_two_elements_uses_linear_gradient_with_both_colors() -> None:
    svg = gen.generate_card({"id": "c_sever", "el1": "ash", "el2": "spark", "relationType": "adjacent"})
    _svg_root(svg)
    assert "linearGradient" in svg
    assert 'stop-color="#94a3b8"' in svg  # ash
    assert 'stop-color="#22d3ee"' in svg  # spark


def test_card_unknown_element_falls_back_to_grey() -> None:
    svg = gen.generate_card({"id": "c_sever", "el1": "void", "relationType": "single"})
    _svg_root(svg)
    assert 'stop-color="#94a3b8"' in svg


def test_card_missing_relation_type_defaults_to_single_border() -> None:
    svg = gen.generate_card({"id": "c_sever", "el1": "ember"})
    assert 'stroke-width="2"' in svg
    assert "stroke-dasharray" not in svg
    assert 'id="glow"' not in svg


@pytest.mark.parametrize(
    "relation_type, expected, absent",
    [
        ("single", 'stroke-width="2"', "stroke-dasharray"),
        ("adjacent", 'stroke-width="4"', "stroke-dasharray"),
        ("same", 'id="glow"', "stroke-dasharray"),
        ("opposed", 'stroke-dasharray="6 4"', 'id="glow"'),
    ],
)
def test_card_border_per_relation_type(relation_type: str, expected: str, absent: str) -> None:
    svg = gen.generate_card({"id": "c_sever", "el1": "ember", "relationType": relation_type})
    _svg_root(svg)
    assert expected in svg
    assert absent not in svg


def test_card_same_relation_gets_thick_glowing_border() -> None:
    svg = gen.generate_card({"id": "c_mend", "el1": "ash", "el2": "ash", "relationType": "same"})
    assert 'id="glow"' in svg
    assert 'filter="url(#glow)"' in svg
    assert 'stroke-width="6"' in svg


@pytest.mark.parametrize(
    "card_id, marker",
    [
        ("deck_sever", "M-25,-20"),       # sever slash
        ("deck_mend", 'y1="-22"'),        # mend vertical bar
        ("deck_guard", "M0,-35"),         # guard shield curve
        ("deck_unmake", 'cx="0" cy="0" r="6"'),  # unmake spiral core
        ("no_underscore_or_known_suffix", 'cx="0" cy="0" r="6"'),  # default: unmake
    ],
)
def test_card_shape_comes_from_id_suffix(card_id: str, marker: str) -> None:
    svg = gen.generate_card({"id": card_id, "el1": "ember", "relationType": "single"})
    _svg_root(svg)
    assert marker in svg


# ---------- generate_relic ----------


@pytest.mark.parametrize(
    "category, marker",
    [
        ("economy", ">$</text>"),
        ("safety-net", "M50,42 L50,70"),
        ("info", "<ellipse"),
        ("risk", 'r="5"'),
        ("synergy", 'r="14"'),
    ],
)
def test_relic_shape_per_category(category: str, marker: str) -> None:
    svg = gen.generate_relic({"id": "r", "category": category})
    _svg_root(svg)
    assert marker in svg
    assert 'fill="#0f172a"' in svg  # surface background


def test_relic_utility_draws_eight_gear_teeth() -> None:
    svg = gen.generate_relic({"id": "r", "category": "utility"})
    assert svg.count('transform="rotate(') == 8


def test_relic_risk_draws_five_pips() -> None:
    svg = gen.generate_relic({"id": "r", "category": "risk"})
    assert svg.count('r="5"') == 5


def test_relic_missing_category_defaults_to_utility() -> None:
    svg = gen.generate_relic({"id": "r"})
    assert svg.count('transform="rotate(') == 8
    assert 'stroke="#a78bfa"' in svg  # utility violet


def test_relic_unknown_category_falls_through_to_synergy_shape() -> None:
    # _relic_shape's final else is synergy; RELIC_COLORS falls back to violet.
    svg = gen.generate_relic({"id": "r", "category": "mystery"})
    assert svg.count('r="14"') == 2
    assert 'stroke="#a78bfa"' in svg


# ---------- generate_enemy ----------


def test_enemy_silhouette_has_sixteen_points() -> None:
    svg = gen.generate_enemy({"id": "e", "tier": "basic"})
    root = _svg_root(svg)
    polygon = root.find(".//{http://www.w3.org/2000/svg}polygon")
    assert polygon is not None
    assert len(polygon.attrib["points"].split()) == 16  # n=8 star -> 16 vertices


@pytest.mark.parametrize(
    "tier, fill",
    [
        ("basic", "#64748b"),
        ("advanced", "#f59e0b"),
        ("elite", "#ea580c"),
        ("master", "#7c3aed"),
    ],
)
def test_enemy_tier_picks_its_fill(tier: str, fill: str) -> None:
    svg = gen.generate_enemy({"id": "e", "tier": tier})
    assert f'fill="{fill}"' in svg


def test_enemy_missing_tier_defaults_to_basic_visuals() -> None:
    svg = gen.generate_enemy({"id": "e"})
    assert 'fill="#64748b"' in svg
    assert "boss-glow" not in svg


def test_enemy_unknown_tier_falls_back_to_basic_visuals() -> None:
    svg = gen.generate_enemy({"id": "e", "tier": "mythic"})
    assert 'fill="#64748b"' in svg
    assert "boss-glow" not in svg


def test_enemy_master_gets_boss_glow_filter() -> None:
    svg = gen.generate_enemy({"id": "e", "tier": "master"})
    assert 'id="boss-glow"' in svg
    assert 'filter="url(#boss-glow)"' in svg


# ---------- load_data / generate_all / verify / main ----------


def test_load_data_missing_file_exits(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(gen, "DATA_PATH", tmp_path / "nope.yaml")
    with pytest.raises(SystemExit):
        gen.load_data()


def test_load_data_returns_parsed_yaml(tmp_path, monkeypatch) -> None:
    data = {"named_cards": [{"id": "c", "el1": "ash"}]}
    monkeypatch.setattr(gen, "DATA_PATH", _write_data(tmp_path, data))
    assert gen.load_data() == data


def test_generate_all_writes_svgs_and_clears_stale(tmp_path, monkeypatch) -> None:
    data = {
        "named_cards": [{"id": "c_sever", "el1": "ember", "relationType": "single"}],
        "relics": [{"id": "r1", "category": "economy"}],
        "enemies": {
            "basic": [{"id": "e_basic", "tier": "basic"}],
            "behavior_roster": [{"id": "e_roster", "tier": "advanced"}],
            "legacy_named": [{"id": "e_legacy", "tier": "elite"}],
            "bosses": [{"id": "e_boss", "tier": "master"}],
        },
    }
    out_dir = _patch_paths(monkeypatch, tmp_path, data)
    stale = out_dir / "cards" / "stale.svg"
    stale.parent.mkdir(parents=True)
    stale.write_text("<svg/>", encoding="utf-8")

    returned_dir, ids = gen.generate_all(data)

    assert returned_dir == out_dir
    assert ids == {
        "cards": ["c_sever"],
        "relics": ["r1"],
        "enemies": ["e_basic", "e_roster", "e_legacy", "e_boss"],
    }
    assert not stale.exists()
    for kind, eid in (("cards", "c_sever"), ("relics", "r1"),
                      ("enemies", "e_basic"), ("enemies", "e_boss")):
        svg = (out_dir / kind / f"{eid}.svg").read_text(encoding="utf-8")
        _svg_root(svg)


def test_generate_all_empty_data_creates_dirs_and_no_svgs(tmp_path, monkeypatch) -> None:
    out_dir = _patch_paths(monkeypatch, tmp_path, {})
    _, ids = gen.generate_all({})
    assert ids == {"cards": [], "relics": [], "enemies": []}
    for kind in ("cards", "relics", "enemies"):
        assert (out_dir / kind).is_dir()
        assert list((out_dir / kind).glob("*.svg")) == []


def test_verify_ok_when_ids_match_data(tmp_path, monkeypatch, capsys) -> None:
    data = {
        "named_cards": [{"id": "c", "el1": "ash"}],
        "relics": [{"id": "r"}],
        "enemies": {"bosses": [{"id": "e"}]},
    }
    _patch_paths(monkeypatch, tmp_path, data)
    ids = {"cards": ["c"], "relics": ["r"], "enemies": ["e"]}
    assert gen.verify(ids) is True
    out = capsys.readouterr().out
    assert "MISSING" not in out
    assert "EXTRA" not in out


def test_verify_reports_missing_ids(tmp_path, monkeypatch, capsys) -> None:
    data = {"named_cards": [{"id": "c1", "el1": "ash"}, {"id": "c2", "el1": "ash"}]}
    _patch_paths(monkeypatch, tmp_path, data)
    ids = {"cards": ["c1"], "relics": [], "enemies": []}
    assert gen.verify(ids) is False
    assert "MISSING cards: ['c2']" in capsys.readouterr().out


def test_verify_reports_extra_ids(tmp_path, monkeypatch, capsys) -> None:
    _patch_paths(monkeypatch, tmp_path, {"relics": [{"id": "r1"}]})
    ids = {"cards": [], "relics": ["r1", "r_extra"], "enemies": []}
    assert gen.verify(ids) is False
    assert "EXTRA relics: ['r_extra']" in capsys.readouterr().out


def test_main_returns_zero_on_full_match(tmp_path, monkeypatch, capsys) -> None:
    data = {
        "named_cards": [{"id": "c_sever", "el1": "ember", "relationType": "single"}],
        "enemies": {"basic": [{"id": "e1", "tier": "basic"}]},
    }
    out_dir = _patch_paths(monkeypatch, tmp_path, data)
    assert gen.main() == 0
    assert "All data.yaml ids have matching SVG files." in capsys.readouterr().out
    assert (out_dir / "cards" / "c_sever.svg").exists()
    assert (out_dir / "enemies" / "e1.svg").exists()


def test_main_returns_one_when_verify_fails(tmp_path, monkeypatch, capsys) -> None:
    data = {"named_cards": [{"id": "c1", "el1": "ash"}]}
    _patch_paths(monkeypatch, tmp_path, data)
    monkeypatch.setattr(
        gen, "generate_all",
        lambda _data: (tmp_path, {"cards": [], "relics": [], "enemies": []}),
    )
    assert gen.main() == 1
    assert "MISSING cards: ['c1']" in capsys.readouterr().out
