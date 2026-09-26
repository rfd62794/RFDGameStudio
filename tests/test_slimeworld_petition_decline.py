"""test_slimeworld_petition_decline.py — Petition Decline + discovered-trait targeting.

Ports SlimeBreeder's dismissRequest (archive/slimebreeder/src/store/gameStore.ts):
a Decline action removes a wanderer petition and a replacement is generated
immediately. Petition trait picks prefer the player's discovered pool
(persisted codices plus the live roster) at data.yaml's
petition.discovered_target_ratio; the remainder are aspirational draws from
the global trait lists.
"""

from pathlib import Path

import yaml

from studio.executor import _to_python
from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _petition(pid, color="Red", shape="Triangle", expires=12):
    return {
        "id": pid, "source": "wanderer", "requested_color": color,
        "requested_shape": shape, "payout_multiplier": 3.0,
        "reward": 45, "expires_cycle": expires,
    }


def _slime(slime_id, color="Red", vertex_count=3, irregularity=5):
    return {
        "id": slime_id, "color": color, "pattern": "Solid", "level": 1,
        "xp": 0, "role": "idle", "generation": 1,
        "vertex_count": vertex_count, "irregularity": irregularity,
    }


def _state(petitions=None, slimes=None, cycle=10, **extra):
    state = {
        "cycle": cycle, "petitions": petitions or [], "slimes": slimes or [],
        "credits": 100, "roster_cap": 10, "contracts": [], "zones": [],
    }
    state.update(extra)
    return state


def test_data_yaml_carries_discovered_target_ratio():
    path = Path(__file__).parent.parent / "games" / "slimeworld" / "data.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8"))
    assert data["petition"]["discovered_target_ratio"] == 0.8


def test_decline_petition_removes_and_regenerates_immediately():
    petitions = [_petition(f"p{i}") for i in range(3)]
    state = _state(petitions=petitions, slimes=[_slime("s1")])
    result, error = _load().executor.call("decline_petition", state, "p1")
    assert error is None
    assert result["declined_id"] == "p1"
    ids = [p["id"] for p in result["petitions"]]
    assert len(result["petitions"]) == 3
    assert "p1" not in ids
    assert "p0" in ids and "p2" in ids
    new = [p for p in result["petitions"] if p["id"].startswith("petition_wanderer_")]
    assert len(new) == 1
    assert new[0]["source"] == "wanderer"


def test_decline_petition_refills_to_max_from_below_cap():
    state = _state(petitions=[_petition("p0")], slimes=[_slime("s1")])
    result, error = _load().executor.call("decline_petition", state, "p0")
    assert error is None
    assert len(result["petitions"]) == 3
    assert all(p["id"].startswith("petition_wanderer_") for p in result["petitions"])


def test_decline_petition_replacements_are_valid():
    state = _state(petitions=[_petition("p0")], slimes=[_slime("s1")])
    result, error = _load().executor.call("decline_petition", state, "p0")
    assert error is None
    for petition in result["petitions"]:
        assert petition["source"] == "wanderer"
        assert petition["expires_cycle"] > state["cycle"]
        assert petition.get("requested_color") is not None or petition.get("requested_shape") is not None
        assert petition["reward"] > 0


def test_decline_petition_unknown_id_errors():
    state = _state(petitions=[_petition("p0")])
    result, error = _load().executor.call("decline_petition", state, "nope")
    assert result is None
    assert error == "Petition not found"


def test_decline_petition_empty_list_errors():
    result, error = _load().executor.call("decline_petition", _state(), "p0")
    assert result is None
    assert error == "Petition not found"


def test_collect_discovered_petition_traits_reads_codex_and_roster():
    state = _state(
        slimes=[_slime("s1", "Red", 3, 5)],  # snaps to Triangle
        color_codex={"Purple": {"discovered": True}, "Green": {"discovered": False}},
        shape_codex={"Crown": True},
    )
    pools = _load().executor.call("collect_discovered_petition_traits", state)
    assert set(pools["colors"]) == {"Purple", "Red"}
    assert set(pools["shapes"]) == {"Crown", "Triangle"}


def test_create_wanderer_petition_prefers_discovered_at_full_ratio():
    session = _load()
    discovered = {"colors": ["Purple"], "shapes": ["Crown"]}
    petitions = [
        session.executor.call("create_wanderer_petition", 10, [], discovered, 1.0)[0]
        for _ in range(200)
    ]
    for petition in petitions:
        if petition.get("requested_color") is not None:
            assert petition["requested_color"] == "Purple"
        if petition.get("requested_shape") is not None:
            assert petition["requested_shape"] == "Crown"


def test_create_wanderer_petition_ratio_zero_uses_global_pool():
    session = _load()
    discovered = {"colors": ["Purple"], "shapes": ["Crown"]}
    petitions = [
        session.executor.call("create_wanderer_petition", 10, [], discovered, 0.0)[0]
        for _ in range(200)
    ]
    colors = {p["requested_color"] for p in petitions if p.get("requested_color")}
    shapes = {p["requested_shape"] for p in petitions if p.get("requested_shape")}
    assert colors - {"Purple"} != set()
    assert shapes - {"Crown"} != set()


def test_create_wanderer_petition_falls_back_to_global_when_pools_empty():
    session = _load()
    petition, error = session.executor.call(
        "create_wanderer_petition", 10, [], {"colors": [], "shapes": []}, 1.0
    )
    assert error is None
    assert petition.get("requested_color") is not None or petition.get("requested_shape") is not None


def test_decline_petition_replacements_prefer_discovered_pool():
    state = _state(
        petitions=[_petition("p0")],
        slimes=[],
        shape_codex={"Crown": True},
    )
    result, error = _load().executor.call(
        "decline_petition", state, "p0", {"discovered_target_ratio": 1.0}
    )
    assert error is None
    assert len(result["petitions"]) == 3
    for petition in result["petitions"]:
        if petition.get("requested_shape") is not None:
            assert petition["requested_shape"] == "Crown"


def test_advance_cycle_records_shape_codex_entries():
    session = _load()
    lua_state = session.executor._to_lua(_state(slimes=[_slime("s1", "Red", 5, 60)]))
    result = _to_python(session.executor._lua.globals()["advance_cycle"](lua_state))
    assert result["shape_codex"]["Star"] is True


def test_advance_cycle_accepts_petition_config():
    session = _load()
    lua_state = session.executor._to_lua(_state(slimes=[_slime("s1")]))
    lua_config = session.executor._to_lua({"discovered_target_ratio": 0.8})
    result = _to_python(
        session.executor._lua.globals()["advance_cycle"](lua_state, None, lua_config)
    )
    petitions = result.get("petitions") or []
    assert len(petitions) >= 1
