"""
DGT Ship Renderer - ADR 134 Implementation
Rigid Body Rendering Protocol for Modular Ship Fleet

Transforms neural pilot intent into solid, dithered polygon ships
with proper Newtonian physics visualization and particle exhaust.
"""

import math
import random
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class ShipClass(Enum):
    """Ship class types for modular rendering"""
    INTERCEPTOR = "interceptor"
    HEAVY = "heavy"
    SCOUT = "scout"
    BOMBER = "bomber"


@dataclass
class ShipDNA:
    """Ship DNA for procedural generation (from Tiny Farm palette)"""
    hull_color: str = "#4A90E2"  # Blue
    reactor_color: str = "#F5A623"  # Orange
    thruster_color: str = "#7ED321"  # Green
    faction: str = "neutral"
    
    def get_primary_color(self) -> str:
        """Get primary hull color"""
        return self.hull_color
    
    def get_accent_color(self) -> str:
        """Get accent/reactor color"""
        return self.reactor_color


@dataclass
class RenderPacket:
    """Universal packet for ship rendering (ADR 122)"""
    ship_id: str
    x: float
    y: float
    heading: float  # degrees
    velocity_x: float
    velocity_y: float
    ship_class: ShipClass
    ship_dna: ShipDNA
    is_destroyed: bool = False
    thrust_level: float = 0.0  # 0.0 to 1.0


class ExhaustParticle:
    """Thruster exhaust particle with fade effect"""
    def __init__(self, x: float, y: float, vx: float, vy: float, color: str):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.color = color
        self.lifetime = 0.5  # 0.5 seconds
        self.age = 0.0
    
    def update(self, dt: float) -> bool:
        """Update particle, return False if expired"""
        self.age += dt
        if self.age >= self.lifetime:
            return False
        
        # Move particle
        self.x += self.vx * dt
        self.y += self.vy * dt
        
        # Apply drag
        self.vx *= 0.95
        self.vy *= 0.95
        
        return True
    
    def get_alpha(self) -> float:
        """Get particle alpha based on age"""
        return max(0.0, 1.0 - (self.age / self.lifetime))


class ShipRenderer:
    """Modular Ship Renderer with solid body and particle exhaust"""
    
    def __init__(self, canvas_width: int = 1000, canvas_height: int = 700):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        
        # Ship geometry cache
        self.ship_geometry = self._generate_ship_geometry()
        
        # Particle system
        self.particles: List[ExhaustParticle] = []
        
        # Canvas objects cache
        self.ship_polygons: Dict[str, int] = {}
        self.particle_objects: List[int] = []
        
        logger.info(f"🚀 ShipRenderer initialized: {canvas_width}x{canvas_height}")
    
    def _generate_ship_geometry(self) -> Dict[ShipClass, List[Tuple[float, float]]]:
        """Generate procedural triangle geometry for each ship class"""
        geometry = {}
        
        # Interceptor: Fast, triangular shape (scaled up for visibility)
        geometry[ShipClass.INTERCEPTOR] = [
            (0, -25),   # Nose (increased from -15)
            (-12, 18),  # Left wing (increased from -8, 10)
            (12, 18)   # Right wing (increased from 8, 10)
        ]
        
        # Heavy: Bulky, diamond shape
        geometry[ShipClass.HEAVY] = [
            (0, -20),   # Nose
            (-12, 0),   # Left side
            (0, 15),    # Rear
            (12, 0)     # Right side
        ]
        
        # Scout: Small, agile shape
        geometry[ShipClass.SCOUT] = [
            (0, -10),   # Nose
            (-6, 8),    # Left wing
            (6, 8)      # Right wing
        ]
        
        # Bomber: Large, winged shape
        geometry[ShipClass.BOMBER] = [
            (0, -12),   # Nose
            (-15, 5),   # Left wing
            (-8, 12),   # Left rear
            (8, 12),    # Right rear
            (15, 5)     # Right wing
        ]
        
        return geometry
    
    def rotate_geometry(self, geometry: List[Tuple[float, float]], 
                       heading: float) -> List[Tuple[float, float]]:
        """Rotate geometry based on ship heading"""
        rad = math.radians(heading)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        
        rotated = []
        for x, y in geometry:
            # Rotate around origin
            new_x = x * cos_a - y * sin_a
            new_y = x * sin_a + y * cos_a
            rotated.append((new_x, new_y))
        
        return rotated
    
    def render_ship(self, packet: RenderPacket, canvas, is_top_elo: bool = False) -> None:
        """Render ship as solid dithered polygon with optional highlight"""
        if packet.is_destroyed:
            # Remove destroyed ship
            if packet.ship_id in self.ship_polygons:
                canvas.delete(self.ship_polygons[packet.ship_id])
                del self.ship_polygons[packet.ship_id]
            return
        
        # Get ship geometry
        base_geometry = self.ship_geometry.get(packet.ship_class, 
                                            self.ship_geometry[ShipClass.INTERCEPTOR])
        
        # Scale up for Top-ELO ship (highlight)
        if is_top_elo:
            scale_factor = 1.5  # 50% larger for visibility
            scaled_geometry = []
            for x, y in base_geometry:
                scaled_geometry.append((x * scale_factor, y * scale_factor))
            base_geometry = scaled_geometry
        
        # Rotate geometry based on heading
        rotated_geometry = self.rotate_geometry(base_geometry, packet.heading)
        
        # Translate to ship position
        translated_geometry = []
        for x, y in rotated_geometry:
            translated_geometry.extend([packet.x + x, packet.y + y])
        
        # Generate exhaust particles if thrusting
        if packet.thrust_level > 0.1:
            self._generate_exhaust(packet)
        
        # Create or update ship polygon
        if packet.ship_id in self.ship_polygons:
            # Update existing polygon
            canvas.coords(self.ship_polygons[packet.ship_id], *translated_geometry)
        else:
            # Create new polygon with enhanced visibility for Top-ELO
            fill_color = packet.ship_dna.get_primary_color()
            outline_color = packet.ship_dna.get_accent_color()
            outline_width = 2
            
            if is_top_elo:
                # Enhanced visibility for Top-ELO ship
                outline_width = 4  # Thicker outline
                # Add glow effect with larger outline
                glow_polygon = canvas.create_polygon(
                    translated_geometry,
                    fill="",
                    outline="#FFFF00",  # Yellow glow
                    width=outline_width + 2,
                    tags="ship_glow"
                )
            
            polygon_id = canvas.create_polygon(
                translated_geometry,
                fill=fill_color,
                outline=outline_color,
                width=outline_width,
                tags="ship"
            )
            self.ship_polygons[packet.ship_id] = polygon_id
    
    def _generate_exhaust(self, packet: RenderPacket) -> None:
        """Generate thruster exhaust particles"""
        # Get rear position of ship
        base_geometry = self.ship_geometry.get(packet.ship_class, 
                                            self.ship_geometry[ShipClass.INTERCEPTOR])
        
        # Find rear-most point (highest y value in local coordinates)
        rear_point = max(base_geometry, key=lambda p: p[1])
        
        # Rotate rear point
        rad = math.radians(packet.heading)
        cos_a = math.cos(rad)
        sin_a = math.sin(rad)
        
        rear_x = rear_point[0] * cos_a - rear_point[1] * sin_a
        rear_y = rear_point[0] * sin_a + rear_point[1] * cos_a
        
        # Translate to ship position
        exhaust_x = packet.x + rear_x
        exhaust_y = packet.y + rear_y
        
        # Generate particles (limited to 5 pixels length)
        num_particles = int(packet.thrust_level * 3)  # 0-3 particles per frame
        for _ in range(num_particles):
            # Random spread
            spread_x = random.uniform(-2, 2)
            spread_y = random.uniform(-2, 2)
            
            # Velocity opposite to heading
            vel_x = -math.cos(rad) * 20 + spread_x
            vel_y = -math.sin(rad) * 20 + spread_y
            
            particle = ExhaustParticle(
                exhaust_x, exhaust_y, vel_x, vel_y,
                packet.ship_dna.get_accent_color()
            )
            self.particles.append(particle)
    
    def update_particles(self, dt: float, canvas) -> None:
        """Update and render exhaust particles"""
        # Update existing particles
        active_particles = []
        for particle in self.particles:
            if particle.update(dt):
                active_particles.append(particle)
        
        self.particles = active_particles
        
        # Clear old particle objects
        for obj_id in self.particle_objects:
            canvas.delete(obj_id)
        self.particle_objects.clear()
        
        # Render active particles
        for particle in self.particles:
            alpha = particle.get_alpha()
            if alpha > 0.1:
                # Create small particle dot
                size = 2 * alpha  # Fade with age
                particle_id = canvas.create_oval(
                    particle.x - size, particle.y - size,
                    particle.x + size, particle.y + size,
                    fill=particle.color,
                    outline="",
                    tags="particle"
                )
                self.particle_objects.append(particle_id)
    
    def clear_destroyed_ships(self, destroyed_ship_ids: List[str], canvas) -> None:
        """Remove destroyed ships from canvas"""
        for ship_id in destroyed_ship_ids:
            if ship_id in self.ship_polygons:
                canvas.delete(self.ship_polygons[ship_id])
                del self.ship_polygons[ship_id]
    
    def get_render_packet_from_ship(self, ship, ship_class: ShipClass = ShipClass.INTERCEPTOR) -> RenderPacket:
        """Convert ship physics object to render packet"""
        # Create ShipDNA based on faction or default
        ship_dna = ShipDNA()
        
        # You can customize DNA based on ship properties here
        if hasattr(ship, 'faction'):
            ship_dna.faction = ship.faction
            # Set colors based on faction
            if ship.faction == "player":
                ship_dna.hull_color = "#4A90E2"  # Blue
                ship_dna.reactor_color = "#F5A623"  # Orange
            elif ship.faction == "enemy":
                ship_dna.hull_color = "#D0021B"  # Red
                ship_dna.reactor_color = "#BD10E0"  # Purple
        
        return RenderPacket(
            ship_id=ship.ship_id,
            x=ship.x,
            y=ship.y,
            heading=ship.heading,
            velocity_x=ship.velocity_x,
            velocity_y=ship.velocity_y,
            ship_class=ship_class,
            ship_dna=ship_dna,
            is_destroyed=ship.is_destroyed() if hasattr(ship, 'is_destroyed') else False,
            thrust_level=0.0  # Will be updated from neural pilot
        )


# Global ship renderer instance
ship_renderer = None

def initialize_ship_renderer(canvas_width: int = 1000, canvas_height: int = 700) -> ShipRenderer:
    """Initialize global ship renderer"""
    global ship_renderer
    ship_renderer = ShipRenderer(canvas_width, canvas_height)
    logger.info("🚀 Global ShipRenderer initialized")
    return ship_renderer

def get_ship_renderer() -> Optional[ShipRenderer]:
    """Get global ship renderer instance"""
    return ship_renderer
