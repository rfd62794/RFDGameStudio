"""
Backward Compatibility Shim Layer

This module provides backward compatibility by redirecting imports from the old
src/dgt_engine/ structure to the new src/game_engine/ structure. This allows
existing code to continue working during the gradual migration.

DEPRECATION WARNING: These imports will be removed in a future version.
Update your imports to use the new structure:
    OLD: from src.dgt_engine.engine import SyntheticRealityEngine
    NEW: from src.game_engine.engines import SyntheticRealityEngine

Map of old → new import paths:
    dgt_engine.foundation.* → game_engine.foundation.*
    dgt_engine.foundation.protocols.* → game_engine.foundation.protocols.*
    dgt_engine.engine.* → game_engine.engines.*
    dgt_engine.systems.* → game_engine.systems.*
    dgt_engine.game_engine.* → game_engine.systems.game.*
    dgt_engine.game_engine.actors.* → game_engine.systems.ai.*
    dgt_engine.narrative.* → game_engine.systems.narrative.*
    dgt_engine.assets.* → game_engine.assets.*
    dgt_engine.config.* → game_engine.config.*
    dgt_engine.ui.* → game_engine.ui.*
"""

import sys
import importlib
import warnings
from typing import Any

# Mapping of old import paths to new ones
_IMPORT_MAPPING = {
    # Foundation layer
    "foundation": "game_engine.foundation",
    "foundation.base": "game_engine.foundation.base",
    "foundation.protocols": "game_engine.foundation.protocols",
    "foundation.utils": "game_engine.foundation.utils",

    # Engines layer
    "engine": "game_engine.engines",
    "engine.engine": "game_engine.engines.synthetic_reality",
    "engine.chronos": "game_engine.engines.chronos",
    "engine.d20_core": "game_engine.engines.d20_core",
    "engine.semantic_engine": "game_engine.engines.semantic_engine",
    "engine.narrative_engine": "game_engine.engines.narrative_engine",

    # Systems layer
    "systems": "game_engine.systems",
    "systems.base": "game_engine.systems.base",
    "systems.kernel": "game_engine.systems.kernel",
    "systems.body": "game_engine.systems.body",
    "systems.graphics": "game_engine.systems.graphics",

    # Game logic systems (moved to systems/game)
    "game_engine": "game_engine.systems.game",

    # AI systems (moved to systems/ai)
    "game_engine.actors": "game_engine.systems.ai",

    # Narrative systems
    "narrative": "game_engine.systems.narrative",

    # Assets
    "assets": "game_engine.assets",

    # Config
    "config": "game_engine.config",

    # UI
    "ui": "game_engine.ui",
}


def __getattr__(name: str) -> Any:
    """
    Dynamically redirect old imports to new structure.

    This function is called when an attribute cannot be found in the module.
    It checks if the requested attribute maps to a new module path, and if so,
    imports and returns the new module.

    Args:
        name: The attribute name being imported

    Returns:
        The module from the new structure

    Raises:
        AttributeError: If the attribute cannot be found in either old or new structure
    """
    if name in _IMPORT_MAPPING:
        new_path = _IMPORT_MAPPING[name]
        warnings.warn(
            f"Importing from 'dgt_engine.{name}' is deprecated. "
            f"Use 'game_engine.{name.split('.')[0]}' instead. "
            f"Old path 'dgt_engine.{name}' → New path '{new_path}'",
            DeprecationWarning,
            stacklevel=2,
        )
        try:
            # Import without 'src.' prefix since the package is installed
            clean_path = new_path.replace("src.", "")
            return importlib.import_module(clean_path)
        except ImportError as e:
            raise AttributeError(
                f"Cannot import '{new_path}' (redirected from 'dgt_engine.{name}'). "
                f"The new module structure may not be fully migrated yet."
            ) from e

    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


def __dir__() -> list:
    """Return list of available attributes for this compatibility module."""
    return list(_IMPORT_MAPPING.keys())
