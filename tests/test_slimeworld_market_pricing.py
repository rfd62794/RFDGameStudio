"""test_slimeworld_market_pricing.py — Tier-scaled market sale pricing.

SlimeBreeder absorption step 2.3 (docs/analysis/slimebreeder-absorption.md,
directive SlimeWorld_Port3_Tier_Market_Value_Directive.md).

Spec under test — all implemented in games/slimeworld/economy.lua:

    price = floor( calculate_tier_value(color, snapped_shape, variance)
                   * (1 + (level - 1) * level_value_step)
                   * max(flood_multiplier_floor, 1 - recent_sales * flood_decay_per_sale) )

where `variance` is the slime's explicit `variance` field when present,
otherwise a deterministic value seeded from the slime id
(SlimeBreeder's +/-0.10 roll, made reproducible). Tuning numbers live in
games/slimeworld/data.yaml under `market:`.

This file carries an independent Python reference implementation of the
formula; assertions compare Lua output against it rather than re-deriving
the expected value from the Lua helpers themselves.
"""

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import yaml

from studio.runtime import load_game

GAME_DIR = Path(__file__).parent.parent / "games" / "slimeworld"

# --- Independent reference implementation (mirror of the spec, not the code) ---

TIER_VALUE = {1: 5, 2: 22, 3: 95, 4: 300}
COLOR_TIERS = {"Red": 1, "Yellow": 1, "Blue": 1, "Orange": 2, "Green": 2, "Purple": 2, "Gray": 1}
SHAPE_TIERS = {
    "Triangle": 1, "Square": 1, "Circle": 1, "Star": 2, "Diamond": 2,
    "Teardrop": 2, "Pentagon": 3, "Crescent": 3, "Hexa": 3, "Crown": 4,
}
SHAPE_ANCHORS = [
    ("Triangle", 3, 5), ("Square", 4, 5), ("Circle", 12, 0), ("Star", 5, 60),
    ("Diamond", 4, 40), ("Teardrop", 6, 50), ("Pentagon", 5, 10),
    ("Crescent", 7, 70), ("Hexa", 6, 15), ("Crown", 8, 85),
]
MARKET_DEFAULTS = {
    "level_value_step": 0.125,
    "value_variance_range": 0.10,
    "flood_decay_per_sale": 0.12,
    "flood_multiplier_floor": 0.3,
    "flood_window_cycles": 5,
}


def _hash_seed(text):
    h = 0
    for ch in text:
        h = (h * 31 + ord(ch)) % 4294967296
    return h


def _snap_shape(vertex_count, irregularity):
    best, best_d = "Triangle", math.inf
    for name, anchor_v, anchor_i in SHAPE_ANCHORS:
        d = (vertex_count - anchor_v) ** 2 + (irregularity - anchor_i) ** 2
        if d < best_d:
            best, best_d = name, d
    return best


def _ref_variance(slime_id, variance_range):
    return ((_hash_seed(slime_id) % 21) - 10) * (variance_range / 10)


def _ref_price(slime, recent_sales, market=None):
    m = dict(MARKET_DEFAULTS)
    for key, value in (market or {}).items():
        if value is not None:
            m[key] = value
    shape = _snap_shape(slime.get("vertex_count", 4), slime.get("irregularity", 10))
    variance = slime.get("variance")
    if variance is None:
        variance = _ref_variance(slime.get("id", ""), m["value_variance_range"])
    tier_value = max(1, math.floor(
        (TIER_VALUE[COLOR_TIERS.get(slime.get("color", "Gray"), 1)]
         + TIER_VALUE[SHAPE_TIERS.get(shape, 1)]) * (1 + variance) + 0.5
    ))
    level_scale = 1 + (slime.get("level", 1) - 1) * m["level_value_step"]
    flood = max(m["flood_multiplier_floor"], 1 - recent_sales * m["flood_decay_per_sale"])
    return math.floor(tier_value * level_scale * flood)


def _load():
    return load_game("slimeworld", seed=42)


def _slime(**overrides):
    slime = {
        "id": "slime_mkt_a",
        "color": "Red",
        "level": 1,
        "vertex_count": 3,
        "irregularity": 5,
    }
    slime.update(overrides)
    return slime


def _state(**overrides):
    state = {
        "cycle": 1,
        "credits": 100,
        "slimes": [],
        "recent_market_sales": [],
    }
    state.update(overrides)
    return state


# --- data.yaml: tuning numbers live in the data layer ---

def test_market_tuning_block_exists_in_data_yaml():
    data = yaml.safe_load((GAME_DIR / "data.yaml").read_text(encoding="utf-8"))
    market = data.get("market")
    assert market is not None, "data.yaml must carry a market: tuning block"
    for key in MARKET_DEFAULTS:
        assert key in market, f"market.{key} missing from data.yaml"
        assert market[key] == MARKET_DEFAULTS[key]


def test_slime_schema_allows_optional_variance_field():
    data = yaml.safe_load((GAME_DIR / "data.yaml").read_text(encoding="utf-8"))
    assert "variance" in data["slime"]["fields"]


# --- seeded variance ---

def test_seeded_variance_matches_reference_implementation():
    session = _load()
    for slime_id in ["slime_mkt_a", "slime_b", "abc", "slime_1727_42", "z" * 40, ""]:
        expected = _ref_variance(slime_id, MARKET_DEFAULTS["value_variance_range"])
        actual = session.executor.call("slime_value_variance", slime_id)
        assert actual == pytest.approx(expected)


def test_seeded_variance_is_bounded_and_varied():
    session = _load()
    values = {
        session.executor.call("slime_value_variance", f"slime_{i}")
        for i in range(80)
    }
    assert min(values) < 0 < max(values)
    assert all(-0.10 - 1e-9 <= v <= 0.10 + 1e-9 for v in values)
    assert len(values) > 10


def test_seeded_variance_respects_range_override():
    session = _load()
    for slime_id in ["slime_mkt_a", "another_id"]:
        actual = session.executor.call("slime_value_variance", slime_id, 0.25)
        assert actual == pytest.approx(_ref_variance(slime_id, 0.25))


# --- calculate_market_price ---

@pytest.mark.parametrize(
    "slime,sales",
    [
        ({"id": "slime_mkt_a", "color": "Red", "level": 1, "vertex_count": 3, "irregularity": 5}, 0),
        ({"id": "slime_mkt_a", "color": "Red", "level": 1, "vertex_count": 3, "irregularity": 5}, 4),
        ({"id": "slime_mkt_b", "color": "Purple", "level": 7, "vertex_count": 8, "irregularity": 85}, 0),
        ({"id": "slime_mkt_c", "color": "Green", "level": 3, "vertex_count": 5, "irregularity": 60}, 2),
        ({"id": "slime_mkt_d", "color": "Gray", "level": 12, "vertex_count": 4, "irregularity": 10}, 6),
        ({"id": "slime_mkt_e", "color": "Blue", "level": 1}, 0),
    ],
)
def test_calculate_market_price_matches_reference(slime, sales):
    session = _load()
    actual = session.executor.call("calculate_market_price", slime, sales)
    assert actual == _ref_price(slime, sales)


def test_price_scales_with_tier():
    session = _load()
    low = session.executor.call("calculate_market_price", _slime(), 0)
    high = session.executor.call(
        "calculate_market_price",
        _slime(color="Purple", vertex_count=8, irregularity=85),  # Crown shape
        0,
    )
    assert high > low * 10


def test_price_scales_with_level():
    session = _load()
    level_1 = session.executor.call("calculate_market_price", _slime(), 0)
    level_5 = session.executor.call("calculate_market_price", _slime(level=5), 0)
    assert abs(level_5 - level_1 * 1.5) <= 1


def test_flood_multiplier_decays_and_floors():
    session = _load()
    slime = _slime()
    no_sales = session.executor.call("calculate_market_price", slime, 0)
    five_sales = session.executor.call("calculate_market_price", slime, 5)
    fifty_sales = session.executor.call("calculate_market_price", slime, 50)
    assert five_sales == _ref_price(slime, 5)
    assert fifty_sales == _ref_price(slime, 50)
    assert five_sales < no_sales
    assert fifty_sales <= math.ceil(no_sales * 0.3) + 1


def test_explicit_variance_field_overrides_seed():
    session = _load()
    # Red/Triangle => (5 + 5) * (1 + 0.10) = 11 ; * (1 - 0.10) = 9
    assert session.executor.call("calculate_market_price", _slime(variance=0.10), 0) == 11
    assert session.executor.call("calculate_market_price", _slime(variance=-0.10), 0) == 9


def test_market_config_overrides():
    session = _load()
    slime = _slime()
    assert session.executor.call(
        "calculate_market_price", slime, 9, {"flood_decay_per_sale": 0}
    ) == session.executor.call("calculate_market_price", slime, 0)
    assert session.executor.call(
        "calculate_market_price", _slime(level=9), 0, {"level_value_step": 0}
    ) == session.executor.call("calculate_market_price", slime, 0)


def test_price_is_deterministic_across_calls():
    session = _load()
    slime = _slime(color="Orange", vertex_count=6, irregularity=50, level=4)
    first = session.executor.call("calculate_market_price", slime, 3)
    second = session.executor.call("calculate_market_price", slime, 3)
    assert first == second


# --- sell_on_market ---

def test_sell_on_market_credits_tier_price():
    session = _load()
    slime = _slime()
    state = _state(slimes=[slime], credits=100)
    credited, err = session.executor.call("sell_on_market", state, slime["id"])
    assert err is None
    assert credited == _ref_price(slime, 0)


def test_sell_on_market_uses_recent_sales_from_state():
    session = _load()
    slime = _slime()
    state = _state(
        slimes=[slime],
        cycle=5,
        recent_market_sales=[
            {"color": "Red", "cycle": 5},
            {"color": "Red", "cycle": 4},
            {"color": "Blue", "cycle": 5},
            {"color": "Red", "cycle": 0},  # outside the 5-cycle window (min is 1)
        ],
    )
    credited, err = session.executor.call("sell_on_market", state, slime["id"])
    assert err is None
    # Two in-window Red sales depress the price; the Blue sale and the
    # stale Red sale must not count.
    assert credited == _ref_price(slime, 2)


def test_sell_on_market_accepts_market_config():
    session = _load()
    slime = _slime()
    state = _state(
        slimes=[slime],
        cycle=5,
        recent_market_sales=[{"color": "Red", "cycle": 5}],
    )
    credited, err = session.executor.call(
        "sell_on_market", state, slime["id"], {"flood_decay_per_sale": 0.5}
    )
    assert err is None
    assert credited == _ref_price(slime, 1, {"flood_decay_per_sale": 0.5})


def test_sell_on_market_missing_slime_errors():
    session = _load()
    state = _state(slimes=[])
    credited, err = session.executor.call("sell_on_market", state, "nope")
    assert credited is None
    assert err == "Slime not found"
