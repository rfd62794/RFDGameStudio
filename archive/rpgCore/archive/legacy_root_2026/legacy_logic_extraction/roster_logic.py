"""
Roster Panel Logic Extraction - Line-by-Line Analysis
Extracted from C:\Github\TurboShells\src\ui\panels\roster_panel.py
"""

from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum


class ViewMode(Enum):
    """View modes for roster display"""
    ACTIVE = "active"
    RETIRED = "retired"
    SELECT_RACER = "select_racer"


class SortMode(Enum):
    """Sorting modes for turtle roster"""
    BY_NAME = "name"
    BY_SPEED = "speed"
    BY_STAMINA = "stamina"
    BY_VALUE = "value"
    BY_WINS = "wins"


@dataclass
class RosterUIConstants:
    """Visual constants extracted from roster panel"""
    # Layout constants (pixels)
    WINDOW_WIDTH = 800
    WINDOW_HEIGHT = 600
    WINDOW_POSITION_X = 112
    WINDOW_POSITION_Y = 84
    
    HEADER_HEIGHT = 60
    NAVIGATION_HEIGHT = 30
    VIEW_TOGGLE_WIDTH = 210
    VIEW_TOGGLE_HEIGHT = 30
    VIEW_TOGGLE_OFFSET_X = 20
    VIEW_TOGGLE_OFFSET_Y = 70
    
    # Grid layout constants
    GRID_MARGIN = 20
    GRID_CELL_WIDTH = 150
    GRID_CELL_HEIGHT = 200
    GRID_CELL_SPACING = 10
    GRID_CELL_PADDING = 5
    
    # Scrollbar constants
    SCROLLBAR_WIDTH = 20
    SCROLLBAR_MARGIN = 5
    SCROLLBAR_MIN_HEIGHT = 50
    
    # Turtle card constants
    TURTLE_IMAGE_SIZE = 80
    TURTLE_IMAGE_MARGIN = 10
    CARD_HEADER_HEIGHT = 30
    CARD_STATS_HEIGHT = 60
    CARD_BUTTON_HEIGHT = 30
    
    # Visual constants
    CARD_BG_COLOR = (50, 50, 70)
    CARD_BORDER_COLOR = (100, 100, 130)
    CARD_SELECTED_BORDER = (255, 255, 0)  # Yellow
    CARD_HOVER_BORDER = (150, 150, 200)  # Light blue
    RETIRED_OVERLAY_COLOR = (128, 128, 128, 128)  # Gray with alpha
    
    # Button colors
    BUTTON_NORMAL_COLOR = (100, 100, 150)
    BUTTON_HOVER_COLOR = (150, 150, 200)
    BUTTON_PRESSED_COLOR = (80, 80, 120)
    BUTTON_TEXT_COLOR = (255, 255, 255)
    
    # Text colors
    HEADER_TEXT_COLOR = (255, 255, 255)
    STATS_TEXT_COLOR = (200, 200, 200)
    NAME_TEXT_COLOR = (255, 255, 255)
    VALUE_TEXT_COLOR = (255, 215, 0)  # Gold


@dataclass
class TurtleCardData:
    """Data structure for turtle card display"""
    turtle_id: str
    name: str
    stats: Dict[str, float]
    genetics: Dict[str, Any]
    is_retired: bool
    is_selected: bool = False
    is_hovered: bool = False
    card_rect: Optional[Tuple[int, int, int, int]] = None
    value: int = 0
    wins: int = 0


class RosterLogicExtractor:
    """
    Extracted roster logic from legacy SRP component implementation
    Preserves exact behavior while enabling DGT compatibility
    """
    
    def __init__(self):
        self.constants = RosterUIConstants()
        self.current_view_mode = ViewMode.ACTIVE
        self.current_sort_mode = SortMode.BY_NAME
        self.turtle_cards: List[TurtleCardData] = []
        self.selected_turtle_index: Optional[int] = None
        self.hovered_turtle_index: Optional[int] = None
        
        # Grid state
        self.scroll_offset = 0
        self.max_scroll = 0
        self.visible_card_count = 0
        
    # === EXTRACTED LOGIC: Sorting Algorithms ===
    
    def sort_turtles_by_name(self, turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Name sorting logic from roster_panel.py
        
        Sorts turtles alphabetically by name (case-insensitive)
        """
        return sorted(turtles, key=lambda turtle: turtle.name.lower())
    
    def sort_turtles_by_speed(self, turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Speed sorting logic
        
        Sorts by speed stat (highest first)
        """
        return sorted(turtles, key=lambda turtle: turtle.stats.get('speed', 0), reverse=True)
    
    def sort_turtles_by_stamina(self, turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Stamina sorting logic
        
        Sorts by stamina stat (highest first)
        """
        return sorted(turtles, key=lambda turtle: turtle.stats.get('stamina', 0), reverse=True)
    
    def sort_turtles_by_value(self, turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Value sorting logic
        
        Sorts by monetary value (highest first)
        """
        return sorted(turtles, key=lambda turtle: turtle.value, reverse=True)
    
    def sort_turtles_by_wins(self, turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Wins sorting logic
        
        Sorts by race wins (highest first)
        """
        return sorted(turtles, key=lambda turtle: turtle.wins, reverse=True)
    
    def apply_sorting(self, turtles: List[TurtleCardData], sort_mode: SortMode) -> List[TurtleCardData]:
        """
        EXTRACTED: Unified sorting interface
        
        Routes to appropriate sorting algorithm based on mode
        """
        if sort_mode == SortMode.BY_NAME:
            return self.sort_turtles_by_name(turtles)
        elif sort_mode == SortMode.BY_SPEED:
            return self.sort_turtles_by_speed(turtles)
        elif sort_mode == SortMode.BY_STAMINA:
            return self.sort_turtles_by_stamina(turtles)
        elif sort_mode == SortMode.BY_VALUE:
            return self.sort_turtles_by_value(turtles)
        elif sort_mode == SortMode.BY_WINS:
            return self.sort_turtles_by_wins(turtles)
        else:
            return turtles  # Default to unsorted
    
    # === EXTRACTED LOGIC: Filtering ===
    
    def filter_active_turtles(self, all_turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Active turtle filtering logic
        
        Returns only non-retired turtles
        """
        return [turtle for turtle in all_turtles if not turtle.is_retired]
    
    def filter_retired_turtles(self, all_turtles: List[TurtleCardData]) -> List[TurtleCardData]:
        """
        EXTRACTED: Retired turtle filtering logic
        
        Returns only retired turtles
        """
        return [turtle for turtle in all_turtles if turtle.is_retired]
    
    def filter_by_search_term(self, turtles: List[TurtleCardData], search_term: str) -> List[TurtleCardData]:
        """
        EXTRACTED: Search filtering logic
        
        Filters turtles by name containing search term (case-insensitive)
        """
        if not search_term:
            return turtles
        
        search_lower = search_term.lower()
        return [turtle for turtle in turtles if search_lower in turtle.name.lower()]
    
    def apply_view_mode_filter(self, all_turtles: List[TurtleCardData], view_mode: ViewMode) -> List[TurtleCardData]:
        """
        EXTRACTED: View mode filtering logic
        
        Applies appropriate filter based on current view mode
        """
        if view_mode == ViewMode.ACTIVE:
            return self.filter_active_turtles(all_turtles)
        elif view_mode == ViewMode.RETIRED:
            return self.filter_retired_turtles(all_turtles)
        elif view_mode == ViewMode.SELECT_RACER:
            # For race selection, only show active turtles
            return self.filter_active_turtles(all_turtles)
        else:
            return all_turtles
    
    # === EXTRACTED LOGIC: Grid Layout and Positioning ===
    
    def calculate_grid_layout(self, container_rect: Tuple[int, int, int, int]) -> Tuple[List[Tuple[int, int, int, int]], int]:
        """
        EXTRACTED: Grid layout calculation from roster_panel.py
        
        Calculates card positions in scrollable grid layout
        Returns list of card rectangles and maximum scroll offset
        """
        container_x, container_y, container_width, container_height = container_rect
        
        # Calculate grid dimensions
        available_width = container_width - (2 * self.constants.GRID_MARGIN)
        available_height = container_height - (2 * self.constants.GRID_MARGIN)
        
        # Account for scrollbar if needed
        scrollbar_space = self.constants.SCROLLBAR_WIDTH + self.constants.SCROLLBAR_MARGIN
        
        # Calculate columns and rows
        cell_width = self.constants.GRID_CELL_WIDTH
        cell_height = self.constants.GRID_CELL_HEIGHT
        cell_spacing = self.constants.GRID_CELL_SPACING
        
        cols = (available_width - scrollbar_space) // (cell_width + cell_spacing)
        if cols < 1:
            cols = 1
        
        # Calculate total cards that can fit
        cards_per_page = (available_height // (cell_height + cell_spacing)) * cols
        if cards_per_page < 1:
            cards_per_page = 1
        
        # Generate card positions
        card_rects = []
        for i, turtle in enumerate(self.turtle_cards):
            row = i // cols
            col = i % cols
            
            card_x = container_x + self.constants.GRID_MARGIN + col * (cell_width + cell_spacing)
            card_y = container_y + self.constants.GRID_MARGIN + row * (cell_height + cell_spacing)
            
            card_rects.append((card_x, card_y, cell_width, cell_height))
        
        # Calculate scroll limits
        total_rows = (len(self.turtle_cards) + cols - 1) // cols
        max_scroll_offset = max(0, (total_rows * (cell_height + cell_spacing)) - available_height)
        
        return card_rects, max_scroll_offset
    
    def calculate_scrollbar_position(self, container_rect: Tuple[int, int, int, int], 
                                   content_height: int, scroll_offset: int) -> Tuple[int, int, int, int]:
        """
        EXTRACTED: Scrollbar positioning logic
        
        Calculates scrollbar thumb position and size
        """
        container_x, container_y, container_width, container_height = container_rect
        
        # Scrollbar position (right side)
        scrollbar_x = container_x + container_width - self.constants.SCROLLBAR_MARGIN - self.constants.SCROLLBAR_WIDTH
        scrollbar_y = container_y + self.constants.GRID_MARGIN
        
        # Scrollbar height
        visible_ratio = container_height / max(content_height, container_height)
        thumb_height = max(self.constants.SCROLLBAR_MIN_HEIGHT, int(container_height * visible_ratio))
        
        # Thumb position
        if content_height > container_height:
            scroll_ratio = scroll_offset / (content_height - container_height)
            thumb_y = scrollbar_y + int((container_height - thumb_height) * scroll_ratio)
        else:
            thumb_y = scrollbar_y
        
        return (scrollbar_x, thumb_y, self.constants.SCROLLBAR_WIDTH, thumb_height)
    
    # === EXTRACTED LOGIC: Selection and Hover States ===
    
    def handle_card_click(self, mouse_pos: Tuple[int, int], card_rects: List[Tuple[int, int, int, int]]) -> Optional[int]:
        """
        EXTRACTED: Card click detection logic
        
        Returns index of clicked card or None
        """
        mouse_x, mouse_y = mouse_pos
        
        for i, rect in enumerate(card_rects):
            rect_x, rect_y, rect_w, rect_h = rect
            if (rect_x <= mouse_x <= rect_x + rect_w and
                rect_y <= mouse_y <= rect_y + rect_h):
                return i
        
        return None
    
    def handle_card_hover(self, mouse_pos: Tuple[int, int], card_rects: List[Tuple[int, int, int, int]]) -> Optional[int]:
        """
        EXTRACTED: Card hover detection logic
        
        Returns index of hovered card or None
        """
        return self.handle_card_click(mouse_pos, card_rects)  # Same logic for hover
    
    def update_selection_state(self, card_index: int, is_selected: bool) -> None:
        """
        EXTRACTED: Selection state update logic
        
        Updates card selection and manages single-selection behavior
        """
        if 0 <= card_index < len(self.turtle_cards):
            if is_selected:
                # Clear previous selection (single selection mode)
                if self.selected_turtle_index is not None:
                    self.turtle_cards[self.selected_turtle_index].is_selected = False
                
                # Set new selection
                self.turtle_cards[card_index].is_selected = True
                self.selected_turtle_index = card_index
            else:
                # Clear selection
                if self.selected_turtle_index == card_index:
                    self.turtle_cards[card_index].is_selected = False
                    self.selected_turtle_index = None
    
    def update_hover_state(self, card_index: Optional[int]) -> None:
        """
        EXTRACTED: Hover state update logic
        
        Updates card hover states
        """
        # Clear previous hover
        if self.hovered_turtle_index is not None:
            if 0 <= self.hovered_turtle_index < len(self.turtle_cards):
                self.turtle_cards[self.hovered_turtle_index].is_hovered = False
        
        # Set new hover
        if card_index is not None and 0 <= card_index < len(self.turtle_cards):
            self.turtle_cards[card_index].is_hovered = True
            self.hovered_turtle_index = card_index
        else:
            self.hovered_turtle_index = None
    
    # === EXTRACTED LOGIC: View Mode Management ===
    
    def switch_view_mode(self, new_mode: ViewMode) -> None:
        """
        EXTRACTED: View mode switching logic
        
        Handles transitions between active, retired, and select_racer modes
        """
        if self.current_view_mode != new_mode:
            self.current_view_mode = new_mode
            
            # Reset selection when switching views
            if self.selected_turtle_index is not None:
                self.turtle_cards[self.selected_turtle_index].is_selected = False
                self.selected_turtle_index = None
            
            # Reset scroll to top
            self.scroll_offset = 0
    
    def toggle_active_retired_view(self) -> ViewMode:
        """
        EXTRACTED: Active/Retired toggle logic
        
        Toggles between ACTIVE and RETIRED modes
        """
        if self.current_view_mode == ViewMode.ACTIVE:
            new_mode = ViewMode.RETIRED
        else:
            new_mode = ViewMode.ACTIVE
        
        self.switch_view_mode(new_mode)
        return new_mode
    
    # === EXTRACTED LOGIC: Data Processing ===
    
    def process_turtle_data(self, raw_turtles: List[Dict[str, Any]]) -> List[TurtleCardData]:
        """
        EXTRACTED: Turtle data processing logic
        
        Converts raw turtle data to TurtleCardData format
        """
        processed_cards = []
        
        for turtle_data in raw_turtles:
            card = TurtleCardData(
                turtle_id=turtle_data.get('id', ''),
                name=turtle_data.get('name', 'Unknown'),
                stats=turtle_data.get('stats', {}),
                genetics=turtle_data.get('genetics', {}),
                is_retired=turtle_data.get('is_retired', False),
                value=turtle_data.get('value', 0),
                wins=turtle_data.get('wins', 0)
            )
            processed_cards.append(card)
        
        return processed_cards
    
    def update_roster_data(self, raw_turtles: List[Dict[str, Any]]) -> None:
        """
        EXTRACTED: Roster data update logic
        
        Processes and filters turtle data based on current view mode
        """
        # Process raw data
        all_cards = self.process_turtle_data(raw_turtles)
        
        # Apply view mode filter
        filtered_cards = self.apply_view_mode_filter(all_cards, self.current_view_mode)
        
        # Apply sorting
        sorted_cards = self.apply_sorting(filtered_cards, self.current_sort_mode)
        
        # Update internal state
        self.turtle_cards = sorted_cards
        
        # Recalculate layout
        self._update_grid_layout()
    
    def _update_grid_layout(self) -> None:
        """
        EXTRACTED: Grid layout update logic
        
        Recalculates card positions and scroll limits
        """
        # This would be called when data changes
        # Container rect would come from the UI system
        container_rect = (20, 100, 760, 480)  # Example container
        card_rects, max_scroll = self.calculate_grid_layout(container_rect)
        
        # Update card rectangles
        for i, rect in enumerate(card_rects):
            if i < len(self.turtle_cards):
                self.turtle_cards[i].card_rect = rect
        
        # Update scroll limits
        self.max_scroll = max_scroll
        
        # Adjust current scroll if needed
        if self.scroll_offset > self.max_scroll:
            self.scroll_offset = self.max_scroll
    
    # === EXTRACTED LOGIC: Render Data Preparation ===
    
    def get_card_render_data(self, card_index: int) -> Optional[Dict[str, Any]]:
        """
        EXTRACTED: Card render data preparation
        
        Returns all data needed to render a single turtle card
        """
        if card_index < 0 or card_index >= len(self.turtle_cards):
            return None
        
        card = self.turtle_cards[card_index]
        
        # Determine border color based on state
        if card.is_selected:
            border_color = self.constants.CARD_SELECTED_BORDER
        elif card.is_hovered:
            border_color = self.constants.CARD_HOVER_BORDER
        else:
            border_color = self.constants.CARD_BORDER_COLOR
        
        return {
            'turtle_id': card.turtle_id,
            'name': card.name,
            'stats': card.stats,
            'genetics': card.genetics,
            'rect': card.card_rect,
            'is_retired': card.is_retired,
            'is_selected': card.is_selected,
            'is_hovered': card.is_hovered,
            'value': card.value,
            'wins': card.wins,
            'border_color': border_color,
            'bg_color': self.constants.CARD_BG_COLOR,
            'retired_overlay': self.constants.RETIRED_OVERLAY_COLOR if card.is_retired else None,
            'image_size': self.constants.TURTLE_IMAGE_SIZE,
            'text_colors': {
                'name': self.constants.NAME_TEXT_COLOR,
                'stats': self.constants.STATS_TEXT_COLOR,
                'value': self.constants.VALUE_TEXT_COLOR,
            }
        }
    
    def get_scrollbar_render_data(self, container_rect: Tuple[int, int, int, int]) -> Optional[Dict[str, Any]]:
        """
        EXTRACTED: Scrollbar render data preparation
        
        Returns scrollbar positioning and styling data
        """
        if self.max_scroll <= 0:
            return None  # No scrollbar needed
        
        # Calculate content height
        total_rows = (len(self.turtle_cards) + 2) // 2  # Assuming 2 columns
        content_height = total_rows * (self.constants.GRID_CELL_HEIGHT + self.constants.GRID_CELL_SPACING)
        
        scrollbar_rect = self.calculate_scrollbar_position(container_rect, content_height, self.scroll_offset)
        
        return {
            'rect': scrollbar_rect,
            'bg_color': self.constants.BUTTON_NORMAL_COLOR,
            'thumb_color': self.constants.BUTTON_HOVER_COLOR,
            'scroll_offset': self.scroll_offset,
            'max_scroll': self.max_scroll,
        }


# === EXTRACTED EVENT HANDLING LOGIC ===

def extract_roster_event_logic(event_type: str, event_data: Dict[str, Any], 
                             current_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    EXTRACTED: Roster event handling logic
    
    Handles various roster-related events
    """
    result = {
        'action': None,
        'success': False,
        'message': None,
        'state_changes': {}
    }
    
    if event_type == 'view_toggle':
        # View toggle event
        result['action'] = 'toggle_view'
        result['success'] = True
        
    elif event_type == 'sort_change':
        # Sort mode change event
        new_sort_mode = event_data.get('sort_mode', 'name')
        result['action'] = 'sort'
        result['sort_mode'] = new_sort_mode
        result['success'] = True
        
    elif event_type == 'turtle_select':
        # Turtle selection event
        turtle_index = event_data.get('turtle_index', -1)
        result['action'] = 'select_turtle'
        result['turtle_index'] = turtle_index
        result['success'] = True
        
    elif event_type == 'turtle_action':
        # Turtle action event (breed, race, sell, etc.)
        action = event_data.get('action', '')
        turtle_id = event_data.get('turtle_id', '')
        result['action'] = f'turtle_{action}'
        result['turtle_id'] = turtle_id
        result['success'] = True
    
    return result


# === VISUAL CONSTANTS EXPORT ===

def export_roster_visual_constants() -> Dict[str, Any]:
    """
    Export all visual constants for theme system
    """
    constants = RosterUIConstants()
    
    return {
        'layout': {
            'window_width': constants.WINDOW_WIDTH,
            'window_height': constants.WINDOW_HEIGHT,
            'header_height': constants.HEADER_HEIGHT,
            'navigation_height': constants.NAVIGATION_HEIGHT,
            'view_toggle_width': constants.VIEW_TOGGLE_WIDTH,
            'view_toggle_height': constants.VIEW_TOGGLE_HEIGHT,
            'grid_cell_width': constants.GRID_CELL_WIDTH,
            'grid_cell_height': constants.GRID_CELL_HEIGHT,
            'grid_cell_spacing': constants.GRID_CELL_SPACING,
            'scrollbar_width': constants.SCROLLBAR_WIDTH,
        },
        'colors': {
            'card_bg': constants.CARD_BG_COLOR,
            'card_border': constants.CARD_BORDER_COLOR,
            'card_selected': constants.CARD_SELECTED_BORDER,
            'card_hover': constants.CARD_HOVER_BORDER,
            'retired_overlay': constants.RETIRED_OVERLAY_COLOR,
            'button_normal': constants.BUTTON_NORMAL_COLOR,
            'button_hover': constants.BUTTON_HOVER_COLOR,
            'button_text': constants.BUTTON_TEXT_COLOR,
            'header_text': constants.HEADER_TEXT_COLOR,
            'stats_text': constants.STATS_TEXT_COLOR,
            'name_text': constants.NAME_TEXT_COLOR,
            'value_text': constants.VALUE_TEXT_COLOR,
        },
        'dimensions': {
            'turtle_image_size': constants.TURTLE_IMAGE_SIZE,
            'card_header_height': constants.CARD_HEADER_HEIGHT,
            'card_stats_height': constants.CARD_STATS_HEIGHT,
            'card_button_height': constants.CARD_BUTTON_HEIGHT,
        }
    }


if __name__ == "__main__":
    # Test the extracted logic
    extractor = RosterLogicExtractor()
    
    # Test sorting algorithms
    test_turtles = [
        TurtleCardData("1", "Zebra", {"speed": 5}, {}, False, value=100),
        TurtleCardData("2", "Alpha", {"speed": 15}, {}, False, value=200),
        TurtleCardData("3", "Beta", {"speed": 10}, {}, False, value=150),
    ]
    
    print("Testing sorting:")
    print(f"By name: {[t.name for t in extractor.sort_turtles_by_name(test_turtles)]}")
    print(f"By speed: {[t.name for t in extractor.sort_turtles_by_speed(test_turtles)]}")
    print(f"By value: {[t.name for t in extractor.sort_turtles_by_value(test_turtles)]}")
    
    # Test visual constants export
    constants = export_roster_visual_constants()
    print(f"Exported {len(constants)} constant categories")
    
    print("Roster logic extraction complete!")
