"""
Arbiter Engine: Pure Logic and State Resolution

The Arbiter is responsible for CONTEXTUAL EVALUATION.
It decides "How hard is this?" based on the narrative situation.
It does NOT calculate damage or success/failure anymore (Quartermaster does that).
"""

import os
from typing import Literal

from loguru import logger
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from model_factory import get_model



class ArbiterLogic(BaseModel):
    """Contextual evaluation from the Arbiter."""
    
    difficulty_mod: int = Field(
        default=0,
        ge=-10,
        le=10,
        description="Difficulty modifier based on context (-10=Very Easy, 0=Standard, +10=Impossible)"
    )

    internal_logic: str = Field(
        description="Step-by-step reasoning for the DC and vibe (Hidden Chain-of-Thought)"
    )
    
    target_npc_id: str | None = Field(
        default=None,
        description="ID of NPC affected by this action (if any)"
    )
    
    new_npc_state: Literal["neutral", "hostile", "distracted", "charmed", "dead"] = Field(
        default="neutral",
        description="New state of the target NPC (if applicable)"
    )
    
    reasoning: str = Field(
        description="Brief tactical reason for the assessment (1 sentence)"
    )
    
    narrative_seed: str = Field(
        default="",
        description="Contextual 'vibe' for the Chronicler (e.g., 'The guard is helpful but tired', 'The bartender eyes you suspiciously')"
    )


class ArbiterEngine:
    """
    The Logic Arbiter: Evaluates context and intent.
    
    Design:
    - Uses small, fast model (phi3:mini or llama3.2:1b)
    - Prompt focuses ONLY on difficulty assessment
    - No math - that's for the Quartermaster
    """
    
    def __init__(
        self,
        model_name: str = 'ollama:llama3.2:1b'
    ):
        """
        Initialize arbiter engine.
        
        Args:
            model_name: Small, fast Ollama model for logic
        """
        # Set Ollama base URL
        if 'OLLAMA_BASE_URL' not in os.environ:
            os.environ['OLLAMA_BASE_URL'] = 'http://localhost:11434'
        
        # Use factory to get shared model connection
        model = get_model(model_name)
        
        system_prompt = self._build_arbiter_prompt()
        
        logger.info(f"Initializing Arbiter with {model_name}")
        
        self.agent = Agent(
            model=model,
            output_type=ArbiterLogic,
            system_prompt=system_prompt
        )
    
    def _build_arbiter_prompt(self) -> str:
        """Construct focused prompt for logic resolution."""
        return (
            "You are the ARBITER: a game logic engine for a D&D-style RPG.\n\n"
            "Your ONLY job is to assess the DIFFICULTY of valid actions.\n"
            "DO NOT calculate damage or dice rolls.\n\n"
            "Rules:\n"
            "- Analyze the player's intent and context\n"
            "- Assign a `difficulty_mod` (-10 to +10):\n"
            "  - -5: Very Easy (e.g. walking, looking)\n"
            "  - 0: Standard (e.g. attacking, average skill check)\n"
            "  - +5: Hard (e.g. climbing slippery wall, charming hostile guard)\n"
            "  - +10: Impossible (e.g. flying without wings)\n"
            "- Determine NPC state changes (if applicable)\n"
            "- Provide a `narrative_seed` (1 phrase describing the vibe/mood)\n"
            "- IGNORE numerical stats like HP/Gold (Quartermaster handles them)\n"
            "- RESPECT relationship tags (e.g. 'ally' = easier check)\n\n"
            "Process:\n"
            "1. Write `internal_logic`: Analyze the situation step-by-step.\n"
            "2. Decide `difficulty_mod` based on logic.\n"
            "3. Set `narrative_seed` and other fields.\n\n"
            "Examples:\n"
            "- Action: 'I sneak past the guard' (Tag: Dimly Lit) -> Mod: -2 (Easier due to darkness)\n"
            "- Action: 'I attack the dragon' -> Mod: +5 (Hard target)\n"
            "- Action: 'I buy a drink' -> Mod: -10 (Trivial)\n\n"
        )
    
    async def resolve_action(
        self,
        intent_id: str,
        player_input: str,
        context: str,
        player_hp: int = 100,
        player_gold: int = 0
    ) -> ArbiterLogic:
        """
        Evaluate action difficulty and context.
        
        Args:
            intent_id: Resolved intent (e.g., 'distract', 'charm')
            player_input: Original player text
            context: Room description and NPC states
            player_hp: Current player HP
            player_gold: Current player gold
        
        Returns:
            ArbiterLogic with difficulty modifier
        """
        prompt = (
            f"Context: {context}\n\n"
            f"Player Stats: HP={player_hp}, Gold={player_gold}\n\n"
            f"Player Action: \"{player_input}\"\n"
            f"Resolved Intent: {intent_id}\n\n"
            f"Assess the difficulty (mod) and narrative context:"
        )
        
        logger.debug(f"Arbiter assessing intent '{intent_id}'")
        
        try:
            result = await self.agent.run(prompt)
            logic = result.data
            
            logger.info(
                f"Arbiter: mod={logic.difficulty_mod}, "
                f"npc_state={logic.new_npc_state}"
            )
            return logic
            
        except Exception as e:
            logger.error(f"Arbiter failed: {e}")
            
            # Deterministic fallback
            return self._fallback_logic(intent_id)
    
    def _fallback_logic(self, intent_id: str) -> ArbiterLogic:
        """Deterministic fallback if LLM fails."""
        logger.warning("Using fallback arbiter logic")
        
        fallbacks = {
            "distract": ArbiterLogic(
                difficulty_mod=0,
                new_npc_state="distracted",
                reasoning="Standard distraction attempt",
                internal_logic="Fallback: Distraction is usually standard difficulty."
            ),
            "force": ArbiterLogic(
                difficulty_mod=2, # Combat is slightly harder
                new_npc_state="hostile",
                reasoning="Combat action",
                internal_logic="Fallback: Combat is inherently risky and harder."
            ),
            "charm": ArbiterLogic(
                difficulty_mod=0,
                reasoning="Standard social interaction",
                internal_logic="Fallback: Social interaction is standard."
            ),
            "finesse": ArbiterLogic(
                difficulty_mod=0,
                reasoning="Standard stealth action",
                internal_logic="Fallback: Stealth is standard."
            )
        }
        
        return fallbacks.get(
            intent_id,
            ArbiterLogic(
                difficulty_mod=0, 
                reasoning="Standard action",
                internal_logic="Fallback: Unknown intent, defaulting to standard."
            )
        )
