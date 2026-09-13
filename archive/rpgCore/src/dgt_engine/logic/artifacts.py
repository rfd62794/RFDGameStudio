"""
Artifact System: Item Lineage & Context-Aware Loot

Phase 6: Complete Simulation Implementation
Creates named items based on coordinate history, faction control, and legacy events.

ADR 022: Item Lineage & Artifact Synthesis Implementation
"""

import sqlite3
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import json

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate
from dgt_engine.logic.faction_system import FactionSystem, FactionType


class ArtifactRarity(Enum):
    """Rarity levels for artifacts."""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class ArtifactType(Enum):
    """Types of artifacts with different behaviors."""
    WEAPON = "weapon"
    ARMOR = "armor"
    ACCESSORY = "accessory"
    CONSUMABLE = "consumable"
    KEY = "key"
    RELIC = "relic"
    TOOL = "tool"


class FactionAffinity(Enum):
    """Faction-based affinities for artifacts."""
    LEGION = "legion"      # +Strength, +Constitution
    CULT = "cult"          # +Intelligence, -HP
    TRADERS = "traders"    # +Charisma, +Gold
    NEUTRAL = "neutral"     # Balanced stats


@dataclass
class Artifact:
    """A named item with lineage and historical context."""
    id: str
    name: str
    base_name: str
    artifact_type: ArtifactType
    rarity: ArtifactRarity
    faction_affinity: FactionAffinity
    origin_coordinate: Tuple[int, int]
    origin_epoch: int
    origin_event: str
    description: str
    lineage: List[str]  # Historical events
    bonuses: Dict[str, int]  # Stat bonuses
    special_properties: List[str]  # Special abilities
    value: int
    durability: int = 100


class ArtifactGenerator:
    """
    Context-aware artifact generator that creates named items based on world history.
    
    Connects loot system to world ledger for item lineage and historical context.
    """
    
    def __init__(self, world_ledger: WorldLedger, faction_system: FactionSystem):
        """Initialize the artifact generator."""
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        
        # Initialize artifact templates
        self.base_items = self._load_base_items()
        self.faction_prefixes = self._load_faction_prefixes()
        self.epoch_suffixes = self._load_epoch_suffixes()
        self.event_modifiers = self._load_event_modifiers()
        self.special_properties = self._load_special_properties()
        
        logger.info("Artifact Generator initialized for context-aware loot")
    
    def _load_base_items(self) -> Dict[str, Dict[str, Any]]:
        """Load base item templates."""
        return {
            # Weapons
            "sword": {
                "type": ArtifactType.WEAPON,
                "base_value": 50,
                "base_stats": {"strength": 2},
                "description": "A well-crafted blade"
            },
            "axe": {
                "type": ArtifactType.WEAPON,
                "base_value": 40,
                "base_stats": {"strength": 3},
                "description": "A heavy chopping tool"
            },
            "bow": {
                "type": ArtifactType.WEAPON,
                "base_value": 35,
                "base_stats": {"dexterity": 2},
                "description": "A ranged weapon"
            },
            "dagger": {
                "type": ArtifactType.WEAPON,
                "base_value": 25,
                "base_stats": {"dexterity": 1},
                "description": "A small blade"
            },
            
            # Armor
            "helmet": {
                "type": ArtifactType.ARMOR,
                "base_value": 30,
                "base_stats": {"constitution": 1},
                "description": "Protective headgear"
            },
            "armor": {
                "type": ArtifactType.ARMOR,
                "base_value": 80,
                "base_stats": {"constitution": 3},
                "description": "Protective body covering"
            },
            "shield": {
                "type": ArtifactType.ARMOR,
                "base_value": 40,
                "base_stats": {"constitution": 2},
                "description": "A defensive barrier"
            },
            
            # Accessories
            "ring": {
                "type": ArtifactType.ACCESSORY,
                "base_value": 60,
                "base_stats": {"intelligence": 1, "wisdom": 1},
                "description": "A decorative band"
            },
            "amulet": {
                "type": ArtifactType.ACCESSORY,
                "base_value": 70,
                "base_stats": {"charisma": 2},
                "description": "A protective charm"
            },
            "belt": {
                "type": ArtifactType.ACCESSORY,
                "base_value": 35,
                "base_stats": {"strength": 1},
                "description": "A utility belt"
            },
            
            # Keys
            "key": {
                "type": ArtifactType.KEY,
                "base_value": 20,
                "base_stats": {},
                "description": "A metal key"
            },
            
            # Relics
            "idol": {
                "type": ArtifactType.RELIC,
                "base_value": 100,
                "base_stats": {"wisdom": 2},
                "description": "A religious icon"
            },
            "totem": {
                "type": ArtifactType.RELIC,
                "base_value": 120,
                "base_stats": {"intelligence": 1, "wisdom": 1},
                "description": "A spiritual object"
            },
            
            # Tools
            "tool": {
                "type": ArtifactType.TOOL,
                "base_value": 30,
                "base_stats": {"dexterity": 1},
                "description": "A useful implement"
            }
        }
    
    def _load_faction_prefixes(self) -> Dict[FactionAffinity, List[str]]:
        """Load faction-based name prefixes."""
        return {
            FactionAffinity.LEGION: [
                "Legionary", "Imperial", "Centurion's", "Praetorian", "Gladiator's",
                "Warlord's", "General's", "Commander's", "Soldier's", "Veteran's"
            ],
            FactionAffinity.CULT: [
                "Shadow", "Void", "Abyssal", "Occult", "Esoteric", "Forbidden",
                "Cursed", "Corrupted", "Blasphemous", "Sacrilegious", "Heretical"
            ],
            FactionAffinity.TRADERS: [
                "Merchant's", "Trader's", "Guildmaster's", "Gold", "Silver", "Platinum",
                "Prosperous", "Wealthy", "Commercial", "Exchange", "Market"
            ],
            FactionAffinity.NEUTRAL: [
                "Ancient", "Old", "Weathered", "Rusty", "Broken", "Forgotten",
                "Lost", "Abandoned", "Deserted", "Ruined", "Dilapidated"
            ]
        }
    
    def _load_epoch_suffixes(self) -> Dict[int, List[str]]:
        """Load epoch-based name suffixes."""
        return {
            1: ["of the First Age", "of the Beginning", "Primordial", "Original"],
            2: ["of the Second Age", "of the Expansion", "Colonial", "Settlement"],
            3: ["of the Third Age", "of the Conflict", "War-torn", "Battle-scarred"],
            4: ["of the Fourth Age", "of the Plague", "Diseased", "Infected"],
            5: ["of the Fifth Age", "of the Renaissance", "Renewed", "Reborn"],
            6: ["of the Sixth Age", "of the Empire", "Imperial", "Conquering"],
            7: ["of the Seventh Age", "of the Decline", "Fading", "Falling"],
            8: ["of the Eighth Age", "of the Ruin", "Collapsed", "Broken"],
            9: ["of the Ninth Age", "of the Mystery", "Unknown", "Forgotten"],
            10: ["of the Tenth Age", "of the Present", "Current", "Modern"]
        }
    
    def _load_event_modifiers(self) -> Dict[str, List[str]]:
        """Load event-based name modifiers."""
        return {
            "conflict": ["Bloodstained", "Battle-scarred", "War-torn", "Victorious", "Conquering"],
            "disaster": ["Scorched", "Burned", "Ruined", "Collapsed", "Destroyed"],
            "plague": ["Infected", "Diseased", "Contagious", "Tainted", "Corrupted"],
            "prosperity": ["Golden", "Blessed", "Fortunate", "Prosperous", "Thriving"],
            "renaissance": ["Renewed", "Reborn", "Restored", "Revitalized", "Revived"],
            "economic_boom": ["Wealthy", "Rich", "Opulent", "Luxurious", "Plentiful"],
            "magic_surge": ["Enchanted", "Magical", "Mystical", "Arcane", "Sorcerous"]
        }
    
    def _load_special_properties(self) -> Dict[str, List[str]]:
        """Load special properties for artifacts."""
        return {
            "weapon": ["flaming", "frost", "shocking", "venomous", "holy", "unholy"],
            "armor": ["fortified", "enchanted", "blessed", "cursed", "lightweight"],
            "accessory": ["charmed", "lucky", "unlucky", "protective", "amplifying"],
            "relic": ["sacred", "profane", "ancient", "forbidden", "mystical"],
            "key": ["master", "skeleton", "rusty", "golden", "silver"]
        }
    
    def generate_artifact(self, coordinate: Coordinate, base_item_name: str, current_turn: int) -> Optional[Artifact]:
        """
        Generate a named artifact based on coordinate history.
        
        Args:
            coordinate: Location where item is found
            base_item_name: Base type of item
            current_turn: Current world turn
            
        Returns:
            Generated artifact or None if generation fails
        """
        # Get coordinate history
        historical_context = self._get_coordinate_history(coordinate)
        
        if not historical_context:
            return None
        
        # Get base item template
        if base_item_name not in self.base_items:
            logger.warning(f"Unknown base item: {base_item_name}")
            return None
        
        base_template = self.base_items[base_item_name]
        
        # Determine artifact characteristics
        faction_affinity = self._determine_faction_affinity(coordinate, historical_context)
        rarity = self._determine_rarity(historical_context)
        origin_epoch = self._determine_origin_epoch(historical_context)
        origin_event = self._determine_origin_event(historical_context)
        
        # Generate name
        artifact_name = self._generate_artifact_name(
            base_item_name, faction_affinity, origin_epoch, origin_event
        )
        
        # Calculate bonuses
        bonuses = self._calculate_bonuses(base_template, faction_affinity, rarity)
        
        # Add special properties
        special_properties = self._add_special_properties(
            base_template["type"], rarity, origin_event
        )
        
        # Calculate value
        value = self._calculate_value(base_template, rarity, special_properties)
        
        # Generate lineage
        lineage = self._generate_lineage(historical_context)
        
        # Create artifact
        artifact = Artifact(
            id=f"artifact_{coordinate.x}_{coordinate.y}_{current_turn}",
            name=artifact_name,
            base_name=base_item_name,
            artifact_type=base_template["type"],
            rarity=rarity,
            faction_affinity=faction_affinity,
            origin_coordinate=(coordinate.x, coordinate.y),
            origin_epoch=origin_epoch,
            origin_event=origin_event,
            description=self._generate_description(artifact_name, historical_context),
            lineage=lineage,
            bonuses=bonuses,
            special_properties=special_properties,
            value=value
        )
        
        logger.info(f"Generated artifact: {artifact_name} at ({coordinate.x}, {coordinate.y})")
        return artifact
    
    def _get_coordinate_history(self, coordinate: Coordinate) -> List[Dict[str, Any]]:
        """Get historical context for a coordinate."""
        # Get historical tags
        historical_tags = self.world_ledger.get_historical_tags(coordinate)
        
        # Get faction control history
        control_history = self._get_faction_control_history(coordinate)
        
        # Get legacy echoes
        legacy_context = self.world_ledger.get_historical_tags(coordinate)
        
        # Combine all historical data
        history = []
        
        for tag in historical_tags:
            history.append({
                "type": "historical_tag",
                "epoch": tag["epoch"],
                "event": tag["event_type"],
                "description": tag["description"],
                "intensity": tag["intensity"]
            })
        
        for control in control_history:
            history.append({
                "type": "faction_control",
                "faction": control["faction"],
                "turn": control["turn"],
                "strength": control["strength"]
            })
        
        for context in legacy_context:
            history.append({
                "type": "legacy_echo",
                "description": context
            })
        
        return history
    
    def _get_faction_control_history(self, coordinate: Coordinate) -> List[Dict[str, Any]]:
        """Get faction control history for a coordinate."""
        with sqlite3.connect(self.faction_system.db_path) as conn:
            cursor = conn.execute("""
                SELECT faction_id, control_strength, acquired_turn, history
                FROM faction_territory
                WHERE coordinate = ?
                ORDER BY acquired_turn
            """, (f"{coordinate.x},{coordinate.y}",))
            
            history = []
            for row in cursor.fetchall():
                faction_id, strength, turn, history_json = row
                
                # Parse history
                try:
                    history_data = json.loads(history_json)
                except:
                    history_data = {}
                
                history.append({
                    "faction": faction_id,
                    "strength": strength,
                    "turn": turn,
                    "history": history_data
                })
            
            return history
    
    def _determine_faction_affinity(self, coordinate: Coordinate, history: List[Dict[str, Any]]) -> FactionAffinity:
        """Determine faction affinity based on coordinate history."""
        # Check for dominant faction control
        faction_control = [h for h in history if h["type"] == "faction_control"]
        
        if faction_control:
            # Get most recent faction
            latest_control = max(faction_control, key=lambda x: x["turn"])
            faction_id = latest_control["faction"]
            
            # Map faction to affinity
            if faction_id == "legion":
                return FactionAffinity.LEGION
            elif faction_id == "cult":
                return FactionAffinity.CULT
            elif faction_id == "traders":
                return FactionAffinity.TRADERS
        
        # Check for historical events
        historical_tags = [h for h in history if h["type"] == "historical_tag"]
        
        if historical_tags:
            # Get highest intensity tag
            strongest_tag = max(historical_tags, key=lambda x: x["intensity"])
            event_type = strongest_tag["event"]
            
            # Map events to affinities
            if event_type in ["conflict", "war"]:
                return FactionAffinity.LEGION
            elif event_type in ["plague", "disaster"]:
                return FactionAffinity.CULT
            elif event_type in ["prosperity", "economic_boom"]:
                return FactionAffinity.TRADERS
        
        return FactionAffinity.NEUTRAL
    
    def _determine_rarity(self, history: List[Dict[str, Any]]) -> ArtifactRarity:
        """Determine artifact rarity based on historical significance."""
        # Count significant events
        significant_events = 0
        
        for event in history:
            if event["type"] == "historical_tag":
                if event["intensity"] > 0.7:
                    significant_events += 2
                elif event["intensity"] > 0.5:
                    significant_events += 1
            elif event["type"] == "legacy_echo":
                significant_events += 1
        
        # Determine rarity based on significance
        if significant_events >= 5:
            return ArtifactRarity.LEGENDARY
        elif significant_events >= 3:
            return ArtifactRarity.EPIC
        elif significant_events >= 2:
            return ArtifactRarity.RARE
        elif significant_events >= 1:
            return ArtifactRarity.UNCOMMON
        else:
            return ArtifactRarity.COMMON
    
    def _determine_origin_epoch(self, history: List[Dict[str, Any]]) -> int:
        """Determine the epoch when the artifact originated."""
        # Find earliest historical event
        historical_tags = [h for h in history if h["type"] == "historical_tag"]
        
        if historical_tags:
            return min(h["epoch"] for h in historical_tags)
        
        return 1  # Default to first epoch
    
    def _determine_origin_event(self, history: List[Dict[str, Any]]) -> str:
        """Determine the event that created the artifact."""
        # Get most significant historical event
        historical_tags = [h for h in history if h["type"] == "historical_tag"]
        
        if historical_tags:
            most_significant = max(historical_tags, key=lambda x: x["intensity"])
            return most_significant["event"]
        
        return "unknown"
    
    def _generate_artifact_name(
        self, 
        base_name: str, 
        faction_affinity: FactionAffinity, 
        epoch: int, 
        event: str
    ) -> str:
        """Generate a descriptive artifact name."""
        # Get components
        prefixes = self.faction_prefixes.get(faction_affinity, [])
        suffixes = self.epoch_suffixes.get(epoch, [])
        modifiers = self.event_modifiers.get(event, [])
        
        # Build name
        parts = []
        
        # Add prefix (50% chance)
        if prefixes and random.random() < 0.5:
            parts.append(random.choice(prefixes))
        
        # Add base name
        parts.append(base_name.title())
        
        # Add modifier (30% chance)
        if modifiers and random.random() < 0.3:
            parts.append(random.choice(modifiers))
        
        # Add suffix (40% chance)
        if suffixes and random.random() < 0.4:
            parts.append(random.choice(suffixes))
        
        return " ".join(parts)
    
    def _calculate_bonuses(
        self, 
        base_template: Dict[str, Any], 
        faction_affinity: FactionAffinity, 
        rarity: ArtifactRarity
    ) -> Dict[str, int]:
        """Calculate stat bonuses for the artifact."""
        bonuses = base_template["base_stats"].copy()
        
        # Add faction affinity bonuses
        if faction_affinity == FactionAffinity.LEGION:
            bonuses["strength"] = bonuses.get("strength", 0) + 1
            bonuses["constitution"] = bonuses.get("constitution", 0) + 1
        elif faction_affinity == FactionAffinity.CULT:
            bonuses["intelligence"] = bonuses.get("intelligence", 0) + 2
            bonuses["wisdom"] = bonuses.get("wisdom", 0) + 1
        elif faction_affinity == FactionAffinity.TRADERS:
            bonuses["charisma"] = bonuses.get("charisma", 0) + 2
            # Add gold bonus
            bonuses["gold"] = bonuses.get("gold", 0) + 50
        
        # Add rarity multiplier
        rarity_multiplier = {
            ArtifactRarity.COMMON: 1,
            ArtifactRarity.UNCOMMON: 1.5,
            ArtifactRarity.RARE: 2,
            ArtifactRarity.EPIC: 3,
            ArtifactRarity.LEGENDARY: 5
        }
        
        multiplier = rarity_multiplier[rarity]
        
        for stat in bonuses:
            if stat != "gold":
                bonuses[stat] = int(bonuses[stat] * multiplier)
        
        return bonuses
    
    def _add_special_properties(
        self, 
        artifact_type: ArtifactType, 
        rarity: ArtifactRarity, 
        event: str
    ) -> List[str]:
        """Add special properties based on type, rarity, and event."""
        properties = []
        
        # Get base properties for type
        type_properties = self.special_properties.get(artifact_type.value, [])
        
        # Add properties based on rarity
        if rarity.value in ["rare", "epic", "legendary"]:
            if type_properties and random.random() < 0.5:
                properties.append(random.choice(type_properties))
        
        # Add event-based properties
        if event == "magic_surge":
            properties.append("enchanted")
        elif event == "plague":
            properties.append("tainted")
        elif event == "conflict":
            properties.append("battle-scarred")
        
        return properties
    
    def _calculate_value(
        self, 
        base_template: Dict[str, Any], 
        rarity: ArtifactRarity, 
        special_properties: List[str]
    ) -> int:
        """Calculate the monetary value of the artifact."""
        base_value = base_template["base_value"]
        
        # Rarity multiplier
        rarity_multipliers = {
            ArtifactRarity.COMMON: 1,
            ArtifactRarity.UNCOMMON: 2,
            ArtifactRarity.RARE: 5,
            ArtifactRarity.EPIC: 10,
            ArtifactRarity.LEGENDARY: 25
        }
        
        value = base_value * rarity_multipliers[rarity]
        
        # Add value for special properties
        value += len(special_properties) * 20
        
        return value
    
    def _generate_lineage(self, history: List[Dict[str, Any]]) -> List[str]:
        """Generate lineage description from historical context."""
        lineage = []
        
        for event in history[:5]:  # Show top 5 events
            if event["type"] == "historical_tag":
                lineage.append(f"Epoch {event['epoch']}: {event['description']}")
            elif event["type"] == "legacy_echo":
                lineage.append(f"Legacy: {event['description']}")
            elif event["type"] == "faction_control":
                faction = self.faction_system.factions.get(event["faction"])
                if faction:
                    lineage.append(f"Controlled by {faction.name} in turn {event['turn']}")
        
        return lineage
    
    def _generate_description(self, name: str, history: List[Dict[str, Any]]) -> str:
        """Generate a description for the artifact."""
        base_desc = f"This {name.lower()} carries the weight of history."
        
        if history:
            # Add context from most significant event
            historical_tags = [h for h in history if h["type"] == "historical_tag"]
            if historical_tags:
                most_significant = max(historical_tags, key=lambda x: x["intensity"])
                base_desc += f" It was present during the {most_significant['event']} of epoch {most_significant['epoch']}."
        
        return base_desc
    
    def get_artifact_lore(self, artifact: Artifact) -> str:
        """
        Get the lore description for an artifact.
        
        Args:
            artifact: The artifact to describe
            
        Returns:
            Formatted lore description
        """
        lore_parts = []
        
        # Name and type
        lore_parts.append(f"{artifact.name} - {artifact.artifact_type.value.title()}")
        
        # Rarity and value
        lore_parts.append(f"Rarity: {artifact.rarity.value.title()} (Value: {artifact.value} gold)")
        
        # Origin
        lore_parts.append(f"Origin: {artifact.origin_event.title()} in Epoch {artifact.origin_epoch}")
        lore_parts.append(f"Location: ({artifact.origin_coordinate[0]}, {artifact.origin_coordinate[1]})")
        
        # Faction affinity
        lore_parts.append(f"Affinity: {artifact.faction_affinity.value.title()}")
        
        # Bonuses
        if artifact.bonuses:
            bonus_str = ", ".join([f"+{stat}" for stat, val in artifact.bonuses.items()])
            lore_parts.append(f"Bonuses: {bonus_str}")
        
        # Special properties
        if artifact.special_properties:
            props_str = ", ".join(artifact.special_properties)
            lore_parts.append(f"Properties: {props_str}")
        
        # Lineage
        if artifact.lineage:
            lore_parts.append("Lineage:")
            for line in artifact.lineage:
                lore_parts.append(f"  - {line}")
        
        return "\n".join(lore_parts)


# Export for use by game engine
__all__ = ["ArtifactGenerator", "Artifact", "ArtifactRarity", "ArtifactType", "FactionAffinity"]
