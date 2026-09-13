#!/usr/bin/env python3
"""
Phase C Verification Test

Tests that the Tier 2 Engine layer has been properly created.
Run this after Phase C to verify the engines are working.
"""

import sys


def test_engine_imports():
    """Test engine imports."""
    try:
        from game_engine.engines import (
            BaseEngine,
            D20Resolver,
            D20Result,
            ChronosEngine,
            SemanticResolver,
            NarrativeEngine,
            SyntheticRealityEngine,
        )

        print("[PASS] Engine imports work")
        return True
    except Exception as e:
        print(f"[FAIL] Engine imports: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_d20_resolver():
    """Test D20 resolver engine."""
    try:
        from game_engine.engines import D20Resolver, DifficultyClass

        print("[PASS] D20 imports work")

        # Create engine
        resolver = D20Resolver()
        assert resolver.initialize()
        print("[PASS] D20Resolver initializes")

        # Test rolling
        roll = resolver.roll_d20(modifier=2)
        assert 3 <= roll <= 22  # d20 (1-20) + modifier (2)
        print(f"[PASS] D20 roll works: {roll}")

        # Test ability check
        result = resolver.ability_check(modifier=3, difficulty_class=15)
        assert result.total_score >= 3  # At least base + modifier
        assert result.difficulty_class == 15
        print("[PASS] Ability check works")

        # Test deterministic mode
        resolver.set_deterministic_mode(True, seed=42)
        roll1 = resolver.roll_d20(modifier=0)
        resolver.set_deterministic_mode(True, seed=42)
        roll2 = resolver.roll_d20(modifier=0)
        assert roll1 == roll2  # Should be same with same seed
        print("[PASS] Deterministic mode works")

        # Shutdown
        resolver.shutdown()
        assert resolver.status.value == "stopped"
        print("[PASS] D20Resolver shutdown works")

        return True
    except Exception as e:
        print(f"[FAIL] D20Resolver tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_chronos_engine():
    """Test Chronos engine."""
    try:
        from game_engine.engines import ChronosEngine

        print("[PASS] Chronos imports work")

        # Create engine
        chronos = ChronosEngine()
        assert chronos.initialize()
        print("[PASS] ChronosEngine initializes")

        # Test time advancement
        initial_turn = chronos.world_turn
        events = chronos.advance_time(5)
        assert chronos.world_turn == initial_turn + 5
        print("[PASS] Time advancement works")

        # Test event history
        past_events = chronos.get_events_since(0)
        assert isinstance(past_events, list)
        print("[PASS] Event history works")

        # Shutdown
        chronos.shutdown()
        assert chronos.status.value == "stopped"
        print("[PASS] ChronosEngine shutdown works")

        return True
    except Exception as e:
        print(f"[FAIL] ChronosEngine tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_semantic_engine():
    """Test Semantic engine."""
    try:
        from game_engine.engines import SemanticResolver

        print("[PASS] Semantic imports work")

        # Create engine
        semantic = SemanticResolver()
        assert semantic.initialize()
        print("[PASS] SemanticResolver initializes")

        # Test basic intent processing
        result = semantic.process_intent({"action": "parse", "input": "attack goblin"})
        assert "result" in result
        print("[PASS] Semantic intent processing works")

        # Shutdown
        semantic.shutdown()
        assert semantic.status.value == "stopped"
        print("[PASS] SemanticResolver shutdown works")

        return True
    except Exception as e:
        print(f"[FAIL] SemanticResolver tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_narrative_engine():
    """Test Narrative engine."""
    try:
        from game_engine.engines import NarrativeEngine

        print("[PASS] Narrative imports work")

        # Create engine
        narrative = NarrativeEngine()
        assert narrative.initialize()
        print("[PASS] NarrativeEngine initializes")

        # Test narration
        event = {"action": "attack", "success": True}
        narration = narrative.narrate_event(event)
        assert isinstance(narration, str)
        assert len(narration) > 0
        print("[PASS] Narrative generation works")

        # Shutdown
        narrative.shutdown()
        assert narrative.status.value == "stopped"
        print("[PASS] NarrativeEngine shutdown works")

        return True
    except Exception as e:
        print(f"[FAIL] NarrativeEngine tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_synthetic_reality_engine():
    """Test Synthetic Reality Engine orchestrator."""
    try:
        from game_engine.engines import SyntheticRealityEngine

        print("[PASS] SyntheticRealityEngine imports work")

        # Create engine
        sre = SyntheticRealityEngine()
        assert sre.initialize()
        print("[PASS] SyntheticRealityEngine initializes")

        # Test subsystem registration
        from game_engine.engines import D20Resolver

        d20 = D20Resolver()
        d20.initialize()
        sre.register_subsystem("d20", d20)
        assert sre.get_subsystem("d20") is d20
        print("[PASS] Subsystem registration works")

        # Test world state
        state = sre.get_world_state()
        assert isinstance(state, dict)
        print("[PASS] World state retrieval works")

        # Test intent routing
        result = sre.process_intent({"engine": "d20", "action": "roll"})
        assert "result" in result or "error" in result
        print("[PASS] Intent routing works")

        # Shutdown
        sre.shutdown()
        assert sre.status.value == "stopped"
        print("[PASS] SyntheticRealityEngine shutdown works")

        return True
    except Exception as e:
        print(f"[FAIL] SyntheticRealityEngine tests: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all Phase C verification tests."""
    print("=" * 70)
    print("PHASE C VERIFICATION TEST")
    print("Tier 2 Engines Migration")
    print("=" * 70)
    print()

    results = []

    print("1. Testing engine imports...")
    results.append(test_engine_imports())
    print()

    print("2. Testing D20 Resolver...")
    results.append(test_d20_resolver())
    print()

    print("3. Testing Chronos Engine...")
    results.append(test_chronos_engine())
    print()

    print("4. Testing Semantic Engine...")
    results.append(test_semantic_engine())
    print()

    print("5. Testing Narrative Engine...")
    results.append(test_narrative_engine())
    print()

    print("6. Testing Synthetic Reality Engine...")
    results.append(test_synthetic_reality_engine())
    print()

    print("=" * 70)
    if all(results):
        print("PHASE C: ALL TESTS PASSED")
        print("=" * 70)
        return 0
    else:
        print("PHASE C: SOME TESTS FAILED")
        print("=" * 70)
        return 1


if __name__ == "__main__":
    sys.exit(main())
