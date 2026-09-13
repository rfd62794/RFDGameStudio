"""
Daily Cycle Manager - Tycoon Orchestration

Sprint E3: Tycoon Orchestration - Daily Cycle Management
ADR 214: Time-Slice State Machine for Persistent Gameplay

Manages the transition between "Active" state (Racing/Expo) and "Rest" state (Daily Reset).
Controls the Day counter, stamina management, and shop inventory refresh.
"""

from typing import Dict, Any, List, Optional
from dataclasses import dataclass
import time
import json
import os

from foundation.types import Result
from foundation.registry import DGTRegistry, RegistryType
from foundation.vector import Vector2
from engines.base import BaseSystem, SystemConfig


@dataclass
class DailyState:
    """State for a single day in the Tycoon cycle"""
    day_number: int
    timestamp: float
    player_wallet: float
    owned_turtles: List[str]  # Turtle IDs
    wild_turtles: List[str]   # Available for purchase
    race_results: List[Dict[str, Any]]  # Today's race results
    stamina_deductions: Dict[str, float]  # Turtle stamina changes


class CycleManager(BaseSystem):
    """
    Daily Cycle Manager - Time-Slice State Machine
    
    Manages the persistent gameplay loop including:
    - Day counter and time progression
    - Player wallet and economy
    - Turtle roster (owned vs wild)
    - Daily stamina management
    - Shop inventory refresh
    """
    
    def __init__(self):
        config = SystemConfig(
            system_id="cycle_manager",
            system_name="Daily Cycle Manager",
            enabled=True,
            debug_mode=False,
            auto_register=True,
            update_interval=1.0 / 10.0,  # 10Hz updates
            priority=1  # Highest priority system
        )
        super().__init__(config)
        
        # Game state
        self.current_day = 1
        self.player_wallet = 1000.0  # Starting money
        self.owned_turtles: List[str] = []
        self.wild_turtles: List[str] = []
        self.is_race_active = False
        self.last_save_time = 0.0
        
        # Daily cycle settings
        self.stamina_per_race = 20.0  # Stamina cost per race
        self.daily_stamina_limit = 100.0
        self.shop_refresh_count = 3  # New wild turtles per day
        
        # File paths for persistence
        self.save_file_path = "data/tycoon_save.json"
        self.stable_file_path = "data/stable.json"
        
        # Initialize save directory
        os.makedirs("data", exist_ok=True)
        
        # Load existing save or start new game
        self._load_game_state()
    
    def _on_initialize(self) -> Result[bool]:
        """Initialize the cycle manager"""
        try:
            # Generate initial wild turtles if needed
            if not self.wild_turtles:
                self._refresh_shop_inventory()
            
            self._get_logger().info(f"📅 Daily Cycle Manager initialized - Day {self.current_day}")
            self._get_logger().info(f"💰 Player wallet: ${self.player_wallet:.2f}")
            self._get_logger().info(f"🐢 Owned turtles: {len(self.owned_turtles)}")
            self._get_logger().info(f"🛍️ Wild turtles available: {len(self.wild_turtles)}")
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Cycle Manager initialization failed: {str(e)}")
    
    def _on_shutdown(self) -> Result[None]:
        """Shutdown the cycle manager"""
        try:
            # Save game state
            self._save_game_state()
            
            self._get_logger().info("📅 Daily Cycle Manager shutdown")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Cycle Manager shutdown failed: {str(e)}")
    
    def _on_update(self, dt: float) -> Result[None]:
        """Update the cycle manager"""
        try:
            # Auto-save every 30 seconds
            current_time = time.time()
            if current_time - self.last_save_time > 30.0:
                self._save_game_state()
                self.last_save_time = current_time
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Cycle Manager update failed: {str(e)}")
    
    def _on_handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """Handle cycle manager events"""
        try:
            if event_type == "advance_day":
                return self.advance_day()
            elif event_type == "purchase_turtle":
                turtle_id = event_data.get("turtle_id")
                return self.purchase_turtle(turtle_id)
            elif event_type == "start_race":
                return self.start_race(event_data.get("participant_ids", []))
            elif event_type == "end_race":
                return self.end_race(event_data.get("results", []))
            elif event_type == "get_state":
                return self.get_cycle_state()
            else:
                return Result.success_result(None)
                
        except Exception as e:
            return Result.failure_result(f"Cycle Manager event handling failed: {str(e)}")
    
    def advance_day(self) -> Result[None]:
        """
        Advance to the next day.
        
        This is the core daily cycle operation:
        1. Increment day counter
        2. Deduct stamina from all turtles
        3. Refresh shop inventory
        4. Save game state
        """
        try:
            self.current_day += 1
            
            # Deduct stamina from all owned turtles
            stamina_deductions = {}
            registry = DGTRegistry()
            
            for turtle_id in self.owned_turtles:
                # Get turtle from registry
                turtle_result = registry.get(f"entity_{turtle_id}", RegistryType.ENTITY)
                if turtle_result.success and turtle_result.value:
                    turtle = turtle_result.value
                    
                    # Deduct stamina (racing costs stamina)
                    if hasattr(turtle, 'energy'):
                        stamina_deduction = min(self.stamina_per_race, turtle.energy)
                        turtle.energy -= stamina_deduction
                        stamina_deductions[turtle_id] = stamina_deduction
                        
                        # Update turtle in registry
                        self._update_turtle_in_registry(turtle_id, turtle)
            
            # Refresh shop inventory with new wild turtles
            self._refresh_shop_inventory()
            
            # Save game state
            self._save_game_state()
            
            # Log daily summary
            self._get_logger().info(f"📅 Advanced to Day {self.current_day}")
            self._get_logger().info(f"🐢 Stamina deducted from {len(stamina_deductions)} turtles")
            self._get_logger().info(f"🛍️ Shop refreshed with {len(self.wild_turtles)} wild turtles")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to advance day: {str(e)}")
    
    def purchase_turtle(self, turtle_id: str) -> Result[None]:
        """
        Purchase a turtle from the shop.
        
        Args:
            turtle_id: ID of the turtle to purchase
            
        Returns:
            Result indicating success or failure
        """
        try:
            if turtle_id not in self.wild_turtles:
                return Result.failure_result(f"Turtle {turtle_id} not available in shop")
            
            # Get turtle price (simplified pricing based on genome)
            registry = DGTRegistry()
            turtle_result = registry.get(f"entity_{turtle_id}", RegistryType.ENTITY)
            
            if not turtle_result.success:
                return Result.failure_result(f"Turtle {turtle_id} not found in registry")
            
            turtle = turtle_result.value
            turtle_price = self._calculate_turtle_price(turtle)
            
            if self.player_wallet < turtle_price:
                return Result.failure_result(f"Insufficient funds: need ${turtle_price:.2f}, have ${self.player_wallet:.2f}")
            
            # Purchase transaction
            self.player_wallet -= turtle_price
            self.wild_turtles.remove(turtle_id)
            self.owned_turtles.append(turtle_id)
            
            # Mark turtle as owned
            if hasattr(turtle, 'metadata'):
                turtle.metadata['owned'] = True
                turtle.metadata['purchase_day'] = self.current_day
                turtle.metadata['purchase_price'] = turtle_price
            
            # Update registry
            self._update_turtle_in_registry(turtle_id, turtle)
            
            # Save game state
            self._save_game_state()
            
            self._get_logger().info(f"💰 Purchased turtle {turtle_id} for ${turtle_price:.2f}")
            self._get_logger().info(f"💰 Remaining wallet: ${self.player_wallet:.2f}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to purchase turtle {turtle_id}: {str(e)}")
    
    def start_race(self, participant_ids: List[str]) -> Result[None]:
        """Start a race with specified participants"""
        try:
            if self.is_race_active:
                return Result.failure_result("Race already active")
            
            # Validate participants
            valid_participants = []
            for pid in participant_ids:
                if pid in self.owned_turtles:
                    valid_participants.append(pid)
                else:
                    self._get_logger().warning(f"Turtle {pid} not owned, skipping")
            
            if not valid_participants:
                return Result.failure_result("No valid participants for race")
            
            self.is_race_active = True
            
            self._get_logger().info(f"🏁 Started race with {len(valid_participants)} participants")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to start race: {str(e)}")
    
    def end_race(self, results: List[Dict[str, Any]]) -> Result[None]:
        """End a race and process results"""
        try:
            if not self.is_race_active:
                return Result.failure_result("No race active")
            
            # Process race results
            for result in results:
                turtle_id = result.get("turtle_id")
                position = result.get("position", 1)
                winnings = result.get("winnings", 0.0)
                
                if turtle_id in self.owned_turtles:
                    # Award winnings
                    self.player_wallet += winnings
                    
                    # Update turtle race history
                    registry = DGTRegistry()
                    turtle_result = registry.get(f"entity_{turtle_id}", RegistryType.ENTITY)
                    
                    if turtle_result.success:
                        turtle = turtle_result.value
                        if hasattr(turtle, 'race_stats'):
                            turtle.race_stats.checkpoints_passed += 1
                            if position == 1:
                                turtle.race_stats.finish_time = time.time()
                        
                        self._update_turtle_in_registry(turtle_id, turtle)
            
            self.is_race_active = False
            
            # Save game state
            self._save_game_state()
            
            self._get_logger().info(f"🏁 Race ended - {len(results)} participants")
            self._get_logger().info(f"💰 Total winnings awarded: ${sum(r.get('winnings', 0) for r in results):.2f}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to end race: {str(e)}")
    
    def get_cycle_state(self) -> Result[Dict[str, Any]]:
        """Get current cycle state"""
        try:
            state = {
                'day': self.current_day,
                'wallet': self.player_wallet,
                'owned_turtles': self.owned_turtles.copy(),
                'wild_turtles': self.wild_turtles.copy(),
                'is_race_active': self.is_race_active,
                'shop_refresh_count': self.shop_refresh_count
            }
            
            return Result.success_result(state)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get cycle state: {str(e)}")
    
    def _refresh_shop_inventory(self) -> None:
        """Refresh shop inventory with new wild turtles"""
        try:
            from apps.tycoon.entities.turtle import create_random_turtle
            
            registry = DGTRegistry()
            new_wild_turtles = []
            
            # Generate new wild turtles
            for i in range(self.shop_refresh_count):
                turtle_id = f"wild_day{self.current_day}_{i}"
                position = (100 + i * 20, 72)  # Shop positions
                
                turtle = create_random_turtle(turtle_id, position)
                turtle.register_with_registry(registry)
                
                # Mark as wild turtle
                if hasattr(turtle, 'metadata'):
                    turtle.metadata['owned'] = False
                    turtle.metadata['wild'] = True
                    turtle.metadata['shop_day'] = self.current_day
                
                new_wild_turtles.append(turtle_id)
            
            # Replace wild turtles (clear old ones)
            self.wild_turtles = new_wild_turtles
            
            self._get_logger().info(f"🛍️ Refreshed shop with {len(new_wild_turtles)} new wild turtles")
            
        except Exception as e:
            self._get_logger().error(f"Failed to refresh shop inventory: {e}")
    
    def _calculate_turtle_price(self, turtle) -> float:
        """Calculate price for a turtle based on its genome"""
        try:
            # Simplified pricing based on genetic traits
            base_price = 100.0
            
            if hasattr(turtle, 'genome'):
                genome = turtle.genome
                
                # Price modifiers based on traits
                if genome.limb_shape.value == "fins":
                    base_price *= 1.5  # Fins are valuable for racing
                if genome.shell_size_modifier > 1.0:
                    base_price *= 1.2  # Larger shells
                if genome.leg_length > 1.0:
                    base_price *= 1.1  # Longer legs
            
            return round(base_price, 2)
            
        except Exception as e:
            self._get_logger().error(f"Failed to calculate turtle price: {e}")
            return 100.0  # Default price
    
    def _update_turtle_in_registry(self, turtle_id: str, turtle) -> None:
        """Update turtle in registry"""
        try:
            registry = DGTRegistry()
            
            # Create entity snapshot
            from foundation.protocols import EntityStateSnapshot, EntityType
            
            entity_snapshot = EntityStateSnapshot(
                entity_id=turtle_id,
                entity_type=EntityType.TURTLE,
                position=turtle.position,
                velocity=turtle.velocity,
                radius=getattr(turtle, 'radius', 5.0),
                active=turtle.active,
                metadata=getattr(turtle, 'metadata', {})
            )
            
            registry.register_entity_state(turtle_id, entity_snapshot)
            
        except Exception as e:
            self._get_logger().error(f"Failed to update turtle in registry: {e}")
    
    def _save_game_state(self) -> None:
        """Save game state to file"""
        try:
            save_data = {
                'current_day': self.current_day,
                'player_wallet': self.player_wallet,
                'owned_turtles': self.owned_turtles,
                'wild_turtles': self.wild_turtles,
                'timestamp': time.time()
            }
            
            with open(self.save_file_path, 'w') as f:
                json.dump(save_data, f, indent=2)
            
            # Save stable data separately
            self._save_stable_data()
            
        except Exception as e:
            self._get_logger().error(f"Failed to save game state: {e}")
    
    def _load_game_state(self) -> None:
        """Load game state from file"""
        try:
            if os.path.exists(self.save_file_path):
                with open(self.save_file_path, 'r') as f:
                    save_data = json.load(f)
                
                self.current_day = save_data.get('current_day', 1)
                self.player_wallet = save_data.get('player_wallet', 1000.0)
                self.owned_turtles = save_data.get('owned_turtles', [])
                self.wild_turtles = save_data.get('wild_turtles', [])
                
                self._get_logger().info(f"📅 Loaded game state - Day {self.current_day}")
                self._get_logger().info(f"💰 Player wallet: ${self.player_wallet:.2f}")
                self._get_logger().info(f"🐢 Owned turtles: {len(self.owned_turtles)}")
            else:
                self._get_logger().info("📅 Starting new game")
                
        except Exception as e:
            self._get_logger().error(f"Failed to load game state: {e}")
            # Start with default values on error
    
    def _save_stable_data(self) -> None:
        """Save stable (turtle roster) data to file"""
        try:
            registry = DGTRegistry()
            stable_data = {}
            
            # Save all owned turtles
            for turtle_id in self.owned_turtles:
                turtle_result = registry.get(f"entity_{turtle_id}", RegistryType.ENTITY)
                if turtle_result.success:
                    turtle = turtle_result.value
                    stable_data[turtle_id] = turtle.get_state_dict()
            
            with open(self.stable_file_path, 'w') as f:
                json.dump(stable_data, f, indent=2)
            
        except Exception as e:
            self._get_logger().error(f"Failed to save stable data: {e}")


# === FACTORY FUNCTIONS ===

def create_cycle_manager() -> CycleManager:
    """Create a cycle manager instance"""
    return CycleManager()


# === EXPORTS ===

__all__ = [
    'CycleManager',
    'DailyState',
    'create_cycle_manager'
]
