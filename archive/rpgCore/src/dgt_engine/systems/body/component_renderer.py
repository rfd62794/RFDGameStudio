"""
DGT Component Renderer - PPU Extension Framework
Modular rendering system for ship components and visual effects

Extends the PPU engine with component-based rendering capabilities
Supports layered compositing, VFX, and dynamic visual effects
"""

import math
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class RenderLayer(int, Enum):
    """Render layer ordering for proper depth sorting"""
    BACKGROUND = 0
    TERRAIN = 1
    SHIP_FRAME = 10
    SHIP_ENGINE = 11
    SHIP_WEAPON = 12
    VFX_BEHIND = 13
    PARTICLES = 14
    VFX_FRONT = 15
    HUD = 20
    OVERLAY = 30


@dataclass
class ComponentSprite:
    """Individual component sprite with rendering properties"""
    asset_name: str
    x: int
    y: int
    width: int
    height: int
    color_tint: Tuple[int, int, int] = (255, 255, 255)
    scale: float = 1.0
    rotation: float = 0.0
    alpha: int = 255
    layer: RenderLayer = RenderLayer.SHIP_FRAME
    flip_horizontal: bool = False
    flip_vertical: bool = False
    
    def get_bounds(self) -> Tuple[int, int, int, int]:
        """Get sprite bounds (x, y, width, height)"""
        scaled_width = int(self.width * self.scale)
        scaled_height = int(self.height * self.scale)
        
        # Calculate position accounting for rotation center
        center_x = self.x + scaled_width // 2
        center_y = self.y + scaled_height // 2
        
        # Simple bounds calculation (rotation not accounted for)
        return (
            center_x - scaled_width // 2,
            center_y - scaled_height // 2,
            scaled_width,
            scaled_height
        )
    
    def collides_with(self, other: 'ComponentSprite') -> bool:
        """Check collision with another sprite"""
        bounds1 = self.get_bounds()
        bounds2 = other.get_bounds()
        
        return not (
            bounds1[0] + bounds1[2] < bounds2[0] or
            bounds2[0] + bounds2[2] < bounds1[0] or
            bounds1[1] + bounds1[3] < bounds2[1] or
            bounds2[1] + bounds2[3] < bounds1[1]
        )


@dataclass
class VisualEffect:
    """Visual effect with animation properties"""
    effect_type: str
    x: int
    y: int
    duration: float
    start_time: float
    color: Tuple[int, int, int] = (255, 255, 255)
    scale: float = 1.0
    alpha: int = 255
    layer: RenderLayer = RenderLayer.VFX_FRONT
    
    def is_expired(self, current_time: float) -> bool:
        """Check if effect has expired"""
        return current_time - self.start_time >= self.duration
    
    def get_progress(self, current_time: float) -> float:
        """Get animation progress (0.0 to 1.0)"""
        if self.duration <= 0:
            return 1.0
        return min(1.0, (current_time - self.start_time) / self.duration)


class ComponentRenderer:
    """Extended PPU renderer for component-based ships and effects"""
    
    def __init__(self, ppu_engine):
        self.ppu = ppu_engine
        self.components: Dict[str, ComponentSprite] = {}
        self.effects: List[VisualEffect] = []
        self.current_time = 0.0
        
        # Asset registry for ship components
        self.asset_registry = {
            'frames': {
                'light': {'width': 32, 'height': 32},
                'medium': {'width': 40, 'height': 40},
                'heavy': {'width': 48, 'height': 48},
                'stealth': {'width': 36, 'height': 36}
            },
            'engines': {
                'ion': {'width': 16, 'height': 16},
                'fusion': {'width': 20, 'height': 20},
                'antimatter': {'width': 24, 'height': 24},
                'solar': {'width': 18, 'height': 18},
                'warp': {'width': 22, 'height': 22}
            },
            'weapons': {
                'laser': {'width': 12, 'height': 8},
                'plasma': {'width': 14, 'height': 10},
                'missile': {'width': 16, 'height': 6},
                'railgun': {'width': 18, 'height': 8},
                'particle': {'width': 10, 'height': 10}
            },
            'vfx': {
                'laser_beam': {'width': 40, 'height': 2},
                'laser_flash': {'width': 8, 'height': 8},
                'explosion': {'width': 32, 'height': 32},
                'shield_bubble': {'width': 48, 'height': 48},
                'repair_spark': {'width': 4, 'height': 4},
                'engine_glow': {'width': 24, 'height': 24}
            }
        }
        
        logger.info("🚀 Component Renderer initialized")
    
    def register_component(self, component_id: str, sprite: ComponentSprite):
        """Register a component sprite"""
        self.components[component_id] = sprite
        logger.debug(f"🚀 Registered component: {component_id}")
    
    def remove_component(self, component_id: str):
        """Remove a component sprite"""
        if component_id in self.components:
            del self.components[component_id]
            logger.debug(f"🚀 Removed component: {component_id}")
    
    def create_ship_sprite(self, ship_id: str, ship_data: Dict[str, Any]) -> str:
        """Create a complete ship from genetic data"""
        components = []
        
        # Extract genetic data
        genome = ship_data.get('genome', {})
        position = ship_data.get('position', (0, 0))
        
        # Create frame component
        frame_type = genome.get('hull_type', 'medium')
        frame_asset = self.asset_registry['frames'].get(frame_type, self.asset_registry['frames']['medium'])
        
        frame_sprite = ComponentSprite(
            asset_name=f"frame_{frame_type}",
            x=position[0],
            y=position[1],
            width=frame_asset['width'],
            height=frame_asset['height'],
            color_tint=self._get_hull_color(genome),
            layer=RenderLayer.SHIP_FRAME
        )
        components.append(('frame', frame_sprite))
        
        # Create engine component
        engine_type = genome.get('engine_type', 'ion')
        engine_asset = self.asset_registry['engines'].get(engine_type, self.asset_registry['engines']['ion'])
        
        engine_sprite = ComponentSprite(
            asset_name=f"engine_{engine_type}",
            x=position[0],
            y=position[1] + 10,
            width=engine_asset['width'],
            height=engine_asset['height'],
            color_tint=self._get_engine_color(genome),
            layer=RenderLayer.SHIP_ENGINE
        )
        components.append(('engine', engine_sprite))
        
        # Create weapon component
        weapon_type = genome.get('primary_weapon', 'laser')
        weapon_asset = self.asset_registry['weapons'].get(weapon_type, self.asset_registry['weapons']['laser'])
        
        weapon_sprite = ComponentSprite(
            asset_name=f"weapon_{weapon_type}",
            x=position[0],
            y=position[1] - 8,
            width=weapon_asset['width'],
            height=weapon_asset['height'],
            color_tint=self._get_weapon_color(genome),
            layer=RenderLayer.SHIP_WEAPON
        )
        components.append(('weapon', weapon_sprite))
        
        # Register all components
        for comp_type, sprite in components:
            comp_id = f"{ship_id}_{comp_type}"
            self.register_component(comp_id, sprite)
        
        return ship_id
    
    def update_ship_position(self, ship_id: str, new_position: Tuple[int, int]):
        """Update ship and all component positions"""
        for comp_id, sprite in self.components.items():
            if comp_id.startswith(ship_id):
                old_x, old_y = sprite.x, sprite.y
                dx, dy = new_position[0] - old_x, new_position[1] - old_y
                sprite.x += dx
                sprite.y += dy
    
    def update_ship_damage(self, ship_id: str, damage_percent: float):
        """Update ship visual based on damage"""
        for comp_id, sprite in self.components.items():
            if comp_id.startswith(ship_id):
                # Reduce alpha based on damage
                sprite.alpha = max(50, int(255 * (1.0 - damage_percent)))
                
                # Add damage effect
                if damage_percent > 0.5:
                    self.add_effect(
                        f"{comp_id}_damage",
                        'damage_spark',
                        sprite.x,
                        sprite.y,
                        duration=1.0,
                        color=(255, 100, 100)
                    )
    
    def add_effect(self, effect_id: str, effect_type: str, x: int, y: int, 
                   duration: float = 1.0, color: Tuple[int, int, int] = (255, 255, 255),
                   scale: float = 1.0, layer: RenderLayer = RenderLayer.VFX_FRONT):
        """Add a visual effect"""
        effect = VisualEffect(
            effect_type=effect_type,
            x=x,
            y=y,
            duration=duration,
            start_time=self.current_time,
            color=color,
            scale=scale,
            layer=layer
        )
        self.effects.append(effect)
        logger.debug(f"🚀 Added effect: {effect_id} ({effect_type})")
    
    def create_laser_effect(self, source_x: int, source_y: int, target_x: int, target_y: int):
        """Create laser beam effect between two points"""
        # Calculate beam properties
        dx = target_x - source_x
        dy = target_y - source_y
        distance = math.sqrt(dx*dx + dy*dy)
        angle = math.degrees(math.atan2(dy, dx))
        
        # Create laser beam
        beam_sprite = ComponentSprite(
            asset_name='laser_beam',
            x=source_x,
            y=source_y,
            width=int(distance),
            height=2,
            color_tint=(255, 100, 100),
            rotation=angle,
            layer=RenderLayer.VFX_FRONT,
            alpha=200
        )
        
        beam_id = f"laser_{self.current_time}"
        self.register_component(beam_id, beam_sprite)
        
        # Add flash effects
        self.add_effect(f"{beam_id}_flash", 'laser_flash', source_x, source_y, 0.2)
        self.add_effect(f"{beam_id}_flash", 'laser_flash', target_x, target_y, 0.2)
        
        # Auto-remove beam after duration
        self.add_effect(f"{beam_id}_cleanup", 'cleanup', source_x, source_y, 0.5)
        
        return beam_id
    
    def create_explosion_effect(self, x: int, y: int, intensity: float = 1.0):
        """Create explosion effect"""
        explosion_size = int(32 * intensity)
        
        # Create multiple explosion particles
        for i in range(int(5 * intensity)):
            offset_x = x + int((i - 2.5) * 8 * intensity)
            offset_y = y + int((i % 3 - 1) * 8 * intensity)
            
            self.add_effect(
                f"explosion_{x}_{y}_{i}",
                'explosion_particle',
                offset_x,
                offset_y,
                duration=0.5 + random.random() * 0.5,
                color=(255, 150 + int(random.random() * 105), 50),
                scale=0.5 + random.random() * 0.5
            )
        
        # Main explosion
        self.add_effect(
            f"explosion_main_{x}_{y}",
            'explosion',
            x,
            y,
            duration=1.0,
            scale=intensity,
            color=(255, 200, 100)
        )
    
    def create_shield_effect(self, ship_id: str):
        """Create shield effect around ship"""
        # Find ship components
        ship_components = [comp for comp_id, comp in self.components.items() 
                          if comp_id.startswith(ship_id)]
        
        if ship_components:
            # Use frame component as base
            frame_comp = ship_components[0]
            
            self.add_effect(
                f"shield_{ship_id}",
                'shield_bubble',
                frame_comp.x,
                frame_comp.y,
                duration=2.0,
                color=(100, 200, 255),
                scale=1.2,
                layer=RenderLayer.VFX_BEHIND
            )
    
    def update(self, dt: float):
        """Update all effects and animations"""
        self.current_time += dt
        
        # Remove expired effects
        self.effects = [effect for effect in self.effects if not effect.is_expired(self.current_time)]
        
        # Update component animations
        for sprite in self.components.values():
            if sprite.asset_name.startswith('engine_'):
                # Engine glow animation
                glow_intensity = 0.7 + 0.3 * math.sin(self.current_time * 5)
                sprite.alpha = int(200 * glow_intensity)
    
    def render(self, frame_buffer):
        """Render all components and effects to frame buffer"""
        # Sort by layer order
        render_items = []
        
        # Add components
        for comp_id, sprite in self.components.items():
            render_items.append((sprite.layer, sprite))
        
        # Add effects
        for effect in self.effects:
            effect_sprite = self._create_effect_sprite(effect)
            if effect_sprite:
                render_items.append((effect.layer, effect_sprite))
        
        # Sort by layer
        render_items.sort(key=lambda x: x[0].value)
        
        # Render each item
        for layer, item in render_items:
            if isinstance(item, ComponentSprite):
                self._render_sprite(frame_buffer, item)
            elif isinstance(item, ComponentSprite):
                self._render_sprite(frame_buffer, item)
    
    def _render_sprite(self, frame_buffer, sprite: ComponentSprite):
        """Render individual sprite to frame buffer"""
        # This would integrate with the existing PPU rendering system
        # For now, we'll simulate the rendering process
        
        # Apply transformations
        if sprite.scale != 1.0 or sprite.rotation != 0:
            # Apply scaling and rotation
            pass
        
        # Apply color tint
        if sprite.color_tint != (255, 255, 255):
            # Apply color modification
            pass
        
        # Apply alpha blending
        if sprite.alpha < 255:
            # Apply alpha blending
            pass
        
        # Draw to frame buffer
        # This would call the actual PPU drawing functions
        logger.debug(f"🚀 Rendering sprite: {sprite.asset_name} at ({sprite.x}, {sprite.y})")
    
    def _create_effect_sprite(self, effect: VisualEffect) -> Optional[ComponentSprite]:
        """Create sprite from visual effect"""
        asset_info = self.asset_registry['vfx'].get(effect.effect_type)
        
        if not asset_info:
            return None
        
        # Calculate animation progress
        progress = effect.get_progress(self.current_time)
        
        # Animate scale based on progress
        scale = effect.scale
        if effect.effect_type == 'explosion':
            scale *= (1.0 + progress * 2.0)
        elif effect.effect_type == 'laser_flash':
            scale *= (1.0 - progress)  # Fade out
        
        # Animate alpha based on progress
        alpha = effect.alpha
        if effect.effect_type in ['laser_flash', 'damage_spark']:
            alpha = int(alpha * (1.0 - progress))
        elif effect.effect_type == 'explosion':
            alpha = int(alpha * (1.0 - progress * 0.5))
        
        return ComponentSprite(
            asset_name=effect.effect_type,
            x=effect.x,
            y=effect.y,
            width=asset_info['width'],
            height=asset_info['height'],
            color_tint=effect.color,
            scale=scale,
            alpha=alpha,
            layer=effect.layer
        )
    
    def _get_hull_color(self, genome: Dict[str, Any]) -> Tuple[int, int, int]:
        """Get hull color from genetic data"""
        hull_type = genome.get('hull_type', 'medium')
        plating = genome.get('plating_density', 1.0)
        
        base_colors = {
            'light': (200, 200, 220),
            'medium': (150, 150, 180),
            'heavy': (100, 100, 140),
            'stealth': (50, 50, 80)
        }
        
        base = base_colors.get(hull_type, (150, 150, 180))
        modifier = int((plating - 1.0) * 50)
        
        return tuple(max(0, min(255, c + modifier)) for c in base)
    
    def _get_engine_color(self, genome: Dict[str, Any]) -> Tuple[int, int, int]:
        """Get engine color from genetic data"""
        engine_type = genome.get('engine_type', 'ion')
        thruster = genome.get('thruster_output', 1.0)
        
        base_colors = {
            'ion': (100, 200, 255),
            'fusion': (255, 200, 100),
            'antimatter': (255, 100, 255),
            'solar': (255, 255, 100),
            'warp': (200, 100, 255)
        }
        
        base = base_colors.get(engine_type, (100, 200, 255))
        intensity = min(1.0, thruster / 2.0)
        
        return tuple(int(c * (0.5 + intensity * 0.5)) for c in base)
    
    def _get_weapon_color(self, genome: Dict[str, Any]) -> Tuple[int, int, int]:
        """Get weapon color from genetic data"""
        weapon_type = genome.get('primary_weapon', 'laser')
        damage = genome.get('weapon_damage', 1.0)
        
        base_colors = {
            'laser': (255, 100, 100),
            'plasma': (255, 150, 50),
            'missile': (200, 200, 200),
            'railgun': (150, 255, 150),
            'particle': (255, 100, 255)
        }
        
        base = base_colors.get(weapon_type, (255, 100, 100))
        intensity = min(1.0, damage / 2.0)
        
        return tuple(int(c * (0.7 + intensity * 0.3)) for c in base)
    
    def get_render_stats(self) -> Dict[str, Any]:
        """Get rendering statistics"""
        return {
            'components': len(self.components),
            'effects': len(self.effects),
            'layers_used': len(set(sprite.layer for sprite in self.components.values())),
            'current_time': self.current_time
        }


# Global component renderer instance
component_renderer = None

def initialize_component_renderer(ppu_engine):
    """Initialize global component renderer"""
    global component_renderer
    component_renderer = ComponentRenderer(ppu_engine)
    return component_renderer
