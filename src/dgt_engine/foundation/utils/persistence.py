"""
Persistence Manager - Delta-based State Persistence

Compressed JSON delta storage with automatic backup and recovery.
The Persistence Manager ensures that all world state changes are
persisted efficiently while maintaining data integrity.

Key Features:
- Delta-based persistence (only save changes)
- Compressed JSON storage
- Automatic backup rotation
- Emergency save functionality
- Data integrity validation
"""

import json
import gzip
import time
import shutil
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
from dataclasses import dataclass, asdict
from datetime import datetime

from loguru import logger

from dgt_engine.foundation.constants import (
    PERSISTENCE_FORMAT, PERSISTENCE_COMPRESSION, PERSISTENCE_INTERVAL_TURNS,
    BACKUP_INTERVAL_TURNS, MAX_BACKUP_FILES, PERSISTENCE_FILE, BACKUP_DIRECTORY,
    EMERGENCY_SAVE_PREFIX
)
from dgt_engine.foundation.protocols import WorldStateSnapshot, EntityStateProtocol


@dataclass
class PersistenceMetadata:
    """Metadata for persistence files"""
    version: str = "2.0.0"
    timestamp: float = 0.0
    turn_count: int = 0
    delta_count: int = 0
    compressed: bool = True
    checksum: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PersistenceMetadata':
        """Create from dictionary"""
        return cls(**data)


class PersistenceManager:
    """Delta-based persistence manager with compression and backup"""
    
    def __init__(self, persistence_file: str = PERSISTENCE_FILE, 
                 backup_dir: str = BACKUP_DIRECTORY):
        self.persistence_file = Path(persistence_file)
        self.backup_dir = Path(backup_dir)
        
        # Ensure backup directory exists
        self.backup_dir.mkdir(exist_ok=True)
        
        # Persistence state
        self.last_save_turn: int = 0
        self.last_backup_turn: int = 0
        self.save_count: int = 0
        self.error_count: int = 0
        
        # Performance tracking
        self.save_times: List[float] = []
        self.load_times: List[float] = []
        
        logger.info(f"💾 Persistence Manager initialized: {self.persistence_file}")
    
    # === FACADE INTERFACE ===
    
    async def save_state(self, game_state: GameState) -> bool:
        """Save game state with delta compression (Facade method)"""
        start_time = time.time()
        
        try:
            # Check if save is needed
            if not self._should_save(game_state):
                return True
            
            # Create persistence data
            persistence_data = await self._create_persistence_data(game_state)
            
            # Save to file
            success = await self._save_to_file(persistence_data)
            
            if success:
                # Update tracking
                self.last_save_turn = game_state.turn_count
                self.save_count += 1
                
                # Check if backup is needed
                if self._should_backup(game_state):
                    await self._create_backup(persistence_data)
                    self.last_backup_turn = game_state.turn_count
                
                # Track performance
                save_time = (time.time() - start_time) * 1000
                self.save_times.append(save_time)
                if len(self.save_times) > 100:
                    self.save_times.pop(0)
                
                logger.debug(f"💾 State saved: turn {game_state.turn_count} in {save_time:.1f}ms")
            
            return success
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"💥 Save failed: {e}")
            return False
    
    async def load_state(self) -> Optional[GameState]:
        """Load game state from file (Facade method)"""
        start_time = time.time()
        
        try:
            if not self.persistence_file.exists():
                logger.info(f"💾 No persistence file found: {self.persistence_file}")
                return None
            
            # Load from file
            persistence_data = await self._load_from_file()
            
            if not persistence_data:
                return None
            
            # Reconstruct game state
            game_state = await self._reconstruct_game_state(persistence_data)
            
            # Track performance
            load_time = (time.time() - start_time) * 1000
            self.load_times.append(load_time)
            if len(self.load_times) > 100:
                self.load_times.pop(0)
            
            logger.info(f"💾 State loaded: turn {game_state.turn_count} in {load_time:.1f}ms")
            return game_state
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"💥 Load failed: {e}")
            return None
    
    def create_interest_delta(self, interest_point: InterestPoint) -> WorldDelta:
        """Create world delta for Interest Point manifestation (Facade method)"""
        return WorldDelta(
            position=interest_point.position,
            delta_type="interest_manifestation",
            timestamp=time.time(),
            data={
                "interest_type": interest_point.interest_type.value,
                "manifestation": interest_point.manifestation,
                "seed_value": interest_point.seed_value,
                "discovered_at": interest_point.manifestation_timestamp
            }
        )
    
    async def emergency_save(self, game_state: GameState) -> bool:
        """Emergency save with special filename (Facade method)"""
        timestamp = int(time.time())
        emergency_file = self.backup_dir / f"{EMERGENCY_SAVE_PREFIX}_{timestamp}.json"
        
        try:
            # Create persistence data
            persistence_data = await self._create_persistence_data(game_state)
            
            # Save without compression for emergency
            with open(emergency_file, 'w') as f:
                json.dump(persistence_data, f, indent=2, default=str)
            
            logger.warning(f"🚨 Emergency save created: {emergency_file}")
            return True
            
        except Exception as e:
            logger.error(f"💥 Emergency save failed: {e}")
            return False
    
    def get_persistence_stats(self) -> Dict[str, Any]:
        """Get persistence statistics (Facade method)"""
        avg_save_time = sum(self.save_times) / len(self.save_times) if self.save_times else 0
        avg_load_time = sum(self.load_times) / len(self.load_times) if self.load_times else 0
        
        return {
            "save_count": self.save_count,
            "error_count": self.error_count,
            "last_save_turn": self.last_save_turn,
            "last_backup_turn": self.last_backup_turn,
            "avg_save_time_ms": avg_save_time,
            "avg_load_time_ms": avg_load_time,
            "persistence_file_exists": self.persistence_file.exists(),
            "backup_files_count": len(list(self.backup_dir.glob("*.json*"))),
            "persistence_file_size": self.persistence_file.stat().st_size if self.persistence_file.exists() else 0
        }
    
    # === CORE PERSISTENCE METHODS ===
    
    async def _create_persistence_data(self, game_state: GameState) -> Dict[str, Any]:
        """Create persistence data structure"""
        # Create metadata
        metadata = PersistenceMetadata(
            version="2.0.0",
            timestamp=time.time(),
            turn_count=game_state.turn_count,
            delta_count=len(game_state.world_deltas),
            compressed=PERSISTENCE_COMPRESSION
        )
        
        # Create persistence data
        persistence_data = {
            "metadata": metadata.to_dict(),
            "game_state": {
                "version": game_state.version,
                "timestamp": game_state.timestamp,
                "player_position": game_state.player_position,
                "player_health": game_state.player_health,
                "player_status": game_state.player_status,
                "current_environment": game_state.current_environment,
                "world_seed": game_state.world_seed,
                "turn_count": game_state.turn_count,
                "frame_count": game_state.frame_count,
                "voyager_state": game_state.voyager_state.value if game_state.voyager_state else "idle"
            },
            "world_deltas": {
                f"{pos[0]},{pos[1]}": {
                    "position": pos,
                    "delta_type": delta.delta_type,
                    "timestamp": delta.timestamp,
                    "data": delta.data
                }
                for pos, delta in game_state.world_deltas.items()
            },
            "interest_points": [
                {
                    "position": ip.position,
                    "interest_type": ip.interest_type.value,
                    "seed_value": ip.seed_value,
                    "discovered": ip.discovered,
                    "manifestation": ip.manifestation,
                    "manifestation_timestamp": ip.manifestation_timestamp
                }
                for ip in game_state.interest_points
            ]
        }
        
        # Add checksum
        metadata.checksum = self._calculate_checksum(persistence_data)
        persistence_data["metadata"] = metadata.to_dict()
        
        return persistence_data
    
    async def _save_to_file(self, persistence_data: Dict[str, Any]) -> bool:
        """Save persistence data to file"""
        try:
            if PERSISTENCE_COMPRESSION:
                # Compressed save
                with gzip.open(f"{self.persistence_file}.gz", 'wt', encoding='utf-8') as f:
                    json.dump(persistence_data, f, indent=2, default=str)
                
                # Remove uncompressed file if exists
                if self.persistence_file.exists():
                    self.persistence_file.unlink()
            else:
                # Uncompressed save
                with open(self.persistence_file, 'w') as f:
                    json.dump(persistence_data, f, indent=2, default=str)
                
                # Remove compressed file if exists
                compressed_file = Path(f"{self.persistence_file}.gz")
                if compressed_file.exists():
                    compressed_file.unlink()
            
            return True
            
        except Exception as e:
            logger.error(f"💥 Save to file failed: {e}")
            return False
    
    async def _load_from_file(self) -> Optional[Dict[str, Any]]:
        """Load persistence data from file"""
        try:
            # Try compressed file first
            compressed_file = Path(f"{self.persistence_file}.gz")
            if compressed_file.exists():
                with gzip.open(compressed_file, 'rt', encoding='utf-8') as f:
                    persistence_data = json.load(f)
            elif self.persistence_file.exists():
                with open(self.persistence_file, 'r') as f:
                    persistence_data = json.load(f)
            else:
                return None
            
            # Validate checksum
            if not self._validate_checksum(persistence_data):
                logger.warning("💾 Checksum validation failed")
                return None
            
            return persistence_data
            
        except Exception as e:
            logger.error(f"💥 Load from file failed: {e}")
            return None
    
    async def _reconstruct_game_state(self, persistence_data: Dict[str, Any]) -> GameState:
        """Reconstruct game state from persistence data"""
        try:
            # Extract game state data
            game_state_data = persistence_data["game_state"]
            
            # Reconstruct game state
            game_state = GameState(
                version=game_state_data.get("version", "2.0.0"),
                timestamp=game_state_data.get("timestamp", time.time()),
                player_position=tuple(game_state_data.get("player_position", (10, 25))),
                player_health=game_state_data.get("player_health", 100),
                player_status=game_state_data.get("player_status", []),
                current_environment=game_state_data.get("current_environment", "forest"),
                world_seed=game_state_data.get("world_seed", "SEED_ZERO"),
                turn_count=game_state_data.get("turn_count", 0),
                frame_count=game_state_data.get("frame_count", 0)
            )
            
            # Reconstruct world deltas
            world_deltas_data = persistence_data.get("world_deltas", {})
            for pos_key, delta_data in world_deltas_data.items():
                pos = tuple(map(int, pos_key.split(",")))
                world_delta = WorldDelta(
                    position=pos,
                    delta_type=delta_data["delta_type"],
                    timestamp=delta_data["timestamp"],
                    data=delta_data["data"]
                )
                game_state.world_deltas[pos] = world_delta
            
            # Reconstruct interest points
            interest_points_data = persistence_data.get("interest_points", [])
            for ip_data in interest_points_data:
                interest_point = InterestPoint(
                    position=tuple(ip_data["position"]),
                    interest_type=InterestType(ip_data["interest_type"]),
                    seed_value=ip_data["seed_value"],
                    discovered=ip_data.get("discovered", False),
                    manifestation=ip_data.get("manifestation"),
                    manifestation_timestamp=ip_data.get("manifestation_timestamp")
                )
                game_state.interest_points.append(interest_point)
            
            return game_state
            
        except Exception as e:
            logger.error(f"💥 Game state reconstruction failed: {e}")
            raise
    
    async def _create_backup(self, persistence_data: Dict[str, Any]) -> bool:
        """Create backup of current persistence data"""
        try:
            timestamp = int(time.time())
            backup_file = self.backup_dir / f"backup_{timestamp}.json"
            
            if PERSISTENCE_COMPRESSION:
                backup_file = self.backup_dir / f"backup_{timestamp}.json.gz"
                with gzip.open(backup_file, 'wt', encoding='utf-8') as f:
                    json.dump(persistence_data, f, indent=2, default=str)
            else:
                with open(backup_file, 'w') as f:
                    json.dump(persistence_data, f, indent=2, default=str)
            
            # Clean up old backups
            await self._cleanup_old_backups()
            
            logger.debug(f"💾 Backup created: {backup_file}")
            return True
            
        except Exception as e:
            logger.error(f"💥 Backup creation failed: {e}")
            return False
    
    async def _cleanup_old_backups(self) -> None:
        """Clean up old backup files"""
        try:
            # Get all backup files
            backup_files = list(self.backup_dir.glob("backup_*.json*"))
            
            # Sort by modification time
            backup_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
            
            # Keep only the most recent files
            if len(backup_files) > MAX_BACKUP_FILES:
                for old_backup in backup_files[MAX_BACKUP_FILES:]:
                    old_backup.unlink()
                    logger.debug(f"💾 Removed old backup: {old_backup}")
            
        except Exception as e:
            logger.error(f"💾 Backup cleanup failed: {e}")
    
    # === UTILITY METHODS ===
    
    def _should_save(self, game_state: GameState) -> bool:
        """Check if state should be saved"""
        return game_state.turn_count >= self.last_save_turn + PERSISTENCE_INTERVAL_TURNS
    
    def _should_backup(self, game_state: GameState) -> bool:
        """Check if backup should be created"""
        return game_state.turn_count >= self.last_backup_turn + BACKUP_INTERVAL_TURNS
    
    def _calculate_checksum(self, data: Dict[str, Any]) -> str:
        """Calculate checksum for data integrity"""
        import hashlib
        
        # Create a deterministic string representation
        data_str = json.dumps(data, sort_keys=True, default=str)
        
        # Calculate MD5 hash
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def _validate_checksum(self, persistence_data: Dict[str, Any]) -> bool:
        """Validate data integrity with checksum"""
        try:
            metadata = persistence_data.get("metadata", {})
            stored_checksum = metadata.get("checksum", "")
            
            if not stored_checksum:
                return True  # No checksum to validate
            
            # Calculate current checksum
            current_checksum = self._calculate_checksum(persistence_data)
            
            return stored_checksum == current_checksum
            
        except Exception as e:
            logger.error(f"💾 Checksum validation error: {e}")
            return False
    
    # === RECOVERY METHODS ===
    
    def list_available_saves(self) -> List[Dict[str, Any]]:
        """List all available save files"""
        saves = []
        
        # Main save file
        if self.persistence_file.exists() or Path(f"{self.persistence_file}.gz").exists():
            saves.append({
                "type": "main",
                "file": str(self.persistence_file),
                "timestamp": self.persistence_file.stat().st_mtime if self.persistence_file.exists() else Path(f"{self.persistence_file}.gz").stat().st_mtime
            })
        
        # Backup files
        for backup_file in self.backup_dir.glob("backup_*.json*"):
            saves.append({
                "type": "backup",
                "file": str(backup_file),
                "timestamp": backup_file.stat().st_mtime
            })
        
        # Emergency saves
        for emergency_file in self.backup_dir.glob(f"{EMERGENCY_SAVE_PREFIX}_*.json"):
            saves.append({
                "type": "emergency",
                "file": str(emergency_file),
                "timestamp": emergency_file.stat().st_mtime
            })
        
        # Sort by timestamp (newest first)
        saves.sort(key=lambda s: s["timestamp"], reverse=True)
        
        return saves
    
    async def load_from_file(self, file_path: str) -> Optional[GameState]:
        """Load game state from specific file"""
        original_file = self.persistence_file
        
        try:
            # Temporarily set file path
            self.persistence_file = Path(file_path)
            
            # Load state
            game_state = await self.load_state()
            
            return game_state
            
        finally:
            # Restore original file path
            self.persistence_file = original_file
    
    def clear_all_data(self) -> bool:
        """Clear all persistence data"""
        try:
            # Remove main save file
            if self.persistence_file.exists():
                self.persistence_file.unlink()
            
            # Remove compressed main file
            compressed_file = Path(f"{self.persistence_file}.gz")
            if compressed_file.exists():
                compressed_file.unlink()
            
            # Remove backup directory
            if self.backup_dir.exists():
                shutil.rmtree(self.backup_dir)
                self.backup_dir.mkdir(exist_ok=True)
            
            # Reset tracking
            self.last_save_turn = 0
            self.last_backup_turn = 0
            self.save_count = 0
            self.error_count = 0
            
            logger.info("💾 All persistence data cleared")
            return True
            
        except Exception as e:
            logger.error(f"💾 Clear data failed: {e}")
            return False


# === FACTORY ===

class PersistenceManagerFactory:
    """Factory for creating Persistence Manager instances"""
    
    @staticmethod
    def create_manager(persistence_file: str = PERSISTENCE_FILE, 
                      backup_dir: str = BACKUP_DIRECTORY) -> PersistenceManager:
        """Create a Persistence Manager with default configuration"""
        return PersistenceManager(persistence_file, backup_dir)
    
    @staticmethod
    def create_test_manager() -> PersistenceManager:
        """Create a Persistence Manager for testing"""
        return PersistenceManager("test_persistence.json", "test_backups")
