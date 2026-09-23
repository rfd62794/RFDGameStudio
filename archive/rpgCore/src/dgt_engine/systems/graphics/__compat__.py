"""
Backward Compatibility Shim - Graphics Systems

This module provides backward compatibility for old import paths.
All old imports are redirected to the new game_engine structure.

DEPRECATED: Use `from game_engine.systems.graphics import ...` instead

Example:
    # Old (deprecated):
    from dgt_engine.systems.graphics import PixelRenderer

    # New (preferred):
    from game_engine.systems.graphics import PixelRenderer
"""

# Re-export all graphics systems from new location
from game_engine.systems.graphics import (
    # PixelRenderer
    PixelRenderer,
    Pixel,
    SpriteFrame,
    AnimatedSprite,
    BlockType,
    create_default_pixel_renderer,
    create_high_res_pixel_renderer,
    create_ultra_res_pixel_renderer,
    # TileBank
    TileBank,
    TilePattern,
    TileType,
    create_default_tile_bank,
    create_large_tile_bank,
    create_minimal_tile_bank,
    # FXSystem
    FXSystem,
    Particle,
    ParticleEmitter,
    create_default_fx_system,
    create_large_fx_system,
    create_minimal_fx_system,
    # ParticleEffects
    ParticleEffect,
    EffectPreset,
    get_preset_effect,
    PRESET_EFFECTS,
    create_explosion_emitter,
    create_smoke_emitter,
    create_spark_emitter,
    create_electric_spark_emitter,
    create_fire_emitter,
    create_dust_emitter,
    create_blood_emitter,
    create_frost_emitter,
    create_rain_emitter,
    # ExhaustSystem
    ExhaustSystem,
    ExhaustTrail,
    ThrusterType,
    create_default_exhaust_system,
    create_high_intensity_exhaust_system,
    create_minimal_exhaust_system,
)

__all__ = [
    # PixelRenderer
    'PixelRenderer',
    'Pixel',
    'SpriteFrame',
    'AnimatedSprite',
    'BlockType',
    'create_default_pixel_renderer',
    'create_high_res_pixel_renderer',
    'create_ultra_res_pixel_renderer',
    # TileBank
    'TileBank',
    'TilePattern',
    'TileType',
    'create_default_tile_bank',
    'create_large_tile_bank',
    'create_minimal_tile_bank',
    # FXSystem
    'FXSystem',
    'Particle',
    'ParticleEmitter',
    'create_default_fx_system',
    'create_large_fx_system',
    'create_minimal_fx_system',
    # ParticleEffects
    'ParticleEffect',
    'EffectPreset',
    'get_preset_effect',
    'PRESET_EFFECTS',
    'create_explosion_emitter',
    'create_smoke_emitter',
    'create_spark_emitter',
    'create_electric_spark_emitter',
    'create_fire_emitter',
    'create_dust_emitter',
    'create_blood_emitter',
    'create_frost_emitter',
    'create_rain_emitter',
    # ExhaustSystem
    'ExhaustSystem',
    'ExhaustTrail',
    'ThrusterType',
    'create_default_exhaust_system',
    'create_high_intensity_exhaust_system',
    'create_minimal_exhaust_system',
]
