"""
Adaptive Renderer - Dual-Profile Rendering System
Implements Retro (160x144) and HD (adaptive) rendering profiles
"""

from typing import Tuple, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import logging

from .logical_viewport import LogicalViewport
from ...engines.kernel.viewport_manager import ViewportManager
# from ..rendering.unified_ppu import UnifiedPPU  # Commented out for testing


class RenderProfile(Enum):
    """Available rendering profiles"""
    RETRO = "retro"      # 160x144 pixel art rendering
    HD = "hd"           # High-resolution adaptive rendering
    AUTO = "auto"       # Automatic profile selection


@dataclass
class RenderConfig:
    """Configuration for rendering profiles"""
    profile: RenderProfile
    target_resolution: Tuple[int, int]
    enable_shaders: bool = False
    enable_lighting: bool = False
    lod_distance: float = 1.0
    color_depth: int = 8  # Bits per color channel


class AdaptiveRenderer:
    """
    Adaptive rendering system that automatically selects appropriate
    rendering profile based on resolution and performance requirements
    """
    
    def __init__(self, viewport_manager: ViewportManager):
        self.viewport_manager = viewport_manager
        self.current_profile = RenderProfile.RETRO
        self.render_configs = self._create_default_configs()
        self.logger = logging.getLogger(__name__)
        
        # Initialize primary viewport for compatibility
        self.primary_viewport = LogicalViewport()
        
        # Performance monitoring
        self.frame_times = []
        self.performance_threshold = 33.33  # 30 FPS target (33.33ms per frame)
        
    def _create_default_configs(self) -> Dict[RenderProfile, RenderConfig]:
        """Create default rendering configurations"""
        return {
            RenderProfile.RETRO: RenderConfig(
                profile=RenderProfile.RETRO,
                target_resolution=(160, 144),
                enable_shaders=False,
                enable_lighting=False,
                lod_distance=0.5,
                color_depth=2  # 2-bit color for retro feel
            ),
            RenderProfile.HD: RenderConfig(
                profile=RenderProfile.HD,
                target_resolution=(1280, 720),  # Default HD resolution
                enable_shaders=True,
                enable_lighting=True,
                lod_distance=2.0,
                color_depth=8  # Full 8-bit color
            ),
            RenderProfile.AUTO: RenderConfig(
                profile=RenderProfile.AUTO,
                target_resolution=(800, 600),  # Will be overridden
                enable_shaders=False,
                enable_lighting=False,
                lod_distance=1.0,
                color_depth=8
            )
        }
    
    def select_profile(self, resolution: Tuple[int, int], 
                      performance_target: float = 30.0) -> RenderProfile:
        """
        Automatically select rendering profile based on resolution and performance.
        
        Args:
            resolution: Current window resolution
            performance_target: Target FPS (default 30)
        
        Returns:
            Selected RenderProfile
        """
        width, height = resolution
        
        # Auto-select based on resolution
        if width <= 320 and height <= 240:
            profile = RenderProfile.RETRO
            self.logger.info(f"Selected RETRO profile for resolution {resolution}")
        elif width >= 640 and height >= 480:
            profile = RenderProfile.HD
            self.logger.info(f"Selected HD profile for resolution {resolution}")
        else:
            profile = RenderProfile.RETRO  # Default to retro for mid-range resolutions
            self.logger.info(f"Defaulted to RETRO profile for resolution {resolution}")
        
        self.current_profile = profile
        return profile
    
    def get_current_config(self) -> RenderConfig:
        """Get configuration for current profile"""
        return self.render_configs[self.current_profile]
    
    def update_resolution(self, new_resolution: Tuple[int, int]) -> None:
        """Update rendering resolution and select appropriate profile"""
        # Update primary viewport
        self.viewport_manager.primary_viewport.set_physical_resolution(new_resolution)
        
        # Auto-select profile if in AUTO mode
        if self.current_profile == RenderProfile.AUTO:
            self.select_profile(new_resolution)
        
        # Update config target resolution
        config = self.get_current_config()
        config.target_resolution = new_resolution
        
        self.logger.info(f"Updated resolution to {new_resolution}, profile: {self.current_profile.value}")
    
    def render_frame(self, render_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Render frame using current profile configuration.
        
        Args:
            render_data: Data to render (turtles, UI elements, etc.)
        
        Returns:
            Rendered frame data
        """
        config = self.get_current_config()
        viewport = self.viewport_manager.primary_viewport
        
        # Start performance timer
        import time
        start_time = time.time()
        
        # Render based on profile
        if config.profile == RenderProfile.RETRO:
            frame_data = self._render_retro(render_data, viewport, config)
        elif config.profile == RenderProfile.HD:
            frame_data = self._render_hd(render_data, viewport, config)
        else:
            # Default to retro
            frame_data = self._render_retro(render_data, viewport, config)
        
        # Track performance
        frame_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        self.frame_times.append(frame_time)
        
        # Keep only last 60 frame times (2 seconds at 30 FPS)
        if len(self.frame_times) > 60:
            self.frame_times.pop(0)
        
        return frame_data
    
    def _render_retro(self, render_data: Dict[str, Any], 
                     viewport: LogicalViewport, config: RenderConfig) -> Dict[str, Any]:
        """
        Render using retro profile (160x144, pixel art style).
        
        Critical: Maps 1000x1000 logical units to 160x144 physical pixels
        """
        frame_data = {
            "profile": "retro",
            "resolution": config.target_resolution,
            "elements": []
        }
        
        # Render turtles as pixel art sprites
        for turtle_data in render_data.get("turtles", []):
            # Convert logical position to physical pixels
            logical_pos = (turtle_data["x"], turtle_data["y"])
            physical_pos = viewport.to_physical(logical_pos)
            
            # Create retro turtle sprite
            turtle_element = {
                "type": "turtle_sprite",
                "position": physical_pos,
                "size": (16, 16),  # Small sprite for retro mode
                "color": self._dither_color(turtle_data["color"], config.color_depth),
                "character": self._get_turtle_char(turtle_data["type"])
            }
            frame_data["elements"].append(turtle_element)
        
        # Render UI elements with retro styling
        for ui_element in render_data.get("ui", []):
            logical_rect = ui_element["rect"]
            physical_rect = self._render_rect_retro(logical_rect, viewport)
            
            ui_render_data = {
                "type": "ui_element",
                "rect": physical_rect,
                "text": ui_element.get("text", ""),
                "style": "retro"
            }
            frame_data["elements"].append(ui_render_data)
        
        return frame_data
    
    def _render_hd(self, render_data: Dict[str, Any], 
                  viewport: LogicalViewport, config: RenderConfig) -> Dict[str, Any]:
        """
        Render using HD profile (adaptive resolution, full color).
        
        Critical: Maps 1000x1000 logical units to current window resolution
        """
        frame_data = {
            "profile": "hd",
            "resolution": config.target_resolution,
            "elements": []
        }
        
        # Render turtles with full RGB color blending
        for turtle_data in render_data.get("turtles", []):
            logical_pos = (turtle_data["x"], turtle_data["y"])
            physical_pos = viewport.to_physical(logical_pos)
            
            # Create HD turtle sprite with full color
            turtle_element = {
                "type": "turtle_sprite_hd",
                "position": physical_pos,
                "size": (64, 64),  # Larger sprite for HD mode
                "color": turtle_data["color"],  # Full RGB color
                "shaders": config.enable_shaders,
                "lighting": config.enable_lighting
            }
            frame_data["elements"].append(turtle_element)
        
        # Render UI elements with HD styling
        for ui_element in render_data.get("ui", []):
            logical_rect = ui_element["rect"]
            physical_rect = self._render_rect_hd(logical_rect, viewport)
            
            ui_render_data = {
                "type": "ui_element_hd",
                "rect": physical_rect,
                "text": ui_element.get("text", ""),
                "style": "hd",
                "font_size": self._calculate_font_size(ui_element, config)
            }
            frame_data["elements"].append(ui_render_data)
        
        return frame_data
    
    def _render_rect_retro(self, logical_rect: Tuple[float, float, float, float],
                          viewport: LogicalViewport) -> Tuple[int, int, int, int]:
        """Convert logical rectangle to retro physical rectangle"""
        x, y, width, height = logical_rect
        top_left = viewport.to_physical((x, y))
        bottom_right = viewport.to_physical((x + width, y + height))
        
        return (
            top_left[0], top_left[1],
            bottom_right[0] - top_left[0],
            bottom_right[1] - top_left[1]
        )
    
    def _render_rect_hd(self, logical_rect: Tuple[float, float, float, float],
                       viewport: LogicalViewport) -> Tuple[int, int, int, int]:
        """Convert logical rectangle to HD physical rectangle"""
        return self._render_rect_retro(logical_rect, viewport)  # Same logic, different target
    
    def _dither_color(self, rgb: Tuple[int, int, int], color_depth: int) -> Tuple[int, int, int]:
        """Dither RGB color to reduced color depth for retro rendering"""
        if color_depth == 2:
            # 2-bit color (4 levels per channel)
            levels = 4
            max_val = 255
            step = max_val / (levels - 1)
            
            r = int(round(rgb[0] / step) * step)
            g = int(round(rgb[1] / step) * step)
            b = int(round(rgb[2] / step) * step)
            
            return (r, g, b)
        else:
            return rgb  # Full color for HD
    
    def _get_turtle_char(self, turtle_type: str) -> str:
        """Get character representation for retro turtle sprite"""
        turtle_chars = {
            "speedster": "»",
            "swimmer": "~",
            "tank": "#",
            "default": "T"
        }
        return turtle_chars.get(turtle_type, "T")
    
    def _calculate_font_size(self, ui_element: Dict[str, Any], config: RenderConfig) -> int:
        """Calculate appropriate font size based on resolution and element type"""
        base_size = 12 if config.profile == RenderProfile.HD else 8
        
        # Adjust based on element importance
        if ui_element.get("importance") == "high":
            return int(base_size * 1.5)
        elif ui_element.get("importance") == "low":
            return int(base_size * 0.8)
        
        return base_size
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get current performance statistics"""
        if not self.frame_times:
            return {"avg_frame_time": 0.0, "fps": 0.0, "profile": self.current_profile.value}
        
        avg_frame_time = sum(self.frame_times) / len(self.frame_times)
        fps = 1000.0 / avg_frame_time if avg_frame_time > 0 else 0.0
        
        return {
            "avg_frame_time": avg_frame_time,
            "fps": fps,
            "profile": self.current_profile.value,
            "resolution": self.get_current_config().target_resolution
        }
    
    def set_profile(self, profile: RenderProfile) -> None:
        """Manually set rendering profile"""
        self.current_profile = profile
        self.logger.info(f"Manually set profile to {profile.value}")
    
    def is_performance_acceptable(self) -> bool:
        """Check if current performance meets target"""
        if not self.frame_times:
            return True
        
        avg_frame_time = sum(self.frame_times) / len(self.frame_times)
        return avg_frame_time <= self.performance_threshold
