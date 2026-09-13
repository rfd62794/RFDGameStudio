"""
Utils Module - The Plumbing

Utility modules that support the core system:
- Persistence: Delta-based state management with compression
- Logger: Centralized logging with Loguru and Rich
- Asset Loader: Minimal stub for asset management
- Performance Monitor: Real-time frame timing

Lazy-loading __init__: submodules are only imported when their
symbols are actually accessed, preventing cascading dependency
failures (e.g. asset_loader pulling get_environment at import time).
"""

# ---------------------------------------------------------------------------
# Lazy-import registry
# ---------------------------------------------------------------------------

_PERSISTENCE_EXPORTS = {
    "PersistenceManager", "PersistenceMetadata", "PersistenceManagerFactory",
}

_LOGGER_EXPORTS = {
    "LoggerManager",
    "get_logger_manager", "initialize_logging",
    "get_game_logger", "get_world_logger", "get_mind_logger",
    "get_body_logger", "get_actor_logger", "get_narrative_logger",
    "get_performance_logger", "get_persistence_logger",
    "log_performance", "log_error_with_context", "get_log_stats",
    "log_function_calls", "log_performance_metrics",
}

_ASSET_EXPORTS = {
    "AssetLoader", "ObjectRegistry", "AssetDefinition",
}

_PERF_EXPORTS = {
    "PerformanceMonitor", "PerformanceStats", "FrameMetrics",
    "PerformanceAlert",
    "get_performance_monitor", "initialize_performance_monitor",
    "cleanup_performance_monitor",
}

__all__ = sorted(
    _PERSISTENCE_EXPORTS | _LOGGER_EXPORTS | _ASSET_EXPORTS | _PERF_EXPORTS
)


def __getattr__(name: str):
    """Lazy-load submodule symbols on first access."""
    if name in _PERSISTENCE_EXPORTS:
        from . import persistence as _mod
        return getattr(_mod, name)

    if name in _LOGGER_EXPORTS:
        from . import logger as _mod
        return getattr(_mod, name)

    if name in _ASSET_EXPORTS:
        from . import asset_loader as _mod
        return getattr(_mod, name)

    if name in _PERF_EXPORTS:
        from . import performance_monitor as _mod
        return getattr(_mod, name)

    raise AttributeError(f"module 'foundation.utils' has no attribute {name!r}")
