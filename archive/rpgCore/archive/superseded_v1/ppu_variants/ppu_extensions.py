"""
DGT PPU Extensions - Enhanced Rendering Capabilities
Extensions for the PPU engine to support component rendering and advanced visual effects

Provides modular rendering system for ships, particles, and dynamic effects
Integrates with the existing PPU architecture without breaking changes
"""

import math
import random
from typing import Dict, List, Optional, Any, Tuple, Callable
from dataclasses import dataclass

from loguru import logger
from .component_renderer import ComponentRenderer, RenderLayer, ComponentSprite, VisualEffect


@dataclass
class Particle:
    """Individual particle for visual effects"""
    x: float
    y: float
    vx: float  # Velocity X
    vy: float  # Velocity Y
    lifetime: float
    max_lifetime: float
    color: Tuple[int, int, int]
    size: float
    alpha: int = 255
    
    def update(self, dt: float) -> bool:
        """Update particle position and lifetime"""
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.lifetime += dt
        
        # Fade out over lifetime
        if self.max_lifetime > 0:
            self.alpha = int(255 * (1.0 - self.lifetime / self.max_lifetime))
        
        return self.lifetime < self.max_lifetime


@dataclass
class ParticleSystem:
    """Particle system for visual effects"""
    particles: List[Particle]
    emission_rate: float
    emission_timer: float = 0.0
    position: Tuple[float, float] = (0.0, 0.0)
    active: bool = True
    
    def emit_particle(self, config: Dict[str, Any]):
        """Emit a new particle"""
        if not self.active:
            return
        
        # Random velocity within cone
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(config.get('min_speed', 50), config.get('max_speed', 150))
        
        particle = Particle(
            x=self.position[0],
            y=self.position[1],
            vx=math.cos(angle) * speed,
            vy=math.sin(angle) * speed,
            lifetime=0.0,
            max_lifetime=config.get('lifetime', 1.0),
            color=config.get('color', (255, 255, 255)),
            size=config.get('size', 2.0),
            alpha=255
        )
        
        self.particles.append(particle)
    
    def update(self, dt: float):
        """Update all particles"""
        # Update existing particles
        self.particles = [p for p in self.particles if p.update(dt)]
        
        # Emit new particles
        if self.active and self.emission_rate > 0:
            self.emission_timer += dt
            particles_to_emit = int(self.emission_timer * self.emission_rate)
            self.emission_timer -= particles_to_emit / self.emission_rate
            
            config = {
                'min_speed': 50,
                'max_speed': 150,
                'lifetime': 1.0,
                'color': (255, 200, 100),
                'size': 2.0
            }
            
            for _ in range(particles_to_emit):
                self.emit_particle(config)
    
    def set_position(self, x: float, y: float):
        """Set emission position"""
        self.position = (x, y)
    
    def start(self):
        """Start particle emission"""
        self.active = True
    
    def stop(self):
        """Stop particle emission"""
        self.active = False


class PPUExtensions:
    """Extensions for the PPU engine"""
    
    def __init__(self, ppu_engine):
        self.ppu = ppu_engine
        self.component_renderer = None
        self.particle_systems: Dict[str, ParticleSystem] = {}
        self.screen_shake = 0.0
        self.screen_shake_duration = 0.0
        
        # Visual effect callbacks
        self.effect_callbacks: Dict[str, Callable] = {}
        
        # Initialize default effects
        self._initialize_default_effects()
        
        logger.info("🚀 PPU Extensions initialized")
    
    def _initialize_default_effects(self):
        """Initialize default visual effects"""
        self.effect_callbacks.update({
            'screen_shake': self._apply_screen_shake,
            'particle_burst': self._create_particle_burst,
            'flash': self._apply_screen_flash,
            'fade': self._apply_screen_fade
        })
    
    def initialize_component_renderer(self):
        """Initialize component renderer"""
        try:
            from .component_renderer import initialize_component_renderer
            self.component_renderer = initialize_component_renderer(self.ppu)
            logger.info("🚀 Component renderer initialized")
            return True
        except Exception as e:
            logger.error(f"🚀 Failed to initialize component renderer: {e}")
            return False
    
    def register_effect(self, effect_name: str, callback: Callable):
        """Register a custom visual effect"""
        self.effect_callbacks[effect_name] = callback
        logger.debug(f"🚀 Registered effect: {effect_name}")
    
    def trigger_effect(self, effect_name: str, *args, **kwargs):
        """Trigger a visual effect"""
        if effect_name in self.effect_callbacks:
            try:
                self.effect_callbacks[effect_name](*args, **kwargs)
                logger.debug(f"🚀 Triggered effect: {effect_name}")
            except Exception as e:
                logger.error(f"🚀 Failed to trigger effect {effect_name}: {e}")
        else:
            logger.warning(f"🚀 Unknown effect: {effect_name}")
    
    def _apply_screen_shake(self, intensity: float, duration: float = 0.5):
        """Apply screen shake effect"""
        self.screen_shake = min(10.0, intensity)
        self.screen_shake_duration = duration
        logger.debug(f"🚀 Screen shake: intensity={intensity}, duration={duration}s")
    
    def _create_particle_burst(self, x: int, y: int, particle_count: int = 20, 
                              color: Tuple[int, int, int] = (255, 200, 100)):
        """Create particle burst effect"""
        system_id = f"burst_{x}_{y}_{random.randint(1000, 9999)}"
        
        system = ParticleSystem(
            particles=[],
            emission_rate=0.0,
            position=(x, y)
        )
        
        # Emit particles immediately
        config = {
            'min_speed': 100,
            'max_speed': 300,
            'lifetime': 0.5,
            'color': color,
            'size': 3.0
        }
        
        for _ in range(particle_count):
            system.emit_particle(config)
        
        self.particle_systems[system_id] = system
        logger.debug(f"🚀 Created particle burst: {system_id} ({particle_count} particles)")
        
        # Auto-remove after particles expire
        self._schedule_particle_cleanup(system_id, 1.0)
    
    def _schedule_particle_cleanup(self, system_id: str, delay: float):
        """Schedule particle system cleanup"""
        # This would be handled by the update loop
        pass
    
    def _apply_screen_flash(self, color: Tuple[int, int, int] = (255, 255, 255), duration: float = 0.2):
        """Apply screen flash effect"""
        # This would modify the PPU's color palette
        logger.debug(f"🚀 Screen flash: color={color}, duration={duration}s")
    
    def _apply_screen_fade(self, alpha: float, duration: float = 1.0):
        """Apply screen fade effect"""
        # This would modify the PPU's alpha blending
        logger.debug(f"🚀 Screen fade: alpha={alpha}, duration={duration}s")
    
    def create_laser_effect(self, source_x: int, source_y: int, target_x: int, target_y: int):
        """Create laser beam effect"""
        if self.component_renderer:
            beam_id = self.component_renderer.create_laser_effect(source_x, source_y, target_x, target_y)
            
            # Add screen shake for impact
            self.trigger_effect('screen_shake', 2.0, 0.1)
            
            # Add particle burst at target
            self.trigger_effect('particle_burst', target_x, target_y, 10, (255, 100, 100))
            
            return beam_id
        return None
    
    def create_explosion_effect(self, x: int, y: int, intensity: float = 1.0):
        """Create explosion effect"""
        if self.component_renderer:
            self.component_renderer.create_explosion_effect(x, y, intensity)
        
        # Add screen shake for explosion
        self.trigger_effect('screen_shake', intensity * 3.0, 0.3)
        
        # Add particle burst
        particle_count = int(20 * intensity)
        self.trigger_effect('particle_burst', x, y, particle_count, (255, 150, 50))
    
    def create_shield_effect(self, ship_id: str):
        """Create shield effect around ship"""
        if self.component_renderer:
            self.component_renderer.create_shield_effect(ship_id)
    
    def update(self, dt: float):
        """Update all extensions"""
        # Update component renderer
        if self.component_renderer:
            self.component_renderer.update(dt)
        
        # Update particle systems
        for system in list(self.particle_systems.values()):
            system.update(dt)
            
            # Remove empty systems
            if not system.particles and not system.active:
                system_id = [sid for sid, s in self.particle_systems.items() if s == system][0]
                if system_id:
                    del self.particle_systems[system_id]
        
        # Update screen shake
        if self.screen_shake_duration > 0:
            self.screen_shake_duration -= dt
            if self.screen_shake_duration <= 0:
                self.screen_shake = 0.0
    
    def render(self, frame_buffer):
        """Render all extensions to frame buffer"""
        # Apply screen shake
        if self.screen_shake > 0:
            self._apply_screen_shake_to_buffer(frame_buffer)
        
        # Render components
        if self.component_renderer:
            self.component_renderer.render(frame_buffer)
        
        # Render particles
        self._render_particles(frame_buffer)
    
    def _apply_screen_shake_to_buffer(self, frame_buffer):
        """Apply screen shake to frame buffer"""
        if self.screen_shake <= 0:
            return
        
        # Calculate shake offset
        shake_x = int(random.uniform(-self.screen_shake, self.screen_shake))
        shift_y = int(random.uniform(-self.screen_shake, self.screen_shake))
        
        # Apply shake to entire buffer
        # This would shift the entire frame buffer
        logger.debug(f"🚀 Applying screen shake: offset=({shake_x}, {shift_y})")
    
    def _render_particles(self, frame_buffer):
        """Render particles to frame buffer"""
        for system in self.particle_systems.values():
            for particle in system.particles:
                # Draw particle as small rectangle
                x = int(particle.x)
                y = int(particle.y)
                size = int(particle.size)
                color = particle.color
                alpha = particle.alpha
                
                # This would call the PPU's drawing functions
                # For now, we'll simulate the rendering
                logger.debug(f"🚀 Rendering particle at ({x}, {y}) size={size} alpha={alpha}")
    
    def get_extension_stats(self) -> Dict[str, Any]:
        """Get extension statistics"""
        stats = {
            'particle_systems': len(self.particle_systems),
            'total_particles': sum(len(s.particles) for s in self.particle_systems.values()),
            'screen_shake': self.screen_shake,
            'screen_shake_duration': self.screen_shake_duration,
            'registered_effects': list(self.effect_callbacks.keys())
        }
        
        if self.component_renderer:
            stats.update(self.component_renderer.get_render_stats())
        
        return stats


# Global PPU extensions instance
ppu_extensions = None

def initialize_ppu_extensions(ppu_engine):
    """Initialize global PPU extensions"""
    global ppu_extensions
    ppu_extensions = PPUExtensions(ppu_engine)
    return ppu_extensions
