"""
Pydantic v2 models for type-safe asset validation.

Provides runtime validation and serialization contracts for all asset types.
Follows strict typing with comprehensive validation rules.
"""

from typing import Dict, List, Any, Optional, Tuple, Literal, Union
from pydantic import BaseModel, Field, field_validator, model_validator
from pydantic.types import NonNegativeInt
from enum import Enum


class AssetType(str, Enum):
    """Supported asset types."""
    CHARACTER = "character"
    OBJECT = "object"
    ENVIRONMENT = "environment"
    TILE = "tile"
    PALETTE = "palette"
    INTERACTION = "interaction"
    DIALOGUE = "dialogue"


class PaletteColor(str, Enum):
    """Standard palette colors."""
    TRANSPARENT = "transparent"
    DARK_RED = "dark_red"
    RED = "red"
    LIGHT_RED = "light_red"
    DARK_BLUE = "dark_blue"
    BLUE = "blue"
    LIGHT_BLUE = "light_blue"
    BLACK = "black"
    GRAY30 = "gray30"
    GRAY40 = "gray40"
    GRAY60 = "gray60"
    SILVER = "silver"
    WHEAT = "wheat"
    TAN = "tan"
    YELLOW = "yellow"
    BROWN = "brown"
    DARK_GREEN = "dark_green"
    GREEN = "green"
    LIGHT_GREEN = "light_green"
    PURPLE = "purple"


class TilePattern(str, Enum):
    """Tile rendering patterns."""
    SOLID = "solid"
    TEXTURED = "textured"
    ANIMATED = "animated"


class CharacterMetadata(BaseModel):
    """Character metadata validation."""
    description: str = Field(..., min_length=1, max_length=200)
    palette: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)
    base_stats: Optional[Dict[str, Union[int, float]]] = None
    
    @field_validator('tags', mode='before')
    @classmethod
    def validate_tags(cls, v: Any) -> Any:
        """Validate tag format."""
        if len(v) > 10:
            raise ValueError("Too many tags (max 10)")
        for tag in v:
            if not tag.replace('_', '').isalnum():
                raise ValueError(f"Invalid tag format: {tag}")
        return v


class ObjectMetadata(BaseModel):
    """Object metadata validation."""
    description: str = Field(..., min_length=1, max_length=200)
    interaction: str = Field(..., min_length=1)
    tags: List[str] = Field(default_factory=list)
    container_type: Optional[Literal["chest", "door", "sign", "generic"]] = None


class EnvironmentMetadata(BaseModel):
    """Environment metadata validation."""
    description: str = Field(..., min_length=1, max_length=500)
    dimensions: Tuple[NonNegativeInt, NonNegativeInt] = Field(..., min_length=2, max_length=2)
    tile_count: NonNegativeInt
    object_count: NonNegativeInt
    npc_count: NonNegativeInt
    tags: List[str] = Field(default_factory=list)
    
    @field_validator('dimensions', mode='before')
    @classmethod
    def validate_dimensions(cls, v: Any) -> Any:
        """Validate environment dimensions."""
        width, height = v
        if width == 0 or height == 0:
            raise ValueError("Dimensions cannot be zero")
        if width > 100 or height > 100:
            raise ValueError("Dimensions too large (max 100x100)")
        return v


class PaletteDefinition(BaseModel):
    """Color palette definition."""
    description: str = Field(..., min_length=1, max_length=100)
    colors: Dict[NonNegativeInt, Union[PaletteColor, str]] = Field(..., min_length=1)
    
    @field_validator('colors', mode='before')
    @classmethod
    def validate_colors(cls, v: Any) -> Any:
        """Validate color mapping."""
        if len(v) > 8:
            raise ValueError("Too many colors (max 8)")
        # Ensure color indices are sequential from 0
        max_index = max(v.keys())
        if max_index != len(v) - 1:
            raise ValueError("Color indices must be sequential from 0")
        return v


class TileDefinition(BaseModel):
    """Tile definition validation."""
    description: str = Field(..., min_length=1, max_length=100)
    pattern: TilePattern
    color_id: NonNegativeInt = Field(..., lt=8)
    walkable: Optional[bool] = True
    transparent: Optional[bool] = False


class InteractionDefinition(BaseModel):
    """Interaction logic validation."""
    description: str = Field(..., min_length=1, max_length=200)
    interaction_type: Literal["loot_table", "door_exit", "dialogue", "custom"]
    target_map: Optional[str] = None
    target_position: Optional[Tuple[int, int]] = None
    loot_table: Optional[Dict[str, Union[List[float], float]]] = None
    dialogue_set: Optional[str] = None
    
    @model_validator(mode='after')
    def validate_interaction_consistency(cls, model):
        """Validate interaction type consistency."""
        interaction_type = model.interaction_type
        
        if interaction_type == "loot_table" and not model.loot_table:
            raise ValueError("Loot table interactions require loot_table data")
        
        if interaction_type == "door_exit" and (not model.target_map or not model.target_position):
            raise ValueError("Door exit interactions require target_map and target_position")
        
        if interaction_type == "dialogue" and not model.dialogue_set:
            raise ValueError("Dialogue interactions require dialogue_set")
        
        return model


class DialogueSet(BaseModel):
    """Dialogue set validation."""
    greetings: List[str] = Field(..., min_length=1)
    responses: List[str] = Field(..., min_length=1)
    warnings: Optional[List[str]] = None
    offers: Optional[List[str]] = None
    threats: Optional[List[str]] = None
    
    @field_validator('*', mode='before')
    @classmethod
    def validate_dialogue_lines(cls, v: Any) -> Any:
        """Validate dialogue line format."""
        if isinstance(v, list):
            for line in v:
                if len(line) > 200:
                    raise ValueError("Dialogue line too long (max 200 chars)")
        return v


class AssetManifest(BaseModel):
    """Complete asset manifest validation."""
    characters: Dict[str, CharacterMetadata] = Field(default_factory=dict)
    objects: Dict[str, ObjectMetadata] = Field(default_factory=dict)
    environments: Dict[str, EnvironmentMetadata] = Field(default_factory=dict)
    palettes: Dict[str, PaletteDefinition] = Field(default_factory=dict)
    tiles: Dict[str, TileDefinition] = Field(default_factory=dict)
    interactions: Dict[str, InteractionDefinition] = Field(default_factory=dict)
    dialogue_sets: Dict[str, DialogueSet] = Field(default_factory=dict)
    
    @field_validator('characters', mode='before')
    @classmethod
    def validate_character_references(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate character palette references."""
        palettes = values.get('palettes', {})
        for char_id, char_meta in v.items():
            if char_meta.palette not in palettes:
                raise ValueError(f"Character {char_id} references unknown palette: {char_meta.palette}")
        return v
    
    @field_validator('objects', mode='before')
    @classmethod
    def validate_object_references(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate object interaction references."""
        interactions = values.get('interactions', {})
        for obj_id, obj_meta in v.items():
            if obj_meta.interaction not in interactions:
                raise ValueError(f"Object {obj_id} references unknown interaction: {obj_meta.interaction}")
        return v
    
    @field_validator('dialogue_sets', mode='before')
    @classmethod
    def validate_dialogue_references(cls, v: Any, info: Any) -> Any:
        values = info.data
        """Validate dialogue set references in interactions."""
        interactions = values.get('interactions', {})
        dialogue_set_ids = set(v.keys())
        
        for interaction_id, interaction in interactions.items():
            if interaction.dialogue_set and interaction.dialogue_set not in dialogue_set_ids:
                raise ValueError(f"Interaction {interaction_id} references unknown dialogue_set: {interaction.dialogue_set}")
        
        return v


class BinaryAssetHeader(BaseModel):
    """Binary asset file header validation."""
    magic: bytes = Field(..., description="File magic number")
    version: NonNegativeInt = Field(..., description="Asset format version")
    build_time: float = Field(..., description="Build timestamp")
    checksum: str = Field(..., min_length=32, max_length=32, description="SHA-256 checksum")
    asset_count: NonNegativeInt = Field(..., description="Total number of assets")
    data_offset: NonNegativeInt = Field(..., description="Offset to compressed data")
    
    @field_validator('magic', mode='before')
    @classmethod
    def validate_magic(cls, v: Any) -> Any:
        """Validate file magic number."""
        if v != b'DGT\x01':
            raise ValueError(f"Invalid magic number: {v}")
        return v


class AssetLoadResult(BaseModel):
    """Asset loading operation result."""
    success: bool
    asset_count: Optional[NonNegativeInt] = None
    load_time_ms: Optional[float] = None
    validation_errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    
    @field_validator('load_time_ms', mode='before')
    @classmethod
    def validate_load_time(cls, v: Any) -> Any:
        """Validate load time is reasonable."""
        if v is not None and v > 10000:  # 10 seconds
            raise ValueError("Load time exceeds acceptable limit")
        return v


class CacheStatistics(BaseModel):
    """Cache performance statistics."""
    cache_type: str
    size: NonNegativeInt
    max_size: NonNegativeInt
    hits: NonNegativeInt
    misses: NonNegativeInt
    evictions: NonNegativeInt
    hit_rate: float = Field(..., ge=0.0, le=1.0)
    ttl_seconds: Optional[NonNegativeInt] = None
    
    @field_validator('cache_type', mode='before')
    @classmethod
    def validate_cache_type(cls, v: Any) -> Any:
        """Validate cache type."""
        allowed_types = ["character", "object", "environment", "generic"]
        if v not in allowed_types:
            raise ValueError(f"Invalid cache type: {v}")
        return v


# Validation utility functions
class AssetValidator:
    """Utility class for asset validation operations."""
    
    @staticmethod
    def validate_manifest(manifest_data: Dict[str, Any]) -> AssetManifest:
        """Validate complete asset manifest."""
        return AssetManifest(**manifest_data)
    
    @staticmethod
    def validate_binary_header(header_data: bytes) -> BinaryAssetHeader:
        """Validate binary asset header."""
        import struct
        
        if len(header_data) < 40:
            raise ValueError("Header data too short")
        
        magic = header_data[:4]
        version = struct.unpack('<I', header_data[4:8])[0]
        build_time = struct.unpack('<d', header_data[8:16])[0]
        checksum = header_data[16:32].hex()
        asset_count = struct.unpack('<I', header_data[32:36])[0]
        data_offset = struct.unpack('<I', header_data[36:40])[0]
        
        return BinaryAssetHeader(
            magic=magic,
            version=version,
            build_time=build_time,
            checksum=checksum,
            asset_count=asset_count,
            data_offset=data_offset
        )
    
    @staticmethod
    def validate_sprite_data(sprite_data: List[List[Any]]) -> bool:
        """Validate sprite data format."""
        if not sprite_data:
            return False
        
        # Check if sprite is rectangular
        width = len(sprite_data[0])
        for row in sprite_data:
            if len(row) != width:
                return False
        
        return True
