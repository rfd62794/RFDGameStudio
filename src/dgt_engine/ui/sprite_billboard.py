"""
Sprite Billboarding System

Phase 12: Entity Silhouette Injection
Injects Shape Language characters into the 3D viewport for visual entity interaction.

ADR 029: Isometric "Ghosting" & Threat Depth
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from loguru import logger

# Import shape system
from .shape_avatar import ShapeAvatarGenerator, ShapeType


class BillboardType(Enum):
    """Types of billboard entities."""
    PLAYER = "player"
    NPC = "npc"
    GUARD = "guard"
    MERCHANT = "merchant"
    CULTIST = "cultist"
    ITEM = "item"
    STRUCTURE = "structure"


@dataclass
class BillboardEntity:
    """A billboard entity for rendering in the 3D viewport."""
    x: int
    y: int
    z: int
    entity_type: BillboardType
    shape_type: ShapeType
    ascii_char: str
    color: str
    distance: float
    is_hostile: bool = False
    level: int = 1
    hp: int = 100
    max_hp: int = 100
    stats: Dict[str, int] = None
    
    def __post_init__(self):
        if self.stats is None:
            self.stats = {"strength": 10, "dexterity": 10, "constitution": 10, "intelligence": 10, "wisdom": 10, "charisma": 10}


class SpriteBillboardSystem:
    """
    Sprite Billboarding System for entity visualization in 3D viewport.
    
    Injects shape-based ASCII characters into the raycasting view
    to make entities visible and interactive.
    """
    
    def __init__(self, world_ledger, faction_system=None):
        """Initialize the sprite billboard system."""
        self.world_ledger = world_ledger
        self.faction_system = faction_system
        self.shape_avatar = ShapeAvatarGenerator()
        
        # Billboard cache for performance
        self.billboard_cache = {}
        
        # Distance-based rendering settings
        self.max_billboard_distance = 15.0  # Maximum distance to show billboards
        self.min_billboard_distance = 1.0   # Minimum distance to show billboards
        
        # Shape mappings for entity types
        self.entity_shapes = {
            BillboardType.PLAYER: ShapeType.STAR,
            BillboardType.GUARD: ShapeType.SQUARE,
            BillboardType.MERCHANT: ShapeType.CIRCLE,
            BillboardType.CULTIST: ShapeType.TRIANGLE,
            BillboardType.ITEM: ShapeType.DIAMOND,
            BillboardType.STRUCTURE: ShapeType.SQUARE
        }
        
        # Color mappings
        self.entity_colors = {
            BillboardType.PLAYER: "bold green",
            BillboardType.GUARD: "bold red",
            BillboardType.MERCHANT: "bold yellow",
            BillboardType.CULTIST: "bold magenta",
            BillboardType.ITEM: "bold cyan",
            BillboardType.STRUCTURE: "white"
        }
        
        logger.info("Sprite Billboard System initialized")
    
    def get_billboard_at_coordinate(self, x: int, y: int, player_x: int, player_y: int, player_z: int = 0) -> Optional[BillboardEntity]:
        """
        Get billboard entity at a specific coordinate.
        
        Args:
            x: X coordinate
            y: Y coordinate
            player_x: Player X coordinate
            player_y: Player Y coordinate
            player_z: Player Z coordinate
            
        Returns:
            BillboardEntity or None if no entity at coordinate
        """
        # Calculate distance from player
        distance = ((x - player_x) ** 2 + (y - player_y) ** 2) ** 0.5
        
        # Skip if too far or too close
        if distance < self.min_billboard_distance or distance > self.max_billboard_distance:
            return None
        
        # Check cache first
        cache_key = (x, y)
        if cache_key in self.billboard_cache:
            return self.billboard_cache[cache_key]
        
        # Determine entity type at coordinate
        entity_type = self._determine_entity_type(x, y)
        
        if entity_type is None:
            return None
        
        # Create billboard entity
        billboard = self._create_billboard_entity(x, y, player_x, player_y, player_z, entity_type, distance)
        
        # Cache the billboard
        self.billboard_cache[cache_key] = billboard
        
        return billboard
    
    def _determine_entity_type(self, x: int, y: int) -> Optional[BillboardType]:
        """
        Determine the type of entity at a coordinate.
        
        Args:
            x: X coordinate
            y: Y coordinate
            
        Returns:
            BillboardType or None
        """
        # Check for player (this would be handled separately in the renderer)
        # Check for faction entities
        if self.faction_system:
            faction = self.faction_system.get_faction_at_coordinate((x, y))
            if faction:
                faction_id = faction.id if isinstance(faction.id, str) else str(faction.id)
                if faction_id == "legion":
                    return BillboardType.GUARD
                elif faction_id == "traders":
                    return BillboardType.MERCHANT
                elif faction_id == "cult":
                    return BillboardType.CULTIST
        
        # Check for historical items/structures
        historical_tags = self.world_ledger.get_historical_tags((x, y))
        if historical_tags:
            if any("well" in str(tag).lower() for tag in historical_tags):
                return BillboardType.STRUCTURE
            elif any("statue" in str(tag).lower() for tag in historical_tags):
                return BillboardType.STRUCTURE
            elif any("artifact" in str(tag).lower() for tag in historical_tags):
                return BillboardType.ITEM
        
        return None
    
    def _create_billboard_entity(self, x: int, y: int, player_x: int, player_y: int, player_z: int, 
                                 entity_type: BillboardType, distance: float) -> BillboardEntity:
        """
        Create a billboard entity with appropriate shape and stats.
        
        Args:
            x: X coordinate
            y: Y coordinate
            player_x: Player X coordinate
            player_y: Player Y coordinate
            player_z: Player Z coordinate
            entity_type: Type of entity
            distance: Distance from player
            
        Returns:
            BillboardEntity
        """
        # Get shape type for this entity
        shape_type = self.entity_shapes.get(entity_type, ShapeType.SQUARE)
        
        # Get base stats for this entity type
        base_stats = self._get_base_stats_for_entity_type(entity_type)
        
        # Generate ASCII character based on shape and distance
        ascii_char = self._generate_ascii_char(shape_type, distance)
        
        # Get color based on entity type and hostility
        color = self._get_entity_color(entity_type, base_stats)
        
        # Calculate Z coordinate (for height/depth)
        z = player_z + self._calculate_z_offset(entity_type, distance)
        
        # Determine hostility based on faction and stats
        is_hostile = self._determine_hostility(entity_type, base_stats)
        
        return BillboardEntity(
            x=x,
            y=y,
            z=z,
            entity_type=entity_type,
            shape_type=shape_type,
            ascii_char=ascii_char,
            color=color,
            distance=distance,
            is_hostile=is_hostile,
            level=base_stats.get("level", 1),
            hp=base_stats.get("hp", 100),
            max_hp=base_stats.get("max_hp", 100),
            stats=base_stats
        )
    
    def _get_base_stats_for_entity_type(self, entity_type: BillboardType) -> Dict[str, int]:
        """Get base stats for an entity type."""
        if entity_type == BillboardType.GUARD:
            return {
                "level": 1,
                "hp": 100,
                "max_hp": 100,
                "strength": 16,
                "dexterity": 12,
                "constitution": 15,
                "intelligence": 10,
                "wisdom": 8,
                "charisma": 10
            }
        elif entity_type == BillboardType.MERCHANT:
            return {
                "level": 1,
                "hp": 80,
                "max_hp": 80,
                "strength": 10,
                "dexterity": 12,
                "constitution": 12,
                "intelligence": 14,
                "wisdom": 12,
                "charisma": 16
            }
        elif entity_type == BillboardType.CULTIST:
            return {
                "level": 1,
                "hp": 90,
                "max_hp": 90,
                "strength": 8,
                "dexterity": 14,
                "constitution": 10,
                "intelligence": 16,
                "wisdom": 18,
                "charisma": 12
            }
        else:
            return {
                "level": 1,
                "hp": 100,
                "max_hp": 100,
                "strength": 10,
                "dexterity": 10,
                "constitution": 10,
                "intelligence": 10,
                "wisdom": 10,
                "charisma": 10
            }
    
    def _generate_ascii_char(self, shape_type: ShapeType, distance: float) -> str:
        """
        Generate ASCII character based on shape and distance.
        
        Args:
            shape_type: Shape type of the entity
            distance: Distance from player
            
        Returns:
            ASCII character
        """
        # Distance-based character selection
        if distance < 3.0:
            # Close range - detailed shape
            shape_chars = {
                ShapeType.CIRCLE: "○",
                ShapeType.SQUARE: "■",
                ShapeType.TRIANGLE: "▲",
                ShapeType.DIAMOND: "◊",
                ShapeType.CROSS: "✚",
                ShapeType.STAR: "✦"
            }
        elif distance < 8.0:
            # Medium range - simplified shape
            shape_chars = {
                ShapeType.CIRCLE: "●",
                ShapeType.SQUARE: "▪",
                ShapeType.TRIANGLE: "△",
                ShapeType.DIAMOND: "◈",
                ShapeType.CROSS: "+",
                ShapeType.STAR: "✶"
            }
        else:
            # Far range - primitive shape
            shape_chars = {
                ShapeType.CIRCLE: "•",
                ShapeType.SQUARE: "▪",
                ShapeType.TRIANGLE: "▲",
                ShapeType.DIAMOND: "◊",
                ShapeType.CROSS: "+",
                ShapeType.STAR: "✦"
            }
        
        return shape_chars.get(shape_type, "?")
    
    def _get_entity_color(self, entity_type: BillboardType, stats: Dict[str, int]) -> str:
        """
        Get color for an entity based on type and stats.
        
        Args:
            entity_type: Type of entity
            stats: Entity stats
            
        Returns:
            Color string
        """
        base_color = self.entity_colors.get(entity_type, "white")
        
        # Modify color based on hostility
        if self._determine_hostility(entity_type, stats):
            return "bold red"  # Hostile entities are red
        
        # Modify color based on level
        level = stats.get("level", 1)
        if level >= 3:
            return f"bold {base_color.split()[-1]}"  # High level entities are bold
        elif level <= 1:
            return f"dim {base_color.split()[-1]}"   # Low level entities are dim
        
        return base_color
    
    def _determine_hostility(self, entity_type: BillboardType, stats: Dict[str, int]) -> bool:
        """
        Determine if an entity is hostile.
        
        Args:
            entity_type: Type of entity
            stats: Entity stats
            
        Returns:
            True if hostile
        """
        if entity_type == BillboardType.GUARD:
            # Guards are hostile if player reputation is low
            # This would need access to game state reputation
            return False  # Placeholder - would check reputation
        elif entity_type == BillboardType.CULTIST:
            # Cultists are always hostile to outsiders
            return True
        else:
            return False
    
    def _calculate_z_offset(self, entity_type: BillboardType, distance: float) -> int:
        """
        Calculate Z offset for entity height/depth.
        
        Args:
            entity_type: Type of entity
            distance: Distance from player
            
        Returns:
            Z offset
        """
        # Different entity types have different heights
        height_map = {
            BillboardType.PLAYER: 0,      # Player at eye level
            BillboardType.GUARD: 0,      # Guards at eye level
            BillboardType.MERCHANT: 0,   # Merchants at eye level
            BillboardType.CULTIST: 0,    # Cultists at eye level
            BillboardType.ITEM: -1,      # Items are on ground
            BillboardType.STRUCTURE: 2   # Structures are tall
        }
        
        return height_map.get(entity_type, 0)
    
    def clear_cache(self) -> None:
        """Clear the billboard cache."""
        self.billboard_cache.clear()
        logger.info("Billboard cache cleared")
    
    def get_billboard_summary(self, player_x: int, player_y: int) -> Dict[str, Any]:
        """Get summary of billboards near the player."""
        nearby_billboards = []
        
        # Check coordinates around player
        for dx in range(-5, 6):
            for dy in range(-5, 6):
                x, y = player_x + dx, player_y + dy
                billboard = self.get_billboard_at_coordinate(x, y, player_x, player_y)
                if billboard:
                    nearby_billboards.append(billboard)
        
        return {
            "total_billboards": len(nearby_billboards),
            "hostile_count": sum(1 for b in nearby_billboards if b.is_hostile),
            "entities": [
                {
                    "type": b.entity_type.value,
                    "position": (b.x, b.y),
                    "distance": b.distance,
                    "level": b.level,
                    "hp": b.hp,
                    "max_hp": b.max_hp,
                    "is_hostile": b.is_hostile
                }
                for b in nearby_billboards
            ]
        }


# Export for use by other modules
__all__ = ["SpriteBillboardSystem", "BillboardEntity", "BillboardType"]
