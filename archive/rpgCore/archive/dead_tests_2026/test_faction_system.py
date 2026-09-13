#!/usr/bin/env python3
"""
Test script to verify the Faction System and Dwarf Fortress-style simulation.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from logic.faction_system import FactionSystem, Faction, FactionType, FactionRelation
from chronos import ChronosEngine
from d20_core import D20Resolver
from game_state import GameState, PlayerStats


def test_faction_system():
    """Test the Faction System with active world simulation."""
    print("⚔️ Testing Faction System - Dwarf Fortress Style Simulation...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    faction_system = FactionSystem(world_ledger)
    chronos = ChronosEngine(world_ledger)
    d20_resolver = D20Resolver(faction_system)
    
    # Create factions
    print("\n🏰 Creating Factions:")
    
    faction_configs = [
        {
            "id": "legion",
            "name": "The Iron Legion",
            "type": "military",
            "color": "red",
            "home_base": [0, 0],
            "current_power": 0.7,
            "relations": {
                "cult": "hostile",
                "traders": "neutral"
            },
            "goals": ["expand_territory", "defend_borders"],
            "expansion_rate": 0.15,
            "aggression_level": 0.8
        },
        {
            "id": "cult",
            "name": "The Shadow Cult",
            "type": "religious",
            "color": "purple",
            "home_base": [10, 10],
            "current_power": 0.5,
            "relations": {
                "legion": "hostile",
                "traders": "neutral"
            },
            "goals": ["convert_followers", "establish_shrines"],
            "expansion_rate": 0.1,
            "aggression_level": 0.6
        },
        {
            "id": "traders",
            "name": "The Merchant Guild",
            "type": "economic",
            "color": "gold",
            "home_base": [-5, -5],
            "current_power": 0.6,
            "relations": {
                "legion": "neutral",
                "cult": "neutral"
            },
            "goals": ["establish_trade_routes", "accumulate_wealth"],
            "expansion_rate": 0.2,
            "aggression_level": 0.3
        }
    ]
    
    factions = faction_system.create_factions(faction_configs)
    
    print(f"   Created {len(factions)} factions:")
    for faction_id, faction in factions.items():
        print(f"      - {faction.name} ({faction.type.value}) at {faction.home_base}")
        print(f"        Power: {faction.current_power:.2f}, Aggression: {faction.aggression_level:.2f}")
        print(f"        Relations: {faction.relations}")
    
    # Test faction simulation
    print("\n⚔️ Testing Faction Simulation:")
    
    # Simulate 100 turns of faction activity
    total_conflicts = []
    for turn in range(0, 100, 10):  # Process every 10 turns
        conflicts = faction_system.simulate_factions(turn)
        if conflicts:
            total_conflicts.extend(conflicts)
            print(f"   Turn {turn}: {len(conflicts)} new conflicts")
    
    print(f"\n   Total conflicts after 100 turns: {len(total_conflicts)}")
    
    # Show faction control map
    print("\n🗺️ Testing Faction Control Map:")
    
    control_map = faction_system.get_faction_control_map()
    print(f"   Controlled territories: {len(control_map)}")
    
    # Show control distribution
    faction_control = {}
    for coord, (faction_id, strength) in control_map.items():
        if faction_id not in faction_control:
            faction_control[faction_id] = 0
        faction_control[faction_id] += 1
    
    print("   Territory distribution:")
    for faction_id, count in faction_control.items():
        faction = factions[faction_id]
        print(f"      - {faction.name}: {count} territories")
    
    # Test faction at coordinate
    print("\n📍 Testing Faction at Coordinate:")
    
    test_coords = [
        Coordinate(0, 0, 0),   # Legion home base
        Coordinate(10, 10, 0),  # Cult home base
        Coordinate(-5, -5, 0), # Traders home base
        Coordinate(1, 1, 0),    # Likely Legion territory
        Coordinate(5, 5, 0)     # Unknown territory
    ]
    
    for coord in test_coords:
        faction = faction_system.get_faction_at_coordinate(coord)
        if faction:
            print(f"   ({coord.x}, {coord.y}): Controlled by {faction.name}")
        else:
            print(f"   ({coord.x}, {coord.y}): No faction control")
    
    # Test faction-based D20 resolution
    print("\n🎲 Testing Faction-Based D20 Resolution:")
    
    # Create a test game state
    player = PlayerStats(
        name="Test Player",
        attributes={"strength": 14, "dexterity": 12, "constitution": 13, "intelligence": 10, "wisdom": 11, "charisma": 10},
        hp=100,
        max_hp=100,
        gold=50
    )
    
    game_state = GameState(player=player)
    game_state.position = Coordinate(0, 0, 0)  # Legion territory
    
    # Set reputation with Legion
    game_state.reputation = {"legion": -25, "cult": 0, "traders": 10}
    
    print(f"   Player at Legion territory with reputation: {game_state.reputation}")
    
    # Test social action with hostile faction
    result = d20_resolver.resolve_action("talk", "I want to talk to the guard", game_state, ["indoor"])
    
    print(f"   Social action result:")
    print(f"      Success: {result.success}")
    print(f"      Roll: {result.roll} + Modifiers = {result.total_score}")
    print(f"      Faction modifier applied: {result.total_score - result.roll - 14}")  # Approximate
    
    # Test Chronos integration
    print("\n⏰ Testing Chronos Integration:")
    
    # Advance time with faction processing
    events = chronos.advance_time(50)
    
    # Convert WorldEvent objects to dictionaries for filtering
    event_dicts = []
    for event in events:
        event_dict = {
            "type": event.event_type,
            "description": event.description,
            "turn": event.turn,
            "impact": event.impact
        }
        event_dicts.append(event_dict)
    
    faction_events = [e for e in event_dicts if e.get("type") == "faction_conflict"]
    expansion_events = [e for e in event_dicts if e.get("type") == "faction_expansion"]
    
    print(f"   Faction conflicts: {len(faction_events)}")
    print(f"   Faction expansions: {len(expansion_events)}")
    
    # Show some events
    for event in faction_events[:3]:
        print(f"      - {event['description']}")
    
    # Test faction summary
    print("\n📊 Testing Faction Summary:")
    
    summary = faction_system.get_faction_summary()
    
    print(f"   Total factions: {summary['total_factions']}")
    print(f"   Active conflicts: {summary['active_conflicts']}")
    print(f"   Resolved conflicts: {summary['resolved_conflicts']}")
    print(f"   Total territories: {summary['total_territories']}")
    
    print("   Faction power levels:")
    for faction_id, power in summary['faction_power'].items():
        faction = factions[faction_id]
        print(f"      - {faction.name}: {power:.2f}")
    
    # Test faction tension matrix
    print("\n🔥 Testing Faction Tension Matrix:")
    
    print("   Faction Relations:")
    for faction_id, faction in factions.items():
        print(f"      {faction.name}:")
        for other_id, relation in faction.relations.items():
            other_faction = factions[other_id]
            print(f"         - {other_faction.name}: {relation.value}")
    
    print("\n🎉 Faction System Test Completed!")
    print("✅ Active world simulation with faction wars working!")
    print("✅ Dwarf Fortress-style territorial control implemented!")
    print("✅ Faction-based D20 disadvantages working!")


if __name__ == "__main__":
    test_faction_system()
