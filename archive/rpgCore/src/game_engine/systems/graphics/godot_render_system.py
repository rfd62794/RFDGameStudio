from typing import Dict, Any, List
from loguru import logger

from src.game_engine.foundation.base_system import BaseSystem, SystemConfig, SystemStatus
from src.game_engine.engines.godot_bridge import GodotBridge
from src.game_engine.systems.body.entity_manager import EntityManager, Entity

class GodotRenderSystem(BaseSystem):
    """
    System responsible for forwarding game state to Godot for rendering.
    """

    def __init__(self, config: SystemConfig, entity_manager: EntityManager):
        super().__init__(config)
        self.entity_manager = entity_manager
        self.bridge = GodotBridge() # Singleton instance
        
        # Performance tuning
        self.target_fps = 60
        self.frame_timer = 0.0
        self.frame_interval = 1.0 / self.target_fps

    def initialize(self) -> bool:
        """Initialize the render system and connect to Godot."""
        logger.info("Initializing GodotRenderSystem...")
        if not self.bridge.connect():
            logger.warning("Failed to connect to Godot Render Server. Is it running?")
            # We don't fail initialization because the game might run headless or retry later
            self.status = SystemStatus.DEGRADED
            return True
        
        self.status = SystemStatus.RUNNING
        return True

    def tick(self, dt: float) -> None:
        """
        Update loop. Collects entities and sends frame data to Godot.
        Limits sending rate to target_fps.
        """
        if self.status not in (SystemStatus.RUNNING, SystemStatus.DEGRADED):
            return

        self.frame_timer += dt
        if self.frame_timer < self.frame_interval:
            return
            
        self.frame_timer %= self.frame_interval # Reset timer but keep remainder

        if not self.bridge.is_connected():
            # Try to reconnect occasionally? For now, just skip.
            return

        # 1. Collect Entities
        entities = self.entity_manager.get_all_active_entities()
        entity_dtos = self._serialize_entities(entities)

        # 2. Collect HUD Data (Mock for now, or get from StatusManager if available)
        hud_data = {
            "fps": str(int(1.0 / dt)) if dt > 0 else "0",
            "entities": str(len(entities))
        }

        # 3. Send Frame
        self.bridge.send_frame(entity_dtos, hud_data)

    def shutdown(self) -> None:
        """Disconnect bridge on shutdown."""
        self.bridge.disconnect()
        self.status = SystemStatus.STOPPED

    def _serialize_entities(self, entities: List[Entity]) -> List[Dict[str, Any]]:
        """Convert game entities to DTO dictionaries for JSON serialization."""
        dtos = []
        for e in entities:
            dto = {
                "id": e.id,
                "type": e.entity_type,
                # Basic transform - assume these exist on most entities
                "x": getattr(e, "x", 0.0),
                "y": getattr(e, "y", 0.0),
                "active": e.active,
            }
            
            # Add optional fields if present
            if hasattr(e, "radius"):
                dto["radius"] = e.radius
            if hasattr(e, "heading"):
                dto["heading"] = e.heading
            elif hasattr(e, "angle"):
                dto["heading"] = e.angle
                
            # Add visual metadata if available
            if hasattr(e, "color"):
                dto["color"] = e.color
            
            dtos.append(dto)
        return dtos
