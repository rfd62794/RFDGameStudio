"""
Spawner - Entity Lifecycle Management
"""

from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

# Forward references
class AIController: pass

class Spawner:
    """Factory for creating AIController and Pawn instances"""
    
    @staticmethod
    def create_controller(config_or_dd_engine, dd_engine=None, chronos_engine=None) -> Any:
        # Import here to avoid circular dependencies
        from actors.ai_controller import AIController
        from engines.kernel.config import AIConfig
        
        logger.info("🏭 Spawner: Creating new AI Controller")
        
        if hasattr(config_or_dd_engine, 'seed'):
             # It's a Config object
            return AIController(config_or_dd_engine, dd_engine, chronos_engine)
        else:
            # Legacy signature: (dd_engine, chronos_engine)
            # Create default config
            config = AIConfig(seed="SEED_LEGACY")
            return AIController(config, config_or_dd_engine, dd_engine)
            
    @staticmethod
    def create_pawn(position: Tuple[float, float], template_id: str = "ship") -> Any:
        # Import here to avoid circular dependencies
        from body.kinetic_pawn import KineticPawn
        from foundation.vector import Vector2
        
        logger.info(f"🏭 Spawner: Creating KineticPawn '{template_id}' at {position}")
        
        # Default defaults
        radius = 4.0
        mass = 1.0
        
        if template_id == "asteroid_large":
            radius = 12.0
            mass = 10.0
        elif template_id == "bullet":
            radius = 1.0
            mass = 0.1
            
        return KineticPawn(
            position=Vector2(position[0], position[1]),
            radius=radius,
            mass=mass
        )

# Export for use
__all__ = ["Spawner"]
