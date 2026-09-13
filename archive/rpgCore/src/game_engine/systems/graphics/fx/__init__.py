"""
FX System - Particle effects, emitters, and presets

Provides particle-based visual effects including:
- FXSystem: Core particle management with pooling
- ParticleEffects: Pre-configured effect presets
- ExhaustSystem: Specialized trails for entity movement
"""

from .fx_system import (
    FXSystem,
    Particle,
    ParticleEmitter,
    create_default_fx_system,
    create_large_fx_system,
    create_minimal_fx_system,
)

from .particle_effects import (
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
)

from .exhaust_system import (
    ExhaustSystem,
    ExhaustTrail,
    ThrusterType,
    create_default_exhaust_system,
    create_high_intensity_exhaust_system,
    create_minimal_exhaust_system,
)

__all__ = [
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
