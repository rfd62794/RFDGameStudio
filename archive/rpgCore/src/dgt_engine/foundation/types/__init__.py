"""
Foundation Types Package - DGT Tier 1 Architecture

Core type definitions for the DGT platform.
Provides Result[T] pattern and fundamental data structures.
"""

from .result import Result, ValidationResult
from .race import (
    TerrainType, TurtleStatus, TerrainSegment, TurtleState,
    RaceConfig, RaceSnapshot, RaceResult,
    create_default_race_config, create_turtle_state, create_race_snapshot,
    validate_race_config, validate_turtle_state, validate_race_snapshot
)

__all__ = [
    'Result',
    'ValidationResult',
    'TerrainType',
    'TurtleStatus', 
    'TerrainSegment',
    'TurtleState',
    'RaceConfig',
    'RaceSnapshot',
    'RaceResult',
    'create_default_race_config',
    'create_turtle_state',
    'create_race_snapshot',
    'validate_race_config',
    'validate_turtle_state',
    'validate_race_snapshot'
]
