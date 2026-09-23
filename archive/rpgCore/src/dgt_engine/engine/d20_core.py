"""
D20 Core: Deterministic D&D Rules Engine

The Heart of the Iron Frame - pure deterministic D&D logic.
No LLMs allowed here. Only math, rules, and state transitions.

Responsibilities:
- Dice rolling (d20 + modifiers)
- HP calculations
- Reputation changes
"""

import random
import hashlib
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from loguru import logger
from dgt_engine.engine.game_state import GameState, PlayerStats
from dgt_engine.game_engine.world_ledger import Coordinate
from dgt_engine.logic.faction_system import FactionSystem, FactionRelation
from dgt_engine.game_engine.quartermaster import DC_TABLE


@dataclass
class D20Result:
    """Result of a D20 resolution - pure data, no narrative."""
    success: bool
    roll: int
    total_score: int
    difficulty_class: int
    hp_delta: int
    reputation_deltas: Dict[str, int]
    relationship_changes: Dict[str, Dict]  # npc_id -> {disposition: int, tags: List[str]}
    npc_state_changes: Dict[str, str]  # npc_id -> new_state
    goals_completed: List[str]  # goal IDs
    narrative_context: str  # Technical explanation for Chronicler
    advantage_type: Optional[str] = None  # "advantage", "disadvantage", or None
    raw_rolls: Optional[Tuple[int, int]] = None  # For advantage/disadvantage transparency
    deterministic_seed: Optional[int] = None  # Seed used for deterministic rolls
    
    def string_summary(self) -> str:
        """
        Create a formatted string summary for UI display.
        
        Returns:
            Human-readable summary of the D20 resolution
        """
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
        result_color = "green" if self.success else "red"
        parts.append(f"[{result_color}]{result_text}[/{result_color}]")
        
        # Math breakdown
        parts.append(f"Total: {self.total_score} vs DC {self.difficulty_class}")
        
        # Consequences
        if self.hp_delta != 0:
            hp_color = "red" if self.hp_delta < 0 else "green"
            hp_symbol = "+" if self.hp_delta > 0 else ""
            parts.append(f"[{hp_color}]HP: {hp_symbol}{self.hp_delta}[/{hp_color}]")
        
        # Reputation changes
        for faction, delta in self.reputation_deltas.items():
            if delta != 0:
                rep_color = "red" if delta < 0 else "green"
                rep_symbol = "+" if delta > 0 else ""
                faction_name = faction.replace("_", " ").title()
                parts.append(f"[{rep_color}]⚖️ {faction_name}: {rep_symbol}{delta}[/{rep_color}]")
        
        # State changes
        for npc_id, new_state in self.npc_state_changes.items():
            parts.append(f"[yellow]{npc_id} → {new_state}[/yellow]")
        
        # Goals completed
        if self.goals_completed:
            for goal_id in self.goals_completed:
                parts.append(f"[green]✨ Goal: {goal_id}[/green]")
        
        return " | ".join(parts)


class D20Resolver:
    """
    Deterministic D&D rulebook implementation.
    
    This is the ONLY place where game mechanics are calculated.
    All other modules just orchestrate or narrate.
    """
    
    def __init__(self, faction_system: Optional[FactionSystem] = None):
        """Initialize the D20 resolver with optional faction system."""
        self.faction_system = faction_system
        self._deterministic_mode = False  # Can be enabled for testing
        self._seed_counter = 0  # For generating unique seeds
        logger.info("D20 Core initialized - deterministic rules engine ready with faction system support")
    
    def enable_deterministic_mode(self, enabled: bool = True) -> None:
        """
        Enable or disable deterministic mode.
        
        When enabled, all dice rolls will be deterministic based on
        game state, preventing save-scumming via turning.
        
        Args:
            enabled: Whether to enable deterministic mode
        """
        self._deterministic_mode = enabled
        logger.info(f"Deterministic mode {'enabled' if enabled else 'disabled'}")
    
    def _generate_deterministic_seed(self, intent_id: str, game_state: GameState, 
                                   target_npc: Optional[str] = None) -> int:
        """
        Generate deterministic seed based on game state.
        
        This ensures that the same action in the same game state
        always produces the same dice roll, preventing save-scumming.
        
        Args:
            intent_id: The action intent
            game_state: Current game state
            target_npc: Target NPC if applicable
            
        Returns:
            Deterministic seed value
        """
        # Create seed string from game state
        seed_components = [
            intent_id,
            str(game_state.turn_count),
            str(game_state.player.position.x),
            str(game_state.player.position.y),
            str(getattr(game_state, 'player_heading', 0)),
            str(game_state.player.hp),
            str(game_state.player.gold),
            target_npc or "none"
        ]
        
        seed_string = "|".join(seed_components)
        
        # Generate hash and convert to integer
        hash_object = hashlib.sha256(seed_string.encode())
        hash_hex = hash_object.hexdigest()
        
        # Use first 8 characters of hash as seed
        seed = int(hash_hex[:8], 16)
        
        # Add counter to prevent collisions in same turn
        seed = (seed + self._seed_counter) % (2**32)
        self._seed_counter += 1
        
        return seed
    
    def _roll_dice(self, advantage_type: Optional[str] = None, 
                   deterministic_seed: Optional[int] = None) -> Tuple[int, Optional[Tuple[int, int]]]:
        """
        Roll dice with advantage/disadvantage logic.
        
        Args:
            advantage_type: "advantage", "disadvantage", or None
            deterministic_seed: Optional seed for deterministic rolls
            
        Returns:
            Tuple of (final_roll, raw_rolls_for_transparency)
        """
        # Use deterministic seed if provided or in deterministic mode
        if deterministic_seed is not None:
            random.seed(deterministic_seed)
            logger.debug(f"Using deterministic seed: {deterministic_seed}")
        elif self._deterministic_mode:
            # This should be handled by the caller with a proper seed
            logger.warning("Deterministic mode enabled but no seed provided")
        
        if advantage_type == "advantage":
            roll1 = random.randint(1, 20)
            roll2 = random.randint(1, 20)
            final_roll = max(roll1, roll2)
            return final_roll, (roll1, roll2)
        elif advantage_type == "disadvantage":
            roll1 = random.randint(1, 20)
            roll2 = random.randint(1, 20)
            final_roll = min(roll1, roll2)
            return final_roll, (roll1, roll2)
        else:
            roll = random.randint(1, 20)
            return roll, None
    
    def resolve_action(
        self,
        intent_id: str,
        player_input: str,
        game_state: GameState,
        room_tags: List[str],
        target_npc: Optional[str] = None
    ) -> D20Result:
        """
        Core resolution: Roll(d20) + Modifiers vs DC.
        
        Enhanced with travel mechanics and fatigue for Phase 3.
        Now includes deterministic seeding to prevent save-scumming.
        """
        # Generate deterministic seed for this action
        deterministic_seed = self._generate_deterministic_seed(intent_id, game_state, target_npc)
        
        # 1. Calculate Difficulty Class
        dc, dc_reasoning = self._calculate_difficulty_class(intent_id, room_tags)
        
        # 2. Calculate player modifiers
        attribute_bonus, attr_name = self._get_attribute_bonus(intent_id, game_state.player.attributes)
        item_bonus = self._calculate_item_bonus(intent_id, game_state.player.inventory)
        
        # 3. Apply faction-based disadvantages
        faction_modifier = self._calculate_faction_modifier(intent_id, game_state)
        
        # 4. Calculate fatigue penalty for travel
        fatigue_penalty = 0
        if intent_id == "travel":
            fatigue_penalty = self._calculate_travel_fatigue(game_state)
            if fatigue_penalty != 0:
                dc_reasoning += f" | Travel Fatigue: {fatigue_penalty}"
        
        # 5. Roll the dice with advantage/disadvantage (deterministic)
        advantage_type = None  # Default to no advantage/disadvantage
        d20_roll, raw_rolls = self._roll_dice(advantage_type, deterministic_seed)
        
        # 6. Calculate total
        total_score = d20_roll + attribute_bonus + item_bonus + faction_modifier - fatigue_penalty
        
        # 7. Determine success
        success = total_score >= dc
        
        # 8. Calculate consequences
        hp_delta = self._calculate_hp_delta(success, total_score, dc)
        reputation_deltas = self._calculate_reputation_changes(intent_id, success, target_npc)
        relationship_changes = self._calculate_relationship_changes(intent_id, success, target_npc)
        npc_state_changes = self._calculate_npc_state_changes(intent_id, success, target_npc, game_state)
        goals_completed = self._check_goal_completion(intent_id, success, game_state, player_input)
        
        # 9. Build narrative context (technical, not creative)
        narrative_parts = [
            f"Roll: {d20_roll}",
            f"DC: {dc}",
            f"Total: {total_score}",
            f"Success: {success}",
            f"Seed: {deterministic_seed}"
        ]
        
        if attribute_bonus != 0:
            narrative_parts.append(f"{attr_name}: {attribute_bonus:+d}")
        if item_bonus != 0:
            narrative_parts.append(f"Item: {item_bonus:+d}")
        if faction_modifier != 0:
            narrative_parts.append(f"Faction: {faction_modifier:+d}")
        if fatigue_penalty != 0:
            narrative_parts.append(f"Fatigue: -{fatigue_penalty}")
        
        narrative_context = " | ".join(narrative_parts)
        
        # 10. Return result with deterministic seed
        return D20Result(
            success=success,
            roll=d20_roll,
            total_score=total_score,
            difficulty_class=dc,
            hp_delta=hp_delta,
            reputation_deltas=reputation_deltas,
            relationship_changes=relationship_changes,
            npc_state_changes=npc_state_changes,
            goals_completed=goals_completed,
            narrative_context=narrative_context,
            advantage_type=advantage_type,
            raw_rolls=raw_rolls,
            deterministic_seed=deterministic_seed
        )
    
    def _calculate_difficulty_class(self, intent_id: str, room_tags: List[str]) -> Tuple[int, str]:
        """
        Calculate difficulty class for an intent based on context.
        
        Args:
            intent_id: The action intent
            room_tags: Tags describing the current room/environment
            
        Returns:
            Tuple of (difficulty_class, reasoning)
        """
        # Base DC from quartermaster
        base_dc = DC_TABLE.get(intent_id, 15)
        
        # Environmental modifiers
        dc_modifier = 0
        reasoning = f"Base DC: {base_dc}"
        
        # Room-specific adjustments
        if "tavern" in room_tags:
            if intent_id in ["talk", "trade"]:
                dc_modifier -= 2  # Easier to talk/trade in tavern
                reasoning += " | Tavern bonus: -2"
        elif "dungeon" in room_tags:
            if intent_id in ["attack", "force"]:
                dc_modifier += 1  # Harder to fight in dungeon
                reasoning += " | Dungeon penalty: +1"
        
        final_dc = max(1, base_dc + dc_modifier)
        return final_dc, reasoning
    
    def _calculate_travel_fatigue(self, game_state: GameState) -> int:
        """
        Calculate travel fatigue penalty based on stamina and constitution.
        
        Args:
            game_state: Current game state
            
        Returns:
            Fatigue penalty to apply to rolls
        """
        constitution = game_state.player.attributes.get("constitution", 10)
        travel_stamina = game_state.travel_stamina
        turns_since_rest = game_state.world_time - game_state.last_rest_turn
        
        # Base fatigue calculation
        fatigue_penalty = 0
        
        # Constitution modifier (higher CON = less fatigue)
        con_mod = (constitution - 10) // 2
        
        # Stamina penalty (low stamina = more fatigue)
        if travel_stamina < 30:
            fatigue_penalty += 2  # Severe fatigue
        elif travel_stamina < 60:
            fatigue_penalty += 1  # Moderate fatigue
        
        # Time since rest penalty
        if turns_since_rest > 20:  # More than 2 days without rest
            fatigue_penalty += 1
        
        # Constitution bonus (higher CON reduces fatigue)
        fatigue_penalty = max(0, fatigue_penalty - con_mod)
        
        return fatigue_penalty
    
    def calculate_travel_encounter_chance(
        self, distance: int, game_state: GameState, terrain_tags: List[str]
    ) -> float:
        """
        Calculate chance of random encounter during travel.
        
        Args:
            distance: Distance being traveled
            game_state: Current game state
            terrain_tags: Terrain tags affecting encounter chance
            
        Returns:
            Probability of encounter (0.0 to 1.0)
        """
        base_chance = 0.1  # 10% base chance per unit distance
        
        # Distance modifier
        distance_modifier = distance * 0.05  # 5% additional chance per unit distance
        
        # Terrain modifiers
        terrain_modifier = 0.0
        if "dangerous" in terrain_tags:
            terrain_modifier += 0.2  # Dangerous terrain increases encounters
        elif "safe" in terrain_tags:
            terrain_modifier -= 0.1  # Safe terrain reduces encounters
        elif "wild" in terrain_tags:
            terrain_modifier += 0.15  # Wild terrain increases encounters
        
        # Time of day modifier (if we had time tracking)
        # For now, assume neutral
        
        total_chance = base_chance + distance_modifier + terrain_modifier
        
        # Cap at reasonable bounds
        return max(0.05, min(0.8, total_chance))  # 5% to 80% chance
    
    def calculate_travel_time(
        self, distance: int, terrain_tags: List[str], player_stats: Dict[str, int]
    ) -> int:
        """
        Calculate travel time in turns based on distance and terrain.
        
        Args:
            distance: Distance to travel
            terrain_tags: Terrain tags affecting travel speed
            player_stats: Player attributes
            
        Returns:
            Travel time in turns
        """
        base_time = distance  # 1 turn per unit distance
        
        # Terrain modifiers
        terrain_modifier = 1.0
        if "difficult" in terrain_tags:
            terrain_modifier = 1.5  # Difficult terrain takes 50% longer
        elif "easy" in terrain_tags:
            terrain_modifier = 0.8  # Easy terrain is 20% faster
        elif "mountain" in terrain_tags:
            terrain_modifier = 2.0  # Mountains take twice as long
        
        # Attribute modifiers
        dexterity = player_stats.get("dexterity", 10)
        constitution = player_stats.get("constitution", 10)
        
        # High dexterity reduces travel time
        dex_mod = (dexterity - 10) // 2
        if dex_mod > 0:
            terrain_modifier *= (1.0 - dex_mod * 0.05)  # 5% faster per positive DEX mod
        
        # High constitution increases endurance (reduces rest needs)
        con_mod = (constitution - 10) // 2
        if con_mod > 0:
            terrain_modifier *= (1.0 - con_mod * 0.03)  # 3% faster per positive CON mod
        
        travel_time = int(base_time * terrain_modifier)
        return max(1, travel_time)  # Minimum 1 turn
    
    def _calculate_difficulty_class(self, intent_id: str, room_tags: List[str]) -> Tuple[int, str]:
        """Calculate DC using deterministic table lookup."""
        intent = intent_id.lower()
        
        # Base DC from table
        base_dc = DC_TABLE.get(intent, DC_TABLE["default"])
        reasons = [f"Base DC {base_dc}"]
        
        # Apply tag modifiers
        modifiers = DC_TABLE.get("modifiers", {})
        tag_delta = 0
        
        for tag in room_tags:
            norm_tag = tag.lower().replace(" ", "_")
            if norm_tag in modifiers and intent in modifiers[norm_tag]:
                mod = modifiers[norm_tag][intent]
                tag_delta += mod
                reasons.append(f"{tag.title()} ({mod:+d})")
        
        final_dc = base_dc + tag_delta
        return final_dc, ", ".join(reasons)
    
    def _determine_advantage(
        self, 
        intent_id: str, 
        game_state: GameState, 
        room_tags: List[str], 
        target_npc: Optional[str]
    ) -> Optional[str]:
        """
        Determine if action has advantage or disadvantage based on state.
        
        This is the "Wit & Grit" system - mathematical enforcement of state consequences.
        """
        intent = intent_id.lower()
        
        # Check for disadvantage conditions
        disadvantage_conditions = []
        
        # Wanted state gives disadvantage on social actions
        if game_state.reputation.get("law", 0) <= -10:
            if intent in ["charm", "persuade", "social"]:
                disadvantage_conditions.append("Wanted status")
        
        # Hostile NPCs give disadvantage on social actions
        if target_npc:
            room = game_state.rooms.get(game_state.current_room)
            if room:
                for npc in room.npcs:
                    if npc.name.lower() == target_npc.lower() and npc.state == "hostile":
                        if intent in ["charm", "persuade", "social"]:
                            disadvantage_conditions.append(f"Hostile {target_npc}")
        
        # Environmental disadvantages
        if "dimly_lit" in room_tags and intent in ["investigate", "search", "perception"]:
            disadvantage_conditions.append("Dim lighting")
        
        if "sticky floors" in room_tags and intent in ["finesse", "stealth", "acrobatics"]:
            disadvantage_conditions.append("Sticky floors")
        
        # Check for advantage conditions
        advantage_conditions = []
        
        # Good reputation gives advantage on social actions
        if game_state.reputation.get("law", 0) >= 10:
            if intent in ["charm", "persuade", "social"]:
                advantage_conditions.append("Good reputation")
        
        # Charmed NPCs give advantage on social actions
        if target_npc:
            room = game_state.rooms.get(game_state.current_room)
            if room:
                for npc in room.npcs:
                    if npc.name.lower() == target_npc.lower() and npc.state == "charmed":
                        if intent in ["charm", "persuade", "social"]:
                            advantage_conditions.append(f"Charmed {target_npc}")
        
        # Environmental advantages
        if "dimly_lit" in room_tags and intent in ["stealth", "hide"]:
            advantage_conditions.append("Dim lighting")
        
        # Determine final result
        if disadvantage_conditions and advantage_conditions:
            # They cancel out
            logger.debug(f"Advantage and disadvantage cancel: {advantage_conditions} vs {disadvantage_conditions}")
            return None
        elif disadvantage_conditions:
            logger.debug(f"Disadvantage applied: {', '.join(disadvantage_conditions)}")
            return "disadvantage"
        elif advantage_conditions:
            logger.debug(f"Advantage applied: {', '.join(advantage_conditions)}")
            return "advantage"
        
        return None
    
    def _get_attribute_bonus(self, intent_id: str, attributes: Dict[str, int]) -> Tuple[int, str]:
        """Map intent to primary attribute and return bonus."""
        intent = intent_id.lower()
        
        mapping = {
            "force": "strength",
            "combat": "strength",
            "athletics": "strength",
            
            "finesse": "dexterity", 
            "stealth": "dexterity",
            "acrobatics": "dexterity",
            "leave_area": "dexterity",
            
            "investigate": "intelligence",
            "search": "intelligence",
            "perception": "wisdom",  # Perception uses wisdom
            
            "charm": "charisma",
            "persuade": "charisma",
            "social": "charisma",
            "distract": "charisma"
        }
        
        attr_name = mapping.get(intent, "luck")
        bonus = attributes.get(attr_name, 0)
        
        return bonus, attr_name
    
    def _calculate_item_bonus(self, intent_id: str, inventory) -> int:
        """Calculate total bonus from relevant items."""
        # Get target stat for this intent
        _, target_stat = self._get_attribute_bonus(intent_id, {})
        
        total_bonus = 0
        for item in inventory:
            if hasattr(item, 'target_stat') and item.target_stat == target_stat:
                total_bonus += getattr(item, 'modifier_value', 0)
        
        return total_bonus
    
    def _calculate_hp_delta(self, success: bool, total_score: int, dc: int) -> int:
        """Calculate HP change based on success/failure margin."""
        if success:
            return 0  # No healing on success unless specifically intended
        
        # Failure damage based on margin of failure
        margin = dc - total_score
        if margin >= 10:  # Critical failure
            return -random.randint(8, 15)
        elif margin >= 5:  # Bad failure
            return -random.randint(3, 8)
        else:  # Near miss
            return -random.randint(1, 3)
    
    def _calculate_reputation_changes(
        self, 
        intent_id: str, 
        success: bool, 
        target_npc: Optional[str]
    ) -> Dict[str, int]:
        """Calculate global reputation deltas."""
        deltas = {}
        intent = intent_id.lower()
        
        # Combat actions hurt law reputation
        if intent in ["combat", "force"]:
            deltas["law"] = -3 if success else -1
            
        # Social actions can help
        if intent in ["charm", "persuade"] and success:
            deltas["law"] = 1
            
        # Criminal actions affect underworld
        if intent in ["stealth", "finesse"] and success:
            deltas["underworld"] = 1
            
        return deltas
    
    def _calculate_relationship_changes(
        self,
        intent_id: str,
        success: bool,
        target_npc: Optional[str]
    ) -> Dict[str, Dict]:
        """Calculate NPC relationship disposition and tag changes."""
        if not target_npc:
            return {}
        
        changes = {}
        intent = intent_id.lower()
        
        # Initialize changes for target
        changes[target_npc] = {
            "disposition": 0,
            "tags": []
        }
        
        # Combat makes people hostile
        if intent in ["combat", "force"]:
            changes[target_npc]["disposition"] = -15 if success else -5
            if success:
                changes[target_npc]["tags"].append("hurt")
        
        # Social actions improve disposition
        elif intent in ["charm", "persuade"]:
            if success:
                changes[target_npc]["disposition"] = 10
                changes[target_npc]["tags"].append("friendly")
        
        # Stealth doesn't directly affect relationships unless caught
        elif intent == "stealth" and not success:
            changes[target_npc]["disposition"] = -5
            changes[target_npc]["tags"].append("suspicious")
        
        return changes
    
    def _calculate_npc_state_changes(
        self,
        intent_id: str,
        success: bool,
        target_npc: Optional[str],
        game_state: GameState
    ) -> Dict[str, str]:
        """Calculate NPC state transitions."""
        if not target_npc:
            return {}
        
        changes = {}
        intent = intent_id.lower()
        
        # Get current NPC state
        current_room = game_state.rooms.get(game_state.current_room)
        current_state = "neutral"
        
        if current_room:
            for npc in current_room.npcs:
                if npc.name.lower() == target_npc.lower():
                    current_state = npc.state
                    break
        
        # Determine new state
        new_state = current_state
        
        if intent in ["combat", "force"] and success:
            new_state = "hostile"
        elif intent == "charm" and success:
            new_state = "charmed"
        elif intent == "distract" and success:
            new_state = "distracted"
        elif intent in ["combat", "force"] and not success and current_state == "neutral":
            new_state = "hostile"  # Failed aggression still makes them hostile
        
        if new_state != current_state:
            changes[target_npc] = new_state
        
        return changes
    
    def _check_goal_completion(
        self,
        intent_id: str,
        success: bool,
        game_state: GameState,
        player_input: str
    ) -> List[str]:
        """Check if any goals are completed by this action."""
        completed = []
        
        if not success:
            return completed
        
        current_room = game_state.rooms.get(game_state.current_room)
        
        for goal in game_state.goal_stack:
            # Skip already completed goals
            if goal.status != "active":
                continue
            
            # Check intent-based completion
            if goal.required_intent == intent_id:
                # Check target tags if specified
                if goal.target_tags:
                    target_hit = any(
                        tag.lower() in player_input.lower() 
                        for tag in goal.target_tags
                    )
                    if target_hit:
                        completed.append(goal.id)
                else:
                    completed.append(goal.id)
                continue
            
            # Check state-based completion
            if goal.target_npc_state and current_room:
                for npc in current_room.npcs:
                    if npc.state == goal.target_npc_state:
                        # Check if this NPC is a target
                        if not goal.target_tags or any(
                            tag.lower() in npc.name.lower() 
                            for tag in goal.target_tags
                        ):
                            completed.append(goal.id)
                            break
        
        return completed
    
    def _calculate_faction_modifier(self, intent_id: str, game_state: GameState) -> int:
        """
        Calculate faction-based modifiers for actions.
        
        Args:
            intent_id: Type of action being performed
            game_state: Current game state
            
        Returns:
            Faction modifier (negative for disadvantages)
        """
        if not self.faction_system:
            return 0
        
        # Get faction at current location
        current_faction = self.faction_system.get_faction_at_coordinate(game_state.position)
        
        if not current_faction:
            return 0
        
        # Check if this is a social action
        social_intents = ["talk", "persuade", "intimidate", "deceive", "bargain", "flirt"]
        
        if intent_id in social_intents:
            # Check player's reputation with this faction
            player_reputation = game_state.reputation.get(current_faction.id, 0)
            
            # Apply disadvantage for hostile factions
            if player_reputation < -20:
                logger.info(f"Applying faction disadvantage: {current_faction.name} is hostile (reputation: {player_reputation})")
                return -5  # Disadvantage equivalent
            elif player_reputation < -10:
                logger.info(f"Applying faction penalty: {current_faction.name} is unfriendly (reputation: {player_reputation})")
                return -2  # Minor penalty
        
        return 0


# Export for use by the engine
__all__ = ["D20Resolver", "D20Result"]
