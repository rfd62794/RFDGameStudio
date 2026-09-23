from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from studio.executor import Executor
from studio.runtime import load_game

GAME_ID = "choke_point"

def _load_game():
    return load_game(GAME_ID, seed=42)

def test_choke_point_init() -> None:
    session = _load_game()
    data = session.files.data
    state = session.executor.call("init_game", data)
    
    assert state is not None
    assert state["wave"] == 1
    assert state["round"] == 1
    assert state["energy"] == 10
    assert state["core_hp"] == 10
    
    # Verify we have at least one enemy with a preview path
    enemies = state["enemies"]
    assert len(enemies) > 0
    enemy = enemies[0]
    assert "x" in enemy
    assert "y" in enemy
    assert "preview_x" in enemy
    assert "preview_y" in enemy

def test_choke_point_place_tower() -> None:
    session = _load_game()
    data = session.files.data
    state = session.executor.call("init_game", data)
    
    # Place a blocker at (4, 3) where an enemy might want to path
    next_state = session.executor.call("place_tower", data, state, "blocker", 4, 3)
    assert next_state is not None
    assert next_state["energy"] < state["energy"] # energy deducted
    
    # Blocker should be in towers list
    towers = next_state["towers"]
    assert any(t["type"] == "blocker" and t["x"] == 4 and t["y"] == 3 for t in towers)

def test_choke_point_commit_turn() -> None:
    session = _load_game()
    data = session.files.data
    state = session.executor.call("init_game", data)
    
    # Find enemy and its preview target
    enemy = state["enemies"][0]
    px, py = enemy["preview_x"], enemy["preview_y"]
    
    # Commit the turn
    next_state = session.executor.call("commit_turn", data, state)
    assert next_state is not None
    assert next_state["round"] == state["round"] + 1
    
    # Enemy should have moved to its preview position (if not blocked/dead)
    enemies = next_state["enemies"]
    if len(enemies) > 0:
        updated_enemy = [e for e in enemies if e["id"] == enemy["id"]]
        if updated_enemy:
            assert updated_enemy[0]["x"] == px
            assert updated_enemy[0]["y"] == py
