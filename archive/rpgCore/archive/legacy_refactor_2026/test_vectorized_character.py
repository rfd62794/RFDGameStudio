#!/usr/bin/env python3
"""
Test script to verify vectorized character generation.
"""

import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from character_factory import CharacterFactory
from utils.baker_expanded import ExpandedBaker, AssetType
from vector_libraries.trait_library import TraitLibrary


def test_vectorized_character():
    """Test vectorized character generation with trait-based DNA."""
    print("🧬 Testing Vectorized Character Generation...")
    
    # Test character factory with vector traits
    character_factory = CharacterFactory()
    
    # Test different personalities
    personalities = ["curious", "cunning", "diplomatic", "aggressive"]
    
    for personality in personalities:
        print(f"\n🎭 Testing {personality.title()} archetype:")
        
        # Create character with vector traits
        player = character_factory.create(personality)
        
        print(f"   Name: {player.name}")
        print(f"   HP: {player.hp}/{player.max_hp} (CON: {player.attributes.get('constitution', 10)})")
        print(f"   Stats: {player.attributes}")
        print(f"   Skills: {', '.join(player.skill_proficiencies)}")
        
        # Check vector traits
        if hasattr(player, 'vector_traits'):
            print(f"   Vector Traits: {len(player.vector_traits)}")
            for trait in player.vector_traits:
                print(f"      - {trait.name}: {trait.description[:50]}...")
                print(f"        DC Mods: {trait.dc_modifiers}")
                print(f"        Keywords: {', '.join(trait.narrative_keywords)}")
        
        # Check trait description
        if hasattr(player, 'trait_description'):
            print(f"   Generated Description: {player.trait_description}")
        
        print("-" * 50)
    
    # Test trait library directly
    print("\n🧬 Testing Trait Library:")
    trait_library = TraitLibrary()
    
    # Test trait combination
    test_traits = trait_library.get_random_traits(3, ["personality", "behavior"])
    print(f"Random traits: {[t.name for t in test_traits]}")
    
    # Test trait description generation
    description = trait_library.generate_trait_description(test_traits)
    print(f"Combined description: {description}")
    
    # Test trait similarity
    if test_traits:
        query_vector = test_traits[0].vector
        similar = trait_library.find_similar_traits(query_vector, top_k=3)
        print(f"Traits similar to {test_traits[0].name}:")
        for trait, similarity in similar:
            print(f"  - {trait.name} (similarity: {similarity:.3f})")
    
    print("\n🎉 Vectorized Character Generation Test Completed!")


if __name__ == "__main__":
    test_vectorized_character()
