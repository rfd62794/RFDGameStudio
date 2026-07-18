"""test_slimeworld_shape_codex.py — Shape Codex target detection tests.

Tests match_shape_target (vertex_count/irregularity zone detection) and
its wiring into initiate_breeding via child.matched_shape_target_id.
"""

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _shape_targets():
    session = _load()
    return session.files.data["shape_targets"]


def _slime(slime_id, color, hue, saturation, vertex_count, irregularity):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": hue,
        "saturation": saturation, "generation": 0, "vertex_count": vertex_count,
        "irregularity": irregularity, "diffusion_ratio": 20, "amplitude": 40,
    }


def _state(slimes, roster_cap=10):
    return {"slimes": slimes, "roster_cap": roster_cap, "credits": 100}


# --- match_shape_target unit tests ---

def test_match_shape_target_exact_vertex_count():
    """Each of the 6 new shapes at their exact vertex_count, low irregularity -> correct id."""
    targets = _shape_targets()
    session = _load()
    cases = [
        (10, 5, "shape_decagon"),
        (12, 5, "shape_dodecagon"),
        (15, 5, "shape_pentadecagon"),
        (16, 5, "shape_hexadecagon"),
        (17, 5, "shape_heptadecagon"),
        (20, 5, "shape_icosagon"),
    ]
    for vc, irr, expected_id in cases:
        result = session.executor.call("match_shape_target", vc, irr, targets)
        assert result == expected_id, f"vc={vc}, irr={irr}: expected {expected_id}, got {result}"


def test_match_shape_target_within_tolerance():
    """vertex_count offset by 0.4 (within 0.5 tolerance) -> still matches."""
    targets = _shape_targets()
    session = _load()
    # Decagon (vc=10, tol=0.5): 10.4 is within [9.5, 10.5]
    result = session.executor.call("match_shape_target", 10.4, 5, targets)
    assert result == "shape_decagon"


def test_match_shape_target_outside_tolerance():
    """vertex_count offset by 0.6 -> no match."""
    targets = _shape_targets()
    session = _load()
    # Decagon (vc=10, tol=0.5): 10.6 is outside [9.5, 10.5]
    result = session.executor.call("match_shape_target", 10.6, 5, targets)
    assert result is None


def test_match_shape_target_adjacent_shapes_no_overlap():
    """Consecutive entries (14/15/16/17/18) — a value at the midpoint matches at most one, never both."""
    targets = _shape_targets()
    session = _load()

    # 15.5: Pentadecagon (tol=0.49) range ~[14.51, 15.49], Hexadecagon (tol=0.49) range ~[15.51, 16.49]
    # 15.5 is in NEITHER range — no match for either clean entry
    result_15_5 = session.executor.call("match_shape_target", 15.5, 5, targets)
    assert result_15_5 is None, f"15.5 should match neither, got {result_15_5}"

    # 16.5: Hexadecagon (tol=0.49) range ~[15.51, 16.49], Heptadecagon (tol=0.49) range ~[16.51, 17.49]
    # 16.5 is in NEITHER range
    result_16_5 = session.executor.call("match_shape_target", 16.5, 5, targets)
    assert result_16_5 is None, f"16.5 should match neither, got {result_16_5}"

    # 15.3 matches Pentadecagon only (|15.3-15|=0.3 <= 0.49, |15.3-16|=0.7 > 0.49)
    result_15_3 = session.executor.call("match_shape_target", 15.3, 5, targets)
    assert result_15_3 == "shape_pentadecagon"

    # 15.7 matches Hexadecagon only (|15.7-15|=0.7 > 0.49, |15.7-16|=0.3 <= 0.49)
    result_15_7 = session.executor.call("match_shape_target", 15.7, 5, targets)
    assert result_15_7 == "shape_hexadecagon"

    # 16.3 matches Hexadecagon only (|16.3-16|=0.3 <= 0.49, |16.3-17|=0.7 > 0.49)
    result_16_3 = session.executor.call("match_shape_target", 16.3, 5, targets)
    assert result_16_3 == "shape_hexadecagon"

    # 16.7 matches Heptadecagon only (|16.7-16|=0.7 > 0.49, |16.7-17|=0.3 <= 0.49)
    result_16_7 = session.executor.call("match_shape_target", 16.7, 5, targets)
    assert result_16_7 == "shape_heptadecagon"


def test_match_shape_target_wrong_irregularity():
    """Correct vertex_count, irregularity outside the clean band -> no match."""
    targets = _shape_targets()
    session = _load()
    # Decagon (vc=10, irr 0-15): irr=50 is outside the clean band
    result = session.executor.call("match_shape_target", 10, 50, targets)
    assert result is None


def test_match_shape_target_star_polygon_entries_unaffected():
    """Existing Tier 5/6 star-polygon entries still match correctly with the new function."""
    targets = _shape_targets()
    session = _load()
    # Star (vc=7, step=2, irr 40-70)
    result_star = session.executor.call("match_shape_target", 7, 55, targets)
    assert result_star == "shape_star"
    # Spiked (vc=7, step=3, irr 70-100)
    result_spiked = session.executor.call("match_shape_target", 7, 85, targets)
    assert result_spiked == "shape_spiked"
    # Void-Form (vc=11, step=2, irr 40-70)
    result_void = session.executor.call("match_shape_target", 11, 55, targets)
    assert result_void == "shape_void_form"
    # Prismatic (vc=22, step=9, irr 70-100)
    result_prismatic = session.executor.call("match_shape_target", 22, 85, targets)
    assert result_prismatic == "shape_prismatic"


# --- initiate_breeding integration tests ---

def test_initiate_breeding_sets_matched_shape_target_id():
    """Real breed scenario — child.matched_shape_target_id is set after breeding."""
    targets = _shape_targets()
    session = _load()
    # Two slimes with vertex_count 10 and 10 -> offspring_vertex = 10, irregularity ~10
    # Should match shape_decagon (vc=10, tol=0.5, irr 0-15)
    state = _state([
        _slime("a", "Red", 0, 100, 10, 10),
        _slime("b", "Blue", 240, 100, 10, 10),
    ])
    child, error = session.executor.call(
        "initiate_breeding", state, "a", "b", 0, [], None, targets, None
    )
    assert error is None
    assert child is not None
    assert child["matched_shape_target_id"] == "shape_decagon"


def test_initiate_breeding_no_shape_match_sets_nil():
    """A child landing outside all shape zones -> matched_shape_target_id is nil."""
    targets = _shape_targets()
    session = _load()
    # vertex_count 13 is not near any target (12 is closest, |13-12|=1 > 0.5)
    # irregularity 10 is in the clean band, but no target has vc near 13
    state = _state([
        _slime("a", "Red", 0, 100, 12, 10),
        _slime("b", "Blue", 240, 100, 14, 10),
    ])
    child, error = session.executor.call(
        "initiate_breeding", state, "a", "b", 0, [], None, targets, None
    )
    assert error is None
    assert child is not None
    # offspring_vertex = (12+14)/2 = 13.0, which is not within 0.5 of any target
    # 12: |13-12|=1 > 0.5; 14: |13-14|=1 > 0.5 (but 14 entries need irr >= 40)
    assert child.get("matched_shape_target_id") is None
