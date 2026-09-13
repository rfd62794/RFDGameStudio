"""
Intelligent Preview Bridge - ADR 098: The WYSIWYG Pipeline
Vectorized PPU with SOLID Harvester integration for instant preview
"""

import tkinter as tk
import numpy as np
from PIL import Image, ImageTk, ImageDraw
from typing import List, Tuple, Optional, Dict, Any, Union
from dataclasses import dataclass
from enum import Enum
import time
import math
from loguru import logger

from ..tools.asset_models import HarvestedAsset, AssetType, MaterialType
from ..tools.optimized_image_processor import OptimizedImageProcessor
from .ppu_tk_native_enhanced import (
    EnhancedTkinterPPU, DitherPattern, DitherPresets, 
    RenderLayer, CanvasEntity
)


class PreviewMode(Enum):
    """Preview display modes"""
    ORIGINAL = "original"
    DGTIFIED = "dgtified"
    KINETIC = "kinetic"
    COMPARISON = "comparison"


@dataclass
class PreviewFrame:
    """Single frame of preview animation"""
    image: ImageTk.PhotoImage
    timestamp: float
    frame_index: int


@dataclass
class ShadowAnalysis:
    """Shadow detection analysis results"""
    has_shadow: bool
    bottom_row_opaque: bool
    shadow_confidence: float
    recommended_offset: int


@dataclass
class AnimationAnalysis:
    """Animation detection analysis results"""
    is_animated: bool
    frame_count: int
    similarity_score: float
    recommended_tags: List[str]


class IntelligentPreviewBridge:
    """
    Bridge between SOLID Harvester and Enhanced PPU
    Provides instant WYSIWYG preview with vectorized processing
    """
    
    def __init__(self, canvas: tk.Canvas, preview_size: Tuple[int, int] = (128, 128)):
        self.canvas = canvas
        self.preview_size = preview_size
        
        # Initialize processors
        self.image_processor = OptimizedImageProcessor(enable_profiling=True)
        self.dither_presets = DitherPresets()
        
        # Preview state
        self.current_asset: Optional[HarvestedAsset] = None
        self.preview_mode = PreviewMode.ORIGINAL
        self.animation_frames: List[PreviewFrame] = []
        self.current_frame_index = 0
        self.last_animation_time = 0.0
        self.animation_fps = 2.0  # 2Hz for kinetic sway
        
        # Analysis results
        self.shadow_analysis: Optional[ShadowAnalysis] = None
        self.animation_analysis: Optional[AnimationAnalysis] = None
        
        # Preview images cache
        self.preview_images: Dict[PreviewMode, ImageTk.PhotoImage] = {}
        
        # Animation control
        self.is_animating = False
        self.animation_loop_id: Optional[str] = None
        
        logger.debug("IntelligentPreviewBridge initialized")
    
    def numpy_tint(self, image: Image.Image, material_id: MaterialType) -> Image.Image:
        """
        Vectorized palette tinting using numpy for maximum performance
        
        Args:
            image: Input PIL Image
            material_id: Material type for tinting
            
        Returns:
            Tinted PIL Image
        """
        start_time = time.perf_counter()
        
        # Convert to numpy array
        img_array = np.array(image)
        
        # Get material tint colors
        tint_colors = self._get_material_tint_colors(material_id)
        
        # Vectorized color mapping
        if len(img_array.shape) == 3:  # RGB image
            # Create color mapping matrix
            tinted_array = self._apply_vectorized_tint(img_array, tint_colors)
        else:  # Grayscale
            # Apply tint to grayscale
            tinted_array = self._tint_grayscale_vectorized(img_array, tint_colors)
        
        # Convert back to PIL
        tinted_image = Image.fromarray(tinted_array.astype(np.uint8))
        
        if self.image_processor.enable_profiling:
            end_time = time.perf_counter()
            duration = (end_time - start_time) * 1000
            logger.debug(f"Numpy tint completed in {duration:.2f}ms")
        
        return tinted_image
    
    def _get_material_tint_colors(self, material_id: MaterialType) -> Dict[str, np.ndarray]:
        """Get tint color mapping for material type"""
        material_colors = {
            MaterialType.ORGANIC: {
                'primary': np.array([45, 90, 39]),    # #2d5a27
                'secondary': np.array([58, 107, 53]),  # #3a6b35
                'accent': np.array([75, 120, 69])     # #4b7845
            },
            MaterialType.WOOD: {
                'primary': np.array([93, 64, 55]),     # #5d4037
                'secondary': np.array([107, 84, 71]),  # #6b5447
                'accent': np.array([123, 101, 87])    # #7b6557
            },
            MaterialType.STONE: {
                'primary': np.array([117, 117, 117]), # #757575
                'secondary': np.array([133, 133, 133]),# #858585
                'accent': np.array([149, 149, 149])   # #959595
            },
            MaterialType.METAL: {
                'primary': np.array([158, 158, 158]), # #9e9e9e
                'secondary': np.array([174, 174, 174]),# #aeaeae
                'accent': np.array([190, 190, 190])   # #bebebe
            },
            MaterialType.WATER: {
                'primary': np.array([70, 130, 180]),   # #4682b4
                'secondary': np.array([100, 149, 237]), # #6495ed
                'accent': np.array([135, 206, 250])    # #87cefa
            },
            MaterialType.FIRE: {
                'primary': np.array([255, 69, 0]),     # #ff4500
                'secondary': np.array([255, 140, 0]),   # #ff8c00
                'accent': np.array([255, 215, 0])      # #ffd700
            },
            MaterialType.CRYSTAL: {
                'primary': np.array([147, 112, 219]),  # #9370db
                'secondary': np.array([186, 85, 211]),  # #ba55d3
                'accent': np.array([218, 112, 214])    # #da70d6
            },
            MaterialType.VOID: {
                'primary': np.array([0, 0, 0]),         # #000000
                'secondary': np.array([32, 32, 32]),    # #202020
                'accent': np.array([64, 64, 64])        # #404040
            }
        }
        
        return material_colors.get(material_id, material_colors[MaterialType.ORGANIC])
    
    def _apply_vectorized_tint(self, img_array: np.ndarray, tint_colors: Dict[str, np.ndarray]) -> np.ndarray:
        """Apply vectorized tint to RGB image"""
        # Create copy to avoid modifying original
        tinted = img_array.copy()
        
        # Vectorized color mapping based on luminance
        # Calculate luminance for each pixel
        luminance = np.dot(tinted[..., :3], [0.299, 0.587, 0.114])
        
        # Create masks for different luminance ranges
        dark_mask = luminance < 85
        mid_mask = (luminance >= 85) & (luminance < 170)
        light_mask = luminance >= 170
        
        # Apply tint based on luminance
        tinted[dark_mask] = tint_colors['primary']
        tinted[mid_mask] = tint_colors['secondary']
        tinted[light_mask] = tint_colors['accent']
        
        return tinted
    
    def _tint_grayscale_vectorized(self, img_array: np.ndarray, tint_colors: Dict[str, np.ndarray]) -> np.ndarray:
        """Apply vectorized tint to grayscale image"""
        # Convert grayscale to RGB
        if len(img_array.shape) == 2:
            rgb_array = np.stack([img_array] * 3, axis=-1)
        else:
            rgb_array = img_array
        
        return self._apply_vectorized_tint(rgb_array, tint_colors)
    
    def analyze_shadow_requirements(self, asset: HarvestedAsset) -> ShadowAnalysis:
        """
        Analyze sprite to determine shadow requirements
        
        Args:
            asset: Harvested asset to analyze
            
        Returns:
            Shadow analysis results
        """
        # Get sprite image (this would need to be stored in the asset)
        # For now, we'll simulate the analysis
        sprite_width = asset.sprite_slice.width
        sprite_height = asset.sprite_slice.height
        
        # Simulate bottom row analysis
        # In real implementation, this would check actual pixel data
        bottom_row_opaque = asset.metadata.collision  # Heuristic: collision objects need shadows
        shadow_confidence = 0.8 if bottom_row_opaque else 0.2
        recommended_offset = sprite_height // 4
        
        analysis = ShadowAnalysis(
            has_shadow=bottom_row_opaque,
            bottom_row_opaque=bottom_row_opaque,
            shadow_confidence=shadow_confidence,
            recommended_offset=recommended_offset
        )
        
        self.shadow_analysis = analysis
        logger.debug(f"Shadow analysis: has_shadow={analysis.has_shadow}, confidence={analysis.shadow_confidence}")
        
        return analysis
    
    def analyze_animation_potential(self, assets: List[HarvestedAsset]) -> AnimationAnalysis:
        """
        Analyze multiple assets for animation potential
        
        Args:
            assets: List of harvested assets to analyze
            
        Returns:
            Animation analysis results
        """
        if len(assets) < 2:
            return AnimationAnalysis(
                is_animated=False,
                frame_count=1,
                similarity_score=0.0,
                recommended_tags=[]
            )
        
        # Calculate similarity between assets
        # In real implementation, this would compare actual image data
        similarity_score = self._calculate_asset_similarity(assets)
        
        # Determine animation potential
        is_animated = similarity_score > 0.7  # 70% similarity threshold
        frame_count = len(assets) if is_animated else 1
        recommended_tags = ["animated", "loop"] if is_animated else []
        
        analysis = AnimationAnalysis(
            is_animated=is_animated,
            frame_count=frame_count,
            similarity_score=similarity_score,
            recommended_tags=recommended_tags
        )
        
        self.animation_analysis = analysis
        logger.debug(f"Animation analysis: animated={analysis.is_animated}, frames={analysis.frame_count}")
        
        return analysis
    
    def _calculate_asset_similarity(self, assets: List[HarvestedAsset]) -> float:
        """Calculate similarity between assets"""
        # Simplified similarity calculation based on metadata
        # In real implementation, this would use image comparison
        if len(assets) < 2:
            return 0.0
        
        # Compare palettes as a simple similarity metric
        first_palette = set(assets[0].sprite_slice.palette)
        similarities = []
        
        for asset in assets[1:]:
            other_palette = set(asset.sprite_slice.palette)
            intersection = len(first_palette.intersection(other_palette))
            union = len(first_palette.union(other_palette))
            similarity = intersection / union if union > 0 else 0.0
            similarities.append(similarity)
        
        return np.mean(similarities) if similarities else 0.0
    
    def generate_dgtified_preview(self, asset: HarvestedAsset) -> ImageTk.PhotoImage:
        """
        Generate DGT-ified preview with dithering and shadows
        
        Args:
            asset: Harvested asset to process
            
        Returns:
            DGT-ified preview image
        """
        # Create base sprite (simulated)
        base_image = self._create_base_sprite_image(asset)
        
        # Apply material tinting
        tinted_image = self.numpy_tint(base_image, asset.metadata.material_id)
        
        # Apply dithering
        dithered_image = self._apply_dithering_pattern(tinted_image, asset.metadata.material_id)
        
        # Add shadow if needed
        shadow_analysis = self.analyze_shadow_requirements(asset)
        if shadow_analysis.has_shadow:
            final_image = self._add_drop_shadow(dithered_image, shadow_analysis)
        else:
            final_image = dithered_image
        
        # Resize for preview
        preview_image = final_image.resize(self.preview_size, Image.Resampling.NEAREST)
        
        # Convert to PhotoImage
        photo_image = ImageTk.PhotoImage(preview_image)
        
        # Cache the result
        self.preview_images[PreviewMode.DGTIFIED] = photo_image
        
        return photo_image
    
    def _create_base_sprite_image(self, asset: HarvestedAsset) -> Image.Image:
        """Create base sprite image from asset data"""
        # Create a simple colored square based on material
        size = asset.sprite_slice.width
        image = Image.new('RGB', (size, size), '#ffffff')
        
        # Fill with material color
        material_colors = {
            MaterialType.ORGANIC: '#2d5a27',
            MaterialType.WOOD: '#5d4037',
            MaterialType.STONE: '#757575',
            MaterialType.METAL: '#9e9e9e',
            MaterialType.WATER: '#4682b4',
            MaterialType.FIRE: '#ff4500',
            MaterialType.CRYSTAL: '#9370db',
            MaterialType.VOID: '#000000'
        }
        
        color = material_colors.get(asset.metadata.material_id, '#808080')
        draw = ImageDraw.Draw(image)
        draw.rectangle([0, 0, size-1, size-1], fill=color)
        
        return image
    
    def _apply_dithering_pattern(self, image: Image.Image, material_id: MaterialType) -> Image.Image:
        """Apply dithering pattern to image"""
        # Get dither pattern for material
        if material_id == MaterialType.ORGANIC:
            pattern = self.dither_presets.get_lush_green()
        elif material_id == MaterialType.WOOD:
            pattern = self.dither_presets.get_wood_brown()
        elif material_id == MaterialType.STONE:
            pattern = self.dither_presets.get_stone_gray()
        elif material_id == MaterialType.METAL:
            pattern = self.dither_presets.get_metal_silver()
        else:
            return image  # No dithering for other materials
        
        # Apply dithering using numpy
        img_array = np.array(image)
        
        # Create dither matrix
        dither_matrix = np.array(pattern.pattern)
        
        # Apply dithering
        height, width = img_array.shape[:2]
        for y in range(height):
            for x in range(width):
                pattern_x = x % dither_matrix.shape[1]
                pattern_y = y % dither_matrix.shape[0]
                
                if dither_matrix[pattern_y, pattern_x] == 1:
                    # Use lighter color
                    img_array[y, x] = self._hex_to_rgb(pattern.light_color)
                else:
                    # Use darker color
                    img_array[y, x] = self._hex_to_rgb(pattern.dark_color)
        
        return Image.fromarray(img_array)
    
    def _add_drop_shadow(self, image: Image.Image, shadow_analysis: ShadowAnalysis) -> Image.Image:
        """Add drop shadow to image"""
        width, height = image.size
        shadow_offset = shadow_analysis.recommended_offset
        
        # Create larger canvas for shadow
        shadow_width = width + shadow_offset
        shadow_height = height + shadow_offset
        shadow_image = Image.new('RGBA', (shadow_width, shadow_height), (0, 0, 0, 0))
        
        # Draw shadow
        shadow_draw = ImageDraw.Draw(shadow_image)
        shadow_draw.ellipse(
            [0, height - shadow_offset//2, width, height + shadow_offset//2],
            fill=(0, 0, 0, 128)  # Semi-transparent black
        )
        
        # Paste original image on top
        shadow_image.paste(image, (0, 0), image if image.mode == 'RGBA' else None)
        
        return shadow_image.convert('RGB')
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def generate_kinetic_preview(self, asset: HarvestedAsset) -> List[PreviewFrame]:
        """
        Generate kinetic animation frames
        
        Args:
            asset: Harvested asset to animate
            
        Returns:
            List of animation frames
        """
        frames = []
        frame_count = 4  # 4 frames for smooth sway animation
        
        base_image = self._create_base_sprite_image(asset)
        tinted_image = self.numpy_tint(base_image, asset.metadata.material_id)
        
        for i in range(frame_count):
            # Calculate sway offset
            sway_amplitude = 2  # pixels
            sway_offset = int(sway_amplitude * math.sin(2 * math.pi * i / frame_count))
            
            # Create swayed frame
            frame_image = self._create_swayed_frame(tinted_image, sway_offset)
            
            # Convert to PhotoImage
            preview_image = frame_image.resize(self.preview_size, Image.Resampling.NEAREST)
            photo_image = ImageTk.PhotoImage(preview_image)
            
            frame = PreviewFrame(
                image=photo_image,
                timestamp=time.time(),
                frame_index=i
            )
            
            frames.append(frame)
        
        self.animation_frames = frames
        return frames
    
    def _create_swayed_frame(self, image: Image.Image, sway_offset: int) -> Image.Image:
        """Create frame with horizontal sway"""
        width, height = image.size
        
        # Create new canvas with offset
        swayed_image = Image.new('RGB', (width + abs(sway_offset), height), '#ffffff')
        
        # Paste image with offset
        paste_x = max(0, sway_offset)
        swayed_image.paste(image, (paste_x, 0))
        
        return swayed_image
    
    def set_asset(self, asset: HarvestedAsset) -> None:
        """Set current asset for preview"""
        self.current_asset = asset
        self.preview_images.clear()  # Clear cache
        
        # Generate all preview modes
        self._generate_all_previews()
        
        # Start animation if asset is animated
        if asset.metadata.tags and "animated" in asset.metadata.tags:
            self.start_animation()
        
        logger.debug(f"Set asset for preview: {asset.asset_id}")
    
    def _generate_all_previews(self) -> None:
        """Generate all preview modes for current asset"""
        if not self.current_asset:
            return
        
        # Generate DGT-ified preview
        self.generate_dgtified_preview(self.current_asset)
        
        # Generate kinetic preview
        self.generate_kinetic_preview(self.current_asset)
    
    def display_preview(self, mode: PreviewMode) -> None:
        """Display specific preview mode"""
        if mode == PreviewMode.ORIGINAL:
            # Display original sprite
            if self.current_asset:
                original_image = self._create_base_sprite_image(self.current_asset)
                preview_image = original_image.resize(self.preview_size, Image.Resampling.NEAREST)
                photo_image = ImageTk.PhotoImage(preview_image)
                self._display_image_on_canvas(photo_image)
        
        elif mode == PreviewMode.DGTIFIED:
            # Display DGT-ified version
            if PreviewMode.DGTIFIED in self.preview_images:
                self._display_image_on_canvas(self.preview_images[PreviewMode.DGTIFIED])
        
        elif mode == PreviewMode.KINETIC:
            # Start animation
            self.start_animation()
    
    def _display_image_on_canvas(self, photo_image: ImageTk.PhotoImage) -> None:
        """Display image on canvas"""
        # Clear canvas
        self.canvas.delete("preview")
        
        # Center image on canvas
        canvas_width = self.canvas.winfo_width()
        canvas_height = self.canvas.winfo_height()
        
        if canvas_width > 1 and canvas_height > 1:  # Canvas is realized
            x = (canvas_width - self.preview_size[0]) // 2
            y = (canvas_height - self.preview_size[1]) // 2
            
            self.canvas.create_image(
                x, y,
                image=photo_image,
                anchor='nw',
                tags="preview"
            )
            
            # Keep reference to prevent garbage collection
            self.canvas.image = photo_image
    
    def start_animation(self) -> None:
        """Start kinetic animation"""
        if not self.animation_frames or self.is_animating:
            return
        
        self.is_animating = True
        self.last_animation_time = time.time()
        self._animate_frame()
        
        logger.debug("Started kinetic animation")
    
    def _animate_frame(self) -> None:
        """Animate single frame"""
        if not self.is_animating or not self.animation_frames:
            return
        
        current_time = time.time()
        
        # Check if it's time for next frame
        frame_interval = 1.0 / self.animation_fps
        if current_time - self.last_animation_time >= frame_interval:
            # Get current frame
            frame = self.animation_frames[self.current_frame_index]
            
            # Display frame
            self._display_image_on_canvas(frame.image)
            
            # Update frame index
            self.current_frame_index = (self.current_frame_index + 1) % len(self.animation_frames)
            self.last_animation_time = current_time
        
        # Schedule next frame
        self.animation_loop_id = self.canvas.after(int(frame_interval * 1000), self._animate_frame)
    
    def stop_animation(self) -> None:
        """Stop kinetic animation"""
        self.is_animating = False
        if self.animation_loop_id:
            self.canvas.after_cancel(self.animation_loop_id)
            self.animation_loop_id = None
        
        logger.debug("Stopped kinetic animation")
    
    def get_analysis_summary(self) -> Dict[str, Any]:
        """Get analysis summary for current asset"""
        if not self.current_asset:
            return {}
        
        summary = {
            'asset_id': self.current_asset.asset_id,
            'material_id': self.current_asset.metadata.material_id.value,
            'has_shadow': self.shadow_analysis.has_shadow if self.shadow_analysis else False,
            'shadow_confidence': self.shadow_analysis.shadow_confidence if self.shadow_analysis else 0.0,
            'is_animated': self.animation_analysis.is_animated if self.animation_analysis else False,
            'animation_frames': len(self.animation_frames),
            'preview_modes': list(self.preview_images.keys())
        }
        
        return summary


# Factory function
def create_intelligent_preview(canvas: tk.Canvas, preview_size: Tuple[int, int] = (128, 128)) -> IntelligentPreviewBridge:
    """Create intelligent preview bridge"""
    return IntelligentPreviewBridge(canvas, preview_size)
