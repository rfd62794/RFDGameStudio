"""test_slimeworld_tier_worker_income.py — Tier-scaled worker income tests.

Covers the SlimeBreeder display-room port (docs/analysis/slimebreeder-absorption.md
step-2 item 4): calculate_worker_income scales its base by the slime's snapped
tier (snapped color + snapped shape via calculate_tier_value / TIER_VALUE)
times data.yaml's WORKER_TIER_YIELD_RATE, floored at WORKER_BASE_INCOME so no
specimen earns below the legacy 5. The autofeeder (x2) and culture-match (x2)
multipliers still apply. Callers that pass no constants keep the legacy
flat-5 yield.

Snap anchors note: the shape anchors' Euclidean geometry means vertex_count=4
with irregularity=10 snaps to Pentagon (T3), not Square (T1) — the same snap
fulfill_petition already uses.
"""

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _constants():
    return _load().files.data["constants"]


def _state(**overrides):
    state = {
        "cycle": 1,
        "credits": 100,
        "contracts": [],
        "petitions": [],
        "slimes": [],
        "has_auto_feeder": False,
        "planet_region": {"nodes": []},
        "logs": [],
        "roster_cap": 10,
    }
    state.update(overrides)
    return state


def _slime(slime_id, role, color="Red", **fields):
    slime = {"id": slime_id, "locked_role": role, "color": color, "level": 1, "stats": {}}
    slime.update(fields)
    return slime


def _income(slime, has_auto_feeder=False, nodes=None, constants="default"):
    if constants == "default":
        constants = _constants()
    return _load().executor.call(
        "calculate_worker_income", slime, has_auto_feeder, nodes or [], constants
    )


def _advance(state, constants="default"):
    if constants == "default":
        constants = _constants()
    return _load().executor.call("advance_cycle", state, None, constants)


# --- data.yaml contract -----------------------------------------------------

def test_data_yaml_carries_worker_tier_yield_rate():
    """The new tuning number lives in data.yaml's constants block."""
    assert _constants()["WORKER_TIER_YIELD_RATE"] == 0.1


# --- calculate_worker_income: floor and tier scaling -------------------------

def test_low_tier_combinations_hold_the_floor():
    """Tier values below ~50 yield less than the floor — income stays at 5."""
    square = _slime("w", "worker", "Red", vertex_count=4, irregularity=5)
    assert _income(square) == 5              # T1+T1 -> tv 10 -> 1 -> floor 5
    purple_square = _slime("w2", "worker", "Purple", vertex_count=4, irregularity=5)
    assert _income(purple_square) == 5       # T2+T1 -> tv 27 -> 3 -> floor 5
    blue_star = _slime("w3", "worker", "Blue", vertex_count=5, irregularity=60)
    assert _income(blue_star) == 5           # T1+T2 -> tv 27 -> 3 -> floor 5


def test_tier3_shape_scales_above_floor():
    """Pentagon snap (vertex 5, irr 10, T3=95): Red -> tv 100 -> 10."""
    slime = _slime("w", "worker", "Red", vertex_count=5, irregularity=10)
    assert _income(slime) == 10
    purple = _slime("w2", "worker", "Purple", vertex_count=5, irregularity=10)
    assert _income(purple) == 12             # T2+T3 -> tv 117 -> 11.7 -> 12


def test_tier4_shape_scales_above_floor():
    """Crown snap (vertex 8, irr 85, T4=300): Red -> tv 305 -> 31."""
    slime = _slime("w", "worker", "Red", vertex_count=8, irregularity=85)
    assert _income(slime) == 31
    purple = _slime("w2", "worker", "Purple", vertex_count=8, irregularity=85)
    assert _income(purple) == 32             # T2+T4 -> tv 322 -> 32.2 -> 32


def test_default_shape_snap_is_pentagon_tier3():
    """The (4,10) default used when a slime lacks shape genetics snaps to
    Pentagon (anchor distance 1), not Square — income 10, not the floor."""
    slime = _slime("w", "worker", "Red")
    assert _income(slime) == 10


def test_hue_only_slime_snaps_to_faction_for_tier():
    """No color field -> snap_to_faction(hue). Hue 240 -> Purple (T2)."""
    slime = {"id": "w", "locked_role": "worker", "hue": 240,
             "vertex_count": 5, "irregularity": 10}
    assert _income(slime) == 12              # Purple T2 + Pentagon T3 -> 117 -> 12


def test_gray_slime_uses_color_tier():
    """Gray slimes carry hue ~0 which would snap to Red; color wins, both T1."""
    slime = _slime("w", "worker", "Gray", hue=0, saturation=0,
                   vertex_count=3, irregularity=5)
    assert _income(slime) == 5               # Gray T1 + Triangle T1 -> floor


# --- multipliers preserved ----------------------------------------------------

def test_auto_feeder_doubles_tier_scaled_income():
    slime = _slime("w", "worker", "Purple", vertex_count=5, irregularity=10)
    assert _income(slime, has_auto_feeder=True) == 24


def test_culture_match_doubles_tier_scaled_income():
    slime = _slime("w", "worker", "Purple", vertex_count=5, irregularity=10)
    nodes = [{"id": "n1", "owner_color": "Purple"}]
    assert _income(slime, nodes=nodes) == 24


def test_feeder_and_culture_stack_to_x4():
    slime = _slime("w", "worker", "Purple", vertex_count=5, irregularity=10)
    nodes = [{"id": "n1", "owner_color": "Purple"}]
    assert _income(slime, has_auto_feeder=True, nodes=nodes) == 48


def test_multipliers_apply_to_the_floor_too():
    """A floored T1 worker still gets the old x2/x4 outcomes (10/20)."""
    slime = _slime("w", "worker", "Red", vertex_count=4, irregularity=5)
    nodes = [{"id": "n1", "owner_color": "Red"}]
    assert _income(slime, has_auto_feeder=True, nodes=nodes) == 20


# --- legacy fallback ------------------------------------------------------------

def test_nil_constants_keeps_legacy_flat_five():
    """Callers that pass no constants get the pre-port flat 5."""
    slime = _slime("w", "worker", "Purple", vertex_count=8, irregularity=85)
    assert _income(slime, constants=None) == 5


def test_constants_without_rate_keeps_floor_five():
    """A constants table lacking WORKER_TIER_YIELD_RATE leaves income at 5."""
    slime = _slime("w", "worker", "Purple", vertex_count=8, irregularity=85)
    assert _income(slime, constants={"WORKER_BASE_INCOME": 5}) == 5


# --- advance_cycle integration ---------------------------------------------------

def test_advance_cycle_credits_tier_scaled_worker_income():
    """Purple worker + Pentagon snap + constants: credits rise by 12, not 5."""
    state = _state(slimes=[_slime("w", "worker", "Purple",
                                  vertex_count=5, irregularity=10)])
    result = _advance(state)
    assert result["credits"] == 112


def test_advance_cycle_high_tier_worker_outearns_low_tier():
    """Same roster, Crown-snapped worker earns 31 vs floored Square-snapped 5."""
    crown_state = _state(slimes=[_slime("w", "worker", "Red",
                                        vertex_count=8, irregularity=85)])
    square_state = _state(slimes=[_slime("w", "worker", "Red",
                                         vertex_count=4, irregularity=5)])
    assert _advance(crown_state)["credits"] == 131
    assert _advance(square_state)["credits"] == 105


def test_advance_cycle_without_constants_keeps_flat_five():
    """advance_cycle called with no constants arg preserves the old credit."""
    state = _state(slimes=[_slime("w", "worker", "Purple",
                                  vertex_count=8, irregularity=85)])
    result = _load().executor.call("advance_cycle", state)
    assert result["credits"] == 105
