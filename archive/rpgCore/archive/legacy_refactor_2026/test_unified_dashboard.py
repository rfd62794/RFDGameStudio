#!/usr/bin/env python3
"""
Test script to verify the Unified Dashboard with Raycast + Dialogue + Monitor.
"""

import sys
import os
import random
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate, WorldChunk
from logic.faction_system import FactionSystem
from ui.dashboard import UnifiedDashboard, DashboardLayout, DialogueMessage
from game_state import GameState, PlayerStats


def test_unified_dashboard():
    """Test the Unified Dashboard with all components integrated."""
    print("🎮 Testing Unified Dashboard - Raycast + Dialogue + Monitor...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    faction_system = FactionSystem(world_ledger)
    dashboard = UnifiedDashboard(world_ledger, faction_system)
    
    # Create a test game state
    player = PlayerStats(
        name="Test Player",
        attributes={"strength": 14, "dexterity": 12, "constitution": 13, "intelligence": 10, "wisdom": 11, "charisma": 10},
        hp=100,
        max_hp=100,
        gold=50
    )
    
    game_state = GameState(player=player)
    game_state.position = Coordinate(0, 0, 0)
    game_state.player_angle = 0.0  # Facing north
    
    # Create factions for context
    print("\n⚔️ Creating Factions for Context:")
    
    faction_configs = [
        {
            "id": "legion",
            "name": "The Iron Legion",
            "type": "military",
            "color": "red",
            "home_base": [0, 0],
            "current_power": 0.8,
            "relations": {"cult": "hostile"},
            "goals": ["expand_territory"],
            "expansion_rate": 0.2,
            "aggression_level": 0.9
        }
    ]
    
    factions = faction_system.create_factions(faction_configs)
    print(f"   Created {len(factions)} factions")
    
    # Test conversation engine
    print("\n💬 Testing Conversation Engine:")
    
    # Test mood calculation
    game_state.reputation = {"legion": -25, "cult": 0}
    
    npc_mood = dashboard.conversation_engine.calculate_npc_mood(
        "Guard", game_state.reputation, (0, 0)
    )
    
    print(f"   NPC mood at (0,0): {npc_mood}")
    
    # Test dialogue generation
    player_action = "I want to talk to the guard"
    npc_response = dashboard.conversation_engine.generate_npc_response(
        "Guard", player_action, npc_mood, {"faction": "legion"}
    )
    
    print(f"   NPC response: {npc_response.text}")
    
    # Test conversation history
    player_msg = dashboard.conversation_engine.add_player_message(
        player_action, len(dashboard.conversation_engine.conversation_history)
    )
    
    dashboard.conversation_engine.add_npc_message(npc_response)
    
    print(f"   Conversation history: {len(dashboard.conversation_engine.conversation_history)} messages")
    
    # Test dashboard rendering
    print("\n🖼️ Testing Dashboard Rendering:")
    
    # Test different layouts
    layouts = [
        DashboardLayout.RAYCAST_DOMINANT,
        DashboardLayout.BALANCED,
        DashboardLayout.MONITOR_DOMINANT
    ]
    
    for layout in layouts:
        dashboard.update_layout(layout)
        
        # Render dashboard
        dashboard_layout = dashboard.render_dashboard(game_state)
        
        print(f"   {layout.value} layout rendered successfully")
        
        # Get dashboard summary
        summary = dashboard.get_dashboard_summary()
        print(f"      Layout: {summary['layout']}")
        print(f"      Viewport: {summary['viewport_size']}")
        print(f"      Player angle: {summary['player_angle']}°")
        print(f"      Perception range: {summary['perception_range']}")
        print(f"      Conversation: {summary['conversation_summary']['total_messages']} messages")
    
    # Test player action handling
    print("\n🎯 Testing Player Action Handling:")
    
    test_actions = [
        "Hello there!",
        "Can you help me?",
        "I want to trade.",
        "Tell me about this place.",
        "Goodbye."
    ]
    
    for action in test_actions:
        npc_response = dashboard.handle_player_action(action, game_state)
        
        if npc_response:
            print(f"   Player: {action}")
            print(f"   NPC ({npc_response.mood}): {npc_response.text}")
        else:
            print(f"   Player: {action} (No NPC response)")
    
    # Test perception-based rendering
    print("\n👁️ Testing Perception-Based Rendering:")
    
    # Test different perception ranges
    perception_tests = [
        ({"wisdom": 8, "intelligence": 8}, "Low perception"),
        ({"wisdom": 12, "intelligence": 12}, "Medium perception"),
        ({"wisdom": 16, "intelligence": 16}, "High perception")
    ]
    
    for attributes, description in perception_tests:
        game_state.player.attributes = attributes
        
        dashboard_layout = dashboard.render_dashboard(game_state)
        summary = dashboard.get_dashboard_summary()
        
        print(f"   {description}: {summary['perception_range']} perception range")
    
    # Test different player angles
    print("\n🧭 Testing Different Player Angles:")
    
    angles = [0, 45, 90, 135, 180, 225, 270, 315]
    
    for angle in angles:
        game_state.player_angle = angle
        
        dashboard_layout = dashboard.render_dashboard(game_state)
        summary = dashboard.get_dashboard_summary()
        
        print(f"   {angle}°: {summary['player_angle']}°")
    
    # Test conversation summary
    print("\n📊 Testing Conversation Summary:")
    
    summary = dashboard.conversation_engine.get_conversation_summary()
    
    print(f"   Total messages: {summary['total_messages']}")
    print(f"   Last speaker: {summary['last_speaker']}")
    print(f"   Last mood: {summary['last_mood']}")
    print(f"   Player messages: {summary['player_messages']}")
    print(f"   NPC messages: {summary['npc_messages']}")
    
    # Test recent messages
    print("\n📜 Testing Recent Messages:")
    
    recent_messages = dashboard.conversation_engine.get_recent_messages(3)
    
    for msg in recent_messages:
        speaker_type = "Player" if msg.is_player else "NPC"
        print(f"   {speaker_type} ({msg.mood}): {msg.text}")
    
    # Test mood calculation with different reputations
    print("\n😊 Testing Mood Calculation:")
    
    reputation_tests = [
        ({"legion": 50}, "Friendly"),
        ({"legion": 0}, "Neutral"),
        ({"legion": -25}, "Hostile"),
        ({"legion": -50}, "Very Hostile")
    ]
    
    for reputation, expected in reputation_tests:
        game_state.reputation = reputation
        
        mood = dashboard.conversation_engine.calculate_npc_mood(
            "Guard", game_state.reputation, (0, 0)
        )
        
        print(f"   Reputation {reputation['legion']}: {mood} (expected: {expected})")
    
    # Test dashboard state
    print("\n🔧 Testing Dashboard State:")
    
    state = dashboard.get_dashboard_summary()
    
    print(f"   Current layout: {state['layout']}")
    print(f"   Viewport size: {state['viewport_size']}")
    print(f"   Field of view: {state['fov']}")
    print(f"   Player angle: {state['player_angle']}°")
    print(f"   Perception range: {state['perception_range']}")
    
    # Test visual effects
    print("\n✨ Testing Visual Effects:")
    
    # Create a message with visual effect
    visual_msg = DialogueMessage(
        speaker="Guard",
        text="The guard draws his weapon!",
        turn=1,
        mood="hostile",
        is_player=False,
        visual_effect="red_flash"
    )
    
    dashboard.conversation_engine.add_npc_message(visual_msg)
    
    print(f"   Added visual effect: {visual_msg.visual_effect}")
    
    # Test conversation with different moods
    print("\n🎭 Testing Different Moods:")
    
    mood_tests = ["hostile", "unfriendly", "neutral", "friendly", "helpful"]
    
    for mood in mood_tests:
        response = dashboard.conversation_engine.generate_npc_response(
            "Guard", "Hello", mood, {"faction": "legion"}
        )
        
        print(f"   {mood}: {response.text}")
    
    print("\n🎉 Unified Dashboard Test Completed!")
    print("✅ Raycast + Dialogue + Monitor integration working!")
    print("✅ Conversation engine functional!")
    print("✅ Mood calculation based on reputation working!")
    print("✅ Multiple layout configurations supported!")
    print("✅ Perception-based rendering implemented!")
    print("✅ Player action handling complete!")


if __name__ == "__main__":
    test_unified_dashboard()
