import pytest

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


@pytest.mark.parametrize(
    "color,tier",
    [("Red", 1), ("Yellow", 1), ("Blue", 1), ("Orange", 2), ("Green", 2), ("Purple", 2), ("Gray", 1)],
)
def test_get_color_tier_known_colors(color, tier):
    assert _load().executor.call("get_color_tier", color) == tier


@pytest.mark.parametrize(
    "shape,tier",
    [("Triangle", 1), ("Square", 1), ("Circle", 1), ("Star", 2), ("Diamond", 2), ("Teardrop", 2), ("Pentagon", 3), ("Crescent", 3), ("Hexa", 3), ("Crown", 4)],
)
def test_get_shape_tier_known_shapes(shape, tier):
    assert _load().executor.call("get_shape_tier", shape) == tier


@pytest.mark.parametrize(
    "color,shape,expected",
    [("Red", "Triangle", 10), ("Orange", "Star", 44), ("Purple", "Crown", 322)],
)
def test_calculate_tier_value_matches_ts_formula(color, shape, expected):
    assert _load().executor.call("calculate_tier_value", color, shape) == expected


def test_calculate_tier_value_applies_variance():
    assert _load().executor.call("calculate_tier_value", "Orange", "Crown", 0.25) == 403
