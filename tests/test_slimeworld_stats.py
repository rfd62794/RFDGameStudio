"""test_slimeworld_stats.py — Real Color + Shape stat computation tests.

Tests get_interpolated_specs, get_shape_stat_modifiers, calculate_stats,
and their wiring into create_seed_slime and initiate_breeding.

Values ported exactly from intake/slimegarden/extracted/src/gameLogic.ts
COLOR_SPECS, getInterpolatedSpecs, getShapeStatModifiers, calculateStats.
"""

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _slime(slime_id, color, hue, saturation, vertex_count=4, irregularity=10):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": hue,
        "saturation": saturation, "generation": 0,
        "vertex_count": vertex_count, "irregularity": irregularity,
        "diffusion_ratio": 20, "amplitude": 40,
    }


def _state(slimes, roster_cap=10):
    return {"slimes": slimes, "roster_cap": roster_cap, "credits": 100}


# --- get_interpolated_specs ---

def test_get_interpolated_specs_pure_color_matches_color_specs():
    """hue=0 (pure Red), saturation=100 -> matches Red's real base_stats exactly."""
    session = _load()
    spec = session.executor.call("get_interpolated_specs", 0, 100)
    bs = spec["base_stats"]
    assert bs["hp"] == 120
    assert bs["atk"] == 18
    assert bs["def"] == 8
    assert bs["agi"] == 6
    assert bs["int"] == 5
    assert bs["chm"] == 6


def test_get_interpolated_specs_midpoint_blend():
    """hue=30 (halfway Red/Orange) -> real midpoint of both colors' stats."""
    session = _load()
    spec = session.executor.call("get_interpolated_specs", 30, 100)
    # Red hp=120, Orange hp=110, midpoint=115
    assert spec["base_stats"]["hp"] == 115
    # Red atk=18, Orange atk=22, midpoint=20
    assert spec["base_stats"]["atk"] == 20


def test_get_interpolated_specs_zero_saturation_is_gray():
    """saturation=0, any hue -> matches Gray's real base_stats regardless of hue."""
    session = _load()
    spec = session.executor.call("get_interpolated_specs", 42, 0)
    bs = spec["base_stats"]
    assert bs["hp"] == 110
    assert bs["atk"] == 14
    assert bs["def"] == 11
    assert bs["agi"] == 11
    assert bs["int"] == 14
    assert bs["chm"] == 11


# --- get_shape_stat_modifiers ---

def test_get_shape_stat_modifiers_simple_stable_boosts_hp_def():
    """Low vertex, low irregularity -> real, correctly-signed hp/def bonus, zero elsewhere."""
    session = _load()
    mod = session.executor.call("get_shape_stat_modifiers", 3, 10)
    assert mod["hp_bonus"] > 0
    assert mod["def_bonus"] > 0
    assert mod["atk_bonus"] == 0
    assert mod["agi_bonus"] == 0
    # Simple/stable: low_vertex_weight = (6-3)/3 = 1, low_irr_weight = (35-10)/35 = 25/35
    # simple_stable_weight = 1 * 25/35 = 0.714..., hp_bonus = 0.0714...
    assert abs(mod["hp_bonus"] - (1.0 * (25.0 / 35.0) * 0.10)) < 0.001


def test_get_shape_stat_modifiers_jagged_boosts_atk_agi():
    """High irregularity -> real atk/agi bonus."""
    session = _load()
    mod = session.executor.call("get_shape_stat_modifiers", 6, 50)
    # jagged_weight = (50-15)/35 = 1, atk_bonus = 0.10
    assert abs(mod["atk_bonus"] - 0.10) < 0.001
    assert abs(mod["agi_bonus"] - 0.10) < 0.001
    # vertex=6: low_vertex_weight = 0, high_vertex_weight = 0 -> no hp/def/int/chm bonus
    assert mod["hp_bonus"] == 0
    assert mod["def_bonus"] == 0


# --- calculate_stats ---

def test_calculate_stats_level_scaling():
    """Same color/shape, level 1 vs level 5 -> real growth-rate-driven difference."""
    session = _load()
    stats1 = session.executor.call("calculate_stats", "Red", 1, 0, 100, 3, 10)
    stats5 = session.executor.call("calculate_stats", "Red", 5, 0, 100, 3, 10)
    # Level 1: base_stats only (l=0). Level 5: base + growth*4
    # Red base hp=120, growth hp=15 -> level 5 hp = floor(120 + 15*4) = 180
    # But shape modifier applies: simple_stable_weight = 1 * 25/35, hp_bonus = ~0.0714
    # level 1: floor(120 * 1.0714) = floor(128.57) = 128
    # level 5: floor(180 * 1.0714) = floor(192.85) = 192
    assert stats5["hp"] > stats1["hp"]
    assert stats1["hp"] == 128
    assert stats5["hp"] == 192


# --- create_seed_slime integration ---

def test_create_seed_slime_stats_vary_by_color():
    """Two different-color seed slimes -> real, different stats (regression check)."""
    session = _load()
    red = session.executor.call("create_seed_slime", "Red", "Solid")
    blue = session.executor.call("create_seed_slime", "Blue", "Solid")
    assert red["stats"]["hp"] != blue["stats"]["hp"]
    # Red base hp=120, Blue base hp=90 — both at level 1 with different shape defaults
    assert red["stats"]["hp"] > blue["stats"]["hp"]


# --- initiate_breeding integration ---

def test_breed_slimes_produces_real_stats_field():
    """A real breed call — child has a genuine, non-empty stats field for the first time."""
    session = _load()
    state = _state([_slime("a", "Red", 0, 100), _slime("b", "Blue", 300, 100)])
    child, error = session.executor.call("initiate_breeding", state, "a", "b", 0, [], None, [], None)
    assert error is None
    assert child is not None
    assert "stats" in child
    assert child["stats"] is not None
    assert child["stats"]["hp"] > 0
    assert child["stats"]["atk"] > 0


def test_shape_genetics_actually_affects_bred_stats():
    """Two breeds producing different real shape genetics -> measurably different final stats."""
    session = _load()
    # Breed 1: both parents have low vertex_count (3), low irregularity (10) -> simple/stable
    state1 = _state([
        _slime("a1", "Red", 0, 100, vertex_count=3, irregularity=10),
        _slime("b1", "Red", 10, 100, vertex_count=3, irregularity=10),
    ])
    child1, error1 = session.executor.call("initiate_breeding", state1, "a1", "b1", 0, [], None, [], None)
    assert error1 is None

    # Breed 2: both parents have high vertex_count (12), high irregularity (50) -> jagged
    state2 = _state([
        _slime("a2", "Red", 0, 100, vertex_count=12, irregularity=50),
        _slime("b2", "Red", 10, 100, vertex_count=12, irregularity=50),
    ])
    child2, error2 = session.executor.call("initiate_breeding", state2, "a2", "b2", 0, [], None, [], None)
    assert error2 is None

    # Both children should be Red (same hue), but different shape genetics
    # Simple/stable boosts hp/def; jagged boosts atk/agi
    assert child1["stats"]["hp"] != child2["stats"]["hp"]
    # Simple/stable child should have higher hp than jagged child
    assert child1["stats"]["hp"] > child2["stats"]["hp"]
    # Jagged child should have higher atk than simple/stable child
    assert child2["stats"]["atk"] > child1["stats"]["atk"]


# --- Pattern switch NOT ported ---

def test_pattern_switch_not_ported():
    """Confirm no Pattern-name-based bonus logic exists anywhere in the new code."""
    import re
    from pathlib import Path
    logic_path = Path(__file__).parent.parent / "games" / "slimeworld" / "logic.lua"
    source = logic_path.read_text()
    # Check that the retired pattern names are not referenced in any stat-bonus context
    # (they may appear in pattern-related breed functions, but not in calculate_stats)
    # Find the calculate_stats function body
    match = re.search(r'function calculate_stats\(.*?\nend', source, re.DOTALL)
    assert match is not None, "calculate_stats function not found"
    calc_body = match.group(0)
    for pattern_name in ["Stripe", "Polka", "Glow", "Crown", "Ringed", "Nebula", "Obsidian"]:
        assert pattern_name not in calc_body, f"Pattern '{pattern_name}' found in calculate_stats — should not be ported"
