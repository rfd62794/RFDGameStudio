#!/usr/bin/env python3
"""
Sub-Stepping Compatibility Test
Tests 30Hz to 60Hz sub-stepping engine compatibility
"""

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

from engines.body.systems.sub_stepping_engine import test_sub_stepping_compatibility, create_sub_stepping_engine


def test_sub_stepping():
    """Test sub-stepping engine compatibility"""
    print("⚡ Testing 30Hz to 60Hz Sub-Stepping Compatibility")
    print("=" * 55)
    
    # Run compatibility test
    result = test_sub_stepping_compatibility()
    
    if result.success:
        print("✅ Sub-stepping compatibility test PASSED")
        print("   - 30Hz physics preserved")
        print("   - 60Hz rendering smooth")
        print("   - Deterministic timing maintained")
        
        # Test timing info
        engine = create_sub_stepping_engine()
        timing = engine.get_timing_info()
        
        print(f"\n📊 Engine Configuration:")
        print(f"   Target Tick Rate: {timing['target_tick_rate']}Hz")
        print(f"   Render FPS: {timing['render_fps']}Hz")
        print(f"   Sub-step Ratio: {timing['sub_step_ratio']}")
        print(f"   Physics Delta: {timing['physics_dt']:.4f}s")
        
        return True
    else:
        print(f"❌ Sub-stepping compatibility test FAILED")
        print(f"   Error: {result.error}")
        return False


if __name__ == "__main__":
    success = test_sub_stepping()
    sys.exit(0 if success else 1)
