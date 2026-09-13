"""
Logger Utility - Centralized Logging Configuration

Loguru and Rich configuration for the DGT Autonomous Movie System.
Provides structured logging with proper formatting, rotation, and output channels.

Key Features:
- Structured logging with Loguru
- Rich console output for development
- File rotation and retention
- Performance and error logging
- Component-specific loggers
"""

import sys
from typing import Optional, Dict, Any
from pathlib import Path

from loguru import logger
from rich.console import Console
from rich.logging import RichHandler

from dgt_engine.foundation.constants import (
    LOG_LEVEL_DEFAULT, LOG_FORMAT
)

# === LOGGING CONSTANTS ===
LOG_ROTATION = "10 MB"
LOG_RETENTION = "30 days"
LOG_FILE_GAME = "game.log"
LOG_FILE_PERFORMANCE = "performance.log"
LOG_FILE_ERRORS = "errors.log"
LOG_FILE_LLM = "llm.log"


def is_debug_mode() -> bool:
    """Check if debug mode is enabled"""
    import os
    return os.getenv("DGT_DEBUG", "false").lower() == "true"


def is_development() -> bool:
    """Check if running in development environment"""
    import os
    return os.getenv("DGT_ENV", "development") == "development"


def is_testing() -> bool:
    """Check if running in testing environment"""
    import os
    return os.getenv("DGT_ENV", "development") == "testing"


def get_environment() -> str:
    """Get current environment"""
    import os
    return os.getenv("DGT_ENV", "development")


def get_logs_path(subpath: str) -> Path:
    """Get logs directory path"""
    from pathlib import Path
    import os
    
    logs_dir = Path(os.getenv("DGT_LOGS_DIR", "logs"))
    logs_dir.mkdir(exist_ok=True)
    return logs_dir / subpath if subpath else logs_dir


class LoggerManager:
    """Centralized logging management with Loguru and Rich"""
    
    def __init__(self):
        self.console = Console()
        self.initialized = False
        self.log_files = {}
        
    def initialize(self, log_level: str = LOG_LEVEL_DEFAULT, 
                  enable_rich: bool = True, 
                  enable_file_logging: bool = True) -> None:
        """Initialize logging system"""
        if self.initialized:
            return
        
        # Remove default handler
        logger.remove()
        
        # Add Rich console handler for development
        if enable_rich:
            self._add_rich_handler(log_level)
        else:
            self._add_console_handler(log_level)
        
        # Add file handlers
        if enable_file_logging:
            self._add_file_handlers(log_level)
        
        self.initialized = True
        logger.info("📝 Logging system initialized")
    
    def _add_rich_handler(self, log_level: str) -> None:
        """Add Rich console handler"""
        handler = RichHandler(
            console=self.console,
            show_time=True,
            show_path=True,
            markup=True,
            rich_tracebacks=True,
            tracebacks_show_locals=is_debug_mode()
        )
        
        logger.add(
            handler,
            level=log_level,
            format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
            colorize=True
        )
    
    def _add_console_handler(self, log_level: str) -> None:
        """Add simple console handler"""
        logger.add(
            sys.stderr,
            level=log_level,
            format=LOG_FORMAT,
            colorize=True
        )
    
    def _add_file_handlers(self, log_level: str) -> None:
        """Add file handlers for different log types"""
        logs_dir = get_logs_path("")
        
        # Main game log
        game_log_file = logs_dir / LOG_FILE_GAME
        logger.add(
            game_log_file,
            level=log_level,
            format=LOG_FORMAT,
            rotation=LOG_ROTATION,
            retention=LOG_RETENTION,
            compression="zip",
            enqueue=True
        )
        self.log_files["game"] = game_log_file
        
        # Performance log
        perf_log_file = logs_dir / LOG_FILE_PERFORMANCE
        logger.add(
            perf_log_file,
            level="INFO",
            format=LOG_FORMAT,
            rotation=LOG_ROTATION,
            retention=LOG_RETENTION,
            compression="zip",
            filter=lambda record: "performance" in record["message"].lower() or "fps" in record["message"].lower()
        )
        self.log_files["performance"] = perf_log_file
        
        # Error log
        error_log_file = logs_dir / LOG_FILE_ERRORS
        logger.add(
            error_log_file,
            level="ERROR",
            format=LOG_FORMAT,
            rotation=LOG_ROTATION,
            retention=LOG_RETENTION,
            compression="zip",
            backtrace=True,
            diagnose=True
        )
        self.log_files["errors"] = error_log_file
        
        # LLM log (if LLM integration is enabled)
        llm_log_file = logs_dir / LOG_FILE_LLM
        logger.add(
            llm_log_file,
            level="DEBUG",
            format=LOG_FORMAT,
            rotation=LOG_ROTATION,
            retention=LOG_RETENTION,
            compression="zip",
            filter=lambda record: "llm" in record["message"].lower() or "chronicler" in record["message"].lower()
        )
        self.log_files["llm"] = llm_log_file
    
    def get_component_logger(self, component_name: str) -> Any:
        """Get logger for specific component"""
        return logger.bind(component=component_name)
    
    def log_performance(self, metric_name: str, value: float, unit: str = "") -> None:
        """Log performance metric"""
        message = f"Performance: {metric_name} = {value:.2f}"
        if unit:
            message += f" {unit}"
        
        logger.bind(performance=True).info(message)
    
    def log_error_with_context(self, error: Exception, context: Dict[str, Any]) -> None:
        """Log error with additional context"""
        context_str = ", ".join([f"{k}={v}" for k, v in context.items()])
        logger.error(f"Error in {context_str}: {error}")
    
    def get_log_stats(self) -> Dict[str, Any]:
        """Get logging statistics"""
        stats = {
            "initialized": self.initialized,
            "log_files": {}
        }
        
        for log_type, file_path in self.log_files.items():
            if file_path.exists():
                stats["log_files"][log_type] = {
                    "path": str(file_path),
                    "size": file_path.stat().st_size,
                    "modified": file_path.stat().st_mtime
                }
            else:
                stats["log_files"][log_type] = {"path": str(file_path), "size": 0}
        
        return stats


# === GLOBAL LOGGER MANAGER ===

_logger_manager: Optional[LoggerManager] = None


def get_logger_manager() -> LoggerManager:
    """Get global logger manager instance"""
    global _logger_manager
    if _logger_manager is None:
        _logger_manager = LoggerManager()
    return _logger_manager


def initialize_logging(log_level: Optional[str] = None, 
                      enable_rich: Optional[bool] = None,
                      enable_file_logging: Optional[bool] = None) -> LoggerManager:
    """Initialize logging system"""
    global _logger_manager
    
    # Determine settings
    if log_level is None:
        log_level = LOG_LEVEL_DEFAULT
    
    if enable_rich is None:
        enable_rich = is_development()
    
    if enable_file_logging is None:
        enable_file_logging = not is_testing()
    
    _logger_manager = LoggerManager()
    _logger_manager.initialize(log_level, enable_rich, enable_file_logging)
    
    return _logger_manager




# === COMPONENT LOGGERS ===

def get_game_logger() -> Any:
    """Get game-specific logger"""
    return get_logger_manager().get_component_logger("game")


def get_world_logger() -> Any:
    """Get world engine logger"""
    return get_logger_manager().get_component_logger("world")


def get_mind_logger() -> Any:
    """Get D&D engine logger"""
    return get_logger_manager().get_component_logger("mind")


def get_body_logger() -> Any:
    """Get graphics engine logger"""
    return get_logger_manager().get_component_logger("body")


def get_actor_logger() -> Any:
    """Get Voyager logger"""
    return get_logger_manager().get_component_logger("actor")


def get_narrative_logger() -> Any:
    """Get Chronicler logger"""
    return get_logger_manager().get_component_logger("narrative")


def get_performance_logger() -> Any:
    """Get performance logger"""
    return get_logger_manager().get_component_logger("performance")


def get_persistence_logger() -> Any:
    """Get persistence logger"""
    return get_logger_manager().get_component_logger("persistence")


# === CONVENIENCE FUNCTIONS ===

def log_performance(metric_name: str, value: float, unit: str = "") -> None:
    """Log performance metric"""
    get_logger_manager().log_performance(metric_name, value, unit)


def log_error_with_context(error: Exception, context: Dict[str, Any]) -> None:
    """Log error with context"""
    get_logger_manager().log_error_with_context(error, context)


def get_log_stats() -> Dict[str, Any]:
    """Get logging statistics"""
    return get_logger_manager().get_log_stats()


# === DECORATORS ===

def log_function_calls(logger_func=None):
    """Decorator to log function calls"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            func_logger = logger_func or get_game_logger()
            func_logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
            
            try:
                result = func(*args, **kwargs)
                func_logger.debug(f"Completed {func.__name__}")
                return result
            except Exception as e:
                func_logger.error(f"Error in {func.__name__}: {e}")
                raise
        
        return wrapper
    return decorator


def log_performance_metrics(metric_name: str):
    """Decorator to log function performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            import time
            
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                execution_time = (time.time() - start_time) * 1000
                log_performance(metric_name, execution_time, "ms")
                return result
            except Exception as e:
                execution_time = (time.time() - start_time) * 1000
                log_performance(f"{metric_name}_error", execution_time, "ms")
                raise
        
        return wrapper
    return decorator


# === INITIALIZATION ===

def auto_initialize() -> None:
    """Auto-initialize logging system"""
    try:
        # Check if we're in development environment
        dev_mode = is_development()
        initialize_logging(enable_rich=dev_mode)
    except Exception as e:
        # Fallback to basic logging
        logger.add(sys.stderr, level="INFO")
        logger.error(f"Failed to initialize logging: {e}")


# Auto-initialize on import - DISABLED to prevent circular dependency deadlock
# auto_initialize()
