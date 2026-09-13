"""
Genetic Schema Foundation - DGT Tier 1 Architecture

Transplanted from TurboShells gene_definitions.py with Pydantic v2 hardening.
17-trait genetic system with strict type validation for RGB, continuous, and discrete values.

This is the "Genetic Anchor" - the immutable foundation that all turtle systems depend on.
"""

from typing import Tuple, Union, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from enum import Enum


class GeneType(str, Enum):
    """Gene type enumeration for type safety"""
    RGB = "rgb"
    DISCRETE = "discrete"
    CONTINUOUS = "continuous"


class PatternType(str, Enum):
    """Shell pattern types"""
    HEX = "hex"
    SPOTS = "spots"
    STRIPES = "stripes"
    RINGS = "rings"


class BodyPatternType(str, Enum):
    """Body pattern types"""
    SOLID = "solid"
    MOTtLED = "mottled"
    SPECKLED = "speckled"
    MARBLED = "marbled"


class LimbShape(str, Enum):
    """Limb shape types"""
    FLIPPERS = "flippers"
    FEET = "feet"
    FINS = "fins"


class RGBColor(BaseModel):
    """RGB color with validation"""
    r: int = Field(ge=0, le=255, description="Red channel (0-255)")
    g: int = Field(ge=0, le=255, description="Green channel (0-255)")
    b: int = Field(ge=0, le=255, description="Blue channel (0-255)")
    
    def to_tuple(self) -> Tuple[int, int, int]:
        """Convert to tuple for compatibility"""
        return (self.r, self.g, self.b)
    
    @classmethod
    def from_tuple(cls, color: Tuple[int, int, int]) -> "RGBColor":
        """Create from tuple for compatibility"""
        return cls(r=color[0], g=color[1], b=color[2])


class ContinuousGene(BaseModel):
    """Continuous gene value with range validation"""
    value: float = Field(description="Continuous gene value")
    min_val: float = Field(description="Minimum valid value")
    max_val: float = Field(description="Maximum valid value")
    
    @field_validator('value', mode='before')
    @classmethod
    def validate_range(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate value is within range"""
        if 'min_val' in values and 'max_val' in values:
            if not (values['min_val'] <= v <= values['max_val']):
                raise ValueError(f"Value {v} not in range [{values['min_val']}, {values['max_val']}]")
        return v


class TurboGenome(BaseModel):
    """
    Complete 17-trait turtle genome with Pydantic v2 validation.
    
    This is the core data structure that represents a turtle's genetic makeup.
    All 17 traits are validated according to their type constraints.
    """
    
    # Shell Genetics (6 traits)
    shell_base_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((34, 139, 34)),
        description="Primary shell color (RGB)"
    )
    shell_pattern_type: PatternType = Field(
        default=PatternType.HEX,
        description="Shell pattern type"
    )
    shell_pattern_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((255, 255, 255)),
        description="Shell pattern color (RGB)"
    )
    pattern_color: RGBColor = Field(  # Alias for renderer compatibility
        default_factory=lambda: RGBColor.from_tuple((255, 255, 255)),
        description="Pattern color (used by renderer)"
    )
    shell_pattern_density: float = Field(
        default=0.5, ge=0.1, le=1.0,
        description="Pattern density/intensity (0.1-1.0)"
    )
    shell_pattern_opacity: float = Field(
        default=0.8, ge=0.3, le=1.0,
        description="Pattern transparency (0.3-1.0)"
    )
    shell_size_modifier: float = Field(
        default=1.0, ge=0.5, le=1.5,
        description="Shell size scaling (0.5-1.5)"
    )
    
    # Body Genetics (4 traits)
    body_base_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((107, 142, 35)),
        description="Primary body color (RGB)"
    )
    body_pattern_type: BodyPatternType = Field(
        default=BodyPatternType.SOLID,
        description="Body pattern type"
    )
    body_pattern_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((85, 107, 47)),
        description="Body pattern color (RGB)"
    )
    body_pattern_density: float = Field(
        default=0.3, ge=0.1, le=1.0,
        description="Body pattern density (0.1-1.0)"
    )
    
    # Head Genetics (2 traits)
    head_size_modifier: float = Field(
        default=1.0, ge=0.7, le=1.3,
        description="Head size scaling (0.7-1.3)"
    )
    head_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((139, 90, 43)),
        description="Head color (RGB)"
    )
    
    # Leg Genetics (4 traits)
    leg_length: float = Field(
        default=1.0, ge=0.5, le=1.5,
        description="Leg length scaling (0.5-1.5)"
    )
    limb_shape: LimbShape = Field(
        default=LimbShape.FLIPPERS,
        description="Limb shape type"
    )
    leg_thickness_modifier: float = Field(
        default=1.0, ge=0.7, le=1.3,
        description="Leg thickness (0.7-1.3)"
    )
    leg_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((101, 67, 33)),
        description="Leg color (RGB)"
    )
    
    # Eye Genetics (2 traits)
    eye_color: RGBColor = Field(
        default_factory=lambda: RGBColor.from_tuple((0, 0, 0)),
        description="Eye color (RGB)"
    )
    eye_size_modifier: float = Field(
        default=1.0, ge=0.8, le=1.2,
        description="Eye size scaling (0.8-1.2)"
    )
    
    @model_validator(mode='after')
    def validate_pattern_color_consistency(self) -> "TurboGenome":
        """Ensure pattern_color and shell_pattern_color stay consistent"""
        if self.pattern_color.to_tuple() != self.shell_pattern_color.to_tuple():
            # Auto-sync for renderer compatibility
            self.pattern_color = self.shell_pattern_color
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for legacy compatibility"""
        return {
            'shell_base_color': self.shell_base_color.to_tuple(),
            'shell_pattern_type': self.shell_pattern_type.value,
            'shell_pattern_color': self.shell_pattern_color.to_tuple(),
            'pattern_color': self.pattern_color.to_tuple(),
            'shell_pattern_density': self.shell_pattern_density,
            'shell_pattern_opacity': self.shell_pattern_opacity,
            'shell_size_modifier': self.shell_size_modifier,
            'body_base_color': self.body_base_color.to_tuple(),
            'body_pattern_type': self.body_pattern_type.value,
            'body_pattern_color': self.body_pattern_color.to_tuple(),
            'body_pattern_density': self.body_pattern_density,
            'head_size_modifier': self.head_size_modifier,
            'head_color': self.head_color.to_tuple(),
            'leg_length': self.leg_length,
            'limb_shape': self.limb_shape.value,
            'leg_thickness_modifier': self.leg_thickness_modifier,
            'leg_color': self.leg_color.to_tuple(),
            'eye_color': self.eye_color.to_tuple(),
            'eye_size_modifier': self.eye_size_modifier,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TurboGenome":
        """Create from dictionary for legacy compatibility"""
        # Handle RGB tuple conversion
        rgb_fields = [
            'shell_base_color', 'shell_pattern_color', 'pattern_color',
            'body_base_color', 'body_pattern_color', 'head_color',
            'leg_color', 'eye_color'
        ]
        
        processed_data = data.copy()
        for field in rgb_fields:
            if field in processed_data and isinstance(processed_data[field], tuple):
                processed_data[field] = RGBColor.from_tuple(processed_data[field])
        
        return cls(**processed_data)
    
    def get_trait_names(self) -> list[str]:
        """Get list of all trait names"""
        return list(self.__class__.model_fields.keys())
    
    def get_trait_value(self, trait_name: str) -> Union[Tuple[int, int, int], str, float]:
        """Get trait value in legacy format"""
        if not hasattr(self, trait_name):
            raise ValueError(f"Unknown trait: {trait_name}")
        
        value = getattr(self, trait_name)
        if isinstance(value, RGBColor):
            return value.to_tuple()
        elif isinstance(value, (PatternType, BodyPatternType, LimbShape)):
            return value.value
        else:
            return value


# Gene definitions registry for validation and generation
GENE_DEFINITIONS = {
    "shell_base_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (34, 139, 34),
        "description": "Primary shell color",
    },
    "shell_pattern_type": {
        "type": GeneType.DISCRETE,
        "range": [p.value for p in PatternType],
        "default": PatternType.HEX.value,
        "description": "Shell pattern type",
    },
    "shell_pattern_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (255, 255, 255),
        "description": "Shell pattern color",
    },
    "pattern_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (255, 255, 255),
        "description": "Pattern color (used by renderer)",
    },
    "shell_pattern_density": {
        "type": GeneType.CONTINUOUS,
        "range": (0.1, 1.0),
        "default": 0.5,
        "description": "Pattern density/intensity",
    },
    "shell_pattern_opacity": {
        "type": GeneType.CONTINUOUS,
        "range": (0.3, 1.0),
        "default": 0.8,
        "description": "Pattern transparency",
    },
    "shell_size_modifier": {
        "type": GeneType.CONTINUOUS,
        "range": (0.5, 1.5),
        "default": 1.0,
        "description": "Shell size scaling",
    },
    "body_base_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (107, 142, 35),
        "description": "Primary body color",
    },
    "body_pattern_type": {
        "type": GeneType.DISCRETE,
        "range": [p.value for p in BodyPatternType],
        "default": BodyPatternType.SOLID.value,
        "description": "Body pattern type",
    },
    "body_pattern_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (85, 107, 47),
        "description": "Body pattern color",
    },
    "body_pattern_density": {
        "type": GeneType.CONTINUOUS,
        "range": (0.1, 1.0),
        "default": 0.3,
        "description": "Body pattern density",
    },
    "head_size_modifier": {
        "type": GeneType.CONTINUOUS,
        "range": (0.7, 1.3),
        "default": 1.0,
        "description": "Head size scaling",
    },
    "head_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (139, 90, 43),
        "description": "Head color",
    },
    "leg_length": {
        "type": GeneType.CONTINUOUS,
        "range": (0.5, 1.5),
        "default": 1.0,
        "description": "Leg length scaling",
    },
    "limb_shape": {
        "type": GeneType.DISCRETE,
        "range": [s.value for s in LimbShape],
        "default": LimbShape.FLIPPERS.value,
        "description": "Limb shape type",
    },
    "leg_thickness_modifier": {
        "type": GeneType.CONTINUOUS,
        "range": (0.7, 1.3),
        "default": 1.0,
        "description": "Leg thickness",
    },
    "leg_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (101, 67, 33),
        "description": "Leg color",
    },
    "eye_color": {
        "type": GeneType.RGB,
        "range": [(0, 255), (0, 255), (0, 255)],
        "default": (0, 0, 0),
        "description": "Eye color",
    },
    "eye_size_modifier": {
        "type": GeneType.CONTINUOUS,
        "range": (0.8, 1.2),
        "default": 1.0,
        "description": "Eye size scaling",
    },
}


def create_default_genome() -> TurboGenome:
    """Create a genome with all default values"""
    return TurboGenome()


def validate_genome_dict(genome_dict: Dict[str, Any]) -> bool:
    """Validate a genome dictionary against the schema"""
    try:
        TurboGenome.from_dict(genome_dict)
        return True
    except Exception:
        return False


# Export key components
__all__ = [
    'TurboGenome',
    'RGBColor',
    'PatternType',
    'BodyPatternType', 
    'LimbShape',
    'GeneType',
    'GENE_DEFINITIONS',
    'create_default_genome',
    'validate_genome_dict'
]
