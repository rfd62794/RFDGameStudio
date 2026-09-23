"""Anchor tests for Dissonance Depths run-state, map generation, and deck
management — the Lua module added by the Renderer Directive to close the
gap the original port directive left unaddressed (map/run-state logic was
never ported; only pure combat/build/reward/discovery calculations were)."""
from __future__ import annotations

import pytest

from studio.runtime import call, load_game


@pytest.fixture(scope="module")
def session():
    return load_game("dissonance", seed=42)


@pytest.fixture(scope="module")
def data(session):
    return session.files.data


class TestCardPool:
    def test_build_card_pool_covers_all_named_cards(self, session, data):
        pool = call(session, "build_card_pool", data)
        assert len(pool) == len(data["named_cards"])

    def test_card_pool_derives_component_from_id(self, session, data):
        pool = call(session, "build_card_pool", data)
        by_id = {c["id"]: c for c in pool}
        card = by_id["ash_ash_guard"]
        assert card["component"] == "guard"
        assert card["el1"] == "ash"
        assert card["el2"] == "ash"
        assert card["relationType"] == "same"


class TestDeckDrawing:
    def test_draw_hand_fills_to_hand_size(self, session):
        deck_state = {
            "drawPile": [{"id": f"c{i}"} for i in range(8)],
            "hand": [],
            "discard": [],
        }
        result = call(session, "draw_hand", deck_state, 5)
        assert len(result["hand"]) == 5
        assert len(result["drawPile"]) == 3

    def test_draw_card_reshuffles_discard_when_draw_pile_empty(self, session):
        deck_state = {
            "drawPile": [],
            "hand": [],
            "discard": [{"id": "a"}, {"id": "b"}, {"id": "c"}],
        }
        result = call(session, "draw_card", deck_state)
        assert len(result["hand"]) == 1
        assert len(result["discard"]) == 0
        assert len(result["drawPile"]) == 2

    def test_draw_hand_stops_when_deck_and_discard_exhausted(self, session):
        deck_state = {"drawPile": [], "hand": [{"id": "x"}], "discard": []}
        result = call(session, "draw_hand", deck_state, 5)
        assert len(result["hand"]) == 1


class TestMapGeneration:
    def test_generate_branching_map_has_start_and_boss_nodes(self, session, data):
        nodes = call(session, "generate_branching_map", 7, 7, 1, data)
        ids = [n["id"] for n in nodes]
        assert "node_0_0" in ids
        assert "boss" in ids

    def test_branching_map_intermediate_layers_have_three_lanes(self, session, data):
        nodes = call(session, "generate_branching_map", 7, 7, 1, data)
        by_id = {n["id"]: n for n in nodes}
        layer1_nodes = [n for n in nodes if n["id"].startswith("node_1_")]
        assert len(layer1_nodes) == 3
        assert sorted(n["lane"] for n in layer1_nodes) == [0, 1, 2]

    def test_pre_boss_layer_is_guaranteed_rest_craft(self, session, data):
        nodes = call(session, "generate_branching_map", 7, 7, 1, data)
        pre_boss = [n for n in nodes if n["id"].startswith("node_5_")]
        assert len(pre_boss) == 3
        assert all(n["type"] == "restCraft" for n in pre_boss)

    def test_floor1_boss_is_advanced_tier_molten_ashling(self, session, data):
        nodes = call(session, "generate_branching_map", 7, 7, 1, data)
        boss = next(n for n in nodes if n["id"] == "boss")
        assert boss["enemyTier"] == "advanced"
        assert boss["enemyName"] == "Molten Ashling"

    def test_nodes_connect_forward_to_next_layer(self, session, data):
        nodes = call(session, "generate_branching_map", 7, 7, 1, data)
        start = next(n for n in nodes if n["id"] == "node_0_0")
        assert len(start["connectsTo"]) == 3

    def test_generate_balanced_map_returns_nodes_and_balance(self, session, data):
        result = call(session, "generate_balanced_map", 100, 7, 25, 1, data)
        assert "nodes" in result
        assert "balance" in result
        assert "netDamage" in result["balance"]
        assert "attempts" in result["balance"]
        assert result["balance"]["attempts"] >= 1

    def test_evaluate_map_balance_shape(self, session, data):
        nodes = call(session, "generate_branching_map", 7, 7, 1, data)
        result = call(session, "evaluate_map_balance", nodes, 25)
        assert "netDamage" in result
        assert "inBand" in result
        assert "band" in result
        assert len(result["band"]) == 2


class TestRunStateFSM:
    def test_create_run_produces_valid_run_state(self, session, data):
        deck_ids = ["ember_none_sever", "ash_none_mend", "spark_none_guard", "cinder_none_unmake"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        assert run["status"] == "not_started"
        assert run["currentFloor"] == 1
        assert run["playerHp"] == run["playerMaxHp"]
        assert run["currentNodeId"] == run["nodes"][0]["id"]
        assert len(run["nodes"]) > 0

    def test_enter_active_node_on_fight_initializes_combat(self, session, data):
        deck_ids = [
            "ember_none_sever", "ash_none_mend", "spark_none_guard", "cinder_none_unmake",
            "ember_ember_sever", "ash_ash_mend", "spark_spark_guard", "cinder_cinder_unmake",
        ]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        entered = call(session, "enter_active_node", run, deck_ids, data)
        assert entered["status"] == "combat"
        assert entered["enemy"] is not None
        assert entered["enemy"]["hp"] > 0
        assert len(entered["deckState"]["hand"]) == 5

    def test_advance_node_from_boss_produces_victory(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        run["currentNodeId"] = "boss"
        advanced = call(session, "advance_node", run)
        assert advanced["status"] == "victory"
        assert "boss" in advanced["visitedNodeIds"]

    def test_advance_node_from_non_boss_returns_to_map(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        run["currentNodeId"] = "node_0_0"
        advanced = call(session, "advance_node", run)
        assert advanced["status"] == "not_started"
        assert "node_0_0" in advanced["visitedNodeIds"]

    def test_select_branch_updates_current_node(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        target = run["nodes"][1]["id"]
        moved = call(session, "select_branch", run, target)
        assert moved["currentNodeId"] == target
        assert moved["status"] == "not_started"


class TestRewardApplication:
    def test_apply_reward_slot_heal(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        run["playerHp"] = 5
        result = call(session, "apply_reward_slot", run, {"kind": "heal", "amount": 10}, data)
        assert result["playerHp"] == 15

    def test_apply_reward_slot_benefit_adds_boon(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        boon_id = data["boons"][0]["id"]
        result = call(session, "apply_reward_slot", run, {"kind": "benefit", "boonId": boon_id}, data)
        assert any(b["id"] == boon_id for b in result["boons"])

    def test_apply_reward_slot_relic_adds_relic_id(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        result = call(session, "apply_reward_slot", run, {"kind": "relic", "relicId": "cracked_core"}, data)
        assert "cracked_core" in result["relics"]

    def test_apply_reward_slot_benefit_commits_build_gate(self, session, data):
        # Live wiring check: claiming a gate-triggering Boon through the
        # actual reward-claim path must set run_state.activeBuild for real,
        # not just append the boon to the list. This is the path
        # resolve_combat_turn -> apply_synergy_mechanic actually reads from.
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        assert run.get("activeBuild") in (None, {"buildId": None, "mechanicState": {}})

        result = call(session, "apply_reward_slot", run, {"kind": "benefit", "boonId": "escalation_boon"}, data)
        assert result["activeBuild"]["buildId"] == "burster"
        assert any("Build Committed" in log for log in result["logs"])

        # And the committed build must actually be live for combat synergy —
        # not just set and then ignored downstream.
        run2 = call(session, "create_run", ["ember_ember_sever"], 42, 1, 0, data)
        run2 = call(session, "enter_active_node", run2, ["ember_ember_sever"], data)
        run2["activeBuild"] = result["activeBuild"]
        card = next(c for c in run2["deckState"]["hand"] if c["component"] == "sever" and c["relationType"] == "same")
        turn = call(session, "resolve_combat_turn", run2, card, data)
        assert any("Escalation" in log for log in turn["nextState"]["logs"])


class TestRestCraft:
    def test_apply_rest_heals_correct_percentage(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        run["playerHp"] = 10
        rested = call(session, "apply_rest", run)
        expected_heal = int(run["playerMaxHp"] * 0.4 + 0.5)
        assert rested["playerHp"] == min(run["playerMaxHp"], 10 + expected_heal)

    def test_apply_rest_does_not_exceed_max_hp(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        run["playerHp"] = run["playerMaxHp"]
        rested = call(session, "apply_rest", run)
        assert rested["playerHp"] == run["playerMaxHp"]

    def test_apply_attachment_resolves_gift_or_treasure(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        result = call(session, "apply_attachment", run, data, True)
        assert result["lastAttachmentOutcome"] in ("gift", "treasure", "peek")

    def test_rest_or_exclusivity_enforced_in_lua(self, session, data):
        deck_ids = ["ember_none_sever"]
        run = call(session, "create_run", deck_ids, 42, 1, 0, data)
        rested = call(session, "apply_rest", run)
        assert rested["restCraftResolvedNodeId"] == rested["currentNodeId"]

        # Second call for the SAME node visit must be a real backend no-op,
        # not just a UI-level disable — HP must not change again.
        locked_attempt = call(session, "apply_attachment", rested, data, False)
        assert locked_attempt["playerHp"] == rested["playerHp"]
        assert "lastAttachmentOutcome" not in locked_attempt or locked_attempt.get("lastAttachmentOutcome") is None
        assert "already resolved" in locked_attempt["logs"][-1]

        # Attachment-first also locks out Rest for the same visit.
        run2 = call(session, "create_run", deck_ids, 43, 1, 0, data)
        run2["playerHp"] = 5
        attached = call(session, "apply_attachment", run2, data, False)
        locked_rest = call(session, "apply_rest", attached)
        assert locked_rest["playerHp"] == attached["playerHp"]
        assert "already resolved" in locked_rest["logs"][-1]


class TestCombatTurnResolution:
    def _combat_run(self, session, data, seed=42):
        deck_ids = [
            "ember_none_sever", "ash_none_mend", "spark_none_guard", "cinder_none_unmake",
            "ember_ember_sever", "ash_ash_mend", "spark_spark_guard", "cinder_cinder_unmake",
        ]
        run = call(session, "create_run", deck_ids, seed, 1, 0, data)
        return call(session, "enter_active_node", run, deck_ids, data)

    def test_combat_turn_applies_enemy_intent(self, session, data):
        run = self._combat_run(session, data)
        starting_turn = run["turnCount"]
        card = next(c for c in run["deckState"]["hand"] if c["component"] == "guard")
        result = call(session, "resolve_combat_turn", run, card, data)
        next_state = result["nextState"]
        assert next_state["turnCount"] == starting_turn + 1
        assert next_state["enemy"]["intent"] is not None
        # A guard card played into a real attack intent must show the enemy
        # having actually acted (shield reset each turn after being consumed).
        assert isinstance(next_state["playerShield"], int)
        assert any("[Enemy Turn]" in log for log in next_state["logs"])

    def test_combat_turn_detects_enemy_defeated(self, session, data):
        run = self._combat_run(session, data)
        run["enemy"]["hp"] = 1
        card = next(c for c in run["deckState"]["hand"] if c["component"] == "sever")
        result = call(session, "resolve_combat_turn", run, card, data)
        assert result["fightWon"] is True
        assert result["nextState"]["enemy"]["hp"] == 0
        assert result["nextState"]["status"] == "reward"

    def test_combat_turn_detects_player_defeated(self, session, data):
        run = self._combat_run(session, data)
        run["playerHp"] = 1
        run["enemy"]["intent"] = {"type": "attack", "value": 50, "description": "Overwhelming Strike"}
        card = next(c for c in run["deckState"]["hand"] if c["component"] == "guard")
        result = call(session, "resolve_combat_turn", run, card, data)
        assert result["fightWon"] is False
        assert result["nextState"]["status"] == "game_over"
        assert result["nextState"]["playerHp"] == 0

    def test_combat_turn_removes_played_card_from_hand(self, session, data):
        run = self._combat_run(session, data)
        card = run["deckState"]["hand"][0]
        result = call(session, "resolve_combat_turn", run, card, data)
        next_hand_ids = [c["id"] for c in result["nextState"]["deckState"]["hand"]]
        assert card["id"] not in next_hand_ids
        assert len(result["nextState"]["deckState"]["hand"]) == 5
