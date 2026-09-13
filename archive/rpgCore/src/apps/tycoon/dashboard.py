"""
TurboShells Tycoon Dashboard - Integrated Game Loop
Connects Breeding Altar, Adaptive Roster, and Persistent State Management
"""

from typing import Dict, Any, List, Optional, Tuple
import logging
import json
from pathlib import Path

# Import DGT core systems
from dgt_core.engines.viewport.logical_viewport import LogicalViewport
from dgt_core.engines.viewport.adaptive_renderer import AdaptiveRenderer
from dgt_core.engines.viewport.viewport_manager import ViewportManager
from dgt_core.systems.day_cycle_manager import PersistentStateManager
from dgt_core.registry.dgt_registry import DGTRegistry

# Import UI views
from ui.views.breeding_view import BreedingView
from ui.views.roster_view import RosterView
from ui.views.shop_view import ShopView


class TurboShellsDashboard:
    """
    Main dashboard controller for TurboShells Tycoon Experience
    Integrates all UI components with persistent state management
    """
    
    def __init__(self, resolution: Tuple[int, int] = (800, 600)):
        self.resolution = resolution
        self.logger = logging.getLogger(__name__)
        
        # Core DGT systems
        self.viewport = LogicalViewport()
        self.viewport.set_physical_resolution(resolution)
        self.viewport_manager = ViewportManager()
        self.renderer = AdaptiveRenderer(self.viewport_manager)
        
        # Registry and state management
        self.registry = DGTRegistry()
        self.state_manager = PersistentStateManager(self.registry)
        
        # UI Views
        self.current_view = 'roster'  # Start with roster view
        self.views = {}
        
        # Initialize dashboard
        self._initialize_dashboard()
        
        self.logger.info(f"TurboShells Dashboard initialized at {resolution}")
    
    def _initialize_dashboard(self) -> None:
        """Initialize all dashboard components"""
        try:
            # Load persistent data
            self._load_persistent_data()
            
            # Initialize UI views
            self._initialize_views()
            
            # Setup initial game state
            self._setup_initial_state()
            
            self.logger.info("Dashboard initialization complete")
            
        except Exception as e:
            self.logger.error(f"Dashboard initialization failed: {e}")
            raise
    
    def _load_persistent_data(self) -> None:
        """Load persistent game data"""
        try:
            # Try to load from stable.json
            stable_file = Path("stable.json")
            if stable_file.exists():
                with open(stable_file, 'r') as f:
                    data = json.load(f)
                self.registry.load_from_data(data)
                self.logger.info("Loaded persistent data from stable.json")
            else:
                self.logger.info("No persistent data found, using defaults")
        except Exception as e:
            self.logger.warning(f"Failed to load persistent data: {e}")
    
    def _initialize_views(self) -> None:
        """Initialize all UI views"""
        # Create views
        self.views['roster'] = RosterView(self.viewport, self.registry, self.state_manager)
        self.views['breeding'] = BreedingView(self.viewport, self.registry, self.state_manager)
        self.views['shop'] = ShopView(self.viewport, self.registry, self.state_manager)
        
        # Update views with current data
        for view in self.views.values():
            if hasattr(view, 'update_available_turtles'):
                view.update_available_turtles()
            if hasattr(view, 'update_state'):
                view.update_state()
        
        self.logger.info(f"Initialized {len(self.views)} UI views")
    
    def _setup_initial_state(self) -> None:
        """Setup initial game state if needed"""
        # Check if we have any turtles
        all_turtles = self.registry.get_all_turtles()
        if not all_turtles:
            # Create some starter turtles for testing
            self._create_starter_turtles()
        
        # Ensure player has some money
        player_money = self.registry.get_player_money()
        if player_money < 100:
            self.registry.set_player_money(500)  # Give starter money
        
        self.logger.info(f"Setup complete: {len(all_turtles)} turtles, ${player_money}")
    
    def _create_starter_turtles(self) -> None:
        """Create starter turtles for new game"""
        try:
            # Import genetics system
            from dgt_core.genetics.visual_genetics import VisualGenetics
            genetics_system = VisualGenetics()
            
            # Create 3 starter turtles with different genetics
            starter_names = ["Speedy", "Tank", "Balanced"]
            starter_genetics = []
            
            for i in range(3):
                genetics = genetics_system.generate_random_genetics()
                starter_genetics.append(genetics)
                
                # Add turtle to registry
                turtle_id = self.registry.add_turtle_to_collection(
                    name=starter_names[i],
                    genetics=genetics
                )
                
                self.logger.info(f"Created starter turtle: {starter_names[i]} ({turtle_id})")
        
        except Exception as e:
            self.logger.error(f"Failed to create starter turtles: {e}")
    
    def switch_view(self, view_name: str) -> bool:
        """
        Switch to a different UI view.
        
        Args:
            view_name: Name of view to switch to ('roster', 'breeding', 'shop')
        
        Returns:
            True if switch successful
        """
        if view_name in self.views:
            self.current_view = view_name
            
            # Update view with latest data
            view = self.views[view_name]
            if hasattr(view, 'update_available_turtles'):
                view.update_available_turtles()
            if hasattr(view, 'update_state'):
                view.update_state()
            
            self.logger.info(f"Switched to {view_name} view")
            return True
        else:
            self.logger.warning(f"Unknown view: {view_name}")
            return False
    
    def handle_click(self, click_position: Tuple[int, int]) -> Optional[str]:
        """
        Handle mouse click in current view.
        
        Args:
            click_position: Physical click coordinates
        
        Returns:
            Action string or None
        """
        current_view_obj = self.views.get(self.current_view)
        if not current_view_obj:
            return None
        
        try:
            # Handle click based on current view
            if self.current_view == 'breeding':
                return self._handle_breeding_click(current_view_obj, click_position)
            elif self.current_view == 'roster':
                return self._handle_roster_click(current_view_obj, click_position)
            elif self.current_view == 'shop':
                return self._handle_shop_click(current_view_obj, click_position)
            
        except Exception as e:
            self.logger.error(f"Error handling click in {self.current_view}: {e}")
        
        return None
    
    def _handle_breeding_click(self, view: BreedingView, click_position: Tuple[int, int]) -> Optional[str]:
        """Handle clicks in breeding view"""
        # Check for slot clicks
        for i, slot_data in enumerate(view.parent_slots):
            if slot_data['rect'] and slot_data['rect'].collidepoint(click_position):
                if view.handle_slot_click(i):
                    return f"breeding_slot_selected_{i}"
        
        # Check for breed button click (simplified)
        breed_button_rect = view.legacy_context.Rect(10, 15, 120, 30)
        if breed_button_rect.collidepoint(click_position):
            if view.trigger_breeding():
                return "breeding_successful"
            else:
                return "breeding_failed"
        
        return None
    
    def _handle_roster_click(self, view: RosterView, click_position: Tuple[int, int]) -> Optional[str]:
        """Handle clicks in roster view"""
        # Handle card clicks
        action = view.handle_card_click(click_position)
        if action:
            return action
        
        # Handle navigation button clicks (simplified)
        constants = RosterUIConstants()
        nav_y = constants.HEADER_HEIGHT + 5
        
        # View mode buttons
        view_modes = [ViewMode.ACTIVE, ViewMode.RETIRED]
        for i, mode in enumerate(view_modes):
            button_x = 20 + i * 110
            button_rect = view.legacy_context.Rect(button_x, nav_y, 100, 20)
            if button_rect.collidepoint(click_position):
                view.switch_view_mode(mode)
                return f"view_mode_changed_{mode.value}"
        
        # Sort mode buttons
        sort_modes = [SortMode.BY_NAME, SortMode.BY_SPEED, SortMode.BY_VALUE]
        for i, mode in enumerate(sort_modes):
            button_x = 400 + i * 110
            button_rect = view.legacy_context.Rect(button_x, nav_y, 100, 20)
            if button_rect.collidepoint(click_position):
                view.change_sort_mode(mode)
                return f"sort_mode_changed_{mode.value}"
        
        return None
    
    def _handle_shop_click(self, view: ShopView, click_position: Tuple[int, int]) -> Optional[str]:
        """Handle clicks in shop view"""
        # Handle item clicks
        item_index = view.handle_item_click(click_position)
        if item_index is not None:
            if view.can_purchase_item(item_index):
                if view.purchase_item(item_index):
                    return f"shop_purchase_success_{item_index}"
                else:
                    return f"shop_purchase_failed_{item_index}"
            else:
                return f"shop_cannot_purchase_{item_index}"
        
        # Handle refresh button click (simplified)
        refresh_button_rect = view.legacy_context.Rect(325, 520, 150, 40)
        if refresh_button_rect.collidepoint(click_position):
            if view.process_refresh():
                return "shop_refresh_success"
            else:
                return "shop_refresh_failed"
        
        return None
    
    def advance_day(self) -> bool:
        """
        Advance to next day and update all systems.
        
        Returns:
            True if day advanced successfully
        """
        try:
            # Advance day in state manager
            self.state_manager.day_cycle.advance_day()
            
            # Update all views
            for view in self.views.values():
                if hasattr(view, 'update_state'):
                    view.update_state()
            
            # Force save
            self.state_manager.force_save()
            
            self.logger.info("Day advanced successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to advance day: {e}")
            return False
    
    def get_dashboard_state(self) -> Dict[str, Any]:
        """Get complete dashboard state"""
        return {
            'current_view': self.current_view,
            'resolution': self.resolution,
            'game_summary': self.state_manager.get_game_summary(),
            'view_states': {name: view.get_state() for name, view in self.views.items()},
            'player_money': self.registry.get_player_money(),
            'turtle_count': len(self.registry.get_all_turtles())
        }
    
    def render(self) -> Dict[str, Any]:
        """
        Render the current dashboard view.
        
        Returns:
            Render data for the rendering pipeline
        """
        # Update renderer resolution
        self.renderer.update_resolution(self.resolution)
        
        # Get current view
        current_view_obj = self.views.get(self.current_view)
        if not current_view_obj:
            return {'type': 'error', 'message': f'View {self.current_view} not found'}
        
        # Render current view
        try:
            render_data = current_view_obj.render()
            
            # Add dashboard metadata
            render_data['dashboard'] = {
                'current_view': self.current_view,
                'resolution': self.resolution,
                'day': self.state_manager.day_cycle.state.current_day,
                'money': self.registry.get_player_money()
            }
            
            return render_data
            
        except Exception as e:
            self.logger.error(f"Error rendering {self.current_view}: {e}")
            return {'type': 'error', 'message': str(e)}
    
    def save_game(self) -> bool:
        """Save game state to stable.json"""
        try:
            success = self.state_manager.force_save()
            if success:
                self.logger.info("Game saved successfully")
            return success
        except Exception as e:
            self.logger.error(f"Failed to save game: {e}")
            return False
    
    def load_game(self, filepath: str = "stable.json") -> bool:
        """Load game state from file"""
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            
            self.registry.load_from_data(data)
            
            # Reinitialize views with loaded data
            self._initialize_views()
            
            self.logger.info(f"Game loaded from {filepath}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load game: {e}")
            return False
    
    def run_full_lifecycle_test(self) -> bool:
        """
        Perform full lifecycle test: Buy → View → Breed → Persist
        
        Returns:
            True if full lifecycle successful
        """
        try:
            self.logger.info("Starting full lifecycle test...")
            
            # Step 1: Buy a turtle in shop
            self.switch_view('shop')
            shop_view = self.views['shop']
            
            # Try to buy first available turtle
            if len(shop_view.shop_items) > 0:
                first_item = shop_view.shop_items[0]
                initial_money = self.registry.get_player_money()
                
                if shop_view.purchase_item(0):
                    self.logger.info(f"✅ Purchased turtle: {first_item.name}")
                    
                    # Verify money deduction
                    new_money = self.registry.get_player_money()
                    expected_money = initial_money - first_item.price
                    if new_money == expected_money:
                        self.logger.info("✅ Money correctly deducted")
                    else:
                        self.logger.error(f"❌ Money mismatch: expected {expected_money}, got {new_money}")
                        return False
                else:
                    self.logger.error("❌ Failed to purchase turtle")
                    return False
            else:
                self.logger.error("❌ No items available in shop")
                return False
            
            # Step 2: View turtle in roster
            self.switch_view('roster')
            roster_view = self.views['roster']
            roster_view.refresh_data()
            
            turtle_count = roster_view.get_turtle_count()
            if turtle_count > 0:
                self.logger.info(f"✅ Turtle appears in roster: {turtle_count} turtles")
            else:
                self.logger.error("❌ No turtles found in roster")
                return False
            
            # Step 3: Breed turtle (if we have at least 2)
            if turtle_count >= 2:
                self.switch_view('breeding')
                breeding_view = self.views['breeding']
                breeding_view.update_available_turtles()
                
                # Select two parents
                if len(breeding_view.parent_slots) >= 2:
                    breeding_view.handle_slot_click(0)
                    breeding_view.handle_slot_click(1)
                    
                    if breeding_view.can_breed():
                        if breeding_view.trigger_breeding():
                            self.logger.info("✅ Breeding successful")
                            
                            # Verify offspring was created
                            if breeding_view.offspring_display:
                                self.logger.info(f"✅ Offspring created: {breeding_view.offspring_display['name']}")
                            else:
                                self.logger.error("❌ No offspring display found")
                                return False
                        else:
                            self.logger.error("❌ Breeding failed")
                            return False
                    else:
                        self.logger.error("❌ Cannot breed (conditions not met)")
                        return False
                else:
                    self.logger.error("❌ Not enough breeding slots")
                    return False
            else:
                self.logger.warning("⚠️ Not enough turtles for breeding test")
            
            # Step 4: Verify persistence
            if self.save_game():
                self.logger.info("✅ Game saved successfully")
                
                # Load and verify
                if self.load_game():
                    self.logger.info("✅ Game loaded successfully")
                    
                    # Verify data integrity
                    final_turtle_count = len(self.registry.get_all_turtles())
                    if final_turtle_count >= turtle_count:
                        self.logger.info(f"✅ Data persistence verified: {final_turtle_count} turtles")
                        return True
                    else:
                        self.logger.error(f"❌ Data loss detected: expected >= {turtle_count}, got {final_turtle_count}")
                        return False
                else:
                    self.logger.error("❌ Failed to load game")
                    return False
            else:
                self.logger.error("❌ Failed to save game")
                return False
                
        except Exception as e:
            self.logger.error(f"Full lifecycle test failed: {e}")
            return False
    
    def shutdown(self) -> None:
        """Shutdown dashboard and save state"""
        try:
            self.save_game()
            self.logger.info("Dashboard shutdown complete")
        except Exception as e:
            self.logger.error(f"Error during shutdown: {e}")
