from studio.executor import _to_python
from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _slime(slime_id, color, vertex_count=4, irregularity=10):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": 0,
        "saturation": 100, "generation": 0, "vertex_count": vertex_count,
        "irregularity": irregularity, "diffusion_ratio": 20, "amplitude": 40,
    }


def _state(slimes=None, petitions=None, cycle=1, credits=100):
    return {
        "slimes": slimes or [], "roster_cap": 10, "credits": credits,
        "cycle": cycle, "petitions": petitions or [],
        "contracts": [], "zones": [],
    }


def _advance(state):
    session = _load()
    lua_state = session.executor._to_lua(state)
    result = session.executor._lua.globals()["advance_cycle"](lua_state)
    return _to_python(result), _to_python(lua_state)


def test_advance_cycle_spawns_petition_under_cap():
    state = _state(slimes=[_slime("s1", "Red")], petitions=[], cycle=1)
    result, _ = _advance(state)
    assert result is not None
    petitions = result.get("petitions", [])
    assert len(petitions) >= 1, f"Expected at least 1 petition, got {len(petitions)}"
    p = petitions[0]
    assert p["source"] == "wanderer"
    assert "requested_color" in p
    assert "requested_shape" in p
    assert "expires_cycle" in p
    assert "reward" in p


def test_advance_cycle_does_not_spawn_over_cap():
    existing = []
    for i in range(3):
        existing.append({
            "id": f"petition_cap_{i}", "source": "wanderer",
            "requested_color": "Red", "requested_shape": None,
            "payout_multiplier": 3.0, "reward": 45,
            "expires_cycle": 100,
        })
    state = _state(slimes=[_slime("s1", "Red")], petitions=existing, cycle=1)
    result, _ = _advance(state)
    assert result is not None
    petitions = result.get("petitions", [])
    assert len(petitions) == 3, f"Expected 3 petitions (at cap), got {len(petitions)}"


def test_advance_cycle_still_expires_petitions():
    existing = [{
        "id": "petition_expiring", "source": "wanderer",
        "requested_color": "Red", "requested_shape": None,
        "payout_multiplier": 3.0, "reward": 45,
        "expires_cycle": 2,
    }]
    state = _state(slimes=[_slime("s1", "Red")], petitions=existing, cycle=2)
    result, _ = _advance(state)
    assert result is not None
    petitions = result.get("petitions", [])
    expired_still_present = any(p["id"] == "petition_expiring" for p in petitions)
    assert not expired_still_present, "Expired petition should have been removed"


def test_full_petition_lifecycle():
    state = _state(slimes=[_slime("s1", "Red")], petitions=[], cycle=1)

    result, _ = _advance(state)
    assert result is not None
    petitions = result.get("petitions", [])
    assert len(petitions) >= 1, "Petition should spawn after advance_cycle"
    petition = petitions[0]

    session = _load()
    lua_state = session.executor._to_lua(result)
    fulfill_result, error = session.executor._lua.globals()["fulfill_petition"](
        lua_state, petition["id"], "s1"
    )
    fulfill_result = _to_python(fulfill_result)
    lua_state_after = _to_python(lua_state)

    if fulfill_result is not None:
        assert "payout" in fulfill_result
        assert fulfill_result["fulfilled_slime_id"] == "s1"
        remaining = lua_state_after.get("petitions", [])
        assert not any(p["id"] == petition["id"] for p in remaining), \
            "Fulfilled petition should be removed from state"
        assert lua_state_after["credits"] > result["credits"], \
            "Credits should increase after fulfillment"
