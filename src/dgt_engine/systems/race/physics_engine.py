"""
Deterministic Race Physics Engine - DGT Tier 2 Architecture

Transplanted from TurboShells race_engine.py with SubStepping hardening.
Deterministic tick-based physics simulation with genetic trait integration.

This is the "Heart" of the race system - pure physics math with no rendering.
Uses SubSteppingEngine to maintain 30Hz legacy feel at 60Hz update rates.
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import math
import time

from ...foundation.base import ComponentConfig
from ...systems.base import BaseSystem, SystemConfig
from ...foundation.types import Result
from ...foundation.types.race import (
    TurtleState, RaceSnapshot, RaceConfig, TerrainSegment, 
    TurtleStatus, TerrainType, create_race_snapshot
)
from ...foundation.genetics.schema import TurboGenome, LimbShape


@dataclass
class PhysicsConstants:
    """Physical constants for turtle movement"""
    BASE_SPEED: float = 10.0          # Base movement speed (units/second)
    ENERGY_DRAIN_RATE: float = 1.0     # Energy drain per second
    RECOVERY_RATE: float = 2.0         # Energy recovery per second
    MIN_ENERGY_FOR_MOVEMENT: float = 5.0  # Minimum energy to move
    TURN_SPEED: float = 90.0          # Degrees per second
    MAX_SPEED: float = 25.0           # Maximum possible speed
    
    # Terrain modifiers (multipliers)
    TERRAIN_MODIFIERS: Dict[TerrainType, Dict[str, float]] = None
    
    def __post_init__(self):
        """Initialize terrain modifiers"""
        if self.TERRAIN_MODIFIERS is None:
            self.TERRAIN_MODIFIERS = {
                TerrainType.GRASS: {"speed": 1.0, "energy": 1.0},
                TerrainType.MUD: {"speed": 0.6, "energy": 1.5},
                TerrainType.WATER: {"speed": 0.4, "energy": 1.2},
                TerrainType.SAND: {"speed": 0.7, "energy": 1.3},
                TerrainType.ROCK: {"speed": 0.5, "energy": 1.4},
                TerrainType.ROUGH: {"speed": 0.8, "energy": 1.2},
                TerrainType.TRACK: {"speed": 1.1, "energy": 0.9},
                TerrainType.FINISH: {"speed": 1.0, "energy": 1.0}
            }


@dataclass
class SubStepConfig:
    """Configuration for sub-stepping physics"""
    target_frequency: float = 30.0    # Target physics frequency (Hz)
    max_sub_steps: int = 4           # Maximum sub-steps per frame
    accumulated_time: float = 0.0     # Accumulated time for sub-stepping
    
    def get_sub_step_count(self, frame_time: float) -> int:
        """Calculate number of sub-steps needed for this frame"""
        target_frame_time = 1.0 / self.target_frequency
        if frame_time <= target_frame_time:
            return 1
        
        sub_steps = min(int(frame_time / target_frame_time), self.max_sub_steps)
        return max(1, sub_steps)


class TurtlePhysics:
    """Physics state for a single turtle"""
    
    def __init__(self, turtle_state: TurtleState, genome: TurboGenome):
        self.turtle_state = turtle_state
        self.genome = genome
        self.velocity = 0.0
        self.acceleration = 0.0
        self.energy_regen_timer = 0.0
        
        # Calculate genetic modifiers
        self.speed_modifier = self._calculate_speed_modifier()
        self.energy_efficiency = self._calculate_energy_efficiency()
        self.terrain_bonus = self._calculate_terrain_bonus()
    
    def _calculate_speed_modifier(self) -> float:
        """Calculate speed modifier from genetic traits"""
        modifier = 1.0
        
        # Limb shape affects speed
        if self.genome.limb_shape == LimbShape.FINS:
            modifier *= 1.2  # Fins are faster in water
        elif self.genome.limb_shape == LimbShape.FEET:
            modifier *= 1.1  # Feet are good on land
        
        # Leg length affects stride
        modifier *= (0.8 + 0.4 * self.genome.leg_length)  # 0.8 to 1.2 multiplier
        
        # Shell size affects drag
        if self.genome.shell_size_modifier > 1.0:
            modifier *= (2.0 - self.genome.shell_size_modifier)  # Larger shells = more drag
        
        return max(0.5, min(1.5, modifier))
    
    def _calculate_energy_efficiency(self) -> float:
        """Calculate energy efficiency from genetic traits"""
        efficiency = 1.0
        
        # Shell size affects energy conservation
        if self.genome.shell_size_modifier < 1.0:
            efficiency *= (1.0 + 0.2 * (1.0 - self.genome.shell_size_modifier))
        
        # Leg thickness affects endurance
        efficiency *= (0.9 + 0.2 * self.genome.leg_thickness_modifier)
        
        return max(0.5, min(1.5, efficiency))
    
    def _calculate_terrain_bonus(self) -> Dict[TerrainType, float]:
        """Calculate terrain-specific bonuses from genetics"""
        bonuses = {}
        
        # Fins give water bonus
        if self.genome.limb_shape == LimbShape.FINS:
            bonuses[TerrainType.WATER] = 1.5
            bonuses[TerrainType.MUD] = 1.2
        
        # Feet give land bonus
        elif self.genome.limb_shape == LimbShape.FEET:
            bonuses[TerrainType.GRASS] = 1.2
            bonuses[TerrainType.SAND] = 1.3
            bonuses[TerrainType.ROCK] = 1.1
        
        # Flippers are balanced
        else:  # FLIPPERS
            bonuses[TerrainType.WATER] = 1.2
            bonuses[TerrainType.GRASS] = 1.1
        
        return bonuses
    
    def update_physics(self, dt: float, terrain: TerrainSegment, 
                      constants: PhysicsConstants) -> Dict[str, Any]:
        """Update physics for one time step"""
        updates = {}
        
        # Check if turtle has enough energy
        if self.turtle_state.current_energy < constants.MIN_ENERGY_FOR_MOVEMENT:
            # Turtle is exhausted, enter recovery mode
            self.turtle_state.is_resting = True
            self.turtle_state.status = TurtleStatus.RESTING
            
            # Recover energy
            recovery_amount = constants.RECOVERY_RATE * self.energy_efficiency * dt
            self.turtle_state.current_energy = min(
                self.turtle_state.current_energy + recovery_amount,
                self.turtle_state.max_energy
            )
            
            updates['energy_recovered'] = recovery_amount
            updates['distance_moved'] = 0.0
            return updates
        
        # Turtle is active
        self.turtle_state.is_resting = False
        self.turtle_state.status = TurtleStatus.RACING
        
        # Calculate terrain effects
        terrain_speed_mod = terrain.speed_modifier
        terrain_energy_mod = terrain.energy_drain
        
        # Apply genetic terrain bonuses
        terrain_bonus = self.terrain_bonus.get(terrain.terrain_type, 1.0)
        terrain_speed_mod *= terrain_bonus
        
        # Calculate effective speed
        base_speed = constants.BASE_SPEED * self.speed_modifier
        effective_speed = base_speed * terrain_speed_mod
        effective_speed = min(effective_speed, constants.MAX_SPEED)
        
        # Update velocity with acceleration (smooth movement)
        target_velocity = effective_speed
        acceleration_rate = 5.0  # How fast turtle reaches target speed
        self.acceleration = (target_velocity - self.velocity) * acceleration_rate
        self.velocity += self.acceleration * dt
        self.velocity = max(0, min(self.velocity, constants.MAX_SPEED))
        
        # Calculate distance moved
        distance_moved = self.velocity * dt
        
        # Drain energy
        energy_drain = (constants.ENERGY_DRAIN_RATE * terrain_energy_mod / 
                       self.energy_efficiency) * dt
        self.turtle_state.current_energy = max(0, self.turtle_state.current_energy - energy_drain)
        
        # Update performance metrics
        self.turtle_state.top_speed = max(self.turtle_state.top_speed, self.velocity)
        self.turtle_state.race_time += dt
        
        # Calculate average speed
        if self.turtle_state.race_time > 0:
            self.turtle_state.average_speed = (self.turtle_state.x / self.turtle_state.race_time)
        
        updates.update({
            'distance_moved': distance_moved,
            'energy_drained': energy_drain,
            'effective_speed': effective_speed,
            'terrain_modifier': terrain_speed_mod,
            'genetic_bonus': terrain_bonus
        })
        
        return updates


class RacePhysicsEngine(BaseSystem):
    """
    Deterministic race physics engine with sub-stepping.
    
    This engine handles the pure physics simulation of turtle racing.
    It's completely headless - no rendering, just math.
    """
    
    def __init__(self, config: Optional[SystemConfig] = None):
        if config is None:
            config = SystemConfig(
                system_id="race_physics_engine",
                system_name="Race Physics Engine",
                enabled=True,
                debug_mode=False,
                auto_register=True,
                update_interval=1.0 / 60.0,  # 60Hz update rate
                priority=1  # Highest priority
            )
        
        super().__init__(config)
        
        # Physics state
        self.constants = PhysicsConstants()
        self.sub_step_config = SubStepConfig()
        self.turtle_physics: Dict[str, TurtlePhysics] = {}
        self.race_config: Optional[RaceConfig] = None
        self.terrain_segments: List[TerrainSegment] = []
        
        # Race state
        self.current_tick = 0
        self.race_start_time: Optional[float] = None
        self.race_finished = False
        self.finish_order: List[str] = []
        
        # Performance tracking
        self.physics_time = 0.0
        self.sub_step_count = 0
    
    def _on_initialize(self) -> Result[bool]:
        """Initialize the physics engine"""
        try:
            self._get_logger().info("🏁 Race Physics Engine initialized")
            self._get_logger().info(f"⚡ Target physics frequency: {self.sub_step_config.target_frequency}Hz")
            self._get_logger().info(f"🔧 Max sub-steps per frame: {self.sub_step_config.max_sub_steps}")
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Physics engine initialization failed: {str(e)}")
    
    def _on_shutdown(self) -> Result[None]:
        """Shutdown the physics engine"""
        try:
            self._get_logger().info("🏁 Race Physics Engine shutdown")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Physics engine shutdown failed: {str(e)}")
    
    def _on_update(self, dt: float) -> Result[None]:
        """Update physics with sub-stepping"""
        try:
            if not self.race_config or self.race_finished:
                return Result.success_result(None)
            
            # Start race timer
            if self.race_start_time is None:
                self.race_start_time = time.perf_counter()
            
            # Sub-stepping logic
            self.sub_step_config.accumulated_time += dt
            
            while self.sub_step_config.accumulated_time >= 1.0 / self.sub_step_config.target_frequency:
                sub_dt = 1.0 / self.sub_step_config.target_frequency
                self._physics_step(sub_dt)
                self.sub_step_config.accumulated_time -= sub_dt
                self.sub_step_count += 1
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Physics update failed: {str(e)}")
    
    def _physics_step(self, dt: float) -> None:
        """Execute one physics step"""
        self.current_tick += 1
        
        # Update each turtle's physics
        for turtle_id, turtle_physics in self.turtle_physics.items():
            if turtle_physics.turtle_state.finished:
                continue
            
            # Get terrain at current position
            terrain = self._get_terrain_at_position(turtle_physics.turtle_state.x)
            
            # Update physics
            updates = turtle_physics.update_physics(dt, terrain, self.constants)
            
            # Update position
            turtle_physics.turtle_state.x += updates['distance_moved']
            
            # Check finish line
            if turtle_physics.turtle_state.x >= self.race_config.track_length:
                turtle_physics.turtle_state.x = self.race_config.track_length
                turtle_physics.turtle_state.finished = True
                turtle_physics.turtle_state.status = TurtleStatus.FINISHED
                turtle_physics.turtle_state.rank = len(self.finish_order) + 1
                self.finish_order.append(turtle_id)
                
                self._get_logger().info(
                    f"🏁 Turtle {turtle_id} finished! Rank: {turtle_physics.turtle_state.rank}"
                )
    
    def _on_handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """Handle physics engine events"""
        try:
            if event_type == "start_race":
                return self.start_race(event_data.get("turtles", []), 
                                    event_data.get("config"))
            elif event_type == "stop_race":
                return self.stop_race()
            elif event_type == "get_race_snapshot":
                return self.get_race_snapshot()
            elif event_type == "get_physics_stats":
                return self.get_physics_stats()
            else:
                return Result.success_result(None)
                
        except Exception as e:
            return Result.failure_result(f"Physics event handling failed: {str(e)}")
    
    def start_race(self, turtle_states: List[TurtleState], 
                   race_config: Optional[RaceConfig] = None) -> Result[None]:
        """Start a new race with given turtles"""
        try:
            self.race_config = race_config or RaceConfig()
            self.terrain_segments = self.race_config.terrain_segments or self._generate_default_terrain()
            
            # Reset race state
            self.current_tick = 0
            self.race_start_time = None
            self.race_finished = False
            self.finish_order = []
            self.sub_step_config.accumulated_time = 0.0
            
            # Create turtle physics objects
            self.turtle_physics.clear()
            for turtle_state in turtle_states:
                # For now, create a default genome (will be passed externally later)
                genome = TurboGenome()
                physics = TurtlePhysics(turtle_state, genome)
                self.turtle_physics[turtle_state.id] = physics
            
            self._get_logger().info(f"🏁 Race started with {len(turtle_states)} turtles")
            self._get_logger().info(f"📏 Track length: {self.race_config.track_length}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to start race: {str(e)}")
    
    def stop_race(self) -> Result[None]:
        """Stop the current race"""
        try:
            self.race_finished = True
            
            elapsed_time = 0.0
            if self.race_start_time:
                elapsed_time = time.perf_counter() - self.race_start_time
            
            self._get_logger().info(f"🏁 Race stopped after {elapsed_time:.2f}s")
            self._get_logger().info(f"📊 Total physics steps: {self.current_tick}")
            self._get_logger().info(f"📊 Sub-steps performed: {self.sub_step_count}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to stop race: {str(e)}")
    
    def get_race_snapshot(self) -> Result[RaceSnapshot]:
        """Get current race state as snapshot"""
        try:
            if not self.race_config:
                return Result.failure_result("No race in progress")
            
            # Collect turtle states
            turtle_states = [physics.turtle_state for physics in self.turtle_physics.values()]
            
            # Get upcoming terrain
            terrain_ahead = self._get_upcoming_terrain()
            
            # Calculate elapsed time
            elapsed_ms = 0.0
            if self.race_start_time:
                elapsed_ms = (time.perf_counter() - self.race_start_time) * 1000
            
            # Create snapshot
            snapshot = RaceSnapshot(
                tick=self.current_tick,
                elapsed_ms=elapsed_ms,
                course_id="default",
                track_length=self.race_config.track_length,
                turtles=turtle_states,
                terrain_ahead=terrain_ahead,
                finished=self.race_finished,
                winner_id=self.finish_order[0] if self.finish_order else None
            )
            
            return Result.success_result(snapshot)
            
        except Exception as e:
            return Result.failure_result(f"Failed to create race snapshot: {str(e)}")
    
    def get_physics_stats(self) -> Result[Dict[str, Any]]:
        """Get physics performance statistics"""
        try:
            stats = {
                'current_tick': self.current_tick,
                'sub_steps_performed': self.sub_step_count,
                'target_frequency': self.sub_step_config.target_frequency,
                'turtles_racing': len([p for p in self.turtle_physics.values() 
                                    if not p.turtle_state.finished]),
                'turtles_finished': len([p for p in self.turtle_physics.values() 
                                      if p.turtle_state.finished]),
                'race_finished': self.race_finished,
                'physics_time': self.physics_time
            }
            
            return Result.success_result(stats)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get physics stats: {str(e)}")
    
    def _get_terrain_at_position(self, distance: float) -> TerrainSegment:
        """Get terrain segment at given distance"""
        for segment in self.terrain_segments:
            if segment.contains_distance(distance):
                return segment
        
        # Default terrain if no segment found
        return TerrainSegment(
            start_distance=distance,
            end_distance=distance + 100,
            terrain_type=TerrainType.GRASS,
            speed_modifier=1.0,
            energy_drain=1.0
        )
    
    def _get_upcoming_terrain(self, lookahead: int = 5) -> List[TerrainSegment]:
        """Get upcoming terrain segments"""
        segments = []
        
        if not self.turtle_physics:
            return segments
        
        # Find the lead turtle
        lead_distance = 0.0
        for physics in self.turtle_physics.values():
            if not physics.turtle_state.finished:
                lead_distance = max(lead_distance, physics.turtle_state.x)
        
        # Get upcoming segments
        segment_length = 100.0
        for i in range(lookahead):
            start = lead_distance + (i * segment_length)
            end = start + segment_length
            
            if start >= self.race_config.track_length:
                break
            
            terrain = self._get_terrain_at_position(start)
            segments.append(TerrainSegment(
                start_distance=start,
                end_distance=min(end, self.race_config.track_length),
                terrain_type=terrain.terrain_type,
                speed_modifier=terrain.speed_modifier,
                energy_drain=terrain.energy_drain
            ))
        
        return segments
    
    def _generate_default_terrain(self) -> List[TerrainSegment]:
        """Generate default terrain track"""
        segments = []
        track_length = self.race_config.track_length if self.race_config else 1500.0
        segment_length = 200.0
        
        # Create varied terrain
        terrain_types = [
            TerrainType.GRASS, TerrainType.MUD, TerrainType.WATER,
            TerrainType.SAND, TerrainType.ROCK, TerrainType.TRACK
        ]
        
        current_distance = 0.0
        terrain_index = 0
        
        while current_distance < track_length:
            terrain_type = terrain_types[terrain_index % len(terrain_types)]
            
            segment = TerrainSegment(
                start_distance=current_distance,
                end_distance=min(current_distance + segment_length, track_length),
                terrain_type=terrain_type,
                speed_modifier=self.constants.TERRAIN_MODIFIERS[terrain_type]["speed"],
                energy_drain=self.constants.TERRAIN_MODIFIERS[terrain_type]["energy"]
            )
            
            segments.append(segment)
            current_distance += segment_length
            terrain_index += 1
        
        return segments


# Factory function
def create_race_physics_engine() -> RacePhysicsEngine:
    """Create a race physics engine instance"""
    return RacePhysicsEngine()


# Export key components
__all__ = [
    'RacePhysicsEngine',
    'PhysicsConstants',
    'SubStepConfig',
    'TurtlePhysics',
    'create_race_physics_engine'
]
