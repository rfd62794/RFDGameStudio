"""
Quartermaster: Deterministic Logic Engine

Separates "Hard Math" from "Soft Logic".
Calculates final outcomes based on:
1. Base Difficulty (from Arbiter/Context)
2. Environmental Tags (Room properties)
3. Player Stats & Inventory
4. Dice Rolls (d20)
"""

import random
from dataclasses import dataclass
from typing import List, Dict, Optional, Literal
    
from loguru import logger
from pydantic import BaseModel, Field
from loot_system import Item


# Deterministic Difficulty Table (Iron Frame)
DC_TABLE = {
    # Default fallback
    "default": 12,
    
    # Intent-based Base DCs
    "force": 10,       # Easier to just smash things
    "combat": 10,
    "finesse": 12,     # Requires some skill
    "investigate": 15, # Finding hidden things is hard
    "charm": 12,       # Social interactions vary
    "magic": 14,       # Magic is inherently difficult
    "stealth": 13,     # Harder than average
    "leave_area": 10   # Standard exit DC
    ,
    
    # Tag-based Modifiers (Impact on DC)
    # Positive values make it HARDER (higher DC from base)
    # Negative values make it EASIER (lower DC from base)
    "modifiers": {
        "sticky_floors": {
            "finesse": 5,   # Hard to move gracefully
            "stealth": 5,   # Hard to move quietly
            "force": -2     # Easier to smash when planted?
        },
        "rowdy_crowd": {
            "charm": -2,    # Easier to blend in/buy drinks
            "stealth": 5,   # Hard to move unseen in a crowd
            "investigate": 5 # Distractions
        },
        "dimly_lit": {
            "investigate": 5, # Hard to see
            "stealth": -5,    # Easier to hide
            "finesse": 2      # Harder to aim/move precisely
        },
        "loud": {
            "stealth": -5,  # Masked by noise
            "charm": 2      # Hard to be heard
        },
        "path_clear": {
            "leave_area": -15 # Trivial once path is cleared
        }
    }
}


class QuartermasterOutcome(BaseModel):
    """Final calculated outcome of an action."""
    
    success: bool
    total_score: int
    difficulty_class: int
    hp_delta: int = 0
    gold_delta: int = 0
    narrative_context: str = ""  # Explanation for the Chronicler (e.g., "Slipped on sticky floor")


class Quartermaster:
    """
    The Quartermaster handles all deterministic math.
    
    It takes the Arbiter's "Vibe Check" (difficulty mod) and combines it
    with hardcoded tag logic to produce a final True/False result.
    """
    
    def __init__(self):
        self.base_dc = 10  # Standard difficulty
    
    def calculate_outcome(
        self,
        intent_id: str,
        room_tags: List[str],
        base_difficulty: int = 10, # Ignored in Iron Frame
        arbiter_mod: int = 0,      # Kept for flavor/vibe compatibility

        player_stats: Dict[str, int] | None = None,
        inventory_items: List[Item] | None = None
    ) -> QuartermasterOutcome:
        """
        Resolve outcome using Deterministic 'Iron Frame' Logic.
        
        Formula:
        Roll (d20) + Stats + Items >= Base DC (from Table) + Tag Mods (from Table)
        """
        
        # 1. Calculate Target Number (DC) Deterministically
        target_dc, dc_reasons = self.calculate_dc(intent_id, room_tags)
        
        # 2. Get Attribute Bonus
        
        # 2. Calculate Modifiers (Already in DC, but we need log)
        # In Iron Frame, tags modify the DC, not the roll. 
        # So we don't return a 'tag_mod' for the roll side.
        tag_mod = 0 
        tag_reason = dc_reasons
        
        # 2b. Calculate Attribute Bonus
        attr_bonus = 0
        attr_reason = ""
        if player_stats:
            attr_name, attr_val = self._get_attribute_bonus(intent_id, player_stats)
            if attr_val != 0:
                attr_bonus = attr_val
                attr_reason = f"{attr_name.title()} ({attr_val:+d})"
        
        # 2c. Calculate Inventory Bonus
        item_bonus = 0
        item_reason = ""
        if inventory_items:
            # Determine relevant stat for this intent
            target_stat, _ = self._get_attribute_bonus(intent_id, player_stats or {})
            
            # Sum bonuses from relevant items
            for item in inventory_items:
                if item.target_stat == target_stat:
                    item_bonus += item.modifier_value
                    item_reason = f"Item: {item.name} ({item.modifier_value:+d})" # Simple single item reason for now
        
        # 3. Roll the Die
        d20_roll = random.randint(1, 20)
        
        # 4. Total Score
        total_score = d20_roll + attr_bonus + item_bonus + tag_mod
        
        # 5. Determine Success
        success = total_score >= target_dc
        
        # 6. Calculate Crit/Fail consequences (HP/Gold)
        hp_delta = 0
        if not success:
            # Standard failure damage
            margin = target_dc - total_score
            if margin >= 5: # Bad fail
                hp_delta = -random.randint(5, 10)
            else: # Near miss
                hp_delta = -random.randint(1, 4)
        
        # Log the math for debugging
        log_msg = (
            f"Action: {intent_id} | Tags: {room_tags} | "
            f"Roll: {d20_roll} + Attr: {attr_bonus} + Item: {item_bonus} + Tag: {tag_mod} = {total_score} "
            f"vs DC: {target_dc} ({base_difficulty} + {arbiter_mod}) -> "
            f"{'SUCCESS' if success else 'FAILURE'}"
        )
        logger.debug(log_msg)

        
        # Construct narrative context
        context_parts = []
        if tag_reason:
            context_parts.append(tag_reason)
        if attr_reason:
            context_parts.append(attr_reason)
        if item_reason:
            context_parts.append(item_reason)
        context_parts.append(f"Rolled {d20_roll}")
        
        return QuartermasterOutcome(
            success=success,
            total_score=total_score,
            difficulty_class=target_dc,
            hp_delta=hp_delta,
            narrative_context=" | ".join(context_parts)
        )

    def _get_attribute_bonus(self, intent_id: str, stats: Dict[str, int]) -> tuple[str, int]:
        """Map intent to primary attribute."""
        intent = intent_id.lower()
        
        # Mapping Logic
        mapping = {
            "force": "strength",
            "combat": "strength",
            "athletics": "strength",
            
            "finesse": "dexterity",
            "stealth": "dexterity",
            "acrobatics": "dexterity",
            
            "investigate": "intelligence",
            "search": "intelligence",
            "perception": "intelligence",
            
            "charm": "charisma",
            "persuade": "charisma",
            "social": "charisma",
            "distract": "charisma",
            "leave_area": "dexterity"
        }
        
        attr_name = mapping.get(intent, "luck") # Default to luck (0) if unknown
        return attr_name, stats.get(attr_name, 0)

    def calculate_dc(self, intent_id: str, room_tags: List[str]) -> tuple[int, str]:
        """
        Calculate Difficulty Class based on Intent and Room Tags (Table Lookup).
        
        Returns: (Final DC, Reason String)
        """
        intent = intent_id.lower()
        
        # Base DC
        base = DC_TABLE.get(intent, DC_TABLE["default"])
        reasons = [f"Base DC {base}"]
        
        # Tag Modifiers
        tag_delta = 0
        modifiers = DC_TABLE.get("modifiers", {})
        
        for tag in room_tags:
            norm_tag = tag.lower().replace(" ", "_")
            if norm_tag in modifiers:
                intent_mods = modifiers[norm_tag]
                if intent in intent_mods:
                    mod = intent_mods[intent]
                    tag_delta += mod
                    reasons.append(f"{tag.replace('_', ' ').title()} ({'+' if mod > 0 else ''}{mod} DC)")
        
        final_dc = base + tag_delta
        return final_dc, ", ".join(reasons)

    def _calculate_tag_modifiers(self, intent_id: str, tags: List[str]) -> tuple[int, str]:
        """
        Apply deterministic tag logic.
        Returns: (modifier_value, reason_string)
        """
        modifier = 0
        reasons = []
        
        # Lowercase for consistent matching
        tags = [t.lower() for t in tags]
        intent = intent_id.lower()
        
        # --- Environment Logic ---
        
        # Sticky Floors
        if "sticky floors" in tags:
            if intent in ["finesse", "stealth", "acrobatics"]:
                modifier -= 5
                reasons.append("Sticky floors hindered movement")
            elif intent in ["force", "combat"]:
                modifier += 2
                reasons.append("Good footing on sticky floor")
                
        # Dimly Lit
        if "dimly lit" in tags:
            if intent in ["investigate", "perception", "search"]:
                modifier -= 5
                reasons.append("Too dark to see clearly")
            elif intent in ["stealth", "finesse"]:
                modifier += 5
                reasons.append("Shadows provided cover")
                
        # Rowdy Crowd
        if "rowdy crowd" in tags:
            if intent in ["charm", "social", "persuade"]:
                modifier -= 2
                reasons.append("Crowd noise drowned you out")
            elif intent in ["distract", "stealth"]:
                modifier += 5
                reasons.append("Chaos masked your actions")
                
        # Slippery
        if "slippery" in tags:
            if intent in ["force", "combat", "athletics"]:
                modifier -= 5
                reasons.append("Slipped on wet surface")
            elif intent in ["finesse"]:
                modifier -= 2
                reasons.append("Hard to keep balance")

        # Open Space
        if "open space" in tags:
            if intent in ["stealth", "hide"]:
                modifier -= 5
                reasons.append("No cover available")
            elif intent in ["force", "combat"]:
                modifier += 2
                reasons.append("Room to maneuver")
        
        return modifier, "; ".join(reasons)
