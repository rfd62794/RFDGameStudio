import time
from dataclasses import dataclass, field
from typing import Tuple, List, Dict, Any, Optional, Union
from .enums import IntentType, ValidationResult
from .models import InterestPoint, GameState, WorldDelta

@dataclass
class MovementIntent:
    """Movement intent for navigation"""
    intent_type: str = IntentType.MOVEMENT.value
    target_position: Tuple[int, int] = (0, 0)
    path: List[Tuple[int, int]] = field(default_factory=list)
    confidence: float = 1.0
    timestamp: float = field(default_factory=time.time)

@dataclass
class InteractionIntent:
    """Interaction intent for entities and objects"""
    intent_type: str = IntentType.INTERACTION.value
    target_entity: str = ""
    interaction_type: str = ""
    target_position: Tuple[int, int] = (0, 0)
    parameters: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

@dataclass
class CombatIntent:
    """Combat intent for engaging hostile entities"""
    intent_type: str = IntentType.COMBAT.value
    target_entity: str = ""
    combat_type: str = "engage"  # engage, flee, negotiate
    target_position: Tuple[int, int] = (0, 0)
    parameters: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)

@dataclass
class PonderIntent:
    """Ponder intent for LLM processing (Deterministic Chaos)"""
    intent_type: str = IntentType.PONDER.value
    interest_point: Optional[InterestPoint] = None
    query_context: str = ""
    timestamp: float = field(default_factory=time.time)

@dataclass
class IntentValidation:
    """Intent validation result"""
    is_valid: bool
    validation_result: ValidationResult
    message: str = ""
    corrected_position: Optional[Tuple[int, int]] = None

@dataclass
class Command:
    """Base command for D&D Engine"""
    command_type: str
    intent: Union[MovementIntent, InteractionIntent, PonderIntent]
    timestamp: float = field(default_factory=time.time)

@dataclass
class CommandResult:
    """Result of command execution"""
    success: bool
    new_state: Optional[GameState] = None
    delta: Optional[WorldDelta] = None
    message: str = ""
    execution_time_ms: float = 0.0
