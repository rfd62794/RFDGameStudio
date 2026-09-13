"""
Voyager synchronous wrapper for REPL integration.
"""

import asyncio
from voyager_agent import VoyagerAgent, VoyagerDecision


class SyncVoyagerAgent(VoyagerAgent):
    """Synchronous wrapper for VoyagerAgent to enable REPL usage."""
    
    def decide_action_sync(
        self,
        scene_context: str,
        player_stats: dict,
        turn_history: list[str] | None = None,
        room_tags: list[str] | None = None,
        goal_stack: list | None = None
    ) -> VoyagerDecision:
        """
        Synchronous version of decide_action.
        
        Wraps the async call in an event loop for use in synchronous code.
        """
        return self._run_async(
            self.decide_action(scene_context, player_stats, turn_history, room_tags, goal_stack)
        )
    
    def _run_async(self, coro):
        """Execute async coroutine synchronously."""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        return loop.run_until_complete(coro)
