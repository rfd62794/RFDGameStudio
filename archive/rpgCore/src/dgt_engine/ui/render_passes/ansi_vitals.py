"""
ANSI Vitals Pass - Progress Bar Rendering

Zone C: High-contrast vitals display using standard ASCII with color gradients.
Provides 10-second glanceability for HP, Fatigue, and other stats.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass

from loguru import logger

from . import BaseRenderPass, RenderContext, RenderResult, RenderPassType


@dataclass
class VitalsConfig:
    """Configuration for vitals display."""
    width: int = 20
    height: int = 8
    show_bars: bool = True
    show_numbers: bool = True
    color_gradients: bool = True
    compact_mode: bool = False


class ANSIVitalsPass(BaseRenderPass):
    """
    ANSI-based vitals rendering pass.
    
    Uses standard ASCII characters with color gradients for
    high-contrast, easily readable status displays.
    """
    
    def __init__(self, config: Optional[VitalsConfig] = None):
        """
        Initialize the ANSI vitals pass.
        
        Args:
            config: Optional vitals configuration
        """
        super().__init__(RenderPassType.ANSI_VITALS)
        self.config = config or VitalsConfig()
        
        # Color definitions for health levels
        self.colors = {
            "critical": "\033[38;5;196m",    # Red
            "low": "\033[38;5;208m",        # Orange
            "medium": "\033[38;5;226m",     # Yellow
            "high": "\033[38;5;46m",       # Green
            "full": "\033[38;5;34m",        # Bright green
            "neutral": "\033[38;5;250m",    # White
            "background": "\033[48;5;232m", # Light grey background
        }
        
        self.ANSI_RESET = "\033[0m"
        self.ANSI_BOLD = "\033[1m"
        
        logger.info(f"ANSIVitalsPass initialized: {self.config.width}x{self.config.height}")
    
    def render(self, context: RenderContext) -> RenderResult:
        """
        Render vitals display.
        
        Args:
            context: Shared rendering context
            
        Returns:
            RenderResult with vitals content
        """
        lines = []
        
        # Get player stats
        player = context.game_state.player
        hp_percent = (player.hp / player.max_hp) * 100 if player.max_hp > 0 else 0
        
        # Render HP bar
        if self.config.show_bars:
            hp_bar = self._create_progress_bar("HP", hp_percent, 20)
            lines.append(hp_bar)
        
        # Render numeric values
        if self.config.show_numbers:
            hp_text = f"HP: {player.hp}/{player.max_hp}"
            lines.append(hp_text)
        
        # Render additional stats
        if self.config.height > 2:
            # Add fatigue, status effects, etc.
            fatigue_percent = 75  # Placeholder - would come from game state
            fatigue_bar = self._create_progress_bar("FT", fatigue_percent, 20)
            lines.append(fatigue_bar)
        
        # Ensure we have the right number of lines
        while len(lines) < self.config.height:
            lines.append("")
        
        content = '\n'.join(lines[:self.config.height])
        
        return RenderResult(
            content=content,
            width=self.config.width,
            height=self.config.height,
            metadata={
                "hp_percent": hp_percent,
                "show_bars": self.config.show_bars,
                "color_gradients": self.config.color_gradients
            }
        )
    
    def get_optimal_size(self, context: RenderContext) -> Tuple[int, int]:
        """Get optimal size for vitals display."""
        return (self.config.width, self.config.height)
    
    def _create_progress_bar(self, label: str, percent: float, width: int) -> str:
        """
        Create a colored progress bar.
        
        Args:
            label: Bar label (e.g., "HP", "FT")
            percent: Percentage (0-100)
            width: Bar width in characters
            
        Returns:
            Formatted progress bar string
        """
        # Calculate filled width
        filled_width = int((percent / 100) * width)
        empty_width = width - filled_width
        
        # Choose color based on percentage
        if percent <= 20:
            color = self.colors["critical"]
        elif percent <= 40:
            color = self.colors["low"]
        elif percent <= 60:
            color = self.colors["medium"]
        elif percent <= 80:
            color = self.colors["high"]
        else:
            color = self.colors["full"]
        
        # Create bar characters
        if self.config.color_gradients:
            filled_char = "█"
            empty_char = "░"
        else:
            filled_char = "="
            empty_char = "-"
        
        # Build bar
        bar = f"{color}{filled_char * filled_width}{self.colors['neutral']}{empty_char * empty_width}{self.ANSI_RESET}"
        
        # Add label
        if self.config.compact_mode:
            return f"{label}: {bar}"
        else:
            return f"{label} {bar} {percent:3.0f}%"
    
    def set_config(self, config: VitalsConfig) -> None:
        """Update vitals configuration."""
        self.config = config
        logger.info(f"ANSIVitalsPass config updated: {config.width}x{config.height}")


# Export for use by other modules
__all__ = ["ANSIVitalsPass", "VitalsConfig"]
