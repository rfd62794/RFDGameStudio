"""
Breeding View - Universal Breeding Interface using SLS
Surgical transplant from TurboShells breeding_panel.py using DGT patterns
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import logging

from ..components.adaptive_turtle_card import AdaptiveTurtleCard, TurtleDisplayData, DisplayMode
from ...engines.viewport.logical_viewport import LogicalViewport
from ...ui.proportional_layout import ProportionalLayout, AnchorPoint, NormalizedRect
from ....registry.dgt_registry import DGTRegistry


@dataclass
class BreedingState:
    """State management for breeding operations"""
    selected_parents: List[str] = None
    breeding_cost: int = 100
    max_parents: int = 2
    breedingInProgress: bool = False
    last_offspring_id: Optional[str] = None
    
    def __post_init__(self):
        if self.selected_parents is None:
            self.selected_parents = []


class BreedingView:
    """
    Universal breeding interface that adapts to any resolution
    using the Sovereign Layout System (SLS)
    
    Critical: No legacy PyGame code - pure DGT BaseComponent patterns
    """
    
    def __init__(self, viewport: LogicalViewport, registry: DGTRegistry):
        self.viewport = viewport
        self.registry = registry
        self.logger = logging.getLogger(__name__)
        
        # State management
        self.state = BreedingState()
        
        # UI Layout system
        self.layout = ProportionalLayout((1000, 1000))  # Logical space
        
        # UI Components
        self.parent_cards: List[AdaptiveTurtleCard] = []
        self.offspring_card: Optional[AdaptiveTurtleCard] = None
        
        # UI Element positions (normalized coordinates)
        self._setup_ui_layout()
        
        # Initialize breeding slots
        self._initialize_breeding_slots()
    
    def _setup_ui_layout(self) -> None:
        """Setup proportional UI layout using SLS"""
        # Header area (top 10% of screen)
        self.header_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.1),
            normalized_position=(0.0, 0.0)
        )
        
        # Parent selection area (middle 60% of screen)
        self.parent_area_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.6),
            normalized_position=(0.0, 0.1)
        )
        
        # Breeding controls area (next 15% of screen)
        self.controls_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.15),
            normalized_position=(0.0, 0.7)
        )
        
        # Offspring display area (bottom 15% of screen)
        self.offspring_rect = self.layout.get_relative_rect(
            anchor=AnchorPoint.TOP_LEFT,
            normalized_size=(1.0, 0.15),
            normalized_position=(0.0, 0.85)
        )
    
    def _initialize_breeding_slots(self) -> None:
        """Initialize breeding slot cards"""
        # Create two parent slots
        for i in range(self.state.max_parents):
            # Calculate position for parent slots
            slot_x = 200 + i * 300  # Logical units
            slot_y = 200  # Logical units
            
            # Create empty turtle card for slot
            empty_data = TurtleDisplayData(
                turtle_id=f"slot_{i}",
                name=f"Parent Slot {i+1}",
                genetics={},
                stats={},
                position=(slot_x, slot_y),
                is_selected=False
            )
            
            card = AdaptiveTurtleCard(self.viewport, DisplayMode.AUTO)
            card.set_turtle_data(empty_data)
            card.get_logical_rect((slot_x, slot_y))
            
            self.parent_cards.append(card)
    
    def update_available_turtles(self) -> None:
        """Update list of available turtles for breeding"""
        try:
            # Get available turtles from registry
            available_turtles = self.registry.get_turtles_for_breeding()
            
            # For now, just log the count - actual selection handled by UI
            self.logger.info(f"Available turtles for breeding: {len(available_turtles)}")
            
        except Exception as e:
            self.logger.error(f"Failed to update available turtles: {e}")
    
    def select_parent(self, turtle_id: str) -> bool:
        """
        Select a turtle for breeding.
        
        Args:
            turtle_id: ID of turtle to select
        
        Returns:
            True if selection successful, False otherwise
        """
        if len(self.state.selected_parents) >= self.state.max_parents:
            self.logger.warning("Maximum parents already selected")
            return False
        
        if turtle_id in self.state.selected_parents:
            self.logger.warning("Turtle already selected as parent")
            return False
        
        try:
            # Get turtle data from registry
            turtle_data = self.registry.get_turtle(turtle_id)
            if not turtle_data:
                self.logger.error(f"Turtle {turtle_id} not found")
                return False
            
            # Add to selected parents
            self.state.selected_parents.append(turtle_id)
            
            # Update parent card display
            slot_index = len(self.state.selected_parents) - 1
            self._update_parent_card(slot_index, turtle_data)
            
            self.logger.info(f"Selected parent {turtle_id} for breeding")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to select parent {turtle_id}: {e}")
            return False
    
    def _update_parent_card(self, slot_index: int, turtle_data: Dict[str, Any]) -> None:
        """Update parent card with turtle data"""
        if slot_index >= len(self.parent_cards):
            return
        
        # Convert registry data to display format
        display_data = TurtleDisplayData(
            turtle_id=turtle_data["id"],
            name=turtle_data["name"],
            genetics=turtle_data["genetics"],
            stats=turtle_data["stats"],
            position=(200 + slot_index * 300, 200),
            is_selected=True
        )
        
        # Update card
        self.parent_cards[slot_index].set_turtle_data(display_data)
    
    def remove_parent(self, turtle_id: str) -> bool:
        """
        Remove a selected parent.
        
        Args:
            turtle_id: ID of turtle to remove
        
        Returns:
            True if removal successful
        """
        if turtle_id not in self.state.selected_parents:
            return False
        
        try:
            # Remove from selected parents
            self.state.selected_parents.remove(turtle_id)
            
            # Reorganize parent cards
            self._reorganize_parent_cards()
            
            self.logger.info(f"Removed parent {turtle_id} from breeding")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to remove parent {turtle_id}: {e}")
            return False
    
    def _reorganize_parent_cards(self) -> None:
        """Reorganize parent cards after selection change"""
        for i, turtle_id in enumerate(self.state.selected_parents):
            if i < len(self.parent_cards):
                turtle_data = self.registry.get_turtle(turtle_id)
                if turtle_data:
                    self._update_parent_card(i, turtle_data)
        
        # Clear empty slots
        for i in range(len(self.state.selected_parents), len(self.parent_cards)):
            empty_data = TurtleDisplayData(
                turtle_id=f"slot_{i}",
                name=f"Parent Slot {i+1}",
                genetics={},
                stats={},
                position=(200 + i * 300, 200),
                is_selected=False
            )
            self.parent_cards[i].set_turtle_data(empty_data)
    
    def can_breed(self) -> bool:
        """Check if breeding can proceed"""
        return (len(self.state.selected_parents) == self.state.max_parents and
                not self.state.breedingInProgress and
                self._has_funds_for_breeding())
    
    def _has_funds_for_breeding(self) -> bool:
        """Check if player has enough funds for breeding"""
        try:
            player_money = self.registry.get_player_money()
            return player_money >= self.state.breeding_cost
        except Exception:
            return False
    
    def start_breeding(self) -> bool:
        """
        Start the breeding process.
        
        Returns:
            True if breeding started successfully
        """
        if not self.can_breed():
            self.logger.warning("Cannot start breeding - conditions not met")
            return False
        
        try:
            # Deduct breeding cost
            self.registry.deduct_money(self.state.breeding_cost)
            
            # Set breeding state
            self.state.breedingInProgress = True
            
            # Get parent genetics
            parent1_data = self.registry.get_turtle(self.state.selected_parents[0])
            parent2_data = self.registry.get_turtle(self.state.selected_parents[1])
            
            if not parent1_data or not parent2_data:
                raise Exception("Parent data not found")
            
            # Perform breeding using genetics system
            from ...genetics.visual_genetics import VisualGenetics
            genetics_system = VisualGenetics()
            
            offspring_genetics = genetics_system.inherit_genetics(
                parent1_data["genetics"],
                parent2_data["genetics"]
            )
            
            # Create offspring turtle
            offspring_id = self.registry.create_offspring(
                parent1_id=self.state.selected_parents[0],
                parent2_id=self.state.selected_parents[1],
                genetics=offspring_genetics
            )
            
            # Update state
            self.state.last_offspring_id = offspring_id
            self.state.breedingInProgress = False
            
            # Display offspring
            self._display_offspring(offspring_id)
            
            # Clear parent selection
            self.state.selected_parents.clear()
            self._reorganize_parent_cards()
            
            self.logger.info(f"Breeding completed - offspring {offspring_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Breeding failed: {e}")
            self.state.breedingInProgress = False
            # Refund money on failure
            try:
                self.registry.add_money(self.state.breeding_cost)
            except:
                pass
            return False
    
    def _display_offspring(self, offspring_id: str) -> None:
        """Display the newly created offspring"""
        try:
            offspring_data = self.registry.get_turtle(offspring_id)
            if not offspring_data:
                return
            
            # Create display data for offspring
            display_data = TurtleDisplayData(
                turtle_id=offspring_data["id"],
                name=offspring_data["name"],
                genetics=offspring_data["genetics"],
                stats=offspring_data["stats"],
                position=(500, 900),  # Bottom center position
                is_selected=False
            )
            
            # Create offspring card
            self.offspring_card = AdaptiveTurtleCard(self.viewport, DisplayMode.AUTO)
            self.offspring_card.set_turtle_data(display_data)
            self.offspring_card.get_logical_rect((500, 900))
            
            self.logger.info(f"Displaying offspring {offspring_id}")
            
        except Exception as e:
            self.logger.error(f"Failed to display offspring {offspring_id}: {e}")
    
    def render(self) -> Dict[str, Any]:
        """
        Render the breeding view.
        
        Returns:
            Render data for the rendering pipeline
        """
        render_data = {
            "type": "breeding_view",
            "elements": []
        }
        
        # Render header
        header_render = self._render_header()
        render_data["elements"].extend(header_render)
        
        # Render parent area background
        parent_bg = {
            "type": "panel",
            "rect": self.parent_area_rect.to_physical(self.viewport.physical_size),
            "color": (30, 30, 50),
            "border_color": (80, 80, 120),
            "border_thickness": 2
        }
        render_data["elements"].append(parent_bg)
        
        # Render parent cards
        for card in self.parent_cards:
            card_render = card.render()
            render_data["elements"].append(card_render)
        
        # Render breeding controls
        controls_render = self._render_controls()
        render_data["elements"].extend(controls_render)
        
        # Render offspring area
        if self.offspring_card:
            offspring_bg = {
                "type": "panel",
                "rect": self.offspring_rect.to_physical(self.viewport.physical_size),
                "color": (40, 60, 40),  # Green tint for offspring
                "border_color": (80, 120, 80),
                "border_thickness": 2
            }
            render_data["elements"].append(offspring_bg)
            
            offspring_render = self.offspring_card.render()
            render_data["elements"].append(offspring_render)
        
        return render_data
    
    def _render_header(self) -> List[Dict[str, Any]]:
        """Render header section"""
        elements = []
        
        header_rect = self.header_rect.to_physical(self.viewport.physical_size)
        
        # Title
        title = {
            "type": "text",
            "text": "BREEDING CENTER",
            "position": (header_rect[0] + 10, header_rect[1] + 5),
            "font_size": 20 if not self.viewport.is_retro_mode() else 12,
            "color": (255, 255, 255),
            "style": "bold"
        }
        elements.append(title)
        
        # Money display
        try:
            player_money = self.registry.get_player_money()
            money_text = {
                "type": "text",
                "text": f"$ {player_money}",
                "position": (header_rect[0] + header_rect[2] - 150, header_rect[1] + 5),
                "font_size": 16 if not self.viewport.is_retro_mode() else 10,
                "color": (255, 215, 0),  # Gold color
                "style": "bold"
            }
            elements.append(money_text)
        except Exception:
            pass
        
        # Breeding cost
        cost_text = {
            "type": "text",
            "text": f"Cost: ${self.state.breeding_cost}",
            "position": (header_rect[0] + header_rect[2] // 2 - 50, header_rect[1] + 5),
            "font_size": 14 if not self.viewport.is_retro_mode() else 8,
            "color": (200, 200, 200)
        }
        elements.append(cost_text)
        
        return elements
    
    def _render_controls(self) -> List[Dict[str, Any]]:
        """Render breeding controls"""
        elements = []
        
        controls_rect = self.controls_rect.to_physical(self.viewport.physical_size)
        
        # Breed button
        breed_button = {
            "type": "button",
            "rect": (controls_rect[0] + 10, controls_rect[1] + 10, 120, 40),
            "text": "BREED",
            "enabled": self.can_breed(),
            "color": (0, 150, 0) if self.can_breed() else (100, 100, 100),
            "text_color": (255, 255, 255),
            "action": "breed"
        }
        elements.append(breed_button)
        
        # Clear selection button
        clear_button = {
            "type": "button",
            "rect": (controls_rect[0] + 140, controls_rect[1] + 10, 120, 40),
            "text": "CLEAR",
            "enabled": len(self.state.selected_parents) > 0,
            "color": (150, 0, 0),
            "text_color": (255, 255, 255),
            "action": "clear"
        }
        elements.append(clear_button)
        
        # Status text
        status_text = self._get_status_text()
        status = {
            "type": "text",
            "text": status_text,
            "position": (controls_rect[0] + 10, controls_rect[1] + 60),
            "font_size": 12 if not self.viewport.is_retro_mode() else 8,
            "color": (200, 200, 200)
        }
        elements.append(status)
        
        return elements
    
    def _get_status_text(self) -> str:
        """Get current status text"""
        if self.state.breedingInProgress:
            return "Breeding in progress..."
        
        if len(self.state.selected_parents) == 0:
            return "Select 2 parents to begin breeding"
        
        if len(self.state.selected_parents) == 1:
            return "Select 1 more parent"
        
        if not self._has_funds_for_breeding():
            return "Insufficient funds for breeding"
        
        return "Ready to breed!"
    
    def handle_click(self, click_position: Tuple[int, int]) -> Optional[str]:
        """
        Handle click events in the breeding view.
        
        Args:
            click_position: Physical click coordinates
        
        Returns:
            Action to perform or None
        """
        # Check parent card clicks
        for i, card in enumerate(self.parent_cards):
            if card.handle_click(click_position):
                turtle_id = card.get_turtle_id()
                if turtle_id and turtle_id.startswith("slot_"):
                    # Empty slot clicked - could trigger turtle selection UI
                    return f"select_parent_slot_{i}"
                else:
                    # Parent card clicked - could show details or remove
                    return f"parent_clicked_{turtle_id}"
        
        # Check offspring card click
        if self.offspring_card and self.offspring_card.handle_click(click_position):
            offspring_id = self.offspring_card.get_turtle_id()
            return f"offspring_clicked_{offspring_id}"
        
        # Check control button clicks
        controls_rect = self.controls_rect.to_physical(self.viewport.physical_size)
        x, y = click_position
        
        # Breed button
        breed_button_rect = (controls_rect[0] + 10, controls_rect[1] + 10, 120, 40)
        if (breed_button_rect[0] <= x <= breed_button_rect[0] + breed_button_rect[2] and
            breed_button_rect[1] <= y <= breed_button_rect[1] + breed_button_rect[3]):
            if self.can_breed():
                return "breed"
        
        # Clear button
        clear_button_rect = (controls_rect[0] + 140, controls_rect[1] + 10, 120, 40)
        if (clear_button_rect[0] <= x <= clear_button_rect[0] + clear_button_rect[2] and
            clear_button_rect[1] <= y <= clear_button_rect[1] + clear_button_rect[3]):
            return "clear"
        
        return None
    
    def handle_action(self, action: str) -> bool:
        """
        Handle UI actions.
        
        Args:
            action: Action string from handle_click
        
        Returns:
            True if action handled successfully
        """
        if action == "breed":
            return self.start_breeding()
        elif action == "clear":
            self.state.selected_parents.clear()
            self._reorganize_parent_cards()
            return True
        elif action.startswith("select_parent_slot_"):
            # Handle parent slot selection - would open turtle selection UI
            slot_index = int(action.split("_")[-1])
            self.logger.info(f"Parent slot {slot_index} clicked for selection")
            return True
        elif action.startswith("parent_clicked_"):
            # Handle parent card click - could show turtle details
            turtle_id = action.replace("parent_clicked_", "")
            self.logger.info(f"Parent turtle {turtle_id} clicked")
            return True
        elif action.startswith("offspring_clicked_"):
            # Handle offspring card click
            offspring_id = action.replace("offspring_clicked_", "")
            self.logger.info(f"Offspring turtle {offspring_id} clicked")
            return True
        
        return False
    
    def get_state(self) -> BreedingState:
        """Get current breeding state"""
        return self.state
    
    def reset_state(self) -> None:
        """Reset breeding state"""
        self.state = BreedingState()
        self._reorganize_parent_cards()
        self.offspring_card = None
