"""
Viewport Component - World View Panel

Phase 10: Component-Based UI Architecture
Fixed-Grid Component for the primary world view (Doom/Isometric).

ADR 027: Component-Based UI Synchronization
"""

from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass

from rich.console import Console
from rich.panel import Panel
from rich.align import Align

from loguru import logger

# Import renderers
from ui.renderer_3d import ASCIIDoomRenderer
from ui.iso_renderer import IsometricRenderer
from world_ledger import WorldLedger
from game_state import GameState
from logic.faction_system import FactionSystem


@dataclass
class ViewportState:
    """Current state of the viewport."""
    view_mode: str  # "doom" or "iso"
    player_position: Tuple[int, int]
    player_angle: float
    perception_range: int
    frame_count: int
    last_render_time: float
    is_active: bool


class ViewportComponent:
    """
    World view component for the primary game display.
    
    Manages both Doom-style raycasting and Isometric 2.5D rendering
    with fixed aspect ratio and high-performance updates.
    """
    
    def __init__(self, console: Console, world_ledger: WorldLedger, faction_system: Optional[FactionSystem] = None):
        """Initialize the viewport component."""
        self.console = console
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        
        # Initialize renderers
        self.doom_renderer = ASCIIDoomRenderer(world_ledger)
        self.iso_renderer = IsometricRenderer(world_ledger, faction_system=faction_system)
        
        # Viewport state
        self.state = ViewportState(
            view_mode="doom",
            player_position=(0, 0),
            player_angle=0.0,
            perception_range=10,
            frame_count=0,
            last_render_time=0.0,
            is_active=True
        )
        
        # Viewport dimensions (fixed aspect ratio)
        self.width = 80
        self.height = 24
        self.aspect_ratio = self.width / self.height
        
        # Performance tracking
        self.fps_target = 30.0  # Target FPS for viewport
        self.last_frame_time = 0.0
        self.frame_times = []
        
        # Current renderer
        self.current_renderer = self.doom_renderer
        
        logger.info(f"Viewport Component initialized: {self.width}x{self.height} aspect ratio {self.aspect_ratio:.2f}")
    
    def set_view_mode(self, mode: str) -> bool:
        """
        Switch between Doom and Isometric view modes.
        
        Args:
            mode: "doom" or "iso"
            
        Returns:
            True if mode was switched successfully
        """
        if mode not in ["doom", "iso"]:
            logger.error(f"Invalid view mode: {mode}")
            return False
        
        if self.state.view_mode == mode:
            return True  # Already in this mode
        
        # Switch renderer
        if mode == "iso":
            self.current_renderer = self.iso_renderer
        else:
            self.current_renderer = self.doom_renderer
        
        self.state.view_mode = mode
        self.state.frame_count = 0  # Reset frame count on mode switch
        logger.info(f"Viewport switched to {mode} mode")
        return True
    
    def render_frame(self, game_state: GameState, force_render: bool = False) -> Panel:
        """
        Render the current frame.
        
        Args:
            game_state: Current game state
            force_render: Force render even if not due for update
            
        Returns:
            Rich Panel containing the rendered frame
        """
        # Check if game_state is None
        if game_state is None:
            return Panel(
                "[yellow]No game state available[/yellow]",
                title="[yellow]VIEWPORT[/yellow]",
                border_style="yellow"
            )
        
        # Update state
        self.state.player_position = (game_state.position.x, game_state.position.y)
        self.state.player_angle = game_state.player_angle
        
        # Calculate perception range
        wisdom = game_state.player.attributes.get("wisdom", 10)
        intelligence = game_state.player.attributes.get("intelligence", 10)
        self.state.perception_range = max(5, (wisdom + intelligence) // 2)
        
        # Check if render is needed
        current_time = self._get_current_time()
        time_since_last = current_time - self.state.last_render_time
        
        min_interval = 1.0 / self.fps_target
        
        if not force_render and time_since_last < min_interval:
            # Return cached frame if available
            return self._get_cached_frame()
        
        # Render based on mode
        try:
            if self.state.view_mode == "iso":
                frame = self.current_renderer.render_frame(game_state)
                frame_str = self.current_renderer.get_frame_as_string(frame)
                title = f"[bold green]ISOMETRIC VIEW[/bold green] | ({self.state.player_position[0]}, {self.state.player_position[1]}) | Range: {self.state.perception_range}"
            else:
                # Doom mode needs NPC mood for threat indicators
                npc_mood = self._get_npc_mood(game_state)
                frame = self.current_renderer.render_frame(
                    game_state,
                    self.state.player_angle,
                    self.state.perception_range,
                    npc_mood
                )
                frame_str = self.current_renderer.get_frame_as_string(frame)
                title = f"[bold green]3D VIEWPORT[/bold green] | ({self.state.player_position[0]}, {self.state.player_position[1]}) | Facing: {self._get_facing_direction()}"
            
            # Create panel
            panel = Panel(
                Align.center(frame_str),
                title=title,
                border_style="green",
                padding=(0, 1)
            )
            
            # Update state
            self.state.frame_count += 1
            self.state.last_render_time = current_time
            
            # Track performance
            self._track_performance(current_time)
            
            # Cache frame
            self._cache_frame(panel)
            
            return panel
            
        except Exception as e:
            logger.error(f"Error rendering frame: {e}")
            # Return error frame
            error_frame = f"[red]RENDER ERROR[/red]\n{str(e)}"
            return Panel(
                Align.center(error_frame),
                title="[bold red]VIEWPORT ERROR[/bold red]",
                border_style="red",
                padding=(1, 2)
            )
    
    def _get_npc_mood(self, game_state: GameState) -> Optional[str]:
        """Get NPC mood for threat indicators (Doom mode only)."""
        if self.faction_system:
            faction = self.faction_system.get_faction_at_coordinate(game_state.position)
            if faction:
                # This would integrate with the conversation engine
                # For now, return None (no threat indicators)
                return None
        return None
    
    def _get_facing_direction(self) -> str:
        """Get human-readable facing direction."""
        angle = self.state.player_angle % 360
        
        if angle >= 337.5 or angle < 22.5:
            return "North"
        elif angle < 67.5:
            return "Northeast"
        elif angle < 112.5:
            return "East"
        elif angle < 157.5:
            return "Southeast"
        elif angle < 202.5:
            return "South"
        elif angle < 247.5:
            return "Southwest"
        elif angle < 292.5:
            return "West"
        else:
            return "Northwest"
    
    def _get_current_time(self) -> float:
        """Get current time in seconds."""
        import time
        return time.time()
    
    def _track_performance(self, current_time: float) -> None:
        """Track rendering performance."""
        if self.last_frame_time > 0:
            frame_time = current_time - self.last_frame_time
            self.frame_times.append(frame_time)
            
            # Keep only last 60 frames
            if len(self.frame_times) > 60:
                self.frame_times.pop(0)
    
    def get_performance_stats(self) -> Dict[str, float]:
        """Get performance statistics."""
        if not self.frame_times:
            return {
                "fps": 0.0,
                "avg_frame_time": 0.0,
                "frame_count": self.state.frame_count
            }
        
        avg_frame_time = sum(self.frame_times) / len(self.frame_times)
        fps = 1.0 / avg_frame_time if avg_frame_time > 0 else 0.0
        
        return {
            "fps": fps,
            "avg_frame_time": avg_frame_time,
            "frame_count": self.state.frame_count
        }
    
    def _cache_frame(self, panel: Panel) -> None:
        """Cache the current frame."""
        self._cached_frame = panel
        self._cache_time = self._get_current_time()
    
    def _get_cached_frame(self) -> Optional[Panel]:
        """Get cached frame if still valid."""
        if hasattr(self, '_cached_frame') and hasattr(self, '_cache_time'):
            current_time = self._get_current_time()
            if current_time - self._cache_time < 1.0 / self.fps_target:
                return self._cached_frame
        return None
    
    def get_viewport_summary(self) -> Dict[str, Any]:
        """Get summary of viewport state."""
        return {
            "view_mode": self.state.view_mode,
            "dimensions": f"{self.width}x{self.height}",
            "aspect_ratio": self.aspect_ratio,
            "position": self.state.player_position,
            "angle": self.state.player_angle,
            "perception_range": self.state.perception_range,
            "frame_count": self.state.frame_count,
            "is_active": self.state.is_active,
            "performance": self.get_performance_stats()
        }
    
    def resize_viewport(self, new_width: int, new_height: int) -> bool:
        """
        Resize the viewport while maintaining aspect ratio.
        
        Args:
            new_width: New width
            new_height: New height
            
        Returns:
            True if resize was successful
        """
        # Calculate new dimensions maintaining aspect ratio
        new_aspect = new_width / new_height
        target_aspect = self.aspect_ratio
        
        if abs(new_aspect - target_aspect) > 0.1:  # 10% tolerance
            # Adjust dimensions to maintain aspect ratio
            if new_aspect > target_aspect:
                # Too wide, reduce width
                adjusted_width = int(new_height * target_aspect)
                self.width = adjusted_width
                self.height = new_height
            else:
                # Too tall, reduce height
                adjusted_height = int(new_width / target_aspect)
                self.width = new_width
                self.height = adjusted_height
        else:
            # Within tolerance, use new dimensions
            self.width = new_width
            self.height = new_height
        
        # Update renderers
        self.doom_renderer = ASCIIDoomRenderer(self.world_ledger, self.width, self.height)
        self.iso_renderer = IsometricRenderer(self.world_ledger, faction_system=self.faction_system)
        
        # Update current renderer
        if self.state.view_mode == "iso":
            self.current_renderer = self.iso_renderer
        else:
            self.current_renderer = self.doom_renderer
        
        logger.info(f"Viewport resized to {self.width}x{self.height} (aspect: {self.aspect_ratio:.2f})")
        return True
    
    def clear_cache(self) -> None:
        """Clear the frame cache."""
        if hasattr(self, '_cached_frame'):
            delattr(self, '_cached_frame')
        if hasattr(self, '_cache_time'):
            delattr(self, '_cache_time')


# Export for use by other components
__all__ = ["ViewportComponent", "ViewportState"]
