from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def test_snap_to_shape_name_known_anchors():
    session = _load()
    anchors = [
        ("Triangle", 3, 5), ("Square", 4, 5), ("Circle", 12, 0),
        ("Star", 5, 60), ("Diamond", 4, 40), ("Teardrop", 6, 50),
        ("Pentagon", 5, 10), ("Crescent", 7, 70), ("Hexa", 6, 15),
        ("Crown", 8, 85),
    ]
    for name, vertex_count, irregularity in anchors:
        assert session.executor.call("snap_to_shape_name", vertex_count, irregularity) == name


def test_snap_to_shape_name_between_anchors():
    assert _load().executor.call("snap_to_shape_name", 5, 55) == "Star"


def test_snap_to_shape_name_does_not_affect_breed_shape_math():
    parent_a = {"vertex_count": 3, "irregularity": 0}
    parent_b = {"vertex_count": 22, "irregularity": 100}
    shape = _load().executor.call("breed_shape", parent_a, parent_b, [], None)
    assert shape == {"vertex_count": 12.5, "irregularity": 100}
