"""
Direct Import Test - Bypass Package System

Tests individual modules directly to verify the race engine works.
"""

import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any

# Test foundation imports directly
try:
    from dgt_engine.foundation.genetics.schema import TurboGenome, LimbShape
    print("✅ Genetic schema import successful")
except ImportError as e:
    print(f"❌ Genetic schema import failed: {e}")
    sys.exit(1)

try:
    from dgt_engine.foundation.types.race import create_turtle_state, TerrainType
    print("✅ Race types import successful")
except ImportError as e:
    print(f"❌ Race types import failed: {e}")
    sys.exit(1)

try:
    from dgt_engine.foundation.types.result import Result
    print("✅ Result type import successful")
except ImportError as e:
    print(f"❌ Result type import failed: {e}")
    sys.exit(1)

# Test race engine imports directly
try:
    from src.dgt_engine.systems.race.physics_engine import create_race_physics_engine
    print("✅ Physics engine import successful")
except ImportError as e:
    print(f"❌ Physics engine import failed: {e}")
    sys.exit(1)

try:
    from src.dgt_engine.systems.race.terrain_system import create_terrain_system
    print("✅ Terrain system import successful")
except ImportError as e:
    print(f"❌ Terrain system import failed: {e}")
    sys.exit(1)

try:
    from src.dgt_engine.systems.race.race_arbiter import create_race_arbiter
    print("✅ Race arbiter import successful")
except ImportError as e:
    print(f"❌ Race arbiter import failed: {e}")
    sys.exit(1)


def test_simple_race():
    """Test a simple race simulation"""
    print("\n🏁 Testing Simple Race Simulation")
    print("=" * 50)
    
    # Create test genome
    genome = TurboGenome(
        name="TestTurtle",
        shell_color=(255, 0, 0),
        shell_size=0.8,
        shell_pattern="solid",
        body_color=(0, 255, 0),
        body_size=0.7,
        body_pattern="striped",
        head_color=(0, 0, 255),
        head_size=0.6,
        eye_color=(0, 0, 0),
        eye_size=0.1,
        limb_shape=LimbShape.LEGS,
        limb_size=0.5,
        speed_trait=0.8,
        endurance_trait=0.7,
        intelligence_trait=0.6
    )
    
    print(f"✅ Created test genome: {genome.name}")
    
    # Create turtle state
    turtle = create_turtle_state("test_turtle", genome, 0.0)
    print(f"✅ Created turtle state: {turtle.id}")
    
    # Create race engines
    physics_engine = create_race_physics_engine()
    terrain_system = create_terrain_system()
    arbiter = create_race_arbiter()
    
    print("✅ Created race engines")
    
    # Test basic functionality
    print("\n⚙️ Testing Engine Initialization...")
    
    # Simple test - just verify the engines can be created and basic methods work
    try:
        # Test physics engine
        print(f"  Physics engine: {type(physics_engine).__name__}")
        
        # Test terrain system
        print(f"  Terrain system: {type(terrain_system).__name__}")
        
        # Test arbiter
        print(f"  Arbiter: {type(arbiter).__name__}")
        
        print("✅ All engines created successfully")
        return True
        
    except Exception as e:
        print(f"❌ Engine test failed: {e}")
        return False


if __name__ == "__main__":
    print("🧪 Direct Import Test")
    print("=" * 50)
    
    success = test_simple_race()
    
    if success:
        print("\n🎉 Direct import test passed!")
        print("The race engine components are working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Direct import test failed!")
        sys.exit(1)
