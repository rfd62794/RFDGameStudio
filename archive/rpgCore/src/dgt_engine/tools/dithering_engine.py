"""
Dithering Engine - Game Boy Parity Textures
ADR 088: The Pre-Bake Design Protocol

Pure-math dither script that adds "Retro Depth" to solid colors,
giving them that Game Boy texture without needing an artist.
"""

import tkinter as tk
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class DitheringEngine:
    """Game Boy parity dithering engine for retro textures"""
    
    # Classic Game Boy dithering patterns
    PATTERNS = {
        'solid': [],  # No dithering
        'checkerboard': [(0, 0), (1, 1)],  # 2x2 checkerboard
        'diagonal': [(0, 1), (1, 0)],  # Diagonal lines
        'dots': [(0, 0)],  # Single dots
        'cross': [(0, 1), (1, 0), (1, 1)],  # Cross pattern
        'noise': [(0, 0), (0, 1), (1, 0), (1, 1)],  # Full noise
        'organic': [(0, 0), (1, 1)],  # Organic pattern
        'metallic': [(0, 1), (1, 0)],  # Metallic sheen
        'fabric': [(0, 0), (0, 1)],  # Fabric texture
    }
    
    def __init__(self):
        self.current_pattern = 'checkerboard'
        self.dither_intensity = 0.3  # How strong the dithering effect is
    
    def apply_dither(self, base_color: str, pattern: str = None, intensity: float = None) -> List[List[str]]:
        """Apply dithering pattern to a base color"""
        if pattern:
            self.current_pattern = pattern
        if intensity is not None:
            self.dither_intensity = intensity
        
        # Convert hex color to RGB
        rgb = self._hex_to_rgb(base_color)
        
        # Create dithered colors
        light_color = self._lighten_color(rgb, self.dither_intensity)
        dark_color = self._darken_color(rgb, self.dither_intensity)
        
        # Apply pattern
        pattern_coords = self.PATTERNS.get(self.current_pattern, [])
        
        # Create 8x8 pattern
        pattern_grid = []
        for y in range(8):
            row = []
            for x in range(8):
                if (x % 2, y % 2) in pattern_coords:
                    row.append(self._rgb_to_hex(dark_color))
                else:
                    row.append(self._rgb_to_hex(light_color))
            pattern_grid.append(row)
        
        return pattern_grid
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _rgb_to_hex(self, rgb: Tuple[int, int, int]) -> str:
        """Convert RGB tuple to hex color"""
        return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
    
    def _lighten_color(self, rgb: Tuple[int, int, int], factor: float) -> Tuple[int, int, int]:
        """Lighten a color by a factor"""
        return tuple(min(255, int(c + (255 - c) * factor)) for c in rgb)
    
    def _darken_color(self, rgb: Tuple[int, int, int], factor: float) -> Tuple[int, int, int]:
        """Darken a color by a factor"""
        return tuple(max(0, int(c * (1 - factor))) for c in rgb)
    
    def get_pattern_list(self) -> List[str]:
        """Get list of available dithering patterns"""
        return list(self.PATTERNS.keys())
    
    def create_game_boy_palette(self) -> List[str]:
        """Create authentic Game Boy color palette"""
        return [
            '#9BBC0F',  # Lightest green
            '#8BAC0F',  # Light green
            '#306230',  # Dark green
            '#0F380F',  # Darkest green
        ]
    
    def create_sonic_palette(self) -> List[str]:
        """Create Sonic Field color palette"""
        return [
            '#FFB6C1',  # Light pink (flowers)
            '#FF69B4',  # Hot pink (flowers)
            '#FF1493',  # Deep pink (flowers)
            '#C71585',  # Medium violet red (flowers)
            '#228B22',  # Forest green (grass)
            '#32CD32',  # Lime green (grass)
            '#00FF00',  # Pure green (grass)
            '#006400',  # Dark green (grass)
        ]

class TemplateGenerator:
    """Pre-baked template generator for common patterns"""
    
    def __init__(self, dithering_engine: DitheringEngine):
        self.dithering_engine = dithering_engine
    
    def generate_organic_sway_template(self, base_color: str = '#228B22') -> List[List[str]]:
        """Generate organic sway pattern for grass/flowers"""
        # Create a pattern that looks like organic movement
        pattern = []
        for y in range(8):
            row = []
            for x in range(8):
                # Create wave-like pattern
                wave = (x + y) % 3
                if wave == 0:
                    row.append(base_color)
                elif wave == 1:
                    row.append(self.dithering_engine._lighten_color(
                        self.dithering_engine._hex_to_rgb(base_color), 0.2
                    ))
                else:
                    row.append(self.dithering_engine._darken_color(
                        self.dithering_engine._hex_to_rgb(base_color), 0.2
                    ))
            pattern.append(row)
        return pattern
    
    def generate_hard_inert_template(self, base_color: str = '#808080') -> List[List[str]]:
        """Generate hard inert pattern for stones/walls"""
        # Create dithered stone pattern
        return self.dithering_engine.apply_dither(base_color, 'checkerboard', 0.4)
    
    def generate_actor_kinetic_template(self, base_color: str = '#0064FF') -> List[List[str]]:
        """Generate actor kinetic pattern for breathing animation"""
        # Create subtle breathing pattern
        pattern = []
        for y in range(16):
            row = []
            for x in range(16):
                # Create breathing effect based on position
                breath = (x // 4 + y // 4) % 2
                if breath == 0:
                    row.append(base_color)
                else:
                    row.append(self.dithering_engine._lighten_color(
                        self.dithering_engine._hex_to_rgb(base_color), 0.1
                    ))
            pattern.append(row)
        return pattern
    
    def generate_water_template(self, base_color: str = '#0064C8') -> List[List[str]]:
        """Generate water pattern with ripples"""
        pattern = []
        for y in range(8):
            row = []
            for x in range(8):
                # Create ripple effect
                ripple = (x * x + y * y) % 3
                if ripple == 0:
                    row.append(base_color)
                elif ripple == 1:
                    row.append(self.dithering_engine._lighten_color(
                        self.dithering_engine._hex_to_rgb(base_color), 0.3
                    ))
                else:
                    row.append(self.dithering_engine._darken_color(
                        self.dithering_engine._hex_to_rgb(base_color), 0.3
                    ))
            pattern.append(row)
        return pattern
