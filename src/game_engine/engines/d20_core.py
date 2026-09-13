"""
D20 Core Engine: Deterministic D&D Rules

The "Iron Frame" - pure deterministic D&D logic with no LLMs.
Only math, rules, and state transitions.

Responsibilities:
- Dice rolling (d20 + modifiers) with advantage/disadvantage
- HP calculations and state changes
- Reputation modifications
- Faction relationship changes
- Goal completion tracking
- Save/load game state
"""

import random
import hashlib
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus
from src.game_engine.engines.base_engine import BaseEngine


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
    """Result of a D20 resolution - pure data, no narrative."""
    success: bool
    roll: int
    total_score: int
    difficulty_class: int
    hp_delta: int = 0
    reputation_deltas: Dict[str, int] = None
    relationship_changes: Dict[str, Dict] = None
    npc_state_changes: Dict[str, str] = None
    goals_completed: List[str] = None
    narrative_context: str = ""
    advantage_type: Optional[str] = None  # "advantage", "disadvantage", or None
    raw_rolls: Optional[Tuple[int, int]] = None  # For advantage/disadvantage transparency
    deterministic_seed: Optional[int] = None  # Seed used for deterministic rolls

    def __post_init__(self):
        """Initialize default empty collections."""
        if self.reputation_deltas is None:
            self.reputation_deltas = {}
        if self.relationship_changes is None:
            self.relationship_changes = {}
        if self.npc_state_changes is None:
            self.npc_state_changes = {}
        if self.goals_completed is None:
            self.goals_completed = []

    def string_summary(self) -> str:
        """Create a formatted string summary for UI display."""
        parts = []

        # Roll information with advantage/disadvantage
        if self.advantage_type and self.raw_rolls:
            if self.advantage_type == "advantage":
                parts.append(f"🎲 Advantage: {self.raw_rolls[0]} & {self.raw_rolls[1]} → {self.roll}")
            else:
                parts.append(f"🎲 Disadvantage: {self.raw_rolls[0]} & {self.raw_rolls[1]} → {self.roll}")
        else:
            parts.append(f"🎲 Roll: {self.roll}")

        # Success/failure
        result_text = "✅ SUCCESS" if self.success else "❌ FAILURE"
        parts.append(f"{result_text}")

        # Math breakdown
        parts.append(f"Total: {self.total_score} vs DC {self.difficulty_class}")

        return " | ".join(parts)


class D20Resolver(BaseEngine):
    """
    Deterministic D&D rules engine.

    Handles all mechanical aspects of the game without LLM involvement.
    Pure math and rules processing.

    Features:
    - Standard d20 + modifiers rolling
    - Advantage/disadvantage mechanics
    - Deterministic mode for testing/reproduction
    - Comprehensive result reporting
    """

    def __init__(self, config: Optional[SystemConfig] = None):
        """Initialize the D20 Core engine."""
        super().__init__(config or SystemConfig(name="D20Resolver"))
        self.deterministic_mode = False
        self.deterministic_seed = 0

    def initialize(self) -> bool:
        """Initialize the D20 engine."""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update tick for D20 engine (mostly passive)."""
        # D20 engine is mostly reactive to calls, not time-driven
        pass

    def shutdown(self) -> None:
        """Shutdown the D20 engine."""
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a D20-related intent.

        Args:
            intent: Intent with 'action' and parameters

        Returns:
            Result dictionary
        """
        action = intent.get("action", "")

        if action == "roll":
            return {"result": self.roll_d20(
                intent.get("modifier", 0),
                intent.get("advantage", False),
                intent.get("disadvantage", False)
            )}
        elif action == "check":
            return {"result": self.ability_check(
                intent.get("modifier", 0),
                intent.get("difficulty_class", 15),
                intent.get("advantage", False),
                intent.get("disadvantage", False)
            )}
        elif action == "save":
            return {"result": self.saving_throw(
                intent.get("modifier", 0),
                intent.get("difficulty_class", 15)
            )}
        else:
            return {"error": f"Unknown D20 action: {action}"}

    def roll_d20(
        self,
        modifier: int = 0,
        advantage: bool = False,
        disadvantage: bool = False,
    ) -> int:
        """
        Roll a d20 with optional modifier and advantage/disadvantage.

        Args:
            modifier: Modifier to add to the roll
            advantage: Roll with advantage (take higher of 2d20)
            disadvantage: Roll with disadvantage (take lower of 2d20)

        Returns:
            Total roll (d20 + modifier)
        """
        if advantage and disadvantage:
            # Advantage and disadvantage cancel out
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
        """
        Perform an ability check.

        Args:
            modifier: Ability modifier
            difficulty_class: DC to beat
            advantage: Roll with advantage
            disadvantage: Roll with disadvantage

        Returns:
            D20Result with success status and details
        """
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
        """
        Perform a saving throw.

        Args:
            modifier: Save modifier
            difficulty_class: DC to beat

        Returns:
            D20Result with success status
        """
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
        """
        Roll a single d20.

        Returns:
            Value from 1 to 20
        """
        if self.deterministic_mode:
            # Use deterministic RNG with seed
            rng = random.Random(self.deterministic_seed)
            self.deterministic_seed += 1
            return rng.randint(1, 20)
        else:
            return random.randint(1, 20)

    def set_deterministic_mode(self, enabled: bool, seed: int = 0) -> None:
        """
        Enable or disable deterministic mode for reproducible rolls.

        Args:
            enabled: Whether to enable deterministic mode
            seed: Initial seed value
        """
        self.deterministic_mode = enabled
        self.deterministic_seed = seed
