from studio.executor import _to_python
from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _state(cycle=10, petitions=None, slimes=None, credits=100):
    return {"cycle": cycle, "petitions": petitions or [], "slimes": slimes or [], "credits": credits}


def _matching_slime():
    return {"id": "slime-1", "color": "Red", "vertex_count": 3, "irregularity": 5}


def test_create_wanderer_petition_real_values():
    session = _load()
    petition, error = session.executor.call("create_wanderer_petition", 10, [])
    assert error is None
    assert petition["source"] == "wanderer"
    assert petition["payout_multiplier"] == 3.0
    assert 15 <= petition["expires_cycle"] <= 18
    assert petition.get("requested_color") is not None or petition.get("requested_shape") is not None
    color_tier = session.executor.call("get_color_tier", petition["requested_color"]) if petition.get("requested_color") else 1.5
    shape_tier = session.executor.call("get_shape_tier", petition["requested_shape"]) if petition.get("requested_shape") else 1.5
    assert petition["reward"] == int(color_tier * shape_tier * 30)

    petition, error = session.executor.call("create_wanderer_petition", 10, [{}, {}, {}])
    assert petition is None
    assert error == "Wanderer petition capacity reached"


def _fulfill_with_lua_state(state):
    session = _load()
    lua_state = session.executor._to_lua(state)
    result, error = session.executor._lua.globals()["fulfill_petition"](lua_state, "petition-1", "slime-1")
    return _to_python(result), error, _to_python(lua_state)


def test_fulfill_petition_matches_and_pays_out():
    result, error, state = _fulfill_with_lua_state(_state(petitions=[{"id": "petition-1", "requested_color": "Red", "requested_shape": "Triangle", "payout_multiplier": 3.0, "reward": 30, "expires_cycle": 12}], slimes=[_matching_slime()]))
    assert error is None
    assert result == {"payout": 30, "fulfilled_slime_id": "slime-1"}
    assert state["credits"] == 130
    assert state["petitions"] in ([], {})


def test_fulfill_petition_rejects_non_match():
    state = _state(petitions=[{"id": "petition-1", "requested_color": "Blue", "requested_shape": "Triangle", "payout_multiplier": 3.0, "expires_cycle": 12}], slimes=[_matching_slime()])
    result, error = _load().executor.call("fulfill_petition", state, "petition-1", "slime-1")
    assert result is None
    assert error == "Slime does not match petition color"
    assert state["credits"] == 100
    assert len(state["petitions"]) == 1


def test_petition_expires_after_cycle_limit():
    state = _state(cycle=13, petitions=[{"id": "petition-1", "requested_color": "Red", "requested_shape": "Triangle", "payout_multiplier": 3.0, "expires_cycle": 12}], slimes=[_matching_slime()])
    result, error = _load().executor.call("fulfill_petition", state, "petition-1", "slime-1")
    assert result is None
    assert error == "Petition expired"


def test_wanderer_petition_can_require_color_only():
    session = _load()
    petitions = [session.executor.call("create_wanderer_petition", 10, [])[0] for _ in range(200)]
    assert any(petition.get("requested_color") is not None and petition.get("requested_shape") is None for petition in petitions)


def test_wanderer_petition_can_require_shape_only():
    session = _load()
    petitions = [session.executor.call("create_wanderer_petition", 10, [])[0] for _ in range(200)]
    assert any(petition.get("requested_color") is None and petition.get("requested_shape") is not None for petition in petitions)


def test_wanderer_petition_never_requires_neither():
    session = _load()
    petitions = [session.executor.call("create_wanderer_petition", 10, [])[0] for _ in range(200)]
    assert all(petition.get("requested_color") is not None or petition.get("requested_shape") is not None for petition in petitions)


def test_wanderer_petition_reward_is_tier_scaled():
    session = _load()
    petitions = [session.executor.call("create_wanderer_petition", 10, [])[0] for _ in range(200)]
    rewards = {petition["reward"] for petition in petitions}
    assert len(rewards) > 1
    for petition in petitions:
        color_tier = session.executor.call("get_color_tier", petition["requested_color"]) if petition.get("requested_color") else 1.5
        shape_tier = session.executor.call("get_shape_tier", petition["requested_shape"]) if petition.get("requested_shape") else 1.5
        assert petition["reward"] == int(color_tier * shape_tier * 30)


def test_fulfill_petition_matches_partial_requirement():
    color_only = _state(petitions=[{"id": "petition-1", "requested_color": "Red", "requested_shape": None, "reward": 30, "expires_cycle": 12}], slimes=[_matching_slime()])
    result, error = _load().executor.call("fulfill_petition", color_only, "petition-1", "slime-1")
    assert error is None
    assert result["payout"] == 30

    shape_only = _state(petitions=[{"id": "petition-1", "requested_color": None, "requested_shape": "Triangle", "reward": 30, "expires_cycle": 12}], slimes=[_matching_slime()])
    result, error = _load().executor.call("fulfill_petition", shape_only, "petition-1", "slime-1")
    assert error is None
    assert result["payout"] == 30


def test_fulfill_petition_rejects_wrong_partial_match():
    state = _state(petitions=[{"id": "petition-1", "requested_color": "Blue", "requested_shape": None, "reward": 30, "expires_cycle": 12}], slimes=[_matching_slime()])
    result, error = _load().executor.call("fulfill_petition", state, "petition-1", "slime-1")
    assert result is None
    assert error == "Slime does not match petition color"
