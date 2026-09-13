"""
Environmental Polish System - ADR 106: Procedural Clutter
Adds visual richness through grass tufts, shadows, and environmental details
"""

import tkinter as tk
import math
import random
import time
from typing import List, Tuple, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
from loguru import logger

from .ppu_tk_native_enhanced import DitherPattern, DitherPresets


class ClutterType(Enum):
    """Types of environmental clutter"""
    GRASS_TUFT = "grass_tuft"
    SMALL_ROCK = "small_rock"
    PEBBLE = "pebble"
    LEAF = "leaf"
    TWIG = "twig"
    FLOWER_PETAL = "flower_petal"
    DUST_PARTICLE = "dust_particle"


@dataclass
class ClutterElement:
    """Individual environmental clutter element"""
    x: int
    y: int
    clutter_type: ClutterType
    size: float  # Size multiplier (0.5 to 1.5)
    sway_offset: float  # For wind animation
    color_variation: str  # Slight color variation
    depth: int  # Rendering depth (0=background, 1=mid, 2=foreground)


class EnvironmentalPolish:
    """
    Environmental polish system that adds:
    - Procedural grass tufts with wind sway
    - Small rocks and pebbles with shadows
    - Leaves and petals with gentle drift
    - Dust particles for atmosphere
    """
    
    def __init__(self, canvas: tk.Canvas):
        self.canvas = canvas
        self.clutter_elements: List[ClutterElement] = []
        self.clutter_canvas_items: Dict[int, ClutterElement] = {}
        
        # Animation parameters
        self.wind_strength = 0.5
        self.wind_frequency = 0.3  # Hz
        self.animation_time = 0.0
        
        # Color palettes for different materials
        self.color_palettes = {
            ClutterType.GRASS_TUFT: ["#3a6b35", "#4b7845", "#5c8745", "#2d5a27"],
            ClutterType.SMALL_ROCK: ["#858585", "#959595", "#757575", "#a5a5a5"],
            ClutterType.PEBBLE: ["#9e9e9e", "#aeaeae", "#bebebe", "#cecece"],
            ClutterType.LEAF: ["#8b4513", "#a0522d", "#cd853f", "#daa520"],
            ClutterType.TWIG: ["#654321", "#704214", "#5d4e37", "#8b7355"],
            ClutterType.FLOWER_PETAL: ["#ff69b4", "#ff1493", "#ff6eb4", "#ffc0cb"],
            ClutterType.DUST_PARTICLE: ["#f5f5f5", "#fafafa", "#ffffff", "#e0e0e0"]
        }
        
        logger.info("🌿 Environmental polish system initialized")
    
    def generate_clutter_for_terrain(self, terrain_type: str, x: int, y: int, density: float = 0.3) -> None:
        """Generate clutter for a specific terrain tile"""
        if terrain_type == "grass":
            self._generate_grass_clutter(x, y, density)
        elif terrain_type == "stone_ground":
            self._generate_stone_clutter(x, y, density * 0.5)
        elif terrain_type == "dirt_path":
            self._generate_path_clutter(x, y, density * 0.2)
    
    def _generate_grass_clutter(self, tile_x: int, tile_y: int, density: float) -> None:
        """Generate grass tufts and related clutter"""
        # Number of grass tufts based on density
        num_tufts = int(random.uniform(1, 3) * density)
        
        for _ in range(num_tufts):
            # Random position within tile
            offset_x = random.uniform(-6, 6)
            offset_y = random.uniform(-6, 6)
            
            clutter = ClutterElement(
                x=int(tile_x * 32 + offset_x),  # 32 pixels per tile (8x4 scale)
                y=int(tile_y * 32 + offset_y),
                clutter_type=ClutterType.GRASS_TUFT,
                size=random.uniform(0.7, 1.3),
                sway_offset=random.uniform(0, 2 * math.pi),
                color_variation=random.choice(self.color_palettes[ClutterType.GRASS_TUFT]),
                depth=random.choice([0, 1])  # Background or mid-depth
            )
            
            self.clutter_elements.append(clutter)
        
        # Occasionally add leaves or petals
        if random.random() < 0.1:  # 10% chance
            self._add_leaf_or_petal(tile_x, tile_y)
    
    def _generate_stone_clutter(self, tile_x: int, tile_y: int, density: float) -> None:
        """Generate small rocks and pebbles"""
        num_rocks = int(random.uniform(0, 2) * density)
        
        for _ in range(num_rocks):
            offset_x = random.uniform(-6, 6)
            offset_y = random.uniform(-6, 6)
            
            clutter_type = random.choice([ClutterType.SMALL_ROCK, ClutterType.PEBBLE])
            
            clutter = ClutterElement(
                x=int(tile_x * 32 + offset_x),
                y=int(tile_y * 32 + offset_y),
                clutter_type=clutter_type,
                size=random.uniform(0.5, 1.2),
                sway_offset=0,  # Rocks don't sway
                color_variation=random.choice(self.color_palettes[clutter_type]),
                depth=1  # Always mid-depth for rocks
            )
            
            self.clutter_elements.append(clutter)
    
    def _generate_path_clutter(self, tile_x: int, tile_y: int, density: float) -> None:
        """Generate minimal clutter for paths (dust, small pebbles)"""
        if random.random() < density:
            offset_x = random.uniform(-6, 6)
            offset_y = random.uniform(-6, 6)
            
            clutter = ClutterElement(
                x=int(tile_x * 32 + offset_x),
                y=int(tile_y * 32 + offset_y),
                clutter_type=ClutterType.DUST_PARTICLE,
                size=random.uniform(0.3, 0.7),
                sway_offset=0,
                color_variation=random.choice(self.color_palettes[ClutterType.DUST_PARTICLE]),
                depth=0  # Background depth
            )
            
            self.clutter_elements.append(clutter)
    
    def _add_leaf_or_petal(self, tile_x: int, tile_y: int) -> None:
        """Add a leaf or flower petal"""
        clutter_type = random.choice([ClutterType.LEAF, ClutterType.FLOWER_PETAL])
        
        offset_x = random.uniform(-8, 8)
        offset_y = random.uniform(-8, 8)
        
        clutter = ClutterElement(
            x=int(tile_x * 32 + offset_x),
            y=int(tile_y * 32 + offset_y),
            clutter_type=clutter_type,
            size=random.uniform(0.4, 0.8),
            sway_offset=random.uniform(0, 2 * math.pi),
            color_variation=random.choice(self.color_palettes[clutter_type]),
            depth=random.choice([0, 1, 2])  # Any depth
        )
        
        self.clutter_elements.append(clutter)
    
    def render_clutter(self) -> None:
        """Render all clutter elements"""
        # Clear previous clutter
        self.canvas.delete("clutter")
        self.clutter_canvas_items.clear()
        
        # Sort by depth for proper rendering order
        sorted_clutter = sorted(self.clutter_elements, key=lambda c: c.depth)
        
        for clutter in sorted_clutter:
            canvas_item = self._render_clutter_element(clutter)
            if canvas_item:
                self.clutter_canvas_items[canvas_item] = clutter
    
    def _render_clutter_element(self, clutter: ClutterElement) -> Optional[int]:
        """Render individual clutter element"""
        try:
            if clutter.clutter_type == ClutterType.GRASS_TUFT:
                return self._render_grass_tuft(clutter)
            elif clutter.clutter_type == ClutterType.SMALL_ROCK:
                return self._render_small_rock(clutter)
            elif clutter.clutter_type == ClutterType.PEBBLE:
                return self._render_pebble(clutter)
            elif clutter.clutter_type == ClutterType.LEAF:
                return self._render_leaf(clutter)
            elif clutter.clutter_type == ClutterType.FLOWER_PETAL:
                return self._render_flower_petal(clutter)
            elif clutter.clutter_type == ClutterType.DUST_PARTICLE:
                return self._render_dust_particle(clutter)
            else:
                return None
        except Exception as e:
            logger.error(f"⚠️ Error rendering clutter element: {e}")
            return None
    
    def _render_grass_tuft(self, clutter: ClutterElement) -> int:
        """Render grass tuft with wind sway"""
        # Calculate wind sway
        sway_amount = 2 * clutter.size * math.sin(
            2 * math.pi * self.wind_frequency * self.animation_time + clutter.sway_offset
        )
        
        # Grass tuft dimensions
        base_width = int(4 * clutter.size)
        height = int(8 * clutter.size)
        
        # Draw grass blades
        points = []
        for i in range(3):  # 3 blades of grass
            blade_x = clutter.x + (i - 1) * 2 + sway_amount
            blade_top_y = clutter.y - height + random.randint(-1, 1)
            
            points.extend([
                blade_x, clutter.y,  # Base
                blade_x + sway_amount/2, blade_top_y  # Top with sway
            ])
        
        # Create grass as lines
        grass_item = self.canvas.create_line(
            points,
            fill=clutter.color_variation,
            width=1,
            smooth=True,
            tags="clutter"
        )
        
        return grass_item
    
    def _render_small_rock(self, clutter: ClutterElement) -> int:
        """Render small rock with shadow"""
        # Rock dimensions
        size = int(6 * clutter.size)
        
        # Draw shadow first
        shadow_offset = 2
        shadow_item = self.canvas.create_oval(
            clutter.x - size//2 + shadow_offset,
            clutter.y - size//2 + shadow_offset,
            clutter.x + size//2 + shadow_offset,
            clutter.y + size//2 + shadow_offset,
            fill="#000000",
            outline="",
            stipple="gray50",
            tags="clutter"
        )
        
        # Draw rock
        rock_item = self.canvas.create_oval(
            clutter.x - size//2,
            clutter.y - size//2,
            clutter.x + size//2,
            clutter.y + size//2,
            fill=clutter.color_variation,
            outline="",
            tags="clutter"
        )
        
        return rock_item  # Return main rock item
    
    def _render_pebble(self, clutter: ClutterElement) -> int:
        """Render small pebble"""
        size = int(3 * clutter.size)
        
        return self.canvas.create_oval(
            clutter.x - size//2,
            clutter.y - size//2,
            clutter.x + size//2,
            clutter.y + size//2,
            fill=clutter.color_variation,
            outline="",
            tags="clutter"
        )
    
    def _render_leaf(self, clutter: ClutterElement) -> int:
        """Render leaf with gentle drift"""
        # Leaf shape (simplified as teardrop)
        size = int(4 * clutter.size)
        
        # Add gentle drift animation
        drift = math.sin(self.animation_time + clutter.sway_offset) * 1
        
        points = [
            clutter.x + drift, clutter.y - size,  # Top point
            clutter.x - size//2 + drift, clutter.y,  # Left base
            clutter.x + drift, clutter.y + size//2,  # Bottom point
            clutter.x + size//2 + drift, clutter.y,  # Right base
        ]
        
        return self.canvas.create_polygon(
            points,
            fill=clutter.color_variation,
            outline="",
            tags="clutter"
        )
    
    def _render_flower_petal(self, clutter: ClutterType) -> int:
        """Render flower petal"""
        size = int(3 * clutter.size)
        
        # Petal shape (ellipse)
        return self.canvas.create_oval(
            clutter.x - size,
            clutter.y - size//2,
            clutter.x + size,
            clutter.y + size//2,
            fill=clutter.color_variation,
            outline="",
            tags="clutter"
        )
    
    def _render_dust_particle(self, clutter: ClutterElement) -> int:
        """Render dust particle"""
        size = int(2 * clutter.size)
        
        return self.canvas.create_oval(
            clutter.x - size,
            clutter.y - size,
            clutter.x + size,
            clutter.y + size,
            fill=clutter.color_variation,
            outline="",
            tags="clutter"
        )
    
    def update_animation(self, delta_time: float) -> None:
        """Update environmental animations"""
        self.animation_time += delta_time
        
        # Update wind strength (varies over time)
        self.wind_strength = 0.5 + 0.3 * math.sin(self.animation_time * 0.1)
        
        # Re-render animated clutter
        self.render_clutter()
    
    def clear_clutter(self) -> None:
        """Clear all clutter elements"""
        self.canvas.delete("clutter")
        self.clutter_elements.clear()
        self.clutter_canvas_items.clear()
    
    def get_clutter_stats(self) -> Dict[str, Any]:
        """Get clutter statistics"""
        type_counts = {}
        for clutter in self.clutter_elements:
            type_name = clutter.clutter_type.value
            type_counts[type_name] = type_counts.get(type_name, 0) + 1
        
        return {
            'total_elements': len(self.clutter_elements),
            'by_type': type_counts,
            'wind_strength': self.wind_strength,
            'animation_time': self.animation_time
        }


# Factory function
def create_environmental_polish(canvas: tk.Canvas) -> EnvironmentalPolish:
    """Create environmental polish system"""
    return EnvironmentalPolish(canvas)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test environmental polish
    root = tk.Tk()
    root.title("Environmental Polish Test")
    root.geometry("600x400")
    root.configure(bg='#1a1a1a')
    
    canvas = tk.Canvas(root, width=600, height=300, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Create environmental polish system
    env_polish = create_environmental_polish(canvas)
    
    # Generate test clutter
    # Simulate a 3x3 grid of terrain
    for y in range(3):
        for x in range(3):
            terrain_type = ["grass", "stone_ground", "dirt_path"][random.randint(0, 2)]
            env_polish.generate_clutter_for_terrain(terrain_type, x, y, density=0.5)
    
    # Initial render
    env_polish.render_clutter()
    
    # Animation loop
    last_time = [time.time()]  # Use list to allow modification in nested function
    
    def update_loop():
        current_time = time.time()
        delta_time = current_time - last_time[0]
        last_time[0] = current_time
        
        env_polish.update_animation(delta_time)
        
        root.after(50, update_loop)  # 20 FPS
    
    # Controls
    control_frame = tk.Frame(root, bg='#1a1a1a')
    control_frame.pack()
    
    def regenerate():
        env_polish.clear_clutter()
        for y in range(3):
            for x in range(3):
                terrain_type = ["grass", "stone_ground", "dirt_path"][random.randint(0, 2)]
                env_polish.generate_clutter_for_terrain(terrain_type, x, y, density=0.5)
        env_polish.render_clutter()
    
    def show_stats():
        stats = env_polish.get_clutter_stats()
        print(f"📊 Clutter Stats: {stats}")
    
    tk.Button(control_frame, text="Regenerate", command=regenerate).pack(side=tk.LEFT, padx=5)
    tk.Button(control_frame, text="Show Stats", command=show_stats).pack(side=tk.LEFT, padx=5)
    
    # Start animation
    update_loop()
    
    print("🌿 Environmental Polish Test running - Close window to exit")
    root.mainloop()
