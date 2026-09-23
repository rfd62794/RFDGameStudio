"""
Stable Manager - Tycoon Orchestration

Sprint E3: Tycoon Orchestration - Roster Management
ADR 214: Repository Pattern for Turtle Storage

Handles the "Stable" (Storage of owned turtles) and manages the distinction
between "Owned" vs "Wild" turtles. Ensures owned turtles are persisted.
"""

from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass
import json
import os
import time

from foundation.types import Result
from foundation.registry import DGTRegistry, RegistryType
from foundation.vector import Vector2
from engines.base import BaseSystem, SystemConfig


@dataclass
class StableEntry:
    """Entry in the turtle stable"""
    turtle_id: str
    acquisition_day: int
    acquisition_price: float
    acquisition_method: str  # "purchase", "breeding", "found"
    current_stamina: float
    max_stamina: float
    race_count: int
    wins: int
    total_earnings: float
    last_race_day: int
    active: bool = True


@dataclass
class TurtleStats:
    """Aggregated statistics for a turtle"""
    turtle_id: str
    days_owned: int
    total_races: int
    win_rate: float
    average_earnings: float
    peak_performance: float
    current_value: float


class StableManager(BaseSystem):
    """
    Stable Manager - Repository Pattern for Turtle Storage
    
    Manages the turtle roster and persistence:
    - Distinguishes between owned and wild turtles
    - Tracks turtle acquisition and performance
    - Manages stamina and rest cycles
    - Persists stable data to stable.json
    - Provides roster statistics and analytics
    """
    
    def __init__(self):
        config = SystemConfig(
            system_id="stable_manager",
            system_name="Stable Manager",
            enabled=True,
            debug_mode=False,
            auto_register=True,
            update_interval=1.0 / 2.0,  # 2Hz updates
            priority=3  # High priority
        )
        super().__init__(config)
        
        # Stable data
        self.stable_entries: Dict[str, StableEntry] = {}
        self.owned_turtle_ids: Set[str] = set()
        self.wild_turtle_ids: Set[str] = set()
        
        # Stable settings
        self.max_stable_capacity: int = 20
        self.stamina_recovery_rate: float = 10.0  # Per day
        self.max_stamina: float = 100.0
        self.min_stamina_for_race: float = 20.0
        
        # File paths
        self.stable_file_path: str = "data/stable.json"
        self.backup_file_path: str = "data/stable_backup.json"
        
        # Ensure data directory exists
        os.makedirs("data", exist_ok=True)
        
        # Load existing stable data
        self._load_stable_data()
    
    def _on_initialize(self) -> Result[bool]:
        """Initialize the stable manager"""
        try:
            # Sync with registry to ensure consistency
            self._sync_with_registry()
            
            self._get_logger().info(f"🐢 Stable Manager initialized")
            self._get_logger().info(f"🐢 Owned turtles: {len(self.owned_turtle_ids)}")
            self._get_logger().info(f"🌊 Wild turtles: {len(self.wild_turtle_ids)}")
            self._get_logger().info(f"📊 Stable capacity: {len(self.stable_entries)}/{self.max_stable_capacity}")
            
            return Result.success_result(True)
            
        except Exception as e:
            return Result.failure_result(f"Stable Manager initialization failed: {str(e)}")
    
    def _on_shutdown(self) -> Result[None]:
        """Shutdown the stable manager"""
        try:
            # Save stable data
            self._save_stable_data()
            self._create_backup()
            
            self._get_logger().info("🐢 Stable Manager shutdown")
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Stable Manager shutdown failed: {str(e)}")
    
    def _on_update(self, dt: float) -> Result[None]:
        """Update the stable manager"""
        try:
            # Update stamina recovery for owned turtles
            self._update_stamina_recovery(dt)
            
            # Sync with registry periodically
            if int(time.time()) % 60 == 0:  # Every minute
                self._sync_with_registry()
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Stable Manager update failed: {str(e)}")
    
    def _on_handle_event(self, event_type: str, event_data: Dict[str, Any]) -> Result[None]:
        """Handle stable manager events"""
        try:
            if event_type == "add_to_stable":
                return self.add_turtle_to_stable(
                    event_data.get("turtle_id"),
                    event_data.get("acquisition_method", "purchase"),
                    event_data.get("price", 0.0)
                )
            elif event_type == "remove_from_stable":
                return self.remove_turtle_from_stable(event_data.get("turtle_id"))
            elif event_type == "get_stable_roster":
                return self.get_stable_roster()
            elif event_type == "get_turtle_stats":
                return self.get_turtle_statistics(event_data.get("turtle_id"))
            elif event_type == "update_race_result":
                return self.update_race_result(
                    event_data.get("turtle_id"),
                    event_data.get("position", 1),
                    event_data.get("winnings", 0.0),
                    event_data.get("race_day", 1)
                )
            elif event_type == "rest_turtle":
                return self.rest_turtle(event_data.get("turtle_id"))
            elif event_type == "get_available_for_race":
                return self.get_available_turtles_for_race()
            else:
                return Result.success_result(None)
                
        except Exception as e:
            return Result.failure_result(f"Stable Manager event handling failed: {str(e)}")
    
    def add_turtle_to_stable(self, turtle_id: str, acquisition_method: str = "purchase", price: float = 0.0) -> Result[None]:
        """
        Add a turtle to the stable.
        
        Args:
            turtle_id: ID of the turtle to add
            acquisition_method: How the turtle was acquired
            price: Price paid for the turtle
            
        Returns:
            Result indicating success or failure
        """
        try:
            if turtle_id in self.owned_turtle_ids:
                return Result.failure_result(f"Turtle {turtle_id} already in stable")
            
            if len(self.owned_turtle_ids) >= self.max_stable_capacity:
                return Result.failure_result(f"Stable is full ({self.max_stable_capacity} capacity)")
            
            # Get current day from cycle manager
            current_day = self._get_current_day()
            
            # Create stable entry
            stable_entry = StableEntry(
                turtle_id=turtle_id,
                acquisition_day=current_day,
                acquisition_price=price,
                acquisition_method=acquisition_method,
                current_stamina=self.max_stamina,
                max_stamina=self.max_stamina,
                race_count=0,
                wins=0,
                total_earnings=0.0,
                last_race_day=0
            )
            
            # Add to stable
            self.stable_entries[turtle_id] = stable_entry
            self.owned_turtle_ids.add(turtle_id)
            
            # Remove from wild if present
            self.wild_turtle_ids.discard(turtle_id)
            
            # Mark turtle as owned in registry
            self._mark_turtle_as_owned(turtle_id, True)
            
            # Save stable data
            self._save_stable_data()
            
            self._get_logger().info(f"🐢 Added turtle {turtle_id} to stable ({acquisition_method})")
            self._get_logger().info(f"📊 Stable size: {len(self.owned_turtle_ids)}/{self.max_stable_capacity}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to add turtle {turtle_id} to stable: {str(e)}")
    
    def remove_turtle_from_stable(self, turtle_id: str) -> Result[None]:
        """
        Remove a turtle from the stable.
        
        Args:
            turtle_id: ID of the turtle to remove
            
        Returns:
            Result indicating success or failure
        """
        try:
            if turtle_id not in self.owned_turtle_ids:
                return Result.failure_result(f"Turtle {turtle_id} not in stable")
            
            # Remove from stable
            del self.stable_entries[turtle_id]
            self.owned_turtle_ids.remove(turtle_id)
            
            # Mark turtle as not owned in registry
            self._mark_turtle_as_owned(turtle_id, False)
            
            # Save stable data
            self._save_stable_data()
            
            self._get_logger().info(f"🐢 Removed turtle {turtle_id} from stable")
            self._get_logger().info(f"📊 Stable size: {len(self.owned_turtle_ids)}/{self.max_stable_capacity}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to remove turtle {turtle_id} from stable: {str(e)}")
    
    def update_race_result(self, turtle_id: str, position: int, winnings: float, race_day: int) -> Result[None]:
        """
        Update turtle statistics after a race.
        
        Args:
            turtle_id: ID of the turtle
            position: Finishing position (1 = first place)
            winnings: Prize money won
            race_day: Day the race occurred
            
        Returns:
            Result indicating success or failure
        """
        try:
            if turtle_id not in self.owned_turtle_ids:
                return Result.failure_result(f"Turtle {turtle_id} not in stable")
            
            stable_entry = self.stable_entries[turtle_id]
            
            # Update statistics
            stable_entry.race_count += 1
            stable_entry.last_race_day = race_day
            stable_entry.total_earnings += winnings
            
            if position == 1:
                stable_entry.wins += 1
            
            # Deduct stamina for racing
            stamina_cost = 20.0  # Fixed cost per race
            stable_entry.current_stamina = max(0, stable_entry.current_stamina - stamina_cost)
            
            # Save stable data
            self._save_stable_data()
            
            self._get_logger().info(f"🏁 Updated race result for {turtle_id}: position {position}, ${winnings:.2f}")
            self._get_logger().info(f"⚡ Stamina: {stable_entry.current_stamina:.1f}/{stable_entry.max_stamina}")
            
            return Result.success_result(None)
            
        except Exception as e:
            return Result.failure_result(f"Failed to update race result for {turtle_id}: {str(e)}")
    
    def rest_turtle(self, turtle_id: str) -> Result[Dict[str, Any]]:
        """
        Rest a turtle to recover stamina.
        
        Args:
            turtle_id: ID of the turtle to rest
            
        Returns:
            Result containing rest results
        """
        try:
            if turtle_id not in self.owned_turtle_ids:
                return Result.failure_result(f"Turtle {turtle_id} not in stable")
            
            stable_entry = self.stable_entries[turtle_id]
            
            # Full rest - recover all stamina
            stamina_recovered = stable_entry.max_stamina - stable_entry.current_stamina
            stable_entry.current_stamina = stable_entry.max_stamina
            
            # Save stable data
            self._save_stable_data()
            
            rest_results = {
                'turtle_id': turtle_id,
                'stamina_recovered': stamina_recovered,
                'current_stamina': stable_entry.current_stamina,
                'max_stamina': stable_entry.max_stamina
            }
            
            self._get_logger().info(f"😴 Rested turtle {turtle_id}: recovered {stamina_recovered:.1f} stamina")
            
            return Result.success_result(rest_results)
            
        except Exception as e:
            return Result.failure_result(f"Failed to rest turtle {turtle_id}: {str(e)}")
    
    def get_stable_roster(self) -> Result[Dict[str, Any]]:
        """Get the complete stable roster"""
        try:
            roster_data = {
                'owned_turtles': [],
                'wild_turtles': list(self.wild_turtle_ids),
                'stable_capacity': {
                    'current': len(self.owned_turtle_ids),
                    'maximum': self.max_stable_capacity
                }
            }
            
            # Add owned turtle details
            for turtle_id in self.owned_turtle_ids:
                if turtle_id in self.stable_entries:
                    entry = self.stable_entries[turtle_id]
                    turtle_data = {
                        'turtle_id': turtle_id,
                        'acquisition_day': entry.acquisition_day,
                        'acquisition_method': entry.acquisition_method,
                        'acquisition_price': entry.acquisition_price,
                        'current_stamina': entry.current_stamina,
                        'max_stamina': entry.max_stamina,
                        'race_count': entry.race_count,
                        'wins': entry.wins,
                        'total_earnings': entry.total_earnings,
                        'win_rate': entry.wins / max(1, entry.race_count),
                        'days_owned': self._get_current_day() - entry.acquisition_day,
                        'available_for_race': entry.current_stamina >= self.min_stamina_for_race
                    }
                    roster_data['owned_turtles'].append(turtle_data)
            
            return Result.success_result(roster_data)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get stable roster: {str(e)}")
    
    def get_turtle_statistics(self, turtle_id: str) -> Result[Dict[str, Any]]:
        """Get detailed statistics for a specific turtle"""
        try:
            if turtle_id not in self.stable_entries:
                return Result.failure_result(f"Turtle {turtle_id} not in stable")
            
            entry = self.stable_entries[turtle_id]
            current_day = self._get_current_day()
            
            stats = {
                'turtle_id': turtle_id,
                'days_owned': current_day - entry.acquisition_day,
                'total_races': entry.race_count,
                'wins': entry.wins,
                'win_rate': entry.wins / max(1, entry.race_count),
                'total_earnings': entry.total_earnings,
                'average_earnings': entry.total_earnings / max(1, entry.race_count),
                'current_stamina': entry.current_stamina,
                'max_stamina': entry.max_stamina,
                'stamina_percentage': (entry.current_stamina / entry.max_stamina) * 100,
                'acquisition_price': entry.acquisition_price,
                'current_value': entry.acquisition_price + entry.total_earnings,
                'last_race_day': entry.last_race_day,
                'available_for_race': entry.current_stamina >= self.min_stamina_for_race
            }
            
            return Result.success_result(stats)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get statistics for turtle {turtle_id}: {str(e)}")
    
    def get_available_turtles_for_race(self) -> Result[List[str]]:
        """Get list of turtles available for racing"""
        try:
            available_turtles = []
            
            for turtle_id in self.owned_turtle_ids:
                if turtle_id in self.stable_entries:
                    entry = self.stable_entries[turtle_id]
                    if entry.current_stamina >= self.min_stamina_for_race:
                        available_turtles.append(turtle_id)
            
            return Result.success_result(available_turtles)
            
        except Exception as e:
            return Result.failure_result(f"Failed to get available turtles: {str(e)}")
    
    def _update_stamina_recovery(self, dt: float) -> None:
        """Update stamina recovery for all owned turtles"""
        try:
            recovery_rate = self.stamina_recovery_rate * dt / 3600.0  # Convert to hourly rate
            
            for turtle_id in self.owned_turtle_ids:
                if turtle_id in self.stable_entries:
                    entry = self.stable_entries[turtle_id]
                    
                    # Recover stamina if not at max
                    if entry.current_stamina < entry.max_stamina:
                        recovery = min(recovery_rate, entry.max_stamina - entry.current_stamina)
                        entry.current_stamina += recovery
            
        except Exception as e:
            self._get_logger().error(f"Failed to update stamina recovery: {e}")
    
    def _sync_with_registry(self) -> None:
        """Sync stable data with registry"""
        try:
            registry = DGTRegistry()
            
            # Get all entities from registry
            snapshot_result = registry.get_world_snapshot()
            if not snapshot_result.success:
                return
            
            # Update wild turtle IDs
            self.wild_turtle_ids.clear()
            for entity in snapshot_result.value.entities:
                if entity.entity_id.startswith('entity_'):
                    turtle_id = entity.entity_id.replace('entity_', '')
                    
                    # Check if turtle is marked as wild
                    if entity.metadata.get('wild', False):
                        self.wild_turtle_ids.add(turtle_id)
            
        except Exception as e:
            self._get_logger().error(f"Failed to sync with registry: {e}")
    
    def _mark_turtle_as_owned(self, turtle_id: str, owned: bool) -> None:
        """Mark turtle as owned or wild in registry"""
        try:
            registry = DGTRegistry()
            
            entity_result = registry.get(f"entity_{turtle_id}", RegistryType.ENTITY)
            if entity_result.success:
                entity = entity_result.value
                
                if hasattr(entity, 'metadata'):
                    entity.metadata['owned'] = owned
                    entity.metadata['wild'] = not owned
                    
                    # Update entity in registry
                    from foundation.protocols import EntityStateSnapshot, EntityType
                    
                    entity_snapshot = EntityStateSnapshot(
                        entity_id=turtle_id,
                        entity_type=EntityType.TURTLE,
                        position=entity.position,
                        velocity=entity.velocity,
                        radius=getattr(entity, 'radius', 5.0),
                        active=entity.active,
                        metadata=entity.metadata
                    )
                    
                    registry.register_entity_state(turtle_id, entity_snapshot)
            
        except Exception as e:
            self._get_logger().error(f"Failed to mark turtle {turtle_id} as owned: {e}")
    
    def _get_current_day(self) -> int:
        """Get current day from cycle manager"""
        try:
            registry = DGTRegistry()
            
            # Try to get cycle manager state
            cycle_result = registry.get("cycle_manager_state", RegistryType.COMPONENT)
            if cycle_result.success:
                return cycle_result.value.get('current_day', 1)
            
            return 1  # Default to day 1
            
        except Exception as e:
            self._get_logger().error(f"Failed to get current day: {e}")
            return 1
    
    def _save_stable_data(self) -> None:
        """Save stable data to file"""
        try:
            stable_data = {
                'stable_entries': {},
                'owned_turtle_ids': list(self.owned_turtle_ids),
                'wild_turtle_ids': list(self.wild_turtle_ids),
                'timestamp': time.time()
            }
            
            # Convert stable entries to dictionaries
            for turtle_id, entry in self.stable_entries.items():
                stable_data['stable_entries'][turtle_id] = {
                    'turtle_id': entry.turtle_id,
                    'acquisition_day': entry.acquisition_day,
                    'acquisition_price': entry.acquisition_price,
                    'acquisition_method': entry.acquisition_method,
                    'current_stamina': entry.current_stamina,
                    'max_stamina': entry.max_stamina,
                    'race_count': entry.race_count,
                    'wins': entry.wins,
                    'total_earnings': entry.total_earnings,
                    'last_race_day': entry.last_race_day,
                    'active': entry.active
                }
            
            # Save to file
            with open(self.stable_file_path, 'w') as f:
                json.dump(stable_data, f, indent=2)
            
        except Exception as e:
            self._get_logger().error(f"Failed to save stable data: {e}")
    
    def _load_stable_data(self) -> None:
        """Load stable data from file"""
        try:
            if os.path.exists(self.stable_file_path):
                with open(self.stable_file_path, 'r') as f:
                    stable_data = json.load(f)
                
                # Load stable entries
                for turtle_id, entry_data in stable_data.get('stable_entries', {}).items():
                    self.stable_entries[turtle_id] = StableEntry(**entry_data)
                
                # Load turtle IDs
                self.owned_turtle_ids = set(stable_data.get('owned_turtle_ids', []))
                self.wild_turtle_ids = set(stable_data.get('wild_turtle_ids', []))
                
                self._get_logger().info(f"🐢 Loaded stable data: {len(self.owned_turtle_ids)} owned turtles")
            else:
                self._get_logger().info("🐢 Starting with empty stable")
                
        except Exception as e:
            self._get_logger().error(f"Failed to load stable data: {e}")
            # Start with empty stable on error
    
    def _create_backup(self) -> None:
        """Create backup of stable data"""
        try:
            if os.path.exists(self.stable_file_path):
                import shutil
                shutil.copy2(self.stable_file_path, self.backup_file_path)
                
        except Exception as e:
            self._get_logger().error(f"Failed to create backup: {e}")


# === FACTORY FUNCTIONS ===

def create_stable_manager() -> StableManager:
    """Create a stable manager instance"""
    return StableManager()


# === EXPORTS ===

__all__ = [
    'StableManager',
    'StableEntry',
    'TurtleStats',
    'create_stable_manager'
]
