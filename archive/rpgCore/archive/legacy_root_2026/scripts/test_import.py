"""
Test Vector Import
"""
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))
print(f"Added {src_path} to sys.path")

try:
    from foundation.vector import Vector2
    print("✅ Successfully imported Vector2")
    v = Vector2(1, 2)
    print(f"Vector: {v}")
except Exception as e:
    print(f"❌ Failed to import Vector2: {e}")
    import traceback
    traceback.print_exc()

try:
    from engines.body.kinetics import KineticEntity
    print("✅ Successfully imported KineticEntity")
except Exception as e:
    print(f"❌ Failed to import KineticEntity: {e}")
    import traceback
    traceback.print_exc()
