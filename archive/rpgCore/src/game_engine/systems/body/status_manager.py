"""
Status Manager - Effect and Buff/Debuff Tracking

Manages temporary status effects, buffs, debuffs, and conditions on entities.
Handles automatic expiration and effect stacking.

Features:
- Status effect lifecycle management
- Effect stacking (additive or multiplicative)
- Automatic expiration based on duration
- Effect querying by category
- Intent-based effect application
"""

from typing import Dict, List, Optional, Any, Set
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod

from src.game_engine.foundation import BaseSystem, SystemConfig, SystemStatus, Result


class EffectType(Enum):
    """Types of status effects"""
    BUFF = "buff"
    DEBUFF = "debuff"
    CONDITION = "condition"
    DAMAGE_OVER_TIME = "dot"
    CROWD_CONTROL = "cc"


class StackingMode(Enum):
    """How effects stack when applied multiple times"""
    IGNORE = "ignore"  # Don't apply if already active
    REPLACE = "replace"  # Replace existing effect
    STACK_ADDITIVE = "stack_additive"  # Add duration and magnitude
    STACK_MULTIPLICATIVE = "stack_multiplicative"  # Multiply magnitude


@dataclass
class StatusEffect:
    """Individual status effect instance"""
    effect_id: str
    entity_id: str
    effect_type: EffectType
    name: str
    magnitude: float = 1.0  # Strength/potency of effect
    duration: float = 0.0  # Remaining duration in seconds
    max_duration: float = 0.0  # Original duration
    applied_time: float = 0.0
    source_id: Optional[str] = None  # Who applied this effect
    tags: Set[str] = field(default_factory=set)  # Categorization tags
    data: Dict[str, Any] = field(default_factory=dict)  # Custom data

    def is_expired(self, current_time: float) -> bool:
        """Check if effect has expired"""
        return self.duration <= 0.0

    def get_remaining_ratio(self) -> float:
        """Get remaining duration as a ratio (0-1)"""
        if self.max_duration <= 0:
            return 1.0
        return max(0.0, self.duration / self.max_duration)


class StatusManager(BaseSystem):
    """Manages all status effects and conditions for entities"""

    def __init__(self, config: Optional[SystemConfig] = None):
        super().__init__(config or SystemConfig(name="StatusManager"))
        self.entity_effects: Dict[str, List[StatusEffect]] = {}  # entity_id -> list of effects
        self.effect_categories: Dict[str, Set[str]] = {}  # category -> entity_ids with that effect
        self.total_effects_applied = 0
        self.total_effects_expired = 0

    def initialize(self) -> bool:
        """Initialize the status manager"""
        self.status = SystemStatus.RUNNING
        self._initialized = True
        return True

    def tick(self, delta_time: float) -> None:
        """Update all active effects"""
        if self.status != SystemStatus.RUNNING:
            return

        current_time = 0.0  # Would be passed from game loop
        self.update_effects(delta_time, current_time)

    def shutdown(self) -> None:
        """Shutdown the status manager"""
        self.entity_effects.clear()
        self.effect_categories.clear()
        self.status = SystemStatus.STOPPED

    def process_intent(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Process status-related intents"""
        action = intent.get("action", "")

        if action == "apply_effect":
            entity_id = intent.get("entity_id", "")
            effect_type = EffectType(intent.get("effect_type", "buff"))
            name = intent.get("name", "")
            magnitude = intent.get("magnitude", 1.0)
            duration = intent.get("duration", 5.0)
            source_id = intent.get("source_id")

            result = self.apply_effect(
                entity_id, name, effect_type, magnitude, duration, source_id
            )
            return {"applied": result.success, "error": result.error if not result.success else None}

        elif action == "remove_effect":
            entity_id = intent.get("entity_id", "")
            effect_id = intent.get("effect_id", "")
            result = self.remove_effect(entity_id, effect_id)
            return {"removed": result.success, "error": result.error if not result.success else None}

        elif action == "get_effects":
            entity_id = intent.get("entity_id", "")
            effects = self.get_entity_effects(entity_id)
            return {
                "effects_count": len(effects),
                "effects": [
                    {
                        "name": e.name,
                        "type": e.effect_type.value,
                        "magnitude": e.magnitude,
                        "remaining": e.duration
                    }
                    for e in effects
                ]
            }

        elif action == "clear_effects":
            entity_id = intent.get("entity_id", "")
            category = intent.get("category")
            self.clear_entity_effects(entity_id, category)
            return {"cleared": True}

        else:
            return {"error": f"Unknown StatusManager action: {action}"}

    def apply_effect(self, entity_id: str, name: str, effect_type: EffectType,
                    magnitude: float = 1.0, duration: float = 5.0,
                    source_id: Optional[str] = None,
                    stacking_mode: StackingMode = StackingMode.STACK_ADDITIVE) -> Result[StatusEffect]:
        """Apply a status effect to an entity"""
        try:
            # Check for existing effect with same name
            if entity_id in self.entity_effects:
                for existing in self.entity_effects[entity_id]:
                    if existing.name == name:
                        if stacking_mode == StackingMode.IGNORE:
                            return Result(success=False, error="Effect already active")
                        elif stacking_mode == StackingMode.REPLACE:
                            self.remove_effect(entity_id, existing.effect_id)
                            break
                        elif stacking_mode == StackingMode.STACK_ADDITIVE:
                            existing.duration += duration
                            existing.magnitude += magnitude
                            return Result(success=True, value=existing)
                        elif stacking_mode == StackingMode.STACK_MULTIPLICATIVE:
                            existing.magnitude *= magnitude
                            existing.duration += duration
                            return Result(success=True, value=existing)

            # Create new effect
            effect_id = f"{entity_id}_{name}_{self.total_effects_applied}"
            effect = StatusEffect(
                effect_id=effect_id,
                entity_id=entity_id,
                effect_type=effect_type,
                name=name,
                magnitude=magnitude,
                duration=duration,
                max_duration=duration,
                source_id=source_id
            )

            # Add to tracking
            if entity_id not in self.entity_effects:
                self.entity_effects[entity_id] = []
            self.entity_effects[entity_id].append(effect)

            # Category tracking
            category = f"{effect_type.value}_{name}"
            if category not in self.effect_categories:
                self.effect_categories[category] = set()
            self.effect_categories[category].add(entity_id)

            self.total_effects_applied += 1
            return Result(success=True, value=effect)

        except Exception as e:
            return Result(success=False, error=f"Failed to apply effect: {e}")

    def remove_effect(self, entity_id: str, effect_id: str) -> Result[bool]:
        """Remove a specific effect from an entity"""
        try:
            if entity_id not in self.entity_effects:
                return Result(success=False, error="Entity has no effects")

            effects = self.entity_effects[entity_id]
            effect_to_remove = None

            for effect in effects:
                if effect.effect_id == effect_id:
                    effect_to_remove = effect
                    break

            if not effect_to_remove:
                return Result(success=False, error="Effect not found")

            effects.remove(effect_to_remove)

            # Clean up category tracking
            if len(effects) == 0:
                del self.entity_effects[entity_id]

            return Result(success=True, value=True)

        except Exception as e:
            return Result(success=False, error=f"Failed to remove effect: {e}")

    def update_effects(self, delta_time: float, current_time: float) -> List[StatusEffect]:
        """Update all active effects and return expired ones"""
        expired_effects = []

        for entity_id in list(self.entity_effects.keys()):
            effects = self.entity_effects[entity_id]

            for effect in effects[:]:
                effect.duration -= delta_time

                if effect.is_expired(current_time):
                    expired_effects.append(effect)
                    effects.remove(effect)
                    self.total_effects_expired += 1

            # Clean up empty lists
            if len(effects) == 0:
                del self.entity_effects[entity_id]

        return expired_effects

    def get_entity_effects(self, entity_id: str, effect_type: Optional[EffectType] = None) -> List[StatusEffect]:
        """Get all effects on an entity, optionally filtered by type"""
        if entity_id not in self.entity_effects:
            return []

        effects = self.entity_effects[entity_id]

        if effect_type:
            return [e for e in effects if e.effect_type == effect_type]

        return effects.copy()

    def has_effect(self, entity_id: str, effect_name: str) -> bool:
        """Check if entity has a specific named effect"""
        if entity_id not in self.entity_effects:
            return False

        return any(e.name == effect_name for e in self.entity_effects[entity_id])

    def get_effect_magnitude(self, entity_id: str, effect_name: str) -> float:
        """Get total magnitude of all effects with given name"""
        if entity_id not in self.entity_effects:
            return 0.0

        total = 0.0
        for effect in self.entity_effects[entity_id]:
            if effect.name == effect_name:
                total += effect.magnitude

        return total

    def clear_entity_effects(self, entity_id: str, category: Optional[str] = None) -> None:
        """Clear all effects from an entity, optionally by category"""
        if entity_id not in self.entity_effects:
            return

        if category:
            effects = self.entity_effects[entity_id]
            to_remove = [e for e in effects if category in str(e.effect_type)]
            for effect in to_remove:
                effects.remove(effect)
                self.total_effects_expired += 1

            if len(effects) == 0:
                del self.entity_effects[entity_id]
        else:
            count = len(self.entity_effects.get(entity_id, []))
            self.total_effects_expired += count
            del self.entity_effects[entity_id]

    def get_status(self) -> Dict[str, Any]:
        """Get status manager status"""
        total_active = sum(len(effects) for effects in self.entity_effects.values())

        return {
            'entities_with_effects': len(self.entity_effects),
            'total_active_effects': total_active,
            'total_effects_applied': self.total_effects_applied,
            'total_effects_expired': self.total_effects_expired,
            'unique_categories': len(self.effect_categories)
        }


# Common status effect factory functions

def create_damage_buff(magnitude: float = 1.2, duration: float = 10.0) -> Dict[str, Any]:
    """Create a damage buff effect"""
    return {
        'name': 'damage_buff',
        'effect_type': EffectType.BUFF,
        'magnitude': magnitude,
        'duration': duration
    }


def create_slow_debuff(magnitude: float = 0.5, duration: float = 3.0) -> Dict[str, Any]:
    """Create a slow debuff effect"""
    return {
        'name': 'slow',
        'effect_type': EffectType.DEBUFF,
        'magnitude': magnitude,
        'duration': duration
    }


def create_poison_dot(magnitude: float = 1.0, duration: float = 5.0) -> Dict[str, Any]:
    """Create a poison damage-over-time effect"""
    return {
        'name': 'poison',
        'effect_type': EffectType.DAMAGE_OVER_TIME,
        'magnitude': magnitude,
        'duration': duration
    }


def create_stun_cc(duration: float = 2.0) -> Dict[str, Any]:
    """Create a stun crowd-control effect"""
    return {
        'name': 'stun',
        'effect_type': EffectType.CROWD_CONTROL,
        'magnitude': 1.0,
        'duration': duration
    }
