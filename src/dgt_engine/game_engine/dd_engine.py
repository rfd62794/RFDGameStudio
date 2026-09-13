"""
D&D Engine - The Mind Pillar (Command Pattern Implementation)

Implements deterministic D20 logic and rule enforcement using the Command Pattern.
Every action is a Command that returns a Result and a Delta, ensuring complete
traceability and persistence of all game state changes.

The D&D Engine serves as the Single Source of Truth for all game state.
"""

import time
import asyncio
from typing import Dict, List, Tuple, Optional, Union, Any
from dataclasses import dataclass, field
from enum import Enum
from collections import deque

from loguru import logger

from dgt_engine.systems.kernel.state.models import GameState, WorldDelta
from dgt_engine.systems.kernel.state.enums import IntentType, ValidationResult
from dgt_engine.systems.kernel.state.intents import (
    Command, CommandResult, IntentValidation, MovementIntent, InteractionIntent, PonderIntent
)
from dgt_engine.systems.kernel.state.validation import validate_intent
from dgt_engine.foundation.constants import INTENT_COOLDOWN_MS
from dgt_engine.systems.body.pipeline.asset_loader import AssetLoader
from .combat_resolver import CombatResolver


class CommandStatus(Enum):
    """Command execution status"""
    PENDING = "pending"
    VALIDATING = "validating"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class CommandQueue:
    """Thread-safe command queue for D&D Engine"""
    commands: deque = field(default_factory=deque)
    processing: bool = False
    max_size: int = 100
    
    def enqueue(self, command: Command) -> bool:
        """Add command to queue"""
        if len(self.commands) >= self.max_size:
            logger.warning("🧠 Command queue full, dropping command")
            return False
        
        self.commands.append(command)
        return True
    
    def dequeue(self) -> Optional[Command]:
        """Get next command from queue"""
        return self.commands.popleft() if self.commands else None
    
    def size(self) -> int:
        """Get queue size"""
        return len(self.commands)
    
    def clear(self) -> None:
        """Clear all commands"""
        self.commands.clear()


class DDEngine:
    """Deterministic D20 logic and state management with Command Pattern"""
    
    def __init__(self, config: Optional[MindConfig] = None):
        self.config = config or MindConfig()
        self.seed = self.config.seed if self.config else "MIND_ZERO"
        
        # Core state
        self.state = GameState(
            player_position=(10, 10),
            turn_count=0,
            timestamp=time.time()
        )
        
        # Command processing
        self.command_queue = CommandQueue()
        self.command_history: List[CommandResult] = []
        self._processing_lock = asyncio.Lock()
        
        # Timing
        self.last_intent_time = 0.0
        self.last_turn_time = time.time()
        
        # External dependencies (injected)
        self.world_engine = None
        self.chronos_engine = None
        
        # Object DNA integration
        self.asset_loader = AssetLoader()
        from dgt_engine.systems.body.pipeline.asset_loader import ObjectRegistry
        self.object_registry = ObjectRegistry(self.asset_loader)
        
        # Combat system
        self.combat_resolver = CombatResolver(f"{self.seed}_combat")
        self.in_combat = False
        
        logger.info(f"🧠 D&D Engine initialized with seed: {self.seed}")
        
        # Async processing
        self._processing_lock = asyncio.Lock()
        
        logger.info("🧠 D&D Engine initialized - Command Pattern ready")
    
    # === FACADE INTERFACE ===
    
    async def submit_intent(self, intent: Union[MovementIntent, InteractionIntent, PonderIntent]) -> bool:
        """Submit intent for processing (Facade method)"""
        if not validate_intent(intent):
            raise ValidationError(f"Invalid intent: {intent}")
        
        # Check cooldown
        if not self._check_intent_cooldown():
            logger.debug("🧠 Intent cooldown active")
            return False
        
        # Create command
        command = Command(
            command_type=intent.intent_type,
            intent=intent,
            timestamp=time.time()
        )
        
        # Enqueue command
        success = self.command_queue.enqueue(command)
        
        if success:
            logger.debug(f"🧠 Intent queued: {intent.intent_type}")
            self.last_intent_time = time.time()
        
        return success
    
    async def process_queue(self) -> int:
        """Process all pending commands (Facade method)"""
        processed = 0
        
        async with self._processing_lock:
            while self.command_queue.size() > 0:
                command = self.command_queue.dequeue()
                if command:
                    await self._execute_command(command)
                    processed += 1
        
        return processed
    
    def get_current_state(self) -> GameState:
        """Get current game state (Facade method)"""
        return self.state.copy()
    
    async def apply_world_delta(self, delta: WorldDelta) -> None:
        """Apply world state change (Facade method)"""
        self.state.world_deltas[delta.position] = delta
        
        # Update state based on delta type
        if delta.delta_type == "interest_manifestation":
            # Interest point was manifested by LLM
            logger.debug(f"🧠 Applied interest manifestation at {delta.position}")
        
        self.state.timestamp = time.time()
    
    async def update_voyager_state(self, new_state) -> None:
        """Update Voyager state (Facade method)"""
        # Handle both enum and string values
        if hasattr(new_state, 'value'):
            state_value = new_state.value
        else:
            state_value = str(new_state)
        
        self.state.voyager_state = state_value
        self.state.timestamp = time.time()
    
    async def update_effects(self) -> None:
        """Update and remove expired effects (Facade method)"""
        active_effects = []
        
        for effect in self.state.active_effects:
            if not effect.is_expired():
                active_effects.append(effect)
            else:
                logger.debug(f"🧠 Effect expired: {effect.effect_type}")
        
        self.state.active_effects = active_effects
        self.state.timestamp = time.time()
    
    def get_command_history(self, limit: int = 10) -> List[CommandResult]:
        """Get recent command history (Facade method)"""
        return self.command_history[-limit:]
    
    # === COMMAND EXECUTION ===
    
    async def _execute_command(self, command: Command) -> CommandResult:
        """Execute a single command"""
        start_time = time.time()
        
        try:
            # Validate command
            validation = await self._validate_command(command)
            
            if not validation.is_valid:
                return CommandResult(
                    success=False,
                    message=validation.message,
                    execution_time_ms=(time.time() - start_time) * 1000
                )
            
            # Execute command based on type
            if command.command_type == "movement":
                result = await self._execute_movement_command(command)
            elif command.command_type == "interaction":
                result = await self._execute_interaction_command(command)
            elif command.command_type == "ponder":
                result = await self._execute_ponder_command(command)
            else:
                result = CommandResult(
                    success=False,
                    message=f"Unknown command type: {command.command_type}",
                    execution_time_ms=(time.time() - start_time) * 1000
                )
            
            # Update state metadata
            if result.success:
                self.state.timestamp = time.time()
                self.state.turn_count += 1
                self.last_turn_time = time.time()
            
            # Record in history
            result.execution_time_ms = (time.time() - start_time) * 1000
            self.command_history.append(result)
            
            # Keep history manageable
            if len(self.command_history) > 1000:
                self.command_history = self.command_history[-500:]
            
            return result
            
        except Exception as e:
            logger.error(f"💥 Command execution failed: {e}")
            return CommandResult(
                success=False,
                message=f"Command execution error: {e}",
                execution_time_ms=(time.time() - start_time) * 1000
            )
    
    async def _validate_command(self, command: Command) -> IntentValidation:
        """Validate command intent"""
        intent = command.intent
        
        if intent.intent_type == "movement":
            return self._validate_movement_intent(intent)
        elif intent.intent_type == "interaction":
            return await self._validate_interaction_intent(intent)
        elif intent.intent_type == "ponder":
            return self._validate_ponder_intent(intent)
        else:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message=f"Unknown intent type: {intent.intent_type}"
            )
    
    async def _execute_movement_command(self, command: Command) -> CommandResult:
        """Execute movement command"""
        intent: MovementIntent = command.intent
        
        # Update player position
        old_position = self.state.player_position
        self.state.player_position = intent.target_position
        
        # Create world delta
        delta = WorldDelta(
            position=intent.target_position,
            delta_type="position_change",
            timestamp=time.time(),
            data={
                "entity": "player",
                "from_position": old_position,
                "to_position": intent.target_position,
                "path": intent.path,
                "confidence": intent.confidence
            }
        )
        
        # Apply delta
        self.state.world_deltas[intent.target_position] = delta
        
        # Update Voyager state
        self.state.voyager_state = "moving"
        
        logger.info(f"🧠 Movement executed: {old_position} → {intent.target_position}")
        
        return CommandResult(
            success=True,
            new_state=self.state.copy(),
            message=f"Moved to {intent.target_position}",
            execution_time_ms=0
        )
    
    async def _execute_interaction_command(self, command: Command) -> CommandResult:
        """Execute interaction command using Object DNA D20 system"""
        intent: InteractionIntent = command.intent
        
        # Get target object
        target_object = self.object_registry.get_object_at(intent.target_position)
        
        if not target_object:
            return CommandResult(
                success=False,
                message=f"No object at position {intent.target_position}",
                execution_time_ms=0
            )
        
        char = target_object.characteristics
        
        # Get D20 check data for this interaction
        if not hasattr(char, 'd20_checks') or intent.interaction_type not in char.d20_checks:
            return CommandResult(
                success=False,
                message=f"No D20 check defined for {intent.interaction_type} on {target_object.asset_id}",
                execution_time_ms=0
            )
        
        d20_data = char.d20_checks[intent.interaction_type]
        difficulty = d20_data['difficulty']
        skill = d20_data['skill']
        success_action = d20_data['success']
        
        # Roll D20 with deterministic seed
        import random
        roll_seed = f"{self.seed}_interaction_{self.state.turn_count}_{intent.target_position}_{intent.interaction_type}"
        rng = random.Random(roll_seed)
        d20_roll = rng.randint(1, 20)
        
        # Apply skill bonus (simplified - would use character skill in full implementation)
        skill_bonus = 0  # TODO: Get from character sheet
        
        # Calculate result
        total_roll = d20_roll + skill_bonus
        success = total_roll >= difficulty
        
        # Log the systemic interaction
        logger.info(f"🎲 Voyager encountered [{target_object.asset_id}] at {intent.target_position}. "
                   f"Attempting [{intent.interaction_type}] (DC {difficulty})...")
        logger.info(f"🎯 Roll: {d20_roll} + {skill_bonus} = {total_roll} vs DC {difficulty} -> {'SUCCESS' if success else 'FAILURE'}")
        
        # Create world delta for the interaction result
        if success:
            delta = WorldDelta(
                position=intent.target_position,
                delta_type="object_interaction",
                data={
                    "object_id": target_object.asset_id,
                    "interaction": intent.interaction_type,
                    "result": "success",
                    "action": success_action,
                    "roll": d20_roll,
                    "difficulty": difficulty
                },
                timestamp=time.time()
            )
            
            # Update player position to interaction target if needed
            if intent.target_position != self.state.player_position:
                self.state.player_position = intent.target_position
            
            message = f"✅ Successfully {intent.interaction_type} {target_object.asset_id}! (Roll: {total_roll}/{difficulty})"
        else:
            delta = WorldDelta(
                position=intent.target_position,
                delta_type="object_interaction",
                data={
                    "object_id": target_object.asset_id,
                    "interaction": intent.interaction_type,
                    "result": "failure",
                    "roll": d20_roll,
                    "difficulty": difficulty
                },
                timestamp=time.time()
            )
            
            message = f"❌ Failed to {intent.interaction_type} {target_object.asset_id}! (Roll: {total_roll}/{difficulty})"
        
        # Apply delta to state
        await self.apply_world_delta(delta)
        
        return CommandResult(
            success=success,
            new_state=self.state.copy(),
            message=message,
            execution_time_ms=0
        )
    
    def get_command_history(self, limit: int = 10) -> List[CommandResult]:
        """Get recent command history (Facade method)"""
        return self.command_history[-limit:]
    
    # === COMMAND EXECUTION ===
    
    async def _execute_ponder_command(self, command: Command) -> CommandResult:
        """Execute ponder command (LLM processing)"""
        intent: PonderIntent = command.intent
        
        # Update Voyager state to pondering
        self.state.voyager_state = "pondering"
        
        # Note: Actual LLM processing is handled by Chronicler
        # This command just updates the state
        
        logger.info(f"🧠 Pondering initiated for Interest Point at {intent.interest_point.position}")
        
        return CommandResult(
            success=True,
            new_state=self.state.copy(),
            message="Pondering initiated"
        )
    
    # === VALIDATION METHODS ===
    
    def _validate_movement_intent(self, intent: MovementIntent) -> IntentValidation:
        """Validate movement intent"""
        # Get collision data from World Engine (synchronous fallback)
        if self.world_engine:
            # Use synchronous fallback for validation
            collision_map = [[False for _ in range(50)] for _ in range(50)]
        else:
            # Fallback: assume all positions are valid
            collision_map = [[False for _ in range(50)] for _ in range(50)]
        
        # Check target position validity
        if not self._is_valid_position(intent.target_position, collision_map):
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.INVALID_POSITION,
                message=f"Invalid position: {intent.target_position}"
            )
        
        # Check path validity
        if not self._is_valid_path(intent.path, collision_map):
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.INVALID_PATH,
                message="Path contains invalid positions"
            )
        
        # Check movement range
        distance = len(intent.path) if intent.path else 1
        if distance > MOVEMENT_RANGE_TILES:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.OUT_OF_RANGE,
                message=f"Movement out of range: {distance} > {MOVEMENT_RANGE_TILES}"
            )
        
        return IntentValidation(
            is_valid=True,
            validation_result=ValidationResult.VALID,
            message="Movement validated"
        )
    
    async def _validate_interaction_intent(self, intent: InteractionIntent) -> IntentValidation:
        """Validate interaction intent using Object DNA"""
        # Get object at target position using Object Registry
        target_object = self.object_registry.get_object_at(intent.target_position)
        
        if not target_object:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message=f"No object at position {intent.target_position}"
            )
        
        # Get object characteristics
        if not target_object.characteristics:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message=f"Object {target_object.asset_id} has no interaction characteristics"
            )
        
        char = target_object.characteristics
        
        # Check if interaction type is available in d20_checks
        if not hasattr(char, 'd20_checks') or not char.d20_checks:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message=f"Object {target_object.asset_id} has no D20 interactions defined"
            )
        
        # Check if requested interaction is valid for this object
        if intent.interaction_type not in char.d20_checks:
            available_checks = list(char.d20_checks.keys())
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message=f"Invalid interaction '{intent.interaction_type}' for {target_object.asset_id}. Available: {available_checks}"
            )
        
        # Check range (interaction must be adjacent or at same position)
        player_pos = self.state.player_position
        distance = abs(player_pos[0] - intent.target_position[0]) + abs(player_pos[1] - intent.target_position[1])
        
        if distance > 1:  # Adjacent or same position only
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.OUT_OF_RANGE,
                message=f"Object {target_object.asset_id} out of range (distance: {distance})"
            )
        
        return IntentValidation(
            is_valid=True,
            validation_result=ValidationResult.VALID,
            message=f"Interaction '{intent.interaction_type}' validated for {target_object.asset_id}"
        )
    
    def _validate_ponder_intent(self, intent: PonderIntent) -> IntentValidation:
        """Validate ponder intent"""
        if not intent.interest_point:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message="Ponder intent requires interest point"
            )
        
        if not intent.interest_point.discovered:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message="Cannot ponder undiscovered interest point"
            )
        
        if intent.interest_point.manifestation:
            return IntentValidation(
                is_valid=False,
                validation_result=ValidationResult.RULE_VIOLATION,
                message="Interest point already manifested"
            )
        
        return IntentValidation(
            is_valid=True,
            validation_result=ValidationResult.VALID,
            message="Ponder intent validated"
        )
    
    # === UTILITY METHODS ===
    
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
    
    def _check_intent_cooldown(self) -> bool:
        """Check if intent cooldown has elapsed"""
        current_time = time.time()
        elapsed_ms = (current_time - self.last_intent_time) * 1000
        
        return elapsed_ms >= INTENT_COOLDOWN_MS
    
    async def _get_triggers_at_position(self, position: Tuple[int, int]) -> List[Trigger]:
        """Get interaction triggers at position"""
        triggers = []
        
        # Check for interest point triggers
        if self.world_engine:
            interest_points = await self.world_engine.get_nearby_interest_points(position, 1)
            for ip in interest_points:
                if ip.discovered and not ip.manifestation:
                    trigger = Trigger(
                        position=ip.position,
                        trigger_type="ponder_interest",
                        parameters={"interest_point": ip},
                        active=True
                    )
                    triggers.append(trigger)
        
        return triggers
    
    async def _execute_trigger(self, trigger: Trigger, parameters: Dict[str, Any]) -> None:
        """Execute interaction trigger"""
        logger.debug(f"🧠 Executing trigger: {trigger.trigger_type}")
        
        if trigger.trigger_type == "ponder_interest":
            # This is handled by the Chronicler
            pass
        elif trigger.trigger_type == "environment_change":
            new_environment = parameters.get("new_environment", self.state.current_environment)
            self.state.current_environment = new_environment
        elif trigger.trigger_type == "effect_add":
            effect = Effect(
                effect_type=parameters.get("effect_type", "unknown"),
                duration=parameters.get("duration", 5.0),
                parameters=parameters.get("effect_params", {})
            )
            self.state.active_effects.append(effect)
    
    def _initialize_validation_rules(self) -> Dict[str, Any]:
        """Initialize D&D rule validation parameters"""
        return {
            "max_movement_range": MOVEMENT_RANGE_TILES,
            "interaction_range": 1,
            "intent_cooldown_ms": INTENT_COOLDOWN_MS,
            "persistence_interval_turns": PERSISTENCE_INTERVAL_TURNS
        }
    
    # === DEPENDENCY INJECTION ===
    
    def set_world_engine(self, world_engine) -> None:
        """Inject World Engine dependency"""
        self.world_engine = world_engine
        logger.info("🧠 World Engine dependency injected")
    
    # === DEBUG AND MONITORING ===
    
    def get_engine_stats(self) -> Dict[str, Any]:
        """Get D&D Engine statistics"""
        return {
            "turn_count": self.state.turn_count,
            "queue_size": self.command_queue.size(),
            "command_history_size": len(self.command_history),
            "world_deltas_count": len(self.state.world_deltas),
            "active_effects_count": len(self.state.active_effects),
            "voyager_state": self.state.voyager_state,
            "last_turn_time": self.last_turn_time,
            "last_intent_time": self.last_intent_time
        }
    
    def clear_history(self) -> None:
        """Clear command history"""
        self.command_history.clear()
        logger.info("🧠 Command history cleared")


# === FACTORY ===

class DDEngineFactory:
    """Factory for creating D&D Engine instances"""
    
    @staticmethod
    def create_engine(config=None) -> DDEngine:
        """Create a D&D Engine with configuration"""
        if config:
            return DDEngine(config)
        else:
            return DDEngine()
    
    @staticmethod
    def create_test_engine() -> DDEngine:
        """Create a D&D Engine for testing"""
        engine = DDEngine()
        # Add test-specific configuration
        return engine


# === SYNCHRONOUS WRAPPER ===

class DDEngineSync:
    """Synchronous wrapper for D&D Engine (for compatibility)"""
    
    def __init__(self, dd_engine: DDEngine):
        self.dd_engine = dd_engine
        self._loop = asyncio.new_event_loop()
    
    def submit_intent(self, intent: Union[MovementIntent, InteractionIntent, PonderIntent]) -> bool:
        """Synchronous submit_intent"""
        return self._loop.run_until_complete(
            self.dd_engine.submit_intent(intent)
        )
    
    def process_queue(self) -> int:
        """Synchronous process_queue"""
        return self._loop.run_until_complete(
            self.dd_engine.process_queue()
        )
    
    def get_current_state(self) -> GameState:
        """Synchronous get_current_state"""
        return self.dd_engine.get_current_state()
    
    def apply_world_delta(self, delta: WorldDelta) -> None:
        """Synchronous apply_world_delta"""
        self._loop.run_until_complete(
            self.dd_engine.apply_world_delta(delta)
        )
