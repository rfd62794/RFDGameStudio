#!/usr/bin/env python3
"""
Test script to verify the Director's Monitor functionality.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from rich.console import Console
from d20_core import D20Resolver, D20Result
from game_state import GameState
from character_factory import CharacterFactory
from ui.layout_manager import GameDashboard


async def test_director_monitor():
    """Test the Director's Monitor with sample D20 results."""
    console = Console()
    console.print("🎬 Testing Director's Monitor...")
    
    # Initialize dashboard
    dashboard = GameDashboard(console)
    dashboard.start_dashboard()
    
    try:
        # Create test game state
        character_factory = CharacterFactory()
        player = character_factory.create("cunning")
        game_state = GameState(player=player)
        
        # Initialize D20 resolver
        resolver = D20Resolver()
        
        # Test different scenarios
        test_scenarios = [
            {
                "input": "I search the room carefully",
                "intent": "investigate",
                "description": "Basic investigation action"
            },
            {
                "input": "I persuade the guard to let me pass",
                "intent": "charm", 
                "description": "Social action with potential disadvantage"
            },
            {
                "input": "I attack the guard aggressively",
                "intent": "force",
                "description": "Combat action that might cause reputation loss"
            }
        ]
        
        for i, scenario in enumerate(test_scenarios, 1):
            console.print(f"\n🧪 Test Scenario {i}: {scenario['description']}")
            
            # Resolve action
            d20_result = resolver.resolve_action(
                intent_id=scenario["intent"],
                player_input=scenario["input"],
                game_state=game_state,
                room_tags=["Dimly Lit", "Rowdy Crowd"],
                target_npc="Guard" if "guard" in scenario["input"].lower() else None
            )
            
            # Update dashboard
            dashboard.update_dashboard(
                narrative_content=f"Test {i}: {scenario['description']}\n\n{d20_result.string_summary()}",
                d20_result=d20_result,
                context=game_state.get_context_str(),
                active_goals=game_state.goal_stack,
                completed_goals=d20_result.goals_completed,
                success=d20_result.success
            )
            
            # Show result summary
            console.print(f"✅ Result: {d20_result.string_summary()}")
            
            # Wait a moment to see the display
            await asyncio.sleep(3)
        
        console.print("\n🎉 Director's Monitor test completed!")
        
    finally:
        # Clean up
        dashboard.stop_dashboard()


if __name__ == "__main__":
    asyncio.run(test_director_monitor())
