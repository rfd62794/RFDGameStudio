"""
Delta Save System for DGT Prefabs

Implements incremental saving and loading of world state changes.
Tracks deltas to enable efficient prefab management and version control.
Supports undo/redo functionality and change tracking.

Features:
- Delta-based saving (only changes, not full world)
- Version control for prefabs
- Undo/redo functionality
- Change tracking and metadata
- Compression for large prefabs
- Import/export compatibility
"""

import json
import gzip
import hashlib
import time
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, field, asdict
from pathlib import Path
from enum import Enum
import pickle

from loguru import logger

# Import DGT components - Foundation only
try:
    from dgt_engine.foundation.types import Result
    from dgt_engine.foundation.protocols import WorldStateSnapshot, EntityStateProtocol
except ImportError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.error(f"Failed to import Foundation components: {e}")


class ChangeType(Enum):
    """Types of changes that can be tracked"""
    TILE_CHANGE = "tile_change"
    SURFACE_CHANGE = "surface_change"
    ENTITY_SPAWN = "entity_spawn"
    ENTITY_REMOVE = "entity_remove"
    PROPERTY_CHANGE = "property_change"


@dataclass
class DeltaChange:
    """Single delta change record"""
    timestamp: float
    change_type: ChangeType
    position: Tuple[int, int]
    old_value: Any
    new_value: Any
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'timestamp': self.timestamp,
            'change_type': self.change_type.value,
            'position': self.position,
            'old_value': self._serialize_value(self.old_value),
            'new_value': self._serialize_value(self.new_value),
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DeltaChange':
        """Create from dictionary"""
        return cls(
            timestamp=data['timestamp'],
            change_type=ChangeType(data['change_type']),
            position=tuple(data['position']),
            old_value=cls._deserialize_value(data['old_value']),
            new_value=cls._deserialize_value(data['new_value']),
            metadata=data.get('metadata', {})
        )
    
    def _serialize_value(self, value: Any) -> Any:
        """Serialize value for storage"""
        if isinstance(value, (TileType, SurfaceState)):
            return value.name
        elif isinstance(value, (list, tuple)):
            return list(value)
        else:
            return value
    
    def _deserialize_value(self, value: Any) -> Any:
        """Deserialize value from storage"""
        if isinstance(value, str):
            # Try to convert back to enum
            try:
                return TileType[value]
            except KeyError:
                try:
                    return SurfaceState[value]
                except KeyError:
                    return value
        return value


@dataclass
class PrefabMetadata:
    """Metadata for prefab files"""
    name: str
    description: str
    created_at: float
    modified_at: float
    created_by: str
    version: str
    checksum: str
    change_count: int
    tags: List[str] = field(default_factory=list)
    dependencies: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PrefabMetadata':
        """Create from dictionary"""
        return cls(**data)


@dataclass
class PrefabDelta:
    """Complete prefab with delta changes"""
    metadata: PrefabMetadata
    base_state: Optional[Dict[str, Any]]  # Original state (for full prefabs)
    changes: List[DeltaChange] = field(default_factory=list)
    
    def apply_to_world(self, world_engine: WorldEngine) -> None:
        """Apply delta changes to world engine"""
        for change in self.changes:
            self._apply_change(world_engine, change)
    
    def _apply_change(self, world_engine: WorldEngine, change: DeltaChange) -> None:
        """Apply single change to world engine"""
        x, y = change.position
        
        if change.change_type == ChangeType.TILE_CHANGE:
            world_engine.set_tile(x, y, change.new_value)
        elif change.change_type == ChangeType.SURFACE_CHANGE:
            world_engine.apply_surface(x, y, change.new_value)
        # Add other change types as needed
    
    def calculate_checksum(self) -> str:
        """Calculate checksum for integrity verification"""
        # Create a deterministic string representation
        content = f"{self.metadata.name}_{self.metadata.version}_{len(self.changes)}"
        for change in sorted(self.changes, key=lambda c: (c.position, c.timestamp)):
            content += f"{change.position}_{change.change_type.value}_{change.new_value}"
        
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'metadata': self.metadata.to_dict(),
            'base_state': self.base_state,
            'changes': [change.to_dict() for change in self.changes]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PrefabDelta':
        """Create from dictionary"""
        return cls(
            metadata=PrefabMetadata.from_dict(data['metadata']),
            base_state=data.get('base_state'),
            changes=[DeltaChange.from_dict(change) for change in data.get('changes', [])]
        )


class DeltaSaveSystem:
    """Delta save system for prefab management"""
    
    def __init__(self, prefabs_dir: str = "assets/prefabs"):
        self.prefabs_dir = Path(prefabs_dir)
        self.prefabs_dir.mkdir(parents=True, exist_ok=True)
        
        # Delta tracking
        self.active_changes: List[DeltaChange] = []
        self.undo_stack: List[List[DeltaChange]] = []
        self.redo_stack: List[List[DeltaChange]] = []
        
        # Cache
        self._prefab_cache: Dict[str, PrefabDelta] = {}
        
        logger.info(f"💾 Delta Save System initialized: {self.prefabs_dir}")
    
    def track_tile_change(self, x: int, y: int, old_tile: TileType, new_tile: TileType) -> None:
        """Track a tile change"""
        change = DeltaChange(
            timestamp=time.time(),
            change_type=ChangeType.TILE_CHANGE,
            position=(x, y),
            old_value=old_tile,
            new_value=new_tile,
            metadata={'source': 'user_action'}
        )
        
        self.active_changes.append(change)
        logger.debug(f"🔄 Tracked tile change: ({x}, {y}) {old_tile.name} → {new_tile.name}")
    
    def track_surface_change(self, x: int, y: int, old_surface: SurfaceState, new_surface: SurfaceState) -> None:
        """Track a surface change"""
        change = DeltaChange(
            timestamp=time.time(),
            change_type=ChangeType.SURFACE_CHANGE,
            position=(x, y),
            old_value=old_surface,
            new_value=new_surface,
            metadata={'source': 'user_action'}
        )
        
        self.active_changes.append(change)
        logger.debug(f"🔄 Tracked surface change: ({x}, {y}) {old_surface.name} → {new_surface.name}")
    
    def begin_operation(self) -> None:
        """Begin a new operation for undo/redo"""
        # Clear redo stack when starting new operation
        self.redo_stack.clear()
    
    def end_operation(self) -> None:
        """End current operation and add to undo stack"""
        if self.active_changes:
            self.undo_stack.append(self.active_changes.copy())
            self.active_changes.clear()
            
            # Limit undo stack size
            if len(self.undo_stack) > 50:
                self.undo_stack.pop(0)
    
    def undo(self, world_engine: WorldEngine) -> bool:
        """Undo last operation"""
        if not self.undo_stack:
            return False
        
        # Get last operation
        last_changes = self.undo_stack.pop()
        
        # Reverse changes and apply
        reversed_changes = []
        for change in reversed(last_changes):
            # Create inverse change
            inverse_change = DeltaChange(
                timestamp=time.time(),
                change_type=change.change_type,
                position=change.position,
                old_value=change.new_value,
                new_value=change.old_value,
                metadata={'source': 'undo'}
            )
            
            # Apply inverse change
            self._apply_change(world_engine, inverse_change)
            reversed_changes.append(inverse_change)
        
        # Add to redo stack
        self.redo_stack.append(reversed_changes)
        
        logger.info(f"↩️ Undid operation with {len(last_changes)} changes")
        return True
    
    def redo(self, world_engine: WorldEngine) -> bool:
        """Redo last undone operation"""
        if not self.redo_stack:
            return False
        
        # Get last redo operation
        redo_changes = self.redo_stack.pop()
        
        # Apply changes
        for change in redo_changes:
            self._apply_change(world_engine, change)
        
        # Add back to undo stack
        self.undo_stack.append(redo_changes)
        
        logger.info(f"↪️ Redid operation with {len(redo_changes)} changes")
        return True
    
    def _apply_change(self, world_engine: WorldEngine, change: DeltaChange) -> None:
        """Apply a single change"""
        x, y = change.position
        
        if change.change_type == ChangeType.TILE_CHANGE:
            world_engine.set_tile(x, y, change.new_value)
        elif change.change_type == ChangeType.SURFACE_CHANGE:
            world_engine.apply_surface(x, y, change.new_value)
    
    def create_prefab(self, 
                     name: str, 
                     description: str = "",
                     world_engine: Optional[WorldEngine] = None,
                     region: Optional[Tuple[int, int, int, int]] = None) -> PrefabDelta:
        """Create a new prefab from current changes or world state"""
        timestamp = time.time()
        
        # Determine changes to include
        if world_engine and region:
            # Extract changes from world region
            changes = self._extract_region_changes(world_engine, region)
            base_state = self._extract_base_state(world_engine, region)
        else:
            # Use active changes
            changes = self.active_changes.copy()
            base_state = None
        
        # Create metadata
        metadata = PrefabMetadata(
            name=name,
            description=description,
            created_at=timestamp,
            modified_at=timestamp,
            created_by="DeltaSaveSystem",
            version="1.0",
            checksum="",  # Will be calculated
            change_count=len(changes),
            tags=["user_created"]
        )
        
        # Create prefab
        prefab = PrefabDelta(
            metadata=metadata,
            base_state=base_state,
            changes=changes
        )
        
        # Calculate checksum
        prefab.metadata.checksum = prefab.calculate_checksum()
        
        logger.info(f"🏗️ Created prefab '{name}' with {len(changes)} changes")
        return prefab
    
    def save_prefab(self, prefab: PrefabDelta, compress: bool = True) -> bool:
        """Save prefab to file"""
        try:
            # Update metadata
            prefab.metadata.modified_at = time.time()
            prefab.metadata.checksum = prefab.calculate_checksum()
            
            # Prepare file path
            filename = f"{prefab.metadata.name}.{'dgt.gz' if compress else 'dgt'}"
            filepath = self.prefabs_dir / filename
            
            # Convert to dictionary
            prefab_dict = prefab.to_dict()
            
            # Save file
            if compress:
                with gzip.open(filepath, 'wt', encoding='utf-8') as f:
                    json.dump(prefab_dict, f, indent=2)
            else:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(prefab_dict, f, indent=2)
            
            # Update cache
            cache_key = prefab.metadata.name
            self._prefab_cache[cache_key] = prefab
            
            # Clear active changes
            self.active_changes.clear()
            
            logger.info(f"💾 Saved prefab '{prefab.metadata.name}' to {filepath}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save prefab '{prefab.metadata.name}': {e}")
            return False
    
    def load_prefab(self, name: str) -> Optional[PrefabDelta]:
        """Load prefab from file"""
        # Check cache first
        if name in self._prefab_cache:
            return self._prefab_cache[name]
        
        # Try compressed file first
        filepath_gz = self.prefabs_dir / f"{name}.dgt.gz"
        filepath_json = self.prefabs_dir / f"{name}.dgt"
        
        try:
            # Determine file to load
            if filepath_gz.exists():
                filepath = filepath_gz
                with gzip.open(filepath, 'rt', encoding='utf-8') as f:
                    prefab_dict = json.load(f)
            elif filepath_json.exists():
                filepath = filepath_json
                with open(filepath, 'r', encoding='utf-8') as f:
                    prefab_dict = json.load(f)
            else:
                logger.warning(f"⚠️ Prefab '{name}' not found")
                return None
            
            # Create prefab from dictionary
            prefab = PrefabDelta.from_dict(prefab_dict)
            
            # Verify checksum
            calculated_checksum = prefab.calculate_checksum()
            if calculated_checksum != prefab.metadata.checksum:
                logger.warning(f"⚠️ Prefab '{name}' checksum mismatch: {calculated_checksum} vs {prefab.metadata.checksum}")
            
            # Cache the prefab
            self._prefab_cache[name] = prefab
            
            logger.info(f"📂 Loaded prefab '{name}' from {filepath}")
            return prefab
            
        except Exception as e:
            logger.error(f"❌ Failed to load prefab '{name}': {e}")
            return None
    
    def apply_prefab(self, name: str, world_engine: WorldEngine) -> bool:
        """Apply prefab to world engine"""
        prefab = self.load_prefab(name)
        if not prefab:
            return False
        
        try:
            # Begin operation for undo support
            self.begin_operation()
            
            # Apply changes
            prefab.apply_to_world(world_engine)
            
            # End operation
            self.end_operation()
            
            logger.info(f"🎯 Applied prefab '{name}' to world")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to apply prefab '{name}': {e}")
            return False
    
    def list_prefabs(self) -> List[Dict[str, Any]]:
        """List all available prefabs"""
        prefabs = []
        
        for filepath in self.prefabs_dir.glob("*.dgt*"):
            try:
                # Extract name from filename
                name = filepath.stem
                
                # Try to load metadata without loading full prefab
                if filepath.suffix == '.gz':
                    with gzip.open(filepath, 'rt', encoding='utf-8') as f:
                        data = json.load(f)
                else:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                
                metadata = PrefabMetadata.from_dict(data['metadata'])
                
                prefabs.append({
                    'name': metadata.name,
                    'description': metadata.description,
                    'created_at': metadata.created_at,
                    'modified_at': metadata.modified_at,
                    'version': metadata.version,
                    'change_count': metadata.change_count,
                    'tags': metadata.tags,
                    'file_size': filepath.stat().st_size,
                    'compressed': filepath.suffix == '.gz'
                })
                
            except Exception as e:
                logger.warning(f"⚠️ Failed to read prefab metadata from {filepath}: {e}")
        
        # Sort by name
        prefabs.sort(key=lambda p: p['name'])
        return prefabs
    
    def delete_prefab(self, name: str) -> bool:
        """Delete a prefab"""
        try:
            # Delete both compressed and uncompressed versions
            deleted = False
            
            for filepath in [self.prefabs_dir / f"{name}.dgt.gz", self.prefabs_dir / f"{name}.dgt"]:
                if filepath.exists():
                    filepath.unlink()
                    deleted = True
            
            if deleted:
                # Remove from cache
                self._prefab_cache.pop(name, None)
                logger.info(f"🗑️ Deleted prefab '{name}'")
                return True
            else:
                logger.warning(f"⚠️ Prefab '{name}' not found for deletion")
                return False
                
        except Exception as e:
            logger.error(f"❌ Failed to delete prefab '{name}': {e}")
            return False
    
    def _extract_region_changes(self, world_engine: WorldEngine, region: Tuple[int, int, int, int]) -> List[DeltaChange]:
        """Extract changes from a world region"""
        x1, y1, x2, y2 = region
        changes = []
        
        # This would extract all changes in the region
        # For now, return empty list as placeholder
        return changes
    
    def _extract_base_state(self, world_engine: WorldEngine, region: Tuple[int, int, int, int]) -> Dict[str, Any]:
        """Extract base state from a world region"""
        # This would extract the complete state of the region
        # For now, return empty dict as placeholder
        return {}
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get system statistics"""
        prefab_list = self.list_prefabs()
        
        return {
            'total_prefabs': len(prefab_list),
            'total_changes': len(self.active_changes),
            'undo_stack_size': len(self.undo_stack),
            'redo_stack_size': len(self.redo_stack),
            'cache_size': len(self._prefab_cache),
            'prefabs_dir': str(self.prefabs_dir),
            'total_file_size': sum(p['file_size'] for p in prefab_list),
            'compressed_prefabs': sum(1 for p in prefab_list if p['compressed'])
        }


# Global instance
_delta_save_system: Optional[DeltaSaveSystem] = None


def get_delta_save_system(prefabs_dir: str = "assets/prefabs") -> DeltaSaveSystem:
    """Get global delta save system instance"""
    global _delta_save_system
    if _delta_save_system is None:
        _delta_save_system = DeltaSaveSystem(prefabs_dir)
    return _delta_save_system
