"""
Test Rust DLL Functions Directly
Test the available functions in the compiled Rust DLL
"""

import ctypes
from pathlib import Path
from loguru import logger

def test_rust_dll_direct():
    """Test the Rust DLL and available functions directly"""
    dll_path = Path("maturin/dgt_harvest_rust.dll")
    
    if not dll_path.exists():
        logger.error(f"❌ DLL not found: {dll_path}")
        return
    
    try:
        # Load the DLL
        rust_lib = ctypes.CDLL(str(dll_path))
        logger.success(f"✅ Loaded Rust DLL: {dll_path}")
        
        # Test the test function
        try:
            test_func = rust_lib.test_rust_function
            logger.success(f"✅ Found function: test_rust_function")
            
            # Call the test function
            result = test_func()
            logger.info(f"🎯 Test result: {result}")
            
        except AttributeError as e:
            logger.error(f"❌ Function not found: {e}")
        
        # Test the scan function
        try:
            scan_func = rust_lib.scan_sprite_for_chest
            logger.success(f"✅ Found function: scan_sprite_for_chest")
            
            # Test with simple data
            test_pixels = b'\x80\x40\x20\xff' * 256  # Brown pixels
            result = scan_func(test_pixels, 32, 32)
            logger.info(f"🎯 Chest scan result: {result}")
            
        except AttributeError as e:
            logger.error(f"❌ Function not found: {e}")
        
        # List all available functions (Windows approach)
        try:
            import subprocess
            result = subprocess.run(['dumpbin', '/exports', str(dll_path)], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                logger.info("🔍 Available functions:")
                for line in lines:
                    if 'scan_sprite' in line or 'clean_sprite' in line or 'test_rust' in line:
                        logger.info(f"  {line.strip()}")
        except Exception as e:
            logger.warning(f"⚠️ Could not list functions: {e}")
        
    except Exception as e:
        logger.error(f"❌ Failed to load DLL: {e}")

if __name__ == "__main__":
    test_rust_dll_direct()
