"""
Faction System: Active World Simulation

Phase 6: Dwarf Fortress-Inspired World Simulation
Implements faction wars, territorial control, and historical causality.

ADR 021: The "Dwarf Fortress" Simulation Layer Implementation
"""

import sqlite3
import random
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime

from loguru import logger
from dgt_engine.game_engine.world_ledger import WorldLedger, Coordinate, WorldChunk


class FactionRelation(Enum):
    """Relationship status between factions."""
    ALLIED = "allied"
    NEUTRAL = "neutral"
    HOSTILE = "hostile"
    WAR = "war"
    TRUCE = "truce"
    VASSAL = "vassal"


class FactionType(Enum):
    """Types of factions with different behaviors."""
    MILITARY = "military"  # Expansionist, aggressive
    RELIGIOUS = "religious"  # Diplomatic, conversion-focused
    ECONOMIC = "economic"  # Trade-focused, territorial
    NOMADIC = "nomadic"  # Mobile, raiding
    ISOLATIONIST = "isolationist"  # Defensive, xenophobic


@dataclass
class Faction:
    """A faction with territories, relationships, and goals."""
    id: str
    name: str
    type: FactionType
    color: str  # For map visualization
    home_base: Tuple[int, int]  # Starting coordinate
    current_power: float  # 0.0 to 1.0
    territories: List[Tuple[int, int]]  # Controlled coordinates
    relations: Dict[str, FactionRelation]  # Relations with other factions
    goals: List[str]  # Faction objectives
    expansion_rate: float  # How quickly they expand
    aggression_level: float  # 0.0 to 1.0
    last_action_turn: int = 0  # Turn when last action was taken


@dataclass
class FactionConflict:
    """A conflict between two factions."""
    aggressor: str  # Faction ID
    defender: str  # Faction ID
    coordinate: Tuple[int, int]
    start_turn: int
    end_turn: Optional[int]  # None if ongoing
    outcome: Optional[str]  # "victory", "defeat", "stalemate"
    casualties: Dict[str, int]  # Faction casualties
    territory_changes: Dict[str, List[Tuple[int, int]]]  # Territory transfers


class FactionSystem:
    """
    Active world simulation for faction dynamics.
    
    Implements Dwarf Fortress-style faction wars, territorial control,
    and historical causality that affects the player experience.
    """
    
    def __init__(self, world_ledger: WorldLedger, db_path: str = "data/factions.sqlite"):
        """Initialize the faction system."""
        self.world_ledger = world_ledger
        self.db_path = db_path
        
        # Create database directory
        import os
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self._initialize_database()
        self.factions: Dict[str, Faction] = {}
        self.conflicts: List[FactionConflict] = []
        
        # Simulation parameters
        self.faction_expansion_chance = 0.3  # 30% chance per tick
        self.conflict_resolution_chance = 0.2  # 20% chance conflicts resolve
        self.territory_decay_rate = 0.05  # Territory control decays over time
        
        logger.info("Faction System initialized for active world simulation")
    
    def _initialize_database(self):
        """Initialize SQLite database for faction data."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS factions (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    color TEXT NOT NULL,
                    home_base TEXT NOT NULL,
                    current_power REAL DEFAULT 0.5,
                    territories TEXT NOT NULL,
                    relations TEXT NOT NULL,
                    goals TEXT NOT NULL,
                    expansion_rate REAL DEFAULT 0.1,
                    aggression_level REAL DEFAULT 0.5,
                    last_action_turn INTEGER DEFAULT 0
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS faction_conflicts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    aggressor TEXT NOT NULL,
                    defender TEXT NOT NULL,
                    coordinate TEXT NOT NULL,
                    start_turn INTEGER NOT NULL,
                    end_turn INTEGER,
                    outcome TEXT,
                    casualties TEXT NOT NULL,
                    territory_changes TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS faction_territory (
                    coordinate TEXT PRIMARY KEY,
                    faction_id TEXT NOT NULL,
                    control_strength REAL DEFAULT 0.5,
                    acquired_turn INTEGER NOT NULL,
                    history TEXT NOT NULL
                )
            """)
            
            conn.commit()
    
    def create_factions(self, faction_configs: List[Dict[str, Any]]) -> Dict[str, Faction]:
        """
        Create factions from configuration.
        
        Args:
            faction_configs: List of faction configuration dictionaries
            
        Returns:
            Dictionary of created factions
        """
        created_factions = {}
        
        for config in faction_configs:
            # Convert relations from strings to FactionRelation enums
            relations = {}
            for other_id, relation_str in config.get("relations", {}).items():
                relations[other_id] = FactionRelation(relation_str)
            
            faction = Faction(
                id=config["id"],
                name=config["name"],
                type=FactionType(config["type"]),
                color=config["color"],
                home_base=tuple(config["home_base"]),
                current_power=config.get("current_power", 0.5),
                territories=[tuple(config["home_base"])],
                relations=relations,
                goals=config.get("goals", []),
                expansion_rate=config.get("expansion_rate", 0.1),
                aggression_level=config.get("aggression_level", 0.5)
            )
            
            self.factions[faction.id] = faction
            created_factions[faction.id] = faction
            
            # Save to database
            self._save_faction(faction)
            
            # Initialize territory control
            self._claim_territory(faction, faction.home_base, 1.0, "Initial claim")
        
        logger.info(f"Created {len(created_factions)} factions")
        return created_factions
    
    def _save_faction(self, faction: Faction):
        """Save faction to database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO factions (
                    id, name, type, color, home_base, current_power, territories,
                    relations, goals, expansion_rate, aggression_level, last_action_turn
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                faction.id,
                faction.name,
                faction.type.value,
                faction.color,
                f"{faction.home_base[0]},{faction.home_base[1]}",
                faction.current_power,
                json.dumps(faction.territories),
                json.dumps({k: v.value for k, v in faction.relations.items()}),
                json.dumps(faction.goals),
                faction.expansion_rate,
                faction.aggression_level,
                faction.last_action_turn
            ))
            conn.commit()
    
    def _claim_territory(self, faction: Faction, coord: Tuple[int, int], strength: float, reason: str):
        """Claim territory for a faction."""
        with sqlite3.connect(self.db_path) as conn:
            # Add to faction's territory list
            if coord not in faction.territories:
                faction.territories.append(coord)
            
            # Save territory control
            history_entry = {
                "faction": faction.id,
                "reason": reason,
                "turn": faction.last_action_turn,
                "strength": strength
            }
            
            conn.execute("""
                INSERT OR REPLACE INTO faction_territory (
                    coordinate, faction_id, control_strength, acquired_turn, history
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                f"{coord[0]},{coord[1]}",
                faction.id,
                strength,
                faction.last_action_turn,
                json.dumps(history_entry)
            ))
            conn.commit()
    
    def simulate_factions(self, current_turn: int) -> List[FactionConflict]:
        """
        Simulate faction dynamics for a turn.
        
        Args:
            current_turn: Current world turn
            
        Returns:
            List of new conflicts that occurred
        """
        new_conflicts = []
        
        # Process faction expansion
        for faction in self.factions.values():
            if current_turn - faction.last_action_turn >= 10:  # Action cooldown
                if random.random() < self.faction_expansion_chance:
                    self._process_faction_expansion(faction, current_turn)
        
        # Process ongoing conflicts
        resolved_conflicts = []
        for conflict in self.conflicts:
            if conflict.end_turn is None:
                if random.random() < self.conflict_resolution_chance:
                    outcome = self._resolve_conflict(conflict, current_turn)
                    if outcome:
                        resolved_conflicts.append(conflict)
        
        # Remove resolved conflicts
        for conflict in resolved_conflicts:
            self.conflicts.remove(conflict)
        
        # Decay territory control over time
        self._decay_territory_control(current_turn)
        
        # Update faction power based on territory control
        self._update_faction_power()
        
        logger.info(f"Simulated factions for turn {current_turn}: {len(new_conflicts)} new conflicts, {len(resolved_conflicts)} resolved")
        return new_conflicts
    
    def _process_faction_expansion(self, faction: Faction, current_turn: int):
        """Process faction expansion attempts."""
        # Calculate expansion targets
        expansion_targets = self._get_expansion_targets(faction)
        
        if expansion_targets:
            # Choose best target
            target = max(expansion_targets, key=lambda x: x[1])  # Sort by priority
            
            coord, priority = target
            
            # Check if already controlled
            current_controller = self._get_territory_controller(coord)
            
            if current_controller != faction.id:
                # Initiate conflict or peaceful expansion
                if current_controller:
                    # Conflict with existing faction
                    conflict = FactionConflict(
                        aggressor=faction.id,
                        defender=current_controller,
                        coordinate=coord,
                        start_turn=current_turn,
                        end_turn=None,
                        outcome=None,
                        casualties={},
                        territory_changes={}
                    )
                    
                    self.conflicts.append(conflict)
                    faction.last_action_turn = current_turn
                    
                    logger.info(f"Faction {faction.name} initiated conflict with {current_controller} at {coord}")
                else:
                    # Peaceful expansion
                    self._claim_territory(faction, coord, 0.5, f"Peaceful expansion")
                    faction.last_action_turn = current_turn
                    
                    logger.info(f"Faction {faction.name} peacefully expanded to {coord}")
    
    def _get_expansion_targets(self, faction: Faction) -> List[Tuple[Tuple[int, int], float]]:
        """Get potential expansion targets for a faction."""
        targets = []
        
        # Check adjacent territories
        for coord in faction.territories:
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx == 0 and dy == 0:
                        continue
                    
                    target_coord = (coord[0] + dx, coord[1] + dy)
                    
                    # Skip if already controlled
                    if target_coord in faction.territories:
                        continue
                    
                    # Calculate priority based on faction goals
                    priority = self._calculate_expansion_priority(faction, target_coord)
                    
                    if priority > 0:
                        targets.append((target_coord, priority))
        
        return targets
    
    def _calculate_expansion_priority(self, faction: Faction, coord: Tuple[int, int]) -> float:
        """Calculate expansion priority for a coordinate."""
        priority = 0.5  # Base priority
        
        # Check for resources
        chunk = self.world_ledger.get_chunk(Coordinate(coord[0], coord[1], 0), 0)
        
        # Faction type preferences
        if faction.type == FactionType.MILITARY:
            if "strategic" in chunk.tags:
                priority += 0.3
            if "defensible" in chunk.tags:
                priority += 0.2
        
        elif faction.type == FactionType.ECONOMIC:
            if "trade" in chunk.tags or "market" in chunk.tags:
                priority += 0.3
            if "resource" in chunk.tags:
                priority += 0.2
        
        elif faction.type == FactionType.RELIGIOUS:
            if "sacred" in chunk.tags or "shrine" in chunk.tags:
                priority += 0.3
            if "peaceful" in chunk.tags:
                priority += 0.2
        
        # Check for existing faction presence
        current_controller = self._get_territory_controller(coord)
        if current_controller:
            relation = faction.relations.get(current_controller, FactionRelation.NEUTRAL)
            
            if relation == FactionRelation.HOSTILE:
                priority += 0.4  # High priority to attack enemies
            elif relation == FactionRelation.WAR:
                priority += 0.5  # Very high priority during war
            elif relation == FactionRelation.ALLIED:
                priority -= 0.3  # Low priority to attack allies
        
        return max(0.0, priority)
    
    def _get_territory_controller(self, coord: Tuple[int, int]) -> Optional[str]:
        """Get the faction controlling a territory."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT faction_id FROM faction_territory
                WHERE coordinate = ?
                ORDER BY control_strength DESC
                LIMIT 1
            """, (f"{coord[0]},{coord[1]}",))
            
            row = cursor.fetchone()
            return row[0] if row else None
    
    def _resolve_conflict(self, conflict: FactionConflict, current_turn: int) -> str:
        """Resolve a faction conflict."""
        aggressor = self.factions.get(conflict.aggressor)
        defender = self.factions.get(conflict.defender)
        
        if not aggressor or not defender:
            return "invalid"
        
        # Calculate combat power
        aggressor_power = aggressor.current_power * aggressor.aggression_level
        defender_power = defender.current_power * (1.0 - defender.aggression_level * 0.5)
        
        # Add territory control bonus
        aggressor_territories = len(aggressor.territories)
        defender_territories = len(defender.territories)
        
        aggressor_power += (aggressor_territories * 0.1)
        defender_power += (defender_territories * 0.15)  # Defensive bonus
        
        # Roll for outcome
        aggressor_roll = random.random() * aggressor_power
        defender_roll = random.random() * defender_power
        
        if aggressor_roll > defender_roll * 1.2:
            # Aggressor victory
            outcome = "victory"
            self._transfer_territory(defender, aggressor, conflict.coordinate)
            aggressor.current_power = min(1.0, aggressor.current_power + 0.1)
            defender.current_power = max(0.0, defender.current_power - 0.1)
            
            # Update relations
            defender.relations[aggressor.id] = FactionRelation.HOSTILE
            aggressor.relations[defender.id] = FactionRelation.WAR
            
        elif defender_roll > aggressor_roll * 1.2:
            # Defender victory
            outcome = "defeat"
            aggressor.current_power = max(0.0, aggressor.current_power - 0.1)
            defender.current_power = min(1.0, defender.current_power + 0.1)
            
            # Update relations
            aggressor.relations[defender.id] = FactionRelation.WAR
            defender.relations[aggressor.id] = FactionRelation.HOSTILE
        
        else:
            # Stalemate
            outcome = "stalemate"
            aggressor.current_power *= 0.95
            defender.current_power *= 0.95
        
        # Update conflict
        conflict.end_turn = current_turn
        conflict.outcome = outcome
        
        # Save to database
        self._save_conflict(conflict)
        
        logger.info(f"Conflict resolved: {conflict.aggressor} vs {conflict.defender} at {conflict.coordinate} -> {outcome}")
        return outcome
    
    def _transfer_territory(self, loser: Faction, winner: Faction, coord: Tuple[int, int]):
        """Transfer territory from loser to winner."""
        # Remove from loser
        if coord in loser.territories:
            loser.territories.remove(coord)
        
        # Add to winner
        if coord not in winner.territories:
            winner.territories.append(coord)
        
        # Update territory control
        self._claim_territory(winner, coord, 0.8, f"Conquered from {loser.name}")
        
        # Update loser's territory control
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                DELETE FROM faction_territory 
                WHERE coordinate = ? AND faction_id = ?
            """, (f"{coord[0]},{coord[1]}", loser.id))
            conn.commit()
    
    def _save_conflict(self, conflict: FactionConflict):
        """Save conflict to database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO faction_conflicts (
                    id, aggressor, defender, coordinate, start_turn, end_turn,
                    outcome, casualties, territory_changes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                None,  # Auto-increment
                conflict.aggressor,
                conflict.defender,
                f"{conflict.coordinate[0]},{conflict.coordinate[1]}",
                conflict.start_turn,
                conflict.end_turn,
                conflict.outcome,
                json.dumps(conflict.casualties),
                json.dumps(conflict.territory_changes)
            ))
            conn.commit()
    
    def _decay_territory_control(self, current_turn: int):
        """Decay territory control over time."""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT coordinate, faction_id, control_strength, acquired_turn
                FROM faction_territory
            """)
            
            for row in cursor.fetchall():
                coord_key, faction_id, strength, acquired_turn = row
                turns_since_acquisition = current_turn - acquired_turn
                
                # Calculate decay
                decayed_strength = strength * (self.territory_decay_rate ** turns_since_acquisition)
                
                # Update if significantly decayed
                if decayed_strength < strength * 0.9:
                    conn.execute("""
                        UPDATE faction_territory
                        SET control_strength = ?
                        WHERE coordinate = ? AND faction_id = ?
                    """, (decayed_strength, coord_key, faction_id))
            
            conn.commit()
    
    def _update_faction_power(self):
        """Update faction power based on territory control."""
        for faction in self.factions.values():
            # Calculate power based on territory control
            total_strength = 0
            territory_count = 0
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT control_strength FROM faction_territory
                    WHERE faction_id = ?
                """, (faction.id,))
                
                for row in cursor.fetchall():
                    total_strength += row[0]
                    territory_count += 1
            
            # Update faction power
            if territory_count > 0:
                faction.current_power = min(1.0, total_strength / territory_count)
            else:
                faction.current_power = 0.1  # Minimum power when no territories
            
            # Save updated faction
            self._save_faction(faction)
    
    def get_faction_control_map(self) -> Dict[Tuple[int, int], str]:
        """
        Get the current faction control map.
        
        Returns:
            Dictionary mapping coordinates to controlling faction ID
        """
        control_map = {}
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT coordinate, faction_id, control_strength
                FROM faction_territory
                WHERE control_strength > 0.3
            """)
            
            for row in cursor.fetchall():
                coord_key = row[0]
                faction_id = row[1]
                strength = row[2]
                
                # Only include strongest controller
                if coord_key not in control_map or strength > control_map[coord_key][1]:
                    control_map[coord_key] = (faction_id, strength)
        
        return control_map
    
    def get_faction_at_coordinate(self, coord: Coordinate) -> Optional[Faction]:
        """Get the faction controlling a specific coordinate."""
        controller_id = self._get_territory_controller((coord.x, coord.y))
        
        if controller_id:
            return self.factions.get(controller_id)
        
        return None
    
    def get_faction_relations(self, faction_id: str) -> Dict[str, FactionRelation]:
        """Get relations for a faction."""
        faction = self.factions.get(faction_id)
        return faction.relations if faction else {}
    
    def get_faction_summary(self) -> Dict[str, Any]:
        """Get summary of faction system state."""
        return {
            "total_factions": len(self.factions),
            "active_conflicts": len([c for c in self.conflicts if c.end_turn is None]),
            "resolved_conflicts": len([c for c in self.conflicts if c.end_turn is not None]),
            "faction_power": {fid: f.current_power for fid, f in self.factions.items()},
            "territory_counts": {fid: len(f.territories) for fid, f in self.factions.items()},
            "total_territories": sum(len(f.territories) for f in self.factions.values())
        }


# Export for use by game engine
__all__ = ["FactionSystem", "Faction", "FactionConflict", "FactionRelation", "FactionType"]
