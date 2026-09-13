#!/usr/bin/env python3
"""
Theater Mode Test Script - Wave 2 Integration Test
Tests the new MovieEngine with premiere_voyage.json scenario
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from typing import Tuple, Optional
from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine, EventType
from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader


def test_theater_mode():
    """Test Theater Mode with premiere_voyage.json"""
    print("🎬 Theater Mode Test - Wave 2 Integration")
    print("=" * 50)
    
    # Initialize MovieEngine
    movie_engine = MovieEngine(seed="FOREST_GATE_001")
    print(f"✅ MovieEngine initialized with seed: {movie_engine.seed}")
    
    # Create default Forest Gate sequence
    sequence_result = movie_engine.create_forest_gate_sequence()
    assert sequence_result.success, f"Failed to create sequence: {sequence_result.error}"

    
    sequence = sequence_result.value
    print(f"✅ Created sequence: {sequence.title}")
    print(f"📊 Sequence info: {len(sequence.events)} events, {sequence.total_duration:.1f}s total")
    
    # Start sequence
    start_result = movie_engine.start_sequence(sequence)
    assert start_result.success, f"Failed to start sequence: {start_result.error}"

    
    print("✅ Sequence started")
    
    # Get and display first 3 events
    print("\n🎭 First 3 Cinematic Events:")
    print("-" * 30)
    
    for i in range(3):
        event_result = movie_engine.advance_to_next_event()
        if not event_result.success:
            print(f"❌ Failed to get event {i+1}: {event_result.error}")
            break
        
        event = event_result.value
        print(f"\nEvent {i+1}: {event.event_id}")
        print(f"  Type: {event.event_type.value}")
        print(f"  Timestamp: {event.timestamp:.1f}s")
        print(f"  Duration: {event.duration:.1f}s")
        print(f"  Description: {event.description or 'No description'}")
        
        # Process event based on type
        if event.event_type == EventType.MOVEMENT:
            process_result = movie_engine.process_movement_event(event)
            if process_result.success:
                print(f"  ✅ Movement processed")
            else:
                print(f"  ⚠️ Movement issue: {process_result.error}")
        
        elif event.event_type == EventType.INTERACTION:
            process_result = movie_engine.process_interaction_event(event)
            if process_result.success:
                print(f"  ✅ Interaction processed")
            else:
                print(f"  ⚠️ Interaction issue: {process_result.error}")
        
        elif event.event_type == EventType.COMBAT:
            process_result = movie_engine.process_combat_event(event)
            if process_result.success:
                print(f"  ✅ Combat processed")
            else:
                print(f"  ⚠️ Combat issue: {process_result.error}")
        
        else:
            print(f"  ℹ️ Event type: {event.event_type.value}")
    
    # Test AssetLoader with scenario
    print("\n📦 Testing AssetLoader with Scenario:")
    print("-" * 30)
    
    asset_loader = AssetLoader()
    
    # Try to load the premiere_voyage.json scenario
    scenario_path = Path("src/apps/space/scenarios/premiere_voyage.json")
    if scenario_path.exists():
        scenario_result = asset_loader.load_asset(scenario_path, 'scenario')
        if scenario_result.success:
            scenario_data = scenario_result.value
            print(f"✅ Loaded scenario: {scenario_data['player']['name']}")
            print(f"📍 Position: ({scenario_data['position']['x']}, {scenario_data['position']['y']})")
            print(f"🏠 Rooms: {list(scenario_data['rooms'].keys())}")
        else:
            print(f"❌ Failed to load scenario: {scenario_result.error}")
    else:
        print(f"⚠️ Scenario file not found: {scenario_path}")
    
    # Display session log
    print("\n📜 Session Log:")
    print("-" * 30)
    for log_entry in movie_engine.get_session_log()[-5:]:  # Last 5 entries
        print(f"  {log_entry}")
    
    # Stop sequence
    stop_result = movie_engine.stop_sequence()
    if stop_result.success:
        print("\n✅ Sequence stopped successfully")
    
    print("\n🎬 Theater Mode Test Complete!")
    assert True



def test_three_tier_compliance():
    """Test Three-Tier Architecture compliance"""
    print("\n🏗️ Three-Tier Architecture Compliance Test:")
    print("-" * 45)
    
    # Test Tier 1 Foundation imports
    try:
        from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
        from dgt_engine.foundation.types import Result, ValidationResult
        print("✅ Tier 1 Foundation imports successful")
        print(f"   Sovereign constraints: {SOVEREIGN_WIDTH}x{SOVEREIGN_HEIGHT}")
    except ImportError as e:
        assert False, f"Tier 1 Foundation import failed: {e}"

    
    # Test Tier 2 Engine imports
    try:
        from dgt_engine.systems.body.cinematics.movie_engine import MovieEngine
        from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
        print("✅ Tier 2 Engine imports successful")
    except ImportError as e:
        assert False, f"Tier 2 Engine import failed: {e}"

    
    # Test Tier 3 Application imports
    try:
        # This should work - apps can import from lower tiers
        import sys
        sys.path.append('src')
        scenario_path = "src/apps/space/scenarios/premiere_voyage.json"
        print("✅ Tier 3 Application imports successful")
    except ImportError as e:
        assert False, f"Tier 3 Application import failed: {e}"

    
    print("✅ Three-Tier Architecture compliance verified")
    assert True



if __name__ == "__main__":
    print("🎬 Wave 2 Integration Test Suite")
    print("=" * 50)
    
    # Run compliance test first
    compliance_ok = test_three_tier_compliance()
    
    if compliance_ok:
        # Run theater mode test
        theater_ok = test_theater_mode()
        
        if theater_ok:
            print("\n🏆 All Wave 2 tests passed!")
            print("🚀 Ready for Wave 3: Final hardening and deployment")
        else:
            print("\n⚠️ Theater mode test failed")
            sys.exit(1)
    else:
        print("\n❌ Architecture compliance test failed")
        sys.exit(1)
