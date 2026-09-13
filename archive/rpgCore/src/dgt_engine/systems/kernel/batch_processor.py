"""
Batch Update Logic - Thread-Safe Post-Battle Recording
Ensures data integrity during parallel simulation execution
"""

import sqlite3
import threading
import time
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor, as_completed

from loguru import logger


@dataclass
class BatchUpdateRequest:
    """Single batch update request for thread-safe processing"""
    skirmish_id: str
    ship_updates: List[Dict[str, Any]]
    mvp_candidate: Optional[str] = None
    timestamp: float = 0.0
    
    def __post_init__(self):
        if self.timestamp == 0.0:
            self.timestamp = time.time()


class ThreadSafeBatchProcessor:
    """Thread-safe batch processor for post-battle updates"""
    
    def __init__(self, db_path: str = "data/roster.db", max_workers: int = 2):
        self.db_path = db_path
        self.max_workers = max_workers
        self._lock = threading.RLock()  # Reentrant lock for nested calls
        self._pending_updates: List[BatchUpdateRequest] = []
        self._batch_size = 10
        self._batch_timeout = 1.0  # seconds
        
        logger.debug(f"🔄 ThreadSafeBatchProcessor initialized: {db_path}")
    
    @contextmanager
    def get_db_connection(self):
        """Thread-safe database connection context manager"""
        with self._lock:
            conn = sqlite3.connect(self.db_path, timeout=30.0)
            conn.execute("PRAGMA journal_mode=WAL")  # Enable WAL mode for concurrent access
            conn.execute("PRAGMA synchronous=NORMAL")  # Balance safety and performance
            try:
                yield conn
            finally:
                conn.close()
    
    def submit_batch_update(self, skirmish_data: Dict[str, Any]) -> bool:
        """Submit batch update request for thread-safe processing"""
        try:
            # Create batch request
            request = BatchUpdateRequest(
                skirmish_id=skirmish_data.get("skirmish_id", f"batch_{int(time.time())}"),
                ship_updates=skirmish_data.get("ship_updates", []),
                mvp_candidate=skirmish_data.get("mvp_candidate")
            )
            
            with self._lock:
                self._pending_updates.append(request)
                
                # Process batch if we've reached threshold
                if len(self._pending_updates) >= self._batch_size:
                    return self._process_batch()
            
            logger.debug(f"🔄 Submitted batch update: {request.skirmish_id}")
            return True
            
        except Exception as e:
            logger.error(f"🔄 Failed to submit batch update: {e}")
            return False
    
    def _process_batch(self) -> bool:
        """Process all pending updates in a single transaction"""
        if not self._pending_updates:
            return True
        
        try:
            with self.get_db_connection() as conn:
                # Start transaction
                conn.execute("BEGIN IMMEDIATE")
                
                success_count = 0
                
                for request in self._pending_updates:
                    try:
                        # Process ship updates
                        for update in request.ship_updates:
                            self._update_ship_performance(conn, update)
                        
                        # Award MVP if applicable
                        if request.mvp_candidate:
                            self._award_mvp(conn, request.mvp_candidate, request.skirmish_id)
                        
                        # Record skirmish history
                        self._record_skirmish(conn, request)
                        
                        success_count += 1
                        
                    except Exception as e:
                        logger.error(f"🔄 Failed to process {request.skirmish_id}: {e}")
                        conn.rollback()  # Rollback on error
                        return False
                
                # Commit transaction
                conn.commit()
                
                # Clear processed updates
                self._pending_updates.clear()
                
                logger.info(f"🔄 Processed batch: {success_count} skirmishes")
                return True
                
        except Exception as e:
            logger.error(f"🔄 Batch processing failed: {e}")
            return False
    
    def _update_ship_performance(self, conn: sqlite3.Connection, update: Dict[str, Any]):
        """Update individual ship performance"""
        ship_id = update['ship_id']
        damage_dealt = update['damage_dealt']
        damage_taken = update['damage_taken']
        won = update['won']
        accuracy = update['accuracy']
        
        # Register ship if not exists
        conn.execute("""
            INSERT OR IGNORE INTO fleet_roster 
            (ship_id, role, generation, created_at, last_active)
            VALUES (?, ?, ?, ?, ?)
        """, (
            ship_id,
            update.get('role', 'Fighter'),
            update.get('generation', 1),
            time.time(),
            time.time()
        ))
        
        # Update performance
        conn.execute("""
            UPDATE fleet_roster 
            SET victories = victories + ?, 
                damage_dealt = damage_dealt + ?,
                damage_taken = damage_taken + ?,
                total_skirmishes = total_skirmishes + 1,
                accuracy_score = (accuracy_score + ?) / 2,
                survival_rate = CAST(victories AS REAL) / CAST(total_skirmishes + 1 AS REAL),
                last_active = ?
            WHERE ship_id = ?
        """, (1 if won else 0, damage_dealt, damage_taken, accuracy, time.time(), ship_id))
    
    def _award_mvp(self, conn: sqlite3.Connection, ship_id: str, skirmish_id: str):
        """Award MVP to ship"""
        conn.execute("""
            UPDATE fleet_roster 
            SET mvp_count = mvp_count + 1,
                narrative_summary = CASE 
                    WHEN narrative_summary = '' THEN ? || ' MVP'
                    ELSE narrative_summary || '; ' || ? || ' MVP'
                END
            WHERE ship_id = ?
        """, (skirmish_id, skirmish_id, ship_id))
    
    def _record_skirmish(self, conn: sqlite3.Connection, request: BatchUpdateRequest):
        """Record skirmish in history"""
        total_damage = sum(u['damage_dealt'] for u in request.ship_updates)
        total_taken = sum(u['damage_taken'] for u in request.ship_updates)
        
        conn.execute("""
            INSERT OR REPLACE INTO skirmish_history 
            (skirmish_id, timestamp, fleet_id, outcome, 
             total_damage_dealt, total_damage_taken, mvp_ship_id,
             duration_seconds, commander_signals)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            request.skirmish_id,
            request.timestamp,
            "unknown_fleet",  # Would be set by caller
            "victory",  # Would be calculated from ship data
            total_damage,
            total_taken,
            request.mvp_candidate,
            0.0,  # Duration would be set by caller
            "[]"   # Commander signals would be set by caller
        ))
    
    def force_process_batch(self) -> bool:
        """Force process all pending updates"""
        with self._lock:
            return self._process_batch()
    
    def get_pending_count(self) -> int:
        """Get number of pending updates"""
        with self._lock:
            return len(self._pending_updates)
    
    def clear_pending(self):
        """Clear all pending updates (emergency use only)"""
        with self._lock:
            self._pending_updates.clear()
            logger.warning("🔄 Cleared all pending batch updates")


# Factory function for easy initialization
def create_batch_processor(db_path: str = "roster.db") -> ThreadSafeBatchProcessor:
    """Create a ThreadSafeBatchProcessor instance"""
    return ThreadSafeBatchProcessor(db_path)


# Global batch processor instance
batch_processor = create_batch_processor("roster.db")


# Integration function for PostBattleReporter
def create_batch_update_data(skirmish_metrics) -> Dict[str, Any]:
    """Convert skirmish metrics to batch update format"""
    ship_updates = []
    
    for ship_id, performance in skirmish_metrics.ship_performances.items():
        update = {
            'ship_id': ship_id,
            'damage_dealt': performance["damage_dealt"],
            'damage_taken': performance["damage_taken"],
            'won': skirmish_metrics.outcome.value == "victory",
            'accuracy': performance["accuracy"],
            'role': performance.get("role", "Fighter"),
            'generation': performance.get("generation", 1)
        }
        ship_updates.append(update)
    
    return {
        'skirmish_id': skirmish_metrics.skirmish_id,
        'ship_updates': ship_updates,
        'mvp_candidate': skirmish_metrics.mvp_candidate
    }
