"""
Enhanced integration tests for edge cases and failure scenarios in DGT Autonomous Movie System

Comprehensive test suite covering error conditions, performance degradation, and recovery scenarios.
"""

import pytest
import time
import json
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path
from typing import Dict, Any

from loguru import logger

# Import the core components
from src.config.config_manager import DGTConfig, ConfigManager, EnvironmentType
from src.core.error_recovery import ErrorRecoverySystem, ErrorContext, RecoveryAction, ErrorSeverity
from src.core.performance_monitor import PerformanceMonitor, MetricsCollector, AlertManager


class TestConfigurationManagement:
    """Test configuration management system"""
    
    def test_default_configuration(self):
        """Test default configuration loading"""
        config = DGTConfig()
        
        assert config.environment == EnvironmentType.DEVELOPMENT
        assert config.performance.target_fps == 60
        assert config.performance.intent_cooldown_ms == 10
        assert config.rendering.resolution == (160, 144)
        assert config.persistence.enabled == True
    
    def test_environment_detection(self):
        """Test environment detection from environment variables"""
        with patch.dict('os.environ', {'DGT_ENV': 'production'}):
            manager = ConfigManager()
            assert manager._environment == EnvironmentType.PRODUCTION
        
        with patch.dict('os.environ', {'DGT_ENV': 'testing'}):
            manager = ConfigManager()
            assert manager._environment == EnvironmentType.TESTING
        
        with patch.dict('os.environ', {}, clear=True):
            manager = ConfigManager()
            assert manager._environment == EnvironmentType.DEVELOPMENT
    
    def test_environment_overrides(self):
        """Test environment variable overrides"""
        with patch.dict('os.environ', {
            'DGT_DEBUG': 'true',
            'DGT_TARGET_FPS': '30',
            'DGT_LOG_LEVEL': 'ERROR'
        }):
            manager = ConfigManager()
            config = manager.config
            
            assert config.debug == True
            assert config.performance.target_fps == 30
            assert config.log_level == 'ERROR'
    
    def test_configuration_validation(self):
        """Test configuration validation"""
        # Valid configuration
        config = DGTConfig()
        issues = ConfigManager().validate_configuration()
        assert isinstance(issues, list)
        
        # Invalid configuration
        with pytest.raises(ValueError):
            DGTConfig(performance={"target_fps": -1})
        
        with pytest.raises(ValueError):
            DGTConfig(environment="invalid_env")
    
    def test_configuration_file_loading(self):
        """Test loading configuration from file"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            config_data = {
                "environment": "production",
                "debug": False,
                "performance": {
                    "target_fps": 45,
                    "intent_cooldown_ms": 15
                }
            }
            json.dump(config_data, f)
            config_file = f.name
        
        try:
            manager = ConfigManager(config_file)
            config = manager.config
            
            assert config.environment == EnvironmentType.PRODUCTION
            assert config.debug == False
            assert config.performance.target_fps == 45
            assert config.performance.intent_cooldown_ms == 15
        finally:
            Path(config_file).unlink()


class TestErrorRecoverySystem:
    """Test error recovery and graceful degradation"""
    
    def setup_method(self):
        """Setup test environment"""
        self.recovery_system = ErrorRecoverySystem(max_recovery_attempts=3)
    
    def test_error_recording(self):
        """Test error recording and context"""
        error = ValueError("Test error")
        context = ErrorContext(
            component="test_component",
            operation="test_operation",
            turn_count=10,
            frame_count=600
        )
        
        action = self.recovery_system.handle_error(error, context)
        
        assert len(self.recovery_system.error_history) == 1
        assert self.recovery_system.error_history[0].error_type == "ValueError"
        assert self.recovery_system.error_history[0].context.component == "test_component"
        assert self.recovery_system.metrics.total_errors == 1
    
    def test_severity_determination(self):
        """Test error severity determination"""
        # Critical error
        critical_error = MemoryError("Out of memory")
        critical_context = ErrorContext("dd_engine", "process_intent", 10, 600)
        record = self.recovery_system._record_error(critical_error, critical_context)
        assert record.severity == ErrorSeverity.CRITICAL
        
        # Low severity error
        low_error = ValueError("Invalid value")
        low_context = ErrorContext("graphics", "render_frame", 10, 600)
        record = self.recovery_system._record_error(low_error, low_context)
        assert record.severity == ErrorSeverity.MEDIUM
    
    def test_recovery_strategies(self):
        """Test specific recovery strategies"""
        # Connection error recovery
        connection_error = ConnectionError("Connection failed")
        context = ErrorContext("world_engine", "generate_world", 0, 0)
        
        action = self.recovery_system.handle_error(connection_error, context)
        assert action == RecoveryAction.RETRY
        
        # Memory error recovery
        memory_error = MemoryError("Out of memory")
        action = self.recovery_system.handle_error(memory_error, context)
        assert action in [RecoveryAction.SHUTDOWN, RecoveryAction.RESET]
    
    def test_graceful_degradation(self):
        """Test graceful degradation functionality"""
        degradation = self.recovery_system.degradation
        
        # Test degradable components
        assert degradation.can_degrade("graphics") == True
        assert degradation.can_degrade("chronicler") == True
        assert degradation.can_degrade("dd_engine") == False  # Critical component
        
        # Test degradation
        success = degradation.degrade_component("graphics", level=2)
        assert success == True
        assert degradation.degradation_level == 2
        assert "graphics" in degradation.degraded_features
        
        # Test restoration
        success = degradation.restore_component("graphics")
        assert success == True
        assert "graphics" not in degradation.degraded_features
    
    def test_circuit_breaker(self):
        """Test circuit breaker functionality"""
        # Initially closed
        assert self.recovery_system._is_circuit_breaker_open("pathfinding") == False
        
        # Simulate failures
        for i in range(3):
            self.recovery_system._update_circuit_breaker("pathfinding", False)
        
        # Should be open now
        assert self.recovery_system._is_circuit_breaker_open("pathfinding") == True
        
        # Wait for timeout and test reset
        with patch('time.time', return_value=time.time() + 400):  # Beyond timeout
            assert self.recovery_system._is_circuit_breaker_open("pathfinding") == False
    
    def test_health_report(self):
        """Test health report generation"""
        # Add some errors
        error = ValueError("Test error")
        context = ErrorContext("test", "test", 1, 60)
        self.recovery_system.handle_error(error, context)
        
        report = self.recovery_system.get_health_report()
        
        assert "error_recovery" in report
        assert "degradation" in report
        assert "circuit_breakers" in report
        assert "status" in report
        assert report["error_recovery"]["total_errors"] == 1


class TestPerformanceMonitoring:
    """Test performance monitoring system"""
    
    def setup_method(self):
        """Setup test environment"""
        self.monitor = PerformanceMonitor(enabled=True)
    
    def teardown_method(self):
        """Cleanup test environment"""
        self.monitor.stop()
    
    def test_metrics_collection(self):
        """Test metrics collection functionality"""
        collector = self.monitor.metrics
        
        # Test counter
        collector.increment_counter("test_counter", 5.0)
        assert collector.counters["test_counter"] == 5.0
        
        # Test gauge
        collector.set_gauge("test_gauge", 42.0)
        assert collector.gauges["test_gauge"] == 42.0
        
        # Test histogram
        collector.add_histogram_value("test_histogram", 10.0)
        collector.add_histogram_value("test_histogram", 20.0)
        assert len(collector.histograms["test_histogram"]) == 2
        
        # Test timer
        collector.record_timer("test_timer", 100.0)
        assert len(collector.timers["test_timer"]) == 1
    
    def test_metric_history_and_summaries(self):
        """Test metric history and summary generation"""
        collector = self.monitor.metrics
        
        # Add some data points
        for i in range(10):
            collector.set_gauge("test_metric", float(i))
            time.sleep(0.01)  # Small delay for different timestamps
        
        # Test history
        history = collector.get_metric_history("test_metric")
        assert len(history) == 10
        
        # Test summary
        summary = collector.get_metric_summary("test_metric")
        assert summary["count"] == 10
        assert summary["min"] == 0.0
        assert summary["max"] == 9.0
        assert "trend" in summary
    
    def test_alert_system(self):
        """Test alert system functionality"""
        alert_manager = self.monitor.alerts
        collector = self.monitor.metrics
        
        # Add a custom alert
        from src.core.performance_monitor import Alert, AlertLevel
        test_alert = Alert(
            name="test_alert",
            metric_name="test_metric",
            condition="gt",
            threshold=5.0,
            level=AlertLevel.WARNING,
            message="Test metric exceeded threshold"
        )
        alert_manager.add_alert(test_alert)
        
        # Trigger the alert
        collector.set_gauge("test_metric", 10.0)
        triggered = alert_manager.check_alerts(collector)
        
        assert len(triggered) == 1
        assert triggered[0]["name"] == "test_alert"
        assert triggered[0]["value"] == 10.0
    
    def test_performance_snapshots(self):
        """Test performance snapshot generation"""
        # Record some performance data
        self.monitor.record_frame_start()
        time.sleep(0.016)  # Simulate frame time
        self.monitor.record_frame_end()
        
        self.monitor.increment_turn_count()
        self.monitor.record_entity_count(5)
        self.monitor.record_world_deltas(3)
        
        snapshot = self.monitor.get_performance_snapshot()
        
        assert snapshot.turn_count == 1
        assert snapshot.entities_count == 5
        assert snapshot.world_deltas_count == 3
        assert snapshot.fps >= 0  # Should be calculated
    
    def test_performance_report(self):
        """Test comprehensive performance report"""
        # Add some performance data
        for i in range(5):
            self.monitor.record_frame_start()
            time.sleep(0.016)
            self.monitor.record_frame_end()
            self.monitor.increment_turn_count()
        
        report = self.monitor.get_performance_report()
        
        assert "snapshot" in report
        assert "metrics" in report
        assert "alerts" in report
        assert "status" in report
        assert report["snapshot"]["turn_count"] == 5
    
    def test_metrics_export(self):
        """Test metrics export functionality"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            export_file = f.name
        
        try:
            # Add some data
            self.monitor.increment_turn_count()
            self.monitor.record_entity_count(3)
            
            # Export metrics
            self.monitor.export_metrics(export_file)
            
            # Verify export
            with open(export_file, 'r') as f:
                exported_data = json.load(f)
            
            assert "snapshot" in exported_data
            assert "metrics" in exported_data
            assert exported_data["snapshot"]["turn_count"] == 1
            
        finally:
            Path(export_file).unlink()


class TestIntegrationScenarios:
    """Integration tests for complex scenarios"""
    
    def test_memory_pressure_scenario(self):
        """Test system behavior under memory pressure"""
        recovery = ErrorRecoverySystem()
        monitor = PerformanceMonitor(enabled=True)
        
        # Simulate memory error
        memory_error = MemoryError("Cannot allocate memory")
        context = ErrorContext("graphics", "render_frame", 100, 6000)
        
        action = recovery.handle_error(memory_error, context)
        
        # Should trigger degradation
        assert recovery.degradation.degradation_level > 0
        assert "graphics" in recovery.degradation.degraded_features
        
        # Verify recovery metrics
        assert recovery.metrics.critical_errors == 1
    
    def test_fps_degradation_scenario(self):
        """Test performance degradation when FPS drops"""
        monitor = PerformanceMonitor(enabled=True)
        
        # Simulate low FPS
        for i in range(10):
            monitor.record_frame_start()
            time.sleep(0.05)  # 20 FPS
            monitor.record_frame_end()
        
        # Check for alerts
        triggered = monitor.alerts.check_alerts(monitor.metrics)
        
        # Should trigger low FPS alert
        fps_alerts = [a for a in triggered if "fps" in a["metric"]]
        assert len(fps_alerts) > 0
    
    def test_cascading_failure_scenario(self):
        """Test handling of cascading failures"""
        recovery = ErrorRecoverySystem()
        
        # Simulate multiple component failures
        components = ["graphics", "chronicler", "pathfinding"]
        
        for component in components:
            error = RuntimeError(f"{component} component failed")
            context = ErrorContext(component, "process", 50, 3000)
            recovery.handle_error(error, context)
        
        # Verify degradation
        assert recovery.degradation.degradation_level >= 2
        
        # Verify circuit breakers
        assert any(recovery._is_circuit_breaker_open(comp) for comp in components)
    
    def test_recovery_after_error(self):
        """Test system recovery after errors are resolved"""
        recovery = ErrorRecoverySystem()
        
        # Simulate error and recovery
        error = ValueError("Temporary error")
        context = ErrorContext("test_component", "test_operation", 10, 600)
        
        # First failure
        action1 = recovery.handle_error(error, context)
        assert recovery.metrics.total_errors == 1
        
        # Simulate successful retry
        with patch.object(recovery, '_execute_recovery_strategy', return_value=True):
            action2 = recovery.handle_error(error, context)
            assert recovery.metrics.recovered_errors >= 1
    
    def test_configuration_change_scenario(self):
        """Test system behavior with configuration changes"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            initial_config = {
                "environment": "development",
                "performance": {"target_fps": 60}
            }
            json.dump(initial_config, f)
            config_file = f.name
        
        try:
            # Load initial config
            manager = ConfigManager(config_file)
            config1 = manager.config
            assert config1.performance.target_fps == 60
            
            # Update config file
            updated_config = {
                "environment": "production",
                "performance": {"target_fps": 30}
            }
            with open(config_file, 'w') as f:
                json.dump(updated_config, f)
            
            # Reload config
            manager2 = ConfigManager(config_file)
            config2 = manager2.config
            assert config2.performance.target_fps == 30
            assert config2.environment == EnvironmentType.PRODUCTION
            
        finally:
            Path(config_file).unlink()


class TestEdgeCases:
    """Test edge cases and boundary conditions"""
    
    def test_zero_fps_handling(self):
        """Test handling of zero FPS scenarios"""
        monitor = PerformanceMonitor(enabled=True)
        
        # Simulate zero FPS (very long frame times)
        monitor.record_frame_start()
        time.sleep(0.2)  # 200ms frame time = 5 FPS
        monitor.record_frame_end()
        
        snapshot = monitor.get_performance_snapshot()
        assert snapshot.fps >= 0  # Should not be negative
        
        # Should trigger alerts
        triggered = monitor.alerts.check_alerts(monitor.metrics)
        assert len(triggered) > 0
    
    def test_extreme_turn_counts(self):
        """Test handling of extreme turn counts"""
        monitor = PerformanceMonitor(enabled=True)
        
        # Simulate very high turn count
        for i in range(10000):
            monitor.increment_turn_count()
        
        snapshot = monitor.get_performance_snapshot()
        assert snapshot.turn_count == 10000
    
    def test_empty_metrics_handling(self):
        """Test handling of empty metrics"""
        collector = MetricsCollector()
        
        # Test empty metric summary
        summary = collector.get_metric_summary("nonexistent_metric")
        assert summary["count"] == 0
        
        # Test empty history
        history = collector.get_metric_history("nonexistent_metric")
        assert len(history) == 0
    
    def test_concurrent_metric_access(self):
        """Test thread safety of metrics collection"""
        import threading
        
        collector = MetricsCollector()
        errors = []
        
        def collect_metrics():
            try:
                for i in range(100):
                    collector.increment_counter("concurrent_test")
                    collector.set_gauge("concurrent_gauge", i)
            except Exception as e:
                errors.append(e)
        
        # Run multiple threads
        threads = [threading.Thread(target=collect_metrics) for _ in range(5)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        
        # Verify no errors occurred
        assert len(errors) == 0
        assert collector.counters["concurrent_test"] == 500


# Performance benchmarks
class TestPerformanceBenchmarks:
    """Performance benchmarks for critical components"""
    
    def test_metrics_collection_performance(self):
        """Benchmark metrics collection performance"""
        collector = MetricsCollector()
        
        # Benchmark counter operations
        start_time = time.time()
        for i in range(10000):
            collector.increment_counter("benchmark_counter")
        counter_time = time.time() - start_time
        
        # Benchmark gauge operations
        start_time = time.time()
        for i in range(10000):
            collector.set_gauge("benchmark_gauge", i)
        gauge_time = time.time() - start_time
        
        # Verify performance (should be very fast)
        assert counter_time < 1.0  # Less than 1 second for 10k operations
        assert gauge_time < 1.0
    
    def test_error_recovery_performance(self):
        """Benchmark error recovery performance"""
        recovery = ErrorRecoverySystem()
        error = ValueError("Benchmark error")
        context = ErrorContext("test", "test", 1, 60)
        
        # Benchmark error handling
        start_time = time.time()
        for i in range(1000):
            recovery.handle_error(error, context)
        recovery_time = time.time() - start_time
        
        # Should handle errors quickly
        assert recovery_time < 2.0  # Less than 2 seconds for 1k errors
        assert recovery.metrics.total_errors == 1000


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
