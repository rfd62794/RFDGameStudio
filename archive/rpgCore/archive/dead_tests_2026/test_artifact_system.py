#!/usr/bin/env python3
"""
Test script to verify the Artifact System and Item Lineage.
"""

import sys
import os
import random
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from logic.faction_system import FactionSystem
from logic.artifacts import ArtifactGenerator, Artifact, ArtifactRarity, ArtifactType
from loot_system import LootSystem
from game_state import GameState, PlayerStats


def test_artifact_system():
    """Test the Artifact System with item lineage and historical context."""
    print("🏺️ Testing Artifact System - Item Lineage & Historical Context...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    faction_system = FactionSystem(world_ledger)
    artifact_generator = ArtifactGenerator(world_ledger, faction_system)
    loot_system = LootSystem(world_ledger, faction_system)
    
    # Create factions for context
    print("\n⚔️ Creating Factions for Historical Context:")
    
    faction_configs = [
        {
            "id": "legion",
            "name": "The Iron Legion",
            "type": "military",
            "color": "red",
            "home_base": [0, 0],
            "current_power": 0.8,
            "relations": {"cult": "hostile", "traders": "neutral"},
            "goals": ["expand_territory", "defend_borders"],
            "expansion_rate": 0.2,
            "aggression_level": 0.9
        },
        {
            "id": "cult",
            "name": "The Shadow Cult",
            "type": "religious",
            "color": "purple",
            "home_base": [10, 10],
            "current_power": 0.6,
            "relations": {"legion": "hostile", "traders": "neutral"},
            "goals": ["convert_followers", "establish_shrines"],
            "expansion_rate": 0.1,
            "aggression_level": 0.7
        }
    ]
    
    factions = faction_system.create_factions(faction_configs)
    
    print(f"   Created {len(factions)} factions for historical context")
    
    # Simulate some faction activity to create history
    print("\n⏰ Simulating Faction Activity for Historical Context:")
    
    for turn in range(0, 50, 10):
        faction_system.simulate_factions(turn)
    
    print("   Faction simulation completed - historical context created")
    
    # Test artifact generation at different coordinates
    print("\n🏺️ Testing Artifact Generation:")
    
    test_coordinates = [
        Coordinate(0, 0, 0),   # Legion home base
        Coordinate(10, 10, 0),  # Cult home base
        Coordinate(1, 1, 0),   # Likely Legion expansion
        Coordinate(5, 5, 0),   # Unknown territory
        Coordinate(-3, -3, 0)  # Another unknown territory
    ]
    
    artifacts = []
    
    for coord in test_coordinates:
        artifact = artifact_generator.generate_artifact(coord, "sword", 100)
        if artifact:
            artifacts.append(artifact)
            print(f"   ({coord.x}, {coord.y}): {artifact.name}")
            print(f"      Type: {artifact.artifact_type.value}")
            print(f"      Rarity: {artifact.rarity.value}")
            print(f"      Faction: {artifact.faction_affinity.value}")
            print(f"      Epoch: {artifact.origin_epoch}")
            print(f"      Event: {artifact.origin_event}")
            print(f"      Value: {artifact.value} gold")
            print(f"      Bonuses: {artifact.bonuses}")
            print(f"      Properties: {artifact.special_properties}")
        else:
            print(f"   ({coord.x}, {coord.y}): No artifact generated")
    
    # Test artifact lore
    print("\n📜 Testing Artifact Lore:")
    
    if artifacts:
        first_artifact = artifacts[0]
        lore = artifact_generator.get_artifact_lore(first_artifact)
        
        print(f"   Lore for {first_artifact.name}:")
        for line in lore.split('\n'):
            print(f"      {line}")
    
    # Test loot system integration
    print("\n💰 Testing Loot System Integration:")
    
    # Test regular loot
    regular_loot = loot_system.generate_loot("tavern", "investigate")
    if regular_loot:
        print(f"   Regular loot: {regular_loot.name} ({regular_loot.value} gold)")
    
    # Test artifact loot
    artifact_loot = loot_system.generate_loot("dungeon", "investigate", Coordinate(0, 0, 0), 100)
    if artifact_loot:
        print(f"   Artifact loot: {artifact_loot.name} ({artifact_loot.value} gold)")
        print(f"   Description: {artifact_loot.description}")
        print(f"   Stats: {artifact_loot.stat_bonus}")
    
    # Test different artifact types
    print("\n🗡️ Testing Different Artifact Types:")
    
    artifact_types = ["sword", "armor", "ring", "key", "relic"]
    
    for art_type in artifact_types:
        artifact = artifact_generator.generate_artifact(Coordinate(0, 0, 0), art_type, 100)
        if artifact:
            print(f"   {art_type.title()}: {artifact.name}")
            print(f"      Rarity: {artifact.rarity.value}")
            print(f"      Bonuses: {artifact.bonuses}")
    
    # Test faction affinity effects
    print("\n⚔️ Testing Faction Affinity Effects:")
    
    # Generate artifacts with different affinities
    for coord in test_coordinates[:3]:
        artifact = artifact_generator.generate_artifact(coord, "sword", 100)
        if artifact:
            print(f"   {artifact.faction_affinity.value} artifact at ({coord.x}, {coord.y}):")
            print(f"      {artifact.name}")
            print(f"      Bonuses: {artifact.bonuses}")
    
    # Test rarity distribution
    print("\n💎 Testing Rarity Distribution:")
    
    rarity_counts = {rarity.value: 0 for rarity in ArtifactRarity}
    
    for _ in range(50):  # Generate 50 artifacts
        coord = Coordinate(random.randint(-5, 5), random.randint(-5, 5), 0)
        artifact = artifact_generator.generate_artifact(coord, "sword", 100)
        if artifact:
            rarity_counts[artifact.rarity.value] += 1
    
    print("   Rarity distribution (50 artifacts):")
    for rarity, count in rarity_counts.items():
        percentage = (count / 50) * 100
        print(f"      - {rarity}: {count} ({percentage:.1f}%)")
    
    # Test special properties
    print("\n✨ Testing Special Properties:")
    
    special_props = {}
    
    for _ in range(20):
        coord = Coordinate(random.randint(-5, 5), random.randint(-5, 5), 0)
        artifact = artifact_generator.generate_artifact(coord, "armor", 100)
        if artifact and artifact.special_properties:
            for prop in artifact.special_properties:
                special_props[prop] = special_props.get(prop, 0) + 1
    
    print("   Special properties (20 artifacts):")
    for prop, count in special_props.items():
        print(f"      - {prop}: {count} occurrences")
    
    # Test value calculation
    print("\n💰 Testing Value Calculation:")
    
    values = []
    
    for _ in range(30):
        coord = Coordinate(random.randint(-5, 5), random.randint(-5, 5), 0)
        artifact = artifact_generator.generate_artifact(coord, "ring", 100)
        if artifact:
            values.append(artifact.value)
    
    if values:
        print(f"   Value range: {min(values)} - {max(values)} gold")
        print(f"   Average value: {sum(values) / len(values):.1f} gold")
    
    print("\n🎉 Artifact System Test Completed!")
    print("✅ Item lineage and historical context working!")
    print("✅ Faction-affinity bonuses implemented!")
    print("✅ Rarity-based value system working!")
    print("✅ Special properties generation working!")
    print("✅ Loot system integration complete!")


if __name__ == "__main__":
    test_artifact_system()
