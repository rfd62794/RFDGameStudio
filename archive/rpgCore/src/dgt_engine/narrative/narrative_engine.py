"""
Narrative Engine: LLM-Driven Outcome Generation

Uses Pydantic AI to generate structured outcomes from natural language actions.
Constrains LLM creativity into deterministic state changes.
"""

from typing import Literal

from loguru import logger
from pydantic import BaseModel, Field
from pydantic_ai import Agent


# ============================================================
# COUNCIL OF THREE: Specialized Pydantic Contracts
# ============================================================

class ArbiterLogic(BaseModel):
    """
    The Logic Gate: Pure deterministic state changes.
    
    This agent focuses ONLY on math and game mechanics.
    No narrative flavor - just the numbers.
    """
    success: bool = Field(
        description="Did the action succeed based on intent and context?"
    )
    
    hp_delta: int = Field(
        default=0,
        ge=-100,
        le=100,
        description="HP change (negative = damage, positive = healing)"
    )
    
    gold_delta: int = Field(
        default=0,
        ge=-1000,
        le=1000,
        description="Gold change (negative = spent/lost, positive = gained)"
    )
    
    target_npc_id: str | None = Field(
        default=None,
        description="ID of NPC affected by this action (if any)"
    )
    
    new_npc_state: Literal["neutral", "hostile", "distracted", "charmed", "dead"] = Field(
        default="neutral",
        description="New state of the target NPC"
    )
    
    reasoning: str = Field(
        description="Brief tactical reason for the outcome (1 sentence)"
    )


class ChroniclerProse(BaseModel):
    """
    The Narrative Gate: Pure storytelling.
    
    This agent focuses ONLY on D&D-style narration.
    No mechanics - just the vibe.
    """
    narrative: str = Field(
        description="DM-style narration of what happened (2-3 sentences, vivid and flavorful)"
    )


class ActionOutcome(BaseModel):
    """
    LEGACY: Combined outcome for backward compatibility.
    Will be deprecated in favor of Arbiter + Chronicler pipeline.
    """
    narrative: str
    hp_change: int = 0
    npc_state: Literal["neutral", "hostile", "distracted", "charmed", "dead"] = "neutral"
    success: bool
    gold_change: int = 0


class NarrativeEngine:
    """
    Generates rich narrative outcomes using a local LLM.
    
    Design:
    - Uses Pydantic AI to enforce structured outputs
    - Injects game context (room, NPC states, player stats) into prompts
    - Falls back to deterministic outcomes if LLM fails validation
    """
    
    def __init__(
        self,
        model_name: str = 'ollama:llama3.2:3b',
        tone: Literal["humorous", "serious", "gritty"] = "humorous"
    ):
        """
        Initialize narrative engine.
        
        Args:
            model_name: Ollama model identifier (e.g., 'ollama:llama3.2:3b')
            tone: Narrative style for DM persona
        """
        self.tone = tone
        
        system_prompt = self._build_system_prompt(tone)
        
        # Set Ollama base URL (default localhost:11434)
        import os
        if 'OLLAMA_BASE_URL' not in os.environ:
            os.environ['OLLAMA_BASE_URL'] = 'http://localhost:11434'
        
        logger.info(f"Initializing Pydantic AI agent with {model_name}")
        
        self.agent = Agent(
            model_name,
            output_type=ActionOutcome,
            system_prompt=system_prompt
        )
    
    def _build_system_prompt(self, tone: str) -> str:
        """Construct system prompt based on desired narrative style."""
        base = (
            "You are a creative Dungeon Master for a fantasy RPG. "
            "Your job is to narrate the outcome of player actions.\n\n"
            "Rules:\n"
            "- Keep narration to 2-3 sentences\n"
            "- Be specific about what happens\n"
            "- Consider context, player stats, and NPC state\n"
            "- Outcomes should be plausible within D&D-style fantasy\n"
        )
        
        tone_mods = {
            "humorous": "- Add wit and unexpected twists\n- NPCs have personality",
            "serious": "- Maintain gravitas\n- Consequences are meaningful",
            "gritty": "- Violence has weight\n- Failure hurts"
        }
        
        return base + tone_mods.get(tone, "")
    
    async def generate_outcome(
        self,
        intent_id: str,
        player_input: str,
        context: str,
        player_hp: int = 100,
        player_gold: int = 0
    ) -> ActionOutcome:
        """
        Generate a narrative outcome for a resolved intent.
        
        Args:
            intent_id: Matched intent (e.g., 'distract', 'attack')
            player_input: Original player text (for flavor)
            context: Room description and NPC states
            player_hp: Current player health
            player_gold: Current player gold
        
        Returns:
            Validated ActionOutcome with narrative and state changes
        """
        prompt = (
            f"Context: {context}\n\n"
            f"Player Stats: HP={player_hp}, Gold={player_gold}\n\n"
            f"Player Action: \"{player_input}\"\n"
            f"Resolved Intent: {intent_id}\n\n"
            f"Generate the outcome:"
        )
        
        logger.debug(f"Generating outcome for intent '{intent_id}'")
        
        try:
            result = await self.agent.run(prompt)
            outcome = result.data
            
            logger.info(f"Generated outcome: success={outcome.success}")
            return outcome
            
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            
            # Fallback to deterministic outcome
            return self._fallback_outcome(intent_id, player_input)
    
    def _fallback_outcome(self, intent_id: str, player_input: str) -> ActionOutcome:
        """
        Deterministic fallback if LLM fails.
        
        This ensures the game never crashes due to LLM issues.
        """
        logger.warning("Using fallback outcome generation")
        
        fallback_narratives = {
            "distract": ActionOutcome(
                narrative="You create a brief distraction. The guard's attention wavers.",
                npc_state="distracted",
                success=True
            ),
            "attack": ActionOutcome(
                narrative="Your attack lands, dealing moderate damage.",
                hp_change=-10,
                npc_state="hostile",
                success=True
            ),
            "persuade": ActionOutcome(
                narrative="Your words have some effect, but the outcome is uncertain.",
                npc_state="neutral",
                success=False
            )
        }
        
        return fallback_narratives.get(
            intent_id,
            ActionOutcome(
                narrative="You attempt the action, but nothing significant happens.",
                success=False
            )
        )


# Synchronous wrapper for non-async contexts
class SyncNarrativeEngine(NarrativeEngine):
    """Synchronous wrapper for narrative engine (for REPL usage)."""
    
    def generate_outcome_sync(
        self,
        intent_id: str,
        player_input: str,
        context: str,
        player_hp: int = 100,
        player_gold: int = 0
    ) -> ActionOutcome:
        """Synchronous version of generate_outcome."""
        import asyncio
        
        # Create event loop if needed
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(
            self.generate_outcome(
                intent_id, player_input, context, player_hp, player_gold
            )
        )
