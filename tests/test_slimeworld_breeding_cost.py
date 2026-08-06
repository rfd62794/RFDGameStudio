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


BREEDING_COST = 10


def _state(slimes, roster_cap=3, credits=100, has_received_first_breed_reward=False, last_seed_purchase_cycle=None):
    state = {"slimes": slimes, "roster_cap": roster_cap, "credits": credits}
    if has_received_first_breed_reward:
        state["has_received_first_breed_reward"] = True
    if last_seed_purchase_cycle is not None:
        state["last_seed_purchase_cycle"] = last_seed_purchase_cycle
    return state


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
    assert [slime["id"] for slime in state["slimes"]] == ["host", child["id"]]


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


def test_first_breed_remains_free():
    # Breed #1 must be free even with zero credits — the onboarding Target
    # Regent moment must stay frictionless.
    child, error, state = _initiate_with_lua_state(
        _state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)], credits=0),
        "host", "donor"
    )
    assert error is None
    assert child is not None
    assert state["credits"] == 0


def test_second_breed_deducts_flat_cost():
    child, error, state = _initiate_with_lua_state(
        _state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)],
               credits=100, has_received_first_breed_reward=True),
        "host", "donor"
    )
    assert error is None
    assert child is not None
    assert state["credits"] == 100 - BREEDING_COST


def test_breed_fails_on_insufficient_credits():
    child, error, state = _initiate_with_lua_state(
        _state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)],
               credits=5, has_received_first_breed_reward=True),
        "host", "donor"
    )
    assert child is None
    assert error is not None
    assert "Insufficient credits" in error
    assert state["credits"] == 5
    assert [slime["id"] for slime in state["slimes"]] == ["host", "donor"]


def test_breed_cost_does_not_scale_with_breed_count():
    # Flat cost across multiple subsequent breeds — explicit guard against an
    # accidental scaling curve until real balance data exists.
    state = _state([
        _slime("a", "Red", 3),
        _slime("b", "Blue", 5),
        _slime("c", "Yellow", 6),
        _slime("d", "Purple", 4),
        _slime("e", "Orange", 3),
    ], roster_cap=10, credits=100, has_received_first_breed_reward=True)

    state_after_1, error, state = _initiate_with_lua_state(state, "a", "b")
    assert error is None
    assert state["credits"] == 100 - BREEDING_COST

    state_after_2, error, state = _initiate_with_lua_state(state, "c", "d")
    assert error is None
    assert state["credits"] == 100 - 2 * BREEDING_COST

    # Third breed: still flat.
    child3_id = state_after_2["id"]
    _, error, state = _initiate_with_lua_state(state, "a", child3_id)
    assert error is None
    assert state["credits"] == 100 - 3 * BREEDING_COST


def test_breed_cost_independent_of_seed_purchase_cooldown():
    # Breeding cost must not read or mutate the seed-purchase cooldown field.
    child, error, state = _initiate_with_lua_state(
        _state([_slime("host", "Red", 3), _slime("donor", "Blue", 5)],
               credits=100, has_received_first_breed_reward=True, last_seed_purchase_cycle=7),
        "host", "donor"
    )
    assert error is None
    assert child is not None
    assert state["credits"] == 100 - BREEDING_COST
    assert state.get("last_seed_purchase_cycle") == 7
