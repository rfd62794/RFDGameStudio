"""
Dependency Injection Container

Phase 1: Interface Definition & Hardening

Centralized dependency management with circular dependency detection
and lifecycle management for all components.
"""

from typing import Dict, List, Type, TypeVar, Optional, Any, Set, Tuple
from dataclasses import dataclass
from enum import Enum
import threading
import inspect
from collections import defaultdict, deque

from foundation.interfaces.protocols import Result, DIProtocol
from .exceptions import (
    DIError, RegistrationError, ResolutionError, 
    CircularDependencyError, InitializationError, LifecycleError
)


T = TypeVar('T')


class LifetimeScope(Enum):
    """Dependency lifetime scopes"""
    TRANSIENT = "transient"  # New instance every time
    SINGLETON = "singleton"  # Single instance for container lifetime
    SCOPED = "scoped"       # Single instance per scope


@dataclass
class DependencyRegistration:
    """Registration information for a dependency"""
    interface: Type
    implementation: Type
    lifetime: LifetimeScope
    instance: Optional[Any] = None
    factory: Optional[callable] = None
    dependencies: Optional[List[Type]] = None


class DIScope:
    """Dependency injection scope for scoped lifetimes"""
    
    def __init__(self, container: 'DIContainer'):
        self.container = container
        self._scoped_instances: Dict[Type, Any] = {}
        self._disposed = False
    
    def resolve(self, interface: Type[T]) -> Result[T]:
        """Resolve dependency within scope"""
        if self._disposed:
            return Result.failure_result("Scope has been disposed")
        
        # Check if instance exists in scope
        if interface in self._scoped_instances:
            return Result.success_result(self._scoped_instances[interface])
        
        # Resolve from container
        result = self.container.resolve(interface)
        if not result.success:
            return result
        
        # Store in scope for future use
        self._scoped_instances[interface] = result.value
        return result
    
    def dispose(self) -> Result[None]:
        """Dispose scope and cleanup scoped instances"""
        if self._disposed:
            return Result.success_result(None)
        
        # Dispose all scoped instances
        for instance in self._scoped_instances.values():
            if hasattr(instance, 'shutdown'):
                try:
                    shutdown_result = instance.shutdown()
                    if not shutdown_result.success:
                        # Log error but continue disposal
                        pass
                except Exception:
                    # Log error but continue disposal
                    pass
        
        self._scoped_instances.clear()
        self._disposed = True
        return Result.success_result(None)


class DIContainer(DIProtocol):
    """Dependency injection container with circular dependency detection"""
    
    def __init__(self):
        self._registrations: Dict[Type, DependencyRegistration] = {}
        self._singleton_instances: Dict[Type, Any] = {}
        self._dependency_graph: Dict[Type, List[Type]] = defaultdict(list)
        self._lock = threading.RLock()
        self._initialized = False
        
    def register(self, interface: Type, implementation: Type) -> Result[None]:
        """Register interface to implementation mapping"""
        return self._register_with_lifetime(interface, implementation, LifetimeScope.TRANSIENT)
    
    def register_singleton(self, interface: Type, implementation: Type) -> Result[None]:
        """Register singleton instance"""
        return self._register_with_lifetime(interface, implementation, LifetimeScope.SINGLETON)
    
    def register_scoped(self, interface: Type, implementation: Type) -> Result[None]:
        """Register scoped dependency"""
        return self._register_with_lifetime(interface, implementation, LifetimeScope.SCOPED)
    
    def register_factory(self, interface: Type, factory: callable, lifetime: LifetimeScope = LifetimeScope.TRANSIENT) -> Result[None]:
        """Register factory function for dependency creation"""
        with self._lock:
            if interface in self._registrations:
                return Result.failure_result(f"Interface {interface.__name__} already registered")
            
            # Validate factory signature
            if not callable(factory):
                return Result.failure_result("Factory must be callable")
            
            registration = DependencyRegistration(
                interface=interface,
                implementation=type(None),  # No implementation class for factory
                lifetime=lifetime,
                factory=factory
            )
            
            self._registrations[interface] = registration
            return Result.success_result(None)
    
    def resolve(self, interface: Type[T]) -> Result[T]:
        """Resolve interface to implementation instance"""
        with self._lock:
            return self._resolve_internal(interface, visited=set())
    
    def create_scope(self) -> DIScope:
        """Create new dependency scope"""
        return DIScope(self)
    
    def check_circular_dependencies(self) -> Result[List[Tuple[Type, Type]]]:
        """Check for circular dependencies"""
        with self._lock:
            circular_deps = []
            
            for interface in self._dependency_graph:
                visited = set()
                recursion_stack = set()
                
                if self._has_circular_dependency(
                    interface, visited, recursion_stack, []
                ):
                    # Find the actual circular path
                    path = self._find_circular_path(interface)
                    if len(path) > 1:
                        for i in range(len(path) - 1):
                            circular_deps.append((path[i], path[i + 1]))
            
            return Result.success_result(circular_deps)
    
    def initialize_all(self) -> Result[None]:
        """Initialize all registered dependencies"""
        with self._lock:
            if self._initialized:
                return Result.failure_result("Container already initialized")
            
            # Check for circular dependencies first
            circular_check = self.check_circular_dependencies()
            if circular_check.value and len(circular_check.value) > 0:
                return Result.failure_result(
                    f"Circular dependencies detected: {circular_check.value}"
                )
            
            # Initialize all singleton instances
            for interface, registration in self._registrations.items():
                if registration.lifetime == LifetimeScope.SINGLETON:
                    result = self._resolve_internal(interface, visited=set())
                    if not result.success:
                        return Result.failure_result(
                            f"Failed to initialize singleton {interface.__name__}: {result.error}"
                        )
            
            self._initialized = True
            return Result.success_result(None)
    
    def shutdown(self) -> Result[None]:
        """Shutdown container and dispose all instances"""
        with self._lock:
            # Shutdown all singleton instances
            for instance in self._singleton_instances.values():
                if hasattr(instance, 'shutdown'):
                    try:
                        shutdown_result = instance.shutdown()
                        if not shutdown_result.success:
                            # Log error but continue shutdown
                            pass
                    except Exception:
                        # Log error but continue shutdown
                        pass
            
            # Clear all instances
            self._singleton_instances.clear()
            self._initialized = False
            return Result.success_result(None)
    
    def get_registered_interfaces(self) -> List[Type]:
        """Get list of registered interfaces"""
        with self._lock:
            return list(self._registrations.keys())
    
    def register_singleton(self, interface: Type, implementation: Type) -> Result[None]:
        """Register singleton instance"""
        with self._lock:
            if interface in self._registrations:
                return Result.failure_result(f"Interface {interface.__name__} already registered")
            
            # Validate implementation
            if not inspect.isclass(implementation):
                return Result.failure_result(f"Implementation {implementation} must be a class")
            
            # Check if implementation implements interface (for Protocol types)
            if hasattr(interface, '__origin__'):  # It's a Protocol
                # For protocols, we'll trust the registration at runtime
                pass
            elif not issubclass(implementation, interface):
                return Result.failure_result(
                    f"Implementation {implementation.__name__} does not implement {interface.__name__}"
                )
            
            # Analyze dependencies
            dependencies = self._analyze_dependencies(implementation)
            
            registration = DependencyRegistration(
                interface=interface,
                implementation=implementation,
                lifetime=LifetimeScope.SINGLETON,
                dependencies=dependencies
            )
            
            self._registrations[interface] = registration
            self._dependency_graph[interface] = dependencies
            
            return Result.success_result(None)
    
    def register_viewport_manager(self) -> Result[None]:
        """Register ViewportManager as singleton (ADR 193)"""
        from ..kernel.viewport_manager import ViewportManager
        
        return self.register_singleton(ViewportManager, ViewportManager)
    
    def _resolve_internal(self, interface: Type[T], visited: Set[Type]) -> Result[T]:
        """Internal resolution with circular dependency detection"""
        if interface in visited:
            # Circular dependency detected
            chain = list(visited) + [interface]
            return Result.failure_result(
                f"Circular dependency detected: {' -> '.join(cls.__name__ for cls in chain)}"
            )
        
        if interface not in self._registrations:
            return Result.failure_result(f"No registration for interface {interface.__name__}")
        
        registration = self._registrations[interface]
        
        # Check for existing instances based on lifetime
        if registration.lifetime == LifetimeScope.SINGLETON:
            if interface in self._singleton_instances:
                return Result.success_result(self._singleton_instances[interface])
        
        # Create new instance
        visited.add(interface)
        
        try:
            if registration.factory:
                # Use factory function
                instance = registration.factory()
            else:
                # Create instance with dependency injection
                instance = self._create_instance(registration.implementation, visited)
            
            # Store instance based on lifetime
            if registration.lifetime == LifetimeScope.SINGLETON:
                self._singleton_instances[interface] = instance
            
            return Result.success_result(instance)
            
        except Exception as e:
            return Result.failure_result(f"Failed to resolve {interface.__name__}: {str(e)}")
        
        finally:
            visited.remove(interface)
    
    def _create_instance(self, implementation: Type, visited: Set[Type]) -> Any:
        """Create instance with dependency injection"""
        # Get constructor signature
        sig = inspect.signature(implementation.__init__)
        
        # Resolve constructor parameters
        kwargs = {}
        for param_name, param in sig.parameters.items():
            if param_name == 'self':
                continue
            
            # Try to resolve parameter type
            if param.annotation != inspect.Parameter.empty:
                param_result = self._resolve_internal(param.annotation, visited)
                if param_result.success:
                    kwargs[param_name] = param_result.value
                elif param.default != inspect.Parameter.empty:
                    # Use default value if resolution failed
                    kwargs[param_name] = param.default
                else:
                    raise ResolutionError(param.annotation, f"Cannot resolve dependency {param_name}")
            elif param.default != inspect.Parameter.empty:
                kwargs[param_name] = param.default
        
        return implementation(**kwargs)
    
    def _analyze_dependencies(self, implementation: Type) -> List[Type]:
        """Analyze constructor dependencies of implementation"""
        dependencies = []
        
        try:
            sig = inspect.signature(implementation.__init__)
            for param_name, param in sig.parameters.items():
                if param_name == 'self':
                    continue
                
                if param.annotation != inspect.Parameter.empty:
                    dependencies.append(param.annotation)
        except (ValueError, TypeError):
            # Cannot analyze signature, return empty list
            pass
        
        return dependencies
    
    def _has_circular_dependency(self, interface: Type, visited: Set[Type], recursion_stack: Set[Type], path: List[Type]) -> bool:
        """Check if interface has circular dependencies using DFS"""
        if interface in recursion_stack:
            return True
        
        if interface in visited:
            return False
        
        visited.add(interface)
        recursion_stack.add(interface)
        path.append(interface)
        
        for dependency in self._dependency_graph.get(interface, []):
            if self._has_circular_dependency(dependency, visited, recursion_stack, path):
                return True
        
        recursion_stack.remove(interface)
        path.pop()
        return False
    
    def _find_circular_path(self, start_interface: Type) -> List[Type]:
        """Find the actual circular path starting from interface"""
        visited = {}
        parent = {}
        
        def dfs(interface: Type, path: List[Type]) -> Optional[List[Type]]:
            if interface in path:
                # Found cycle, return the cycle portion
                cycle_start = path.index(interface)
                return path[cycle_start:] + [interface]
            
            if interface in visited:
                return None
            
            visited[interface] = True
            path.append(interface)
            
            for dependency in self._dependency_graph.get(interface, []):
                result = dfs(dependency, path)
                if result:
                    return result
            
            path.pop()
            return None
        
        return dfs(start_interface, []) or []
