from src.shared.genetics.genome import SlimeGenome
from src.shared.genetics.cultural_base import CULTURAL_PARAMETERS

def calculate_hp(genome: SlimeGenome, level: int = 1) -> int:
    """HP = base_hp * cultural_mod * size_mod * level_mod."""
    cultural_mod = CULTURAL_PARAMETERS[genome.cultural_base].hp_modifier
    
    # Size modifier
    size_mod = {
        "tiny": 0.8,
        "small": 0.9,
        "medium": 1.0,
        "large": 1.1,
        "massive": 1.2
    }.get(genome.size, 1.0)
    
    level_mod = 1.0 + (level - 1) * 0.1
    return int(genome.base_hp * cultural_mod * size_mod * level_mod)

def calculate_attack(genome: SlimeGenome, level: int = 1) -> int:
    """Attack = (base_atk + energy_bonus) * cultural_mod * level_mod."""
    cultural_mod = CULTURAL_PARAMETERS[genome.cultural_base].attack_modifier
    
    # Energy gives a small bonus to attack
    energy_bonus = genome.energy * 2.0
    
    level_mod = 1.0 + (level - 1) * 0.1
    return int((genome.base_atk + energy_bonus) * cultural_mod * level_mod)

def calculate_speed(genome: SlimeGenome, level: int = 1) -> int:
    """Speed = (base_spd + energy_bonus) * cultural_mod * level_mod."""
    cultural_mod = CULTURAL_PARAMETERS[genome.cultural_base].speed_modifier
    
    # Energy gives a flat bonus to base speed before multipliers
    energy_bonus = genome.energy * 5.0
    
    # Speed grows slower with level than HP/ATK
    level_mod = 1.0 + (level - 1) * 0.05
    return int((genome.base_spd + energy_bonus) * cultural_mod * level_mod)
