"""
DGT Platform - Core Exception Hierarchy

Phase 1: Interface Definition & Hardening

Centralized exception hierarchy following the Result[T] pattern
for predictable error handling across all components.
"""

from typing import Optional, Dict, Any, List
from foundation.interfaces.protocols import Result, ValidationResult


class DGTException(Exception):
    """Base exception for all DGT Platform errors"""
    
    def __init__(self, message: str, component: Optional[str] = None, error_code: Optional[str] = None):
        self.component = component
        self.error_code = error_code
        super().__init__(message)
    
    def to_result(self, result_type: type = None) -> Result:
        """Convert to Result[T] pattern"""
        return Result.failure_result(str(self))
    
    def get_context(self) -> Dict[str, Any]:
        """Get exception context for logging"""
        return {
            "component": self.component,
            "error_code": self.error_code,
            "message": str(self),
            "exception_type": self.__class__.__name__
        }


class StateException(DGTException):
    """Exception raised for state management errors"""
    
    def __init__(self, message: str, state_key: Optional[str] = None, current_state: Optional[Dict[str, Any]] = None):
        self.state_key = state_key
        self.current_state = current_state
        super().__init__(message, component="StateManager")
    
    def to_result(self, result_type: type = None) -> Result:
        validation = ValidationResult.SYSTEM_ERROR
        return Result.failure_result(str(self), validation)


class EngineException(DGTException):
    """Exception raised for engine operation errors"""
    
    def __init__(self, message: str, engine_name: Optional[str] = None, intent_type: Optional[str] = None):
        self.engine_name = engine_name
        self.intent_type = intent_type
        super().__init__(message, component="Engine")
    
    def to_result(self, result_type: type = None) -> Result:
        validation = ValidationResult.SYSTEM_ERROR
        return Result.failure_result(str(self), validation)


class RenderException(DGTException):
    """Exception raised for rendering system errors"""
    
    def __init__(self, message: str, renderer_type: Optional[str] = None, frame_info: Optional[Dict[str, Any]] = None):
        self.renderer_type = renderer_type
        self.frame_info = frame_info
        super().__init__(message, component="Renderer")
    
    def to_result(self, result_type: type = None) -> Result:
        validation = ValidationResult.SYSTEM_ERROR
        return Result.failure_result(str(self), validation)


class PPUException(RenderException):
    """Exception raised for PPU-specific errors"""
    
    def __init__(self, message: str, ppu_operation: Optional[str] = None, tile_coord: Optional[tuple] = None):
        self.ppu_operation = ppu_operation
        self.tile_coord = tile_coord
        super().__init__(message, component="PPU")


class ValidationException(DGTException):
    """Exception raised for validation errors"""
    
    def __init__(self, message: str, validation_result: ValidationResult, field: Optional[str] = None, value: Optional[Any] = None):
        self.validation_result = validation_result
        self.field = field
        self.value = value
        super().__init__(message, component="Validator")
    
    def to_result(self, result_type: type = None) -> Result:
        return Result.failure_result(str(self), self.validation_result)


class IntentException(EngineException):
    """Exception raised for intent processing errors"""
    
    def __init__(self, message: str, intent_data: Optional[Dict[str, Any]] = None):
        self.intent_data = intent_data
        super().__init__(message, engine_name="IntentProcessor")


class NavigationException(DGTException):
    """Exception raised for navigation/pathfinding errors"""
    
    def __init__(self, message: str, start_pos: Optional[tuple] = None, target_pos: Optional[tuple] = None, path: Optional[List[tuple]] = None):
        self.start_pos = start_pos
        self.target_pos = target_pos
        self.path = path
        super().__init__(message, component="Navigator")


class AssetException(DGTException):
    """Exception raised for asset management errors"""
    
    def __init__(self, message: str, asset_path: Optional[str] = None, asset_type: Optional[str] = None):
        self.asset_path = asset_path
        self.asset_type = asset_type
        super().__init__(message, component="AssetManager")


class ConfigurationException(DGTException):
    """Exception raised for configuration errors"""
    
    def __init__(self, message: str, config_key: Optional[str] = None, config_value: Optional[Any] = None):
        self.config_key = config_key
        self.config_value = config_value
        super().__init__(message, component="Configuration")


class NarrativeException(DGTException):
    """Exception raised for narrative system errors"""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None, tone: Optional[str] = None):
        self.context = context
        self.tone = tone
        super().__init__(message, component="NarrativeEngine")


class PerformanceException(DGTException):
    """Exception raised for performance-related errors"""
    
    def __init__(self, message: str, metric_name: Optional[str] = None, threshold: Optional[float] = None, actual_value: Optional[float] = None):
        self.metric_name = metric_name
        self.threshold = threshold
        self.actual_value = actual_value
        super().__init__(message, component="PerformanceMonitor")


class LifecycleException(DGTException):
    """Exception raised during component lifecycle operations"""
    
    def __init__(self, message: str, operation: Optional[str] = None, component_state: Optional[str] = None):
        self.operation = operation
        self.component_state = component_state
        super().__init__(message, component="LifecycleManager")


class ThreadSafetyException(DGTException):
    """Exception raised for thread safety violations"""
    
    def __init__(self, message: str, thread_id: Optional[int] = None, resource: Optional[str] = None):
        self.thread_id = thread_id
        self.resource = resource
        super().__init__(message, component="ThreadSafety")


class SerializationException(DGTException):
    """Exception raised for serialization/deserialization errors"""
    
    def __init__(self, message: str, data_type: Optional[str] = None, format: Optional[str] = None):
        self.data_type = data_type
        self.format = format
        super().__init__(message, component="Serializer")


class NetworkException(DGTException):
    """Exception raised for network-related errors"""
    
    def __init__(self, message: str, endpoint: Optional[str] = None, status_code: Optional[int] = None):
        self.endpoint = endpoint
        self.status_code = status_code
        super().__init__(message, component="NetworkManager")


class DatabaseException(DGTException):
    """Exception raised for database operation errors"""
    
    def __init__(self, message: str, query: Optional[str] = None, table: Optional[str] = None):
        self.query = query
        self.table = table
        super().__init__(message, component="DatabaseManager")


# Exception Factory Functions
def create_state_exception(message: str, state_key: Optional[str] = None) -> StateException:
    """Create a state exception with standard formatting"""
    return StateException(message, state_key)


def create_validation_exception(message: str, validation_result: ValidationResult, field: Optional[str] = None) -> ValidationException:
    """Create a validation exception with standard formatting"""
    return ValidationException(message, validation_result, field)


def create_engine_exception(message: str, engine_name: Optional[str] = None, intent_type: Optional[str] = None) -> EngineException:
    """Create an engine exception with standard formatting"""
    return EngineException(message, engine_name, intent_type)


def create_render_exception(message: str, renderer_type: Optional[str] = None) -> RenderException:
    """Create a render exception with standard formatting"""
    return RenderException(message, renderer_type)


def create_ppu_exception(message: str, operation: Optional[str] = None, coord: Optional[tuple] = None) -> PPUException:
    """Create a PPU exception with standard formatting"""
    return PPUException(message, operation, coord)


def create_navigation_exception(message: str, start: Optional[tuple] = None, target: Optional[tuple] = None) -> NavigationException:
    """Create a navigation exception with standard formatting"""
    return NavigationException(message, start, target)


def create_asset_exception(message: str, asset_path: Optional[str] = None, asset_type: Optional[str] = None) -> AssetException:
    """Create an asset exception with standard formatting"""
    return AssetException(message, asset_path, asset_type)


def create_config_exception(message: str, config_key: Optional[str] = None, value: Optional[Any] = None) -> ConfigurationException:
    """Create a configuration exception with standard formatting"""
    return ConfigurationException(message, config_key, value)


def create_performance_exception(message: str, metric: Optional[str] = None, threshold: Optional[float] = None, actual: Optional[float] = None) -> PerformanceException:
    """Create a performance exception with standard formatting"""
    return PerformanceException(message, metric, threshold, actual)


# Exception Handler Utilities
class ExceptionHandler:
    """Utility class for standardized exception handling"""
    
    @staticmethod
    def handle_and_return_result(exception: Exception, result_type: type = None) -> Result:
        """Handle exception and return Result[T]"""
        if isinstance(exception, DGTException):
            return exception.to_result(result_type)
        else:
            # Wrap non-DGT exceptions
            dgt_exception = DGTException(str(exception))
            return dgt_exception.to_result(result_type)
    
    @staticmethod
    def log_exception(exception: Exception, logger) -> None:
        """Log exception with context"""
        if isinstance(exception, DGTException):
            logger.error(f"DGT Exception in {exception.component}: {exception}", extra=exception.get_context())
        else:
            logger.error(f"Unexpected exception: {exception}", exc_info=True)
    
    @staticmethod
    def is_recoverable(exception: Exception) -> bool:
        """Check if exception is recoverable"""
        if isinstance(exception, DGTException):
            # Most DGT exceptions are recoverable except critical ones
            non_recoverable = [ThreadSafetyException, DatabaseException, SerializationException]
            return not any(isinstance(exception, exc_type) for exc_type in non_recoverable)
        
        # Non-DGT exceptions are generally not recoverable
        return False
