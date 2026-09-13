#!/usr/bin/env python3
"""
Debug Import Issues

Test script to isolate and identify import problems
"""

import sys
from pathlib import Path

# Add src to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "src"))

print("🔍 Debugging import issues...")
print(f"Project root: {project_root}")
print(f"Python path: {sys.path[:3]}...")

# Test basic imports
try:
    print("\n1. Testing basic imports...")
    from src.engines.space.vector2 import Vector2
    print("✅ Vector2 import successful")
except ImportError as e:
    print(f"❌ Vector2 import failed: {e}")

try:
    from src.engines.space.space_entity import SpaceEntity, EntityType
    print("✅ SpaceEntity import successful")
except ImportError as e:
    print(f"❌ SpaceEntity import failed: {e}")

# Test constants import
try:
    print("\n2. Testing constants import...")
    from src.dgt_core.kernel.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
    print(f"✅ Constants import successful: {SOVEREIGN_WIDTH}x{SOVEREIGN_HEIGHT}")
except ImportError as e:
    print(f"❌ Constants import failed: {e}")

# Test alternative constants
try:
    print("\n3. Testing alternative constants...")
    SOVEREIGN_WIDTH = 160
    SOVEREIGN_HEIGHT = 144
    print(f"✅ Using hardcoded constants: {SOVEREIGN_WIDTH}x{SOVEREIGN_HEIGHT}")
except Exception as e:
    print(f"❌ Hardcoded constants failed: {e}")

# Test scrap entity with hardcoded constants
try:
    print("\n4. Testing scrap entity with hardcoded constants...")
    
    # Define constants locally
    SOVEREIGN_WIDTH = 160
    SOVEREIGN_HEIGHT = 144
    
    # Import scrap entity
    from src.engines.space.scrap_entity import ScrapEntity, ScrapType
    from src.engines.space.vector2 import Vector2
    
    # Create a scrap entity
    scrap = ScrapEntity(Vector2(80, 72))
    print(f"✅ ScrapEntity creation successful: {scrap.scrap_type}, value={scrap.scrap_value}")
    
except ImportError as e:
    print(f"❌ ScrapEntity import failed: {e}")
except Exception as e:
    print(f"❌ ScrapEntity creation failed: {e}")

print("\n🔍 Debug complete")
