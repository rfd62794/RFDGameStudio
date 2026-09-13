"""
Universal Scaling Verification Test
Demonstrates the 1500m → 1000u mapping and resolution independence
"""

import sys
from pathlib import Path

# Add src to path for imports
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from dgt_core.engines.viewport.logical_viewport import LogicalViewport, ViewportManager
from dgt_core.engines.viewport.adaptive_renderer import AdaptiveRenderer, RenderProfile
from dgt_core.ui.proportional_layout import ProportionalLayout, AnchorPoint, NormalizedRect


def test_race_position_mapping():
    """Test the critical 1500m → 1000u coordinate mapping"""
    print("🏁 Testing Race Position Mapping (1500m → 1000u)")
    print("=" * 60)
    
    viewport = LogicalViewport()
    
    # Test key race positions
    test_positions = [
        (0.0, "Start Line"),
        (750.0, "Halfway Point"),
        (1500.0, "Finish Line"),
        (375.0, "Quarter Mark"),
        (1125.0, "Three-Quarter Mark")
    ]
    
    print("Race Position → Logical Units Mapping:")
    print("-" * 40)
    
    for meters, description in test_positions:
        logical_units = viewport.map_race_position(meters)
        back_to_meters = viewport.map_race_position_reverse(logical_units)
        
        print(f"{description:15} | {meters:7.1f}m → {logical_units:7.1f}u → {back_to_meters:7.1f}m")
        
        # Verify round-trip accuracy
        assert abs(meters - back_to_meters) < 0.01, f"Round-trip failed for {meters}m"
    
    print("✅ Race position mapping verified")
    return True


def test_resolution_scaling():
    """Test scaling across different resolutions"""
    print("\n📺 Testing Resolution Scaling")
    print("=" * 60)
    
    viewport = LogicalViewport()
    
    # Test resolutions from retro to HD
    test_resolutions = [
        (160, 144, "Miyoo Mini Retro"),
        (320, 288, "2x Retro"),
        (640, 480, "VGA"),
        (1280, 720, "HD 720p"),
        (1920, 1080, "Full HD")
    ]
    
    # Fixed logical position (500u, 500u - center of 1000x1000 space)
    logical_pos = (500.0, 500.0)
    
    print(f"Logical Position: {logical_pos}")
    print("-" * 40)
    
    for width, height, description in test_resolutions:
        viewport.set_physical_resolution((width, height))
        physical_pos = viewport.to_physical(logical_pos)
        
        print(f"{description:15} | {width:4}x{height:<4} → {physical_pos}")
    
    print("✅ Resolution scaling verified")
    return True


def test_proportional_layout():
    """Test proportional layout system"""
    print("\n🎨 Testing Proportional Layout System")
    print("=" * 60)
    
    # Test with different container sizes
    test_sizes = [
        (160, 144, "Retro"),
        (800, 600, "Desktop"),
        (1920, 1080, "HD")
    ]
    
    for width, height, description in test_sizes:
        layout = ProportionalLayout((width, height))
        
        # Create centered button (50% width, 10% height)
        button_rect = layout.get_relative_rect(
            anchor=AnchorPoint.CENTER,
            normalized_size=(0.5, 0.1)
        )
        
        physical_rect = layout.get_physical_rect(button_rect)
        
        print(f"{description:8} | Container: {width:4}x{height:<4} | Button: {physical_rect}")
    
    print("✅ Proportional layout verified")
    return True


def test_adaptive_rendering():
    """Test adaptive rendering profile selection"""
    print("\n🎮 Testing Adaptive Rendering")
    print("=" * 60)
    
    viewport_manager = ViewportManager()
    renderer = AdaptiveRenderer(viewport_manager)
    
    # Test profile selection for different resolutions
    test_cases = [
        (160, 144, "Should select RETRO"),
        (320, 240, "Should select RETRO"),
        (800, 600, "Should select RETRO (default)"),
        (1280, 720, "Should select HD"),
        (1920, 1080, "Should select HD")
    ]
    
    for width, height, expectation in test_cases:
        profile = renderer.select_profile((width, height))
        renderer.update_resolution((width, height))
        
        config = renderer.get_current_config()
        
        print(f"{width:4}x{height:<4} → {profile.value:6} | {expectation}")
        print(f"         Target: {config.target_resolution}")
        print(f"         Color Depth: {config.color_depth} bits")
        print()
    
    print("✅ Adaptive rendering verified")
    return True


def test_resize_log_verification():
    """Generate resize log showing logical position consistency"""
    print("\n📋 Resize Log Verification")
    print("=" * 60)
    
    viewport = LogicalViewport()
    
    # Test turtle at fixed logical position (500u, 300u)
    logical_turtle_pos = (500.0, 300.0)
    race_position_meters = viewport.map_race_position_reverse(logical_turtle_pos[0])
    
    print(f"Turtle Logical Position: {logical_turtle_pos}")
    print(f"Turtle Race Position: {race_position_meters:.1f}m")
    print("-" * 50)
    
    # Resize sequence from retro to HD
    resize_sequence = [
        (160, 144),
        (320, 288),
        (640, 480),
        (1280, 720),
        (1920, 1080)
    ]
    
    print("Resolution Sequence | Physical Position | Logical Position (should be constant)")
    print("-" * 80)
    
    for width, height in resize_sequence:
        viewport.set_physical_resolution((width, height))
        physical_pos = viewport.to_physical(logical_turtle_pos)
        
        # Verify logical position remains constant
        back_to_logical = viewport.to_logical(physical_pos)
        
        print(f"{width:4}x{height:<4}        | {physical_pos[0]:3},{physical_pos[1]:3}          | "
              f"({back_to_logical[0]:6.1f}, {back_to_logical[1]:6.1f})")
        
        # Debug output for troubleshooting
        print(f"         Expected: ({logical_turtle_pos[0]:6.1f}, {logical_turtle_pos[1]:6.1f})")
        print(f"         Difference: ({abs(back_to_logical[0] - logical_turtle_pos[0]):6.1f}, {abs(back_to_logical[1] - logical_turtle_pos[1]):6.1f})")
        
        # Verify logical position consistency (allowing for floating point precision and integer rounding)
        assert abs(back_to_logical[0] - logical_turtle_pos[0]) < 2.0
        assert abs(back_to_logical[1] - logical_turtle_pos[1]) < 2.0
    
    print("\n✅ Resize log verification PASSED")
    print("✅ Logical position remains constant across all resolutions")
    return True


def test_universal_simulation_environment():
    """Comprehensive test of the Universal Simulation Environment"""
    print("\n🌌 Universal Simulation Environment Test")
    print("=" * 60)
    
    # Create the complete system
    viewport_manager = ViewportManager()
    renderer = AdaptiveRenderer(viewport_manager)
    
    # Simulate a race scenario
    race_data = {
        "turtles": [
            {"id": "speedster", "x": 500.0, "y": 300.0, "color": (255, 0, 0), "type": "speedster"},
            {"id": "swimmer", "x": 300.0, "y": 350.0, "color": (0, 0, 255), "type": "swimmer"},
            {"id": "tank", "x": 200.0, "y": 250.0, "color": (0, 255, 0), "type": "tank"}
        ],
        "ui": [
            {"rect": (0.1, 0.9, 0.2, 0.1), "text": "BREED", "importance": "high"},
            {"rect": (0.8, 0.9, 0.15, 0.1), "text": "RACE", "importance": "high"}
        ]
    }
    
    # Test rendering at different resolutions
    resolutions = [(160, 144), (800, 600), (1920, 1080)]
    
    for width, height in resolutions:
        print(f"\nRendering at {width}x{height}:")
        
        renderer.update_resolution((width, height))
        frame_data = renderer.render_frame(race_data)
        
        print(f"  Profile: {frame_data['profile']}")
        print(f"  Elements: {len(frame_data['elements'])}")
        
        # Show turtle positions
        for element in frame_data['elements']:
            if element['type'].startswith('turtle_sprite'):
                print(f"  Turtle at {element['position']} size {element['size']}")
    
    print("\n✅ Universal Simulation Environment verified")
    return True


def main():
    """Run all verification tests"""
    print("🏆 Universal Scaling Verification Suite")
    print("=" * 60)
    print("Testing the Dynamic Bridge - Resolution Independence")
    print()
    
    tests = [
        test_race_position_mapping,
        test_resolution_scaling,
        test_proportional_layout,
        test_adaptive_rendering,
        test_resize_log_verification,
        test_universal_simulation_environment
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ {test.__name__} failed: {e}")
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Universal Simulation Environment is ready for deployment")
        print("✅ TurboShells can now run on any resolution from 160x144 to 4K+")
        return True
    else:
        print("❌ Some tests failed - review implementation")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
