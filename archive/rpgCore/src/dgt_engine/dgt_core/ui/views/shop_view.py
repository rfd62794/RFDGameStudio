"""
Shop View - Universal Shop Interface using SLS
Surgical transplant from TurboShells shop_panel.py using DGT patterns
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import logging

from ..components.adaptive_turtle_card import AdaptiveTurtleCard, TurtleDisplayData, DisplayMode
from ...engines.viewport.logical_viewport import LogicalViewport
from ...ui.proportional_layout import ProportionalLayout, AnchorPoint, NormalizedRect
from ....registry.dgt_registry import DGTRegistry


@dataclass
class ShopItem:
    """Shop item data structure"""
    item_id: str
    name: str
    price: int
    item_type: str  # "turtle", "food", "upgrade"
    genetics: Optional[Dict[str, Any]] = None  # For turtle items
    description: str = ""
    is_available: bool = True
    stock: int = -1  # -1 for unlimited


@dataclass
class ShopState:
    """State management for shop operations"""
    player_money: int = 0
    selected_item: Optional[str] = None
    purchased_items: List[str] = None
    shop_inventory: List[ShopItem] = None
    
    def __post_init__(self):
        if self.purchased_items is None:
            self.purchased_items = []
        if self.shop_inventory is None:
            self.shop_inventory = []


class ShopView:
    """
    Universal shop interface that adapts to any resolution
    using the Sovereign Layout System (SLS)
    
    Critical: No legacy PyGame code - pure DGT BaseComponent patterns
    """
    
    def __init__(self, viewport: LogicalViewport, registry: DGTRegistry):
        self.viewport = viewport
        self.registry = registry
        self.logger = logging.getLogger(__name__)
        
        # State management
        self.state = ShopState()
        
        # UI Layout system
        self.layout = ProportionalLayout((1000, 1000))  # Logical space
        
        # UI Components
        self.item_cards: List[AdaptiveTurtleCard] = []
        self.preview_card: Optional[AdaptiveTurtleCard] = None
        
        # UI Element positions (normalized coordinates)
        self._setup_ui_layout()
        
        # Initialize shop inventory
        self._initialize_shop_inventory()
    
    def _setup_ui_layout(self) -> None:
        """Setup proportional UI layout using SLS"""
        # Header area (top 10% of screen)
        self.header_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.1),
            normalized_position=(0.0, 0.0)
        )
        
        # Item grid area (middle 60% of screen)
        self.grid_area_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.6),
            normalized_position=(0.0, 0.1)
        )
        
        # Preview area (next 20% of screen)
        self.preview_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.2),
            normalized_position=(0.0, 0.7)
        )
        
        # Controls area (bottom 10% of screen)
        self.controls_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.1),
            normalized_position=(0.0, 0.9)
        )
    
    def _initialize_shop_inventory(self) -> None:
        """Initialize shop inventory with default items"""
        # Generate some starter turtles for sale
        from ...genetics.visual_genetics import VisualGenetics
        genetics_system = VisualGenetics()
        
        # Create 5 starter turtles with different genetics
        starter_turtles = []
        for i in range(5):
            genetics = genetics_system.generate_random_genetics()
            
            turtle_item = ShopItem(
                item_id=f"starter_turtle_{i}",
                name=f"Starter Turtle {i+1}",
                price=50 + (i * 25),  # $50 to $150
                item_type="turtle",
                genetics=genetics,
                description=f"A turtle with unique genetic traits"
            )
            starter_turtles.append(turtle_item)
        
        # Add some food items
        food_items = [
            ShopItem(
                item_id="basic_food",
                name="Basic Food",
                price=10,
                item_type="food",
                description="Restores turtle energy",
                stock=100
            ),
            ShopItem(
                item_id="premium_food",
                name="Premium Food",
                price=25,
                item_type="food",
                description="Greatly restores turtle energy",
                stock=50
            )
        ]
        
        # Combine inventory
        self.state.shop_inventory = starter_turtles + food_items
        
        self.logger.info(f"Initialized shop with {len(self.state.shop_inventory)} items")
    
    def update_player_money(self) -> None:
        """Update player money from registry"""
        try:
            self.state.player_money = self.registry.get_player_money()
        except Exception as e:
            self.logger.error(f"Failed to update player money: {e}")
            self.state.player_money = 0
    
    def select_item(self, item_id: str) -> bool:
        """
        Select an item for preview/purchase.
        
        Args:
            item_id: ID of item to select
        
        Returns:
            True if selection successful
        """
        # Find item in inventory
        item = None
        for shop_item in self.state.shop_inventory:
            if shop_item.item_id == item_id:
                item = shop_item
                break
        
        if not item:
            self.logger.warning(f"Item {item_id} not found in shop")
            return False
        
        if not item.is_available:
            self.logger.warning(f"Item {item_id} is not available")
            return False
        
        if item.stock != -1 and item.stock <= 0:
            self.logger.warning(f"Item {item_id} is out of stock")
            return False
        
        # Update selected item
        self.state.selected_item = item_id
        
        # Update preview card
        self._update_preview_card(item)
        
        self.logger.info(f"Selected shop item {item_id}")
        return True
    
    def _update_preview_card(self, item: ShopItem) -> None:
        """Update preview card with item data"""
        if item.item_type == "turtle" and item.genetics:
            # Create turtle display data
            display_data = TurtleDisplayData(
                turtle_id=item.item_id,
                name=item.name,
                genetics=item.genetics,
                stats={"speed": 10.0, "energy": 100.0},  # Default stats
                position=(500, 800),  # Preview position
                is_selected=False
            )
            
            # Create preview card
            self.preview_card = AdaptiveTurtleCard(self.viewport, DisplayMode.AUTO)
            self.preview_card.set_turtle_data(display_data)
            self.preview_card.get_logical_rect((500, 800))
        else:
            # Non-turtle items don't need preview cards
            self.preview_card = None
    
    def can_purchase(self) -> bool:
        """Check if selected item can be purchased"""
        if not self.state.selected_item:
            return False
        
        item = self._get_selected_item()
        if not item:
            return False
        
        return (self.state.player_money >= item.price and
                item.is_available and
                (item.stock == -1 or item.stock > 0))
    
    def _get_selected_item(self) -> Optional[ShopItem]:
        """Get currently selected shop item"""
        if not self.state.selected_item:
            return None
        
        for item in self.state.shop_inventory:
            if item.item_id == self.state.selected_item:
                return item
        return None
    
    def purchase_item(self) -> bool:
        """
        Purchase the selected item.
        
        Returns:
            True if purchase successful
        """
        if not self.can_purchase():
            self.logger.warning("Cannot purchase item - conditions not met")
            return False
        
        item = self._get_selected_item()
        if not item:
            return False
        
        try:
            # Deduct money
            self.registry.deduct_money(item.price)
            
            # Process purchase based on item type
            if item.item_type == "turtle":
                # Add turtle to player's collection
                turtle_id = self.registry.add_turtle_to_collection(
                    name=item.name,
                    genetics=item.genetics
                )
                self.logger.info(f"Purchased turtle {turtle_id}")
                
            elif item.item_type == "food":
                # Add food to player's inventory
                self.registry.add_food_to_inventory(item.item_id, 1)
                self.logger.info(f"Purchased food {item.item_id}")
            
            # Update stock
            if item.stock != -1:
                item.stock -= 1
                if item.stock <= 0:
                    item.is_available = False
            
            # Update purchased items list
            self.state.purchased_items.append(item.item_id)
            
            # Update player money
            self.update_player_money()
            
            # Clear selection
            self.state.selected_item = None
            self.preview_card = None
            
            self.logger.info(f"Successfully purchased {item.name}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to purchase item {item.item_id}: {e}")
            # Refund money on failure
            try:
                self.registry.add_money(item.price)
            except:
                pass
            return False
    
    def refresh_inventory(self) -> None:
        """Refresh shop inventory (could be called daily)"""
        # For now, just restock items
        for item in self.state.shop_inventory:
            if item.item_type == "food" and item.stock < 10:
                item.stock = 100
                item.is_available = True
        
        # Could also regenerate turtle inventory
        self.logger.info("Shop inventory refreshed")
    
    def render(self) -> Dict[str, Any]:
        """
        Render the shop view.
        
        Returns:
            Render data for the rendering pipeline
        """
        render_data = {
            "type": "shop_view",
            "elements": []
        }
        
        # Render header
        header_render = self._render_header()
        render_data["elements"].extend(header_render)
        
        # Render item grid
        grid_render = self._render_item_grid()
        render_data["elements"].extend(grid_render)
        
        # Render preview area
        preview_render = self._render_preview_area()
        render_data["elements"].extend(preview_render)
        
        # Render controls
        controls_render = self._render_controls()
        render_data["elements"].extend(controls_render)
        
        return render_data
    
    def _render_header(self) -> List[Dict[str, Any]]:
        """Render header section"""
        elements = []
        
        header_rect = self.header_rect.to_physical(self.viewport.physical_size)
        
        # Title
        title = {
            "type": "text",
            "text": "TURTLE SHOP",
            "position": (header_rect[0] + 10, header_rect[1] + 5),
            "font_size": 20 if not self.viewport.is_retro_mode() else 12,
            "color": (255, 255, 255),
            "style": "bold"
        }
        elements.append(title)
        
        # Money display
        money_text = {
            "type": "text",
            "text": f"$ {self.state.player_money}",
            "position": (header_rect[0] + header_rect[2] - 150, header_rect[1] + 5),
            "font_size": 16 if not self.viewport.is_retro_mode() else 10,
            "color": (255, 215, 0),  # Gold color
            "style": "bold"
        }
        elements.append(money_text)
        
        return elements
    
    def _render_item_grid(self) -> List[Dict[str, Any]]:
        """Render item grid area"""
        elements = []
        
        # Grid background
        grid_bg = {
            "type": "panel",
            "rect": self.grid_area_rect.to_physical(self.viewport.physical_size),
            "color": (30, 30, 50),
            "border_color": (80, 80, 120),
            "border_thickness": 2
        }
        elements.append(grid_bg)
        
        # Calculate grid layout
        grid_cols = 3 if not self.viewport.is_retro_mode() else 2
        grid_rows = 2
        
        cell_width = 0.25  # 25% of grid width
        cell_height = 0.4   # 40% of grid height
        cell_spacing = 0.05  # 5% spacing
        
        # Render shop items
        for i, item in enumerate(self.state.shop_inventory[:grid_cols * grid_rows]):
            row = i // grid_cols
            col = i % grid_cols
            
            # Calculate cell position
            cell_x = 0.1 + col * (cell_width + cell_spacing)
            cell_y = 0.1 + row * (cell_height + cell_spacing)
            
            # Create item card
            if item.item_type == "turtle":
                card_render = self._render_turtle_item(item, cell_x, cell_y, cell_width, cell_height)
            else:
                card_render = self._render_generic_item(item, cell_x, cell_y, cell_width, cell_height)
            
            elements.extend(card_render)
        
        return elements
    
    def _render_turtle_item(self, item: ShopItem, x: float, y: float, 
                           width: float, height: float) -> List[Dict[str, Any]]:
        """Render a turtle item in the grid"""
        elements = []
        
        # Convert normalized to physical coordinates
        grid_rect = self.grid_area_rect.to_physical(self.viewport.physical_size)
        item_x = grid_rect[0] + int(x * grid_rect[2])
        item_y = grid_rect[1] + int(y * grid_rect[3])
        item_w = int(width * grid_rect[2])
        item_h = int(height * grid_rect[3])
        
        # Item background
        is_selected = (self.state.selected_item == item.item_id)
        bg_color = (60, 60, 80) if is_selected else (40, 40, 60)
        
        item_bg = {
            "type": "panel",
            "rect": (item_x, item_y, item_w, item_h),
            "color": bg_color,
            "border_color": (150, 150, 200) if is_selected else (80, 80, 120),
            "border_thickness": 3 if is_selected else 1
        }
        elements.append(item_bg)
        
        # Turtle preview (simplified)
        if item.genetics:
            turtle_color = item.genetics.get("shell_base_color", (34, 139, 34))
            turtle_sprite = {
                "type": "circle",
                "position": (item_x + item_w // 2, item_y + item_h // 3),
                "radius": min(item_w, item_h) // 6,
                "color": turtle_color
            }
            elements.append(turtle_sprite)
        
        # Item name
        name_text = {
            "type": "text",
            "text": item.name[:12],  # Truncate for space
            "position": (item_x + 5, item_y + item_h - 30),
            "font_size": 10 if not self.viewport.is_retro_mode() else 8,
            "color": (255, 255, 255)
        }
        elements.append(name_text)
        
        # Price
        price_color = (255, 100, 100) if self.state.player_money < item.price else (100, 255, 100)
        price_text = {
            "type": "text",
            "text": f"${item.price}",
            "position": (item_x + 5, item_y + item_h - 15),
            "font_size": 10 if not self.viewport.is_retro_mode() else 8,
            "color": price_color
        }
        elements.append(price_text)
        
        # Stock indicator
        if item.stock != -1:
            stock_text = {
                "type": "text",
                "text": f"Stock: {item.stock}",
                "position": (item_x + item_w - 50, item_y + item_h - 15),
                "font_size": 8 if not self.viewport.is_retro_mode() else 6,
                "color": (200, 200, 200)
            }
            elements.append(stock_text)
        
        return elements
    
    def _render_generic_item(self, item: ShopItem, x: float, y: float,
                           width: float, height: float) -> List[Dict[str, Any]]:
        """Render a non-turtle item in the grid"""
        elements = []
        
        # Convert normalized to physical coordinates
        grid_rect = self.grid_area_rect.to_physical(self.viewport.physical_size)
        item_x = grid_rect[0] + int(x * grid_rect[2])
        item_y = grid_rect[1] + int(y * grid_rect[3])
        item_w = int(width * grid_rect[2])
        item_h = int(height * grid_rect[3])
        
        # Item background
        is_selected = (self.state.selected_item == item.item_id)
        bg_color = (60, 60, 80) if is_selected else (40, 40, 60)
        
        item_bg = {
            "type": "panel",
            "rect": (item_x, item_y, item_w, item_h),
            "color": bg_color,
            "border_color": (150, 150, 200) if is_selected else (80, 80, 120),
            "border_thickness": 3 if is_selected else 1
        }
        elements.append(item_bg)
        
        # Item icon (simple rectangle for non-turtle items)
        icon_color = (100, 200, 100) if item.item_type == "food" else (200, 200, 100)
        item_icon = {
            "type": "rectangle",
            "rect": (item_x + item_w // 2 - 10, item_y + item_h // 3 - 10, 20, 20),
            "color": icon_color
        }
        elements.append(item_icon)
        
        # Item name
        name_text = {
            "type": "text",
            "text": item.name[:12],  # Truncate for space
            "position": (item_x + 5, item_y + item_h - 30),
            "font_size": 10 if not self.viewport.is_retro_mode() else 8,
            "color": (255, 255, 255)
        }
        elements.append(name_text)
        
        # Price
        price_color = (255, 100, 100) if self.state.player_money < item.price else (100, 255, 100)
        price_text = {
            "type": "text",
            "text": f"${item.price}",
            "position": (item_x + 5, item_y + item_h - 15),
            "font_size": 10 if not self.viewport.is_retro_mode() else 8,
            "color": price_color
        }
        elements.append(price_text)
        
        return elements
    
    def _render_preview_area(self) -> List[Dict[str, Any]]:
        """Render preview area"""
        elements = []
        
        # Preview background
        preview_bg = {
            "type": "panel",
            "rect": self.preview_rect.to_physical(self.viewport.physical_size),
            "color": (40, 50, 40),
            "border_color": (80, 120, 80),
            "border_thickness": 2
        }
        elements.append(preview_bg)
        
        # Render preview card if available
        if self.preview_card:
            preview_render = self.preview_card.render()
            elements.append(preview_render)
        
        # Render item details
        if self.state.selected_item:
            item = self._get_selected_item()
            if item:
                details_render = self._render_item_details(item)
                elements.extend(details_render)
        
        return elements
    
    def _render_item_details(self, item: ShopItem) -> List[Dict[str, Any]]:
        """Render detailed item information"""
        elements = []
        
        preview_rect = self.preview_rect.to_physical(self.viewport.physical_size)
        
        # Item description
        desc_text = {
            "type": "text",
            "text": item.description,
            "position": (preview_rect[0] + 10, preview_rect[1] + 10),
            "font_size": 12 if not self.viewport.is_retro_mode() else 8,
            "color": (200, 200, 200)
        }
        elements.append(desc_text)
        
        # Item type
        type_text = {
            "type": "text",
            "text": f"Type: {item.item_type.title()}",
            "position": (preview_rect[0] + 10, preview_rect[1] + 30),
            "font_size": 10 if not self.viewport.is_retro_mode() else 7,
            "color": (150, 150, 150)
        }
        elements.append(type_text)
        
        return elements
    
    def _render_controls(self) -> List[Dict[str, Any]]:
        """Render control buttons"""
        elements = []
        
        controls_rect = self.controls_rect.to_physical(self.viewport.physical_size)
        
        # Purchase button
        purchase_button = {
            "type": "button",
            "rect": (controls_rect[0] + 10, controls_rect[1] + 5, 120, 30),
            "text": "BUY",
            "enabled": self.can_purchase(),
            "color": (0, 150, 0) if self.can_purchase() else (100, 100, 100),
            "text_color": (255, 255, 255),
            "action": "purchase"
        }
        elements.append(purchase_button)
        
        # Refresh button
        refresh_button = {
            "type": "button",
            "rect": (controls_rect[0] + 140, controls_rect[1] + 5, 120, 30),
            "text": "REFRESH",
            "enabled": True,
            "color": (0, 100, 150),
            "text_color": (255, 255, 255),
            "action": "refresh"
        }
        elements.append(refresh_button)
        
        return elements
    
    def handle_click(self, click_position: Tuple[int, int]) -> Optional[str]:
        """
        Handle click events in the shop view.
        
        Args:
            click_position: Physical click coordinates
        
        Returns:
            Action to perform or None
        """
        # Check item grid clicks
        grid_rect = self.grid_area_rect.to_physical(self.viewport.physical_size)
        x, y = click_position
        
        if (grid_rect[0] <= x <= grid_rect[0] + grid_rect[2] and
            grid_rect[1] <= y <= grid_rect[1] + grid_rect[3]):
            
            # Calculate which grid cell was clicked
            grid_cols = 3 if not self.viewport.is_retro_mode() else 2
            cell_width = grid_rect[2] // grid_cols
            cell_height = grid_rect[3] // 2
            
            col = (x - grid_rect[0]) // cell_width
            row = (y - grid_rect[1]) // cell_height
            item_index = row * grid_cols + col
            
            if item_index < len(self.state.shop_inventory):
                item = self.state.shop_inventory[item_index]
                return f"select_item_{item.item_id}"
        
        # Check control button clicks
        controls_rect = self.controls_rect.to_physical(self.viewport.physical_size)
        
        # Purchase button
        purchase_button_rect = (controls_rect[0] + 10, controls_rect[1] + 5, 120, 30)
        if (purchase_button_rect[0] <= x <= purchase_button_rect[0] + purchase_button_rect[2] and
            purchase_button_rect[1] <= y <= purchase_button_rect[1] + purchase_button_rect[3]):
            return "purchase"
        
        # Refresh button
        refresh_button_rect = (controls_rect[0] + 140, controls_rect[1] + 5, 120, 30)
        if (refresh_button_rect[0] <= x <= refresh_button_rect[0] + refresh_button_rect[2] and
            refresh_button_rect[1] <= y <= refresh_button_rect[1] + refresh_button_rect[3]):
            return "refresh"
        
        return None
    
    def handle_action(self, action: str) -> bool:
        """
        Handle UI actions.
        
        Args:
            action: Action string from handle_click
        
        Returns:
            True if action handled successfully
        """
        if action.startswith("select_item_"):
            item_id = action.replace("select_item_", "")
            return self.select_item(item_id)
        elif action == "purchase":
            return self.purchase_item()
        elif action == "refresh":
            self.refresh_inventory()
            return True
        
        return False
    
    def get_state(self) -> ShopState:
        """Get current shop state"""
        return self.state
    
    def update_state(self) -> None:
        """Update shop state from registry"""
        self.update_player_money()
