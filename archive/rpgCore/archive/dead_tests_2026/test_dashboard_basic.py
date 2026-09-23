"""
Basic Dashboard Test - Core Functionality Verification
Tests the essential components without complex imports
"""

import sys
from pathlib import Path

# Add src to path for imports
src_path = Path(__file__).parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))


def test_core_imports():
    """Test that core DGT components can be imported"""
    print("🔧 Testing Core Imports")
    print("=" * 50)
    
    try:
        # Test viewport system
        from dgt_core.engines.viewport.logical_viewport import LogicalViewport
        viewport = LogicalViewport()
        viewport.set_physical_resolution((800, 600))
        print("✅ LogicalViewport imported and initialized")
        
        # Test pygame shim
        from dgt_core.compat.pygame_shim import create_legacy_context
        context = create_legacy_context((800, 600))
        print("✅ PyGame shim imported and created")
        
        # Test extracted logic
        from legacy_logic_extraction.breeding_logic import BreedingLogicExtractor
        extractor = BreedingLogicExtractor()
        print("✅ Breeding logic extractor imported")
        
        # Test basic rect operations
        rect = context.Rect(10, 10, 100, 50)
        assert rect.left == 10
        assert rect.width == 100
        assert rect.collidepoint((50, 25))
        print("✅ SovereignRect operations working")
        
        # Test basic drawing
        context.draw.rect(None, (100, 100, 100), rect)
        context.draw.text(None, "Test", (255, 255, 255), (20, 20), 12)
        packets = context.draw.get_render_packets()
        assert len(packets) >= 2
        print("✅ Drawing proxy working")
        
        return True
        
    except Exception as e:
        print(f"❌ Core import test failed: {e}")
        return False


def test_viewport_scaling():
    """Test viewport scaling across resolutions"""
    print("\n📱 Testing Viewport Scaling")
    print("=" * 50)
    
    try:
        from dgt_core.engines.viewport.logical_viewport import LogicalViewport
        from dgt_core.compat.pygame_shim import create_legacy_context
        
        resolutions = [(160, 144), (800, 600), (1920, 1080)]
        test_coords = (50, 100, 200, 150)
        
        for width, height in resolutions:
            viewport = LogicalViewport()
            viewport.set_physical_resolution((width, height))
            context = create_legacy_context((width, height))
            
            # Create rect with legacy coordinates
            rect = context.Rect(*test_coords)
            physical_rect = rect.get_physical_rect((width, height))
            
            print(f"  {width:4}x{height:<4} → Physical {physical_rect}")
            
            # Verify scaling is proportional
            expected_x = int((test_coords[0] / 800.0) * width)
            expected_y = int((test_coords[1] / 600.0) * height)
            
            tolerance = 2
            assert abs(physical_rect[0] - expected_x) <= tolerance
            assert abs(physical_rect[1] - expected_y) <= tolerance
        
        print("✅ Viewport scaling verified")
        return True
        
    except Exception as e:
        print(f"❌ Viewport scaling test failed: {e}")
        return False


def test_breeding_logic():
    """Test breeding logic extraction"""
    print("\n🧬 Testing Breeding Logic")
    print("=" * 50)
    
    try:
        from legacy_logic_extraction.breeding_logic import BreedingLogicExtractor
        
        extractor = BreedingLogicExtractor()
        
        # Test parent selection
        test_turtle = {'id': 'test_1', 'name': 'Test Turtle'}
        success = extractor.process_parent_selection(0, test_turtle)
        
        assert success
        assert len(extractor.selected_parents) == 1
        print("✅ Parent selection working")
        
        # Test breeding status
        status = extractor.get_breeding_status_text()
        assert isinstance(status, str)
        assert len(status) > 0
        print(f"✅ Breeding status: {status}")
        
        # Test breeding conditions
        can_breed = extractor.can_breed()
        print(f"✅ Can breed: {can_breed}")
        
        return True
        
    except Exception as e:
        print(f"❌ Breeding logic test failed: {e}")
        return False


def test_roster_logic():
    """Test roster logic extraction"""
    print("\n📋 Testing Roster Logic")
    print("=" * 50)
    
    try:
        from legacy_logic_extraction.roster_logic import RosterLogicExtractor, SortMode
        
        extractor = RosterLogicExtractor()
        
        # Test sorting
        test_turtles = [
            extractor.TurtleCardData("1", "Zebra", {"speed": 5}, {}, False, value=100),
            extractor.TurtleCardData("2", "Alpha", {"speed": 15}, {}, False, value=200),
            extractor.TurtleCardData("3", "Beta", {"speed": 10}, {}, False, value=150),
        ]
        
        # Test name sorting
        sorted_by_name = extractor.sort_turtles_by_name(test_turtles)
        names = [t.name for t in sorted_by_name]
        assert names == ['Alpha', 'Beta', 'Zebra']
        print("✅ Name sorting working")
        
        # Test speed sorting
        sorted_by_speed = extractor.sort_turtles_by_speed(test_turtles)
        speeds = [t.stats['speed'] for t in sorted_by_speed]
        assert speeds == [15, 10, 5]
        print("✅ Speed sorting working")
        
        # Test filtering
        active_turtles = extractor.filter_active_turtles(test_turtles)
        assert len(active_turtles) == 3  # All are active
        
        # Add retired turtle
        retired_turtle = extractor.TurtleCardData("4", "Old", {"speed": 3}, {}, True, value=50)
        all_turtles = test_turtles + [retired_turtle]
        
        active_only = extractor.filter_active_turtles(all_turtles)
        retired_only = extractor.filter_retired_turtles(all_turtles)
        
        assert len(active_only) == 3
        assert len(retired_only) == 1
        print("✅ Filtering working")
        
        return True
        
    except Exception as e:
        print(f"❌ Roster logic test failed: {e}")
        return False


def test_theme_system():
    """Test theme system"""
    print("\n🎨 Testing Theme System")
    print("=" * 50)
    
    try:
        from dgt_core.compat.pygame_shim import create_legacy_context
        
        context = create_legacy_context((800, 600))
        
        # Test theme colors
        assert 'SELECTION_GLOW' in context.theme_colors
        assert 'BREEDING_PANEL_BG' in context.theme_colors
        print(f"✅ Theme colors: {len(context.theme_colors)} available")
        
        # Test layout constants
        assert 'PARENT_SLOT_OFFSET_X' in context.layout
        assert 'BREED_BUTTON_WIDTH' in context.layout
        print(f"✅ Layout constants: {len(context.layout)} available")
        
        # Test theme export
        context.export_theme_to_json("test_theme_export.json")
        
        import json
        with open("test_theme_export.json", 'r') as f:
            theme_data = json.load(f)
        
        assert 'colors' in theme_data
        assert 'fonts' in theme_data
        assert 'layout' in theme_data
        print("✅ Theme export working")
        
        # Cleanup
        import os
        os.remove("test_theme_export.json")
        
        return True
        
    except Exception as e:
        print(f"❌ Theme system test failed: {e}")
        return False


def main():
    """Run basic dashboard tests"""
    print("🏆 Basic Dashboard Functionality Test")
    print("=" * 60)
    print("Testing Core Components: Viewport → Shim → Logic → UI")
    print()
    
    tests = [
        ("Core Imports", test_core_imports),
        ("Viewport Scaling", test_viewport_scaling),
        ("Breeding Logic", test_breeding_logic),
        ("Roster Logic", test_roster_logic),
        ("Theme System", test_theme_system),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"Running: {test_name}")
        print('='*60)
        
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n{'='*60}")
    print(f"Basic Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 ALL BASIC TESTS PASSED!")
        print("✅ Core DGT Platform components working")
        print("✅ PyGame Compatibility Shim operational")
        print("✅ Legacy logic extraction successful")
        print("✅ Cross-platform scaling verified")
        print("✅ Theme system functional")
        print("\n🚀 FOUNDATION READY FOR FINAL SYNTHESIS! 🚀")
        print("\n📱 Miyoo Mini: 160x144 retro scaling working")
        print("💻 Desktop: 1920x1080 HD scaling working")
        print("🔧 Legacy UI logic can now be copy-pasted!")
        return True
    else:
        print("❌ Some basic tests failed")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
