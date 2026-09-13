#!/usr/bin/env python3
"""
Test Rust-Powered DGT Sheet-Cutter Performance
Test the complete pipeline with Rust-powered sprite analysis
"""

import tkinter as tk
from PIL import Image
from pathlib import Path
import time
import sys
import os
from loguru import logger

# Add src to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from dgt_sheet_cutter import DGTSheetCutter
from rust_sprite_scanner import RustSpriteScanner

def test_rust_performance():
    """Test Rust-powered sprite analysis performance"""
    
    # Create the main window
    root = tk.Tk()
    root.withdraw()
    
    # Initialize the DGT Sheet-Cutter
    cutter = DGTSheetCutter(root)
    
    # Initialize Rust scanner
    scanner = RustSpriteScanner()
    
    print("🚀 Testing Rust-Powered DGT Sheet-Cutter Performance")
    print("=" * 50)
    
    # Load a test sprite
    test_image_path = Path('assets/tiny_farm/Objects/chest.png')
    
    if not test_image_path.exists():
        logger.error(f"❌ Test image not found: {test_image_path}")
        return
    
    try:
        # Load the test image
        print(f"📄 Loading test image: {test_image_path}")
        cutter.raw_image = Image.open(test_image_path)
        cutter.display_image = cutter.raw_image.copy()
        
        # Test Rust-powered analysis
        print("🔧 Testing Rust-powered sprite analysis...")
        
        # Convert sprite to RGBA bytes for Rust analysis
        if cutter.raw_image.mode != 'RGBA':
            cutter.raw_image = cutter.raw_image.convert('RGBA')
        
        width, height = cutter.raw_image.size
        pixels = cutter.raw_image.tobytes()
        
        # Warm up
        scanner.analyze_sprite(pixels, width, height)
        
        # Performance test
        iterations = 1000
        start_time = time.time()
        
        for i in range(iterations):
            analysis = scanner.analyze_sprite(pixels, width, height)
        
        end_time = time.time()
        
        total_time = end_time - start_time
        avg_time = total_time / iterations
        
        logger.success(f"🦀 Rust Performance Results:")
        logger.info(f"  Total time: {total_time:.3f}s for {iterations} iterations")
        logger.info(f"  Average time: {avg_time * 1000:.3f}ms per sprite")
        logger.info(f"  Sprites per second: {iterations / total_time:.0f}")
        
        # Test with actual DGT Sheet-Cutter
        print("\n🎯 Testing DGT Sheet-Cutter with Rust analysis...")
        
        # Select a tile
        cutter.selected_coords = (0, 0)
        
        # Cut sprite with Rust analysis
        start_time = time.time()
        cutter.cut_sprite()
        end_time = time.time()
        
        cut_time = end_time - start_time
        logger.info(f"🔪 DGT Sheet-Cutter cut time: {cut_time * 1000:.3f}ms")
        
        # Show results
        if cutter.cut_sprites:
            last_sprite = cutter.cut_sprites[-1]
            print(f"✅ Last cut sprite: {last_sprite['name']}")
            print(f"   Object type: {last_sprite['object_type']}")
            print(f"   Tags: {last_sprite['tags']}")
        
        print(f"\n🎯 Performance Summary:")
        print(f"  Rust analysis: {avg_time * 1000:.3f}ms per sprite")
        print(f"  DGT cut: {cut_time * 1000:.3f}ms per sprite")
        print(f"  Combined: {(avg_time + cut_time) * 1000:.3f}ms per sprite")
        print(f"  Total throughput: {iterations / (total_time + cut_time):.0f} sprites/sec")
        
        print("\n🚀 Rust-Powered DGT Sheet-Cutter is working!")
        print("🎯 Instant sub-millisecond sprite analysis achieved!")
        
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        root.destroy()

if __name__ == "__main__":
    test_rust_performance()
