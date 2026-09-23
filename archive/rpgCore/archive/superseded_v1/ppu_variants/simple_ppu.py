"""
SimplePPU - Direct-Line Rendering Protocol
ADR 175: Minimal PPU with Zero Circular Dependencies

Pure Tkinter wrapper for 160x144 logical grid with WASD-controlled triangle.
Zero imports from body/engines - only kernel.components and tkinter.
"""

import tkinter as tk
import time
import math
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

# Only import the core physics component - NO circular dependencies!
try:
    from dgt_core.kernel.components import PhysicsComponent
except ImportError:
    # Fallback for testing
    @dataclass
    class PhysicsComponent:
        x: float = 80.0
        y: float = 72.0
        velocity_x: float = 0.0
        velocity_y: float = 0.0
        mass: float = 10.0
        energy: float = 100.0


@dataclass
class RenderDTO:
    """Data Transfer Object for SimplePPU - No circular dependencies"""
    player_physics: PhysicsComponent
    asteroids: List[Dict[str, Any]] = None
    portal: Optional[Dict[str, Any]] = None
    game_state: str = "SURVIVAL"
    time_remaining: float = 60.0


class SimplePPU:
    """Minimal PPU with Direct-Line rendering - Zero circular dependencies"""
    
    def __init__(self, title: str = "Sovereign Scout - SimplePPU"):
        self.title = title
        
        # Display constants
        self.LOGICAL_WIDTH = 160
        self.LOGICAL_HEIGHT = 144
        self.SCALE_FACTOR = 4  # 160x144 -> 640x576
        self.PHYSICAL_WIDTH = self.LOGICAL_WIDTH * self.SCALE_FACTOR
        self.PHYSICAL_HEIGHT = self.LOGICAL_HEIGHT * self.SCALE_FACTOR
        
        # Tkinter components
        self.root: Optional[tk.Tk] = None
        self.canvas: Optional[tk.Canvas] = None
        
        # Game state
        self.current_dto: Optional[RenderDTO] = None
        self.is_running = False
        
        # Input handling
        self.keys_pressed = set()
        
        # Performance tracking
        self.last_render_time = 0.0
        self.fps = 0.0
        
        print(f"🎯 SimplePPU initialized - {self.LOGICAL_WIDTH}x{self.LOGICAL_HEIGHT} logical grid")
    
    def initialize(self) -> bool:
        """Initialize Tkinter window and canvas"""
        try:
            # Create main window
            self.root = tk.Tk()
            self.root.title(self.title)
            self.root.resizable(False, False)
            
            # Create canvas with exact physical dimensions
            self.canvas = tk.Canvas(
                self.root,
                width=self.PHYSICAL_WIDTH,
                height=self.PHYSICAL_HEIGHT,
                bg='black',
                highlightthickness=0
            )
            self.canvas.pack()
            
            # Bind keyboard controls
            self.root.bind('<KeyPress>', self._on_key_press)
            self.root.bind('<KeyRelease>', self._on_key_release)
            self.root.bind('<Escape>', lambda e: self.stop())
            
            # Draw initial grid
            self._draw_background()
            
            print(f"✅ SimplePPU window created - {self.PHYSICAL_WIDTH}x{self.PHYSICAL_HEIGHT} physical")
            return True
            
        except Exception as e:
            print(f"❌ SimplePPU initialization failed: {e}")
            return False
    
    def _logical_to_physical(self, x: float, y: float) -> Tuple[float, float]:
        """Convert logical coordinates to physical canvas coordinates"""
        phys_x = x * self.SCALE_FACTOR
        phys_y = y * self.SCALE_FACTOR
        return phys_x, phys_y
    
    def _draw_background(self) -> None:
        """Draw grid background"""
        if not self.canvas:
            return
        
        # Clear canvas
        self.canvas.delete("all")
        
        # Draw grid lines (subtle)
        grid_color = "#1a1a1a"
        for x in range(0, self.PHYSICAL_WIDTH, self.SCALE_FACTOR * 10):
            self.canvas.create_line(x, 0, x, self.PHYSICAL_HEIGHT, fill=grid_color, width=1)
        
        for y in range(0, self.PHYSICAL_HEIGHT, self.SCALE_FACTOR * 10):
            self.canvas.create_line(0, y, self.PHYSICAL_WIDTH, y, fill=grid_color, width=1)
        
        # Draw border
        self.canvas.create_rectangle(
            2, 2, self.PHYSICAL_WIDTH-2, self.PHYSICAL_HEIGHT-2,
            outline="#333333", width=2
        )
    
    def _draw_triangle(self, physics: PhysicsComponent) -> None:
        """Draw player as a triangle (Sovereign Scout) with Newtonian ghosting"""
        if not self.canvas:
            return
        
        # Convert to physical coordinates
        px, py = self._logical_to_physical(physics.x, physics.y)
        
        # Triangle size based on scale
        size = self.SCALE_FACTOR * 3
        
        # Calculate triangle points (pointing up by default)
        points = [
            px, py - size,  # Top point
            px - size, py + size,  # Bottom left
            px + size, py + size,  # Bottom right
        ]
        
        # Color based on energy
        if physics.energy > 50:
            color = "#00ff00"  # Green
            ghost_color = "#004400"  # Dark green ghost
        elif physics.energy > 25:
            color = "#ffff00"  # Yellow
            ghost_color = "#444400"  # Dark yellow ghost
        else:
            color = "#ff0000"  # Red
            ghost_color = "#440000"  # Dark red ghost
        
        # === NEWTONIAN SCREEN WRAP GHOSTING ===
        # Draw ghost images when near screen edges (within 10% of logical bounds)
        edge_threshold_x = self.LOGICAL_WIDTH * 0.1  # 16 pixels
        edge_threshold_y = self.LOGICAL_HEIGHT * 0.1  # 14.4 pixels
        
        # Ghost on opposite edges when near boundaries
        ghost_positions = []
        
        # Check horizontal wrapping
        if physics.x < edge_threshold_x:
            # Near left edge - show ghost on right
            ghost_px = self.PHYSICAL_WIDTH + px  # Wrap to right side
            ghost_positions.append((ghost_px, py))
        elif physics.x > self.LOGICAL_WIDTH - edge_threshold_x:
            # Near right edge - show ghost on left
            ghost_px = px - self.PHYSICAL_WIDTH  # Wrap to left side
            ghost_positions.append((ghost_px, py))
        
        # Check vertical wrapping
        if physics.y < edge_threshold_y:
            # Near top edge - show ghost on bottom
            ghost_py = self.PHYSICAL_HEIGHT + py  # Wrap to bottom
            ghost_positions.append((px, ghost_py))
        elif physics.y > self.LOGICAL_HEIGHT - edge_threshold_y:
            # Near bottom edge - show ghost on top
            ghost_py = py - self.PHYSICAL_HEIGHT  # Wrap to top side
            ghost_positions.append((px, ghost_py))
        
        # Draw ghost triangles with reduced opacity
        for ghost_x, ghost_y in ghost_positions:
            ghost_points = [
                ghost_x, ghost_y - size,
                ghost_x - size, ghost_y + size,
                ghost_x + size, ghost_y + size
            ]
            self.canvas.create_polygon(
                ghost_points, fill=ghost_color, outline="", 
                width=1, tags="ghost", stipple="gray50"  # Reduced opacity
            )
        
        # Draw main triangle (full opacity)
        self.canvas.create_polygon(
            points, fill=color, outline="white", 
            width=1, tags="player"
        )
        
        # Add velocity trail effect for high-speed movement
        speed = (physics.velocity_x**2 + physics.velocity_y**2)**0.5
        if speed > 2.0:  # Only show trail for significant movement
            trail_length = min(speed * 2, size * 2)  # Scale trail with speed
            trail_x = px - physics.velocity_x * trail_length / 10
            trail_y = py - physics.velocity_y * trail_length / 10
            
            # Draw motion trail
            trail_points = [
                trail_x, trail_y - size * 0.5,
                trail_x - size * 0.5, trail_y + size * 0.5,
                trail_x + size * 0.5, trail_y + size * 0.5
            ]
            self.canvas.create_polygon(
                trail_points, fill=ghost_color, outline="",
                width=1, tags="trail", stipple="gray75"
            )
    
    def _draw_asteroids(self, asteroids: List[Dict[str, Any]]) -> None:
        """Draw asteroids as circles"""
        if not self.canvas or not asteroids:
            return
        
        for asteroid in asteroids:
            ax, ay = self._logical_to_physical(asteroid['x'], asteroid['y'])
            radius = asteroid.get('radius', 15) * self.SCALE_FACTOR
            
            self.canvas.create_oval(
                ax - radius, ay - radius,
                ax + radius, ay + radius,
                fill="#8b4513", outline="#d2691e", width=1,
                tags="asteroid"
            )
    
    def _draw_portal(self, portal: Dict[str, Any]) -> None:
        """Draw extraction portal"""
        if not self.canvas or not portal:
            return
        
        px, py = self._logical_to_physical(portal['x'], portal['y'])
        radius = portal.get('radius', 20) * self.SCALE_FACTOR
        
        # Animated portal effect
        time_factor = time.time() * 2
        pulse = math.sin(time_factor) * 0.3 + 0.7
        
        # Outer ring
        self.canvas.create_oval(
            px - radius * pulse, py - radius * pulse,
            px + radius * pulse, py + radius * pulse,
            outline="#00ffff", width=3, tags="portal"
        )
        
        # Inner swirl
        inner_radius = radius * 0.5 * pulse
        self.canvas.create_oval(
            px - inner_radius, py - inner_radius,
            px + inner_radius, py + inner_radius,
            fill="#0088ff", outline="", tags="portal"
        )
    
    def _draw_hud(self, dto: RenderDTO) -> None:
        """Draw HUD overlay"""
        if not self.canvas:
            return
        
        # HUD background
        self.canvas.create_rectangle(
            10, 10, 250, 80,
            fill="#000000", outline="#00ff00", width=1,
            tags="hud"
        )
        
        # HUD text
        hud_lines = [
            f"State: {dto.game_state}",
            f"Energy: {dto.player_physics.energy:.1f}%",
            f"Mass: {dto.player_physics.mass:.1f}",
            f"Time: {dto.time_remaining:.1f}s"
        ]
        
        y_offset = 20
        for line in hud_lines:
            self.canvas.create_text(
                15, y_offset, text=line, fill="#00ff00",
                anchor="w", font=("Courier", 10),
                tags="hud"
            )
            y_offset += 15
    
    def render(self, dto: RenderDTO) -> None:
        """Main render method - Direct-Line from SectorManager"""
        if not self.canvas:
            return
        
        self.current_dto = dto
        
        # Performance tracking
        start_time = time.time()
        
        # Clear dynamic objects including ghosts and trails
        self.canvas.delete("player")
        self.canvas.delete("asteroid")
        self.canvas.delete("portal")
        self.canvas.delete("hud")
        self.canvas.delete("ghost")
        self.canvas.delete("trail")  # Clear velocity trails
        
        # Render all components
        self._draw_triangle(dto.player_physics)
        
        if dto.asteroids:
            self._draw_asteroids(dto.asteroids)
        
        if dto.portal:
            self._draw_portal(dto.portal)
        
        self._draw_hud(dto)
        
        # Update performance stats
        self.last_render_time = time.time() - start_time
        if self.last_render_time > 0:
            self.fps = 1.0 / self.last_render_time
    
    def _on_key_press(self, event) -> None:
        """Handle key press"""
        self.keys_pressed.add(event.keysym.lower())
    
    def _on_key_release(self, event) -> None:
        """Handle key release"""
        self.keys_pressed.discard(event.keysym.lower())
    
    def get_input_vector(self) -> Tuple[float, float]:
        """Get WASD input as normalized vector"""
        x, y = 0.0, 0.0
        
        if 'w' in self.keys_pressed:
            y -= 1.0
        if 's' in self.keys_pressed:
            y += 1.0
        if 'a' in self.keys_pressed:
            x -= 1.0
        if 'd' in self.keys_pressed:
            x += 1.0
        
        # Normalize diagonal movement
        if x != 0 and y != 0:
            x *= 0.707
            y *= 0.707
        
        return x, y
    
    def update(self) -> bool:
        """Update Tkinter display"""
        if not self.root:
            return False
        
        try:
            self.root.update()
            return True
        except tk.TclError:
            # Window closed
            return False
    
    def run(self) -> None:
        """Main event loop"""
        if not self.root:
            print("❌ SimplePPU not initialized")
            return
        
        self.is_running = True
        print("🎮 SimplePPU running - WASD to move, ESC to exit")
        
        try:
            while self.is_running:
                # Update display
                if not self.update():
                    break
                
                # Control frame rate (60 FPS)
                time.sleep(1/60)
                
        except KeyboardInterrupt:
            print("🛑 SimplePPU stopped by user")
        finally:
            self.stop()
    
    def stop(self) -> None:
        """Stop SimplePPU"""
        self.is_running = False
        if self.root:
            try:
                self.root.quit()
                self.root.destroy()
            except:
                pass
            self.root = None
        
        print("🧹 SimplePPU stopped")


# Factory function
def create_simple_ppu(title: str = "Sovereign Scout") -> SimplePPU:
    """Create SimplePPU instance"""
    ppu = SimplePPU(title)
    if not ppu.initialize():
        print("❌ Failed to create SimplePPU")
        return None
    return ppu


if __name__ == "__main__":
    # Test SimplePPU with demo data
    ppu = create_simple_ppu("SimplePPU Test")
    if ppu:
        # Create test physics
        physics = PhysicsComponent(x=80, y=72, energy=75, mass=12)
        
        # Create test DTO
        dto = RenderDTO(
            player_physics=physics,
            asteroids=[
                {'x': 40, 'y': 40, 'radius': 15},
                {'x': 120, 'y': 100, 'radius': 20}
            ],
            portal={'x': 80, 'y': 130, 'radius': 20},
            game_state="TEST",
            time_remaining=45.0
        )
        
        # Render test frame
        ppu.render(dto)
        
        # Run event loop
        ppu.run()
