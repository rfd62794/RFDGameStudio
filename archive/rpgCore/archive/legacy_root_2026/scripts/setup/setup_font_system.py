"""
Font System Setup - Public Pixel Font Integration
Sets up the Sovereign Scout font system with TrueType fonts
and creates sprite sheets for Phosphor Terminal rendering
"""

import os
import shutil
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont
import json

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger

class FontSystemSetup:
    """Sets up the Sovereign Scout font system with TrueType fonts"""
    
    def __init__(self):
        self.source_dir = Path(r"C:\Users\cheat\Downloads\Public_Pixel_Font_1_24")
        self.target_dir = Path("assets/fonts/public_pixel")
        
        # Font directories
        self.ttf_dir = self.target_dir / "ttf"
        self.png_dir = self.target_dir / "png"
        self.atlas_dir = self.target_dir / "atlas"
        
        logger.info("🔤 Font System Setup initialized")
    
    def setup_font_system(self) -> bool:
        """Complete font system setup"""
        logger.info("🔤 Setting up Sovereign Scout font system...")
        
        try:
            # Step 1: Create directories
            self._create_directories()
            
            # Step 2: Import TrueType fonts
            self._import_ttf_fonts()
            
            # Step 3: Generate sprite sheets
            self._generate_sprite_sheets()
            
            # Step 4: Create font atlases
            self._create_font_atlases()
            
            logger.info("✅ Font system setup complete")
            return True
            
        except Exception as e:
            logger.error(f"❌ Font system setup failed: {e}")
            return False
    
    def _create_directories(self):
        """Create necessary directories"""
        directories = [self.ttf_dir, self.png_dir, self.atlas_dir]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"🔤 Created font directories in {self.target_dir}")
    
    def _import_ttf_fonts(self):
        """Import TrueType fonts from source directory"""
        font_files = list(self.source_dir.glob("*.ttf"))
        
        for font_file in font_files:
            target_path = self.ttf_dir / font_file.name
            shutil.copy2(font_file, target_path)
            logger.info(f"🔤 Imported TTF font: {font_file.name}")
        
        # Also import OTF if available
        otf_files = list(self.source_dir.glob("*.otf"))
        for font_file in otf_files:
            target_path = self.ttf_dir / font_file.name
            shutil.copy2(font_file, target_path)
            logger.info(f"🔤 Imported OTF font: {font_file.name}")
    
    def _generate_sprite_sheets(self):
        """Generate PNG sprite sheets from TrueType fonts"""
        ttf_files = list(self.ttf_dir.glob("*.ttf"))
        
        if not ttf_files:
            logger.warning("⚠️ No TTF fonts found for sprite sheet generation")
            return
        
        # Use the first TTF font found
        font_file = ttf_files[0]
        
        try:
            # Load font
            font = ImageFont.truetype(str(font_file), 16)  # 16px font size
            
            # Generate different color variants
            variants = [
                ('terminal_green', '#00FF00'),
                ('terminal_amber', '#FFFF00'),
                ('terminal_red', '#FF0000'),
                ('ui_normal', '#FFFFFF')
            ]
            
            for variant_name, color in variants:
                self._create_sprite_sheet(font, variant_name, color)
            
            logger.info("🔤 Generated sprite sheets for all variants")
            
        except Exception as e:
            logger.error(f"❌ Failed to generate sprite sheets: {e}")
    
    def _create_sprite_sheet(self, font, variant_name: str, color: str):
        """Create a PNG sprite sheet for a font variant"""
        # Character grid dimensions
        chars_per_row = 16
        char_width = 16
        char_height = 16
        
        # Create sprite sheet
        sheet_width = chars_per_row * char_width
        sheet_height = 16 * char_height  # 16 rows for ASCII 32-127
        
        # Create image with transparent background
        sprite_sheet = Image.new('RGBA', (sheet_width, sheet_height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(sprite_sheet)
        
        # Convert color to RGB
        rgb_color = self._hex_to_rgb(color)
        
        # Draw characters
        for char_code in range(32, 128):  # Printable ASCII
            char = chr(char_code)
            row = (char_code - 32) // chars_per_row
            col = (char_code - 32) % chars_per_row
            
            x = col * char_width
            y = row * char_height
            
            # Draw character
            draw.text((x, y + 2), char, font=font, fill=rgb_color + (255,))
        
        # Save sprite sheet
        sprite_file = self.png_dir / f"{variant_name}.png"
        sprite_sheet.save(sprite_file)
        logger.info(f"🔤 Created sprite sheet: {variant_name}.png")
    
    def _hex_to_rgb(self, hex_color: str) -> tuple:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _create_font_atlases(self):
        """Create font atlas JSON files"""
        variants = ['terminal_green', 'terminal_amber', 'terminal_red', 'ui_normal']
        
        for variant in variants:
            atlas_data = {
                'font_name': variant,
                'char_width': 16,
                'char_height': 16,
                'chars_per_row': 16,
                'characters': {},
                'sprite_sheet': f"{variant}.png",
                'color': self._get_variant_color(variant),
                'created_at': '2026-02-08'
            }
            
            # Generate character positions
            for char_code in range(32, 128):
                char = chr(char_code)
                row = (char_code - 32) // 16
                col = (char_code - 32) % 16
                
                atlas_data['characters'][char] = [
                    col * 16,  # x position
                    row * 16   # y position
                ]
            
            # Save atlas
            atlas_file = self.atlas_dir / f"{variant}_atlas.json"
            with open(atlas_file, 'w') as f:
                json.dump(atlas_data, f, indent=2)
            
            logger.info(f"🔤 Created font atlas: {variant}_atlas.json")
    
    def _get_variant_color(self, variant: str) -> str:
        """Get color for font variant"""
        colors = {
            'terminal_green': '#00FF00',
            'terminal_amber': '#FFFF00',
            'terminal_red': '#FF0000',
            'ui_normal': '#FFFFFF'
        }
        return colors.get(variant, '#00FF00')
    
    def create_font_config(self):
        """Create font configuration file"""
        config = {
            'font_system': {
                'version': '1.0',
                'source': 'Public Pixel Font 1.24',
                'created': '2026-02-08'
            },
            'variants': {
                'terminal_green': {
                    'sprite_sheet': 'png/terminal_green.png',
                    'atlas': 'atlas/terminal_green_atlas.json',
                    'color': '#00FF00',
                    'energy_threshold': 75
                },
                'terminal_amber': {
                    'sprite_sheet': 'png/terminal_amber.png',
                    'atlas': 'atlas/terminal_amber_atlas.json',
                    'color': '#FFFF00',
                    'energy_threshold': 50
                },
                'terminal_red': {
                    'sprite_sheet': 'png/terminal_red.png',
                    'atlas': 'atlas/terminal_red_atlas.json',
                    'color': '#FF0000',
                    'energy_threshold': 25
                },
                'ui_normal': {
                    'sprite_sheet': 'png/ui_normal.png',
                    'atlas': 'atlas/ui_normal_atlas.json',
                    'color': '#FFFFFF',
                    'energy_threshold': 0
                }
            },
            'rendering': {
                'char_width': 16,
                'char_height': 16,
                'chars_per_row': 16,
                'scale_factor': 1.0
            }
        }
        
        config_file = self.target_dir / 'font_config.json'
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info("🔤 Created font configuration file")

def main():
    """Main entry point for font system setup"""
    print("🔤 Sovereign Scout Font System Setup")
    print("=" * 50)
    print("📁 Source: C:\\Users\\cheat\\Downloads\\Public_Pixel_Font_1_24")
    print("🎯 Target: assets/fonts/public_pixel/")
    print("🎨 Generating sprite sheets for Phosphor Terminal")
    print("=" * 50)
    print()
    
    setup = FontSystemSetup()
    
    if setup.setup_font_system():
        setup.create_font_config()
        
        print("✅ Font system setup successful!")
        print("🔤 Sprite sheets generated for Phosphor Terminal")
        print("🎨 Font atlases created for all variants")
        print("📋 Configuration file generated")
        print()
        print("📁 Font directory structure:")
        print("   assets/fonts/public_pixel/")
        print("   ├── ttf/           # Original TrueType fonts")
        print("   ├── png/           # Generated sprite sheets")
        print("   ├── atlas/         # Font atlas JSON files")
        print("   └── font_config.json # System configuration")
    else:
        print("❌ Font system setup failed")
        print("🔧 Check source directory and PIL availability")
    
    print()
    print("=" * 50)
    print("🔤 Font System Setup Complete")

if __name__ == "__main__":
    main()
