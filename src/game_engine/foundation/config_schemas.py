from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field, field_validator

class PhysicsConfig(BaseModel):
    """Configuration for the physics engine."""
    collision_check_frequency: int = Field(default=60, ge=1, le=240, description="Hz for collision checks")
    particle_pool_size: int = Field(default=1000, ge=100, le=10000, description="Max particles in pool")
    collision_detection_type: str = Field(default="spatial_hash", pattern="^(spatial_hash|quadtree|brute_force)$")
    substeps: int = Field(default=1, ge=1, le=10, description="Physics substeps per frame")

class GraphicsConfig(BaseModel):
    """Configuration for the rendering system."""
    target_fps: int = Field(default=60, ge=30, le=240)
    renderer_type: str = Field(default="godot", pattern="^(godot|pygame|headless)$")
    resolution: Tuple[int, int] = Field(default=(1280, 720))
    fullscreen: bool = False
    details_quality: str = Field(default="medium", pattern="^(low|medium|high|ultra)$")

class EntityConfig(BaseModel):
    """Configuration for an entity type."""
    entity_type: str
    pool_size: int = Field(default=100, ge=1)
    components: List[str] = Field(default_factory=list)
    initial_properties: Dict[str, Any] = Field(default_factory=dict)

class SystemConfig(BaseModel):
    """Configuration for a game system."""
    system_name: str
    enabled: bool = True
    priority: int = Field(default=0)
    config: Dict[str, Any] = Field(default_factory=dict)

class GameConfig(BaseModel):
    """Root configuration object for the entire game."""
    game_title: str = "rpgCore Game"
    version: str = "0.1.0"
    physics: PhysicsConfig = Field(default_factory=PhysicsConfig)
    graphics: GraphicsConfig = Field(default_factory=GraphicsConfig)
    systems: Dict[str, SystemConfig] = Field(default_factory=dict)
    custom_settings: Dict[str, Any] = Field(default_factory=dict)
    
    @field_validator("version")
    @classmethod
    def validate_version(cls, v: str) -> str:
        # Simple semantic version check
        parts = v.split(".")
        if len(parts) != 3:
            raise ValueError("Version must be in format X.Y.Z")
        return v
