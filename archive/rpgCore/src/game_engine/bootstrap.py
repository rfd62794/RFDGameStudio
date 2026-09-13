"""
Bootstrap script for rpgCore Game Engine.
Initializes all core systems and prepares the engine for the game loop.
"""

import threading
import time
from typing import Optional, Dict, Any

from loguru import logger

from src.game_engine.foundation.asset_registry import AssetRegistry
from src.game_engine.foundation.config_manager import ConfigManager
from src.game_engine.systems.body.entity_manager import EntityManager
from src.game_engine.systems.body.entity_template import EntityTemplateRegistry
from src.game_engine.foundation.base_system import SystemConfig

# Import Godot subsystems
from src.game_engine.systems.graphics.godot_render_system import GodotRenderSystem

class GameContext:
    def __init__(self):
        self.config_manager: Optional[ConfigManager] = None
        self.asset_registry: Optional[AssetRegistry] = None
        self.entity_manager: Optional[EntityManager] = None
        self.template_registry: Optional[EntityTemplateRegistry] = None
        self.render_system: Optional[Any] = None
        self.running = False


def boot_sequence(config_path: str = "config/game_config.yaml") -> GameContext:
    """
    Initialize all game systems.
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Initialized GameContext
    """
    ctx = GameContext()
    logger.info("--- Boot Sequence Initiated ---")

    # 1. Foundation: Config
    ctx.config_manager = ConfigManager()
    if config_path:
        ctx.config_manager.load_config(config_path)
    
    # 2. Foundation: Assets
    ctx.asset_registry = AssetRegistry()
    
    # 3. Systems: Templates & Entities
    ctx.template_registry = EntityTemplateRegistry()
    ctx.template_registry.load_from_assets() # In a real app, this loads assets first
    
    ctx.entity_manager = EntityManager()
    ctx.entity_manager.initialize()
    ctx.entity_manager.set_template_registry(ctx.template_registry)

    # 4. Graphics: Renderer Selection
    # This is the key "Alternate Graphics Method" logic
    renderer_type = ctx.config_manager.get("graphics.renderer_type", "godot")
    
    if renderer_type == "godot":
        logger.info("Initializing Godot Renderer...")
        render_config = SystemConfig(name="GodotRender", update_rate=60)
        ctx.render_system = GodotRenderSystem(render_config, ctx.entity_manager)
        ctx.render_system.initialize()
    else:
        logger.warning(f"Unknown or headless renderer type: {renderer_type}")
        # Could fallback to Pygame or Console renderer here

    ctx.running = True
    logger.info("--- Boot Sequence Complete ---")
    return ctx

def shutdown_sequence(ctx: GameContext):
    """Shutdown all systems."""
    logger.info("--- Shutdown Sequence Initiated ---")
    ctx.running = False
    
    if ctx.render_system:
        ctx.render_system.shutdown()
        
    if ctx.entity_manager:
        ctx.entity_manager.shutdown()
        
    logger.info("--- Shutdown Sequence Complete ---")

if __name__ == "__main__":
    # Example usage
    context = boot_sequence()
    
    try:
        # Simple game loop simulation
        logger.info("Entering Game Loop...")
        while context.running:
            dt = 0.016 # Mock 60 FPS
            
            # Update Systems
            context.entity_manager.tick(dt)
            if context.render_system:
                context.render_system.tick(dt)
                
            time.sleep(dt)
            
            # For this demo, break after a few frames
            # context.running = False 
            
    except KeyboardInterrupt:
        pass
    finally:
        shutdown_sequence(context)
