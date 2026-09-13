"""
Market Logic Extractor - Legacy Logic Preservation
Extracts and preserves market/shop logic from legacy TurboShells implementation
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging


class ShopCategory(Enum):
    """Shop categories for market interface"""
    TURTLES = "turtles"
    ITEMS = "items"
    UPGRADES = "upgrades"


@dataclass
class MarketUIConstants:
    """Legacy UI constants extracted from TurboShells audit"""
    # Window dimensions (legacy 800x600)
    WINDOW_WIDTH = 800
    WINDOW_HEIGHT = 600
    
    # Layout sections
    HEADER_HEIGHT = 60
    CATEGORY_TAB_HEIGHT = 35
    SHOP_MARGIN = 20
    
    # Item grid layout
    ITEM_WIDTH = 160
    ITEM_HEIGHT = 120
    ITEM_SPACING_X = 15
    ITEM_SPACING_Y = 15
    ITEMS_PER_ROW = 4
    
    # Category tabs
    TAB_WIDTH = 100
    TAB_HEIGHT = 25
    TAB_SPACING = 10
    
    # Colors (legacy theme)
    CARD_BG_COLOR = (50, 50, 70)
    CARD_BORDER_COLOR = (80, 80, 120)
    CARD_SELECTED_BORDER = (255, 215, 0)  # Gold
    CARD_HOVER_BORDER = (100, 100, 150)
    BUTTON_NORMAL = (100, 100, 150)
    PRICE_TAG_BG = (40, 60, 40)
    
    # Text rendering
    TITLE_FONT_SIZE = 16
    NORMAL_FONT_SIZE = 12
    SMALL_FONT_SIZE = 10
    
    # Market logic constants
    MAX_STOCK_PER_ITEM = 10
    REFRESH_COST = 50
    PRICE_VARIANCE = 0.2  # 20% price variance


@dataclass
class ShopItem:
    """Shop item data structure for market display"""
    item_id: str
    name: str
    description: str
    price: int
    rarity: str
    category: ShopCategory
    stock: int
    item_data: Dict[str, Any]  # Original item data
    is_selected: bool = False
    is_hovered: bool = False
    item_rect: Optional[Any] = None  # Will be set to SovereignRect


class MarketLogicExtractor:
    """
    Extracts and preserves market logic from legacy implementation.
    Maintains exact same behavior as original TurboShells shop system.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.constants = MarketUIConstants()
        
        # Market state
        self.current_category = ShopCategory.TURTLES
        self.shop_items: List[ShopItem] = []
        
        # Pricing logic
        self.base_prices = {
            'common_turtle': 100,
            'rare_turtle': 250,
            'epic_turtle': 500,
            'legendary_turtle': 1000,
            'speed_boost': 150,
            'endurance_boost': 200,
            'special_food': 75
        }
        
        # Layout cache
        self._cached_layout = None
        self._cached_container = None
        
        self.logger.info("MarketLogicExtractor initialized with legacy parameters")
    
    def process_shop_items(self, raw_items: List[Dict[str, Any]]) -> List[ShopItem]:
        """
        Process raw shop data into item format using legacy logic.
        
        Args:
            raw_items: Raw shop data from registry
            
        Returns:
            List of ShopItem objects
        """
        items = []
        
        for item_data in raw_items:
            # Extract and validate data
            item_id = item_data.get('id', 'unknown')
            name = item_data.get('name', 'Unknown Item')
            description = item_data.get('description', '')
            base_price = item_data.get('price', 100)
            rarity = item_data.get('rarity', 'common')
            category_str = item_data.get('category', 'turtles')
            stock = item_data.get('stock', self.constants.MAX_STOCK_PER_ITEM)
            
            # Convert category string to enum
            try:
                category = ShopCategory(category_str)
            except ValueError:
                category = ShopCategory.TURTLES
            
            # Apply price variance (legacy market fluctuation)
            final_price = self._calculate_market_price(base_price, rarity)
            
            # Create shop item
            shop_item = ShopItem(
                item_id=item_id,
                name=name,
                description=description,
                price=final_price,
                rarity=rarity,
                category=category,
                stock=stock,
                item_data=item_data
            )
            
            items.append(shop_item)
        
        self.logger.info(f"Processed {len(items)} shop items")
        return items
    
    def _calculate_market_price(self, base_price: int, rarity: str) -> int:
        """
        Calculate market price with variance using legacy algorithm.
        
        Args:
            base_price: Base price of item
            rarity: Item rarity
            
        Returns:
            Final market price
        """
        import random
        
        # Rarity multiplier
        rarity_multipliers = {
            'common': 1.0,
            'rare': 1.5,
            'epic': 2.0,
            'legendary': 3.0
        }
        
        multiplier = rarity_multipliers.get(rarity.lower(), 1.0)
        
        # Apply market variance (±20%)
        variance = random.uniform(-self.constants.PRICE_VARIANCE, self.constants.PRICE_VARIANCE)
        final_price = int(base_price * multiplier * (1 + variance))
        
        # Ensure minimum price
        final_price = max(10, final_price)
        
        return final_price
    
    def apply_category_filter(self, items: List[ShopItem], category: ShopCategory) -> List[ShopItem]:
        """Apply category filter using legacy logic"""
        filtered_items = [item for item in items if item.category == category]
        
        self.logger.info(f"Category {category.value}: {len(filtered_items)} items from {len(items)} total")
        return filtered_items
    
    def apply_sorting(self, items: List[ShopItem]) -> List[ShopItem]:
        """Apply sorting using legacy algorithms (price ascending, then name)"""
        def get_sort_key(item: ShopItem):
            return (item.price, item.name.lower())
        
        sorted_items = sorted(items, key=get_sort_key)
        
        self.logger.info(f"Sorted {len(sorted_items)} items by price and name")
        return sorted_items
    
    def calculate_item_layout(self, container_rect: Tuple[int, int, int, int]) -> List[Tuple[int, int, int, int]]:
        """
        Calculate item layout for shop grid using legacy positioning.
        
        Args:
            container_rect: (x, y, width, height) of container
            
        Returns:
            List of item rectangles
        """
        x, y, width, height = container_rect
        
        # Check if we can use cached layout
        if self._cached_container == container_rect and self._cached_layout:
            return self._cached_layout
        
        item_rects = []
        
        # Calculate effective drawing area
        effective_width = width - 2 * self.constants.SHOP_MARGIN
        effective_height = height - 2 * self.constants.SHOP_MARGIN
        
        # Calculate how many items fit per row
        items_per_row = min(self.constants.ITEMS_PER_ROW, 
                           effective_width // (self.constants.ITEM_WIDTH + self.constants.ITEM_SPACING_X))
        
        if items_per_row == 0:
            items_per_row = 1
        
        # Generate item positions
        for i, item in enumerate(self.shop_items):
            row = i // items_per_row
            col = i % items_per_row
            
            item_x = x + self.constants.SHOP_MARGIN + col * (self.constants.ITEM_WIDTH + self.constants.ITEM_SPACING_X)
            item_y = y + self.constants.SHOP_MARGIN + row * (self.constants.ITEM_HEIGHT + self.constants.ITEM_SPACING_Y)
            
            item_rects.append((item_x, item_y, self.constants.ITEM_WIDTH, self.constants.ITEM_HEIGHT))
        
        # Cache layout
        self._cached_layout = item_rects
        self._cached_container = container_rect
        
        self.logger.info(f"Calculated item layout: {len(item_rects)} items, {items_per_row} per row")
        return item_rects
    
    def handle_item_click(self, logical_pos: Tuple[float, float]) -> Optional[int]:
        """
        Handle item click using legacy collision detection.
        
        Args:
            logical_pos: Logical mouse coordinates
            
        Returns:
            Item index or None
        """
        for i, item in enumerate(self.shop_items):
            if item.item_rect:
                # Use SovereignRect collision detection
                if item.item_rect.collidepoint(logical_pos):
                    return i
        
        return None
    
    def handle_item_hover(self, logical_pos: Tuple[float, float]) -> Optional[int]:
        """
        Handle item hover using legacy collision detection.
        
        Args:
            logical_pos: Logical mouse coordinates
            
        Returns:
            Item index or None
        """
        for i, item in enumerate(self.shop_items):
            if item.item_rect:
                if item.item_rect.collidepoint(logical_pos):
                    return i
        
        return None
    
    def update_selection_state(self, item_index: int, is_selected: bool) -> None:
        """Update selection state for an item"""
        if 0 <= item_index < len(self.shop_items):
            # Clear previous selection in single-select mode
            if is_selected:
                for i, item in enumerate(self.shop_items):
                    item.is_selected = False
            
            # Set new selection
            self.shop_items[item_index].is_selected = is_selected
    
    def get_item_render_data(self, item_index: int) -> Optional[Dict[str, Any]]:
        """Get render data for a specific item"""
        if 0 <= item_index < len(self.shop_items):
            item = self.shop_items[item_index]
            return {
                'item_id': item.item_id,
                'name': item.name,
                'description': item.description,
                'price': item.price,
                'rarity': item.rarity,
                'category': item.category.value,
                'stock': item.stock,
                'is_selected': item.is_selected,
                'is_hovered': item.is_hovered,
                'item_data': item.item_data
            }
        return None
    
    def process_purchase(self, item: ShopItem, player_money: int) -> Dict[str, Any]:
        """
        Process item purchase using legacy logic.
        
        Args:
            item: Item to purchase
            player_money: Player's current money
            
        Returns:
            Purchase result
        """
        try:
            # Validate purchase
            if player_money < item.price:
                return {
                    'success': False,
                    'error': 'Insufficient funds',
                    'required': item.price,
                    'available': player_money
                }
            
            if item.stock <= 0:
                return {
                    'success': False,
                    'error': 'Item out of stock'
                }
            
            # Process purchase
            new_money = player_money - item.price
            new_stock = item.stock - 1
            
            # Create purchase receipt
            receipt = {
                'success': True,
                'item_id': item.item_id,
                'item_name': item.name,
                'price': item.price,
                'previous_money': player_money,
                'new_money': new_money,
                'previous_stock': item.stock,
                'new_stock': new_stock,
                'timestamp': self._get_timestamp(),
                'category': item.category.value
            }
            
            self.logger.info(f"Purchase processed: {item.name} for ${item.price}")
            return receipt
            
        except Exception as e:
            error_msg = f"Purchase processing error: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def switch_category(self, new_category: ShopCategory) -> None:
        """Switch category and clear cache"""
        self.current_category = new_category
        self._cached_layout = None  # Clear layout cache
        self._cached_container = None
    
    def calculate_market_value(self) -> int:
        """Calculate total market value of all items"""
        total_value = sum(item.price * item.stock for item in self.shop_items)
        self.logger.info(f"Total market value: ${total_value}")
        return total_value
    
    def get_market_statistics(self) -> Dict[str, Any]:
        """Get statistics about current market"""
        total_items = len(self.shop_items)
        total_stock = sum(item.stock for item in self.shop_items)
        total_value = self.calculate_market_value()
        
        # Count by category
        category_counts = {}
        for category in ShopCategory:
            category_counts[category.value] = sum(1 for item in self.shop_items if item.category == category)
        
        # Count by rarity
        rarity_counts = {}
        for item in self.shop_items:
            rarity_counts[item.rarity] = rarity_counts.get(item.rarity, 0) + 1
        
        # Average prices
        avg_price = total_value / total_items if total_items > 0 else 0
        
        return {
            'total_items': total_items,
            'total_stock': total_stock,
            'total_value': total_value,
            'average_price': avg_price,
            'category_counts': category_counts,
            'rarity_counts': rarity_counts,
            'current_category': self.current_category.value
        }
    
    def search_items(self, query: str) -> List[ShopItem]:
        """
        Search items by name using legacy search logic.
        
        Args:
            query: Search query
            
        Returns:
            List of matching items
        """
        query_lower = query.lower()
        matching_items = []
        
        for item in self.shop_items:
            if query_lower in item.name.lower() or query_lower in item.description.lower():
                matching_items.append(item)
        
        self.logger.info(f"Search '{query}' found {len(matching_items)} matches")
        return matching_items
    
    def get_items_by_rarity(self, rarity: str) -> List[ShopItem]:
        """Get items filtered by rarity"""
        rarity_lower = rarity.lower()
        matching_items = [item for item in self.shop_items if item.rarity.lower() == rarity_lower]
        
        self.logger.info(f"Rarity '{rarity}' filter: {len(matching_items)} matches")
        return matching_items
    
    def refresh_market_prices(self) -> None:
        """Refresh market prices with new variance"""
        for item in self.shop_items:
            base_price = item.item_data.get('price', 100)
            item.price = self._calculate_market_price(base_price, item.rarity)
        
        self.logger.info("Market prices refreshed")
    
    def _get_timestamp(self) -> int:
        """Get current timestamp"""
        import time
        return int(time.time())
    
    def validate_purchase_requirements(self, item: ShopItem, player_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate purchase requirements using legacy rules.
        
        Returns:
            (is_valid, error_message)
        """
        # Check player level requirements
        required_level = item.item_data.get('required_level', 1)
        player_level = player_data.get('level', 1)
        
        if player_level < required_level:
            return False, f"Requires level {required_level}"
        
        # Check prerequisite items
        prerequisites = item.item_data.get('prerequisites', [])
        player_inventory = player_data.get('inventory', [])
        
        for prereq in prerequisites:
            if prereq not in player_inventory:
                return False, f"Requires {prereq}"
        
        # Check category-specific requirements
        if item.category == ShopCategory.TURTLES:
            # Check max turtle limit
            turtle_count = sum(1 for item in player_inventory if item.startswith('turtle_'))
            if turtle_count >= 10:  # Legacy max turtle limit
                return False, "Maximum turtle limit reached"
        
        return True, "Purchase requirements met"
