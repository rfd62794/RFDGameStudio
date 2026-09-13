"""
Deterministic Arbiter: Rule-based Logic Core (Iron Frame)

Replaces ArbiterEngine (LLM) with hardcoded rules.
- Maps intents & tags to difficulty modifiers.
- Manages NPC state transitions.
- Provides static narrative seeds for the Chronicler.
"""

from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field
from quartermaster import DC_TABLE
from loguru import logger

class ArbiterLogic(BaseModel):
    """Contextual evaluation (Deterministic version)."""
    
    difficulty_mod: int = Field(default=0)
    internal_logic: str = Field(description="Step-by-step reasoning (Hardcoded)")
    target_npc: str | None = None
    new_npc_state: Literal["neutral", "hostile", "distracted", "charmed", "dead"] = "neutral"
    reasoning: str = Field(description="Brief tactical reason")
    narrative_seed: str = Field(default="")
    reputation_deltas: dict[str, int] = Field(default_factory=dict)
    rep_delta: int = Field(default=0) # Change in disposition for target_npc
    rep_tags: List[str] = Field(default_factory=list) # New tags for target_npc relationship

ArbiterLogic.model_rebuild()

class DeterministicArbiter:
    """
    Standardizes game logic into a predictable rule-based system.
    Eliminates VRAM usage for the logic layer.
    """
    
    def __init__(self):
        logger.info("Deterministic Arbiter (Iron Frame) initialized.")

    def resolve_action(
        self,
        intent_id: str,
        player_input: str,
        context: str, # Mostly for logging/compat
        room_tags: List[str],
        reputation: dict | None = None,
        player_hp: int = 100
    ) -> ArbiterLogic:
        """
        Evaluate difficulty mod and NPC state using DC_TABLE and rules.
        """
        intent = intent_id.lower()
        reputation = reputation or {}
        
        # 0. Death Guard: If dead, most actions fail
        if player_hp <= 0:
            return ArbiterLogic(
                difficulty_mod=100, # Impossible
                internal_logic="Player is dead. No actions possible.",
                reasoning="You are a ghost. Your actions have no weight.",
                narrative_seed="A hollow, spectral effort.",
                new_npc_state="neutral"
            )
        
        # 1. Calculate Difficulty Mod based on Room Tags
        # This mirrors the logic in Quartermaster but provides the 'Arbiter' half
        difficulty_mod = 0
        reasons = []
        
        modifiers = DC_TABLE.get("modifiers", {})
        for tag in room_tags:
            norm_tag = tag.lower().replace(" ", "_")
            if norm_tag in modifiers:
                tag_mods = modifiers[norm_tag]
                if intent in tag_mods:
                    mod = tag_mods[intent]
                    # Arbiter mod is the INVERSE of DC mod in terms of "difficulty"
                    # If tag makes DC +5, difficulty_mod is +5.
                    difficulty_mod += mod
                    reasons.append(f"{tag.title()} impact: {mod:+d}")

        # 2. State & Reputation Rules
        new_npc_state = "neutral"
        reputation_deltas = {}
        rep_delta = 0
        rep_tags = []
        target_npc = None
        
        # Detect target NPC from input (naive check)
        if "guard" in player_input.lower():
            target_npc = "Guard"
        elif "bartender" in player_input.lower():
            target_npc = "Bartender"
        
        if reputation.get("law", 0) <= -10:
            if "Wanted" not in room_tags:
                room_tags.append("Wanted")
                difficulty_mod += 5
                reasons.append("Guards are on high alert (Wanted)")
        if "hostile" in context.lower():
            new_npc_state = "hostile"
            
        # PROACTIVE: Check if path is ALREADY clear from context
        # (e.g. Guard is already charmed/dead from previous turns)
        is_path_clear = "charmed" in context.lower() or "dead" in context.lower()

        # INTENT REFINING: If resolver chose "charm" but input is violent, override to "force"
        violent_words = ["kick", "kill", "smash", "scare", "threat", "intimidate"]
        if intent == "charm" and any(w in player_input.lower() for w in violent_words):
            intent = "force"
            difficulty_mod += 2

        if intent == "combat":
            new_npc_state = "hostile"
            difficulty_mod += 2 # Combat is inherently tense
            reputation_deltas["law"] = -5
            rep_delta = -20
            rep_tags = ["hurt"]
        elif intent == "distract":
            new_npc_state = "distracted"
        elif intent == "charm":
            # If they are already hostile, charm is harder
            if new_npc_state == "hostile":
                difficulty_mod += 5
            new_npc_state = "charmed"
            is_path_clear = True # Immediate clearing
            reputation_deltas["law"] = 2
            rep_delta = 10
            rep_tags = ["charmed"]
        elif intent == "finesse":
             # Finesse or social actions usually help reputation with law if positive
             reputation_deltas["law"] = 1
             rep_delta = 5
        elif intent == "force":
             # If we tried to force a guard, we assume it's combat-like
             if "guard" in player_input.lower():
                new_npc_state = "hostile"
                reputation_deltas["law"] = -3
                rep_delta = -10
             else:
                rep_delta = -5
             
        # 3. Build Logic Trace
        internal_logic = f"Deterministic Logic: Intent '{intent}' (refined from '{intent_id}') evaluated against tags {room_tags}. "
        if reasons:
            internal_logic += " | ".join(reasons)
        else:
            internal_logic += "Standard environmental conditions."
            
        reasoning = f"Calculated base resolution for {intent}."

        # 4. Narrative Seed (Static hints for Chronicler)
        seeds = {
            "force": "A display of raw power.",
            "combat": "The air crackles with aggression.",
            "finesse": "A delicate, precise movement.",
            "investigate": "A keen eye for detail.",
            "charm": "A silver-tongued approach.",
            "stealth": "A shadow in the corner.",
            "distract": "A clever diversion.",
            "leave_area": "A swift departure."
        }
        seed = seeds.get(intent, "A standard attempt.")

        # 4b. Deterministic Exit Condition (The "Movie" Transition)
        if is_path_clear or new_npc_state in ["charmed", "dead"]:
            seed += " | Path Clear."
            internal_logic += " | Transition Trigger: Path is now clear."

        return ArbiterLogic(
            difficulty_mod=difficulty_mod,
            internal_logic=internal_logic,
            target_npc=target_npc,
            new_npc_state=new_npc_state, # type: ignore
            reasoning=reasoning,
            narrative_seed=seed,
            reputation_deltas=reputation_deltas,
            rep_delta=rep_delta,
            rep_tags=rep_tags
        )

    def apply_social_consequences(self, state, arbiter_logic: ArbiterLogic, success: bool):
        """
        Apply reputation and social graph changes based on resolution outcome.
        This centralizes 'consequence memory' logic for ADR-010.
        """
        # 1. Update Global Reputation
        for faction, delta in arbiter_logic.reputation_deltas.items():
            state.reputation[faction] = state.reputation.get(faction, 0) + delta
            
        # 2. Update Local NPC Relationships (Social Graph)
        if arbiter_logic.target_npc:
            # Update disposition and relationship tags
            state.update_relationship(
                state.current_room,
                arbiter_logic.target_npc,
                delta_disposition=arbiter_logic.rep_delta,
                new_tags=arbiter_logic.rep_tags
            )
            
            # Update physical NPC state in the current room
            if state.current_room in state.rooms:
                room = state.rooms[state.current_room]
                for npc in room.npcs:
                    if npc.name.lower() == arbiter_logic.target_npc.lower():
                        npc.update_state(arbiter_logic.new_npc_state)
                        break
            
        logger.info(f"Social consequences applied for {arbiter_logic.target_npc} (success={success})")

    def resolve_action_sync(self, *args, **kwargs) -> ArbiterLogic:
        """Sync compat wrapper."""
        return self.resolve_action(*args, **kwargs)
