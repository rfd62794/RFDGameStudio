"""
Production-ready tests for Rust-Powered Sprite Scanner
Tests both Rust and Python fallback implementations
"""

import pytest
from pathlib import Path
from typing import Dict, Any
from loguru import logger

# Import the module under test
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

rust_sprite_scanner = pytest.importorskip("rust_sprite_scanner")
from rust_sprite_scanner import RustSpriteScanner, RUST_AVAILABLE


class TestRustSpriteScanner:
    """Test suite for RustSpriteScanner with SOLID principles"""
    
    @pytest.fixture
    def scanner(self) -> RustSpriteScanner:
        """Fixture providing scanner instance"""
        return RustSpriteScanner()
    
    @pytest.fixture
    def test_pixels_16x16(self) -> bytes:
        """16x16 brown test sprite (chest-like)"""
        return bytes([100, 50, 30, 255] * 256)  # Brown pixels
    
    @pytest.fixture
    def test_pixels_green(self) -> bytes:
        """16x16 green test sprite (grass-like)"""
        return bytes([50, 150, 60, 255] * 256)  # Green pixels
    
    @pytest.fixture
    def test_pixels_transparent(self) -> bytes:
        """16x16 transparent sprite"""
        return bytes([0, 0, 0, 0] * 256)  # Transparent pixels
    
    def test_scanner_initialization(self, scanner: RustSpriteScanner):
        """Test scanner initializes correctly"""
        assert scanner.chest_threshold == 0.3
        assert scanner.green_threshold == 0.2
        assert scanner.gray_threshold == 0.3
        assert scanner.diversity_threshold == 0.05
        
        # Rust engine availability depends on build
        if RUST_AVAILABLE:
            assert scanner.rust_engine is not None
        else:
            assert scanner.rust_engine is None
    
    def test_analyze_brown_sprite(self, scanner: RustSpriteScanner, test_pixels_16x16: bytes):
        """Test analysis of brown (chest-like) sprite"""
        analysis = scanner.analyze_sprite(test_pixels_16x16, 16, 16)
        
        # Validate structure
        assert isinstance(analysis, dict)
        required_keys = {
            'chest_probability', 'is_chest', 'content_bounds', 'color_diversity',
            'green_ratio', 'gray_ratio', 'brown_gold_ratio', 'is_character',
            'is_decoration', 'is_material', 'material_type', 'confidence',
            'edge_density', 'is_object', 'dominant_color', 'transparency_ratio',
            'color_profile', 'alpha_bounding_box'
        }
        assert set(analysis.keys()) == required_keys
        
        # Validate types
        assert isinstance(analysis['chest_probability'], float)
        assert isinstance(analysis['is_chest'], bool)
        assert isinstance(analysis['content_bounds'], tuple)
        assert len(analysis['content_bounds']) == 4
        assert isinstance(analysis['color_diversity'], float)
        assert isinstance(analysis['green_ratio'], float)
        assert isinstance(analysis['gray_ratio'], float)
        assert isinstance(analysis['brown_gold_ratio'], float)
        assert isinstance(analysis['is_character'], bool)
        assert isinstance(analysis['is_decoration'], bool)
        assert isinstance(analysis['is_material'], bool)
        assert isinstance(analysis['material_type'], str)
        assert isinstance(analysis['confidence'], float)
        assert isinstance(analysis['edge_density'], float)
        assert isinstance(analysis['is_object'], bool)
        assert isinstance(analysis['dominant_color'], tuple)
        assert len(analysis['dominant_color']) == 3
        assert isinstance(analysis['transparency_ratio'], float)
        assert isinstance(analysis['color_profile'], dict)
        assert isinstance(analysis['alpha_bounding_box'], tuple)
        assert len(analysis['alpha_bounding_box']) == 4
    
    def test_analyze_green_sprite(self, scanner: RustSpriteScanner, test_pixels_green: bytes):
        """Test analysis of green (grass-like) sprite"""
        analysis = scanner.analyze_sprite(test_pixels_green, 16, 16)
        
        # Green sprite should have high green ratio
        assert analysis['green_ratio'] > 0.5
        assert analysis['brown_gold_ratio'] < 0.1
        assert analysis['gray_ratio'] < 0.1
    
    def test_analyze_transparent_sprite(self, scanner: RustSpriteScanner, test_pixels_transparent: bytes):
        """Test analysis of transparent sprite"""
        analysis = scanner.analyze_sprite(test_pixels_transparent, 16, 16)
        
        # Transparent sprite should have high transparency ratio
        assert analysis['transparency_ratio'] > 0.9
        assert analysis['chest_probability'] == 0.0
        assert not analysis['is_chest']
    
    def test_chest_detection_thresholds(self, scanner: RustSpriteScanner):
        """Test chest detection with different thresholds"""
        # Create high-probability chest sprite
        chest_pixels = bytes([150, 100, 50, 255] * 256)  # Golden brown
        
        # Test with default threshold
        analysis = scanner.analyze_sprite(chest_pixels, 16, 16)
        default_is_chest = analysis['is_chest']
        
        # Test with lower threshold
        scanner_low = RustSpriteScanner(chest_threshold=0.1)
        analysis_low = scanner_low.analyze_sprite(chest_pixels, 16, 16)
        low_is_chest = analysis_low['is_chest']
        
        # Lower threshold should detect more chests
        assert low_is_chest >= default_is_chest
    
    def test_edge_cleaning(self, scanner: RustSpriteScanner, test_pixels_16x16: bytes):
        """Test sprite edge cleaning"""
        cleaned = scanner.auto_clean_edges(test_pixels_16x16, 16, 16, 2)
        
        # Should return bytes of same length
        assert isinstance(cleaned, bytes)
        assert len(cleaned) == len(test_pixels_16x16)
    
    def test_dimension_validation(self, scanner: RustSpriteScanner):
        """Test validation of pixel dimensions"""
        # Create mismatched pixel data
        wrong_pixels = bytes([100, 50, 30, 255] * 100)  # Wrong size for 16x16
        
        # Should handle gracefully (either work or fallback without crashing)
        try:
            analysis = scanner.analyze_sprite(wrong_pixels, 16, 16)
            assert isinstance(analysis, dict)
        except Exception:
            # Expected for Rust engine, Python fallback should work
            if not RUST_AVAILABLE:
                pytest.fail("Python fallback should handle dimension mismatches")
    
    def test_convenience_functions(self, test_pixels_16x16: bytes):
        """Test convenience functions"""
        # Test chest detection
        chest_prob = scan_sprite_for_chest(test_pixels_16x16, 16, 16)
        assert isinstance(chest_prob, float)
        assert 0.0 <= chest_prob <= 1.0
        
        # Test edge cleaning
        cleaned = clean_sprite_edges(test_pixels_16x16, 16, 16, 2)
        assert isinstance(cleaned, bytes)
        assert len(cleaned) == len(test_pixels_16x16)
    
    def test_rust_vs_python_consistency(self, test_pixels_16x16: bytes):
        """Test that Rust and Python implementations produce similar results"""
        scanner = RustSpriteScanner()
        
        # If Rust is available, compare results
        if RUST_AVAILABLE and scanner.rust_engine:
            rust_analysis = scanner._analyze_with_rust(test_pixels_16x16, 16, 16)
            
            # Temporarily disable Rust to get Python results
            scanner.rust_engine = None
            python_analysis = scanner._analyze_with_python(test_pixels_16x16, 16, 16)
            
            # Restore Rust engine
            import dgt_harvest_rust
            scanner.rust_engine = dgt_harvest_rust.MaterialTriageEngine()
            
            # Results should be in reasonable ranges
            assert abs(rust_analysis['chest_probability'] - python_analysis['chest_probability']) < 0.3
            assert rust_analysis['content_bounds'] == python_analysis['content_bounds']
    
    def test_rust_python_fallback(self, scanner: RustSpriteScanner, test_pixels_16x16: bytes):
        """Test that Python fallback works when Rust is disabled"""
        # Get analysis with Rust
        rust_analysis = scanner.analyze_sprite(test_pixels_16x16, 16, 16)
        
        # Disable Rust and test Python fallback
        scanner.rust_engine = None
        python_analysis = scanner.analyze_sprite(test_pixels_16x16, 16, 16)
        
        # Both should return valid results
        assert isinstance(rust_analysis, dict)
        assert isinstance(python_analysis, dict)
        assert 'chest_probability' in rust_analysis
        assert 'chest_probability' in python_analysis


# Convenience functions for testing
def scan_sprite_for_chest(pixels: bytes, width: int, height: int) -> float:
    """Quick chest detection function"""
    from rust_sprite_scanner import scan_sprite_for_chest as _scan_sprite_for_chest
    return _scan_sprite_for_chest(pixels, width, height)


def clean_sprite_edges(pixels: bytes, width: int, height: int, threshold: int = 2) -> bytes:
    """Quick edge cleaning function"""
    from rust_sprite_scanner import clean_sprite_edges as _clean_sprite_edges
    return _clean_sprite_edges(pixels, width, height, threshold)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
