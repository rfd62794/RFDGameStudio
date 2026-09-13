from enum import Enum
from dataclasses import dataclass
import random

class CombatStance(Enum):
    AGGRESSIVE = "aggressive"
    DEFENSIVE = "defensive"
    FLEEING = "fleeing"

@dataclass
class StanceModifiers:
    attack_modifier: float
    defense_modifier: float
    speed_modifier: float
    flee_chance: float

STANCE_MODIFIERS = {
    CombatStance.AGGRESSIVE: StanceModifiers(attack_modifier=1.2, defense_modifier=1.0, speed_modifier=1.0, flee_chance=0.0),
    CombatStance.DEFENSIVE: StanceModifiers(attack_modifier=0.8, defense_modifier=1.5, speed_modifier=0.8, flee_chance=0.0),
    CombatStance.FLEEING: StanceModifiers(attack_modifier=0.5, defense_modifier=0.7, speed_modifier=1.4, flee_chance=0.6),
}

class StanceController:
    def __init__(self):
        self.current: CombatStance = CombatStance.AGGRESSIVE

    def evaluate(self, hp: int, max_hp: int, tier: str) -> CombatStance:
        """
        Evaluate and return the appropriate stance based on HP and tier.
        Does not automatically transition the state; returns what the state *should* be.
        Tactical enemies (not 'mindless') transition to DEFENSIVE at or below 50% HP.
        Mindless enemies (tier == 'mindless') transition to FLEEING at or below 25% HP.
        """
        hp_pct = hp / max_hp if max_hp > 0 else 0.0

        if tier == "mindless":
            if hp_pct <= 0.25:
                return CombatStance.FLEEING
            return CombatStance.AGGRESSIVE
        
        # Tactical (non-mindless)
        if hp_pct <= 0.50:
            return CombatStance.DEFENSIVE
        return CombatStance.AGGRESSIVE

    def transition(self, new_stance: CombatStance) -> bool:
        """Transitions to the new stance. Returns True if the stance actually changed."""
        if self.current != new_stance:
            self.current = new_stance
            return True
        return False

    def get_modifiers(self) -> StanceModifiers:
        return STANCE_MODIFIERS[self.current]

    def effective_stat(self, base_stat: int, stat_name: str) -> int:
        """Applies the modifier to the base stat and rounds to nearest integer."""
        modifiers = self.get_modifiers()
        modifier_val = getattr(modifiers, f"{stat_name}_modifier", 1.0)
        return round(base_stat * modifier_val)
