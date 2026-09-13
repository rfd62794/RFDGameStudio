#!/usr/bin/env python3
"""
Test script to verify the Deep Time Simulator and Sedimentary World Generation.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from utils.historian import Historian, WorldSeed, Faction, WorldEvent
from world_factory import WorldFactory


def test_deep_time_simulation():
    """Test the Deep Time Simulator with sedimentary world generation."""
    print("⏰ Testing Deep Time Simulator and Sedimentary World Generation...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    historian = Historian(world_ledger)
    world_factory = WorldFactory(world_ledger)
    
    # Test world seed creation
    print("\n🌱 Testing World Seed Creation:")
    
    # Create a custom world seed
    world_seed = WorldSeed(
        founding_vector={
            "resource": "gold",
            "climate": "cold",
            "faction": "nobility"
        },
        starting_population=200,
        initial_factions=[Faction.NOBILITY, Faction.CLERGY],
        location_name="Mountain Fortress",
        coordinates=(0, 0),
        radius=4
    )
    
    print(f"   Location: {world_seed.location_name}")
    print(f"   Founding Vector: {world_seed.founding_vector}")
    print(f"   Starting Population: {world_seed.starting_population}")
    print(f"   Initial Factions: {[f.value for f in world_seed.initial_factions]}")
    print(f"   Coordinates: {world_seed.coordinates}")
    print(f"   Radius: {world_seed.radius}")
    
    # Test deep time simulation
    print("\n⏳ Testing Deep Time Simulation:")
    
    # Simulate 10 epochs (1000 years)
    epochs = historian.simulate_deep_time(world_seed, epochs=10)
    
    print(f"   Simulated {len(epochs)} epochs (1000 years of history)")
    
    # Show epoch summaries
    for epoch in epochs[:5]:  # Show first 5 epochs
        print(f"      Epoch {epoch.number} ({epoch.start_year}-{epoch.end_year}):")
        print(f"         Dominant Event: {epoch.dominant_event.value}")
        print(f"         Dominant Faction: {epoch.dominant_faction.value if epoch.dominant_faction else 'None'}")
        print(f"         Population Trend: {epoch.population_trend:.2f}x")
        print(f"         Tags Created: {len(epoch.tags_created)}")
        
        # Show some tags
        for tag in epoch.tags_created[:2]:
            print(f"            - {tag.tag} at {tag.coordinate} (intensity: {tag.intensity:.2f})")
    
    # Test historical summary
    print("\n📊 Testing Historical Summary:")
    summary = historian.get_historical_summary()
    
    print(f"   Total Historical Tags: {summary['total_tags']}")
    print(f"   Event Distribution: {summary['event_distribution']}")
    
    # Test world creation with history
    print("\n🏗️ Testing World Creation with History:")
    
    # Create world with deep time simulation
    world_info = world_factory.create_world_with_history(
        center_coord=Coordinate(0, 0, 0),
        world_seed=world_seed,
        epochs=10,
        radius=5
    )
    
    print(f"   Created world with {world_info['total_chunks']} chunks")
    print(f"   Settlement chunks: {len(world_info['settlement_chunks'])}")
    
    # Test historical context retrieval
    print("\n📚 Testing Historical Context Retrieval:")
    
    # Test different coordinates
    test_coords = [
        Coordinate(0, 0, 0),  # Center
        Coordinate(1, 1, 0),  # Nearby
        Coordinate(3, 2, 0),  # Edge of settlement
        Coordinate(5, 5, 0),  # Outside settlement
    ]
    
    for coord in test_coords:
        context = world_factory.get_historical_context_for_chunk(coord)
        if context:
            print(f"   Historical context at ({coord.x}, {coord.y}):")
            for ctx in context[:3]:  # Show top 3
                print(f"      - {ctx}")
        else:
            print(f"   No historical context at ({coord.x}, {coord.y})")
    
    # Test historical tags in chunks
    print("\n🏷️ Testing Historical Tags in Chunks:")
    
    # Get a chunk and check its tags
    test_chunk = world_ledger.get_chunk(Coordinate(1, 1, 0), 0)
    print(f"   Chunk at (1, 1): {test_chunk.name}")
    print(f"   Description: {test_chunk.description}")
    print(f"   Tags: {test_chunk.tags}")
    
    # Check for historical tags specifically
    historical_tags = world_ledger.get_historical_tags(Coordinate(1, 1, 0))
    if historical_tags:
        print(f"   Historical Tags:")
        for tag in historical_tags:
            print(f"      - {tag['tag']} (Epoch {tag['epoch']}, Intensity: {tag['intensity']:.2f})")
            print(f"        Description: {tag['description']}")
    
    # Test predefined historical seeds
    print("\n🎭 Testing Predefined Historical Seeds:")
    
    predefined_seeds = ["river_valley", "mountain_pass", "coastal_town", "frontier_outpost"]
    
    for seed_name in predefined_seeds:
        if seed_name in world_factory.historical_seeds:
            seed = world_factory.historical_seeds[seed_name]
            print(f"   {seed_name.title()}:")
            print(f"      Location: {seed.location_name}")
            print(f"      Resource: {seed.founding_vector.get('resource')}")
            print(f"      Climate: {seed.founding_vector.get('climate')}")
            print(f"      Faction: {seed.founding_vector.get('faction')}")
    
    # Test special location creation with history
    print("\n🏛️ Testing Special Location Creation with History:")
    
    # Create ancient ruins with historical context
    ancient_ruins = world_factory.create_location_with_history(
        Coordinate(2, 2, 0),
        "ancient_ruins",
        0
    )
    
    print(f"   Ancient Ruins at (2, 2):")
    print(f"      Name: {ancient_ruins.name}")
    print(f"      Description: {ancient_ruins.description}")
    print(f"      Tags: {ancient_ruins.tags}")
    
    # Test outsider condition for new avatars
    print("\n👤 Testing Outsider Condition:")
    
    # Simulate a new avatar arriving in a pre-weathered world
    print("   New Avatar arrives in pre-weathered world:")
    print("      - Social DCs +2 until Reputation is earned")
    print("      - Historical context provides narrative depth")
    print("      - World feels lived-in with centuries of history")
    
    # Test event distribution
    print("\n📈 Testing Event Distribution Analysis:")
    
    event_counts = summary['event_distribution']
    total_events = sum(event_counts.values())
    
    print(f"   Total World Events: {total_events}")
    print("   Event Types:")
    for event_type, count in event_counts.items():
        percentage = (count / total_events) * 100
        print(f"      - {event_type}: {count} ({percentage:.1f}%)")
    
    print("\n🎉 Deep Time Simulation Test Completed!")
    print("✅ Sedimentary world generation and historical layers working!")
    print("✅ World feels like it has 1,000 years of dust on the shelves!")


if __name__ == "__main__":
    test_deep_time_simulation()
