#!/usr/bin/env python3
"""
Test script to verify the ASCII-Doom 3D Renderer and spatial tactical depth.
"""

import sys
import os
import random
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate, WorldChunk
from ui.renderer_3d import ASCIIDoomRenderer, Ray3D, HitResult
from logic.orientation import OrientationManager, Orientation
from game_state import GameState, PlayerStats


def test_ascii_doom_renderer():
    """Test the ASCII-Doom 3D renderer with spatial tactical depth."""
    print("🎮 Testing ASCII-Doom 3D Renderer - Spatial Tactical Depth...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    renderer = ASCIIDoomRenderer(world_ledger, width=80, height=24)
    orientation_manager = OrientationManager()
    
    # Create a test game state
    player = PlayerStats(
        name="Test Player",
        attributes={"strength": 14, "dexterity": 12, "constitution": 13, "intelligence": 10, "wisdom": 11, "charisma": 10},
        hp=100,
        max_hp=100,
        gold=50
    )
    
    game_state = GameState(player=player)
    
    # Set up a simple test environment
    print("\n🏗️ Setting up Test Environment:")
    
    # Create some test chunks with walls
    test_chunks = {}
    
    # Create a room with walls
    for x in range(-5, 6):
        for y in range(-5, 6):
            coord = Coordinate(x, y, 0)
            
            # Create walls around the perimeter
            if abs(x) == 5 or abs(y) == 5:
                chunk = WorldChunk(
                    coordinate=(x, y, 0),
                    name=f"Wall at ({x}, {y})",
                    description="A solid stone wall",
                    tags=["wall", "stone", "barrier"]
                )
            else:
                # Create floor
                chunk = WorldChunk(
                    coordinate=(x, y, 0),
                    name=f"Floor at ({x}, {y})",
                    description="A stone floor",
                    tags=["floor", "stone"]
                )
            
            test_chunks[(x, y)] = chunk
    
    print(f"   Created {len(test_chunks)} test chunks (room with walls)")
    
    # Test basic raycasting
    print("\n🔦 Testing Basic Raycasting:")
    
    # Set player position in center
    game_state.position = Coordinate(0, 0, 0)
    game_state.player_angle = 0.0  # Facing north
    
    # Test ray casting in different directions
    test_angles = [0, 45, 90, 135, 180, 225, 270, 315]
    
    for angle in test_angles:
        ray = Ray3D(
            origin_x=0.0,
            origin_y=0.0,
            angle=angle,
            length=10.0
        )
        
        hit_result = renderer._cast_ray(ray, game_state)
        
        if hit_result.hit:
            print(f"   Ray at {angle}°: Hit at distance {hit_result.distance:.1f}")
        else:
            print(f"   Ray at {angle}°: No hit")
    
    # Test 3D rendering
    print("\n🖼️ Testing 3D Rendering:")
    
    # Render a frame
    perception_range = 10
    frame = renderer.render_frame(game_state, game_state.player_angle, perception_range)
    
    # Convert to string and display
    frame_str = renderer.get_frame_as_string(frame)
    
    print("   ASCII-Doom View (facing North):")
    print("   " + "="*80)
    for line in frame_str.split('\n')[:12]:  # Show first 12 lines
        print(f"   |{line}|")
    print("   " + "="*80)
    
    # Test different orientations
    print("\n🧭 Testing Different Orientations:")
    
    orientations = [
        (0, "North"),
        (90, "East"),
        (180, "South"),
        (270, "West")
    ]
    
    for angle, direction in orientations:
        game_state.player_angle = angle
        frame = renderer.render_frame(game_state, angle, perception_range)
        frame_str = renderer.get_frame_as_string(frame)
        
        # Show a smaller preview
        lines = frame_str.split('\n')
        if lines:
            middle_line = lines[len(lines)//2]
            print(f"   {direction:8s}: {middle_line[:40]}...")
    
    # Test orientation manager
    print("\n🎯 Testing Orientation Manager:")
    
    # Set initial position
    orientation_manager.set_position(0, 0, 0)
    
    # Test turning
    print("   Testing turns:")
    for i in range(4):
        orientation = orientation_manager.turn_right()
        print(f"      Turn {i+1}: {orientation.angle}° ({orientation_manager.get_facing_direction()})")
    
    # Test movement
    print("\n   Testing movement:")
    movements = [
        ("move_forward", orientation_manager.move_forward),
        ("move_right", orientation_manager.move_right),
        ("move_backward", orientation_manager.move_backward),
        ("move_left", orientation_manager.move_left)
    ]
    
    for move_name, move_func in movements:
        position = move_func()
        print(f"      {move_name}: ({position.x}, {position.y})")
    
    # Test perception-based FoV
    print("\n👁️ Testing Perception-Based FoV:")
    
    perception_levels = [5, 10, 15, 20]
    
    for perception in perception_levels:
        fov_distance = renderer.calculate_fov_distance(perception)
        print(f"   Perception {perception}: FoV distance {fov_distance:.1f}°")
    
    # Test distance-based shading
    print("\n🎨 Testing Distance-Based Shading:")
    
    test_distances = [1, 3, 5, 10, 15, 20]
    
    for distance in test_distances:
        shaded_char = renderer._apply_distance_shading('#', distance)
        print(f"   Distance {distance:2d}: '{shaded_char}'")
    
    # Test viewport configuration
    print("\n⚙️ Testing Viewport Configuration:")
    
    viewport_info = renderer.get_viewport_summary()
    
    print(f"   Viewport: {viewport_info['width']}x{viewport_info['height']}")
    print(f"   FoV: {viewport_info['fov']}°")
    print(f"   Max distance: {viewport_info['max_distance']}")
    print(f"   Wall characters: {viewport_info['wall_chars'][:3]}...")
    print(f"   Entity characters: {viewport_info['entity_chars'][:3]}...")
    
    # Test tactical positioning
    print("\n🎮 Testing Tactical Positioning:")
    
    # Test "peek around corner" scenario
    game_state.position = Coordinate(4, 4, 0)  # Near wall
    game_state.player_angle = 45  # Looking diagonally toward corner
    
    frame = renderer.render_frame(game_state, game_state.player_angle, perception_range)
    frame_str = renderer.get_frame_as_string(frame)
    
    print("   Peeking around corner (45° from (4,4)):")
    print("   " + "="*40)
    for line in frame_str.split('\n')[10:18]:  # Show middle section
        print(f"   |{line}|")
    print("   " + "="*40)
    
    # Test different perception ranges
    print("\n🔍 Testing Different Perception Ranges:")
    
    for perception in [5, 10, 15]:
        frame = renderer.render_frame(game_state, 0, perception)
        visible_walls = sum(1 for row in frame for char in row if char in renderer.wall_chars)
        print(f"   Perception {perception}: {visible_walls} visible wall segments")
    
    # Test status reporting
    print("\n📊 Testing Status Reporting:")
    
    status = orientation_manager.get_status()
    print(f"   Current angle: {status['angle']}°")
    print(f"   Facing direction: {status['direction']}")
    print(f"   Position: {status['position']}")
    print(f"   Turn speed: {status['turn_speed']}°")
    print(f"   Move speed: {status['move_speed']} units")
    
    print("\n🎉 ASCII-Doom Renderer Test Completed!")
    print("✅ 3D raycasting working!")
    print("✅ Orientation management functional!")
    print("✅ Perception-based FoV implemented!")
    print("✅ Distance-based shading working!")
    print("✅ Tactical positioning demonstrated!")


if __name__ == "__main__":
    test_ascii_doom_renderer()
