"""
Pixel Viewport Pass - Game Boy Hardware Parity

Zone A: Main viewport with Virtual PPU three-layer rendering.
Background (BG): TileMap from WorldLedger
Window (WIN): TextBox and Status Bar overlay
Objects (OBJ): 16x16 Metasprites for actors
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

from loguru import logger

from . import BaseRenderPass, RenderContext, RenderResult, RenderPassType
from ui.pixel_renderer import PixelRenderer, ColorPalette
from ui.sprite_registry import SpriteRegistry
from ui.tile_bank import TileBank, TileType
from models.metasprite import Metasprite, MetaspriteConfig, CharacterRole
from ui.virtual_ppu import VirtualPPU
from world_ledger import WorldLedger


class _InternalPixelViewport:
    """Internal Virtual PPU implementation for Game Boy three-layer rendering."""
    
    def __init__(self, config: 'PixelViewportConfig', world_ledger: Optional[WorldLedger] = None):
        self.config = config
        self.world_ledger = world_ledger
        
        # Initialize Virtual PPU with Game Boy dimensions
        self.virtual_ppu = VirtualPPU(
            width=config.width * 8,  # Convert to pixels
            height=config.height * 8
        )
        
        # Initialize sprite registry for compatibility
        self.sprite_registry = SpriteRegistry()
        self.entity_sprites = {}
        self.item_sprites = {}
        
        # Initialize metasprites for entities
        self.metasprites: Dict[str, Metasprite] = {}
        self._initialize_metasprites()
    
    def _initialize_metasprites(self):
        """Initialize metasprites for different character types."""
        # Create metasprites for different roles
        roles = [
            CharacterRole.VOYAGER,
            CharacterRole.WARRIOR,
            CharacterRole.ROGUE,
            CharacterRole.MAGE,
            CharacterRole.VILLAGER,
            CharacterRole.GUARD,
            CharacterRole.MERCHANT
        ]
        
        for role in roles:
            config = MetaspriteConfig(role=role)
            metasprite = Metasprite(config)
            self.metasprites[role.value] = metasprite
    
    def update_game_state(self, game_state):
        """Update viewport with game state."""
        # Update entity sprites
        self._update_entity_sprites(game_state)
        self._update_item_sprites(game_state)
        
        # Update tile map from world ledger
        self._update_tile_map(game_state)
    
    def render_frame(self, game_state):
        """Render frame using Virtual PPU."""
        # Update game state first
        self.update_game_state(game_state)
        
        # Render frame with Virtual PPU
        return self.virtual_ppu.render_frame()
    
    def _update_entity_sprites(self, game_state):
        """Update entity metasprites."""
        # This would integrate with the EntityAI system
        # For now, update based on game state position
        player_x, player_y = game_state.position.x, game_state.y
        
        # Update player metasprite
        if "voyager" in self.metasprites:
            player_sprite = self.metasprites["voyager"]
            player_sprite.set_facing_direction("down")  # Default facing
            self.entity_sprites["player"] = player_sprite
    
    def _update_item_sprites(self, game_state):
        """Update item metasprites."""
        # This would integrate with the inventory system
        pass
    
    def _update_tile_map(self, game_state):
        """Update tile map from world ledger."""
        if not self.world_ledger:
            return
        
        # Sample world around player position
        player_x, player_y = int(game_state.position.x), int(game_state.position.y)
        
        # Create a simple tile map around player
        for y in range(-5, 6):  # 11x11 tile area around player
            for x in range(-5, 6):
                world_x = player_x + x
                world_y = player_y + y
                
                # Determine tile type based on position
                tile_key = self._determine_tile_type(world_x, world_y)
                
                self.virtual_ppu.set_tile(world_x, world_y, tile_key)
    
    def _determine_tile_type(self, x: int, y: int) -> str:
        """Determine tile type based on world coordinates."""
        # Simple tile determination logic
        if abs(x) + abs(y) < 3:
            return "grass_0"  # Near player - grass
        elif abs(x) + abs(y) < 8:
            return "path"  # Medium distance - path
        elif abs(x) + abs(y) < 15:
            return "tree"  # Far distance - trees
        else:
            return "void"  # Very far - void
    
    def add_entity(self, entity_id: str, x: int, y: int, role: CharacterRole, priority: int = 0) -> bool:
        """Add an entity metasprite to the PPU."""
        if role.value not in self.metasprites:
            logger.warning(f"Unknown role: {role.value}")
            return False
        
        metasprite = self.metasprites[role.value]
        success = self.virtual_ppu.add_sprite(x, y, metasprite, priority)
        
        if success:
            self.entity_sprites[entity_id] = metasprite
        
        return success
    
    def remove_entity(self, entity_id: str) -> bool:
        """Remove an entity metasprite from the PPU."""
        if entity_id in self.entity_sprites:
            metasprite = self.entity_sprites[entity_id]
            success = self.virtual_ppu.remove_sprite(metasprite)
            
            if success:
                del self.entity_sprites[entity_id]
            
            return success
        
        return False
    
    def add_text_box(self, text: str, x: int, y: int, width: int, height: int) -> None:
        """Add a text box window."""
        self.virtual_ppu.add_window(text, x, y, width, height)
    
    def clear_windows(self) -> None:
        """Clear all windows."""
        self.virtual_ppu.clear_window()
    
    def switch_tile_bank(self, bank_name: str) -> bool:
        """Switch to a different tile bank."""
        return self.virtual_ppu.switch_tile_bank(bank_name)
    
    def get_ppu_info(self) -> Dict[str, Any]:
        """Get PPU information."""
        return self.virtual_ppu.get_ppu_info()


@dataclass
class PixelViewportConfig:
    """Configuration for the pixel viewport pass."""
    width: int = 60      # Character width (leaves room for other zones)
    height: int = 24     # Character height
    pixel_scale: int = 2  # 2:1 pixel ratio (half-block technique)
    show_sprites: bool = True
    show_environment: bool = True
    animation_speed: float = 1.0
    faction_colors: bool = True


class PixelViewportPass(BaseRenderPass):
    """
    Pixel art rendering pass for the main viewport zone.
    
    Uses half-block Unicode characters to achieve 2:1 pixel ratio,
    providing solid 8-bit sprite rendering with Game Boy/NES visual parity.
    """
    
    def __init__(self, config: Optional[PixelViewportConfig] = None):
        """
        Initialize the pixel viewport pass.
        
        Args:
            config: Optional viewport configuration
        """
        super().__init__(RenderPassType.PIXEL_VIEWPORT)
        self.config = config or PixelViewportConfig()
        
        # Calculate pixel dimensions (2:1 ratio)
        self.pixel_width = self.config.width
        self.pixel_height = self.config.height * self.config.pixel_scale
        
        # Initialize pixel renderer
        self.pixel_renderer = PixelRenderer(
            width=self.pixel_width,
            height=self.pixel_height
        )
        
        # Initialize sprite registry
        self.sprite_registry = SpriteRegistry()
        self.entity_sprites = {}
        self.item_sprites = {}
        self._viewport = None
        self.world_ledger = None
    
    def _create_pixel_viewport(self, world_ledger: Optional[WorldLedger] = None) -> _InternalPixelViewport:
        """Create a PixelViewport instance for internal use."""
        return _InternalPixelViewport(self.config, world_ledger)
    
    def _create_demo_scene(self) -> str:
        """Create a demo scene for testing."""
        # Use the internal PixelViewport
        viewport = self._create_pixel_viewport(self.world_ledger)
        return viewport.render_frame(Mock())
    
    def render(self, context: RenderContext) -> RenderResult:
        """
        Render the pixel viewport using Virtual PPU.
        
        Args:
            context: Shared rendering context
            
        Returns:
            RenderResult with pixel viewport content
        """
        # Create viewport if needed
        if self._viewport is None:
            self._viewport = self._create_pixel_viewport(self.world_ledger)
        
        # Update viewport with game state
        self._viewport.update_game_state(context.game_state)
        
        # Render frame with Virtual PPU
        content = self._viewport.render_frame(context.game_state)
        
        return RenderResult(
            content=content,
            width=self.config.width,
            height=self.config.height,
            metadata={
                "pixel_width": self.pixel_width,
                "pixel_height": self.pixel_height,
                "pixel_ratio": f"1:{self.config.pixel_scale}",
                "rendering_mode": "game_boy_virtual_ppu",
                "ppu_info": self._viewport.get_ppu_info(),
                "entity_count": len(self._viewport.entity_sprites),
                "tile_bank": self._viewport.virtual_ppu.current_tile_bank
            }
        )
    
    def get_optimal_size(self, context: RenderContext) -> Tuple[int, int]:
        """Get optimal size for pixel viewport."""
        return (self.config.width, self.config.height)
    
    def set_world_ledger(self, world_ledger) -> None:
        """
        Set the world ledger for the viewport.
        
        Args:
            world_ledger: World ledger instance
        """
        self.world_ledger = world_ledger
        # Reset viewport to use new world ledger
        self._viewport = None
        logger.debug("PixelViewportPass world ledger updated")
    
    def update_config(self, config: PixelViewportConfig) -> None:
        """
        Update viewport configuration.
        
        Args:
            config: New configuration
        """
        self.config = config
        
        # Recalculate pixel dimensions
        self.pixel_width = config.width
        self.pixel_height = config.height * config.pixel_scale
        
        # Reinitialize components
        self.pixel_renderer = PixelRenderer(
            width=self.pixel_width,
            height=self.pixel_height
        )
        
        # Reset viewport to use new configuration
        self._viewport = None
        logger.info(f"PixelViewportPass reconfigured: {self.pixel_width}x{self.pixel_height} pixels")
    
    def get_sprite_info(self) -> Dict[str, Any]:
        """Get information about available sprites."""
        return {
            "available_sprites": len(self.sprite_registry.list_templates()),
            "entity_sprites": len(self._viewport.entity_sprites) if self._viewport else 0,
            "item_sprites": len(self._viewport.item_sprites) if self._viewport else 0,
            "sprite_types": self.sprite_registry.list_templates()
        }
    
    def create_demo_frame(self) -> str:
        """
        Create a demo frame for testing.
        
        Returns:
            Demo pixel art frame
        """
        if self._viewport is None:
            self._viewport = self._create_pixel_viewport(self.world_ledger)
        return self._viewport.render_frame(Mock())
    
    def clear_sprites(self) -> None:
        """Clear all sprite tracking."""
        if self._viewport:
            self._viewport.entity_sprites.clear()
            self._viewport.item_sprites.clear()
        logger.debug("PixelViewportPass sprites cleared")
    
    def get_performance_info(self) -> Dict[str, Any]:
        """Get performance information including base class info."""
        base_info = super().get_performance_info()
        
        # Add pixel-specific performance data
        pixel_info = {
            "pixel_resolution": f"{self.pixel_width}x{self.pixel_height}",
            "character_resolution": f"{self.config.width}x{self.config.height}",
            "pixel_ratio": f"1:{self.config.pixel_scale}",
            "sprite_count": len(self._viewport.entity_sprites) + len(self._viewport.item_sprites) if self._viewport else 0
        }
        
        base_info.update(pixel_info)
        return base_info


# Export for use by other modules
__all__ = ["PixelViewportPass", "PixelViewportConfig"]
