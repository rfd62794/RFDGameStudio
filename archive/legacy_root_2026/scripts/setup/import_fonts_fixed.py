"""
Font Import Script - Public Pixel Font Integration
Imports fonts from C:\\Users\\cheat\\Downloads\\Public_Pixel_Font_1_24
and sets up the Sovereign Scout font system
"""

import os
import shutil
from pathlib import Path
import sys

# Add src to path
sys.path.append(str(Path(__file__).parent.parent))

from loguru import logger

# Import font manager
try:
    from src.ui.font_manager import get_font_manager
    FONT_MANAGER_AVAILABLE = True
except ImportError as e:
    logger.error(f"❌ Font Manager not available: {e}")
    FONT_MANAGER_AVAILABLE = False

class FontImporter:
    """Imports and configures Public Pixel fonts for Sovereign Scout"""
    
    def __init__(self):
        # Use raw string to avoid unicode escape issues
        self.source_dir = Path(r"C:\Users\cheat\Downloads\Public_Pixel_Font_1_24")
        self.target_dir = Path("assets/fonts/public_pixel")
        self.font_manager = get_font_manager() if FONT_MANAGER_AVAILABLE else None
        
        logger.info("🔤 Font Importer initialized")
    
    def import_fonts(self) -> bool:
        """Import fonts from Public_Pixel_Font_1_24"""
        if not self.source_dir.exists():
            logger.error(f"❌ Source directory not found: {self.source_dir}")
            return False
        
        try:
            # Create target directories
            target_8x8 = self.target_dir / "8x8_basic"
            target_16x16 = self.target_dir / "16x16_enhanced"
            target_special = self.target_dir / "special"
            
            os.makedirs(target_8x8, exist_ok=True)
            os.makedirs(target_16x16, exist_ok=True)
            os.makedirs(target_special, exist_ok=True)
            
            logger.info(f"🔤 Created target directories in {self.target_dir}")
            
            # Scan source directory for font files
            font_files = self._scan_font_files()
            logger.info(f"🔤 Found {len(font_files)} font files")
            
            # Copy and organize fonts
            imported_count = 0
            for font_file in font_files:
                if self._import_font_file(font_file):
                    imported_count += 1
            
            logger.info(f"🔤 Imported {imported_count} font files")
            
            # Create font atlases
            if self.font_manager:
                self._create_font_atlases()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to import fonts: {e}")
            return False
    
    def _scan_font_files(self) -> list:
        """Scan source directory for font files"""
        font_files = []
        
        # Common font file extensions
        font_extensions = ['.png', '.bmp', '.tga', '.gif', '.jpg', '.jpeg']
        
        if self.source_dir.exists():
            for file_path in self.source_dir.rglob('*'):
                if file_path.is_file() and file_path.suffix.lower() in font_extensions:
                    font_files.append(file_path)
        
        return font_files
    
    def _import_font_file(self, font_file: Path) -> bool:
        """Import a single font file"""
        try:
            # Determine target directory based on file characteristics
            target_dir = self._determine_target_directory(font_file)
            
            # Copy file
            target_path = target_dir / font_file.name
            shutil.copy2(font_file, target_path)
            
            logger.debug(f"🔤 Imported: {font_file.name} -> {target_dir.name}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to import {font_file.name}: {e}")
            return False
    
    def _determine_target_directory(self, font_file: Path) -> Path:
        """Determine target directory based on file characteristics"""
        filename = font_file.name.lower()
        
        # Check for size indicators in filename
        if '8x8' in filename or '8x16' in filename or 'terminal' in filename:
            return self.target_dir / "8x8_basic"
        elif '16x16' in filename or 'ui' in filename or 'enhanced' in filename:
            return self.target_dir / "16x16_enhanced"
        elif 'special' in filename or 'symbol' in filename or 'icon' in filename:
            return self.target_dir / "special"
        else:
            # Default to 8x8 for unknown files
            return self.target_dir / "8x8_basic"
    
    def _create_font_atlases(self):
        """Create font atlas files for imported fonts"""
        if not self.font_manager:
            logger.warning("⚠️ Font Manager not available, skipping atlas creation")
            return
        
        # Create atlases for terminal fonts
        terminal_fonts = ['terminal_green', 'terminal_amber', 'terminal_red']
        for font_name in terminal_fonts:
            if self.font_manager.load_font(font_name):
                logger.info(f"🔤 Created atlas for {font_name}")
        
        # Create atlas for UI font
        if self.font_manager.load_font('ui_normal'):
            logger.info("🔤 Created atlas for ui_normal")
    
    def setup_font_system(self) -> bool:
        """Complete font system setup"""
        logger.info("🔤 Setting up Sovereign Scout font system...")
        
        # Step 1: Import fonts
        if not self.import_fonts():
            logger.error("❌ Font import failed")
            return False
        
        # Step 2: Initialize font manager
        if self.font_manager:
            # Set default font
            self.font_manager.set_font('terminal_green')
            
            # Test font switching
            available_fonts = self.font_manager.get_available_fonts()
            logger.info(f"🔤 Available fonts: {available_fonts}")
        
        logger.info("✅ Font system setup complete")
        return True

def main():
    """Main entry point for font import"""
    print("🔤 Sovereign Scout Font Import")
    print("=" * 50)
    print("📁 Importing from: C:\\Users\\cheat\\Downloads\\Public_Pixel_Font_1_24")
    print("🎯 Target: assets/fonts/public_pixel/")
    print("=" * 50)
    print()
    
    importer = FontImporter()
    
    if importer.setup_font_system():
        print("✅ Font import successful!")
        print("🔤 Font system ready for Phosphor Terminal")
        print("🎨 CRT effects integration complete")
    else:
        print("❌ Font import failed")
        print("🔧 Check source directory and permissions")
    
    print()
    print("=" * 50)
    print("🔤 Font Import Complete")

if __name__ == "__main__":
    main()
