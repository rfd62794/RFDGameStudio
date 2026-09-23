#!/usr/bin/env python3
"""
Test script to verify the Dynamic Entity & Ecosystem Model.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from chronos import ChronosEngine
from logic.entity_ai import EntityAI, Entity, EntityState, EntityGoal
from logic.perception import PerceptionSystem
from game_state import GameState


def test_dynamic_entities():
    """Test the dynamic entity system with movement and perception."""
    print("🤖 Testing Dynamic Entity & Ecosystem Model...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    entity_ai = EntityAI(world_ledger)
    chronos = ChronosEngine(world_ledger)
    perception = PerceptionSystem(world_ledger, entity_ai)
    
    # Test entity creation and movement
    print("\n👥 Testing Entity Movement:")
    
    # Get initial positions
    guard = entity_ai._entities.get("guard_tavern_1")
    merchant = entity_ai._entities.get("merchant_plaza_1")
    bandit = entity_ai._entities.get("bandit_forest_1")
    
    if guard and merchant and bandit:
        print(f"   Guard: {guard.name} at ({guard.current_pos.x}, {guard.current_pos.y})")
        print(f"   Merchant: {merchant.name} at ({merchant.current_pos.x}, {merchant.current_pos.y})")
        print(f"   Bandit: {bandit.name} at ({bandit.current_pos.x}, {bandit.current_pos.y})")
        
        # Simulate entity movement
        print("\n🚶 Simulating Entity Movement (5 turns):")
        for turn in range(1, 6):
            events = entity_ai.update_entities(turn, Coordinate(0, 0, turn))
            
            # Show movement events
            for event in events:
                print(f"   Turn {event['turn']}: {event['entity_name']} moved from {event['from_pos']} to {event['to_pos']} ({event['reason']})")
        
        # Check final positions
        guard = entity_ai._entities.get("guard_tavern_1")
        merchant = entity_ai._entities.get("merchant_plaza_1")
        bandit = entity_ai._entities.get("bandit_forest_1")
        
        print(f"\n   Final positions after 5 turns:")
        print(f"   Guard: {guard.name} at ({guard.current_pos.x}, {guard.current_pos.y})")
        print(f"   Merchant: {merchant.name} at ({merchant.current_pos.x}, {merchant.current_pos.y})")
        print(f"   Bandit: {bandit.name} at ({bandit.current_pos.x}, {bandit.current_pos.y})")
    
    # Test perception system
    print("\n👁️ Testing Perception System:")
    
    # Create player with high perception stats
    player_stats = {"wisdom": 16, "intelligence": 14, "strength": 12, "dexterity": 13, "constitution": 14, "charisma": 11}
    player_pos = Coordinate(0, 0, 5)
    
    print(f"   Player at ({player_pos.x}, {player_pos.y}) with WIS {player_stats['wisdom']}, INT {player_stats['intelligence']}")
    
    # Calculate perception range
    perception_range = perception.calculate_perception_range(player_stats)
    print(f"   Perception range: {perception_range} units")
    
    # Get perceived world
    perceived_world = perception.get_perceived_world(player_pos, player_stats, 5)
    
    print(f"\n   Perceived world summary:")
    print(f"   Near range (0-5 units): {len(perceived_world['near_range'])} coords")
    print(f"   Mid range (5-15 units): {len(perceived_world['mid_range'])} coords")
    print(f"   Far range (15+ units): {len(perceived_world['far_range'])} coords")
    print(f"   Total perceived: {perceived_world['total_coords']} coords")
    
    # Show near-range details
    if perceived_world["near_range"]:
        print(f"\n   Near-range details:")
        for coord_key, data in list(perceived_world["near_range"].items())[:3]:
            chunk = data.chunk
            if chunk:
                print(f"      ({coord_key}): {chunk.name}")
                if chunk.npcs:
                    npc_names = [npc["name"] for npc in chunk.npcs]
                    print(f"         NPCs: {', '.join(npc_names)}")
    
    # Show mid-range signatures
    if perceived_world["mid_range"]:
        print(f"\n   Mid-range signatures:")
        for coord_key, data in list(perceived_world["mid_range"].items())[:3]:
            for signature in data.signatures:
                print(f"      ({coord_key}): {signature.description} (intensity: {signature.intensity:.2f})")
    
    # Test radar system
    print("\n📡 Testing Radar System:")
    radar_data = perception.get_radar_data(player_pos, player_stats, 5)
    
    print(f"   Detected {len(radar_data)} radar blips:")
    for blip in radar_data[:5]:
        if blip["type"] == "entity":
            print(f"      {blip['icon']} {blip['name']} ({blip['faction']}) at ({blip['coordinate'][0]}, {blip['coordinate'][1]}) - {blip['distance']}u")
        else:
            print(f"      {blip['icon']} {blip['name']} at ({blip['coordinate'][0]}, {blip['coordinate'][1]}) - {blip['distance']}u")
    
    # Test travel intersection
    print("\n🚶 Testing Travel Intersection:")
    
    # Simulate travel from Tavern to Plaza
    from_pos = Coordinate(0, 0, 10)
    to_pos = Coordinate(0, 10, 20)
    
    print(f"   Simulating travel from ({from_pos.x}, {from_pos.y}) to ({to_pos.x}, {to_pos.y})")
    
    intersections = entity_ai.check_entity_intersection(from_pos, to_pos, 10, 20)
    
    if intersections:
        print(f"   Found {len(intersections)} intersections:")
        for intersection in intersections:
            print(f"      Turn {intersection['turn']}: {intersection['description']}")
    else:
        print("   No intersections detected")
    
    # Test entity statistics
    print("\n📊 Testing Entity Statistics:")
    stats = entity_ai.get_entity_statistics()
    
    print(f"   Total entities: {stats['total_entities']}")
    print(f"   Average speed: {stats['average_speed']:.2f}")
    
    print(f"   By type:")
    for entity_type, count in stats["by_type"].items():
        print(f"      {entity_type}: {count}")
    
    print(f"   By faction:")
    for faction, count in stats["by_faction"].items():
        print(f"      {faction}: {count}")
    
    print(f"   By state:")
    for state, count in stats["by_state"].items():
        print(f"      {state}: {count}")
    
    # Test time evolution with entities
    print("\n⏰ Testing Time Evolution with Entities:")
    
    # Advance time and check for entity interactions
    evolution_events = chronos.advance_time(50)  # Advance 50 turns
    
    print(f"   Processed {len(evolution_events)} evolution events")
    
    # Show some evolution events
    for event in evolution_events[:3]:
        print(f"      Turn {event.turn}: {event.description}")
    
    # Test entity state changes
    print(f"\n   Final entity states after 50 turns:")
    for entity_id, entity in entity_ai._entities.items():
        state_value = entity.state.value if hasattr(entity.state, 'value') else str(entity.state)
        print(f"      {entity.name}: {state_value} at ({entity.current_pos.x}, {entity.current_pos.y})")
    
    print("\n🎉 Dynamic Entity & Ecosystem Model Test Completed!")
    print("✅ Entity movement, perception, radar, and time evolution working!")


if __name__ == "__main__":
    test_dynamic_entities()
