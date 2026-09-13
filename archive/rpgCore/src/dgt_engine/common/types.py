"""
Common Types - Shared type definitions

Breaks circular dependencies by providing commonly used types
that can be imported from anywhere in the system.
"""

from typing import Optional, TypeVar
from dataclasses import dataclass
from enum import Enum


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
        return cls(success=True, value=value)
    
    @classmethod
    def failure_result(cls, error: str, validation: Optional[ValidationResult] = None) -> 'Result[T]':
        return cls(success=False, error=error, validation_result=validation)
