"""
Result Type - Structured Return Values

A generic Result type for returning success/failure with optional values and errors.
Used throughout the engine for error handling and operation results.
"""

from typing import Generic, TypeVar, Optional

T = TypeVar('T')


class Result(Generic[T]):
    """
    Generic result type for operations that can succeed or fail.

    Provides a clean way to return either a value or an error without exceptions.
    """

    def __init__(self, success: bool, value: Optional[T] = None, error: Optional[str] = None):
        """
        Initialize a Result.

        Args:
            success: Whether the operation succeeded
            value: The resulting value (if success=True)
            error: Error message (if success=False)
        """
        self.success = success
        self.value = value
        self.error = error

    def __repr__(self) -> str:
        if self.success:
            return f"Result(success=True, value={self.value})"
        return f"Result(success=False, error={self.error})"

    def __bool__(self) -> bool:
        """Result is truthy if successful"""
        return self.success
