"""
Market View - Universal Shop Interface using PyGame Shim
Copy-paste legacy shop logic with DGT integration
"""

from typing import Dict, Any, List, Optional, Tuple
import logging

# Import DGT core systems
from dgt_core.engines.viewport.logical_viewport import LogicalViewport
from dgt_core.compat.pygame_shim import LegacyUIContext, create_legacy_context
from dgt_core.systems.day_cycle_manager import PersistentStateManager
from dgt_core.registry.dgt_registry import DGTRegistry

# Import extracted logic
from legacy_logic_extraction.market_logic import MarketLogicExtractor, MarketUIConstants, ShopCategory


class MarketView:
    """
    Universal market interface using PyGame compatibility shim.
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
        self.logic = MarketLogicExtractor()
        
        # UI state
        self.shop_items = []
        self.current_category = ShopCategory.TURTLES
        self.selected_item_index = None
        self.hovered_item_index = None
        self.player_money = 0
        
        # Transaction state
        self.pending_purchase = None
        self.last_purchase_result = None
        
        # Initialize market data
        self._initialize_market()
        
        self.logger.info("MarketView initialized with PyGame shim")
    
    def _initialize_market(self) -> None:
        """Initialize market with available items"""
        try:
            # Get player money
            self.player_money = self.registry.get_player_money()
            
            # Get shop items from registry
            available_items = self.registry.get_shop_items()
            
            # Process items using extracted logic
            processed_items = self.logic.process_shop_items(available_items)
            
            # Apply category filter
            self._update_shop_items(processed_items)
            
            self.logger.info(f"Initialized market with {len(self.shop_items)} items")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize market: {e}")
    
    def _update_shop_items(self, all_items: List) -> None:
        """Update shop items with category filtering"""
        # Apply category filter
        filtered_items = self.logic.apply_category_filter(all_items, self.current_category)
        
        # Apply sorting (by price, then by name)
        sorted_items = self.logic.apply_sorting(filtered_items)
        
        # Update internal state
        self.shop_items = sorted_items
        
        # Recalculate layout
        self._update_item_layout()
    
    def _update_item_layout(self) -> None:
        """Recalculate item layout and positioning"""
        # Container rect using legacy constants
        constants = MarketUIConstants()
        container_rect = (
            constants.SHOP_MARGIN,
            constants.HEADER_HEIGHT + constants.CATEGORY_TAB_HEIGHT + constants.SHOP_MARGIN,
            constants.WINDOW_WIDTH - 2 * constants.SHOP_MARGIN,
            constants.WINDOW_HEIGHT - constants.HEADER_HEIGHT - constants.CATEGORY_TAB_HEIGHT - 2 * constants.SHOP_MARGIN
        )
        
        # Calculate item positions
        item_rects = self.logic.calculate_item_layout(container_rect)
        
        # Update item rectangles
        for i, rect in enumerate(item_rects):
            if i < len(self.shop_items):
                # Create SovereignRect for each item
                sovereign_rect = self.legacy_context.Rect(rect[0], rect[1], rect[2], rect[3])
                self.shop_items[i].item_rect = sovereign_rect
    
    def switch_category(self, new_category: ShopCategory) -> None:
        """Switch between shop categories"""
        if self.current_category != new_category:
            self.current_category = new_category
            self.logic.switch_category(new_category)
            
            # Re-filter and sort
            all_items = self.logic.process_shop_items(self.registry.get_shop_items())
            self._update_shop_items(all_items)
            
            self.logger.info(f"Switched to {new_category.value} category")
    
    def handle_item_click(self, mouse_pos: Tuple[int, int]) -> Optional[str]:
        """
        Handle item click using extracted logic.
        
        Args:
            mouse_pos: Physical mouse coordinates
        
        Returns:
            Action string or None
        """
        # Convert to logical coordinates for collision detection
        logical_pos = self.viewport.to_logical(mouse_pos)
        
        # Use extracted click detection logic
        clicked_index = self.logic.handle_item_click(logical_pos)
        
        if clicked_index is not None and 0 <= clicked_index < len(self.shop_items):
            # Update selection state
            self.logic.update_selection_state(clicked_index, True)
            self.selected_item_index = clicked_index
            
            # Get item data
            item_data = self.shop_items[clicked_index]
            item_id = item_data.item_id
            
            self.logger.info(f"Selected item {item_id} at index {clicked_index}")
            
            # Check if player can afford this item
            if self.player_money >= item_data.price:
                return f"purchase_{item_id}"
            else:
                return f"insufficient_funds_{item_id}"
        
        return None
    
    def handle_item_hover(self, mouse_pos: Tuple[int, int]) -> None:
        """Handle item hover for visual feedback"""
        # Convert to logical coordinates
        logical_pos = self.viewport.to_logical(mouse_pos)
        
        # Use extracted hover detection logic
        hovered_index = self.logic.handle_item_hover(logical_pos)
        
        if hovered_index != self.hovered_item_index:
            # Clear previous hover
            if self.hovered_item_index is not None:
                if 0 <= self.hovered_item_index < len(self.shop_items):
                    self.shop_items[self.hovered_item_index].is_hovered = False
            
            # Set new hover
            if hovered_index is not None and 0 <= hovered_index < len(self.shop_items):
                self.shop_items[hovered_index].is_hovered = True
                self.hovered_item_index = hovered_index
            else:
                self.hovered_item_index = None
    
    def purchase_item(self, item_index: int) -> Dict[str, Any]:
        """
        Purchase an item using extracted logic.
        
        Args:
            item_index: Index of item to purchase
            
        Returns:
            Purchase result
        """
        if item_index < 0 or item_index >= len(self.shop_items):
            return {
                'success': False,
                'error': 'Invalid item index'
            }
        
        item = self.shop_items[item_index]
        
        # Check if player can afford the item
        if self.player_money < item.price:
            return {
                'success': False,
                'error': 'Insufficient funds',
                'required': item.price,
                'available': self.player_money
            }
        
        # Check if item is in stock
        if item.stock <= 0:
            return {
                'success': False,
                'error': 'Item out of stock'
            }
        
        try:
            # Process purchase using extracted logic
            purchase_result = self.logic.process_purchase(item, self.player_money)
            
            if purchase_result['success']:
                # Update player money
                new_money = self.player_money - item.price
                self.registry.set_player_money(new_money)
                self.player_money = new_money
                
                # Add item to player inventory
                self.registry.add_item_to_inventory(item.item_data)
                
                # Update item stock
                item.stock -= 1
                
                # Record transaction in persistent state
                self.state_manager.on_item_purchased(
                    item_id=item.item_id,
                    price=item.price,
                    category=self.current_category.value,
                    remaining_money=new_money
                )
                
                # Store purchase result
                self.last_purchase_result = purchase_result
                
                self.logger.info(f"Purchase successful: {item.name} for ${item.price}")
                return purchase_result
            else:
                self.logger.error(f"Purchase failed: {purchase_result.get('error', 'Unknown error')}")
                return purchase_result
                
        except Exception as e:
            error_msg = f"Purchase error: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def refresh_shop(self) -> None:
        """Refresh shop items (simulates daily refresh)"""
        try:
            # Get refreshed items from registry
            refreshed_items = self.registry.refresh_shop_items()
            
            # Process and update
            processed_items = self.logic.process_shop_items(refreshed_items)
            self._update_shop_items(processed_items)
            
            # Update player money
            self.player_money = self.registry.get_player_money()
            
            self.logger.info("Shop refreshed successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to refresh shop: {e}")
    
    def get_selected_item(self) -> Optional[Dict[str, Any]]:
        """Get currently selected item data"""
        if self.selected_item_index is not None and 0 <= self.selected_item_index < len(self.shop_items):
            return self.logic.get_item_render_data(self.selected_item_index)
        return None
    
    def get_market_summary(self) -> Dict[str, Any]:
        """Get summary of current market state"""
        return {
            'category': self.current_category.value,
            'item_count': len(self.shop_items),
            'player_money': self.player_money,
            'selected_index': self.selected_item_index,
            'has_selection': self.selected_item_index is not None
        }
    
    def render(self) -> Dict[str, Any]:
        """
        Render the market view using legacy drawing commands.
        
        Returns:
            Render data for the rendering pipeline
        """
        render_data = {
            'type': 'market_view',
            'elements': []
        }
        
        # Clear drawing proxy
        self.legacy_context.draw.clear()
        
        # Draw background
        bg_rect = self.legacy_context.Rect(0, 0, 800, 600)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['SHOP_BG'], bg_rect)
        
        # Draw header
        self._render_header()
        
        # Draw category tabs
        self._render_category_tabs()
        
        # Draw shop items
        self._render_shop_items()
        
        # Draw purchase confirmation if pending
        if self.pending_purchase:
            self._render_purchase_confirmation()
        
        # Get render packets
        frame_data = self.legacy_context.get_frame_data()
        render_data['render_packets'] = frame_data['render_packets']
        render_data['viewport_size'] = frame_data['viewport_size']
        
        return render_data
    
    def _render_header(self) -> None:
        """Render header section"""
        constants = MarketUIConstants()
        
        # Header background
        header_rect = self.legacy_context.Rect(0, 0, 800, constants.HEADER_HEIGHT)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], header_rect)
        
        # Title
        title_text = f"TURBOSHELLS MARKET - {self.current_category.value.upper()}"
        self.legacy_context.draw.text(None, title_text, (255, 255, 255), (10, 15), 16)
        
        # Player money
        money_text = f"FUNDS: ${self.player_money}"
        self.legacy_context.draw.text(None, money_text, (255, 215, 0), (600, 15), 14)
        
        # Refresh button
        refresh_rect = self.legacy_context.Rect(700, 10, 80, 25)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BUTTON_NORMAL'], refresh_rect)
        self.legacy_context.draw.text(None, "REFRESH", (255, 255, 255), (refresh_rect[0] + 15, refresh_rect[1] + 5), 10)
    
    def _render_category_tabs(self) -> None:
        """Render category selection tabs"""
        constants = MarketUIConstants()
        
        categories = [ShopCategory.TURTLES, ShopCategory.ITEMS, ShopCategory.UPGRADES]
        tab_width = 100
        tab_spacing = 10
        
        for i, category in enumerate(categories):
            tab_x = 20 + i * (tab_width + tab_spacing)
            tab_y = constants.HEADER_HEIGHT + 5
            tab_rect = self.legacy_context.Rect(tab_x, tab_y, tab_width, constants.CATEGORY_TAB_HEIGHT - 10)
            
            # Highlight current category
            if category == self.current_category:
                self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_SELECTED_BORDER'], tab_rect)
            else:
                self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BUTTON_NORMAL'], tab_rect)
            
            # Tab text
            category_text = category.value.upper()
            self.legacy_context.draw.text(None, category_text, (255, 255, 255), (tab_x + 10, tab_y + 2), 10)
    
    def _render_shop_items(self) -> None:
        """Render shop items in grid layout"""
        constants = MarketUIConstants()
        
        # Shop container
        shop_rect = self.legacy_context.Rect(
            constants.SHOP_MARGIN,
            constants.HEADER_HEIGHT + constants.CATEGORY_TAB_HEIGHT + constants.SHOP_MARGIN,
            800 - 2 * constants.SHOP_MARGIN,
            600 - constants.HEADER_HEIGHT - constants.CATEGORY_TAB_HEIGHT - 2 * constants.SHOP_MARGIN
        )
        
        # Draw shop background
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], shop_rect)
        
        # Draw visible shop items
        for i, shop_item in enumerate(self.shop_items):
            if shop_item.item_rect:
                self._render_shop_item(shop_item, i)
    
    def _render_shop_item(self, shop_item, index: int) -> None:
        """Render a single shop item"""
        if not shop_item.item_rect:
            return
        
        rect = shop_item.item_rect
        
        # Determine border color based on state
        if shop_item.is_selected:
            border_color = self.legacy_context.theme_colors['CARD_SELECTED_BORDER']
        elif shop_item.is_hovered:
            border_color = self.legacy_context.theme_colors['CARD_HOVER_BORDER']
        else:
            border_color = self.legacy_context.theme_colors['CARD_BORDER_COLOR']
        
        # Draw item background
        bg_color = self.legacy_context.theme_colors['PRICE_TAG_BG'] if self.player_money >= shop_item.price else (100, 50, 50)
        self.legacy_context.draw.rect(None, bg_color, rect)
        
        # Draw border
        self.legacy_context.draw.rect(None, border_color, rect, 2)
        
        # Draw item placeholder/sprite
        center_x = rect.left + rect.width // 2
        center_y = rect.top + 30
        
        # Draw item circle with rarity color
        item_color = self._get_rarity_color(shop_item.rarity)
        self.legacy_context.draw.circle(None, item_color, (center_x, center_y), 20)
        
        # Draw item name
        name_y = rect.top + 60
        self.legacy_context.draw.text(None, shop_item.name, (255, 255, 255), (rect.left + 5, name_y), 10)
        
        # Draw price
        price_y = name_y + 15
        price_color = (255, 100, 100) if self.player_money < shop_item.price else (255, 215, 0)
        price_text = f"${shop_item.price}"
        self.legacy_context.draw.text(None, price_text, price_color, (rect.left + 5, price_y), 10)
        
        # Draw stock
        if shop_item.stock > 0:
            stock_text = f"Stock: {shop_item.stock}"
            self.legacy_context.draw.text(None, stock_text, (200, 200, 200), (rect.left + 5, price_y + 10), 8)
        else:
            # Out of stock overlay
            overlay_rect = self.legacy_context.Rect(rect.left, rect.top, rect.width, rect.height)
            out_of_stock_color = (128, 50, 50, 128)  # Semi-transparent red
            self.legacy_context.draw.rect(None, out_of_stock_color, overlay_rect)
            
            # Draw "SOLD OUT" text
            self.legacy_context.draw.text(None, "SOLD OUT", (255, 255, 255), (center_x - 30, center_y), 10)
    
    def _render_purchase_confirmation(self) -> None:
        """Render purchase confirmation dialog"""
        if not self.pending_purchase:
            return
        
        # Dialog background
        dialog_rect = self.legacy_context.Rect(200, 200, 400, 200)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BG_COLOR'], dialog_rect)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_BORDER_COLOR'], dialog_rect, 3)
        
        # Dialog text
        confirm_text = f"Purchase {self.pending_purchase['name']} for ${self.pending_purchase['price']}?"
        self.legacy_context.draw.text(None, confirm_text, (255, 255, 255), (220, 220), 12)
        
        # Yes button
        yes_rect = self.legacy_context.Rect(250, 330, 60, 30)
        self.legacy_context.draw.rect(None, (50, 150, 50), yes_rect)
        self.legacy_context.draw.text(None, "YES", (255, 255, 255), (yes_rect[0] + 20, yes_rect[1] + 8), 12)
        
        # No button
        no_rect = self.legacy_context.Rect(490, 330, 60, 30)
        self.legacy_context.draw.rect(None, (150, 50, 50), no_rect)
        self.legacy_context.draw.text(None, "NO", (255, 255, 255), (no_rect[0] + 20, no_rect[1] + 8), 12)
    
    def _get_rarity_color(self, rarity: str) -> Tuple[int, int, int]:
        """Get color based on item rarity"""
        rarity_colors = {
            'common': (150, 150, 150),
            'rare': (100, 150, 255),
            'epic': (200, 100, 255),
            'legendary': (255, 215, 0)
        }
        return rarity_colors.get(rarity.lower(), (150, 150, 150))
    
    def get_state(self) -> Dict[str, Any]:
        """Get current market state"""
        return {
            'category': self.current_category.value,
            'item_count': len(self.shop_items),
            'player_money': self.player_money,
            'selected_item_index': self.selected_item_index,
            'hovered_item_index': self.hovered_item_index,
            'pending_purchase': self.pending_purchase,
            'last_purchase_result': self.last_purchase_result
        }
    
    def reset_state(self) -> None:
        """Reset market state"""
        self.selected_item_index = None
        self.hovered_item_index = None
        self.pending_purchase = None
        self.last_purchase_result = None
        
        # Clear selection in logic
        for item in self.shop_items:
            item.is_selected = False
            item.is_hovered = False
