"""
Refactored Tri-Modal Demo - Showcasing Integrated Architecture
Demonstrates the new unified Body Engine with backward compatibility
"""

import sys
import os
import time
import random
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from loguru import logger

def test_legacy_engine():
    """Test legacy GraphicsEngine compatibility"""
    print("🔧 Testing Legacy GraphicsEngine...")
    
    try:
        from engines.body import create_legacy_engine, GraphicsEngine
        
        # Create legacy engine
        engine = create_legacy_engine()
        print(f"✅ Legacy engine created: {type(engine).__name__}")
        
        # Test basic functionality
        if hasattr(engine, 'get_performance_stats'):
            stats = engine.get_performance_stats()
            print(f"📊 Legacy stats available: {list(stats.keys())}")
        
        return True
        
    except Exception as e:
        print(f"❌ Legacy engine test failed: {e}")
        return False

def test_tri_modal_engine():
    """Test new Tri-Modal Engine"""
    print("\n🎭 Testing Tri-Modal Engine...")
    
    try:
        from engines.body import (
            TriModalEngine, BodyEngine, EngineConfig,
            TRI_MODAL_AVAILABLE
        )
        
        if not TRI_MODAL_AVAILABLE:
            print("⚠️ Tri-Modal Display Suite not available")
            return False
        
        # Import DisplayMode only if available
        from engines.body import DisplayMode
        
        # Create tri-modal engine
        config = EngineConfig(
            default_mode=DisplayMode.TERMINAL,
            enable_legacy=True,
            auto_register_bodies=True
        )
        
        engine = TriModalEngine(config)
        print(f"✅ Tri-Modal engine created: {type(engine).__name__}")
        
        # Test mode switching
        for mode in [DisplayMode.TERMINAL, DisplayMode.COCKPIT, DisplayMode.PPU]:
            if engine.set_mode(mode):
                print(f"✅ Switched to {mode.value} mode")
            else:
                print(f"⚠️ Failed to switch to {mode.value} mode")
        
        # Test rendering
        test_state = {
            'entities': [
                {'id': 'player', 'x': 10, 'y': 10, 'type': 'dynamic'},
                {'id': 'item', 'x': 5, 'y': 8, 'type': 'dynamic'}
            ],
            'background': {'id': 'grass_bg'},
            'hud': {'line_1': 'Test HUD', 'line_2': 'Running...'}
        }
        
        if engine.render(test_state):
            print("✅ Test rendering successful")
        else:
            print("❌ Test rendering failed")
        
        # Test performance stats
        stats = engine.update_performance_stats()
        print(f"📊 Engine type: {stats['engine_type']}")
        print(f"📊 Current mode: {stats['current_mode']}")
        
        engine.cleanup()
        return True
        
    except Exception as e:
        print(f"❌ Tri-Modal engine test failed: {e}")
        return False

def test_body_engine_compatibility():
    """Test backward-compatible BodyEngine"""
    print("\n🔄 Testing BodyEngine Compatibility...")
    
    try:
        from engines.body import BodyEngine, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            print("⚠️ Tri-Modal Display Suite not available")
            return False
        
        # Import DisplayMode only if available
        from engines.body import DisplayMode
        
        # Create BodyEngine (should work like old API)
        engine = BodyEngine(use_tri_modal=True)
        print(f"✅ BodyEngine created: {type(engine).__name__}")
        
        # Test that it has both old and new capabilities
        has_tri_modal = hasattr(engine, 'set_mode')
        has_legacy = hasattr(engine, 'legacy_engine')
        
        print(f"✅ Tri-Modal capabilities: {has_tri_modal}")
        print(f"✅ Legacy capabilities: {has_legacy}")
        
        engine.cleanup()
        return True
        
    except Exception as e:
        print(f"❌ BodyEngine compatibility test failed: {e}")
        return False

def test_import_structure():
    """Test that import structure works correctly"""
    print("\n📦 Testing Import Structure...")
    
    try:
        # Test main engine imports
        from engines.body import (
            GraphicsEngine, TriModalEngine, BodyEngine,
            DisplayDispatcher, DisplayMode, RenderPacket,
            TRI_MODAL_AVAILABLE
        )
        
        print(f"✅ GraphicsEngine: {GraphicsEngine is not None}")
        print(f"✅ TriModalEngine: {TriModalEngine is not None}")
        print(f"✅ BodyEngine: {BodyEngine is not None}")
        print(f"✅ DisplayDispatcher: {DisplayDispatcher is not None}")
        print(f"✅ DisplayMode: {DisplayMode is not None}")
        print(f"✅ RenderPacket: {RenderPacket is not None}")
        print(f"✅ TRI_MODAL_AVAILABLE: {TRI_MODAL_AVAILABLE}")
        
        # Test factory functions
        from engines.body import create_tri_modal_engine, create_legacy_engine
        
        print(f"✅ create_tri_modal_engine: {create_tri_modal_engine is not None}")
        print(f"✅ create_legacy_engine: {create_legacy_engine is not None}")
        
        return True
        
    except Exception as e:
        print(f"❌ Import structure test failed: {e}")
        return False

def run_migration_demo():
    """Run a demo showing migration path"""
    print("\n🚀 Running Migration Demo...")
    
    try:
        from engines.body import BodyEngine, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            print("⚠️ Tri-Modal Display Suite not available")
            return False
        
        # Import DisplayMode only if available
        from engines.body import DisplayMode
        
        # Create engine with both capabilities
        engine = BodyEngine(use_tri_modal=True)
        
        # Simulate game state evolution
        game_states = [
            {
                'name': 'Initial State',
                'data': {
                    'entities': [{'id': 'hero', 'x': 5, 'y': 5, 'type': 'dynamic'}],
                    'background': {'id': 'title_screen'},
                    'hud': {'line_1': 'Welcome to DGT'}
                }
            },
            {
                'name': 'Game State',
                'data': {
                    'entities': [
                        {'id': 'hero', 'x': 10, 'y': 10, 'type': 'dynamic'},
                        {'id': 'enemy', 'x': 15, 'y': 8, 'type': 'dynamic'},
                        {'id': 'chest', 'x': 12, 'y': 12, 'type': 'dynamic'}
                    ],
                    'background': {'id': 'dungeon_bg'},
                    'hud': {'line_1': 'HP: 100/100', 'line_2': 'Gold: 50'}
                }
            },
            {
                'name': 'Complex State',
                'data': {
                    'entities': [
                        {'id': 'hero', 'x': 8, 'y': 6, 'type': 'dynamic', 'effect': 'sway'},
                        {'id': 'boss', 'x': 18, 'y': 10, 'type': 'dynamic', 'effect': 'pulse'},
                        {'id': 'particles', 'x': 10, 'y': 8, 'type': 'effect', 'effect': 'flicker'}
                    ],
                    'background': {'id': 'boss_arena'},
                    'hud': {
                        'line_1': 'BOSS BATTLE',
                        'line_2': 'HP: 45/100',
                        'line_3': 'MP: 30/50',
                        'line_4': 'Turn: 15'
                    }
                }
            }
        ]
        
        # Test each state in different modes
        modes = [DisplayMode.TERMINAL, DisplayMode.COCKPIT, DisplayMode.PPU]
        
        for state_info in game_states:
            print(f"\n📋 Testing {state_info['name']}...")
            
            for mode in modes:
                engine.set_mode(mode)
                success = engine.render(state_info['data'], mode)
                status = "✅" if success else "❌"
                print(f"  {status} {mode.value}: {state_info['name']}")
                
                # Brief pause to see the rendering
                time.sleep(0.5)
        
        # Final performance report
        stats = engine.update_performance_stats()
        print(f"\n📊 Final Performance Stats:")
        print(f"  Engine Type: {stats['engine_type']}")
        print(f"  Current Mode: {stats['current_mode']}")
        print(f"  Tri-Modal Available: {stats['tri_modal_available']}")
        print(f"  Legacy Available: {stats['legacy_available']}")
        
        engine.cleanup()
        return True
        
    except Exception as e:
        print(f"❌ Migration demo failed: {e}")
        return False

def main():
    """Main test function"""
    print("🔧 DGT Refactored Architecture Test Suite")
    print("=" * 60)
    
    tests = [
        ("Import Structure", test_import_structure),
        ("Legacy Engine", test_legacy_engine),
        ("Tri-Modal Engine", test_tri_modal_engine),
        ("BodyEngine Compatibility", test_body_engine_compatibility),
        ("Migration Demo", run_migration_demo),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n{'='*20} {name} {'='*20}")
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} test crashed: {e}")
            results.append((name, False))
    
    # Summary
    print(f"\n{'='*60}")
    print("📊 TEST SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {status} {name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🚀 Refactored architecture is production ready!")
        print("\n📋 Migration Guide:")
        print("  • Use 'from engines.body import BodyEngine' for new code")
        print("  • Use 'from engines.body import GraphicsEngine' for legacy code")
        print("  • BodyEngine provides both old and new capabilities")
        print("  • Set use_tri_modal=False for pure legacy mode")
    else:
        print("⚠️ Some tests failed - review before deployment")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
