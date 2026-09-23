"""
Rust vs Python Performance Test
Demonstrates the speed difference between Rust and Python sprite analysis
"""

import time
from PIL import Image
from rust_sprite_scanner import RustSpriteScanner
from loguru import logger


def create_test_sprite(width: int = 32, height: int = 32) -> bytes:
    """Create a test sprite with chest-like colors"""
    image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    pixels = image.load()
    
    # Fill with chest-like brown colors
    for y in range(height):
        for x in range(width):
            # Chest brown color
            pixels[x, y] = (120, 60, 30, 255)
    
    return image.tobytes()


def test_rust_performance():
    """Test Rust-powered sprite analysis performance"""
    scanner = RustSpriteScanner()
    
    # Create test data
    test_pixels = create_test_sprite(32, 32)
    
    # Warm up
    scanner.analyze_sprite(test_pixels, 32, 32)
    
    # Performance test
    iterations = 1000
    start_time = time.time()
    
    for i in range(iterations):
        analysis = scanner.analyze_sprite(test_pixels, 32, 32)
    
    end_time = time.time()
    
    total_time = end_time - start_time
    avg_time = total_time / iterations
    
    logger.success(f"🦀 Rust Performance Results:")
    logger.info(f"  Total time: {total_time:.3f}s for {iterations} iterations")
    logger.info(f"  Average time: {avg_time * 1000:.3f}ms per sprite")
    logger.info(f"  Sprites per second: {iterations / total_time:.0f}")
    
    return avg_time


def test_python_performance():
    """Test Python fallback sprite analysis performance"""
    scanner = RustSpriteScanner()
    
    # Create test data
    test_pixels = create_test_sprite(32, 32)
    
    # Use Python fallback
    analysis = scanner._analyze_with_python(Image.frombytes('RGBA', (32, 32), test_pixels))
    
    # Performance test
    iterations = 1000
    start_time = time.time()
    
    for i in range(iterations):
        analysis = scanner._analyze_with_python(Image.frombytes('RGBA', (32, 32), test_pixels))
    
    end_time = time.time()
    
    total_time = end_time - start_time
    avg_time = total_time / iterations
    
    logger.success(f"🐍 Python Performance Results:")
    logger.info(f"  Total time: {total_time:.3f}s for {iterations} iterations")
    logger.info(f"  Average time: {avg_time * 1000:.3f}ms per sprite")
    logger.info(f"  Sprites per second: {iterations / total_time:.0f}")
    
    return avg_time


def main():
    """Run performance comparison"""
    logger.info("🚀 Rust vs Python Performance Test")
    logger.info("=" * 50)
    
    # Test Rust performance
    rust_time = test_rust_performance()
    
    # Test Python performance
    python_time = test_python_performance()
    
    # Calculate speedup
    speedup = python_time / rust_time
    
    logger.success(f"🎯 Performance Comparison:")
    logger.info(f"  Rust: {rust_time * 1000:.3f}ms per sprite")
    logger.info(f"  Python: {python_time * 1000:.3f}ms per sprite")
    logger.info(f"  Speedup: {speedup:.1f}x faster")
    
    if speedup > 10:
        logger.success("🚀 Rust provides massive performance boost!")
    elif speedup > 2:
        logger.success("⚡ Rust provides significant performance boost!")
    else:
        logger.info("📊 Rust provides modest performance boost")
    
    # Real-world scenario: 431 Tiny Farm assets
    total_assets = 431
    rust_total = rust_total = rust_time * total_assets
    python_total = python_time * total_assets
    
    logger.info(f"📊 Real-world scenario (431 Tiny Farm assets):")
    logger.info(f"  Rust: {rust_total:.3f}s total")
    logger.info(f"  Python: {python_total:.3f}s total")
    logger.info(f"  Time saved: {python_total - rust_total:.3f}s")


if __name__ == "__main__":
    main()
