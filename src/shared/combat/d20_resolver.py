"""
D20 Resolver — Deterministic D&D Dice Engine (Extracted from game_engine.engines)

Pure deterministic D&D logic. No external engine dependencies.
Handles dice rolling (d20 + modifiers), advantage/disadvantage,
ability checks, and saving throws.
"""

import random
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from enum import Enum


class DifficultyClass(Enum):
    """Standard D&D Difficulty Classes."""
    TRIVIAL = 5
    EASY = 10
    MODERATE = 15
    HARD = 20
    VERY_HARD = 25
    NEARLY_IMPOSSIBLE = 30


@dataclass
class D20Result:
    """Result of a D20 resolution — pure data, no narrative."""
    success: bool
    roll: int
    total_score: int
    difficulty_class: int
    hp_delta: int = 0
    reputation_deltas: Dict[str, int] = None
    narrative_context: str = ""
    advantage_type: Optional[str] = None
    raw_rolls: Optional[Tuple[int, int]] = None
    deterministic_seed: Optional[int] = None

    def __post_init__(self):
        if self.reputation_deltas is None:
            self.reputation_deltas = {}

    def string_summary(self) -> str:
        """Formatted string summary for UI display."""
        parts = []

        if self.advantage_type and self.raw_rolls:
            label = "Advantage" if self.advantage_type == "advantage" else "Disadvantage"
            parts.append(f"🎲 {label}: {self.raw_rolls[0]} & {self.raw_rolls[1]} → {self.roll}")
        else:
            parts.append(f"🎲 Roll: {self.roll}")

        result_text = "✅ SUCCESS" if self.success else "❌ FAILURE"
        parts.append(result_text)
        parts.append(f"Total: {self.total_score} vs DC {self.difficulty_class}")

        return " | ".join(parts)


class D20Resolver:
    """
    Deterministic D&D rules engine.

    Standalone dice resolver with no engine framework dependencies.
    Supports standard d20 + modifiers, advantage/disadvantage,
    and deterministic mode for reproducible test rolls.

    Example:
        >>> resolver = D20Resolver()
        >>> resolver.set_deterministic_mode(True, seed=42)
        >>> result = resolver.ability_check(modifier=3, difficulty_class=15)
        >>> print(result.string_summary())
    """

    def __init__(self):
        self.deterministic_mode = False
        self.deterministic_seed = 0

    def roll_d20(
        self,
        modifier: int = 0,
        advantage: bool = False,
        disadvantage: bool = False,
    ) -> int:
        """
        Roll a d20 with optional modifier and advantage/disadvantage.

        Returns:
            Total roll (d20 + modifier)
        """
        if advantage and disadvantage:
            base_roll = self._roll_d20()
        elif advantage:
            roll1 = self._roll_d20()
            roll2 = self._roll_d20()
            base_roll = max(roll1, roll2)
        elif disadvantage:
            roll1 = self._roll_d20()
            roll2 = self._roll_d20()
            base_roll = min(roll1, roll2)
        else:
            base_roll = self._roll_d20()

        return base_roll + modifier

    def ability_check(
        self,
        modifier: int,
        difficulty_class: int,
        advantage: bool = False,
        disadvantage: bool = False,
    ) -> D20Result:
        """Perform an ability check against a Difficulty Class."""
        roll = self.roll_d20(modifier, advantage, disadvantage)
        success = roll >= difficulty_class

        return D20Result(
            success=success,
            roll=roll - modifier,
            total_score=roll,
            difficulty_class=difficulty_class,
            narrative_context=f"Ability check: rolled {roll - modifier}, needed {difficulty_class}",
        )

    def saving_throw(
        self,
        modifier: int,
        difficulty_class: int,
    ) -> D20Result:
        """Perform a saving throw against a Difficulty Class."""
        roll = self.roll_d20(modifier)
        success = roll >= difficulty_class

        return D20Result(
            success=success,
            roll=roll - modifier,
            total_score=roll,
            difficulty_class=difficulty_class,
            narrative_context=f"Saving throw: rolled {roll - modifier}, needed {difficulty_class}",
        )

    def _roll_d20(self) -> int:
        """Roll a single d20 (1-20)."""
        if self.deterministic_mode:
            rng = random.Random(self.deterministic_seed)
            self.deterministic_seed += 1
            return rng.randint(1, 20)
        else:
            return random.randint(1, 20)

    def set_deterministic_mode(self, enabled: bool, seed: int = 0) -> None:
        """Enable/disable deterministic mode for reproducible rolls."""
        self.deterministic_mode = enabled
        self.deterministic_seed = seed
