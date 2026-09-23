"""
DGT Core Kernel - System Components and Models

Phase 2: Component Consolidation with Sovereign Architecture
"""

from .models import (
    # Legacy models (ADR 166)
    MaterialAsset, EntityBlueprint, StoryFragment, AssetRegistry,
    # Viewport models (ADR 193)
    ViewportLayout, ViewportLayoutMode, Rectangle, Point,
    ScaleBucket, STANDARD_SCALE_BUCKETS, OverlayComponent
)
from .viewport_manager import ViewportManager, create_viewport_manager, create_overlay_manager
from .constants import (
    # System constants
    SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT, SOVEREIGN_PIXELS,
    # Viewport constants (ADR 193)
    SCALE_BUCKETS, FOCUS_MODE_WIDTH_THRESHOLD, FOCUS_MODE_HEIGHT_THRESHOLD,
    MIN_WING_WIDTH, MAX_PPU_SCALE, WING_ALPHA_DEFAULT
)

__all__ = [
    # Legacy models
    "MaterialAsset",
    "EntityBlueprint", 
    "StoryFragment",
    "AssetRegistry",
    "create_asset_registry",
    
    # Viewport models (ADR 193)
    "ViewportLayout",
    "ViewportLayoutMode",
    "Rectangle",
    "Point",
    "ScaleBucket",
    "STANDARD_SCALE_BUCKETS",
    "OverlayComponent",
    
    # Viewport management
    "ViewportManager",
    "create_viewport_manager",
    "create_overlay_manager",
    
    # Sovereign resolution constants (ADR 192)
    "SOVEREIGN_WIDTH",
    "SOVEREIGN_HEIGHT", 
    "SOVEREIGN_PIXELS",
    
    # Viewport scaling constants (ADR 193)
    "SCALE_BUCKETS",
    "FOCUS_MODE_WIDTH_THRESHOLD",
    "FOCUS_MODE_HEIGHT_THRESHOLD",
    "MIN_WING_WIDTH",
    "MAX_PPU_SCALE",
    "WING_ALPHA_DEFAULT"
]
