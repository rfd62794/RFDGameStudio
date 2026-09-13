"""
Economy Engine - Tycoon Orchestration

Sprint E3: Tycoon Orchestration - Economy Management
ADR 214: Service Layer for Financial Operations

Manages the PlayerWallet, shop inventory, and pricing.
Handles purchase transactions, race winnings, and economic balance.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time

from foundation.types import Result
from foundation.registry import DGTRegistry, RegistryType
from engines.base import BaseSystem, SystemConfig


@dataclass
class Transaction:
    """Economic transaction record"""
    transaction_id: str
    timestamp: float
    transaction_type: str  # "purchase", "winnings", "expense"
    amount: float
    description: str
    turtle_id: Optional[str] = None


@dataclass
class ShopItem:
    """Shop inventory item"""
    turtle_id: str
    price: float
    traits: Dict[str, Any]
    available: bool = True
    listed_day: int = 1


class EconomyEngine(BaseSystem):
    """
    Economy Engine - Financial Service Layer
    
    Manages all economic operations in the Tycoon game:
    - Player wallet and balance tracking
    - Turtle pricing and shop inventory
    - Purchase transactions and validation
    - Race winnings and rewards
    - Economic balance and inflation control
    """
    
    def __init__(self):
        config = SystemConfig(
            system_id="economy_engine",
            system_name="Economy Engine",
            enabled=True,
            debug_mode=False,
            auto_register=True,
            update_interval=1.0 / 5.0,  # 5Hz updates
            priority=2  # High priority
        )
        super().__init__(config)
        
        # Economic state
        self.player_wallet: float = 1000.0  # Starting money
        self.total_earnings: float = 0.0
        self.total_spent: float = 0.0
        self.transaction_history: List[Transaction] = []
        
        # Shop inventory
        self.shop_inventory: Dict[str, ShopItem] = {}
        self.base_turtle_price: float = 100.0
        self.price_multiplier: float = 1.0  # For inflation/deflation
        
        # Economic settings
        self.max_wallet_balance: float = 999999.0
        self.min_transaction_amount: float = 0.01
        self.race_winnings_multiplier: float = 1.0
        
        # Pricing factors
        self.trait_pricing = {
            'fins': 1.5,           # Swim advantage
            'feet': 1.0,           # Standard
            'claws': 1.2,          # Climbing advantage
            'large_shell': 1.3,    # Defense
            'small_shell': 0.9,    # Speed
            'high_endurance': 1.4,  # Stamina
            'high_speed': 1.6      # Racing
        }
    
    def _on_initialize(self) -> Result[bool]:
        """Initialize the economy engine"""
        try:
            # Initialize shop with default items if empty
            if not self.shop_inventory:
                self._initialize_shop()
            
            self._get_logger().info(f"💰 Economy Engine initialized")
            self._get_logger().info(f"💰 Starting wallet: ${self.player_wallet:.2f}")
            self._get_logger().info(f"🛍️ Shop inventory: {len(self.shop_inventory)} items")
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Economy Engine initialization failed: {str(e)}")
    
    def _on_shutdown(self) -> Result[None]:
        """Shutdown the economy engine"""
        try:
            # Save economic state
            self._save_economy_state()
            
            self._get_logger().info("💰 Economy Engine shutdown")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Economy Engine shutdown failed: {str(e)}")
    
    def _on_update(self, dt: float) -> Result[None]:
        """Update the economy engine"""
        try:
            # Economic balance adjustments (inflation/deflation)
            self._adjust_economic_balance(dt)
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Economy Engine update failed: {str(e)}")
    
    def _on_handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """Handle economy engine events"""
        try:
            if event_type == "purchase_turtle":
                return self.purchase_turtle(event_data.get("turtle_id"))
            elif event_type == "award_winnings":
                turtle_id = event_data.get("turtle_id")
                amount = event_data.get("amount", 0.0)
                return self.award_race_winnings(turtle_id, amount)
            elif event_type == "get_wallet_balance":
                return self.get_wallet_balance()
            elif event_type == "get_shop_inventory":
                return self.get_shop_inventory()
            elif event_type == "get_transaction_history":
                return self.get_transaction_history()
            elif event_type == "refresh_shop":
                return self.refresh_shop_inventory(event_data.get("new_items", []))
            else:
                return Result.success_result(None)
                
        except Exception as e:
            return Result.failure_result(f"Economy Engine event handling failed: {str(e)}")
    
    def purchase_turtle(self, turtle_id: str) -> Result[Dict[str, Any]]:
        """
        Purchase a turtle from the shop.
        
        Args:
            turtle_id: ID of the turtle to purchase
            
        Returns:
            Result containing purchase details or error
        """
        try:
            # Validate turtle exists in shop
            if turtle_id not in self.shop_inventory:
                return Result.failure_result(f"Turtle {turtle_id} not found in shop")
            
            shop_item = self.shop_inventory[turtle_id]
            
            if not shop_item.available:
                return Result.failure_result(f"Turtle {turtle_id} is not available")
            
            # Check wallet balance
            purchase_price = shop_item.price * self.price_multiplier
            
            if self.player_wallet < purchase_price:
                return Result.failure_result(
                    f"Insufficient funds: need ${purchase_price:.2f}, have ${self.player_wallet:.2f}"
                )
            
            # Process transaction
            self.player_wallet -= purchase_price
            self.total_spent += purchase_price
            
            # Record transaction
            transaction = Transaction(
                transaction_id=f"purchase_{int(time.time() * 1000)}",
                timestamp=time.time(),
                transaction_type="purchase",
                amount=purchase_price,
                description=f"Purchased turtle {turtle_id}",
                turtle_id=turtle_id
            )
            self.transaction_history.append(transaction)
            
            # Mark as sold
            shop_item.available = False
            
            # Update economic balance
            self._update_price_multiplier()
            
            purchase_details = {
                'turtle_id': turtle_id,
                'price': purchase_price,
                'remaining_balance': self.player_wallet,
                'transaction_id': transaction.transaction_id
            }
            
            self._get_logger().info(f"💰 Purchased turtle {turtle_id} for ${purchase_price:.2f}")
            self._get_logger().info(f"💰 Remaining balance: ${self.player_wallet:.2f}")
            
            return Result.success_result(purchase_details)
            
        except Exception as e:
            return Result.failure_result(f"Failed to purchase turtle {turtle_id}: {str(e)}")
    
    def award_race_winnings(self, turtle_id: str, amount: float) -> Result[Dict[str, Any]]:
        """
        Award race winnings to a turtle owner.
        
        Args:
            turtle_id: ID of the winning turtle
            amount: Prize money to award
            
        Returns:
            Result containing award details
        """
        try:
            if amount <= 0:
                return Result.failure_result(f"Invalid winnings amount: ${amount}")
            
            # Apply winnings multiplier
            actual_winnings = amount * self.race_winnings_multiplier
            
            # Check wallet limit
            if self.player_wallet + actual_winnings > self.max_wallet_balance:
                actual_winnings = self.max_wallet_balance - self.player_wallet
            
            # Process transaction
            self.player_wallet += actual_winnings
            self.total_earnings += actual_winnings
            
            # Record transaction
            transaction = Transaction(
                transaction_id=f"winnings_{int(time.time() * 1000)}",
                timestamp=time.time(),
                transaction_type="winnings",
                amount=actual_winnings,
                description=f"Race winnings for turtle {turtle_id}",
                turtle_id=turtle_id
            )
            self.transaction_history.append(transaction)
            
            # Update economic balance
            self._update_price_multiplier()
            
            award_details = {
                'turtle_id': turtle_id,
                'winnings': actual_winnings,
                'new_balance': self.player_wallet,
                'transaction_id': transaction.transaction_id
            }
            
            self._get_logger().info(f"💰 Awarded ${actual_winnings:.2f} for turtle {turtle_id}")
            self._get_logger().info(f"💰 New balance: ${self.player_wallet:.2f}")
            
            return Result.success_result(award_details)
            
        except Exception as e:
            return Result.failure_result(f"Failed to award winnings for turtle {turtle_id}: {str(e)}")
    
    def get_wallet_balance(self) -> Result[Dict[str, Any]]:
        """Get current wallet balance and statistics"""
        try:
            balance_info = {
                'current_balance': self.player_wallet,
                'total_earnings': self.total_earnings,
                'total_spent': self.total_spent,
                'net_profit': self.total_earnings - self.total_spent,
                'transaction_count': len(self.transaction_history)
            }
            
            return Result.success_result(balance_info)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get wallet balance: {str(e)}")
    
    def get_shop_inventory(self) -> Result[Dict[str, Any]]:
        """Get current shop inventory"""
        try:
            inventory_data = {}
            
            for turtle_id, shop_item in self.shop_inventory.items():
                if shop_item.available:
                    inventory_data[turtle_id] = {
                        'price': shop_item.price * self.price_multiplier,
                        'traits': shop_item.traits,
                        'listed_day': shop_item.listed_day
                    }
            
            return Result.success_result(inventory_data)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get shop inventory: {str(e)}")
    
    def get_transaction_history(self, limit: int = 50) -> Result[List[Dict[str, Any]]]:
        """Get transaction history"""
        try:
            recent_transactions = self.transaction_history[-limit:] if limit > 0 else self.transaction_history
            
            history_data = []
            for transaction in recent_transactions:
                history_data.append({
                    'transaction_id': transaction.transaction_id,
                    'timestamp': transaction.timestamp,
                    'type': transaction.transaction_type,
                    'amount': transaction.amount,
                    'description': transaction.description,
                    'turtle_id': transaction.turtle_id
                })
            
            return Result.success_result(history_data)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get transaction history: {str(e)}")
    
    def refresh_shop_inventory(self, new_items: List[Dict[str, Any]]) -> Result[None]:
        """
        Refresh shop inventory with new items.
        
        Args:
            new_items: List of new turtle data to add to shop
        """
        try:
            # Clear unavailable items
            self.shop_inventory = {
                tid: item for tid, item in self.shop_inventory.items() 
                if item.available
            }
            
            # Add new items
            for item_data in new_items:
                turtle_id = item_data.get('turtle_id')
                if not turtle_id:
                    continue
                
                # Calculate price based on traits
                price = self._calculate_turtle_price(item_data.get('traits', {}))
                
                shop_item = ShopItem(
                    turtle_id=turtle_id,
                    price=price,
                    traits=item_data.get('traits', {}),
                    available=True,
                    listed_day=item_data.get('listed_day', 1)
                )
                
                self.shop_inventory[turtle_id] = shop_item
            
            self._get_logger().info(f"🛍️ Refreshed shop inventory: {len(self.shop_inventory)} items")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to refresh shop inventory: {str(e)}")
    
    def _calculate_turtle_price(self, traits: Dict[str, Any]) -> float:
        """Calculate turtle price based on genetic traits"""
        try:
            base_price = self.base_turtle_price
            
            # Apply trait multipliers
            if traits.get('limb_shape') == 'fins':
                base_price *= self.trait_pricing['fins']
            elif traits.get('limb_shape') == 'claws':
                base_price *= self.trait_pricing['claws']
            
            if traits.get('shell_size_modifier', 1.0) > 1.2:
                base_price *= self.trait_pricing['large_shell']
            elif traits.get('shell_size_modifier', 1.0) < 0.8:
                base_price *= self.trait_pricing['small_shell']
            
            if traits.get('endurance', 50) > 80:
                base_price *= self.trait_pricing['high_endurance']
            
            if traits.get('max_speed', 10) > 15:
                base_price *= self.trait_pricing['high_speed']
            
            return round(base_price, 2)
            
        except Exception as e:
            self._get_logger().error(f"Failed to calculate turtle price: {e}")
            return self.base_turtle_price
    
    def _initialize_shop(self) -> None:
        """Initialize shop with default items"""
        try:
            # Create some default shop items
            default_items = [
                {
                    'turtle_id': 'shop_default_1',
                    'traits': {
                        'limb_shape': 'feet',
                        'shell_size_modifier': 1.0,
                        'endurance': 50,
                        'max_speed': 10
                    }
                },
                {
                    'turtle_id': 'shop_default_2',
                    'traits': {
                        'limb_shape': 'fins',
                        'shell_size_modifier': 0.9,
                        'endurance': 60,
                        'max_speed': 12
                    }
                },
                {
                    'turtle_id': 'shop_default_3',
                    'traits': {
                        'limb_shape': 'claws',
                        'shell_size_modifier': 1.2,
                        'endurance': 70,
                        'max_speed': 8
                    }
                }
            ]
            
            self.refresh_shop_inventory(default_items)
            
        except Exception as e:
            self._get_logger().error(f"Failed to initialize shop: {e}")
    
    def _update_price_multiplier(self) -> None:
        """Update price multiplier based on economic balance"""
        try:
            # Simple inflation/deflation logic
            if self.total_earnings > self.total_spent * 2.0:
                # Economy is booming, increase prices slightly
                self.price_multiplier = min(1.5, self.price_multiplier * 1.01)
            elif self.total_spent > self.total_earnings * 1.5:
                # Economy is slow, decrease prices slightly
                self.price_multiplier = max(0.5, self.price_multiplier * 0.99)
            
        except Exception as e:
            self._get_logger().error(f"Failed to update price multiplier: {e}")
    
    def _adjust_economic_balance(self, dt: float) -> None:
        """Adjust economic balance over time"""
        try:
            # Gradual price normalization
            if abs(self.price_multiplier - 1.0) > 0.01:
                normalization_rate = 0.001 * dt  # Very gradual
                if self.price_multiplier > 1.0:
                    self.price_multiplier = max(1.0, self.price_multiplier - normalization_rate)
                else:
                    self.price_multiplier = min(1.0, self.price_multiplier + normalization_rate)
            
        except Exception as e:
            self._get_logger().error(f"Failed to adjust economic balance: {e}")
    
    def _save_economy_state(self) -> None:
        """Save economy state to registry"""
        try:
            registry = DGTRegistry()
            
            economy_state = {
                'player_wallet': self.player_wallet,
                'total_earnings': self.total_earnings,
                'total_spent': self.total_spent,
                'price_multiplier': self.price_multiplier,
                'transaction_count': len(self.transaction_history),
                'timestamp': time.time()
            }
            
            registry.register(
                "economy_state",
                economy_state,
                RegistryType.COMPONENT,
                {
                    'system': 'economy_engine',
                    'description': 'Economic state and statistics'
                }
            )
            
        except Exception as e:
            self._get_logger().error(f"Failed to save economy state: {e}")


# === FACTORY FUNCTIONS ===

def create_economy_engine() -> EconomyEngine:
    """Create an economy engine instance"""
    return EconomyEngine()


# === EXPORTS ===

__all__ = [
    'EconomyEngine',
    'Transaction',
    'ShopItem',
    'create_economy_engine'
]
