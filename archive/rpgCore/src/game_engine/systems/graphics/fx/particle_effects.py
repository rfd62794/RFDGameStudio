"""
Particle Effects - Pre-configured Effect Templates

Provides named particle effect presets (explosion, smoke, spark, etc.) that compose
multiple ParticleEmitters into reusable, configurable effects for common scenarios.

Features:
- Effect preset definitions with sensible defaults
- Effect composition (multiple emitters per effect)
- Easy spawning by effect name
- Customizable color, duration, intensity
- Effect templates for common game scenarios
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from src.game_engine.systems.graphics.fx.fx_system import FXSystem, ParticleEmitter
from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


class EffectPreset(Enum):
    """Common particle effect presets"""
    EXPLOSION = "explosion"
    EXPLOSION_LARGE = "explosion_large"
    EXPLOSION_SMALL = "explosion_small"
    SMOKE = "smoke"
    SMOKE_THICK = "smoke_thick"
    SPARK = "spark"
    SPARK_ELECTRIC = "spark_electric"
    FIRE = "fire"
    DUST = "dust"
    BLOOD = "blood"
    FROST = "frost"
    RAIN = "rain"


@dataclass
class ParticleEffect:
    """
    Named effect template composing multiple emitters into a cohesive visual.
    Used to define preset effects that can be instantiated at any position.
    """
    name: str
    emitters: List[ParticleEmitter] = field(default_factory=list)  # Multiple emitters for complex effects
    duration: float = 1.0  # Total effect duration (seconds)
    color: Tuple[int, int, int] = (255, 255, 255)  # Base color override


def create_explosion_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for explosion effect (fast outward burst)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(50 * intensity)
    emitter.velocity_min = 50 * intensity
    emitter.velocity_max = 150 * intensity
    emitter.angle_min = 0
    emitter.angle_max = 360
    emitter.lifetime_min = 0.3
    emitter.lifetime_max = 0.8
    emitter.start_color = (255, 200, 0)  # Orange-yellow
    emitter.end_color = (255, 100, 0)    # Red-orange
    emitter.gravity = 0  # No gravity for explosion blast
    return emitter


def create_smoke_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for smoke effect (rising, expanding)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(30 * intensity)
    emitter.velocity_min = 10 * intensity
    emitter.velocity_max = 30 * intensity
    emitter.angle_min = 60  # Mostly upward
    emitter.angle_max = 120
    emitter.lifetime_min = 1.5
    emitter.lifetime_max = 2.5
    emitter.start_color = (200, 200, 200)  # Light gray
    emitter.end_color = (100, 100, 100)    # Dark gray
    emitter.gravity = -5  # Negative = rise upward
    return emitter


def create_spark_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for spark effect (bright, scattered)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(40 * intensity)
    emitter.velocity_min = 30 * intensity
    emitter.velocity_max = 100 * intensity
    emitter.angle_min = 0
    emitter.angle_max = 360
    emitter.lifetime_min = 0.2
    emitter.lifetime_max = 0.6
    emitter.start_color = (255, 255, 100)  # Bright yellow
    emitter.end_color = (255, 150, 0)      # Orange
    emitter.gravity = 50  # Gravity pulls sparks down
    return emitter


def create_electric_spark_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for electric spark effect (sharp, cyan-blue)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(20 * intensity)
    emitter.velocity_min = 50 * intensity
    emitter.velocity_max = 120 * intensity
    emitter.angle_min = 0
    emitter.angle_max = 360
    emitter.lifetime_min = 0.15
    emitter.lifetime_max = 0.4
    emitter.start_color = (0, 200, 255)    # Cyan
    emitter.end_color = (0, 100, 200)      # Blue
    emitter.gravity = 30
    return emitter


def create_fire_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for fire effect (upward, yellow-red)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(35 * intensity)
    emitter.velocity_min = 20 * intensity
    emitter.velocity_max = 60 * intensity
    emitter.angle_min = 75   # Mostly upward
    emitter.angle_max = 105
    emitter.lifetime_min = 0.4
    emitter.lifetime_max = 1.0
    emitter.start_color = (255, 255, 0)    # Yellow
    emitter.end_color = (255, 0, 0)        # Red
    emitter.gravity = -10  # Rise upward
    return emitter


def create_dust_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for dust effect (slow, brownish)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(25 * intensity)
    emitter.velocity_min = 5 * intensity
    emitter.velocity_max = 20 * intensity
    emitter.angle_min = 0
    emitter.angle_max = 360
    emitter.lifetime_min = 0.8
    emitter.lifetime_max = 1.5
    emitter.start_color = (180, 160, 100)  # Tan
    emitter.end_color = (100, 90, 60)      # Brown
    emitter.gravity = 5  # Slow fall
    return emitter


def create_blood_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for blood splatter effect"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(20 * intensity)
    emitter.velocity_min = 30 * intensity
    emitter.velocity_max = 80 * intensity
    emitter.angle_min = 0
    emitter.angle_max = 360
    emitter.lifetime_min = 0.5
    emitter.lifetime_max = 1.2
    emitter.start_color = (200, 0, 0)      # Red
    emitter.end_color = (80, 0, 0)         # Dark red
    emitter.gravity = 50  # Heavy, falls quickly
    return emitter


def create_frost_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for frost/ice effect (cool, crystalline)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(30 * intensity)
    emitter.velocity_min = 20 * intensity
    emitter.velocity_max = 70 * intensity
    emitter.angle_min = 0
    emitter.angle_max = 360
    emitter.lifetime_min = 0.6
    emitter.lifetime_max = 1.2
    emitter.start_color = (100, 200, 255)  # Light blue
    emitter.end_color = (0, 150, 255)      # Cyan
    emitter.gravity = 20
    return emitter


def create_rain_emitter(intensity: float = 1.0) -> ParticleEmitter:
    """Create emitter for rain effect (downward, light blue)"""
    emitter = ParticleEmitter()
    emitter.particle_count = int(50 * intensity)
    emitter.velocity_min = 30 * intensity
    emitter.velocity_max = 50 * intensity
    emitter.angle_min = 250  # Mostly downward
    emitter.angle_max = 290
    emitter.lifetime_min = 1.0
    emitter.lifetime_max = 2.0
    emitter.start_color = (150, 180, 255)  # Light blue
    emitter.end_color = (100, 150, 200)    # Darker blue
    emitter.gravity = 100  # Heavy rain
    return emitter


# Pre-configured effect templates
PRESET_EFFECTS: Dict[EffectPreset, ParticleEffect] = {
    EffectPreset.EXPLOSION: ParticleEffect(
        name="explosion",
        emitters=[create_explosion_emitter(1.0)],
        duration=0.8
    ),
    EffectPreset.EXPLOSION_LARGE: ParticleEffect(
        name="explosion_large",
        emitters=[create_explosion_emitter(2.0)],
        duration=1.0
    ),
    EffectPreset.EXPLOSION_SMALL: ParticleEffect(
        name="explosion_small",
        emitters=[create_explosion_emitter(0.5)],
        duration=0.5
    ),
    EffectPreset.SMOKE: ParticleEffect(
        name="smoke",
        emitters=[create_smoke_emitter(1.0)],
        duration=2.0
    ),
    EffectPreset.SMOKE_THICK: ParticleEffect(
        name="smoke_thick",
        emitters=[create_smoke_emitter(2.0)],
        duration=3.0
    ),
    EffectPreset.SPARK: ParticleEffect(
        name="spark",
        emitters=[create_spark_emitter(1.0)],
        duration=0.6
    ),
    EffectPreset.SPARK_ELECTRIC: ParticleEffect(
        name="spark_electric",
        emitters=[create_electric_spark_emitter(1.0)],
        duration=0.4
    ),
    EffectPreset.FIRE: ParticleEffect(
        name="fire",
        emitters=[create_fire_emitter(1.0)],
        duration=1.0
    ),
    EffectPreset.DUST: ParticleEffect(
        name="dust",
        emitters=[create_dust_emitter(1.0)],
        duration=1.5
    ),
    EffectPreset.BLOOD: ParticleEffect(
        name="blood",
        emitters=[create_blood_emitter(1.0)],
        duration=1.2
    ),
    EffectPreset.FROST: ParticleEffect(
        name="frost",
        emitters=[create_frost_emitter(1.0)],
        duration=1.2
    ),
    EffectPreset.RAIN: ParticleEffect(
        name="rain",
        emitters=[create_rain_emitter(1.0)],
        duration=2.0
    ),
}


def get_preset_effect(preset: EffectPreset) -> ParticleEffect:
    """Get a copy of a preset effect (safe for modification)"""
    original = PRESET_EFFECTS[preset]
    new_emitters = [_copy_emitter(e) for e in original.emitters]
    return ParticleEffect(
        name=original.name,
        emitters=new_emitters,
        duration=original.duration,
        color=original.color
    )


def _copy_emitter(emitter: ParticleEmitter) -> ParticleEmitter:
    """Create a copy of an emitter (shallow copy of configuration)"""
    new_emitter = ParticleEmitter()
    new_emitter.particle_count = emitter.particle_count
    new_emitter.velocity_min = emitter.velocity_min
    new_emitter.velocity_max = emitter.velocity_max
    new_emitter.angle_min = emitter.angle_min
    new_emitter.angle_max = emitter.angle_max
    new_emitter.lifetime_min = emitter.lifetime_min
    new_emitter.lifetime_max = emitter.lifetime_max
    new_emitter.start_color = emitter.start_color
    new_emitter.end_color = emitter.end_color
    new_emitter.gravity = emitter.gravity
    return new_emitter
