"""
DGT Platform - Abstract Base Classes

Phase 1: Interface Definition & Hardening

All concrete implementations must inherit from these base classes
to ensure consistent interface and lifecycle management.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
import time

from .types import Result, ValidationResult


@dataclass
class ComponentConfig:
    """Base configuration for all components"""
    name: str
    enabled: bool = True
    debug_mode: bool = False
    performance_monitoring: bool = False
    
    def validate(self) -> Result[None]:
        """Validate configuration"""
        if not self.name:
            return Result.failure_result("Component name cannot be empty")
        return Result.success_result(None)


class BaseEngine(ABC):
    """Abstract base class for all engine implementations"""
    
    def __init__(self, config: Optional[ComponentConfig] = None):
        self.config = config or ComponentConfig(name=self.__class__.__name__)
        self._initialized = False
        self._shutdown = False
        self._last_error: Optional[str] = None
        self._performance_metrics: Dict[str, float] = {}
        
    @abstractmethod
    def initialize(self) -> Result[bool]:
        """Initialize the engine with all required dependencies"""
        pass
    
    @abstractmethod
    def shutdown(self) -> Result[None]:
        """Clean shutdown with resource cleanup"""
        pass
    
    @abstractmethod
    def get_state(self) -> Dict[str, Any]:
        """Get current engine state"""
        pass
    
    @abstractmethod
    def process_intent(self, intent: Dict[str, Any]) -> Result[Dict[str, Any]]:
        """Process an intent and return updated state"""
        pass
    
    def is_healthy(self) -> bool:
        """Check if engine is in healthy state"""
        return self._initialized and not self._shutdown and self._last_error is None
    
    def get_last_error(self) -> Optional[str]:
        """Get last error message"""
        return self._last_error
    
    def get_performance_metrics(self) -> Dict[str, float]:
        """Get performance metrics"""
        return self._performance_metrics.copy()
    
    def _set_error(self, error: str) -> None:
        """Set last error"""
        self._last_error = error
    
    def _record_metric(self, metric_name: str, value: float) -> None:
        """Record performance metric"""
        if self.config.performance_monitoring:
            self._performance_metrics[metric_name] = value
    
    def _validate_initialization(self) -> Result[None]:
        """Validate initialization state"""
        if self._shutdown:
            return Result.failure_result("Cannot initialize shutdown engine")
        if self._initialized:
            return Result.failure_result("Engine already initialized")
        return Result.success_result(None)


class BaseRenderer(ABC):
    """Abstract base class for all rendering implementations"""
    
    def __init__(self, config: Optional[ComponentConfig] = None):
        self.config = config or ComponentConfig(name=self.__class__.__name__)
        self._initialized = False
        self._viewport: Tuple[int, int, int, int] = (0, 0, 800, 600)
        self._frame_count = 0
        self._last_render_time: float = 0.0
        
    @abstractmethod
    def initialize(self, width: int, height: int) -> Result[bool]:
        """Initialize rendering system"""
        pass
    
    @abstractmethod
    def render_state(self, game_state: Dict[str, Any]) -> Result[bytes]:
        """Render a complete frame from game state"""
        pass
    
    @abstractmethod
    def display(self, frame_data: bytes) -> Result[None]:
        """Display the rendered frame"""
        pass
    
    def get_viewport(self) -> Tuple[int, int, int, int]:
        """Get current viewport (x, y, width, height)"""
        return self._viewport
    
    def set_viewport(self, x: int, y: int, width: int, height: int) -> Result[None]:
        """Set viewport for rendering"""
        if width <= 0 or height <= 0:
            return Result.failure_result("Invalid viewport dimensions")
        
        self._viewport = (x, y, width, height)
        return Result.success_result(None)
    
    def get_frame_count(self) -> int:
        """Get total frames rendered"""
        return self._frame_count
    
    def get_fps(self) -> float:
        """Calculate current FPS"""
        if self._last_render_time == 0:
            return 0.0
        
        current_time = time.time()
        delta = current_time - self._last_render_time
        return 1.0 / delta if delta > 0 else 0.0
    
    def _increment_frame_count(self) -> None:
        """Increment frame counter and update timing"""
        self._frame_count += 1
        self._last_render_time = time.time()


class BaseStateManager(ABC):
    """Abstract base class for state management implementations"""
    
    def __init__(self, config: Optional[ComponentConfig] = None):
        self.config = config or ComponentConfig(name=self.__class__.__name__)
        self._state: Dict[str, Any] = {}
        self._history: List[Dict[str, Any]] = []
        self._max_history_size = 100
        
    @abstractmethod
    def get_player_position(self) -> Tuple[int, int]:
        """Get current player position"""
        pass
    
    @abstractmethod
    def update_position(self, new_position: Tuple[int, int]) -> Result[None]:
        """Update player position with validation"""
        pass
    
    def get_state_snapshot(self) -> Dict[str, Any]:
        """Get complete state snapshot for persistence"""
        return self._state.copy()
    
    def restore_from_snapshot(self, snapshot: Dict[str, Any]) -> Result[None]:
        """Restore state from snapshot"""
        if not snapshot:
            return Result.failure_result("Empty snapshot provided")
        
        # Validate snapshot before restoring
        validation_result = self._validate_snapshot(snapshot)
        if not validation_result.success:
            return validation_result
        
        # Save current state to history
        self._save_to_history()
        
        # Restore state
        self._state = snapshot.copy()
        return Result.success_result(None)
    
    def validate_state(self) -> Result[bool]:
        """Validate state integrity"""
        if not self._state:
            return Result.failure_result("Empty state")
        
        # Validate player position exists
        if "player_position" not in self._state:
            return Result.failure_result("Missing player position")
        
        position = self._state["player_position"]
        if not isinstance(position, tuple) or len(position) != 2:
            return Result.failure_result("Invalid player position format")
        
        return Result.success_result(True)
    
    def get_history(self) -> List[Dict[str, Any]]:
        """Get state history"""
        return self._history.copy()
    
    def _save_to_history(self) -> None:
        """Save current state to history"""
        self._history.append(self._state.copy())
        
        # Limit history size
        if len(self._history) > self._max_history_size:
            self._history.pop(0)
    
    def _validate_snapshot(self, snapshot: Dict[str, Any]) -> Result[None]:
        """Validate snapshot format"""
        required_keys = ["player_position", "turn_count", "timestamp"]
        
        for key in required_keys:
            if key not in snapshot:
                return Result.failure_result(f"Missing required key: {key}")
        
        return Result.success_result(None)


class BasePPU(BaseRenderer):
    """Abstract base class for PPU implementations"""
    
    def __init__(self, config: Optional[ComponentConfig] = None):
        super().__init__(config)
        self._width = 0
        self._height = 0
        self._frame_buffer: Optional[bytearray] = None
        self._palette: List[Tuple[int, int, int]] = []
        
    @abstractmethod
    def render_tile(self, tile_id: int, x: int, y: int) -> Result[None]:
        """Render a single tile"""
        pass
    
    @abstractmethod
    def render_sprite(self, sprite_data: bytes, x: int, y: int) -> Result[None]:
        """Render a sprite"""
        pass
    
    def get_frame_buffer(self) -> Result[bytes]:
        """Get current frame buffer data"""
        if self._frame_buffer is None:
            return Result.failure_result("Frame buffer not initialized")
        
        return Result.success_result(bytes(self._frame_buffer))
    
    def clear_frame(self) -> Result[None]:
        """Clear the frame buffer"""
        if self._frame_buffer is None:
            return Result.failure_result("Frame buffer not initialized")
        
        self._frame_buffer[:] = b'\x00' * len(self._frame_buffer)
        return Result.success_result(None)
    
    def set_palette(self, palette: List[Tuple[int, int, int]]) -> Result[None]:
        """Set color palette"""
        if len(palette) != 4:  # Standard 4-color palette
            return Result.failure_result("Palette must have exactly 4 colors")
        
        self._palette = palette.copy()
        return Result.success_result(None)
    
    def get_palette(self) -> List[Tuple[int, int, int]]:
        """Get current palette"""
        return self._palette.copy()
    
    def _initialize_frame_buffer(self, width: int, height: int) -> Result[None]:
        """Initialize frame buffer with dimensions"""
        if width <= 0 or height <= 0:
            return Result.failure_result("Invalid dimensions")
        
        self._width = width
        self._height = height
        buffer_size = width * height
        
        self._frame_buffer = bytearray(buffer_size)
        return Result.success_result(None)


class BaseFontManager(ABC):
    """Abstract base class for font management"""
    
    def __init__(self, config: Optional[ComponentConfig] = None):
        self.config = config or ComponentConfig(name=self.__class__.__name__)
        self._current_font = ""
        self._available_fonts: Dict[str, Any] = {}
        
    @abstractmethod
    def set_font(self, font_name: str) -> Result[bool]:
        """Set active font"""
        pass
    
    @abstractmethod
    def get_font_for_energy(self, energy_level: float) -> str:
        """Get appropriate font for energy level"""
        pass
    
    def get_available_fonts(self) -> List[str]:
        """Get list of available fonts"""
        return list(self._available_fonts.keys())
    
    def get_current_font(self) -> str:
        """Get current font name"""
        return self._current_font
    
    def _register_font(self, font_name: str, font_data: Any) -> Result[None]:
        """Register a font"""
        self._available_fonts[font_name] = font_data
        return Result.success_result(None)


class BaseAssetManager(ABC):
    """Abstract base class for asset management"""
    
    def __init__(self, config: Optional[ComponentConfig] = None):
        self.config = config or ComponentConfig(name=self.__class__.__name__)
        self._cache: Dict[str, bytes] = {}
        self._cache_hits = 0
        self._cache_misses = 0
        
    @abstractmethod
    def load_asset(self, asset_path: str) -> Result[bytes]:
        """Load asset from path"""
        pass
    
    def cache_asset(self, asset_id: str, data: bytes) -> Result[None]:
        """Cache asset data"""
        self._cache[asset_id] = data
        return Result.success_result(None)
    
    def get_cached_asset(self, asset_id: str) -> Result[Optional[bytes]]:
        """Get cached asset"""
        if asset_id in self._cache:
            self._cache_hits += 1
            return Result.success_result(self._cache[asset_id])
        
        self._cache_misses += 1
        return Result.success_result(None)
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            "hits": self._cache_hits,
            "misses": self._cache_misses,
            "size": len(self._cache)
        }
    
    def clear_cache(self) -> Result[None]:
        """Clear asset cache"""
        self._cache.clear()
        self._cache_hits = 0
        self._cache_misses = 0
        return Result.success_result(None)
