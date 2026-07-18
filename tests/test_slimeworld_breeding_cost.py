from studio.executor import _to_python
from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _slime(slime_id, color, vertex_count):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": 0,
        "saturation": 100, "generation": 0, "vertex_count": vertex_count,
        "irregularity": 10, "diffusion_ratio": 20, "amplitude": 40,
    }


def _state(slimes, roster_cap=3):
    return {"slimes": slimes, "roster_cap": roster_cap, "credits": 100}


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


def _initiate_with_lua_state(state, parent_a_id, parent_b_id):
    session = _load()
    cs = _color_specs()
    lua_state = session.executor._to_lua(state)
    child, error = session.executor._lua.globals()["initiate_breeding"](
        lua_state, parent_a_id, parent_b_id, 0, session.executor._to_lua([]), None, session.executor._to_lua([]), None, session.executor._to_lua(cs)
    )
    return _to_python(child), error, _to_python(lua_state)


def test_breeding_consumes_donor_parent():
    child, error, state = _initiate_with_lua_state(_state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)]), "host", "donor")
    assert error is None
    assert child["consumed_slime_id"] == "donor"
    assert [slime["id"] for slime in state["slimes"]] == ["host", "slime_offspring"]


def test_breeding_consumption_atomic_with_failure():
    child, error, state = _initiate_with_lua_state(_state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)]), "host", "host")
    assert child is None
    assert error == "Parents must differ"
    assert [slime["id"] for slime in state["slimes"]] == ["host", "donor"]

    child, error, state = _initiate_with_lua_state(_state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)], roster_cap=2), "host", "donor")
    assert child is None
    assert error == "Roster capacity reached"
    assert [slime["id"] for slime in state["slimes"]] == ["host", "donor"]


def test_breeding_result_communicates_consumed_slime():
    state = _state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)])
    child, error = _load().executor.call("initiate_breeding", state, "host", "donor", 0, [], None, [], None, _color_specs())
    assert error is None
    assert child["consumed_slime_id"] == "donor"
