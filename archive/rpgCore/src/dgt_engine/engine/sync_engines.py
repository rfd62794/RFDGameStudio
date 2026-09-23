"""
Sync wrappers for Arbiter and Chronicler engines.

Provides synchronous interfaces for use in non-async contexts like the REPL.
"""

import asyncio
from arbiter_engine import ArbiterEngine, ArbiterLogic
from chronicler_engine import ChroniclerEngine, ChroniclerProse


class SyncArbiterEngine(ArbiterEngine):
    """Synchronous wrapper for Arbiter engine."""
    
    def resolve_action_sync(
        self,
        intent_id: str,
        player_input: str,
        context: str,
        player_hp: int = 100,
        player_gold: int = 0
    ) -> ArbiterLogic:
        """Synchronous version of resolve_action."""
        return self._run_async(
            self.resolve_action(
                intent_id, player_input, context, player_hp, player_gold
            )
        )
    
    def _run_async(self, coro):
        """Helper to run async coroutines synchronously."""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(coro)


class SyncChroniclerEngine(ChroniclerEngine):
    """Synchronous wrapper for Chronicler engine."""
    
    def narrate_outcome_sync(
        self,
        player_input: str,
        intent_id: str,
        arbiter_result: dict,
        context: str
    ) -> ChroniclerProse:
        """Synchronous version of narrate_outcome."""
        return self._run_async(
            self.narrate_outcome(
                player_input, intent_id, arbiter_result, context
            )
        )
    
    def _run_async(self, coro):
        """Helper to run async coroutines synchronously."""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(coro)


# Re-export with Sync prefix
ArbiterEngine = SyncArbiterEngine
ChroniclerEngine = SyncChroniclerEngine
