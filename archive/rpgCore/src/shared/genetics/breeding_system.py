"""
BreedingSystem - Formal allele resolution for slime breeding.

Implements mathematically derived genetics with culture expression blending,
stat inheritance, and visual trait inheritance patterns.
"""

import random
from typing import Optional, Tuple, Dict
from dataclasses import dataclass

from src.shared.teams.roster import RosterSlime
from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CulturalBase


@dataclass
class BreedingSystem:
    """Formal breeding system with allele resolution and genetic inheritance."""
    
    # Minimum culture expression to consider a culture "present"
    EXPRESSION_THRESHOLD = 0.05
    
    # Maximum shift per generation from pure parent values
    VARIANCE_RANGE = 0.15
    
    @classmethod
    def can_breed(cls, parent_a: RosterSlime, parent_b: RosterSlime) -> Tuple[bool, str]:
        """
        Validate breeding eligibility.
        Returns (eligible, reason).
        """
        if parent_a is parent_b:
            return False, "Cannot self-breed"
        
        a_genome = parent_a.genome
        b_genome = parent_b.genome
        
        if not getattr(a_genome, 'can_breed', False):
            return False, f"{parent_a.name} not old enough"
        
        if not getattr(b_genome, 'can_breed', False):
            return False, f"{parent_b.name} not old enough"
        
        return True, "Compatible"
    
    @classmethod
    def resolve_culture_expression(cls, parent_a: SlimeGenome, parent_b: SlimeGenome) -> Dict[str, float]:
        """
        Core allele resolution.
        Blend parent culture expressions with variance to produce offspring.
        
        Each culture weight is independently resolved then renormalized to sum 1.0
        """
        cultures = ['ember', 'gale', 'marsh', 'crystal', 'tundra', 'tide']
        
        # Get culture expressions with fallback
        a_expr = cls._get_culture_expression_fallback(parent_a)
        b_expr = cls._get_culture_expression_fallback(parent_b)
        
        offspring_expr = {}
        for culture in cultures:
            a_weight = a_expr.get(culture, 0.0)
            b_weight = b_expr.get(culture, 0.0)
            
            # Blend: weighted average of parents
            blended = (a_weight + b_weight) / 2.0
            
            # Variance: small random shift
            variance = random.uniform(-cls.VARIANCE_RANGE, cls.VARIANCE_RANGE)
            raw = max(0.0, blended + variance * blended)
            offspring_expr[culture] = raw
        
        # Normalize to sum 1.0
        total = sum(offspring_expr.values())
        if total > 0:
            offspring_expr = {k: v / total for k, v in offspring_expr.items()}
        else:
            # Fallback: equal distribution
            offspring_expr = {c: 1/6 for c in cultures}
        
        return offspring_expr
    
    @classmethod
    def _get_culture_expression_fallback(cls, genome: SlimeGenome) -> Dict[str, float]:
        """
        Get culture expression with fallback for missing data.
        Uses same alias map as migration function.
        """
        expr = getattr(genome, 'culture_expression', {})
        if not expr:
            # Derive from cultural_base
            base = getattr(genome, 'cultural_base', CulturalBase.VOID)
            if hasattr(base, 'value'):
                base = base.value
            key = base.lower().replace('culturalbase.', '').strip()
            
            # Map known aliases (same as migration)
            aliases = {
                # Handle enum to expression mapping
                'ember': 'ember',
                'crystal': 'crystal',
                'tide': 'tide',
                'void': 'void',
            }
            key = aliases.get(key, key)
            
            # Special case: if no valid culture found, use void as fallback
            if key not in ['ember', 'gale', 'marsh', 'crystal', 'tundra', 'tide', 'void']:
                key = 'void'
            
            expr = {key: 1.0}
        
        return expr
    
    @classmethod
    def resolve_stats(cls, parent_a: SlimeGenome, parent_b: SlimeGenome) -> Dict[str, float]:
        """
        Offspring stats: average of parents with small variance.
        """
        stat_fields = ['base_hp', 'base_atk', 'base_spd']
        offspring_stats = {}
        
        for stat in stat_fields:
            a_val = getattr(parent_a, stat, 10.0)
            b_val = getattr(parent_b, stat, 10.0)
            avg = (a_val + b_val) / 2.0
            variance = random.uniform(-0.1, 0.1) * avg
            offspring_stats[stat] = max(1.0, avg + variance)
        
        return offspring_stats
    
    @classmethod
    def resolve_visual(cls, parent_a: SlimeGenome, parent_b: SlimeGenome, culture_expression: Dict[str, float]) -> Dict:
        """
        Offspring visuals inherited from dominant parent with mutation chance.
        Dominant = higher total expression in their primary culture.
        """
        # Get culture expressions for dominance calculation
        a_expr = cls._get_culture_expression_fallback(parent_a)
        b_expr = cls._get_culture_expression_fallback(parent_b)
        
        # Dominant parent provides base visuals
        a_primary = max(a_expr.values(), default=0.0)
        b_primary = max(b_expr.values(), default=0.0)
        
        dominant = parent_a if a_primary >= b_primary else parent_b
        recessive = parent_b if dominant is parent_a else parent_a
        
        # 80% chance dominant shape/pattern, 20% chance recessive
        use_dominant = random.random() < 0.8
        source = dominant if use_dominant else recessive
        
        # Small color mutation chance (10%)
        base_color = list(getattr(source, 'base_color', (100, 180, 100)))
        if random.random() < 0.10:
            channel = random.randint(0, 2)
            base_color[channel] = min(255, max(0, base_color[channel] + random.randint(-30, 30)))
        
        return {
            'shape': getattr(source, 'shape', 'round'),
            'size': getattr(source, 'size', 'medium'),
            'base_color': tuple(base_color),
            'pattern': getattr(source, 'pattern', 'none'),
            'pattern_color': getattr(source, 'pattern_color', (80, 140, 80)),
            'accessory': getattr(source, 'accessory', 'none'),
        }
    
    @classmethod
    def breed(cls, parent_a: RosterSlime, parent_b: RosterSlime, generation: Optional[int] = None) -> Optional[SlimeGenome]:
        """
        Full breeding resolution.
        Returns offspring SlimeGenome or None if ineligible.
        """
        eligible, reason = cls.can_breed(parent_a, parent_b)
        if not eligible:
            return None
        
        a_genome = parent_a.genome
        b_genome = parent_b.genome
        
        # Resolve all genetic axes
        culture_expr = cls.resolve_culture_expression(a_genome, b_genome)
        stats = cls.resolve_stats(a_genome, b_genome)
        visuals = cls.resolve_visual(a_genome, b_genome, culture_expr)
        
        # Generation depth
        a_gen = getattr(a_genome, 'generation', 1)
        b_gen = getattr(b_genome, 'generation', 1)
        offspring_gen = generation or (max(a_gen, b_gen) + 1)
        
        # Lineage
        parent_ids = (
            getattr(parent_a, 'name', 'unknown'),
            getattr(parent_b, 'name', 'unknown')
        )
        
        # Personality traits - average with variance
        personality_fields = ['curiosity', 'energy', 'affection', 'shyness']
        personality = {}
        for field in personality_fields:
            a_val = getattr(a_genome, field, 0.5)
            b_val = getattr(b_genome, field, 0.5)
            avg = (a_val + b_val) / 2.0
            variance = random.uniform(-0.1, 0.1)
            personality[field] = max(0.0, min(1.0, avg + variance))
        
        # Construct offspring genome using existing SlimeGenome fields
        offspring_genome = SlimeGenome(
            cultural_base=cls._dominant_culture(culture_expr),
            culture_expression=culture_expr,
            generation=offspring_gen,
            parent_ids=parent_ids,
            mutations=[],
            level=0,
            experience_points=0,
            **visuals,
            **stats,
            **personality,
        )
        
        return offspring_genome
    
    @classmethod
    def _dominant_culture(cls, culture_expression: Dict[str, float]) -> CulturalBase:
        """
        Derive CulturalBase enum from dominant culture expression.
        """
        dominant = max(culture_expression.items(), key=lambda x: x[1])
        culture_name = dominant[0].upper()
        
        # Map expression keys back to CulturalBase enum values
        expression_to_enum = {
            'EMBER': CulturalBase.EMBER,
            'CRYSTAL': CulturalBase.CRYSTAL,
            'MARSH': CulturalBase.MARSH,
            'TIDE': CulturalBase.TIDE,
            'VOID': CulturalBase.VOID,
            'GALE': CulturalBase.GALE,
            'TUNDRA': CulturalBase.TUNDRA,
        }
        
        try:
            return expression_to_enum[culture_name]
        except KeyError:
            return CulturalBase.VOID
