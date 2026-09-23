"""
Graphics Systems - Rendering and Visualization

Multi-modal rendering pipeline supporting various display modes and backends.

Provides:
- PixelRenderer: Low-resolution pixel art rendering with Unicode blocks
- TileBank: Game Boy-style 8x8 tile patterns and bank switching
- FXSystem: Particle emitter with pooling
- ParticleEffects: Explosion and effect templates
- ExhaustSystem: Engine trails and engine-type variations
- ColorPalette: Shared color utilities
"""

# Phase D Step 6 Graphics Systems
from .pixel_renderer import (
    PixelRenderer,
    Pixel,
    SpriteFrame,
    AnimatedSprite,
    BlockType,
    create_default_pixel_renderer,
    create_high_res_pixel_renderer,
    create_ultra_res_pixel_renderer,
)

from .tile_bank import (
    TileBank,
    TilePattern,
    TileType,
    create_default_tile_bank,
    create_large_tile_bank,
    create_minimal_tile_bank,
)

from .fx import (
    FXSystem,
    Particle,
    ParticleEmitter,
    create_default_fx_system,
    create_large_fx_system,
    create_minimal_fx_system,
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
    ExhaustSystem,
    ExhaustTrail,
    ThrusterType,
    create_default_exhaust_system,
    create_high_intensity_exhaust_system,
    create_minimal_exhaust_system,
)

__all__ = [
    # PixelRenderer classes
    'PixelRenderer',
    'Pixel',
    'SpriteFrame',
    'AnimatedSprite',
    'BlockType',
    # PixelRenderer factories
    'create_default_pixel_renderer',
    'create_high_res_pixel_renderer',
    'create_ultra_res_pixel_renderer',
    # TileBank classes
    'TileBank',
    'TilePattern',
    'TileType',
    # TileBank factories
    'create_default_tile_bank',
    'create_large_tile_bank',
    'create_minimal_tile_bank',
    # FXSystem classes
    'FXSystem',
    'Particle',
    'ParticleEmitter',
    # FXSystem factories
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
    # ExhaustSystem classes
    'ExhaustSystem',
    'ExhaustTrail',
    'ThrusterType',
    # ExhaustSystem factories
    'create_default_exhaust_system',
    'create_high_intensity_exhaust_system',
    'create_minimal_exhaust_system',
]
