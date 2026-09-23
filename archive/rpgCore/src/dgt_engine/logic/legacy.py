"""
Legacy System: Avatar-Legacy Protocol

Phase 4: Avatar-Legacy Implementation
Handles world persistence across player incarnations through echoes and resonance.

ADR 019: The Avatar-Legacy Protocol Implementation
"""

import sqlite3
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import json

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate
from game_state import GameState
from utils.baker_expanded import ExpandedBaker, AssetType


@dataclass
class WorldMark:
    """A permanent procedural fill-in left by previous avatar runs."""
    coordinate: Tuple[int, int]
    avatar_name: str
    archetype: str
    cause: str  # "death", "retirement", "victory"
    description: str
    inventory_top_item: str
    turn_number: int
    timestamp: str
    resonance_strength: float  # 0.0 to 1.0


@dataclass
class AvatarEcho:
    """A distilled narrative moment from a previous avatar's run."""
    coordinate: Tuple[int, int]
    avatar_name: str
    archetype: str
    event_type: str  # "combat", "social", "discovery", "death"
    description: str
    vector_id: str  # Reference to lore vector
    intensity: float  # 0.0 to 1.0


class LegacyHandler:
    """
    Minimalist legacy system for avatar-world persistence.
    
    Handles the "Echo System" and "Avatar Resonance" without bloating the MVP.
    """
    
    def __init__(self, world_ledger: WorldLedger, db_path: str = "data/legacy.sqlite"):
        """Initialize the legacy handler."""
        self.world_ledger = world_ledger
        self.db_path = db_path
        
        # Create database directory
        import os
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self._initialize_database()
        logger.info("Legacy Handler initialized for avatar-world persistence")
    
    def _initialize_database(self):
        """Initialize SQLite database for legacy data."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS legacy_marks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coordinate TEXT NOT NULL,
                    avatar_name TEXT NOT NULL,
                    archetype TEXT NOT NULL,
                    cause TEXT NOT NULL,
                    description TEXT NOT NULL,
                    inventory_top_item TEXT,
                    turn_number INTEGER,
                    timestamp TEXT NOT NULL,
                    resonance_strength REAL DEFAULT 0.5
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS avatar_echoes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    coordinate TEXT NOT NULL,
                    avatar_name TEXT NOT NULL,
                    archetype TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    description TEXT NOT NULL,
                    vector_id TEXT,
                    intensity REAL DEFAULT 0.5,
                    turn_number INTEGER
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS archetype_resonance (
                    archetype TEXT PRIMARY KEY,
                    frequency INTEGER DEFAULT 1,
                    total_turns INTEGER DEFAULT 0,
                    avg_resonance REAL DEFAULT 0.5
                )
            """)
            
            conn.commit()
    
    def distill_run_into_legacy(self, game_state: GameState, cause: str) -> List[WorldMark]:
        """
        Distill a finished run into permanent world marks.
        
        Args:
            game_state: Final game state
            cause: "death", "retirement", or "victory"
            
        Returns:
            List of world marks created
        """
        logger.info(f"Distilling {game_state.player.name} run into legacy marks...")
        
        # Create 3-5 echo points from significant locations
        echo_points = self._identify_echo_points(game_state)
        
        # Create world marks from echo points
        world_marks = []
        for i, (coord, significance) in enumerate(echo_points):
            mark = WorldMark(
                coordinate=coord,
                avatar_name=game_state.player.name,
                archetype=getattr(game_state.player, 'archetype_name', 'unknown'),
                cause=cause,
                description=self._generate_mark_description(game_state, coord, significance),
                inventory_top_item=self._get_top_inventory_item(game_state),
                turn_number=game_state.turn_count,
                timestamp=datetime.now().isoformat(),
                resonance_strength=min(1.0, significance / 100.0)
            )
            
            # Save to database
            self._save_world_mark(mark)
            world_marks.append(mark)
        
        # Update archetype resonance
        self._update_archetype_resonance(game_state)
        
        logger.info(f"Created {len(world_marks)} legacy marks for {game_state.player.name}")
        return world_marks
    
    def _identify_echo_points(self, game_state: GameState) -> List[Tuple[Tuple[int, int], float]]:
        """
        Identify significant locations to create echo points.
        
        Args:
            game_state: Current game state
            
        Returns:
            List of (coordinate, significance) tuples
        """
        echo_points = []
        
        # Current location (always significant)
        current_coord = (game_state.position.x, game_state.position.y)
        echo_points.append((current_coord, 100.0))  # Max significance
        
        # Locations with high reputation changes
        for faction, delta in game_state.reputation.items():
            if abs(delta) > 20:  # Significant reputation change
                # Find associated location (simplified)
                echo_points.append((current_coord, abs(delta)))
        
        # Locations with completed goals
        for goal_id in game_state.completed_goals[-3:]:  # Last 3 completed goals
            # Simplified: use current location for all goals
            echo_points.append((current_coord, 50.0))
        
        # Limit to top 3 echo points
        echo_points.sort(key=lambda x: x[1], reverse=True)
        return echo_points[:3]
    
    def _generate_mark_description(self, game_state: GameState, coord: Tuple[int, int], significance: float) -> str:
        """Generate description for a world mark."""
        avatar_name = game_state.player.name
        archetype = getattr(game_state.player, 'archetype_name', 'unknown')
        
        if significance >= 100.0:
            # Final location mark
            return f"Final resting place of {avatar_name} the {archetype}"
        elif significance >= 50.0:
            # Major achievement mark
            return f"Site of {avatar_name}'s great accomplishment"
        else:
            # Minor significance mark
            return f"Place where {avatar_name} left their mark"
    
    def _get_top_inventory_item(self, game_state: GameState) -> str:
        """Get the most valuable or significant inventory item."""
        if not game_state.player.inventory:
            return "nothing"
        
        # Find item with highest value
        top_item = max(game_state.player.inventory, key=lambda x: getattr(x, 'value', 0))
        return getattr(top_item, 'name', 'unknown item')
    
    def _save_world_mark(self, mark: WorldMark):
        """Save a world mark to the database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO legacy_marks (
                    coordinate, avatar_name, archetype, cause, description,
                    inventory_top_item, turn_number, timestamp, resonance_strength
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"{mark.coordinate[0]},{mark.coordinate[1]}",
                mark.avatar_name,
                mark.archetype,
                mark.cause,
                mark.description,
                mark.inventory_top_item,
                mark.turn_number,
                mark.timestamp,
                mark.resonance_strength
            ))
            conn.commit()
    
    def _update_archetype_resonance(self, game_state: GameState):
        """Update archetype resonance statistics."""
        archetype = getattr(game_state.player, 'archetype_name', 'unknown')
        
        with sqlite3.connect(self.db_path) as conn:
            # Check if archetype exists
            cursor = conn.execute("SELECT frequency, total_turns, avg_resonance FROM archetype_resonance WHERE archetype = ?", (archetype,))
            row = cursor.fetchone()
            
            if row:
                # Update existing
                freq, total_turns, avg_res = row
                new_freq = freq + 1
                new_total = total_turns + game_state.turn_count
                new_avg = (avg_res * freq + 0.5) / new_freq  # Simple average
                
                conn.execute("""
                    UPDATE archetype_resonance 
                    SET frequency = ?, total_turns = ?, avg_resonance = ?
                    WHERE archetype = ?
                """, (new_freq, new_total, new_avg, archetype))
            else:
                # Insert new
                conn.execute("""
                    INSERT INTO archetype_resonance (archetype, frequency, total_turns, avg_resonance)
                    VALUES (?, ?, ?, ?)
                """, (archetype, 1, game_state.turn_count, 0.5))
            
            conn.commit()
    
    def get_legacy_marks_at(self, coord: Coordinate) -> List[WorldMark]:
        """
        Get legacy marks at a specific coordinate.
        
        Args:
            coord: Coordinate to check
            
        Returns:
            List of world marks at this coordinate
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT coordinate, avatar_name, archetype, cause, description,
                       inventory_top_item, turn_number, timestamp, resonance_strength
                FROM legacy_marks
                WHERE coordinate = ?
                ORDER BY resonance_strength DESC
            """, (f"{coord.x},{coord.y}",))
            
            marks = []
            for row in cursor.fetchall():
                coord_parts = row[0].split(',')
                mark = WorldMark(
                    coordinate=(int(coord_parts[0]), int(coord_parts[1])),
                    avatar_name=row[1],
                    archetype=row[2],
                    cause=row[3],
                    description=row[4],
                    inventory_top_item=row[5],
                    turn_number=row[6],
                    timestamp=row[7],
                    resonance_strength=row[8]
                )
                marks.append(mark)
            
            return marks
    
    def get_archetype_resonance_bonus(self, archetype: str) -> Dict[str, int]:
        """
        Get resonance bonuses for a new avatar based on archetype history.
        
        Args:
            archetype: Avatar archetype name
            
        Returns:
            Dictionary of attribute bonuses
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT frequency, avg_resonance FROM archetype_resonance WHERE archetype = ?
            """, (archetype,))
            
            row = cursor.fetchone()
            if not row:
                return {}
            
            frequency, avg_resonance = row
            
            # Calculate bonuses based on frequency and resonance
            bonuses = {}
            
            if frequency >= 3:  # 3+ previous avatars
                if avg_resonance > 0.7:  # High resonance
                    # Strong bonus to related attributes
                    if archetype == "cunning":
                        bonuses["dexterity"] = 2
                        bonuses["charisma"] = 1
                    elif archetype == "aggressive":
                        bonuses["strength"] = 2
                        bonuses["constitution"] = 1
                    elif archetype == "diplomatic":
                        bonuses["charisma"] = 2
                        bonuses["intelligence"] = 1
                elif avg_resonance > 0.5:  # Medium resonance
                    # Small bonus
                    if archetype == "cunning":
                        bonuses["dexterity"] = 1
                    elif archetype == "aggressive":
                        bonuses["strength"] = 1
                    elif archetype == "diplomatic":
                        bonuses["charisma"] = 1
            
            return bonuses
    
    def get_nearby_legacy_context(self, coord: Coordinate, radius: int = 3) -> List[str]:
        """
        Get legacy context for nearby coordinates.
        
        Args:
            coord: Center coordinate
            radius: Search radius
            
        Returns:
            List of legacy descriptions
        """
        context = []
        
        # Search in square around coordinate
        for dx in range(-radius, radius + 1):
            for dy in range(-radius, radius + 1):
                check_coord = Coordinate(coord.x + dx, coord.y + dy, coord.t)
                marks = self.get_legacy_marks_at(check_coord)
                
                for mark in marks:
                    if mark.resonance_strength > 0.3:  # Only show significant marks
                        context.append(f"[TAG: {mark.description}]")
        
        return context
    
    def get_legacy_summary(self) -> Dict[str, Any]:
        """Get summary of legacy data."""
        with sqlite3.connect(self.db_path) as conn:
            # Count total marks
            mark_count = conn.execute("SELECT COUNT(*) FROM legacy_marks").fetchone()[0]
            
            # Count by archetype
            archetype_counts = conn.execute("""
                SELECT archetype, COUNT(*) FROM legacy_marks GROUP BY archetype
            """).fetchall()
            
            # Get archetype resonance
            resonance_data = conn.execute("""
                SELECT archetype, frequency, avg_resonance FROM archetype_resonance ORDER BY frequency DESC
            """).fetchall()
            
            return {
                "total_marks": mark_count,
                "by_archetype": dict(archetype_counts),
                "archetype_resonance": [
                    {
                        "archetype": row[0],
                        "frequency": row[1],
                        "avg_resonance": row[2]
                    }
                    for row in resonance_data
                ]
            }


# Export for use by game engine
__all__ = ["LegacyHandler", "WorldMark", "AvatarEcho"]
