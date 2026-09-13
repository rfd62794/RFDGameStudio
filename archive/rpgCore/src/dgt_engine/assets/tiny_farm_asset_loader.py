"""
Tiny Farm Asset Loader - ADR 107: Professional Asset Integration
Enhanced asset loader that prioritizes Tiny Farm assets while maintaining DGT DNA
"""

import tkinter as tk
from typing import Dict, Optional, List
from loguru import logger

from .tiny_farm_bridge import create_tiny_farm_bridge, TinyFarmAssetType
from ..graphics.enhanced_ppu_dual_layer import EnhancedAssetLoader
from ..graphics.character_sprites import create_character_sprite


class TinyFarmAssetLoader(EnhancedAssetLoader):
    """
    Enhanced asset loader with Tiny Farm RPG integration
    
    Priority Order:
    1. Tiny Farm processed assets (professional art)
    2. DGT procedural assets (systemic DNA)
    3. Fallback colored rectangles (debug)
    """
    
    def __init__(self, tiny_farm_dir: str = "assets/tiny_farm"):
        super().__init__()
        
        # Initialize Tiny Farm bridge
        self.tiny_farm_bridge = create_tiny_farm_bridge(tiny_farm_dir)
        
        # Create demo sprites for testing
        self.tiny_farm_bridge.create_demo_sprites()
        
        # Override character sprites with Tiny Farm versions
        self._setup_tiny_farm_characters()
        
        # Integrate Tiny Farm assets into main sprite registry
        self._integrate_tiny_farm_assets()
        
        logger.info("🚜 Tiny Farm Asset Loader initialized with professional assets")
    
    def _setup_tiny_farm_characters(self) -> None:
        """Setup character sprites using Tiny Farm assets"""
        try:
            # Create enhanced voyager with Tiny Farm hero sprite
            tiny_farm_voyager = self.tiny_farm_bridge.get_processed_sprite("voyager")
            
            if tiny_farm_voyager:
                # Create character sprite with Tiny Farm visual
                voyager_character = create_character_sprite("voyager", "mystic")
                
                # Override the sprite frames with Tiny Farm assets
                self._override_character_sprites(voyager_character, "voyager")
                
                self.character_sprites["voyager"] = voyager_character
                logger.info("🚶‍♂️ Tiny Farm hero sprite mapped to Voyager character")
            else:
                logger.warning("⚠️ Tiny Farm voyager sprite not found, using DGT fallback")
                
        except Exception as e:
            logger.error(f"⚠️ Error setting up Tiny Farm characters: {e}")
    
    def _override_character_sprites(self, character: any, sprite_id: str) -> None:
        """Override character sprite frames with Tiny Farm assets"""
        try:
            # Get Tiny Farm mapping
            mapping = self.tiny_farm_bridge.get_mapping(sprite_id)
            if not mapping:
                return
            
            # Get processed sprites
            idle_sprite = self.tiny_farm_bridge.get_processed_sprite("voyager")
            walk_sprite = self.tiny_farm_bridge.get_processed_sprite("voyager_walk")
            
            if idle_sprite and hasattr(character, 'animations'):
                # Override idle animation frames
                from ..graphics.character_sprites import AnimationState, SpriteFrame
                
                idle_animation = character.animations.get(AnimationState.IDLE)
                if idle_animation and idle_animation.frames:
                    # Replace with Tiny Farm sprite
                    for frame in idle_animation.frames:
                        frame.image = idle_sprite
                
                # Override walk animation if available
                if walk_sprite:
                    walk_animation = character.animations.get(AnimationState.WALKING)
                    if walk_animation and walk_animation.frames:
                        for frame in walk_animation.frames:
                            frame.image = walk_sprite
                
                logger.debug(f"🎨 Overrode character sprites for {sprite_id}")
                
        except Exception as e:
            logger.error(f"⚠️ Error overriding character sprites: {e}")
    
    def _integrate_tiny_farm_assets(self) -> None:
        """Integrate Tiny Farm assets into main sprite registry"""
        try:
            # Get all Tiny Farm mappings
            mappings = self.tiny_farm_bridge.get_all_mappings()
            
            for sprite_id, mapping in mappings.items():
                # Get processed sprite
                tiny_farm_sprite = self.tiny_farm_bridge.get_processed_sprite(sprite_id)
                
                if tiny_farm_sprite:
                    # Add to main sprite registry
                    self.sprites[sprite_id] = tiny_farm_sprite
                    
                    # Add DNA tags to metadata
                    if hasattr(self, 'asset_metadata'):
                        self.asset_metadata[sprite_id] = {
                            'asset_type': mapping.asset_type.value,
                            'material_type': mapping.material_type.value,
                            'dna_tags': mapping.dna_tags,
                            'is_animated': mapping.is_animated,
                            'source': 'tiny_farm'
                        }
                    
                    logger.debug(f"🔄 Integrated Tiny Farm asset: {sprite_id}")
            
            logger.info(f"✅ Integrated {len([s for s in self.sprites.values() if s])} Tiny Farm assets")
            
        except Exception as e:
            logger.error(f"⚠️ Error integrating Tiny Farm assets: {e}")
    
    def get_sprite(self, sprite_id: str) -> Optional[tk.PhotoImage]:
        """Get sprite with Tiny Farm priority"""
        # First try Tiny Farm assets
        tiny_farm_sprite = self.tiny_farm_bridge.get_processed_sprite(sprite_id)
        if tiny_farm_sprite:
            return tiny_farm_sprite
        
        # Then try character sprites
        if sprite_id in self.character_sprites:
            character = self.character_sprites[sprite_id]
            return character.get_current_frame()
        
        # Finally fall back to DGT procedural assets
        return self.sprites.get(sprite_id)
    
    def get_character_sprite(self, sprite_id: str):
        """Get character sprite with Tiny Farm enhancement"""
        return self.character_sprites.get(sprite_id)
    
    def get_asset_info(self, sprite_id: str) -> Optional[Dict]:
        """Get asset information including source"""
        # Check if it's a Tiny Farm asset
        mapping = self.tiny_farm_bridge.get_mapping(sprite_id)
        if mapping:
            return {
                'sprite_id': sprite_id,
                'source': 'tiny_farm',
                'asset_type': mapping.asset_type.value,
                'material_type': mapping.material_type.value,
                'dna_tags': mapping.dna_tags,
                'is_animated': mapping.is_animated,
                'dither_pattern': mapping.dither_pattern
            }
        
        # Check if it's a character sprite
        if sprite_id in self.character_sprites:
            return {
                'sprite_id': sprite_id,
                'source': 'dgt_character',
                'asset_type': 'character',
                'material_type': 'organic',
                'dna_tags': ['Animated', 'Player'],
                'is_animated': True
            }
        
        # Default DGT asset
        return {
            'sprite_id': sprite_id,
            'source': 'dgt_procedural',
            'asset_type': 'procedural',
            'material_type': 'unknown',
            'dna_tags': [],
            'is_animated': False
        }
    
    def get_tiny_farm_stats(self) -> Dict:
        """Get Tiny Farm integration statistics"""
        mappings = self.tiny_farm_bridge.get_all_mappings()
        processed_sprites = self.tiny_farm_bridge.processed_sprites
        
        asset_type_counts = {}
        material_type_counts = {}
        
        for mapping in mappings.values():
            # Count by asset type
            asset_type = mapping.asset_type.value
            asset_type_counts[asset_type] = asset_type_counts.get(asset_type, 0) + 1
            
            # Count by material type
            material_type = mapping.material_type.value
            material_type_counts[material_type] = material_type_counts.get(material_type, 0) + 1
        
        return {
            'total_mappings': len(mappings),
            'processed_sprites': len(processed_sprites),
            'asset_types': asset_type_counts,
            'material_types': material_type_counts,
            'character_sprites': len(self.character_sprites),
            'total_sprites': len(self.sprites)
        }


# Factory function
def create_tiny_farm_asset_loader(tiny_farm_dir: str = "assets/tiny_farm") -> TinyFarmAssetLoader:
    """Create Tiny Farm enhanced asset loader"""
    return TinyFarmAssetLoader(tiny_farm_dir)


# Test implementation
if __name__ == "__main__":
    import tkinter as tk
    
    # Test Tiny Farm asset loader
    root = tk.Tk()
    root.title("Tiny Farm Asset Loader Test")
    root.geometry("800x600")
    root.configure(bg='#1a1a1a')
    
    # Create asset loader
    asset_loader = create_tiny_farm_asset_loader()
    
    # Display stats
    stats = asset_loader.get_tiny_farm_stats()
    print(f"🚜 Tiny Farm Stats: {stats}")
    
    # Create canvas for testing
    canvas = tk.Canvas(root, width=800, height=400, bg='#0a0a0a')
    canvas.pack(pady=20)
    
    # Test sprite retrieval
    test_sprites = ["voyager", "swaying_oak", "ancient_stone", "iron_lockbox"]
    
    x_offset = 0
    for sprite_id in test_sprites:
        sprite = asset_loader.get_sprite(sprite_id)
        if sprite:
            canvas.create_image(x_offset, 50, image=sprite, anchor='nw')
            
            # Show asset info
            info = asset_loader.get_asset_info(sprite_id)
            info_text = f"{sprite_id} ({info['source']})"
            canvas.create_text(x_offset + 32, 30, text=info_text, 
                             fill='#00ff00', font=('Arial', 8), anchor='nw')
        
        x_offset += 150
    
    # Stats display
    stats_text = f"Tiny Farm Assets: {stats['processed_sprites']}/{stats['total_mappings']}"
    stats_label = tk.Label(root, text=stats_text, bg='#1a1a1a', fg='#00ff00')
    stats_label.pack()
    
    print("🚜 Tiny Farm Asset Loader Test running - Close window to exit")
    root.mainloop()
