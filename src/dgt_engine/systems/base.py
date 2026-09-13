"""
Base Classes for DGT Platform Systems and Components

Sprint D: Orchestration Layer - Standardized BaseSystem and BaseComponent
ADR 214: Abstract Base Classes for Plug-and-Play Architecture

Defines the foundational orchestration patterns that all systems and components
must follow to ensure consistent behavior and automatic registry integration.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Callable
from dataclasses import dataclass, field
import time
import threading
from enum import Enum

from dgt_engine.foundation.types import Result
from dgt_engine.foundation.protocols import (
    WorldStateSnapshot, EntityStateProtocol, Vector2Protocol,
    EventCallbackProtocol, RenderCallbackProtocol
)
from dgt_engine.foundation.registry import DGTRegistry, RegistryType


class SystemStatus(Enum):
    """System status enumeration"""
    UNINITIALIZED = "uninitialized"
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


@dataclass
class SystemConfig:
    """Configuration for all systems"""
    system_id: str
    system_name: str
    enabled: bool = True
    debug_mode: bool = False
    auto_register: bool = True
    update_interval: float = 1.0 / 60.0  # 60Hz default
    priority: int = 0  # Higher priority systems update first


@dataclass
class SystemMetrics:
    """Performance metrics for systems"""
    total_updates: int = 0
    total_time: float = 0.0
    average_time: float = 0.0
    last_update_time: float = 0.0
    fps: float = 0.0
    error_count: int = 0
    last_error: Optional[str] = None


class BaseSystem(ABC):
    """
    Abstract base class for all DGT Platform systems.
    
    All systems must inherit from this class to ensure:
    - Consistent lifecycle management
    - Automatic registry integration
    - Standardized update and event handling
    - Performance monitoring
    """
    
    def __init__(self, config: SystemConfig):
        self.config = config
        self.status = SystemStatus.UNINITIALIZED
        self.metrics = SystemMetrics()
        self._registry: Optional[DGTRegistry] = None
        self._event_callbacks: List[EventCallbackProtocol] = []
        self._render_callbacks: List[RenderCallbackProtocol] = []
        self._last_update_time = 0.0
        self._lock = threading.RLock()
        
        # Auto-register if enabled
        if config.auto_register:
            self._auto_register()
    
    def _auto_register(self) -> None:
        """Automatically register system with DGTRegistry"""
        try:
            self._registry = DGTRegistry()
            
            # Register system metadata
            system_metadata = {
                'system_type': 'BaseSystem',
                'system_name': self.config.system_name,
                'system_id': self.config.system_id,
                'status': self.status.value,
                'priority': self.config.priority,
                'enabled': self.config.enabled,
                'created_at': time.time()
            }
            
            result = self._registry.register(
                f"system_{self.config.system_id}",
                self,
                RegistryType.SYSTEM,
                system_metadata
            )
            
            if result.success:
                self._get_logger().info(f"✅ System {self.config.system_name} auto-registered")
            else:
                self._get_logger().error(f"❌ System {self.config.system_name} registration failed: {result.error}")
                self.status = SystemStatus.ERROR
                
        except Exception as e:
            self._get_logger().error(f"❌ System {self.config.system_name} auto-registration error: {e}")
            self.status = SystemStatus.ERROR
    
    def initialize(self) -> Result[bool]:
        """
        Initialize the system with all required dependencies.
        
        Returns:
            Result indicating initialization success
        """
        with self._lock:
            if self.status == SystemStatus.INITIALIZING:
                return Result.failure_result("System already initializing")
            
            if self.status == SystemStatus.RUNNING:
                return Result.failure_result("System already running")
            
            self.status = SystemStatus.INITIALIZING
            
            try:
                # Call subclass initialization
                init_result = self._on_initialize()
                
                if init_result.success:
                    self.status = SystemStatus.RUNNING
                    self._get_logger().info(f"✅ System {self.config.system_name} initialized successfully")
                    return Result.success_result(True)
                else:
                    self.status = SystemStatus.ERROR
                    self.metrics.error_count += 1
                    self.metrics.last_error = init_result.error
                    return init_result
                    
            except Exception as e:
                self.status = SystemStatus.ERROR
                self.metrics.error_count += 1
                self.metrics.last_error = str(e)
                self._get_logger().error(f"❌ System {self.config.system_name} initialization error: {e}")
                return Result.failure_result(f"Initialization failed: {str(e)}")
    
    @abstractmethod
    def _on_initialize(self) -> Result[bool]:
        """
        Subclass-specific initialization logic.
        
        Returns:
            Result indicating initialization success
        """
        pass
    
    def shutdown(self) -> Result[None]:
        """
        Shutdown the system with proper cleanup.
        
        Returns:
            Result indicating shutdown success
        """
        with self._lock:
            if self.status == SystemStatus.STOPPED:
                return Result.success_result(None)
            
            if self.status == SystemStatus.STOPPING:
                return Result.failure_result("System already stopping")
            
            self.status = SystemStatus.STOPPING
            
            try:
                # Call subclass shutdown
                shutdown_result = self._on_shutdown()
                
                if shutdown_result.success:
                    self.status = SystemStatus.STOPPED
                    self._get_logger().info(f"✅ System {self.config.system_name} shutdown successfully")
                    return Result.success_result(None)
                else:
                    self.status = SystemStatus.ERROR
                    self.metrics.error_count += 1
                    self.metrics.last_error = shutdown_result.error
                    return shutdown_result
                    
            except Exception as e:
                self.status = SystemStatus.ERROR
                self.metrics.error_count += 1
                self.metrics.last_error = str(e)
                self._get_logger().error(f"❌ System {self.config.system_name} shutdown error: {e}")
                return Result.failure_result(f"Shutdown failed: {str(e)}")
    
    @abstractmethod
    def _on_shutdown(self) -> Result[None]:
        """
        Subclass-specific shutdown logic.
        
        Returns:
            Result indicating shutdown success
        """
        pass
    
    def update(self, dt: float) -> Result[None]:
        """
        Update the system for one time step.
        
        Args:
            dt: Time delta in seconds
            
        Returns:
            Result indicating update success
        """
        if not self.config.enabled:
            return Result.success_result(None)
        
        if self.status != SystemStatus.RUNNING:
            return Result.failure_result(f"System not running: {self.status.value}")
        
        start_time = time.perf_counter()
        
        try:
            # Call subclass update
            update_result = self._on_update(dt)
            
            # Update metrics
            end_time = time.perf_counter()
            update_time = (end_time - start_time) * 1000  # Convert to ms
            
            self.metrics.total_updates += 1
            self.metrics.total_time += update_time
            self.metrics.average_time = self.metrics.total_time / self.metrics.total_updates
            self.metrics.last_update_time = update_time
            self.metrics.fps = 1.0 / dt if dt > 0 else 0.0
            self._last_update_time = time.time()
            
            if not update_result.success:
                self.metrics.error_count += 1
                self.metrics.last_error = update_result.error
            
            return update_result
            
        except Exception as e:
            self.metrics.error_count += 1
            self.metrics.last_error = str(e)
            self._get_logger().error(f"❌ System {self.config.system_name} update error: {e}")
            return Result.failure_result(f"Update failed: {str(e)}")
    
    @abstractmethod
    def _on_update(self, dt: float) -> Result[None]:
        """
        Subclass-specific update logic.
        
        Args:
            dt: Time delta in seconds
            
        Returns:
            Result indicating update success
        """
        pass
    
    def handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """
        Handle system event.
        
        Args:
            event_type: Type of event
            event_data: Event data
            
        Returns:
            Result indicating event handling success
        """
        try:
            # Call subclass event handling
            result = self._on_handle_event(event_type, event_data)
            
            # Emit event to callbacks
            for callback in self._event_callbacks:
                try:
                    if hasattr(callback, f"on_{event_type}"):
                        getattr(callback, f"on_{event_type}")(event_data)
                except Exception as e:
                    self._get_logger().warning(f"Event callback error: {e}")
            
            return result
            
        except Exception as e:
            self.metrics.error_count += 1
            self.metrics.last_error = str(e)
            self._get_logger().error(f"❌ System {self.config.system_name} event handling error: {e}")
            return Result.failure_result(f"Event handling failed: {str(e)}")
    
    def _on_handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """
        Subclass-specific event handling logic.
        
        Args:
            event_type: Type of event
            event_data: Event data
            
        Returns:
            Result indicating event handling success
        """
        return Result.success_result(None)
    
    def register_event_callback(self, callback: EventCallbackProtocol) -> None:
        """Register event callback for system events"""
        self._event_callbacks.append(callback)
    
    def register_render_callback(self, callback: RenderCallbackProtocol) -> None:
        """Register render callback for system rendering"""
        self._render_callbacks.append(callback)
    
    def get_state(self) -> Dict[str, Any]:
        """Get current system state"""
        return {
            'system_id': self.config.system_id,
            'system_name': self.config.system_name,
            'status': self.status.value,
            'enabled': self.config.enabled,
            'metrics': {
                'total_updates': self.metrics.total_updates,
                'average_time_ms': self.metrics.average_time,
                'fps': self.metrics.fps,
                'error_count': self.metrics.error_count,
                'last_error': self.metrics.last_error
            },
            'last_update': self._last_update_time
        }
    
    def get_metrics(self) -> SystemMetrics:
        """Get system performance metrics"""
        return self.metrics
    
    def _get_logger(self):
        """Get logger for this system"""
        try:
            from dgt_engine.foundation.utils.logger import get_logger_manager
            return get_logger_manager().get_component_logger(f"system_{self.config.system_id}")
        except Exception:
            import logging
            return logging.getLogger(f"system_{self.config.system_id}")


class BaseComponent(ABC):
    """
    Abstract base class for all DGT Platform components.
    
    Components are smaller building blocks that can be used by systems.
    They follow the same patterns as systems but are simpler.
    """
    
    def __init__(self, component_id: str, component_name: str):
        self.component_id = component_id
        self.component_name = component_name
        self._registry: Optional[DGTRegistry] = None
        self._lock = threading.RLock()
        
        # Auto-register with registry
        self._auto_register()
    
    def _auto_register(self) -> None:
        """Automatically register component with DGTRegistry"""
        try:
            self._registry = DGTRegistry()
            
            component_metadata = {
                'component_type': 'BaseComponent',
                'component_name': self.component_name,
                'component_id': self.component_id,
                'created_at': time.time()
            }
            
            result = self._registry.register(
                f"component_{self.component_id}",
                self,
                RegistryType.COMPONENT,
                component_metadata
            )
            
            if result.success:
                self._get_logger().info(f"✅ Component {self.component_name} auto-registered")
            else:
                self._get_logger().error(f"❌ Component {self.component_name} registration failed: {result.error}")
                
        except Exception as e:
            self._get_logger().error(f"❌ Component {self.component_name} auto-registration error: {e}")
    
    @abstractmethod
    def process(self, input_data: Dict[str, Any]) -> Result[Dict[str, Any]]:
        """
        Process input data and return output.
        
        Args:
            input_data: Input data for processing
            
        Returns:
            Result containing processed output
        """
        pass
    
    def validate_input(self, input_data: Dict[str, Any]) -> Result[None]:
        """
        Validate input data.
        
        Args:
            input_data: Input data to validate
            
        Returns:
            Result indicating validation success
        """
        return Result.success_result(None)
    
    def get_state(self) -> Dict[str, Any]:
        """Get current component state"""
        return {
            'component_id': self.component_id,
            'component_name': self.component_name,
            'created_at': time.time()
        }
    
    def _get_logger(self):
        """Get logger for this component"""
        try:
            from dgt_engine.foundation.utils.logger import get_logger_manager
            return get_logger_manager().get_component_logger(f"component_{self.component_id}")
        except Exception:
            import logging
            return logging.getLogger(f"component_{self.component_id}")


# === EXPORTS ===

__all__ = [
    'SystemStatus',
    'SystemConfig',
    'SystemMetrics',
    'BaseSystem',
    'BaseComponent'
]
