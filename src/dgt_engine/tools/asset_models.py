"""
Asset Models — Backward-Compatibility Shim

Canonical location is now engines/models/asset_schemas.py (Engine Tier).
This shim exists so that existing `from .asset_models import ...` and
`from tools.asset_models import ...` imports continue to work.
"""

# Re-export everything from the canonical location
from engines.models.asset_schemas import (  # noqa: F401
    AssetType, MaterialType, SpriteSlice, AssetMetadata,
    HarvestedAsset, AssetExportConfig, ProcessingResult, GridConfiguration,
)
