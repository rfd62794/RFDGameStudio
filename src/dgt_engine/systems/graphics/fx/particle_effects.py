"""
DGT Particle Effects System - ADR 132 Implementation
Dithered explosion and destruction effects for fleet combat

Creates retro-style particle explosions with proper dithering
Integrates with vector PPU for seamless visual feedback
"""

import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger


class ExplosionType(str, Enum):
    """Explosion type classifications"""
    SMALL = "small"           # Fighter/Interceptor destruction
    MEDIUM = "medium"         # Cruiser/Bomber destruction
    LARGE = "large"           # Dreadnought/Capital ship destruction
    SHIELD_HIT = "shield_hit" # Shield impact effect


@dataclass
class Particle:
    """Individual explosion particle"""
    x: float
    y: float
    vx: float  # Velocity X
    vy: float  # Velocity Y
    lifetime: float
    max_lifetime: float
    size: float
    color: str
    alpha: int = 255
    
    def update(self, dt: float) -> bool:
        """Update particle physics and lifetime"""
        # Update position
        self.x += self.vx * dt * 60
        self.y += self.vy * dt * 60
        
        # Update lifetime
        self.lifetime += dt
        
        # Apply drag
        self.vx *= 0.98
        self.vy *= 0.98
        
        # Fade out
        if self.max_lifetime > 0:
            life_ratio = 1.0 - (self.lifetime / self.max_lifetime)
            self.alpha = int(255 * life_ratio)
        
        return self.lifetime < self.max_lifetime
    
    def get_render_data(self) -> Optional[Tuple[float, float, float, str]]:
        """Get render data for PPU"""
        if self.alpha > 0:
            return (self.x, self.y, self.size, self.color)
        return None


@dataclass
class ExplosionEffect:
    """Explosion effect with multiple particles"""
    explosion_id: str
    explosion_type: ExplosionType
    x: float
    y: float
    particles: List[Particle] = None
    is_active: bool = True
    
    def __post_init__(self):
        if self.particles is None:
            self.particles = []
            self._generate_particles()
    
    def _generate_particles(self):
        """Generate particles based on explosion type"""
        configs = {
            ExplosionType.SMALL: {
                'count': 15,
                'speed': (50, 150),
                'lifetime': 1.0,
                'size': (1, 3),
                'colors': ['#FFFF00', '#FF8800', '#FF0000']
            },
            ExplosionType.MEDIUM: {
                'count': 25,
                'speed': (30, 200),
                'lifetime': 1.5,
                'size': (2, 4),
                'colors': ['#FFFF00', '#FF8800', '#FF0000', '#FFFFFF']
            },
            ExplosionType.LARGE: {
                'count': 40,
                'speed': (20, 250),
                'lifetime': 2.0,
                'size': (2, 6),
                'colors': ['#FFFF00', '#FF8800', '#FF0000', '#FFFFFF', '#FF00FF']
            },
            ExplosionType.SHIELD_HIT: {
                'count': 8,
                'speed': (100, 200),
                'lifetime': 0.5,
                'size': (1, 2),
                'colors': ['#00FFFF', '#0088FF', '#0044FF']
            }
        }
        
        config = configs.get(self.explosion_type, configs[ExplosionType.SMALL])
        
        for _ in range(config['count']):
            # Random velocity
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(*config['speed'])
            vx = math.cos(angle) * speed
            vy = math.sin(angle) * speed
            
            # Random properties
            lifetime = random.uniform(0.5, config['lifetime'])
            size = random.uniform(*config['size'])
            color = random.choice(config['colors'])
            
            particle = Particle(
                x=self.x,
                y=self.y,
                vx=vx,
                vy=vy,
                lifetime=0.0,
                max_lifetime=lifetime,
                size=size,
                color=color
            )
            
            self.particles.append(particle)
    
    def update(self, dt: float) -> bool:
        """Update explosion effect"""
        # Update all particles
        self.particles = [p for p in self.particles if p.update(dt)]
        
        # Check if explosion is still active
        if not self.particles:
            self.is_active = False
        
        return self.is_active
    
    def get_active_particles(self) -> List[Particle]:
        """Get all active particles"""
        return [p for p in self.particles if p.alpha > 0]


class ParticleEffectsSystem:
    """Main particle effects management system"""
    
    def __init__(self):
        self.explosions: Dict[str, ExplosionEffect] = {}
        self.explosion_counter = 0
        
        # Performance tracking
        self.total_explosions = 0
        self.active_particles = 0
        
        logger.info("🚀 Particle Effects System initialized")
    
    def create_explosion(self, x: float, y: float, explosion_type: ExplosionType = ExplosionType.MEDIUM) -> str:
        """Create new explosion effect"""
        self.explosion_counter += 1
        explosion_id = f"explosion_{self.explosion_counter}"
        
        explosion = ExplosionEffect(
            explosion_id=explosion_id,
            explosion_type=explosion_type,
            x=x,
            y=y
        )
        
        self.explosions[explosion_id] = explosion
        self.total_explosions += 1
        
        logger.debug(f"🚀 Created explosion: {explosion_id} ({explosion_type.value})")
        return explosion_id
    
    def create_ship_explosion(self, x: float, y: float, ship_role: str = "fighter") -> str:
        """Create appropriate explosion for ship destruction"""
        explosion_map = {
            "interceptor": ExplosionType.SMALL,
            "fighter": ExplosionType.MEDIUM,
            "bomber": ExplosionType.MEDIUM,
            "dreadnought": ExplosionType.LARGE,
            "support": ExplosionType.SMALL
        }
        
        explosion_type = explosion_map.get(ship_role, ExplosionType.MEDIUM)
        return self.create_explosion(x, y, explosion_type)
    
    def create_shield_hit(self, x: float, y: float) -> str:
        """Create shield impact effect"""
        return self.create_explosion(x, y, ExplosionType.SHIELD_HIT)
    
    def update(self, dt: float):
        """Update all particle effects"""
        explosions_to_remove = []
        
        for explosion_id, explosion in self.explosions.items():
            if not explosion.update(dt):
                explosions_to_remove.append(explosion_id)
        
        # Remove completed explosions
        for explosion_id in explosions_to_remove:
            del self.explosions[explosion_id]
        
        # Update particle count
        self.active_particles = sum(len(exp.particles) for exp in self.explosions.values())
    
    def get_all_particles(self) -> List[Particle]:
        """Get all active particles from all explosions"""
        all_particles = []
        for explosion in self.explosions.values():
            all_particles.extend(explosion.get_active_particles())
        return all_particles
    
    def render_to_canvas(self, canvas):
        """Render all particle effects to canvas"""
        for particle in self.get_all_particles():
            render_data = particle.get_render_data()
            if render_data:
                x, y, size, color = render_data
                
                # Apply dithering effect
                stipple_pattern = self._get_dither_pattern(particle.alpha)
                
                # Draw particle as small rectangle/circle
                canvas.create_oval(
                    x - size, y - size,
                    x + size, y + size,
                    fill=color,
                    outline="",
                    stipple=stipple_pattern
                )
    
    def _get_dither_pattern(self, alpha: int) -> str:
        """Get dithering pattern based on alpha"""
        if alpha > 200:
            return ""  # No stippling for full opacity
        elif alpha > 150:
            return "gray75"
        elif alpha > 100:
            return "gray50"
        elif alpha > 50:
            return "gray25"
        else:
            return "gray12"
    
    def clear_all_effects(self):
        """Clear all particle effects"""
        self.explosions.clear()
        self.active_particles = 0
        logger.debug("🚀 Cleared all particle effects")
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Get particle effects statistics"""
        return {
            'active_explosions': len(self.explosions),
            'active_particles': self.active_particles,
            'total_explosions_created': self.total_explosions,
            'average_particles_per_explosion': (self.active_particles / len(self.explosions)) if self.explosions else 0
        }


# Global particle effects system instance
particle_effects_system = None

def initialize_particle_effects() -> ParticleEffectsSystem:
    """Initialize global particle effects system"""
    global particle_effects_system
    particle_effects_system = ParticleEffectsSystem()
    logger.info("🚀 Global Particle Effects System initialized")
    return particle_effects_system
