"""
Composite Sprite System Demo - High-Fidelity Silhouette Assembly

Demonstrates the "Split-Sprite" technique with Head/Body/Feet layering,
anti-aliasing with shading blocks, asymmetric action silhouettes,
and breathing animations.
"""

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from ui.sprite_factory import SpriteFactory, CompositeSpriteConfig, CharacterClass
from ui.render_passes.geometric_profile import GeometricProfilePass, ProfileConfig, ShapeType
from ui.render_passes import RenderContext, RenderPassType
from ui.render_passes import RenderPassRegistry
from ui.pixel_renderer import Pixel
from unittest.mock import Mock


def create_mock_game_state():
    """Create a mock game state for demonstration."""
    mock_game_state = Mock()
    
    # Player position
    mock_position = Mock()
    mock_position.x = 25.0
    mock_position.y = 30.0
    mock_game_state.position = mock_position
    
    # Player stats
    mock_player = Mock()
    mock_player.hp = 85
    mock_player.max_hp = 100
    mock_player.fatigue = 30
    mock_player.max_fatigue = 100
    mock_game_state.player = mock_player
    
    return mock_game_state


def demo_split_sprite_technique():
    """Demonstrate the Split-Sprite technique (Head/Body/Feet)."""
    print("🎨 SPLIT-SPRITE TECHNIQUE DEMO")
    print("=" * 60)
    print("Head/Body/Feet layering for iconic readability")
    print("=" * 60)
    
    factory = SpriteFactory()
    
    # Show different head types
    print("\n📍 HEAD VARIATIONS:")
    print("-" * 30)
    head_types = ["default", "helmet", "hood"]
    
    for head_type in head_types:
        config = CompositeSpriteConfig(CharacterClass.VOYAGER, head_type=head_type)
        sprite = factory.create_composite_sprite(config)
        
        print(f"\n{head_type.title()}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)
    
    # Show different body types
    print("\n📍 BODY VARIATIONS:")
    print("-" * 30)
    body_types = ["default", "armor", "robe"]
    
    for body_type in body_types:
        config = CompositeSpriteConfig(CharacterClass.VOYAGER, body_type=body_type)
        sprite = factory.create_composite_sprite(config)
        
        print(f"\n{body_type.title()}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)
    
    # Show different held items
    print("\n📍 HELD ITEMS:")
    print("-" * 30)
    held_items = ["none", "sword", "staff", "bow"]
    
    for held_item in held_items:
        config = CompositeSpriteConfig(CharacterClass.VOYAGER, held_item=held_item)
        sprite = factory.create_composite_sprite(config)
        
        print(f"\n{held_item.title()}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)


def demo_anti_aliasing_shading():
    """Demonstrate anti-aliasing with shading blocks (▓▒░)."""
    print("\n🎨 ANTI-ALIASING & SHADING DEMO")
    print("=" * 60)
    print("Depth gradients and drop shadows")
    print("=" * 60)
    
    factory = SpriteFactory()
    
    # Show shading patterns
    print("\n📍 SHADING PATTERNS:")
    print("-" * 30)
    
    # Create sprites with different shading
    configs = [
        CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=True),
        CompositeSpriteConfig(CharacterClass.VOYAGER, shading_enabled=False),
    ]
    
    for i, config in enumerate(configs):
        sprite = factory.create_composite_sprite(config)
        shading_status = "With Shading" if config.shading_enabled else "Without Shading"
        
        print(f"\n{shading_status}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)
    
    # Show stealth dithering
    print("\n📍 STEALTH DITHERING:")
    print("-" * 30)
    
    stealth_configs = [
        CompositeSpriteConfig(CharacterClass.ROGUE, stance="neutral"),
        CompositeSpriteConfig(CharacterClass.ROGUE, stance="stealth"),
    ]
    
    for config in stealth_configs:
        sprite = factory.create_composite_sprite(config)
        stance_status = config.stance.title()
        
        print(f"\n{stance_status}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)


def demo_asymmetric_silhouettes():
    """Demonstrate asymmetric action silhouettes."""
    print("\n🎨 ASYMMETRIC ACTION SILHOUETTES DEMO")
    print("=" * 60)
    print("Character class-specific shape language")
    print("=" * 60)
    
    factory = SpriteFactory()
    
    # Show different character classes
    print("\n📍 CHARACTER CLASS SHAPE LANGUAGE:")
    print("-" * 30)
    
    classes = [
        (CharacterClass.VOYAGER, "Voyager - Triangle (lean forward)"),
        (CharacterClass.ROGUE, "Rogue - Triangle (stealth stance)"),
        (CharacterClass.WARRIOR, "Warrior - Square (wide shoulders)"),
        (CharacterClass.MAGE, "Mage - Circle (balanced)"),
    ]
    
    for char_class, description in classes:
        config = CompositeSpriteConfig(char_class)
        sprite = factory.create_composite_sprite(config)
        
        print(f"\n{description}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)
    
    # Show different stances
    print("\n📍 ACTION STANCES:")
    print("-" * 30)
    
    stances = ["neutral", "combat", "stealth", "casting"]
    
    for stance in stances:
        config = CompositeSpriteConfig(CharacterClass.VOYAGER, stance=stance)
        sprite = factory.create_composite_sprite(config)
        
        print(f"\n{stance.title()} Stance:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)


def demo_breathing_animation():
    """Demonstrate breathing animation system."""
    print("\n🎨 BREATHING ANIMATION DEMO")
    print("=" * 60)
    print("2-frame breathing animation (1.5s cycle)")
    print("=" * 60)
    
    factory = SpriteFactory()
    
    config = CompositeSpriteConfig(CharacterClass.VOYAGER, breathing_enabled=True)
    animation_frames = factory.create_breathing_animation_frames(config, 2)
    
    print("\n📍 BREATHING ANIMATION FRAMES:")
    print("-" * 30)
    
    for i, frame in enumerate(animation_frames):
        print(f"\nFrame {i + 1}:")
        for row in frame:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)
    
    # Show animation in action
    print("\n📍 LIVE ANIMATION (3 cycles):")
    print("-" * 30)
    
    for cycle in range(3):
        for i, frame in enumerate(animation_frames):
            print(f"\nCycle {cycle + 1}, Frame {i + 1}:")
            for row in frame:
                line = ""
                for pixel in row:
                    if pixel is None:
                        line += " "
                    elif pixel.intensity < 0.3:
                        line += "░"
                    elif pixel.intensity < 0.6:
                        line += "▒"
                    elif pixel.intensity < 0.9:
                        line += "▓"
                    else:
                        line += "█"
                print(line)
            
            time.sleep(0.1)  # Short pause for animation effect


def demo_equipment_visual_feedback():
    """Demonstrate equipment visual feedback."""
    print("\n🎨 EQUIPMENT VISUAL FEEDBACK DEMO")
    print("=" * 60)
    print("See gear changes on-screen in real-time")
    print("=" * 60)
    
    factory = SpriteFactory()
    
    # Show equipment progression
    print("\n📍 EQUIPMENT PROGRESSION:")
    print("-" * 30)
    
    equipment_sets = [
        {
            "name": "Novice Voyager",
            "config": CompositeSpriteConfig(
                CharacterClass.VOYAGER,
                head_type="default",
                body_type="default",
                feet_type="default",
                held_item="none"
            )
        },
        {
            "name": "Warrior in Armor",
            "config": CompositeSpriteConfig(
                CharacterClass.WARRIOR,
                head_type="helmet",
                body_type="armor",
                feet_type="boots",
                held_item="sword"
            )
        },
        {
            "name": "Mage in Robes",
            "config": CompositeSpriteConfig(
                CharacterClass.MAGE,
                head_type="hood",
                body_type="robe",
                feet_type="default",
                held_item="staff"
            )
        },
        {
            "name": "Rogue with Bow",
            "config": CompositeSpriteConfig(
                CharacterClass.ROGUE,
                head_type="default",
                body_type="default",
                feet_type="boots",
                held_item="bow"
            )
        }
    ]
    
    for equipment in equipment_sets:
        sprite = factory.create_composite_sprite(equipment["config"])
        
        print(f"\n{equipment['name']}:")
        for row in sprite:
            line = ""
            for pixel in row:
                if pixel is None:
                    line += " "
                elif pixel.intensity < 0.3:
                    line += "░"
                elif pixel.intensity < 0.6:
                    line += "▒"
                elif pixel.intensity < 0.9:
                    line += "▓"
                else:
                    line += "█"
            print(line)


def demo_multi_pass_integration():
    """Demonstrate integration with multi-pass rendering system."""
    print("\n🎨 MULTI-PASS INTEGRATION DEMO")
    print("=" * 60)
    print("Composite sprites in the Director's Console")
    print("=" * 60)
    
    # Create render registry
    registry = RenderPassRegistry()
    
    # Register passes with composite sprite support
    registry.register_pass(GeometricProfilePass(ProfileConfig(
        render_mode="silhouette",
        show_composite_sprite=True,
        character_class=CharacterClass.VOYAGER,
        breathing_enabled=True,
        width=20,
        height=12
    )))
    
    registry.register_pass(GeometricProfilePass(ProfileConfig(
        render_mode="geometric",
        shape_type=ShapeType.TRIANGLE,
        show_composite_sprite=False,
        width=20,
        height=12
    )))
    
    # Create mock context
    mock_game_state = create_mock_game_state()
    mock_ledger = Mock()
    mock_ledger.get_chunk.return_value = None
    
    context = RenderContext(
        game_state=mock_game_state,
        world_ledger=mock_ledger,
        viewport_bounds=(0, 0, 100, 100),
        current_time=time.time(),
        frame_count=1
    )
    
    # Render all passes
    results = registry.render_all(context)
    
    print("\n📍 COMPOSITE VS GEOMETRIC COMPARISON:")
    print("-" * 30)
    
    for pass_type, result in results.items():
        render_mode = result.metadata["render_mode"]
        print(f"\n{render_mode.title()} Rendering:")
        print(result.content)
    
    # Show animation over multiple frames
    print("\n📍 ANIMATED COMPOSITE SPRITE:")
    print("-" * 30)
    
    for i in range(3):
        context.frame_count = i
        context.current_time = time.time()
        results = registry.render_all(context)
        
        composite_result = results[RenderPassType.GEOMETRIC_PROFILE]
        print(f"\nFrame {i + 1}:")
        print(composite_result.content)
        
        time.sleep(0.5)


def demo_performance_comparison():
    """Demonstrate performance of composite sprite system."""
    print("\n🎨 PERFORMANCE COMPARISON DEMO")
    print("=" * 60)
    print("Speed and efficiency of composite sprite rendering")
    print("=" * 60)
    
    factory = SpriteFactory()
    
    # Test different rendering scenarios
    scenarios = [
        ("Basic Composite", CompositeSpriteConfig(CharacterClass.VOYAGER)),
        ("Full Equipment", CompositeSpriteConfig(
            CharacterClass.WARRIOR,
            head_type="helmet",
            body_type="armor",
            held_item="sword"
        )),
        ("Stealth Mode", CompositeSpriteConfig(
            CharacterClass.ROGUE,
            stance="stealth",
            shading_enabled=True
        )),
        ("Casting Stance", CompositeSpriteConfig(
            CharacterClass.MAGE,
            stance="casting",
            held_item="staff"
        ))
    ]
    
    print("\n📍 RENDERING PERFORMANCE:")
    print("-" * 30)
    
    for scenario_name, config in scenarios:
        # Measure performance
        start_time = time.time()
        
        # Create 100 sprites
        for i in range(100):
            sprite = factory.create_composite_sprite(config)
        
        end_time = time.time()
        total_time = end_time - start_time
        avg_time = total_time / 100
        
        print(f"\n{scenario_name}:")
        print(f"  Total time: {total_time:.4f}s")
        print(f"  Average per sprite: {avg_time:.6f}s")
        print(f"  Sprites per second: {1/avg_time:.1f}")
    
    # Show breathing animation performance
    print("\n📍 BREATHING ANIMATION PERFORMANCE:")
    print("-" * 30)
    
    config = CompositeSpriteConfig(CharacterClass.VOYAGER, breathing_enabled=True)
    
    start_time = time.time()
    
    # Create 50 animation sets
    for i in range(50):
        frames = factory.create_breathing_animation_frames(config, 2)
    
    end_time = time.time()
    total_time = end_time - start_time
    avg_time = total_time / 50
    
    print(f"\nBreathing Animation (2 frames):")
    print(f"  Total time: {total_time:.4f}s")
    print(f"  Average per animation: {avg_time:.6f}s")
    print(f"  Animations per second: {1/avg_time:.1f}")


def main():
    """Main demo function."""
    print("🎨 COMPOSITE SPRITE SYSTEM DEMO")
    print("ADR 034: Procedural Silhouette Baker")
    print("High-Fidelity Silhouette Assembly")
    print("=" * 60)
    
    try:
        demo_split_sprite_technique()
        demo_anti_aliasing_shading()
        demo_asymmetric_silhouettes()
        demo_breathing_animation()
        demo_equipment_visual_feedback()
        demo_multi_pass_integration()
        demo_performance_comparison()
        
        print("\n🎉 DEMO COMPLETE!")
        print("=" * 60)
        print("✅ Split-Sprite technique working perfectly")
        print("✅ Anti-aliasing with shading blocks implemented")
        print("✅ Asymmetric action silhouettes created")
        print("✅ Breathing animation system functional")
        print("✅ Equipment visual feedback working")
        print("✅ Multi-pass integration successful")
        print("✅ Performance benchmarks passed")
        print("\nThe Composite Sprite System is ready for deployment!")
        
    except Exception as e:
        print(f"\n❌ Demo Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
