"""
Test Rust DLL Functions
Check what functions are actually exported from the compiled Rust DLL
"""

import ctypes
from pathlib import Path
from loguru import logger

def test_rust_dll():
    """Test the Rust DLL and list available functions"""
    dll_path = Path("release/dgt_harvest_rust.dll")
    
    if not dll_path.exists():
        logger.error(f"❌ DLL not found: {dll_path}")
        return
    
    try:
        # Load the DLL
        rust_lib = ctypes.CDLL(str(dll_path))
        logger.success(f"✅ Loaded Rust DLL: {dll_path}")
        
        # Try to access the scan_sprite_for_chest function
        try:
            scan_func = rust_lib.scan_sprite_for_chest
            logger.success(f"✅ Found function: scan_sprite_for_chest")
            
            # Test with simple data
            test_pixels = b'\x80\x40\x20\xff' * 256  # Brown pixels
            result = scan_func(test_pixels, 32, 32)
            logger.info(f"🎯 Test result: {result}")
            
        except AttributeError as e:
            logger.error(f"❌ Function not found: {e}")
        
        # Try to access the clean_sprite_edges function
        try:
            clean_func = rust_lib.clean_sprite_edges
            logger.success(f"✅ Found function: clean_sprite_edges")
            
        except AttributeError as e:
            logger.error(f"❌ Function not found: {e}")
        
        # List all available functions (if possible)
        logger.info("🔍 Available functions:")
        try:
            # This is a Windows-specific approach
            import subprocess
            result = subprocess.run(['dumpbin', '/exports', str(dll_path)], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if 'scan_sprite' in line or 'clean_sprite' in line:
                        logger.info(f"  {line.strip()}")
        except Exception as e:
            logger.warning(f"⚠️ Could not list functions: {e}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load DLL: {e}")

if __name__ == "__main__":
    test_rust_dll()
