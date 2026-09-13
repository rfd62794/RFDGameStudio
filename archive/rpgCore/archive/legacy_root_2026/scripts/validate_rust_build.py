#!/usr/bin/env python3
"""
Production validation script for Rust-Powered Sprite Scanner
Validates both Rust and Python implementations
"""

import sys
from pathlib import Path
import subprocess
from loguru import logger

def validate_rust_build():
    """Validate Rust module builds and imports correctly"""
    logger.info("🔧 Validating Rust build...")
    
    try:
        import dgt_harvest_rust
        logger.success("✅ Rust module imports successfully")
        
        # Test basic functionality
        engine = dgt_harvest_rust.MaterialTriageEngine()
        test_pixels = bytes([100, 50, 30, 255] * 256)  # 16x16 brown
        result = engine.analyze_sprite(test_pixels, 16, 16)
        
        logger.success(f"✅ Rust analysis works: {result.material_type} with {result.confidence:.2f} confidence")
        return True
        
    except ImportError as e:
        logger.error(f"❌ Rust module import failed: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Rust analysis failed: {e}")
        return False

def validate_python_fallback():
    """Validate Python fallback works correctly"""
    logger.info("🐍 Validating Python fallback...")
    
    try:
        # Add parent directory to path
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from rust_sprite_scanner import RustSpriteScanner
        scanner = RustSpriteScanner()
        scanner.rust_engine = None
        
        test_pixels = bytes([100, 50, 30, 255] * 256)  # 16x16 brown
        result = scanner.analyze_sprite(test_pixels, 16, 16)
        
        logger.success(f"✅ Python analysis works: chest probability {result['chest_probability']:.3f}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Python fallback failed: {e}")
        return False

def validate_consistency():
    """Validate Rust and Python produce consistent results"""
    logger.info("⚖️ Validating result consistency...")
    
    try:
        # Add parent directory to path
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from rust_sprite_scanner import RustSpriteScanner
        scanner = RustSpriteScanner()
        
        test_pixels = bytes([100, 50, 30, 255] * 256)  # 16x16 brown
        
        # Test with Rust
        rust_result = scanner.analyze_sprite(test_pixels, 16, 16)
        
        # Test with Python
        scanner.rust_engine = None
        python_result = scanner.analyze_sprite(test_pixels, 16, 16)
        
        # Compare key metrics
        chest_diff = abs(rust_result['chest_probability'] - python_result['chest_probability'])
        
        if chest_diff < 0.3:
            logger.success(f"✅ Results consistent: chest probability difference {chest_diff:.3f}")
            return True
        else:
            logger.warning(f"⚠️ Results differ significantly: chest probability difference {chest_diff:.3f}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Consistency check failed: {e}")
        return False

def run_tests():
    """Run the test suite"""
    logger.info("🧪 Running test suite...")
    
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest', 
            'tests/test_rust_sprite_scanner.py', 
            '-v', '--tb=short'
        ], capture_output=True, text=True, cwd=Path(__file__).parent.parent)
        
        if result.returncode == 0:
            logger.success("✅ All tests passed")
            return True
        else:
            logger.error(f"❌ Tests failed: {result.stderr}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Test execution failed: {e}")
        return False

def main():
    """Main validation function"""
    logger.info("🚀 DGT Rust-Powered Sprite Scanner Validation")
    logger.info("=" * 60)
    
    validations = [
        ("Rust Build", validate_rust_build),
        ("Python Fallback", validate_python_fallback),
        ("Result Consistency", validate_consistency),
        ("Test Suite", run_tests),
    ]
    
    results = []
    for name, validator in validations:
        logger.info(f"\n📋 {name} Validation")
        results.append((name, validator()))
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 VALIDATION SUMMARY")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"  {status} {name}")
    
    logger.info(f"\n🎯 Overall: {passed}/{total} validations passed")
    
    if passed == total:
        logger.success("🚀 Rust-Powered Sprite Scanner is production ready!")
        return 0
    else:
        logger.error("⚠️ Some validations failed - review before deployment")
        return 1

if __name__ == "__main__":
    sys.exit(main())
