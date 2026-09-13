"""
Terrain Interaction System - DGT Tier 2 Architecture

Transplanted from TurboShells race_engine.py terrain logic with bitmask hardening.
Handles terrain-modifier math and genetic trait interactions for racing.

This system determines how different terrains affect turtle movement based on
their genetic traits (limb shape, shell size, etc.).
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
import math

from ...foundation.base import ComponentConfig
from ...systems.base import BaseSystem, SystemConfig
from ...foundation.types import Result
from ...foundation.types.race import (
    TurtleState, RaceConfig, TerrainSegment, TerrainType
)
from ...foundation.genetics.schema import TurboGenome, LimbShape


@dataclass
class TerrainProperties:
    """Properties of a terrain type"""
    speed_modifier: float = 1.0      # Movement speed multiplier
    energy_drain: float = 1.0        # Energy drain multiplier
    difficulty: float = 1.0         # Overall difficulty rating
    hazard_chance: float = 0.0       # Chance of getting stuck
    recovery_penalty: float = 0.0    # Extra energy cost to recover


@dataclass
class GeneticTerrainBonus:
    """Genetic bonuses for specific terrain types"""
    terrain_type: TerrainType
    speed_bonus: float = 1.0
    energy_bonus: float = 1.0
    stability_bonus: float = 1.0
    
    def calculate_total_bonus(self) -> float:
        """Calculate overall terrain bonus"""
        return (self.speed_bonus * self.energy_bonus * self.stability_bonus) ** (1/3)


class TerrainBitmask:
    """Bitmask-based terrain interaction system"""
    
    # Terrain type bit positions
    GRASS_BIT = 0
    MUD_BIT = 1
    WATER_BIT = 2
    SAND_BIT = 3
    ROCK_BIT = 4
    ROUGH_BIT = 5
    TRACK_BIT = 6
    FINISH_BIT = 7
    
    # Genetic trait bit positions
    FINS_BIT = 0
    FEET_BIT = 1
    FLIPPERS_BIT = 2
    LARGE_SHELL_BIT = 3
    SMALL_SHELL_BIT = 4
    LONG_LEGS_BIT = 5
    SHORT_LEGS_BIT = 6
    
    @classmethod
    def create_terrain_mask(cls, terrain_type: TerrainType) -> int:
        """Create terrain bitmask"""
        terrain_masks = {
            TerrainType.GRASS: 1 << cls.GRASS_BIT,
            TerrainType.MUD: 1 << cls.MUD_BIT,
            TerrainType.WATER: 1 << cls.WATER_BIT,
            TerrainType.SAND: 1 << cls.SAND_BIT,
            TerrainType.ROCK: 1 << cls.ROCK_BIT,
            TerrainType.ROUGH: 1 << cls.ROUGH_BIT,
            TerrainType.TRACK: 1 << cls.TRACK_BIT,
            TerrainType.FINISH: 1 << cls.FINISH_BIT
        }
        return terrain_masks.get(terrain_type, 0)
    
    @classmethod
    def create_genetic_mask(cls, genome: TurboGenome) -> int:
        """Create genetic trait bitmask"""
        mask = 0
        
        # Limb shape
        if genome.limb_shape == LimbShape.FINS:
            mask |= 1 << cls.FINS_BIT
        elif genome.limb_shape == LimbShape.FEET:
            mask |= 1 << cls.FEET_BIT
        else:  # FLIPPERS
            mask |= 1 << cls.FLIPPERS_BIT
        
        # Shell size
        if genome.shell_size_modifier > 1.2:
            mask |= 1 << cls.LARGE_SHELL_BIT
        elif genome.shell_size_modifier < 0.8:
            mask |= 1 << cls.SMALL_SHELL_BIT
        
        # Leg length
        if genome.leg_length > 1.2:
            mask |= 1 << cls.LONG_LEGS_BIT
        elif genome.leg_length < 0.8:
            mask |= 1 << cls.SHORT_LEGS_BIT
        
        return mask
    
    @classmethod
    def calculate_interaction(cls, terrain_mask: int, genetic_mask: int) -> Dict[str, float]:
        """Calculate terrain-genetic interaction using bitmask operations"""
        interactions = {
            'speed_modifier': 1.0,
            'energy_modifier': 1.0,
            'stability_modifier': 1.0
        }
        
        # Water interactions
        water_bit = 1 << cls.WATER_BIT
        if terrain_mask & water_bit:
            fins_bit = 1 << cls.FINS_BIT
            flippers_bit = 1 << cls.FLIPPERS_BIT
            
            if genetic_mask & fins_bit:
                interactions['speed_modifier'] *= 1.5  # Fins excel in water
                interactions['energy_modifier'] *= 0.8  # Less energy drain
                interactions['stability_modifier'] *= 1.3
            elif genetic_mask & flippers_bit:
                interactions['speed_modifier'] *= 1.2  # Flippers are good in water
                interactions['energy_modifier'] *= 0.9
                interactions['stability_modifier'] *= 1.1
            else:
                interactions['speed_modifier'] *= 0.6  # Feet struggle in water
                interactions['energy_modifier'] *= 1.4  # More energy drain
                interactions['stability_modifier'] *= 0.7
        
        # Mud interactions
        mud_bit = 1 << cls.MUD_BIT
        if terrain_mask & mud_bit:
            feet_bit = 1 << cls.FEET_BIT
            large_shell_bit = 1 << cls.LARGE_SHELL_BIT
            
            if genetic_mask & feet_bit:
                interactions['speed_modifier'] *= 1.3  # Feet handle mud well
                interactions['energy_modifier'] *= 0.9
                interactions['stability_modifier'] *= 1.2
            elif genetic_mask & large_shell_bit:
                interactions['speed_modifier'] *= 0.7  # Large shells sink in mud
                interactions['energy_modifier'] *= 1.3
                interactions['stability_modifier'] *= 0.8
            else:
                interactions['speed_modifier'] *= 0.8
                interactions['energy_modifier'] *= 1.1
                interactions['stability_modifier'] *= 0.9
        
        # Sand interactions
        sand_bit = 1 << cls.SAND_BIT
        if terrain_mask & sand_bit:
            feet_bit = 1 << cls.FEET_BIT
            short_legs_bit = 1 << cls.SHORT_LEGS_BIT
            
            if genetic_mask & feet_bit:
                interactions['speed_modifier'] *= 1.2  # Feet good on sand
                interactions['energy_modifier'] *= 0.9
                interactions['stability_modifier'] *= 1.1
            elif genetic_mask & short_legs_bit:
                interactions['speed_modifier'] *= 1.3  # Short legs stable on sand
                interactions['energy_modifier'] *= 0.8
                interactions['stability_modifier'] *= 1.2
            else:
                interactions['speed_modifier'] *= 0.9
                interactions['energy_modifier'] *= 1.1
                interactions['stability_modifier'] *= 0.9
        
        # Rock interactions
        rock_bit = 1 << cls.ROCK_BIT
        if terrain_mask & rock_bit:
            feet_bit = 1 << cls.FEET_BIT
            large_shell_bit = 1 << cls.LARGE_SHELL_BIT
            
            if genetic_mask & feet_bit:
                interactions['speed_modifier'] *= 1.1  # Feet can grip rocks
                interactions['energy_modifier'] *= 1.0
                interactions['stability_modifier'] *= 1.1
            elif genetic_mask & large_shell_bit:
                interactions['speed_modifier'] *= 0.8  # Large shells clumsy on rocks
                interactions['energy_modifier'] *= 1.2
                interactions['stability_modifier'] *= 0.7
            else:
                interactions['speed_modifier'] *= 0.9
                interactions['energy_modifier'] *= 1.1
                interactions['stability_modifier'] *= 0.8
        
        # Grass interactions (baseline)
        grass_bit = 1 << cls.GRASS_BIT
        if terrain_mask & grass_bit:
            long_legs_bit = 1 << cls.LONG_LEGS_BIT
            
            if genetic_mask & long_legs_bit:
                interactions['speed_modifier'] *= 1.1  # Long legs good on grass
                interactions['energy_modifier'] *= 0.9
                interactions['stability_modifier'] *= 1.0
            else:
                interactions['speed_modifier'] *= 1.0  # Baseline
                interactions['energy_modifier'] *= 1.0
                interactions['stability_modifier'] *= 1.0
        
        # Track interactions (optimal)
        track_bit = 1 << cls.TRACK_BIT
        if terrain_mask & track_bit:
            # All turtles perform well on track, but some better than others
            flippers_bit = 1 << cls.FLIPPERS_BIT
            
            if genetic_mask & flippers_bit:
                interactions['speed_modifier'] *= 1.2  # Flippers balanced for track
                interactions['energy_modifier'] *= 0.9
                interactions['stability_modifier'] *= 1.1
            else:
                interactions['speed_modifier'] *= 1.1  # Good for all
                interactions['energy_modifier'] *= 0.9
                interactions['stability_modifier'] *= 1.0
        
        return interactions


class TerrainSystem:
    """
    Terrain interaction system with genetic trait integration.
    
    This system calculates how different terrains affect turtle movement
    based on their genetic makeup using bitmask operations for performance.
    """
    
    def __init__(self):
        # Terrain properties database
        self.terrain_properties: Dict[TerrainType, TerrainProperties] = {
            TerrainType.GRASS: TerrainProperties(
                speed_modifier=1.0,
                energy_drain=1.0,
                difficulty=1.0,
                hazard_chance=0.05,
                recovery_penalty=0.0
            ),
            TerrainType.MUD: TerrainProperties(
                speed_modifier=0.6,
                energy_drain=1.5,
                difficulty=2.0,
                hazard_chance=0.15,
                recovery_penalty=0.2
            ),
            TerrainType.WATER: TerrainProperties(
                speed_modifier=0.4,
                energy_drain=1.2,
                difficulty=2.5,
                hazard_chance=0.1,
                recovery_penalty=0.3
            ),
            TerrainType.SAND: TerrainProperties(
                speed_modifier=0.7,
                energy_drain=1.3,
                difficulty=1.5,
                hazard_chance=0.08,
                recovery_penalty=0.1
            ),
            TerrainType.ROCK: TerrainProperties(
                speed_modifier=0.5,
                energy_drain=1.4,
                difficulty=2.0,
                hazard_chance=0.12,
                recovery_penalty=0.2
            ),
            TerrainType.ROUGH: TerrainProperties(
                speed_modifier=0.8,
                energy_drain=1.2,
                difficulty=1.3,
                hazard_chance=0.1,
                recovery_penalty=0.1
            ),
            TerrainType.TRACK: TerrainProperties(
                speed_modifier=1.1,
                energy_drain=0.9,
                difficulty=0.8,
                hazard_chance=0.02,
                recovery_penalty=0.0
            ),
            TerrainType.FINISH: TerrainProperties(
                speed_modifier=1.0,
                energy_drain=1.0,
                difficulty=0.5,
                hazard_chance=0.0,
                recovery_penalty=0.0
            )
        }
        
        # Cache for calculated interactions
        self.interaction_cache: Dict[Tuple[int, int], Dict[str, float]] = {}
    
    def get_terrain_properties(self, terrain_type: TerrainType) -> TerrainProperties:
        """Get properties for a terrain type"""
        return self.terrain_properties.get(terrain_type, TerrainProperties())
    
    def calculate_terrain_interaction(self, terrain_type: TerrainType, 
                                    genome: TurboGenome) -> Result[Dict[str, float]]:
        """Calculate how terrain affects turtle based on genetics"""
        try:
            # Create bitmasks
            terrain_mask = TerrainBitmask.create_terrain_mask(terrain_type)
            genetic_mask = TerrainBitmask.create_genetic_mask(genome)
            
            # Check cache
            cache_key = (terrain_mask, genetic_mask)
            if cache_key in self.interaction_cache:
                return Result.success_result(self.interaction_cache[cache_key])
            
            # Calculate interaction using bitmask operations
            interactions = TerrainBitmask.calculate_interaction(terrain_mask, genetic_mask)
            
            # Get base terrain properties
            terrain_props = self.terrain_properties[terrain_type]
            
            # Apply interactions to base properties
            final_modifiers = {
                'speed_modifier': terrain_props.speed_modifier * interactions['speed_modifier'],
                'energy_modifier': terrain_props.energy_drain * interactions['energy_modifier'],
                'stability_modifier': interactions['stability_modifier'],
                'difficulty': terrain_props.difficulty,
                'hazard_chance': terrain_props.hazard_chance,
                'recovery_penalty': terrain_props.recovery_penalty
            }
            
            # Cache result
            self.interaction_cache[cache_key] = final_modifiers
            
            return Result.success_result(final_modifiers)
            
        except Exception as e:
            return Result.failure_result(f"Failed to calculate terrain interaction: {str(e)}")
    
    def generate_terrain_segment(self, start_distance: float, 
                                terrain_type: TerrainType,
                                length: float = 200.0) -> TerrainSegment:
        """Generate a terrain segment with calculated properties"""
        props = self.get_terrain_properties(terrain_type)
        
        return TerrainSegment(
            start_distance=start_distance,
            end_distance=start_distance + length,
            terrain_type=terrain_type,
            speed_modifier=props.speed_modifier,
            energy_drain=props.energy_drain
        )
    
    def create_mixed_terrain_track(self, track_length: float, 
                                  segment_length: float = 200.0) -> List[TerrainSegment]:
        """Create a varied terrain track for testing"""
        segments = []
        
        # Define terrain sequence for variety
        terrain_sequence = [
            TerrainType.GRASS, TerrainType.MUD, TerrainType.WATER,
            TerrainType.SAND, TerrainType.ROCK, TerrainType.ROUGH,
            TerrainType.TRACK, TerrainType.GRASS
        ]
        
        current_distance = 0.0
        terrain_index = 0
        
        while current_distance < track_length:
            terrain_type = terrain_sequence[terrain_index % len(terrain_sequence)]
            
            segment = self.generate_terrain_segment(
                current_distance, 
                terrain_type, 
                min(segment_length, track_length - current_distance)
            )
            
            segments.append(segment)
            current_distance += segment_length
            terrain_index += 1
        
        return segments
    
    def analyze_terrain_advantage(self, genome: TurboGenome) -> Result[Dict[str, Any]]:
        """Analyze which terrains give this turtle advantages"""
        try:
            advantages = {}
            disadvantages = {}
            neutral = []
            
            for terrain_type in TerrainType:
                interaction_result = self.calculate_terrain_interaction(terrain_type, genome)
                if not interaction_result.success:
                    continue
                
                modifiers = interaction_result.value
                overall_bonus = (modifiers['speed_modifier'] / 
                               modifiers['energy_modifier'] * 
                               modifiers['stability_modifier'])
                
                if overall_bonus > 1.1:
                    advantages[terrain_type.value] = {
                        'bonus': overall_bonus,
                        'speed_mod': modifiers['speed_modifier'],
                        'energy_mod': modifiers['energy_modifier'],
                        'stability': modifiers['stability_modifier']
                    }
                elif overall_bonus < 0.9:
                    disadvantages[terrain_type.value] = {
                        'penalty': overall_bonus,
                        'speed_mod': modifiers['speed_modifier'],
                        'energy_mod': modifiers['energy_modifier'],
                        'stability': modifiers['stability_modifier']
                    }
                else:
                    neutral.append(terrain_type.value)
            
            analysis = {
                'advantages': advantages,
                'disadvantages': disadvantages,
                'neutral': neutral,
                'specialization': self._calculate_specialization(advantages, disadvantages)
            }
            
            return Result.success_result(analysis)
            
        except Exception as e:
            return Result.failure_result(f"Failed to analyze terrain advantage: {str(e)}")
    
    def _calculate_specialization(self, advantages: Dict, disadvantages: Dict) -> str:
        """Calculate turtle's terrain specialization"""
        if not advantages and not disadvantages:
            return "Balanced"
        
        # Count terrain types
        adv_count = len(advantages)
        dis_count = len(disadvantages)
        
        if adv_count >= 3:
            return "Specialized (Multiple terrains)"
        elif adv_count == 2:
            return "Specialized (Dual terrain)"
        elif adv_count == 1:
            terrain_type = list(advantages.keys())[0]
            return f"Specialized ({terrain_type})"
        elif dis_count >= 3:
            return "Struggler (Multiple terrains)"
        elif dis_count == 2:
            return "Struggler (Dual terrain)"
        else:
            return "Balanced"
    
    def clear_cache(self) -> None:
        """Clear the interaction cache"""
        self.interaction_cache.clear()
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        return {
            'cache_size': len(self.interaction_cache),
            'max_cache_size': 1000  # Could be made configurable
        }


# Factory function
def create_terrain_system() -> TerrainSystem:
    """Create a terrain system instance"""
    return TerrainSystem()


# Export key components
__all__ = [
    'TerrainSystem',
    'TerrainProperties',
    'GeneticTerrainBonus',
    'TerrainBitmask',
    'create_terrain_system'
]
