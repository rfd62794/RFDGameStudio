"""
DGT Registry Bridge - Transaction-Safe State Management
Connects UI views to the foundation registry with proper transaction handling
"""

from typing import Dict, Any, List, Optional, Tuple
import logging
import json
from pathlib import Path

from foundation.registry import DGTRegistry, RegistryType, Result
from foundation.types import ValidationResult


class RegistryBridge:
    """
    Bridge between UI views and DGT Registry with transaction safety.
    Ensures all state changes are atomic and properly validated.
    """
    
    def __init__(self, registry: DGTRegistry, save_file_path: Optional[Path] = None):
        self.registry = registry
        self.save_file_path = save_file_path or Path("data/player_state.json")
        self.logger = logging.getLogger(__name__)
        
        # Transaction state
        self._pending_transactions = {}
        self._transaction_counter = 0
        
        # Player state cache
        self._player_state = {
            'money': 1000,
            'turtles': {},
            'inventory': [],
            'statistics': {
                'total_breeds': 0,
                'total_purchases': 0,
                'total_races': 0
            }
        }
        
        # Load existing state
        self._load_player_state()
        
        self.logger.info("RegistryBridge initialized with transaction safety")
    
    def _load_player_state(self) -> None:
        """Load player state from file with validation"""
        try:
            if self.save_file_path.exists():
                with open(self.save_file_path, 'r') as f:
                    loaded_state = json.load(f)
                
                # Validate loaded state
                if self._validate_player_state(loaded_state):
                    self._player_state = loaded_state
                    self.logger.info("Player state loaded successfully")
                else:
                    self.logger.warning("Invalid player state file, using defaults")
            else:
                self.logger.info("No existing player state, using defaults")
                
        except Exception as e:
            self.logger.error(f"Failed to load player state: {e}")
    
    def _save_player_state(self) -> bool:
        """Save player state to file with error handling"""
        try:
            # Ensure directory exists
            self.save_file_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Create backup before saving
            if self.save_file_path.exists():
                backup_path = self.save_file_path.with_suffix('.json.bak')
                self.save_file_path.rename(backup_path)
            
            # Save new state
            with open(self.save_file_path, 'w') as f:
                json.dump(self._player_state, f, indent=2)
            
            self.logger.debug("Player state saved successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to save player state: {e}")
            return False
    
    def _validate_player_state(self, state: Dict[str, Any]) -> bool:
        """Validate player state structure"""
        required_keys = ['money', 'turtles', 'inventory', 'statistics']
        
        if not all(key in state for key in required_keys):
            return False
        
        # Validate money is non-negative integer
        if not isinstance(state['money'], int) or state['money'] < 0:
            return False
        
        # Validate turtles is a dict
        if not isinstance(state['turtles'], dict):
            return False
        
        # Validate inventory is a list
        if not isinstance(state['inventory'], list):
            return False
        
        return True
    
    def begin_transaction(self, transaction_type: str) -> str:
        """
        Begin a new transaction for atomic state changes.
        
        Args:
            transaction_type: Type of transaction (breed, purchase, etc.)
            
        Returns:
            Transaction ID
        """
        transaction_id = f"tx_{transaction_type}_{self._transaction_counter}"
        self._transaction_counter += 1
        
        self._pending_transactions[transaction_id] = {
            'type': transaction_type,
            'changes': [],
            'timestamp': self._get_timestamp(),
            'status': 'pending'
        }
        
        self.logger.debug(f"Started transaction: {transaction_id}")
        return transaction_id
    
    def add_transaction_change(self, transaction_id: str, change_type: str, 
                             old_value: Any, new_value: Any) -> bool:
        """
        Add a change to a pending transaction.
        
        Args:
            transaction_id: Transaction ID
            change_type: Type of change (money, turtle, inventory, etc.)
            old_value: Previous value
            new_value: New value
            
        Returns:
            True if change added successfully
        """
        if transaction_id not in self._pending_transactions:
            self.logger.error(f"Transaction not found: {transaction_id}")
            return False
        
        change = {
            'type': change_type,
            'old_value': old_value,
            'new_value': new_value,
            'timestamp': self._get_timestamp()
        }
        
        self._pending_transactions[transaction_id]['changes'].append(change)
        return True
    
    def commit_transaction(self, transaction_id: str) -> Result[bool]:
        """
        Commit a transaction, applying all changes atomically.
        
        Args:
            transaction_id: Transaction ID
            
        Returns:
            Result indicating success or failure
        """
        if transaction_id not in self._pending_transactions:
            return Result.failure_result("Transaction not found")
        
        transaction = self._pending_transactions[transaction_id]
        
        try:
            # Apply all changes
            for change in transaction['changes']:
                self._apply_change(change)
            
            # Mark transaction as committed
            transaction['status'] = 'committed'
            
            # Save state to file
            if self._save_player_state():
                self.logger.info(f"Transaction committed: {transaction_id}")
                return Result.success_result(True)
            else:
                # Rollback on save failure
                self._rollback_transaction(transaction_id)
                return Result.failure_result("Failed to save state, transaction rolled back")
                
        except Exception as e:
            # Rollback on error
            self._rollback_transaction(transaction_id)
            return Result.failure_result(f"Transaction failed: {str(e)}")
        
        finally:
            # Clean up transaction
            if transaction_id in self._pending_transactions:
                del self._pending_transactions[transaction_id]
    
    def _apply_change(self, change: Dict[str, Any]) -> None:
        """Apply a single change to player state"""
        change_type = change['type']
        new_value = change['new_value']
        
        if change_type == 'money':
            self._player_state['money'] = new_value
        elif change_type == 'turtle_add':
            turtle_id = new_value['id']
            self._player_state['turtles'][turtle_id] = new_value
        elif change_type == 'turtle_remove':
            turtle_id = new_value
            if turtle_id in self._player_state['turtles']:
                del self._player_state['turtles'][turtle_id]
        elif change_type == 'inventory_add':
            self._player_state['inventory'].append(new_value)
        elif change_type == 'inventory_remove':
            if new_value in self._player_state['inventory']:
                self._player_state['inventory'].remove(new_value)
        elif change_type == 'statistics':
            self._player_state['statistics'].update(new_value)
    
    def _rollback_transaction(self, transaction_id: str) -> None:
        """Rollback a transaction by reversing all changes"""
        if transaction_id not in self._pending_transactions:
            return
        
        transaction = self._pending_transactions[transaction_id]
        
        # Reverse changes in opposite order
        for change in reversed(transaction['changes']):
            reverse_change = {
                'type': change['type'],
                'new_value': change['old_value']
            }
            self._apply_change(reverse_change)
        
        transaction['status'] = 'rolled_back'
        self.logger.warning(f"Transaction rolled back: {transaction_id}")
        
        # Clean up
        del self._pending_transactions[transaction_id]
    
    # UI Integration Methods
    
    def get_player_money(self) -> int:
        """Get player's current money"""
        return self._player_state['money']
    
    def set_player_money(self, new_amount: int) -> Result[bool]:
        """Set player money with transaction safety"""
        if new_amount < 0:
            return Result.failure_result("Money cannot be negative")
        
        old_amount = self._player_state['money']
        
        # Begin transaction
        tx_id = self.begin_transaction('money_change')
        self.add_transaction_change(tx_id, 'money', old_amount, new_amount)
        
        # Commit transaction
        return self.commit_transaction(tx_id)
    
    def get_all_turtles(self) -> List[Dict[str, Any]]:
        """Get all player turtles"""
        return list(self._player_state['turtles'].values())
    
    def get_turtle(self, turtle_id: str) -> Optional[Dict[str, Any]]:
        """Get specific turtle by ID"""
        return self._player_state['turtles'].get(turtle_id)
    
    def add_turtle(self, turtle_data: Dict[str, Any]) -> Result[bool]:
        """Add a new turtle to the player's collection"""
        turtle_id = turtle_data.get('id')
        if not turtle_id:
            return Result.failure_result("Turtle must have an ID")
        
        if turtle_id in self._player_state['turtles']:
            return Result.failure_result("Turtle already exists")
        
        # Begin transaction
        tx_id = self.begin_transaction('turtle_add')
        self.add_transaction_change(tx_id, 'turtle_add', None, turtle_data)
        
        # Update statistics
        old_stats = self._player_state['statistics'].copy()
        new_stats = old_stats.copy()
        new_stats['total_breeds'] = new_stats.get('total_breeds', 0) + 1
        self.add_transaction_change(tx_id, 'statistics', old_stats, new_stats)
        
        # Commit transaction
        return self.commit_transaction(tx_id)
    
    def get_turtles_for_breeding(self) -> List[Dict[str, Any]]:
        """Get turtles available for breeding (not retired)"""
        return [
            turtle for turtle in self._player_state['turtles'].values()
            if not turtle.get('is_retired', False)
        ]
    
    def get_shop_items(self) -> List[Dict[str, Any]]:
        """Get available shop items"""
        # In a real implementation, this would query the registry
        # For now, return mock data
        return [
            {
                'id': 'turtle_common_1',
                'name': 'Common TurboShell',
                'description': 'A reliable racing turtle',
                'price': 100,
                'rarity': 'common',
                'category': 'turtles',
                'stock': 5
            },
            {
                'id': 'turtle_rare_1',
                'name': 'Rare Speedster',
                'description': 'Exceptionally fast turtle',
                'price': 250,
                'rarity': 'rare',
                'category': 'turtles',
                'stock': 2
            },
            {
                'id': 'item_speed_boost',
                'name': 'Speed Boost',
                'description': 'Temporary speed enhancement',
                'price': 150,
                'rarity': 'common',
                'category': 'items',
                'stock': 10
            }
        ]
    
    def refresh_shop_items(self) -> List[Dict[str, Any]]:
        """Refresh shop items (simulates daily refresh)"""
        # In a real implementation, this would regenerate shop inventory
        import random
        
        items = self.get_shop_items()
        
        # Randomize stock
        for item in items:
            item['stock'] = random.randint(1, 10)
        
        return items
    
    def add_item_to_inventory(self, item_data: Dict[str, Any]) -> Result[bool]:
        """Add an item to player inventory"""
        # Begin transaction
        tx_id = self.begin_transaction('inventory_add')
        self.add_transaction_change(tx_id, 'inventory_add', None, item_data)
        
        # Update statistics
        old_stats = self._player_state['statistics'].copy()
        new_stats = old_stats.copy()
        new_stats['total_purchases'] = new_stats.get('total_purchases', 0) + 1
        self.add_transaction_change(tx_id, 'statistics', old_stats, new_stats)
        
        # Commit transaction
        return self.commit_transaction(tx_id)
    
    def get_player_statistics(self) -> Dict[str, Any]:
        """Get player statistics"""
        return self._player_state['statistics'].copy()
    
    def validate_purchase(self, item_data: Dict[str, Any]) -> Result[bool]:
        """Validate if player can purchase an item"""
        price = item_data.get('price', 0)
        stock = item_data.get('stock', 0)
        
        if self._player_state['money'] < price:
            return Result.failure_result("Insufficient funds")
        
        if stock <= 0:
            return Result.failure_result("Item out of stock")
        
        return Result.success_result(True)
    
    def process_breeding(self, parent1_id: str, parent2_id: str, cost: int) -> Result[Dict[str, Any]]:
        """
        Process breeding with transaction safety.
        
        Args:
            parent1_id: First parent turtle ID
            parent2_id: Second parent turtle ID
            cost: Breeding cost
            
        Returns:
            Result with offspring data
        """
        # Validate parents exist and can breed
        parent1 = self.get_turtle(parent1_id)
        parent2 = self.get_turtle(parent2_id)
        
        if not parent1 or not parent2:
            return Result.failure_result("Parent turtles not found")
        
        if parent1.get('is_retired', False) or parent2.get('is_retired', False):
            return Result.failure_result("Retired turtles cannot breed")
        
        if self._player_state['money'] < cost:
            return Result.failure_result("Insufficient funds for breeding")
        
        # Begin transaction
        tx_id = self.begin_transaction('breeding')
        
        # Deduct money
        old_money = self._player_state['money']
        new_money = old_money - cost
        self.add_transaction_change(tx_id, 'money', old_money, new_money)
        
        # Generate offspring (simplified)
        import random
        offspring_id = f"offspring_{parent1_id}_{parent2_id}_{self._get_timestamp()}"
        offspring = {
            'id': offspring_id,
            'name': f"TurboShell {random.randint(1000, 9999)}",
            'genetics': {
                'shell_base_color': random.choice(['green', 'blue', 'red', 'yellow']),
                'speed_gene': random.uniform(0.5, 1.0),
                'endurance_gene': random.uniform(0.5, 1.0)
            },
            'stats': {
                'speed': random.randint(50, 100),
                'endurance': random.randint(50, 100),
                'strength': random.randint(50, 100)
            },
            'generation': max(parent1.get('generation', 1), parent2.get('generation', 1)) + 1,
            'rarity': random.choice(['common', 'rare', 'epic']),
            'is_retired': False
        }
        
        # Add offspring
        self.add_transaction_change(tx_id, 'turtle_add', None, offspring)
        
        # Update statistics
        old_stats = self._player_state['statistics'].copy()
        new_stats = old_stats.copy()
        new_stats['total_breeds'] = new_stats.get('total_breeds', 0) + 1
        self.add_transaction_change(tx_id, 'statistics', old_stats, new_stats)
        
        # Commit transaction
        result = self.commit_transaction(tx_id)
        
        if result.success:
            return Result.success_result({
                'offspring': offspring,
                'cost': cost,
                'remaining_money': new_money
            })
        else:
            return result
    
    def _get_timestamp(self) -> int:
        """Get current timestamp"""
        import time
        return int(time.time())
    
    def get_registry_info(self) -> Dict[str, Any]:
        """Get registry information for debugging"""
        return {
            'total_turtles': len(self._player_state['turtles']),
            'total_inventory': len(self._player_state['inventory']),
            'player_money': self._player_state['money'],
            'pending_transactions': len(self._pending_transactions),
            'transaction_counter': self._transaction_counter,
            'save_file': str(self.save_file_path)
        }
