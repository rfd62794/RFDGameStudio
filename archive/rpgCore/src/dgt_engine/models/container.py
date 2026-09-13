"""
Dependency Injection Container for loose coupling.

Provides centralized dependency management with factory patterns
and lifecycle management. Follows Dependency Inversion Principle.
"""

from typing import Dict, Any, Optional, Type, TypeVar, Callable, Union
from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
import threading
from contextlib import contextmanager

from loguru import logger

T = TypeVar('T')


class LifetimeScope(Enum):
    """Dependency lifetime scopes."""
    SINGLETON = "singleton"
    TRANSIENT = "transient"
    SCOPED = "scoped"


@dataclass
class ServiceDescriptor:
    """Service registration descriptor."""
    service_type: Type
    implementation_type: Optional[Type] = None
    factory: Optional[Callable] = None
    instance: Optional[Any] = None
    lifetime: LifetimeScope = LifetimeScope.TRANSIENT
    dependencies: Optional[Dict[str, Type]] = None


class DIContainer:
    """
    Dependency injection container with lifetime management.
    
    Provides centralized dependency resolution with support for
    singletons, transients, and scoped services.
    """
    
    def __init__(self, name: str = "default"):
        self.name = name
        self._services: Dict[str, ServiceDescriptor] = {}
        self._singletons: Dict[str, Any] = {}
        self._scoped_instances: Dict[str, Any] = {}
        self._lock = threading.RLock()
        
        logger.debug(f"📦 DIContainer '{name}' initialized")
    
    def register_singleton(
        self, 
        service_type: Type[T], 
        implementation_type: Optional[Type[T]] = None,
        factory: Optional[Callable[[], T]] = None,
        instance: Optional[T] = None
    ) -> 'DIContainer':
        """
        Register a singleton service.
        
        Args:
            service_type: Service interface type
            implementation_type: Implementation class
            factory: Factory function
            instance: Pre-created instance
            
        Returns:
            Self for method chaining
        """
        return self._register(
            service_type=service_type,
            implementation_type=implementation_type,
            factory=factory,
            instance=instance,
            lifetime=LifetimeScope.SINGLETON
        )
    
    def register_transient(
        self,
        service_type: Type[T],
        implementation_type: Optional[Type[T]] = None,
        factory: Optional[Callable[[], T]] = None
    ) -> 'DIContainer':
        """
        Register a transient service.
        
        Args:
            service_type: Service interface type
            implementation_type: Implementation class
            factory: Factory function
            
        Returns:
            Self for method chaining
        """
        return self._register(
            service_type=service_type,
            implementation_type=implementation_type,
            factory=factory,
            instance=None,
            lifetime=LifetimeScope.TRANSIENT
        )
    
    def register_scoped(
        self,
        service_type: Type[T],
        implementation_type: Optional[Type[T]] = None,
        factory: Optional[Callable[[], T]] = None
    ) -> 'DIContainer':
        """
        Register a scoped service.
        
        Args:
            service_type: Service interface type
            implementation_type: Implementation class
            factory: Factory function
            
        Returns:
            Self for method chaining
        """
        return self._register(
            service_type=service_type,
            implementation_type=implementation_type,
            factory=factory,
            instance=None,
            lifetime=LifetimeScope.SCOPED
        )
    
    def resolve(self, service_type: Type[T]) -> T:
        """
        Resolve a service instance.
        
        Args:
            service_type: Service type to resolve
            
        Returns:
            Service instance
            
        Raises:
            ValueError: If service is not registered
        """
        service_name = service_type.__name__
        
        with self._lock:
            if service_name not in self._services:
                raise ValueError(f"Service {service_name} not registered")
            
            descriptor = self._services[service_name]
            
            # Handle singleton
            if descriptor.lifetime == LifetimeScope.SINGLETON:
                if service_name in self._singletons:
                    return self._singletons[service_name]
                
                instance = self._create_instance(descriptor)
                self._singletons[service_name] = instance
                return instance
            
            # Handle scoped
            elif descriptor.lifetime == LifetimeScope.SCOPED:
                if service_name in self._scoped_instances:
                    return self._scoped_instances[service_name]
                
                instance = self._create_instance(descriptor)
                self._scoped_instances[service_name] = instance
                return instance
            
            # Handle transient
            else:
                return self._create_instance(descriptor)
    
    def is_registered(self, service_type: Type) -> bool:
        """Check if a service is registered."""
        return service_type.__name__ in self._services
    
    def clear_scope(self) -> None:
        """Clear all scoped instances."""
        with self._lock:
            for service_name, instance in self._scoped_instances.items():
                if hasattr(instance, 'cleanup'):
                    try:
                        instance.cleanup()
                    except Exception as e:
                        logger.error(f"❌ Failed to cleanup scoped service {service_name}: {e}")
            
            self._scoped_instances.clear()
            logger.debug("🧹 Scoped instances cleared")
    
    def dispose(self) -> None:
        """Dispose all singleton instances and clear container."""
        with self._lock:
            # Cleanup singletons
            for service_name, instance in self._singletons.items():
                if hasattr(instance, 'cleanup'):
                    try:
                        instance.cleanup()
                    except Exception as e:
                        logger.error(f"❌ Failed to cleanup singleton {service_name}: {e}")
            
            # Cleanup scoped instances
            self.clear_scope()
            
            # Clear all
            self._singletons.clear()
            self._services.clear()
            
            logger.info(f"🗑️ DIContainer '{self.name}' disposed")
    
    @contextmanager
    def create_scope(self):
        """Create a scoped context for scoped services."""
        try:
            yield
        finally:
            self.clear_scope()
    
    def _register(
        self,
        service_type: Type[T],
        implementation_type: Optional[Type[T]],
        factory: Optional[Callable[[], T]],
        instance: Optional[T],
        lifetime: LifetimeScope
    ) -> 'DIContainer':
        """Internal registration method."""
        service_name = service_type.__name__
        
        # Validate registration parameters
        if sum(bool(x) for x in [implementation_type, factory, instance]) != 1:
            raise ValueError(
                f"Must provide exactly one of: implementation_type, factory, or instance"
            )
        
        # For singleton with instance, store it immediately
        if lifetime == LifetimeScope.SINGLETON and instance is not None:
            self._singletons[service_name] = instance
        
        descriptor = ServiceDescriptor(
            service_type=service_type,
            implementation_type=implementation_type,
            factory=factory,
            instance=instance,
            lifetime=lifetime
        )
        
        with self._lock:
            self._services[service_name] = descriptor
            logger.debug(f"📝 Registered {service_name} as {lifetime.value}")
        
        return self
    
    def _create_instance(self, descriptor: ServiceDescriptor) -> Any:
        """Create service instance based on registration."""
        try:
            if descriptor.instance:
                return descriptor.instance
            
            elif descriptor.factory:
                return descriptor.factory()
            
            elif descriptor.implementation_type:
                # Try to resolve constructor dependencies
                return self._create_with_dependencies(descriptor.implementation_type)
            
            else:
                raise ValueError("No valid creation method found")
                
        except Exception as e:
            logger.error(f"❌ Failed to create instance of {descriptor.service_type.__name__}: {e}")
            raise
    
    def _create_with_dependencies(self, implementation_type: Type) -> Any:
        """Create instance with dependency injection."""
        # Simple implementation - could be enhanced with inspect module
        # for automatic constructor parameter resolution
        try:
            return implementation_type()
        except TypeError as e:
            if "required positional argument" in str(e):
                logger.warning(f"⚠️ Constructor dependencies not auto-resolved for {implementation_type.__name__}")
            raise


class ContainerBuilder:
    """Builder pattern for configuring DI container."""
    
    def __init__(self, name: str = "default"):
        self.container = DIContainer(name)
        self._configurations: List[Callable[[DIContainer], None]] = []
    
    def add_singleton(
        self,
        service_type: Type[T],
        implementation_type: Optional[Type[T]] = None,
        factory: Optional[Callable[[], T]] = None,
        instance: Optional[T] = None
    ) -> 'ContainerBuilder':
        """Add singleton service registration."""
        self.container.register_singleton(service_type, implementation_type, factory, instance)
        return self
    
    def add_transient(
        self,
        service_type: Type[T],
        implementation_type: Optional[Type[T]] = None,
        factory: Optional[Callable[[], T]] = None
    ) -> 'ContainerBuilder':
        """Add transient service registration."""
        self.container.register_transient(service_type, implementation_type, factory)
        return self
    
    def add_scoped(
        self,
        service_type: Type[T],
        implementation_type: Optional[Type[T]] = None,
        factory: Optional[Callable[[], T]] = None
    ) -> 'ContainerBuilder':
        """Add scoped service registration."""
        self.container.register_scoped(service_type, implementation_type, factory)
        return self
    
    def configure(self, configuration: Callable[[DIContainer], None]) -> 'ContainerBuilder':
        """Add configuration action."""
        self._configurations.append(configuration)
        return self
    
    def build(self) -> DIContainer:
        """Build the configured container."""
        # Apply all configurations
        for config in self._configurations:
            config(self.container)
        
        logger.info(f"🏗️ DIContainer '{self.container.name}' built with {len(self.container._services)} services")
        return self.container


# Global container registry
class ContainerRegistry:
    """Registry for multiple DI containers."""
    
    _containers: Dict[str, DIContainer] = {}
    _lock = threading.RLock()
    
    @classmethod
    def register(cls, name: str, container: DIContainer) -> None:
        """Register a container."""
        with cls._lock:
            cls._containers[name] = container
            logger.debug(f"📋 Container '{name}' registered")
    
    @classmethod
    def get(cls, name: str) -> Optional[DIContainer]:
        """Get a registered container."""
        with cls._lock:
            return cls._containers.get(name)
    
    @classmethod
    def dispose_all(cls) -> None:
        """Dispose all registered containers."""
        with cls._lock:
            for name, container in cls._containers.items():
                container.dispose()
            cls._containers.clear()
            logger.info("🗑️ All containers disposed")
