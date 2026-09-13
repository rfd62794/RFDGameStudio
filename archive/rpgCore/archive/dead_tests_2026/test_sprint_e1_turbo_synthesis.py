"""
Test Sprint E1: Turbo Entity Synthesis

Sprint E1: Turbo Entity Synthesis - Verification
Tests the Sovereign Turtle entity synthesis and visual handshake.
"""

import sys
from pathlib import Path

def test_format_alignment():
    """Test registry format alignment fix"""
    try:
        # Add src to path
        src_path = Path(__file__).parent / "src"
        if str(src_path) not in sys.path:
            sys.path.insert(0, str(src_path))
        
        from dgt_engine.foundation.registry import DGTRegistry, RegistryType
        from dgt_engine.foundation.protocols import EntityStateSnapshot, EntityType
        from dgt_engine.foundation.vector import Vector2
        
        print("✅ Format alignment imports successful")
        
        # Create registry
        registry = DGTRegistry()
        
        # Test different entity formats
        entities = [
            # Direct EntityStateSnapshot
            EntityStateSnapshot("snapshot_1", EntityType.SHIP, Vector2(10, 10), Vector2(1, 0), 5.0, True, {}),
            
            # Entity object with position/velocity
            type("MockEntity", (), {
                'position': Vector2(20, 20),
                'velocity': Vector2(2, 1),
                'radius': 6.0,
                'active': True,
                'entity_type': 'asteroid'
            })(),
            
            # Entity with tuple position/velocity
            type("MockEntity2", (), {
                'position': (30, 30),
                'velocity': (0, 2),
                'radius': 4.0,
                'active': True,
                'type': 'scrap'
            })()
        ]
        
        # Register entities
        for i, entity in enumerate(entities):
            entity_id = f"test_entity_{i+1}"
            registry.register(entity_id, entity, RegistryType.ENTITY, {})
        
        print("✅ Varied entity formats registered")
        
        # Get world snapshot
        snapshot_result = registry.get_world_snapshot()
        assert snapshot_result.success, f"World snapshot failed: {snapshot_result.error}"
        
        snapshot = snapshot_result.value
        assert len(snapshot.entities) == 3
        print("✅ World snapshot contains all entities")
        
        # Verify entity data
        for entity in snapshot.entities:
            assert hasattr(entity, 'position')
            assert hasattr(entity, 'velocity')
            assert hasattr(entity, 'entity_id')
            print(f"✅ Entity {entity.entity_id} format verified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_sovereign_turtle_creation():
    """Test Sovereign Turtle entity creation and genome synthesis"""
    try:
        from dgt_engine.foundation.genetics.genome_engine import TurboGenome, ShellPatternType, BodyPatternType, LimbShapeType
        from apps.tycoon.entities.turtle import SovereignTurtle, create_fast_turtle, create_heavy_turtle
        
        print("✅ Turtle creation imports successful")
        
        # Create custom turtle
        custom_genome = TurboGenome(
            shell_base_color=(255, 128, 64),  # Orange shell
            shell_pattern_type=ShellPatternType.STRIPES,
            shell_pattern_color=(255, 255, 255),  # White stripes
            shell_pattern_density=0.8,
            shell_size_modifier=1.2,  # Large shell
            body_base_color=(200, 150, 100),  # Tan body
            body_pattern_type=BodyPatternType.SOLID,
            body_pattern_color=(200, 150, 100),
            body_pattern_density=0.3,
            head_size_modifier=1.0,
            head_color=(150, 100, 50),
            leg_length=1.3,  # Long legs
            limb_shape=LimbShapeType.FINS,
            leg_thickness_modifier=1.0,
            leg_color=(100, 50, 25),
            eye_color=(0, 0, 0),
            eye_size_modifier=1.0
        )
        
        custom_turtle = SovereignTurtle.from_genome("custom_turtle", custom_genome, (50, 72))
        print("✅ Custom turtle created")
        
        # Test factory functions
        fast_turtle = create_fast_turtle("fast_turtle", (30, 72))
        heavy_turtle = create_heavy_turtle("heavy_turtle", (70, 72))
        print("✅ Factory turtles created")
        
        # Verify genome synthesis
        assert custom_turtle.genome.shell_base_color == (255, 128, 64)
        assert custom_turtle.genome.leg_length == 1.3
        print("✅ Genome synthesis verified")
        
        # Verify stats derivation
        assert custom_turtle.turtle_stats.max_speed > 30.0  # Long legs should increase speed
        assert custom_turtle.turtle_stats.strength > 20.0  # Large shell should increase strength
        print("✅ Stats derivation verified")
        
        # Verify physics stats
        assert custom_turtle.kinetic_body.stats.max_speed == custom_turtle.turtle_stats.max_speed
        assert custom_turtle.kinetic_body.stats.mass > 10.0  # Large shell increases mass
        print("✅ Physics stats verified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_genetic_advantage():
    """Test that genetic traits provide physical advantages"""
    try:
        from apps.tycoon.entities.turtle import create_fast_turtle, create_heavy_turtle
        
        print("✅ Genetic advantage test imports successful")
        
        # Create turtles with different leg lengths
        fast_turtle = create_fast_turtle("fast_turtle", (50, 72))
        heavy_turtle = create_heavy_turtle("heavy_turtle", (50, 72))
        
        # Verify genetic differences
        print(f"Fast turtle leg_length: {fast_turtle.genome.leg_length}")
        print(f"Heavy turtle leg_length: {heavy_turtle.genome.leg_length}")
        
        print(f"Fast turtle max_speed: {fast_turtle.turtle_stats.max_speed:.1f}")
        print(f"Heavy turtle max_speed: {heavy_turtle.turtle_stats.max_speed:.1f}")
        
        # Verify speed advantage
        assert fast_turtle.turtle_stats.max_speed > heavy_turtle.turtle_stats.max_speed
        print("✅ Speed advantage verified")
        
        # Test movement
        fast_turtle.apply_thrust(10.0)
        heavy_turtle.apply_thrust(10.0)
        
        # Update physics
        for i in range(60):  # 1 second at 60Hz
            fast_turtle.update(1.0/60.0)
            heavy_turtle.update(1.0/60.0)
        
        print(f"Fast turtle distance: {fast_turtle.position.x:.1f}")
        print(f"Heavy turtle distance: {heavy_turtle.position.x:.1f}")
        
        # Verify distance advantage
        assert fast_turtle.position.x > heavy_turtle.position.x
        print("✅ Distance advantage verified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_visual_handshake():
    """Test visual handshake between genome and renderer"""
    try:
        from apps.tycoon.entities.turtle import create_random_turtle
        from apps.tycoon.rendering.turtle_renderer import TurtleRenderer, create_turtle_viewport
        
        print("✅ Visual handshake imports successful")
        
        # Create turtle with specific color
        turtle = create_random_turtle("visual_test", (80, 72))
        print(f"✅ Turtle created with shell color: {turtle.genome.shell_base_color}")
        
        # Create renderer
        renderer = TurtleRenderer()
        
        # Render turtle
        render_result = renderer.render_turtle(turtle)
        assert render_result.success, f"Turtle render failed: {render_result.error}"
        
        render_data = render_result.value
        print("✅ Turtle rendered successfully")
        
        # Verify visual data matches genome
        assert render_data.shell_color == turtle.genome.shell_base_color
        assert render_data.shell_pattern == turtle.genome.shell_pattern_type.value
        assert render_data.body_color == turtle.genome.body_base_color
        print("✅ Visual-genome handshake verified")
        
        # Test sprite data generation
        sprite_data = renderer.get_turtle_sprite_data(render_data)
        assert 'layers' in sprite_data
        assert 'energy_bar' in sprite_data
        assert len(sprite_data['layers']) == 2  # body + shell
        print("✅ Sprite data generated")
        
        # Test viewport
        viewport = create_turtle_viewport()
        frame_result = viewport.render_frame()
        assert frame_result.success, f"Viewport render failed: {frame_result.error}"
        
        print("✅ Viewport frame rendered")
        print(f"Frame preview (first 100 chars): {frame_result.value[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_registry_integration():
    """Test turtle integration with DGTRegistry"""
    try:
        from apps.tycoon.entities.turtle import create_random_turtle
        from dgt_engine.foundation.registry import DGTRegistry
        
        print("✅ Registry integration imports successful")
        
        # Create multiple turtles
        turtles = []
        for i in range(5):
            turtle = create_random_turtle(f"turtle_{i}", (20 + i * 20, 72))
            turtles.append(turtle)
        
        print("✅ 5 turtles created")
        
        # Update turtles to register their states
        for turtle in turtles:
            turtle.apply_thrust(5.0)
            turtle.update(1.0/60.0)
        
        print("✅ Turtles updated and registered")
        
        # Verify registry state
        registry = DGTRegistry()
        snapshot_result = registry.get_world_snapshot()
        assert snapshot_result.success, f"Registry snapshot failed: {snapshot_result.error}"
        
        snapshot = snapshot_result.value
        assert len(snapshot.entities) == 5
        print("✅ Registry contains all turtles")
        
        # Verify genetic diversity
        leg_lengths = [turtle.genome.leg_length for turtle in turtles]
        shell_colors = [turtle.genome.shell_base_color for turtle in turtles]
        
        print(f"Leg lengths: {[f'{ll:.2f}' for ll in leg_lengths]}")
        print(f"Shell colors: {shell_colors}")
        
        # Verify max_speed differences
        max_speeds = [turtle.turtle_stats.max_speed for turtle in turtles]
        speed_variance = max(max_speeds) - min(max_speeds)
        assert speed_variance > 5.0  # Should have meaningful speed differences
        print(f"Speed variance: {speed_variance:.1f}")
        print("✅ Genetic diversity verified")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔧 Testing Sprint E1: Turbo Entity Synthesis...")
    
    tests = [
        ("Format Alignment", test_format_alignment),
        ("Sovereign Turtle Creation", test_sovereign_turtle_creation),
        ("Genetic Advantage", test_genetic_advantage),
        ("Visual Handshake", test_visual_handshake),
        ("Registry Integration", test_registry_integration)
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        success = test_func()
        results.append((test_name, success))
    
    print(f"\n🏁 Sprint E1 Test Results:")
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"  {test_name}: {status}")
    
    all_passed = all(success for _, success in results)
    print(f"\n🎯 Overall: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    
    if all_passed:
        print("\n🏆 Sprint E1: TURBO ENTITY SYNTHESIS - SUCCESS!")
        print("🐢 The first DGT-native TurboShells are born!")
        print("🧬 17-trait genetics successfully composed with kinetic physics!")
        print("🎨 Visual handshake connecting genome to viewport!")
        print("🏁 Genetic advantages verified in the sovereign grid!")
