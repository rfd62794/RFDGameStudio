"""Anchor tests for the Brewfield chemistry merge — elemental residue
statuses on the enemy and the 4x4 (component x element) effect matrix,
driven by data.residue.chemistry and gated behind chemistry.min_floor.

Covers the directive's required cases: residues apply / tick / expire,
element-residue interaction (fire on soaked, water on burning), the six
advanced effects in isolation, and the additive guarantee that existing
cards resolve identically."""
from __future__ import annotations

import copy

import pytest

from studio.runtime import call, load_game


@pytest.fixture(scope="module")
def session():
    return load_game("dissonance", seed=42)


@pytest.fixture(scope="module")
def data(session):
    return session.files.data


@pytest.fixture()
def data_fx(data):
    """Chemistry data with the residue statuses stripped — matrix cells and
    the floor gate still work, but nothing deposits/ticks, so each advanced
    effect can be observed in true isolation."""
    d = copy.deepcopy(data)
    d["residue"]["chemistry"]["statuses"] = {}
    return d


def _combat_run(session, data, deck_ids, seed=42, floor=4):
    run = call(session, "create_run", deck_ids, seed, floor, 0, data)
    return call(session, "enter_active_node", run, deck_ids, data)


def _hand_card(run, el1=None, component=None, card_id=None):
    for c in run["deckState"]["hand"]:
        if card_id is not None and c["cardId"] != card_id:
            continue
        if el1 is not None and c["el1"] != el1:
            continue
        if component is not None and c["component"] != component:
            continue
        return c
    raise AssertionError("no matching card in hand")


def _tags(enemy):
    return [r["tag"] for r in (enemy.get("residues") or [])]


def _tank(run, hp=30):
    """Give the spawned basic enemy enough HP to survive a full turn of
    sever + residue ticks so residue state remains observable."""
    run["enemy"]["hp"] = hp
    run["enemy"]["maxHp"] = hp


class TestResidues:
    def test_burning_applies_ticks_and_expires(self, session, data):
        deck = ["ember_none_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        _tank(run)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}

        card = _hand_card(run, el1="ember", component="sever")
        hp_before = run["enemy"]["hp"]
        turn = call(session, "resolve_combat_turn", run, card, data)
        state = turn["nextState"]

        # Applied + ticked this turn; duration 2 means one turn remains.
        # ember sever: base 6 + ember modifier 2 = 8, single x1.0.
        assert "burning" in _tags(state["enemy"])
        burning = next(r for r in state["enemy"]["residues"] if r["tag"] == "burning")
        assert burning["level"] == 1
        assert burning["turnsLeft"] == 1
        assert state["enemy"]["hp"] == hp_before - 8 - 2  # sever + burning tick
        assert any("BURNING" in log for log in state["logs"])

        # Second turn: ticks once more, then expires.
        card2 = _hand_card(state, el1="cinder", component="mend")
        hp_before2 = state["enemy"]["hp"]
        turn2 = call(session, "resolve_combat_turn", state, card2, data)
        state2 = turn2["nextState"]
        assert "burning" not in _tags(state2["enemy"])
        assert state2["enemy"]["hp"] == hp_before2 - 2
        assert any("BURNING" in log and "expired" in log for log in state2["logs"])

    def test_soaked_reduces_next_attack_intent(self, session, data):
        deck = ["ember_spark_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        _tank(run)
        run["enemy"]["name"] = "Ashling"
        run["enemy"]["intent"] = {"type": "shield", "value": 3, "description": "Idle"}
        run["enemy"]["residues"] = [{"tag": "soaked", "level": 2, "turnsLeft": 2}]

        # Opposed-relation card deposits nothing — soaked alone bites.
        # Ashling's turn-2 intent is Flame Leap (5 Dmg attack) -> 5 - 2 = 3.
        card = _hand_card(run, card_id="ember_spark_sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        intent = turn["nextState"]["enemy"]["intent"]
        assert intent["type"] == "attack"
        assert intent["value"] == 3
        assert any("weakened" in log for log in turn["nextState"]["logs"])

    def test_windswept_amplifies_other_residue_ticks(self, session, data):
        deck = ["ember_spark_mend", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        _tank(run)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [
            {"tag": "burning", "level": 2, "turnsLeft": 2},
            {"tag": "windswept", "level": 1, "turnsLeft": 2},
        ]
        # Opposed-relation card: deposits nothing, so both residues persist.
        card = _hand_card(run, card_id="ember_spark_mend")
        hp_before = run["enemy"]["hp"]
        turn = call(session, "resolve_combat_turn", run, card, data)
        # burning L2 x 2 x windswept factor 2 = 8 damage; mend hurts nothing.
        assert turn["nextState"]["enemy"]["hp"] == hp_before - 8

    def test_fortified_grants_carried_shield(self, session, data):
        deck = ["ember_spark_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [{"tag": "fortified", "level": 2, "turnsLeft": 4}]
        _tank(run)
        card = _hand_card(run, card_id="ember_spark_sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        state = turn["nextState"]
        # fortified L2 carries +2 shield into the next turn.
        assert state["playerShield"] == 2
        assert _tags(state["enemy"]) == ["fortified"]

    def test_fortified_resists_overwrite_at_capacity(self, session, data):
        deck = ["ember_none_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        _tank(run)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [
            {"tag": "fortified", "level": 1, "turnsLeft": 4},
            {"tag": "windswept", "level": 1, "turnsLeft": 2},
        ]
        # Field is full (2 slots). An ember deposit must evict windswept,
        # never fortified.
        card = _hand_card(run, el1="ember", component="sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        assert _tags(turn["nextState"]["enemy"]) == ["fortified", "burning"]

    def test_fortified_absorbs_annihilation(self, session, data):
        deck = ["ash_none_sever", "ember_none_sever", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        _tank(run)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [{"tag": "fortified", "level": 2, "turnsLeft": 4}]
        # ash is opposed to cinder: the annihilation strips a level, not the tag.
        card = _hand_card(run, el1="ash", component="sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        fortified = next(r for r in turn["nextState"]["enemy"]["residues"] if r["tag"] == "fortified")
        assert fortified["level"] == 1
        assert any("absorbed the annihilation" in log for log in turn["nextState"]["logs"])

    def test_same_element_amplifies(self, session, data):
        deck = ["ember_none_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [{"tag": "burning", "level": 1, "turnsLeft": 1}]
        _tank(run)
        card = _hand_card(run, el1="ember", component="sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        burning = next(r for r in turn["nextState"]["enemy"]["residues"] if r["tag"] == "burning")
        assert burning["level"] == 2
        assert any("amplified" in log for log in turn["nextState"]["logs"])

    def test_opposed_relation_deposits_nothing(self, session, data):
        deck = ["ember_spark_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        _tank(run)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        card = _hand_card(run, card_id="ember_spark_sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        assert _tags(turn["nextState"]["enemy"]) == []


class TestResidueInteraction:
    def test_fire_card_on_soaked_target_annihilates(self, session, data):
        deck = ["ember_none_sever", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [{"tag": "soaked", "level": 2, "turnsLeft": 2}]
        _tank(run)
        card = _hand_card(run, el1="ember", component="sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        assert _tags(turn["nextState"]["enemy"]) == []
        assert any("annihilated" in log for log in turn["nextState"]["logs"])

    def test_water_card_on_burning_target_annihilates(self, session, data):
        deck = ["spark_none_sever", "ash_none_guard", "ember_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["residues"] = [{"tag": "burning", "level": 2, "turnsLeft": 2}]
        _tank(run)
        card = _hand_card(run, el1="spark", component="sever")
        turn = call(session, "resolve_combat_turn", run, card, data)
        assert _tags(turn["nextState"]["enemy"]) == []
        assert any("annihilated" in log for log in turn["nextState"]["logs"])


class TestAdvancedEffects:
    def test_retaliate_rebounds_on_enemy_attack(self, session, data_fx):
        deck = ["ember_none_guard", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["intent"] = {"type": "attack", "value": 3, "description": "Jab (3 Dmg)"}
        card = _hand_card(run, el1="ember", component="guard")
        hp_before = run["enemy"]["hp"]
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        state = turn["nextState"]
        # Guard deals no damage; the only enemy HP loss is the rebound.
        assert state["enemy"]["hp"] == hp_before - 3
        assert state["playerEffects"]["retaliate"] == 2  # 3 primed, 1 consumed
        assert any("Retaliation!" in log for log in state["logs"])

    def test_dodge_consumes_a_charge_on_attack(self, session, data_fx):
        deck = ["ash_none_guard", "ember_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_mend"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["intent"] = {"type": "attack", "value": 10, "description": "Smash (10 Dmg)"}
        card = _hand_card(run, el1="ash", component="guard")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        state = turn["nextState"]
        assert state["playerEffects"]["dodge"] == 0  # charge granted, then consumed
        dodged = any("Evasion Success" in log for log in state["logs"])
        failed = any("Evasion FAILED" in log for log in state["logs"])
        assert dodged or failed
        if dodged:
            assert state["playerHp"] == run["playerHp"]
        else:
            assert state["playerHp"] < run["playerHp"]

    def test_decaying_shield_carries_into_next_turn(self, session, data_fx):
        deck = ["cinder_none_guard", "ember_none_guard", "spark_none_mend", "ash_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        card = _hand_card(run, el1="cinder", component="guard")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        state = turn["nextState"]
        # Turn's guard shield decays; only the 4 decaying shield persists.
        assert state["playerShield"] == 4
        assert state["playerEffects"]["decayingShield"] == 0
        assert any("persists into the next turn" in log for log in state["logs"])

    def test_cauterize_cleanses_burn(self, session, data_fx):
        deck = ["ember_none_mend", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["playerEffects"] = {"retaliate": 0, "dodge": 0, "decayingShield": 0, "burn": 3}
        card = _hand_card(run, el1="ember", component="mend")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        state = turn["nextState"]
        assert state["playerEffects"]["burn"] == 0
        assert any("Cauterize" in log for log in state["logs"])

    def test_detonate_replaces_dot_and_blows_next_turn(self, session, data_fx):
        deck = ["ember_none_unmake", "ash_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["hp"] = 30
        run["enemy"]["maxHp"] = 30
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        card = _hand_card(run, el1="ember", component="unmake")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        state = turn["nextState"]
        # Fuse planted, no Void Rot DoT applied.
        assert state["enemy"].get("dot") is None
        assert state["enemy"]["fuse"] == {"damage": 8, "turnsLeft": 1}
        assert any("fuse" in log for log in state["logs"])

        card2 = _hand_card(state, el1="ash", component="guard")
        hp_before = state["enemy"]["hp"]
        turn2 = call(session, "resolve_combat_turn", state, card2, data_fx)
        state2 = turn2["nextState"]
        assert state2["enemy"].get("fuse") is None
        assert state2["enemy"]["hp"] == hp_before - 8
        assert any("detonates" in log for log in state2["logs"])

    def test_weakness_roots_next_attack_intent(self, session, data_fx):
        deck = ["cinder_none_unmake", "ash_none_guard", "spark_none_mend", "ember_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["name"] = "Ashling"
        run["enemy"]["intent"] = {"type": "shield", "value": 3, "description": "Idle"}
        card = _hand_card(run, el1="cinder", component="unmake")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        intent = turn["nextState"]["enemy"]["intent"]
        # Ashling turn-2 Flame Leap (5) rooted by 2 -> 3.
        assert intent["type"] == "attack"
        assert intent["value"] == 3
        assert any("Root" in log for log in turn["nextState"]["logs"])

    def test_slow_reduces_next_attack_intent(self, session, data_fx):
        deck = ["spark_none_sever", "ash_none_guard", "ember_none_mend", "cinder_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["name"] = "Ashling"
        run["enemy"]["intent"] = {"type": "shield", "value": 3, "description": "Idle"}
        card = _hand_card(run, el1="spark", component="sever")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        intent = turn["nextState"]["enemy"]["intent"]
        # Ashling turn-2 Flame Leap (5) slowed by 3 -> 2.
        assert intent["type"] == "attack"
        assert intent["value"] == 2

    def test_strip_enemy_shield_clears_wards(self, session, data_fx):
        deck = ["spark_none_unmake", "ash_none_guard", "ember_none_mend", "cinder_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        run["enemy"]["shield"] = 7
        card = _hand_card(run, el1="spark", component="unmake")
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        assert turn["nextState"]["enemy"]["shield"] == 0
        assert any("Strip" in log for log in turn["nextState"]["logs"])

    def test_ticks_active_dots_forces_immediate_dot(self, session, data_fx):
        deck = ["ash_none_unmake", "ember_none_guard", "spark_none_mend", "cinder_none_mend", "ash_none_sever"]
        run = _combat_run(session, data_fx, deck)
        _tank(run)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        card = _hand_card(run, el1="ash", component="unmake")
        hp_before = run["enemy"]["hp"]
        turn = call(session, "resolve_combat_turn", run, card, data_fx)
        state = turn["nextState"]
        # ash unmake: base 3 + ash unmake modifier 2 = 5; immediate tick + the
        # scheduled end-of-turn tick = 10 total, no sever damage involved.
        assert state["enemy"]["hp"] == hp_before - 10
        assert any("ticks immediately" in log for log in state["logs"])


class TestAdditiveGuarantee:
    def test_resolve_combination_output_unchanged(self, session):
        # Pre-change known values for representative cards.
        r = call(session, "resolve_combination", "ember", None, "sever", 42)
        assert r["baseValue"] == 8 and r["modifiedValue"] == 8
        assert r["relationType"] == "single" and r["multiplier"] == 1.0
        assert r.get("bonusEffect") is None

        r = call(session, "resolve_combination", "ash", "ash", "sever", 42)
        assert r["baseValue"] == 6 and r["modifiedValue"] == 9
        assert r["relationType"] == "same" and r["multiplier"] == 1.5

        r = call(session, "resolve_combination", "ember", "ash", "guard", 42)
        assert r["relationType"] == "adjacent" and r["multiplier"] == 1.0
        assert r["bonusEffect"] == {"type": "shield", "value": 2}

        # Opposed roll is the same LCG off the seed — replicate it.
        seed = 42
        roll = ((seed * 1103515245 + 12345) % 2147483648) / 2147483648
        expected_mult = 1.5 if roll < 0.5 else 0.5
        r = call(session, "resolve_combination", "ember", "spark", "sever", seed)
        assert r["relationType"] == "opposed" and r["multiplier"] == expected_mult

        # No chemistry fields leak into the combination result.
        assert "residues" not in r and "fuse" not in r

    def test_floor1_combat_is_identical_to_before(self, session, data):
        deck = ["spark_none_guard", "ash_none_mend", "ember_none_sever", "cinder_none_unmake", "ember_ember_sever"]
        run = _combat_run(session, data, deck, floor=1)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}

        # Guard card: shield granted mid-turn then resets to 0, as before.
        card = _hand_card(run, el1="spark", component="guard")
        hp_before = run["enemy"]["hp"]
        turn = call(session, "resolve_combat_turn", run, card, data)
        state = turn["nextState"]
        assert state["enemy"]["hp"] == hp_before
        assert state["playerShield"] == 0
        assert not state["enemy"].get("residues")
        assert state["enemy"].get("fuse") is None
        assert not any("[Residue]" in log or "aspect" in log or "fuse" in log for log in state["logs"])

        # Sever card: unchanged damage output, no chemistry artefacts.
        run2 = _combat_run(session, data, deck, floor=1)
        run2["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        card2 = _hand_card(run2, card_id="ember_none_sever")
        turn2 = call(session, "resolve_combat_turn", run2, card2, data)
        assert turn2["nextState"]["enemy"]["hp"] == run2["enemy"]["hp"] - 8

    def test_unmake_still_applies_void_rot_below_gate(self, session, data):
        deck = ["cinder_none_unmake", "ash_none_mend", "spark_none_guard", "ember_none_sever", "ember_ember_sever"]
        run = _combat_run(session, data, deck, floor=1)
        run["enemy"]["intent"] = {"type": "shield", "value": 5, "description": "Idle"}
        card = _hand_card(run, component="unmake")
        turn = call(session, "resolve_combat_turn", run, card, data)
        state = turn["nextState"]
        # cinder_none_unmake: base 3 + cinder mod 1 = 4, single x1.0. The DoT
        # ticks once at end of turn, decrementing its duration as before.
        assert state["enemy"]["dot"] == {"duration": 1, "damage": 4}
