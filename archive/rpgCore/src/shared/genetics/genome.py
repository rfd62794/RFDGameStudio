from dataclasses import dataclass, field
from typing import Tuple, Dict, Optional, List
import uuid

from .cultural_base import CulturalBase

@dataclass
class SlimeGenome:
    # Visual traits
    shape: str        # round, cubic, elongated, crystalline, amorphous
    size: str         # tiny, small, medium, large, massive
    base_color: Tuple[int, int, int] # RGB
    pattern: str      # solid, spotted, striped, marbled, iridescent
    pattern_color: Tuple[int, int, int] # RGB
    accessory: str    # none, crown, scar, glow, shell, crystals
    
    # Personality traits (0.0-1.0)
    curiosity: float  # moves toward new things
    energy: float     # movement speed and frequency
    affection: float  # moves toward player cursor
    shyness: float    # retreats from sudden input
    
    # Base Stats (Inherited Genetics)
    base_hp: float = 20.0
    base_atk: float = 5.0
    base_spd: float = 5.0
    generation: int = 1

    # Cultural identity
    cultural_base: CulturalBase = CulturalBase.VOID
    
    # NEW: Extended genetics fields
    culture_expression: Dict[str, float] = field(default_factory=dict)  # Six culture weights
    parent_ids: Optional[Tuple[str, str]] = None  # UUID strings of parents
    mutations: List[Dict] = field(default_factory=list)  # Mutation history
    
    # NEW: Lifecycle fields
    level: int = 0  # 0-10, preserve if exists, default 0
    experience_points: int = 0  # Current experience toward next level
    
    # Hexagon adjacency map for tier calculation
    HEXAGON_ADJACENCY = {
        'ember': ['gale', 'marsh'],  # Adjacent to gale and marsh
        'gale': ['ember', 'tundra'],   # Adjacent to ember and tundra
        'crystal': ['gale', 'tide'],  # Adjacent to gale and tide
        'marsh': ['ember', 'tide'],    # Adjacent to ember and tide
        'tide': ['crystal', 'marsh'],  # Adjacent to crystal and marsh
        'tundra': ['gale', 'marsh'],   # Adjacent to gale and marsh
    }
    
    def __post_init__(self):
        """Initialize derived fields after construction"""
        # Only initialize culture_expression if it's empty
        # This allows manual setting after construction
        if not self.culture_expression:
            if self.cultural_base == CulturalBase.VOID:
                # Void gets equal distribution (same as varied for now)
                self.culture_expression = {
                    'ember': 0.167, 'gale': 0.167, 'crystal': 0.167,
                    'marsh': 0.167, 'tide': 0.167, 'tundra': 0.167
                }
            else:
                # Pure culture gets 1.0 on that culture
                culture_name = self.cultural_base.value
                self.culture_expression = {
                    'ember': 0.0, 'gale': 0.0, 'crystal': 0.0,
                    'marsh': 0.0, 'tide': 0.0, 'tundra': 0.0
                }
                if culture_name in self.culture_expression:
                    self.culture_expression[culture_name] = 1.0
    
    @property
    def tier(self) -> int:
        """Calculate genetic tier based on culture expression"""
        # Count cultures with expression >= 0.05
        active_cultures = [
            culture for culture, expr in self.culture_expression.items()
            if expr >= 0.05
        ]
        culture_count = len(active_cultures)
        
        if culture_count == 1:
            return 1  # Blooded
        elif culture_count == 2:
            # Check adjacency for Tier 2/3/4
            c1, c2 = active_cultures
            if c2 in self.HEXAGON_ADJACENCY.get(c1, []):
                return 2  # Bordered (adjacent)
            elif self._are_opposite(c1, c2):
                return 3  # Sundered (opposite)
            else:
                return 4  # Drifted (skip-one)
        elif culture_count == 3:
            return 5  # Threaded
        elif culture_count == 4:
            return 6  # Convergent
        elif culture_count == 5:
            return 7  # Liminal
        elif culture_count == 6:
            return 8  # Void
        else:
            return 1  # Default to Blooded
    
    @property
    def tier_name(self) -> str:
        """Get tier name from tier number"""
        tier_names = {
            1: 'Blooded',
            2: 'Bordered', 
            3: 'Sundered',
            4: 'Drifted',
            5: 'Threaded',
            6: 'Convergent',
            7: 'Liminal',
            8: 'Void'
        }
        return tier_names.get(self.tier, 'Blooded')
    
    @property
    def personality_axes(self) -> Dict[str, float]:
        """Map to 6-axis personality system"""
        return {
            'aggression': self.culture_expression.get('ember', 0.0),
            'curiosity': self.culture_expression.get('gale', 0.0) + self.curiosity * 0.1,
            'patience': self.culture_expression.get('marsh', 0.0),
            'caution': self.culture_expression.get('crystal', 0.0),
            'independence': self.culture_expression.get('tundra', 0.0),
            'sociability': self.culture_expression.get('tide', 0.0),
        }
    
    def _are_opposite(self, culture1: str, culture2: str) -> bool:
        """Check if two cultures are opposite on hexagon"""
        opposites = {
            'ember': 'crystal',
            'crystal': 'ember',
            'gale': 'tundra',
            'tundra': 'gale',
            'marsh': 'tide',
            'tide': 'marsh'
        }
        return opposites.get(culture1) == culture2
    
    # Lifecycle properties
    @property
    def stage(self) -> str:
        """Calculate life stage from level"""
        if self.level <= 1:
            return 'Hatchling'
        elif self.level <= 3:
            return 'Juvenile'
        elif self.level <= 5:
            return 'Young'
        elif self.level <= 7:
            return 'Prime'
        elif self.level <= 9:
            return 'Veteran'
        else:
            return 'Elder'
    
    @property
    def can_dispatch(self) -> bool:
        """Can this slime be dispatched?"""
        return self.stage != 'Hatchling'
    
    @property
    def can_breed(self) -> bool:
        """Can this slime breed?"""
        return self.stage not in ['Hatchling', 'Juvenile']
    
    @property
    def can_equip(self) -> bool:
        """Can this slime equip items?"""
        return self.stage not in ['Hatchling', 'Juvenile']
    
    @property
    def can_mentor(self) -> bool:
        """Can this slime mentor younger slimes?"""
        return self.stage in ['Veteran', 'Elder']
    
    @property
    def dispatch_risk(self) -> str:
        """Risk level for dispatch based on stage"""
        risk_map = {
            'Hatchling': 'none',
            'Juvenile': 'low',
            'Young': 'standard',
            'Prime': 'standard',
            'Veteran': 'high',
            'Elder': 'critical'
        }
        return risk_map.get(self.stage, 'standard')
    
    @property
    def stage_modifier(self) -> str:
        """Tier × stage interaction modifier"""
        tier_name = self.tier_name.lower()
        stage_name = self.stage.lower()
        
        # Special combinations
        if tier_name == 'sundered' and stage_name == 'prime':
            return 'volatile_peak'
        elif tier_name == 'liminal' and stage_name == 'elder':
            return 'threshold_legacy'
        elif tier_name == 'void':
            return f'primordial_{stage_name}'
        else:
            return 'standard'
    
    @property
    def experience_to_next(self) -> int:
        """Experience needed for next level"""
        if self.level >= 10:  # Elder is max level
            return 0
        return (self.level + 1) * 100  # Simple curve: level * 100

def calculate_race_stats(genome) -> dict:
    """Calculate racing-specific stats from genome."""
    # Convert size string to numeric value
    size_values = {
        "tiny": 0.3, "small": 0.5, "medium": 0.7, 
        "large": 0.9, "massive": 1.0
    }
    body_size = size_values.get(genome.size, 0.7)
    
    # Mass mechanics - non-linear scaling
    mass = body_size ** 1.5
    
    # Strength derived from attack stat
    strength = genome.base_atk / 100.0  # normalize 0-1
    
    # Heft power for obstacle interaction
    heft_power = mass * (1.0 + strength * 0.5)
    
    # Jump force and distance
    jump_force = 50.0 * (1.0 + strength * 0.3)
    jump_distance = (jump_force / mass) * body_size
    jump_cooldown = 0.2 + (mass * 0.4) * (1.0 - strength * 0.2)
    jump_height = 14  # Fixed 14px max for subtle bounce
    
    return {
        "mass": mass,
        "heft_power": heft_power,
        "jump_distance": jump_distance,
        "jump_cooldown": jump_cooldown,
        "jump_height": jump_height,
        "body_size": body_size,
        "strength": strength,
    }
    @staticmethod
    def random_for_culture(culture: CulturalBase, seed: int = None) -> 'SlimeGenome':
        import random
        from .inheritance import generate_random
        rng = random.Random(seed) if seed is not None else random.Random()
        
        # We can't easily override generate_random's internal RNG without refactoring it,
        # but we can generate a random one and then fix up its core cultural traits 
        # to match the archetype, or just use the seed to make it deterministic.
        
        # For now, let's use the standard generate_random and ensure culture is set.
        # In a real implementation, we'd want deterministic trait generation based on the seed.
        genome = generate_random()
        genome.cultural_base = culture
        return genome

# Alias for clean imports in dungeon modules
Genome = SlimeGenome
