"""
Simple Race Test - Direct Import Test

Tests the race engine components with direct imports to bypass package issues.
"""

import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any

# Direct imports to test individual components
try:
    from dgt_engine.foundation.genetics.schema import TurboGenome, LimbShape
    from dgt_engine.foundation.types.race import (
        TurtleState, RaceSnapshot, RaceConfig, TerrainType,
        create_turtle_state, create_race_snapshot, TerrainSegment
    )
    from dgt_engine.foundation.types.result import Result
    print("✅ Foundation imports successful")
except ImportError as e:
    print(f"❌ Foundation import failed: {e}")
    sys.exit(1)

# Test individual race components
try:
    from src.dgt_engine.systems.race.physics_engine import RacePhysicsEngine, create_race_physics_engine
    print("✅ Physics engine import successful")
except ImportError as e:
    print(f"❌ Physics engine import failed: {e}")
    sys.exit(1)

try:
    from src.dgt_engine.systems.race.terrain_system import TerrainSystem, create_terrain_system
    print("✅ Terrain system import successful")
except ImportError as e:
    print(f"❌ Terrain system import failed: {e}")
    sys.exit(1)

try:
    from src.dgt_engine.systems.race.race_arbiter import RaceArbiter, create_race_arbiter
    print("✅ Race arbiter import successful")
except ImportError as e:
    print(f"❌ Race arbiter import failed: {e}")
    sys.exit(1)


def create_test_genome(name: str, limb_shape: LimbShape) -> TurboGenome:
    """Create a test genome with specific traits"""
    return TurboGenome(
        name=name,
        shell_color=(255, 0, 0),  # Red
        shell_size=0.8,
        shell_pattern="solid",
        body_color=(0, 255, 0),  # Green
        body_size=0.7,
        body_pattern="striped",
        head_color=(0, 0, 255),  # Blue
        head_size=0.6,
        eye_color=(0, 0, 0),     # Black
        eye_size=0.1,
        limb_shape=limb_shape,
        limb_size=0.5,
        speed_trait=0.8,
        endurance_trait=0.7,
        intelligence_trait=0.6
    )


def test_race_components():
    """Test individual race components"""
    print("\n🏁 Testing Race Components")
    print("=" * 50)
    
    # Create test turtles
    speedster = create_test_genome("Speedster", LimbShape.LEGS)
    swimmer = create_test_genome("Swimmer", LimbShape.FLIPPERS)
    tank = create_test_genome("Tank", LimbShape.FLIPPERS)
    
    # Create turtle states
    turtles = [
        create_turtle_state("speedster", speedster, 0.0),
        create_turtle_state("swimmer", swimmer, 100.0),
        create_turtle_state("tank", tank, 200.0)
    ]
    
    print(f"✅ Created {len(turtles)} test turtles")
    
    # Test physics engine
    print("\n⚙️ Testing Physics Engine...")
    physics_engine = create_race_physics_engine()
    
    # Initialize with turtles
    race_config = RaceConfig(
        track_length=1200.0,
        max_turtles=3,
        tick_rate=30.0
    )
    
    init_result = physics_engine.initialize(turtles, race_config)
    if init_result.success:
        print("✅ Physics engine initialized")
    else:
        print(f"❌ Physics engine initialization failed: {init_result.error}")
        return False
    
    # Test terrain system
    print("\n🌍 Testing Terrain System...")
    terrain_system = create_terrain_system()
    
    # Create varied terrain
    terrain_segments = [
        TerrainSegment(0.0, 300.0, TerrainType.GRASS),
        TerrainSegment(300.0, 600.0, TerrainType.WATER),
        TerrainSegment(600.0, 900.0, TerrainType.ROCK),
        TerrainSegment(900.0, 1200.0, TerrainType.SAND)
    ]
    
    terrain_result = terrain_system.initialize(terrain_segments)
    if terrain_result.success:
        print("✅ Terrain system initialized")
    else:
        print(f"❌ Terrain system initialization failed: {terrain_result.error}")
        return False
    
    # Test race arbiter
    print("\n🏁 Testing Race Arbiter...")
    arbiter = create_race_arbiter()
    
    arbiter_result = arbiter.initialize()
    if arbiter_result.success:
        print("✅ Race arbiter initialized")
    else:
        print(f"❌ Race arbiter initialization failed: {arbiter_result.error}")
        return False
    
    # Run a simple simulation
    print("\n🏃 Running Simple Simulation...")
    tick_count = 0
    max_ticks = 300  # 10 seconds at 30Hz
    
    for tick in range(max_ticks):
        # Update physics
        physics_result = physics_engine.update(1.0 / 30.0)
        if not physics_result.success:
            print(f"❌ Physics update failed at tick {tick}: {physics_result.error}")
            return False
        
        # Update arbiter
        arbiter_result = arbiter.update(1.0 / 30.0)
        if not arbiter_result.success:
            print(f"❌ Arbiter update failed at tick {tick}: {arbiter_result.error}")
            return False
        
        # Get snapshot
        snapshot_result = physics_engine.get_race_snapshot()
        if snapshot_result.success:
            snapshot = snapshot_result.value
            tick_count = snapshot.tick
            
            # Log progress every 30 ticks
            if tick % 30 == 0:
                print(f"  Tick {tick}: Leader at {snapshot.turtles[0].x:.1f}m")
            
            # Check if race finished
            if snapshot.finished:
                print(f"✅ Race completed at tick {tick}")
                break
        else:
            print(f"❌ Failed to get snapshot at tick {tick}: {snapshot_result.error}")
            return False
    
    print(f"✅ Simulation completed: {tick_count} ticks")
    
    # Get final results
    final_snapshot = physics_engine.get_race_snapshot()
    if final_snapshot.success:
        snapshot = final_snapshot.value
        print(f"\n🏁 Final Results:")
        for i, turtle in enumerate(snapshot.turtles):
            print(f"  {i+1}. {turtle.id}: {turtle.x:.1f}m (Energy: {turtle.energy:.1f})")
    
    return True


if __name__ == "__main__":
    print("🧪 Simple Race Component Test")
    print("=" * 50)
    
    success = test_race_components()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)
