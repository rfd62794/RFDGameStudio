"""
World Ledger: Persistent Spatial-Temporal Database

Phase 3: Persistent World Implementation
Replaces room-based navigation with coordinate-based world persistence.

ADR 017: Spatial-Temporal Coordinate System Implementation
"""

import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np

from loguru import logger
from pydantic import BaseModel, Field


@dataclass
class Coordinate:
    """3D coordinate system (x, y, time)."""
    x: int
    y: int
    t: int = 0  # Time dimension (turns since epoch)
    
    def __hash__(self):
        return hash((self.x, self.y, self.t))
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y and self.t == other.t
    
    def distance_to(self, other: 'Coordinate') -> float:
        """Calculate Manhattan distance to another coordinate."""
        return abs(self.x - other.x) + abs(self.y - other.y)
    
    def to_tuple(self) -> Tuple[int, int, int]:
        """Convert to tuple for storage."""
        return (self.x, self.y, self.t)
    
    @classmethod
    def from_tuple(cls, coords: Tuple[int, int, int]) -> 'Coordinate':
        """Create from tuple."""
        return cls(x=coords[0], y=coords[1], t=coords[2])


class WorldChunk(BaseModel):
    """A chunk of the world at a specific coordinate."""
    
    coordinate: Tuple[int, int, int]  # (x, y, time)
    name: str
    description: str
    tags: List[str] = Field(default_factory=list)
    npcs: List[Dict[str, Any]] = Field(default_factory=list)
    items: List[Dict[str, Any]] = Field(default_factory=list)
    exits: Dict[str, Tuple[int, int]] = Field(default_factory=dict)  # direction -> (x, y)
    discovered_by: List[str] = Field(default_factory=list)  # Player IDs who discovered this chunk
    last_modified: int = Field(default=0)  # Turn when last modified
    environmental_state: Dict[str, Any] = Field(default_factory=dict)  # Fire, weather, etc.
    
    model_config = {"arbitrary_types_allowed": True}


class WorldLedger:
    """
    Persistent world database for coordinate-based world state.
    
    This is the "World Ledger" that ensures fill-ins stay in.
    Every coordinate that gets modified becomes a persistent record.
    """
    
    def __init__(self, save_path: Path = Path("data/world_ledger.sqlite")):
        """Initialize the world ledger with persistent storage."""
        self.save_path = save_path
        self.save_path.parent.mkdir(parents=True, exist_ok=True)
        
        # In-memory cache for loaded chunks
        self._chunk_cache: Dict[Tuple[int, int], WorldChunk] = {}
        
        # Blueprint definitions for procedural generation
        self._blueprints: Dict[str, Dict[str, Any]] = {}
        
        self._initialize_database()
        self._load_blueprints()
        
        logger.info(f"World Ledger initialized at {save_path}")
    
    def _initialize_database(self):
        """Initialize SQLite database for persistent storage."""
        with sqlite3.connect(self.save_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS world_chunks (
                    coordinate TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    last_modified INTEGER DEFAULT 0
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS world_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    turn INTEGER NOT NULL,
                    coordinate TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    event_data TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS entities (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    last_updated INTEGER DEFAULT 0
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS entity_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    turn INTEGER NOT NULL,
                    entity_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    from_coord TEXT NOT NULL,
                    to_coord TEXT NOT NULL,
                    event_data TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS historical_tags (
                    coordinate TEXT PRIMARY KEY,
                    tag TEXT NOT NULL,
                    epoch INTEGER NOT NULL,
                    event_type TEXT NOT NULL,
                    faction TEXT,
                    description TEXT NOT NULL,
                    intensity REAL NOT NULL,
                    decay_rate REAL NOT NULL,
                    world_state TEXT
                )
            """)
            
            conn.commit()
    
    def _load_blueprints(self):
        """Load procedural generation blueprints."""
        self._blueprints = {
            "tavern": {
                "name": "The Rusty Flagon",
                "description": "A dimly lit tavern filled with the smell of ale and roasted meat.",
                "base_tags": ["indoor", "social", "safe"],
                "npc_chance": 0.8,
                "possible_npcs": ["bartender", "guard", "merchant", "bard"],
                "item_chance": 0.3,
                "possible_items": ["coin", "mug", "knife"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "forest": {
                "name": "Dense Forest",
                "description": "Tall trees block out most of the sunlight. The air is thick with the smell of pine.",
                "base_tags": ["outdoor", "nature", "wild"],
                "npc_chance": 0.4,
                "possible_npcs": ["bandit", "hermit", "hunter", "animal"],
                "item_chance": 0.2,
                "possible_items": ["stick", "berry", "feather"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "plaza": {
                "name": "Town Plaza",
                "description": "A bustling open square surrounded by shops and stalls.",
                "base_tags": ["outdoor", "social", "urban"],
                "npc_chance": 0.9,
                "possible_npcs": ["merchant", "guard", "noble", "child"],
                "item_chance": 0.4,
                "possible_items": ["coin", "fruit", "craft"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "cave": {
                "name": "Dark Cave",
                "description": "A natural cave entrance beckons from the rocky hillside.",
                "base_tags": ["indoor", "dark", "dangerous"],
                "npc_chance": 0.6,
                "possible_npcs": ["goblin", "bear", "hermit", "bat"],
                "item_chance": 0.5,
                "possible_items": ["gem", "bone", "torch"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            },
            "shrine": {
                "name": "Ancient Shrine",
                "description": "Weathered stone pillars mark this sacred place.",
                "base_tags": ["outdoor", "sacred", "quiet"],
                "npc_chance": 0.3,
                "possible_npcs": ["priest", "pilgrim", "guardian"],
                "item_chance": 0.6,
                "possible_items": ["holy_water", "relic", "incense"],
                "exits": {"north": (0, 1), "south": (0, -1), "east": (1, 0), "west": (-1, 0)}
            }
        }
        
        logger.info(f"Loaded {len(self._blueprints)} world blueprints")
    
    def get_chunk(self, coord: Coordinate, current_turn: int) -> WorldChunk:
        """
        Get a world chunk, loading from database or generating procedurally.
        
        Args:
            coord: Coordinate to retrieve
            current_turn: Current world time
            
        Returns:
            WorldChunk at the specified coordinate
        """
        # Check cache first
        cache_key = (coord.x, coord.y)
        if cache_key in self._chunk_cache:
            chunk = self._chunk_cache[cache_key]
            # Update time dimension
            chunk.coordinate = (coord.x, coord.y, coord.t)
            return chunk
        
        # Try to load from database
        chunk = self._load_chunk_from_db(coord)
        
        if chunk is None:
            # Generate procedurally
            chunk = self._generate_chunk(coord, current_turn)
            # Save to database
            self._save_chunk_to_db(chunk)
        
        # Cache and return
        self._chunk_cache[cache_key] = chunk
        return chunk
    
    def _load_chunk_from_db(self, coord: Coordinate) -> Optional[WorldChunk]:
        """Load chunk from database."""
        with sqlite3.connect(self.save_path) as conn:
            cursor = conn.execute(
                "SELECT data FROM world_chunks WHERE coordinate = ?",
                (f"{coord.x},{coord.y}",)
            )
            row = cursor.fetchone()
            
            if row:
                data = json.loads(row[0])
                return WorldChunk(**data)
        
        return None
    
    def _save_chunk_to_db(self, chunk: WorldChunk):
        """Save chunk to database."""
        with sqlite3.connect(self.save_path) as conn:
            coord_key = f"{chunk.coordinate[0]},{chunk.coordinate[1]}"
            data = json.dumps(chunk.model_dump(), default=str)
            
            conn.execute("""
                INSERT OR REPLACE INTO world_chunks (coordinate, data, last_modified)
                VALUES (?, ?, ?)
            """, (coord_key, data, chunk.last_modified))
            
            conn.commit()
    
    def _generate_chunk(self, coord: Coordinate, current_turn: int) -> WorldChunk:
        """
        Generate a chunk procedurally based on blueprints.
        
        Uses coordinate-based seeding for consistency.
        """
        # Use coordinate as seed for deterministic generation
        seed = hash((coord.x, coord.y)) % len(self._blueprints)
        blueprint_names = list(self._blueprints.keys())
        blueprint_name = blueprint_names[seed]
        blueprint = self._blueprints[blueprint_name]
        
        # Create base chunk
        chunk = WorldChunk(
            coordinate=coord.to_tuple(),
            name=blueprint["name"],
            description=blueprint["description"],
            tags=blueprint["base_tags"].copy(),
            exits=blueprint["exits"].copy(),
            last_modified=current_turn
        )
        
        # Add procedural elements based on chances
        import random
        
        # Add NPCs
        if random.random() < blueprint["npc_chance"]:
            npc_count = random.randint(1, 3)
            for i in range(npc_count):
                npc_type = random.choice(blueprint["possible_npcs"])
                chunk.npcs.append({
                    "name": f"{npc_type.title()} {i+1}",
                    "type": npc_type,
                    "state": "neutral",
                    "disposition": 0
                })
        
        # Add items
        if random.random() < blueprint["item_chance"]:
            item_count = random.randint(1, 2)
            for i in range(item_count):
                item_type = random.choice(blueprint["possible_items"])
                chunk.items.append({
                    "name": item_type,
                    "description": f"A {item_type} found on the ground",
                    "value": random.randint(1, 10)
                })
        
        logger.debug(f"Generated {blueprint_name} chunk at ({coord.x}, {coord.y})")
        return chunk
    
    def update_chunk(self, coord: Coordinate, updates: Dict[str, Any], current_turn: int):
        """
        Update a chunk with new data and persist changes.
        
        Args:
            coord: Coordinate of chunk to update
            updates: Dictionary of updates to apply
            current_turn: Current world time
        """
        chunk = self.get_chunk(coord, current_turn)
        
        # Apply updates
        for key, value in updates.items():
            if hasattr(chunk, key):
                setattr(chunk, key, value)
            else:
                # Add to environmental state for custom properties
                chunk.environmental_state[key] = value
        
        # Update timestamp
        chunk.last_modified = current_turn
        
        # Save to database
        self._save_chunk_to_db(chunk)
        
        # Update cache
        cache_key = (coord.x, coord.y)
        self._chunk_cache[cache_key] = chunk
        
        # Log event
        self._log_event(current_turn, coord, "chunk_update", updates)
    
    def _log_event(self, turn: int, coord: Coordinate, event_type: str, event_data: Any):
        """Log a world event to the database."""
        with sqlite3.connect(self.save_path) as conn:
            conn.execute("""
                INSERT INTO world_events (turn, coordinate, event_type, event_data)
                VALUES (?, ?, ?, ?)
            """, (turn, f"{coord.x},{coord.y}", event_type, json.dumps(event_data, default=str)))
            
            conn.commit()
    
    def get_events_since(self, turn: int, coord: Optional[Coordinate] = None) -> List[Dict[str, Any]]:
        """
        Get world events since a specific turn.
        
        Args:
            turn: Starting turn to get events from
            coord: Optional coordinate to filter by location
            
        Returns:
            List of world events
        """
        with sqlite3.connect(self.save_path) as conn:
            if coord:
                cursor = conn.execute("""
                    SELECT turn, coordinate, event_type, event_data 
                    FROM world_events 
                    WHERE turn >= ? AND coordinate = ?
                    ORDER BY turn ASC
                """, (turn, f"{coord.x},{coord.y}"))
            else:
                cursor = conn.execute("""
                    SELECT turn, coordinate, event_type, event_data 
                    FROM world_events 
                    WHERE turn >= ?
                    ORDER BY turn ASC
                """, (turn,))
            
            events = []
            for row in cursor.fetchall():
                events.append({
                    "turn": row[0],
                    "coordinate": row[1],
                    "event_type": row[2],
                    "event_data": json.loads(row[3])
                })
            
            return events
    
    def discover_chunk(self, coord: Coordinate, player_id: str, current_turn: int):
        """
        Mark a chunk as discovered by a player.
        
        Args:
            coord: Coordinate to discover
            player_id: ID of player discovering it
            current_turn: Current world time
        """
        chunk = self.get_chunk(coord, current_turn)
        
        if player_id not in chunk.discovered_by:
            chunk.discovered_by.append(player_id)
            self._save_chunk_to_db(chunk)
            
            # Update cache
            cache_key = (coord.x, coord.y)
            self._chunk_cache[cache_key] = chunk
            
            # Log discovery event
            self._log_event(current_turn, coord, "discovery", {"player_id": player_id})
            
            logger.info(f"Player {player_id} discovered {chunk.name} at ({coord.x}, {coord.y})")
    
    def get_travel_time(self, from_coord: Coordinate, to_coord: Coordinate) -> int:
        """
        Calculate travel time between coordinates.
        
        Args:
            from_coord: Starting coordinate
            to_coord: Destination coordinate
            
        Returns:
            Travel time in turns
        """
        distance = from_coord.distance_to(to_coord)
        
        # Base travel time: 1 turn per unit distance
        base_time = distance
        
        # Terrain modifiers could be added here based on chunk tags
        # For now, return base time
        return max(1, base_time)
    
    def get_nearby_chunks(self, coord: Coordinate, radius: int, current_turn: int) -> List[WorldChunk]:
        """
        Get all chunks within a certain radius of a coordinate.
        
        Args:
            coord: Center coordinate
            radius: Search radius
            current_turn: Current world time
            
        Returns:
            List of nearby chunks
        """
        nearby_chunks = []
        
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                if dx == 0 and dy == 0:
                    continue  # Skip center coordinate
                
                nearby_coord = Coordinate(coord.x + dx, coord.y + dy, coord.t)
                chunk = self.get_chunk(nearby_coord, current_turn)
                nearby_chunks.append(chunk)
        
        return nearby_chunks
    
    def add_historical_tags_to_chunk(self, chunk: WorldChunk, coord: Coordinate):
        """
        Add historical tags to a chunk's metadata.
        
        Args:
            chunk: Chunk to modify
            coord: Coordinate of the chunk
        """
        tags = self.get_historical_tags(coord)
        
        # Add significant tags to chunk metadata
        for tag in tags:
            if tag["intensity"] > 0.3:  # Only significant tags
                chunk.tags.append(tag["tag"])
        
        return chunk
    
    def get_historical_tags(self, coord: Coordinate) -> List[Dict[str, Any]]:
        """
        Get historical tags for a coordinate.
        
        Args:
            coord: Coordinate to check
            
        Returns:
            List of historical tag data
        """
        with sqlite3.connect(self.save_path) as conn:
            cursor = conn.execute("""
                SELECT tag, epoch, event_type, faction, description, intensity, decay_rate
                FROM historical_tags
                WHERE coordinate = ?
                ORDER BY intensity DESC
            """, (f"{coord.x},{coord.y}",))
            
            tags = []
            for row in cursor.fetchall():
                tags.append({
                    "tag": row[0],
                    "epoch": row[1],
                    "event_type": row[2],
                    "faction": row[3],
                    "description": row[4],
                    "intensity": row[5],
                    "decay_rate": row[6]
                })
            
            return tags
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get world ledger statistics."""
        with sqlite3.connect(self.save_path) as conn:
            # Count chunks
            chunk_count = conn.execute("SELECT COUNT(*) FROM world_chunks").fetchone()[0]
            
            # Count events
            event_count = conn.execute("SELECT COUNT(*) FROM world_events").fetchone()[0]
            
            # Get oldest and newest events
            oldest = conn.execute("SELECT MIN(turn) FROM world_events").fetchone()[0]
            newest = conn.execute("SELECT MAX(turn) FROM world_events").fetchone()[0]
            
            return {
                "total_chunks": chunk_count,
                "total_events": event_count,
                "cached_chunks": len(self._chunk_cache),
                "oldest_event": oldest,
                "newest_event": newest
            }


# Export for use by game engine
__all__ = ["WorldLedger", "Coordinate", "WorldChunk"]
