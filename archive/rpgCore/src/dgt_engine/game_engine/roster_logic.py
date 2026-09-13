"""
Roster Logic Extractor - Legacy Logic Preservation
Extracts and preserves roster sorting and filtering logic from legacy TurboShells implementation
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging


class ViewMode(Enum):
    """View modes for turtle roster"""
    ACTIVE = "active"
    RETIRED = "retired"
    SELECT_RACER = "select_racer"


class SortMode(Enum):
    """Sorting modes for turtle roster"""
    BY_NAME = "by_name"
    BY_SPEED = "by_speed"
    BY_VALUE = "by_value"
    BY_GENERATION = "by_generation"
    BY_RARITY = "by_rarity"


@dataclass
class RosterUIConstants:
    """Legacy UI constants extracted from TurboShells audit"""
    # Window dimensions (legacy 800x600)
    WINDOW_WIDTH = 800
    WINDOW_HEIGHT = 600
    
    # Layout sections
    HEADER_HEIGHT = 60
    NAVIGATION_HEIGHT = 30
    GRID_MARGIN = 20
    
    # Grid layout
    CARD_WIDTH = 150
    CARD_HEIGHT = 120
    CARD_SPACING_X = 20
    CARD_SPACING_Y = 15
    CARDS_PER_ROW = 4
    
    # Scrollbar
    SCROLLBAR_WIDTH = 16
    SCROLLBAR_MARGIN = 5
    SCROLLBAR_MIN_HEIGHT = 20
    
    # Colors (legacy theme)
    CARD_BG_COLOR = (50, 50, 70)
    CARD_BORDER_COLOR = (80, 80, 120)
    CARD_SELECTED_BORDER = (255, 215, 0)  # Gold
    CARD_HOVER_BORDER = (100, 100, 150)
    BUTTON_NORMAL_COLOR = (100, 100, 150)
    
    # Text rendering
    TITLE_FONT_SIZE = 16
    NORMAL_FONT_SIZE = 12
    SMALL_FONT_SIZE = 10
    STATS_FONT_SIZE = 8


@dataclass
class TurtleCard:
    """Turtle card data structure for roster display"""
    turtle_id: str
    name: str
    genetics: Dict[str, Any]
    stats: Dict[str, Any]
    value: int
    generation: int
    rarity: str
    is_retired: bool
    is_selected: bool = False
    is_hovered: bool = False
    card_rect: Optional[Any] = None  # Will be set to SovereignRect


class RosterLogicExtractor:
    """
    Extracts and preserves roster logic from legacy implementation.
    Maintains exact same behavior as original TurboShells roster system.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.constants = RosterUIConstants()
        
        # Roster state
        self.current_view_mode = ViewMode.ACTIVE
        self.current_sort_mode = SortMode.BY_NAME
        self.turtle_cards: List[TurtleCard] = []
        
        # Grid layout cache
        self._cached_layout = None
        self._cached_container = None
        
        self.logger.info("RosterLogicExtractor initialized with legacy parameters")
    
    def process_turtle_data(self, raw_turtles: List[Dict[str, Any]]) -> List[TurtleCard]:
        """
        Process raw turtle data into card format using legacy logic.
        
        Args:
            raw_turtles: Raw turtle data from registry
            
        Returns:
            List of TurtleCard objects
        """
        cards = []
        
        for turtle_data in raw_turtles:
            # Extract and validate data
            turtle_id = turtle_data.get('id', 'unknown')
            name = turtle_data.get('name', 'Unknown Turtle')
            genetics = turtle_data.get('genetics', {})
            stats = turtle_data.get('stats', {})
            value = turtle_data.get('value', 100)
            generation = turtle_data.get('generation', 1)
            rarity = turtle_data.get('rarity', 'common')
            is_retired = turtle_data.get('is_retired', False)
            
            # Create card
            card = TurtleCard(
                turtle_id=turtle_id,
                name=name,
                genetics=genetics,
                stats=stats,
                value=value,
                generation=generation,
                rarity=rarity,
                is_retired=is_retired
            )
            
            cards.append(card)
        
        self.logger.info(f"Processed {len(cards)} turtle cards")
        return cards
    
    def apply_view_mode_filter(self, cards: List[TurtleCard], mode: ViewMode) -> List[TurtleCard]:
        """Apply view mode filter using legacy logic"""
        filtered_cards = []
        
        for card in cards:
            should_include = False
            
            if mode == ViewMode.ACTIVE:
                should_include = not card.is_retired
            elif mode == ViewMode.RETIRED:
                should_include = card.is_retired
            elif mode == ViewMode.SELECT_RACER:
                # Only include active, non-retired turtles for racing
                should_include = not card.is_retired and card.stats.get('speed', 0) > 0
            
            if should_include:
                filtered_cards.append(card)
        
        self.logger.info(f"View mode {mode.value}: {len(filtered_cards)} cards from {len(cards)} total")
        return filtered_cards
    
    def apply_sorting(self, cards: List[TurtleCard], sort_mode: SortMode) -> List[TurtleCard]:
        """Apply sorting using legacy algorithms"""
        def get_sort_key(card: TurtleCard):
            if sort_mode == SortMode.BY_NAME:
                return card.name.lower()
            elif sort_mode == SortMode.BY_SPEED:
                return -card.stats.get('speed', 0)  # Negative for descending
            elif sort_mode == SortMode.BY_VALUE:
                return -card.value  # Negative for descending
            elif sort_mode == SortMode.BY_GENERATION:
                return card.generation
            elif sort_mode == SortMode.BY_RARITY:
                rarity_order = {'common': 0, 'rare': 1, 'epic': 2, 'legendary': 3}
                return rarity_order.get(card.rarity.lower(), 0)
            else:
                return card.name.lower()
        
        # Sort cards
        sorted_cards = sorted(cards, key=get_sort_key)
        
        self.logger.info(f"Sorted {len(sorted_cards)} cards by {sort_mode.value}")
        return sorted_cards
    
    def calculate_grid_layout(self, container_rect: Tuple[int, int, int, int]) -> Tuple[List[Tuple[int, int, int, int]], int]:
        """
        Calculate grid layout for turtle cards using legacy positioning.
        
        Args:
            container_rect: (x, y, width, height) of container
            
        Returns:
            (list_of_card_rects, max_scroll_offset)
        """
        x, y, width, height = container_rect
        
        # Check if we can use cached layout
        if self._cached_container == container_rect and self._cached_layout:
            return self._cached_layout
        
        card_rects = []
        
        # Calculate effective drawing area
        effective_width = width - self.constants.SCROLLBAR_WIDTH - self.constants.SCROLLBAR_MARGIN - self.constants.GRID_MARGIN
        effective_height = height - 2 * self.constants.GRID_MARGIN
        
        # Calculate how many cards fit per row
        cards_per_row = min(self.constants.CARDS_PER_ROW, 
                           effective_width // (self.constants.CARD_WIDTH + self.constants.CARD_SPACING_X))
        
        if cards_per_row == 0:
            cards_per_row = 1
        
        # Calculate total rows needed
        total_rows = (len(self.turtle_cards) + cards_per_row - 1) // cards_per_row
        
        # Calculate total height needed
        total_height = total_rows * (self.constants.CARD_HEIGHT + self.constants.CARD_SPACING_Y)
        
        # Calculate scroll offset
        max_scroll = max(0, total_height - effective_height)
        
        # Generate card positions
        for i, card in enumerate(self.turtle_cards):
            row = i // cards_per_row
            col = i % cards_per_row
            
            card_x = x + self.constants.GRID_MARGIN + col * (self.constants.CARD_WIDTH + self.constants.CARD_SPACING_X)
            card_y = y + self.constants.GRID_MARGIN + row * (self.constants.CARD_HEIGHT + self.constants.CARD_SPACING_Y)
            
            card_rects.append((card_x, card_y, self.constants.CARD_WIDTH, self.constants.CARD_HEIGHT))
        
        # Cache layout
        self._cached_layout = (card_rects, max_scroll)
        self._cached_container = container_rect
        
        self.logger.info(f"Calculated grid layout: {len(card_rects)} cards, {total_rows} rows, max_scroll={max_scroll}")
        return card_rects, max_scroll
    
    def handle_card_click(self, logical_pos: Tuple[float, float]) -> Optional[int]:
        """
        Handle card click using legacy collision detection.
        
        Args:
            logical_pos: Logical mouse coordinates
            
        Returns:
            Card index or None
        """
        for i, card in enumerate(self.turtle_cards):
            if card.card_rect:
                # Use SovereignRect collision detection
                if card.card_rect.collidepoint(logical_pos):
                    return i
        
        return None
    
    def handle_card_hover(self, logical_pos: Tuple[float, float]) -> Optional[int]:
        """
        Handle card hover using legacy collision detection.
        
        Args:
            logical_pos: Logical mouse coordinates
            
        Returns:
            Card index or None
        """
        for i, card in enumerate(self.turtle_cards):
            if card.card_rect:
                if card.card_rect.collidepoint(logical_pos):
                    return i
        
        return None
    
    def update_selection_state(self, card_index: int, is_selected: bool) -> None:
        """Update selection state for a card"""
        if 0 <= card_index < len(self.turtle_cards):
            # Clear previous selection in single-select mode
            if is_selected:
                for i, card in enumerate(self.turtle_cards):
                    card.is_selected = False
            
            # Set new selection
            self.turtle_cards[card_index].is_selected = is_selected
    
    def get_card_render_data(self, card_index: int) -> Optional[Dict[str, Any]]:
        """Get render data for a specific card"""
        if 0 <= card_index < len(self.turtle_cards):
            card = self.turtle_cards[card_index]
            return {
                'turtle_id': card.turtle_id,
                'name': card.name,
                'genetics': card.genetics,
                'stats': card.stats,
                'value': card.value,
                'generation': card.generation,
                'rarity': card.rarity,
                'is_retired': card.is_retired,
                'is_selected': card.is_selected,
                'is_hovered': card.is_hovered
            }
        return None
    
    def get_scrollbar_render_data(self, container_rect: Tuple[int, int, int, int]) -> Optional[Dict[str, Any]]:
        """
        Get scrollbar render data using legacy calculations.
        
        Args:
            container_rect: Container rectangle
            
        Returns:
            Scrollbar render data or None
        """
        if len(self.turtle_cards) == 0:
            return None
        
        # Calculate scrollbar position and size
        x, y, width, height = container_rect
        
        # Scrollbar track position
        track_x = x + width - self.constants.SCROLLBAR_WIDTH - self.constants.SCROLLBAR_MARGIN
        track_y = y
        track_width = self.constants.SCROLLBAR_WIDTH
        track_height = height
        
        # Calculate content height
        cards_per_row = self.constants.CARDS_PER_ROW
        total_rows = (len(self.turtle_cards) + cards_per_row - 1) // cards_per_row
        content_height = total_rows * (self.constants.CARD_HEIGHT + self.constants.CARD_SPACING_Y)
        
        # Calculate thumb height
        if content_height <= height:
            thumb_height = track_height
            thumb_y = track_y
        else:
            thumb_height = max(self.constants.SCROLLBAR_MIN_HEIGHT, 
                              int(track_height * height / content_height))
            # Calculate thumb position (would use scroll_offset in production)
            thumb_y = track_y  # Simplified - would use actual scroll position
        
        # Determine thumb color based on hover state
        thumb_color = (150, 150, 200)  # Default thumb color
        
        return {
            'rect': (track_x, thumb_y, track_width, thumb_height),
            'thumb_color': thumb_color,
            'track_height': track_height,
            'content_height': content_height
        }
    
    def switch_view_mode(self, new_mode: ViewMode) -> None:
        """Switch view mode and clear cache"""
        self.current_view_mode = new_mode
        self._cached_layout = None  # Clear layout cache
        self._cached_container = None
    
    def get_view_statistics(self) -> Dict[str, Any]:
        """Get statistics about current view"""
        total_count = len(self.turtle_cards)
        active_count = sum(1 for card in self.turtle_cards if not card.is_retired)
        retired_count = sum(1 for card in self.turtle_cards if card.is_retired)
        
        # Calculate average stats
        avg_speed = 0
        avg_value = 0
        if total_count > 0:
            avg_speed = sum(card.stats.get('speed', 0) for card in self.turtle_cards) / total_count
            avg_value = sum(card.value for card in self.turtle_cards) / total_count
        
        return {
            'total_turtles': total_count,
            'active_turtles': active_count,
            'retired_turtles': retired_count,
            'average_speed': avg_speed,
            'average_value': avg_value,
            'current_view': self.current_view_mode.value,
            'current_sort': self.current_sort_mode.value
        }
    
    def search_turtles(self, query: str) -> List[TurtleCard]:
        """
        Search turtles by name using legacy search logic.
        
        Args:
            query: Search query
            
        Returns:
            List of matching cards
        """
        query_lower = query.lower()
        matching_cards = []
        
        for card in self.turtle_cards:
            if query_lower in card.name.lower():
                matching_cards.append(card)
        
        self.logger.info(f"Search '{query}' found {len(matching_cards)} matches")
        return matching_cards
    
    def get_turtles_by_rarity(self, rarity: str) -> List[TurtleCard]:
        """Get turtles filtered by rarity"""
        rarity_lower = rarity.lower()
        matching_cards = [card for card in self.turtle_cards if card.rarity.lower() == rarity_lower]
        
        self.logger.info(f"Rarity '{rarity}' filter: {len(matching_cards)} matches")
        return matching_cards
    
    def calculate_total_value(self) -> int:
        """Calculate total value of all turtles in current view"""
        total_value = sum(card.value for card in self.turtle_cards)
        self.logger.info(f"Total roster value: ${total_value}")
        return total_value
