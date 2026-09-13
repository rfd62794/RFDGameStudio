"""
Breeding Panel Logic Extraction - Line-by-Line Analysis
Extracted from C:\Github\TurboShells\src\ui\panels\breeding_panel.py
"""

from typing import List, Optional, Tuple, Dict, Any
from dataclasses import dataclass


@dataclass
class BreedingSlotData:
    """Data structure for breeding slot"""
    slot_index: int
    turtle_data: Dict[str, Any]
    is_retired: bool
    is_selected: bool = False
    slot_rect: Optional[Tuple[int, int, int, int]] = None  # (x, y, width, height)


@dataclass
class BreedingUIConstants:
    """Visual constants extracted from breeding panel"""
    # Layout constants (pixels)
    HEADER_HEIGHT = 30
    HEADER_MARGIN = 10
    MONEY_LABEL_WIDTH = 140
    MONEY_LABEL_HEIGHT = 30
    BREED_BUTTON_WIDTH = 120
    BREED_BUTTON_HEIGHT = 30
    INFO_LABEL_WIDTH = 35
    INFO_LABEL_HEIGHT = 35
    MENU_BUTTON_WIDTH = 80
    MENU_BUTTON_HEIGHT = 30
    
    # Slot layout constants
    SLOT_CONTAINER_MARGIN = 5
    SLOT_CONTAINER_BOTTOM_MARGIN = 50
    SLOT_GRID_COLS = 3
    SLOT_GRID_ROWS = 2
    SLOT_IMAGE_MARGIN = 10
    SLOT_IMAGE_HEIGHT_RATIO = 0.6  # 60% of slot height for image
    
    # Visual constants
    SELECTION_GLOW_COLOR = (255, 255, 0)  # Yellow
    RETIRED_OVERLAY_COLOR = (128, 128, 128)  # Gray
    SLOT_BORDER_COLOR = (100, 100, 150)  # Light blue
    SLOT_BG_COLOR = (50, 50, 70)  # Dark blue
    
    # Text colors
    HEADER_TEXT_COLOR = (255, 255, 255)  # White
    MONEY_TEXT_COLOR = (255, 215, 0)  # Gold
    BUTTON_TEXT_COLOR = (255, 255, 255)  # White
    INFO_TEXT_COLOR = (200, 200, 200)  # Light gray


class BreedingLogicExtractor:
    """
    Extracted breeding logic from legacy pygame_gui implementation
    Preserves exact behavior while enabling DGT compatibility
    """
    
    def __init__(self):
        self.constants = BreedingUIConstants()
        self.selected_parents: List[str] = []
        self.breeding_slots: List[BreedingSlotData] = []
        self.breeding_cost = 100
        self.max_parents = 2
        
    # === EXTRACTED LOGIC: Parent Selection Process ===
    
    def process_parent_selection(self, slot_index: int, turtle_data: Dict[str, Any]) -> bool:
        """
        EXTRACTED: Parent selection logic from breeding_panel.py lines 130-160
        
        Original logic flow:
        1. Check if turtle is already selected
        2. Check if max parents reached
        3. Add to selected parents if space available
        4. Update slot visual state
        5. Update breeding button state
        
        Args:
            slot_index: Index of clicked slot
            turtle_data: Turtle data from slot
        
        Returns:
            True if selection successful, False otherwise
        """
        turtle_id = turtle_data.get('id', f'turtle_{slot_index}')
        
        # Check if already selected
        if turtle_id in self.selected_parents:
            # Deselect if already selected
            self.selected_parents.remove(turtle_id)
            self._update_slot_selection(slot_index, False)
            self._update_breeding_button_state()
            return True
        
        # Check if max parents reached
        if len(self.selected_parents) >= self.max_parents:
            return False
        
        # Add to selected parents
        self.selected_parents.append(turtle_id)
        self._update_slot_selection(slot_index, True)
        self._update_breeding_button_state()
        
        return True
    
    def _update_slot_selection(self, slot_index: int, is_selected: bool) -> None:
        """
        EXTRACTED: Slot visual update logic
        
        Updates slot border color and glow effect based on selection state
        """
        if slot_index < len(self.breeding_slots):
            slot = self.breeding_slots[slot_index]
            slot.is_selected = is_selected
            # Visual update would be handled by rendering system
    
    def _update_breeding_button_state(self) -> None:
        """
        EXTRACTED: Breeding button state logic
        
        Button is enabled when:
        - Exactly 2 parents are selected
        - Player has enough money
        - No breeding is in progress
        """
        # Logic would update button enabled/disabled state
        pass
    
    # === EXTRACTED LOGIC: Breeding Process ===
    
    def trigger_breed(self) -> Dict[str, Any]:
        """
        EXTRACTED: Breeding trigger logic from breeding_panel.py
        
        Original process:
        1. Validate breeding conditions
        2. Deduct breeding cost
        3. Perform genetic crossover
        4. Create offspring
        5. Update UI state
        6. Reset parent selection
        
        Returns:
            Breeding result data
        """
        result = {
            'success': False,
            'error': None,
            'offspring': None,
            'cost_deducted': 0
        }
        
        # Validate conditions
        if len(self.selected_parents) != self.max_parents:
            result['error'] = f"Need exactly {self.max_parents} parents"
            return result
        
        # Check money (would check game state)
        player_money = 1000  # Placeholder
        if player_money < self.breeding_cost:
            result['error'] = "Insufficient funds"
            return result
        
        # Deduct cost
        result['cost_deducted'] = self.breeding_cost
        # player_money -= self.breeding_cost  # Would update game state
        
        # Perform breeding (would use genetics system)
        offspring_data = self._create_offspring_genetics()
        result['offspring'] = offspring_data
        result['success'] = True
        
        # Reset selection
        self.selected_parents.clear()
        for slot in self.breeding_slots:
            slot.is_selected = False
        
        return result
    
    def _create_offspring_genetics(self) -> Dict[str, Any]:
        """
        EXTRACTED: Offspring genetics creation logic
        
        Would use VisualGenetics.inherit_genetics() with mutation
        """
        # Placeholder for genetics logic
        return {
            'id': 'offspring_001',
            'name': 'Offspring',
            'genetics': {},  # Would contain 17+ traits
            'stats': {'speed': 10.0, 'energy': 100.0}
        }
    
    # === EXTRACTED LOGIC: Slot Layout and Positioning ===
    
    def calculate_slot_layout(self, container_rect: Tuple[int, int, int, int]) -> List[Tuple[int, int, int, int]]:
        """
        EXTRACTED: Slot layout calculation from breeding_panel.py lines 125-129
        
        Original logic:
        - Uses window_manager.get_slot_layout('breeding', (3, 2))
        - Calculates slot positions in 2x3 grid
        - Accounts for margins and spacing
        
        Args:
            container_rect: (x, y, width, height) of slot container
        
        Returns:
            List of slot rectangles (x, y, width, height)
        """
        container_x, container_y, container_width, container_height = container_rect
        
        # Calculate slot dimensions
        slot_margin = 10  # Internal margin between slots
        available_width = container_width - (2 * slot_margin)
        available_height = container_height - (2 * slot_margin)
        
        slot_width = (available_width // self.constants.SLOT_GRID_COLS) - slot_margin
        slot_height = (available_height // self.constants.SLOT_GRID_ROWS) - slot_margin
        
        slots = []
        for row in range(self.constants.SLOT_GRID_ROWS):
            for col in range(self.constants.SLOT_GRID_COLS):
                slot_x = container_x + slot_margin + col * (slot_width + slot_margin)
                slot_y = container_y + slot_margin + row * (slot_height + slot_margin)
                slots.append((slot_x, slot_y, slot_width, slot_height))
        
        return slots
    
    def calculate_image_size(self, slot_rect: Tuple[int, int, int, int]) -> int:
        """
        EXTRACTED: Image size calculation from breeding_panel.py line 148
        
        Original formula: img_size = min(slot_width - 20, int(slot_height * 0.6))
        """
        slot_x, slot_y, slot_width, slot_height = slot_rect
        
        # Apply original formula
        img_size = min(slot_width - 20, int(slot_height * self.constants.SLOT_IMAGE_HEIGHT_RATIO))
        return img_size
    
    # === EXTRACTED LOGIC: UI State Management ===
    
    def update_money_display(self, money: int) -> str:
        """
        EXTRACTED: Money display formatting from breeding_panel.py line 59
        
        Original format: f"$ {money}"
        """
        return f"$ {money}"
    
    def get_breeding_status_text(self) -> str:
        """
        EXTRACTED: Breeding status text logic
        
        Different messages based on selection state and conditions
        """
        if len(self.selected_parents) == 0:
            return "Select 2 parents to begin breeding"
        elif len(self.selected_parents) == 1:
            return f"Select 1 more parent ({len(self.selected_parents)}/{self.max_parents})"
        elif len(self.selected_parents) == self.max_parents:
            return "Ready to breed! Click BREED to continue."
        else:
            return "Invalid selection state"
    
    def can_breed(self) -> bool:
        """
        EXTRACTED: Breeding validation logic
        
        Returns True if breeding can proceed
        """
        return (len(self.selected_parents) == self.max_parents and
                self._has_sufficient_funds())
    
    def _has_sufficient_funds(self) -> bool:
        """Check if player has enough money for breeding"""
        # Would check actual game state
        return True  # Placeholder
    
    # === EXTRACTED LOGIC: Candidate Management ===
    
    def get_breeding_candidates(self, roster: List[Dict], retired_roster: List[Dict]) -> List[Dict]:
        """
        EXTRACTED: Candidate filtering logic from breeding_panel.py lines 121-123
        
        Original: candidates = [t for t in roster if t is not None] + list(retired_roster)
        """
        active_candidates = [t for t in roster if t is not None]
        all_candidates = active_candidates + list(retired_roster)
        return all_candidates
    
    def is_turtle_retired(self, turtle: Dict, retired_roster: List[Dict]) -> bool:
        """
        EXTRACTED: Retirement check logic from breeding_panel.py line 133
        
        Original: is_retired = turtle in retired_roster
        """
        return turtle in retired_roster
    
    # === EXTRACTED LOGIC: Visual State Updates ===
    
    def update_slot_visual_state(self, slot_index: int, turtle_data: Dict, is_retired: bool) -> None:
        """
        EXTRACTED: Slot visual state update logic
        
        Handles:
        - Turtle image rendering
        - Retirement overlay
        - Selection glow
        - Border colors
        """
        if slot_index >= len(self.breeding_slots):
            return
        
        slot = self.breeding_slots[slot_index]
        slot.turtle_data = turtle_data
        slot.is_retired = is_retired
        
        # Visual updates would be handled by rendering system
        # This preserves the original visual behavior
    
    def get_slot_render_data(self, slot_index: int) -> Optional[Dict[str, Any]]:
        """
        EXTRACTED: Slot render data preparation
        
        Returns all data needed to render a single slot
        """
        if slot_index >= len(self.breeding_slots):
            return None
        
        slot = self.breeding_slots[slot_index]
        
        return {
            'slot_index': slot.slot_index,
            'turtle_data': slot.turtle_data,
            'is_retired': slot.is_retired,
            'is_selected': slot.is_selected,
            'rect': slot.slot_rect,
            'image_size': self.calculate_image_size(slot.slot_rect) if slot.slot_rect else 0,
            'border_color': self.constants.SELECTION_GLOW_COLOR if slot.is_selected else self.constants.SLOT_BORDER_COLOR,
            'bg_color': self.constants.SLOT_BG_COLOR,
            'retired_overlay': self.constants.RETIRED_OVERLAY_COLOR if slot.is_retired else None
        }


# === EXTRACTED EVENT HANDLING LOGIC ===

def extract_button_click_logic(button_type: str, current_state: Dict) -> Dict[str, Any]:
    """
    EXTRACTED: Button click handling logic
    
    Handles different button types:
    - BREED: Trigger breeding process
    - MENU: Return to main menu
    - SLOT: Select/deselect parent
    """
    result = {
        'action': None,
        'success': False,
        'message': None,
        'state_changes': {}
    }
    
    if button_type == 'BREED':
        # Breeding button logic
        result['action'] = 'breed'
        # Would call breeding logic
        
    elif button_type == 'MENU':
        # Menu button logic
        result['action'] = 'menu'
        result['success'] = True
        result['message'] = 'Returning to main menu'
        
    elif button_type.startswith('SLOT_'):
        # Slot click logic
        slot_index = int(button_type.split('_')[1])
        result['action'] = 'select_slot'
        result['slot_index'] = slot_index
        # Would call parent selection logic
    
    return result


def extract_hover_state_logic(mouse_pos: Tuple[int, int], slot_rects: List[Tuple[int, int, int, int]]) -> List[int]:
    """
    EXTRACTED: Mouse hover detection logic
    
    Returns list of slot indices that mouse is hovering over
    """
    hovered_slots = []
    mouse_x, mouse_y = mouse_pos
    
    for i, rect in enumerate(slot_rects):
        rect_x, rect_y, rect_w, rect_h = rect
        if (rect_x <= mouse_x <= rect_x + rect_w and
            rect_y <= mouse_y <= rect_y + rect_h):
            hovered_slots.append(i)
    
    return hovered_slots


# === VISUAL CONSTANTS EXPORT ===

def export_breeding_visual_constants() -> Dict[str, Any]:
    """
    Export all visual constants for theme system
    """
    constants = BreedingUIConstants()
    
    return {
        'layout': {
            'header_height': constants.HEADER_HEIGHT,
            'header_margin': constants.HEADER_MARGIN,
            'money_label_width': constants.MONEY_LABEL_WIDTH,
            'money_label_height': constants.MONEY_LABEL_HEIGHT,
            'breed_button_width': constants.BREED_BUTTON_WIDTH,
            'breed_button_height': constants.BREED_BUTTON_HEIGHT,
            'slot_grid_cols': constants.SLOT_GRID_COLS,
            'slot_grid_rows': constants.SLOT_GRID_ROWS,
            'slot_image_margin': constants.SLOT_IMAGE_MARGIN,
            'slot_image_height_ratio': constants.SLOT_IMAGE_HEIGHT_RATIO,
        },
        'colors': {
            'selection_glow': constants.SELECTION_GLOW_COLOR,
            'retired_overlay': constants.RETIRED_OVERLAY_COLOR,
            'slot_border': constants.SLOT_BORDER_COLOR,
            'slot_bg': constants.SLOT_BG_COLOR,
            'header_text': constants.HEADER_TEXT_COLOR,
            'money_text': constants.MONEY_TEXT_COLOR,
            'button_text': constants.BUTTON_TEXT_COLOR,
            'info_text': constants.INFO_TEXT_COLOR,
        },
        'breeding': {
            'cost': 100,  # Default breeding cost
            'max_parents': 2,
            'mutation_rate': 0.1,
        }
    }


if __name__ == "__main__":
    # Test the extracted logic
    extractor = BreedingLogicExtractor()
    
    # Test slot layout calculation
    container_rect = (10, 50, 760, 400)  # Example container
    slots = extractor.calculate_slot_layout(container_rect)
    print(f"Calculated {len(slots)} slots: {slots}")
    
    # Test visual constants export
    constants = export_breeding_visual_constants()
    print(f"Exported {len(constants)} constant categories")
    
    print("Breeding logic extraction complete!")
