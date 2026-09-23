import random
from typing import List, Tuple, Optional
from .genome import SlimeGenome
from .cultural_base import CulturalBase, CULTURAL_PARAMETERS

SHAPES = ["round", "cubic", "elongated", "crystalline", "amorphous"]
SIZES = ["tiny", "small", "medium", "large", "massive"]
PATTERNS = ["solid", "spotted", "striped", "marbled", "iridescent"]
ACCESSORIES = ["none", "crown", "scar", "glow", "shell", "crystals"]

def generate_random(culture: Optional[CulturalBase] = None) -> SlimeGenome:
    """Generate a SlimeGenome, optionally influenced by a CulturalBase."""
    if culture is None:
        culture = random.choice([cb for cb in CulturalBase if cb != CulturalBase.VOID])
    
    params = CULTURAL_PARAMETERS[culture]
    
    # Helpers for ranging
    def r_range(r): return random.uniform(r[0], r[1])
    
    # Adjust primary hue to RGB
    import colorsys
    h = r_range(params.primary_hue_range) / 360.0
    r, g, b = colorsys.hsv_to_rgb(h, 0.7, 0.9)
    base_color = (int(r * 255), int(g * 255), int(b * 255))
    
    # Map roundness to shape
    roundness = r_range(params.body_roundness_range)
    if roundness < 0.4: shape = random.choice(["cubic", "crystalline"])
    elif roundness > 0.7: shape = "round"
    else: shape = random.choice(["elongated", "amorphous"])

    return SlimeGenome(
        shape=shape,
        size=random.choice(SIZES),
        base_color=base_color,
        pattern=random.choice(PATTERNS),
        pattern_color=(random.randint(50, 255), random.randint(50, 255), random.randint(50, 255)),
        accessory=random.choice(ACCESSORIES),
        curiosity=random.random(),
        energy=random.random(),
        affection=random.random(),
        shyness=random.random(),
        cultural_base=culture,
        base_hp=20.0 * params.hp_modifier,
        base_atk=5.0 * params.attack_modifier,
        base_spd=5.0 * params.speed_modifier
    )

def breed(parent_a: SlimeGenome, parent_b: SlimeGenome, mutation_chance: float = 0.05, elder_bonus: bool = False) -> SlimeGenome:
    """Breed two SlimeGenomes with a chance of mutation and generational improvement."""
    
    def inherit(trait_a, trait_b, is_float=False):
        # 50/50 inheritance
        result = random.choice([trait_a, trait_b])
        
        # Standard Mutation
        if random.random() < mutation_chance:
            if is_float:
                # Slight nudge for floats
                result = max(0.0, min(1.0, result + random.uniform(-0.1, 0.1)))
            else:
                # Random choice for categorical/tuples (simple mutation)
                if isinstance(result, str):
                    if result in SHAPES: result = random.choice(SHAPES)
                    elif result in SIZES: result = random.choice(SIZES)
                    elif result in PATTERNS: result = random.choice(PATTERNS)
                    elif result in ACCESSORIES: result = random.choice(ACCESSORIES)
                elif isinstance(result, tuple):
                    result = (random.randint(50, 255), random.randint(50, 255), random.randint(50, 255))
        return result

    # Cultural inheritance
    new_culture = CulturalBase.VOID
    if parent_a.cultural_base == parent_b.cultural_base:
        new_culture = parent_a.cultural_base
    else:
        # 20% chance to inherit from either parent instead of void
        r = random.random()
        if r < 0.1: new_culture = parent_a.cultural_base
        elif r < 0.2: new_culture = parent_b.cultural_base

    # Mutation logic
    # Use the passed mutation_chance as base, but Void parents or Elder bonus increase it
    final_mut_chance = mutation_chance
    if parent_a.cultural_base == CulturalBase.VOID or parent_b.cultural_base == CulturalBase.VOID:
        final_mut_chance = max(final_mut_chance, 0.15) if final_mut_chance > 0 else 0
    
    def apply_improvement_and_cap(current_val, cap):
        # improvement = (ceiling - current_base) * 0.10
        improvement = (cap - current_val) * 0.10
        new_val = current_val + improvement
        
        # Stat Mutation
        if final_mut_chance > 0 and random.random() < final_mut_chance:
            if random.random() < 0.7: # 70% chance positive
                new_val *= 1.25
            else:
                new_val *= 0.85
        return min(new_val, cap)

    # Base Stat Inheritance Rules
    params = CULTURAL_PARAMETERS[new_culture]
    hp_cap = 20.0 * params.hp_modifier * 2.0
    atk_cap = 5.0 * params.attack_modifier * 2.0
    spd_cap = 5.0 * params.speed_modifier * 2.0

    # HP: Takes from higher parent
    new_hp = apply_improvement_and_cap(max(parent_a.base_hp, parent_b.base_hp), hp_cap)

    # ATK: Average of both parents
    new_atk = apply_improvement_and_cap((parent_a.base_atk + parent_b.base_atk) / 2.0, atk_cap)

    # SPD: Takes from faster parent - 5% penalty
    new_spd = apply_improvement_and_cap(max(parent_a.base_spd, parent_b.base_spd) * 0.95, spd_cap)

    # Elder Rare Trait Inheritance
    accessory = inherit(parent_a.accessory, parent_b.accessory)
    if elder_bonus and accessory == "none":
        # Elder bonus: Higher chance if we would have gotten 'none'
        if random.random() < 0.20:
             accessory = random.choice([a for a in ACCESSORIES if a != "none"])

    return SlimeGenome(
        shape=inherit(parent_a.shape, parent_b.shape),
        size=inherit(parent_a.size, parent_b.size),
        base_color=inherit(parent_a.base_color, parent_b.base_color),
        pattern=inherit(parent_a.pattern, parent_b.pattern),
        pattern_color=inherit(parent_a.pattern_color, parent_b.pattern_color),
        accessory=accessory,
        curiosity=inherit(parent_a.curiosity, parent_b.curiosity, True),
        energy=inherit(parent_a.energy, parent_b.energy, True),
        affection=inherit(parent_a.affection, parent_b.affection, True),
        shyness=inherit(parent_a.shyness, parent_b.shyness, True),
        cultural_base=new_culture,
        base_hp=new_hp,
        base_atk=new_atk,
        base_spd=new_spd,
        generation=max(parent_a.generation, parent_b.generation) + 1
    )
