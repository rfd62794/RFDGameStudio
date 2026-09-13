# DGT Autonomous Movie System - Production Enhancements

This directory contains production-ready enhancements for the DGT Autonomous Movie System, designed specifically for the West Palm Beach Hub deployment.

## Overview

The production enhancements provide enterprise-grade capabilities including:

- **Configuration Management**: Environment-based configuration with validation
- **Error Recovery**: Robust error handling and graceful degradation
- **Performance Monitoring**: Real-time metrics collection and alerting
- **Enhanced Testing**: Comprehensive test coverage for edge cases
- **Deployment Automation**: Automated packaging and deployment scripts

## Architecture

### Configuration Management (`src/config/config_manager.py`)

**Purpose**: Centralized configuration management with environment detection and validation.

**Key Features**:
- Environment-based configuration (development, testing, staging, production)
- Environment variable overrides
- Pydantic validation for type safety
- Configuration file loading with fallback to defaults
- Validation of configuration parameters

**Usage**:
```python
from src.config.config_manager import initialize_config, get_config

# Initialize configuration system
config = initialize_config("config/production.json")

# Get configuration throughout application
fps = get_config().performance.target_fps
```

**Environment Variables**:
- `DGT_ENV`: Environment type (development/testing/staging/production)
- `DGT_DEBUG`: Enable debug mode (true/false)
- `DGT_TARGET_FPS`: Target FPS setting
- `DGT_LOG_LEVEL`: Logging level
- `DGT_ASSETS_PATH`: Assets directory path

### Error Recovery (`src/core/error_recovery.py`)

**Purpose**: Comprehensive error handling with recovery strategies and graceful degradation.

**Key Features**:
- Error classification by severity and component
- Recovery strategies for different error types
- Circuit breaker pattern for failing operations
- Graceful degradation of non-critical components
- Emergency state saving and recovery

**Error Types Handled**:
- Connection errors (retry with backoff)
- Memory errors (garbage collection + degradation)
- Timeout errors (timeout adjustment)
- File errors (directory creation + alternative paths)
- Import errors (component degradation)

**Usage**:
```python
from src.core.error_recovery import handle_error_with_context

try:
    # Risky operation
    result = perform_operation()
except Exception as e:
    action = handle_error_with_context(
        e, "world_engine", "generate_world", 
        turn_count=10, frame_count=600
    )
```

### Performance Monitoring (`src/core/performance_monitor.py`)

**Purpose**: Real-time performance tracking, metrics collection, and alerting.

**Key Features**:
- Metrics collection (counters, gauges, histograms, timers)
- Performance alerts with configurable thresholds
- System resource monitoring (CPU, memory)
- Performance snapshots and reports
- Metrics export functionality

**Metrics Tracked**:
- System: CPU usage, memory usage
- Performance: FPS, frame time, turn processing time
- Game: Turn count, entity count, world deltas
- Operations: Pathfinding duration, rendering duration

**Alerts**:
- High CPU usage (>80%)
- High memory usage (>512MB)
- Low FPS (<30)
- High frame time (>50ms)
- Slow turn processing (>100ms)

**Usage**:
```python
from src.core.performance_monitor import get_performance_monitor, time_operation

monitor = get_performance_monitor()

# Manual timing
monitor.record_frame_start()
# ... frame processing ...
monitor.record_frame_end()

# Decorator timing
@time_operation("pathfinding.duration")
def find_path(start, end):
    # Pathfinding logic
    pass
```

### Enhanced Testing (`tests/test_production_enhancements.py`)

**Purpose**: Comprehensive test coverage for production enhancements and edge cases.

**Test Categories**:
- Configuration management validation
- Error recovery scenarios
- Performance monitoring accuracy
- Integration scenarios
- Edge cases and boundary conditions
- Performance benchmarks

**Key Test Scenarios**:
- Memory pressure handling
- FPS degradation recovery
- Cascading failure management
- Configuration change handling
- Concurrent metric access
- Extreme value handling

**Running Tests**:
```bash
# Run production enhancement tests
python -m pytest tests/test_production_enhancements.py -v

# Run with coverage
python -m pytest tests/test_production_enhancements.py --cov=src --cov-report=html
```

### Deployment Automation (`tools/deploy.py`)

**Purpose**: Automated package creation and deployment for West Palm Beach Hub.

**Features**:
- Dependency validation
- Project structure verification
- Package creation (source, Docker, installer)
- Configuration generation
- Startup script creation
- Deployment manifest generation

**Deployment Process**:
1. Validation of dependencies and structure
2. Backup of previous deployment
3. Package building (source archive, Docker image)
4. Configuration and script generation
5. Deployment report generation

**Usage**:
```bash
# Basic deployment
python tools/deploy.py --environment production --hub west-palm-beach

# Custom deployment
python tools/deploy.py \
    --environment production \
    --version 1.2.0 \
    --hub west-palm-beach \
    --deployment-id "wpb-001" \
    --include-tests
```

## Integration with Existing System

### Main Heartbeat Integration

The production enhancements integrate seamlessly with the existing Four-Pillar Architecture:

```python
# In src/main.py
from src.config.config_manager import initialize_config
from src.core.error_recovery import initialize_error_recovery
from src.core.performance_monitor import initialize_performance_monitoring

class MainHeartbeat:
    def __init__(self):
        # Initialize production systems
        self.config = initialize_config()
        self.error_recovery = initialize_error_recovery()
        self.monitor = initialize_performance_monitoring(self.config.monitoring.enabled)
        
        # Initialize pillars as before
        # ...
    
    def run(self):
        while self.running:
            try:
                # Frame timing
                self.monitor.record_frame_start()
                
                # Existing heartbeat logic
                # ...
                
                # Frame completion
                self.monitor.record_frame_end()
                
            except Exception as e:
                # Error recovery
                action = self.error_recovery.handle_error_with_context(
                    e, "main_heartbeat", "run_loop", 
                    self.state.turn_count, self.frame_count
                )
                
                if action == RecoveryAction.SHUTDOWN:
                    break
```

### Configuration Integration

Each pillar can access configuration:

```python
from src.config.config_manager import get_config

config = get_config()

# World Engine
world_size = config.world.world_size

# DD Engine  
movement_range = config.performance.movement_range

# Graphics Engine
resolution = config.rendering.resolution

# Performance Monitor
target_fps = config.performance.target_fps
```

### Error Recovery Integration

Components can handle errors gracefully:

```python
from src.core.error_recovery import get_error_recovery

recovery = get_error_recovery()

try:
    # Component operation
    pass
except Exception as e:
    context = ErrorContext("component_name", "operation", turn, frame)
    recovery.handle_error(e, context)
```

## Production Deployment Guide

### Environment Setup

1. **System Requirements**:
   - Python 3.12+
   - 512MB+ RAM
   - 2+ CPU cores
   - 500MB+ disk space

2. **Installation**:
   ```bash
   # Extract deployment package
   tar -xzf dgt-autonomous-movie-1.0.0.tar.gz
   cd dgt-autonomous-movie-1.0.0
   
   # Run startup script
   ./start_dgt.sh  # Linux/macOS
   start_dgt.bat   # Windows
   ```

3. **Configuration**:
   - Edit `config/production.json` for custom settings
   - Set environment variables as needed
   - Verify asset paths and permissions

### Monitoring and Maintenance

1. **Performance Monitoring**:
   - Check logs for performance alerts
   - Monitor memory usage and FPS
   - Review metrics exports periodically

2. **Error Handling**:
   - Monitor error recovery metrics
   - Check for degraded components
   - Review circuit breaker status

3. **Updates and Maintenance**:
   - Use deployment script for updates
   - Backup configuration before upgrades
   - Test in staging environment first

### Troubleshooting

**Common Issues**:

1. **High Memory Usage**:
   - Check for memory leaks in monitoring
   - Verify degradation is working
   - Consider reducing entity count

2. **Low FPS**:
   - Check performance alerts
   - Verify target FPS configuration
   - Monitor system resources

3. **Frequent Errors**:
   - Review error recovery logs
   - Check circuit breaker status
   - Verify component health

**Log Locations**:
- Application logs: `dgt_*.log`
- Deployment logs: `deployment_*.log`
- Performance metrics: `metrics_export_*.json`

## Best Practices

### Configuration Management
- Use environment-specific configuration files
- Validate all configuration parameters
- Document configuration changes
- Use environment variables for secrets

### Error Recovery
- Implement graceful degradation for non-critical components
- Monitor error recovery metrics
- Test error scenarios regularly
- Keep emergency backup procedures updated

### Performance Monitoring
- Set appropriate alert thresholds
- Monitor trends over time
- Export metrics for analysis
- Adjust monitoring parameters based on usage

### Deployment
- Test deployments in staging first
- Backup before updates
- Use automated deployment scripts
- Document deployment procedures

## Future Enhancements

### Planned Improvements
1. **Web Dashboard**: Real-time monitoring interface
2. **Auto-scaling**: Dynamic resource allocation
3. **Distributed Deployment**: Multi-node support
4. **Advanced Analytics**: Performance trend analysis
5. **Automated Recovery**: Self-healing capabilities

### Integration Opportunities
1. **Container Orchestration**: Kubernetes deployment
2. **Monitoring Integration**: Prometheus/Grafana
3. **Log Aggregation**: ELK stack integration
4. **CI/CD Pipeline**: Automated testing and deployment

## Support

For West Palm Beach Hub specific support:
- Check deployment documentation
- Review error recovery logs
- Monitor performance metrics
- Contact deployment team for assistance

This production enhancement system ensures the DGT Autonomous Movie System operates reliably in production environments with proper monitoring, error handling, and maintenance capabilities.
