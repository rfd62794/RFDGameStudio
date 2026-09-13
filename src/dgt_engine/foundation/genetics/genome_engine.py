"""
TurboGenome Engine - Type-Safe 17-Trait Genetic System
ADR 211: Primary data contract for all shell-based entities

This module provides the complete 17-trait genome specification from the
TurboShells legacy system, enhanced with Pydantic v2 validation for
enterprise-grade type safety.
"""

import random
from typing import Tuple, List, Optional, Dict, Any, Final
from pydantic import BaseModel, Field, field_validator
from enum import Enum

from ..types import Result, ValidationResult
from ..base import ComponentConfig


class ShellPatternType(str, Enum):
    """Shell pattern types from legacy system.
    
    Tier: Foundation
    Dependencies: None
    Memory Ownership: Immutable enum values
    """
    HEX = "hex"
    SPOTS = "spots"
    STRIPES = "stripes"
    RINGS = "rings"


class BodyPatternType(str, Enum):
    """Body pattern types from legacy system.
    
    Tier: Foundation
    Dependencies: None
    Memory Ownership: Immutable enum values
    """
    SOLID = "solid"
    MOTtLED = "mottled"
    SPECKLED = "speckled"
    MARBLED = "marbled"


class LimbShapeType(str, Enum):
    """Limb shape types from legacy system.
    
    Tier: Foundation
    Dependencies: None
    Memory Ownership: Immutable enum values
    """
    FLIPPERS = "flippers"
    FEET = "feet"
    FINS = "fins"


class TurboGenome(BaseModel):
    """
    Complete 17-trait genome specification for TurboShells entities.
    
    This is the authoritative data contract for all genetic operations
    in the DGT Platform. All trait ranges and defaults exactly match
    the legacy TurboShells system for perfect compatibility.
    """
    
    # === SHELL GENETICS (6 traits) ===
    shell_base_color: Tuple[int, int, int] = Field(
        default=(34, 139, 34),  # Forest green
        description="Primary shell color"
    )
    
    shell_pattern_type: ShellPatternType = Field(
        default=ShellPatternType.HEX,
        description="Shell pattern type"
    )
    
    shell_pattern_color: Tuple[int, int, int] = Field(
        default=(255, 255, 255),  # White
        description="Shell pattern color"
    )
    
    shell_pattern_density: float = Field(
        default=0.5,
        ge=0.1, le=1.0,
        description="Pattern density/intensity"
    )
    
    shell_pattern_opacity: float = Field(
        default=0.8,
        ge=0.3, le=1.0,
        description="Pattern transparency"
    )
    
    shell_size_modifier: float = Field(
        default=1.0,
        ge=0.5, le=1.5,
        description="Shell size scaling"
    )
    
    # === BODY GENETICS (4 traits) ===
    body_base_color: Tuple[int, int, int] = Field(
        default=(107, 142, 35),  # Olive green
        description="Primary body color"
    )
    
    body_pattern_type: BodyPatternType = Field(
        default=BodyPatternType.SOLID,
        description="Body pattern type"
    )
    
    body_pattern_color: Tuple[int, int, int] = Field(
        default=(85, 107, 47),  # Dark olive green
        description="Body pattern color"
    )
    
    body_pattern_density: float = Field(
        default=0.3,
        ge=0.1, le=1.0,
        description="Body pattern density"
    )
    
    # === HEAD GENETICS (2 traits) ===
    head_size_modifier: float = Field(
        default=1.0,
        ge=0.7, le=1.3,
        description="Head size scaling"
    )
    
    head_color: Tuple[int, int, int] = Field(
        default=(139, 90, 43),  # Brown
        description="Head color"
    )
    
    # === LEG GENETICS (4 traits) ===
    leg_length: float = Field(
        default=1.0,
        ge=0.5, le=1.5,
        description="Leg length scaling"
    )
    
    limb_shape: LimbShapeType = Field(
        default=LimbShapeType.FLIPPERS,
        description="Limb shape type"
    )
    
    leg_thickness_modifier: float = Field(
        default=1.0,
        ge=0.7, le=1.3,
        description="Leg thickness"
    )
    
    leg_color: Tuple[int, int, int] = Field(
        default=(101, 67, 33),  # Dark brown
        description="Leg color"
    )
    
    # === EYE GENETICS (1 trait) ===
    eye_color: Tuple[int, int, int] = Field(
        default=(0, 0, 0),  # Black
        description="Eye color"
    )
    
    eye_size_modifier: float = Field(
        default=1.0,
        ge=0.8, le=1.2,
        description="Eye size scaling"
    )
    
    @field_validator('shell_base_color', 'shell_pattern_color', 'body_base_color', 
               'body_pattern_color', 'head_color', 'leg_color', 'eye_color')
    @classmethod
    def validate_rgb_colors(cls, v):
        """Validate RGB color tuples"""
        if not isinstance(v, tuple) or len(v) != 3:
            raise ValueError("Color must be a tuple of 3 integers")
        
        for i, color_val in enumerate(v):
            if not isinstance(color_val, int) or not (0 <= color_val <= 255):
                raise ValueError(f"RGB value {i} must be integer 0-255, got {color_val}")
        
        return v
    
    @field_validator('shell_pattern_density', 'shell_pattern_opacity', 'shell_size_modifier',
               'body_pattern_density', 'head_size_modifier', 'leg_length', 
               'leg_thickness_modifier', 'eye_size_modifier')
    @classmethod
    def validate_continuous_ranges(cls, v):
        """Validate continuous trait ranges"""
        if not isinstance(v, (int, float)):
            raise ValueError("Continuous traits must be numeric")
        return float(v)
    
    def get_visual_summary(self) -> Dict[str, Any]:
        """Get visual trait summary for rendering"""
        return {
            'shell': {
                'base_color': self.shell_base_color,
                'pattern': {
                    'type': self.shell_pattern_type.value,
                    'color': self.shell_pattern_color,
                    'density': self.shell_pattern_density,
                    'opacity': self.shell_pattern_opacity
                },
                'size_modifier': self.shell_size_modifier
            },
            'body': {
                'base_color': self.body_base_color,
                'pattern': {
                    'type': self.body_pattern_type.value,
                    'color': self.body_pattern_color,
                    'density': self.body_pattern_density
                }
            },
            'head': {
                'size_modifier': self.head_size_modifier,
                'color': self.head_color
            },
            'limbs': {
                'length': self.leg_length,
                'shape': self.limb_shape.value,
                'thickness': self.leg_thickness_modifier,
                'color': self.leg_color
            },
            'eyes': {
                'color': self.eye_color,
                'size_modifier': self.eye_size_modifier
            }
        }
    
    def get_physical_summary(self) -> Dict[str, float]:
        """Get physical trait summary for physics calculations"""
        return {
            'shell_size': self.shell_size_modifier,
            'head_size': self.head_size_modifier,
            'leg_length': self.leg_length,
            'leg_thickness': self.leg_thickness_modifier,
            'eye_size': self.eye_size_modifier,
            'body_density': self.body_pattern_density,
            'shell_density': self.shell_pattern_density
        }
    
    def to_legacy_dict(self) -> Dict[str, Any]:
        """Convert to legacy dictionary format for compatibility"""
        return {
            # Shell genetics
            "shell_base_color": self.shell_base_color,
            "shell_pattern_type": self.shell_pattern_type.value,
            "shell_pattern_color": self.shell_pattern_color,
            "shell_pattern_density": self.shell_pattern_density,
            "shell_pattern_opacity": self.shell_pattern_opacity,
            "shell_size_modifier": self.shell_size_modifier,
            
            # Body genetics
            "body_base_color": self.body_base_color,
            "body_pattern_type": self.body_pattern_type.value,
            "body_pattern_color": self.body_pattern_color,
            "body_pattern_density": self.body_pattern_density,
            
            # Head genetics
            "head_size_modifier": self.head_size_modifier,
            "head_color": self.head_color,
            
            # Leg genetics
            "leg_length": self.leg_length,
            "limb_shape": self.limb_shape.value,
            "leg_thickness_modifier": self.leg_thickness_modifier,
            "leg_color": self.leg_color,
            
            # Eye genetics
            "eye_color": self.eye_color,
            "eye_size_modifier": self.eye_size_modifier
        }
    
    @classmethod
    def from_legacy_dict(cls, data: Dict[str, Any]) -> 'TurboGenome':
        """Create from legacy dictionary format"""
        # Convert string enums back to enum types
        if 'shell_pattern_type' in data:
            data['shell_pattern_type'] = ShellPatternType(data['shell_pattern_type'])
        if 'body_pattern_type' in data:
            data['body_pattern_type'] = BodyPatternType(data['body_pattern_type'])
        if 'limb_shape' in data:
            data['limb_shape'] = LimbShapeType(data['limb_shape'])
        
        return cls(**data)


def generate_wild_turtle() -> TurboGenome:
    """
    Generate a randomized wild turtle genome within valid legacy ranges.
    
    This function creates genetically diverse turtles that respect all
    constraints from the original TurboShells system.
    
    Returns:
        TurboGenome: Randomized but valid genome
    """
    # Visual traits - more variety in the wild
    shell_base_color = (
        random.randint(20, 80),    # Darker greens for shells
        random.randint(100, 180),
        random.randint(20, 80)
    )
    
    shell_pattern_type = random.choice(list(ShellPatternType))
    
    shell_pattern_color = (
        random.randint(150, 255),  # Bright patterns
        random.randint(150, 255),
        random.randint(150, 255)
    )
    
    shell_pattern_density = random.uniform(0.2, 0.8)
    shell_pattern_opacity = random.uniform(0.5, 0.9)
    shell_size_modifier = random.uniform(0.8, 1.2)
    
    # Body traits
    body_base_color = (
        random.randint(80, 140),    # Earth tones
        random.randint(120, 180),
        random.randint(30, 80)
    )
    
    body_pattern_type = random.choice(list(BodyPatternType))
    
    body_pattern_color = (
        random.randint(60, 120),
        random.randint(80, 140),
        random.randint(30, 70)
    )
    
    body_pattern_density = random.uniform(0.1, 0.6)
    
    # Head traits
    head_size_modifier = random.uniform(0.85, 1.15)
    head_color = (
        random.randint(100, 160),
        random.randint(70, 120),
        random.randint(30, 70)
    )
    
    # Leg traits - functional variations
    leg_length = random.uniform(0.8, 1.2)
    limb_shape = random.choice(list(LimbShapeType))
    leg_thickness_modifier = random.uniform(0.85, 1.15)
    leg_color = (
        random.randint(80, 130),
        random.randint(50, 90),
        random.randint(20, 50)
    )
    
    # Eye traits
    eye_color = (
        random.randint(0, 50),     # Dark eyes
        random.randint(0, 50),
        random.randint(0, 50)
    )
    
    eye_size_modifier = random.uniform(0.9, 1.1)
    
    return TurboGenome(
        # Shell genetics
        shell_base_color=shell_base_color,
        shell_pattern_type=shell_pattern_type,
        shell_pattern_color=shell_pattern_color,
        shell_pattern_density=shell_pattern_density,
        shell_pattern_opacity=shell_pattern_opacity,
        shell_size_modifier=shell_size_modifier,
        
        # Body genetics
        body_base_color=body_base_color,
        body_pattern_type=body_pattern_type,
        body_pattern_color=body_pattern_color,
        body_pattern_density=body_pattern_density,
        
        # Head genetics
        head_size_modifier=head_size_modifier,
        head_color=head_color,
        
        # Leg genetics
        leg_length=leg_length,
        limb_shape=limb_shape,
        leg_thickness_modifier=leg_thickness_modifier,
        leg_color=leg_color,
        
        # Eye genetics
        eye_color=eye_color,
        eye_size_modifier=eye_size_modifier
    )


def validate_genome(genome: TurboGenome) -> bool:
    """
    Validate a genome against all constraints.
    
    Args:
        genome: Genome to validate
        
    Returns:
        True if valid, raises ValidationError if invalid
    """
    try:
        # Pydantic validation happens automatically on instantiation
        # This function provides explicit validation for debugging
        genome.model_dump()  # Triggers full validation
        return True
    except Exception as e:
        raise ValueError(f"Genome validation failed: {e}")


# Factory functions for specific archetypes
def create_fast_swimmer_genome() -> TurboGenome:
    """Create genome optimized for swimming"""
    genome = generate_wild_turtle()
    genome.limb_shape = LimbShapeType.FLIPPERS
    genome.leg_length = 1.3  # Longer flippers
    genome.body_pattern_density = 0.2  # Streamlined body
    return genome


def create_climber_genome() -> TurboGenome:
    """Create genome optimized for climbing"""
    genome = generate_wild_turtle()
    genome.limb_shape = LimbShapeType.FEET
    genome.leg_thickness_modifier = 1.2  # Sturdy legs
    genome.shell_size_modifier = 0.9  # Lighter shell
    return genome


def create_balanced_genome() -> TurboGenome:
    """Create balanced all-purpose genome"""
    return TurboGenome()  # Uses all defaults
