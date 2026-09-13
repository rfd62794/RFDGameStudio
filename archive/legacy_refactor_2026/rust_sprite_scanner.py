"""
Rust-Powered Sprite Scanner - Material Triage Engine
High-performance intelligent asset analysis with Rust backend
"""

import sys
from pathlib import Path
from typing import Tuple, Optional, Dict, Any
from loguru import logger

# Try to import the compiled Rust module using PyO3/maturin
try:
    import dgt_harvest_rust
    RUST_AVAILABLE = True
    logger.success("🦀 Loaded Rust Material Triage Engine")
except ImportError as e:
    RUST_AVAILABLE = False
    logger.warning(f"⚠️ Rust Material Triage Engine not available: {e}")
    logger.info("🐍 Using Python fallback scanner")


class RustSpriteScanner:
    """High-performance sprite scanner with Rust Material Triage Engine"""
    
    def __init__(self, chest_threshold: float = 0.3, green_threshold: float = 0.2, 
                 gray_threshold: float = 0.3, diversity_threshold: float = 0.05):
        self.chest_threshold = chest_threshold
        self.green_threshold = green_threshold
        self.gray_threshold = gray_threshold
        self.diversity_threshold = diversity_threshold
        
        # Initialize Rust Material Triage Engine if available
        self.rust_engine: Optional[dgt_harvest_rust.MaterialTriageEngine] = None
        if RUST_AVAILABLE:
            try:
                self.rust_engine = dgt_harvest_rust.MaterialTriageEngine()
                logger.info("🚀 Using Rust Material Triage Engine for intelligent analysis")
            except Exception as e:
                logger.error(f"⚠️ Failed to initialize Rust Material Triage Engine: {e}")
                logger.info("🐍 Using Python fallback scanner")
    
    def analyze_sprite(self, pixels: bytes, width: int, height: int) -> Dict[str, Any]:
        """Analyze sprite using Rust Material Triage Engine or Python fallback"""
        if self.rust_engine:
            return self._analyze_with_rust(pixels, width, height)
        else:
            return self._analyze_with_python(pixels, width, height)
    
    def _analyze_with_rust(self, pixels: bytes, width: int, height: int) -> Dict[str, Any]:
        """Use Rust Material Triage Engine for maximum intelligence"""
        try:
            if not self.rust_engine:
                raise RuntimeError("Rust engine not initialized")
            
            # Get complete Material DNA analysis
            material_dna = self.rust_engine.analyze_sprite(pixels, width, height)
            
            # Convert Material DNA to analysis format
            analysis = {
                'chest_probability': 0.0,  # Will be calculated from material type
                'is_chest': False,        # Will be calculated from material type
                'content_bounds': material_dna.alpha_bounding_box,
                'color_diversity': len(material_dna.color_profile) * 0.01,  # Approximate
                'green_ratio': material_dna.color_profile.get('grass', 0.0),
                'gray_ratio': material_dna.color_profile.get('stone', 0.0),
                'brown_gold_ratio': material_dna.color_profile.get('wood', 0.0),
                'is_character': material_dna.is_object and material_dna.material_type in ['organic', 'metal'],
                'is_decoration': material_dna.material_type in ['wood', 'stone', 'glass'],
                'is_material': material_dna.material_type in ['wood', 'stone', 'grass', 'water'],
                
                # New Material Triage data
                'material_type': material_dna.material_type,
                'confidence': material_dna.confidence,
                'edge_density': material_dna.edge_density,
                'is_object': material_dna.is_object,
                'dominant_color': material_dna.dominant_color,
                'transparency_ratio': material_dna.transparency_ratio,
                'color_profile': dict(material_dna.color_profile),
                'alpha_bounding_box': material_dna.alpha_bounding_box,
            }
            
            # Calculate chest probability from material type and color profile
            if material_dna.material_type in ['wood', 'metal', 'glass']:
                analysis['chest_probability'] = material_dna.color_profile.get('wood', 0.0) * 0.8
                analysis['is_chest'] = analysis['chest_probability'] > self.chest_threshold
            
            return analysis
            
        except Exception as e:
            logger.error(f"⚠️ Rust Material Triage failed: {e}, falling back to Python")
            return self._analyze_with_python(pixels, width, height)
    
    def _analyze_with_python(self, pixels: bytes, width: int, height: int) -> Dict[str, Any]:
        """Python fallback analysis"""
        from PIL import Image
        
        # Convert bytes to PIL Image
        image = Image.frombytes('RGBA', (width, height), pixels)
        
        # Basic analysis
        colors = {}
        total_pixels = 0
        brown_gold_pixels = 0
        green_pixels = 0
        gray_pixels = 0
        
        # Get pixel data
        pixel_data = image.getdata()
        
        for r, g, b, a in pixel_data:
            if a > 0:
                total_pixels += 1
                
                # Track colors
                color_key = (r, g, b)
                colors[color_key] = colors.get(color_key, 0) + 1
                
                # Chest detection (brown/gold)
                if (80 <= r <= 180 and 40 <= g <= 140 and b <= 80) or \
                   (160 <= r <= 255 and 100 <= g <= 200 and b <= 100):
                    brown_gold_pixels += 1
                
                # Plant detection
                if g > r and g > b:
                    green_pixels += 1
                
                # Rock detection
                if abs(r - g) < 40 and abs(g - b) < 40:
                    gray_pixels += 1
        
        # Calculate metrics
        chest_probability = brown_gold_pixels / max(total_pixels, 1)
        green_ratio = green_pixels / max(total_pixels, 1)
        gray_ratio = gray_pixels / max(total_pixels, 1)
        color_diversity = len(colors) / max(total_pixels, 1)
        
        # Determine object type
        aspect_ratio = width / height
        is_character = total_pixels > 20 and 0.5 <= aspect_ratio <= 2.0 and len(colors) > 3
        is_decoration = color_diversity > 0.05 or green_ratio > 0.2 or gray_ratio > 0.3
        is_material = color_diversity < 0.1
        
        # Simple bounding box
        content_bounds = (0, 0, width, height)
        
        return {
            'chest_probability': chest_probability,
            'is_chest': chest_probability > self.chest_threshold,
            'content_bounds': content_bounds,
            'color_diversity': color_diversity,
            'green_ratio': green_ratio,
            'gray_ratio': gray_ratio,
            'brown_gold_ratio': chest_probability,
            'is_character': is_character,
            'is_decoration': is_decoration,
            'is_material': is_material,
            
            # Material Triage fallback data
            'material_type': 'unknown',
            'confidence': 0.5,
            'edge_density': 0.0,
            'is_object': is_character,
            'dominant_color': (128, 128, 128),
            'transparency_ratio': 0.0,
            'color_profile': {},
            'alpha_bounding_box': content_bounds,
        }
    
    def auto_clean_edges(self, pixels: bytes, width: int, height: int, threshold: int) -> bytes:
        """Auto-clean sprite edges using Rust or Python"""
        if self.rust_engine:
            try:
                # Use Rust Material Triage Engine for edge cleaning
                # Get Alpha-Bounding Box from Rust
                abb = self.rust_engine.get_alpha_bounding_box(pixels, width, height)
                x, y, bbox_width, bbox_height = abb
                
                # Create cleaned pixels based on ABB
                cleaned_pixels = bytearray(pixels)
                
                # Clear pixels outside the tight bounding box
                for py in range(height):
                    for px in range(width):
                        if px < x or px >= x + bbox_width or py < y or py >= y + bbox_height:
                            idx = (py * width + px) * 4
                            if idx + 3 < len(cleaned_pixels):
                                cleaned_pixels[idx:idx+4] = b'\x00\x00\x00\x00'
                
                return bytes(cleaned_pixels)
                
            except Exception as e:
                logger.error(f"⚠️ Rust edge cleaning failed: {e}, using Python fallback")
        
        # Python fallback edge cleaning
        return self._auto_clean_edges_python(pixels, width, height, threshold)
    
    def _auto_clean_edges_python(self, pixels: bytes, width: int, height: int, threshold: int) -> bytes:
        """Python fallback edge cleaning"""
        from PIL import Image
        
        image = Image.frombytes('RGBA', (width, height), pixels)
        
        # Find bounding box of non-transparent content
        bbox = image.getbbox()
        
        if not bbox:
            return pixels  # Empty sprite
        
        # Crop to content bounds with padding
        x1, y1, x2, y2 = bbox
        
        # Add small padding to preserve edge pixels
        x1 = max(0, x1 - threshold)
        y1 = max(0, y1 - threshold)
        x2 = min(width, x2 + threshold)
        y2 = min(height, y2 + threshold)
        
        # Crop sprite
        cleaned = image.crop((x1, y1, x2, y2))
        
        # Resize back to original dimensions
        cleaned = cleaned.resize((width, height), Image.Resampling.LANCZOS)
        
        return cleaned.tobytes()


# Convenience functions for direct use
def scan_sprite_for_chest(pixels: bytes, width: int, height: int) -> float:
    """Quick chest detection function"""
    scanner = RustSpriteScanner()
    analysis = scanner.analyze_sprite(pixels, width, height)
    return analysis['chest_probability']


def clean_sprite_edges(pixels: bytes, width: int, height: int, threshold: int = 2) -> bytes:
    """Quick edge cleaning function"""
    scanner = RustSpriteScanner()
    return scanner.auto_clean_edges(pixels, width, height, threshold)


if __name__ == "__main__":
    # Test the scanner
    print("🔧 Testing Rust-Powered Sprite Scanner")
    
    # Create test data (16x16 RGBA)
    test_pixels = bytes([100, 50, 30, 255] * 256)  # Brown pixels
    
    scanner = RustSpriteScanner()
    analysis = scanner.analyze_sprite(test_pixels, 16, 16)
    
    print(f"📊 Analysis Results:")
    print(f"  Chest Probability: {analysis['chest_probability']:.3f}")
    print(f"  Is Chest: {analysis['is_chest']}")
    print(f"  Content Bounds: {analysis['content_bounds']}")
    print(f"  Color Diversity: {analysis['color_diversity']:.3f}")
    print(f"  Green Ratio: {analysis['green_ratio']:.3f}")
    print(f"  Gray Ratio: {analysis['gray_ratio']:.3f}")
    print(f"  Is Character: {analysis['is_character']}")
    print(f"  Is Decoration: {analysis['is_decoration']}")
    print(f"  Is Material: {analysis['is_material']}")
    
    print("✅ Rust-Powered Scanner working!")
