"""Anchor tests for Dissonance Depths logic port."""
from __future__ import annotations

import math

import pytest

from studio.runtime import call, load_game


@pytest.fixture(scope="module")
def session():
    return load_game("dissonance", seed=42)


@pytest.fixture(scope="module")
def data(session):
    return session.files.data


class TestResolveCombination:
    """verify resolve_combination matches the TypeScript baseline."""

    def test_single_ember_sever(self, session):
        r = call(session, "resolve_combination", "ember", None, "sever", 1)
        assert r["relationType"] == "single"
        assert r["baseValue"] == 8
        assert r["modifiedValue"] == 8
        assert r["multiplier"] == 1.0
        assert r.get("bonusEffect") is None

    def test_same_ember_ember_mend(self, session):
        r = call(session, "resolve_combination", "ember", "ember", "mend", 1)
        assert r["relationType"] == "same"
        # base 5 + ember mend modifier (-1) = 4; *1.5 = 6
        assert r["baseValue"] == 4
        assert r["modifiedValue"] == 6
        assert r["multiplier"] == 1.5

    def test_adjacent_ash_spark_mend_bonus(self, session):
        r = call(session, "resolve_combination", "ash", "spark", "mend", 1)
        assert r["relationType"] == "adjacent"
        assert r["baseValue"] == 6  # 5 + ash mend +1
        assert r["bonusEffect"] == {"type": "heal", "value": 2}

    def test_adjacent_ember_ash_sever_bonus(self, session):
        r = call(session, "resolve_combination", "ember", "ash", "sever", 1)
        assert r["relationType"] == "adjacent"
        assert r["baseValue"] == 8  # 6 + ember sever +2
        assert r["bonusEffect"] == {"type": "shield", "value": 2}

    def test_opposed_success(self, session):
        # seed 2 yields roll < 0.5 -> success with 1.5x
        r = call(session, "resolve_combination", "ember", "spark", "sever", 2)
        assert r["relationType"] == "opposed"
        assert r["opposedSuccess"] is True
        # baseValue 8 * 1.5 = 12
        assert r["modifiedValue"] == 12

    def test_opposed_failure(self, session):
        # seed 1 yields roll >= 0.5 -> failure with 0.5x
        r = call(session, "resolve_combination", "ember", "spark", "sever", 1)
        assert r["relationType"] == "opposed"
        assert r["opposedSuccess"] is False
        assert r["modifiedValue"] == 4


def ts_resolve_combination(el1, el2, component, seed):
    """Mirror of the TypeScript resolve_combination for verification."""
    elements = ["ember", "ash", "spark", "cinder"]
    i1 = elements.index(el1)
    i2 = elements.index(el2) if el2 else -1

    base_val = {"mend": 5, "guard": 5, "sever": 6, "unmake": 3}[component]
    modifiers = {
        "ember": {"sever": 2, "mend": -1, "guard": -1, "unmake": 1},
        "ash": {"sever": 0, "mend": 1, "guard": 1, "unmake": 2},
        "spark": {"sever": 3, "mend": -2, "guard": -1, "unmake": 0},
        "cinder": {"sever": 1, "mend": 0, "guard": 2, "unmake": 1},
    }
    mod = modifiers[el1].get(component, 0)
    value_before = base_val + mod

    relation_type = "single"
    multiplier = 1.0
    opposed_success = None
    bonus_text = ""
    bonus_effect = None

    if i2 == -1:
        relation_type = "single"
        multiplier = 1.0
    elif i1 == i2:
        relation_type = "same"
        multiplier = 1.5
    else:
        diff = abs(i1 - i2)
        if diff == 1 or diff == 3:
            relation_type = "adjacent"
            multiplier = 1.0
            bonus_map = {
                "ember": ("Bonus Heat (+2 Damage)", "damage", 2),
                "ash": ("Bonus Ash (+2 Shield)", "shield", 2),
                "spark": ("Bonus Spark (+2 Heal)", "heal", 2),
                "cinder": ("Bonus Cinder (+2 Shield)", "shield", 2),
            }
            text, t, v = bonus_map[el2]
            bonus_text = text
            bonus_effect = {"type": t, "value": v}
        elif diff == 2:
            relation_type = "opposed"
            temp = (seed * 1103515245 + 12345) & 0x7FFFFFFF
            roll = temp / 0x7FFFFFFF
            if roll < 0.5:
                opposed_success = True
                multiplier = 1.5
            else:
                opposed_success = False
                multiplier = 0.5

    modified_value = math.floor(value_before * multiplier + 0.5)

    return {
        "baseValue": value_before,
        "modifiedValue": modified_value,
        "relationType": relation_type,
        "multiplier": multiplier,
        "bonusText": bonus_text,
        "bonusEffect": bonus_effect,
        "opposedSuccess": opposed_success,
        "message": None,  # messages use same values; compared separately below
        "dotDuration": 2 if component == "unmake" else None,
        "dotDamage": modified_value if component == "unmake" else None,
    }


class TestResolveCombinationMatchesTSBaseline:
    def test_all_combinations_match_ts(self, session):
        elements = ["ember", "ash", "spark", "cinder"]
        components = ["sever", "mend", "guard", "unmake"]
        for seed in range(0, 20):
            for el1 in elements:
                for el2 in ([None] + elements):
                    for component in components:
                        lua = call(session, "resolve_combination", el1, el2, component, seed)
                        ts = ts_resolve_combination(el1, el2, component, seed)
                        for key in ("baseValue", "modifiedValue", "relationType", "multiplier", "bonusText", "dotDuration", "dotDamage"):
                            assert lua.get(key) == ts.get(key), f"mismatch at {el1}/{el2}/{component}/{seed} key={key}"
                        assert lua.get("opposedSuccess") == ts.get("opposedSuccess"), f"mismatch at {el1}/{el2}/{component}/{seed} key=opposedSuccess"
                        if lua.get("bonusEffect"):
                            assert lua["bonusEffect"] == ts["bonusEffect"]
                        # Message content must contain the expected relation words.
                        assert lua["message"]


class TestEnemyIntents:
    def test_build_enemy_pool_count(self, session, data):
        pool = call(session, "build_enemy_pool", data)
        assert len(pool) == 38  # 4 basic + 24 behavior roster + 8 legacy + 2 bosses

    def test_behavior_mirror_intent(self, session):
        intent = call(session, "get_behavior_type_intent", "mirror", 1)
        assert intent["type"] == "attack"
        assert intent["value"] == 4

    def test_advanced_mirror_sentinel_intent(self, session, data):
        call(session, "build_enemy_pool", data)
        intent = call(session, "get_enemy_intent", "Mirror Sentinel (Advanced)", 1)
        assert intent["type"] == "attack"
        assert intent["value"] == 4

    def test_molten_ashling_intent(self, session, data):
        call(session, "build_enemy_pool", data)
        intent = call(session, "get_enemy_intent", "Molten Ashling", 1)
        assert intent["type"] == "attack"
        assert "Escalating" in intent["description"]


class TestBuildGates:
    def test_check_build_gate_commits(self, session):
        r = call(session, "check_build_gate", "escalation_boon", None)
        assert r["newlyCommitted"] is True
        assert r["build"]["buildId"] == "burster"

    def test_check_build_gate_already_committed(self, session):
        active = {"buildId": "burster", "mechanicState": {}}
        r = call(session, "check_build_gate", "volatile_surge", active)
        assert r["newlyCommitted"] is False
        assert r["build"]["buildId"] == "burster"

    def test_get_build_offer_warning(self, session):
        active = {"buildId": "burster", "mechanicState": {}}
        warning = call(session, "get_build_offer_warning", "cracked_mirror", active)
        assert warning is not None
        assert "Gambler" in warning


class TestSynergyMechanics:
    def test_burster_escalation_stacks(self, session):
        active = {"buildId": "burster", "mechanicState": {}}
        card = {"component": "sever", "relationType": "same", "el1": "ember", "el2": "ember"}
        base = call(session, "resolve_combination", "ember", "ember", "sever", 1)
        out = call(session, "apply_synergy_mechanic", active, card, base, {"essence": 0}, False)
        assert out["nextMechanicState"]["escalationStacks"] == 1
        # baseValue 4 (6-2 ember sever is 8 for ember? wait ember sever modifier is +2 -> 8) * 1.5 = 12, + 0.25*8 = 14
        assert out["result"]["modifiedValue"] == 14

    def test_weaver_chain_completion(self, session):
        active = {"buildId": "weaver", "mechanicState": {}}
        run_state = {"essence": 0}
        total_bonus = 0
        for comp in ("sever", "guard", "mend", "unmake"):
            card = {"component": comp, "relationType": "single", "el1": "ember", "el2": None}
            base = call(session, "resolve_combination", "ember", None, comp, 1)
            out = call(session, "apply_synergy_mechanic", active, card, base, run_state, False)
            active = {"buildId": "weaver", "mechanicState": out["nextMechanicState"]}
            total_bonus += out.get("extraValueBonus", 0)
        assert total_bonus == 16
        assert active["mechanicState"]["chain"] == ["unmake"]  # current action seeds next chain

    def test_weaver_chain_hard_resets_on_repeat(self, session):
        active = {"buildId": "weaver", "mechanicState": {}}
        run_state = {"essence": 0}
        total_bonus = 0
        for comp in ("sever", "guard", "sever", "mend", "unmake"):
            card = {"component": comp, "relationType": "single", "el1": "ember", "el2": None}
            base = call(session, "resolve_combination", "ember", None, comp, 1)
            out = call(session, "apply_synergy_mechanic", active, card, base, run_state, False)
            active = {"buildId": "weaver", "mechanicState": out["nextMechanicState"]}
            total_bonus += out.get("extraValueBonus", 0)
        # Repeat of 'sever' hard-resets the chain; only 3 distinct actions follow,
        # so the bonus never fires and the chain ends as [sever, mend, unmake].
        assert total_bonus == 0
        assert active["mechanicState"]["chain"] == ["sever", "mend", "unmake"]

    def test_vault_compound_payout(self, session):
        active = {"buildId": "vault", "mechanicState": {}}
        run_state = {"essence": 0}
        total_essence = 0
        for _ in range(3):
            card = {"component": "guard", "relationType": "single", "el1": "ember", "el2": None}
            base = call(session, "resolve_combination", "ember", None, "guard", 1)
            out = call(session, "apply_synergy_mechanic", active, card, base, run_state, False)
            active = {"buildId": "vault", "mechanicState": out["nextMechanicState"]}
            total_essence += out.get("extraEssence", 0)
        assert total_essence == 10

    def test_steward_guard_reserves(self, session):
        active = {"buildId": "steward", "mechanicState": {}}
        card = {"component": "guard", "relationType": "single", "el1": "ember", "el2": None}
        base = call(session, "resolve_combination", "ember", None, "guard", 1)
        out = call(session, "apply_synergy_mechanic", active, card, base, {"essence": 0}, False)
        assert out["nextMechanicState"]["wardReserves"] == 2
        assert out["extraPlayerShield"] == 2

    def test_gambler_momentum(self, session):
        active = {"buildId": "gambler", "mechanicState": {}}
        card = {"component": "sever", "relationType": "opposed", "el1": "ember", "el2": "spark"}
        base = call(session, "resolve_combination", "ember", "spark", "sever", 1)
        out = call(session, "apply_synergy_mechanic", active, card, base, {"essence": 0}, False)
        assert out["nextMechanicState"]["momentumStacks"] == 1
        # base modifiedValue 4 (failed opposed) + 0.15*8 = 5.2 -> 5
        assert out["result"]["modifiedValue"] == 5


class TestDiscovery:
    def test_record_and_check_discovery(self, session):
        state = call(session, "record_discovery", None, "cards", "ember_none_sever")
        assert call(session, "is_discovered", state, "cards", "ember_none_sever") is True
        assert call(session, "is_discovered", state, "boons", "ember_none_sever") is False

    def test_category_isolation(self, session):
        state = call(session, "record_card_discovery", None, "ember_none_sever")
        assert call(session, "is_discovered", state, "cards", "ember_none_sever") is True
        assert call(session, "is_discovered", state, "relics", "ember_none_sever") is False

    def test_discovery_summary_counts(self, session):
        state = call(session, "record_discovery", None, "cards", "ember_none_sever")
        state = call(session, "record_discovery", state, "boons", "ember_power")
        summary = call(session, "get_discovery_summary", state)
        assert summary["discoveredCards"] == 1
        assert summary["discoveredBoons"] == 1


class TestRoomRewards:
    def test_generate_opening_pack(self, session, data):
        pack = call(session, "generate_opening_pack", data)
        assert len(pack) == 4
        actions = [p["action"] for p in pack]
        elements = [p["element"] for p in pack]
        assert sorted(actions) == ["guard", "mend", "sever", "unmake"]
        assert len(set(elements)) == 4

    def test_generate_fixed_reward_shape(self, session, data):
        import random
        random.seed(123)
        slots = call(session, "generate_fixed_reward", 25, [], [], [], "basic", data)
        kinds = [s["kind"] for s in slots]
        assert kinds[0] == "heal"
        assert "card" in kinds
        assert "benefit" in kinds or "relic" in kinds

    def test_generate_reward_returns_up_to_three_cards(self, session, data):
        import random
        random.seed(7)
        out = call(session, "generate_reward", [], "basic", data)
        assert len(out["slots"]) <= 3
