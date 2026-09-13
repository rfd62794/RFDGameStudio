"""
Asset Schemas — Engine-Tier Data Models

Pydantic v2 data validation for DGT assets.
Relocated from tools/asset_models.py to engines/models/ (ADR 192: Three-Tier Cleanup).

These are pure data schemas — no behavioral dependencies.
"""

from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any, Literal, Union
from pathlib import Path
from enum import Enum


class AssetType(str, Enum):
    """Asset type enumeration"""
    ACTOR = "actor"
    OBJECT = "object"


class MaterialType(str, Enum):
    """Material type enumeration"""
    ORGANIC = "organic"
    WOOD = "wood"
    STONE = "stone"
    METAL = "metal"
    WATER = "water"
    FIRE = "fire"
    CRYSTAL = "crystal"
    VOID = "void"


class SpriteSlice(BaseModel):
    """Represents a single sliced sprite from the sheet"""
    model_config = ConfigDict(validate_assignment=True, frozen=True)
    
    sheet_name: str = Field(..., description="Name of the source spritesheet")
    grid_x: int = Field(..., ge=0, description="Grid X coordinate")
    grid_y: int = Field(..., ge=0, description="Grid Y coordinate")
    pixel_x: int = Field(..., ge=0, description="Pixel X coordinate")
    pixel_y: int = Field(..., ge=0, description="Pixel Y coordinate")
    width: int = Field(..., gt=0, description="Sprite width in pixels")
    height: int = Field(..., gt=0, description="Sprite height in pixels")
    asset_id: str = Field(..., description="Unique asset identifier")
    palette: List[str] = Field(..., min_items=1, max_items=4, description="Color palette (hex codes)")
    
    @field_validator('palette')
    @classmethod
    def validate_hex_colors(cls, v: List[str]) -> List[str]:
        """Validate hex color format"""
        hex_pattern = r'^#[0-9A-Fa-f]{6}$'
        for color in v:
            if not color.match(hex_pattern):
                raise ValueError(f"Invalid hex color format: {color}")
        return v
    
    @field_validator('asset_id')
    @classmethod
    def validate_asset_id(cls, v: str) -> str:
        """Validate asset ID format"""
        if not v or len(v.strip()) == 0:
            raise ValueError("Asset ID cannot be empty")
        if len(v) > 100:
            raise ValueError("Asset ID too long (max 100 characters)")
        return v.strip()


class AssetMetadata(BaseModel):
    """Metadata for harvested asset"""
    model_config = ConfigDict(validate_assignment=True)
    
    asset_id: str = Field(..., description="Unique asset identifier")
    asset_type: AssetType = Field(..., description="Type of asset")
    material_id: MaterialType = Field(..., description="Material classification")
    description: str = Field(..., min_length=1, max_length=500, description="Asset description")
    tags: List[str] = Field(default_factory=list, description="Asset tags")
    collision: bool = Field(default=False, description="Has collision detection")
    interaction_hooks: List[str] = Field(default_factory=list, description="Interaction hook names")
    d20_checks: Dict[str, Any] = Field(default_factory=dict, description="D20 check configurations")
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: List[str]) -> List[str]:
        """Validate tag format"""
        cleaned_tags = []
        for tag in v:
            tag = tag.strip().lower()
            if tag and len(tag) <= 50:
                cleaned_tags.append(tag)
        return list(set(cleaned_tags))  # Remove duplicates
    
    @field_validator('interaction_hooks')
    @classmethod
    def validate_hooks(cls, v: List[str]) -> List[str]:
        """Validate interaction hook format"""
        valid_hooks = {'on_click', 'on_use', 'on_collision', 'on_proximity', 'on_timer'}
        cleaned_hooks = []
        for hook in v:
            hook = hook.strip().lower()
            if hook in valid_hooks:
                cleaned_hooks.append(hook)
        return list(set(cleaned_hooks))  # Remove duplicates


class HarvestedAsset(BaseModel):
    """Complete harvested asset with image and metadata"""
    model_config = ConfigDict(validate_assignment=True)
    
    sprite_slice: SpriteSlice = Field(..., description="Sprite slice data")
    metadata: AssetMetadata = Field(..., description="Asset metadata")
    
    @property
    def asset_id(self) -> str:
        """Get asset ID"""
        return self.sprite_slice.asset_id
    
    @property
    def grid_position(self) -> tuple[int, int]:
        """Get grid position"""
        return (self.sprite_slice.grid_x, self.sprite_slice.grid_y)


class AssetExportConfig(BaseModel):
    """Configuration for asset export"""
    model_config = ConfigDict(validate_assignment=True)
    
    export_directory: Path = Field(..., description="Export directory path")
    include_grayscale: bool = Field(default=False, description="Include grayscale versions")
    yaml_filename: str = Field(default="harvested_assets.yaml", description="YAML output filename")
    image_subdirectory: str = Field(default="images", description="Images subdirectory name")
    
    @field_validator('export_directory')
    @classmethod
    def validate_export_directory(cls, v: Path) -> Path:
        """Validate export directory"""
        if not v.is_absolute():
            raise ValueError("Export directory must be absolute path")
        return v
    
    @field_validator('yaml_filename')
    @classmethod
    def validate_yaml_filename(cls, v: str) -> str:
        """Validate YAML filename"""
        if not v.endswith('.yaml'):
            raise ValueError("YAML filename must end with .yaml")
        return v


class ProcessingResult(BaseModel):
    """Result of asset processing operation"""
    model_config = ConfigDict(validate_assignment=True)
    
    success: bool = Field(..., description="Operation success status")
    assets_processed: int = Field(default=0, ge=0, description="Number of assets processed")
    errors: List[str] = Field(default_factory=list, description="Error messages")
    warnings: List[str] = Field(default_factory=list, description="Warning messages")
    export_path: Optional[Path] = Field(default=None, description="Export path if successful")
    
    def add_error(self, error: str) -> None:
        """Add error message"""
        self.errors.append(error)
        self.success = False
    
    def add_warning(self, warning: str) -> None:
        """Add warning message"""
        self.warnings.append(warning)


class GridConfiguration(BaseModel):
    """Grid slicing configuration"""
    model_config = ConfigDict(validate_assignment=True)
    
    tile_size: int = Field(default=16, gt=0, description="Tile size in pixels")
    grid_cols: int = Field(..., gt=0, description="Number of grid columns")
    grid_rows: int = Field(..., gt=0, description="Number of grid rows")
    auto_detect: bool = Field(default=False, description="Auto-detect grid dimensions")
    
    @field_validator('tile_size')
    @classmethod
    def validate_tile_size(cls, v: int) -> int:
        """Validate tile size is power of 2"""
        if v <= 0 or (v & (v - 1)) != 0:
            raise ValueError("Tile size must be a positive power of 2")
        return v
