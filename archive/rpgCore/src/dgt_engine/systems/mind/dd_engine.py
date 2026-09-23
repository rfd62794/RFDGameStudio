"""
D&D Engine - The Mind Pillar

Deterministic D20 logic, state mutation, and rule enforcement.
Single Source of Truth for all game state.
"""

import time
from dataclasses import dataclass, field
from typing import Tuple, List, Dict, Any, Union, Optional
from enum import Enum

from loguru import logger


class GeneticPilot:
    """Genetic Pilot for ship control - placeholder implementation"""
    
    def __init__(self):
        self.connected = False
        self.physics_body = None
        
    def initialize(self) -> 'Result':
        """Initialize genetic pilot"""
        try:
            self.connected = True
            return Result(success=True, value=None)
        except Exception as e:
            return Result(success=False, error=str(e))
    
    def connect_physics(self, physics_body) -> None:
        """Connect to physics body"""
        self.physics_body = physics_body
        
    def update(self, dt: float) -> 'Result':
        """Update pilot logic"""
        try:
            # Placeholder implementation
            return Result(success=True, value=None)
        except Exception as e:
            return Result(success=False, error=str(e))
    
    def shutdown(self) -> 'Result':
        """Shutdown pilot"""
        try:
            self.connected = False
            return Result(success=True, value=None)
        except Exception as e:
            return Result(success=False, error=str(e))


class Result:
    """Simple Result class for compatibility"""
    def __init__(self, success: bool, value=None, error=None):
        self.success = success
        self.value = value
        self.error = error
    
    @classmethod
    def success_result(cls, value):
        return cls(success=True, value=value)
    
    @classmethod
    def failure_result(cls, error):
        return cls(success=False, error=error)


class IntentType(Enum):
    """Types of intents the D&D Engine can process"""
    MOVEMENT = "movement"
    INTERACTION = "interaction"
    WAIT = "wait"


class ValidationResult(Enum):
    """Validation result for intent processing"""
    VALID = "valid"
    INVALID_POSITION = "invalid_position"
    INVALID_PATH = "invalid_path"
    OBSTRUCTED = "obstructed"
    OUT_OF_RANGE = "out_of_range"
    RULE_VIOLATION = "rule_violation"


@dataclass
class Effect:
    """Active effect in the game world"""
    effect_type: str
    duration: float
    parameters: Dict[str, Any]
    start_time: float = field(default_factory=time.time)
    
    def is_expired(self) -> bool:
        """Check if effect has expired"""
        return time.time() - self.start_time > self.duration


@dataclass
class Trigger:
    """Interaction trigger in the world"""
    position: Tuple[int, int]
    trigger_type: str
    parameters: Dict[str, Any]
    active: bool = True


@dataclass
class GameState:
    """Single Source of Truth for all game state"""
    version: str = "1.0.0"
    timestamp: float = field(default_factory=time.time)
    
    # Entity State
    player_position: Tuple[int, int] = (10, 25)
    player_health: int = 100
    player_status: List[str] = field(default_factory=list)
    
    # World State
    current_environment: str = "forest"
    active_effects: List[Effect] = field(default_factory=list)
    interaction_triggers: List[Trigger] = field(default_factory=list)
    
    # World Deltas (Persistence)
    world_deltas: Dict[Tuple[int, int], Dict[str, Any]] = field(default_factory=dict)
    
    # Session State
    turn_count: int = 0
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    
    def copy(self) -> 'GameState':
        """Create a deep copy of the game state"""
        return GameState(
            version=self.version,
            timestamp=self.timestamp,
            player_position=self.player_position,
            player_health=self.player_health,
            player_status=self.player_status.copy(),
            current_environment=self.current_environment,
            active_effects=self.active_effects.copy(),
            interaction_triggers=[Trigger(t.position, t.trigger_type, t.parameters.copy(), t.active) 
                                 for t in self.interaction_triggers],
            world_deltas={pos: delta.copy() for pos, delta in self.world_deltas.items()},
            turn_count=self.turn_count,
            performance_metrics=self.performance_metrics.copy()
        )


@dataclass
class MovementIntent:
    """AIController's movement request to D&D Engine"""
    intent_type: str = IntentType.MOVEMENT.value
    target_position: Tuple[int, int] = (0, 0)
    path: List[Tuple[int, int]] = field(default_factory=list)
    confidence: float = 1.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class InteractionIntent:
    """AIController's interaction request to D&D Engine"""
    intent_type: str = IntentType.INTERACTION.value
    target_entity: str = ""
    interaction_type: str = ""
    parameters: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


@dataclass
class IntentValidation:
    """Result of intent validation"""
    is_valid: bool
    validation_result: ValidationResult
    message: str = ""
    corrected_position: Optional[Tuple[int, int]] = None


class BinaryROM:
    """Shared data layer for all services"""
    
    def __init__(self, assets_path: str):
        self.assets_path = assets_path
        self.collision_data = {}
        self.tile_banks = {}
        self.interaction_triggers = {}
        self._load_assets()
    
    def _load_assets(self) -> None:
        """Load assets from binary ROM"""
        # Placeholder for asset loading
        # In production, this would load from assets.dgt
        logger.info(f"📦 Loading assets from {self.assets_path}")
        
        # Mock collision data
        self.collision_data = {
            "forest": self._create_mock_collision_map(50, 50),
            "town": self._create_mock_collision_map(50, 50),
            "tavern": self._create_mock_collision_map(50, 50)
        }
        
        # Mock tile banks
        self.tile_banks = {
            "forest": "forest_bank",
            "town": "town_bank", 
            "tavern": "tavern_bank"
        }
        
        # Mock interaction triggers for demo
        self.interaction_triggers = {
            (10, 25): [Trigger((10, 25), "forest_gate", {"new_environment": "town"}, True)],
            (10, 20): [Trigger((10, 20), "town_gate", {"new_environment": "town"}, True)],
            (20, 10): [Trigger((20, 10), "tavern_entrance", {"new_environment": "tavern"}, True)],
            (25, 30): [Trigger((25, 30), "tavern_complete", {"effect_type": "completion", "duration": 5.0}, True)]
        }
        
        logger.info("✅ Assets loaded successfully")
    
    def _create_mock_collision_map(self, width: int, height: int) -> List[List[bool]]:
        """Create mock collision map for testing"""
        return [[False for _ in range(width)] for _ in range(height)]
    
    def get_collision_map(self, environment: str) -> List[List[bool]]:
        """Get collision data for environment"""
        return self.collision_data.get(environment, self._create_mock_collision_map(50, 50))
    
    def get_tile_bank(self, environment: str) -> str:
        """Get tile bank data for environment"""
        return self.tile_banks.get(environment, "forest_bank")
    
    def get_interaction_triggers(self, position: Tuple[int, int]) -> List[Trigger]:
        """Get interaction triggers at position"""
        return self.interaction_triggers.get(position, [])


class DDEngine:
    """Deterministic D20 logic and state management"""
    
    def __init__(self, assets_path: str, world_engine: Optional['WorldEngine'] = None):
        self.state = GameState()
        self.assets = BinaryROM(assets_path)
        self.world_engine = world_engine
        self.validation_rules = self._initialize_validation_rules()
        
        logger.info("🧠 D&D Engine initialized - Single Source of Truth ready")
    
    def process_intent(self, intent: Union[MovementIntent, InteractionIntent]) -> IntentValidation:
        """Process Voyager's intent and return validation result"""
        logger.debug(f"🎯 Processing intent: {intent.intent_type}")
        
        if intent.intent_type == IntentType.MOVEMENT.value:
            return self._validate_movement(intent)
        elif intent.intent_type == IntentType.INTERACTION.value:
            return self._validate_interaction(intent)
        else:
            return IntentValidation(False, ValidationResult.RULE_VIOLATION, "Unknown intent type")
    
    def execute_validated_intent(self, intent: Union[MovementIntent, InteractionIntent]) -> GameState:
        """Execute validated intent and return new state"""
        logger.info(f"⚡ Executing validated intent: {intent.intent_type}")
        
        if intent.intent_type == IntentType.MOVEMENT.value:
            self._execute_movement(intent)
        elif intent.intent_type == IntentType.INTERACTION.value:
            self._execute_interaction(intent)
        
        # Update state metadata
        self.state.timestamp = time.time()
        self.state.turn_count += 1
        
        # Update performance metrics
        self._update_performance_metrics()
        
        logger.debug(f"📊 State updated: Turn {self.state.turn_count}, Position {self.state.player_position}")
        return self.state
    
    def get_current_state(self) -> GameState:
        """Return current game state (Single Source of Truth)"""
        return self.state.copy()
    
    def _validate_movement(self, intent: MovementIntent) -> IntentValidation:
        """Validate movement intent against D&D rules"""
        # Get collision data from World Engine if available
        if self.world_engine:
            collision_map = self.world_engine.get_collision_map()
        else:
            collision_map = self.assets.get_collision_map(self.state.current_environment)
        
        # Check if target position is valid
        if not self._is_valid_position(intent.target_position, collision_map):
            return IntentValidation(False, ValidationResult.INVALID_POSITION, 
                                   f"Invalid position: {intent.target_position}")
        
        # Check if path is valid
        if not self._is_valid_path(intent.path, collision_map):
            return IntentValidation(False, ValidationResult.INVALID_PATH, 
                                   "Path contains invalid positions")
        
        # Check for obstructions
        if self._is_path_obstructed(intent.path):
            return IntentValidation(False, ValidationResult.OBSTRUCTED, 
                                   "Path is obstructed")
        
        # Check movement range (D20 rules)
        distance = len(intent.path)
        max_range = self._calculate_movement_range()
        
        if distance > max_range:
            return IntentValidation(False, ValidationResult.OUT_OF_RANGE, 
                                   f"Movement out of range: {distance} > {max_range}")
        
        return IntentValidation(True, ValidationResult.VALID, "Movement validated")
    
    def _validate_interaction(self, intent: InteractionIntent) -> IntentValidation:
        """Validate interaction intent"""
        # Check if target entity exists at current position
        triggers = self.assets.get_interaction_triggers(self.state.player_position)
        
        if not triggers:
            return IntentValidation(False, ValidationResult.RULE_VIOLATION, 
                                   "No interactable entity at current position")
        
        # Check if interaction type is valid for target
        valid_interactions = [t.trigger_type for t in triggers if t.active]
        
        if intent.interaction_type not in valid_interactions:
            return IntentValidation(False, ValidationResult.RULE_VIOLATION, 
                                   f"Invalid interaction: {intent.interaction_type}")
        
        return IntentValidation(True, ValidationResult.VALID, "Interaction validated")
    
    def _execute_movement(self, intent: MovementIntent) -> None:
        """Execute validated movement"""
        # Update player position
        old_position = self.state.player_position
        self.state.player_position = intent.target_position
        
        # Record world delta if World Engine available
        if self.world_engine:
            self._record_world_delta(old_position, intent.target_position)
        
        # Check for environment changes
        self._check_environment_transition(old_position, intent.target_position)
        
        # Trigger any interactions at new position
        self._trigger_position_interactions(intent.target_position)
        
        # Update active effects
        self._update_effects()
        
        logger.info(f"🚶 Movement executed: {old_position} → {intent.target_position}")
    
    def _record_world_delta(self, old_pos: Tuple[int, int], new_pos: Tuple[int, int]) -> None:
        """Record world state change delta"""
        # Record position change as delta
        self.state.world_deltas[new_pos] = {
            "delta_type": "position_change",
            "timestamp": time.time(),
            "entity": "player",
            "from_position": old_pos,
            "to_position": new_pos
        }
        
        logger.debug(f"🔄 Recorded world delta at {new_pos}")
    
    def get_world_deltas(self) -> Dict[Tuple[int, int], Dict[str, Any]]:
        """Get all world state deltas"""
        return self.state.world_deltas.copy()
    
    def apply_world_delta(self, position: Tuple[int, int], delta_data: Dict[str, Any]) -> None:
        """Apply a world delta to the game state"""
        self.state.world_deltas[position] = delta_data
        logger.debug(f"🔄 Applied world delta at {position}")
    
    def _execute_interaction(self, intent: InteractionIntent) -> None:
        """Execute validated interaction"""
        # Find and execute interaction trigger
        triggers = self.assets.get_interaction_triggers(self.state.player_position)
        
        for trigger in triggers:
            if trigger.trigger_type == intent.interaction_type and trigger.active:
                self._execute_trigger(trigger, intent.parameters)
                break
        
        logger.info(f"🤝 Interaction executed: {intent.interaction_type}")
    
    def _is_valid_position(self, position: Tuple[int, int], collision_map: List[List[bool]]) -> bool:
        """Check if position is valid within collision map"""
        x, y = position
        
        if y < 0 or y >= len(collision_map):
            return False
        if x < 0 or x >= len(collision_map[0]):
            return False
        
        return not collision_map[y][x]  # False = walkable, True = obstacle
    
    def _is_valid_path(self, path: List[Tuple[int, int]], collision_map: List[List[bool]]) -> bool:
        """Check if all positions in path are valid"""
        for position in path:
            if not self._is_valid_position(position, collision_map):
                return False
        return True
    
    def _is_path_obstructed(self, path: List[Tuple[int, int]]) -> bool:
        """Check if path is obstructed by entities"""
        # Placeholder for entity obstruction checking
        return False
    
    def _calculate_movement_range(self) -> int:
        """Calculate maximum movement range based on D20 rules"""
        # Base movement range (increased for demo navigation)
        base_range = 15  # Increased from 6 to accommodate demo paths
        
        # Apply modifiers from active effects
        for effect in self.state.active_effects:
            if "movement_bonus" in effect.parameters:
                base_range += effect.parameters["movement_bonus"]
        
        return base_range
    
    def _check_environment_transition(self, old_pos: Tuple[int, int], new_pos: Tuple[int, int]) -> None:
        """Check and handle environment transitions"""
        # Placeholder for environment transition logic
        # Could check if new position is in different environment
        pass
    
    def _trigger_position_interactions(self, position: Tuple[int, int]) -> None:
        """Trigger interactions at new position"""
        triggers = self.assets.get_interaction_triggers(position)
        
        for trigger in triggers:
            if trigger.active and trigger.trigger_type == "auto_trigger":
                self._execute_trigger(trigger, {})
    
    def _execute_trigger(self, trigger: Trigger, parameters: Dict[str, Any]) -> None:
        """Execute interaction trigger"""
        logger.debug(f"🎯 Executing trigger: {trigger.trigger_type}")
        
        # Handle different trigger types
        if trigger.trigger_type == "environment_change":
            self.state.current_environment = parameters.get("new_environment", self.state.current_environment)
        
        elif trigger.trigger_type == "effect_add":
            effect = Effect(
                effect_type=parameters.get("effect_type", "unknown"),
                duration=parameters.get("duration", 5.0),
                parameters=parameters.get("effect_params", {})
            )
            self.state.active_effects.append(effect)
        
        # Add more trigger types as needed
    
    def _update_effects(self) -> None:
        """Update and remove expired effects"""
        active_effects = []
        
        for effect in self.state.active_effects:
            if not effect.is_expired():
                active_effects.append(effect)
            else:
                logger.debug(f"⏰ Effect expired: {effect.effect_type}")
        
        self.state.active_effects = active_effects
    
    def _update_performance_metrics(self) -> None:
        """Update performance metrics"""
        self.state.performance_metrics["last_turn_time"] = time.time()
        self.state.performance_metrics["average_turn_time"] = (
            self.state.performance_metrics.get("average_turn_time", 0) * (self.state.turn_count - 1) + 
            0.016  # Assuming 60 FPS target
        ) / self.state.turn_count
    
    def _initialize_validation_rules(self) -> Dict[str, Any]:
        """Initialize D&D rule validation parameters"""
        return {
            "max_movement_range": 15,  # Increased for demo navigation
            "interaction_range": 1,
            "effect_duration_default": 5.0
        }


# Factory for creating D&D Engine instances
class DDEngineFactory:
    """Factory for creating D&D Engine instances"""
    
    @staticmethod
    def create_engine(assets_path: str = "assets/", world_engine: Optional['WorldEngine'] = None) -> DDEngine:
        """Create a D&D Engine with default configuration"""
        return DDEngine(assets_path, world_engine)
    
    @staticmethod
    def create_test_engine(world_engine: Optional['WorldEngine'] = None) -> DDEngine:
        """Create a D&D Engine for testing"""
        return DDEngine("test_assets/", world_engine)
