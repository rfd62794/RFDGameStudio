"""
Voyager Agent: Automated Player for Self-Testing

The fourth Council member that sits at the top of the game loop,
replacing manual input with character-aware decision making.

Design:
- Uses llama3.2:3b for "common sense" navigation
- Personality-driven (Curious, Aggressive, Cautious)
- Sees full scene context and player stats
- Vends natural language action strings
"""

import random
from loguru import logger
from voyager_logic import STANDARD_ACTIONS
from quartermaster import DC_TABLE
from pydantic import BaseModel, Field

class VoyagerDecision(BaseModel):
    """Single action decision from the Voyager."""
    
    selected_action_id: str = Field(description="The ID of the pre-baked action chosen from the menu")
    custom_flair: str = Field(description="A short natural language flavor for the action (e.g., 'I slam my fist on the table')")
    strategic_reasoning: str = Field(description="Why this choice fits the personality and stats")
    internal_monologue: str = Field(description="My current emotional state")
    
    @property
    def action(self) -> str:
        """Compat property for game loop."""
        return self.custom_flair


class VoyagerAgent:
    """
    Deterministic Voyager: Heuristic-based Automated Player.
    
    Replaces LLM decision making with hard logic:
    1. Assess all available actions.
    2. Calculate Odds: (Stat + Bonuses) - (DC + Tag Penalties).
    3. Pick the action with the highest Score.
    4. Add randomness/flavor based on Personality.
    """
    
    def __init__(self, personality: str = "curious", model_name: str = None):
        """
        Initialize deterministic voyager.
        model_name is ignored (kept for compat).
        """
        self.personality = personality.lower()
        self.used_actions = [] # History buffer
        self.turns_in_room = 0
        self.last_room_id = ""
        logger.info(f"Voyager initialized (Deterministic) with '{self.personality}' personality")
    
    async def decide_action(
        self,
        scene_context: str, # Kept for compat, mostly unused now
        player_stats: dict,
        turn_history: list[str] | None = None,
        room_tags: list[str] | None = None,
        goal_stack: list | None = None
    ) -> VoyagerDecision:
        """Decide next action using heuristic scoring."""
        
        # 0. Track Room Resident Time
        # Extract current room from context if possible
        current_room_name = ""
        if "Location: " in scene_context:
            current_room_name = scene_context.split("\n")[0].replace("Location: ", "").strip()
            
        if current_room_name != self.last_room_id:
            self.turns_in_room = 0
            self.last_room_id = current_room_name
        else:
            self.turns_in_room += 1

        # 1. Get Candidate Actions
        options = STANDARD_ACTIONS.get(self.personality, STANDARD_ACTIONS["curious"])
        
        # 2. Score Each Action
        scored_actions = []
        
        attributes = player_stats.get('attributes', {})
        inventory = player_stats.get('inventory', [])
        current_hp = player_stats.get('hp', 100)
        max_hp = player_stats.get('max_hp', 100)
        
        # Safety Override: If HP is low (< 30%), prioritize DEFEND or HEAL
        is_critical = current_hp < (max_hp * 0.3)
        
        for action in options:
            action_id = action['id']
            base_stat = action['stat']
            
            # --- Heuristic Formula ---
            
            # A. Stat Bonus
            stat_val = attributes.get(base_stat, 0)
            
            # B. Item Bonus (Simplistic check)
            item_bonus = 0
            for item in inventory:
                # Assuming Items have 'target_stat' and 'modifier_value'
                # Use getattr safely as inventory items might be objects or dicts
                # In game_loop it looks like objects.
                if hasattr(item, 'target_stat') and item.target_stat == base_stat:
                    item_bonus += item.modifier_value
            
            # C. Difficulty Malus (Base DC + Tag Mods)
            # Use Quartermaster's logic to estimate DC
            # We duplicate explicit logic here or use a simplified lookup
            base_dc = DC_TABLE.get(action_id, 12)
            
            tag_penalty = 0
            if room_tags:
                modifiers = DC_TABLE.get("modifiers", {})
                for tag in room_tags:
                    norm_tag = tag.lower().replace(" ", "_")
                    if norm_tag in modifiers:
                        intent_mods = modifiers[norm_tag]
                        if action_id in intent_mods:
                            tag_penalty += intent_mods[action_id]
            
            estimated_dc = base_dc + tag_penalty
            
            # SCORE = (Stat + Item) - DC
            # Higher is better. 
            # Example: Str +5 vs DC 10 = Score -5 (Wait, no: 15 vs 10 = +5 margin)
            # Probability = (21 + Bonus - DC) / 20 * 100 approx.
            # Let's just use the Margin.
            score = (stat_val + item_bonus) - estimated_dc
            
            # D. History Decay (The "Stutter" Fix)
            # Subtract -15 for each time this specific action ID was used in last 3 turns
            history_penalty = 0
            for used_id in self.used_actions:
                if used_id == action_id:
                    history_penalty += 15
            
            score -= history_penalty
            
            # E. Room Exit Priority & Cooldown
            if action_id == "leave_area":
                # If "Path Clear" is present, heavily prioritize
                if room_tags and "Path Clear" in room_tags:
                    score += 500
                
                # BOREDOM LOGIC: Strongly penalize leaving if we just arrived
                if self.turns_in_room < 5:
                    score -= 1000 # Massive penalty for trying to skip the scene
                    
                # GOAL MALUS: Penalize leaving if there are still active goals in this stack
                if goal_stack and len(goal_stack) > 0:
                    score -= 500 # Don't leave till the work is done
                    
                # RETREAT LOGIC: If HP is low, ignore other penalties and RUN
                current_hp = player_stats.get('hp', 100)
                max_hp = player_stats.get('max_hp', 100)
                if current_hp / max_hp < 0.25:
                    score += 2000 # Emergency retreat override
            
            # F. Goal Alignment (The "Purpose" Fix)
            goal_bonus = 0
            if goal_stack:
                # Prioritize the CURRENT (top) goal
                current_goal = goal_stack[-1]
                
                for goal in goal_stack:
                    is_top_goal = (goal == current_goal)
                    weights = getattr(goal, 'method_weights', {}) if not isinstance(goal, dict) else goal.get('method_weights', {})
                    
                    # Base method bonus with multipliers
                    if action_id in weights:
                        weight = weights[action_id]
                        goal_bonus += (500 * weight) if is_top_goal else (200 * weight)
                    
                    # Hard trigger bonus (required_intent)
                    req_intent = getattr(goal, 'required_intent', None) if not isinstance(goal, dict) else goal.get('required_intent')
                    if req_intent and action_id == req_intent:
                        goal_bonus += 1000 if is_top_goal else 400
            
            # G. Turn-Tier Memory: Action Decay (Prevent loops)
            if turn_history:
                # We normalize action history to intent IDs if possible, or just literal match
                if action_id in turn_history[-3:]:
                    score -= 400

            score += goal_bonus

            scored_actions.append({
                "action": action,
                "score": score,
                "reason": f"Stat({stat_val}) - DC({estimated_dc}) - Hist({history_penalty}) + Goal({goal_bonus})"
            })
            
        # 3. Pick Best Action
        scored_actions.sort(key=lambda x: x['score'], reverse=True)
        
        best = scored_actions[0]
        selected_action = best['action']
        
        # Update history buffer (keep last 3)
        self.used_actions.append(selected_action['id'])
        if len(self.used_actions) > 3:
            self.used_actions.pop(0)
        
        # 4. Generate Output
        # Use EXPLICIT label to ensure Semantic Match
        flair = selected_action['label']
        
        logging_reason = f"Score {best['score']} ({best['reason']})."
        
        logger.info(f"Voyager Heuristic: Selected {selected_action['id']} with score {best['score']}")
        
        return VoyagerDecision(
            selected_action_id=selected_action['id'],
            custom_flair=flair,
            strategic_reasoning=logging_reason,
            internal_monologue=f"Calculating odds... {logging_reason} Looks like my best bet."
        )
