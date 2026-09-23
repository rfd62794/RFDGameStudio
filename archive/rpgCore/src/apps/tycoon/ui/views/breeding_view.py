"""
Breeding View - Universal Breeding Interface using PyGame Shim
Copy-paste legacy logic with DGT integration via compatibility shim
"""

from typing import Dict, Any, List, Optional, Tuple
import logging

# Import DGT core systems
from dgt_core.engines.viewport.logical_viewport import LogicalViewport
from dgt_core.compat.pygame_shim import LegacyUIContext, create_legacy_context
from dgt_core.systems.day_cycle_manager import PersistentStateManager
from dgt_core.registry.dgt_registry import DGTRegistry

# Import extracted logic
from legacy_logic_extraction.breeding_logic import BreedingLogicExtractor, BreedingUIConstants


class BreedingView:
    """
    Universal breeding interface using PyGame compatibility shim.
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
        self.logic = BreedingLogicExtractor()
        
        # UI state
        self.parent_slots = []
        self.offspring_display = None
        
        # Initialize breeding slots using legacy coordinates
        self._initialize_breeding_slots()
        
        self.logger.info("BreedingView initialized with PyGame shim")
    
    def _initialize_breeding_slots(self) -> None:
        """Initialize breeding slots using legacy positioning logic"""
        # Use legacy constants from extraction
        constants = BreedingUIConstants()
        
        # Create parent slots using legacy positioning
        slot_x = constants.PARENT_SLOT_OFFSET_X
        slot_y = constants.PARENT_SLOT_OFFSET_Y
        slot_width = constants.PARENT_SLOT_WIDTH
        slot_height = constants.PARENT_SLOT_HEIGHT
        slot_spacing = constants.PARENT_SLOT_SPACING
        
        # Create two parent slots
        for i in range(2):
            slot_x_pos = slot_x + i * (slot_width + slot_spacing)
            slot_rect = self.legacy_context.Rect(slot_x_pos, slot_y, slot_width, slot_height)
            
            # Create slot data structure
            slot_data = {
                'slot_index': i,
                'rect': slot_rect,
                'turtle_data': None,
                'is_selected': False,
                'is_retired': False
            }
            
            self.parent_slots.append(slot_data)
        
        self.logger.info(f"Initialized {len(self.parent_slots)} breeding slots")
    
    def update_available_turtles(self) -> None:
        """Update list of available turtles for breeding"""
        try:
            # Get available turtles from registry
            available_turtles = self.registry.get_turtles_for_breeding()
            
            # Update first two slots with available turtles
            for i, slot_data in enumerate(self.parent_slots[:2]):
                if i < len(available_turtles):
                    turtle_data = available_turtles[i]
                    slot_data['turtle_data'] = turtle_data
                    slot_data['is_retired'] = turtle_data.get('is_retired', False)
                else:
                    slot_data['turtle_data'] = None
                    slot_data['is_retired'] = False
            
            self.logger.info(f"Updated breeding slots with {len(available_turtles)} available turtles")
            
        except Exception as e:
            self.logger.error(f"Failed to update available turtles: {e}")
    
    def handle_slot_click(self, slot_index: int) -> bool:
        """
        Handle slot click using extracted logic.
        
        Args:
            slot_index: Index of clicked slot
        
        Returns:
            True if action successful
        """
        if slot_index >= len(self.parent_slots):
            return False
        
        slot_data = self.parent_slots[slot_index]
        turtle_data = slot_data['turtle_data']
        
        if not turtle_data:
            self.logger.warning(f"No turtle data in slot {slot_index}")
            return False
        
        # Use extracted parent selection logic
        turtle_id = turtle_data.get('id', f'slot_{slot_index}')
        success = self.logic.process_parent_selection(slot_index, turtle_data)
        
        if success:
            # Update slot visual state
            slot_data['is_selected'] = self.logic.selected_parents == 2 and turtle_id in self.logic.selected_parents
            
            # Update breeding button state
            self._update_breeding_button_state()
            
            # Record action in persistent state
            self.state_manager.on_turtle_bred(
                parent1_id=self.logic.selected_parents[0] if len(self.logic.selected_parents) > 0 else None,
                parent2_id=self.logic.selected_parents[1] if len(self.logic.selected_parents) > 1 else None,
                offspring_id=None,
                cost=self.logic.breeding_cost
            )
            
            self.logger.info(f"Selected parent {turtle_id} in slot {slot_index}")
        
        return success
    
    def trigger_breeding(self) -> bool:
        """
        Trigger breeding using extracted logic.
        
        Returns:
            True if breeding successful
        """
        if len(self.logic.selected_parents) != 2:
            self.logger.warning("Need exactly 2 parents for breeding")
            return False
        
        # Get parent data
        parent1_id = self.logic.selected_parents[0]
        parent2_id = self.logic.selected_parents[1]
        
        parent1_data = self.registry.get_turtle(parent1_id)
        parent2_data = self.registry.get_turtle(parent2_id)
        
        if not parent1_data or not parent2_data:
            self.logger.error("Parent data not found")
            return False
        
        try:
            # Use extracted breeding logic
            result = self.logic.trigger_breed()
            
            if result['success']:
                offspring_id = result['offspring']['id']
                
                # Create offspring display data
                offspring_data = result['offspring']
                self.offspring_display = {
                    'turtle_id': offspring_id,
                    'name': offspring_data['name'],
                    'genetics': offspring_data['genetics'],
                    'stats': offspring_data['stats'],
                    'rect': self.legacy_context.Rect(400, 300, 200, 150),  # Position for offspring display
                    'is_selected': False,
                    'is_retired': False
                }
                
                # Record breeding in persistent state
                self.state_manager.on_turtle_bred(
                    parent1_id=parent1_id,
                    parent2_id=parent2_id,
                    offspring_id=offspring_id,
                    cost=self.logic.breeding_cost
                )
                
                # Clear parent selection
                self._clear_parent_selection()
                
                self.logger.info(f"Breeding successful! Offspring: {offspring_id}")
                return True
            else:
                self.logger.error(f"Breeding failed: {result.get('error', 'Unknown error')}")
                return False
                
        except Exception as e:
            self.logger.error(f"Breeding error: {e}")
            return False
    
    def _clear_parent_selection(self) -> None:
        """Clear parent selection state"""
        self.logic.selected_parents.clear()
        for slot_data in self.parent_slots:
            slot_data['is_selected'] = False
    
    def _update_breeding_button_state(self) -> None:
        """Update breeding button visual state"""
        # This would update the breeding button's enabled/disabled state
        # Visual update would be handled by rendering system
        pass
    
    def can_breed(self) -> bool:
        """Check if breeding can proceed"""
        return self.logic.can_breed()
    
    def get_breeding_status(self) -> str:
        """Get current breeding status message"""
        return self.logic.get_breeding_status_text()
    
    def render(self) -> Dict[str, Any]:
        """
        Render the breeding view using legacy drawing commands.
        
        Returns:
            Render data for the rendering pipeline
        """
        render_data = {
            'type': 'breeding_view',
            'elements': []
        }
        
        # Clear drawing proxy
        self.legacy_context.draw.clear()
        
        # Draw background panel
        bg_rect = self.legacy_context.Rect(0, 0, 800, 600)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BREEDING_PANEL_BG'], bg_rect)
        
        # Draw header
        header_rect = self.legacy_context.Rect(0, 0, 800, 60)
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['BREEDING_PANEL_BORDER'], header_rect, 2)
        
        # Draw title
        self.legacy_context.draw.text(None, "BREEDING CENTER", (255, 255, 255), (10, 15), 16)
        
        # Draw money display
        player_money = self.registry.get_player_money()
        money_text = f"$ {player_money}"
        money_rect = self.legacy_context.Rect(800 - 150, 15, 140, 30)
        self.legacy_context.draw.text(None, money_text, (255, 215, 0), money_rect, 14)
        
        # Draw breed button
        breed_button_rect = self.legacy_context.Rect(10, 15, 120, 30)
        breed_color = self.legacy_context.theme_colors['BUTTON_NORMAL'] if self.can_breed() else self.legacy_context.theme_colors['BUTTON_PRESSED']
        self.legacy_context.draw.rect(None, breed_color, breed_button_rect)
        self.legacy_context.draw.text(None, "BREED", (255, 255, 255), (breed_button_rect[0] + 40, breed_button_rect[1] + 8), 12)
        
        # Draw info label
        info_rect = self.legacy_context.Rect(140, 15, 800 - 150 - 140, 35)
        status_text = self.get_breeding_status()
        self.legacy_context.draw.text(None, status_text, (200, 200, 200), info_rect, 12)
        
        # Draw parent slots
        for i, slot_data in enumerate(self.parent_slots):
            self._render_parent_slot(slot_data)
        
        # Draw offspring display if available
        if self.offspring_display:
            self._render_offspring_display()
        
        # Get render packets
        frame_data = self.legacy_context.get_frame_data()
        render_data['render_packets'] = frame_data['render_packets']
        render_data['viewport_size'] = frame_data['viewport_size']
        
        return render_data
    
    def _render_parent_slot(self, slot_data: Dict[str, Any]) -> None:
        """Render a single parent slot"""
        rect = slot_data['rect']
        turtle_data = slot_data['turtle_data']
        is_selected = slot_data['is_selected']
        is_retired = slot_data.get('is_retired', False)
        
        # Draw slot background
        bg_color = self.legacy_context.theme_colors['SELECTION_GLOW'] if is_selected else self.legacy_context.theme_colors['TURTLE_CARD_BG']
        self.legacy_context.draw.rect(None, bg_color, rect)
        
        # Draw border
        border_color = self.legacy_context.theme_colors['TURTLE_CARD_BORDER']
        self.legacy_context.draw.rect(None, border_color, rect, 2)
        
        if turtle_data:
            # Draw turtle placeholder (simplified)
            center_x = rect.left + rect.width // 2
            center_y = rect.top + rect.height // 3
            
            # Draw turtle circle
            turtle_color = turtle_data.get('genetics', {}).get('shell_base_color', (34, 139, 34))
            radius = min(rect.width, rect.height) // 4
            self.legacy_context.draw.circle(None, turtle_color, (center_x, center_y), radius)
            
            # Draw turtle name
            name = turtle_data.get('name', 'Unknown')
            name_y = rect.top + rect.height // 2
            self.legacy_context.draw.text(None, name, (255, 255, 255), (rect.left + 5, name_y), 10)
            
            # Draw retired overlay if needed
            if is_retired:
                overlay_rect = self.legacy_context.Rect(rect.left, rect.top, rect.width, rect.height)
                retired_color = (128, 128, 128, 128)  # Semi-transparent gray
                self.legacy_context.draw.rect(None, retired_color, overlay_rect)
        else:
            # Draw empty slot indicator
            center_x = rect.left + rect.width // 2
            center_y = rect.top + rect.height // 2
            self.legacy_context.draw.text(None, f"Slot {slot_data['slot_index'] + 1}", (150, 150, 150), (center_x - 20, center_y - 6), 10)
    
    def _render_offspring_display(self) -> None:
        """Render the newly created offspring"""
        if not self.offspring_display:
            return
        
        offspring_data = self.offspring_display
        rect = offspring_data['rect']
        
        # Draw offspring background with special color
        offspring_bg_color = (40, 60, 40)  # Green tint for new offspring
        self.legacy_context.draw.rect(None, offspring_bg_color, rect)
        
        # Draw border
        self.legacy_context.draw.rect(None, self.legacy_context.theme_colors['CARD_SELECTED_BORDER'], rect, 3)
        
        # Draw offspring info
        name = offspring_data['name']
        genetics = offspring_data.get('genetics', {})
        
        # Draw name
        name_y = rect.top + 10
        self.legacy_context.draw.text(None, f"NEW: {name}", (255, 255, 255), (rect.left + 5, name_y), 12)
        
        # Draw genetics preview
        if genetics:
            preview_y = name_y + 20
            preview_text = f"Traits: {len(genetics)} available"
            self.legacy_context.draw.text(None, preview_text, (200, 200, 200), (rect.left + 5, preview_y), 10)
    
    def get_state(self) -> Dict[str, Any]:
        """Get current breeding state"""
        return {
            'selected_parents': self.logic.selected_parents.copy(),
            'breeding_cost': self.logic.breeding_cost,
            'can_breed': self.can_breed(),
            'breeding_status': self.get_breeding_status(),
            'offspring_display': self.offspring_display
        }
    
    def reset_state(self) -> None:
        """Reset breeding state"""
        self.logic.selected_parents.clear()
        self.offspring_display = None
        for slot_data in self.parent_slots:
            slot_data['turtle_data'] = None
            slot_data['is_selected'] = False
            slot_data['is_retired'] = False
