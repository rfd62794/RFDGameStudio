"""test_brewfield.py — Brewfield Phase A core loop integration tests."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import yaml

from studio.runtime import load_game
from studio_mcp.tools import studio_validate_game

BF_DIR = Path(__file__).parent.parent / "games" / "brewfield"


def _load_brewfield():
    return load_game("brewfield", seed=42)


def test_studio_validate_game_brewfield() -> None:
    result = studio_validate_game("brewfield")
    assert result["valid"] is True
    assert result["issues"] == []


def test_data_yaml_run_nodes_match_source() -> None:
    data = yaml.safe_load((BF_DIR / "data.yaml").read_text(encoding="utf-8"))
    nodes = data["run_nodes"]
    assert len(nodes) == 9
    assert nodes[0] == {
        "id": 1,
        "type": "fight",
        "name": "Alchemical Chamber",
        "description": "A cinder beast blocks the descent.",
        "enemy": "ashling",
    }
    assert nodes[8] == {
        "id": 9,
        "type": "fight",
        "name": "The Cauldron Heart",
        "description": "The rootbound guardian awaits at the core.",
        "enemy": "rootbound",
    }


def test_get_relation_same_adjacent_opposed() -> None:
    session = _load_brewfield()
    data = session.files.data
    assert session.executor.call("get_relation", "fire", "fire") == "same"
    assert session.executor.call("get_relation", "fire", "air") == "adjacent"
    assert session.executor.call("get_relation", "fire", "water") == "opposed"
    assert session.executor.call("get_relation", "fire", "earth") == "adjacent"


def test_solve_brew_same_element_amplified() -> None:
    """fire + fire + strike → 8 base × 1.5 same = 12 damage (AMPLIFIED)."""
    session = _load_brewfield()
    data = session.files.data
    result = session.executor.call("solve_brew", data, "fire", "fire", "strike", 1)
    assert result["combination"] == "same"
    assert result["damage"] == 12
    assert result["primaryElement"] == "fire"
    assert "AMPLIFIED" in result["name"]


def test_solve_brew_adjacent_hybrid_bonus() -> None:
    """fire + air + strike → fire primary sets baseDamage 8, +1 air hybrid = 9 (HYBRIDIZED)."""
    session = _load_brewfield()
    data = session.files.data
    result = session.executor.call("solve_brew", data, "fire", "air", "strike", 1)
    assert result["combination"] == "adjacent"
    assert result["damage"] == 9
    assert result["primaryElement"] == "fire"
    assert result["secondaryElement"] == "air"
    assert "HYBRIDIZED" in result["name"]


def test_solve_brew_opposed_success_and_fizzle() -> None:
    """Opposed coin flip uses math.sin(seed)*10000 fractional part.

    seed=3: sin(3)*10000 ≈ 1411.2, fractional 0.2 < 0.5 → fizzle (0.5×).
    seed=4: sin(4)*10000 ≈ -7568.3, fractional 0.7 ≥ 0.5 → surge (1.5×).
    """
    session = _load_brewfield()
    data = session.files.data
    fizzle = session.executor.call("solve_brew", data, "fire", "water", "strike", 3)
    assert fizzle["combination"] == "opposed"
    assert fizzle["damage"] == 4  # fire primary baseDamage 8 × 0.5 = 4
    assert "FIZZLE" in fizzle["name"]

    surge = session.executor.call("solve_brew", data, "fire", "water", "strike", 4)
    assert surge["combination"] == "opposed"
    assert surge["damage"] == 12  # fire primary baseDamage 8 × 1.5 = 12
    assert "SURGE" in surge["name"]


def test_update_residue_field_same_amplifies() -> None:
    session = _load_brewfield()
    result = session.executor.call(
        "update_residue_field",
        [{"tag": "burning", "level": 1}],
        "fire",
        False
    )
    assert result["updated"] == [{"tag": "burning", "level": 2}]


def test_update_residue_field_opposed_clears() -> None:
    session = _load_brewfield()
    result = session.executor.call(
        "update_residue_field",
        [{"tag": "burning", "level": 2}],
        "water",
        False
    )
    assert len(result["updated"]) == 0


def test_update_residue_field_fortified_vs_fortified_edge_case() -> None:
    """Both slots fortified: overwrite attempt decays first fortified level instead."""
    session = _load_brewfield()
    result = session.executor.call(
        "update_residue_field",
        [{"tag": "fortified", "level": 2}, {"tag": "fortified", "level": 1}],
        "fire",
        False
    )
    assert result["updated"][0]["level"] == 1  # first fortified decayed from 2 -> 1
    assert result["updated"][1]["tag"] == "fortified"


def test_update_residue_field_fortified_protects_other_slot() -> None:
    """Fortified + burning, add water: water clears burning (opposed), not fortified."""
    session = _load_brewfield()
    result = session.executor.call(
        "update_residue_field",
        [{"tag": "fortified", "level": 1}, {"tag": "burning", "level": 1}],
        "water",
        False
    )
    tags = [r["tag"] for r in result["updated"]]
    assert "fortified" in tags
    assert "burning" not in tags
    # Opposed elements clear each other; water does not deposit a soaked tag here.
    assert tags == ["fortified"]


def test_get_enemy_intent_cycles() -> None:
    session = _load_brewfield()
    data = session.files.data
    t1 = session.executor.call("get_enemy_intent", data, "ashling", 1)
    t5 = session.executor.call("get_enemy_intent", data, "ashling", 5)
    assert t1["action"] == "attack" and t1["value"] == 6
    assert t5["action"] == t1["action"] and t5["value"] == t1["value"]


def test_instantiate_enemy_reads_data_yaml() -> None:
    session = _load_brewfield()
    data = session.files.data
    enemy = session.executor.call("instantiate_enemy", data, "bulwark", 1)
    assert enemy["name"] == "Bulwark (Stone Golem)"
    assert enemy["hp"] == 20
    assert enemy["maxHp"] == 20
    assert enemy["intent"]["action"] == "defend"


def test_resolve_turn_victory_before_enemy_acts() -> None:
    """A brew that drops enemy HP to 0 ends combat immediately; enemy does not act."""
    session = _load_brewfield()
    data = session.files.data
    state = session.executor.call("init_run", data)
    state = session.executor.call("init_fight", data, state, 1)
    state["enemy"]["hp"] = 5
    state["enemy"]["shield"] = 0
    state["hand"] = ["fire", "fire", "water", "water", "earth"]

    next_state = session.executor.call(
        "resolve_turn", data, state, state["hand"][1], state["hand"][2], "strike", 1
    )
    assert next_state["combatOutcome"] == "victory"


def test_advance_hand_discards_full_hand_and_draws_five() -> None:
    session = _load_brewfield()
    data = session.files.data
    state = session.executor.call("init_run", data)
    state = session.executor.call("init_fight", data, state, 1)
    original_hand_count = len(state["hand"])
    original_draw_count = len(state["drawPile"])
    assert original_hand_count == 5

    # Starting deck has only 8 cards, so the discard pile gets reshuffled into draw immediately.
    next_state = session.executor.call("advance_hand", state)
    assert len(next_state["hand"]) == 5
    assert (
        len(next_state["hand"]) + len(next_state["drawPile"]) + len(next_state["discardPile"])
        == original_hand_count + original_draw_count
    )


def test_init_run_preserves_starting_deck_order() -> None:
    session = _load_brewfield()
    data = session.files.data
    state = session.executor.call("init_run", data)
    assert state["deck"] == data["starting_deck"]


def test_init_fight_resets_player_fight_state() -> None:
    session = _load_brewfield()
    data = session.files.data
    state = session.executor.call("init_run", data)
    state["player"]["shield"] = 5
    state["player"]["dodgeCharges"] = 2
    state["player"]["burnDebuff"] = 2
    next_state = session.executor.call("init_fight", data, state, 1)
    assert next_state["player"]["shield"] == 0
    assert next_state["player"]["dodgeCharges"] == 0
    assert next_state["player"]["burnDebuff"] == 0
    assert next_state["currentTurn"] == 1
    assert next_state["enemy"] is not None


def _best_pair(hand, primary):
    """Return a pair from hand preferring (primary, primary), else (primary, any), else (any, any)."""
    indices = [i for i, el in enumerate(hand) if el == primary]
    if len(indices) >= 2:
        return hand[indices[0]], hand[indices[1]]
    if len(hand) >= 2:
        return hand[0], hand[1]
    return hand[0] if hand else "fire", None


def test_full_run_programmatic_simulation_completes() -> None:
    """Simulate a full 9-node run through the Lua engine; every node must resolve."""
    import random
    random.seed(0)
    session = _load_brewfield()
    data = session.files.data
    state = session.executor.call("init_run", data)
    # Boost HP for this flow test so suboptimal play still clears all nodes.
    state["player"]["hp"] = 100
    state["player"]["maxHp"] = 100

    for node in state["nodes"]:
        state["currentNodeId"] = node["id"]
        if node["type"] == "fight":
            state = session.executor.call("init_fight", data, state, node["id"])
            assert state["enemy"] is not None
            while state.get("combatOutcome") is None:
                hand = state["hand"]
                intent = state["enemy"]["intent"]
                # Simple heuristic: ward if about to be hit, mend if low, otherwise strike.
                if state["player"]["hp"] <= 25:
                    el1, el2 = _best_pair(hand, "water")
                    component = "mend"
                elif intent["action"] == "attack" and state["player"]["shield"] < intent["value"]:
                    el1, el2 = _best_pair(hand, "earth")
                    component = "ward"
                else:
                    el1, el2 = _best_pair(hand, "fire")
                    component = "strike"
                state = session.executor.call(
                    "resolve_turn", data, state, el1, el2, component, state["currentTurn"]
                )
            assert state.get("combatOutcome") == "victory"
            state = session.executor.call("advance_node", state)
        elif node["type"] == "forage":
            state = session.executor.call("init_node", data, state, node["id"])
            choice = state["forageOptions"][0]
            state = session.executor.call("choose_forage", state, choice)
            state = session.executor.call("advance_node", state)
        elif node["type"] == "rest":
            state = session.executor.call("init_node", data, state, node["id"])
            state = session.executor.call("rest_stoke_furnace", state)
            state = session.executor.call("advance_node", state)

    assert state["screen"] == "game_over"
    assert state["runWon"] is True
