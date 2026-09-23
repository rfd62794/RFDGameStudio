"""
Chronicler Engine: Pure Narrative Generation

The Chronicler is responsible for ONLY writing D&D-style prose.
No mechanics - just vivid storytelling based on what the Arbiter calculated.
"""

import os
import asyncio

from loguru import logger
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from model_factory import get_model



class ChroniclerProse(BaseModel):
    """D&D-style narrative prose."""
    
    narrative: str = Field(
        description="DM-style narration of what happened (2-3 sentences, vivid and flavorful)"
    )


class ChroniclerEngine:
    """
    The Narrative Chronicler: Writes D&D prose from Arbiter results.
    
    Design:
    - Uses larger, creative model (llama3.2:3b)
    - Prompt focuses ONLY on storytelling
    - Receives Arbiter's state changes as input
    """
    
    def __init__(
        self,
        model_name: str = 'ollama:llama3.2:latest',
        tone: str = "humorous"
    ):
        """
        Initialize chronicler engine.
        
        Args:
            model_name: Larger Ollama model for creative prose
            tone: Narrative style (humorous, serious, gritty)
        """
        # Set Ollama base URL
        if 'OLLAMA_BASE_URL' not in os.environ:
            os.environ['OLLAMA_BASE_URL'] = 'http://localhost:11434'
            
        # Use factory to get shared model connection
        # High temperature for creativity
        model = get_model(model_name, temperature=0.8)
        
        self.tone = tone
        system_prompt = self._build_chronicler_prompt(tone)
        
        logger.info(f"Initializing Chronicler with {model_name}")
        
        self.agent = Agent(
            model=model,
            output_type=ChroniclerProse,
            system_prompt=system_prompt
        )
    
    def _build_chronicler_prompt(self, tone: str) -> str:
        """
        Build the system prompt for the narrative engine.
        Optimized for dark-fantasy "Movie Mode".
        """
        return (
            "You are a dark-fantasy narrator (The Chronicler).\n"
            "TASK: Write 2-3 vivid sentences describing the player's action result.\n"
            "DIRECTIVE:\n"
            "- Use the 'Narrative Seed' (e.g., 'A display of raw power') as the emotional core.\n"
            "- Ground the scene by mentioning 1-2 Environment Tags (e.g., Sticky Floors, Dimly Lit).\n"
            "- If the result is SUCCESS, make it feel heroic or rewarding.\n"
            "- If the result is FAILURE, describe the clumsy or tragic outcome.\n"
            "- Be punchy. No generic summaries.\n\n"
            "INPUT STRUCTURE:\n"
            "- Action: [Player input]\n"
            "- Result: [Success/Failure]\n"
            "- NPC State: [New condition]\n"
            "- Environment: [Tags]\n"
            "- Seed: [Atmospheric hook]\n\n"
            "Example Style:\n"
            "'The guard recoils as you slam your fist against the grain of the rough-hewn table. Beneath the dimly lit lanterns, your boots slide across the sticky floors as you stand tall over the cowed man. The path ahead is now clear through the tavern smoke.'"
        )
    
    async def narrate_outcome(
        self,
        player_input: str,
        intent_id: str,
        arbiter_result: dict,
        context: str
    ) -> ChroniclerProse:
        """
        Generate narrative prose from Arbiter results.
        
        Args:
            player_input: Original player text
            intent_id: Resolved intent
            arbiter_result: Dictionary with success, hp_delta, npc_state, etc.
            context: Room description and NPC states
        
        Returns:
            ChroniclerProse with vivid D&D narration
        """
        prompt = (
            f"Context: {context}\n\n"
            f"Player Action: \"{player_input}\"\n"
            f"Intent: {intent_id}\n\n"
            f"Arbiter Result:\n"
            f"- Success: {arbiter_result.get('success')}\n"
            f"- HP Change: {arbiter_result.get('hp_delta', 0)}\n"
            f"- Gold Change: {arbiter_result.get('gold_delta', 0)}\n"
            f"- NPC State: {arbiter_result.get('new_npc_state')}\n"
            f"- Reasoning: {arbiter_result.get('reasoning')}\n"
            f"- Narrative Seed: {arbiter_result.get('narrative_seed', 'N/A')}\n\n"
            f"Write vivid D&D narration using the context and narrative seed:\n"
        )
        
        logger.debug(f"Chronicler narrating: {intent_id}")
        
        try:
            result = await self.agent.run(prompt)
            prose = result.data
            
            logger.info(f"Chronicler generated: {prose.narrative[:50]}...")
            return prose
            
            
        except Exception as e:
            logger.error(f"Chronicler failed: {e}")
            
            # Fallback narrative
            return self._fallback_prose(player_input, arbiter_result)

    async def narrate_stream(
        self,
        player_input: str,
        intent_id: str,
        arbiter_result: dict,
        context: str
    ) -> AsyncGenerator[str, None]:
        """
        Generate narrative stream for an action.
        
        Args:
            player_input: The player's action input
            intent_id: The resolved intent ID
            arbiter_result: Result from the arbiter
            context: Current game context
            
        Yields:
            Narrative text chunks
        """
        # Check for interior context injection
        enhanced_context = self._enhance_context_with_interior(context)
        
        prompt = (
            f"Context: {enhanced_context}\n\n"
            f"Player Action: \"{player_input}\"\n"
            f"Intent: {intent_id}\n\n"
            f"Arbiter Result:\n"
            f"- Success: {arbiter_result.get('success')}\n"
            f"- HP Change: {arbiter_result.get('hp_delta', 0)}\n"
            f"- Gold Change: {arbiter_result.get('gold_delta', 0)}\n"
            f"- NPC State: {arbiter_result.get('new_npc_state')}\n"
            f"- Reasoning: {arbiter_result.get('reasoning')}\n"
            f"- Narrative Seed: {arbiter_result.get('narrative_seed', 'N/A')}\n\n"
            f"Write vivid D&D narration using the context and narrative seed:\n"
        )
        
        logger.debug(f"Chronicler streaming: {intent_id}")
        
        try:
            # We use text streaming directly with increased retries for interior scenes
            max_retries = 3 if "interior" in enhanced_context.lower() else 1
            retry_count = 0
            
            while retry_count < max_retries:
                try:
                    async with self.agent.run_stream(prompt) as result:
                        async for message in result.stream_text():
                            yield message
                    break  # Success, exit retry loop
                except Exception as e:
                    retry_count += 1
                    if retry_count >= max_retries:
                        logger.error(f"Chronicler stream failed after {max_retries} retries: {e}")
                        raise
                    else:
                        logger.warning(f"Chronicler stream retry {retry_count}/{max_retries}")
                        await asyncio.sleep(0.5)  # Brief pause before retry
                    
        except Exception as e:
            logger.error(f"Chronicler stream failed: {e}")
            
            # Safe narrative fallback with location information
            yield f"You attempt {player_input}."
            if arbiter_result.get('success'):
                yield " It succeeds."
                
                # Add location context if available
                if "📍 Location:" in enhanced_context:
                    # Extract location from context
                    location_line = [line for line in enhanced_context.split('\n') if '📍 Location:' in line]
                    if location_line:
                        location_name = location_line[0].replace('📍 Location:', '').strip()
                        yield f" 📍 {location_name}"
                    else:
                        yield " 📍 Unknown Location"
                else:
                    yield " 📍 Unknown Location"
            else:
                yield " It fails."
    
    def _enhance_context_with_interior(self, context: str) -> str:
        """Enhance context with interior information if available."""
        # This would be enhanced to check for interior context injection
        # For now, return the original context
        return context
    
    def _fallback_prose(self, player_input: str, arbiter_result: dict) -> ChroniclerProse:
        """Fallback narrative if LLM fails."""
        logger.warning("Using fallback chronicler prose")
        
        success = arbiter_result.get('success', False)
        
        if success:
            narrative = f"You attempt {player_input}. {arbiter_result.get('reasoning', 'The action succeeds')}."
        else:
            narrative = f"You attempt {player_input}, but the action fails."
        
        return ChroniclerProse(narrative=narrative)
