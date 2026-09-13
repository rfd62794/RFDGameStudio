"""
Engine Protocols - Dependency Injection for Unidirectional Flow

Sprint C: State Management & Tier Decoupling
ADR 213: Abstract Bridge Pattern for Engine-App Separation

Defines protocols that allow Engine (Tier 2) to communicate with App (Tier 3)
through dependency injection rather than direct imports.
"""

from typing import Protocol, runtime_checkable, Dict, Any, List, Optional, Callable
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum

# Import Foundation protocols
from dgt_engine.foundation.protocols import (
    WorldStateSnapshot, EntityStateProtocol, Vector2Protocol,
    EventCallbackProtocol, RenderCallbackProtocol
)


@runtime_checkable
class ViewportLayoutProtocol(Protocol):
    """Protocol for viewport layout - Engine layer definition"""
    
    @property
    def width(self) -> int: ...
    
    @property
    def height(self) -> int: ...
    
    @property
    def scale(self) -> float: ...
    
    def get_bounds(self) -> Tuple[int, int, int, int]: ...


@runtime_checkable
class PointProtocol(Protocol):
    """Protocol for 2D points - Engine layer definition"""
    
    @property
    def x(self) -> int: ...
    
    @property
    def y(self) -> int: ...
    
    def to_tuple(self) -> Tuple[int, int]: ...


@runtime_checkable
class RectangleProtocol(Protocol):
    """Protocol for rectangles - Engine layer definition"""
    
    @property
    def x(self) -> int: ...
    
    @property
    def y(self) -> int: ...
    
    @property
    def width(self) -> int: ...
    
    @property
    def height(self) -> int: ...
    
    def contains_point(self, point: PointProtocol) -> bool: ...


@dataclass
class ScaleBucket:
    """Scale bucket definition - Engine layer implementation"""
    scale_factor: float
    target_width: int
    target_height: int
    description: str

# Standard scale buckets for different display modes
STANDARD_SCALE_BUCKETS = [
    ScaleBucket(1.0, 160, 144, "Miyoo Mini (1x)"),
    ScaleBucket(2.0, 320, 288, "Desktop Small (2x)"),
    ScaleBucket(4.0, 640, 576, "Desktop Large (4x)"),
]

@dataclass
class OverlayComponent:
    """Overlay component definition - Engine layer implementation"""
    component_id: str
    position: Tuple[int, int]
    size: Tuple[int, int]
    render_data: Dict[str, Any]
    z_index: int = 0


@runtime_checkable
class AssetRegistryProtocol(Protocol):
    """Protocol for asset registry - Engine layer definition"""
    
    def get_asset(self, asset_id: str) -> Optional[Dict[str, Any]]: ...
    
    def register_asset(self, asset_id: str, asset_data: Dict[str, Any]) -> bool: ...
    
    def list_assets(self) -> List[str]: ...


@runtime_checkable
class ModelRegistryProtocol(Protocol):
    """Protocol for model registry - Engine layer definition"""
    
    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]: ...
    
    def register_model(self, model_id: str, model_data: Dict[str, Any]) -> bool: ...
    
    def validate_model(self, model_data: Dict[str, Any]) -> bool: ...


# === DEPENDENCY INJECTION INTERFACES ===

@runtime_checkable
class AppDependencyProtocol(Protocol):
    """Protocol for App dependencies injected into Engine"""
    
    def get_viewport_layout(self) -> ViewportLayoutProtocol: ...
    
    def get_asset_registry(self) -> AssetRegistryProtocol: ...
    
    def get_model_registry(self) -> ModelRegistryProtocol: ...
    
    def get_event_callback(self) -> EventCallbackProtocol: ...
    
    def get_render_callback(self) -> RenderCallbackProtocol: ...


@runtime_checkable
class EngineEventEmitter(Protocol):
    """Protocol for Engine to emit events to App"""
    
    def emit_entity_spawned(self, entity_id: str, entity_type: str) -> None: ...
    
    def emit_entity_destroyed(self, entity_id: str) -> None: ...
    
    def emit_collision(self, entity1_id: str, entity2_id: str) -> None: ...
    
    def emit_state_change(self, snapshot: WorldStateSnapshot) -> None: ...


@runtime_checkable
class EngineRenderEmitter(Protocol):
    """Protocol for Engine to emit render events to UI"""
    
    def emit_frame_ready(self, frame_data: bytes) -> None: ...
    
    def emit_viewport_change(self, x: int, y: int, width: int, height: int) -> None: ...
    
    def emit_fps_update(self, fps: float) -> None: ...


# === CALLBACK REGISTRATION ===

class CallbackRegistry:
    """Registry for managing Engine-App callbacks"""
    
    def __init__(self):
        self._event_callbacks: List[EventCallbackProtocol] = []
        self._render_callbacks: List[RenderCallbackProtocol] = []
        self._app_dependencies: Optional[AppDependencyProtocol] = None
    
    def register_event_callback(self, callback: EventCallbackProtocol) -> None:
        """Register event callback from App"""
        self._event_callbacks.append(callback)
    
    def register_render_callback(self, callback: RenderCallbackProtocol) -> None:
        """Register render callback from App"""
        self._render_callbacks.append(callback)
    
    def set_app_dependencies(self, dependencies: AppDependencyProtocol) -> None:
        """Set App dependencies (injected from App layer)"""
        self._app_dependencies = dependencies
    
    def get_event_emitter(self) -> EngineEventEmitter:
        """Get event emitter for Engine"""
        return CallbackEventEmitter(self)
    
    def get_render_emitter(self) -> EngineRenderEmitter:
        """Get render emitter for Engine"""
        return CallbackRenderEmitter(self)


class CallbackEventEmitter:
    """Event emitter implementation using callback registry"""
    
    def __init__(self, registry: CallbackRegistry):
        self._registry = registry
    
    def emit_entity_spawned(self, entity_id: str, entity_type: str) -> None:
        """Emit entity spawned event"""
        for callback in self._registry._event_callbacks:
            callback.on_entity_spawned(entity_id, entity_type)
    
    def emit_entity_destroyed(self, entity_id: str) -> None:
        """Emit entity destroyed event"""
        for callback in self._registry._event_callbacks:
            callback.on_entity_destroyed(entity_id)
    
    def emit_collision(self, entity1_id: str, entity2_id: str) -> None:
        """Emit collision event"""
        for callback in self._registry._event_callbacks:
            callback.on_collision(entity1_id, entity2_id)
    
    def emit_state_change(self, snapshot: WorldStateSnapshot) -> None:
        """Emit state change event"""
        for callback in self._registry._event_callbacks:
            callback.on_state_change(snapshot)


class CallbackRenderEmitter:
    """Render emitter implementation using callback registry"""
    
    def __init__(self, registry: CallbackRegistry):
        self._registry = registry
    
    def emit_frame_ready(self, frame_data: bytes) -> None:
        """Emit frame ready event"""
        for callback in self._registry._render_callbacks:
            callback.on_frame_ready(frame_data)
    
    def emit_viewport_change(self, x: int, y: int, width: int, height: int) -> None:
        """Emit viewport change event"""
        for callback in self._registry._render_callbacks:
            callback.on_viewport_change(x, y, width, height)
    
    def emit_fps_update(self, fps: float) -> None:
        """Emit FPS update event"""
        for callback in self._registry._render_callbacks:
            callback.on_fps_update(fps)


# === FACTORY FUNCTIONS ===

def create_callback_registry() -> CallbackRegistry:
    """Create callback registry for Engine-App communication"""
    return CallbackRegistry()


def create_engine_emitters(registry: CallbackRegistry) -> Tuple[EngineEventEmitter, EngineRenderEmitter]:
    """Create Engine emitters for unidirectional communication"""
    return registry.get_event_emitter(), registry.get_render_emitter()


# === EXPORTS ===

__all__ = [
    # Protocols
    'ViewportLayoutProtocol',
    'PointProtocol', 
    'RectangleProtocol',
    'AssetRegistryProtocol',
    'ModelRegistryProtocol',
    'AppDependencyProtocol',
    'EngineEventEmitter',
    'EngineRenderEmitter',
    
    # Implementations
    'ScaleBucket',
    'STANDARD_SCALE_BUCKETS',
    'OverlayComponent',
    'CallbackRegistry',
    'CallbackEventEmitter',
    'CallbackRenderEmitter',
    
    # Factory functions
    'create_callback_registry',
    'create_engine_emitters'
]
