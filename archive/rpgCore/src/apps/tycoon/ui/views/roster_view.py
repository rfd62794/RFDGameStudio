"""
Roster View - Universal Roster Interface using PyGame Shim
Copy-paste legacy sorting and filtering logic with DGT integration
"""

from typing import Dict, Any, List, Optional, Tuple
import logging

# Import DGT core systems
from dgt_core.engines.viewport.logical_viewport import LogicalViewport
from dgt_core.compat.pygame_shim import LegacyUIContext, create_legacy_context
from dgt_core.systems.day_cycle_manager import PersistentStateManager
from dgt_core.registry.dgt_registry import DGTRegistry

# Import extracted logic
from legacy_logic_extraction.roster_logic import RosterLogicExtractor, RosterUIConstants, ViewMode, SortMode


class RosterView:
    """
    Universal roster interface using PyGame compatibility shim.
    Copy-paste legacy logic while leveraging DGT's universal scaling.
    """
    
    def __init__(self, viewport: LogicalViewport, registry: DGTRegistry, 
                 state_manager: PersistentStateManager):
        self.viewport = viewport
        self.registry = registry
        self.state_manager = state_manager
        self.logger = logging.getLogger(__name__)
        
        # Create legacy context for pygame compatibility
        self.legacy_context = create_legacy_context(viewport.physical_size)
        
        # Extracted logic processor
        self.logic = RosterLogicExtractor()
        
        # UI state
        self.turtle_cards = []
        self.current_view_mode = ViewMode.ACTIVE
        self.current_sort_mode = SortMode.BY_NAME
        self.selected_turtle_index = None
        self.hovered_turtle_index = None
        
        # Grid layout state
        self.scroll_offset = 0
        self.max_scroll = 0
        self.visible_card_count = 0
        
        # Initialize roster data
        self._initialize_roster()
        
        self.logger.info("RosterView initialized with PyGame shim")
    
    def _initialize_roster(self) -> None:
        """Initialize roster with available turtles"""
        try:
            # Get all turtles from registry
            all_turtles = self.registry.get_all_turtles()
            
            # Process turtle data using extracted logic
            processed_cards = self.logic.process_turtle_data(all_turtles)
            
            # Apply view mode filter and sorting
            self._update_turtle_cards(processed_cards)
            
            self.logger.info(f"Initialized roster with {len(self.turtle_cards)} turtles")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize roster: {e}")
    
    def _update_turtle_cards(self, all_cards: List) -> None:
        """Update turtle cards with filtering and sorting"""
        # Apply view mode filter
        filtered_cards = self.logic.apply_view_mode_filter(all_cards, self.current_view_mode)
        
        # Apply sorting
        sorted_cards = self.logic.apply_sorting(filtered_cards, self.current_sort_mode)
        
        # Update internal state
        self.turtle_cards = sorted_cards
        
        # Recalculate layout
        self._update_grid_layout()
    
    def _update_grid_layout(self) -> None:
        """Recalculate grid layout and scroll limits"""
        # Container rect using legacy constants
        constants = RosterUIConstants()
        container_rect = (
            constants.GRID_MARGIN,
            constants.HEADER_HEIGHT + constants.NAVIGATION_HEIGHT + constants.GRID_MARGIN,
            constants.WINDOW_WIDTH - 2 * constants.GRID_MARGIN,
            constants.WINDOW_HEIGHT - constants.HEADER_HEIGHT - constants.NAVIGATION_HEIGHT - 2 * constants.GRID_MARGIN
        )
        
        # Calculate card positions
        card_rects, max_scroll = self.logic.calculate_grid_layout(container_rect)
        
        # Update card rectangles
        for i, rect in enumerate(card_rects):
            if i < len(self.turtle_cards):
                # Create SovereignRect for each card
                sovereign_rect = self.legacy_context.Rect(rect[0], rect[1], rect[2], rect[3])
                self.turtle_cards[i].card_rect = sovereign_rect
        
        # Update scroll limits
        self.max_scroll = max_scroll
        
        # Adjust current scroll if needed
        if self.scroll_offset > self.max_scroll:
            self.scroll_offset = self.max_scroll
    
    def switch_view_mode(self, new_mode: ViewMode) -> None:
        """Switch between active, retired, and select_racer views"""
        if self.current_view_mode != new_mode:
            self.current_view_mode = new_mode
            self.logic.switch_view_mode(new_mode)
            
            # Re-filter and sort
            all_cards = self.logic.process_turtle_data(self.registry.get_all_turtles())
            self._update_turtle_cards(all_cards)
            
            self.logger.info(f"Switched to {new_mode.value} view")
    
    def change_sort_mode(self, new_sort: SortMode) -> None:
        """Change sorting mode"""
        if self.current_sort_mode != new_sort:
            self.current_sort_mode = new_sort
            
            # Re-sort cards
            all_cards = self.logic.process_turtle_data(self.registry.get_all_turtles())
            self._update_turtle_cards(all_cards)
            
            self.logger.info(f"Changed sorting to {new_sort.value}")
    
    def handle_card_click(self, mouse_pos: Tuple[int, int]) -> Optional[str]:
        """
        Handle card click using extracted logic.
        
        Args:
            mouse_pos: Physical mouse coordinates
        
        Returns:
            Action string or None
        """
        # Convert to logical coordinates for collision detection
        logical_pos = self.viewport.to_logical(mouse_pos)
        
        # Use extracted click detection logic
        clicked_index = self.logic.handle_card_click(logical_pos)
        
        if clicked_index is not None and 0 <= clicked_index < len(self.turtle_cards):
            # Update selection state
            self.logic.update_selection_state(clicked_index, True)
            self.selected_turtle_index = clicked_index
            
            # Get turtle data
            turtle_data = self.turtle_cards[clicked_index]
            turtle_id = turtle_data.turtle_id
            
            self.logger.info(f"Selected turtle {turtle_id} at index {clicked_index}")
            
            # Return action based on current view mode
            if self.current_view_mode == ViewMode.SELECT_RACER:
                return f"select_racer_{turtle_id}"
            else:
                return f"view_details_{turtle_id}"
        
        return None
    
    def handle_card_hover(self, mouse_pos: Tuple[int, int]) -> None:
        """Handle card hover for visual feedback"""
        # Convert to logical coordinates
        logical_pos = self.viewport.to_logical(mouse_pos)
        
        # Use extracted hover detection logic
        hovered_index = self.logic.handle_card_hover(logical_pos)
        
        if hovered_index != self.hovered_turtle_index:
            # Clear previous hover
            if self.hovered_turtle_index is not None:
                if 0 <= self.hovered_turtle_index < len(self.turtle_cards):
                    self.turtle_cards[self.hovered_turtle_index].is_hovered = False
            
            # Set new hover
            if hovered_index is not None and 0 <= hovered_index < len(self.turtle_cards):
                self.turtle_cards[hovered_index].is_hovered = True
                self.hovered_turtle_index = hovered_index
            else:
                self.hovered_turtle_index = None
    
    def get_selected_turtle(self) -> Optional[Dict[str, Any]]:
        """Get currently selected turtle data"""
        if self.selected_turtle_index is not None and 0 <= self.selected_turtle_index < len(self.turtle_cards):
            return self.logic.get_card_render_data(self.selected_turtle_index)
        return None
    
    def get_turtle_count(self) -> int:
        """Get number of turtles in current view"""
        return len(self.turtle_cards)
    
    def get_view_summary(self) -> Dict[str, Any]:
        """Get summary of current view state"""
        return {
            'view_mode': self.current_view_mode.value,
            'sort_mode': self.current_sort_mode.value,
            'turtle_count': len(self.turtle_cards),
            'selected_index': self.selected_turtle_index,
            'has_selection': self.selected_turtle_index is not None
        }
    
    def render(self) -> Dict[str, Any]:
        """
        Render the roster view using legacy drawing commands.
        
        Returns:
            Render data for the rendering pipeline
        """
        render_data = {
            'type': 'roster_view',
            'elements': []
        }
        
        # Clear drawing proxy
        self.legacy_context.draw.clear()
        
        # Draw background
        bg_rect = self.legacy_context.Rect(0, 0, 800, 600)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['ROSTER_BG'], bg_rect)
        
        # Draw header
        self._render_header()
        
        # Draw navigation controls
        self._render_navigation()
        
        # Draw turtle grid
        self._render_turtle_grid()
        
        # Draw scrollbar if needed
        if self.max_scroll > 0:
            self._render_scrollbar()
        
        # Get render packets
        frame_data = self.legacy_context.get_frame_data()
        render_data['render_packets'] = frame_data['render_packets']
        render_data['viewport_size'] = frame_data['viewport_size']
        
        return render_data
    
    def _render_header(self) -> None:
        """Render header section"""
        constants = RosterUIConstants()
        
        # Header background
        header_rect = self.legacy_context.Rect(0, 0, 800, constants.HEADER_HEIGHT)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], header_rect)
        
        # Title
        title_text = f"TURTLE ROSTER - {self.current_view_mode.value.upper()}"
        self.legacy_context.draw.text(None, title_text, (255, 255, 255), (10, 15), 16)
        
        # Turtle count
        count_text = f"Turtles: {len(self.turtle_cards)}"
        self.legacy_context.draw.text(None, count_text, (200, 200, 200), (600, 15), 12)
        
        # Sort mode indicator
        sort_text = f"Sort: {self.current_sort_mode.value}"
        self.legacy_context.draw.text(None, sort_text, (200, 200, 200), (400, 15), 12)
    
    def _render_navigation(self) -> None:
        """Render navigation controls"""
        constants = RosterUIConstants()
        
        # Navigation background
        nav_rect = self.legacy_context.Rect(0, constants.HEADER_HEIGHT, 800, constants.NAVIGATION_HEIGHT)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], nav_rect)
        
        # View toggle buttons
        view_modes = [ViewMode.ACTIVE, ViewMode.RETIRED]
        button_width = 100
        button_spacing = 10
        
        for i, mode in enumerate(view_modes):
            button_x = 20 + i * (button_width + button_spacing)
            button_y = constants.HEADER_HEIGHT + 5
            button_rect = self.legacy_context.Rect(button_x, button_y, button_width, 20)
            
            # Highlight current mode
            if mode == self.current_view_mode:
                self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_SELECTED_BORDER'], button_rect)
            else:
                self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BUTTON_NORMAL_COLOR'], button_rect)
            
            # Button text
            mode_text = mode.value.upper()
            self.legacy_context.draw.text(None, mode_text, (255, 255, 255), (button_x + 20, button_y + 2), 10)
        
        # Sort buttons
        sort_modes = [SortMode.BY_NAME, SortMode.BY_SPEED, SortMode.BY_VALUE]
        sort_start_x = 400
        
        for i, mode in enumerate(sort_modes):
            button_x = sort_start_x + i * (button_width + button_spacing)
            button_y = constants.HEADER_HEIGHT + 5
            button_rect = self.legacy_context.Rect(button_x, button_y, button_width, 20)
            
            # Highlight current sort
            if mode == self.current_sort_mode:
                self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_SELECTED_BORDER'], button_rect)
            else:
                self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BUTTON_NORMAL_COLOR'], button_rect)
            
            # Button text
            sort_text = mode.value.replace('_', ' ').title()
            self.legacy_context.draw.text(None, sort_text, (255, 255, 255), (button_x + 10, button_y + 2), 10)
    
    def _render_turtle_grid(self) -> None:
        """Render turtle cards in grid layout"""
        constants = RosterUIConstants()
        
        # Grid container
        grid_rect = self.legacy_context.Rect(
            constants.GRID_MARGIN,
            constants.HEADER_HEIGHT + constants.NAVIGATION_HEIGHT + constants.GRID_MARGIN,
            800 - 2 * constants.GRID_MARGIN,
            600 - constants.HEADER_HEIGHT - constants.NAVIGATION_HEIGHT - 2 * constants.GRID_MARGIN
        )
        
        # Draw grid background
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], grid_rect)
        
        # Draw visible turtle cards
        for i, turtle_card in enumerate(self.turtle_cards):
            if turtle_card.card_rect:
                self._render_turtle_card(turtle_card, i)
    
    def _render_turtle_card(self, turtle_card, index: int) -> None:
        """Render a single turtle card"""
        if not turtle_card.card_rect:
            return
        
        rect = turtle_card.card_rect
        
        # Determine border color based on state
        if turtle_card.is_selected:
            border_color = self.legacy_context.theme_colors['CARD_SELECTED_BORDER']
        elif turtle_card.is_hovered:
            border_color = self.legacy_context.theme_colors['CARD_HOVER_BORDER']
        else:
            border_color = self.legacy_context.theme_colors['CARD_BORDER_COLOR']
        
        # Draw card background
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], rect)
        
        # Draw border
        self.legacy_context.draw.rect(None, border_color, rect, 2)
        
        # Draw turtle placeholder
        center_x = rect.left + rect.width // 2
        center_y = rect.top + 30
        
        # Draw turtle circle with genetics color
        turtle_color = turtle_card.genetics.get('shell_base_color', (34, 139, 34))
        self.legacy_context.draw.circle(None, turtle_color, (center_x, center_y), 20)
        
        # Draw turtle name
        name_y = rect.top + 60
        self.legacy_context.draw.text(None, turtle_card.name, (255, 255, 255), (rect.left + 5, name_y), 10)
        
        # Draw stats
        stats_y = name_y + 15
        speed_text = f"Speed: {turtle_card.stats.get('speed', 0):.1f}"
        self.legacy_context.draw.text(None, speed_text, (200, 200, 200), (rect.left + 5, stats_y), 8)
        
        value_text = f"Value: ${turtle_card.value}"
        self.legacy_context.draw.text(None, value_text, (255, 215, 0), (rect.left + 5, stats_y + 10), 8)
        
        # Draw retired overlay if needed
        if turtle_card.is_retired:
            overlay_rect = self.legacy_context.Rect(rect.left, rect.top, rect.width, rect.height)
            retired_color = (128, 128, 128, 128)  # Semi-transparent gray
            self.legacy_context.draw.rect(None, retired_color, overlay_rect)
            
            # Draw "RETIRED" text
            self.legacy_context.draw.text(None, "RETIRED", (255, 255, 255), (center_x - 25, center_y), 10)
    
    def _render_scrollbar(self) -> None:
        """Render scrollbar if content exceeds visible area"""
        constants = RosterUIConstants()
        
        # Container rect for scrollbar calculation
        container_rect = (
            constants.GRID_MARGIN,
            constants.HEADER_HEIGHT + constants.NAVIGATION_HEIGHT + constants.GRID_MARGIN,
            800 - 2 * constants.GRID_MARGIN,
            600 - constants.HEADER_HEIGHT - constants.NAVIGATION_HEIGHT - 2 * constants.GRID_MARGIN
        )
        
        # Get scrollbar data from extracted logic
        scrollbar_data = self.logic.get_scrollbar_render_data(container_rect)
        
        if scrollbar_data:
            # Draw scrollbar track
            track_rect = self.legacy_context.Rect(
                container_rect[0] + container_rect[2] - constants.SCROLLBAR_WIDTH - constants.SCROLLBAR_MARGIN,
                container_rect[1],
                constants.SCROLLBAR_WIDTH,
                container_rect[3]
            )
            self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BUTTON_NORMAL_COLOR'], track_rect)
            
            # Draw scrollbar thumb
            thumb_rect = scrollbar_data['rect']
            sovereign_thumb = self.legacy_context.Rect(thumb_rect[0], thumb_rect[1], thumb_rect[2], thumb_rect[3])
            self.legacy_context.draw.rect(None, scrollbar_data['thumb_color'], sovereign_thumb)
    
    def get_state(self) -> Dict[str, Any]:
        """Get current roster state"""
        return {
            'view_mode': self.current_view_mode.value,
            'sort_mode': self.current_sort_mode.value,
            'turtle_count': len(self.turtle_cards),
            'selected_turtle_index': self.selected_turtle_index,
            'hovered_turtle_index': self.hovered_turtle_index,
            'scroll_offset': self.scroll_offset,
            'max_scroll': self.max_scroll
        }
    
    def refresh_data(self) -> None:
        """Refresh roster data from registry"""
        self._initialize_roster()
