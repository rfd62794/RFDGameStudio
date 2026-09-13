"""
Body Systems - Entity Component System (ECS)

Entity management and component-based architecture for game objects.
Includes collision, physics, projectiles, effects, and spawning systems.

Provides:
- EntityManager: Entity lifecycle and component storage
- CollisionSystem: Collision detection and response
- PhysicsSystem: Physics simulation and movement
- ProjectileSystem: Projectile lifetime and impact
- FractureSystem: Object destruction and debris
- WaveSpawner: Enemy/entity wave generation
- StatusManager: Effect and status tracking
- TerrainEngine: Environment interaction
- FXSystem: Particle effects and visual effects
"""

from src.game_engine.systems.body.entity_manager import (
    EntityManager,
    Entity,
    EntityComponent,
    ObjectPool,
    SpaceEntity,
    RPGEntity,
    TycoonEntity,
)
from src.game_engine.systems.body.collision_system import (
    CollisionSystem,
    CollisionInfo,
    CollisionGroup,
    CollisionType,
    create_space_combat_collision_groups,
)
from src.game_engine.systems.body.projectile_system import (
    ProjectileSystem,
    ProjectileStats,
    ProjectileState,
    create_arcade_projectile_system,
    create_rapid_fire_system,
    create_heavy_weapon_system,
)
from src.game_engine.systems.body.status_manager import (
    StatusManager,
    StatusEffect,
    EffectType,
    StackingMode,
    create_damage_buff,
    create_slow_debuff,
    create_poison_dot,
    create_stun_cc,
)
from src.game_engine.systems.body.fracture_system import (
    FractureSystem,
    AsteroidFragment,
    GeneticTraits,
    create_classic_fracture_system,
    create_genetic_fracture_system,
    create_hard_fracture_system,
)
from src.game_engine.systems.body.wave_spawner import (
    WaveSpawner,
    WaveConfig,
    create_arcade_wave_spawner,
    create_survival_wave_spawner,
)

__all__ = [
    # Core ECS
    "EntityManager",
    "Entity",
    "EntityComponent",
    "ObjectPool",
    # Specialized Entities
    "SpaceEntity",
    "RPGEntity",
    "TycoonEntity",
    # Collision System
    "CollisionSystem",
    "CollisionInfo",
    "CollisionGroup",
    "CollisionType",
    "create_space_combat_collision_groups",
    # Projectile System
    "ProjectileSystem",
    "ProjectileStats",
    "ProjectileState",
    "create_arcade_projectile_system",
    "create_rapid_fire_system",
    "create_heavy_weapon_system",
    # Status Manager
    "StatusManager",
    "StatusEffect",
    "EffectType",
    "StackingMode",
    "create_damage_buff",
    "create_slow_debuff",
    "create_poison_dot",
    "create_stun_cc",
    # Fracture System
    "FractureSystem",
    "AsteroidFragment",
    "GeneticTraits",
    "create_classic_fracture_system",
    "create_genetic_fracture_system",
    "create_hard_fracture_system",
    # Wave Spawner
    "WaveSpawner",
    "WaveConfig",
    "create_arcade_wave_spawner",
    "create_survival_wave_spawner",
]
