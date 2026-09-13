"""
Race Translator - Genetic Trait to Physics Mapping
Bridges TurboGenome traits to DGT Engine physics parameters

This module translates the 17 genetic traits from TurboGenome into
the 8 core stats used by the race engine, maintaining the exact
behavioral characteristics from the legacy system.
"""

from typing import Dict, Any, Tuple
from dataclasses import dataclass
from foundation.types import Result
from foundation.genetics.genome_engine import TurboGenome, LimbShapeType


@dataclass
class RaceStats:
    """Core race statistics derived from genetic traits"""
    speed: float          # Movement velocity (base: 10)
    max_energy: float     # Energy capacity (base: 100)
    recovery: float       # Energy restoration rate (base: 5)
    swim: float          # Water terrain performance (base: 5)
    climb: float         # Land terrain performance (base: 5)
    stamina: float       # Recovery bonus (base: 0)
    luck: float          # Random event modifier (base: 0)
    
    def to_dict(self) -> Dict[str, float]:
        """Convert to dictionary format"""
        return {
            'speed': self.speed,
            'max_energy': self.max_energy,
            'recovery': self.recovery,
            'swim': self.swim,
            'climb': self.climb,
            'stamina': self.stamina,
            'luck': self.luck
        }


class RaceTranslator:
    """
    Translates genetic traits into race physics statistics.
    
    This is the bridge between the Foundation's genetic data
    and the Engine's physics simulation, ensuring behavioral
    compatibility with the legacy TurboShells system.
    """
    
    def __init__(self):
        """Initialize translator with legacy-compatible mappings"""
        # Base values from legacy system
        self.base_stats = {
            'speed': 10.0,
            'max_energy': 100.0,
            'recovery': 5.0,
            'swim': 5.0,
            'climb': 5.0,
            'stamina': 0.0,
            'luck': 0.0
        }
        
        # Trait influence weights (calibrated to legacy behavior)
        self.trait_weights = {
            # Speed modifiers
            'leg_length_speed_weight': 3.0,      # Longer legs = faster
            'shell_size_speed_weight': -1.5,     # Bigger shell = slower
            'body_density_speed_weight': -0.5,   # Denser body = slower
            
            # Energy modifiers
            'shell_size_energy_weight': 2.0,      # Bigger shell = more energy
            'head_size_energy_weight': 0.5,       # Bigger head = more energy
            'leg_thickness_energy_weight': 1.0,   # Thicker legs = more energy
            
            # Recovery modifiers
            'stamina_recovery_weight': 2.0,       # Body density affects recovery
            'shell_density_recovery_weight': -0.3, # Heavy shell = slower recovery
            
            # Terrain performance
            'flipper_swim_bonus': 3.0,            # Flippers = swim bonus
            'feet_climb_bonus': 3.0,               # Feet = climb bonus
            'fins_balanced_bonus': 1.5,           # Fins = balanced bonus
            
            # Luck from pattern complexity
            'complex_pattern_luck_bonus': 0.5      # Complex patterns = luck
        }
    
    def translate_genome_to_stats(self, genome: TurboGenome) -> Result[RaceStats]:
        """
        Translate a TurboGenome into race statistics.
        
        Args:
            genome: Valid TurboGenome instance
            
        Returns:
            Result containing RaceStats or error
        """
        try:
            # Start with base stats
            stats = RaceStats(**self.base_stats)
            
            # Apply trait-based modifications
            self._apply_speed_modifiers(genome, stats)
            self._apply_energy_modifiers(genome, stats)
            self._apply_recovery_modifiers(genome, stats)
            self._apply_terrain_modifiers(genome, stats)
            self._apply_luck_modifiers(genome, stats)
            
            # Validate final stats
            self._validate_stats(stats)
            
            return Result(success=True, value=stats)
            
        except Exception as e:
            return Result(success=False, error=f"Translation failed: {e}")
    
    def _apply_speed_modifiers(self, genome: TurboGenome, stats: RaceStats) -> None:
        """Apply genetic traits that affect speed"""
        # Leg length is primary speed factor
        leg_speed_bonus = (genome.leg_length - 1.0) * self.trait_weights['leg_length_speed_weight']
        stats.speed += leg_speed_bonus
        
        # Shell size affects speed (heavier = slower)
        shell_speed_penalty = (genome.shell_size_modifier - 1.0) * self.trait_weights['shell_size_speed_weight']
        stats.speed += shell_speed_penalty
        
        # Body density affects speed
        body_density_penalty = (genome.body_pattern_density - 0.3) * self.trait_weights['body_density_speed_weight']
        stats.speed += body_density_penalty
        
        # Limb shape affects speed
        if genome.limb_shape == LimbShapeType.FLIPPERS:
            stats.speed *= 1.1  # Flippers are slightly faster overall
        elif genome.limb_shape == LimbShapeType.FEET:
            stats.speed *= 0.95  # Feet are slightly slower overall
    
    def _apply_energy_modifiers(self, genome: TurboGenome, stats: RaceStats) -> None:
        """Apply genetic traits that affect energy"""
        # Shell size affects energy capacity
        shell_energy_bonus = (genome.shell_size_modifier - 1.0) * self.trait_weights['shell_size_energy_weight'] * 10
        stats.max_energy += shell_energy_bonus
        
        # Head size affects energy
        head_energy_bonus = (genome.head_size_modifier - 1.0) * self.trait_weights['head_size_energy_weight'] * 5
        stats.max_energy += head_energy_bonus
        
        # Leg thickness affects energy
        leg_energy_bonus = (genome.leg_thickness_modifier - 1.0) * self.trait_weights['leg_thickness_energy_weight'] * 5
        stats.max_energy += leg_energy_bonus
    
    def _apply_recovery_modifiers(self, genome: TurboGenome, stats: RaceStats) -> None:
        """Apply genetic traits that affect recovery"""
        # Calculate stamina from body and shell density
        body_stamina = (1.0 - genome.body_pattern_density) * 5.0
        shell_stamina_penalty = (genome.shell_pattern_density - 0.5) * self.trait_weights['shell_density_recovery_weight']
        
        stats.stamina = max(0, body_stamina + shell_stamina_penalty)
        
        # Recovery rate is affected by stamina
        recovery_bonus = stats.stamina * self.trait_weights['stamina_recovery_weight']
        stats.recovery += recovery_bonus
    
    def _apply_terrain_modifiers(self, genome: TurboGenome, stats: RaceStats) -> None:
        """Apply genetic traits that affect terrain performance"""
        # Limb shape determines terrain specialization
        if genome.limb_shape == LimbShapeType.FLIPPERS:
            stats.swim += self.trait_weights['flipper_swim_bonus']
            stats.climb -= 1.0  # Flippers are poor for climbing
        elif genome.limb_shape == LimbShapeType.FEET:
            stats.climb += self.trait_weights['feet_climb_bonus']
            stats.swim -= 1.0  # Feet are poor for swimming
        elif genome.limb_shape == LimbShapeType.FINS:
            # Fins provide balanced performance
            stats.swim += self.trait_weights['fins_balanced_bonus']
            stats.climb += self.trait_weights['fins_balanced_bonus']
        
        # Leg length affects both terrains
        leg_terrain_bonus = (genome.leg_length - 1.0) * 1.0
        stats.swim += leg_terrain_bonus
        stats.climb += leg_terrain_bonus
        
        # Shell size affects climbing (heavier shells are harder to lift)
        shell_climb_penalty = (genome.shell_size_modifier - 1.0) * 2.0
        stats.climb -= shell_climb_penalty
    
    def _apply_luck_modifiers(self, genome: TurboGenome, stats: RaceStats) -> None:
        """Apply genetic traits that affect luck"""
        # Complex patterns provide luck bonus
        pattern_complexity = 0.0
        
        # Shell pattern complexity
        if genome.shell_pattern_type.value in ['rings', 'stripes']:
            pattern_complexity += 0.3
        if genome.shell_pattern_density > 0.7:
            pattern_complexity += 0.2
        
        # Body pattern complexity
        if genome.body_pattern_type.value in ['mottled', 'marbled']:
            pattern_complexity += 0.2
        if genome.body_pattern_density > 0.5:
            pattern_complexity += 0.1
        
        stats.luck = pattern_complexity * self.trait_weights['complex_pattern_luck_bonus']
    
    def _validate_stats(self, stats: RaceStats) -> None:
        """Validate final stats are within reasonable bounds"""
        # Ensure stats don't go negative or too extreme
        stats.speed = max(1.0, min(25.0, stats.speed))
        stats.max_energy = max(50.0, min(200.0, stats.max_energy))
        stats.recovery = max(1.0, min(15.0, stats.recovery))
        stats.swim = max(1.0, min(15.0, stats.swim))
        stats.climb = max(1.0, min(15.0, stats.climb))
        stats.stamina = max(0.0, min(10.0, stats.stamina))
        stats.luck = max(0.0, min(2.0, stats.luck))
    
    def get_trait_influence_report(self, genome: TurboGenome) -> Dict[str, Any]:
        """
        Generate a detailed report of how each trait influences stats.
        
        Args:
            genome: Genome to analyze
            
        Returns:
            Dictionary containing trait influence analysis
        """
        base_stats = RaceStats(**self.base_stats)
        translated_result = self.translate_genome_to_stats(genome)
        
        if not translated_result.success:
            return {'error': translated_result.error}
        
        final_stats = translated_result.value
        
        # Calculate differences
        influences = {}
        
        for stat_name in base_stats.to_dict().keys():
            base_val = getattr(base_stats, stat_name)
            final_val = getattr(final_stats, stat_name)
            difference = final_val - base_val
            percent_change = (difference / base_val) * 100 if base_val != 0 else 0
            
            influences[stat_name] = {
                'base': base_val,
                'final': final_val,
                'difference': difference,
                'percent_change': percent_change
            }
        
        # Add trait analysis
        trait_analysis = {
            'primary_speed_factor': genome.leg_length,
            'primary_energy_factor': genome.shell_size_modifier,
            'terrain_specialization': genome.limb_shape.value,
            'stamina_source': 'body_density' if genome.body_pattern_density < 0.5 else 'shell_density',
            'luck_source': 'pattern_complexity' if genome.shell_pattern_density > 0.7 else 'none'
        }
        
        return {
            'influences': influences,
            'trait_analysis': trait_analysis,
            'summary': f"Speed: {final_stats.speed:.1f}, Energy: {final_stats.max_energy:.0f}, "
                     f"Specialization: {trait_analysis['terrain_specialization']}"
        }


# Factory functions
def create_race_translator() -> RaceTranslator:
    """Create a race translator instance"""
    return RaceTranslator()


def translate_wild_turtle_stats() -> Result[RaceStats]:
    """
    Generate and translate a wild turtle's stats.
    
    Returns:
        Result containing RaceStats for a randomly generated turtle
    """
    from foundation.genetics.genome_engine import generate_wild_turtle
    
    genome = generate_wild_turtle()
    translator = create_race_translator()
    return translator.translate_genome_to_stats(genome)


def create_specialized_stats(specialization: str) -> Result[RaceStats]:
    """
    Create stats for a specialized turtle type.
    
    Args:
        specialization: 'swimmer', 'climber', or 'balanced'
        
    Returns:
        Result containing specialized RaceStats
    """
    from foundation.genetics.genome_engine import create_fast_swimmer_genome, create_climber_genome, create_balanced_genome
    
    genome_creators = {
        'swimmer': create_fast_swimmer_genome,
        'climber': create_climber_genome,
        'balanced': create_balanced_genome
    }
    
    if specialization not in genome_creators:
        return Result(success=False, error=f"Unknown specialization: {specialization}")
    
    genome = genome_creators[specialization]()
    translator = create_race_translator()
    return translator.translate_genome_to_stats(genome)
