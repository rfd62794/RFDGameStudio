"""
Collision System Backward Compatibility Shim (DEPRECATED)

This module provides compatibility for old imports from the original location.
Use new imports from game_engine.systems.body instead.

Old: from dgt_engine.systems.body.systems.collision import CollisionSystem
New: from game_engine.systems.body import CollisionSystem
"""

from game_engine.systems.body import (
    CollisionSystem,
    CollisionInfo,
    CollisionGroup,
    CollisionType,
    create_space_combat_collision_groups,
)

__all__ = [
    'CollisionSystem',
    'CollisionInfo',
    'CollisionGroup',
    'CollisionType',
    'create_space_combat_collision_groups',
]
