from studio.executor import _to_python
from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _slime(slime_id, color, vertex_count, generation=0):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "hue": 0,
        "saturation": 100, "generation": generation, "vertex_count": vertex_count,
        "irregularity": 10, "diffusion_ratio": 20, "amplitude": 40,
    }


def _state(slimes, roster_cap=3, credits=100):
    return {"slimes": slimes, "roster_cap": roster_cap, "credits": credits}


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


# Compounding breeding tax by generation: the generation formula itself must be
# correct before the cost logic means anything.
def test_generation_computed_as_max_parent_plus_one():
    child, error, state = _initiate_with_lua_state(
        _state([_slime("a", "Red", 3, generation=7), _slime("b", "Blue", 5, generation=4)], credits=10000),
        "a", "b"
    )
    assert error is None
    assert child["generation"] == 8
    # Second check: equal parents
    child, error, state = _initiate_with_lua_state(
        _state([_slime("a", "Red", 3, generation=3), _slime("b", "Blue", 5, generation=3)], credits=10000),
        "a", "b"
    )
    assert error is None
    assert child["generation"] == 4


# Generations 1 and 2 are free; this covers the first-breed onboarding moment
# across all starting colors and any pair of generation-1 slimes.
def test_generation_two_breed_remains_free():
    for color in ("Red", "Yellow", "Blue"):
        child, error, state = _initiate_with_lua_state(
            _state([_slime("a", color, 3, generation=1), _slime("b", color, 5, generation=1)], credits=0),
            "a", "b"
        )
        assert error is None, f"breed failed for {color}: {error}"
        assert child["generation"] == 2
        assert state["credits"] == 0


# Generation 3 is the first taxed depth and should cost exactly the base_cost.
def test_generation_three_breed_costs_base_rate():
    child, error, state = _initiate_with_lua_state(
        _state([_slime("a", "Red", 3, generation=2), _slime("b", "Blue", 5, generation=1)], credits=15),
        "a", "b"
    )
    assert error is None
    assert child["generation"] == 3
    assert state["credits"] == 0


# Cost must grow strictly with generation according to 10 * 1.5^(gen-2).
def test_breed_cost_compounds_with_generation():
    session = _load()
    lua = session.executor._lua.globals()
    expected = {
        3: 15,
        4: 23,
        5: 34,
        6: 51,
    }
    for gen, cost in expected.items():
        actual = lua["calculate_breeding_cost"](gen)
        assert actual == cost, f"calculate_breeding_cost({gen}) = {actual}, expected {cost}"

    # Integration: breeding at each generation depth deducts the right amount.
    for gen, cost in expected.items():
        child, error, state = _initiate_with_lua_state(
            _state([_slime("a", "Red", 3, generation=gen - 1), _slime("b", "Blue", 5, generation=1)], credits=cost),
            "a", "b"
        )
        assert error is None, f"gen {gen} breed failed: {error}"
        assert child["generation"] == gen
        assert state["credits"] == 0


# Insufficient credits must fail cleanly, leaving slime roster and credits untouched.
def test_breed_fails_on_insufficient_credits_at_any_generation():
    child, error, state = _initiate_with_lua_state(
        _state([_slime("a", "Red", 3, generation=2), _slime("b", "Blue", 5, generation=1)], credits=5),
        "a", "b"
    )
    assert child is None
    assert error is not None
    assert "Insufficient credits" in error
    assert "generation 3" in error
    assert state["credits"] == 5
    assert [slime["id"] for slime in state["slimes"]] == ["a", "b"]


# Seed slimes must start at generation 1 so they don't inherit elevated cost.
def test_seed_purchased_slime_generation_one():
    session = _load()
    cs = _color_specs()
    raw = session.executor._lua.globals()["create_seed_slime"]("Red", "Solid", cs)
    slime = _to_python(raw)
    assert slime["generation"] == 1
