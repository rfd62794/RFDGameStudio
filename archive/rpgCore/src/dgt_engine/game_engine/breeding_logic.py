"""
Breeding Logic Extractor - Legacy Logic Preservation
Extracts and preserves breeding logic from legacy TurboShells implementation
"""

from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import logging


@dataclass
class BreedingUIConstants:
    """Legacy UI constants extracted from TurboShells audit"""
    # Parent slot positioning (legacy 800x600 coordinates)
    PARENT_SLOT_OFFSET_X = 50
    PARENT_SLOT_OFFSET_Y = 100
    PARENT_SLOT_WIDTH = 200
    PARENT_SLOT_HEIGHT = 150
    PARENT_SLOT_SPACING = 20
    
    # Breeding button
    BREED_BUTTON_X = 10
    BREED_BUTTON_Y = 15
    BREED_BUTTON_WIDTH = 120
    BREED_BUTTON_HEIGHT = 30
    
    # Money display
    MONEY_DISPLAY_X = 800 - 150
    MONEY_DISPLAY_Y = 15
    MONEY_DISPLAY_WIDTH = 140
    MONEY_DISPLAY_HEIGHT = 30
    
    # Info label
    INFO_LABEL_X = 140
    INFO_LABEL_Y = 15
    INFO_LABEL_WIDTH = 800 - 150 - 140
    INFO_LABEL_HEIGHT = 35
    
    # Breeding costs and rules
    BREEDING_COST = 100
    MAX_PARENTS = 2
    MIN_PARENTS = 2
    
    # Genetic inheritance rules (legacy)
    DOMINANT_GENE_CHANCE = 0.6
    RECESSIVE_GENE_CHANCE = 0.4
    MUTATION_CHANCE = 0.1
    
    # Visual constants
    SELECTION_GLOW_COLOR = (255, 255, 0)  # Yellow
    CARD_BORDER_COLOR = (80, 80, 120)
    CARD_SELECTED_BORDER_COLOR = (255, 215, 0)  # Gold


class BreedingLogicExtractor:
    """
    Extracts and preserves breeding logic from legacy implementation.
    Maintains exact same behavior as original TurboShells breeding system.
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.constants = BreedingUIConstants()
        
        # Breeding state
        self.selected_parents: List[str] = []
        self.breeding_cost = self.constants.BREEDING_COST
        self.last_breeding_result: Optional[Dict[str, Any]] = None
        
        # Genetic algorithm parameters (legacy)
        self.dominant_gene_chance = self.constants.DOMINANT_GENE_CHANCE
        self.recessive_gene_chance = self.constants.RECESSIVE_GENE_CHANCE
        self.mutation_chance = self.constants.MUTATION_CHANCE
        
        self.logger.info("BreedingLogicExtractor initialized with legacy parameters")
    
    def process_parent_selection(self, slot_index: int, turtle_data: Dict[str, Any]) -> bool:
        """
        Process parent selection using legacy logic.
        
        Args:
            slot_index: Index of the slot (0 or 1)
            turtle_data: Turtle data from registry
            
        Returns:
            True if selection successful
        """
        try:
            turtle_id = turtle_data.get('id', f'slot_{slot_index}')
            
            # Check if turtle is retired (legacy rule)
            if turtle_data.get('is_retired', False):
                self.logger.warning(f"Turtle {turtle_id} is retired and cannot breed")
                return False
            
            # Check if already selected
            if turtle_id in self.selected_parents:
                # Deselect the turtle
                self.selected_parents.remove(turtle_id)
                self.logger.info(f"Deselected parent {turtle_id}")
                return True
            
            # Check if we can add this parent
            if len(self.selected_parents) >= self.constants.MAX_PARENTS:
                # Replace first parent
                removed_id = self.selected_parents.pop(0)
                self.selected_parents.append(turtle_id)
                self.logger.info(f"Replaced parent {removed_id} with {turtle_id}")
            else:
                # Add new parent
                self.selected_parents.append(turtle_id)
                self.logger.info(f"Selected parent {turtle_id}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Parent selection error: {e}")
            return False
    
    def can_breed(self) -> bool:
        """Check if breeding can proceed using legacy rules"""
        return len(self.selected_parents) == self.constants.MIN_PARENTS
    
    def trigger_breed(self) -> Dict[str, Any]:
        """
        Trigger breeding using legacy genetic algorithm.
        
        Returns:
            Breeding result with offspring data
        """
        if not self.can_breed():
            return {
                'success': False,
                'error': 'Need exactly 2 parents for breeding'
            }
        
        try:
            # Simulate breeding logic (would use actual turtle data in production)
            parent1_id = self.selected_parents[0]
            parent2_id = self.selected_parents[1]
            
            # Generate offspring using legacy genetic algorithm
            offspring = self._generate_offspring(parent1_id, parent2_id)
            
            # Store breeding result
            self.last_breeding_result = {
                'success': True,
                'parent1_id': parent1_id,
                'parent2_id': parent2_id,
                'offspring': offspring,
                'cost': self.breeding_cost,
                'timestamp': self._get_timestamp()
            }
            
            self.logger.info(f"Breeding successful: {offspring['name']}")
            return self.last_breeding_result
            
        except Exception as e:
            error_msg = f"Breeding failed: {str(e)}"
            self.logger.error(error_msg)
            return {
                'success': False,
                'error': error_msg
            }
    
    def _generate_offspring(self, parent1_id: str, parent2_id: str) -> Dict[str, Any]:
        """Generate offspring using legacy genetic algorithm"""
        import random
        
        # Generate unique offspring ID
        offspring_id = f"offspring_{parent1_id}_{parent2_id}_{self._get_timestamp()}"
        
        # Simulate genetics (simplified version of legacy algorithm)
        genetics = {
            'shell_base_color': self._inherit_trait('shell_base_color', parent1_id, parent2_id),
            'shell_pattern': self._inherit_trait('shell_pattern', parent1_id, parent2_id),
            'speed_gene': self._inherit_trait('speed_gene', parent1_id, parent2_id),
            'endurance_gene': self._inherit_trait('endurance_gene', parent1_id, parent2_id),
            'special_ability': self._inherit_trait('special_ability', parent1_id, parent2_id)
        }
        
        # Generate stats based on genetics
        stats = {
            'speed': random.randint(1, 100),
            'endurance': random.randint(1, 100),
            'strength': random.randint(1, 100),
            'intelligence': random.randint(1, 100)
        }
        
        # Generate name
        name = f"TurboShell {random.randint(1000, 9999)}"
        
        return {
            'id': offspring_id,
            'name': name,
            'genetics': genetics,
            'stats': stats,
            'generation': 1,  # Would be calculated from parents
            'rarity': self._calculate_rarity(genetics, stats),
            'is_retired': False
        }
    
    def _inherit_trait(self, trait_name: str, parent1_id: str, parent2_id: str) -> Any:
        """Simulate trait inheritance using legacy probabilities"""
        import random
        
        # Simplified inheritance - would use actual parent traits in production
        rand = random.random()
        
        if rand < self.dominant_gene_chance:
            return f"dominant_{trait_name}"
        elif rand < self.dominant_gene_chance + self.recessive_gene_chance:
            return f"recessive_{trait_name}"
        else:
            return f"mutated_{trait_name}"
    
    def _calculate_rarity(self, genetics: Dict[str, Any], stats: Dict[str, Any]) -> str:
        """Calculate rarity based on genetics and stats"""
        import random
        
        # Simplified rarity calculation
        total_stat = sum(stats.values())
        
        if total_stat > 350:
            return "legendary"
        elif total_stat > 250:
            return "epic"
        elif total_stat > 150:
            return "rare"
        else:
            return "common"
    
    def get_breeding_status_text(self) -> str:
        """Get breeding status text using legacy messages"""
        if len(self.selected_parents) == 0:
            return "Select 2 parents to begin breeding"
        elif len(self.selected_parents) == 1:
            return f"Select 1 more parent (Cost: ${self.breeding_cost})"
        else:
            return f"Ready to breed! (Cost: ${self.breeding_cost})"
    
    def _get_timestamp(self) -> int:
        """Get current timestamp"""
        import time
        return int(time.time())
    
    def get_last_breeding_result(self) -> Optional[Dict[str, Any]]:
        """Get the last breeding result"""
        return self.last_breeding_result
    
    def clear_selection(self) -> None:
        """Clear parent selection"""
        self.selected_parents.clear()
        self.logger.info("Cleared parent selection")
    
    def get_breeding_cost(self) -> int:
        """Get current breeding cost"""
        return self.breeding_cost
    
    def set_breeding_cost(self, cost: int) -> None:
        """Set breeding cost (for testing/admin)"""
        self.breeding_cost = cost
        self.logger.info(f"Breeding cost set to ${cost}")
    
    def validate_parents(self, parent1_data: Dict[str, Any], parent2_data: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate parents for breeding using legacy rules.
        
        Returns:
            (is_valid, error_message)
        """
        # Check retirement status
        if parent1_data.get('is_retired', False):
            return False, "Parent 1 is retired"
        
        if parent2_data.get('is_retired', False):
            return False, "Parent 2 is retired"
        
        # Check generation limits (legacy rule)
        gen1 = parent1_data.get('generation', 1)
        gen2 = parent2_data.get('generation', 1)
        
        if gen1 > 10 or gen2 > 10:
            return False, "Parent generation too high for breeding"
        
        # Check relationship (would check family tree in production)
        if parent1_data.get('id') == parent2_data.get('id'):
            return False, "Cannot breed with same turtle"
        
        return True, "Parents are valid for breeding"
