"""
GeneticComponent - Trait-Based Physics Modification
SRP: Data overlay that modifies KineticBody parameters through genetic traits
"""

import math
import random
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from foundation.types import Result


@dataclass
class GeneticTraits:
    """Genetic traits that modify physics behavior"""
    # Movement traits
    speed_modifier: float = 1.0          # Speed multiplier (0.5 = slow, 2.0 = fast)
    mass_modifier: float = 1.0           # Mass affects inertia
    thrust_efficiency: float = 1.0       # Thrust power efficiency
    rotation_speed: float = 1.0           # Rotation speed multiplier
    
    # Environmental traits
    friction_modifier: float = 1.0       # Air/water resistance
    bounce_factor: float = 0.0           # Bounciness (0 = no bounce, 1 = perfect bounce)
    
    # Visual traits
    color_shift: Tuple[int, int, int] = (0, 0, 0)  # RGB color modification
    size_modifier: float = 1.0          # Visual size multiplier
    
    # Behavioral traits
    aggression: float = 0.0              # Tendency to attack (0 = passive, 1 = aggressive)
    curiosity: float = 0.5                # Exploration tendency
    herd_mentality: float = 0.0          # Tendency to group together
    
    def copy(self) -> 'GeneticTraits':
        """Create a copy of genetic traits"""
        return GeneticTraits(
            speed_modifier=self.speed_modifier,
            mass_modifier=self.mass_modifier,
            thrust_efficiency=self.thrust_efficiency,
            rotation_speed=self.rotation_speed,
            friction_modifier=self.friction_modifier,
            bounce_factor=self.bounce_factor,
            color_shift=self.color_shift,
            size_modifier=self.size_modifier,
            aggression=self.aggression,
            curiosity=self.curiosity,
            herd_mentality=self.herd_mentality
        )


@dataclass
class GeneticCode:
    """Genetic code with inheritance and mutation"""
    genetic_id: str
    traits: GeneticTraits
    generation: int = 1
    parent_ids: List[str] = field(default_factory=list)
    mutation_rate: float = 0.1
    
    def mutate(self) -> 'GeneticCode':
        """Create mutated offspring"""
        new_traits = self.traits.copy()
        
        # Apply mutations
        mutations = [
            ('speed_modifier', 0.8, 1.2),
            ('mass_modifier', 0.7, 1.3),
            ('thrust_efficiency', 0.9, 1.1),
            ('rotation_speed', 0.8, 1.2),
            ('friction_modifier', 0.9, 1.1),
            ('aggression', 0.0, 1.0),
            ('curiosity', 0.0, 1.0),
            ('herd_mentality', 0.0, 1.0)
        ]
        
        for trait_name, min_val, max_val in mutations:
            if random.random() < self.mutation_rate:
                current_val = getattr(new_traits, trait_name)
                mutation_factor = random.uniform(0.8, 1.2)
                new_val = current_val * mutation_factor
                new_val = max(min_val, min(max_val, new_val))
                setattr(new_traits, trait_name, new_val)
        
        # Color mutation
        if random.random() < self.mutation_rate:
            color_shift = (
                random.randint(-50, 50),
                random.randint(-50, 50),
                random.randint(-50, 50)
            )
            new_traits.color_shift = color_shift
        
        return GeneticCode(
            genetic_id=f"{self.genetic_id}_gen{self.generation + 1}_{random.randint(1000, 9999)}",
            traits=new_traits,
            generation=self.generation + 1,
            parent_ids=[self.genetic_id],
            mutation_rate=self.mutation_rate
        )
    
    def breed_with(self, partner: 'GeneticCode') -> 'GeneticCode':
        """Create offspring through breeding"""
        # Trait inheritance (average with mutation)
        child_traits = GeneticTraits()
        
        trait_fields = [
            'speed_modifier', 'mass_modifier', 'thrust_efficiency', 'rotation_speed',
            'friction_modifier', 'bounce_factor', 'aggression', 'curiosity', 'herd_mentality'
        ]
        
        for trait_name in trait_fields:
            parent1_val = getattr(self.traits, trait_name)
            parent2_val = getattr(partner.traits, trait_name)
            
            # Inherit average with small mutation
            child_val = (parent1_val + parent2_val) / 2
            if random.random() < self.mutation_rate:
                child_val *= random.uniform(0.9, 1.1)
            
            setattr(child_traits, trait_name, child_val)
        
        # Color inheritance (mix with mutation)
        color_shift = (
            (self.traits.color_shift[0] + partner.traits.color_shift[0]) // 2 + random.randint(-20, 20),
            (self.traits.color_shift[1] + partner.traits.color_shift[1]) // 2 + random.randint(-20, 20),
            (self.traits.color_shift[2] + partner.traits.color_shift[2]) // 2 + random.randint(-20, 20)
        )
        child_traits.color_shift = color_shift
        
        return GeneticCode(
            genetic_id=f"breed_{self.genetic_id}_{partner.genetic_id}_{random.randint(1000, 9999)}",
            traits=child_traits,
            generation=max(self.generation, partner.generation) + 1,
            parent_ids=[self.genetic_id, partner.genetic_id],
            mutation_rate=(self.mutation_rate + partner.mutation_rate) / 2
        )


class GeneticComponent:
    """
    Component that applies genetic traits to modify physics behavior.
    Uses injection pattern - doesn't modify core KineticBody, only overlays parameters.
    """
    
    def __init__(self, genetic_code: GeneticCode):
        """
        Initialize genetic component
        
        Args:
            genetic_code: Genetic code containing traits
        """
        self.genetic_code = genetic_code
        self.traits = genetic_code.traits
        
        # Applied modifications (tracked for debugging)
        self.applied_modifications: Dict[str, float] = {}
        
    def apply_to_kinetic_body(self, kinetic_body) -> Result[Dict[str, float]]:
        """
        Apply genetic modifications to kinetic body parameters
        
        Args:
            kinetic_body: KineticBody to modify
            
        Returns:
            Result containing applied modifications
        """
        try:
            modifications = {}
            
            # Apply speed modifier
            if self.traits.speed_modifier != 1.0:
                original_thrust = kinetic_body.thrust_power
                kinetic_body.thrust_power *= self.traits.speed_modifier
                modifications['thrust_power'] = kinetic_body.thrust_power - original_thrust
            
            # Apply mass modifier (affects acceleration)
            if self.traits.mass_modifier != 1.0:
                # Mass affects how quickly velocity changes
                original_damping = kinetic_body.velocity_damping
                kinetic_body.velocity_damping /= self.traits.mass_modifier
                modifications['velocity_damping'] = kinetic_body.velocity_damping - original_damping
            
            # Apply thrust efficiency
            if self.traits.thrust_efficiency != 1.0:
                original_thrust = kinetic_body.thrust_power
                kinetic_body.thrust_power *= self.traits.thrust_efficiency
                modifications['thrust_efficiency'] = kinetic_body.thrust_power - original_thrust
            
            # Apply rotation speed
            if self.traits.rotation_speed != 1.0:
                original_rotation = kinetic_body.rotation_speed
                kinetic_body.rotation_speed *= self.traits.rotation_speed
                modifications['rotation_speed'] = kinetic_body.rotation_speed - original_rotation
            
            # Apply friction modifier
            if self.traits.friction_modifier != 1.0:
                original_damping = kinetic_body.velocity_damping
                kinetic_body.velocity_damping *= self.traits.friction_modifier
                modifications['friction_modifier'] = kinetic_body.velocity_damping - original_damping
            
            self.applied_modifications = modifications
            
            return Result(success=True, value=modifications)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to apply genetics: {e}")
    
    def get_modified_color(self, base_color: Tuple[int, int, int]) -> Tuple[int, int, int]:
        """
        Apply genetic color shift to base color
        
        Args:
            base_color: Original RGB color
            
        Returns:
            Modified RGB color
        """
        r, g, b = base_color
        shift_r, shift_g, shift_b = self.traits.color_shift
        
        modified_color = (
            max(0, min(255, r + shift_r)),
            max(0, min(255, g + shift_g)),
            max(0, min(255, b + shift_b))
        )
        
        return modified_color
    
    def get_modified_size(self, base_size: float) -> float:
        """
        Apply genetic size modifier
        
        Args:
            base_size: Original size
            
        Returns:
            Modified size
        """
        return base_size * self.traits.size_modifier
    
    def get_behavior_score(self) -> Dict[str, float]:
        """Get behavioral trait scores for AI decision making"""
        return {
            'aggression': self.traits.aggression,
            'curiosity': self.traits.curiosity,
            'herd_mentality': self.traits.herd_mentality
        }
    
    def evolve(self) -> 'GeneticComponent':
        """Create evolved version of this genetic component"""
        new_genetic_code = self.genetic_code.mutate()
        return GeneticComponent(new_genetic_code)
    
    def get_genetic_info(self) -> Dict[str, Any]:
        """Get genetic information for UI display"""
        return {
            'genetic_id': self.genetic_code.genetic_id,
            'generation': self.genetic_code.generation,
            'parent_ids': self.genetic_code.parent_ids,
            'traits': {
                'speed': f"{self.traits.speed_modifier:.2f}x",
                'mass': f"{self.traits.mass_modifier:.2f}x",
                'thrust': f"{self.traits.thrust_efficiency:.2f}x",
                'rotation': f"{self.traits.rotation_speed:.2f}x",
                'friction': f"{self.traits.friction_modifier:.2f}x",
                'aggression': f"{self.traits.aggression:.2f}",
                'curiosity': f"{self.traits.curiosity:.2f}",
                'herd': f"{self.traits.herd_mentality:.2f}"
            },
            'color_shift': self.traits.color_shift,
            'size_modifier': f"{self.traits.size_modifier:.2f}x"
        }


# Factory functions for genetic archetypes
def create_heavy_shell_genetics() -> GeneticComponent:
    """Create genetics for heavy, armored shell"""
    traits = GeneticTraits(
        speed_modifier=0.7,
        mass_modifier=1.5,
        thrust_efficiency=0.8,
        rotation_speed=0.6,
        friction_modifier=1.2,
        color_shift=(50, 50, 50),  # Darker grey
        size_modifier=1.2,
        aggression=0.3,
        curiosity=0.2,
        herd_mentality=0.4
    )
    
    genetic_code = GeneticCode(
        genetic_id="heavy_shell_v1",
        traits=traits,
        generation=1
    )
    
    return GeneticComponent(genetic_code)


def create_scout_shell_genetics() -> GeneticComponent:
    """Create genetics for fast, scout shell"""
    traits = GeneticTraits(
        speed_modifier=1.5,
        mass_modifier=0.7,
        thrust_efficiency=1.2,
        rotation_speed=1.3,
        friction_modifier=0.8,
        color_shift=(-30, -30, 50),  # Blueish tint
        size_modifier=0.8,
        aggression=0.6,
        curiosity=0.8,
        herd_mentality=0.1
    )
    
    genetic_code = GeneticCode(
        genetic_id="scout_shell_v1",
        traits=traits,
        generation=1
    )
    
    return GeneticComponent(genetic_code)


def create_balanced_shell_genetics() -> GeneticComponent:
    """Create genetics for balanced, all-purpose shell"""
    traits = GeneticTraits(
        speed_modifier=1.0,
        mass_modifier=1.0,
        thrust_efficiency=1.0,
        rotation_speed=1.0,
        friction_modifier=1.0,
        color_shift=(0, 0, 0),  # No color shift
        size_modifier=1.0,
        aggression=0.5,
        curiosity=0.5,
        herd_mentality=0.3
    )
    
    genetic_code = GeneticCode(
        genetic_id="balanced_shell_v1",
        traits=traits,
        generation=1
    )
    
    return GeneticComponent(genetic_code)


def create_random_asteroid_genetics() -> GeneticComponent:
    """Create random genetics for asteroids"""
    traits = GeneticTraits(
        speed_modifier=random.uniform(0.8, 1.2),
        mass_modifier=random.uniform(0.8, 1.2),
        thrust_efficiency=1.0,  # Asteroids don't thrust
        rotation_speed=random.uniform(0.5, 1.5),
        friction_modifier=random.uniform(0.9, 1.1),
        color_shift=(
            random.randint(-40, 40),
            random.randint(-40, 40),
            random.randint(-40, 40)
        ),
        size_modifier=random.uniform(0.9, 1.1),
        aggression=random.uniform(0.0, 0.3),
        curiosity=random.uniform(0.0, 0.2),
        herd_mentality=random.uniform(0.0, 0.1)
    )
    
    genetic_code = GeneticCode(
        genetic_id=f"asteroid_{random.randint(1000, 9999)}",
        traits=traits,
        generation=1,
        mutation_rate=0.15  # Higher mutation rate for asteroids
    )
    
    return GeneticComponent(genetic_code)
