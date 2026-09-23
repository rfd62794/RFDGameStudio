from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


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


def _slime(slime_id, role, color="Red"):
    return {"id": slime_id, "locked_role": role, "color": color, "level": 1, "stats": {}}


def test_advance_cycle_credits_worker_income():
    result = _load().executor.call("advance_cycle", _state(slimes=[_slime("worker", "worker")]))
    assert result["credits"] == 105


def test_advance_cycle_ignores_non_worker_slimes():
    slimes = [_slime("dispatch", "dispatch"), _slime("mediation", "mediation"), _slime("idle", None)]
    result = _load().executor.call("advance_cycle", _state(slimes=slimes))
    assert result["credits"] == 100


def test_advance_cycle_applies_auto_feeder_and_culture_bonus():
    state = _state(
        has_auto_feeder=True,
        slimes=[_slime("worker", "worker", "Red")],
        planet_region={"nodes": [{"id": "red-capitol", "owner_color": "Red", "is_capitol": True, "strength": 1, "pressure": {}, "neighbors": []}]},
    )
    result = _load().executor.call("advance_cycle", state)
    assert result["credits"] == 120
