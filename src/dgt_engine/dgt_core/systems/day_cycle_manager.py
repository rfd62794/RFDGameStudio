"""
Day Cycle Manager - Persistent State Integration
Connects Advance Day state to global Day Counter in Registry
"""

from typing import Dict, Any, Optional
from dataclasses import dataclass
import logging
import json
from pathlib import Path

from ..registry.dgt_registry import DGTRegistry


@dataclass
class DayCycleState:
    """State for day cycle management"""
    current_day: int = 1
    last_action_day: int = 1
    daily_actions_performed: int = 0
    max_daily_actions: int = 10
    is_new_day: bool = False
    
    # Daily events
    turtles_bred_today: int = 0
    turtles_purchased_today: int = 0
    money_spent_today: int = 0
    money_earned_today: int = 0
    
    # Shop refresh tracking
    last_shop_refresh_day: int = 1
    shop_refreshes_today: int = 0
    max_shop_refreshes: int = 3


class DayCycleManager:
    """
    Manages the persistent day/night cycle and daily state updates.
    Critical for TurboShells tycoon gameplay mechanics.
    """
    
    def __init__(self, registry: DGTRegistry):
        self.registry = registry
        self.logger = logging.getLogger(__name__)
        
        # Load day cycle state
        self.state = self._load_day_cycle_state()
        
        # Check if it's a new day
        self._check_new_day()
    
    def _load_day_cycle_state(self) -> DayCycleState:
        """Load day cycle state from registry"""
        try:
            state_data = self.registry.get_day_cycle_state()
            if state_data:
                return DayCycleState(**state_data)
        except Exception as e:
            self.logger.warning(f"Failed to load day cycle state: {e}")
        
        # Return default state
        return DayCycleState()
    
    def _save_day_cycle_state(self) -> None:
        """Save day cycle state to registry"""
        try:
            state_dict = {
                "current_day": self.state.current_day,
                "last_action_day": self.state.last_action_day,
                "daily_actions_performed": self.state.daily_actions_performed,
                "max_daily_actions": self.state.max_daily_actions,
                "is_new_day": self.state.is_new_day,
                "turtles_bred_today": self.state.turtles_bred_today,
                "turtles_purchased_today": self.state.turtles_purchased_today,
                "money_spent_today": self.state.money_spent_today,
                "money_earned_today": self.state.money_earned_today,
                "last_shop_refresh_day": self.state.last_shop_refresh_day,
                "shop_refreshes_today": self.state.shop_refreshes_today,
                "max_shop_refreshes": self.state.max_shop_refreshes
            }
            
            self.registry.set_day_cycle_state(state_dict)
            
        except Exception as e:
            self.logger.error(f"Failed to save day cycle state: {e}")
    
    def _check_new_day(self) -> None:
        """Check if it's a new day and reset daily state if needed"""
        # For now, we'll use a simple action-based day progression
        # In a real game, this could be time-based or user-triggered
        
        # Check if we should advance to next day
        if self.state.daily_actions_performed >= self.state.max_daily_actions:
            self.advance_day()
        else:
            self.state.is_new_day = False
    
    def advance_day(self) -> None:
        """Advance to the next day and reset daily state"""
        self.state.current_day += 1
        self.state.last_action_day = self.state.current_day
        self.state.daily_actions_performed = 0
        self.state.is_new_day = True
        
        # Reset daily counters
        self.state.turtles_bred_today = 0
        self.state.turtles_purchased_today = 0
        self.state.money_spent_today = 0
        self.state.money_earned_today = 0
        self.state.shop_refreshes_today = 0
        self.state.last_shop_refresh_day = self.state.current_day
        
        # Apply daily effects
        self._apply_daily_effects()
        
        # Save state
        self._save_day_cycle_state()
        
        self.logger.info(f"Advanced to day {self.state.current_day}")
    
    def _apply_daily_effects(self) -> None:
        """Apply effects that happen each day"""
        try:
            # Daily income from retired turtles (if implemented)
            daily_income = self.registry.calculate_daily_income()
            if daily_income > 0:
                self.registry.add_money(daily_income)
                self.state.money_earned_today += daily_income
                self.logger.info(f"Daily income: ${daily_income}")
            
            # Turtle energy recovery
            self.registry.recover_all_turtle_energy()
            
            # Random events (could be implemented here)
            self._process_random_events()
            
        except Exception as e:
            self.logger.error(f"Failed to apply daily effects: {e}")
    
    def _process_random_events(self) -> None:
        """Process random daily events"""
        # Placeholder for random events system
        # Could include: special turtle appearances, market fluctuations, etc.
        pass
    
    def record_action(self, action_type: str, details: Dict[str, Any] = None) -> None:
        """
        Record an action and check if it advances the day.
        
        Args:
            action_type: Type of action ("breed", "purchase", "sell", etc.)
            details: Additional details about the action
        """
        details = details or {}
        
        # Increment daily action counter
        self.state.daily_actions_performed += 1
        self.state.last_action_day = self.state.current_day
        
        # Record specific action types
        if action_type == "breed":
            self.state.turtles_bred_today += 1
            cost = details.get("cost", 0)
            self.state.money_spent_today += cost
            
        elif action_type == "purchase":
            self.state.turtles_purchased_today += 1
            cost = details.get("cost", 0)
            self.state.money_spent_today += cost
            
        elif action_type == "sell":
            earnings = details.get("earnings", 0)
            self.state.money_earned_today += earnings
        
        # Check if we've reached the daily action limit
        if self.state.daily_actions_performed >= self.state.max_daily_actions:
            self.advance_day()
        else:
            self._save_day_cycle_state()
        
        self.logger.info(f"Recorded action: {action_type} (Day {self.state.current_day}, Action {self.state.daily_actions_performed}/{self.state.max_daily_actions})")
    
    def can_perform_action(self, action_type: str) -> bool:
        """
        Check if an action can be performed.
        
        Args:
            action_type: Type of action to check
        
        Returns:
            True if action can be performed
        """
        # Check daily action limit
        if self.state.daily_actions_performed >= self.state.max_daily_actions:
            return False
        
        # Check specific action limits
        if action_type == "shop_refresh":
            return (self.state.shop_refreshes_today < self.state.max_shop_refreshes and
                    self.state.last_shop_refresh_day == self.state.current_day)
        
        return True
    
    def record_shop_refresh(self) -> bool:
        """
        Record a shop refresh action.
        
        Returns:
            True if refresh was allowed
        """
        if not self.can_perform_action("shop_refresh"):
            return False
        
        self.state.shop_refreshes_today += 1
        self.state.daily_actions_performed += 1
        
        # Check if we've reached the daily action limit
        if self.state.daily_actions_performed >= self.state.max_daily_actions:
            self.advance_day()
        else:
            self._save_day_cycle_state()
        
        self.logger.info(f"Shop refresh recorded (Day {self.state.current_day}, Refresh {self.state.shop_refreshes_today}/{self.state.max_shop_refreshes})")
        return True
    
    def get_daily_summary(self) -> Dict[str, Any]:
        """Get summary of current day's activities"""
        return {
            "current_day": self.state.current_day,
            "actions_remaining": self.state.max_daily_actions - self.state.daily_actions_performed,
            "is_new_day": self.state.is_new_day,
            "turtles_bred": self.state.turtles_bred_today,
            "turtles_purchased": self.state.turtles_purchased_today,
            "money_spent": self.state.money_spent_today,
            "money_earned": self.state.money_earned_today,
            "shop_refreshes_remaining": self.state.max_shop_refreshes - self.state.shop_refreshes_today
        }
    
    def get_state(self) -> DayCycleState:
        """Get current day cycle state"""
        return self.state
    
    def force_advance_day(self) -> None:
        """Force advance to next day (for testing or admin use)"""
        self.advance_day()
    
    def reset_daily_actions(self) -> None:
        """Reset daily action counter (for testing)"""
        self.state.daily_actions_performed = 0
        self._save_day_cycle_state()


class PersistentStateManager:
    """
    High-level manager for all persistent state operations.
    Ensures stable.json is updated automatically for all game state changes.
    """
    
    def __init__(self, registry: DGTRegistry):
        self.registry = registry
        self.logger = logging.getLogger(__name__)
        
        # Initialize subsystems
        self.day_cycle = DayCycleManager(registry)
        
        # Auto-save timer (in a real implementation)
        self._auto_save_interval = 300  # 5 minutes
        self._last_auto_save = 0
    
    def on_turtle_bred(self, parent1_id: str, parent2_id: str, offspring_id: str, cost: int) -> None:
        """Handle turtle breeding event"""
        try:
            # Record breeding action
            self.day_cycle.record_action("breed", {"cost": cost})
            
            # Update registry
            self.registry.record_breeding_event(parent1_id, parent2_id, offspring_id, cost)
            
            # Trigger auto-save
            self._trigger_auto_save()
            
            self.logger.info(f"Turtle breeding recorded: {offspring_id} from {parent1_id} + {parent2_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to record turtle breeding: {e}")
    
    def on_turtle_purchased(self, turtle_id: str, cost: int) -> None:
        """Handle turtle purchase event"""
        try:
            # Record purchase action
            self.day_cycle.record_action("purchase", {"cost": cost})
            
            # Update registry
            self.registry.record_purchase_event(turtle_id, cost)
            
            # Trigger auto-save
            self._trigger_auto_save()
            
            self.logger.info(f"Turtle purchase recorded: {turtle_id} for ${cost}")
            
        except Exception as e:
            self.logger.error(f"Failed to record turtle purchase: {e}")
    
    def on_shop_refreshed(self) -> None:
        """Handle shop refresh event"""
        try:
            # Record shop refresh
            success = self.day_cycle.record_shop_refresh()
            
            if success:
                # Update registry
                self.registry.record_shop_refresh()
                
                # Trigger auto-save
                self._trigger_auto_save()
                
                self.logger.info("Shop refresh recorded")
            
        except Exception as e:
            self.logger.error(f"Failed to record shop refresh: {e}")
    
    def on_money_changed(self, amount: int, reason: str) -> None:
        """Handle money change event"""
        try:
            # Update registry
            self.registry.update_money(amount, reason)
            
            # Trigger auto-save for significant changes
            if abs(amount) >= 50:  # Auto-save for changes >= $50
                self._trigger_auto_save()
            
        except Exception as e:
            self.logger.error(f"Failed to record money change: {e}")
    
    def _trigger_auto_save(self) -> None:
        """Trigger automatic save to stable.json"""
        try:
            import time
            current_time = time.time()
            
            # Check if enough time has passed since last auto-save
            if current_time - self._last_auto_save >= 60:  # At least 1 minute between auto-saves
                self.registry.save_to_file("stable.json")
                self._last_auto_save = current_time
                self.logger.debug("Auto-save triggered")
            
        except Exception as e:
            self.logger.error(f"Auto-save failed: {e}")
    
    def force_save(self) -> bool:
        """Force immediate save to stable.json"""
        try:
            success = self.registry.save_to_file("stable.json")
            if success:
                self._last_auto_save = 0  # Reset auto-save timer
                self.logger.info("Force save completed")
            return success
            
        except Exception as e:
            self.logger.error(f"Force save failed: {e}")
            return False
    
    def get_game_summary(self) -> Dict[str, Any]:
        """Get comprehensive game state summary"""
        try:
            day_summary = self.day_cycle.get_daily_summary()
            player_stats = self.registry.get_player_statistics()
            turtle_stats = self.registry.get_turtle_statistics()
            
            return {
                "day_cycle": day_summary,
                "player": player_stats,
                "turtles": turtle_stats,
                "last_save": self.registry.get_last_save_time()
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get game summary: {e}")
            return {}
    
    def get_day_cycle_manager(self) -> DayCycleManager:
        """Get day cycle manager instance"""
        return self.day_cycle
