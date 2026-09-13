"""
Palette Extractor - ADR 094: Automated Harvesting Protocol
Extracts and analyzes color palettes from sprite images
"""

from PIL import Image, ImageOps
import numpy as np
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from loguru import logger
import colorsys

@dataclass
class ColorInfo:
    """Information about a color in the palette"""
    hex_color: str
    rgb: Tuple[int, int, int]
    hsv: Tuple[float, float, float]
    frequency: int
    percentage: float
    is_dominant: bool = False

@dataclass
class PaletteAnalysis:
    """Complete palette analysis result"""
    colors: List[ColorInfo]
    dominant_color: ColorInfo
    color_count: int
    is_grayscale: bool
    brightness: float
    contrast: float
    material_suggestion: str

class PaletteExtractor:
    """Extracts and analyzes color palettes from sprite images"""
    
    def __init__(self):
        # Material color references
        self.material_colors = {
            'organic': {
                'primary': '#2d5a27',
                'range': [(0x20, 0x70, 0x20), (0x40, 0x90, 0x40)]
            },
            'wood': {
                'primary': '#5d4037',
                'range': [(0x40, 0x30, 0x20), (0x80, 0x60, 0x40)]
            },
            'stone': {
                'primary': '#757575',
                'range': [(0x60, 0x60, 0x60), (0x90, 0x90, 0x90)]
            },
            'metal': {
                'primary': '#9e9e9e',
                'range': [(0x80, 0x80, 0x80), (0xc0, 0xc0, 0xc0)]
            },
            'water': {
                'primary': '#4682b4',
                'range': [(0x30, 0x60, 0x90), (0x60, 0x90, 0xd0)]
            },
            'fire': {
                'primary': '#ff4500',
                'range': [(0xc0, 0x30, 0x00), (0xff, 0x80, 0x00)]
            },
            'crystal': {
                'primary': '#9370db',
                'range': [(0x70, 0x40, 0xb0), (0xb0, 0x80, 0xf0)]
            }
        }
        
        logger.info("🎨 Palette Extractor initialized")
    
    def extract_palette(self, image: Image.Image, max_colors: int = 4) -> PaletteAnalysis:
        """Extract and analyze color palette from image"""
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get color histogram
        colors = image.getcolors(maxcolors=256 * 256 * 256)
        
        # Sort by frequency
        sorted_colors = sorted(colors, key=lambda x: x[0], reverse=True)
        
        # Extract top colors
        total_pixels = image.width * image.height
        color_infos = []
        
        for i, (count, (r, g, b)) in enumerate(sorted_colors[:max_colors]):
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            rgb = (r, g, b)
            hsv = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
            percentage = (count / total_pixels) * 100
            
            color_info = ColorInfo(
                hex_color=hex_color,
                rgb=rgb,
                hsv=hsv,
                frequency=count,
                percentage=percentage,
                is_dominant=(i == 0)
            )
            
            color_infos.append(color_info)
        
        # Determine dominant color
        dominant_color = color_infos[0] if color_infos else None
        
        # Analyze palette properties
        is_grayscale = self._is_grayscale_palette(color_infos)
        brightness = self._calculate_brightness(color_infos)
        contrast = self._calculate_contrast(color_infos)
        material_suggestion = self._suggest_material(color_infos)
        
        return PaletteAnalysis(
            colors=color_infos,
            dominant_color=dominant_color,
            color_count=len(color_infos),
            is_grayscale=is_grayscale,
            brightness=brightness,
            contrast=contrast,
            material_suggestion=material_suggestion
        )
    
    def _is_grayscale_palette(self, colors: List[ColorInfo]) -> bool:
        """Check if palette is grayscale"""
        for color in colors:
            r, g, b = color.rgb
            # Check if RGB values are approximately equal
            if abs(r - g) > 10 or abs(g - b) > 10 or abs(r - b) > 10:
                return False
        return True
    
    def _calculate_brightness(self, colors: List[ColorInfo]) -> float:
        """Calculate average brightness of palette"""
        if not colors:
            return 0.0
        
        total_brightness = 0.0
        for color in colors:
            r, g, b = color.rgb
            # Use luminance formula
            brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
            total_brightness += brightness * color.percentage / 100.0
        
        return total_brightness
    
    def _calculate_contrast(self, colors: List[ColorInfo]) -> float:
        """Calculate contrast ratio of palette"""
        if len(colors) < 2:
            return 0.0
        
        # Find lightest and darkest colors
        lightest = max(colors, key=lambda c: sum(c.rgb))
        darkest = min(colors, key=lambda c: sum(c.rgb))
        
        # Calculate luminance
        light_lum = (0.299 * lightest.rgb[0] + 0.587 * lightest.rgb[1] + 0.114 * lightest.rgb[2]) / 255.0
        dark_lum = (0.299 * darkest.rgb[0] + 0.587 * darkest.rgb[1] + 0.114 * darkest.rgb[2]) / 255.0
        
        # Calculate contrast ratio
        if dark_lum < 0.01:
            dark_lum = 0.01
        
        contrast_ratio = (light_lum + 0.05) / (dark_lum + 0.05)
        return contrast_ratio
    
    def _suggest_material(self, colors: List[ColorInfo]) -> str:
        """Suggest material type based on palette"""
        if not colors:
            return 'unknown'
        
        dominant_color = colors[0]
        r, g, b = dominant_color.rgb
        
        # Check against material color ranges
        best_match = 'unknown'
        best_score = 0.0
        
        for material, color_info in self.material_colors.items():
            primary = color_info['primary']
            color_range = color_info['range']
            
            # Parse primary color
            primary_r = int(primary[1:3], 16)
            primary_g = int(primary[3:5], 16)
            primary_b = int(primary[5:7], 16)
            
            # Calculate color distance
            distance = np.sqrt((r - primary_r)**2 + (g - primary_g)**2 + (b - primary_b)**2)
            
            # Check if within range
            min_r, min_g, min_b = color_range[0]
            max_r, max_g, max_b = color_range[1]
            
            if (min_r <= r <= max_r and min_g <= g <= max_g and min_b <= b <= max_b):
                # Within range, calculate score based on distance
                score = 1.0 / (1.0 + distance)
                
                if score > best_score:
                    best_score = score
                    best_match = material
        
        return best_match
    
    def create_dither_palette(self, analysis: PaletteAnalysis) -> List[str]:
        """Create dithering palette from analysis"""
        if len(analysis.colors) < 2:
            # Create light/dark variants of dominant color
            dominant = analysis.colors[0]
            r, g, b = dominant.rgb
            
            light_color = f"#{min(255, r + 30):02x}{min(255, g + 30):02x}{min(255, b + 30):02x}"
            dark_color = f"#{max(0, r - 30):02x}{max(0, g - 30):02x}{max(0, b - 30):02x}"
            
            return [dark_color, dominant.hex_color, light_color, "#ffffff"]
        
        # Use extracted colors
        palette = [color.hex_color for color in analysis.colors]
        
        # Ensure we have exactly 4 colors
        while len(palette) < 4:
            palette.append("#808080")  # Add gray as filler
        
        return palette[:4]
    
    def convert_to_grayscale(self, image: Image.Image) -> Image.Image:
        """Convert image to grayscale while preserving structure"""
        return ImageOps.grayscale(image)
    
    def optimize_for_dgt(self, image: Image.Image, material_type: str) -> Image.Image:
        """Optimize image for DGT rendering"""
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Get palette
        analysis = self.extract_palette(image)
        
        # Create dithering palette
        dither_palette = self.create_dither_palette(analysis)
        
        # Convert to indexed color mode with custom palette
        # This is a simplified version - in practice, you'd use Floyd-Steinberg dithering
        palette_image = Image.new('P', image.size)
        
        # Map colors to palette
        pixels = image.load()
        for y in range(image.height):
            for x in range(image.width):
                r, g, b = pixels[x, y]
                hex_color = f"#{r:02x}{g:02x}{b:02x}"
                
                # Find closest color in palette
                closest_index = self._find_closest_color(hex_color, dither_palette)
                palette_image.putpixel((x, y), closest_index)
        
        # Apply palette
        palette_image.putpalette([int(c[i:i+2], 16) for c in dither_palette for i in (1, 3, 5)] + [0])
        
        return palette_image
    
    def _find_closest_color(self, color: str, palette: List[str]) -> int:
        """Find closest color in palette"""
        r, g, b = int(color[1:3], 16), int(color[3:5], 16), int(color[5:7], 16)
        
        min_distance = float('inf')
        closest_index = 0
        
        for i, palette_color in enumerate(palette):
            pr, pg, pb = int(palette_color[1:3], 16), int(palette_color[3:5], 16), int(palette_color[5:7], 16)
            distance = np.sqrt((r - pr)**2 + (g - pg)**2 + (b - pb)**2)
            
            if distance < min_distance:
                min_distance = distance
                closest_index = i
        
        return closest_index

# Factory function
def create_palette_extractor() -> PaletteExtractor:
    """Create palette extractor instance"""
    return PaletteExtractor()

if __name__ == "__main__":
    # Test the palette extractor
    extractor = create_palette_extractor()
    
    # Create a test image
    from PIL import ImageDraw
    test_image = Image.new('RGB', (16, 16), '#ffffff')
    draw = ImageDraw.Draw(test_image)
    
    # Draw some test colors
    draw.rectangle([0, 0, 8, 8], fill='#2d5a27')  # Green
    draw.rectangle([8, 0, 16, 8], fill='#5d4037')  # Brown
    draw.rectangle([0, 8, 8, 16], fill='#757575')  # Gray
    draw.rectangle([8, 8, 16, 16], fill='#9e9e9e')  # Silver
    
    # Extract palette
    analysis = extractor.extract_palette(test_image)
    
    print("Palette Analysis:")
    print(f"Colors: {analysis.color_count}")
    print(f"Dominant: {analysis.dominant_color.hex_color}")
    print(f"Material: {analysis.material_suggestion}")
    print(f"Grayscale: {analysis.is_grayscale}")
    print(f"Brightness: {analysis.brightness:.2f}")
    print(f"Contrast: {analysis.contrast:.2f}")
    
    print("\nColor Details:")
    for color in analysis.colors:
        print(f"  {color.hex_color}: {color.percentage:.1f}%")
