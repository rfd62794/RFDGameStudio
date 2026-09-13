"""
Foundation Genetics - DGT Tier 1 Architecture

Type-safe genetic data contracts and crossover algorithms for the DGT Platform.
Transplanted from TurboShells with Pydantic v2 hardening.
"""

from .schema import (
    TurboGenome, RGBColor, PatternType, BodyPatternType, LimbShape,
    GeneType, GENE_DEFINITIONS, create_default_genome, validate_genome_dict
)
from .crossover import (
    CrossoverConfig, mendelian_crossover, dominant_crossover, blended_crossover,
    color_pattern_crossover, calculate_genetic_similarity, crossover_batch
)

__all__ = [
    'TurboGenome',
    'RGBColor',
    'PatternType',
    'BodyPatternType',
    'LimbShape',
    'GeneType',
    'GENE_DEFINITIONS',
    'create_default_genome',
    'validate_genome_dict',
    'CrossoverConfig',
    'mendelian_crossover',
    'dominant_crossover',
    'blended_crossover',
    'color_pattern_crossover',
    'calculate_genetic_similarity',
    'crossover_batch'
]
