"""test_slimeworld.py — SlimeWorld core logic integration tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest

from studio.runtime import load_game


def _load():
    return load_game("slimeworld", seed=42)


def _base_state(**overrides):
    state = {
        "cycle": 1,
        "credits": 100,
        "contracts": [],
        "slimes": [],
        "has_auto_feeder": False,
        "planet_region": {"nodes": []},
        "logs": [],
        "roster_cap": 10,
    }
    state.update(overrides)
    return state


# --- generate_contract ---

def test_generate_contract_returns_valid_contract():
    session = _load()
    contract = session.executor.call("generate_contract", 1)
    assert contract is not None
    assert "id" in contract
    assert "title" in contract
    assert contract["title"].startswith("CONTRACT RQ-")
    assert contract["required_color"] in ["Red", "Blue", "Yellow", "Purple", "Orange", "Green"]
    assert contract["required_pattern"] in ["Solid", "Stripe", "Polka", "Glow", "Crown", "Ringed"]
    assert contract["credits_reward"] >= 100
    assert 5 <= contract["cycles_remaining"] <= 8
    assert contract["total_cycles"] == contract["cycles_remaining"]
    assert len(contract["flavor_text"]) > 0


def test_generate_contract_rarity_rewards():
    session = _load()
    # Run many times to check reward range
    rewards = []
    for _ in range(50):
        c = session.executor.call("generate_contract", 1)
        rewards.append(c["credits_reward"])
    # Base is 100, max multiplier is 1 + 0.5 + 0.5 + 0.8 = 2.8, plus random 30
    # So range is roughly 100 to 310
    assert min(rewards) >= 100
    assert max(rewards) <= 320


# --- get_random_melancholic_log ---

def test_melancholic_log_has_correct_fields():
    session = _load()
    log = session.executor.call("get_random_melancholic_log", 5)
    assert log is not None
    assert log["cycle"] == 5
    assert log["type"] == "melancholy"
    assert "LOG:" in log["text"]
    assert len(log["text"]) > 20


# --- advance_cycle: contract spawning ---

def test_advance_cycle_increments_cycle():
    session = _load()
    state = _base_state()
    result = session.executor.call("advance_cycle", state)
    assert result == 2
    assert state["cycle"] == 2


def test_advance_cycle_expires_contracts():
    session = _load()
    state = _base_state(contracts=[
        {"id": "c1", "required_color": "Red", "required_pattern": "Solid",
         "credits_reward": 100, "cycles_remaining": 1, "total_cycles": 5, "flavor_text": "test"},
    ])
    session.executor.call("advance_cycle", state)
    assert len(state["contracts"]) <= 1  # expired one removed, maybe new one spawned
    # The old contract with cycles_remaining=1 should be gone
    remaining_ids = [c["id"] for c in state["contracts"]]
    assert "c1" not in remaining_ids


def test_advance_cycle_spawns_contract_when_below_min():
    session = _load()
    state = _base_state(contracts=[])
    session.executor.call("advance_cycle", state)
    # With 0 contracts, min 2 logic should force a spawn
    assert len(state["contracts"]) >= 1


def test_advance_cycle_respects_cap_of_4():
    session = _load()
    full_contracts = [
        {"id": f"c{i}", "required_color": "Red", "required_pattern": "Solid",
         "credits_reward": 100, "cycles_remaining": 10, "total_cycles": 10, "flavor_text": "test"}
        for i in range(4)
    ]
    state = _base_state(contracts=full_contracts)
    session.executor.call("advance_cycle", state)
    assert len(state["contracts"]) <= 4


def test_advance_cycle_contract_spawn_rate():
    """Over many runs with 1 existing contract, verify spawn rate is roughly 65%."""
    session = _load()
    spawn_count = 0
    runs = 100
    for _ in range(runs):
        state = _base_state(contracts=[
            {"id": "c1", "required_color": "Red", "required_pattern": "Solid",
             "credits_reward": 100, "cycles_remaining": 10, "total_cycles": 10, "flavor_text": "test"}
        ])
        session.executor.call("advance_cycle", state)
        # After cycle: old contract still there (cycles_remaining=9), plus maybe new one
        if len(state["contracts"]) > 1:
            spawn_count += 1
    # Should be roughly 65% — allow 45-85% for randomness
    rate = spawn_count / runs
    assert 0.45 < rate < 0.85, f"Spawn rate {rate:.2%} outside expected range (45-85%)"


# --- advance_cycle: dual logging ---

def test_advance_cycle_emits_system_log():
    session = _load()
    state = _base_state()
    session.executor.call("advance_cycle", state)
    assert len(state["logs"]) >= 1
    cycle_log = state["logs"][0]
    assert cycle_log["type"] == "system"
    assert "CYCLE ADVANCED" in cycle_log["text"]
    assert cycle_log["cycle"] == 2


def test_advance_cycle_flavor_log_frequency():
    """Over many runs, verify ~45% chance of flavor log."""
    session = _load()
    flavor_count = 0
    runs = 100
    for _ in range(runs):
        state = _base_state()
        session.executor.call("advance_cycle", state)
        # First log is always system, second (if present) is melancholy
        if len(state["logs"]) > 1:
            assert state["logs"][1]["type"] == "melancholy"
            flavor_count += 1
    rate = flavor_count / runs
    # Allow 30-60% for randomness
    assert 0.30 < rate < 0.60, f"Flavor log rate {rate:.2%} outside expected range (30-60%)"


# --- advance_cycle: worker income ---

def test_advance_cycle_worker_income():
    session = _load()
    state = _base_state(
        slimes=[{"id": "s1", "locked_role": "worker", "color": "Red", "level": 1,
                 "stats": {"hp": 120, "atk": 18, "def": 8, "agi": 6, "int": 5, "chm": 6}}],
        credits=100,
    )
    session.executor.call("advance_cycle", state)
    # Worker base income is 5, so credits should increase
    assert state["credits"] > 100


# --- advance_cycle: capitol hardening ---

def test_advance_cycle_capitol_hardening_bonus():
    session = _load()
    capitol_node = {
        "id": "node_capitol",
        "name": "Capitol",
        "is_capitol": True,
        "owner_color": "Red",
        "strength": 1.0,
        "pressure": {},
        "garrison_slime_id": "s_garrison",
    }
    state = _base_state(
        slimes=[
            {"id": "s_garrison", "locked_role": "garrison", "garrisoned_at": "node_capitol",
             "color": "Red", "level": 1, "stats": {"hp": 120, "atk": 18, "def": 8, "agi": 6, "int": 5, "chm": 6}},
        ],
        planet_region={"nodes": [capitol_node]},
        credits=100,
    )
    session.executor.call("advance_cycle", state)
    # Should get +15 capitol hardening bonus
    assert state["credits"] >= 115
