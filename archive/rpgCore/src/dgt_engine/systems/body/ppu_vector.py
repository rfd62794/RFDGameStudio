"""
DGT PPU Vector Engine - ADR 131 Implementation
Procedural triangle-based ship rendering with rotation matrices

Replaces static sprites with dynamic vector graphics
Supports genetic ship shapes and kinetic motion blur effects
"""

import math
import time
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class ShipClass(str, Enum):
    """Ship classification for vertex generation"""
    INTERCEPTOR = "interceptor"     # Fast, narrow triangle
    FIGHTER = "fighter"             # Balanced triangle
    CRUISER = "cruiser"             # Wide, stable triangle
    HEAVY = "heavy"                # Multi-segment hull
    STEALTH = "stealth"             # Angular, sharp design


@dataclass
class Vertex:
    """Individual vertex point"""
    x: float
    y: float
    
    def rotate(self, angle_rad: float, center_x: float = 0.0, center_y: float = 0.0) -> 'Vertex':
        """Rotate vertex around center point"""
        cos_a = math.cos(angle_rad)
        sin_a = math.sin(angle_rad)
        
        # Translate to origin
        tx = self.x - center_x
        ty = self.y - center_y
        
        # Rotate
        rx = tx * cos_a - ty * sin_a
        ry = tx * sin_a + ty * cos_a
        
        # Translate back
        return Vertex(rx + center_x, ry + center_y)
    
    def translate(self, dx: float, dy: float) -> 'Vertex':
        """Translate vertex by offset"""
        return Vertex(self.x + dx, self.y + dy)
    
    def scale(self, factor: float) -> 'Vertex':
        """Scale vertex from origin"""
        return Vertex(self.x * factor, self.y * factor)


@dataclass
class Triangle:
    """Triangle defined by three vertices"""
    v1: Vertex
    v2: Vertex
    v3: Vertex
    
    def get_vertices(self) -> List[Vertex]:
        """Get vertices as list"""
        return [self.v1, self.v2, self.v3]
    
    def rotate(self, angle_rad: float, center_x: float = 0.0, center_y: float = 0.0) -> 'Triangle':
        """Rotate triangle around center point"""
        return Triangle(
            v1=self.v1.rotate(angle_rad, center_x, center_y),
            v2=self.v2.rotate(angle_rad, center_x, center_y),
            v3=self.v3.rotate(angle_rad, center_x, center_y)
        )
    
    def translate(self, dx: float, dy: float) -> 'Triangle':
        """Translate triangle by offset"""
        return Triangle(
            v1=self.v1.translate(dx, dy),
            v2=self.v2.translate(dx, dy),
            v3=self.v3.translate(dx, dy)
        )
    
    def scale(self, factor: float) -> 'Triangle':
        """Scale triangle from origin"""
        return Triangle(
            v1=self.v1.scale(factor),
            v2=self.v2.scale(factor),
            v3=self.v3.scale(factor)
        )
    
    def get_center(self) -> Vertex:
        """Get triangle center point"""
        cx = (self.v1.x + self.v2.x + self.v3.x) / 3.0
        cy = (self.v1.y + self.v2.y + self.v3.y) / 3.0
        return Vertex(cx, cy)


@dataclass
class ShipShape:
    """Procedural ship shape defined by multiple triangles"""
    ship_class: ShipClass
    triangles: List[Triangle]
    color: str = "#00FF00"
    outline_color: str = "#008800"
    scale_factor: float = 1.0
    
    def get_rotated_triangles(self, x: float, y: float, heading: float) -> List[Triangle]:
        """Get all triangles rotated and positioned"""
        angle_rad = math.radians(heading)
        rotated_triangles = []
        
        for triangle in self.triangles:
            # Scale first
            scaled = triangle.scale(self.scale_factor)
            # Then rotate around origin
            rotated = scaled.rotate(angle_rad, 0, 0)
            # Finally translate to position
            positioned = rotated.translate(x, y)
            rotated_triangles.append(positioned)
        
        return rotated_triangles
    
    def get_bounds(self) -> Tuple[float, float, float, float]:
        """Get bounding box of shape"""
        all_vertices = []
        for triangle in self.triangles:
            all_vertices.extend(triangle.get_vertices())
        
        min_x = min(v.x for v in all_vertices) * self.scale_factor
        max_x = max(v.x for v in all_vertices) * self.scale_factor
        min_y = min(v.y for v in all_vertices) * self.scale_factor
        max_y = max(v.y for v in all_vertices) * self.scale_factor
        
        return (min_x, min_y, max_x, max_y)


class ShipShapeGenerator:
    """Generates procedural ship shapes based on class"""
    
    @staticmethod
    def create_interceptor() -> ShipShape:
        """Create fast interceptor shape - narrow triangle"""
        triangles = [
            Triangle(
                Vertex(12, 0),    # Front point
                Vertex(-6, -4),   # Back left
                Vertex(-6, 4)     # Back right
            )
        ]
        return ShipShape(
            ship_class=ShipClass.INTERCEPTOR,
            triangles=triangles,
            color="#00FFFF",  # Cyan
            outline_color="#008888",
            scale_factor=1.0
        )
    
    @staticmethod
    def create_fighter() -> ShipShape:
        """Create balanced fighter shape"""
        triangles = [
            Triangle(
                Vertex(10, 0),    # Front
                Vertex(-8, -6),   # Back left
                Vertex(-8, 6)     # Back right
            )
        ]
        return ShipShape(
            ship_class=ShipClass.FIGHTER,
            triangles=triangles,
            color="#00FF00",  # Green
            outline_color="#008800",
            scale_factor=1.0
        )
    
    @staticmethod
    def create_cruiser() -> ShipShape:
        """Create wide cruiser shape"""
        triangles = [
            Triangle(
                Vertex(8, 0),     # Front
                Vertex(-10, -8),  # Back left
                Vertex(-10, 8)    # Back right
            )
        ]
        return ShipShape(
            ship_class=ShipClass.CRUISER,
            triangles=triangles,
            color="#FFFF00",  # Yellow
            outline_color="#888800",
            scale_factor=1.2
        )
    
    @staticmethod
    def create_heavy() -> ShipShape:
        """Create heavy multi-segment hull"""
        triangles = [
            # Main hull
            Triangle(
                Vertex(10, 0),
                Vertex(-8, -10),
                Vertex(-8, 10)
            ),
            # Engine section
            Triangle(
                Vertex(-8, -4),
                Vertex(-15, -8),
                Vertex(-8, 8)
            )
        ]
        return ShipShape(
            ship_class=ShipClass.HEAVY,
            triangles=triangles,
            color="#FF0000",  # Red
            outline_color="#880000",
            scale_factor=1.5
        )
    
    @staticmethod
    def create_stealth() -> ShipShape:
        """Create angular stealth design"""
        triangles = [
            Triangle(
                Vertex(15, 0),    # Long front point
                Vertex(-5, -3),   # Back left
                Vertex(-5, 3)     # Back right
            ),
            # Wings
            Triangle(
                Vertex(0, -8),    # Left wing
                Vertex(-8, -3),
                Vertex(0, 0)
            ),
            Triangle(
                Vertex(0, 8),     # Right wing
                Vertex(-8, 3),
                Vertex(0, 0)
            )
        ]
        return ShipShape(
            ship_class=ShipClass.STEALTH,
            triangles=triangles,
            color="#FF00FF",  # Magenta
            outline_color="#880088",
            scale_factor=0.9
        )
    
    @classmethod
    def generate_from_genetics(cls, genome_data: Dict[str, Any]) -> ShipShape:
        """Generate ship shape from genetic data"""
        # Map genetic traits to ship class
        thruster_output = genome_data.get('thruster_output', 1.0)
        plating_density = genome_data.get('plating_density', 1.0)
        
        if thruster_output > 2.0:
            return cls.create_interceptor()
        elif plating_density > 1.5:
            return cls.create_heavy()
        elif thruster_output > 1.5:
            return cls.create_fighter()
        else:
            return cls.create_cruiser()


class VectorShipBody:
    """Vector-based ship rendering body"""
    
    def __init__(self, ship_shape: Optional[ShipShape] = None):
        self.ship_shape = ship_shape or ShipShapeGenerator.create_fighter()
        self.last_position = (0.0, 0.0)
        self.last_heading = 0.0
        self.motion_blur_trails: List[Tuple[float, float, float, float]] = []  # (x1, y1, x2, y2)
        self.is_destroyed = False  # Track destruction state
        
        logger.debug(f"🚀 VectorShipBody initialized: {self.ship_shape.ship_class}")
    
    def update_position(self, x: float, y: float, heading: float):
        """Update ship position and track motion for blur effects"""
        # Store motion trail
        if self.last_position != (0, 0):  # Skip first update
            self.motion_blur_trails.append((
                self.last_position[0], self.last_position[1],
                x, y
            ))
            
            # Limit trail length
            if len(self.motion_blur_trails) > 5:
                self.motion_blur_trails.pop(0)
        
        self.last_position = (x, y)
        self.last_heading = heading
    
    def get_render_data(self, x: float, y: float, heading: float) -> Dict[str, Any]:
        """Get render data for PPU"""
        rotated_triangles = self.ship_shape.get_rotated_triangles(x, y, heading)
        
        # Convert triangles to point lists for rendering
        triangle_data = []
        for triangle in rotated_triangles:
            points = [
                (triangle.v1.x, triangle.v1.y),
                (triangle.v2.x, triangle.v2.y),
                (triangle.v3.x, triangle.v3.y)
            ]
            triangle_data.append(points)
        
        return {
            'triangles': triangle_data,
            'color': self.ship_shape.color,
            'outline_color': self.ship_shape.outline_color,
            'motion_trails': self.motion_blur_trails.copy()
        }
    
    def render_to_canvas(self, canvas, x: float, y: float, heading: float):
        """Render ship to Tkinter canvas"""
        render_data = self.get_render_data(x, y, heading)
        
        # Draw motion trails (ghosting effect)
        for trail in render_data['motion_trails']:
            x1, y1, x2, y2 = trail
            # Fade trail based on position in list
            alpha = 0.3
            canvas.create_line(
                x1, y1, x2, y2,
                fill=render_data['color'],
                width=1,
                stipple='gray50'  # Dithered effect
            )
        
        # Draw ship triangles - only if ship is not destroyed
        if not self.is_destroyed:
            for triangle_points in render_data['triangles']:
                canvas.create_polygon(
                    triangle_points,
                    fill=render_data['color'],
                    outline=render_data['outline_color'],
                    width=2
                )
    
    def clear_trails(self):
        """Clear motion blur trails"""
        self.motion_blur_trails.clear()


class ProjectileTracer:
    """Renders projectiles as dithered lines"""
    
    def __init__(self):
        self.tracer_history: Dict[str, List[Tuple[float, float]]] = {}  # projectile_id -> positions
        
    def update_projectile(self, projectile_id: str, x: float, y: float):
        """Update projectile position for tracer effect"""
        if projectile_id not in self.tracer_history:
            self.tracer_history[projectile_id] = []
        
        self.tracer_history[projectile_id].append((x, y))
        
        # Limit history length
        if len(self.tracer_history[projectile_id]) > 3:
            self.tracer_history[projectile_id].pop(0)
    
    def remove_projectile(self, projectile_id: str):
        """Remove projectile from tracking"""
        if projectile_id in self.tracer_history:
            del self.tracer_history[projectile_id]
    
    def render_to_canvas(self, canvas):
        """Render all projectile tracers"""
        for projectile_id, positions in self.tracer_history.items():
            if len(positions) >= 2:
                # Draw tracer lines
                for i in range(len(positions) - 1):
                    x1, y1 = positions[i]
                    x2, y2 = positions[i + 1]
                    
                    # Fade based on position in trail
                    intensity = 0.3 + (i * 0.3)
                    color = f"#{int(255 * intensity):02x}{int(255 * intensity):02x}00"  # Yellow gradient
                    
                    canvas.create_line(
                        x1, y1, x2, y2,
                        fill=color,
                        width=2,
                        stipple='gray75'
                    )
            
            # Draw current projectile as bright point
            if positions:
                x, y = positions[-1]
                canvas.create_oval(
                    x-2, y-2, x+2, y+2,
                    fill="#FFFF00",
                    outline="#FFFFFF"
                )


class VectorPPU:
    """Main vector PPU system"""
    
    def __init__(self):
        self.ship_bodies: Dict[str, VectorShipBody] = {}
        self.projectile_tracer = ProjectileTracer()
        
        # Visual effects
        self.motion_blur_enabled = True
        self.screen_fade_factor = 0.95  # For ghosting effect
        
        logger.info("🚀 Vector PPU initialized")
    
    def add_ship(self, ship_id: str, ship_shape: Optional[ShipShape] = None) -> VectorShipBody:
        """Add ship to vector PPU"""
        ship_body = VectorShipBody(ship_shape)
        self.ship_bodies[ship_id] = ship_body
        logger.debug(f"🚀 Added ship to Vector PPU: {ship_id}")
        return ship_body
    
    def remove_ship(self, ship_id: str):
        """Remove ship from vector PPU"""
        if ship_id in self.ship_bodies:
            del self.ship_bodies[ship_id]
            logger.debug(f"🚀 Removed ship from Vector PPU: {ship_id}")
    
    def update_ship(self, ship_id: str, x: float, y: float, heading: float):
        """Update ship position"""
        if ship_id in self.ship_bodies:
            self.ship_bodies[ship_id].update_position(x, y, heading)
    
    def update_projectile(self, projectile_id: str, x: float, y: float):
        """Update projectile position"""
        self.projectile_tracer.update_projectile(projectile_id, x, y)
    
    def remove_projectile(self, projectile_id: str):
        """Remove projectile"""
        self.projectile_tracer.remove_projectile(projectile_id)
    
    def render_to_canvas(self, canvas):
        """Render all vector graphics to canvas"""
        # Clear canvas with fade effect (for motion blur)
        if self.motion_blur_enabled:
            # Create ghosting effect by not fully clearing
            canvas.create_rectangle(
                0, 0, canvas.winfo_width(), canvas.winfo_height(),
                fill="#000011",  # Very dark blue
                outline=""
            )
        else:
            canvas.delete("all")
        
        # Render projectile tracers
        self.projectile_tracer.render_to_canvas(canvas)
        
        # Render ships - check if they're destroyed
        for ship_id, ship_body in self.ship_bodies.items():
            if ship_body.last_position != (0, 0):  # Only render if positioned
                # Check if ship is destroyed by looking it up in a registry
                # For now, we'll render all ships but could add destroyed check here
                ship_body.render_to_canvas(
                    canvas,
                    ship_body.last_position[0],
                    ship_body.last_position[1],
                    ship_body.last_heading
                )
    
    def clear_all_trails(self):
        """Clear all motion trails"""
        for ship_body in self.ship_bodies.values():
            ship_body.clear_trails()
    
    def get_render_stats(self) -> Dict[str, Any]:
        """Get rendering statistics"""
        return {
            'ships_rendered': len(self.ship_bodies),
            'projectiles_tracked': len(self.projectile_tracer.tracer_history),
            'motion_blur_enabled': self.motion_blur_enabled,
            'total_triangles': sum(
                len(body.ship_shape.triangles) 
                for body in self.ship_bodies.values()
            )
        }


# Global vector PPU instance
vector_ppu = None

def initialize_vector_ppu() -> VectorPPU:
    """Initialize global vector PPU"""
    global vector_ppu
    vector_ppu = VectorPPU()
    logger.info("🚀 Global Vector PPU initialized")
    return vector_ppu
