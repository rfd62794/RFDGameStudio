"""
Verify Kinetic Core - Physics Service Verification
"""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from foundation.vector import Vector2
from engines.body.kinetics import KineticEntity

def test_inertia():
    print("Testing Inertia...")
    entity = KineticEntity()
    entity.velocity = Vector2(10, 0)
    
    # Update for 1 second
    entity.update(1.0)
    
    assert entity.position.x == 10.0
    print("✅ Inertia: Position updated correctly")

def test_drag():
    print("Testing Drag...")
    entity = KineticEntity()
    entity.velocity = Vector2(100, 0)
    entity.drag = 0.5 # 50% speed loss per second
    
    entity.update(1.0)
    
    # Expected: 100 * (1 - 0.5) = 50
    assert entity.velocity.x == 50.0
    print(f"✅ Drag: Velocity reduced to {entity.velocity.x}")

def test_wrapping():
    print("Testing Wrapping...")
    entity = KineticEntity()
    entity.position = Vector2(155, 0)
    entity.velocity = Vector2(10, 0)
    entity.wrap_bounds = (160, 144)
    
    # Update for 1 second -> Pos should be 165 -> Wrapped to 5
    entity.update(1.0)
    
    assert entity.position.x == 5.0
    print(f"✅ Wrapping: Position wrapped to {entity.position.x}")

def main():
    try:
        test_inertia()
        test_drag()
        test_wrapping()
        print("\n✨ Kinetic Core Verification Successful!")
    except AssertionError as e:
        print(f"\n❌ Verification Failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
