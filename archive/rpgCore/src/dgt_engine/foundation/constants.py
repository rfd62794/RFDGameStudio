"""
DGT Platform - Foundation Constants

Sanctuary Constants - Single Source of Truth for all system configuration.
Consolidated from kernel.constants and core.constants shims.

This file replaces all shims and provides the authoritative constants
for the entire DGT Platform.
"""

from typing import Dict, Any

# === SOVEREIGN RENDERING CONSTRAINTS (ADR 192) ===
SOVEREIGN_WIDTH = 160
SOVEREIGN_HEIGHT = 144
SOVEREIGN_PIXELS = SOVEREIGN_WIDTH * SOVEREIGN_HEIGHT

# === ADAPTIVE FLIGHT SPACE (ADR 210) ===
ADAPTIVE_WIDTH = 320  # 2x expansion
ADAPTIVE_HEIGHT = 240  # 2x expansion
ADAPTIVE_PIXELS = ADAPTIVE_WIDTH * ADAPTIVE_HEIGHT

# === PERFORMANCE TARGETS ===
TARGET_FPS = 60
FRAME_DELAY_MS = 1000 // TARGET_FPS  # ~16.67ms for 60 FPS

# === BOOT AND TURN-AROUND PERFORMANCE ===
TARGET_BOOT_TIME = 0.005      # 5ms max
TARGET_TURN_AROUND = 0.3      # 300ms max
TARGET_CONSISTENCY = 0.95     # 95% deterministic

# === WORLD GENERATION ===
WORLD_SIZE_X = 100
WORLD_SIZE_Y = 100
CHUNK_SIZE = 10
INTEREST_POINT_SPAWN_CHANCE = 0.1

# === NOISE GENERATION ===
PERMUTATION_TABLE_SIZE = 256
NOISE_SCALE = 0.1
NOISE_OCTAVES = 4
NOISE_PERSISTENCE = 0.5
NOISE_LACUNARITY = 2.0

# === INTEREST POINTS ===
INTEREST_POINT_DENSITY = 0.05
INTEREST_POINT_MIN_DISTANCE = 5
INTEREST_POINT_MAX_PER_CHUNK = 3

# === VIEWPORT ===
VIEWPORT_WIDTH_PIXELS = SOVEREIGN_WIDTH
VIEWPORT_HEIGHT_PIXELS = SOVEREIGN_HEIGHT
TILE_SIZE_PIXELS = 8
VIEWPORT_TILES_X = VIEWPORT_WIDTH_PIXELS // TILE_SIZE_PIXELS
VIEWPORT_TILES_Y = VIEWPORT_HEIGHT_PIXELS // TILE_SIZE_PIXELS

# === RENDER LAYERS ===
RENDER_LAYERS = {
    'background': 0,
    'terrain': 1,
    'entities': 2,
    'effects': 3,
    'ui': 4
}

# === COLOR PALETTE (Game Boy Style) ===
COLOR_PALETTE = {
    'darkest': 0,
    'dark': 1,
    'light': 2,
    'lightest': 3
}

# === PERSISTENCE ===
PERSISTENCE_FORMAT = 'json'
PERSISTENCE_COMPRESSION = True
PERSISTENCE_INTERVAL_TURNS = 10
BACKUP_INTERVAL_TURNS = 50
MAX_BACKUP_FILES = 5
PERSISTENCE_FILE = 'savegame.json'
BACKUP_DIRECTORY = 'backups'
EMERGENCY_SAVE_PREFIX = 'emergency_save'

# === LOGGING ===
LOG_LEVEL_DEFAULT = 'INFO'
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"

# === MIND ENGINE ===
INTENT_COOLDOWN_MS = 1000  # 1 second cooldown between intents

# === VALIDATION ===
class ValidationResult:
    """Validation result for system operations"""
    def __init__(self, success: bool, message: str = "", data: Any = None):
        self.success = success
        self.message = message
        self.data = data

# Debug and development flags
DEBUG_MODE = False
DEBUG_INFINITE_ENERGY = True  # Disable energy constraints for AI training
DEBUG_NO_COLLISION = False
DEBUG_GOD_MODE = False

# === SYSTEM CONFIGURATION ===
class SystemConfig:
    """System-wide configuration"""
    def __init__(self):
        self.width = SOVEREIGN_WIDTH
        self.height = SOVEREIGN_HEIGHT
        self.target_fps = TARGET_FPS
        self.debug = False
        # Debug and development flags
        self.DEBUG_MODE = False
        self.DEBUG_INFINITE_ENERGY = True  # Disable energy constraints for AI training
        self.DEBUG_NO_COLLISION = False
        self.DEBUG_GOD_MODE = False
        
    def validate(self) -> ValidationResult:
        """Validate system configuration"""
        if self.width <= 0 or self.height <= 0:
            return ValidationResult(False, "Invalid dimensions")
        
        if self.target_fps <= 0:
            return ValidationResult(False, "Invalid FPS target")
        
        return ValidationResult(True, "Configuration valid")

# === EXPORT ALL CONSTANTS FOR BACKWARD COMPATIBILITY ===
__all__ = [
    # Sovereign constraints
    'SOVEREIGN_WIDTH', 'SOVEREIGN_HEIGHT', 'SOVEREIGN_PIXELS',
    
    # Performance
    'TARGET_FPS', 'FRAME_DELAY_MS', 'TARGET_BOOT_TIME', 'TARGET_TURN_AROUND',
    'TARGET_CONSISTENCY',
    
    # World generation
    'WORLD_SIZE_X', 'WORLD_SIZE_Y', 'CHUNK_SIZE', 'INTEREST_POINT_SPAWN_CHANCE',
    'PERMUTATION_TABLE_SIZE', 'NOISE_SCALE', 'NOISE_OCTAVES', 'NOISE_PERSISTENCE',
    'NOISE_LACUNARITY', 'INTEREST_POINT_DENSITY', 'INTEREST_POINT_MIN_DISTANCE',
    'INTEREST_POINT_MAX_PER_CHUNK',
    
    # Viewport
    'VIEWPORT_WIDTH_PIXELS', 'VIEWPORT_HEIGHT_PIXELS', 'TILE_SIZE_PIXELS',
    'VIEWPORT_TILES_X', 'VIEWPORT_TILES_Y',
    
    # Rendering
    'RENDER_LAYERS', 'COLOR_PALETTE',
    
    # Persistence
    'PERSISTENCE_FORMAT', 'PERSISTENCE_COMPRESSION', 'PERSISTENCE_INTERVAL_TURNS',
    'BACKUP_INTERVAL_TURNS', 'MAX_BACKUP_FILES', 'PERSISTENCE_FILE',
    'BACKUP_DIRECTORY', 'EMERGENCY_SAVE_PREFIX',
    
    # Logging
    'LOG_LEVEL_DEFAULT', 'LOG_FORMAT',
    
    # Classes
    'ValidationResult', 'SystemConfig'
]
