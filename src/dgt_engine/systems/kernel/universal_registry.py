"""
Universal Registry - Cross-Engine Performance Tracking
ADR 159: Universal Pilot Registry Across Game Engines
"""

import sqlite3
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from enum import Enum

from loguru import logger
from .persistence import LegendaryRegistry
from foundation.protocols import WorldStateSnapshot, EntityStateProtocol


class EngineType(str, Enum):
    """Engine type enumeration"""
    SPACE = "SPACE"
    SHELL = "SHELL"


@dataclass
class UniversalPerformance:
    """Cross-engine performance tracking"""
    ship_id: str
    engine_type: EngineType
    performance_score: float
    timestamp: float
    skirmish_id: str
    role: str
    generation: int
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['engine_type'] = self.engine_type.value
        return data


class UniversalRegistry(LegendaryRegistry):
    """Tracks performance across Space and Shell engines with cross-engine compatibility"""
    
    def __init__(self, db_path: str = "data/roster.db"):
        self.db_path = db_path
        self.conn = None
        self.graveyard_manager = GraveyardManager(db_path)
        
        self._init_db()
        
        logger.info(f"🌍 UniversalRegistry initialized: {db_path}")
    
    def _init_universal_schema(self):
        """Initialize universal registry schema with cross-engine tracking"""
        # Add engine-specific columns to existing table
        try:
            self.conn.execute("""
                ALTER TABLE fleet_roster 
                ADD COLUMN last_engine_type TEXT DEFAULT 'SPACE'
            """)
        except sqlite3.OperationalError:
            # Column already exists
            pass
        
        try:
            self.conn.execute("""
                ALTER TABLE fleet_roster 
                ADD COLUMN total_xp REAL DEFAULT 0.0
            """)
        except sqlite3.OperationalError:
            # Column already exists
            pass
        
        try:
            self.conn.execute("""
                ALTER TABLE fleet_roster 
                ADD COLUMN space_victories INTEGER DEFAULT 0
            """)
        except sqlite3.OperationalError:
            # Column already exists
            pass
        
        try:
            self.conn.execute("""
                ALTER TABLE fleet_roster 
                ADD COLUMN shell_victories INTEGER DEFAULT 0
            """)
        except sqlite3.OperationalError:
            # Column already exists
            pass
        
        # Create cross-engine performance history table
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS cross_engine_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ship_id TEXT NOT NULL,
                engine_type TEXT NOT NULL,
                performance_score REAL NOT NULL,
                timestamp REAL NOT NULL,
                skirmish_id TEXT NOT NULL,
                role TEXT NOT NULL,
                generation INTEGER NOT NULL,
                trait_snapshot TEXT,  -- JSON of genome traits at time of performance
                FOREIGN KEY (ship_id) REFERENCES fleet_roster(ship_id)
            )
        """)
        
        # Create indexes for cross-engine queries
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_engine_type ON fleet_roster(last_engine_type)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_total_xp ON fleet_roster(total_xp)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_cross_engine_ship ON cross_engine_history(ship_id)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_cross_engine_type ON cross_engine_history(engine_type)")
        
        self.conn.commit()
    
    def record_cross_engine_feat(self, ship_id: str, engine_type: EngineType, 
                                performance_score: float, skirmish_id: str,
                                role: str = "Unknown", generation: int = 0,
                                trait_snapshot: Optional[Dict[str, Any]] = None):
        """
        Records whether the feat was Newtonian or Turn-Based.
        engine_type: EngineType.SPACE or EngineType.SHELL
        """
        try:
            # Update main registry with engine type and XP
            self.conn.execute("""
                UPDATE fleet_roster 
                SET last_engine_type = ?,
                    total_xp = total_xp + ?
                WHERE ship_id = ?
            """, (engine_type.value, performance_score, ship_id))
            
            # Update engine-specific victory counts
            if engine_type == EngineType.SPACE:
                self.conn.execute("""
                    UPDATE fleet_roster 
                    SET space_victories = space_victories + 1
                    WHERE ship_id = ?
                """, (ship_id,))
            else:
                self.conn.execute("""
                    UPDATE fleet_roster 
                    SET shell_victories = shell_victories + 1
                    WHERE ship_id = ?
                """, (ship_id,))
            
            # Record in cross-engine history
            self.conn.execute("""
                INSERT INTO cross_engine_history 
                (ship_id, engine_type, performance_score, timestamp, 
                 skirmish_id, role, generation, trait_snapshot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ship_id, engine_type.value, performance_score, time.time(),
                skirmish_id, role, generation, json.dumps(trait_snapshot or {})
            ))
            
            self.conn.commit()
            logger.debug(f"🌍 Recorded cross-engine feat: {ship_id} in {engine_type.value}")
            
        except Exception as e:
            logger.error(f"🌍 Failed to record cross-engine feat: {e}")
    
    def get_cross_engine_summary(self, ship_id: str) -> Dict[str, Any]:
        """Get comprehensive cross-engine performance summary for a pilot"""
        try:
            # Get main registry data
            cursor = self.conn.execute("""
                SELECT * FROM fleet_roster WHERE ship_id = ?
            """, (ship_id,))
            
            row = cursor.fetchone()
            if not row:
                return {"error": f"Pilot {ship_id} not found"}
            
            columns = [desc[0] for desc in cursor.description]
            registry_data = dict(zip(columns, row))
            
            # Get cross-engine history
            cursor = self.conn.execute("""
                SELECT engine_type, COUNT(*) as count, AVG(performance_score) as avg_score,
                       MAX(performance_score) as max_score
                FROM cross_engine_history 
                WHERE ship_id = ?
                GROUP BY engine_type
            """, (ship_id,))
            
            engine_stats = {}
            for engine_row in cursor.fetchall():
                engine_cols = [desc[0] for desc in cursor.description]
                engine_data = dict(zip(engine_cols, engine_row))
                engine_stats[engine_data['engine_type']] = engine_data
            
            # Calculate cross-engine metrics
            total_victories = registry_data.get('space_victories', 0) + registry_data.get('shell_victories', 0)
            cross_engine_bonus = 0
            
            # Bonus for pilots successful in both engines
            if (registry_data.get('space_victories', 0) > 0 and 
                registry_data.get('shell_victories', 0) > 0):
                cross_engine_bonus = 50.0  # 50 XP bonus for versatility
            
            return {
                'pilot_id': ship_id,
                'total_victories': total_victories,
                'space_victories': registry_data.get('space_victories', 0),
                'shell_victories': registry_data.get('shell_victories', 0),
                'total_xp': registry_data.get('total_xp', 0.0) + cross_engine_bonus,
                'last_engine_type': registry_data.get('last_engine_type', 'SPACE'),
                'engine_stats': engine_stats,
                'cross_engine_bonus': cross_engine_bonus,
                'is_versatile': (registry_data.get('space_victories', 0) > 0 and 
                               registry_data.get('shell_victories', 0) > 0)
            }
            
        except Exception as e:
            logger.error(f"🌍 Failed to get cross-engine summary: {e}")
            return {"error": str(e)}
    
    def get_versatile_aces(self, min_victories_per_engine: int = 3) -> List[Dict[str, Any]]:
        """Get pilots successful in both engines"""
        try:
            cursor = self.conn.execute("""
                SELECT ship_id, space_victories, shell_victories, total_xp
                FROM fleet_roster 
                WHERE space_victories >= ? AND shell_victories >= ?
                ORDER BY total_xp DESC
            """, (min_victories_per_engine, min_victories_per_engine))
            
            versatile_aces = []
            for row in cursor.fetchall():
                ship_id = row[0]
                summary = self.get_cross_engine_summary(ship_id)
                if 'error' not in summary:
                    versatile_aces.append(summary)
            
            return versatile_aces
            
        except Exception as e:
            logger.error(f"🌍 Failed to get versatile aces: {e}")
            return []
    
    def migrate_legacy_registry(self) -> bool:
        """Migrate existing registry data to universal format"""
        try:
            # Update existing records with default values
            self.conn.execute("""
                UPDATE fleet_roster 
                SET last_engine_type = 'SPACE',
                    space_victories = victories,
                    shell_victories = 0,
                    total_xp = damage_dealt * 0.1
                WHERE last_engine_type IS NULL
            """)
            
            self.conn.commit()
            logger.info("🌍 Migrated legacy registry to universal format")
            return True
            
        except Exception as e:
            logger.error(f"🌍 Migration failed: {e}")
            return False
    
    def export_pilot_for_engine_swap(self, ship_id: str) -> Optional[Dict[str, Any]]:
        """Export pilot data for engine swapping with full trait preservation"""
        try:
            # Get latest trait snapshot
            cursor = self.conn.execute("""
                SELECT trait_snapshot FROM cross_engine_history 
                WHERE ship_id = ? 
                ORDER BY timestamp DESC 
                LIMIT 1
            """, (ship_id,))
            
            trait_row = cursor.fetchone()
            trait_snapshot = json.loads(trait_row[0]) if trait_row else {}
            
            # Get current registry data
            summary = self.get_cross_engine_summary(ship_id)
            
            if 'error' in summary or not trait_snapshot:
                logger.warning(f"🌍 No trait data found for pilot {ship_id}")
                return None
            
            return {
                'ship_id': ship_id,
                'trait_snapshot': trait_snapshot,
                'registry_summary': summary,
                'export_timestamp': time.time()
            }
            
        except Exception as e:
            logger.error(f"🌍 Failed to export pilot: {e}")
            return None
    
    def import_pilot_from_engine_swap(self, pilot_data: Dict[str, Any], 
                                    new_engine_type: EngineType) -> bool:
        """Import pilot data after engine swap"""
        try:
            ship_id = pilot_data['ship_id']
            trait_snapshot = pilot_data.get('trait_snapshot', {})
            
            # Ensure pilot exists in registry
            self.register_ship(ship_id, "Unknown", 0)
            
            # Record engine swap
            self.record_cross_engine_feat(
                ship_id=ship_id,
                engine_type=new_engine_type,
                performance_score=0.0,  # No score for swap itself
                skirmish_id=f"engine_swap_{int(time.time())}",
                role="Swapped",
                generation=trait_snapshot.get('generation', 0),
                trait_snapshot=trait_snapshot
            )
            
            logger.info(f"🌍 Imported pilot {ship_id} for {new_engine_type.value} engine")
            return True
            
        except Exception as e:
            logger.error(f"🌍 Failed to import pilot: {e}")
            return False
    
    def move_to_graveyard(self, ship_id: str, death_cause: str = "unknown", epitaph: str = "Lost in battle"):
        """Move a ship to the graveyard"""
        try:
            # Get final stats and genome snapshot
            cursor = self.conn.execute("""
                SELECT generation, total_xp, space_victories, shell_victories, 
                       last_engine_type, trait_snapshot 
                FROM fleet_roster WHERE ship_id = ?
            """, (ship_id,))
            
            row = cursor.fetchone()
            if not row:
                logger.warning(f"🌍 Ship {ship_id} not found for graveyard transfer")
                return False
            
            final_stats = {
                "generation": row[0],
                "total_xp": row[1],
                "space_victories": row[2],
                "shell_victories": row[3],
                "last_engine_type": row[4]
            }
            
            genome_snapshot = row[5]
            
            # Move to graveyard
            success = self.graveyard_manager.move_to_graveyard(
                ship_id=ship_id,
                death_cause=death_cause,
                epitaph=epitaph,
                final_stats=final_stats,
                genome_snapshot=genome_snapshot
            )
            
            if success:
                logger.info(f"🌍 Moved {ship_id} to graveyard: {epitaph}")
            
            return success
            
        except Exception as e:
            logger.error(f"🌍 Failed to move {ship_id} to graveyard: {e}")
            return False
    
    def get_graveyard_summary(self) -> Dict[str, Any]:
        """Get graveyard summary"""
        return self.graveyard_manager.get_graveyard_stats()
    
    def get_recent_deaths(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent graveyard entries"""
        return self.graveyard_manager.get_graveyard_entries(limit)


# Factory function for easy initialization
def create_universal_registry(db_path: str = "roster.db") -> UniversalRegistry:
    """Create a UniversalRegistry instance"""
    return UniversalRegistry(db_path)


# Global instance (replaces legendary_registry)
universal_registry = create_universal_registry()
