"""
DGT Core State - Game State Components
DGT Kernel Implementation - The Universal Truths

The immutable foundation of the DGT Autonomous Movie System.
All data structures and constants that define the system's behavior.
"""

from .enums import (
    SurfaceState, TileType, BiomeType, InterestType, RenderLayer, 
    AIState, VoyagerState, IntentType, ValidationResult
)
from .constants import (
    VIEWPORT_WIDTH, VIEWPORT_HEIGHT, VIEWPORT_WIDTH_PIXELS, VIEWPORT_HEIGHT_PIXELS,
    TILE_SIZE_PIXELS, VIEWPORT_TILES_X, VIEWPORT_TILES_Y, TILE_SIZE,
    COLOR_PALETTE, RENDER_LAYERS, WORLD_SIZE_X, WORLD_SIZE_Y, CHUNK_SIZE,
    PERMUTATION_TABLE_SIZE, TARGET_FPS, FRAME_DELAY_MS, INTENT_COOLDOWN_MS,
    MOVEMENT_RANGE, PERSISTENCE_INTERVAL_TURNS, PERSISTENCE_FORMAT,
    PERSISTENCE_COMPRESSION, BACKUP_INTERVAL_TURNS, MAX_BACKUP_FILES,
    DIRECTION_VECTORS
)
from .models import (
    Tile, TileData, InterestPoint, Chunk, WorldDelta, Entity, GameState,
    ShipGenome, PerformanceMetrics
)
from .effects import Effect, Trigger, SubtitleEvent
from .intents import (
    MovementIntent, InteractionIntent, CombatIntent, PonderIntent, 
    IntentValidation, Command, CommandResult
)
from .exceptions import (
    SystemError, WorldGenerationError, ValidationError, PersistenceError, LLMError
)
from .validation import (
    validate_position, validate_tile_type, validate_intent
)

import time

def create_initial_game_state(seed: str = "SEED_ZERO") -> GameState:
    """Create initial game state with proper defaults"""
    return GameState(
        world_seed=seed,
        timestamp=time.time(),
        voyager_state=AIState.STATE_IDLE
    )

__all__ = [
    # Enums
    "TileType", "BiomeType", "InterestType", "VoyagerState", "AIState",
    "IntentType", "ValidationResult", "RenderLayer", "SurfaceState",
    
    # Constants
    "VIEWPORT_WIDTH", "VIEWPORT_HEIGHT", "TILE_SIZE",
    "WORLD_SIZE_X", "WORLD_SIZE_Y", "CHUNK_SIZE",
    "TARGET_FPS", "FRAME_DELAY_MS", "MOVEMENT_RANGE",
    "COLOR_PALETTE", "RENDER_LAYERS", "TILE_SIZE_PIXELS",
    "VIEWPORT_WIDTH_PIXELS", "VIEWPORT_HEIGHT_PIXELS", "VIEWPORT_TILES_X", "VIEWPORT_TILES_Y",
    
    # Data Classes
    "TileData", "InterestPoint", "WorldDelta", "GameState",
    "MovementIntent", "InteractionIntent", "PonderIntent",
    "IntentValidation", "Command", "CommandResult",
    "Effect", "Trigger", "SubtitleEvent", "PerformanceMetrics", "Entity", "Tile",
    "ShipGenome",
    
    # Exceptions
    "SystemError", "WorldGenerationError", "ValidationError", 
    "PersistenceError", "LLMError",
    
    # Utilities
    "validate_position", "validate_tile_type", "validate_intent",
    "create_initial_game_state", "DIRECTION_VECTORS"
]
