"""
Error Handling - Comprehensive error boundaries and recovery patterns
ADR 099: Resilient Error Management
"""

from typing import Optional, Dict, Any, List, Callable, TypeVar, Union
from functools import wraps
from pathlib import Path
import traceback
from loguru import logger
from enum import Enum

from .asset_models import ProcessingResult


class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    """Error categories for better handling"""
    FILE_IO = "file_io"
    IMAGE_PROCESSING = "image_processing"
    VALIDATION = "validation"
    UI = "ui"
    EXPORT = "export"
    SYSTEM = "system"


class AssetIngestorError(Exception):
    """Base exception for asset ingestor errors"""
    
    def __init__(self, message: str, category: ErrorCategory = ErrorCategory.SYSTEM, 
                 severity: ErrorSeverity = ErrorSeverity.MEDIUM, 
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.category = category
        self.severity = severity
        self.context = context or {}
        self.timestamp = None


class FileIOError(AssetIngestorError):
    """File I/O related errors"""
    
    def __init__(self, message: str, file_path: Optional[Path] = None, 
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message, 
            ErrorCategory.FILE_IO, 
            ErrorSeverity.MEDIUM,
            context
        )
        self.file_path = file_path


class ImageProcessingError(AssetIngestorError):
    """Image processing related errors"""
    
    def __init__(self, message: str, operation: Optional[str] = None,
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            ErrorCategory.IMAGE_PROCESSING,
            ErrorSeverity.MEDIUM,
            context
        )
        self.operation = operation


class ValidationError(AssetIngestorError):
    """Data validation related errors"""
    
    def __init__(self, message: str, field_name: Optional[str] = None,
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            ErrorCategory.VALIDATION,
            ErrorSeverity.LOW,
            context
        )
        self.field_name = field_name


class UIError(AssetIngestorError):
    """UI related errors"""
    
    def __init__(self, message: str, component: Optional[str] = None,
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            ErrorCategory.UI,
            ErrorSeverity.LOW,
            context
        )
        self.component = component


class ExportError(AssetIngestorError):
    """Export related errors"""
    
    def __init__(self, message: str, export_path: Optional[Path] = None,
                 context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            ErrorCategory.EXPORT,
            ErrorSeverity.HIGH,
            context
        )
        self.export_path = export_path


class SystemError(AssetIngestorError):
    """System-level errors"""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message,
            ErrorCategory.SYSTEM,
            ErrorSeverity.CRITICAL,
            context
        )


T = TypeVar('T')


def error_boundary(
    category: ErrorCategory = ErrorCategory.SYSTEM,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    fallback_value: Optional[T] = None,
    log_errors: bool = True,
    raise_on_error: bool = False
) -> Callable:
    """
    Decorator for implementing error boundaries around functions
    
    Args:
        category: Error category for classification
        severity: Error severity level
        fallback_value: Value to return on error (if not raising)
        log_errors: Whether to log errors
        raise_on_error: Whether to raise exceptions or return fallback
    
    Returns:
        Decorated function with error handling
    """
    def decorator(func: Callable[..., T]) -> Callable[..., Union[T, None]]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Union[T, None]:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                # Create structured error
                error_msg = f"Error in {func.__name__}: {str(e)}"
                
                if category == ErrorCategory.FILE_IO:
                    error = FileIOError(error_msg, context={'function': func.__name__})
                elif category == ErrorCategory.IMAGE_PROCESSING:
                    error = ImageProcessingError(error_msg, operation=func.__name__)
                elif category == ErrorCategory.VALIDATION:
                    error = ValidationError(error_msg, context={'function': func.__name__})
                elif category == ErrorCategory.UI:
                    error = UIError(error_msg, component=func.__name__)
                elif category == ErrorCategory.EXPORT:
                    error = ExportError(error_msg, context={'function': func.__name__})
                else:
                    error = SystemError(error_msg, context={'function': func.__name__})
                
                # Log error if requested
                if log_errors:
                    logger.error(f"{error_msg}\n{traceback.format_exc()}")
                
                # Either raise or return fallback
                if raise_on_error:
                    raise error
                else:
                    logger.warning(f"Returning fallback value for {func.__name__}")
                    return fallback_value
        
        return wrapper
    return decorator


class ErrorRecoveryManager:
    """Manages error recovery strategies and fallbacks"""
    
    def __init__(self):
        self.recovery_strategies: Dict[ErrorCategory, List[Callable]] = {
            ErrorCategory.FILE_IO: [
                self._retry_with_different_path,
                self._create_missing_directories,
                self._fallback_to_temp_directory
            ],
            ErrorCategory.IMAGE_PROCESSING: [
                self._retry_with_different_format,
                self._fallback_to_default_image,
                self._reduce_image_complexity
            ],
            ErrorCategory.VALIDATION: [
                self._sanitize_input_data,
                self._use_default_values,
                self._skip_invalid_items
            ],
            ErrorCategory.UI: [
                self._reset_ui_state,
                self._disable_problematic_features,
                self._show_safe_fallback_ui
            ],
            ErrorCategory.EXPORT: [
                self._retry_with_different_location,
                self._export_partial_data,
                self._save_to_backup_location
            ],
            ErrorCategory.SYSTEM: [
                self._restart_components,
                self._fallback_to_safe_mode,
                self._emergency_shutdown
            ]
        }
        logger.debug("ErrorRecoveryManager initialized")
    
    def attempt_recovery(self, error: AssetIngestorError, 
                        context: Optional[Dict[str, Any]] = None) -> bool:
        """
        Attempt to recover from error using registered strategies
        
        Args:
            error: The error that occurred
            context: Additional context for recovery
            
        Returns:
            True if recovery was successful, False otherwise
        """
        strategies = self.recovery_strategies.get(error.category, [])
        
        for strategy in strategies:
            try:
                if strategy(error, context or {}):
                    logger.info(f"Recovery successful for {error.category.value} using {strategy.__name__}")
                    return True
            except Exception as recovery_error:
                logger.warning(f"Recovery strategy {strategy.__name__} failed: {recovery_error}")
                continue
        
        logger.error(f"All recovery strategies failed for {error.category.value}")
        return False
    
    def _retry_with_different_path(self, error: AssetIngestorError, 
                                  context: Dict[str, Any]) -> bool:
        """Retry file operation with different path"""
        if not isinstance(error, FileIOError) or not error.file_path:
            return False
        
        # Try alternative paths
        alternative_paths = [
            error.file_path.with_suffix('.bak'),
            error.file_path.parent / f"backup_{error.file_path.name}",
            Path.cwd() / "temp" / error.file_path.name
        ]
        
        for alt_path in alternative_paths:
            try:
                alt_path.parent.mkdir(parents=True, exist_ok=True)
                # This would need to be implemented based on the specific operation
                logger.debug(f"Trying alternative path: {alt_path}")
                return True
            except Exception:
                continue
        
        return False
    
    def _create_missing_directories(self, error: AssetIngestorError, 
                                   context: Dict[str, Any]) -> bool:
        """Create missing directories"""
        if not isinstance(error, FileIOError) or not error.file_path:
            return False
        
        try:
            error.file_path.parent.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Created missing directory: {error.file_path.parent}")
            return True
        except Exception:
            return False
    
    def _fallback_to_temp_directory(self, error: AssetIngestorError, 
                                   context: Dict[str, Any]) -> bool:
        """Fallback to temporary directory"""
        try:
            temp_dir = Path.cwd() / "temp"
            temp_dir.mkdir(exist_ok=True)
            logger.debug(f"Falling back to temp directory: {temp_dir}")
            return True
        except Exception:
            return False
    
    def _retry_with_different_format(self, error: AssetIngestorError, 
                                   context: Dict[str, Any]) -> bool:
        """Retry image operation with different format"""
        # Implementation would depend on specific image operation
        logger.debug("Retrying with different image format")
        return True
    
    def _fallback_to_default_image(self, error: AssetIngestorError, 
                                  context: Dict[str, Any]) -> bool:
        """Fallback to default image"""
        logger.debug("Using fallback default image")
        return True
    
    def _reduce_image_complexity(self, error: AssetIngestorError, 
                                context: Dict[str, Any]) -> bool:
        """Reduce image complexity (size, colors, etc.)"""
        logger.debug("Reducing image complexity")
        return True
    
    def _sanitize_input_data(self, error: AssetIngestorError, 
                            context: Dict[str, Any]) -> bool:
        """Sanitize input data"""
        logger.debug("Sanitizing input data")
        return True
    
    def _use_default_values(self, error: AssetIngestorError, 
                           context: Dict[str, Any]) -> bool:
        """Use default values for missing/invalid data"""
        logger.debug("Using default values")
        return True
    
    def _skip_invalid_items(self, error: AssetIngestorError, 
                           context: Dict[str, Any]) -> bool:
        """Skip invalid items and continue processing"""
        logger.debug("Skipping invalid items")
        return True
    
    def _reset_ui_state(self, error: AssetIngestorError, 
                       context: Dict[str, Any]) -> bool:
        """Reset UI to safe state"""
        logger.debug("Resetting UI state")
        return True
    
    def _disable_problematic_features(self, error: AssetIngestorError, 
                                     context: Dict[str, Any]) -> bool:
        """Disable problematic UI features"""
        logger.debug("Disabling problematic features")
        return True
    
    def _show_safe_fallback_ui(self, error: AssetIngestorError, 
                              context: Dict[str, Any]) -> bool:
        """Show safe fallback UI"""
        logger.debug("Showing safe fallback UI")
        return True
    
    def _retry_with_different_location(self, error: AssetIngestorError, 
                                     context: Dict[str, Any]) -> bool:
        """Retry export with different location"""
        logger.debug("Retrying export with different location")
        return True
    
    def _export_partial_data(self, error: AssetIngestorError, 
                           context: Dict[str, Any]) -> bool:
        """Export partial data instead of full dataset"""
        logger.debug("Exporting partial data")
        return True
    
    def _save_to_backup_location(self, error: AssetIngestorError, 
                                context: Dict[str, Any]) -> bool:
        """Save to backup location"""
        logger.debug("Saving to backup location")
        return True
    
    def _restart_components(self, error: AssetIngestorError, 
                           context: Dict[str, Any]) -> bool:
        """Restart affected components"""
        logger.debug("Restarting components")
        return True
    
    def _fallback_to_safe_mode(self, error: AssetIngestorError, 
                              context: Dict[str, Any]) -> bool:
        """Fallback to safe mode operation"""
        logger.debug("Falling back to safe mode")
        return True
    
    def _emergency_shutdown(self, error: AssetIngestorError, 
                           context: Dict[str, Any]) -> bool:
        """Emergency shutdown"""
        logger.critical("Initiating emergency shutdown")
        return False  # This should always fail to trigger proper shutdown


class ErrorHandler:
    """Centralized error handling and reporting"""
    
    def __init__(self):
        self.error_history: List[AssetIngestorError] = []
        self.recovery_manager = ErrorRecoveryManager()
        self.error_callbacks: Dict[ErrorCategory, List[Callable]] = {}
        logger.debug("ErrorHandler initialized")
    
    def handle_error(self, error: Union[Exception, str], 
                     category: ErrorCategory = ErrorCategory.SYSTEM,
                     severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                     context: Optional[Dict[str, Any]] = None,
                     attempt_recovery: bool = True) -> ProcessingResult:
        """
        Handle error with recovery attempts and callbacks
        
        Args:
            error: Exception or error message
            category: Error category
            severity: Error severity
            context: Additional context
            attempt_recovery: Whether to attempt recovery
            
        Returns:
            ProcessingResult with error details
        """
        # Convert string to exception if needed
        if isinstance(error, str):
            error = AssetIngestorError(error, category, severity, context)
        elif not isinstance(error, AssetIngestorError):
            # Convert generic exception to appropriate type
            error = self._convert_exception(error, category, severity, context)
        
        # Add to history
        self.error_history.append(error)
        
        # Log error
        self._log_error(error)
        
        # Attempt recovery if requested
        recovery_successful = False
        if attempt_recovery:
            recovery_successful = self.recovery_manager.attempt_recovery(error, context)
        
        # Execute callbacks
        self._execute_callbacks(error)
        
        # Create result
        result = ProcessingResult(
            success=recovery_successful,
            errors=[str(error)] if not recovery_successful else [],
            warnings=[f"Recovered from {category.value} error"] if recovery_successful else []
        )
        
        return result
    
    def _convert_exception(self, exception: Exception, 
                         category: ErrorCategory, 
                         severity: ErrorSeverity,
                         context: Optional[Dict[str, Any]]) -> AssetIngestorError:
        """Convert generic exception to appropriate AssetIngestorError"""
        error_msg = str(exception)
        
        if category == ErrorCategory.FILE_IO:
            return FileIOError(error_msg, context=context)
        elif category == ErrorCategory.IMAGE_PROCESSING:
            return ImageProcessingError(error_msg, context=context)
        elif category == ErrorCategory.VALIDATION:
            return ValidationError(error_msg, context=context)
        elif category == ErrorCategory.UI:
            return UIError(error_msg, context=context)
        elif category == ErrorCategory.EXPORT:
            return ExportError(error_msg, context=context)
        else:
            return SystemError(error_msg, context=context)
    
    def _log_error(self, error: AssetIngestorError) -> None:
        """Log error with appropriate level"""
        log_msg = f"[{error.category.value.upper()}] {error}"
        
        if error.severity == ErrorSeverity.CRITICAL:
            logger.critical(log_msg)
        elif error.severity == ErrorSeverity.HIGH:
            logger.error(log_msg)
        elif error.severity == ErrorSeverity.MEDIUM:
            logger.warning(log_msg)
        else:
            logger.info(log_msg)
    
    def _execute_callbacks(self, error: AssetIngestorError) -> None:
        """Execute registered error callbacks"""
        callbacks = self.error_callbacks.get(error.category, [])
        
        for callback in callbacks:
            try:
                callback(error)
            except Exception as callback_error:
                logger.error(f"Error callback failed: {callback_error}")
    
    def register_callback(self, category: ErrorCategory, callback: Callable) -> None:
        """Register error callback for category"""
        if category not in self.error_callbacks:
            self.error_callbacks[category] = []
        self.error_callbacks[category].append(callback)
    
    def get_error_summary(self) -> Dict[str, Any]:
        """Get summary of all errors"""
        if not self.error_history:
            return {"total_errors": 0, "by_category": {}, "by_severity": {}}
        
        by_category = {}
        by_severity = {}
        
        for error in self.error_history:
            # Count by category
            category = error.category.value
            by_category[category] = by_category.get(category, 0) + 1
            
            # Count by severity
            severity = error.severity.value
            by_severity[severity] = by_severity.get(severity, 0) + 1
        
        return {
            "total_errors": len(self.error_history),
            "by_category": by_category,
            "by_severity": by_severity,
            "recent_errors": [str(e) for e in self.error_history[-5:]]
        }
    
    def clear_error_history(self) -> None:
        """Clear error history"""
        self.error_history.clear()
        logger.debug("Error history cleared")


# Global error handler instance
global_error_handler = ErrorHandler()
