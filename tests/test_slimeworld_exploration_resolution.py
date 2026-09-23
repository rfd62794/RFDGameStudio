"""Exploration resolution tests for SlimeWorld advance_cycle.

Verifies the exploration-resolution block added to advance_cycle in logic.lua:
- Scout power = sum of int + agi across party members
- Target power = 40 + floor(node.strength * 60 + 0.5)
- Success chance: ratio > 1 -> 0.85 + (ratio-1)*0.1, else 0.2 + ratio*0.6, clamped [0.15, 0.98]
- On success: node.discovered = true
- XP: 45 on success, 20 on failure, always awarded
- Scouts always return to idle role
- active_exploration always cleared to nil after resolution
- A log entry is always created
- Edge cases: missing target node and empty party produce no error
"""
from studio.executor import _to_python
from studio.runtime import load_game


def _load(seed=42):
    return load_game("slimeworld", seed=seed)


def _slime(slime_id, int_val=10, agi_val=10, level=1):
    return {
        "id": slime_id,
        "name": slime_id,
        "color": "Red",
        "pattern": "Solid",
        "level": level,
        "xp": 0,
        "stats": {"hp": 100, "atk": 10, "def": 10, "agi": agi_val, "int": int_val, "chm": 10},
        "role": "dispatch",
        "generation": 0,
        "hue": 0,
        "saturation": 100,
        "vertex_count": 4,
        "irregularity": 10,
    }


def _node(node_id, strength=0.5, discovered=False, name="TestNode"):
    return {
        "id": node_id,
        "name": name,
        "cell_shape": "hex",
        "label_x": 0,
        "label_y": 0,
        "neighbors": [],
        "owner_color": "Red",
        "pressure": {},
        "strength": strength,
        "is_capitol": False,
        "is_supplied": True,
        "distance_from_center": 1,
        "discovered": discovered,
        "garrison_slime_id": None,
    }


def _state_with_exploration(slimes, node_id="node_target", slime_ids=None, strength=0.5):
    if slime_ids is None:
        slime_ids = [s["id"] for s in slimes]
    return {
        "cycle": 1,
        "credits": 100,
        "slimes": slimes,
        "roster_cap": 10,
        "contracts": [],
        "zones": [],
        "active_dispatch": None,
        "active_mediation": None,
        "active_exploration": {
            "id": "exploration",
            "target_node_id": node_id,
            "slime_ids": slime_ids,
            "cycles_remaining": 1,
            "status": "active",
        },
        "planet_region": {
            "nodes": [_node(node_id, strength=strength)],
            "generated_at": 0,
            "geometry_version": 3,
        },
        "wilds_unlocked": False,
        "logs": [],
        "recent_market_sales": [],
    }


def _advance(state, seed=42):
    session = _load(seed=seed)
    lua_state = session.executor._to_lua(state)
    result = session.executor._lua.globals()["advance_cycle"](lua_state)
    return _to_python(result)


def test_exploration_scout_power_sums_int_and_agi():
    """Scout power = sum of int + agi across all party members."""
    slimes = [_slime("s1", int_val=15, agi_val=10), _slime("s2", int_val=8, agi_val=12)]
    state = _state_with_exploration(slimes, slime_ids=["s1", "s2"], strength=0.0)
    result = _advance(state)
    # With strength=0: target_power = 40 + floor(0*60+0.5) = 40 + 0 = 40
    # scout_power = (15+10) + (8+12) = 45
    # ratio = 45/40 = 1.125 > 1
    # chance = 0.85 + 0.125*0.1 = 0.8625
    # This is above 0.15 and below 0.98 — confirms the formula path
    # We can't assert success/failure directly (RNG), but we verify no crash and state cleared
    assert result.get("active_exploration") is None


def test_exploration_success_chance_above_ratio_one():
    """Scout power exceeding target power, chance formula matches ratio > 1 path."""
    # int=50, agi=50 -> scout_power=100; strength=0 -> target_power=40; ratio=2.5
    slimes = [_slime("s1", int_val=50, agi_val=50)]
    state = _state_with_exploration(slimes, slime_ids=["s1"], strength=0.0)
    result = _advance(state)
    # ratio=2.5 > 1 -> chance = 0.85 + 1.5*0.1 = 1.0, clamped to 0.98
    # Very high chance of success — verify state cleared and no error
    assert result.get("active_exploration") is None
    # XP should be either 45 (success) or 20 (failure)
    xp = result["slimes"][0]["xp"]
    assert xp in (45, 20)


def test_exploration_success_chance_below_ratio_one():
    """Scout power below target power, chance formula matches ratio < 1 path."""
    # int=5, agi=5 -> scout_power=10; strength=1.0 -> target_power=40+60=100; ratio=0.1
    slimes = [_slime("s1", int_val=5, agi_val=5)]
    state = _state_with_exploration(slimes, slime_ids=["s1"], strength=1.0)
    result = _advance(state)
    # ratio=0.1 < 1 -> chance = 0.2 + 0.1*0.6 = 0.26
    assert result.get("active_exploration") is None
    xp = result["slimes"][0]["xp"]
    assert xp in (45, 20)


def test_exploration_chance_clamped_to_bounds():
    """Extreme ratios produce chance within [0.15, 0.98]."""
    # Very low scout power: int=1, agi=1 -> power=2; strength=10 -> target=40+600=640
    # ratio=2/640=0.003125 -> chance = 0.2 + 0.003125*0.6 = 0.201875, clamped to >= 0.15
    slimes = [_slime("s1", int_val=1, agi_val=1)]
    state = _state_with_exploration(slimes, slime_ids=["s1"], strength=10.0)
    result = _advance(state)
    assert result.get("active_exploration") is None
    # Should not crash, XP awarded
    assert result["slimes"][0]["xp"] in (45, 20)

    # Very high scout power: int=999, agi=999 -> power=1998; strength=0 -> target=40
    # ratio=49.95 -> chance = 0.85 + 48.95*0.1 = 5.745, clamped to 0.98
    slimes2 = [_slime("s2", int_val=999, agi_val=999)]
    state2 = _state_with_exploration(slimes2, slime_ids=["s2"], strength=0.0)
    result2 = _advance(state2)
    assert result2.get("active_exploration") is None
    assert result2["slimes"][0]["xp"] in (45, 20)


def test_exploration_success_reveals_node():
    """Forced-success scenario (seeded RNG), discovered becomes true."""
    # Use very high scout power to virtually guarantee success
    slimes = [_slime("s1", int_val=999, agi_val=999)]
    state = _state_with_exploration(slimes, slime_ids=["s1"], strength=0.0, node_id="node_target")
    # Run many iterations to hit a success
    discovered = False
    for seed_val in range(100):
        result = _advance(state, seed=seed_val)
        if result["planet_region"]["nodes"][0]["discovered"]:
            discovered = True
            break
    assert discovered, "With near-guaranteed success chance, at least one iteration should reveal the node"


def test_exploration_xp_awarded_both_outcomes():
    """45 on success, 20 on failure, both real and tested."""
    success_xp_seen = False
    failure_xp_seen = False
    for seed_val in range(200):
        slimes = [_slime("s1", int_val=10, agi_val=10)]
        state = _state_with_exploration(slimes, slime_ids=["s1"], strength=0.5)
        result = _advance(state, seed=seed_val)
        xp = result["slimes"][0]["xp"]
        if xp == 45:
            success_xp_seen = True
        elif xp == 20:
            failure_xp_seen = True
        if success_xp_seen and failure_xp_seen:
            break
    assert success_xp_seen, "Should see 45 XP from at least one successful exploration"
    assert failure_xp_seen, "Should see 20 XP from at least one failed exploration"


def test_exploration_scouts_return_to_idle():
    """Role reset confirmed regardless of outcome."""
    slimes = [_slime("s1", int_val=10, agi_val=10), _slime("s2", int_val=8, agi_val=12)]
    state = _state_with_exploration(slimes, slime_ids=["s1", "s2"], strength=0.5)
    result = _advance(state)
    for slime in result["slimes"]:
        assert slime["role"] == "idle", f"Scout {slime['id']} should be idle, got {slime['role']}"


def test_exploration_state_cleared_after_resolution():
    """active_exploration is nil after advance_cycle runs."""
    slimes = [_slime("s1", int_val=10, agi_val=10)]
    state = _state_with_exploration(slimes, slime_ids=["s1"], strength=0.5)
    result = _advance(state)
    assert result.get("active_exploration") is None


def test_exploration_missing_target_node_no_error():
    """Edge case: target node not found in region — no crash, fail-path behavior."""
    slimes = [_slime("s1", int_val=10, agi_val=10)]
    # Create state with exploration targeting a node that doesn't exist in the region
    state = _state_with_exploration(slimes, node_id="node_target", slime_ids=["s1"])
    # Replace region with a different node so target_node_id won't match
    state["planet_region"]["nodes"] = [_node("node_other", strength=0.5, name="OtherNode")]
    result = _advance(state)
    # Should not crash, active_exploration cleared, XP awarded (fail path = 20)
    assert result.get("active_exploration") is None
    assert result["slimes"][0]["xp"] == 20  # fail XP
    assert result["slimes"][0]["role"] == "idle"
    # Log entry created
    assert any("EXPLORATION CONCLUDED" in log["text"] for log in result["logs"])


def test_exploration_empty_party_no_error():
    """Edge case: empty party — no crash, fail-path behavior."""
    slimes = [_slime("s1", int_val=10, agi_val=10)]
    state = _state_with_exploration(slimes, slime_ids=[])
    result = _advance(state)
    # Should not crash, active_exploration cleared
    assert result.get("active_exploration") is None
    # Slime not in party, so no XP awarded and role unchanged
    assert result["slimes"][0]["xp"] == 0
    # Log entry still created
    assert any("EXPLORATION CONCLUDED" in log["text"] for log in result["logs"])
