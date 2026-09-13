"""
Scenic Anchor - Pre-Baked Narrative Scaffolding for DGT Perfect Simulator

This service provides deterministic narrative scaffolding for the Chronicler.
It acts as the "Prop Master" that ensures the LLM always has accurate
physical context about the current location.

ADR 052: Deterministic Narrative Scaffolding
- 70% Pre-Baked Metadata (Deterministic) + 30% LLM Prose (Heuristic)
- Eliminates hallucination and validation failures
- Provides instant fallbacks for continuous movie experience
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Set
from enum import Enum
import logging

logger = logging.getLogger(__name__)


@dataclass
class LocationMetadata:
    """Pre-baked metadata for a location."""
    location_id: str
    name: str
    atmosphere: str  # Sensory atmosphere description
    key_objects: List[str]  # Notable objects in this location
    sensory_tags: List[str]  # Sensory keywords for LLM
    ambient_sounds: List[str]  # Background sounds
    lighting: str  # Lighting conditions
    smells: List[str]  # Notable smells
    state_hint: str  # Contextual state hint


class ScenicAnchor:
    """
    The Scenic Anchor service - Pre-Baked Narrative Scaffolding
    
    Provides deterministic context for the Chronicler to ensure
    narrative continuity and eliminate hallucination.
    """
    
    def __init__(self):
        """Initialize the Scenic Anchor with pre-baked location data."""
        self.location_registry: Dict[str, LocationMetadata] = {}
        self._initialize_location_data()
        logger.info("🎬 Scenic Anchor initialized with pre-baked narrative scaffolding")
    
    def _initialize_location_data(self) -> None:
        """Initialize pre-baked location metadata from the world design."""
        
        # Town Square
        self.location_registry["town_square"] = LocationMetadata(
            location_id="town_square",
            name="Town Square",
            atmosphere="Bustling town center with cobblestone paths and merchant stalls",
            key_objects=["Town Well", "Merchant Stalls", "Guard Post", "Notice Board"],
            sensory_tags=["cobblestone", "bustling", "merchant", "guards", "sunlight", "crowd"],
            ambient_sounds=["merchant calls", "distant blacksmith", "crowd chatter", "horse hooves"],
            lighting="Bright daylight with long shadows from buildings",
            smells=["fresh bread", "horse manure", "metallic tang from blacksmith", "spices from stalls"],
            state_hint="The Voyager is standing in the center of town activity"
        )
        
        # Tavern Interior
        self.location_registry["tavern_interior"] = LocationMetadata(
            location_id="tavern_interior",
            name="Tavern Interior",
            atmosphere="Dim, cozy tavern smelling of roasted malt and woodsmoke, with warm hearth light dancing on ancient wooden beams",
            key_objects=["Iron Chest", "Oak Bar", "Heavy Door", "Hearth", "Wooden Tables", "Ancient Runes"],
            sensory_tags=["dim", "warm", "woodsmoke", "malt", "iron", "oak", "hearth", "flickering", "ancient", "runes", "cozy"],
            ambient_sounds=["crackling fire", "mug clinking", "low conversation", "door creaks", "barrel tapping"],
            lighting="Dim interior with flickering hearth light and candle glow, creating long shadows",
            smells=["roasted malt", "woodsmoke", "old wood", "spilled ale", "meat stew", "ancient parchment"],
            state_hint="The Voyager has just entered through the heavy oak door, the warmth of the hearth beckoning"
        )
        
        # Forest Path
        self.location_registry["forest_path"] = LocationMetadata(
            location_id="forest_path",
            name="Forest Path",
            atmosphere="Dense forest path with dappled sunlight and ancient trees",
            key_objects=["Ancient Oak", "Hidden Chest", "Forest Stream", "Stone Markers"],
            sensory_tags=["dense", "forest", "ancient", "dappled", "mossy", "rustling", "earth"],
            ambient_sounds=["bird calls", "wind through leaves", "rustling undergrowth", "distant stream"],
            lighting="Dappled sunlight filtering through dense canopy",
            smells=["damp earth", "pine needles", "decaying leaves", "wildflowers"],
            state_hint="The Voyager is walking along a narrow forest trail"
        )
        
        logger.info(f"🎬 Loaded {len(self.location_registry)} pre-baked location metadata entries")
    
    def get_location_metadata(self, location_id: str) -> Optional[LocationMetadata]:
        """
        Get pre-baked metadata for a location.
        
        Args:
            location_id: The location identifier
            
        Returns:
            LocationMetadata or None if not found
        """
        return self.location_registry.get(location_id.lower())
    
    def get_location_by_name(self, name: str) -> Optional[LocationMetadata]:
        """
        Get location metadata by name (case-insensitive).
        
        Args:
            name: The location name
            
        Returns:
            LocationMetadata or None if not found
        """
        for metadata in self.location_registry.values():
            if metadata.name.lower() == name.lower():
                return metadata
        return None
    
    def build_narrative_context(self, location_id: str) -> str:
        """
        Build the narrative context block for the Chronicler.
        
        This creates the pre-baked scaffolding that guides the LLM's
        narrative generation while still allowing creative prose.
        
        Args:
            location_id: The location identifier
            
        Returns:
            Formatted narrative context string
        """
        metadata = self.get_location_metadata(location_id)
        if not metadata:
            return "[LOCATION]: Unknown Area\n[ATMOSPHERE]: Undefined space\n[KEY_OBJECTS]: None"
        
        context = f"[LOCATION]: {metadata.name}\n"
        context += f"[ATMOSPHERE]: {metadata.atmosphere}\n"
        context += f"[KEY_OBJECTS]: {', '.join(metadata.key_objects)}\n"
        context += f"[LIGHTING]: {metadata.lighting}\n"
        context += f"[SMELLS]: {', '.join(metadata.smells)}\n"
        context += f"[SOUNDS]: {', '.join(metadata.ambient_sounds)}\n"
        context += f"[STATE]: {metadata.state_hint}\n"
        context += f"[TAGS]: {', '.join(metadata.sensory_tags)}"
        
        return context
    
    def get_fallback_description(self, location_id: str) -> str:
        """
        Get instant fallback description for continuous movie experience.
        
        Args:
            location_id: The location identifier
            
        Returns:
            Fallback narrative description
        """
        metadata = self.get_location_metadata(location_id)
        if not metadata:
            return "You are in an undefined location."
        
        # Build deterministic fallback
        fallback = f"You are in {metadata.name}. {metadata.atmosphere}. "
        
        if metadata.key_objects:
            fallback += f"You can see {', '.join(metadata.key_objects[:3])}. "
        
        if metadata.smells:
            fallback += f"The air smells of {', '.join(metadata.smells[:2])}."
        
        return fallback
    
    def get_sensory_enrichment(self, location_id: str) -> Dict[str, List[str]]:
        """
        Get sensory enrichment data for a location.
        
        Args:
            location_id: The location identifier
            
        Returns:
            Dictionary of sensory categories and their keywords
        """
        metadata = self.get_location_metadata(location_id)
        if not metadata:
            return {}
        
        return {
            "sights": metadata.sensory_tags,
            "sounds": metadata.ambient_sounds,
            "smells": metadata.smells,
            "objects": metadata.key_objects
        }
    
    def validate_location_context(self, location_id: str) -> bool:
        """
        Validate that a location has complete narrative scaffolding.
        
        Args:
            location_id: The location identifier
            
        Returns:
            True if location has complete metadata
        """
        metadata = self.get_location_metadata(location_id)
        if not metadata:
            return False
        
        # Check required fields
        required_fields = [
            metadata.atmosphere,
            metadata.key_objects,
            metadata.sensory_tags,
            metadata.lighting,
            metadata.smells
        ]
        
        return all(field for field in required_fields if field)


# Global scenic anchor instance
_scenic_anchor: Optional[ScenicAnchor] = None


def get_scenic_anchor() -> ScenicAnchor:
    """Get the global scenic anchor instance."""
    global _scenic_anchor
    if _scenic_anchor is None:
        _scenic_anchor = ScenicAnchor()
    return _scenic_anchor


def create_scenic_anchor() -> ScenicAnchor:
    """Create a new scenic anchor instance."""
    return ScenicAnchor()
