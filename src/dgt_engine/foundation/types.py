"""
DGT Foundation Types - Tier 1 System Foundation

ADR 198: Foundation Import Strategy

Centralized type definitions that eliminate circular dependencies
and provide a stable foundation for the entire DGT Platform.

These types are imported from dgt_core.foundation.types throughout
the system to ensure consistent error handling and validation patterns.
"""

from typing import Optional, TypeVar
from dataclasses import dataclass
from enum import Enum


# Generic type variables
T = TypeVar('T')


class ValidationResult(Enum):
    """Standard validation result enumeration"""
    VALID = "valid"
    INVALID_POSITION = "invalid_position"
    INVALID_PATH = "invalid_path"
    OBSTRUCTED = "obstructed"
    OUT_OF_RANGE = "out_of_range"
    RULE_VIOLATION = "rule_violation"
    SYSTEM_ERROR = "system_error"


@dataclass
class Result[T]:
    """Standard Result[T] pattern for error handling"""
    success: bool
    value: Optional[T] = None
    error: Optional[str] = None
    validation_result: Optional[ValidationResult] = None
    
    @classmethod
    def success_result(cls, value: T) -> 'Result[T]':
        """Create a successful result"""
        return cls(success=True, value=value)
    
    @classmethod
    def failure_result(cls, error: str, validation: Optional[ValidationResult] = None) -> 'Result[T]':
        """Create a failure result"""
        return cls(success=False, error=error, validation_result=validation)


# Export all foundation types
__all__ = [
    'TypeVar',
    'ValidationResult', 
    'Result'
]
