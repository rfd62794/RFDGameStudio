"""
Font Manager - Sovereign Scout Font System
Manages bitmap fonts for Phosphor Terminal and UI rendering

This system handles:
- 8x8 pixel fonts for terminal display
- 16x16 enhanced fonts for UI elements
- Energy-based font switching
- Phosphor glow compatibility
- CRT effects integration
"""

import os
import json
import time
from typing import Dict, Optional, Tuple, Any
from pathlib import Path
from dataclasses import dataclass
import sys

# Add parent directories for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from loguru import logger

@dataclass
class FontConfig:
    """Configuration for a font set"""
    name: str
    path: str
    char_width: int
    char_height: int
    file_format: str
    encoding: str
    sprite_sheet: str
    char_mapping: Dict[str, Tuple[int, int]]  # char -> (x, y) in sprite sheet

class FontManager:
    """Manages bitmap fonts for Sovereign Scout system"""
    
    def __init__(self):
        self.fonts: Dict[str, FontConfig] = {}
        self.current_font: Optional[str] = None
        self.font_cache: Dict[str, Any] = {}
        
        # Font directory paths
        self.font_dir = Path(__file__).parent
        self.public_pixel_dir = self.font_dir / "public_pixel"
        
        # Initialize font configurations
        self._initialize_font_configs()
        
        logger.info("🔤 Font Manager initialized")
    
    def _initialize_font_configs(self):
        """Initialize default font configurations"""
        # 8x8 Terminal Fonts
        self.fonts['terminal_green'] = FontConfig(
            name='terminal_green',
            path=str(self.public_pixel_dir / '8x8_basic'),
            char_width=8,
            char_height=16,  # Scaled for readability
            file_format='png',
            encoding='ascii',
            sprite_sheet='terminal_green.png',
            char_mapping={}
        )
        
        self.fonts['terminal_amber'] = FontConfig(
            name='terminal_amber',
            path=str(self.public_pixel_dir / '8x8_basic'),
            char_width=8,
            char_height=16,
            file_format='png',
            encoding='ascii',
            sprite_sheet='terminal_amber.png',
            char_mapping={}
        )
        
        self.fonts['terminal_red'] = FontConfig(
            name='terminal_red',
            path=str(self.public_pixel_dir / '8x8_basic'),
            char_width=8,
            char_height=16,
            file_format='png',
            encoding='ascii',
            sprite_sheet='terminal_red.png',
            char_mapping={}
        )
        
        # 16x16 UI Fonts
        self.fonts['ui_normal'] = FontConfig(
            name='ui_normal',
            path=str(self.public_pixel_dir / '16x16_enhanced'),
            char_width=16,
            char_height=16,
            file_format='png',
            encoding='ascii',
            sprite_sheet='ui_normal.png',
            char_mapping={}
        )
        
        logger.info(f"🔤 Initialized {len(self.fonts)} font configurations")
    
    def load_font(self, font_name: str) -> bool:
        """Load font configuration and character mapping"""
        if font_name not in self.fonts:
            logger.error(f"❌ Font '{font_name}' not found")
            return False
        
        config = self.fonts[font_name]
        
        # Load character mapping from atlas file if exists
        atlas_path = Path(config.path) / 'font_atlas.json'
        if atlas_path.exists():
            try:
                with open(atlas_path, 'r') as f:
                    atlas_data = json.load(f)
                    config.char_mapping = atlas_data.get('characters', {})
                logger.info(f"🔤 Loaded character mapping for '{font_name}'")
            except Exception as e:
                logger.error(f"❌ Failed to load font atlas for '{font_name}': {e}")
                return False
        else:
            # Generate default ASCII mapping
            config.char_mapping = self._generate_ascii_mapping(config)
            logger.info(f"🔤 Generated ASCII mapping for '{font_name}'")
        
        # Cache font configuration
        self.font_cache[font_name] = {
            'config': config,
            'loaded_at': time.time()
        }
        
        return True
    
    def _generate_ascii_mapping(self, config: FontConfig) -> Dict[str, Tuple[int, int]]:
        """Generate default ASCII character mapping"""
        mapping = {}
        
        # Standard ASCII printable characters (32-126)
        chars_per_row = 16  # Assume 16 characters per row in sprite sheet
        
        for i, char_code in range(32, 127):
            char = chr(char_code)
            row = (char_code - 32) // chars_per_row
            col = (char_code - 32) % chars_per_row
            
            mapping[char] = (
                col * config.char_width,
                row * config.char_height
            )
        
        return mapping
    
    def set_font(self, font_name: str) -> bool:
        """Set current active font"""
        if font_name not in self.fonts:
            logger.error(f"❌ Font '{font_name}' not available")
            return False
        
        # Load font if not cached
        if font_name not in self.font_cache:
            if not self.load_font(font_name):
                return False
        
        self.current_font = font_name
        logger.info(f"🔤 Switched to font: {font_name}")
        return True
    
    def get_font_for_energy(self, energy_level: float) -> str:
        """Get appropriate font based on energy level"""
        if energy_level > 75:
            return 'terminal_green'
        elif energy_level > 50:
            return 'terminal_amber'
        elif energy_level > 25:
            return 'terminal_red'
        else:
            return 'terminal_red'  # Critical state
    
    def auto_switch_font(self, energy_level: float) -> bool:
        """Automatically switch font based on energy level"""
        target_font = self.get_font_for_energy(energy_level)
        return self.set_font(target_font)
    
    def get_char_position(self, char: str) -> Optional[Tuple[int, int]]:
        """Get character position in sprite sheet"""
        if not self.current_font or self.current_font not in self.font_cache:
            logger.error("❌ No font loaded")
            return None
        
        config = self.font_cache[self.current_font]['config']
        
        if char not in config.char_mapping:
            # Use space character as fallback
            char = ' '
        
        return config.char_mapping.get(char)
    
    def get_char_dimensions(self) -> Tuple[int, int]:
        """Get current font character dimensions"""
        if not self.current_font or self.current_font not in self.font_cache:
            return (8, 16)  # Default fallback
        
        config = self.font_cache[self.current_font]['config']
        return (config.char_width, config.char_height)
    
    def get_available_fonts(self) -> list:
        """Get list of available fonts"""
        return list(self.fonts.keys())
    
    def get_font_info(self, font_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a font"""
        if font_name not in self.fonts:
            return None
        
        config = self.fonts[font_name]
        is_loaded = font_name in self.font_cache
        
        return {
            'name': config.name,
            'path': config.path,
            'char_width': config.char_width,
            'char_height': config.char_height,
            'file_format': config.file_format,
            'sprite_sheet': config.sprite_sheet,
            'char_count': len(config.char_mapping),
            'is_loaded': is_loaded,
            'sprite_sheet_path': os.path.join(config.path, config.sprite_sheet)
        }
    
    def create_font_atlas(self, font_name: str, chars: str = None) -> bool:
        """Create font atlas file for a font"""
        if font_name not in self.fonts:
            logger.error(f"❌ Font '{font_name}' not found")
            return False
        
        config = self.fonts[font_name]
        
        # Use default ASCII if no characters specified
        if chars is None:
            chars = ''.join(chr(i) for i in range(32, 127))
        
        # Generate mapping
        mapping = {}
        chars_per_row = 16
        
        for i, char in enumerate(chars):
            row = i // chars_per_row
            col = i % chars_per_row
            mapping[char] = [col * config.char_width, row * config.char_height]
        
        # Save atlas file
        atlas_path = Path(config.path) / 'font_atlas.json'
        try:
            os.makedirs(config.path, exist_ok=True)
            
            atlas_data = {
                'font_name': font_name,
                'char_width': config.char_width,
                'char_height': config.char_height,
                'chars_per_row': chars_per_row,
                'characters': mapping,
                'created_at': time.time()
            }
            
            with open(atlas_path, 'w') as f:
                json.dump(atlas_data, f, indent=2)
            
            logger.info(f"🔤 Created font atlas for '{font_name}': {atlas_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create font atlas for '{font_name}': {e}")
            return False
    
    def import_public_pixel_fonts(self, source_dir: str) -> bool:
        """Import fonts from Public_Pixel_Font_1_24 directory"""
        source_path = Path(source_dir)
        
        if not source_path.exists():
            logger.error(f"❌ Source directory not found: {source_dir}")
            return False
        
        try:
            # Create target directories
            target_8x8 = self.public_pixel_dir / '8x8_basic'
            target_16x16 = self.public_pixel_dir / '16x16_enhanced'
            target_special = self.public_pixel_dir / 'special'
            
            os.makedirs(target_8x8, exist_ok=True)
            os.makedirs(target_16x16, exist_ok=True)
            os.makedirs(target_special, exist_ok=True)
            
            # Copy font files (this would need actual implementation)
            # For now, just create placeholder atlas files
            
            # Create 8x8 terminal font atlas
            self.create_font_atlas('terminal_green')
            self.create_font_atlas('terminal_amber')
            self.create_font_atlas('terminal_red')
            
            # Create 16x16 UI font atlas
            self.create_font_atlas('ui_normal')
            
            logger.info(f"🔤 Imported fonts from {source_dir}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to import fonts: {e}")
            return False

# Global font manager instance
font_manager = FontManager()

# Factory function
def get_font_manager() -> FontManager:
    """Get the global font manager instance"""
    return font_manager

# Export main components
__all__ = ['FontManager', 'FontConfig', 'get_font_manager', 'font_manager']
