"""
Result Type Pattern - DGT Foundation

Provides Result[T] pattern for consistent error handling across all DGT systems.
Replaces raw exceptions with structured error handling.
"""

from typing import TypeVar, Generic, Optional, Any
from dataclasses import dataclass

T = TypeVar('T')


@dataclass
class Result(Generic[T]):
    """Result type for error handling without exceptions"""
    success: bool
    value: Optional[T] = None
    error: Optional[str] = None
    
    @staticmethod
    def success_result(value: T) -> "Result[T]":
        """Create a successful result"""
        return Result(success=True, value=value, error=None)
    
    @staticmethod
    def failure_result(error: str) -> "Result[T]":
        """Create a failure result"""
        return Result(success=False, value=None, error=error)
    
    def is_success(self) -> bool:
        """Check if result is successful"""
        return self.success
    
    def is_failure(self) -> bool:
        """Check if result is a failure"""
        return not self.success
    
    def get_value_or_default(self, default: T) -> T:
        """Get value or return default if failure"""
        return self.value if self.success else default
    
    def get_error_or_default(self, default: str = "Unknown error") -> str:
        """Get error or return default if success"""
        return self.error if not self.success else default


@dataclass
class ValidationResult(Result[T]):
    """Specialized result for validation operations"""
    
    @staticmethod
    def valid(value: T) -> "ValidationResult[T]":
        """Create a valid result"""
        return ValidationResult(success=True, value=value, error=None)
    
    @staticmethod
    def invalid(error: str) -> "ValidationResult[T]":
        """Create an invalid result"""
        return ValidationResult(success=False, value=None, error=error)
    
    def is_valid(self) -> bool:
        """Check if validation passed"""
        return self.success
    
    def is_invalid(self) -> bool:
        """Check if validation failed"""
        return not self.success
