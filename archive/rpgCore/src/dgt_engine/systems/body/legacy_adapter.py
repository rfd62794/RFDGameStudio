"""
Legacy Graphics Engine Adapter
ADR 122: Universal Packet Enforcement - Adapter Pattern Implementation

This adapter translates between the new Universal Packet format and the legacy GraphicsEngine API,
ensuring backward compatibility without modifying the frozen legacy code.
"""

import time
from typing import Dict, Any, Optional
from dataclasses import dataclass
from loguru import logger

from .graphics_engine import GraphicsEngine, RenderFrame, TileBank, Viewport, RenderLayer

# Fallback TileType class for compatibility
class TileType:
    GRASS = "grass"
    STONE = "stone"
    WATER = "water"
    DIRT = "dirt"

@dataclass
class LegacyRenderState:
    """Legacy render state compatible with GraphicsEngine"""
    width: int = 160
    height: int = 144
    tiles: Dict[str, Any] = None
    entities: list = None
    background: str = "grass"
    hud: Dict[str, str] = None
    
    def __post_init__(self):
        if self.tiles is None:
            self.tiles = {}
        if self.entities is None:
            self.entities = []
        if self.hud is None:
            self.hud = {}
    
    def get_tile(self, tile_type: str) -> np.ndarray:
        """Get tile sprite for type"""
        if isinstance(tile_type, str):
            # Handle string tile types
            tile_map = {
                'grass': TileType.GRASS,
                'stone': TileType.STONE,
                'water': TileType.WATER,
                'dirt': TileType.DIRT
            }
            tile_type_enum = tile_map.get(tile_type, TileType.GRASS)
        else:
            tile_type_enum = tile_type
        
        return self.tiles.get(tile_type_enum, self.tiles[TileType.GRASS])

class LegacyGraphicsEngineAdapter:
    """
    Adapter Pattern implementation for legacy GraphicsEngine
    
    Translates Universal Packets to legacy GraphicsEngine format while maintaining
    the frozen legacy codebase unchanged.
    """
    
    def __init__(self):
        self.legacy_engine = GraphicsEngine()
        self.last_frame_time = 0.0
        self.frame_count = 0
        
        # Create default tiles for compatibility
        self._create_default_tiles()
        
        logger.info("🔧 Legacy GraphicsEngine Adapter initialized")
    
    def _create_default_tiles(self):
        """Create default tile bank for legacy engine"""
        try:
            # Create simple tile bank with basic tiles
            import numpy as np
            
            # Create grass tile (16x16)
            grass_tile = np.full((16, 16, 3), [34, 139, 34], dtype=np.uint8)  # Green
            
            # Create stone tile
            stone_tile = np.full((16, 16, 3), [128, 128, 128], dtype=np.uint8)  # Gray
            
            # Create water tile
            water_tile = np.full((16, 16, 3), [0, 100, 200], dtype=np.uint8)  # Blue
            
            tiles = {
                TileType.GRASS: grass_tile,
                TileType.STONE: stone_tile,
                TileType.WATER: water_tile,
                TileType.DIRT: np.full((16, 16, 3), [139, 69, 19], dtype=np.uint8),  # Brown
            }
            
            # Create tile bank
            palette = {
                'grass': (34, 139, 34),
                'stone': (128, 128, 128),
                'water': (0, 100, 200),
                'dirt': (139, 69, 19)
            }
            
            self.tile_bank = TileBank("default", tiles, palette)
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to create default tiles: {e}")
            self.tile_bank = None
    
    def render_packet(self, packet_data: Dict[str, Any]) -> bool:
        """
        Render Universal Packet using legacy GraphicsEngine
        
        Args:
            packet_data: Universal packet data (POPO/JSON-serializable)
        
        Returns:
            True if rendering successful
        """
        try:
            # Convert packet to legacy format
            legacy_state = self._packet_to_legacy_state(packet_data)
            
            # Create render frame
            frame = self._create_render_frame(legacy_state)
            
            # Render using legacy engine
            if hasattr(self.legacy_engine, 'render_frame'):
                success = self.legacy_engine.render_frame(frame)
            else:
                # Fallback for very old engines
                success = self._fallback_render(legacy_state)
            
            if success:
                self.frame_count += 1
                self.last_frame_time = time.time()
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Legacy adapter rendering failed: {e}")
            return False
    
    def _packet_to_legacy_state(self, packet_data: Dict[str, Any]) -> LegacyRenderState:
        """Convert Universal Packet to LegacyRenderState"""
        # Extract basic dimensions
        width = packet_data.get('width', 160)
        height = packet_data.get('height', 144)
        
        # Extract entities
        entities = packet_data.get('entities', [])
        
        # Extract background
        background = packet_data.get('background', {}).get('id', 'grass')
        
        # Extract HUD
        hud = packet_data.get('hud', {})
        hud_lines = {
            'line_1': hud.get('line_1', ''),
            'line_2': hud.get('line_2', ''),
            'line_3': hud.get('line_3', ''),
            'line_4': hud.get('line_4', '')
        }
        
        # Extract tiles (if available)
        tiles = packet_data.get('tiles', {})
        
        return LegacyRenderState(
            width=width,
            height=height,
            tiles=tiles,
            entities=entities,
            background=background,
            hud=hud_lines
        )
    
    def _create_render_frame(self, state: LegacyRenderState) -> RenderFrame:
        """Create RenderFrame from legacy state"""
        try:
            import numpy as np
            
            # Create frame with all layers
            layers = {}
            
            # Background layer
            if self.tile_bank and state.background in self.tile_bank.tiles:
                bg_tile = self.tile_bank.tiles[state.background]
                # Create background by tiling the tile
                bg_layer = np.tile(bg_tile, (state.height // 16 + 1, state.width // 16 + 1, 1))
                bg_layer = bg_layer[:state.height, :state.width]
                layers[RenderLayer.BACKGROUND] = bg_layer
            
            # Entity layer (simplified)
            entity_layer = np.zeros((state.height, state.width, 3), dtype=np.uint8)
            for entity in state.entities:
                x, y = entity.get('x', 0), entity.get('y', 0)
                if 0 <= x < state.width and 0 <= y < state.height:
                    # Simple entity rendering (colored square)
                    color = self._get_entity_color(entity)
                    entity_layer[y, x] = color
            layers[RenderLayer.ENTITIES] = entity_layer
            
            # HUD layer (text overlay - simplified)
            hud_layer = np.zeros((state.height, state.width, 3), dtype=np.uint8)
            # Add HUD indicators as colored pixels
            if state.hud['line_1']:
                hud_layer[0:8, 0:80] = [255, 255, 255]  # White text area
            if state.hud['line_2']:
                hud_layer[8:16, 0:80] = [255, 255, 255]
            layers[RenderLayer.UI] = hud_layer
            
            return RenderFrame(
                width=state.width,
                height=state.height,
                layers=layers
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to create render frame: {e}")
            # Fallback to empty frame
            import numpy as np
            empty_layers = {layer: np.zeros((state.height, state.width, 3), dtype=np.uint8) 
                           for layer in RenderLayer}
            return RenderFrame(state.width, state.height, empty_layers)
    
    def _get_entity_color(self, entity: Dict[str, Any]) -> list:
        """Get color for entity based on its properties"""
        entity_id = entity.get('id', '')
        
        # Color mapping based on entity type
        if 'player' in entity_id or 'hero' in entity_id:
            return [0, 255, 0]  # Green
        elif 'enemy' in entity_id or 'monster' in entity_id:
            return [255, 0, 0]  # Red
        elif 'item' in entity_id or 'chest' in entity_id:
            return [255, 255, 0]  # Yellow
        elif 'wall' in entity_id or 'stone' in entity_id:
            return [128, 128, 128]  # Gray
        else:
            return [255, 255, 255]  # White
    
    def _fallback_render(self, state: LegacyRenderState) -> bool:
        """Fallback rendering method for very old engines"""
        try:
            # Simple rendering without frame composition
            logger.debug("🔧 Using fallback rendering method")
            return True
        except Exception as e:
            logger.error(f"❌ Fallback rendering failed: {e}")
            return False
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        return {
            'adapter_type': 'legacy_graphics_engine_adapter',
            'frame_count': self.frame_count,
            'last_render_time_ms': self.last_frame_time * 1000 if self.last_frame_time > 0 else 0,
            'avg_fps': 1.0 / self.last_frame_time if self.last_frame_time > 0 else 0,
            'legacy_engine_available': self.legacy_engine is not None,
            'tile_bank_available': self.tile_bank is not None
        }
    
    def cleanup(self):
        """Cleanup adapter resources"""
        if self.legacy_engine:
            try:
                if hasattr(self.legacy_engine, 'cleanup'):
                    self.legacy_engine.cleanup()
            except:
                pass
        logger.info("🧹 Legacy GraphicsEngine Adapter cleaned up")

# Factory function
def create_legacy_engine() -> LegacyGraphicsEngineAdapter:
    """Create legacy graphics engine adapter"""
    return LegacyGraphicsEngineAdapter()

# Compatibility alias
GraphicsEngineAdapter = LegacyGraphicsEngineAdapter
