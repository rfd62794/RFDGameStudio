"""
Genetic Crossover Engine - DGT Tier 1 Foundation

Transplanted from TurboShells inheritance.py with pure functional hardening.
Mendelian inheritance with RGB blending and continuous value averaging.

This module contains pure functions - no side effects, no external dependencies.
All functions take TurboGenome objects and return new TurboGenome objects.
"""

import random
from typing import List, Dict, Set, Optional, Union
from dataclasses import dataclass

from .schema import TurboGenome, RGBColor, PatternType, BodyPatternType, LimbShape


@dataclass
class CrossoverConfig:
    """Configuration for genetic crossover operations"""
    blend_genes: Optional[Set[str]] = None
    dominant_genes: Optional[Dict[str, str]] = None
    color_bias_range: tuple[float, float] = (0.3, 0.7)
    pattern_inheritance_rate: float = 0.7
    mutation_rate: float = 0.0  # For future extension
    
    def __post_init__(self):
        """Initialize default values"""
        if self.blend_genes is None:
            # Genes that should be averaged (continuous values)
            self.blend_genes = {
                'shell_pattern_density',
                'shell_pattern_opacity', 
                'shell_size_modifier',
                'body_pattern_density',
                'head_size_modifier',
                'leg_length',
                'leg_thickness_modifier',
                'eye_size_modifier'
            }
        
        if self.dominant_genes is None:
            self.dominant_genes = {}


def mendelian_crossover(parent1: TurboGenome, parent2: TurboGenome, 
                        config: Optional[CrossoverConfig] = None) -> TurboGenome:
    """
    Basic Mendelian inheritance with 50/50 chance from each parent.
    
    This is the core crossover function - pure, deterministic, and type-safe.
    Each gene has an equal chance of being inherited from either parent.
    
    Args:
        parent1: First parent genome
        parent2: Second parent genome  
        config: Optional crossover configuration
        
    Returns:
        New TurboGenome with inherited traits
    """
    if config is None:
        config = CrossoverConfig()
    
    child_traits = {}
    
    # Process each trait
    for trait_name in parent1.get_trait_names():
        parent1_value = parent1.get_trait_value(trait_name)
        parent2_value = parent2.get_trait_value(trait_name)
        
        # 50/50 inheritance
        if random.random() < 0.5:
            child_traits[trait_name] = parent1_value
        else:
            child_traits[trait_name] = parent2_value
    
    return TurboGenome.from_dict(child_traits)


def dominant_crossover(parent1: TurboGenome, parent2: TurboGenome,
                      dominant_genes: Dict[str, str],
                      config: Optional[CrossoverConfig] = None) -> TurboGenome:
    """
    Crossover with dominant gene patterns.
    
    Some genes from specific parents are forced to dominate.
    Useful for breeding strategies where certain traits are preferred.
    
    Args:
        parent1: First parent genome
        parent2: Second parent genome
        dominant_genes: {'gene_name': 'parent1' or 'parent2'}
        config: Optional crossover configuration
        
    Returns:
        New TurboGenome with dominant inheritance patterns
    """
    if config is None:
        config = CrossoverConfig()
    
    child_traits = {}
    
    for trait_name in parent1.get_trait_names():
        parent1_value = parent1.get_trait_value(trait_name)
        parent2_value = parent2.get_trait_value(trait_name)
        
        # Check for dominance
        dominance = dominant_genes.get(trait_name)
        if dominance == "parent1":
            child_traits[trait_name] = parent1_value
        elif dominance == "parent2":
            child_traits[trait_name] = parent2_value
        else:
            # Random inheritance
            child_traits[trait_name] = parent1_value if random.random() < 0.5 else parent2_value
    
    return TurboGenome.from_dict(child_traits)


def blended_crossover(parent1: TurboGenome, parent2: TurboGenome,
                      blend_genes: Optional[List[str]] = None,
                      config: Optional[CrossoverConfig] = None) -> TurboGenome:
    """
    Crossover with blending for continuous values.
    
    Continuous traits (like size modifiers) are averaged between parents.
    This creates smoother trait transitions in breeding lines.
    
    Args:
        parent1: First parent genome
        parent2: Second parent genome
        blend_genes: List of gene names to blend (average)
        config: Optional crossover configuration
        
    Returns:
        New TurboGenome with blended continuous traits
    """
    if config is None:
        config = CrossoverConfig()
    
    if blend_genes is None:
        blend_genes = list(config.blend_genes)
    
    child_traits = {}
    
    for trait_name in parent1.get_trait_names():
        parent1_value = parent1.get_trait_value(trait_name)
        parent2_value = parent2.get_trait_value(trait_name)
        
        if trait_name in blend_genes:
            # Blend continuous values
            if isinstance(parent1_value, (int, float)) and isinstance(parent2_value, (int, float)):
                child_traits[trait_name] = (parent1_value + parent2_value) / 2
            else:
                # Fallback to random inheritance for non-continuous
                child_traits[trait_name] = parent1_value if random.random() < 0.5 else parent2_value
        else:
            # Random inheritance for discrete traits
            child_traits[trait_name] = parent1_value if random.random() < 0.5 else parent2_value
    
    return TurboGenome.from_dict(child_traits)


def color_pattern_crossover(parent1: TurboGenome, parent2: TurboGenome,
                           config: Optional[CrossoverConfig] = None) -> TurboGenome:
    """
    Specialized crossover for color patterns with intelligent mixing.
    
    RGB colors are blended with a bias towards one parent.
    Patterns have a higher chance of being inherited directly.
    
    Args:
        parent1: First parent genome
        parent2: Second parent genome
        config: Optional crossover configuration
        
    Returns:
        New TurboGenome with sophisticated color inheritance
    """
    if config is None:
        config = CrossoverConfig()
    
    child_traits = {}
    
    for trait_name in parent1.get_trait_names():
        parent1_value = parent1.get_trait_value(trait_name)
        parent2_value = parent2.get_trait_value(trait_name)
        
        # Handle RGB color blending
        if isinstance(parent1_value, tuple) and len(parent1_value) == 3:
            # Color mixing with random bias
            bias = random.uniform(*config.color_bias_range)  # Bias towards one parent
            blended_color = tuple(
                int(parent1_value[i] * bias + parent2_value[i] * (1 - bias))
                for i in range(3)
            )
            child_traits[trait_name] = blended_color
            
        # Handle pattern inheritance with preference
        elif trait_name.endswith('_pattern_type') and isinstance(parent1_value, str):
            if random.random() < config.pattern_inheritance_rate:
                # 70% chance to inherit pattern type directly
                child_traits[trait_name] = parent1_value if random.random() < 0.5 else parent2_value
            else:
                # 30% chance for random pattern
                if trait_name == 'shell_pattern_type':
                    child_traits[trait_name] = random.choice([p.value for p in PatternType])
                elif trait_name == 'body_pattern_type':
                    child_traits[trait_name] = random.choice([p.value for p in BodyPatternType])
                else:
                    child_traits[trait_name] = parent1_value if random.random() < 0.5 else parent2_value
        else:
            # Standard inheritance for other traits
            child_traits[trait_name] = parent1_value if random.random() < 0.5 else parent2_value
    
    return TurboGenome.from_dict(child_traits)


def calculate_genetic_similarity(genome1: TurboGenome, genome2: TurboGenome) -> float:
    """
    Calculate similarity percentage between two genetic profiles.
    
    Uses Euclidean distance for RGB colors and exact matching for other traits.
    Returns a value between 0.0 (completely different) and 1.0 (identical).
    
    Args:
        genome1: First genome to compare
        genome2: Second genome to compare
        
    Returns:
        Similarity score between 0.0 and 1.0
    """
    total_traits = len(genome1.get_trait_names())
    similar_traits = 0
    
    for trait_name in genome1.get_trait_names():
        value1 = genome1.get_trait_value(trait_name)
        value2 = genome2.get_trait_value(trait_name)
        
        # RGB similarity using Euclidean distance
        if isinstance(value1, tuple) and len(value1) == 3:
            distance = sum((value1[i] - value2[i]) ** 2 for i in range(3)) ** 0.5
            max_distance = (255**2 * 3) ** 0.5  # Maximum possible RGB distance
            similarity = 1 - (distance / max_distance)
            if similarity > 0.8:  # Consider similar if >80% similar
                similar_traits += 1
        else:
            # Exact matching for non-RGB traits
            if value1 == value2:
                similar_traits += 1
    
    return similar_traits / total_traits if total_traits > 0 else 0.0


def crossover_batch(parents: List[TurboGenome], 
                   crossover_type: str = "blended",
                   config: Optional[CrossoverConfig] = None) -> List[TurboGenome]:
    """
    Perform crossover on a batch of parent pairs.
    
    Args:
        parents: List of parent genomes (must be even length)
        crossover_type: Type of crossover ('mendelian', 'dominant', 'blended', 'color')
        config: Optional crossover configuration
        
    Returns:
        List of child genomes
        
    Raises:
        ValueError: If parents list has odd length
    """
    if len(parents) % 2 != 0:
        raise ValueError("Parents list must have even length")
    
    if config is None:
        config = CrossoverConfig()
    
    children = []
    
    for i in range(0, len(parents), 2):
        parent1 = parents[i]
        parent2 = parents[i + 1]
        
        if crossover_type == "mendelian":
            child = mendelian_crossover(parent1, parent2, config)
        elif crossover_type == "dominant":
            child = dominant_crossover(parent1, parent2, config.dominant_genes, config)
        elif crossover_type == "blended":
            child = blended_crossover(parent1, parent2, list(config.blend_genes), config)
        elif crossover_type == "color":
            child = color_pattern_crossover(parent1, parent2, config)
        else:
            raise ValueError(f"Unknown crossover type: {crossover_type}")
        
        children.append(child)
    
    return children


# Export key functions
__all__ = [
    'CrossoverConfig',
    'mendelian_crossover',
    'dominant_crossover', 
    'blended_crossover',
    'color_pattern_crossover',
    'calculate_genetic_similarity',
    'crossover_batch'
]
