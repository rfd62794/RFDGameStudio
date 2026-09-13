"""
Quartermaster: Procedural Loot Generation

The Quartermaster handles item drops from investigate actions.
Triggered when Arbiter succeeds on 'investigate' or 'force' intents.
"""

import random
from pydantic import BaseModel, Field
from loguru import logger
from typing import Literal, Optional, Dict, Any

from dgt_engine.game_engine.world_ledger import Coordinate
from dgt_engine.logic.artifacts import ArtifactGenerator, Artifact, ArtifactRarity

class Item(BaseModel):
    """A loot item with stats."""
    
    name: str = Field(description="Item name")
    description: str = Field(description="Flavorful description")
    stat_bonus: str = Field(default="", description="Human-readable stat modifier (e.g., '+1 Pierce', '+5 HP')")
    target_stat: Literal["strength", "dexterity", "intelligence", "charisma"] | None = Field(default=None, description="Stat this item boosts")
    modifier_value: int = Field(default=0, description="Numerical bonus value")
    value: int = Field(default=0, ge=0, description="Gold value")


class LootSystem:
    """
    Procedural loot generator with artifact lineage support.
    
    Design:
    - Deterministic (no AI) for speed
    - Context-aware (tavern items vs dungeon items)
    - Rarity-based (common, uncommon, rare)
    - Historical lineage through ArtifactGenerator integration
    """
    
    def __init__(self, world_ledger=None, faction_system=None):
        """Initialize loot tables with artifact generation."""
        self.tavern_loot = [
            Item(name="Dull Dirk", description="A rusty dagger with a chipped blade", stat_bonus="+1 Strength", target_stat="strength", modifier_value=1, value=5),
            Item(name="Ale-Soaked Rag", description="It smells terrible but might be useful", stat_bonus="", value=1),
            Item(name="Copper Coins", description="A small handful of tarnished copper", stat_bonus="", value=3),
            Item(name="Lucky Die", description="A six-sided die that always rolls 6", stat_bonus="+1 Charisma", target_stat="charisma", modifier_value=1, value=10),
            Item(name="Bent Fork", description="Surprisingly sharp", stat_bonus="+1 Strength", target_stat="strength", modifier_value=1, value=2),
            Item(name="Half-Eaten Cheese", description="Still good? Probably?", stat_bonus="+2 HP", value=1), # HP isn't a stat check, special case
        ]
        
        self.dungeon_loot = [
            Item(name="Iron Key", description="Rusty but functional", stat_bonus="+1 Dex (Lockpicking)", target_stat="dexterity", modifier_value=1, value=5),
            Item(name="Torch Stub", description="Burns for about 10 minutes", stat_bonus="+1 Int (Search)", target_stat="intelligence", modifier_value=1, value=2),
            Item(name="Skull Fragment", description="Creepy memento", stat_bonus="", value=1),
        ]
        
        # Initialize artifact generator if world systems are available
        self.artifact_generator = None
        if world_ledger and faction_system:
            self.artifact_generator = ArtifactGenerator(world_ledger, faction_system)
            logger.info("LootSystem initialized with artifact lineage support")
        else:
            logger.info("LootSystem initialized without artifact support")
    
    def generate_artifact_loot(self, coordinate: Coordinate, current_turn: int) -> Optional[Item]:
        """
        Generate a lineage artifact based on coordinate history.
        
        Args:
            coordinate: Location where item is found
            current_turn: Current world turn
            
        Returns:
            Item with artifact properties or None if generation fails
        """
        if not self.artifact_generator:
            return None
        
        # Choose a base item type
        base_items = ["sword", "axe", "bow", "dagger", "helmet", "armor", "shield", "ring", "amulet", "key"]
        base_item = random.choice(base_items)
        
        # Generate artifact
        artifact = self.artifact_generator.generate_artifact(coordinate, base_item, current_turn)
        
        if not artifact:
            return None
        
        # Convert artifact to Item
        stat_bonus = ""
        if artifact.bonuses:
            bonus_parts = []
            for stat, value in artifact.bonuses.items():
                if stat in ["strength", "dexterity", "intelligence", "charisma"]:
                    bonus_parts.append(f"+{value} {stat.title()}")
                elif stat == "gold":
                    bonus_parts.append(f"+{value} Gold")
            stat_bonus = ", ".join(bonus_parts)
        
        # Determine target stat from bonuses
        target_stat = None
        modifier_value = 0
        for stat in ["strength", "dexterity", "intelligence", "charisma"]:
            if stat in artifact.bonuses:
                target_stat = stat
                modifier_value = artifact.bonuses[stat]
                break
        
        return Item(
            name=artifact.name,
            description=artifact.description,
            stat_bonus=stat_bonus,
            target_stat=target_stat,
            modifier_value=modifier_value,
            value=artifact.value
        )
    
    def generate_loot(self, location: str = "tavern", intent: str = "investigate", coordinate: Optional[Coordinate] = None, current_turn: int = 0) -> Item | None:
        """
        Generate a random loot item with potential artifact lineage.
        
        Args:
            location: Current location (tavern, dungeon, etc.)
            intent: Action intent (investigate, force)
            coordinate: Location where loot is found
            current_turn: Current world turn
            
        Returns:
            Item if successful, None if no loot found
        """
        # 60% chance of finding something when investigating
        # 30% chance when using force (you break it)
        drop_chance = 0.6 if intent == "investigate" else 0.3
        
        if random.random() > drop_chance:
            logger.debug("No loot found")
            return None
        
        # 20% chance for artifact if coordinate is provided
        if coordinate and self.artifact_generator and random.random() < 0.2:
            artifact_item = self.generate_artifact_loot(coordinate, current_turn)
            if artifact_item:
                logger.info(f"Generated artifact: {artifact_item.name}")
                return artifact_item
        
        # Select loot table
        loot_table = self.tavern_loot if "tavern" in location.lower() else self.dungeon_loot
        
        item = random.choice(loot_table)
        logger.info(f"Loot generated: {item.name}")
        return item
