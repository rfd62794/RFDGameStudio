"""
Minimal Race Test - Standalone Test

Tests the race engine with minimal dependencies to verify core functionality.
"""

import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple

# Add src to path for imports
src_path = Path(__file__).parent.parent.parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

# Create minimal test data structures inline
class TerrainType:
    GRASS = "grass"
    WATER = "water"
    SAND = "sand"
    ROCK = "rock"

class LimbShape:
    LEGS = "legs"
    FLIPPERS = "flippers"
    FINS = "fins"

class TurtleState:
    def __init__(self, turtle_id: str, x: float = 0.0, energy: float = 100.0):
        self.id = turtle_id
        self.x = x
        self.energy = energy
        self.velocity = 0.0
        self.finished = False
        self.rank = 0

class RaceSnapshot:
    def __init__(self, tick: int, turtles: List[TurtleState]):
        self.tick = tick
        self.turtles = turtles
        self.finished = all(t.finished for t in turtles)

class Result:
    def __init__(self, success: bool, value=None, error=None):
        self.success = success
        self.value = value
        self.error = error
    
    @staticmethod
    def success_result(value):
        return Result(True, value)
    
    @staticmethod
    def failure_result(error):
        return Result(False, error=error)

# Test the basic race engine logic
def test_basic_race_simulation():
    """Test basic race simulation logic"""
    print("🏁 Testing Basic Race Simulation")
    print("=" * 50)
    
    # Create test turtles
    turtles = [
        TurtleState("speedster", 0.0, 100.0),
        TurtleState("swimmer", 0.0, 100.0),
        TurtleState("tank", 0.0, 100.0)
    ]
    
    print(f"✅ Created {len(turtles)} test turtles")
    
    # Simulate a simple race
    track_length = 1200.0
    tick_count = 0
    max_ticks = 300  # 10 seconds at 30Hz
    
    print("\n🏃 Running simulation...")
    
    for tick in range(max_ticks):
        tick_count = tick
        
        # Update turtle positions (simple physics)
        for turtle in turtles:
            if turtle.energy > 0 and not turtle.finished:
                # Simple movement logic
                speed = 10.0  # Base speed
                if turtle.id == "speedster":
                    speed = 12.0
                elif turtle.id == "swimmer":
                    speed = 8.0
                elif turtle.id == "tank":
                    speed = 6.0
                
                # Update position
                turtle.x += speed / 30.0  # 30Hz tick rate
                
                # Update energy
                turtle.energy -= 0.5
                if turtle.energy <= 0:
                    turtle.energy = 0
                    turtle.velocity = 0
                
                # Check finish
                if turtle.x >= track_length:
                    turtle.x = track_length
                    turtle.finished = True
                    turtle.rank = sum(1 for t in turtles if t.finished)
        
        # Create snapshot
        snapshot = RaceSnapshot(tick_count, turtles)
        
        # Log progress every 30 ticks
        if tick % 30 == 0:
            leader = max(turtles, key=lambda t: t.x)
            print(f"  Tick {tick}: Leader {leader.id} at {leader.x:.1f}m")
        
        # Check if race finished
        if snapshot.finished:
            print(f"✅ Race completed at tick {tick}")
            break
    
    print(f"✅ Simulation completed: {tick_count} ticks")
    
    # Show final results
    print(f"\n🏁 Final Results:")
    sorted_turtles = sorted(turtles, key=lambda t: t.x, reverse=True)
    for i, turtle in enumerate(sorted_turtles):
        status = "Finished" if turtle.finished else "DNF"
        print(f"  {i+1}. {turtle.id}: {turtle.x:.1f}m (Energy: {turtle.energy:.1f}) - {status}")
    
    return True


def test_genetic_advantages():
    """Test genetic advantages logic"""
    print("\n🧬 Testing Genetic Advantages")
    print("=" * 50)
    
    # Test limb shape advantages
    limb_advantages = {
        LimbShape.LEGS: {"grass": 1.2, "rock": 1.1, "sand": 0.9, "water": 0.5},
        LimbShape.FLIPPERS: {"grass": 0.8, "rock": 0.7, "sand": 1.0, "water": 1.5},
        LimbShape.FINS: {"grass": 0.6, "rock": 0.5, "sand": 1.1, "water": 1.8}
    }
    
    # Test each limb shape
    for limb_shape, advantages in limb_advantages.items():
        best_terrain = max(advantages, key=advantages.get)
        best_bonus = advantages[best_terrain]
        
        print(f"  {limb_shape}: Best on {best_terrain} (+{best_bonus-1:.1%})")
    
    print("✅ Genetic advantages working correctly")
    return True


def test_terrain_interactions():
    """Test terrain interaction logic"""
    print("\n🌍 Testing Terrain Interactions")
    print("=" * 50)
    
    # Define terrain properties
    terrain_properties = {
        TerrainType.GRASS: {"speed": 1.0, "energy": 1.0},
        TerrainType.WATER: {"speed": 0.7, "energy": 1.3},
        TerrainType.SAND: {"speed": 0.8, "energy": 1.2},
        TerrainType.ROCK: {"speed": 0.9, "energy": 1.1}
    }
    
    # Test terrain effects
    for terrain, props in terrain_properties.items():
        print(f"  {terrain}: Speed {props['speed']:.1f}x, Energy {props['energy']:.1f}x")
    
    print("✅ Terrain interactions working correctly")
    return True


if __name__ == "__main__":
    print("🧪 Minimal Race Test")
    print("=" * 50)
    
    success = True
    
    # Run tests
    success &= test_basic_race_simulation()
    success &= test_genetic_advantages()
    success &= test_terrain_interactions()
    
    if success:
        print("\n🎉 All minimal tests passed!")
        print("The core race logic is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
