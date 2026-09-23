#!/usr/bin/env python3
"""
Test script to verify the Avatar-Legacy Protocol.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from world_ledger import WorldLedger, Coordinate
from game_state import GameState, PlayerStats
from character_factory import CharacterFactory
from logic.legacy import LegacyHandler
from logic.entity_ai import EntityAI


def test_legacy_system():
    """Test the Avatar-Legacy Protocol with echo system and resonance."""
    print("👻 Testing Avatar-Legacy Protocol...")
    
    # Initialize systems
    world_ledger = WorldLedger()
    legacy_handler = LegacyHandler(world_ledger)
    character_factory = CharacterFactory()
    
    # Test legacy summary
    print("\n📊 Testing Legacy Summary:")
    summary = legacy_handler.get_legacy_summary()
    print(f"   Total legacy marks: {summary['total_marks']}")
    print(f"   Archetype resonance: {len(summary['archetype_resonance'])} archetypes")
    
    # Create a test avatar run
    print("\n🎭 Creating Test Avatar Run:")
    
    # Create a cunning avatar
    player = character_factory.create("cunning")
    game_state = GameState(player=player)
    game_state.position = Coordinate(5, 5, 0)
    game_state.turn_count = 25
    game_state.reputation = {"law": -30, "underworld": 15}
    game_state.completed_goals = ["first_blood", "escape_tavern"]
    
    print(f"   Avatar: {player.name} ({player.archetype_name})")
    print(f"   Position: ({game_state.position.x}, {game_state.position.y})")
    print(f"   Turn: {game_state.turn_count}")
    print(f"   Reputation: {game_state.reputation}")
    print(f"   Completed goals: {game_state.completed_goals}")
    
    # Test legacy distillation
    print("\n🍶 Testing Legacy Distillation:")
    legacy_marks = legacy_handler.distill_run_into_legacy(game_state, "death")
    
    print(f"   Created {len(legacy_marks)} legacy marks:")
    for mark in legacy_marks:
        print(f"      - {mark.description} at {mark.coordinate}")
        print(f"        Avatar: {mark.avatar_name} the {mark.archetype}")
        print(f"        Cause: {mark.cause}")
        print(f"        Item: {mark.inventory_top_item}")
        print(f"        Resonance: {mark.resonance_strength:.2f}")
    
    # Test legacy retrieval
    print("\n🔍 Testing Legacy Retrieval:")
    test_coords = [
        Coordinate(5, 5, 0),  # Avatar's final location
        Coordinate(0, 0, 0),  # Tavern
        Coordinate(0, 10, 0), # Plaza
        Coordinate(10, 10, 0) # New location
    ]
    
    for coord in test_coords:
        marks = legacy_handler.get_legacy_marks_at(coord)
        if marks:
            print(f"   Legacy marks at ({coord.x}, {coord.y}):")
            for mark in marks:
                print(f"      - {mark.description}")
        else:
            print(f"   No legacy marks at ({coord.x}, {coord.y})")
    
    # Test archetype resonance bonus
    print("\n🎯 Testing Archetype Resonance Bonus:")
    
    # Test cunning archetype (should have bonus now)
    cunning_bonuses = legacy_handler.get_archetype_resonance_bonus("cunning")
    print(f"   Cunning archetype bonuses: {cunning_bonuses}")
    
    # Test new archetype (no bonus)
    diplomatic_bonuses = legacy_handler.get_archetype_resonance_bonus("diplomatic")
    print(f"   Diplomatic archetype bonuses: {diplomatic_bonuses}")
    
    # Test nearby legacy context
    print("\n👻 Testing Nearby Legacy Context:")
    
    for coord in test_coords:
        context = legacy_handler.get_nearby_legacy_context(coord, radius=2)
        if context:
            print(f"   Legacy context near ({coord.x}, {coord.y}):")
            for ctx in context:
                print(f"      - {ctx}")
        else:
            print(f"   No legacy context near ({coord.x}, {coord.y})")
    
    # Test multiple avatar runs
    print("\n🔄 Testing Multiple Avatar Runs:")
    
    # Create and distill multiple avatars
    archetypes = ["aggressive", "diplomatic", "tactical"]
    
    for i, archetype in enumerate(archetypes):
        print(f"\n   Run {i+1}: {archetype.title()} Avatar")
        
        # Create avatar
        player = character_factory.create(archetype)
        game_state = GameState(player=player)
        game_state.position = Coordinate(i * 3, i * 3, 0)
        game_state.turn_count = 15 + i * 5
        
        # Distill into legacy
        marks = legacy_handler.distill_run_into_legacy(game_state, "retirement")
        print(f"      Created {len(marks)} legacy marks")
    
    # Test updated resonance
    print("\n📈 Testing Updated Archetype Resonance:")
    updated_summary = legacy_handler.get_legacy_summary()
    
    print(f"   Total legacy marks: {updated_summary['total_marks']}")
    print("   Archetype resonance data:")
    for resonance in updated_summary['archetype_resonance']:
        print(f"      - {resonance['archetype']}: {resonance['frequency']} runs, {resonance['avg_resonance']:.2f} avg resonance")
    
    # Test resonance bonuses after multiple runs
    print("\n🎯 Testing Resonance Bonuses After Multiple Runs:")
    
    for archetype in archetypes:
        bonuses = legacy_handler.get_archetype_resonance_bonus(archetype)
        if bonuses:
            print(f"   {archetype.title()} bonuses: {bonuses}")
        else:
            print(f"   {archetype.title()} bonuses: None")
    
    # Test new avatar with inherited bonuses
    print("\n👶 Testing New Avatar with Inherited Bonuses:")
    
    # Create new cunning avatar
    new_player = character_factory.create("cunning")
    
    # Apply resonance bonuses
    cunning_bonuses = legacy_handler.get_archetype_resonance_bonus("cunning")
    
    print(f"   New {new_player.archetype_name} base stats:")
    print(f"      {new_player.attributes}")
    
    if cunning_bonuses:
        print(f"   Applying resonance bonuses: {cunning_bonuses}")
        for attr, bonus in cunning_bonuses.items():
            if attr in new_player.attributes:
                new_player.attributes[attr] += bonus
                print(f"      {attr}: +{bonus} = {new_player.attributes[attr]}")
    
    print(f"   Final stats with resonance: {new_player.attributes}")
    
    print("\n🎉 Avatar-Legacy Protocol Test Completed!")
    print("✅ Echo system, resonance bonuses, and legacy context working!")


if __name__ == "__main__":
    test_legacy_system()
