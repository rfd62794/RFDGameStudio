"""
Narrator: LLM Interface

The only module that uses the LLM (Chronicler).
Translates deterministic D20 results into cinematic narrative.

Responsibility: Creative storytelling only - no game logic.
"""

import asyncio
from typing import Dict, Any, AsyncGenerator

from loguru import logger
from sync_engines import ChroniclerEngine

from d20_core import D20Result


class Narrator:
    """
    Creative narrative engine - the only module that touches LLMs.
    
    Takes pure game results and weaves them into compelling stories.
    """
    
    def __init__(self, model_name: str = 'ollama:llama3.2:1b', tone: str = 'humorous'):
        """Initialize the narrative engine."""
        self.chronicler = ChroniclerEngine(model_name=model_name, tone=tone)
        logger.info(f"Narrator initialized with {model_name} (tone: {tone})")
    
    async def narrate_stream(
        self,
        player_input: str,
        intent_id: str,
        d20_result: D20Result,
        context: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming narrative from game results.
        
        Args:
            player_input: Original player action
            intent_id: Resolved intent
            d20_result: Pure game mechanics result
            context: Current game context
            
        Yields:
            Narrative tokens for streaming display
        """
        # Build arbiter-style result for Chronicler compatibility
        arbiter_result = {
            'success': d20_result.success,
            'hp_delta': d20_result.hp_delta,
            'gold_delta': 0,  # Not handled in D20 core yet
            'new_npc_state': list(d20_result.npc_state_changes.values())[0] if d20_result.npc_state_changes else None,
            'reasoning': d20_result.narrative_context,
            'narrative_seed': self._generate_narrative_seed(intent_id, d20_result)
        }
        
        # Stream from chronicler
        async for token in self.chronicler.narrate_stream(
            player_input=player_input,
            intent_id=intent_id,
            arbiter_result=arbiter_result,
            context=context
        ):
            yield token
    
    def _generate_narrative_seed(self, intent_id: str, d20_result: D20Result) -> str:
        """Generate narrative seed based on intent and result."""
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
        
        base_seed = seeds.get(intent_id.lower(), "A standard attempt.")
        
        # Add success/failure context
        if d20_result.success:
            if d20_result.roll >= 19:
                base_seed += " | Masterful execution!"
            elif d20_result.roll >= 15:
                base_seed += " | Well executed."
            else:
                base_seed += " | Barely succeeds."
        else:
            if d20_result.roll <= 2:
                base_seed += " | Catastrophic failure!"
            elif d20_result.roll <= 10:
                base_seed += " | Struggles and fails."
            else:
                base_seed += " | Close attempt, but fails."
        
        # Add special conditions
        if d20_result.npc_state_changes:
            base_seed += " | NPC state changed."
        
        if d20_result.goals_completed:
            base_seed += " | Objective achieved!"
        
        return base_seed
    
    async def narrate_simple(self, player_input: str, intent_id: str, d20_result: D20Result, context: str) -> str:
        """
        Generate complete narrative (non-streaming).
        
        Returns:
            Complete narrative text
        """
        narrative_tokens = []
        async for token in self.narrate_stream(player_input, intent_id, d20_result, context):
            narrative_tokens.append(token)
        
        return "".join(narrative_tokens)


# Export for use by engine
__all__ = ["Narrator"]
