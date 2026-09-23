"""
StatBlock - Computed stats layer between raw genome values and gameplay.

Provides culture modifiers, equipment bonuses, and stage scaling.
Scenes and systems should read from StatBlock, not raw genome fields.
"""

from dataclasses import dataclass, replace
from typing import Dict, Any

from src.shared.genetics.genome import SlimeGenome


@dataclass
class StatBlock:
    """
    Computed stats layer between raw genome values and final values used in gameplay.
    Scenes and systems read from StatBlock, never from raw genome fields directly.
    """

    # Base values (from genome)
    base_hp: float
    base_atk: float
    base_spd: float

    # Soft stats (new)
    base_mnd: float = 5.0
    base_res: float = 5.0
    base_chm: float = 5.0

    # Modifier layers (additive floats)
    culture_hp: float = 0.0
    culture_atk: float = 0.0
    culture_spd: float = 0.0
    culture_mnd: float = 0.0
    culture_res: float = 0.0
    culture_chm: float = 0.0

    # Equipment modifiers
    equipment_hp: float = 0.0
    equipment_atk: float = 0.0
    equipment_spd: float = 0.0
    equipment_mnd: float = 0.0
    equipment_res: float = 0.0
    equipment_chm: float = 0.0

    # Growth factors (multiplier from training XP)
    hp_growth: float = 1.0
    atk_growth: float = 1.0
    spd_growth: float = 1.0
    mnd_growth: float = 1.0
    res_growth: float = 1.0
    chm_growth: float = 1.0

    # Stage scaling
    stage_modifier: float = 1.0

    # Computed finals (read-only properties)
    @property
    def hp(self) -> int:
        return max(1, int(
            (self.base_hp * self.hp_growth * self.stage_modifier)
            + self.culture_hp
            + self.equipment_hp
        ))

    @property
    def atk(self) -> int:
        return max(1, int(
            (self.base_atk * self.atk_growth * self.stage_modifier)
            + self.culture_atk
            + self.equipment_atk
        ))

    @property
    def spd(self) -> int:
        return max(1, int(
            (self.base_spd * self.spd_growth * self.stage_modifier)
            + self.culture_spd
            + self.equipment_spd
        ))

    @property
    def mnd(self) -> int:
        return max(1, int(
            (self.base_mnd * self.mnd_growth * self.stage_modifier)
            + self.culture_mnd
            + self.equipment_mnd
        ))

    @property
    def res(self) -> int:
        return max(1, int(
            (self.base_res * self.res_growth * self.stage_modifier)
            + self.culture_res
            + self.equipment_res
        ))

    @property
    def chm(self) -> int:
        return max(1, int(
            (self.base_chm * self.chm_growth * self.stage_modifier)
            + self.culture_chm
            + self.equipment_chm
        ))

    @staticmethod
    def _stat_growth_factor(stat_xp: int, level: int) -> float:
        """Calculate growth factor based on stat XP and level [0.8, 1.5]"""
        xp_ceiling = level * 50
        if xp_ceiling == 0:
            return 1.0
        ratio = stat_xp / xp_ceiling
        return max(0.8, min(1.5, 0.8 + (ratio * 0.7)))

    @classmethod
    def from_slime(cls, slime: Any) -> 'StatBlock':
        """
        Build StatBlock from a full slime (RosterSlime or Creature).
        Reads genome for base values.
        Reads stat XP pools for growth factors.
        Reads culture_expression for modifiers.
        Reads level for stage modifier.
        """
        block = cls.from_genome(slime.genome, slime.level)
        
        # Apply growth factors
        block.hp_growth = cls._stat_growth_factor(getattr(slime, 'vit_xp', 0), slime.level)
        block.atk_growth = cls._stat_growth_factor(getattr(slime, 'pwr_xp', 0), slime.level)
        block.spd_growth = cls._stat_growth_factor(getattr(slime, 'agi_xp', 0), slime.level)
        block.mnd_growth = cls._stat_growth_factor(getattr(slime, 'mnd_xp', 0), slime.level)
        block.res_growth = cls._stat_growth_factor(getattr(slime, 'res_xp', 0), slime.level)
        block.chm_growth = cls._stat_growth_factor(getattr(slime, 'chm_xp', 0), slime.level)

        return block

    @classmethod
    def from_genome(cls, genome: SlimeGenome, level: int = 1) -> 'StatBlock':
        """
        Build StatBlock from genome alone.
        Equipment modifiers default to 0.
        Culture modifiers derived from culture_expression weights.
        Stage modifier from lifecycle stage.
        """
        # Base values from genome
        base_hp = genome.base_hp
        base_atk = genome.base_atk
        base_spd = genome.base_spd

        # Derivation from personality axes
        # MND base = (genome.curiosity * 8.0) + (genome.energy * 4.0), min 5.0
        base_mnd = max(5.0, (genome.curiosity * 8.0) + (genome.energy * 4.0))
        # RES base = ((1.0 - genome.shyness) * 8.0) + (genome.energy * 2.0), min 5.0
        base_res = max(5.0, ((1.0 - genome.shyness) * 8.0) + (genome.energy * 2.0))
        # CHM base = (genome.affection * 8.0) + ((1.0 - genome.shyness) * 4.0), min 5.0
        base_chm = max(5.0, (genome.affection * 8.0) + ((1.0 - genome.shyness) * 4.0))

        # Culture modifier constants
        CULTURE_WEIGHTS = {
            'ember':   {'atk': 3.0, 'hp': 0.5, 'spd': 0.5, 'mnd': -0.5, 'res': -0.5, 'chm': 0.0},
            'gale':    {'atk': 0.5, 'hp': 0.5, 'spd': 3.0, 'mnd': 1.0,  'res': 0.0,  'chm': 0.0},
            'marsh':   {'atk': 0.5, 'hp': 3.0, 'spd': 0.5, 'mnd': -0.5, 'res': 0.5,  'chm': 1.5},
            'crystal': {'atk': 1.0, 'hp': 1.0, 'spd': 1.0, 'mnd': 2.0,  'res': 1.5,  'chm': 0.5},
            'tundra':  {'atk': 0.5, 'hp': 2.0, 'spd': -1.0,'mnd': 0.5,  'res': 2.0,  'chm': -0.5},
            'tide':    {'atk': 2.0, 'hp': 0.5, 'spd': 0.5, 'mnd': 0.5,  'res': -0.5, 'chm': 2.5},
            'void':    {'atk': 0.0, 'hp': 0.0, 'spd': 0.0, 'mnd': 0.0,  'res': 0.0,  'chm': 0.0}
        }

        # Compute culture modifiers
        c_mods = {'hp': 0.0, 'atk': 0.0, 'spd': 0.0, 'mnd': 0.0, 'res': 0.0, 'chm': 0.0}
        
        expr = genome.culture_expression or {}
        for culture, weight in expr.items():
            weights = CULTURE_WEIGHTS.get(culture, {})
            for stat in c_mods:
                c_mods[stat] += weight * weights.get(stat, 0.0)

        # Stage modifier from level
        stage_mod = cls._stage_modifier(level)

        return cls(
            base_hp=base_hp,
            base_atk=base_atk,
            base_spd=base_spd,
            base_mnd=base_mnd,
            base_res=base_res,
            base_chm=base_chm,
            culture_hp=c_mods['hp'],
            culture_atk=c_mods['atk'],
            culture_spd=c_mods['spd'],
            culture_mnd=c_mods['mnd'],
            culture_res=c_mods['res'],
            culture_chm=c_mods['chm'],
            stage_modifier=stage_mod,
        )

    @staticmethod
    def _stage_modifier(level: int) -> float:
        """Calculate stage modifier based on slime level"""
        if level <= 1:   return 0.6  # Hatchling
        elif level <= 3: return 0.8  # Juvenile
        elif level <= 5: return 1.0  # Young
        elif level <= 7: return 1.2  # Prime
        elif level <= 9: return 1.1  # Veteran
        else:            return 1.0  # Elder (10+)

    def with_equipment(self,
                       hp: float = 0.0,
                       atk: float = 0.0,
                       spd: float = 0.0,
                       mnd: float = 0.0,
                       res: float = 0.0,
                       chm: float = 0.0
                       ) -> 'StatBlock':
        """
        Return new StatBlock with equipment modifiers applied.
        Does not mutate original.
        """
        return replace(self,
            equipment_hp=hp,
            equipment_atk=atk,
            equipment_spd=spd,
            equipment_mnd=mnd,
            equipment_res=res,
            equipment_chm=chm)

    def to_dict(self) -> dict:
        """Serialize for debugging/display."""
        return {
            'hp':  self.hp,
            'atk': self.atk,
            'spd': self.spd,
            'mnd': self.mnd,
            'res': self.res,
            'chm': self.chm,
            'base_hp':  self.base_hp,
            'base_atk': self.base_atk,
            'base_spd': self.base_spd,
            'base_mnd': self.base_mnd,
            'base_res': self.base_res,
            'base_chm': self.base_chm,
            'culture_hp':  self.culture_hp,
            'culture_atk': self.culture_atk,
            'culture_spd': self.culture_spd,
            'culture_mnd': self.culture_mnd,
            'culture_res': self.culture_res,
            'culture_chm': self.culture_chm,
            'hp_growth': self.hp_growth,
            'atk_growth': self.atk_growth,
            'spd_growth': self.spd_growth,
            'mnd_growth': self.mnd_growth,
            'res_growth': self.res_growth,
            'chm_growth': self.chm_growth,
            'stage_modifier': self.stage_modifier,
        }
