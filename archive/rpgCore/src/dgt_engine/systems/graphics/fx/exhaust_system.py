"""
DGT Exhaust System - ADR 130 Implementation
Dynamic particle exhaust system for space ship propulsion

Creates realistic thrust exhaust effects with particle physics
Integrates with PPU rendering for visual feedback
"""

import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum

from loguru import logger


class ExhaustType(str, Enum):
    """Exhaust effect types"""
    ION = "ion"                   # Blue ion trail
    FUSION = "fusion"             # Yellow-orange fusion flame
    ANTIMATTER = "antimatter"     # Purple antimatter exhaust
    SOLAR = "solar"               # Golden solar wind
    WARP = "warp"                 # Rainbow warp trail
    PLASMA = "plasma"             # Green plasma discharge


@dataclass
class ExhaustParticle:
    """Individual exhaust particle"""
    x: float
    y: float
    vx: float  # Velocity X
    vy: float  # Velocity Y
    lifetime: float
    max_lifetime: float
    color: Tuple[int, int, int]
    size: float
    alpha: int = 255
    initial_energy: float = 1.0
    
    def update(self, dt: float) -> bool:
        """Update particle physics"""
        # Update position
        self.x += self.vx * dt * 60  # 60 FPS normalization
        self.y += self.vy * dt * 60
        
        # Update lifetime
        self.lifetime += dt
        
        # Calculate fade based on lifetime
        if self.max_lifetime > 0:
            life_ratio = 1.0 - (self.lifetime / self.max_lifetime)
            self.alpha = int(255 * life_ratio)
            
            # Particle expansion over time
            expansion_factor = 1.0 + (1.0 - life_ratio) * 0.5
            self.size *= (1.0 + (1.0 - life_ratio) * 0.1)
        
        return self.lifetime < self.max_lifetime


@dataclass
class ExhaustConfig:
    """Configuration for exhaust effects"""
    exhaust_type: ExhaustType
    base_color: Tuple[int, int, int]
    particle_count: int
    emission_rate: float
    particle_speed: float
    particle_lifetime: float
    spread_angle: float
    turbulence: float
    energy_decay: float
    
    @classmethod
    def get_engine_config(cls, engine_type: str) -> 'ExhaustConfig':
        """Get exhaust configuration for engine type"""
        configs = {
            'ion': cls(
                exhaust_type=ExhaustType.ION,
                base_color=(100, 200, 255),
                particle_count=3,
                emission_rate=15.0,
                particle_speed=80.0,
                particle_lifetime=1.2,
                spread_angle=15.0,
                turbulence=0.2,
                energy_decay=0.8
            ),
            'fusion': cls(
                exhaust_type=ExhaustType.FUSION,
                base_color=(255, 200, 100),
                particle_count=5,
                emission_rate=20.0,
                particle_speed=120.0,
                particle_lifetime=1.0,
                spread_angle=25.0,
                turbulence=0.3,
                energy_decay=0.9
            ),
            'antimatter': cls(
                exhaust_type=ExhaustType.ANTIMATTER,
                base_color=(255, 100, 255),
                particle_count=4,
                emission_rate=18.0,
                particle_speed=150.0,
                particle_lifetime=1.5,
                spread_angle=20.0,
                turbulence=0.4,
                energy_decay=0.85
            ),
            'solar': cls(
                exhaust_type=ExhaustType.SOLAR,
                base_color=(255, 255, 100),
                particle_count=6,
                emission_rate=25.0,
                particle_speed=100.0,
                particle_lifetime=0.8,
                spread_angle=30.0,
                turbulence=0.25,
                energy_decay=0.95
            ),
            'warp': cls(
                exhaust_type=ExhaustType.WARP,
                base_color=(200, 100, 255),
                particle_count=8,
                emission_rate=30.0,
                particle_speed=200.0,
                particle_lifetime=2.0,
                spread_angle=35.0,
                turbulence=0.5,
                energy_decay=0.7
            )
        }
        return configs.get(engine_type, configs['ion'])


class ExhaustEmitter:
    """Individual exhaust emitter for a ship"""
    
    def __init__(self, ship_id: str, engine_type: str, offset_x: float = 0.0, offset_y: float = 0.0):
        self.ship_id = ship_id
        self.engine_type = engine_type
        self.offset_x = offset_x
        self.offset_y = offset_y
        
        self.config = ExhaustConfig.get_engine_config(engine_type)
        self.particles: List[ExhaustParticle] = []
        
        self.emission_timer = 0.0
        self.is_thrusting = False
        self.thrust_intensity = 0.0  # 0.0 to 1.0
        
        # Position tracking
        self.last_x = 0.0
        self.last_y = 0.0
        self.last_heading = 0.0
        
        logger.debug(f"🚀 ExhaustEmitter initialized for {ship_id} ({engine_type})")
    
    def update_position(self, ship_x: float, ship_y: float, ship_heading: float):
        """Update emitter position based on ship position"""
        self.last_x = ship_x
        self.last_y = ship_y
        self.last_heading = ship_heading
    
    def set_thrust(self, is_thrusting: bool, intensity: float = 1.0):
        """Set thrust state and intensity"""
        self.is_thrusting = is_thrusting
        self.thrust_intensity = max(0.0, min(1.0, intensity))
    
    def emit_particles(self):
        """Emit new exhaust particles"""
        if not self.is_thrusting or self.thrust_intensity <= 0:
            return
        
        # Calculate emitter position (behind ship)
        emitter_distance = 15.0  # Distance behind ship
        emitter_angle = math.radians(self.last_heading + 180)  # Behind ship
        
        emitter_x = self.last_x + math.cos(emitter_angle) * emitter_distance + self.offset_x
        emitter_y = self.last_y + math.sin(emitter_angle) * emitter_distance + self.offset_y
        
        # Emit particles based on thrust intensity
        particles_to_emit = int(self.config.particle_count * self.thrust_intensity)
        
        for _ in range(particles_to_emit):
            # Random spread angle
            spread_rad = math.radians(random.uniform(-self.config.spread_angle/2, self.config.spread_angle/2))
            particle_angle = emitter_angle + spread_rad
            
            # Particle velocity with turbulence
            base_speed = self.config.particle_speed * self.thrust_intensity
            speed_variation = random.uniform(0.8, 1.2)
            particle_speed = base_speed * speed_variation
            
            # Add turbulence
            turbulence_x = random.uniform(-self.config.turbulence, self.config.turbulence) * 20
            turbulence_y = random.uniform(-self.config.turbulence, self.config.turbulence) * 20
            
            vx = math.cos(particle_angle) * particle_speed + turbulence_x
            vy = math.sin(particle_angle) * particle_speed + turbulence_y
            
            # Color variation
            color_variation = random.uniform(0.8, 1.2)
            particle_color = tuple(int(c * color_variation) for c in self.config.base_color)
            particle_color = tuple(max(0, min(255, c)) for c in particle_color)
            
            # Create particle
            particle = ExhaustParticle(
                x=emitter_x,
                y=emitter_y,
                vx=vx,
                vy=vy,
                lifetime=0.0,
                max_lifetime=self.config.particle_lifetime * random.uniform(0.8, 1.2),
                color=particle_color,
                size=random.uniform(1.0, 3.0) * self.thrust_intensity,
                alpha=255,
                initial_energy=self.thrust_intensity
            )
            
            self.particles.append(particle)
    
    def update(self, dt: float):
        """Update exhaust emitter and particles"""
        # Update emission timer
        if self.is_thrusting:
            self.emission_timer += dt
            emission_interval = 1.0 / self.config.emission_rate
            
            while self.emission_timer >= emission_interval:
                self.emit_particles()
                self.emission_timer -= emission_interval
        else:
            self.emission_timer = 0.0
        
        # Update existing particles
        self.particles = [p for p in self.particles if p.update(dt)]
    
    def get_particle_count(self) -> int:
        """Get number of active particles"""
        return len(self.particles)
    
    def get_emitter_stats(self) -> Dict[str, Any]:
        """Get emitter statistics"""
        return {
            'ship_id': self.ship_id,
            'engine_type': self.engine_type,
            'particle_count': len(self.particles),
            'is_thrusting': self.is_thrusting,
            'thrust_intensity': self.thrust_intensity,
            'emission_rate': self.config.emission_rate
        }


class ExhaustSystem:
    """Main exhaust system managing all ship emitters"""
    
    def __init__(self):
        self.emitters: Dict[str, ExhaustEmitter] = {}
        self.total_particles = 0
        
        # Performance tracking
        self.max_particles_seen = 0
        self.average_particle_count = 0.0
        self.sample_count = 0
        
        logger.info("🚀 Exhaust System initialized")
    
    def add_ship_emitter(self, ship_id: str, engine_type: str, 
                         offset_x: float = 0.0, offset_y: float = 0.0) -> ExhaustEmitter:
        """Add exhaust emitter for a ship"""
        emitter = ExhaustEmitter(ship_id, engine_type, offset_x, offset_y)
        self.emitters[ship_id] = emitter
        logger.debug(f"🚀 Added exhaust emitter for {ship_id} ({engine_type})")
        return emitter
    
    def remove_ship_emitter(self, ship_id: str):
        """Remove exhaust emitter for a ship"""
        if ship_id in self.emitters:
            del self.emitters[ship_id]
            logger.debug(f"🚀 Removed exhaust emitter for {ship_id}")
    
    def update_ship_thrust(self, ship_id: str, ship_x: float, ship_y: float, 
                          ship_heading: float, is_thrusting: bool, intensity: float = 1.0):
        """Update ship thrust and position"""
        emitter = self.emitters.get(ship_id)
        if emitter:
            emitter.update_position(ship_x, ship_y, ship_heading)
            emitter.set_thrust(is_thrusting, intensity)
    
    def update(self, dt: float):
        """Update all exhaust emitters"""
        total_particles = 0
        
        for emitter in self.emitters.values():
            emitter.update(dt)
            total_particles += emitter.get_particle_count()
        
        # Update statistics
        self.total_particles = total_particles
        self.max_particles_seen = max(self.max_particles_seen, total_particles)
        
        # Update running average
        self.sample_count += 1
        self.average_particle_count = ((self.average_particle_count * (self.sample_count - 1)) + total_particles) / self.sample_count
    
    def get_all_particles(self) -> List[ExhaustParticle]:
        """Get all particles from all emitters"""
        all_particles = []
        for emitter in self.emitters.values():
            all_particles.extend(emitter.particles)
        return all_particles
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get exhaust system statistics"""
        active_emitters = len([e for e in self.emitters.values() if e.is_thrusting])
        
        return {
            'total_emitters': len(self.emitters),
            'active_emitters': active_emitters,
            'total_particles': self.total_particles,
            'max_particles_seen': self.max_particles_seen,
            'average_particle_count': round(self.average_particle_count, 1),
            'emitter_details': {ship_id: emitter.get_emitter_stats() for ship_id, emitter in self.emitters.items()}
        }
    
    def clear_all_particles(self):
        """Clear all particles from all emitters"""
        for emitter in self.emitters.values():
            emitter.particles.clear()
        self.total_particles = 0
        logger.debug("🚀 All exhaust particles cleared")


# Global exhaust system instance
exhaust_system = None

def initialize_exhaust_system() -> ExhaustSystem:
    """Initialize global exhaust system"""
    global exhaust_system
    exhaust_system = ExhaustSystem()
    logger.info("🚀 Global Exhaust System initialized")
    return exhaust_system
