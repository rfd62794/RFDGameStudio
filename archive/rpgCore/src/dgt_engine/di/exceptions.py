"""
Dependency Injection Exception Hierarchy

Phase 1: Interface Definition & Hardening

Custom exceptions for dependency injection system
following the Result[T] pattern.
"""

from typing import Optional, List, Tuple
from foundation.interfaces.protocols import Result


class DIError(Exception):
    """Base exception for dependency injection system"""
    
    def __init__(self, message: str, interface: Optional[type] = None):
        self.interface = interface
        super().__init__(message)
    
    def to_result(self, value_type: type) -> Result:
        """Convert to Result[T] pattern"""
        return Result.failure_result(str(self))


class RegistrationError(DIError):
    """Exception raised when dependency registration fails"""
    
    def __init__(self, interface: type, implementation: type, reason: str):
        self.implementation = implementation
        self.reason = reason
        message = f"Failed to register {implementation.__name__} for {interface.__name__}: {reason}"
        super().__init__(message, interface)


class ResolutionError(DIError):
    """Exception raised when dependency resolution fails"""
    
    def __init__(self, interface: type, reason: str):
        self.reason = reason
        message = f"Failed to resolve {interface.__name__}: {reason}"
        super().__init__(message, interface)


class CircularDependencyError(DIError):
    """Exception raised when circular dependencies are detected"""
    
    def __init__(self, dependency_chain: List[type]):
        self.dependency_chain = dependency_chain
        chain_str = " -> ".join([cls.__name__ for cls in dependency_chain])
        message = f"Circular dependency detected: {chain_str}"
        super().__init__(message)
    
    def get_circular_path(self) -> List[type]:
        """Get the circular dependency path"""
        return self.dependency_chain.copy()


class InitializationError(DIError):
    """Exception raised when component initialization fails"""
    
    def __init__(self, interface: type, reason: str):
        self.reason = reason
        message = f"Failed to initialize {interface.__name__}: {reason}"
        super().__init__(message, interface)


class LifecycleError(DIError):
    """Exception raised during lifecycle management"""
    
    def __init__(self, interface: type, operation: str, reason: str):
        self.operation = operation
        self.reason = reason
        message = f"Failed {operation} for {interface.__name__}: {reason}"
        super().__init__(message, interface)


class ConfigurationError(DIError):
    """Exception raised for configuration issues"""
    
    def __init__(self, reason: str):
        self.reason = reason
        message = f"Configuration error: {reason}"
        super().__init__(message)
