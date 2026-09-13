"""
Render Panel - Sovereign Viewport with Integer Scaling
ADR 207: MVC Pattern - View Component

Handles PyGame/Tkinter surface rendering with nearest-neighbor integer scaling.
Maintains pixel-perfect 160x144 sovereign resolution across all window sizes.
"""

import pygame
import tkinter as tk
from typing import Dict, List, Any, Optional, Tuple, Callable
from pathlib import Path
import math
import time

from foundation.types import Result
from foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT
from loguru import logger


class RenderPanel:
    """Sovereign viewport with integer scaling and size options"""
    
    def __init__(self, parent_widget: tk.Widget, width: int = 400, height: int = 400, 
                 size_option: str = "standard"):
        self.parent_widget = parent_widget
        self.available_width = width
        self.available_height = height
        self.size_option = size_option
        
        # Size configurations
        self.size_configs = {
            "standard": {"world_width": 160, "world_height": 144, "name": "Standard (160x144)"},
            "adaptive": {"world_width": 320, "world_height": 240, "name": "Adaptive (320x240)"},
            "large": {"world_width": 480, "world_height": 360, "name": "Large (480x360)"},
            "huge": {"world_width": 640, "world_height": 480, "name": "Huge (640x480)"},
            "massive": {"world_width": 800, "world_height": 600, "name": "Massive (800x600)"}
        }
        
        # Get current size configuration
        config = self.size_configs.get(size_option, self.size_configs["standard"])
        self.world_width = config["world_width"]
        self.world_height = config["world_height"]
        self.size_name = config["name"]
        
        # Sovereign surface (always at configured size)
        self.sovereign_surface = pygame.Surface((self.world_width, self.world_height))
        self.sovereign_surface.fill((0, 0, 0))
        
        # Display surface (scaled for display)
        self.display_surface = None
        self.scale_factor = 1
        self.display_width = self.world_width
        self.display_height = self.world_height
        
        # Tkinter canvas
        self.canvas = tk.Canvas(
            parent_widget,
            width=self.display_width,
            height=self.display_height,
            bg='black',
            highlightthickness=2,
            highlightbackground='cyan'
        )
        
        # Rendering state
        self.last_render_time = 0
        self.fps_history = []
        self.render_count = 0
        
        # PhotoImage reference (prevent garbage collection)
        self.photo_image = None
        
        logger.info(f"🎮 RenderPanel initialized ({self.size_name}) with {width}x{height} available")
    
    def calculate_optimal_scaling(self, available_width: int, available_height: int) -> int:
        """Calculate optimal integer scaling factor using nearest-neighbor"""
        # Calculate maximum integer scale that fits
        width_scale = available_width // self.world_width
        height_scale = available_height // self.world_height
        
        # Use the smaller scale to ensure full visibility
        optimal_scale = min(width_scale, height_scale)
        
        # Cap at reasonable maximum for performance
        optimal_scale = min(optimal_scale, 6)  # Cap at 6x
        
        # Ensure minimum scale of 1
        return max(1, optimal_scale)
    
    def update_layout(self, available_width: int, available_height: int) -> Result[bool]:
        """Update render panel layout with new dimensions"""
        try:
            self.available_width = available_width
            self.available_height = available_height
            
            # Calculate new scaling
            new_scale = self.calculate_optimal_scaling(available_width, available_height)
            
            if new_scale != self.scale_factor:
                self.scale_factor = new_scale
                self.display_width = self.world_width * self.scale_factor
                self.display_height = self.world_height * self.scale_factor
                
                # Update canvas size
                self.canvas.config(width=self.display_width, height=self.display_height)
                
                logger.info(f"📐 RenderPanel ({self.size_name}) scaled to {self.scale_factor}x ({self.display_width}x{self.display_height})")
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Layout update failed: {e}")
    
    def change_size(self, size_option: str) -> Result[bool]:
        """Change render panel size configuration"""
        try:
            if size_option not in self.size_configs:
                return Result.failure_result(f"Unknown size option: {size_option}")
            
            # Get new configuration
            config = self.size_configs[size_option]
            old_size = self.size_name
            
            # Update configuration
            self.size_option = size_option
            self.world_width = config["world_width"]
            self.world_height = config["world_height"]
            self.size_name = config["name"]
            
            # Recreate surface with new size
            self.sovereign_surface = pygame.Surface((self.world_width, self.world_height))
            self.sovereign_surface.fill((0, 0, 0))
            
            # Recalculate scaling
            self.update_layout(self.available_width, self.available_height)
            
            logger.info(f"🔄 RenderPanel changed from {old_size} to {self.size_name}")
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Size change failed: {e}")
    
    def get_available_sizes(self) -> List[str]:
        """Get list of available size options"""
        return list(self.size_configs.keys())
    
    def get_current_size_info(self) -> Dict[str, Any]:
        """Get current size configuration information"""
        return {
            'size_option': self.size_option,
            'world_width': self.world_width,
            'world_height': self.world_height,
            'size_name': self.size_name,
            'scale_factor': self.scale_factor,
            'display_width': self.display_width,
            'display_height': self.display_height
        }
    
    def clear_sovereign_surface(self, color: Tuple[int, int, int] = (0, 0, 0)) -> None:
        """Clear the sovereign surface with specified color"""
        self.sovereign_surface.fill(color)
    
    def get_sovereign_surface(self) -> pygame.Surface:
        """Get the sovereign 160x144 surface for drawing"""
        return self.sovereign_surface
    
    def render_frame(self) -> Result[bool]:
        """Render the current frame to display"""
        try:
            # Scale the sovereign surface using nearest-neighbor
            if self.scale_factor > 1:
                self.display_surface = pygame.transform.scale(
                    self.sovereign_surface,
                    (self.display_width, self.display_height)
                )
            else:
                self.display_surface = self.sovereign_surface
            
            # Update tkinter canvas
            self._update_canvas()
            
            # Track performance
            current_time = time.time()
            if self.last_render_time > 0:
                frame_time = current_time - self.last_render_time
                fps = 1.0 / frame_time if frame_time > 0 else 60.0
                self.fps_history.append(fps)
                if len(self.fps_history) > 60:
                    self.fps_history.pop(0)
            
            self.last_render_time = current_time
            self.render_count += 1
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Render failed: {e}")
    
    def _update_canvas(self) -> None:
        """Update tkinter canvas with pygame surface"""
        try:
            # Try to use PIL for high-quality rendering
            self._update_canvas_pil()
        except ImportError:
            # Fallback to simple rendering
            self._update_canvas_simple()
        except Exception as e:
            logger.error(f"Canvas update error: {e}")
            self._update_canvas_simple()
    
    def _update_canvas_pil(self) -> None:
        """Update canvas using PIL for better quality"""
        import PIL.Image
        import PIL.ImageTk
        
        # Convert pygame surface to PIL Image
        w, h = self.display_surface.get_size()
        raw_str = pygame.image.tostring(self.display_surface, 'RGB', False)
        pil_image = PIL.Image.frombytes('RGB', (w, h), raw_str)
        
        # Convert to PhotoImage
        self.photo_image = PIL.ImageTk.PhotoImage(pil_image)
        
        # Update canvas
        self.canvas.delete("all")
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.photo_image)
    
    def _update_canvas_simple(self) -> None:
        """Simple canvas update without PIL"""
        # Create a simple text representation
        self.canvas.delete("all")
        self.canvas.create_text(
            self.display_width // 2,
            self.display_height // 2,
            text=f"Render {self.render_count}\n{self.scale_factor}x Scale\n{SOVEREIGN_WIDTH}x{SOVEREIGN_HEIGHT}",
            fill="white",
            font=("Courier", 10)
        )
    
    def get_canvas_widget(self) -> tk.Canvas:
        """Get the tkinter canvas widget"""
        return self.canvas
    
    def get_render_stats(self) -> Dict[str, Any]:
        """Get rendering performance statistics"""
        if not self.fps_history:
            return {
                'avg_fps': 0.0,
                'min_fps': 0.0,
                'max_fps': 0.0,
                'scale_factor': self.scale_factor,
                'render_count': self.render_count,
                'display_size': (self.display_width, self.display_height),
                'world_size': (self.world_width, self.world_height),
                'size_name': self.size_name
            }
        
        return {
            'avg_fps': sum(self.fps_history) / len(self.fps_history),
            'min_fps': min(self.fps_history),
            'max_fps': max(self.fps_history),
            'scale_factor': self.scale_factor,
            'render_count': self.render_count,
            'display_size': (self.display_width, self.display_height),
            'world_size': (self.world_width, self.world_height),
            'size_name': self.size_name
        }
    
    def pack(self, **kwargs) -> None:
        """Pack the canvas widget"""
        self.canvas.pack(**kwargs)
    
    def grid(self, **kwargs) -> None:
        """Grid the canvas widget"""
        self.canvas.grid(**kwargs)
    
    def destroy(self) -> None:
        """Clean up resources"""
        if self.canvas:
            self.canvas.destroy()
        
        # Clean up pygame surfaces
        self.sovereign_surface = None
        self.display_surface = None
        
        logger.info("🧹 RenderPanel destroyed")


class RenderPanelFactory:
    """Factory for creating render panels with different configurations"""
    
    @staticmethod
    def create_sovereign_viewport(parent_widget: tk.Widget, width: int = 400, height: int = 400, 
                               size_option: str = "standard") -> RenderPanel:
        """Create a standard sovereign viewport"""
        panel = RenderPanel(parent_widget, width, height, size_option)
        logger.info("🏛️ Sovereign viewport created")
        return panel
    
    @staticmethod
    def create_minimap_viewport(parent_widget: tk.Widget, scale_factor: int = 2, 
                            size_option: str = "standard") -> RenderPanel:
        """Create a minimap viewport with fixed scaling"""
        width = SOVEREIGN_WIDTH * scale_factor
        height = SOVEREIGN_HEIGHT * scale_factor
        
        panel = RenderPanel(parent_widget, width, height, size_option)
        panel.scale_factor = scale_factor
        panel.display_width = width
        panel.display_height = height
        
        # Update canvas to fixed size
        panel.canvas.config(width=width, height=height)
        
        logger.info(f"🗺️ Minimap viewport created ({scale_factor}x)")
        return panel
    
    @staticmethod
    def create_fullscreen_viewport(parent_widget: tk.Widget, size_option: str = "adaptive") -> RenderPanel:
        """Create a fullscreen viewport that fills available space"""
        # Get parent dimensions
        parent_widget.update()
        width = parent_widget.winfo_width()
        height = parent_widget.winfo_height()
        
        panel = RenderPanel(parent_widget, width, height, size_option)
        panel.update_layout(width, height)
        
        logger.info(f"🖥️ Fullscreen viewport created ({panel.size_name})")
        return panel


# Utility functions for rendering
def draw_pixel_perfect_line(surface: pygame.Surface, start: Tuple[int, int], end: Tuple[int, int], 
                           color: Tuple[int, int, int], width: int = 1) -> None:
    """Draw a pixel-perfect line on the surface"""
    # Ensure coordinates are integers for pixel-perfect rendering
    start_int = (int(start[0]), int(start[1]))
    end_int = (int(end[0]), int(end[1]))
    
    pygame.draw.line(surface, color, start_int, end_int, width)


def draw_pixel_perfect_circle(surface: pygame.Surface, center: Tuple[int, int], radius: int,
                            color: Tuple[int, int, int], width: int = 0) -> None:
    """Draw a pixel-perfect circle on the surface"""
    center_int = (int(center[0]), int(center[1]))
    radius_int = max(1, int(radius))  # Ensure minimum radius of 1
    
    pygame.draw.circle(surface, color, center_int, radius_int, width)


def draw_pixel_perfect_rect(surface: pygame.Surface, rect: Tuple[int, int, int, int],
                          color: Tuple[int, int, int], width: int = 0) -> None:
    """Draw a pixel-perfect rectangle on the surface"""
    rect_int = (int(rect[0]), int(rect[1]), int(rect[2]), int(rect[3]))
    
    if width == 0:
        pygame.draw.rect(surface, color, rect_int)
    else:
        pygame.draw.rect(surface, color, rect_int, width)


def draw_sovereign_grid(surface: pygame.Surface, color: Tuple[int, int, int] = (40, 40, 40)) -> None:
    """Draw the sovereign grid lines for debugging"""
    # Draw vertical lines every 10 pixels
    for x in range(0, SOVEREIGN_WIDTH, 10):
        draw_pixel_perfect_line(surface, (x, 0), (x, SOVEREIGN_HEIGHT), color)
    
    # Draw horizontal lines every 10 pixels
    for y in range(0, SOVEREIGN_HEIGHT, 10):
        draw_pixel_perfect_line(surface, (0, y), (SOVEREIGN_WIDTH, y), color)
    
    # Draw border
    draw_pixel_perfect_rect(surface, (0, 0, SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT), color, 1)


# Test function
def test_render_panel():
    """Test the render panel functionality"""
    import tkinter as tk
    
    # Create test window
    root = tk.Tk()
    root.title("Render Panel Test")
    root.geometry("600x400")
    
    # Create render panel
    panel = RenderPanelFactory.create_sovereign_viewport(root, 400, 300)
    panel.pack(pady=20)
    
    # Test drawing
    surface = panel.get_sovereign_surface()
    
    # Draw test pattern
    surface.fill((20, 20, 20))
    draw_pixel_perfect_circle(surface, (80, 72), 20, (255, 100, 100))
    draw_pixel_perfect_rect(surface, (60, 52, 40, 40), (100, 255, 100), 2)
    draw_sovereign_grid(surface)
    
    # Animation loop
    def animate():
        panel.render_frame()
        root.after(16, animate)  # ~60 FPS
    
    animate()
    
    # Test resize
    def on_resize(event):
        if event.width > 100 and event.height > 100:
            panel.update_layout(event.width, event.height - 100)
    
    root.bind('<Configure>', on_resize)
    
    root.mainloop()


if __name__ == "__main__":
    test_render_panel()
