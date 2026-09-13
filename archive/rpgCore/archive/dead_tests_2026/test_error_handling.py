"""
Test Error Handling - Comprehensive pytest test suite
ADR 102: Error Handling Component Testing
"""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from typing import Dict, Any

from src.tools.error_handling import (
    AssetIngestorError, FileIOError, ImageProcessingError, ValidationError,
    UIError, ExportError, SystemError, ErrorSeverity, ErrorCategory,
    ErrorRecoveryManager, ErrorHandler, error_boundary, global_error_handler
)
from src.tools.asset_models import ProcessingResult


class TestErrorClasses:
    """Test custom error classes"""
    
    def test_base_asset_ingestor_error(self) -> None:
        """Test base AssetIngestorError"""
        error = AssetIngestorError(
            "Test error",
            ErrorCategory.SYSTEM,
            ErrorSeverity.HIGH,
            {"key": "value"}
        )
        
        assert str(error) == "Test error"
        assert error.category == ErrorCategory.SYSTEM
        assert error.severity == ErrorSeverity.HIGH
        assert error.context == {"key": "value"}
    
    def test_file_io_error(self) -> None:
        """Test FileIOError"""
        file_path = Path("/test/file.png")
        error = FileIOError("File not found", file_path, {"operation": "read"})
        
        assert error.category == ErrorCategory.FILE_IO
        assert error.severity == ErrorSeverity.MEDIUM
        assert error.file_path == file_path
        assert error.context["operation"] == "read"
    
    def test_image_processing_error(self) -> None:
        """Test ImageProcessingError"""
        error = ImageProcessingError("Cannot process image", "resize", {"format": "PNG"})
        
        assert error.category == ErrorCategory.IMAGE_PROCESSING
        assert error.operation == "resize"
        assert error.context["format"] == "PNG"
    
    def test_validation_error(self) -> None:
        """Test ValidationError"""
        error = ValidationError("Invalid field", "asset_id", {"value": "invalid"})
        
        assert error.category == ErrorCategory.VALIDATION
        assert error.field_name == "asset_id"
        assert error.severity == ErrorSeverity.LOW
    
    def test_ui_error(self) -> None:
        """Test UIError"""
        error = UIError("Button click failed", "main_button", {"event": "click"})
        
        assert error.category == ErrorCategory.UI
        assert error.component == "main_button"
    
    def test_export_error(self) -> None:
        """Test ExportError"""
        export_path = Path("/export/assets.yaml")
        error = ExportError("Export failed", export_path, {"format": "YAML"})
        
        assert error.category == ErrorCategory.EXPORT
        assert error.severity == ErrorSeverity.HIGH
        assert error.export_path == export_path
    
    def test_system_error(self) -> None:
        """Test SystemError"""
        error = SystemError("Critical system failure", {"component": "memory"})
        
        assert error.category == ErrorCategory.SYSTEM
        assert error.severity == ErrorSeverity.CRITICAL


class TestErrorBoundary:
    """Test error boundary decorator"""
    
    def test_error_boundary_success(self) -> None:
        """Test error boundary with successful function"""
        @error_boundary(
            category=ErrorCategory.IMAGE_PROCESSING,
            severity=ErrorSeverity.MEDIUM,
            fallback_value="fallback"
        )
        def test_func(x: int) -> int:
            return x * 2
        
        result = test_func(5)
        assert result == 10
    
    def test_error_boundary_with_exception(self) -> None:
        """Test error boundary with exception"""
        @error_boundary(
            category=ErrorCategory.IMAGE_PROCESSING,
            severity=ErrorSeverity.MEDIUM,
            fallback_value="fallback",
            log_errors=False
        )
        def test_func(x: int) -> int:
            raise ValueError("Test error")
        
        result = test_func(5)
        assert result == "fallback"
    
    def test_error_boundary_raise_on_error(self) -> None:
        """Test error boundary with raise_on_error=True"""
        @error_boundary(
            category=ErrorCategory.IMAGE_PROCESSING,
            severity=ErrorSeverity.MEDIUM,
            raise_on_error=True,
            log_errors=False
        )
        def test_func(x: int) -> int:
            raise ValueError("Test error")
        
        with pytest.raises(ImageProcessingError):
            test_func(5)
    
    def test_error_boundary_categories(self) -> None:
        """Test error boundary with different categories"""
        # Test File IO error boundary
        @error_boundary(category=ErrorCategory.FILE_IO, fallback_value=None)
        def file_func():
            raise FileNotFoundError("File not found")
        
        result = file_func()
        assert result is None
        
        # Test Validation error boundary
        @error_boundary(category=ErrorCategory.VALIDATION, fallback_value="default")
        def validation_func():
            raise ValueError("Invalid value")
        
        result = validation_func()
        assert result == "default"


class TestErrorRecoveryManager:
    """Test ErrorRecoveryManager class"""
    
    @pytest.fixture
    def recovery_manager(self) -> ErrorRecoveryManager:
        """Create ErrorRecoveryManager instance"""
        return ErrorRecoveryManager()
    
    def test_recovery_manager_initialization(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test recovery manager initialization"""
        assert len(recovery_manager.recovery_strategies) == 6  # All categories
        assert ErrorCategory.FILE_IO in recovery_manager.recovery_strategies
        assert ErrorCategory.IMAGE_PROCESSING in recovery_manager.recovery_strategies
    
    def test_successful_recovery(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test successful error recovery"""
        error = FileIOError("File not found", Path("/test/file.png"))
        
        # Mock the retry strategy to succeed
        with patch.object(recovery_manager, '_retry_with_different_path', return_value=True):
            result = recovery_manager.attempt_recovery(error)
            assert result is True
    
    def test_failed_recovery(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test failed error recovery"""
        error = FileIOError("File not found", Path("/test/file.png"))
        
        # Mock all strategies to fail
        strategies = recovery_manager.recovery_strategies[ErrorCategory.FILE_IO]
        with patch.object(recovery_manager, '_create_missing_directories', return_value=False):
            with patch.object(recovery_manager, '_fallback_to_temp_directory', return_value=False):
                with patch.object(recovery_manager, '_retry_with_different_path', return_value=False):
                    result = recovery_manager.attempt_recovery(error)
                    assert result is False
    
    def test_create_missing_directories_success(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test successful directory creation"""
        error = FileIOError("File not found", Path("/test/subdir/file.png"))
        
        with patch('pathlib.Path.mkdir') as mock_mkdir:
            result = recovery_manager._create_missing_directories(error, {})
            assert result is True
            mock_mkdir.assert_called_once_with(parents=True, exist_ok=True)
    
    def test_create_missing_directories_failure(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test failed directory creation"""
        error = FileIOError("File not found", Path("/test/file.png"))
        
        with patch('pathlib.Path.mkdir', side_effect=PermissionError("Permission denied")):
            result = recovery_manager._create_missing_directories(error, {})
            assert result is False
    
    def test_fallback_to_temp_directory(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test fallback to temp directory"""
        error = FileIOError("File not found", Path("/test/file.png"))
        
        with patch('pathlib.Path.mkdir') as mock_mkdir:
            result = recovery_manager._fallback_to_temp_directory(error, {})
            assert result is True
    
    def test_unknown_category_recovery(self, recovery_manager: ErrorRecoveryManager) -> None:
        """Test recovery for unknown error category"""
        # Create error with category that has no strategies
        error = AssetIngestorError("Unknown error", ErrorCategory.SYSTEM)
        
        # Remove system strategies for this test
        original_strategies = recovery_manager.recovery_strategies[ErrorCategory.SYSTEM]
        recovery_manager.recovery_strategies[ErrorCategory.SYSTEM] = []
        
        try:
            result = recovery_manager.attempt_recovery(error)
            assert result is False
        finally:
            # Restore strategies
            recovery_manager.recovery_strategies[ErrorCategory.SYSTEM] = original_strategies


class TestErrorHandler:
    """Test ErrorHandler class"""
    
    @pytest.fixture
    def error_handler(self) -> ErrorHandler:
        """Create ErrorHandler instance"""
        return ErrorHandler()
    
    def test_error_handler_initialization(self, error_handler: ErrorHandler) -> None:
        """Test error handler initialization"""
        assert len(error_handler.error_history) == 0
        assert isinstance(error_handler.recovery_manager, ErrorRecoveryManager)
        assert len(error_handler.error_callbacks) == 0
    
    def test_handle_string_error(self, error_handler: ErrorHandler) -> None:
        """Test handling string error"""
        result = error_handler.handle_error(
            "Test error message",
            ErrorCategory.SYSTEM,
            ErrorSeverity.MEDIUM,
            attempt_recovery=False
        )
        
        assert isinstance(result, ProcessingResult)
        assert result.success is False  # No recovery attempted
        assert len(result.errors) == 1
        assert "Test error message" in result.errors[0]
        assert len(error_handler.error_history) == 1
    
    def test_handle_exception_error(self, error_handler: ErrorHandler) -> None:
        """Test handling exception error"""
        exception = ValueError("Test exception")
        
        result = error_handler.handle_error(
            exception,
            ErrorCategory.VALIDATION,
            ErrorSeverity.LOW,
            attempt_recovery=False
        )
        
        assert result.success is False
        assert len(result.errors) == 1
        assert len(error_handler.error_history) == 1
        
        # Check that the error was converted to ValidationError
        stored_error = error_handler.error_history[0]
        assert isinstance(stored_error, ValidationError)
    
    def test_handle_error_with_recovery(self, error_handler: ErrorHandler) -> None:
        """Test handling error with recovery attempt"""
        error = FileIOError("File not found", Path("/test/file.png"))
        
        # Mock recovery to succeed
        with patch.object(error_handler.recovery_manager, 'attempt_recovery', return_value=True):
            result = error_handler.handle_error(
                error,
                attempt_recovery=True
            )
            
            assert result.success is True
            assert len(result.errors) == 0
            assert len(result.warnings) == 1
    
    def test_register_callback(self, error_handler: ErrorHandler) -> None:
        """Test registering error callbacks"""
        callback_called = False
        
        def test_callback(error: AssetIngestorError) -> None:
            nonlocal callback_called
            callback_called = True
        
        error_handler.register_callback(ErrorCategory.FILE_IO, test_callback)
        
        # Trigger error
        error_handler.handle_error(
            "Test error",
            ErrorCategory.FILE_IO,
            attempt_recovery=False
        )
        
        assert callback_called is True
        assert len(error_handler.error_callbacks[ErrorCategory.FILE_IO]) == 1
    
    def test_callback_exception_handling(self, error_handler: ErrorHandler) -> None:
        """Test handling exceptions in callbacks"""
        def failing_callback(error: AssetIngestorError) -> None:
            raise Exception("Callback failed")
        
        error_handler.register_callback(ErrorCategory.FILE_IO, failing_callback)
        
        # Should not raise exception even if callback fails
        result = error_handler.handle_error(
            "Test error",
            ErrorCategory.FILE_IO,
            attempt_recovery=False
        )
        
        assert result.success is False
        assert len(error_handler.error_history) == 1
    
    def test_get_error_summary(self, error_handler: ErrorHandler) -> None:
        """Test getting error summary"""
        # Add some errors
        error_handler.handle_error("Error 1", ErrorCategory.FILE_IO, attempt_recovery=False)
        error_handler.handle_error("Error 2", ErrorCategory.IMAGE_PROCESSING, attempt_recovery=False)
        error_handler.handle_error("Error 3", ErrorCategory.FILE_IO, ErrorSeverity.HIGH, attempt_recovery=False)
        
        summary = error_handler.get_error_summary()
        
        assert summary["total_errors"] == 3
        assert summary["by_category"]["file_io"] == 2
        assert summary["by_category"]["image_processing"] == 1
        assert summary["by_severity"]["medium"] == 2
        assert summary["by_severity"]["high"] == 1
        assert len(summary["recent_errors"]) == 3
    
    def test_clear_error_history(self, error_handler: ErrorHandler) -> None:
        """Test clearing error history"""
        # Add some errors
        error_handler.handle_error("Test error", ErrorCategory.SYSTEM, attempt_recovery=False)
        
        assert len(error_handler.error_history) == 1
        
        error_handler.clear_error_history()
        
        assert len(error_handler.error_history) == 0
    
    def test_convert_exception(self, error_handler: ErrorHandler) -> None:
        """Test exception conversion"""
        # Test generic exception
        generic_error = error_handler._convert_exception(
            ValueError("Test"),
            ErrorCategory.VALIDATION,
            ErrorSeverity.LOW,
            {}
        )
        assert isinstance(generic_error, ValidationError)
        
        # Test specific exception types
        file_error = error_handler._convert_exception(
            FileNotFoundError("File not found"),
            ErrorCategory.FILE_IO,
            ErrorSeverity.MEDIUM,
            {}
        )
        assert isinstance(file_error, FileIOError)


class TestGlobalErrorHandler:
    """Test global error handler"""
    
    def test_global_error_handler_exists(self) -> None:
        """Test that global error handler exists"""
        assert global_error_handler is not None
        assert isinstance(global_error_handler, ErrorHandler)
    
    def test_global_error_handler_usage(self) -> None:
        """Test using global error handler"""
        initial_count = len(global_error_handler.error_history)
        
        result = global_error_handler.handle_error(
            "Global test error",
            ErrorCategory.SYSTEM,
            attempt_recovery=False
        )
        
        assert isinstance(result, ProcessingResult)
        assert len(global_error_handler.error_history) == initial_count + 1


class TestErrorHandlingIntegration:
    """Integration tests for error handling"""
    
    def test_complete_error_handling_workflow(self) -> None:
        """Test complete error handling workflow"""
        handler = ErrorHandler()
        
        # Register callback
        callback_errors = []
        def collect_errors(error: AssetIngestorError) -> None:
            callback_errors.append(str(error))
        
        handler.register_callback(ErrorCategory.FILE_IO, collect_errors)
        
        # Handle multiple errors
        handler.handle_error("File not found", ErrorCategory.FILE_IO, attempt_recovery=False)
        handler.handle_error("Invalid data", ErrorCategory.VALIDATION, attempt_recovery=False)
        handler.handle_error("Export failed", ErrorCategory.EXPORT, ErrorSeverity.HIGH, attempt_recovery=False)
        
        # Check results
        assert len(handler.error_history) == 3
        assert len(callback_errors) == 1  # Only FILE_IO callback triggered
        
        summary = handler.get_error_summary()
        assert summary["total_errors"] == 3
        assert "file_io" in summary["by_category"]
        assert "validation" in summary["by_category"]
        assert "export" in summary["by_category"]
    
    def test_error_boundary_with_recovery_manager(self) -> None:
        """Test error boundary integration with recovery manager"""
        recovery_manager = ErrorRecoveryManager()
        
        # Mock recovery to succeed
        with patch.object(recovery_manager, 'attempt_recovery', return_value=True):
            
            @error_boundary(
                category=ErrorCategory.FILE_IO,
                fallback_value="fallback",
                log_errors=False
            )
            def failing_function():
                raise FileNotFoundError("File not found")
            
            # This should still return fallback since recovery isn't integrated with decorator
            result = failing_function()
            assert result == "fallback"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
