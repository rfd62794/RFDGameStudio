"""
Viewport Manager - Context-Aware Scaling and Layout Management

ADR 193: Sovereign Viewport Protocol

Manages responsive viewport scaling and layout adaptation across different
screen sizes while maintaining the 160×144 sovereign resolution standard.
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import math

from loguru import logger


# Stub classes for missing dependencies
@dataclass
class Result[T]:
    success: bool
    value: Optional[T] = None
    error: Optional[str] = None
    
    @classmethod
    def success_result(cls, value: T) -> 'Result[T]':
        return cls(success=True, value=value)
    
    @classmethod
    def failure_result(cls, error: str) -> 'Result[T]':
        return cls(success=False, error=error)


@dataclass
class Point:
    x: int
    y: int


@dataclass
class Rectangle:
    x: int
    y: int
    width: int
    height: int


class ViewportLayoutMode(Enum):
    FOCUS = "focus"
    DASHBOARD = "dashboard"
    MULTI_PANEL = "multi_panel"


@dataclass
class ScaleBucket:
    width: int
    height: int
    layout_mode: ViewportLayoutMode


@dataclass
class ViewportLayout:
    window_width: int
    window_height: int
    center_anchor: Point
    left_wing: Rectangle
    right_wing: Rectangle
    ppu_scale: int
    wing_scale: float
    layout_mode: ViewportLayoutMode
    focus_mode: bool
    
    def validate(self) -> bool:
        return True


@dataclass
class OverlayComponent:
    name: str
    alpha: float
    z_index: int
    slide_animation: bool
    visible: bool


# Standard scale buckets
STANDARD_SCALE_BUCKETS = [
    ScaleBucket(160, 144, ViewportLayoutMode.FOCUS),
    ScaleBucket(800, 600, ViewportLayoutMode.DASHBOARD),
    ScaleBucket(1920, 1080, ViewportLayoutMode.MULTI_PANEL),
]

class CallbackRegistry:
    pass


class ViewportManager:
    """Manages responsive viewport scaling and layout"""
    
    def __init__(self):
        self.current_config: Optional[ViewportLayout] = None
        self.scale_buckets = STANDARD_SCALE_BUCKETS
        self.overlay_manager: Optional[OverlayManager] = None
        
        # Sovereign resolution constants (ADR 192)
        self.SOVEREIGN_WIDTH = 160
        self.SOVEREIGN_HEIGHT = 144
        
        logger.info("🖥️ ViewportManager initialized with sovereign resolution support")
    
    def calculate_optimal_layout(self, window_width: int, window_height: int) -> Result[ViewportLayout]:
        """Calculate optimal layout for given window dimensions"""
        try:
            # Determine layout mode based on resolution
            layout_mode = self._determine_layout_mode(window_width, window_height)
            
            if layout_mode == ViewportLayoutMode.FOCUS:
                layout = self._create_focus_layout(window_width, window_height)
            else:
                layout = self._create_multi_panel_layout(window_width, window_height, layout_mode)
            
            # Validate the layout
            if not layout.validate():
                return Result.failure_result(f"Invalid layout calculated for {window_width}x{window_height}")
            
            self.current_config = layout
            logger.info(f"🖥️ Calculated optimal layout: {layout_mode.value} for {window_width}x{window_height}")
            
            return Result.success_result(layout)
            
        except Exception as e:
            logger.error(f"❌ Failed to calculate optimal layout: {e}")
            return Result.failure_result(f"Layout calculation error: {str(e)}")
    
    def _determine_layout_mode(self, width: int, height: int) -> ViewportLayoutMode:
        """Determine layout mode based on resolution"""
        
        # Check for focus mode (small screens)
        if self._should_use_focus_mode(width, height):
            return ViewportLayoutMode.FOCUS
        
        # Find closest scale bucket
        closest_bucket = self._find_closest_scale_bucket(width, height)
        
        if closest_bucket:
            return closest_bucket.layout_mode
        
        # Default to dashboard mode
        return ViewportLayoutMode.DASHBOARD
    
    def _should_use_focus_mode(self, width: int, height: int) -> bool:
        """Determine if focus mode should be used"""
        # Small screen threshold
        return width < 640 or height < 480
    
    def _find_closest_scale_bucket(self, width: int, height: int) -> Optional[ScaleBucket]:
        """Find closest scale bucket for given resolution"""
        min_distance = float('inf')
        closest_bucket = None
        
        for bucket in self.scale_buckets:
            # Calculate distance from target resolution
            distance = math.sqrt(
                (bucket.width - width) ** 2 + (bucket.height - height) ** 2
            )
            
            if distance < min_distance:
                min_distance = distance
                closest_bucket = bucket
        
        return closest_bucket
    
    def _create_focus_layout(self, width: int, height: int) -> ViewportLayout:
        """Create focus layout for small screens"""
        
        # Scale PPU to fit screen
        ppu_scale = min(width // self.SOVEREIGN_WIDTH, height // self.SOVEREIGN_HEIGHT)
        
        # Center the PPU
        center_width = self.SOVEREIGN_WIDTH * ppu_scale
        center_height = self.SOVEREIGN_HEIGHT * ppu_scale
        center_x = (width - center_width) // 2
        center_y = (height - center_height) // 2
        
        return ViewportLayout(
            window_width=width,
            window_height=height,
            center_anchor=Point(x=center_x, y=center_y),
            left_wing=Rectangle(x=0, y=0, width=0, height=0),  # Hidden
            right_wing=Rectangle(x=0, y=0, width=0, height=0),  # Hidden
            ppu_scale=ppu_scale,
            wing_scale=1.0,
            layout_mode=ViewportLayoutMode.FOCUS,
            focus_mode=True
        )
    
    def _create_multi_panel_layout(self, width: int, height: int, mode: ViewportLayoutMode) -> ViewportLayout:
        """Create multi-panel layout with wings"""
        
        # Calculate PPU scale (largest integer that fits height)
        ppu_scale = height // self.SOVEREIGN_HEIGHT
        
        # Calculate center region size
        center_width = self.SOVEREIGN_WIDTH * ppu_scale
        center_height = self.SOVEREIGN_HEIGHT * ppu_scale
        
        # Calculate remaining width for wings
        remaining_width = width - center_width
        wing_width = remaining_width // 2
        
        # Ensure minimum wing width for usability
        min_wing_width = 200
        if wing_width < min_wing_width:
            wing_width = min_wing_width
            # Adjust center width to accommodate
            center_width = width - (2 * wing_width)
        
        # Center the PPU
        center_x = (width - center_width) // 2
        center_y = (height - center_height) // 2
        
        return ViewportLayout(
            window_width=width,
            window_height=height,
            center_anchor=Point(x=center_x, y=center_y),
            left_wing=Rectangle(x=0, y=0, width=wing_width, height=height),
            right_wing=Rectangle(x=width - wing_width, y=0, width=wing_width, height=height),
            ppu_scale=ppu_scale,
            wing_scale=1.0,
            layout_mode=mode,
            focus_mode=False
        )
    
    def get_ppu_render_region(self) -> Optional[Rectangle]:
        """Get the PPU render region"""
        if not self.current_config:
            return None
        
        center_x = self.current_config.center_anchor.x
        center_y = self.current_config.center_anchor.y
        center_width = self.SOVEREIGN_WIDTH * self.current_config.ppu_scale
        center_height = self.SOVEREIGN_HEIGHT * self.current_config.ppu_scale
        
        return Rectangle(x=center_x, y=center_y, width=center_width, height=center_height)
    
    def get_left_wing_region(self) -> Optional[Rectangle]:
        """Get the left wing render region"""
        if not self.current_config or self.current_config.focus_mode:
            return None
        return self.current_config.left_wing
    
    def get_right_wing_region(self) -> Optional[Rectangle]:
        """Get the right wing render region"""
        if not self.current_config or self.current_config.focus_mode:
            return None
        return self.current_config.right_wing
    
    def update_window_size(self, new_width: int, new_height: int) -> Result[ViewportLayout]:
        """Update window size and recalculate layout"""
        return self.calculate_optimal_layout(new_width, new_height)
    
    def get_scale_info(self) -> Dict[str, Any]:
        """Get current scaling information"""
        if not self.current_config:
            return {"error": "No layout calculated"}
        
        return {
            "window_size": f"{self.current_config.window_width}x{self.current_config.window_height}",
            "layout_mode": self.current_config.layout_mode.value,
            "ppu_scale": self.current_config.ppu_scale,
            "wing_scale": self.current_config.wing_scale,
            "focus_mode": self.current_config.focus_mode,
            "center_region": {
                "x": self.current_config.center_anchor.x,
                "y": self.current_config.center_anchor.y,
                "width": self.SOVEREIGN_WIDTH * self.current_config.ppu_scale,
                "height": self.SOVEREIGN_HEIGHT * self.current_config.ppu_scale
            },
            "left_wing": {
                "x": self.current_config.left_wing.x,
                "y": self.current_config.left_wing.y,
                "width": self.current_config.left_wing.width,
                "height": self.current_config.left_wing.height
            } if not self.current_config.focus_mode else None,
            "right_wing": {
                "x": self.current_config.right_wing.x,
                "y": self.current_config.right_wing.y,
                "width": self.current_config.right_wing.width,
                "height": self.current_config.right_wing.height
            } if not self.current_config.focus_mode else None
        }
    
    def validate_ppu_scaling(self, scale: int, window_height: int) -> bool:
        """Validate that PPU scaling maintains pixel-perfect rendering"""
        if scale < 1:
            return False
        
        max_scale = window_height // self.SOVEREIGN_HEIGHT
        return scale <= max_scale and scale <= 16  # Reasonable scaling limits
    
    def calculate_optimal_ppu_scale(self, window_height: int) -> int:
        """Calculate largest integer scale that fits in window height"""
        return max(1, window_height // self.SOVEREIGN_HEIGHT)
    
    def calculate_wing_dimensions(self, window_width: int, center_width: int) -> Tuple[int, int]:
        """Calculate wing dimensions to fill remaining space"""
        remaining_width = window_width - center_width
        wing_width = remaining_width // 2
        
        # Ensure minimum wing width for usability
        min_wing_width = 200
        if wing_width < min_wing_width:
            wing_width = min_wing_width
        
        return wing_width, window_height


class OverlayManager:
    """Manages Z-layered overlays for small screen focus mode"""
    
    def __init__(self):
        self.overlays: Dict[str, OverlayComponent] = {}
        self.active_overlay: Optional[str] = None
        self.animation_queue: List[Tuple[str, str]] = []  # (overlay_name, action)
        
        logger.info("🎭 OverlayManager initialized for focus mode")
    
    def create_overlay(self, name: str, component_type: str = "default") -> OverlayComponent:
        """Create overlay component with transparency"""
        return OverlayComponent(
            name=name,
            alpha=0.8,  # Semi-transparent
            z_index=1000,
            slide_animation=True,
            visible=False
        )
    
    def register_overlay(self, overlay: OverlayComponent) -> None:
        """Register an overlay component"""
        self.overlays[overlay.name] = overlay
        logger.debug(f"🎭 Registered overlay: {overlay.name}")
    
    def toggle_overlay(self, overlay_name: str) -> Result[bool]:
        """Toggle overlay visibility with slide animation"""
        if overlay_name not in self.overlays:
            return Result.failure_result(f"Overlay '{overlay_name}' not found")
        
        try:
            if self.active_overlay == overlay_name:
                self._slide_out(overlay_name)
                self.active_overlay = None
                logger.info(f"🎭 Slid out overlay: {overlay_name}")
            else:
                if self.active_overlay:
                    self._slide_out(self.active_overlay)
                self._slide_in(overlay_name)
                self.active_overlay = overlay_name
                logger.info(f"🎭 Slid in overlay: {overlay_name}")
            
            return Result.success_result(True)
            
        except Exception as e:
            logger.error(f"❌ Failed to toggle overlay '{overlay_name}': {e}")
            return Result.failure_result(f"Toggle error: {str(e)}")
    
    def _slide_in(self, overlay_name: str) -> None:
        """Slide in overlay animation"""
        if overlay_name in self.overlays:
            self.overlays[overlay_name].visible = True
            self.animation_queue.append((overlay_name, "slide_in"))
    
    def _slide_out(self, overlay_name: str) -> None:
        """Slide out overlay animation"""
        if overlay_name in self.overlays:
            self.overlays[overlay_name].visible = False
            self.animation_queue.append((overlay_name, "slide_out"))
    
    def get_active_overlay(self) -> Optional[str]:
        """Get currently active overlay"""
        return self.active_overlay
    
    def get_overlay(self, name: str) -> Optional[OverlayComponent]:
        """Get overlay by name"""
        return self.overlays.get(name)
    
    def get_all_overlays(self) -> Dict[str, OverlayComponent]:
        """Get all registered overlays"""
        return self.overlays.copy()
    
    def process_animation_queue(self) -> List[Tuple[str, str]]:
        """Process pending animations and return completed ones"""
        completed = []
        remaining = []
        
        for overlay_name, action in self.animation_queue:
            # In a real implementation, this would trigger actual animations
            # For now, we'll just mark them as completed
            completed.append((overlay_name, action))
        
        self.animation_queue = remaining
        return completed


# Factory function for easy initialization
def create_viewport_manager() -> ViewportManager:
    """Create a ViewportManager instance"""
    return ViewportManager()


# Factory function for overlay manager
def create_overlay_manager() -> OverlayManager:
    """Create an OverlayManager instance"""
    return OverlayManager()
