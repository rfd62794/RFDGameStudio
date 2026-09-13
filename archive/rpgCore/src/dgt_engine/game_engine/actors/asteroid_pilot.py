"""
AI Controller - AsteroidPilot Restoration
Tier 3 Application Logic - Autonomous ship control
"""

import math
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
from loguru import logger

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, DEBUG_INFINITE_ENERGY
from dgt_engine.systems.kernel.controller import BaseController, ControlInput
from dgt_engine.game_engine.neat.neat_engine import NeuralNetwork
from dgt_engine.game_engine.logic.short_term_memory import create_short_term_memory
from dgt_engine.game_engine.logic.knowledge_library import create_knowledge_library
from dgt_engine.game_engine.logic.technique_extractor import TechniqueTemplate


class PilotState(Enum):
    """AI Pilot states"""
    SCANNING = "scanning"
    APPROACHING = "approaching"
    EVADE = "evade"
    COLLECTING = "collecting"
    SURVIVING = "surviving"


@dataclass
class Vector2:
    """2D Vector for spatial calculations"""
    x: float
    y: float
    
    def magnitude(self) -> float:
        return math.sqrt(self.x ** 2 + self.y ** 2)
    
    def normalize(self) -> 'Vector2':
        mag = self.magnitude()
        if mag > 0:
            return Vector2(self.x / mag, self.y / mag)
        return Vector2(0, 0)
    
    def distance_to(self, other: 'Vector2') -> float:
        dx = self.x - other.x
        dy = self.y - other.y
        return math.sqrt(dx ** 2 + dy ** 2)
    
    def angle_to(self, other: 'Vector2') -> float:
        """Calculate angle to another vector in radians"""
        dx = other.x - self.x
        dy = other.y - other.y
        return math.atan2(dy, dx)
@dataclass
class SteeringConfig:
    """Configuration for steering behaviors"""
    seek_weight: float = 0.5
    avoid_weight: float = 1.0
    scan_radius: float = 80.0
    approach_distance: float = 40.0
    collect_distance: float = 15.0
    evade_distance: float = 25.0
    maneuver_cooldown: float = 0.5

@dataclass
class SurvivalLog:
    """Telemetery for AI pilot survival"""
    waypoints_reached: int = 0
    avoidance_maneuvers: int = 0
    closest_call_distance: float = 1000.0
    total_survival_time: float = 0.0
    asteroids_destroyed: int = 0
    scrap_collected: int = 0
    last_maneuver_time: float = -1.0

class AsteroidPilot(BaseController):
    """
    AI Pilot for autonomous asteroid navigation and collection
    Restored from legacy archive for Three-Tier Architecture
    """
    
    def __init__(self, controller_id: str = "AI_PILOT", use_neural_network: bool = False, 
                 neural_network: Optional[NeuralNetwork] = None):
        super().__init__(controller_id)
        self.pilot_id = controller_id
        self.state = PilotState.SCANNING
        self.position = Vector2(SOVEREIGN_WIDTH / 2, SOVEREIGN_HEIGHT / 2)
        self.velocity = Vector2(0, 0)
        self.angle = 0.0
        
        # AI Components
        self.config = SteeringConfig()
        self.log = SurvivalLog()
        
        # Steering state
        self._current_waypoint = None
        self.steering = Vector2(0, 0)
        
        # Performance metrics (legacy compatibility)
        self.survival_time = 0.0
        self.asteroids_collected = 0
        self.scrap_collected = 0
        self.threats_evaded = 0
        
        # NEAT neural network support
        self.use_neural_network = use_neural_network
        self.neural_network = neural_network
        
        # Mental vector for debugging
        self.mental_vector = {'x': 0.0, 'y': 0.0, 'target': None, 'type': None}
        
        # Active learning components
        self.short_term_memory = create_short_term_memory()
        self.is_blackout = False
        self.blackout_end_time = 0.0
        self.collision_penalty_applied = False
        
        # Safe respawn system
        self.safe_respawn_position = None
        self.ghost_phase_end_time = 0.0
        self.is_ghost_phase = False
        
        # Adaptive bias from learning
        self.adaptive_bias = {'thrust': 0.0, 'rotation': 0.0, 'fire_weapon': 0.0}
        
        # Knowledge library integration
        self.knowledge_library = create_knowledge_library()
        self.use_shared_knowledge = True
        self.last_technique_query_time = 0.0
        self.technique_query_interval = 0.5  # Query library every 0.5 seconds
        
        if self.use_neural_network and self.neural_network:
            logger.info(f"🧠 AI Pilot initialized with neural network: {controller_id}")
        else:
            logger.info(f"🤖 AI Pilot initialized (rule-based): {controller_id}")
    
    def update(self, dt: float, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> Result[ControlInput]:
        """Update AI pilot decision making with active learning and safe respawn"""
        try:
            # Update internal state
            self.position = Vector2(entity_state.get('x', 0), entity_state.get('y', 0))
            self.velocity = Vector2(entity_state.get('vx', 0), entity_state.get('vy', 0))
            self.angle = entity_state.get('angle', 0)
            self.survival_time += dt
            
            # Update blackout state
            if self.is_blackout and self.survival_time >= self.blackout_end_time:
                self.is_blackout = False
                self.is_ghost_phase = True
                self.ghost_phase_end_time = self.survival_time + 1.0  # 1 second ghost phase
                logger.debug(f"� AI Pilot {self.pilot_id} entered ghost phase")
            
            # Update ghost phase state
            if self.is_ghost_phase and self.survival_time >= self.ghost_phase_end_time:
                self.is_ghost_phase = False
                logger.debug(f"🔆 AI Pilot {self.pilot_id} ghost phase ended")
            
            # Reset controls
            self.thrust = 0.0
            self.rotation = 0.0
            self.fire_weapon = False
            
            # Skip control during blackout
            if self.is_blackout:
                control_input = ControlInput(
                    thrust=0.0,
                    rotation=0.0,
                    fire_weapon=False,
                    special_action=None
                )
                return Result(success=True, value=control_input)
            
            # Choose control method
            if self.use_neural_network and self.neural_network:
                self._neural_network_control(entity_state, world_data)
            else:
                self._rule_based_control(world_data)
            
            # Apply adaptive bias from learning
            self._apply_adaptive_bias()
            
            # Apply shared knowledge bias
            if self.use_shared_knowledge:
                self._apply_shared_knowledge_bias(entity_state, world_data)
            
            # Update short-term memory
            self._update_memory(dt, entity_state, world_data)
            
            # Add experience to knowledge library
            if self.use_neural_network:
                self._add_experience_to_library(entity_state, world_data)
            
            # Calculate "Aggressor Drive" fitness bonus
            if self.use_neural_network:
                self._calculate_aggressor_drive(world_data)
            
            # Create control input
            control_input = ControlInput(
                thrust=self.thrust,
                rotation=self.rotation,
                fire_weapon=self.fire_weapon,
                special_action=None
            )
            
            return Result(success=True, value=control_input)
            
        except Exception as e:
            return Result(success=False, error=f"AI Pilot update failed: {e}")
            
    def compute_steering(self, ship, obstacles, world_size) -> Vector2:
        """Compute steering vector (for test compliance)"""
        # Pick new waypoint if reached
        if not self._current_waypoint or ship.position.distance_to(self._current_waypoint) < 5.0:
            if self._current_waypoint:
                self.log.waypoints_reached += 1
            self._current_waypoint = Vector2(random.uniform(0, world_size[0]), random.uniform(0, world_size[1]))
            
        # Simple seek to waypoint
        dx = self._current_waypoint.x - ship.position.x
        dy = self._current_waypoint.y - ship.position.y
        steering = Vector2(dx, dy).normalize()
        
        # Simple avoidance
        avoidance_triggered = False
        for obstacle in obstacles:
            # Handle both direct position and kinetics.position
            if hasattr(obstacle, 'position'):
                o_pos = obstacle.position
            elif hasattr(obstacle, 'kinetics') and hasattr(obstacle.kinetics, 'position'):
                o_pos = obstacle.kinetics.position
            else:
                continue
                
            ox, oy = o_pos.x, o_pos.y
            dist = ship.position.distance_to(o_pos)
            if dist < 30.0:
                avoid = Vector2(ship.position.x - ox, ship.position.y - oy).normalize()
                steering.x += avoid.x * 2.0
                steering.y += avoid.y * 2.0
                avoidance_triggered = True
                
                # Update closest call distance
                if dist < self.log.closest_call_distance:
                    self.log.closest_call_distance = dist
        
        if avoidance_triggered:
            # Check cooldown
            if self.survival_time - self.log.last_maneuver_time >= self.config.maneuver_cooldown:
                self.log.avoidance_maneuvers += 1
                self.log.last_maneuver_time = self.survival_time
        
        self.steering = steering.normalize()
        return self.steering
        
    @staticmethod
    def apply_to_ship(steering_vector, ship, dt):
        """Apply steering to ship (static method for test compliance)"""
        if not steering_vector or (steering_vector.x == 0 and steering_vector.y == 0):
            if hasattr(ship, 'acceleration'):
                ship.acceleration = Vector2(0, 0)
            return
            
        # Rotate ship toward steering vector
        target_angle = math.atan2(steering_vector.y, steering_vector.x)
        # Wrap to [0, 2pi] for test 4.71 match
        if target_angle < 0:
            target_angle += 2 * math.pi
        ship.heading = target_angle
        
        # Apply thrust and acceleration
        force_x = steering_vector.x * 100.0
        force_y = steering_vector.y * 100.0
        
        if hasattr(ship, 'acceleration'):
            ship.acceleration = Vector2(force_x, force_y)
            
        ship.velocity.x += force_x * dt
        ship.velocity.y += force_y * dt
    
    def _apply_adaptive_bias(self) -> None:
        """Apply adaptive bias from short-term learning"""
        if self.use_neural_network:
            # Get adaptive bias based on recent experiences
            current_threat_distance = self._get_nearest_threat_distance()
            
            bias = self.short_term_memory.get_adaptive_bias(
                (self.velocity.x, self.velocity.y),
                current_threat_distance
            )
            
            # Apply bias to controls
            self.thrust += bias['thrust']
            self.rotation += bias['rotation']
            
            # Clamp to valid ranges
            self.thrust = max(-1.0, min(1.0, self.thrust))
            self.rotation = max(-2.0, min(2.0, self.rotation))
    
    def _apply_shared_knowledge_bias(self, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> None:
        """Apply bias from shared knowledge library"""
        if not self.use_neural_network or not self.use_shared_knowledge:
            return
        
        # Query knowledge library periodically
        current_time = self.survival_time
        if current_time - self.last_technique_query_time < self.technique_query_interval:
            return
        
        self.last_technique_query_time = current_time
        
        # Get current neural inputs
        asteroids = world_data.get('asteroids', [])
        scrap_entities = world_data.get('scrap', [])
        
        # Prepare inputs for library query
        current_inputs = self._prepare_neural_inputs(entity_state, asteroids, scrap_entities)
        
        # Get matching technique from library
        technique = self.knowledge_library.get_technique_for_situation(current_inputs)
        
        if technique:
            # Apply technique bias to controls
            bias = self._technique_to_bias(technique)
            
            # Blend bias with current controls
            blend_factor = 0.3  # 30% influence from shared knowledge
            
            try:
                new_thrust = self.thrust * (1 - blend_factor) + bias['thrust'] * blend_factor
                new_rotation = self.rotation * (1 - blend_factor) + bias['rotation'] * blend_factor
                
                # Check for NaN or Infinite values
                if not math.isfinite(new_thrust) or not math.isfinite(new_rotation):
                     logger.warning(f"⚠️ Invalid control bias from technique {technique.name}: thrust={new_thrust}, rotation={new_rotation}")
                else:
                    self.thrust = new_thrust
                    self.rotation = new_rotation
            except Exception as e:
                logger.error(f"Error applying technique bias: {e}")

            # Clamp to valid ranges
            self.thrust = max(-1.0, min(1.0, self.thrust))
            self.rotation = max(-2.0, min(2.0, self.rotation))
            
            # logger.debug(f"📚 Applied shared knowledge bias: {technique.name}")
    
    def _technique_to_bias(self, technique: TechniqueTemplate) -> Dict[str, float]:
        """Convert technique to control bias"""
        bias = {'thrust': 0.0, 'rotation': 0.0, 'fire_weapon': 0.0}
        
        if technique.output_action:
            if 'thrust' in technique.output_action:
                bias['thrust'] = technique.output_action['thrust'].get('avg', 0.0)
            if 'rotation' in technique.output_action:
                bias['rotation'] = technique.output_action['rotation'].get('avg', 0.0)
            if 'fire_weapon' in technique.output_action:
                bias['fire_weapon'] = technique.output_action['fire_weapon'].get('avg', 0.0)
        
        return bias
    
    def _add_experience_to_library(self, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> None:
        """Add current experience to knowledge library for potential extraction"""
        # Get current neural inputs and outputs
        asteroids = world_data.get('asteroids', [])
        scrap_entities = world_data.get('scrap', [])
        
        current_inputs = self._prepare_neural_inputs(entity_state, asteroids, scrap_entities)
        current_outputs = [self.thrust, self.rotation, 1.0 if self.fire_weapon else 0.0]
        
        # Calculate current fitness (simplified)
        current_fitness = self.survival_time + (self.scrap_collected * 25)
        
        # Get current stress level
        current_stress = self.get_stress_level()
        
        # Add to knowledge library
        self.knowledge_library.add_experience_frame(
            timestamp=self.survival_time,
            inputs=current_inputs,
            outputs=current_outputs,
            fitness=current_fitness,
            stress_level=current_stress
        )
    
    def _calculate_aggressor_drive(self, world_data: Dict[str, Any]) -> None:
        """Calculate aggressor drive bonus for facing targets"""
        asteroids = world_data.get('asteroids', [])
        
        if not asteroids:
            return
        
        # Find nearest asteroid
        nearest_asteroid = None
        min_distance = float('inf')
        
        for asteroid in asteroids:
            distance = math.sqrt((self.position.x - asteroid['x'])**2 + 
                               (self.position.y - asteroid['y'])**2)
            if distance < min_distance:
                min_distance = distance
                nearest_asteroid = asteroid
        
        if nearest_asteroid and min_distance < 80.0:  # Within range
            # Calculate angle to asteroid
            dx = nearest_asteroid['x'] - self.position.x
            dy = nearest_asteroid['y'] - self.position.y
            angle_to_asteroid = math.atan2(dy, dx)
            
            # Calculate how well ship is facing the asteroid
            angle_diff = abs(angle_to_asteroid - self.angle)
            
            # Normalize angle difference
            while angle_diff > math.pi:
                angle_diff = abs(angle_diff - 2 * math.pi)
            
            # Bonus for facing target (smaller angle = bigger bonus)
            if angle_diff < math.pi / 4:  # Within 45 degrees
                facing_bonus = (1.0 - angle_diff / (math.pi / 4)) * 0.1
                # This would be added to fitness by the fitness calculator
                self.aggressor_drive_bonus = facing_bonus
            else:
                self.aggressor_drive_bonus = 0.0
        else:
            self.aggressor_drive_bonus = 0.0
    
    def get_aggressor_drive_bonus(self) -> float:
        """Get current aggressor drive bonus"""
        return getattr(self, 'aggressor_drive_bonus', 0.0)
    
    def _get_nearest_threat_distance(self) -> float:
        """Get distance to nearest threat"""
        # This would be populated from world_data in actual implementation
        return float('inf')  # Placeholder
    
    def _update_memory(self, dt: float, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> None:
        """Update short-term memory with current frame"""
        # Get threat distance
        threat_distance = self._get_nearest_threat_distance()
        
        # Get target information
        target_distance = float('inf')
        target_angle = 0.0
        
        if self.target_asteroid:
            dx = self.target_asteroid['x'] - entity_state['x']
            dy = self.target_asteroid['y'] - entity_state['y']
            target_distance = math.sqrt(dx**2 + dy**2)
            target_angle = math.atan2(dy, dx)
        elif self.target_scrap:
            dx = self.target_scrap['x'] - entity_state['x']
            dy = self.target_scrap['y'] - entity_state['y']
            target_distance = math.sqrt(dx**2 + dy**2)
            target_angle = math.atan2(dy, dx)
        
        # Add frame to memory
        self.short_term_memory.add_frame(
            timestamp=self.survival_time,
            ship_velocity=(self.velocity.x, self.velocity.y),
            ship_position=(entity_state['x'], entity_state['y']),
            ship_angle=self.angle,
            target_distance=target_distance,
            target_angle=target_angle,
            control_inputs={
                'thrust': self.thrust,
                'rotation': self.rotation,
                'fire_weapon': self.fire_weapon
            },
            threat_distance=threat_distance
        )
        
        # Decay stress
        self.short_term_memory.decay_stress(dt)
        
        # Clean old frames
        self.short_term_memory.clear_old_frames(self.survival_time)
    
    def trigger_blackout(self, duration: float = 2.0, safe_position: Optional[Tuple[float, float]] = None) -> None:
        """Trigger neural blackout penalty with safe respawn"""
        self.is_blackout = True
        self.blackout_end_time = self.survival_time + duration
        
        # Set safe respawn position if provided
        if safe_position:
            self.safe_respawn_position = safe_position
        
        # Record collision in memory
        self.short_term_memory.record_collision(self.survival_time)
        
        # Apply collision penalty if not already applied
        if not self.collision_penalty_applied:
            self.collision_penalty_applied = True
            # This would be handled by the fitness calculator
        
        logger.info(f"⚫ AI Pilot {self.pilot_id} blackout triggered for {duration}s")
    
    def get_safe_respawn_position(self) -> Optional[Tuple[float, float]]:
        """Get safe respawn position"""
        return self.safe_respawn_position
    
    def is_in_ghost_phase(self) -> bool:
        """Check if pilot is in ghost phase (invulnerable)"""
        return self.is_ghost_phase
    
    def clear_safe_respawn(self) -> None:
        """Clear safe respawn position after use"""
        self.safe_respawn_position = None
    
    def get_stress_level(self) -> float:
        """Get current stress level from short-term memory"""
        return self.short_term_memory.get_stress_level()
    
    def get_memory_summary(self) -> Dict[str, Any]:
        """Get summary of memory state"""
        return self.short_term_memory.get_memory_summary()
    
    def _neural_network_control(self, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> None:
        """Control using neural network"""
        if not self.neural_network:
            return
        
        # Prepare neural network inputs with scrap awareness
        asteroids = world_data.get('asteroids', [])
        scrap_entities = world_data.get('scrap', [])
        
        inputs = self._prepare_neural_inputs(entity_state, asteroids, scrap_entities)
        
        # Forward pass through neural network
        outputs = self.neural_network.forward(inputs)
        
        # Interpret outputs as control actions
        controls = self._interpret_neural_outputs(outputs)
        
        # Apply controls
        self.thrust = controls['thrust']
        self.rotation = controls['rotation']
        self.fire_weapon = controls['fire_weapon']
    
    def _get_toroidal_vector(self, x1, y1, x2, y2) -> Tuple[float, float, float]:
        """Calculate shortest vector from p1 to p2 in a toroidal world"""
        dx = x2 - x1
        dy = y2 - y1
        
        # Wrap DX
        if abs(dx) > SOVEREIGN_WIDTH / 2:
            dx = dx - math.copysign(SOVEREIGN_WIDTH, dx)
            
        # Wrap DY
        if abs(dy) > SOVEREIGN_HEIGHT / 2:
            dy = dy - math.copysign(SOVEREIGN_HEIGHT, dy)
            
        dist = math.sqrt(dx**2 + dy**2)
        return dx, dy, dist

    def _prepare_neural_inputs(self, entity_state: Dict[str, Any], asteroids: List[Dict], 
                             scrap_entities: List[Dict] = None) -> List[float]:
        """Prepare inputs for neural network with toroidal combat awareness"""
        ship_x, ship_y = entity_state['x'], entity_state['y']
        
        # Find nearest asteroid (Toroidal)
        nearest_asteroid = None
        min_asteroid_distance = float('inf')
        best_ast_dx, best_ast_dy = 0.0, 0.0
        
        for asteroid in asteroids:
            dx, dy, dist = self._get_toroidal_vector(ship_x, ship_y, asteroid['x'], asteroid['y'])
            if dist < min_asteroid_distance:
                min_asteroid_distance = dist
                nearest_asteroid = asteroid
                best_ast_dx, best_ast_dy = dx, dy
        
        # Find nearest scrap (Toroidal)
        nearest_scrap = None
        min_scrap_distance = float('inf')
        best_scrap_dx, best_scrap_dy = 0.0, 0.0
        
        if scrap_entities:
            for scrap in scrap_entities:
                dx, dy, dist = self._get_toroidal_vector(ship_x, ship_y, scrap['x'], scrap['y'])
                if dist < min_scrap_distance:
                    min_scrap_distance = dist
                    nearest_scrap = scrap
                    best_scrap_dx, best_scrap_dy = dx, dy
        
        # Relative Angle to Asteroid
        asteroid_in_crosshair = 0.0
        angle_to_asteroid_normalized = 0.0
        
        if nearest_asteroid:
            angle_to_asteroid = math.atan2(best_ast_dy, best_ast_dx)
            
            ship_heading = entity_state.get('angle', 0)
            angle_diff = angle_to_asteroid - ship_heading
            
            # Normalize to [-π, π]
            while angle_diff > math.pi: angle_diff -= 2 * math.pi
            while angle_diff < -math.pi: angle_diff += 2 * math.pi
                
            angle_to_asteroid_normalized = angle_diff / math.pi
            
            if abs(angle_diff) < math.pi / 4 and min_asteroid_distance < 60.0:
                asteroid_in_crosshair = 1.0

        # Relative Angle to Scrap
        angle_to_scrap_normalized = 0.0
        if nearest_scrap:
            angle_to_scrap = math.atan2(best_scrap_dy, best_scrap_dx)
            
            ship_heading = entity_state.get('angle', 0)
            angle_diff = angle_to_scrap - ship_heading
            
            while angle_diff > math.pi: angle_diff -= 2 * math.pi
            while angle_diff < -math.pi: angle_diff += 2 * math.pi
                
            angle_to_scrap_normalized = angle_diff / math.pi
            
        # Neural Inputs:
        # 1. 1.0 (Bias)
        # 2. Normalized distance to nearest asteroid (0-1)
        # 3. Normalized angle to nearest asteroid (-1 to 1)
        # 4. Asteroid in crosshair (0 or 1)
        # 5. Normalized distance to nearest scrap (0-1)
        # 6. Normalized angle to nearest scrap (-1 to 1)
        # 7. Ship linear velocity magnitude (normalized)
        # 8. Ship angular velocity (normalized)
        
        # Normalize distance (assuming max view distance ~400)
        norm_ast_dist = min(min_asteroid_distance / 400.0, 1.0)
        norm_scrap_dist = min(min_scrap_distance / 400.0, 1.0)
        
        speed = math.sqrt(entity_state.get('vx', 0)**2 + entity_state.get('vy', 0)**2) / 100.0
        ang_vel = entity_state.get('va', 0) / 5.0
        
        # Update mental vector for debugging
        if nearest_asteroid and (min_asteroid_distance < min_scrap_distance or not nearest_scrap):
            self.mental_vector = {
                'x': nearest_asteroid['x'] - ship_x,
                'y': nearest_asteroid['y'] - ship_y,
                'target': 'asteroid',
                'type': 'threat'
            }
        elif nearest_scrap:
            self.mental_vector = {
                'x': nearest_scrap['x'] - ship_x,
                'y': nearest_scrap['y'] - ship_y,
                'target': 'scrap',
                'type': 'resource'
            }
        else:
            self.mental_vector = {'x': 0, 'y': 0, 'target': None, 'type': None}
        
        return [
            1.0, 
            norm_ast_dist,
            angle_to_asteroid_normalized,
            asteroid_in_crosshair,
            norm_scrap_dist,
            angle_to_scrap_normalized,
            min(speed, 1.0),
            max(min(ang_vel, 1.0), -1.0)
        ]
    
    def _interpret_neural_outputs(self, outputs: List[float]) -> Dict[str, Any]:
        """Interpret neural network outputs as control inputs"""
        # Output 0: Thrust (-1 to 1)
        thrust = max(-1.0, min(1.0, outputs[0]))
        
        # Output 1: Rotation (-1 to 1, negative = left, positive = right)
        rotation = max(-1.0, min(1.0, outputs[1]))
        
        # Output 2: Fire weapon (0 to 1, threshold at 0.5)
        fire_weapon = outputs[2] > 0.5
        
        return {
            'thrust': thrust,
            'rotation': rotation,
            'fire_weapon': fire_weapon
        }
    
    def _rule_based_control(self, world_data: Dict[str, Any]) -> None:
        """Control using rule-based logic (original implementation)"""
        asteroids = world_data.get('asteroids', [])
        
        # AI decision making
        self._make_decisions(asteroids)
    
    def activate(self) -> Result[bool]:
        """Activate the AI controller"""
        try:
            self.is_active = True
            logger.info(f"🤖 AI Controller {self.pilot_id} activated")
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to activate AI controller: {e}")
    
    def deactivate(self) -> Result[bool]:
        """Deactivate the AI controller"""
        try:
            self.is_active = False
            logger.info(f"🤖 AI Controller {self.pilot_id} deactivated")
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to deactivate AI controller: {e}")
    
    def _make_decisions(self, asteroids: List[Dict]) -> None:
        """Core AI decision making logic"""
        # Scan for asteroids and threats
        self._scan_environment(asteroids)
        
        # State-based decision making
        if self.state == PilotState.SCANNING:
            self._handle_scanning()
        elif self.state == PilotState.APPROACHING:
            self._handle_approaching()
        elif self.state == PilotState.EVADE:
            self._handle_evade()
        elif self.state == PilotState.COLLECTING:
            self._handle_collecting()
        elif self.state == PilotState.SURVIVING:
            self._handle_survival()
    
    def _scan_environment(self, asteroids: List[Dict]) -> None:
        """Scan for asteroids and classify threats"""
        self.target_asteroid = None
        self.threats = []
        
        nearby_asteroids = []
        
        for asteroid in asteroids:
            asteroid_pos = Vector2(asteroid['x'], asteroid['y'])
            distance = self.position.distance_to(asteroid_pos)
            
            if distance < self.scan_radius:
                nearby_asteroids.append({
                    'asteroid': asteroid,
                    'distance': distance,
                    'position': asteroid_pos
                })
                
                # Check if it's a threat (too close or too large)
                if distance < self.evade_distance or asteroid.get('size', 1) > 2:
                    self.threats.append({
                        'asteroid': asteroid,
                        'distance': distance,
                        'position': asteroid_pos,
                        'threat_level': self._calculate_threat_level(asteroid, distance)
                    })
        
        # Select target asteroid (closest non-threat)
        non_threats = [a for a in nearby_asteroids if a not in [t['asteroid'] for t in self.threats]]
        if non_threats:
            non_threats.sort(key=lambda a: a['distance'])
            self.target_asteroid = non_threats[0]['asteroid']
        
        # Sort threats by danger level
        self.threats.sort(key=lambda t: t['threat_level'], reverse=True)
    
    def _calculate_threat_level(self, asteroid: Dict, distance: float) -> float:
        """Calculate threat level of an asteroid"""
        size = asteroid.get('size', 1)
        speed = math.sqrt(asteroid.get('vx', 0) ** 2 + asteroid.get('vy', 0) ** 2)
        
        # Threat increases with size and speed, decreases with distance
        threat = (size * speed) / max(distance, 1.0)
        return threat
    
    def _handle_scanning(self) -> None:
        """Handle scanning state"""
        if self.threats:
            # Immediate threat evasion
            self.state = PilotState.EVADE
        elif self.target_asteroid:
            # Found target, approach it
            self.state = PilotState.APPROACHING
        else:
            # No targets, search pattern
            self._execute_search_pattern()
    
    def _handle_approaching(self) -> None:
        """Handle approaching state"""
        if not self.target_asteroid:
            self.state = PilotState.SCANNING
            return
        
        if self.threats:
            # Threat detected, prioritize evasion
            self.state = PilotState.EVADE
            return
        
        target_pos = Vector2(self.target_asteroid['x'], self.target_asteroid['y'])
        distance = self.position.distance_to(target_pos)
        
        if distance < self.collect_distance:
            # Close enough to collect
            self.state = PilotState.COLLECTING
        else:
            # Move towards target
            self._navigate_to_target(target_pos)
    
    def _handle_evade(self) -> None:
        """Handle evasion state"""
        if not self.threats:
            # No more threats, return to scanning
            self.state = PilotState.SCANNING
            return
        
        # Evade highest priority threat
        threat = self.threats[0]
        threat_pos = threat['position']
        
        # Calculate evasion vector (away from threat)
        evade_vector = Vector2(
            self.position.x - threat_pos.x,
            self.position.y - threat_pos.y
        ).normalize()
        
        # Apply thrust in evasion direction
        self.thrust = 1.0
        
        # Rotate to face evasion direction
        target_angle = math.atan2(evade_vector.y, evade_vector.x)
        self._rotate_to_angle(target_angle)
        
        # Check if evaded
        if self.position.distance_to(threat_pos) > self.evade_distance * 1.5:
            self.threats_evaded += 1
            self.threats.pop(0)
    
    def _handle_collecting(self) -> None:
        """Handle collecting state"""
        if not self.target_asteroid:
            self.state = PilotState.SCANNING
            return
        
        target_pos = Vector2(self.target_asteroid['x'], self.target_asteroid['y'])
        distance = self.position.distance_to(target_pos)
        
        if distance < self.collect_distance:
            # Collect the asteroid
            self.asteroids_collected += 1
            self.target_asteroid = None
            self.state = PilotState.SCANNING
            logger.info(f"🤖 AI Pilot collected asteroid! Total: {self.asteroids_collected}")
        else:
            # Move closer
            self._navigate_to_target(target_pos)
    
    def _handle_survival(self) -> None:
        """Handle survival state (low health/emergency)"""
        # Conservative behavior - focus on evasion
        if self.threats:
            self._handle_evade()
        else:
            # Move to safe corner
            safe_corner = Vector2(20, 20)  # Top-left corner
            self._navigate_to_target(safe_corner)
    
    def _navigate_to_target(self, target_pos: Vector2) -> None:
        """Navigate towards a target position"""
        # Calculate direction to target
        direction = Vector2(
            target_pos.x - self.position.x,
            target_pos.y - self.position.y
        ).normalize()
        
        # Apply thrust
        self.thrust = 0.8  # Moderate thrust for precision
        
        # Rotate to face target
        target_angle = math.atan2(direction.y, direction.x)
        self._rotate_to_angle(target_angle)
    
    def _rotate_to_angle(self, target_angle: float) -> None:
        """Rotate towards target angle"""
        # Normalize angles
        current_angle = self.angle % (2 * math.pi)
        target_angle = target_angle % (2 * math.pi)
        
        # Calculate shortest rotation direction
        angle_diff = target_angle - current_angle
        
        # Handle wrap-around
        if angle_diff > math.pi:
            angle_diff -= 2 * math.pi
        elif angle_diff < -math.pi:
            angle_diff += 2 * math.pi
        
        # Apply rotation based on angle difference
        rotation_speed = 2.0  # radians per second
        if abs(angle_diff) > 0.1:
            self.rotation = rotation_speed if angle_diff > 0 else -rotation_speed
        else:
            self.rotation = 0.0
    
    def _execute_search_pattern(self) -> None:
        """Execute search pattern when no targets"""
        # Spiral search pattern
        search_time = self.survival_time % 10.0  # 10-second pattern
        search_radius = 30.0
        
        # Calculate spiral position
        angle = search_time * 0.5  # Slow rotation
        radius = search_radius * (search_time / 10.0)  # Expanding radius
        
        target_x = SOVEREIGN_WIDTH / 2 + radius * math.cos(angle)
        target_y = SOVEREIGN_HEIGHT / 2 + radius * math.sin(angle)
        
        target_pos = Vector2(target_x, target_y)
        self._navigate_to_target(target_pos)
    
    def get_status(self) -> Dict[str, Any]:
        """Get pilot status and metrics"""
        return {
            'pilot_id': self.pilot_id,
            'state': self.state.value,
            'position': {'x': self.position.x, 'y': self.position.y},
            'survival_time': self.survival_time,
            'asteroids_collected': self.asteroids_collected,
            'scrap_collected': self.scrap_collected,
            'threats_evaded': self.threats_evaded,
            'current_target': self.target_asteroid['id'] if self.target_asteroid else None,
            'active_threats': len(self.threats),
            'use_neural_network': self.use_neural_network,
            'neural_network_active': self.neural_network is not None,
            'mental_vector': self.mental_vector
        }
    
    def get_mental_vector(self) -> Dict[str, Any]:
        """Get the AI's current mental vector for debugging"""
        return self.mental_vector.copy()
    
    def set_neural_network(self, network: NeuralNetwork) -> None:
        """Set or update the neural network"""
        self.neural_network = network
        self.use_neural_network = True
        logger.info(f"🧠 Neural network updated for AI Pilot {self.pilot_id}")


class HumanController(BaseController):
    """
    Human controller for keyboard/miyoo input
    Complements the AI Controller for dual-track gameplay
    """
    
    def __init__(self, controller_id: str = "HUMAN_PLAYER"):
        super().__init__(controller_id)
        self.thrust = 0.0
        self.rotation = 0.0
        self.fire_weapon = False
        
        # Input state
        self.keys_pressed = set()
        
        logger.info(f"👤 HumanController initialized: {controller_id}")
    
    def update(self, dt: float, entity_state: Dict[str, Any], world_data: Dict[str, Any]) -> Result[ControlInput]:
        """Update human controller based on input"""
        # This would be connected to actual input system
        # For now, return neutral controls
        control_input = ControlInput(
            thrust=self.thrust,
            rotation=self.rotation,
            fire_weapon=self.fire_weapon
        )
        return Result(success=True, value=control_input)
    
    def activate(self) -> Result[bool]:
        """Activate the human controller"""
        try:
            self.is_active = True
            logger.info(f"👤 Human Controller {self.controller_id} activated")
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to activate human controller: {e}")
    
    def deactivate(self) -> Result[bool]:
        """Deactivate the human controller"""
        try:
            self.is_active = False
            logger.info(f"👤 Human Controller {self.controller_id} deactivated")
            return Result(success=True, value=True)
        except Exception as e:
            return Result(success=False, error=f"Failed to deactivate human controller: {e}")
    
    def handle_key_press(self, key: str) -> None:
        """Handle key press events"""
        self.keys_pressed.add(key)
        self._update_controls_from_keys()
    
    def handle_key_release(self, key: str) -> None:
        """Handle key release events"""
        self.keys_pressed.discard(key)
        self._update_controls_from_keys()
    
    def _update_controls_from_keys(self) -> None:
        """Update controls based on current key state"""
        self.thrust = 0.0
        self.rotation = 0.0
        self.fire_weapon = False
        
        if 'w' in self.keys_pressed or 'up' in self.keys_pressed:
            self.thrust = 1.0
        if 'a' in self.keys_pressed or 'left' in self.keys_pressed:
            self.rotation = -2.0
        if 'd' in self.keys_pressed or 'right' in self.keys_pressed:
            self.rotation = 2.0
        if ' ' in self.keys_pressed or 'enter' in self.keys_pressed:
            self.fire_weapon = True


def create_ai_controller(controller_id: str = "AI_PILOT", use_neural_network: bool = False,
                       neural_network: Optional[NeuralNetwork] = None) -> AsteroidPilot:
    """Factory function to create AI controller"""
    return AsteroidPilot(controller_id, use_neural_network, neural_network)


def create_human_controller(controller_id: str = "HUMAN_PLAYER") -> HumanController:
    """Factory function to create human controller"""
    return HumanController(controller_id)
