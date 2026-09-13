"""
DGT Graphics Engine — Visual Effects & Rendering Pipeline

Tier 2 Engine responsible for all visual output:
  • fx/    — Particle effects, exhaust systems, pixel VFX
  • (future: shaders, sprite compositors, PPU integration)
"""

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .fx.particle_effects import ParticleEffectsSystem
    from .fx.exhaust_system import ExhaustSystem

__all__ = [
    "ParticleEffectsSystem",
    "ExhaustSystem",
]
