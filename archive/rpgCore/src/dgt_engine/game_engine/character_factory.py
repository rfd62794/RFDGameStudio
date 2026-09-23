"""
Character Factory: Archetype Generation with Vector Tags

Handles character archetype generation with D&D stat arrays.
Maps personality types to stat distributions, skill proficiencies, and vector trait tags.

Phase 2: Vectorized World Engine Integration
"""

from typing import Dict, List, Optional
import random

from loguru import logger
from pydantic import BaseModel

from game_state import PlayerStats
from loot_system import Item
from vector_libraries.trait_library import TraitLibrary, TraitCategory


class Archetype(BaseModel):
    """Character archetype template with vector trait support."""
    name: str
    description: str
    stat_array: Dict[str, int]  # strength, dexterity, constitution, intelligence, wisdom, charisma
    skill_proficiencies: List[str]
    starting_inventory: List[str]
    personality_traits: List[str]
    vector_tags: List[str]  # Trait names for vector-based generation
    trait_categories: List[str]  # Categories to pull traits from


class CharacterFactory:
    """
    Factory for creating D&D-style character archetypes with vector traits.
    
    Generates characters with balanced stat arrays, appropriate skills,
    and procedurally generated trait combinations based on personality.
    """
    
    def __init__(self):
        """Initialize factory with archetype definitions and trait library."""
        self.archetypes = self._load_archetypes()
        self.skill_items = self._load_skill_items()
        self.trait_library = TraitLibrary()
        logger.info("Character Factory initialized with vector traits support")
    
    def _load_archetypes(self) -> Dict[str, Archetype]:
        """Load archetype definitions with vector trait support."""
        return {
            "curious": Archetype(
                name="The Explorer",
                description="Driven by insatiable curiosity, always seeking knowledge and new experiences.",
                stat_array={
                    "strength": 10,
                    "dexterity": 12,
                    "constitution": 10,
                    "intelligence": 16,
                    "wisdom": 12,
                    "charisma": 10
                },
                skill_proficiencies=["investigate", "perception", "search"],
                starting_inventory=["magnifying glass", "journal", "quill pen"],
                personality_traits=["inquisitive", "observant", "knowledge-seeking"],
                vector_tags=["curious", "observant"],
                trait_categories=["personality", "behavior"]
            ),
            
            "aggressive": Archetype(
                name="The Warrior",
                description="Fierce and direct, prefers action over words. Lives for combat and challenge.",
                stat_array={
                    "strength": 18,
                    "dexterity": 12,
                    "constitution": 14,
                    "intelligence": 10,
                    "wisdom": 10,
                    "charisma": 10
                },
                skill_proficiencies=["combat", "athletics", "force"],
                starting_inventory=["iron sword", "leather armor", "shield"],
                personality_traits=["bold", "direct", "combat-ready"],
                vector_tags=["aggressive", "brave"],
                trait_categories=["personality", "social"]
            ),
            
            "tactical": Archetype(
                name="The Strategist",
                description="Methodical and calculating, always thinking several steps ahead.",
                stat_array={
                    "strength": 12,
                    "dexterity": 14,
                    "constitution": 12,
                    "intelligence": 14,
                    "wisdom": 12,
                    "charisma": 12
                },
                skill_proficiencies=["finesse", "perception", "stealth"],
                starting_inventory=["dagger", "leather armor", "tactical map"],
                personality_traits=["analytical", "patient", "strategic"],
                vector_tags=["cautious", "methodical", "observant"],
                trait_categories=["personality", "behavior"]
            ),
            
            "chaotic": Archetype(
                name="The Wildcard",
                description="Unpredictable and impulsive, thrives in chaos and confusion.",
                stat_array={
                    "strength": 14,
                    "dexterity": 16,
                    "constitution": 10,
                    "intelligence": 10,
                    "wisdom": 10,
                    "charisma": 12
                },
                skill_proficiencies=["distract", "acrobatics", "stealth"],
                starting_inventory=["juggling balls", "disguise kit", "lockpicks"],
                personality_traits=["impulsive", "adaptable", "unpredictable"],
                vector_tags=["impulsive", "deceptive"],
                trait_categories=["personality", "behavior"]
            ),
            
            "cunning": Archetype(
                name="The Rogue",
                description="Sly and manipulative, excels at deception and stealth. Always has an angle.",
                stat_array={
                    "strength": 10,
                    "dexterity": 18,
                    "constitution": 10,
                    "intelligence": 12,
                    "wisdom": 10,
                    "charisma": 12
                },
                skill_proficiencies=["stealth", "finesse", "charm"],
                starting_inventory=["lockpicks", "black hood", "dagger"],
                personality_traits=["sly", "opportunistic", "deceptive"],
                vector_tags=["cunning", "deceptive", "quiet"],
                trait_categories=["personality", "behavior", "social"]
            ),
            
            "diplomatic": Archetype(
                name="The Diplomat",
                description="Charismatic and persuasive, excels at negotiation and social manipulation.",
                stat_array={
                    "strength": 10,
                    "dexterity": 12,
                    "constitution": 10,
                    "intelligence": 12,
                    "wisdom": 10,
                    "charisma": 18
                },
                skill_proficiencies=["charm", "persuade", "social"],
                starting_inventory=["formal clothes", "signet ring", "diplomatic papers"],
                personality_traits=["charming", "persuasive", "diplomatic"],
                vector_tags=["charismatic", "diplomatic", "respectful"],
                trait_categories=["personality", "social"]
            )
        }
    
    def _load_skill_items(self) -> Dict[str, Item]:
        """Load items that provide skill bonuses."""
        return {
            "magnifying glass": Item(
                name="Magnifying Glass",
                description="A polished lens that helps with detailed investigation.",
                target_stat="intelligence",
                modifier_value=2
            ),
            "iron sword": Item(
                name="Iron Sword",
                description="A well-balanced blade suitable for combat.",
                target_stat="strength",
                modifier_value=3
            ),
            "dagger": Item(
                name="Dagger",
                description="A sharp blade ideal for finesse attacks.",
                target_stat="dexterity",
                modifier_value=2
            ),
            "lockpicks": Item(
                name="Lockpicks",
                description="A set of fine tools for manipulating locks.",
                target_stat="dexterity",
                modifier_value=2
            ),
            "formal clothes": Item(
                name="Formal Clothes",
                description="Elegant attire that improves social interactions.",
                target_stat="charisma",
                modifier_value=2
            ),
            "signet ring": Item(
                name="Signet Ring",
                description="A ring that signifies authority and breeding.",
                target_stat="charisma",
                modifier_value=1
            )
        }
    
    def create(self, personality: str) -> PlayerStats:
        """
        Create a character based on personality archetype with vector traits.
        
        Args:
            personality: Archetype identifier
            
        Returns:
            PlayerStats object with archetype-appropriate attributes and vector traits
        """
        archetype = self.archetypes.get(personality.lower())
        if not archetype:
            logger.warning(f"Unknown archetype: {personality}. Using default.")
            archetype = self.archetypes["curious"]
        
        logger.info(f"Creating {archetype.name} archetype with vector traits")
        
        # Generate procedural traits based on archetype
        vector_traits = self._generate_vector_traits(archetype)
        
        # Create inventory items
        inventory = []
        for item_name in archetype.starting_inventory:
            item = self.skill_items.get(item_name)
            if item:
                inventory.append(item)
            else:
                # Create basic item if not in skill items
                from loot_system import Item
                basic_item = Item(
                    name=item_name,
                    description="A basic item",
                    target_stat="strength",  # Default to strength instead of luck
                    modifier_value=0
                )
                inventory.append(basic_item)
        
        # Create player stats
        player = PlayerStats(
            name=f"The {archetype.name}",
            attributes=archetype.stat_array,
            inventory=inventory,
            hp=100,
            max_hp=100,
            gold=50
        )
        
        # Store archetype info for reference
        player.archetype_name = archetype.name
        player.personality_traits = archetype.personality_traits
        player.skill_proficiencies = archetype.skill_proficiencies
        
        # Store vector traits for procedural generation
        player.vector_traits = vector_traits
        player.trait_description = self.trait_library.generate_trait_description(vector_traits)
        
        logger.info(f"Created {archetype.name} with {len(vector_traits)} vector traits")
        logger.info(f"Trait description: {player.trait_description}")
        
        return player
    
    def _generate_vector_traits(self, archetype: Archetype) -> List:
        """
        Generate procedural traits based on archetype vector tags and categories.
        
        Args:
            archetype: Archetype definition
            
        Returns:
            List of Trait objects
        """
        traits = []
        
        # Convert trait categories to TraitCategory enum
        category_map = {
            "personality": TraitCategory.PERSONALITY,
            "behavior": TraitCategory.BEHAVIOR,
            "social": TraitCategory.SOCIAL,
            "profession": TraitCategory.PROFESSION,
            "physical": TraitCategory.PHYSICAL,
            "motivation": TraitCategory.MOTIVATION
        }
        
        # Get categories for this archetype
        categories = [category_map.get(cat, TraitCategory.PERSONALITY) for cat in archetype.trait_categories]
        
        # Get random traits from specified categories
        base_traits = self.trait_library.get_random_traits(
            count=3,  # Base number of traits
            categories=categories
        )
        
        # Add specific vector tags if available
        for tag in archetype.vector_tags:
            trait = self.trait_library.get_trait(tag)
            if trait and trait not in base_traits:
                base_traits.append(trait)
        
        # Ensure we have at least 2 traits
        if len(base_traits) < 2:
            # Add random personality traits to fill gaps
            additional = self.trait_library.get_random_traits(
                count=2 - len(base_traits),
                categories=[TraitCategory.PERSONALITY]
            )
            base_traits.extend(additional)
        
        return base_traits[:4]  # Limit to 4 traits total
    
    def get_archetype_info(self, personality: str) -> Archetype:
        """Get archetype information without creating character."""
        return self.archetypes.get(personality.lower(), self.archetypes["curious"])
    
    def list_archetypes(self) -> List[str]:
        """List all available archetypes."""
        return list(self.archetypes.keys())
    
    def validate_stat_array(self, stats: Dict[str, int]) -> bool:
        """
        Validate that a stat array follows D&D balancing rules.
        
        Args:
            stats: Dictionary of stat names to values
            
        Returns:
            True if stats are valid and balanced
        """
        # Check for required stats
        required_stats = ["strength", "dexterity", "intelligence", "charisma"]
        if not all(stat in stats for stat in required_stats):
            return False
        
        # Check stat ranges (assuming 1-20 scale)
        for stat_name, stat_value in stats.items():
            if not (1 <= stat_value <= 20):
                return False
        
        # Check total point balance (adjust based on your point buy system)
        total_points = sum(stats.values())
        if not (40 <= total_points <= 80):  # Adjust range as needed
            return False
        
        return True


# Export for use by engine
__all__ = ["CharacterFactory"]
