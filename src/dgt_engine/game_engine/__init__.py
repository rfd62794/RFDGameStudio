"""
RPG Game Engine - Consolidated Logic Package
A unified entry point for survival, breeding, and world-engine systems.
"""

from typing import Any

# Registry of exports to enable lazy loading
_ENGINE_EXPORTS = {
    # From breeding_logic.py
    "BreedingLogicExtractor", "BreedingUIConstants",
    
    # From roster_logic.py
    "RosterLogicExtractor", "RosterUIConstants", "ViewMode", "SortMode",
    
    # From market_logic.py
    "MarketLogicExtractor", "MarketUIConstants", "ShopCategory",
    
    # From world_engine.py
    "WorldEngine", "PermutationTable", "Chunk", "WorldEngineFactory", "WorldEngineSync",
    
    # From combat_resolver.py
    "CombatResolver", "Combatant", "CombatState", "CombatRound",
    
    # From dd_engine.py
    "DDEngine", "DDEngineFactory", "CommandStatus", "CommandQueue",
    
    # From survival_game.py
    "SurvivalGame",
    
    # From ship_genetics.py
    "ShipGenetics",
    # From tri_brain.py
    "TriBrain", "create_tri_brain",
}

__all__ = sorted(_ENGINE_EXPORTS)


def __getattr__(name: str) -> Any:
    """Lazy-load engine symbols on first access."""
    if name in _ENGINE_EXPORTS:
        # Map names to their modules
        if name in {"BreedingLogicExtractor", "BreedingUIConstants"}:
            from . import breeding_logic as _mod
        elif name in {"RosterLogicExtractor", "RosterUIConstants", "ViewMode", "SortMode"}:
            from . import roster_logic as _mod
        elif name in {"MarketLogicExtractor", "MarketUIConstants", "ShopCategory"}:
            from . import market_logic as _mod
        elif name in {"WorldEngine", "PermutationTable", "Chunk", "WorldEngineFactory", "WorldEngineSync"}:
            from . import world_engine as _mod
        elif name in {"CombatResolver", "Combatant", "CombatState", "CombatRound"}:
            from . import combat_resolver as _mod
        elif name in {"DDEngine", "DDEngineFactory", "CommandStatus", "CommandQueue"}:
            from . import dd_engine as _mod
        elif name == "SurvivalGame":
            from . import survival_game as _mod
        elif name == "ShipGenetics":
            from . import ship_genetics as _mod
        elif name in {"TriBrain", "create_tri_brain"}:
            from . import tri_brain as _mod
        else:
            raise AttributeError(f"Mapping missing for export: {name}")
            
        return getattr(_mod, name)

    raise AttributeError(f"module 'rpg_core.game_engine' has no attribute {name!r}")
