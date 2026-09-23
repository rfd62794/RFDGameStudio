"""test_slimeworld_color_codex.py — Color Codex target detection tests.

Tests match_color_target (hue/saturation zone detection) and its wiring
into initiate_breeding via child.matched_target_id.
"""

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _color_targets():
    session = _load()
    return session.files.data["color_targets"]


def _color_specs():
    session = _load()
    data = session.files.data
    specs = {}
    for key, culture in data["cultures"].items():
        specs[culture["color"]] = {
            "base_stats": culture["base_stats"],
            "growth": culture["growth"],
        }
    gray = data["neutral_traits"]["gray"]
    specs["Gray"] = {
        "base_stats": gray["base_stats"],
        "growth": gray["growth"],
    }
    return specs


def _slime(slime_id, color, hue, saturation):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": hue,
        "saturation": saturation, "generation": 0, "vertex_count": 4,
        "irregularity": 10, "diffusion_ratio": 20, "amplitude": 40,
    }


def _state(slimes, roster_cap=10):
    return {"slimes": slimes, "roster_cap": roster_cap, "credits": 100}


# --- match_color_target unit tests ---

def test_match_color_target_guild_exact_center():
    """Hue exactly at a Guild's center, valid saturation -> correct id."""
    targets = _color_targets()
    session = _load()
    result = session.executor.call("match_color_target", 30, 80, targets)
    assert result == "guild_ember_marsh"


def test_match_color_target_guild_within_tolerance():
    """Hue offset but within the 15-degree tolerance -> still matches."""
    targets = _color_targets()
    session = _load()
    result = session.executor.call("match_color_target", 44, 70, targets)
    assert result == "guild_ember_marsh"


def test_match_color_target_guild_outside_tolerance():
    """Hue just past tolerance -> no match."""
    targets = _color_targets()
    session = _load()
    result = session.executor.call("match_color_target", 46, 70, targets)
    assert result is None


def test_match_color_target_rival_dual_center_hues():
    """Hue matching either of a Rival's two center hues -> correct id."""
    targets = _color_targets()
    session = _load()
    result_a = session.executor.call("match_color_target", 90, 50, targets)
    assert result_a == "rival_ember_tundra"
    result_b = session.executor.call("match_color_target", 270, 50, targets)
    assert result_b == "rival_ember_tundra"


def test_match_color_target_wrong_saturation_band():
    """Correct hue for a Guild zone, but saturation in Rival band and hue outside all Rival zones -> no match."""
    targets = _color_targets()
    session = _load()
    # hue=45 is in guild_ember_marsh (dist to center 30 = 15, within tolerance)
    # but NOT in any Rival zone (rival_gale_tide center 30, dist=15 > tolerance 10)
    # sat=50 falls in Rival band [35,65) but no Rival center matches
    result = session.executor.call("match_color_target", 45, 50, targets)
    assert result is None


def test_match_color_target_no_targets_no_match():
    """Empty/nil color_targets -> nil, no error."""
    session = _load()
    assert session.executor.call("match_color_target", 30, 80, []) is None
    assert session.executor.call("match_color_target", 30, 80, None) is None


# --- initiate_breeding integration tests ---

def test_initiate_breeding_sets_matched_target_id():
    """Real breed scenario with active target regent -> child.matched_target_id is set."""
    targets = _color_targets()
    session = _load()
    # Red (hue=0) x Orange (hue=60) -> midpoint hue=30, saturation ~100
    # With guild_ember_marsh target (center=30, sat 65-100), should match
    state = _state([_slime("a", "Red", 0, 100), _slime("b", "Orange", 60, 100)])
    child, error = session.executor.call(
        "initiate_breeding", state, "a", "b", 0, targets, "guild_ember_marsh", [], None, _color_specs()
    )
    assert error is None
    assert child is not None
    assert child["matched_target_id"] == "guild_ember_marsh"


def test_initiate_breeding_no_active_target_still_detects():
    """Breeding without active_target_regent still populates matched_target_id."""
    targets = _color_targets()
    session = _load()
    # Red (hue=0) x Orange (hue=60) -> midpoint hue=30, saturation ~100
    # No active target, but child still lands in guild_ember_marsh zone
    state = _state([_slime("a", "Red", 0, 100), _slime("b", "Orange", 60, 100)])
    child, error = session.executor.call(
        "initiate_breeding", state, "a", "b", 0, targets, None, [], None, _color_specs()
    )
    assert error is None
    assert child is not None
    assert child["matched_target_id"] == "guild_ember_marsh"


def test_initiate_breeding_no_match_sets_nil():
    """A child landing outside all 9 zones -> matched_target_id is nil."""
    targets = _color_targets()
    session = _load()
    # Red (hue=0) x Blue (hue=300) -> midpoint hue=330, saturation ~100
    # hue=330 is center of guild_tide_ember (tolerance 15, sat 65-100)
    # So this actually matches. Let's use hues that won't match:
    # Red (hue=0) x Red (hue=0) -> hue=0, sat=100
    # hue=0: guild_ember_marsh center=30, dist=30 > 15; guild_tide_ember center=330, dist=30 > 15
    # No guild match. Rivals need sat 35-65, we have 100. No match.
    state = _state([_slime("a", "Red", 0, 100), _slime("b", "Red", 10, 100)])
    child, error = session.executor.call(
        "initiate_breeding", state, "a", "b", 0, targets, None, [], None, _color_specs()
    )
    assert error is None
    assert child is not None
    assert child.get("matched_target_id") is None
