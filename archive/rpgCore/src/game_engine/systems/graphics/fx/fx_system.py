"""
FX System - Particle Effects and Emission Management

Provides pooled particle management with emission control, physics simulation,
and color interpolation over particle lifetime.

Features:
- Efficient particle pooling for memory reuse
- Emission rate control and velocity distribution
- Physics simulation (gravity, acceleration)
- Color interpolation over particle lifetime
- Automatic cleanup on particle expiration
- Multi-emitter support
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
import math

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


@dataclass
class Particle:
    """Single particle with position, velocity, lifetime, and color"""
    x: float = 0.0
    y: float = 0.0
    vx: float = 0.0  # Velocity X
    vy: float = 0.0  # Velocity Y
    lifetime: float = 1.0  # Seconds
    age: float = 0.0  # Current age in seconds
    start_color: Tuple[int, int, int] = (255, 255, 255)
    end_color: Tuple[int, int, int] = (0, 0, 0)
    size: float = 1.0

    def is_alive(self) -> bool:
        """Check if particle is still alive"""
        return self.age < self.lifetime

    def get_progress(self) -> float:
        """Get animation progress (0.0 to 1.0)"""
        if self.lifetime <= 0:
            return 1.0
        return self.age / self.lifetime

    def get_color(self) -> Tuple[int, int, int]:
        """Interpolate color based on age"""
        progress = self.get_progress()
        r = int(self.start_color[0] * (1 - progress) + self.end_color[0] * progress)
        g = int(self.start_color[1] * (1 - progress) + self.end_color[1] * progress)
        b = int(self.start_color[2] * (1 - progress) + self.end_color[2] * progress)
        return (r, g, b)

    def reset(self) -> None:
        """Reset particle to initial state"""
        self.x = 0.0
        self.y = 0.0
        self.vx = 0.0
        self.vy = 0.0
        self.age = 0.0
        self.lifetime = 1.0
        self.size = 1.0


@dataclass
class ParticleEmitter:
    """Emitter spawning particles with configurable properties"""
    x: float = 0.0
    y: float = 0.0
    emission_rate: float = 10.0  # Particles per second
    velocity_min: float = 1.0
    velocity_max: float = 5.0
    angle_min: float = 0.0  # Degrees
    angle_max: float = 360.0
    lifetime_min: float = 1.0
    lifetime_max: float = 3.0
    gravity: float = 0.0
    start_color: Tuple[int, int, int] = (255, 255, 255)
    end_color: Tuple[int, int, int] = (0, 0, 0)
    particle_size: float = 1.0
    active: bool = True
    emission_time: float = 0.0  # Time left to emit particles
    lifetime_elapsed: float = 0.0  # Total lifetime of emitter

    def should_emit(self, delta_time: float) -> int:
        """Calculate how many particles to emit this frame"""
        if not self.active:
            return 0
        self.emission_time += delta_time * self.emission_rate
        count = int(self.emission_time)
        self.emission_time -= count
        return count


class FXSystem(BaseSystem):
    """
    Particle effects system with pooling, emission, and physics.
    Manages multiple emitters and efficiently recycles particles.
    """

    def __init__(self, config: Optional[SystemConfig] = None,
                 max_particles: int = 1000):
        super().__init__(config or SystemConfig(name="FXSystem"))
        self.max_particles = max_particles
        self.particle_pool: List[Particle] = [
            Particle() for _ in range(max_particles)
        ]
        self.active_particles: List[Particle] = []
        self.emitters: Dict[str, ParticleEmitter] = {}

        # Statistics
        self.total_particles_emitted = 0
        self.total_emitters_created = 0

    def initialize(self) -> bool:
        """Initialize FX system"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update particles and emitters"""
        if self.status != SystemStatus.RUNNING:
            return

        # Emit new particles
        for emitter_id in list(self.emitters.keys()):
            emitter = self.emitters[emitter_id]
            count = emitter.should_emit(delta_time)

            for _ in range(count):
                if self.particle_pool:
                    particle = self.particle_pool.pop()
                    self._init_particle(particle, emitter)
                    self.active_particles.append(particle)
                    self.total_particles_emitted += 1

            # Update emitter lifetime
            emitter.lifetime_elapsed += delta_time

        # Update active particles
        for particle in list(self.active_particles):
            particle.age += delta_time

            # Apply gravity
            particle.vy += emitter.gravity * delta_time if emitter else 0

            # Update position
            particle.x += particle.vx * delta_time
            particle.y += particle.vy * delta_time

            # Remove dead particles
            if not particle.is_alive():
                self.active_particles.remove(particle)
                particle.reset()
                self.particle_pool.append(particle)

    def shutdown(self) -> None:
        """Shutdown FX system"""
        self.active_particles.clear()
        self.emitters.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process FX system intents"""
        action = intent.get("action", "")

        if action == "create_emitter":
            emitter_id = intent.get("emitter_id", f"emitter_{len(self.emitters)}")
            x = intent.get("x", 0.0)
            y = intent.get("y", 0.0)
            result = self.create_emitter(emitter_id, x, y)
            return {"success": result is not None, "emitter_id": emitter_id}

        elif action == "emit_particles":
            emitter_id = intent.get("emitter_id", "")
            count = intent.get("count", 1)
            result = self.emit_particles(emitter_id, count)
            return {"success": result, "particles_emitted": count}

        elif action == "remove_emitter":
            emitter_id = intent.get("emitter_id", "")
            result = self.remove_emitter(emitter_id)
            return {"success": result, "emitter_id": emitter_id}

        elif action == "get_active_particles":
            return {"active_particles": len(self.active_particles)}

        else:
            return {"error": f"Unknown FXSystem action: {action}"}

    def _init_particle(self, particle: Particle, emitter: ParticleEmitter) -> None:
        """Initialize particle from emitter settings"""
        import random

        particle.x = emitter.x
        particle.y = emitter.y
        particle.lifetime = random.uniform(emitter.lifetime_min, emitter.lifetime_max)
        particle.age = 0.0
        particle.size = emitter.particle_size
        particle.start_color = emitter.start_color
        particle.end_color = emitter.end_color

        # Random velocity within range
        velocity = random.uniform(emitter.velocity_min, emitter.velocity_max)
        angle_deg = random.uniform(emitter.angle_min, emitter.angle_max)
        angle_rad = math.radians(angle_deg)
        particle.vx = velocity * math.cos(angle_rad)
        particle.vy = velocity * math.sin(angle_rad)

    def create_emitter(self, emitter_id: str, x: float = 0.0,
                      y: float = 0.0) -> Optional[ParticleEmitter]:
        """Create a new particle emitter"""
        if emitter_id in self.emitters:
            return None

        emitter = ParticleEmitter(x=x, y=y)
        self.emitters[emitter_id] = emitter
        self.total_emitters_created += 1
        return emitter

    def remove_emitter(self, emitter_id: str) -> bool:
        """Remove an emitter"""
        if emitter_id not in self.emitters:
            return False

        del self.emitters[emitter_id]
        return True

    def get_emitter(self, emitter_id: str) -> Optional[ParticleEmitter]:
        """Get emitter by ID"""
        return self.emitters.get(emitter_id)

    def emit_particles(self, emitter_id: str, count: int) -> bool:
        """Manually emit N particles from an emitter"""
        emitter = self.get_emitter(emitter_id)
        if not emitter:
            return False

        for _ in range(count):
            if self.particle_pool:
                particle = self.particle_pool.pop()
                self._init_particle(particle, emitter)
                self.active_particles.append(particle)
                self.total_particles_emitted += 1

        return True

    def get_status(self) -> Dict[str, Any]:
        """Get FX system status"""
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            'active_particles': len(self.active_particles),
            'pooled_particles': len(self.particle_pool),
            'max_particles': self.max_particles,
            'pool_efficiency': len(self.particle_pool) / self.max_particles,
            'active_emitters': len(self.emitters),
            'total_particles_emitted': self.total_particles_emitted,
            'total_emitters_created': self.total_emitters_created,
        }


# Factory functions
def create_default_fx_system() -> FXSystem:
    """Create default FX system with 1000 particles"""
    config = SystemConfig(name="FXSystem")
    system = FXSystem(config, max_particles=1000)
    system.initialize()
    return system


def create_large_fx_system() -> FXSystem:
    """Create large FX system with 5000 particles"""
    config = SystemConfig(name="LargeFXSystem")
    system = FXSystem(config, max_particles=5000)
    system.initialize()
    return system


def create_minimal_fx_system() -> FXSystem:
    """Create minimal FX system with 200 particles"""
    config = SystemConfig(name="MinimalFXSystem")
    system = FXSystem(config, max_particles=200)
    system.initialize()
    return system
