"""
Legacy Bridge - Architecture Preservation Layer

This module provides backward compatibility for the "Industrialization Pivot" (Sprint 3.0),
mapping legacy "Voyager" terminology to the new "AIController/Pawn" standard.

It ensures that existing seeds, save files, and external tools that reference
'Voyager' or 'Aegis' can still function by aliasing them to the new components.
"""
from typing import Any

from actors.ai_controller import AIController, Spawner, AIControllerSync
from actors.pawn_navigation import (
    NavigationGoal, PathfindingNode, PathfindingNavigator, IntentGenerator
)
from engines.kernel.config import AIConfig
from engines.kernel.state import AIState

# === TYPE ALIASES ===
# Map legacy class names to new industry-standard names
Voyager = AIController
VoyagerFactory = Spawner
VoyagerSync = AIControllerSync
AegisController = AIController  # For any transitional code
VoyagerState = AIState

# === NAVIGATION ALIASES ===
# These were moved from voyager_navigation.py to pawn_navigation.py
# The classes themselves didn't change name, but their module did.

# === CONFIG ALIASES ===
# VoyagerConfig is kept as is for now in kernel.config, 
# but we might want to alias it if we rename it later.
VoyagerConfig = AIConfig

def get_legacy_voyager_instance(config: Any) -> AIController:
    """Factory helper for legacy calls expecting a 'Voyager'"""
    return Spawner.create_controller(config)
