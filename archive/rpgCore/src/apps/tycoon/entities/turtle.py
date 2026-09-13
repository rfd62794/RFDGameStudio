"""
Sovereign Turtle Entity - First DGT-Native TurboShell

Sprint E1: Turbo Entity Synthesis - Entity Layer
ADR 217: Composition over Inheritance for Entity Architecture

The Sovereign Turtle represents the first true DGT-native entity,
combining the 17-trait genetic system with kinetic physics through
composition rather than inheritance. This entity demonstrates the
Plug-and-Play architecture built in Sprints A-D.
"""

from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import math
import time

from foundation.types import Result
from foundation.protocols import Vector2Protocol
from foundation.vector import Vector2
from foundation.registry import DGTRegistry, RegistryType
from foundation.genetics.genome_engine import TurboGenome, ShellPatternType, BodyPatternType, LimbShapeType
from ..components.kinetic_body import KineticBody, PhysicsStats, KineticState


@dataclass
class RaceStats:
    """Race statistics for tracking performance"""
    finish_time: Optional[float] = None
    distance_covered: float = 0.0
    checkpoints_passed: int = 0
    terrain_bonuses: Dict[str, float] = None
    total_energy_used: float = 0.0
    average_speed: float = 0.0
    position_history: List[Tuple[float, float]] = None
    
    def __post_init__(self):
        if self.terrain_bonuses is None:
            self.terrain_bonuses = {}
        if self.position_history is None:
            self.position_history = []


@dataclass
class TurtleStats:
    """Derived statistics from genome and physics"""
    max_speed: float
    acceleration: float
    turn_rate: float
    endurance: float
    strength: float
    agility: float
    intelligence: float
    charisma: float


class SovereignTurtle:
    """
    Sovereign Turtle Entity - First DGT-Native TurboShell
    
    Composes TurboGenome (Tier 1) with KineticBody (Tier 2) to create
    a complete entity with genetic traits and physical properties.
    This demonstrates the composition-over-inheritance pattern.
    """
    
    def __init__(self, turtle_id: str, genome: TurboGenome, initial_position: Tuple[float, float]):
        self.turtle_id = turtle_id
        self.genome = genome
        self.creation_time = time.time()
        
        # Derive physics stats from genome
        self.turtle_stats = self._derive_stats_from_genome()
        
        # Create kinetic body with derived stats
        physics_stats = self._create_physics_stats()
        initial_state = KineticState(
            position=Vector2(initial_position[0], initial_position[1]),
            velocity=Vector2(0, 0),
            acceleration=Vector2(0, 0),
            heading=0.0,
            angular_velocity=0.0
        )
        
        self.kinetic_body = KineticBody(initial_state, physics_stats)
        
        # Entity state
        self._active = True
        self.energy = 100.0
        self.experience = 0
        self.level = 1
        
        # Race statistics
        self.race_stats = RaceStats()
        
        # Note: Registration handled by WorldState orchestrator to prevent double-counting
    
    def register_with_registry(self, registry: 'DGTRegistry') -> Result[None]:
        """Register turtle with DGTRegistry (called by orchestrator)"""
        try:
            # Register genome
            genome_result = registry.register(
                f"genome_{self.turtle_id}",
                self.genome,
                RegistryType.GENOME,
                {
                    'turtle_id': self.turtle_id,
                    'creation_time': self.creation_time,
                    'shell_pattern': self.genome.shell_pattern_type.value,
                    'body_pattern': self.genome.body_pattern_type.value,
                    'limb_shape': self.genome.limb_shape.value
                }
            )
            
            # Register entity
            entity_result = registry.register(
                f"entity_{self.turtle_id}",
                self,
                RegistryType.ENTITY,
                {
                    'entity_type': 'turtle',
                    'turtle_id': self.turtle_id,
                    'creation_time': self.creation_time,
                    'level': self.level,
                    'energy': self.energy,
                    'experience': self.experience
                }
            )
            
            if genome_result.success and entity_result.success:
                self._get_logger().info(f"✅ Turtle {self.turtle_id} registered")
                return Result.success_result(None)
            else:
                return Result.failure_result(f"Turtle {self.turtle_id} registration failed")
                
        except Exception as e:
            return Result.failure_result(f"Turtle {self.turtle_id} registration error: {str(e)}")
    
    def _derive_stats_from_genome(self) -> TurtleStats:
        """
        Derive turtle statistics from 17-trait genome.
        
        Maps genetic traits to physical and mental characteristics:
        - Shell size modifier -> strength, endurance
        - Leg length -> speed, agility  
        - Eye size modifier -> intelligence
        - Pattern colors -> charisma
        """
        
        # Speed and agility from leg traits
        leg_speed_bonus = self.genome.leg_length * 20.0  # 0.5-1.5 -> 10-30 speed bonus
        base_speed = 30.0 + leg_speed_bonus
        
        # Strength and endurance from shell traits
        shell_strength_bonus = self.genome.shell_size_modifier * 15.0  # 0.5-1.5 -> 7.5-22.5 strength bonus
        base_strength = 15.0 + shell_strength_bonus
        base_endurance = 50.0 + (shell_strength_bonus * 2.0)
        
        # Intelligence from eye traits
        intelligence_bonus = self.genome.eye_size_modifier * 10.0  # 0.8-1.2 -> 8-12 intelligence bonus
        base_intelligence = 10.0 + intelligence_bonus
        
        # Charisma from color traits (brightness and pattern)
        shell_brightness = sum(self.genome.shell_base_color) / (3 * 255)  # 0-1 normalized
        pattern_complexity = 1.0 if self.genome.shell_pattern_type != ShellPatternType.HEX else 0.5
        base_charisma = (shell_brightness * 20.0) + (pattern_complexity * 10.0)
        
        # Agility from limb shape
        agility_bonus = {
            LimbShapeType.FLIPPERS: 5.0,
            LimbShapeType.FEET: 10.0,
            LimbShapeType.FINS: 15.0
        }.get(self.genome.limb_shape, 10.0)
        
        return TurtleStats(
            max_speed=base_speed,
            acceleration=base_speed * 0.3,  # 30% of max speed as acceleration
            turn_rate=math.pi * (1.0 + (self.genome.leg_length - 1.0) * 0.5),  # Turn rate scales with leg length
            endurance=base_endurance,
            strength=base_strength,
            agility=10.0 + agility_bonus,
            intelligence=base_intelligence,
            charisma=base_charisma
        )
    
    def _create_physics_stats(self) -> PhysicsStats:
        """Create physics stats from derived turtle stats"""
        return PhysicsStats(
            max_speed=self.turtle_stats.max_speed,
            acceleration=self.turtle_stats.acceleration,
            deceleration=self.turtle_stats.acceleration * 0.6,  # 60% of acceleration for braking
            turn_rate=self.turtle_stats.turn_rate,
            mass=10.0 + (self.genome.shell_size_modifier * 5.0),  # Mass scales with shell size
            drag_coefficient=0.1 + (1.0 - self.genome.shell_pattern_density) * 0.1,  # Less dense = less drag
            collision_radius=5.0 + self.genome.shell_size_modifier * 3.0  # Size scales with shell
        )
    
    # === ENTITY INTERFACE ===
    
    @property
    def position(self) -> Vector2:
        """Get current position"""
        return self.kinetic_body.state.position
    
    @property
    def velocity(self) -> Vector2:
        """Get current velocity"""
        return self.kinetic_body.state.velocity
    
    @property
    def heading(self) -> float:
        """Get current heading in radians"""
        return self.kinetic_body.state.heading
    
    @property
    def active(self) -> bool:
        """Get active state"""
        return self._active and self.kinetic_body.is_active()
    
    @property
    def radius(self) -> float:
        """Get collision radius"""
        return self.kinetic_body.stats.collision_radius
    
    def update(self, dt: float) -> Result[None]:
        """Update turtle state"""
        try:
            if not self.active:
                return Result.success_result(None)
            
            # Update kinetic body
            kinetic_result = self.kinetic_body.update(dt)
            if not kinetic_result.success:
                return kinetic_result
            
            # Update energy based on movement
            if self.kinetic_body.is_moving():
                energy_cost = self.kinetic_body.get_speed() * 0.01 * dt  # Energy cost scales with speed
                self.energy = max(0, self.energy - energy_cost)
            
            # Update registry with new state
            self._update_registry_state()
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Turtle update failed: {str(e)}")
    
    def apply_thrust(self, thrust_magnitude: float) -> Result[None]:
        """Apply thrust to turtle"""
        if self.energy <= 0:
            return Result.failure_result("Insufficient energy")
        
        # Energy cost for thrust
        energy_cost = thrust_magnitude * 0.1
        if self.energy < energy_cost:
            return Result.failure_result("Insufficient energy for thrust")
        
        # Apply thrust
        result = self.kinetic_body.apply_thrust(thrust_magnitude)
        if result.success:
            self.energy -= energy_cost
        
        return result
    
    def rotate(self, angular_velocity: float) -> Result[None]:
        """Rotate turtle"""
        return self.kinetic_body.rotate(angular_velocity)
    
    def rest(self, dt: float) -> Result[None]:
        """Rest and recover energy"""
        try:
            # Stop movement
            self.kinetic_body.stop()
            
            # Recover energy
            energy_recovery = self.turtle_stats.endurance * 0.05 * dt  # Recovery rate based on endurance
            self.energy = min(100.0, self.energy + energy_recovery)
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Turtle rest failed: {str(e)}")
    
    def teleport(self, position: Vector2) -> Result[None]:
        """
        Teleport turtle to new position.
        
        Args:
            position: New position for turtle
            
        Returns:
            Result indicating success
        """
        try:
            # Update kinetic body position directly
            self.kinetic_body.state.position = position.copy()
            self.kinetic_body.state.velocity = Vector2(0, 0)  # Stop movement on teleport
            
            # Update position history
            self.race_stats.position_history.append((position.x, position.y))
            
            # Keep history limited
            if len(self.race_stats.position_history) > 1000:
                self.race_stats.position_history.pop(0)
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Turtle teleport failed: {str(e)}")
    
    def update_race_stats(self, dt: float) -> None:
        """Update race statistics"""
        try:
            # Update distance covered
            if self.kinetic_body.is_moving():
                distance = self.kinetic_body.state.velocity.magnitude() * dt
                self.race_stats.distance_covered += distance
            
            # Update average speed
            if self.race_stats.distance_covered > 0:
                # Calculate based on race time if available
                if self.race_stats.finish_time is not None:
                    race_time = self.race_stats.finish_time - self.creation_time
                    if race_time > 0:
                        self.race_stats.average_speed = self.race_stats.distance_covered / race_time
                else:
                    # Fallback to recent speed
                    self.race_stats.average_speed = self.kinetic_body.get_speed()
            
            # Update position history
            self.race_stats.position_history.append((self.position.x, self.position.y))
            
            # Keep history limited
            if len(self.race_stats.position_history) > 1000:
                self.race_stats.position_history.pop(0)
            
        except Exception as e:
            self._get_logger().error(f"Failed to update race stats: {e}")
    
    def get_state_dict(self) -> Dict[str, Any]:
        """Get complete turtle state"""
        return {
            'turtle_id': self.turtle_id,
            'position': self.position.to_tuple(),
            'velocity': self.velocity.to_tuple(),
            'heading': self.heading,
            'speed': self.kinetic_body.get_speed(),
            'active': self.active,
            'energy': self.energy,
            'level': self.level,
            'experience': self.experience,
            'creation_time': self.creation_time,
            'race_stats': {
                'finish_time': self.race_stats.finish_time,
                'distance_covered': self.race_stats.distance_covered,
                'checkpoints_passed': self.race_stats.checkpoints_passed,
                'terrain_bonuses': self.race_stats.terrain_bonuses,
                'total_energy_used': self.race_stats.total_energy_used,
                'average_speed': self.race_stats.average_speed,
                'position_history': self.race_stats.position_history
            },
            'genome': {
                'shell_base_color': self.genome.shell_base_color,
                'shell_pattern_type': self.genome.shell_pattern_type.value,
                'shell_pattern_color': self.genome.shell_pattern_color,
                'shell_pattern_density': self.genome.shell_pattern_density,
                'shell_size_modifier': self.genome.shell_size_modifier,
                'body_base_color': self.genome.body_base_color,
                'body_pattern_type': self.genome.body_pattern_type.value,
                'body_pattern_color': self.genome.body_pattern_color,
                'body_pattern_density': self.genome.body_pattern_density,
                'head_size_modifier': self.genome.head_size_modifier,
                'head_color': self.genome.head_color,
                'leg_length': self.genome.leg_length,
                'limb_shape': self.genome.limb_shape.value,
                'leg_thickness_modifier': self.genome.leg_thickness_modifier,
                'leg_color': self.genome.leg_color,
                'eye_color': self.genome.eye_color,
                'eye_size_modifier': self.genome.eye_size_modifier
            },
            'stats': {
                'max_speed': self.turtle_stats.max_speed,
                'acceleration': self.turtle_stats.acceleration,
                'turn_rate': self.turtle_stats.turn_rate,
                'endurance': self.turtle_stats.endurance,
                'strength': self.turtle_stats.strength,
                'agility': self.turtle_stats.agility,
                'intelligence': self.turtle_stats.intelligence,
                'charisma': self.turtle_stats.charisma
            },
            'physics': self.kinetic_body.get_state_dict()
        }
    
    def _update_registry_state(self) -> None:
        """Update turtle state in registry"""
        try:
            registry = DGTRegistry()
            
            # Update entity metadata
            registry.register(
                f"entity_{self.turtle_id}",
                self,
                RegistryType.ENTITY,
                {
                    'entity_type': 'turtle',
                    'turtle_id': self.turtle_id,
                    'level': self.level,
                    'energy': self.energy,
                    'experience': self.experience,
                    'position': self.position.to_tuple(),
                    'velocity': self.velocity.to_tuple(),
                    'speed': self.kinetic_body.get_speed(),
                    'active': self.active
                }
            )
            
        except Exception as e:
            self._get_logger().error(f"Failed to update registry state: {e}")
    
    def _get_logger(self):
        """Get logger for this turtle"""
        try:
            from foundation.utils.logger import get_logger_manager
            return get_logger_manager().get_component_logger(f"turtle_{self.turtle_id}")
        except Exception:
            import logging
            return logging.getLogger(f"turtle_{self.turtle_id}")
    
    @classmethod
    def from_genome(cls, turtle_id: str, genome: TurboGenome, initial_position: Tuple[float, float]) -> 'SovereignTurtle':
        """
        Factory method to create turtle from genome.
        
        Args:
            turtle_id: Unique turtle identifier
            genome: TurboGenome with 17 traits
            initial_position: Starting position (x, y)
            
        Returns:
            SovereignTurtle instance
        """
        return cls(turtle_id, genome, initial_position)


# === FACTORY FUNCTIONS ===

def create_random_turtle(turtle_id: str, initial_position: Tuple[float, float]) -> SovereignTurtle:
    """Create a turtle with random genome"""
    import random
    
    # Generate random genome
    genome = TurboGenome(
        shell_base_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        shell_pattern_type=random.choice(list(ShellPatternType)),
        shell_pattern_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        shell_pattern_density=random.uniform(0.1, 1.0),
        shell_size_modifier=random.uniform(0.5, 1.5),
        body_base_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        body_pattern_type=random.choice(list(BodyPatternType)),
        body_pattern_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        body_pattern_density=random.uniform(0.1, 1.0),
        head_size_modifier=random.uniform(0.7, 1.3),
        head_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        leg_length=random.uniform(0.5, 1.5),
        limb_shape=random.choice(list(LimbShapeType)),
        leg_thickness_modifier=random.uniform(0.7, 1.3),
        leg_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        eye_color=(random.randint(0, 255), random.randint(0, 255), random.randint(0, 255)),
        eye_size_modifier=random.uniform(0.8, 1.2)
    )
    
    return SovereignTurtle.from_genome(turtle_id, genome, initial_position)


def create_fast_turtle(turtle_id: str, initial_position: Tuple[float, float]) -> SovereignTurtle:
    """Create a turtle optimized for speed"""
    genome = TurboGenome(
        shell_base_color=(255, 100, 100),  # Red shell
        shell_pattern_type=ShellPatternType.STRIPES,
        shell_pattern_color=(255, 255, 255),  # White stripes
        shell_pattern_density=0.8,
        shell_size_modifier=0.7,  # Smaller shell for less weight
        body_base_color=(200, 150, 100),  # Tan body
        body_pattern_type=BodyPatternType.SOLID,
        body_pattern_color=(200, 150, 100),
        body_pattern_density=0.3,
        head_size_modifier=0.9,
        head_color=(150, 100, 50),
        leg_length=1.4,  # Long legs for speed
        limb_shape=LimbShapeType.FINS,  # Fins for aquatic speed
        leg_thickness_modifier=0.8,
        leg_color=(100, 50, 25),
        eye_color=(0, 0, 0),
        eye_size_modifier=1.1  # Good eyesight for racing
    )
    
    return SovereignTurtle.from_genome(turtle_id, genome, initial_position)


def create_heavy_turtle(turtle_id: str, initial_position: Tuple[float, float]) -> SovereignTurtle:
    """Create a turtle optimized for strength"""
    genome = TurboGenome(
        shell_base_color=(100, 100, 100),  # Gray shell
        shell_pattern_type=ShellPatternType.HEX,
        shell_pattern_color=(50, 50, 50),  # Dark hex pattern
        shell_pattern_density=1.0,
        shell_size_modifier=1.4,  # Large shell for protection
        body_base_color=(150, 100, 50),  # Brown body
        body_pattern_type=BodyPatternType.SOLID,
        body_pattern_color=(150, 100, 50),
        body_pattern_density=0.3,
        head_size_modifier=1.1,
        head_color=(100, 50, 25),
        leg_length=0.8,  # Short sturdy legs
        limb_shape=LimbShapeType.FEET,  # Strong feet
        leg_thickness_modifier=1.3,
        leg_color=(80, 40, 20),
        eye_color=(0, 0, 0),
        eye_size_modifier=0.9
    )
    
    return SovereignTurtle.from_genome(turtle_id, genome, initial_position)


# === EXPORTS ===

__all__ = [
    'SovereignTurtle',
    'TurtleStats',
    'create_random_turtle',
    'create_fast_turtle',
    'create_heavy_turtle'
]
