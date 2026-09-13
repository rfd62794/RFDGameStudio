"""
Exhaust System - Entity Movement Trails

Provides specialized particle effects for tracking entity movement, creating exhaust
trails, thruster plumes, and wake effects following moving entities.

Features:
- Exhaust trails following entity positions
- Velocity-based emission intensity
- Color based on entity type or thrust level
- Automatic trail cleanup
- Multi-trail support per entity
"""

from typing import Dict, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum

from src.game_engine.systems.graphics.fx.fx_system import FXSystem, ParticleEmitter
from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


class ThrusterType(Enum):
    """Types of thrusters with corresponding colors"""
    STANDARD = "standard"      # White/blue
    PLASMA = "plasma"          # Cyan/white
    ION = "ion"               # Blue/purple
    ANTIMATTER = "antimatter" # Red/white
    WARP = "warp"             # Cyan/purple


@dataclass
class ExhaustTrail:
    """
    Single exhaust trail attached to an entity.
    Emits particles based on entity velocity and position.
    """
    entity_id: str
    trail_id: str
    x: float = 0.0
    y: float = 0.0
    vx: float = 0.0
    vy: float = 0.0
    thruster_type: ThrusterType = ThrusterType.STANDARD
    emission_rate: float = 10.0  # Particles per unit velocity
    lifetime: float = 0.0
    active: bool = True
    particles_emitted: int = 0


class ExhaustSystem(BaseSystem):
    """
    Manages exhaust trails for moving entities.
    Automatically emits particles along entity paths based on velocity.
    Integrates with FXSystem for particle rendering.
    """

    def __init__(self, config: Optional[SystemConfig] = None, fx_system: Optional[FXSystem] = None):
        super().__init__(config or SystemConfig(name="ExhaustSystem"))
        self.fx_system = fx_system or FXSystem()
        self.trails: Dict[str, ExhaustTrail] = {}  # entity_id -> trail
        self.trail_colors: Dict[ThrusterType, Tuple[Tuple[int, int, int], Tuple[int, int, int]]] = {
            ThrusterType.STANDARD: ((200, 200, 255), (150, 150, 200)),      # Blue-white -> blue
            ThrusterType.PLASMA: ((0, 255, 255), (0, 200, 200)),            # Cyan -> darker cyan
            ThrusterType.ION: ((100, 150, 255), (50, 100, 200)),            # Light blue -> darker blue
            ThrusterType.ANTIMATTER: ((255, 100, 100), (200, 0, 0)),        # Light red -> dark red
            ThrusterType.WARP: ((100, 200, 255), (100, 100, 255)),          # Cyan -> purple
        }

        # Statistics
        self.total_trails_created = 0
        self.total_particles_emitted = 0

    def initialize(self) -> bool:
        """Initialize exhaust system"""
        if self.fx_system and not self.fx_system._initialized:
            self.fx_system.initialize()
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update exhaust trails and emit particles"""
        if self.status != SystemStatus.RUNNING:
            return

        for trail_id, trail in list(self.trails.items()):
            if not trail.active:
                del self.trails[trail_id]
                continue

            trail.lifetime += delta_time

            # Calculate emission based on velocity magnitude
            velocity_magnitude = (trail.vx ** 2 + trail.vy ** 2) ** 0.5
            if velocity_magnitude > 0.1:  # Only emit if moving significantly
                particles_to_emit = int(velocity_magnitude * trail.emission_rate * delta_time)
                if particles_to_emit > 0:
                    self._emit_trail_particles(trail, particles_to_emit)

    def shutdown(self) -> None:
        """Shutdown exhaust system"""
        self.trails.clear()
        if self.fx_system:
            self.fx_system.shutdown()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process exhaust system intents"""
        action = intent.get("action", "")

        if action == "create_trail":
            entity_id = intent.get("entity_id", "")
            trail_id = intent.get("trail_id", f"{entity_id}_exhaust")
            x = intent.get("x", 0.0)
            y = intent.get("y", 0.0)
            thruster_type = intent.get("thruster_type", ThrusterType.STANDARD)
            return self.create_trail(entity_id, trail_id, x, y, thruster_type)

        elif action == "update_trail":
            trail_id = intent.get("trail_id", "")
            x = intent.get("x", 0.0)
            y = intent.get("y", 0.0)
            vx = intent.get("vx", 0.0)
            vy = intent.get("vy", 0.0)
            return self.update_trail(trail_id, x, y, vx, vy)

        elif action == "remove_trail":
            trail_id = intent.get("trail_id", "")
            return self.remove_trail(trail_id)

        elif action == "set_emission_rate":
            trail_id = intent.get("trail_id", "")
            rate = intent.get("rate", 10.0)
            return self.set_emission_rate(trail_id, rate)

        elif action == "get_trail_count":
            return {"trail_count": len(self.trails)}

        else:
            return {"error": f"Unknown ExhaustSystem action: {action}"}

    def create_trail(self, entity_id: str, trail_id: str, x: float, y: float,
                    thruster_type: ThrusterType = ThrusterType.STANDARD) -> Dict[str, Any]:
        """Create a new exhaust trail for entity"""
        trail = ExhaustTrail(
            entity_id=entity_id,
            trail_id=trail_id,
            x=x,
            y=y,
            thruster_type=thruster_type
        )
        self.trails[trail_id] = trail
        self.total_trails_created += 1
        return {"success": True, "trail_id": trail_id}

    def update_trail(self, trail_id: str, x: float, y: float,
                    vx: float = 0.0, vy: float = 0.0) -> Dict[str, Any]:
        """Update trail position and velocity"""
        if trail_id not in self.trails:
            return {"success": False, "error": f"Trail not found: {trail_id}"}

        trail = self.trails[trail_id]
        trail.x = x
        trail.y = y
        trail.vx = vx
        trail.vy = vy
        return {"success": True}

    def remove_trail(self, trail_id: str) -> Dict[str, Any]:
        """Remove an exhaust trail"""
        if trail_id not in self.trails:
            return {"success": False, "error": f"Trail not found: {trail_id}"}

        del self.trails[trail_id]
        return {"success": True}

    def set_emission_rate(self, trail_id: str, rate: float) -> Dict[str, Any]:
        """Set emission rate for a trail"""
        if trail_id not in self.trails:
            return {"success": False, "error": f"Trail not found: {trail_id}"}

        self.trails[trail_id].emission_rate = rate
        return {"success": True}

    def get_status(self) -> Dict[str, Any]:
        """Get exhaust system status"""
        return {
            'status': self.status.name,
            'initialized': self._initialized,
            'active_trails': len(self.trails),
            'total_trails_created': self.total_trails_created,
            'total_particles_emitted': self.total_particles_emitted,
            'fx_system_status': self.fx_system.get_status() if self.fx_system else None,
        }

    def _emit_trail_particles(self, trail: ExhaustTrail, count: int) -> None:
        """Emit particles along trail based on velocity"""
        if not self.fx_system:
            return

        # Create emitter configuration based on thruster type
        start_color, end_color = self.trail_colors.get(
            trail.thruster_type,
            self.trail_colors[ThrusterType.STANDARD]
        )

        emitter = ParticleEmitter()
        emitter.particle_count = count
        emitter.x = trail.x
        emitter.y = trail.y
        emitter.velocity_min = 5.0
        emitter.velocity_max = 15.0
        emitter.lifetime_min = 0.2
        emitter.lifetime_max = 0.5
        emitter.start_color = start_color
        emitter.end_color = end_color
        emitter.gravity = 2.0

        # Angle emission generally opposite to velocity direction
        if abs(trail.vx) > 0.1 or abs(trail.vy) > 0.1:
            # Calculate angle opposite to velocity
            import math
            velocity_angle = math.atan2(trail.vy, trail.vx) * 180 / math.pi
            opposite_angle = (velocity_angle + 180) % 360
            # Spread around opposite direction
            emitter.angle_min = opposite_angle - 30
            emitter.angle_max = opposite_angle + 30
        else:
            emitter.angle_min = 0
            emitter.angle_max = 360

        # Create emitter in FXSystem and emit particles
        emitter_id = f"{trail.trail_id}_emitter"
        if self.fx_system:
            self.fx_system.create_emitter(emitter_id, trail.x, trail.y)
            # Configure the emitter (copy settings)
            if emitter_id in self.fx_system.emitters:
                fx_emitter = self.fx_system.emitters[emitter_id]
                fx_emitter.particle_count = emitter.particle_count
                fx_emitter.velocity_min = emitter.velocity_min
                fx_emitter.velocity_max = emitter.velocity_max
                fx_emitter.lifetime_min = emitter.lifetime_min
                fx_emitter.lifetime_max = emitter.lifetime_max
                fx_emitter.start_color = emitter.start_color
                fx_emitter.end_color = emitter.end_color
                fx_emitter.gravity = emitter.gravity
                fx_emitter.angle_min = emitter.angle_min
                fx_emitter.angle_max = emitter.angle_max

                self.fx_system.emit_particles(emitter_id, count)
                trail.particles_emitted += count
                self.total_particles_emitted += count


# Factory functions
def create_default_exhaust_system(fx_system: Optional[FXSystem] = None) -> ExhaustSystem:
    """Create default exhaust system with standard settings"""
    if fx_system is None:
        from src.game_engine.systems.graphics.fx import create_default_fx_system
        fx_system = create_default_fx_system()
    config = SystemConfig(name="ExhaustSystem")
    system = ExhaustSystem(config, fx_system)
    system.initialize()
    return system


def create_high_intensity_exhaust_system(fx_system: Optional[FXSystem] = None) -> ExhaustSystem:
    """Create high-intensity exhaust system for heavy emissions"""
    if fx_system is None:
        from src.game_engine.systems.graphics.fx import create_large_fx_system
        fx_system = create_large_fx_system()
    system = create_default_exhaust_system(fx_system)
    return system


def create_minimal_exhaust_system(fx_system: Optional[FXSystem] = None) -> ExhaustSystem:
    """Create minimal exhaust system for low-emission scenarios"""
    if fx_system is None:
        from src.game_engine.systems.graphics.fx import create_minimal_fx_system
        fx_system = create_minimal_fx_system()
    system = create_default_exhaust_system(fx_system)
    return system
