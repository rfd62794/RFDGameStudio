from typing import Tuple, Union
from .constants import WORLD_SIZE_X, WORLD_SIZE_Y
from .enums import TileType
from .intents import MovementIntent, InteractionIntent, PonderIntent

def validate_position(position: Tuple[int, int]) -> bool:
    """Validate world position"""
    x, y = position
    return 0 <= x < WORLD_SIZE_X and 0 <= y < WORLD_SIZE_Y

def validate_tile_type(tile_type: TileType) -> bool:
    """Validate tile type"""
    return isinstance(tile_type, TileType)

def validate_intent(intent: Union[MovementIntent, InteractionIntent, PonderIntent]) -> bool:
    """Validate intent structure"""
    required_fields = {
        MovementIntent: ["intent_type", "target_position"],
        InteractionIntent: ["intent_type", "target_entity"],
        PonderIntent: ["intent_type", "interest_point"]
    }
    
    intent_class = type(intent)
    if intent_class not in required_fields:
        return False
    
    for field_name in required_fields[intent_class]:
        if not hasattr(intent, field_name):
            return False
    
    return True
