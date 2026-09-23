"""
Adaptive TurtleCard - Universal Component for Cross-Platform Display
Implements SLS-based rendering that scales from Retro (40×60) to HD (200×300)
"""

from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from ...engines.viewport.logical_viewport import LogicalViewport
from ...ui.proportional_layout import ProportionalLayout, AnchorPoint, NormalizedRect


class DisplayMode(Enum):
    """Display modes for adaptive rendering"""
    RETRO = "retro"      # Compact 40×60 unit display
    HD = "hd"           # Detailed 200×300 unit display
    AUTO = "auto"       # Automatic based on viewport


@dataclass
class TurtleDisplayData:
    """Data structure for turtle display information"""
    turtle_id: str
    name: str
    genetics: Dict[str, Any]  # 17 traits from audit
    stats: Dict[str, Any]    # Speed, energy, etc.
    position: Tuple[float, float]  # Logical coordinates
    is_selected: bool = False
    is_retired: bool = False


class AdaptiveTurtleCard:
    """
    Universal turtle card component that adapts to any display resolution
    while maintaining proportional layout and information density.
    
    Critical: Uses SLS 1000×1000 logical coordinate system
    """
    
    def __init__(self, viewport: LogicalViewport, display_mode: DisplayMode = DisplayMode.AUTO):
        self.viewport = viewport
        self.display_mode = display_mode
        self.turtle_data: Optional[TurtleDisplayData] = None
        self.logical_rect: Optional[NormalizedRect] = None
        
        # Size constants in logical units (1000×1000 space)
        self.retro_size = (40, 60)    # 4% × 6% of logical space
        self.hd_size = (200, 300)     # 20% × 30% of logical space
        
        # Layout system for internal component positioning
        self.layout = ProportionalLayout((1000, 1000))  # Logical space
        
    def set_turtle_data(self, turtle_data: TurtleDisplayData) -> None:
        """Set turtle data for display"""
        self.turtle_data = turtle_data
        self._update_display_mode()
    
    def _update_display_mode(self) -> None:
        """Auto-select display mode based on viewport resolution"""
        if self.display_mode == DisplayMode.AUTO:
            if self.viewport.is_retro_mode():
                self.display_mode = DisplayMode.RETRO
            else:
                self.display_mode = DisplayMode.HD
    
    def get_logical_rect(self, position: Tuple[float, float], 
                        anchor: AnchorPoint = AnchorPoint.TOP_LEFT) -> NormalizedRect:
        """
        Get logical rectangle for the card based on display mode.
        
        Args:
            position: Logical position for card placement
            anchor: Anchor point for positioning
        
        Returns:
            NormalizedRect in logical coordinate space
        """
        # Select size based on display mode
        if self.display_mode == DisplayMode.RETRO:
            size = self.retro_size
        else:
            size = self.hd_size
        
        # Convert logical units to normalized coordinates (0.0-1.0)
        normalized_size = (size[0] / 1000.0, size[1] / 1000.0)
        normalized_position = (position[0] / 1000.0, position[1] / 1000.0)
        
        # Create proportional layout rect
        self.logical_rect = self.layout.get_relative_rect(
            anchor=anchor,
            normalized_size=normalized_size,
            normalized_position=normalized_position
        )
        
        return self.logical_rect
    
    def render(self) -> Dict[str, Any]:
        """
        Render turtle card based on current display mode.
        
        Returns:
            Render data dictionary for the rendering pipeline
        """
        if not self.turtle_data or not self.logical_rect:
            return {"type": "empty", "elements": []}
        
        if self.display_mode == DisplayMode.RETRO:
            return self._render_retro()
        else:
            return self._render_hd()
    
    def _render_retro(self) -> Dict[str, Any]:
        """Render compact retro version (40×60 logical units)"""
        physical_rect = self.logical_rect.to_physical(self.viewport.physical_size)
        
        render_data = {
            "type": "turtle_card_retro",
            "rect": physical_rect,
            "turtle_id": self.turtle_data.turtle_id,
            "elements": []
        }
        
        # Retro turtle sprite (character-based)
        turtle_sprite = {
            "type": "character_sprite",
            "char": self._get_turtle_char(),
            "position": self._get_sprite_position(physical_rect),
            "color": self._get_dithered_color(),
            "size": min(physical_rect[2], physical_rect[3]) // 4
        }
        render_data["elements"].append(turtle_sprite)
        
        # Compact name display
        if physical_rect[2] > 60:  # Only show name if space permits
            name_text = {
                "type": "text",
                "text": self.turtle_data.name[:8],  # Truncate for retro
                "position": (physical_rect[0], physical_rect[1] + physical_rect[3] - 10),
                "font_size": 8,
                "color": (255, 255, 255)
            }
            render_data["elements"].append(name_text)
        
        # Selection indicator
        if self.turtle_data.is_selected:
            selection = {
                "type": "border",
                "rect": physical_rect,
                "color": (255, 255, 0),  # Yellow for selection
                "thickness": 2
            }
            render_data["elements"].append(selection)
        
        return render_data
    
    def _render_hd(self) -> Dict[str, Any]:
        """Render detailed HD version (200×300 logical units)"""
        physical_rect = self.logical_rect.to_physical(self.viewport.physical_size)
        
        render_data = {
            "type": "turtle_card_hd",
            "rect": physical_rect,
            "turtle_id": self.turtle_data.turtle_id,
            "elements": []
        }
        
        # Background panel
        background = {
            "type": "panel",
            "rect": physical_rect,
            "color": (40, 40, 60),  # Dark blue panel
            "border_color": (100, 100, 150),
            "border_thickness": 2
        }
        render_data["elements"].append(background)
        
        # Large turtle sprite
        turtle_sprite = {
            "type": "turtle_sprite_hd",
            "genetics": self.turtle_data.genetics,
            "position": self._get_hd_sprite_position(physical_rect),
            "size": min(physical_rect[2], physical_rect[3]) // 2,
            "full_color": True
        }
        render_data["elements"].append(turtle_sprite)
        
        # Full name display
        name_text = {
            "type": "text",
            "text": self.turtle_data.name,
            "position": (physical_rect[0] + 10, physical_rect[1] + 10),
            "font_size": 16,
            "color": (255, 255, 255),
            "style": "bold"
        }
        render_data["elements"].append(name_text)
        
        # Stats display
        stats_y = physical_rect[1] + 40
        for stat_name, stat_value in self.turtle_data.stats.items():
            stat_text = {
                "type": "text",
                "text": f"{stat_name}: {stat_value}",
                "position": (physical_rect[0] + 10, stats_y),
                "font_size": 12,
                "color": (200, 200, 200)
            }
            render_data["elements"].append(stat_text)
            stats_y += 15
        
        # Genetic traits preview (top 5)
        traits_y = stats_y + 10
        trait_count = 0
        for trait_name, trait_value in self.turtle_data.genetics.items():
            if trait_count >= 5:  # Limit to 5 traits for space
                break
            
            trait_text = {
                "type": "text",
                "text": f"{trait_name}: {self._format_trait_value(trait_value)}",
                "position": (physical_rect[0] + 10, traits_y),
                "font_size": 10,
                "color": (150, 150, 150)
            }
            render_data["elements"].append(trait_text)
            traits_y += 12
            trait_count += 1
        
        # Selection indicator
        if self.turtle_data.is_selected:
            selection = {
                "type": "highlight",
                "rect": physical_rect,
                "color": (255, 215, 0),  # Gold for selection
                "alpha": 0.3
            }
            render_data["elements"].append(selection)
        
        # Retirement indicator
        if self.turtle_data.is_retired:
            retired_badge = {
                "type": "badge",
                "text": "RETIRED",
                "position": (physical_rect[0] + physical_rect[2] - 60, physical_rect[1] + 5),
                "size": (50, 20),
                "color": (128, 128, 128),
                "text_color": (255, 255, 255)
            }
            render_data["elements"].append(retired_badge)
        
        return render_data
    
    def _get_turtle_char(self) -> str:
        """Get character representation for retro sprite"""
        # Use genetics to determine turtle type
        limb_shape = self.turtle_data.genetics.get("limb_shape", "flippers")
        
        char_map = {
            "flippers": "~",
            "feet": "#",
            "fins": "»"
        }
        return char_map.get(limb_shape, "T")
    
    def _get_dithered_color(self) -> Tuple[int, int, int]:
        """Get dithered color for retro display"""
        base_color = self.turtle_data.genetics.get("shell_base_color", (34, 139, 34))
        
        # Dither to 2-bit color for retro
        levels = 4
        max_val = 255
        step = max_val / (levels - 1)
        
        r = int(round(base_color[0] / step) * step)
        g = int(round(base_color[1] / step) * step)
        b = int(round(base_color[2] / step) * step)
        
        return (r, g, b)
    
    def _get_sprite_position(self, rect: Tuple[int, int, int, int]) -> Tuple[int, int]:
        """Get sprite position for retro mode"""
        return (rect[0] + rect[2] // 2 - 4, rect[1] + rect[3] // 2 - 4)
    
    def _get_hd_sprite_position(self, rect: Tuple[int, int, int, int]) -> Tuple[int, int]:
        """Get sprite position for HD mode"""
        return (rect[0] + rect[2] // 2 - 32, rect[1] + 30)
    
    def _format_trait_value(self, value: Any) -> str:
        """Format trait value for display"""
        if isinstance(value, tuple) and len(value) == 3:
            # RGB color
            return f"RGB({value[0]},{value[1]},{value[2]})"
        elif isinstance(value, float):
            return f"{value:.2f}"
        else:
            return str(value)
    
    def handle_click(self, click_position: Tuple[int, int]) -> bool:
        """
        Handle click event on the card.
        
        Args:
            click_position: Physical click coordinates
        
        Returns:
            True if click was within card bounds
        """
        if not self.logical_rect:
            return False
        
        physical_rect = self.logical_rect.to_physical(self.viewport.physical_size)
        x, y = click_position
        rect_x, rect_y, rect_w, rect_h = physical_rect
        
        return (rect_x <= x <= rect_x + rect_w and 
                rect_y <= y <= rect_y + rect_h)
    
    def set_selection(self, is_selected: bool) -> None:
        """Set selection state"""
        if self.turtle_data:
            self.turtle_data.is_selected = is_selected
    
    def get_turtle_id(self) -> Optional[str]:
        """Get turtle ID"""
        return self.turtle_data.turtle_id if self.turtle_data else None
    
    def get_display_mode(self) -> DisplayMode:
        """Get current display mode"""
        return self.display_mode


class TurtleCardGrid:
    """
    Grid layout manager for multiple TurtleCards with automatic arrangement
    """
    
    def __init__(self, viewport: LogicalViewport, display_mode: DisplayMode = DisplayMode.AUTO):
        self.viewport = viewport
        self.display_mode = display_mode
        self.cards: list[AdaptiveTurtleCard] = []
        self.layout = ProportionalLayout((1000, 1000))
    
    def add_card(self, turtle_data: TurtleDisplayData, 
                 grid_position: Tuple[int, int]) -> AdaptiveTurtleCard:
        """
        Add a turtle card to the grid.
        
        Args:
            turtle_data: Turtle display data
            grid_position: Grid position (col, row)
        
        Returns:
            Created AdaptiveTurtleCard
        """
        card = AdaptiveTurtleCard(self.viewport, self.display_mode)
        card.set_turtle_data(turtle_data)
        
        # Calculate grid position
        logical_pos = self._calculate_grid_position(grid_position)
        card.get_logical_rect(logical_pos)
        
        self.cards.append(card)
        return card
    
    def _calculate_grid_position(self, grid_position: Tuple[int, int]) -> Tuple[float, float]:
        """Calculate logical position for grid slot"""
        col, row = grid_position
        
        # Grid spacing and margins in logical units
        margin = 50  # 5% of logical space
        spacing = 20  # 2% of logical space
        
        # Card size depends on display mode
        if self.display_mode == DisplayMode.RETRO:
            card_width, card_height = 40, 60
        else:
            card_width, card_height = 200, 300
        
        x = margin + col * (card_width + spacing)
        y = margin + row * (card_height + spacing)
        
        return (x, y)
    
    def render_all(self) -> list[Dict[str, Any]]:
        """Render all cards in the grid"""
        return [card.render() for card in self.cards]
    
    def handle_click(self, click_position: Tuple[int, int]) -> Optional[AdaptiveTurtleCard]:
        """
        Handle click event across all cards.
        
        Args:
            click_position: Physical click coordinates
        
        Returns:
            Clicked card or None
        """
        for card in self.cards:
            if card.handle_click(click_position):
                return card
        return None
    
    def clear_all(self) -> None:
        """Clear all cards"""
        self.cards.clear()
    
    def get_selected_cards(self) -> list[AdaptiveTurtleCard]:
        """Get all selected cards"""
        return [card for card in self.cards if card.turtle_data and card.turtle_data.is_selected]
