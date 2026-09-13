"""
DGT Graphics FX — Particle & Exhaust Visual Effects

ADR 132: Dithered Explosion Effects
ADR 130: Dynamic Exhaust Particle System

Relocated from engines/body/ during the Kinetic Alignment Sprint
to establish the engines/graphics/ tier boundary.
"""

from .particle_effects import (
    Particle,
    ExplosionType,
    ExplosionEffect,
    ParticleEffectsSystem,
    initialize_particle_effects,
)
from .exhaust_system import (
    ExhaustType,
    ExhaustParticle,
    ExhaustConfig,
    ExhaustEmitter,
    ExhaustSystem,
    initialize_exhaust_system,
)

__all__ = [
    # Particle Effects
    "Particle",
    "ExplosionType",
    "ExplosionEffect",
    "ParticleEffectsSystem",
    "initialize_particle_effects",
    # Exhaust System
    "ExhaustType",
    "ExhaustParticle",
    "ExhaustConfig",
    "ExhaustEmitter",
    "ExhaustSystem",
    "initialize_exhaust_system",
]
