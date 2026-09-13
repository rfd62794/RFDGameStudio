"""
DGT Platform - Dependency Injection Container

Phase 1: Interface Definition & Hardening

Centralized dependency management with circular dependency detection
and lifecycle management for all components.
"""

from .container import DIContainer
from .exceptions import DIError, CircularDependencyError, RegistrationError

__all__ = [
    "DIContainer",
    "DIError", 
    "CircularDependencyError",
    "RegistrationError",
]
