"""
Perception System: Information Density Filtering

Phase 4: Hierarchical Entity & Ecosystem Model
Implements perception tiers and fog of war based on distance and player stats.

ADR 018: Dynamic Entity Navigation & Perception Tiers Implementation
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import math

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate, WorldChunk
from dgt_engine.engine.game_state import GameState
from dgt_engine.logic.entity_ai import EntityAI, Entity


class PerceptionTier(Enum):
    """Perception tiers for information density."""
    NEAR = "near"      # Full JSON context (0-5 units)
    MID = "mid"        # Environmental signatures (5-15 units)
    FAR = "far"        # Static terrain (15+ units)
    UNKNOWN = "unknown"  # Beyond perception range


@dataclass
class EnvironmentalSignature:
    """Environmental signature detected at mid-range."""
    coordinate: Tuple[int, int]
    signature_type: str  # "smoke", "light", "sound", "movement"
    description: str
    intensity: float  # 0.0 to 1.0
    source_type: str  # "fire", "torch", "npc", "animal"


@dataclass
class PerceptionData:
    """Complete perception data for a coordinate."""
    tier: PerceptionTier
    coordinate: Tuple[int, int]
    chunk: Optional[WorldChunk]
    entities: List[Entity]
    signatures: List[EnvironmentalSignature]
    terrain: Optional[str]  # Static terrain type for far range
    visibility: float  # 0.0 to 1.0 based on conditions


class PerceptionSystem:
    """
    Perception system that filters world data based on distance and player stats.
    
    Implements the "Perception Fog" that controls information density
    based on distance from the player and their perception abilities.
    """
    
    def __init__(self, world_ledger: WorldLedger, entity_ai: EntityAI):
        """Initialize the perception system."""
        self.world_ledger = world_ledger
        self.entity_ai = entity_ai
        
        # Perception parameters
        self.base_perception_range = 15  # Base units of perception
        self.max_perception_range = 30   # Maximum with high stats
        
        # Environmental signature detection
        self.signature_detectors = self._initialize_detectors()
        
        logger.info("Perception System initialized with multi-tier filtering")
    
    def _initialize_detectors(self) -> Dict[str, Dict[str, Any]]:
        """Initialize environmental signature detectors."""
        return {
            "smoke": {
                "sources": ["fire", "torch", "campfire"],
                "detection_range": 10,
                "intensity_decay": 0.8
            },
            "light": {
                "sources": ["torch", "lantern", "magic_light"],
                "detection_range": 8,
                "intensity_decay": 0.7
            },
            "sound": {
                "sources": ["npc", "animal", "combat"],
                "detection_range": 12,
                "intensity_decay": 0.6
            },
            "movement": {
                "sources": ["npc", "animal", "merchant"],
                "detection_range": 6,
                "intensity_decay": 0.5
            }
        }
    
    def calculate_perception_range(self, player_stats: Dict[str, int]) -> int:
        """
        Calculate player's perception range based on stats.
        
        Args:
            player_stats: Player attribute dictionary
            
        Returns:
            Perception range in units
        """
        wisdom = player_stats.get("wisdom", 10)
        intelligence = player_stats.get("intelligence", 10)
        
        # Perception formula: base + WIS mod + INT mod
        wis_mod = (wisdom - 10) // 2
        int_mod = (intelligence - 10) // 2
        
        perception_range = self.base_perception_range + wis_mod + (int_mod // 2)
        
        return min(perception_range, self.max_perception_range)
    
    def get_perception_tier(self, distance: int, perception_range: int) -> PerceptionTier:
        """
        Determine perception tier based on distance.
        
        Args:
            distance: Distance to target
            perception_range: Player's perception range
            
        Returns:
            Perception tier for the distance
        """
        if distance <= 5:
            return PerceptionTier.NEAR
        elif distance <= 15:
            return PerceptionTier.MID
        elif distance <= perception_range:
            return PerceptionTier.FAR
        else:
            return PerceptionTier.UNKNOWN
    
    def perceive_coordinate(
        self, 
        coord: Coordinate, 
        player_pos: Coordinate, 
        player_stats: Dict[str, int],
        current_turn: int
    ) -> PerceptionData:
        """
        Get perception data for a specific coordinate.
        
        Args:
            coord: Coordinate to perceive
            player_pos: Player's current position
            player_stats: Player attributes
            current_turn: Current world turn
            
        Returns:
            Perception data for the coordinate
        """
        distance = player_pos.distance_to(coord)
        perception_range = self.calculate_perception_range(player_stats)
        tier = self.get_perception_tier(distance, perception_range)
        
        # Calculate visibility based on conditions
        visibility = self._calculate_visibility(coord, current_turn)
        
        if tier == PerceptionTier.NEAR:
            # Full context - get complete chunk data
            chunk = self.world_ledger.get_chunk(coord, current_turn)
            entity = self.entity_ai.get_entity_at(coord)
            entities = [entity] if entity else []
            signatures = []
            terrain = None
            
        elif tier == PerceptionTier.MID:
            # Environmental signatures only
            chunk = None
            entities = []
            signatures = self._detect_signatures(coord, current_turn)
            terrain = self._get_terrain_type(coord)
            
        elif tier == PerceptionTier.FAR:
            # Static terrain only
            chunk = None
            entities = []
            signatures = []
            terrain = self._get_terrain_type(coord)
            
        else:
            # Unknown - no information
            chunk = None
            entities = []
            signatures = []
            terrain = None
        
        return PerceptionData(
            tier=tier,
            coordinate=(coord.x, coord.y),
            chunk=chunk,
            entities=entities,
            signatures=signatures,
            terrain=terrain,
            visibility=visibility
        )
    
    def _calculate_visibility(self, coord: Coordinate, current_turn: int) -> float:
        """
        Calculate visibility based on environmental conditions.
        
        Args:
            coord: Coordinate to check
            current_turn: Current turn
            
        Returns:
            Visibility factor (0.0 to 1.0)
        """
        # Get chunk for environmental conditions
        chunk = self.world_ledger.get_chunk(coord, current_turn)
        
        visibility = 1.0  # Base visibility
        
        # Weather effects
        weather = chunk.environmental_state.get("weather", "clear")
        if weather == "foggy":
            visibility *= 0.6  # Fog reduces visibility
        elif weather == "rainy":
            visibility *= 0.8  # Rain reduces visibility
        
        # Time of day effects (if implemented)
        # For now, assume neutral
        
        # Terrain effects
        if "dark" in chunk.tags:
            visibility *= 0.5  # Dark areas reduce visibility
        elif "bright" in chunk.tags:
            visibility *= 1.2  # Bright areas increase visibility
        
        return min(1.0, max(0.1, visibility))
    
    def _detect_signatures(self, coord: Coordinate, current_turn: int) -> List[EnvironmentalSignature]:
        """
        Detect environmental signatures at mid-range.
        
        Args:
            coord: Coordinate to scan
            current_turn: Current turn
            
        Returns:
            List of detected signatures
        """
        signatures = []
        
        # Get nearby chunks to scan for signature sources
        nearby_chunks = self.world_ledger.get_nearby_chunks(coord, 5, current_turn)
        
        for chunk in nearby_chunks:
            chunk_coord = Coordinate(*chunk.coordinate)
            distance = coord.distance_to(chunk_coord)
            
            # Check for fire signatures
            if "on_fire" in chunk.environmental_state:
                intensity = 1.0 * (0.8 ** distance)  # Decay with distance
                signatures.append(EnvironmentalSignature(
                    coordinate=(chunk_coord.x, chunk_coord.y),
                    signature_type="smoke",
                    description=f"Pillar of smoke rising from {chunk.name}",
                    intensity=intensity,
                    source_type="fire"
                ))
            
            # Check for NPC signatures
            for npc in chunk.npcs:
                if npc.get("state") == "hostile":
                    intensity = 0.7 * (0.6 ** distance)
                    signatures.append(EnvironmentalSignature(
                        coordinate=(chunk_coord.x, chunk_coord.y),
                        signature_type="sound",
                        description=f"Aggressive sounds from {npc.get('name', 'Unknown')}",
                        intensity=intensity,
                        source_type="npc"
                    ))
            
            # Check for light sources
            if "torch" in chunk.tags or "lantern" in chunk.tags:
                intensity = 0.8 * (0.7 ** distance)
                signatures.append(EnvironmentalSignature(
                    coordinate=(chunk_coord.x, chunk_coord.y),
                    signature_type="light",
                    description=f"Flickering light from {chunk.name}",
                    intensity=intensity,
                    source_type="torch"
                ))
        
        # Filter by intensity threshold
        signatures = [s for s in signatures if s.intensity > 0.1]
        
        return signatures
    
    def _get_terrain_type(self, coord: Coordinate) -> Optional[str]:
        """
        Get static terrain type for far-range perception.
        
        Args:
            coord: Coordinate to check
            
        Returns:
            Terrain type string
        """
        # Get chunk for terrain information
        chunk = self.world_ledger.get_chunk(coord, 0)  # Use turn 0 for static data
        
        # Extract terrain type from tags
        if "mountain" in chunk.tags:
            return "mountain"
        elif "forest" in chunk.tags:
            return "forest"
        elif "water" in chunk.tags:
            return "water"
        elif "plains" in chunk.tags:
            return "plains"
        elif "desert" in chunk.tags:
            return "desert"
        elif "urban" in chunk.tags:
            return "urban"
        else:
            return "unknown"
    
    def get_perceived_world(
        self, 
        player_pos: Coordinate, 
        player_stats: Dict[str, int],
        current_turn: int
    ) -> Dict[str, Any]:
        """
        Get the complete perceived world from player's perspective.
        
        Args:
            player_pos: Player's current position
            player_stats: Player attributes
            current_turn: Current world turn
            
        Returns:
            Complete perception data
        """
        perception_range = self.calculate_perception_range(player_stats)
        
        # Collect perception data for all coordinates in range
        perceived_coords = {}
        
        # Scan in a square around player
        scan_radius = perception_range + 5  # Extra buffer for edge cases
        
        for dx in range(-scan_radius, scan_radius + 1):
            for dy in range(-scan_radius, scan_radius + 1):
                coord = Coordinate(player_pos.x + dx, player_pos.y + dy, current_turn)
                distance = player_pos.distance_to(coord)
                
                if distance <= perception_range:
                    perception_data = self.perceive_coordinate(coord, player_pos, player_stats, current_turn)
                    
                    if perception_data.tier != PerceptionTier.UNKNOWN:
                        coord_key = f"{coord.x},{coord.y}"
                        perceived_coords[coord_key] = perception_data
        
        # Organize by tier
        near_coords = {k: v for k, v in perceived_coords.items() if v.tier == PerceptionTier.NEAR}
        mid_coords = {k: v for k, v in perceived_coords.items() if v.tier == PerceptionTier.MID}
        far_coords = {k: v for k, v in perceived_coords.items() if v.tier == PerceptionTier.FAR}
        
        return {
            "player_position": (player_pos.x, player_pos.y),
            "perception_range": perception_range,
            "near_range": near_coords,
            "mid_range": mid_coords,
            "far_range": far_coords,
            "total_coords": len(perceived_coords),
            "visibility_factors": {
                coord_key: data.visibility for coord_key, data in perceived_coords.items()
            }
        }
    
    def format_perception_context(
        self, 
        player_pos: Coordinate, 
        player_stats: Dict[str, int],
        current_turn: int,
        max_tokens: int = 512
    ) -> str:
        """
        Format perception data into a context string for LLM consumption.
        
        Args:
            player_pos: Player's current position
            player_stats: Player attributes
            current_turn: Current world turn
            max_tokens: Maximum tokens for context
            
        Returns:
            Formatted context string
        """
        perceived_world = self.get_perceived_world(player_pos, player_stats, current_turn)
        
        context_parts = []
        
        # Current location
        current_coord_key = f"{player_pos.x},{player_pos.y}"
        if current_coord_key in perceived_world["near_range"]:
            current_chunk = perceived_world["near_range"][current_coord_key].chunk
            if current_chunk:
                context_parts.append(f"You are at {current_chunk.name}.")
                context_parts.append(current_chunk.description)
                
                # NPCs in current location
                if current_chunk.npcs:
                    npc_names = [npc["name"] for npc in current_chunk.npcs]
                    context_parts.append(f"People here: {', '.join(npc_names)}")
                
                # Items in current location
                if current_chunk.items:
                    item_names = [item["name"] for item in current_chunk.items]
                    context_parts.append(f"Items visible: {', '.join(item_names)}")
        
        # Nearby entities
        nearby_entities = []
        for coord_key, data in perceived_world["near_range"].items():
            if data.entities:
                for entity in data.entities:
                    if entity.current_pos.x != player_pos.x or entity.current_pos.y != player_pos.y:
                        distance = player_pos.distance_to(Coordinate(entity.current_pos.x, entity.current_pos.y, current_turn))
                        nearby_entities.append(f"{entity.name} ({distance} units away)")
        
        if nearby_entities:
            context_parts.append(f"Nearby: {', '.join(nearby_entities)}")
        
        # Mid-range signatures
        signatures = []
        for coord_key, data in perceived_world["mid_range"].items():
            for signature in data.signatures:
                distance = player_pos.distance_to(Coordinate(signature.coordinate[0], signature.coordinate[1], current_turn))
                signatures.append(f"{signature.description} ({distance} units away)")
        
        if signatures:
            context_parts.append(f"Distant signs: {'; '.join(signatures[:3])}")  # Limit to 3
        
        # Far-range terrain
        terrain_types = set()
        for coord_key, data in perceived_world["far_range"].items():
            if data.terrain:
                terrain_types.add(data.terrain)
        
        if terrain_types:
            context_parts.append(f"Visible terrain: {', '.join(sorted(terrain_types))}")
        
        # Join and limit length
        full_context = " ".join(context_parts)
        
        # Rough token estimation (4 chars per token)
        if len(full_context) > max_tokens * 4:
            # Truncate to fit token limit
            full_context = full_context[:max_tokens * 4] + "..."
        
        return full_context
    
    def get_radar_data(
        self, 
        player_pos: Coordinate, 
        player_stats: Dict[str, int],
        current_turn: int
    ) -> List[Dict[str, Any]]:
        """
        Get radar data for the Director's Monitor display.
        
        Args:
            player_pos: Player's current position
            player_stats: Player attributes
            current_turn: Current world turn
            
        Returns:
            List of radar blips
        """
        radar_blips = []
        perception_range = self.calculate_perception_range(player_stats)
        
        # Scan for entities and signatures
        for dx in range(-perception_range, perception_range + 1):
            for dy in range(-perception_range, perception_range + 1):
                coord = Coordinate(player_pos.x + dx, player_pos.y + dy, current_turn)
                distance = player_pos.distance_to(coord)
                
                if distance <= perception_range:
                    perception_data = self.perceive_coordinate(coord, player_pos, player_stats, current_turn)
                    
                    # Add entity blips
                    for entity in perception_data.entities:
                        if entity.current_pos.x != player_pos.x or entity.current_pos.y != player_pos.y:
                            radar_blips.append({
                                "type": "entity",
                                "name": entity.name,
                                "coordinate": (entity.current_pos.x, entity.current_pos.y),
                                "distance": distance,
                                "faction": entity.faction,
                                "state": entity.state.value if hasattr(entity.state, 'value') else str(entity.state),
                                "icon": "👤"
                            })
                    
                    # Add signature blips
                    for signature in perception_data.signatures:
                        radar_blips.append({
                            "type": "signature",
                            "name": signature.signature_type.title(),
                            "coordinate": signature.coordinate,
                            "distance": distance,
                            "intensity": signature.intensity,
                            "description": signature.description,
                            "icon": self._get_signature_icon(signature.signature_type)
                        })
        
        # Sort by distance
        radar_blips.sort(key=lambda x: x["distance"])
        
        return radar_blips[:10]  # Limit to 10 nearest blips
    
    def _get_signature_icon(self, signature_type: str) -> str:
        """Get icon for signature type."""
        icons = {
            "smoke": "💨",
            "light": "💡",
            "sound": "🔊",
            "movement": "👣"
        }
        return icons.get(signature_type, "❓")


# Export for use by game engine
__all__ = ["PerceptionSystem", "PerceptionTier", "EnvironmentalSignature", "PerceptionData"]
