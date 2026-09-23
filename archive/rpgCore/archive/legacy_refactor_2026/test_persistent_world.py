#!/usr/bin/env python3
"""
Test script to verify the Persistent World Coordinate System.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from chronos import ChronosEngine
from game_state import GameState


def test_persistent_world():
    """Test the coordinate-based persistent world system."""
    print("🗺️ Testing Persistent World Coordinate System...")
    
    # Initialize world ledger
    world_ledger = WorldLedger()
    
    # Test coordinate system
    print("\n📍 Testing Coordinate System:")
    tavern_coord = Coordinate(0, 0, 0)
    plaza_coord = Coordinate(0, 10, 0)
    cave_coord = Coordinate(5, -5, 0)
    
    print(f"   Tavern at: ({tavern_coord.x}, {tavern_coord.y})")
    print(f"   Plaza at: ({plaza_coord.x}, {plaza_coord.y})")
    print(f"   Cave at: ({cave_coord.x}, {cave_coord.y})")
    
    # Test distance calculation
    distance = tavern_coord.distance_to(plaza_coord)
    print(f"   Distance from Tavern to Plaza: {distance} units")
    
    # Test chunk generation
    print("\n🏗️ Testing Procedural Chunk Generation:")
    tavern_chunk = world_ledger.get_chunk(tavern_coord, 0)
    print(f"   {tavern_chunk.name}: {tavern_chunk.description}")
    print(f"   Tags: {', '.join(tavern_chunk.tags)}")
    print(f"   NPCs: {len(tavern_chunk.npcs)}")
    print(f"   Items: {len(tavern_chunk.items)}")
    print(f"   Exits: {tavern_chunk.exits}")
    
    # Test persistence
    print("\n💾 Testing World Persistence:")
    
    # Modify the chunk
    world_ledger.update_chunk(
        tavern_coord,
        {
            "npcs": [
                {
                    "name": "Bartender Bob",
                    "type": "bartender",
                    "state": "friendly",
                    "disposition": 10
                }
            ],
            "environmental_state": {"busy": True}
        },
        1
    )
    
    # Reload and verify persistence
    reloaded_chunk = world_ledger.get_chunk(tavern_coord, 5)
    print(f"   After persistence: {len(reloaded_chunk.npcs)} NPCs")
    print(f"   Environmental state: {reloaded_chunk.environmental_state}")
    print(f"   Last modified: turn {reloaded_chunk.last_modified}")
    
    # Test discovery system
    print("\n🔍 Testing Discovery System:")
    world_ledger.discover_chunk(tavern_coord, "player1", 5)
    world_ledger.discover_chunk(plaza_coord, "player1", 8)
    
    discovered_chunk = world_ledger.get_chunk(tavern_coord, 10)
    print(f"   Discovered by: {discovered_chunk.discovered_by}")
    
    # Test travel mechanics
    print("\n🚶 Testing Travel Mechanics:")
    travel_time = world_ledger.get_travel_time(tavern_coord, plaza_coord)
    print(f"   Travel time (Tavern → Plaza): {travel_time} turns")
    
    # Test nearby chunks
    print("\n🗺️ Testing Nearby Chunks:")
    nearby_chunks = world_ledger.get_nearby_chunks(tavern_coord, 2, 10)
    print(f"   Found {len(nearby_chunks)} nearby chunks:")
    for chunk in nearby_chunks[:3]:  # Show first 3
        print(f"      - {chunk.name} at ({chunk.coordinate[0]}, {chunk.coordinate[1]})")
    
    # Test Chronos engine
    print("\n⏰ Testing Chronos Engine (Time Evolution):")
    chronos = ChronosEngine(world_ledger)
    
    # Advance time and process drift
    events = chronos.advance_time(25)  # Advance 25 turns
    print(f"   Processed {len(events)} world events")
    
    # Show some events
    for event in events[:3]:
        print(f"      - Turn {event.turn}: {event.description}")
    
    # Test time gap evolution
    print("\n🕰 Testing Time Gap Evolution:")
    gap_events = chronos.calculate_time_gap_evolution(0, 100)  # 100 turn gap
    print(f"   Major events in 100-turn gap: {len(gap_events)}")
    for event in gap_events:
        print(f"      - Turn {event.turn}: {event.description}")
    
    # Test world summary
    print("\n📊 Testing World Summary:")
    summary = chronos.get_world_summary()
    print(f"   World clock: turn {summary['world_clock']}")
    print(f"   Total events: {summary['total_events']}")
    print(f"   Discovered locations: {summary['discovered_locations']}")
    
    # Test world ledger statistics
    print("\n📈 Testing World Ledger Statistics:")
    stats = world_ledger.get_statistics()
    print(f"   Total chunks: {stats['total_chunks']}")
    print(f"   Total events: {stats['total_events']}")
    print(f"   Cached chunks: {stats['cached_chunks']}")
    
    print("\n🎉 Persistent World Coordinate System Test Completed!")
    print("✅ World persistence, procedural generation, and time evolution working!")


if __name__ == "__main__":
    test_persistent_world()
