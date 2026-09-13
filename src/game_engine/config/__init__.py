"""
Configuration Layer (Tier 2C) - Configuration Management

System configuration management with support for multiple formats:
- config_manager: Main configuration loader with YAML/JSON support
- schemas: Pydantic validation schemas for all config types

Features:
- YAML and JSON configuration files
- Environment variable overrides
- Pydantic v2 validation
- Type-safe configuration objects

Depends on: game_engine.core, pydantic
"""

__all__ = []
