from enum import Enum

# === TILE SYSTEM CONSTANTS ===

class SurfaceState(Enum):
    """Environmental surface states for BG3-style reactivity"""
    NORMAL = "normal"
    FIRE = "fire"
    ICE = "ice"
    WATER = "water"
    GOO = "goo"
    STEAM = "steam"
    ELECTRIC = "electric"
    POISON = "poison"
    BLESSED = "blessed"
    CURSED = "cursed"
    BURNED = "burned"
    FROZEN = "frozen"
    WET = "wet"


class TileType(Enum):
    """Core tile types for the deterministic world"""
    GRASS = 0
    STONE = 1
    WATER = 2
    FOREST = 3
    MOUNTAIN = 4
    SAND = 5
    SNOW = 6
    DOOR_CLOSED = 7
    DOOR_OPEN = 8
    WALL = 9
    FLOOR = 10

class BiomeType(Enum):
    """World biome types for terrain generation"""
    FOREST = "forest"
    GRASS = "grass"
    TOWN = "town"
    TAVERN = "tavern"
    MOUNTAIN = "mountain"
    DESERT = "desert"
    TUNDRA = "tundra"
    WATER = "water"

class InterestType(Enum):
    """Types of interest points for LLM manifestation"""
    STRUCTURE = "structure"
    NATURAL = "natural"
    MYSTERIOUS = "mysterious"
    RESOURCE = "resource"
    DANGER = "danger"
    STORY = "story"

class RenderLayer(Enum):
    """Rendering layers for composition"""
    BACKGROUND = 0
    TERRAIN = 1
    ENTITIES = 2
    EFFECTS = 3
    UI = 4
    SUBTITLES = 5

class AIState(Enum):
    """AIController operational states (formerly VoyagerState)"""
    STATE_IDLE = "idle"
    STATE_MOVING = "moving"
    STATE_PONDERING = "pondering"  # LLM processing state
    STATE_INTERACTING = "interacting"
    STATE_WAITING = "waiting"

# Alias for backward compatibility
VoyagerState = AIState

class IntentType(Enum):
    """Types of intents for the D&D Engine"""
    MOVEMENT = "movement"
    INTERACTION = "interaction"
    PONDER = "ponder"
    COMBAT = "combat"
    WAIT = "wait"

class ValidationResult(Enum):
    """Validation results for intent processing"""
    VALID = "valid"
    INVALID_POSITION = "invalid_position"
    INVALID_PATH = "invalid_path"
    OBSTRUCTED = "obstructed"
    OUT_OF_RANGE = "out_of_range"
    RULE_VIOLATION = "rule_violation"
    COOLDOWN_ACTIVE = "cooldown_active"
