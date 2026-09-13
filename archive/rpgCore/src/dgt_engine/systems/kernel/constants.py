"""
Core Constants - System Configuration and Magic Numbers
DGT Kernel Implementation - The Universal Truths

All system constants, configuration values, and magic numbers
centralized for maintainability and consistency.
"""

import os
from typing import Dict, Any, Optional
from pathlib import Path

from loguru import logger


# === SYSTEM IDENTIFICATION ===

SYSTEM_NAME = "DGT Autonomous Movie System"
SYSTEM_VERSION = "2.0.0"
SYSTEM_ARCHITECTURE = "Four-Pillar SOA"
SYSTEM_TARGET = "West Palm Beach Hub"

# === WORLD GENERATION CONSTANTS ===

WORLD_SEED_DEFAULT = "SEED_ZERO"
WORLD_SIZE_X = 50
WORLD_SIZE_Y = 50
CHUNK_SIZE = 10
PERMUTATION_TABLE_SIZE = 256

# Noise generation parameters
NOISE_SCALE = 0.1
NOISE_OCTAVES = 4
NOISE_PERSISTENCE = 0.5
NOISE_LACUNARITY = 2.0

# Interest point generation
INTEREST_POINT_DENSITY = 0.05  # 5% of tiles have interest points
INTEREST_POINT_MIN_DISTANCE = 5
INTEREST_POINT_MAX_PER_CHUNK = 3
INTEREST_POINT_SPAWN_CHANCE = 0.05  # 5% chance per chunk

# === SOVEREIGN RESOLUTION CONSTANTS (ADR 192) ===

SOVEREIGN_WIDTH = 160
SOVEREIGN_HEIGHT = 144
SOVEREIGN_PIXELS = SOVEREIGN_WIDTH * SOVEREIGN_HEIGHT  # 23,040

# === VIEWPORT SCALING CONSTANTS (ADR 193) ===

# Standard scale buckets for responsive design
SCALE_BUCKETS = {
    "miyoo": {"width": 320, "height": 240, "scale": 1, "mode": "focus"},
    "hd": {"width": 1280, "height": 720, "scale": 4, "mode": "dashboard"},
    "fhd": {"width": 1920, "height": 1080, "scale": 7, "mode": "mfd"},
    "qhd": {"width": 2560, "height": 1440, "scale": 9, "mode": "sovereign"}
}

# Focus mode thresholds
FOCUS_MODE_WIDTH_THRESHOLD = 640
FOCUS_MODE_HEIGHT_THRESHOLD = 480

# Wing configuration
MIN_WING_WIDTH = 200
MAX_PPU_SCALE = 16
WING_ALPHA_DEFAULT = 0.8

# === TILE AND RENDERING CONSTANTS ===

TILE_SIZE_PIXELS = 8
VIEWPORT_WIDTH_PIXELS = 160
VIEWPORT_HEIGHT_PIXELS = 144
VIEWPORT_TILES_X = VIEWPORT_WIDTH_PIXELS // TILE_SIZE_PIXELS  # 20
VIEWPORT_TILES_Y = VIEWPORT_HEIGHT_PIXELS // TILE_SIZE_PIXELS  # 18

# Layer system
RENDER_LAYERS = {
    "background": 0,
    "terrain": 1,
    "entities": 2,
    "effects": 3,
    "ui": 4,
    "subtitles": 5
}

# === PERFORMANCE CONSTANTS ===

TARGET_FPS = 60
FRAME_DELAY_MS = 1000 // TARGET_FPS
FRAME_DELAY_SECONDS = FRAME_DELAY_MS / 1000.0

INTENT_COOLDOWN_MS = 10
MOVEMENT_RANGE_TILES = 15
PATHFINDING_MAX_ITERATIONS = 1000

# === VOYAGER CONSTANTS ===

VOYAGER_SPEED_TILES_PER_SECOND = 5.0
VOYAGER_INTERACTION_RANGE = 1
VOYAGER_DISCOVERY_RANGE = 2
VOYAGER_PONDERING_TIMEOUT_SECONDS = 30.0

# === PERSISTENCE CONSTANTS ===

PERSISTENCE_FORMAT = "json"
PERSISTENCE_COMPRESSION = True
PERSISTENCE_INTERVAL_TURNS = 10
BACKUP_INTERVAL_TURNS = 50
MAX_BACKUP_FILES = 5

PERSISTENCE_FILE = "persistence.json"
BACKUP_DIRECTORY = "backups"
EMERGENCY_SAVE_PREFIX = "emergency_save"

# === LLM / CHRONICLER CONSTANTS ===

LLM_PROVIDER = "ollama"
LLM_MODEL = "llama2"
LLM_TIMEOUT_SECONDS = 30.0
LLM_MAX_TOKENS = 500
LLM_TEMPERATURE = 0.8

# Subtitle system
SUBTITLE_DEFAULT_DURATION = 3.0
SUBTYPE_TYPING_SPEED = 50.0  # chars per second
SUBTITLE_MAX_LENGTH = 100
SUBTITLE_POSITION_Y = VIEWPORT_HEIGHT_PIXELS - 20

# === LOGGING CONSTANTS ===

LOG_LEVEL_DEFAULT = "INFO"
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}"
LOG_ROTATION = "10 MB"
LOG_RETENTION = "7 days"

# Log files
LOG_FILE_GAME = "game.log"
LOG_FILE_PERFORMANCE = "performance.log"
LOG_FILE_ERRORS = "errors.log"
LOG_FILE_LLM = "llm.log"

# === ERROR HANDLING CONSTANTS ===

MAX_RETRY_ATTEMPTS = 3
RETRY_BACKOFF_MS = 1000
CIRCUIT_BREAKER_THRESHOLD = 5
CIRCUIT_BREAKER_TIMEOUT_SECONDS = 300

# === CONFIGURATION PATHS ===

DEFAULT_CONFIG_DIR = "config"
DEFAULT_ASSETS_DIR = "assets"
DEFAULT_DATA_DIR = "data"
DEFAULT_LOGS_DIR = "logs"

# Environment variable names
ENV_ENVIRONMENT = "DGT_ENV"
ENV_DEBUG = "DGT_DEBUG"
ENV_LOG_LEVEL = "DGT_LOG_LEVEL"
ENV_CONFIG_FILE = "DGT_CONFIG_FILE"
ENV_ASSETS_PATH = "DGT_ASSETS_PATH"
ENV_WORLD_SEED = "DGT_WORLD_SEED"
ENV_LLM_PROVIDER = "DGT_LLM_PROVIDER"
ENV_LLM_MODEL = "DGT_LLM_MODEL"

# === FILE EXTENSIONS ===

EXT_CONFIG = ".json"
EXT_SAVE = ".dgt"
EXT_LOG = ".log"
EXT_BACKUP = ".bak"

# === NETWORK AND API CONSTANTS ===

API_TIMEOUT_SECONDS = 30.0
API_RATE_LIMIT_REQUESTS_PER_MINUTE = 60
API_MAX_RESPONSE_SIZE_MB = 10

# === MEMORY AND RESOURCE LIMITS ===

MAX_MEMORY_MB = 1024
MAX_CPU_PERCENT = 90.0
MAX_ENTITIES = 100
MAX_WORLD_DELTAS = 10000

# === DEBUG AND DEVELOPMENT CONSTANTS ===

DEBUG_SHOW_FPS = True
DEBUG_SHOW_POSITION = True
DEBUG_SHOW_PATH = True
DEBUG_SHOW_INTEREST_POINTS = False

# Enable/disable features
FEATURE_LLM_INTEGRATION = True
FEATURE_PERSISTENCE = True
FEATURE_PERFORMANCE_MONITORING = True
FEATURE_ERROR_RECOVERY = True
FEATURE_BACKGROUND_LOADING = True

# === VALIDATION CONSTANTS ===

VALID_POSITION_MIN_X = 0
VALID_POSITION_MIN_Y = 0
VALID_POSITION_MAX_X = WORLD_SIZE_X - 1
VALID_POSITION_MAX_Y = WORLD_SIZE_Y - 1

VALID_HEALTH_MIN = 0
VALID_HEALTH_MAX = 100

VALID_TURN_COUNT_MIN = 0
VALID_TURN_COUNT_MAX = 1000000

# === COLOR PALETTE (Game Boy Style) ===

COLOR_PALETTE = {
    "darkest": (15, 56, 15),
    "dark": (48, 98, 48),
    "light": (139, 172, 15),
    "lightest": (155, 188, 15)
}

# === AUDIO CONSTANTS (Future Enhancement) ===

AUDIO_SAMPLE_RATE = 44100
AUDIO_CHANNELS = 2
AUDIO_BUFFER_SIZE = 512
AUDIO_VOLUME_DEFAULT = 0.7

# === LOCALIZATION CONSTANTS ===

DEFAULT_LANGUAGE = "en"
SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "ja"]

# === SECURITY CONSTANTS ===

SESSION_TIMEOUT_SECONDS = 3600  # 1 hour
MAX_LOGIN_ATTEMPTS = 5
PASSWORD_MIN_LENGTH = 8

# === PLATFORM DETECTION ===

def is_windows() -> bool:
    """Check if running on Windows"""
    return os.name == 'nt'

def is_linux() -> bool:
    """Check if running on Linux"""
    return os.name == 'posix' and os.uname().sysname == 'Linux'

def is_macos() -> bool:
    """Check if running on macOS"""
    return os.name == 'posix' and os.uname().sysname == 'Darwin'

# === PATH UTILITIES ===

def get_project_root() -> Path:
    """Get project root directory"""
    return Path(__file__).parent.parent.parent.parent

def get_config_path(filename: str) -> Path:
    """Get configuration file path"""
    return get_project_root() / DEFAULT_CONFIG_DIR / filename

def get_assets_path(filename: str = "") -> Path:
    """Get assets file path"""
    assets_dir = get_project_root() / DEFAULT_ASSETS_DIR
    return assets_dir / filename if filename else assets_dir

def get_data_path(filename: str) -> Path:
    """Get data file path"""
    return get_project_root() / DEFAULT_DATA_DIR / filename

def get_logs_path(filename: str) -> Path:
    """Get log file path"""
    logs_dir = get_project_root() / DEFAULT_LOGS_DIR
    logs_dir.mkdir(exist_ok=True, parents=True)
    return logs_dir / filename

# === ENVIRONMENT DETECTION ===

def get_environment() -> str:
    """Get current environment from environment variables"""
    return os.getenv(ENV_ENVIRONMENT, "development").lower()

def is_development() -> bool:
    """Check if running in development environment"""
    return get_environment() == "development"

def is_production() -> bool:
    """Check if running in production environment"""
    return get_environment() == "production"

def is_testing() -> bool:
    """Check if running in testing environment"""
    return get_environment() == "testing"

def is_debug_mode() -> bool:
    """Check if debug mode is enabled"""
    return os.getenv(ENV_DEBUG, "false").lower() == "true"

# === CONFIGURATION LOADING ===

def get_system_config() -> Dict[str, Any]:
    """Get system configuration from environment and defaults"""
    return {
        "system": {
            "name": SYSTEM_NAME,
            "version": SYSTEM_VERSION,
            "architecture": SYSTEM_ARCHITECTURE,
            "target": SYSTEM_TARGET,
            "environment": get_environment(),
            "debug": is_debug_mode()
        },
        "world": {
            "seed": os.getenv(ENV_WORLD_SEED, WORLD_SEED_DEFAULT),
            "size_x": WORLD_SIZE_X,
            "size_y": WORLD_SIZE_Y,
            "chunk_size": CHUNK_SIZE,
            "interest_point_density": INTEREST_POINT_DENSITY
        },
        "performance": {
            "target_fps": TARGET_FPS,
            "intent_cooldown_ms": INTENT_COOLDOWN_MS,
            "movement_range": MOVEMENT_RANGE_TILES,
            "max_memory_mb": MAX_MEMORY_MB,
            "max_cpu_percent": MAX_CPU_PERCENT
        },
        "rendering": {
            "viewport_width": VIEWPORT_WIDTH_PIXELS,
            "viewport_height": VIEWPORT_HEIGHT_PIXELS,
            "tile_size": TILE_SIZE_PIXELS,
            "color_palette": COLOR_PALETTE
        },
        "llm": {
            "provider": os.getenv(ENV_LLM_PROVIDER, LLM_PROVIDER),
            "model": os.getenv(ENV_LLM_MODEL, LLM_MODEL),
            "timeout": LLM_TIMEOUT_SECONDS,
            "max_tokens": LLM_MAX_TOKENS,
            "temperature": LLM_TEMPERATURE
        },
        "persistence": {
            "enabled": FEATURE_PERSISTENCE,
            "format": PERSISTENCE_FORMAT,
            "compression": PERSISTENCE_COMPRESSION,
            "interval_turns": PERSISTENCE_INTERVAL_TURNS,
            "file": PERSISTENCE_FILE
        },
        "logging": {
            "level": os.getenv(ENV_LOG_LEVEL, LOG_LEVEL_DEFAULT),
            "format": LOG_FORMAT,
            "rotation": LOG_ROTATION,
            "retention": LOG_RETENTION
        },
        "paths": {
            "config": DEFAULT_CONFIG_DIR,
            "assets": DEFAULT_ASSETS_DIR,
            "data": DEFAULT_DATA_DIR,
            "logs": DEFAULT_LOGS_DIR
        },
        "features": {
            "llm_integration": FEATURE_LLM_INTEGRATION,
            "persistence": FEATURE_PERSISTENCE,
            "performance_monitoring": FEATURE_PERFORMANCE_MONITORING,
            "error_recovery": FEATURE_ERROR_RECOVERY,
            "background_loading": FEATURE_BACKGROUND_LOADING
        }
    }


def validate_system_config(config: Dict[str, Any]) -> bool:
    """Validate system configuration"""
    try:
        # Check required sections
        required_sections = ["system", "world", "performance", "rendering"]
        for section in required_sections:
            if section not in config:
                logger.error(f"Missing required config section: {section}")
                return False
        
        # Validate world size
        world_config = config["world"]
        if world_config["size_x"] <= 0 or world_config["size_y"] <= 0:
            logger.error("World size must be positive")
            return False
        
        # Validate performance targets
        perf_config = config["performance"]
        if perf_config["target_fps"] <= 0 or perf_config["target_fps"] > 120:
            logger.error("Target FPS must be between 1 and 120")
            return False
        
        # Validate rendering dimensions
        render_config = config["rendering"]
        if render_config["viewport_width"] <= 0 or render_config["viewport_height"] <= 0:
            logger.error("Viewport dimensions must be positive")
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Configuration validation error: {e}")
        return False


# === INITIALIZATION ===

def initialize_constants() -> None:
    """Initialize system constants and validate configuration"""
    config = get_system_config()
    
    if not validate_system_config(config):
        raise ValueError("Invalid system configuration")
    
    # Ensure directories exist
    for path_key in ["config", "assets", "data", "logs"]:
        path = get_project_root() / config["paths"][path_key]
        path.mkdir(exist_ok=True, parents=True)
    
    logger.info(f"🔧 System constants initialized for {config['system']['environment']} environment")
    logger.info(f"🎮 Target: {config['system']['target']} v{config['system']['version']}")


# === EXPORT ALL CONSTANTS ===

__all__ = [
    # System identification
    "SYSTEM_NAME", "SYSTEM_VERSION", "SYSTEM_ARCHITECTURE", "SYSTEM_TARGET",
    
    # World generation
    "WORLD_SEED_DEFAULT", "WORLD_SIZE_X", "WORLD_SIZE_Y", "CHUNK_SIZE", "PERMUTATION_TABLE_SIZE",
    "NOISE_SCALE", "NOISE_OCTAVES", "NOISE_PERSISTENCE", "NOISE_LACUNARITY",
    "INTEREST_POINT_DENSITY", "INTEREST_POINT_MIN_DISTANCE", "INTEREST_POINT_MAX_PER_CHUNK", "INTEREST_POINT_SPAWN_CHANCE",
    
    # Sovereign resolution (ADR 192)
    "SOVEREIGN_WIDTH", "SOVEREIGN_HEIGHT", "SOVEREIGN_PIXELS",
    
    # Viewport scaling (ADR 193)
    "SCALE_BUCKETS", "FOCUS_MODE_WIDTH_THRESHOLD", "FOCUS_MODE_HEIGHT_THRESHOLD",
    "MIN_WING_WIDTH", "MAX_PPU_SCALE", "WING_ALPHA_DEFAULT",
    
    # Rendering
    "TILE_SIZE_PIXELS", "VIEWPORT_WIDTH_PIXELS", "VIEWPORT_HEIGHT_PIXELS",
    "VIEWPORT_TILES_X", "VIEWPORT_TILES_Y", "RENDER_LAYERS", "COLOR_PALETTE",
    
    # Performance
    "TARGET_FPS", "FRAME_DELAY_MS", "FRAME_DELAY_SECONDS",
    "INTENT_COOLDOWN_MS", "MOVEMENT_RANGE_TILES", "PATHFINDING_MAX_ITERATIONS",
    
    # Voyager
    "VOYAGER_SPEED_TILES_PER_SECOND", "VOYAGER_INTERACTION_RANGE",
    "VOYAGER_DISCOVERY_RANGE", "VOYAGER_PONDERING_TIMEOUT_SECONDS",
    
    # Persistence
    "PERSISTENCE_FORMAT", "PERSISTENCE_COMPRESSION", "PERSISTENCE_INTERVAL_TURNS",
    "BACKUP_INTERVAL_TURNS", "MAX_BACKUP_FILES", "PERSISTENCE_FILE", "BACKUP_DIRECTORY",
    
    # LLM
    "LLM_PROVIDER", "LLM_MODEL", "LLM_TIMEOUT_SECONDS", "LLM_MAX_TOKENS", "LLM_TEMPERATURE",
    "SUBTITLE_DEFAULT_DURATION", "SUBTYPE_TYPING_SPEED", "SUBTITLE_MAX_LENGTH", "SUBTITLE_POSITION_Y",
    
    # System utilities
    "get_environment", "is_development", "is_production", "is_testing", "is_debug_mode",
    "get_project_root", "get_config_path", "get_assets_path", "get_data_path", "get_logs_path",
    "get_system_config", "validate_system_config", "initialize_constants"
]
