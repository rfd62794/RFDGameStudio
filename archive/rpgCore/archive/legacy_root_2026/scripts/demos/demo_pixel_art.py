"""
Pixel Art Demo - Showcasing the Unicode Half-Block Rendering System

Demonstrates the pixel-perfect rendering capabilities with animated sprites,
faction-based coloring, and the "Game Boy/NES" visual parity.
"""

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from ui.pixel_viewport import PixelViewport, ViewportConfig
from ui.sprite_registry import SpriteRegistry
from ui.pixel_renderer import PixelRenderer, ColorPalette
from world_ledger import WorldLedger


def demo_pixel_art():
    """Demonstrate the pixel art rendering system."""
    
    print("🎮 PIXEL ART RENDERING DEMO 🎮")
    print("=" * 50)
    print("Unicode Half-Block Technique - 80x48 Resolution")
    print("Visual Parity: Game Boy/NES Style")
    print("=" * 50)
    
    # Create mock world ledger
    mock_ledger = WorldLedger()
    
    # Create pixel viewport
    config = ViewportConfig(
        pixel_width=80,
        pixel_height=48,
        show_grid=False,
        animation_speed=1.0
    )
    
    viewport = PixelViewport(mock_ledger, config)
    
    # Demo 1: Show individual sprites
    print("\n📝 SPRITE SHOWCASE:")
    print("-" * 30)
    
    renderer = PixelRenderer(20, 20)
    registry = SpriteRegistry()
    
    # Show Voyager sprite
    voyager = registry.get_voyager_sprite("neutral", "3x3")
    renderer.clear()
    renderer.draw_sprite(voyager, 8, 8, time.time())
    print("Voyager (3x3):")
    print(renderer.render_to_string())
    
    # Show character sprites with different factions
    print("\nCharacter Sprites:")
    for faction in ["legion", "merchants", "scholars"]:
        character = registry.get_character_sprite("warrior", faction)
        renderer.clear()
        renderer.draw_sprite(character, 7, 7, time.time())
        print(f"{faction.title()} Warrior:")
        print(renderer.render_to_string())
    
    # Demo 2: Animated sprites
    print("\n🎬 ANIMATED SPRITES:")
    print("-" * 30)
    
    print("Explosion Animation:")
    explosion = registry.get_effect_sprite("explosion")
    
    for frame in range(3):
        renderer.clear()
        renderer.draw_sprite(explosion, 8, 8, frame * 0.2)
        print(f"Frame {frame + 1}:")
        print(renderer.render_to_string())
        time.sleep(0.5)
    
    # Demo 3: Color palette showcase
    print("\n🎨 COLOR PALETTE:")
    print("-" * 30)
    
    renderer.clear()
    x, y = 2, 2
    
    for faction_name, color_data in ColorPalette.FACTION_COLORS.items():
        pixel = ColorPalette.get_faction_color(faction_name, 1.0)
        renderer.draw_rectangle(x, y, 8, 3, pixel, fill=True)
        
        # Add label
        label = f"{faction_name[:8].upper()}"
        for i, char in enumerate(label):
            if x + i < 18:
                renderer.set_pixel_rgb(x + i, y + 4, 5, 5, 5, 0.8)  # White text
        
        x += 10
        if x > 15:
            x = 2
            y += 6
    
    print("Faction Colors:")
    print(renderer.render_to_string())
    
    # Demo 4: Half-block rendering technique
    print("\n🔷 HALF-BLOCK TECHNIQUE:")
    print("-" * 30)
    
    renderer.clear()
    
    # Create gradient pattern showing half-block capability
    for y in range(16):
        for x in range(16):
            # Create a pattern that demonstrates upper/lower half blocks
            if (x + y) % 4 == 0:
                # Upper half only
                renderer.set_pixel_rgb(x, y * 2, 5, 0, 0)  # Red upper
            elif (x + y) % 4 == 1:
                # Lower half only  
                renderer.set_pixel_rgb(x, y * 2 + 1, 0, 5, 0)  # Green lower
            elif (x + y) % 4 == 2:
                # Both halves (full block)
                renderer.set_pixel_rgb(x, y * 2, 0, 0, 5)  # Blue
                renderer.set_pixel_rgb(x, y * 2 + 1, 0, 0, 5)  # Blue
            else:
                # Empty
                pass
    
    print("Half-Block Pattern (2x zoom):")
    result = renderer.render_to_string()
    print(result)
    
    # Demo 5: Complete scene
    print("\n🌍 COMPLETE SCENE:")
    print("-" * 30)
    
    demo_scene = viewport.create_demo_scene()
    print("Demo Scene with Multiple Sprites:")
    print(demo_scene)
    
    # Demo 6: Performance test
    print("\n⚡ PERFORMANCE TEST:")
    print("-" * 30)
    
    start_time = time.time()
    
    for i in range(10):
        scene = viewport.create_demo_scene()
    
    end_time = time.time()
    
    avg_time = (end_time - start_time) / 10
    fps = 1.0 / avg_time if avg_time > 0 else 0
    
    print(f"Average render time: {avg_time:.4f}s")
    print(f"Theoretical FPS: {fps:.1f}")
    print(f"Resolution: {config.pixel_width}x{config.pixel_height} pixels")
    print(f"Character output: {config.pixel_width}x{config.pixel_height//2} chars")
    
    print("\n✅ DEMO COMPLETE!")
    print("The pixel rendering system successfully provides:")
    print("• 2x vertical resolution boost (80x48 vs 80x24)")
    print("• Faction-based coloring system")
    print("• Animated sprite support")
    print("• Unicode half-block technique")
    print("• Game Boy/NES visual parity")
    print("• SOLID architecture with comprehensive testing")


if __name__ == "__main__":
    demo_pixel_art()
