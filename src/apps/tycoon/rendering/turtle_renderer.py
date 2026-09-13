"""
Turtle Renderer - Visual Handshake for Sovereign Turtles

Sprint E1: Turbo Entity Synthesis - Visual Layer
ADR 218: Genome-to-Visual Pipeline

Connects the Sovereign Turtle entity to the rendering system,
ensuring that genetic traits are visually represented in the viewport.
Even with placeholder sprites, the shell_base_color from the genome
is reflected in the visual output.
"""

from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import math

from foundation.types import Result
from foundation.protocols import Vector2Protocol
from foundation.vector import Vector2
from foundation.registry import DGTRegistry, RegistryType
from ..entities.turtle import SovereignTurtle


@dataclass
class TurtleRenderData:
    """Render data for a turtle entity"""
    entity_id: str
    position: Tuple[float, float]
    velocity: Tuple[float, float]
    heading: float
    shell_color: Tuple[int, int, int]
    shell_pattern: str
    shell_pattern_color: Tuple[int, int, int]
    body_color: Tuple[int, int, int]
    size: float
    radius: float
    energy: float
    active: bool


class TurtleRenderer:
    """
    Turtle Renderer - Visual Handshake Component
    
    Handles the visual representation of Sovereign Turtles,
    translating genetic traits into renderable data.
    """
    
    def __init__(self):
        self.render_cache: Dict[str, TurtleRenderData] = {}
        self.registry = DGTRegistry()
        
        # Visual constants
        self.base_turtle_size = 10.0  # Base size in pixels
        self.shell_size_factor = 1.5  # Shell is 1.5x body size
        
    def render_turtle(self, turtle: SovereignTurtle) -> Result[TurtleRenderData]:
        """
        Convert turtle entity to render data.
        
        Args:
            turtle: SovereignTurtle entity
            
        Returns:
            Result containing render data
        """
        try:
            # Extract visual data from genome
            genome = turtle.genome
            
            # Calculate visual size based on shell size modifier
            visual_size = self.base_turtle_size * turtle.genome.shell_size_modifier
            
            # Create render data
            render_data = TurtleRenderData(
                entity_id=turtle.turtle_id,
                position=turtle.position.to_tuple(),
                velocity=turtle.velocity.to_tuple(),
                heading=turtle.heading,
                shell_color=genome.shell_base_color,
                shell_pattern=genome.shell_pattern_type.value,
                shell_pattern_color=genome.shell_pattern_color,
                body_color=genome.body_base_color,
                size=visual_size,
                radius=turtle.radius,
                energy=turtle.energy,
                active=turtle.active
            )
            
            # Cache render data
            self.render_cache[turtle.turtle_id] = render_data
            
            return Result.success_result(render_data)
            
        except Exception as e:
            return Result.failure_result(f"Failed to render turtle: {str(e)}")
    
    def render_all_turtles(self) -> Result[List[TurtleRenderData]]:
        """
        Render all registered turtles.
        
        Returns:
            Result containing list of render data for all turtles
        """
        try:
            render_data_list = []
            
            # Get all entities from registry
            entities_result = self.registry.list_items(RegistryType.ENTITY)
            if not entities_result.success:
                return Result.failure_result(f"Failed to list entities: {entities_result.error}")
            
            # Filter for turtle entities
            for entity_id in entities_result.value:
                entity_result = self.registry.get(entity_id, RegistryType.ENTITY)
                if entity_result.success:
                    entity = entity_result.value
                    
                    # Check if this is a turtle entity
                    if hasattr(entity, 'turtle_id') and hasattr(entity, 'genome'):
                        turtle_render_result = self.render_turtle(entity)
                        if turtle_render_result.success:
                            render_data_list.append(turtle_render_result.value)
            
            return Result.success_result(render_data_list)
            
        except Exception as e:
            return Result.failure_result(f"Failed to render all turtles: {str(e)}")
    
    def get_turtle_sprite_data(self, render_data: TurtleRenderData) -> Dict[str, Any]:
        """
        Generate sprite data for turtle rendering.
        
        Args:
            render_data: Turtle render data
            
        Returns:
            Dictionary containing sprite rendering information
        """
        # Calculate sprite dimensions
        shell_size = render_data.size * self.shell_size_factor
        body_size = render_data.size
        
        # Generate sprite layers
        sprite_data = {
            'entity_id': render_data.entity_id,
            'position': render_data.position,
            'heading': render_data.heading,
            'layers': [
                {
                    'type': 'body',
                    'color': render_data.body_color,
                    'size': body_size,
                    'shape': 'ellipse'
                },
                {
                    'type': 'shell',
                    'color': render_data.shell_color,
                    'size': shell_size,
                    'shape': 'ellipse',
                    'pattern': render_data.shell_pattern,
                    'pattern_color': render_data.shell_pattern_color
                }
            ],
            'effects': [],
            'energy_bar': {
                'current': render_data.energy,
                'maximum': 100.0,
                'color': self._get_energy_bar_color(render_data.energy)
            },
            'velocity_indicator': {
                'velocity': render_data.velocity,
                'show': render_data.velocity[0]**2 + render_data.velocity[1]**2 > 0.01  # Show if moving
            }
        }
        
        return sprite_data
    
    def _get_energy_bar_color(self, energy: float) -> Tuple[int, int, int]:
        """Get energy bar color based on energy level"""
        if energy > 70:
            return (0, 255, 0)  # Green
        elif energy > 30:
            return (255, 255, 0)  # Yellow
        else:
            return (255, 0, 0)  # Red
    
    def generate_placeholder_sprite(self, render_data: TurtleRenderData) -> str:
        """
        Generate ASCII placeholder sprite for turtle.
        
        Args:
            render_data: Turtle render data
            
        Returns:
            ASCII art representation of turtle
        """
        # Simple ASCII turtle representation
        if render_data.energy > 50:
            turtle_char = "🐢"  # Full energy turtle
        elif render_data.energy > 20:
            turtle_char = "🐌"  # Low energy turtle
        else:
            turtle_char = "💤"  # Sleeping turtle
        
        return turtle_char
    
    def update_registry_with_render_data(self) -> Result[None]:
        """
        Update registry with render data for all turtles.
        
        Returns:
            Result indicating success
        """
        try:
            render_result = self.render_all_turtles()
            if not render_result.success:
                return render_result
            
            for render_data in render_result.value:
                # Update entity metadata with render information
                sprite_data = self.get_turtle_sprite_data(render_data)
                
                self.registry.register(
                    f"entity_{render_data.entity_id}",
                    None,  # We're just updating metadata
                    RegistryType.ENTITY,
                    {
                        'entity_type': 'turtle',
                        'turtle_id': render_data.entity_id,
                        'render_data': sprite_data,
                        'position': render_data.position,
                        'velocity': render_data.velocity,
                        'energy': render_data.energy,
                        'active': render_data.active,
                        'last_render_time': __import__('time').time()
                    }
                )
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to update registry with render data: {str(e)}")
    
    def get_render_statistics(self) -> Dict[str, Any]:
        """Get rendering statistics"""
        return {
            'cached_turtles': len(self.render_cache),
            'total_turtles': len(self.render_cache),
            'render_calls': len(self.render_cache),
            'last_update': __import__('time').time()
        }


class SimpleTurtleViewport:
    """
    Simple viewport for displaying turtles with placeholder sprites.
    
    This provides a basic visual representation that can be
    replaced with a proper graphics system later.
    """
    
    def __init__(self, width: int = 160, height: int = 144):
        self.width = width
        self.height = height
        self.renderer = TurtleRenderer()
        self.last_render_time = 0.0
        
        # Viewport state
        self.center_x = width // 2
        self.center_y = height // 2
        self.zoom = 1.0
    
    def render_frame(self) -> Result[str]:
        """
        Render a frame of the viewport.
        
        Returns:
            Result containing ASCII representation of the frame
        """
        try:
            # Get all turtle render data
            render_result = self.renderer.render_all_turtles()
            if not render_result.success:
                return Result.failure_result(f"Failed to get render data: {render_result.error}")
            
            # Create ASCII viewport
            viewport = [[' ' for _ in range(self.width)] for _ in range(self.height)]
            
            # Place turtles in viewport
            for render_data in render_result.value:
                x, y = render_data.position
                
                # Convert to viewport coordinates
                vx = int(x) % self.width
                vy = int(y) % self.height
                
                # Place turtle character
                if 0 <= vx < self.width and 0 <= vy < self.height:
                    turtle_char = self.renderer.generate_placeholder_sprite(render_data)
                    viewport[vy][vx] = turtle_char
            
            # Convert viewport to string
            frame_lines = [''.join(row) for row in viewport]
            frame_str = '\n'.join(frame_lines)
            
            # Add header information
            header = f"Turtle Viewport - {len(render_result.value)} turtles\n"
            header += f"Time: {__import__('time').time():.1f}s\n"
            header += "-" * self.width + "\n"
            
            full_frame = header + frame_str
            
            self.last_render_time = __import__('time').time()
            
            return Result.success_result(full_frame)
            
        except Exception as e:
            return Result.failure_result(f"Failed to render frame: {str(e)}")
    
    def print_frame(self) -> Result[None]:
        """Print the current frame to console"""
        frame_result = self.render_frame()
        if frame_result.success:
            print("\n" + frame_result.value + "\n")
        return frame_result


# === FACTORY FUNCTIONS ===

def create_turtle_renderer() -> TurtleRenderer:
    """Create a turtle renderer instance"""
    return TurtleRenderer()


def create_turtle_viewport(width: int = 160, height: int = 144) -> SimpleTurtleViewport:
    """Create a simple turtle viewport"""
    return SimpleTurtleViewport(width, height)


# === EXPORTS ===

__all__ = [
    'TurtleRenderData',
    'TurtleRenderer',
    'SimpleTurtleViewport',
    'create_turtle_renderer',
    'create_turtle_viewport'
]
