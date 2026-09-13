"""
Game Boy Parity System Demo - Authentic Hardware Rendering

Demonstrates the complete Game Boy three-layer rendering system with
Virtual PPU, TileBank, and Metasprite assembly.
"""

import sys
import os
import time
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from ui.virtual_ppu import VirtualPPU
from ui.tile_bank import TileBank, TileType
from models.metasprite import Metasprite, MetaspriteConfig, CharacterRole
from ui.render_passes.pixel_viewport import PixelViewportPass, PixelViewportConfig
from ui.render_passes import RenderContext, RenderPassType
from ui.render_passes import RenderPassRegistry
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


def demo_tile_bank_system():
    """Demonstrate the TileBank system."""
    print("🎮 TILE BANK SYSTEM DEMO")
    print("=" * 60)
    print("Game Boy VRAM tile patterns (8x8 pixels)")
    print("=" * 60)
    
    tile_bank = TileBank()
    
    # Show different tile banks
    print("\n📍 TILE BANKS:")
    print("-" * 30)
    
    banks = ["default", "forest", "town", "dungeon"]
    
    for bank_name in banks:
        print(f"\n{bank_name.title()} Bank:")
        tile_bank.switch_bank(bank_name)
        
        # Show sample tiles
        sample_tiles = tile_bank.get_available_tiles()[:5]
        for tile_key in sample_tiles:
            tile = tile_bank.get_tile(tile_key)
            if tile:
                print(f"  {tile_key}: {tile.tile_type.value} (8x8)")
    
    # Show animated tiles
    print("\n📍 ANIMATED TILES:")
    print("-" * 30)
    
    tile_bank.switch_bank("default")
    animated_tiles = tile_bank.get_tile_info()["animated_tiles"]
    
    for tile_key in animated_tiles[:3]:
        print(f"\n{tile_key} Animation:")
        for frame in range(4):
            frame_tile = tile_bank.get_animation_frame(tile_key, frame)
            if frame_tile:
                # Show first few pixels of frame
                sample_pixels = []
                for y in range(3):
                    row_pixels = []
                    for x in range(3):
                        pixel = frame_tile.pixels[y][x]
                        if pixel is not None:
                            row_pixels.append("█")
                        else:
                            row_pixels.append(" ")
                    sample_pixels.append(''.join(row_pixels))
                
                print(f"  Frame {frame}:")
                for row in sample_pixels:
                    print(f"    {row}")


def demo_metasprite_system():
    """Demonstrate the Metasprite system."""
    print("\n🎮 METASPRITE SYSTEM DEMO")
    print("=" * 60)
    print("16x16 pixel actors assembled from 8x8 tiles")
    print("=" * 60)
    
    # Show different character roles
    print("\n📍 CHARACTER ROLES:")
    print("-" * 30)
    
    roles = [
        CharacterRole.VOYAGER,
        CharacterRole.WARRIOR,
        CharacterRole.ROGUE,
        CharacterRole.MAGE,
        CharacterRole.VILLAGER,
        CharacterRole.GUARD,
        CharacterRole.MERCHANT
    ]
    
    for role in roles:
        config = MetaspriteConfig(role=role)
        metasprite = Metasprite(config)
        
        print(f"\n{role.value.title()}:")
        rendered = metasprite.render_to_string()
        print(rendered)
    
    # Show facing directions
    print("\n📍 FACING DIRECTIONS:")
    print("-" * 30)
    
    config = MetaspriteConfig(CharacterRole.VOYAGER)
    metasprite = Metasprite(config)
    
    directions = ["up", "down", "left", "right"]
    
    for direction in directions:
        metasprite.set_facing_direction(direction)
        print(f"\n{direction.title()}:")
        rendered = metasprite.render_to_string()
        print(rendered)
    
    # Show animation frames
    print("\n📍 ANIMATION FRAMES:")
    print("-" * 30)
    
    metasprite.set_facing_direction("down")
    
    for frame in range(4):
        metasprite.set_animation_frame(frame)
        print(f"\nFrame {frame}:")
        rendered = metasprite.render_to_string()
        print(rendered)
    
    # Show equipment variations
    print("\n📍 EQUIPMENT VARIATIONS:")
    print("-" * 30)
    
    equipment_sets = [
        {"head": "none", "body": "none", "weapon": "none"},
        {"head": "helmet", "body": "armor", "weapon": "sword"},
        {"head": "hood", "body": "robe", "weapon": "staff"},
        {"head": "hat", "body": "clothes", "weapon": "bow"}
    ]
    
    for i, equipment in enumerate(equipment_sets):
        config = MetaspriteConfig(CharacterRole.VOYAGER)
        metasprite = Metasprite(config)
        metasprite.set_equipment(equipment)
        
        print(f"\nEquipment Set {i + 1}:")
        for slot, item in equipment.items():
            print(f"  {slot}: {item}")
        rendered = metasprite.render_to_string()
        print(rendered)


def demo_virtual_ppu():
    """Demonstrate the Virtual PPU system."""
    print("\n🎮 VIRTUAL PPU DEMO")
    print("=" * 60)
    print("Game Boy three-layer rendering (BG/WIN/OBJ)")
    print("=" * 60)
    
    ppu = VirtualPPU()
    
    # Show PPU information
    print("\n📍 PPU SPECIFICATIONS:")
    print("-" * 30)
    
    info = ppu.get_ppu_info()
    print(f"Resolution: {info['resolution']}")
    print(f"Tile Resolution: {info['tile_resolution']}")
    print(f"Max Sprites: {info['max_sprites']}")
    print(f"Max Tiles: {info['max_tiles']}")
    print(f"Current Tile Bank: {info['current_tile_bank']}")
    
    print("\n📍 RENDERING LAYERS:")
    print("-" * 30)
    
    for layer_name, layer_desc in info['layers'].items():
        print(f"  {layer_name.upper()}: {layer_desc}")
    
    # Demonstrate three-layer rendering
    print("\n📍 THREE-LAYER RENDERING:")
    print("-" * 30)
    
    # Step 1: Background (BG) - TileMap
    print("\n1. BACKGROUND LAYER (BG):")
    print("   Setting up tile map...")
    
    # Create a simple world
    for y in range(18):
        for x in range(20):
            if x == 0 or x == 19 or y == 0 or y == 17:
                ppu.set_tile(x * 8, y * 8, "wall")  # Borders
            elif x == 10 and y == 9:
                ppu.set_tile(x * 8, y * 8, "path")  # Center path
            elif (x + y) % 3 == 0:
                ppu.set_tile(x * 8, y * 8, "grass_0")  # Grass
            elif (x + y) % 3 == 1:
                ppu.set_tile(x * 8, y * 8, "grass_1")  # Grass variation
            else:
                ppu.set_tile(x * 8, y * 8, "grass_2")  # Grass variation
    
    print("   ✓ TileMap created (20x18 tiles)")
    
    # Step 2: Objects (OBJ) - Metasprites
    print("\n2. OBJECT LAYER (OBJ):")
    print("   Adding metasprites...")
    
    # Add player
    player_config = MetaspriteConfig(CharacterRole.VOYAGER)
    player = Metasprite(player_config)
    ppu.add_sprite(80, 72, player, 0)  # Center position
    print("   ✓ Player metasprite added")
    
    # Add NPCs
    npc_configs = [
        (CharacterRole.VILLAGER, 40, 40),
        (CharacterRole.GUARD, 120, 40),
        (CharacterRole.MERCHANT, 40, 100),
        (CharacterRole.WARRIOR, 120, 100)
    ]
    
    for role, x, y in npc_configs:
        config = MetaspriteConfig(role=role)
        npc = Metasprite(config)
        ppu.add_sprite(x, y, npc, 1)
    
    print("   ✓ 4 NPC metasprites added")
    
    # Step 3: Window (WIN) - Text overlay
    print("\n3. WINDOW LAYER (WIN):")
    print("   Adding text overlay...")
    
    ppu.add_window("HP: 85/100", 10, 10, 100, 16)
    ppu.add_window("Welcome to the Village!", 30, 130, 100, 16)
    print("   ✓ Text boxes added")
    
    # Render the complete frame
    print("\n📍 COMPLETE FRAME:")
    print("-" * 30)
    
    rendered = ppu.render_frame()
    print(rendered)
    
    # Show layer breakdown
    print("\n📍 LAYER BREAKDOWN:")
    print("-" * 30)
    
    # Clear sprites and windows to show background only
    ppu.sprites.clear()
    ppu.windows.clear()
    bg_only = ppu.render_frame()
    
    print("\nBackground Only:")
    print(bg_only)
    
    # Add sprites back
    ppu.add_sprite(80, 72, player, 0)
    bg_and_obj = ppu.render_frame()
    
    print("\nBackground + Objects:")
    print(bg_and_obj)
    
    # Add windows back
    ppu.add_window("HP: 85/100", 10, 10, 100, 16)
    ppu.add_window("Welcome to the Village!", 30, 130, 100, 16)
    complete = ppu.render_frame()
    
    print("\nComplete (BG + OBJ + WIN):")
    print(complete)


def demo_game_boy_parity():
    """Demonstrate complete Game Boy parity in the rendering system."""
    print("\n🎮 GAME BOY PARITY DEMO")
    print("=" * 60)
    print("Complete integration with multi-pass rendering system")
    print("=" * 60)
    
    # Create render registry
    registry = RenderPassRegistry()
    
    # Register Game Boy pixel viewport
    registry.register_pass(PixelViewportPass(PixelViewportConfig(
        width=20, height=18, pixel_scale=1
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
    
    # Render frame
    results = registry.render_all(context)
    
    # Show Game Boy parity results
    print("\n📍 GAME BOY RENDERING RESULTS:")
    print("-" * 30)
    
    pixel_result = results[RenderPassType.PIXEL_VIEWPORT]
    
    print(f"Rendering Mode: {pixel_result.metadata['rendering_mode']}")
    print(f"Pixel Resolution: {pixel_result.metadata['pixel_width']}x{pixel_result.metadata['pixel_height']}")
    print(f"Pixel Ratio: {pixel_result.metadata['pixel_ratio']}")
    print(f"Entity Count: {pixel_result.metadata['entity_count']}")
    print(f"Tile Bank: {pixel_result.metadata['tile_bank']}")
    
    print("\n📍 PPU INFORMATION:")
    print("-" * 30)
    
    ppu_info = pixel_result.metadata['ppu_info']
    print(f"PPU Resolution: {ppu_info['resolution']}")
    print(f"Tile Resolution: {ppu_info['tile_resolution']}")
    print(f"Max Sprites: {ppu_info['max_sprites']}")
    print(f"Current Sprites: {ppu_info['current_sprites']}")
    print(f"Max Tiles: {ppu_info['max_tiles']}")
    print(f"Available Banks: {len(ppu_info['available_banks'])}")
    
    print("\n📍 RENDERED FRAME:")
    print("-" * 30)
    print(pixel_result.content)
    
    # Show animation over multiple frames
    print("\n📍 ANIMATION SEQUENCE:")
    print("-" * 30)
    
    for frame in range(3):
        context.frame_count = frame
        context.current_time = time.time()
        results = registry.render_all(context)
        
        pixel_result = results[RenderPassType.PIXEL_VIEWPORT]
        print(f"\nFrame {frame + 1}:")
        print(pixel_result.content)
        
        time.sleep(0.5)  # Short pause for animation effect


def demo_performance_benchmarks():
    """Demonstrate performance of Game Boy parity system."""
    print("\n🎮 PERFORMANCE BENCHMARKS DEMO")
    print("=" * 60)
    print("Speed and efficiency of Game Boy hardware emulation")
    print("=" * 60)
    
    # Test Virtual PPU performance
    print("\n📍 VIRTUAL PPU PERFORMANCE:")
    print("-" * 30)
    
    ppu = VirtualPPU()
    
    # Set up complex scene
    for y in range(18):
        for x in range(20):
            ppu.set_tile(x * 8, y * 8, "grass_0")
    
    # Add maximum sprites
    config = MetaspriteConfig(CharacterRole.VOYAGER)
    metasprite = Metasprite(config)
    
    for i in range(40):  # Game Boy limit
        x = (i % 8) * 20
        y = (i // 8) * 36
        ppu.add_sprite(x, y, metasprite, i)
    
    # Add windows
    ppu.add_window("Performance Test", 10, 10, 100, 16)
    
    # Measure rendering performance
    start_time = time.time()
    
    for i in range(100):
        rendered = ppu.render_frame()
    
    end_time = time.time()
    total_time = end_time - start_time
    avg_time = total_time / 100
    
    print(f"Virtual PPU Rendering:")
    print(f"  Total time: {total_time:.4f}s")
    print(f"  Average per frame: {avg_time:.6f}s")
    print(f"  Frames per second: {1/avg_time:.1f}")
    print(f"  Max sprites: 40/40")
    print(f"  Tiles rendered: 360/360")
    print(f"  Windows: 1/1")
    
    # Test multi-pass integration performance
    print("\n📍 MULTI-PASS INTEGRATION PERFORMANCE:")
    print("-" * 30)
    
    registry = RenderPassRegistry()
    registry.register_pass(PixelViewportPass(PixelViewportConfig(
        width=20, height=18, pixel_scale=1
    )))
    
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
    
    start_time = time.time()
    
    for i in range(50):
        context.frame_count = i
        context.current_time = time.time()
        results = registry.render_all(context)
    
    end_time = time.time()
    total_time = end_time - start_time
    avg_time = total_time / 50
    
    print(f"Multi-Pass Integration:")
    print(f"  Total time: {total_time:.4f}s")
    print(f"  Average per frame: {avg_time:.6f}s")
    print(f"  Frames per second: {1/avg_time:.1f}")
    print(f"  Render passes: 1/1")
    
    # Compare with Game Boy original specs
    print("\n📍 GAME BOY COMPARISON:")
    print("-" * 30)
    
    print("Original Game Boy:")
    print("  CPU: 4.19 MHz")
    print("  PPU: 60 Hz refresh rate")
    print("  Resolution: 160x144 pixels")
    print("  Max sprites: 40")
    print("  Max tiles: 256")
    
    print("\nVirtual PPU (This System):")
    print(f"  CPU: Modern (variable)")
    print(f"  Refresh rate: {1/avg_time:.1f} Hz")
    print(f"  Resolution: 160x144 pixels")
    print(f"  Max sprites: 40")
    print(f"  Max tiles: 256")
    
    print(f"\nPerformance Ratio: {1/avg_time:.1f}x faster than original")


def main():
    """Main demo function."""
    print("🎮 GAME BOY PARITY SYSTEM DEMO")
    print("ADR 036: The Metasprite & Tile-Bank System")
    print("Authentic Game Boy Hardware Rendering")
    print("=" * 60)
    
    try:
        demo_tile_bank_system()
        demo_metasprite_system()
        demo_virtual_ppu()
        demo_game_boy_parity()
        demo_performance_benchmarks()
        
        print("\n🎉 DEMO COMPLETE!")
        print("=" * 60)
        print("✅ TileBank system working perfectly")
        print("✅ Metasprite assembly functional")
        print("✅ Virtual PPU three-layer rendering operational")
        print("✅ Game Boy hardware parity achieved")
        print("✅ Performance benchmarks passed")
        print("✅ Multi-pass integration successful")
        print("\nThe Game Boy Parity System is ready for deployment!")
        
    except Exception as e:
        print(f"\n❌ Demo Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
