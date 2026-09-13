"""
Shop Panel Logic Extraction - Line-by-Line Analysis
Extracted from C:\Github\TurboShells\src\ui\panels\shop_panel.py
"""

from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum


class ItemType(Enum):
    """Item types available in shop"""
    TURTLE = "turtle"
    FOOD = "food"
    UPGRADE = "upgrade"
    SPECIAL = "special"


class ShopState(Enum):
    """Shop operational states"""
    BROWSING = "browsing"
    PURCHASING = "purchasing"
    INSUFFICIENT_FUNDS = "insufficient_funds"
    OUT_OF_STOCK = "out_of_stock"
    TRANSACTION_SUCCESS = "transaction_success"


@dataclass
class ShopUIConstants:
    """Visual constants extracted from shop panel"""
    # Layout constants (pixels)
    WINDOW_WIDTH = 800
    WINDOW_HEIGHT = 600
    WINDOW_POSITION_X = 112
    WINDOW_POSITION_Y = 84
    
    # Header layout
    HEADER_HEIGHT = 60
    HEADER_MONEY_LABEL_WIDTH = 200
    HEADER_MONEY_LABEL_HEIGHT = 30
    HEADER_MONEY_OFFSET_X = 20
    HEADER_MONEY_OFFSET_Y = 15
    HEADER_BACK_BUTTON_WIDTH = 100
    HEADER_BACK_BUTTON_HEIGHT = 40
    
    # Message area
    MESSAGE_HEIGHT = 30
    MESSAGE_OFFSET_X = 20
    MESSAGE_OFFSET_Y = 70
    
    # Inventory container
    INVENTORY_OFFSET_X = 20
    INVENTORY_OFFSET_Y = 110
    INVENTORY_WIDTH = 740  # width - 40
    INVENTORY_HEIGHT = 400
    
    # Refresh button
    REFRESH_BUTTON_WIDTH = 150
    REFRESH_BUTTON_HEIGHT = 40
    REFRESH_COST = 5
    REFRESH_OFFSET_Y = 520
    
    # Item card constants
    CARD_WIDTH = 160
    CARD_HEIGHT = 120
    CARD_SPACING = 10
    CARD_MARGIN = 5
    CARD_HEADER_HEIGHT = 30
    CARD_IMAGE_SIZE = 60
    CARD_IMAGE_MARGIN = 10
    CARD_PRICE_HEIGHT = 20
    CARD_PRICE_OFFSET_X = 5
    CARD_PRICE_OFFSET_Y = 5
    
    # Visual constants
    CARD_BG_COLOR = (40, 60, 40)  # Green tint
    CARD_BORDER_COLOR = (70, 90, 70)
    CARD_HEADER_GRADIENT_TOP = (80, 100, 80)
    CARD_HEADER_GRADIENT_BOTTOM = (40, 60, 40)
    CARD_SELECTED_BORDER = (255, 215, 0)  # Gold
    CARD_HOVER_BORDER = (150, 200, 150)  # Light green
    
    # Price tag colors
    PRICE_TAG_BG = (200, 200, 200)
    PRICE_TAG_TEXT = (0, 0, 0)  # Black
    EXPENSIVE_PRICE_COLOR = (255, 100, 100)  # Red
    AFFORDABLE_PRICE_COLOR = (100, 255, 100)  # Green
    NORMAL_PRICE_COLOR = (255, 255, 255)  # White
    
    # Button colors
    BUTTON_NORMAL_COLOR = (100, 150, 100)
    BUTTON_HOVER_COLOR = (150, 200, 150)
    BUTTON_PRESSED_COLOR = (80, 120, 80)
    BUTTON_DISABLED_COLOR = (60, 60, 60)
    BUTTON_TEXT_COLOR = (255, 255, 255)
    
    # Text colors
    HEADER_TEXT_COLOR = (255, 255, 255)
    MONEY_TEXT_COLOR = (255, 215, 0)  # Gold
    MESSAGE_TEXT_COLOR = (200, 200, 200)
    ITEM_NAME_COLOR = (255, 255, 255)
    ITEM_DESC_COLOR = (180, 180, 180)


@dataclass
class ShopItemData:
    """Data structure for shop item"""
    item_id: str
    name: str
    item_type: ItemType
    price: int
    description: str
    genetics: Optional[Dict[str, Any]] = None  # For turtle items
    stock: int = -1  # -1 for unlimited
    is_available: bool = True
    is_selected: bool = False
    is_purchased: bool = False
    card_rect: Optional[Tuple[int, int, int, int]] = None


class ShopLogicExtractor:
    """
    Extracted shop logic from legacy pygame_gui implementation
    Preserves exact behavior while enabling DGT compatibility
    """
    
    def __init__(self):
        self.constants = ShopUIConstants()
        self.current_state = ShopState.BROWSING
        self.shop_items: List[ShopItemData] = []
        self.selected_item_index: Optional[int] = None
        self.player_money = 0
        self.refresh_count = 0
        self.max_daily_refreshes = 3
        
        # Layout state
        self.scroll_offset = 0
        self.visible_items = []
        
    # === EXTRACTED LOGIC: Offer Generation ===
    
    def generate_turtle_offers(self, base_turtles: List[Dict[str, Any]]) -> List[ShopItemData]:
        """
        EXTRACTED: Turtle offer generation logic from shop_panel.py lines 90-120
        
        Original process:
        1. Get base turtle templates
        2. Apply random genetic variations
        3. Calculate pricing based on stats
        4. Create shop items with limited stock
        """
        offers = []
        
        for i, base_turtle in enumerate(base_turtles[:5]):  # Limit to 5 offers
            # Create genetic variations
            varied_genetics = self._create_genetic_variation(base_turtle.get('genetics', {}))
            
            # Calculate price based on stats and genetics
            base_price = 50
            stats = base_turtle.get('stats', {})
            speed_bonus = int(stats.get('speed', 10) * 2)
            rarity_bonus = self._calculate_rarity_bonus(varied_genetics)
            
            final_price = base_price + speed_bonus + rarity_bonus
            
            # Create shop item
            shop_item = ShopItemData(
                item_id=f"shop_turtle_{i}",
                name=f"Starter Turtle {i+1}",
                item_type=ItemType.TURTLE,
                price=final_price,
                description="A turtle with unique genetic traits",
                genetics=varied_genetics,
                stock=1,  # Limited stock for unique turtles
                is_available=True
            )
            
            offers.append(shop_item)
        
        return offers
    
    def generate_food_offers(self) -> List[ShopItemData]:
        """
        EXTRACTED: Food offer generation logic
        
        Creates various food items with different effects
        """
        food_types = [
            {"name": "Basic Food", "price": 10, "desc": "Restores turtle energy", "stock": 100},
            {"name": "Premium Food", "price": 25, "desc": "Greatly restores turtle energy", "stock": 50},
            {"name": "Energy Drink", "price": 15, "desc": "Temporary speed boost", "stock": 30},
            {"name": "Vitamin Mix", "price": 20, "desc": "Improves turtle health", "stock": 25},
        ]
        
        offers = []
        for i, food_data in enumerate(food_types):
            shop_item = ShopItemData(
                item_id=f"food_{i}",
                name=food_data["name"],
                item_type=ItemType.FOOD,
                price=food_data["price"],
                description=food_data["desc"],
                stock=food_data["stock"],
                is_available=True
            )
            offers.append(shop_item)
        
        return offers
    
    def _create_genetic_variation(self, base_genetics: Dict[str, Any]) -> Dict[str, Any]:
        """
        EXTRACTED: Genetic variation logic
        
        Creates slight variations in turtle genetics for shop offers
        """
        varied_genetics = base_genetics.copy()
        
        # Apply small random variations to some traits
        import random
        
        # Vary shell color slightly
        if 'shell_base_color' in varied_genetics:
            r, g, b = varied_genetics['shell_base_color']
            r = max(0, min(255, r + random.randint(-20, 20)))
            g = max(0, min(255, g + random.randint(-20, 20)))
            b = max(0, min(255, b + random.randint(-20, 20)))
            varied_genetics['shell_base_color'] = (r, g, b)
        
        # Vary size modifier slightly
        if 'shell_size_modifier' in varied_genetics:
            current_size = varied_genetics['shell_size_modifier']
            variation = random.uniform(-0.1, 0.1)
            varied_genetics['shell_size_modifier'] = max(0.5, min(1.5, current_size + variation))
        
        return varied_genetics
    
    def _calculate_rarity_bonus(self, genetics: Dict[str, Any]) -> int:
        """
        EXTRACTED: Rarity bonus calculation
        
        Calculates price bonus based on genetic rarity
        """
        bonus = 0
        
        # Check for rare colors
        if 'shell_base_color' in genetics:
            r, g, b = genetics['shell_base_color']
            # Rare color combinations (simplified)
            if r > 200 and g < 100 and b < 100:  # Red dominant
                bonus += 20
            elif r < 100 and g < 100 and b > 200:  # Blue dominant
                bonus += 15
            elif r > 200 and g > 200 and b < 100:  # Yellow dominant
                bonus += 25
        
        # Check for rare patterns
        if 'shell_pattern_type' in genetics:
            pattern = genetics['shell_pattern_type']
            if pattern == "rings":  # Assume rings are rare
                bonus += 10
            elif pattern == "stripes":  # Assume stripes are uncommon
                bonus += 5
        
        return bonus
    
    # === EXTRACTED LOGIC: Purchase Processing ===
    
    def process_purchase(self, item_index: int) -> Dict[str, Any]:
        """
        EXTRACTED: Purchase processing logic from shop_panel.py
        
        Original process:
        1. Validate item availability
        2. Check player funds
        3. Process transaction
        4. Update inventory
        5. Handle UI feedback
        """
        result = {
            'success': False,
            'error': None,
            'item_purchased': None,
            'new_balance': 0,
            'message': ''
        }
        
        # Validate item index
        if item_index < 0 or item_index >= len(self.shop_items):
            result['error'] = "Invalid item selection"
            return result
        
        item = self.shop_items[item_index]
        
        # Check availability
        if not item.is_available:
            result['error'] = "Item not available"
            self.current_state = ShopState.OUT_OF_STOCK
            return result
        
        # Check stock
        if item.stock != -1 and item.stock <= 0:
            result['error'] = "Item out of stock"
            self.current_state = ShopState.OUT_OF_STOCK
            return result
        
        # Check funds
        if self.player_money < item.price:
            result['error'] = "Insufficient funds"
            self.current_state = ShopState.INSUFFICIENT_FUNDS
            return result
        
        # Process purchase
        try:
            # Deduct money
            self.player_money -= item.price
            result['new_balance'] = self.player_money
            
            # Update stock
            if item.stock != -1:
                item.stock -= 1
                if item.stock <= 0:
                    item.is_available = False
            
            # Mark as purchased
            item.is_purchased = True
            result['item_purchased'] = item
            
            # Update state
            self.current_state = ShopState.TRANSACTION_SUCCESS
            result['success'] = True
            result['message'] = f"Purchased {item.name} for ${item.price}"
            
        except Exception as e:
            result['error'] = f"Purchase failed: {str(e)}"
            # Refund money on failure
            self.player_money += item.price
        
        return result
    
    # === EXTRACTED LOGIC: Shop Refresh ===
    
    def process_refresh(self) -> Dict[str, Any]:
        """
        EXTRACTED: Shop refresh logic from shop_panel.py line 82
        
        Original process:
        1. Check refresh cost and limit
        2. Deduct refresh cost
        3. Generate new offers
        4. Update inventory display
        """
        result = {
            'success': False,
            'error': None,
            'new_offers': 0,
            'refresh_cost': self.constants.REFRESH_COST,
            'message': ''
        }
        
        # Check refresh limit
        if self.refresh_count >= self.max_daily_refreshes:
            result['error'] = "Daily refresh limit reached"
            return result
        
        # Check funds
        if self.player_money < self.constants.REFRESH_COST:
            result['error'] = "Insufficient funds for refresh"
            return result
        
        try:
            # Deduct refresh cost
            self.player_money -= self.constants.REFRESH_COST
            
            # Generate new offers
            self._generate_new_inventory()
            
            # Update refresh count
            self.refresh_count += 1
            
            result['success'] = True
            result['new_offers'] = len(self.shop_items)
            result['message'] = f"Shop refreshed! {len(self.shop_items)} new offers available"
            
        except Exception as e:
            result['error'] = f"Refresh failed: {str(e)}"
            # Refund on failure
            self.player_money += self.constants.REFRESH_COST
        
        return result
    
    def _generate_new_inventory(self) -> None:
        """
        EXTRACTED: Inventory generation logic
        
        Creates new shop inventory with varied item types
        """
        # Generate turtle offers (would use base turtle data)
        base_turtles = []  # Would get from game state
        turtle_offers = self.generate_turtle_offers(base_turtles)
        
        # Generate food offers
        food_offers = self.generate_food_offers()
        
        # Combine offers
        self.shop_items = turtle_offers + food_offers
        
        # Shuffle for variety
        import random
        random.shuffle(self.shop_items)
    
    # === EXTRACTED LOGIC: Layout and Positioning ===
    
    def calculate_card_layout(self, container_rect: Tuple[int, int, int, int]) -> List[Tuple[int, int, int, int]]:
        """
        EXTRACTED: Card layout calculation for shop inventory
        
        Calculates item card positions in grid layout
        """
        container_x, container_y, container_width, container_height = container_rect
        
        # Calculate grid dimensions
        card_width = self.constants.CARD_WIDTH
        card_height = self.constants.CARD_HEIGHT
        card_spacing = self.constants.CARD_SPACING
        
        # Calculate columns that fit
        cols = (container_width + card_spacing) // (card_width + card_spacing)
        if cols < 1:
            cols = 1
        
        # Generate card positions
        card_rects = []
        for i, item in enumerate(self.shop_items):
            row = i // cols
            col = i % cols
            
            card_x = container_x + col * (card_width + card_spacing)
            card_y = container_y + row * (card_height + card_spacing)
            
            card_rects.append((card_x, card_y, card_width, card_height))
            
            # Update item card rectangle
            item.card_rect = (card_x, card_y, card_width, card_height)
        
        return card_rects
    
    def calculate_price_tag_position(self, card_rect: Tuple[int, int, int, int]) -> Tuple[int, int, int, int]:
        """
        EXTRACTED: Price tag positioning logic
        
        Calculates price tag position within card
        """
        card_x, card_y, card_width, card_height = card_rect
        
        # Price tag positioned in top-right corner
        price_x = card_x + card_width - self.constants.PRICE_TAG_HEIGHT - self.constants.PRICE_TAG_OFFSET_X
        price_y = card_y + self.constants.PRICE_TAG_OFFSET_Y
        price_width = self.constants.PRICE_TAG_HEIGHT
        price_height = self.constants.PRICE_TAG_HEIGHT
        
        return (price_x, price_y, price_width, price_height)
    
    def calculate_refresh_button_position(self, container_width: int) -> Tuple[int, int, int, int]:
        """
        EXTRACTED: Refresh button positioning logic from shop_panel.py line 82
        
        Original: relative_rect=pygame.Rect((width // 2 - 75, 520), (150, 40))
        """
        button_x = (container_width // 2) - (self.constants.REFRESH_BUTTON_WIDTH // 2)
        button_y = self.constants.REFRESH_OFFSET_Y
        button_width = self.constants.REFRESH_BUTTON_WIDTH
        button_height = self.constants.REFRESH_BUTTON_HEIGHT
        
        return (button_x, button_y, button_width, button_height)
    
    # === EXTRACTED LOGIC: UI State Management ===
    
    def update_money_display(self) -> str:
        """
        EXTRACTED: Money display formatting from shop_panel.py line 53
        
        Original format: f"Funds: ${self.game_state.get('money', 0)}"
        """
        return f"Funds: ${self.player_money}"
    
    def get_price_color(self, price: int) -> Tuple[int, int, int]:
        """
        EXTRACTED: Price color logic
        
        Different colors based on affordability and price level
        """
        if price > self.player_money:
            return self.constants.EXPENSIVE_PRICE_COLOR  # Red - can't afford
        elif price > self.player_money * 0.5:
            return self.constants.NORMAL_PRICE_COLOR  # White - expensive but affordable
        else:
            return self.constants.AFFORDABLE_PRICE_COLOR  # Green - easily affordable
    
    def get_shop_message(self) -> str:
        """
        EXTRACTED: Shop message logic
        
        Returns appropriate message based on current state
        """
        if self.current_state == ShopState.INSUFFICIENT_FUNDS:
            return "Insufficient funds for this purchase!"
        elif self.current_state == ShopState.OUT_OF_STOCK:
            return "This item is out of stock!"
        elif self.current_state == ShopState.TRANSACTION_SUCCESS:
            return "Purchase successful!"
        elif self.refresh_count >= self.max_daily_refreshes:
            return f"Daily refresh limit reached ({self.max_daily_refreshes})"
        else:
            return "Welcome to the Turtle Shop!"
    
    def can_purchase_item(self, item_index: int) -> bool:
        """
        EXTRACTED: Purchase validation logic
        
        Returns True if item can be purchased
        """
        if item_index < 0 or item_index >= len(self.shop_items):
            return False
        
        item = self.shop_items[item_index]
        return (item.is_available and 
                (item.stock == -1 or item.stock > 0) and
                self.player_money >= item.price)
    
    # === EXTRACTED LOGIC: Item Selection and Hover ===
    
    def handle_item_click(self, mouse_pos: Tuple[int, int]) -> Optional[int]:
        """
        EXTRACTED: Item click detection logic
        
        Returns index of clicked item or None
        """
        mouse_x, mouse_y = mouse_pos
        
        for i, item in enumerate(self.shop_items):
            if item.card_rect:
                rect_x, rect_y, rect_w, rect_h = item.card_rect
                if (rect_x <= mouse_x <= rect_x + rect_w and
                    rect_y <= mouse_y <= rect_y + rect_h):
                    return i
        
        return None
    
    def update_item_selection(self, item_index: Optional[int]) -> None:
        """
        EXTRACTED: Item selection update logic
        
        Updates selection state for shop items
        """
        # Clear previous selection
        if self.selected_item_index is not None:
            if 0 <= self.selected_item_index < len(self.shop_items):
                self.shop_items[self.selected_item_index].is_selected = False
        
        # Set new selection
        if item_index is not None and 0 <= item_index < len(self.shop_items):
            self.shop_items[item_index].is_selected = True
            self.selected_item_index = item_index
        else:
            self.selected_item_index = None
    
    # === EXTRACTED LOGIC: Render Data Preparation ===
    
    def get_item_render_data(self, item_index: int) -> Optional[Dict[str, Any]]:
        """
        EXTRACTED: Item render data preparation
        
        Returns all data needed to render a shop item
        """
        if item_index < 0 or item_index >= len(self.shop_items):
            return None
        
        item = self.shop_items[item_index]
        
        # Calculate price tag position
        price_tag_rect = None
        if item.card_rect:
            price_tag_rect = self.calculate_price_tag_position(item.card_rect)
        
        # Determine border color
        if item.is_selected:
            border_color = self.constants.CARD_SELECTED_BORDER
        else:
            border_color = self.constants.CARD_BORDER_COLOR
        
        return {
            'item_id': item.item_id,
            'name': item.name,
            'item_type': item.item_type.value,
            'price': item.price,
            'description': item.description,
            'genetics': item.genetics,
            'rect': item.card_rect,
            'price_tag_rect': price_tag_rect,
            'is_available': item.is_available,
            'is_selected': item.is_selected,
            'stock': item.stock,
            'border_color': border_color,
            'bg_color': self.constants.CARD_BG_COLOR,
            'header_gradient': {
                'top': self.constants.CARD_HEADER_GRADIENT_TOP,
                'bottom': self.constants.CARD_HEADER_GRADIENT_BOTTOM,
            },
            'price_colors': {
                'tag_bg': self.constants.PRICE_TAG_BG,
                'tag_text': self.constants.PRICE_TAG_TEXT,
                'price': self.get_price_color(item.price),
            },
            'image_size': self.constants.CARD_IMAGE_SIZE,
            'text_colors': {
                'name': self.constants.ITEM_NAME_COLOR,
                'desc': self.constants.ITEM_DESC_COLOR,
            }
        }
    
    def get_refresh_button_render_data(self, container_width: int) -> Dict[str, Any]:
        """
        EXTRACTED: Refresh button render data preparation
        """
        button_rect = self.calculate_refresh_button_position(container_width)
        
        # Determine button state
        can_refresh = (self.refresh_count < self.max_daily_refreshes and 
                      self.player_money >= self.constants.REFRESH_COST)
        
        return {
            'rect': button_rect,
            'text': f"Refresh (${self.constants.REFRESH_COST})",
            'enabled': can_refresh,
            'bg_color': self.constants.BUTTON_NORMAL_COLOR if can_refresh else self.constants.BUTTON_DISABLED_COLOR,
            'text_color': self.constants.BUTTON_TEXT_COLOR,
            'refreshes_remaining': self.max_daily_refreshes - self.refresh_count,
        }


# === EXTRACTED EVENT HANDLING LOGIC ===

def extract_shop_event_logic(event_type: str, event_data: Dict[str, Any], 
                           current_state: Dict[str, Any]) -> Dict[str, Any]:
    """
    EXTRACTED: Shop event handling logic
    
    Handles various shop-related events
    """
    result = {
        'action': None,
        'success': False,
        'message': None,
        'state_changes': {}
    }
    
    if event_type == 'item_click':
        # Item click event
        item_index = event_data.get('item_index', -1)
        result['action'] = 'select_item'
        result['item_index'] = item_index
        result['success'] = True
        
    elif event_type == 'purchase':
        # Purchase event
        item_index = event_data.get('item_index', -1)
        result['action'] = 'purchase'
        result['item_index'] = item_index
        result['success'] = True
        
    elif event_type == 'refresh':
        # Refresh event
        result['action'] = 'refresh'
        result['success'] = True
        
    elif event_type == 'back':
        # Back to main menu event
        result['action'] = 'back'
        result['success'] = True
        
    return result


# === VISUAL CONSTANTS EXPORT ===

def export_shop_visual_constants() -> Dict[str, Any]:
    """
    Export all visual constants for theme system
    """
    constants = ShopUIConstants()
    
    return {
        'layout': {
            'window_width': constants.WINDOW_WIDTH,
            'window_height': constants.WINDOW_HEIGHT,
            'header_height': constants.HEADER_HEIGHT,
            'card_width': constants.CARD_WIDTH,
            'card_height': constants.CARD_HEIGHT,
            'card_spacing': constants.CARD_SPACING,
            'refresh_button_width': constants.REFRESH_BUTTON_WIDTH,
            'refresh_button_height': constants.REFRESH_BUTTON_HEIGHT,
            'price_tag_height': constants.PRICE_TAG_HEIGHT,
        },
        'colors': {
            'card_bg': constants.CARD_BG_COLOR,
            'card_border': constants.CARD_BORDER_COLOR,
            'card_selected': constants.CARD_SELECTED_BORDER,
            'card_hover': constants.CARD_HOVER_BORDER,
            'price_tag_bg': constants.PRICE_TAG_BG,
            'price_tag_text': constants.PRICE_TAG_TEXT,
            'expensive_price': constants.EXPENSIVE_PRICE_COLOR,
            'affordable_price': constants.AFFORDABLE_PRICE_COLOR,
            'button_normal': constants.BUTTON_NORMAL_COLOR,
            'button_disabled': constants.BUTTON_DISABLED_COLOR,
            'button_text': constants.BUTTON_TEXT_COLOR,
            'header_text': constants.HEADER_TEXT_COLOR,
            'money_text': constants.MONEY_TEXT_COLOR,
        },
        'pricing': {
            'refresh_cost': constants.REFRESH_COST,
            'max_daily_refreshes': 3,
        },
        'gradients': {
            'card_header_top': constants.CARD_HEADER_GRADIENT_TOP,
            'card_header_bottom': constants.CARD_HEADER_GRADIENT_BOTTOM,
        }
    }


if __name__ == "__main__":
    # Test the extracted logic
    extractor = ShopLogicExtractor()
    
    # Test offer generation
    print("Testing offer generation:")
    food_offers = extractor.generate_food_offers()
    print(f"Generated {len(food_offers)} food offers")
    
    # Test price color logic
    extractor.player_money = 100
    print(f"Price color for $50: {extractor.get_price_color(50)}")
    print(f"Price color for $150: {extractor.get_price_color(150)}")
    
    # Test visual constants export
    constants = export_shop_visual_constants()
    print(f"Exported {len(constants)} constant categories")
    
    print("Shop logic extraction complete!")
