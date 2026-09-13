"""
Entity AI: Dynamic Non-Player Agency

Phase 4: Hierarchical Entity & Ecosystem Model
Implements deterministic NPC movement, goals, and behaviors across the coordinate grid.

ADR 018: Dynamic Entity Navigation & Perception Tiers Implementation
"""

import sqlite3
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import random
from pathlib import Path
import json

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate
from dgt_engine.engine.game_state import GameState, NPC


class EntityState(Enum):
    """Entity behavioral states."""
    IDLE = "idle"
    PATROLLING = "patrolling"
    TRADING = "trading"
    FLEEING = "fleeing"
    HUNTING = "hunting"
    GUARDING = "guarding"
    TRAVELING = "traveling"
    RESTING = "resting"
    WORKING = "working"
    SOCIALIZE = "socialize"  # Added for noble entities


class EntityGoal(Enum):
    """Entity primary goals."""
    MAINTAIN_POST = "maintain_post"  # Guards stay at their post
    TRADE_GOODS = "trade_goods"  # Merchants travel between markets
    SURVIVE = "survive"  # Animals and hostile entities seek safety
    HUNT_TARGET = "hunt_target"  # Predators hunt prey
    FLEE_DANGER = "flee_danger"  # Civilians flee from threats
    EXPLORE = "explore"  # Adventurers explore new areas
    SOCIALIZE = "socialize"  # Social NPCs seek interaction


@dataclass
class Entity:
    """A dynamic entity that can move across the world grid."""
    
    id: str
    name: str
    type: str  # "human", "animal", "monster", "spirit"
    current_pos: Coordinate
    home_pos: Coordinate  # Origin/anchor position
    state: EntityState
    goal: EntityGoal
    attributes: Dict[str, int]  # STR, DEX, CON, INT, WIS, CHA
    faction: str  # "law", "underworld", "clergy", "wild", "merchant"
    movement_speed: float  # Units per turn
    perception_range: int  # Detection range in units
    last_moved: int = 0  # Turn when last moved
    path: List[Coordinate] = None  # Current movement path
    target_entity: Optional[str] = None  # Entity being tracked
    inventory: List[Dict[str, Any]] = None  # Entity inventory
    relationships: Dict[str, int] = None  # Entity relationships
    
    def __post_init__(self):
        if self.path is None:
            self.path = []
        if self.inventory is None:
            self.inventory = []
        if self.relationships is None:
            self.relationships = {}


class EntityAI:
    """
    Deterministic AI system for entity movement and behavior.
    
    This is the "Entity Heartbeat" that updates NPC positions
    and states based on their goals and world conditions.
    """
    
    def __init__(self, world_ledger: WorldLedger, db_path: Path = Path("data/entities.sqlite")):
        """Initialize the Entity AI system."""
        self.world_ledger = world_ledger
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        # In-memory entity cache
        self._entities: Dict[str, Entity] = {}
        
        # Movement patterns and behaviors
        self._movement_patterns = self._initialize_patterns()
        
        self._initialize_database()
        self._load_entities()
        
        logger.info("Entity AI initialized with dynamic entity support")
    
    def _initialize_database(self):
        """Initialize SQLite database for entity tracking."""
        with sqlite3.connect(self.db_path) as conn:
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
            
            conn.commit()
    
    def _initialize_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Initialize movement patterns for different entity types."""
        return {
            "guard": {
                "movement_speed": 1.0,
                "perception_range": 8,
                "patrol_radius": 3,
                "states": [EntityState.PATROLLING, EntityState.GUARDING, EntityState.IDLE],
                "goals": [EntityGoal.MAINTAIN_POST]
            },
            "merchant": {
                "movement_speed": 0.8,
                "perception_range": 6,
                "trade_radius": 15,
                "states": [EntityState.TRAVELING, EntityState.TRADING, EntityState.RESTING],
                "goals": [EntityGoal.TRADE_GOODS]
            },
            "bandit": {
                "movement_speed": 1.2,
                "perception_range": 10,
                "hunt_radius": 20,
                "states": [EntityState.HUNTING, EntityState.FLEEING, EntityState.IDLE],
                "goals": [EntityGoal.SURVIVE, EntityGoal.HUNT_TARGET]
            },
            "animal": {
                "movement_speed": 1.5,
                "perception_range": 6,
                "territory_radius": 5,
                "states": [EntityState.IDLE, EntityState.FLEEING, EntityState.HUNTING],
                "goals": [EntityGoal.SURVIVE, EntityGoal.FLEE_DANGER]
            },
            "noble": {
                "movement_speed": 0.6,
                "perception_range": 5,
                "social_radius": 10,
                "states": [EntityState.IDLE, EntityState.SOCIALIZE, EntityState.TRAVELING, EntityState.RESTING],
                "goals": [EntityGoal.SOCIALIZE]
            }
        }
    
    def _load_entities(self):
        """Load entities from database or create default ones."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT data FROM entities")
            rows = cursor.fetchall()
            
            if rows:
                # Load existing entities
                for row in rows:
                    entity_data = json.loads(row[0])
                    # Convert coordinate dict back to Coordinate object
                    if isinstance(entity_data.get("current_pos"), dict):
                        entity_data["current_pos"] = Coordinate(**entity_data["current_pos"])
                    if isinstance(entity_data.get("home_pos"), dict):
                        entity_data["home_pos"] = Coordinate(**entity_data["home_pos"])
                    
                    entity = Entity(**entity_data)
                    self._entities[entity.id] = entity
            else:
                # Create default entities
                self._create_default_entities()
        
        logger.info(f"Loaded {len(self._entities)} entities")
    
    def _create_default_entities(self):
        """Create default entities for the world."""
        default_entities = [
            Entity(
                id="guard_tavern_1",
                name="Guard Captain Marcus",
                type="human",
                current_pos=Coordinate(0, 0, 0),
                home_pos=Coordinate(0, 0, 0),
                state=EntityState.PATROLLING,
                goal=EntityGoal.MAINTAIN_POST,
                attributes={"strength": 14, "dexterity": 12, "constitution": 13, "intelligence": 10, "wisdom": 11, "charisma": 10},
                faction="law",
                movement_speed=1.0,
                perception_range=8,
                last_moved=0,
                path=[],
                target_entity=None,
                inventory=[],
                relationships={}
            ),
            Entity(
                id="merchant_plaza_1",
                name="Merchant Elena",
                type="human",
                current_pos=Coordinate(0, 10, 0),
                home_pos=Coordinate(0, 10, 0),
                state=EntityState.TRADING,
                goal=EntityGoal.TRADE_GOODS,
                attributes={"strength": 10, "dexterity": 12, "constitution": 11, "intelligence": 14, "wisdom": 12, "charisma": 16},
                faction="merchant",
                movement_speed=0.8,
                perception_range=6,
                last_moved=0,
                path=[],
                target_entity=None,
                inventory=[],
                relationships={}
            ),
            Entity(
                id="bandit_forest_1",
                name="Bandit Leader Jak",
                type="human",
                current_pos=Coordinate(5, -5, 0),
                home_pos=Coordinate(5, -5, 0),
                state=EntityState.IDLE,
                goal=EntityGoal.SURVIVE,
                attributes={"strength": 13, "dexterity": 14, "constitution": 12, "intelligence": 10, "wisdom": 11, "charisma": 9},
                faction="underworld",
                movement_speed=1.2,
                perception_range=10,
                last_moved=0,
                path=[],
                target_entity=None,
                inventory=[],
                relationships={}
            ),
            Entity(
                id="wolf_wilds_1",
                name="Alpha Wolf",
                type="animal",
                current_pos=Coordinate(-3, 3, 0),
                home_pos=Coordinate(-3, 3, 0),
                state=EntityState.IDLE,
                goal=EntityGoal.SURVIVE,
                attributes={"strength": 15, "dexterity": 16, "constitution": 14, "intelligence": 4, "wisdom": 12, "charisma": 6},
                faction="wild",
                movement_speed=1.5,
                perception_range=6,
                last_moved=0,
                path=[],
                target_entity=None,
                inventory=[],
                relationships={}
            )
        ]
        
        for entity in default_entities:
            self._entities[entity.id] = entity
            self._save_entity(entity)
    
    def _save_entity(self, entity: Entity):
        """Save entity to database."""
        with sqlite3.connect(self.db_path) as conn:
            data = json.dumps(asdict(entity), default=str)
            conn.execute("""
                INSERT OR REPLACE INTO entities (id, data, last_updated)
                VALUES (?, ?, ?)
            """, (entity.id, data, entity.last_moved))
            conn.commit()
    
    def update_entities(self, current_turn: int, player_pos: Coordinate) -> List[Dict[str, Any]]:
        """
        Update all entities for the current turn.
        
        Args:
            current_turn: Current world turn
            player_pos: Player's current position
            
        Returns:
            List of entity movement events
        """
        events = []
        
        for entity in self._entities.values():
            # Check if entity should move this turn
            if self._should_move(entity, current_turn):
                old_pos = entity.current_pos
                new_pos = self._calculate_movement(entity, current_turn, player_pos)
                
                if new_pos != old_pos:
                    # Update entity position
                    entity.current_pos = new_pos
                    entity.last_moved = current_turn
                    
                    # Save to database
                    self._save_entity(entity)
                    
                    # Create movement event
                    event = {
                        "turn": current_turn,
                        "entity_id": entity.id,
                        "entity_name": entity.name,
                        "from_pos": (old_pos.x, old_pos.y),
                        "to_pos": (new_pos.x, new_pos.y),
                        "reason": entity.state.value
                    }
                    events.append(event)
                    
                    logger.debug(f"Entity {entity.name} moved from {old_pos} to {new_pos}")
            
            # Update entity state based on conditions
            self._update_entity_state(entity, current_turn, player_pos)
        
        return events
    
    def _should_move(self, entity: Entity, current_turn: int) -> bool:
        """Determine if an entity should move this turn."""
        # Check movement cooldown
        if current_turn - entity.last_moved < (1.0 / entity.movement_speed):
            return False
        
        # State-based movement logic
        if entity.state == EntityState.IDLE:
            # Random chance to start moving
            return random.random() < 0.1
        elif entity.state == EntityState.PATROLLING:
            # Patrols move regularly
            return True
        elif entity.state == EntityState.TRAVELING:
            # Traveling entities always move
            return True
        elif entity.state == EntityState.FLEEING:
            # Fleeing entities move quickly
            return True
        elif entity.state == EntityState.HUNTING:
            # Hunting entities move when tracking
            return entity.target_entity is not None
        
        return False
    
    def _calculate_movement(self, entity: Entity, current_turn: int, player_pos: Coordinate) -> Coordinate:
        """Calculate next position for an entity."""
        if entity.state == EntityState.PATROLLING:
            return self._patrol_movement(entity)
        elif entity.state == EntityState.TRAVELING:
            return self._trade_movement(entity)
        elif entity.state == EntityState.FLEEING:
            return self._flee_movement(entity, player_pos)
        elif entity.state == EntityState.HUNTING:
            return self._hunt_movement(entity)
        else:
            return entity.current_pos  # No movement
    
    def _patrol_movement(self, entity: Entity) -> Coordinate:
        """Calculate patrol movement around home position."""
        pattern = self._movement_patterns.get(entity.type, {})
        patrol_radius = pattern.get("patrol_radius", 3)
        
        # Simple patrol: move in a square pattern around home
        current_x, current_y = entity.current_pos.x, entity.current_pos.y
        home_x, home_y = entity.home_pos.x, entity.home_pos.y
        
        # Calculate patrol boundary
        min_x, max_x = home_x - patrol_radius, home_x + patrol_radius
        min_y, max_y = home_y - patrol_radius, home_y + patrol_radius
        
        # Choose next position in patrol pattern
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]  # N, E, S, W
        random.shuffle(directions)
        
        for dx, dy in directions:
            new_x = current_x + dx
            new_y = current_y + dy
            
            # Check if within patrol boundary
            if min_x <= new_x <= max_x and min_y <= new_y <= max_y:
                return Coordinate(new_x, new_y, entity.current_pos.t)
        
        return entity.current_pos
    
    def _trade_movement(self, entity: Entity) -> Coordinate:
        """Calculate movement for trading entities."""
        pattern = self._movement_patterns.get(entity.type, {})
        trade_radius = pattern.get("trade_radius", 15)
        
        # Move between trading hubs
        trading_hubs = [(0, 0), (0, 10), (5, -5)]  # Tavern, Plaza, Cave
        
        # Find nearest trading hub
        current_x, current_y = entity.current_pos.x, entity.current_pos.y
        nearest_hub = min(trading_hubs, key=lambda h: abs(h[0] - current_x) + abs(h[1] - current_y))
        
        # Move toward nearest hub
        dx = 1 if nearest_hub[0] > current_x else -1 if nearest_hub[0] < current_x else 0
        dy = 1 if nearest_hub[1] > current_y else -1 if nearest_hub[1] < current_y else 0
        
        new_x = current_x + dx
        new_y = current_y + dy
        
        return Coordinate(new_x, new_y, entity.current_pos.t)
    
    def _flee_movement(self, entity: Entity, player_pos: Coordinate) -> Coordinate:
        """Calculate movement away from threat."""
        current_x, current_y = entity.current_pos.x, entity.current_pos.y
        threat_x, threat_y = player_pos.x, player_pos.y
        
        # Calculate opposite direction
        dx = 1 if threat_x < current_x else -1 if threat_x > current_x else 0
        dy = 1 if threat_y < current_y else -1 if threat_y > current_y else 0
        
        new_x = current_x + dx
        new_y = current_y + dy
        
        return Coordinate(new_x, new_y, entity.current_pos.t)
    
    def _hunt_movement(self, entity: Entity) -> Coordinate:
        """Calculate movement toward target."""
        if not entity.target_entity:
            return entity.current_pos
        
        # Find target entity
        target = self._entities.get(entity.target_entity)
        if not target:
            return entity.current_pos
        
        # Move toward target
        current_x, current_y = entity.current_pos.x, entity.current_pos.y
        target_x, target_y = target.current_pos.x, target.current_pos.y
        
        dx = 1 if target_x > current_x else -1 if target_x < current_x else 0
        dy = 1 if target_y > current_y else -1 if target_y < current_y else 0
        
        new_x = current_x + dx
        new_y = current_y + dy
        
        return Coordinate(new_x, new_y, entity.current_pos.t)
    
    def _update_entity_state(self, entity: Entity, current_turn: int, player_pos: Coordinate):
        """Update entity state based on conditions."""
        distance_to_player = entity.current_pos.distance_to(player_pos)
        
        # State transitions based on player proximity
        if entity.type == "animal" and distance_to_player < 5:
            if entity.state != EntityState.FLEEING:
                entity.state = EntityState.FLEEING
                logger.debug(f"{entity.name} started fleeing from player")
        elif entity.type == "bandit" and distance_to_player < 8:
            if entity.state == EntityState.IDLE:
                entity.state = EntityState.HUNTING
                entity.target_entity = "player"  # Track player
                logger.debug(f"{entity.name} started hunting player")
        elif entity.type == "guard" and distance_to_player < 10:
            if entity.state == EntityState.IDLE:
                entity.state = EntityState.PATROLLING
                logger.debug(f"{entity.name} started patrolling")
    
    def get_entities_in_range(self, center: Coordinate, radius: int) -> List[Entity]:
        """
        Get all entities within a certain range of a coordinate.
        
        Args:
            center: Center coordinate
            radius: Search radius
            
        Returns:
            List of entities in range
        """
        entities_in_range = []
        
        for entity in self._entities.values():
            distance = entity.current_pos.distance_to(center)
            if distance <= radius:
                entities_in_range.append(entity)
        
        return entities_in_range
    
    def get_entity_at(self, coord: Coordinate) -> Optional[Entity]:
        """Get entity at a specific coordinate."""
        for entity in self._entities.values():
            if entity.current_pos.x == coord.x and entity.current_pos.y == coord.y:
                return entity
        return None
    
    def check_entity_intersection(self, from_pos: Coordinate, to_pos: Coordinate, start_turn: int, end_turn: int) -> List[Dict[str, Any]]:
        """
        Check if any entities intersect with a travel path.
        
        Args:
            from_pos: Starting coordinate
            to_pos: Destination coordinate
            start_turn: Turn when travel starts
            end_turn: Turn when travel ends
            
        Returns:
            List of intersection events
        """
        intersections = []
        
        # Simple line intersection check
        # For each turn of travel, check if any entity is at that position
        travel_time = end_turn - start_turn
        dx = 1 if to_pos.x > from_pos.x else -1 if to_pos.x < from_pos.x else 0
        dy = 1 if to_pos.y > from_pos.y else -1 if to_pos.y < from_pos.y else 0
        
        for turn in range(travel_time):
            check_x = from_pos.x + dx * turn
            check_y = from_pos.y + dy * turn
            check_coord = Coordinate(check_x, check_y, start_turn + turn)
            
            entity = self.get_entity_at(check_coord)
            if entity:
                intersections.append({
                    "turn": start_turn + turn,
                    "entity": entity,
                    "coordinate": (check_x, check_y),
                    "description": f"Encountered {entity.name} at ({check_x}, {check_y})"
                })
        
        return intersections
    
    def get_entity_statistics(self) -> Dict[str, Any]:
        """Get statistics about entities in the world."""
        stats = {
            "total_entities": len(self._entities),
            "by_type": {},
            "by_faction": {},
            "by_state": {},
            "average_speed": 0.0
        }
        
        total_speed = 0
        for entity in self._entities.values():
            # Count by type
            stats["by_type"][entity.type] = stats["by_type"].get(entity.type, 0) + 1
            
            # Count by faction
            stats["by_faction"][entity.faction] = stats["by_faction"].get(entity.faction, 0) + 1
            
        for entity in self._entities.values():
            state_value = entity.state.value if hasattr(entity.state, 'value') else str(entity.state)
            stats["by_state"][state_value] = stats["by_state"].get(state_value, 0) + 1
            
            total_speed += entity.movement_speed
        
        if self._entities:
            stats["average_speed"] = total_speed / len(self._entities)
        
        return stats


# Export for use by game engine
__all__ = ["EntityAI", "Entity", "EntityState", "EntityGoal"]
