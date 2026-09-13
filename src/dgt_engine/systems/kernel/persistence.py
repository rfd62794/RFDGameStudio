"""
Legendary Registry - Fleet Performance Persistence
ADR 145: Persistence for Fleet Victories & Ace Pilot Tracking

Handles the persistence of 'Ace' pilots and fleet prestige with
SQLite backend for 5v5 skirmish metrics and narrative generation.
"""

import sqlite3
import json
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path

from loguru import logger


@dataclass
class ShipPerformance:
    """Performance metrics for a single ship"""
    ship_id: str
    role: str
    generation: int
    victories: int = 0
    damage_dealt: float = 0.0
    damage_taken: float = 0.0
    last_commander_signal: str = ""
    narrative_summary: str = ""
    mvp_count: int = 0
    total_skirmishes: int = 0
    accuracy_score: float = 0.0
    survival_rate: float = 0.0
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ShipPerformance':
        return cls(**data)
    
    def calculate_combat_rating(self) -> float:
        """Calculate overall combat rating for leaderboard"""
        if self.total_skirmishes == 0:
            return 0.0
        
        win_rate = self.victories / self.total_skirmishes
        avg_damage = self.damage_dealt / self.total_skirmishes
        survival_bonus = self.survival_rate * 0.2
        mvp_bonus = self.mvp_count * 0.1
        
        rating = (win_rate * 50) + (avg_damage * 0.01) + (survival_bonus * 100) + (mvp_bonus * 100)
        return min(rating, 100.0)  # Cap at 100


class LegendaryRegistry:
    """Handles the persistence of 'Ace' pilots and fleet prestige."""
    
    def __init__(self, db_path: str = "data/roster.db"):
        self.db_path = db_path
        self.conn = None
        self._init_db()
        logger.info(f"🏆 Legendary Registry initialized: {self.db_path}")
    
    def _init_db(self):
        """Initialize database and create tables"""
        from pathlib import Path
        db_path = Path(self.db_path)
        
        # Create directory if it doesn't exist
        db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        
        # ADR 145: Persistence for Fleet Victories
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS fleet_roster (
                ship_id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                generation INTEGER NOT NULL,
                victories INTEGER DEFAULT 0,
                damage_dealt REAL DEFAULT 0.0,
                damage_taken REAL DEFAULT 0.0,
                last_commander_signal TEXT,
                narrative_summary TEXT,
                mvp_count INTEGER DEFAULT 0,
                total_skirmishes INTEGER DEFAULT 0,
                accuracy_score REAL DEFAULT 0.0,
                survival_rate REAL DEFAULT 0.0,
                created_at REAL DEFAULT 0.0,
                last_active REAL DEFAULT 0.0
            )
        """)
        
        # Create indexes for performance queries
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_victories ON fleet_roster(victories)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_generation ON fleet_roster(generation)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_role ON fleet_roster(role)")
        self.conn.execute("CREATE INDEX IF NOT EXISTS idx_mvp_count ON fleet_roster(mvp_count)")
        
        # Skirmish history table for detailed analytics
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS skirmish_history (
                skirmish_id TEXT PRIMARY KEY,
                timestamp REAL NOT NULL,
                fleet_id TEXT NOT NULL,
                outcome TEXT NOT NULL,
                total_damage_dealt REAL DEFAULT 0.0,
                total_damage_taken REAL DEFAULT 0.0,
                mvp_ship_id TEXT,
                duration_seconds REAL,
                commander_signals TEXT
            )
        """)
        
        self.conn.commit()
    
    def register_ship(self, ship_id: str, role: str, generation: int) -> bool:
        """Register a new ship in the fleet roster"""
        try:
            current_time = time.time()
            self.conn.execute("""
                INSERT OR IGNORE INTO fleet_roster 
                (ship_id, role, generation, created_at, last_active)
                VALUES (?, ?, ?, ?, ?)
            """, (ship_id, role, generation, current_time, current_time))
            
            self.conn.commit()
            logger.debug(f"🏆 Registered ship: {ship_id} ({role})")
            return True
            
        except Exception as e:
            logger.error(f"🏆 Ship registration failed: {e}")
            return False
    
    def record_skirmish_results(self, ship_id: str, damage_dealt: float, 
                              damage_taken: float, won: bool, accuracy: float = 0.0) -> bool:
        """Updates the 'Legendary' status based on 5v5 performance"""
        try:
            victory_increment = 1 if won else 0
            skirmish_increment = 1
            
            # Update ship performance
            self.conn.execute("""
                UPDATE fleet_roster 
                SET victories = victories + ?, 
                    damage_dealt = damage_dealt + ?,
                    damage_taken = damage_taken + ?,
                    total_skirmishes = total_skirmishes + ?,
                    accuracy_score = (accuracy_score + ?) / 2,
                    survival_rate = CAST(victories AS REAL) / CAST(total_skirmishes + 1 AS REAL),
                    last_active = ?
                WHERE ship_id = ?
            """, (victory_increment, damage_dealt, damage_taken, skirmish_increment, 
                  accuracy, time.time(), ship_id))
            
            self.conn.commit()
            logger.debug(f"🏆 Recorded skirmish for {ship_id}: {'VICTORY' if won else 'DEFEAT'}")
            return True
            
        except Exception as e:
            logger.error(f"🏆 Skirmish recording failed: {e}")
            return False
    
    def award_mvp(self, ship_id: str) -> bool:
        """Award MVP status to a ship for exceptional performance"""
        try:
            self.conn.execute("""
                UPDATE fleet_roster 
                SET mvp_count = mvp_count + 1,
                    narrative_summary = CASE 
                        WHEN narrative_summary = '' THEN 'MVP pilot with exceptional combat performance'
                        ELSE narrative_summary || '; MVP award recipient'
                    END
                WHERE ship_id = ?
            """, (ship_id,))
            
            self.conn.commit()
            logger.info(f"🏆 MVP awarded to: {ship_id}")
            return True
            
        except Exception as e:
            logger.error(f"🏆 MVP award failed: {e}")
            return False
    
    def update_commander_signal(self, ship_id: str, signal: str) -> bool:
        """Update the last commander signal for this ship"""
        try:
            self.conn.execute("""
                UPDATE fleet_roster 
                SET last_commander_signal = ?
                WHERE ship_id = ?
            """, (signal, ship_id))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"🏆 Signal update failed: {e}")
            return False
    
    def get_top_aces(self, limit: int = 3, metric: str = "combat_rating") -> List[ShipPerformance]:
        """Get top ace pilots by specified metric"""
        valid_metrics = {
            "combat_rating": "victories, damage_dealt, mvp_count, total_skirmishes",
            "victories": "victories DESC",
            "damage_dealt": "damage_dealt DESC", 
            "mvp_count": "mvp_count DESC",
            "win_rate": "CAST(victories AS REAL) / NULLIF(total_skirmishes, 1) DESC"
        }
        
        order_by = valid_metrics.get(metric, valid_metrics["combat_rating"])
        
        try:
            cursor = self.conn.execute(f"""
                SELECT * FROM fleet_roster 
                WHERE total_skirmishes > 0
                ORDER BY {order_by}
                LIMIT ?
            """, (limit,))
            
            aces = []
            for row in cursor.fetchall():
                columns = [desc[0] for desc in cursor.description]
                data = dict(zip(columns, row))
                aces.append(ShipPerformance.from_dict(data))
            
            return aces
            
        except Exception as e:
            logger.error(f"🏆 Failed to get top aces: {e}")
            return []
    
    def get_ship_performance(self, ship_id: str) -> Optional[ShipPerformance]:
        """Get detailed performance for a specific ship"""
        try:
            cursor = self.conn.execute("""
                SELECT * FROM fleet_roster WHERE ship_id = ?
            """, (ship_id,))
            
            row = cursor.fetchone()
            if row:
                columns = [desc[0] for desc in cursor.description]
                data = dict(zip(columns, row))
                return ShipPerformance.from_dict(data)
            
            return None
            
        except Exception as e:
            logger.error(f"🏆 Failed to get ship performance: {e}")
            return None
    
    def get_fleet_statistics(self) -> Dict[str, Any]:
        """Get comprehensive fleet statistics"""
        try:
            cursor = self.conn.execute("""
                SELECT 
                    COUNT(*) as total_ships,
                    SUM(victories) as total_victories,
                    SUM(total_skirmishes) as total_skirmishes,
                    SUM(damage_dealt) as total_damage_dealt,
                    SUM(mvp_count) as total_mvps,
                    AVG(CAST(victories AS REAL) / NULLIF(total_skirmishes, 1)) as avg_win_rate,
                    MAX(generation) as max_generation
                FROM fleet_roster
                WHERE total_skirmishes > 0
            """)
            
            stats = cursor.fetchone()
            columns = [desc[0] for desc in cursor.description]
            fleet_stats = dict(zip(columns, stats))
            
            # Convert None values to 0
            for key, value in fleet_stats.items():
                if value is None:
                    fleet_stats[key] = 0
            
            return fleet_stats
            
        except Exception as e:
            logger.error(f"🏆 Failed to get fleet statistics: {e}")
            return {}
    
    def generate_narrative_payload(self, ship_id: str) -> Optional[Dict[str, Any]]:
        """Generate JSON payload for LLM narrative generation"""
        performance = self.get_ship_performance(ship_id)
        if not performance:
            return None
        
        payload = {
            "pilot_name": ship_id,
            "role": performance.role,
            "generation": performance.generation,
            "combat_record": {
                "skirmishes_survived": performance.total_skirmishes,
                "victories_achieved": performance.victories,
                "win_rate": performance.victories / performance.total_skirmishes if performance.total_skirmishes > 0 else 0,
                "damage_dealt": performance.damage_dealt,
                "mvp_awards": performance.mvp_count
            },
            "combat_style": {
                "accuracy": performance.accuracy_score,
                "survival_rate": performance.survival_rate,
                "avg_damage_per_skirmish": performance.damage_dealt / performance.total_skirmishes if performance.total_skirmishes > 0 else 0
            },
            "narrative_seed": performance.narrative_summary or "Ace pilot showing exceptional promise"
        }
        
        return payload
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.debug("🏆 Legendary Registry closed")


# Factory function for easy initialization
def create_legendary_registry(db_path: str = "roster.db") -> LegendaryRegistry:
    """Create a Legendary Registry instance"""
    return LegendaryRegistry(db_path)


# Global instance for system-wide access
legendary_registry = create_legendary_registry()
