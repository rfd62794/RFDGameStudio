"""
Inventory Component - Item Management Panel

Phase 10: Component-Based UI Architecture
Fixed-Grid Component for inventory, equipment, and item tracking.

ADR 027: Component-Based UI Synchronization
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.align import Align

from loguru import logger


class ItemRarity(Enum):
    """Item rarity levels with corresponding colors."""
    COMMON = "common"        # White
    UNCOMMON = "uncommon"      # Green
    RARE = "rare"            # Blue
    EPIC = "epic"            # Purple
    LEGENDARY = "legendary"    # Gold
    ARTIFACT = "artifact"      # Cyan (special for legacy items)


class ItemType(Enum):
    """Item types with corresponding symbols."""
    WEAPON = "weapon"
    ARMOR = "armor"
    POTION = "potion"
    SCROLL = "scroll"
    TOOL = "tool"
    TREASURE = "treasure"
    QUEST = "quest"
    ARTIFACT = "artifact"
    MISC = "misc"


@dataclass
class InventoryItem:
    """An item in the inventory."""
    id: str
    name: str
    item_type: ItemType
    rarity: ItemRarity
    quantity: int
    value: int
    weight: float
    description: str
    is_legacy: bool = False
    is_equipped: bool = False
    properties: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.properties is None:
            self.properties = {}


class InventoryComponent:
    """
    Inventory panel component for item management.
    
    Displays items with rarity colors, legacy highlighting, and equipment status.
    """
    
    def __init__(self, console: Console):
        """Initialize the inventory component."""
        self.console = console
        self.last_update = None
        self.items = []
        self.equipped_items = []
        
        # Color mappings
        self.rarity_colors = {
            ItemRarity.COMMON: "white",
            ItemRarity.UNCOMMON: "green",
            ItemRarity.RARE: "blue",
            ItemRarity.EPIC: "magenta",
            ItemRarity.LEGENDARY: "yellow",
            ItemRarity.ARTIFACT: "cyan"
        }
        
        # Type symbols
        self.type_symbols = {
            ItemType.WEAPON: "⚔",
            ItemType.ARMOR: "🛡",
            ItemType.POTION: "⚗",
            ItemType.SCROLL: "📜",
            ItemType.TOOL: "🔧",
            ItemType.TREASURE: "💎",
            ItemType.QUEST: "📋",
            ItemType.ARTIFACT: "◊",
            ItemType.MISC: "📦"
        }
        
        logger.info("Inventory Component initialized with item management")
    
    def add_item(self, item: InventoryItem) -> bool:
        """
        Add an item to the inventory.
        
        Args:
            item: Item to add
            
        Returns:
            True if item was added successfully
        """
        # Check if item already exists (stackable items)
        existing_item = self.find_item_by_id(item.id)
        if existing_item and item.item_type in [ItemType.POTION, ItemType.SCROLL]:
            existing_item.quantity += item.quantity
            return True
        
        # Add new item
        self.items.append(item)
        self.last_update = True
        return True
    
    def remove_item(self, item_id: str, quantity: int = 1) -> bool:
        """
        Remove an item from the inventory.
        
        Args:
            item_id: ID of item to remove
            quantity: Quantity to remove
            
        Returns:
            True if item was removed successfully
        """
        item = self.find_item_by_id(item_id)
        if not item:
            return False
        
        if item.quantity <= quantity:
            self.items.remove(item)
            # Unequip if equipped
            if item.is_equipped:
                self.unequip_item(item_id)
        else:
            item.quantity -= quantity
        
        self.last_update = True
        return True
    
    def equip_item(self, item_id: str) -> bool:
        """
        Equip an item.
        
        Args:
            item_id: ID of item to equip
            
        Returns:
            True if item was equipped successfully
        """
        item = self.find_item_by_id(item_id)
        if not item:
            return False
        
        # Check if item can be equipped
        if item.item_type not in [ItemType.WEAPON, ItemType.ARMOR]:
            return False
        
        # Unequip current item of same type if any
        self.unequip_item_type(item.item_type)
        
        item.is_equipped = True
        self.equipped_items.append(item_id)
        self.last_update = True
        return True
    
    def unequip_item(self, item_id: str) -> bool:
        """
        Unequip an item.
        
        Args:
            item_id: ID of item to unequip
            
        Returns:
            True if item was unequipped successfully
        """
        item = self.find_item_by_id(item_id)
        if not item:
            return False
        
        item.is_equipped = False
        if item_id in self.equipped_items:
            self.equipped_items.remove(item_id)
        
        self.last_update = True
        return True
    
    def unequip_item_type(self, item_type: ItemType) -> None:
        """Unequip all items of a specific type."""
        for item_id in self.equipped_items[:]:
            item = self.find_item_by_id(item_id)
            if item and item.item_type == item_type:
                item.is_equipped = False
                self.equipped_items.remove(item_id)
    
    def find_item_by_id(self, item_id: str) -> Optional[InventoryItem]:
        """Find an item by its ID."""
        for item in self.items:
            if item.id == item_id:
                return item
        return None
    
    def get_items_by_type(self, item_type: ItemType) -> List[InventoryItem]:
        """Get all items of a specific type."""
        return [item for item in self.items if item.item_type == item_type]
    
    def get_total_weight(self) -> float:
        """Get total weight of all items."""
        return sum(item.weight * item.quantity for item in self.items)
    
    def get_total_value(self) -> int:
        """Get total value of all items."""
        return sum(item.value * item.quantity for item in self.items)
    
    def render_inventory(self, show_equipped: bool = True) -> Panel:
        """
        Render the inventory panel.
        
        Args:
            show_equipped: Whether to show equipped items separately
            
        Returns:
            Rich Panel containing the inventory display
        """
        # Create main table
        table = Table(show_header=True, box=None, expand=True)
        table.add_column("Item", width=20, justify="left")
        table.add_column("Type", width=8, justify="center")
        table.add_column("Qty", width=4, justify="right")
        table.add_column("Value", width=8, justify="right")
        table.add_column("Weight", width=8, justify="right")
        
        # Add items
        for item in self.items:
            # Get item color based on rarity and legacy status
            base_color = self.rarity_colors[item.rarity]
            if item.is_legacy:
                color = f"bold {base_color}"
            else:
                color = base_color
            
            # Add equip indicator
            equip_indicator = "⚡" if item.is_equipped else ""
            
            # Create item name with equip indicator
            item_name = f"{equip_indicator}{item.name}"
            
            # Get type symbol
            type_symbol = self.type_symbols.get(item.item_type, "?")
            
            # Format value and weight
            value_str = f"{item.value}g" if item.value > 0 else "-"
            weight_str = f"{item.weight:.1f}" if item.weight > 0 else "-"
            
            table.add_row(
                Text(item_name, style=color),
                Text(type_symbol, style=color),
                Text(str(item.quantity), style=color),
                Text(value_str, style=color),
                Text(weight_str, style=color)
            )
        
        # Create summary
        total_weight = self.get_total_weight()
        total_value = self.get_total_value()
        item_count = len(self.items)
        legacy_count = sum(1 for item in self.items if item.is_legacy)
        
        summary = f"Items: {item_count} | Weight: {total_weight:.1f} | Value: {total_value}g"
        if legacy_count > 0:
            summary += f" | Legacy: {legacy_count}"
        
        # Create panel
        panel = Panel(
            Align.center(table),
            title=f"[bold blue]INVENTORY[/bold blue] ({summary})",
            border_style="blue",
            padding=(1, 2)
        )
        
        return panel
    
    def render_equipped_items(self) -> Optional[Panel]:
        """
        Render equipped items panel.
        
        Returns:
            Rich Panel containing equipped items or None if no equipped items
        """
        equipped = [item for item in self.items if item.is_equipped]
        
        if not equipped:
            return None
        
        # Create equipped items table
        table = Table(show_header=True, box=None, expand=True)
        table.add_column("Slot", width=8, justify="left")
        table.add_column("Item", width=20, justify="left")
        table.add_column("Rarity", width=10, justify="center")
        table.add_column("Stats", width=15, justify="left")
        
        for item in equipped:
            # Get item color
            color = self.rarity_colors[item.rarity]
            if item.is_legacy:
                color = f"bold {color}"
            
            # Get type symbol
            type_symbol = self.type_symbols.get(item.item_type, "?")
            
            # Format stats
            stats_parts = []
            if item.properties:
                for key, value in item.properties.items():
                    if key in ["damage", "armor", "bonus"]:
                        stats_parts.append(f"{key}: {value}")
            
            stats_str = ", ".join(stats_parts[:2]) if stats_parts else "-"
            
            table.add_row(
                Text(item.item_type.value.title(), style=color),
                Text(f"{type_symbol} {item.name}", style=color),
                Text(item.rarity.value.title(), style=color),
                Text(stats_str, style=color)
            )
        
        panel = Panel(
            Align.center(table),
            title="[bold yellow]EQUIPPED[/bold yellow]",
            border_style="yellow",
            padding=(1, 2)
        )
        
        return panel
    
    def update_inventory(self, items: List[InventoryItem]) -> bool:
        """
        Update the entire inventory.
        
        Args:
            items: New list of items
            
        Returns:
            True if inventory changed
        """
        # Check for changes
        if len(self.items) != len(items):
            self.items = items
            self.last_update = True
            return True
        
        # Check for item changes (simplified)
        old_ids = {item.id for item in self.items}
        new_ids = {item.id for item in items}
        
        if old_ids != new_ids:
            self.items = items
            self.last_update = True
            return True
        
        return False
    
    def get_inventory_summary(self) -> Dict[str, Any]:
        """Get a summary of current inventory for external use."""
        return {
            "total_items": len(self.items),
            "total_weight": self.get_total_weight(),
            "total_value": self.get_total_value(),
            "equipped_count": len(self.equipped_items),
            "legacy_items": sum(1 for item in self.items if item.is_legacy),
            "item_types": {item.item_type.value: self.get_items_by_type(item.item_type) for item_type in ItemType}
        }


# Export for use by other components
__all__ = ["InventoryComponent", "InventoryItem", "ItemRarity", "ItemType"]
