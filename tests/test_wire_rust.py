from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import yaml

from studio.executor import Executor
from studio.runtime import load_game

GAME_ID = "wire_rust"

def _load_game():
    return load_game(GAME_ID, seed=42)

def test_init_game() -> None:
    session = _load_game()
    data = session.files.data
    player = session.executor.call("init_game", data)
    
    assert player is not None
    assert player["hp"] == 50
    assert player["scrap"] == 10
    assert player["current_room_id"] == "junk_heap"
    assert len(player["hand"]) == 4

def test_get_synergies() -> None:
    session = _load_game()
    
    # Test Copper + Zinc synergy (Brass)
    hand = ["copper_rod", "zinc_plate"]
    res = session.executor.call("get_synergies", hand)
    assert "Brass" in res["synergies"]
    assert res["bonus"] == 3
    
    # Test Iron + Zinc synergy (Steel)
    hand2 = ["iron_block", "zinc_plate", "lead_solder"]
    res2 = session.executor.call("get_synergies", hand2)
    assert "Steel" in res2["synergies"]
    assert res2["bonus"] == 4

def test_move_room() -> None:
    session = _load_game()
    data = session.files.data
    player = session.executor.call("init_game", data)
    
    # Move to rust_pit (valid connection from junk_heap)
    player2 = session.executor.call("move_room", data, player, "rust_pit")
    assert player2["current_room_id"] == "rust_pit"
    assert len(player2["hand"]) == 4
    
    # Move to reactor_core (invalid connection from junk_heap)
    player3 = session.executor.call("move_room", data, player, "reactor_core")
    assert player3["current_room_id"] == "junk_heap"

def test_resolve_encounter_win() -> None:
    session = _load_game()
    data = session.files.data
    player = session.executor.call("init_game", data)
    
    # We want to force a high roll so player wins
    # junk_heap difficulty is 6. copper_rod mod is 2. Roll of 10.
    res = session.executor.call("resolve_encounter", data, player, "copper_rod", 10)
    assert res is not None
    assert res["won"] is True
    assert res["total_score"] >= 6
    assert res["player"]["scrap"] > 10
    
    # Card is removed from hand
    assert "copper_rod" not in res["player"]["hand"]
