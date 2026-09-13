"""Dispatch record data structures"""

import uuid
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime

from .zone_types import ZoneType, ZoneConfig

@dataclass
class DispatchRecord:
    """Record of a slime squad dispatch"""
    dispatch_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    slime_ids: List[str] = field(default_factory=list)  # Squad slime UUIDs
    zone_type: ZoneType = ZoneType.RACING  # Default
    zone_config: Optional[ZoneConfig] = None
    status: str = "preparing"  # 'preparing', 'active', 'returning', 'complete', 'failed'
    dispatch_tick: int = 0  # When dispatch was sent
    return_tick: int = 0  # When dispatch is expected back
    outcome: Optional[Dict[str, Any]] = None  # Results when complete
    
    # Metadata
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    completed_at: Optional[str] = None
    
    def __post_init__(self):
        """Initialize zone_config if not provided"""
        if self.zone_config is None and self.zone_type:
            from .zone_types import get_zone_config
            self.zone_config = get_zone_config(self.zone_type)
    
    @property
    def is_active(self) -> bool:
        """Check if dispatch is currently active"""
        return self.status in ["active", "returning"]
    
    @property
    def is_complete(self) -> bool:
        """Check if dispatch is complete"""
        return self.status in ["complete", "failed"]
    
    @property
    def squad_size(self) -> int:
        """Get number of slimes in squad"""
        return len(self.slime_ids)
    
    def mark_active(self, current_tick: int):
        """Mark dispatch as active"""
        self.status = "active"
        self.dispatch_tick = current_tick
        if self.zone_config:
            self.return_tick = current_tick + self.zone_config.duration_ticks
    
    def mark_returning(self):
        """Mark dispatch as returning"""
        self.status = "returning"
    
    def mark_complete(self, outcome: Dict[str, Any]):
        """Mark dispatch as complete with results"""
        self.status = "complete"
        self.outcome = outcome
        self.completed_at = datetime.now().isoformat()
    
    def mark_failed(self, reason: str = "Unknown"):
        """Mark dispatch as failed"""
        self.status = "failed"
        self.outcome = {
            "zone_type": self.zone_type.value,
            "status": "failed",
            "reason": reason,
            "resource_gains": {},
            "stat_deltas": {},
            "losses": []
        }
        self.completed_at = datetime.now().isoformat()
    
    def __str__(self) -> str:
        """String representation"""
        return f"Dispatch[{self.dispatch_id[:8]}]: {self.zone_type.value} - {self.status} ({len(self.slime_ids)} slimes)"
    
    def __repr__(self) -> str:
        """Detailed representation"""
        return (f"DispatchRecord(id={self.dispatch_id[:8]}, zone={self.zone_type.value}, "
                f"status={self.status}, slimes={len(self.slime_ids)}, "
                f"tick={self.dispatch_tick}->{self.return_tick})")
