"""
Scrap Entity - Resource Acquisition System

ADR 196: The "Scrap Hub" Entity Manager

Collectible scrap fragments that spawn when asteroids are destroyed.
These represent the bridge between arcade gameplay and the
Sovereign Scout's IT management resource system.

Visual Design:
- 1x1 or 2x2 dithered pixel patterns
- Glowing effect with energy-based intensity
- Toroidal ghosting for seamless collection

Collection Mechanics:
- Ship overlap detection with circular hitbox
- Persistent locker.json updates
- Phosphor Terminal notification handshake
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass
import random
import json
import math
import time
from pathlib import Path

from .entities.space_entity import SpaceEntity, EntityType
from dgt_engine.foundation.vector import Vector2
from dgt_engine.foundation.constants import SOVEREIGN_WIDTH, SOVEREIGN_HEIGHT


class ScrapType:
    """Scrap fragment types with different values"""
    
    COMMON = "common"
    RARE = "rare"
    EPIC = "epic"
    
    @classmethod
    def get_random_type(cls) -> str:
        """Get random scrap type with weighted probability"""
        weights = {
            cls.COMMON: 0.7,    # 70% common
            cls.RARE: 0.25,     # 25% rare
            cls.EPIC: 0.05      # 5% epic
        }
        
        rand = random.random()
        cumulative = 0.0
        
        for scrap_type, weight in weights.items():
            cumulative += weight
            if rand <= cumulative:
                return scrap_type
        
        return cls.COMMON  # Fallback
    
    @classmethod
    def get_value(cls, scrap_type: str) -> int:
        """Get scrap value by type"""
        values = {
            cls.COMMON: 1,
            cls.RARE: 3,
            cls.EPIC: 5
        }
        return values.get(scrap_type, 1)
    
    @classmethod
    def get_color(cls, scrap_type: str) -> int:
        """Get scrap color for rendering"""
        colors = {
            cls.COMMON: 2,  # Gray
            cls.RARE: 3,    # Dark gray
            cls.EPIC: 1     # White (rare)
        }
        return colors.get(scrap_type, 2)
    
    @classmethod
    def get_size(cls, scrap_type: str) -> int:
        """Get scrap size in pixels"""
        sizes = {
            cls.COMMON: 1,  # 1x1 pixel
            cls.RARE: 2,    # 2x2 pixels
            cls.EPIC: 2     # 2x2 pixels (but rarer)
        }
        return sizes.get(scrap_type, 1)


class ScrapEntity(SpaceEntity):
    """Collectible scrap fragment entity"""
    
    def __init__(self, position: Vector2, scrap_type: Optional[str] = None):
        # Determine scrap type if not provided
        if scrap_type is None:
            scrap_type = ScrapType.get_random_type()
        
        # Scrap-specific properties
        self.scrap_type = scrap_type
        self.scrap_value = ScrapType.get_value(scrap_type)
        self.scrap_color = ScrapType.get_color(scrap_type)
        self.scrap_size = ScrapType.get_size(scrap_type)
        
        # Initialize as custom entity type
        super().__init__(
            entity_type=EntityType.SCRAP,  # Use proper scrap entity type
            position=position,
            velocity=Vector2.zero(),  # Scrap doesn't move initially
            heading=0.0,
            radius=float(self.scrap_size)
        )
        
        # Override entity properties for scrap
        self.mass = 0.1
        self.color = self.scrap_color
        
        # Visual properties
        self.glow_intensity = 1.0
        self.pulse_phase = random.uniform(0, 2 * 3.14159)  # Random pulse phase
        self.lifetime = None  # Scrap doesn't expire
        
        # Collection properties
        self.collectable = True
        self.collected = False
        self.collection_time = None
        
        # Clear vertices (scrap uses pixel rendering)
        self.vertices = []
    
    def update(self, dt: float) -> None:
        """Update scrap entity with pulsing glow effect"""
        if not self.active or self.collected:
            return
        
        # Update age
        self.age += dt
        
        # Pulsing glow effect
        self.pulse_phase += dt * 3.0  # 3 Hz pulse
        self.glow_intensity = 0.7 + 0.3 * math.sin(self.pulse_phase)
        
        # Very slow drift (optional, for visual interest)
        if self.velocity.magnitude() == 0:
            # Add tiny random drift
            if random.random() < 0.01:  # 1% chance per frame
                drift_angle = random.uniform(0, 2 * math.pi)
                drift_speed = random.uniform(5, 15)
                self.velocity = Vector2.from_angle(drift_angle, drift_speed)
        
        # Update position (with toroidal wrap)
        super().update(dt)
        
        # Slow down drift over time
        if self.velocity.magnitude() > 0:
            self.velocity = self.velocity * 0.98  # Gradual slowdown
    
    def collect(self) -> Dict[str, Any]:
        """Mark scrap as collected and return collection data"""
        if not self.collectable or self.collected:
            return {}
        
        self.collected = True
        self.active = False
        self.collection_time = time.time()
        
        return {
            'scrap_type': self.scrap_type,
            'scrap_value': self.scrap_value,
            'position': self.position.to_tuple(),
            'collection_time': self.collection_time
        }
    
    def get_render_data(self) -> Dict[str, Any]:
        """Get rendering data for scrap entity"""
        return {
            'position': self.position,
            'size': self.scrap_size,
            'color': self.scrap_color,
            'glow_intensity': self.glow_intensity,
            'scrap_type': self.scrap_type,
            'active': self.active and not self.collected
        }
    
    def get_state_dict(self) -> Dict[str, Any]:
        """Get scrap state for serialization"""
        return {
            'scrap_type': self.scrap_type,
            'scrap_value': self.scrap_value,
            'position': self.position.to_tuple(),
            'velocity': self.velocity.to_tuple(),
            'collected': self.collected,
            'collection_time': self.collection_time,
            'active': self.active
        }


class ScrapLocker:
    """Persistent scrap storage and management system"""
    
    def __init__(self, locker_path: Optional[Path] = None):
        if locker_path is None:
            # Default to project root
            locker_path = Path(__file__).parent.parent.parent.parent / "locker.json"
        
        self.locker_path = locker_path
        self.locker_data: Dict[str, Any] = {}
        
        # Load existing locker data
        self._load_locker()
    
    def _load_locker(self) -> None:
        """Load locker data from persistent storage"""
        try:
            if self.locker_path.exists():
                with open(self.locker_path, 'r') as f:
                    self.locker_data = json.load(f)
            else:
                # Initialize empty locker
                self.locker_data = {
                    'scrap_counts': {
                        'common': 0,
                        'rare': 0,
                        'epic': 0
                    },
                    'total_scrap': 0,
                    'session_stats': {
                        'scrap_collected': 0,
                        'asteroids_destroyed': 0,
                        'session_start': time.time()
                    },
                    'achievements': []
                }
                self._save_locker()
        except Exception as e:
            from loguru import logger
            logger.error(f"Failed to load locker: {e}")
            # Initialize with default data
            self.locker_data = {
                'scrap_counts': {'common': 0, 'rare': 0, 'epic': 0},
                'total_scrap': 0
            }
    
    def _save_locker(self) -> None:
        """Save locker data to persistent storage"""
        try:
            # Ensure directory exists
            self.locker_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(self.locker_path, 'w') as f:
                json.dump(self.locker_data, f, indent=2)
        except Exception as e:
            from loguru import logger
            logger.error(f"Failed to save locker: {e}")
    
    def add_scrap(self, scrap_type: str, amount: int = 1) -> Dict[str, Any]:
        """Add scrap to locker and return notification data"""
        if scrap_type not in self.locker_data['scrap_counts']:
            self.locker_data['scrap_counts'][scrap_type] = 0
        
        # Update counts
        self.locker_data['scrap_counts'][scrap_type] += amount
        self.locker_data['total_scrap'] += amount
        
        # Update session stats
        if 'session_stats' in self.locker_data:
            self.locker_data['session_stats']['scrap_collected'] += amount
        
        # Save changes
        self._save_locker()
        
        # Return notification data
        return {
            'action': 'scrap_acquired',
            'scrap_type': scrap_type,
            'amount': amount,
            'new_total': self.locker_data['scrap_counts'][scrap_type],
            'overall_total': self.locker_data['total_scrap'],
            'message': f"[SCRAP ACQUIRED: +{amount} {scrap_type.upper()}]"
        }
    
    def get_scrap_counts(self) -> Dict[str, int]:
        """Get current scrap counts by type"""
        return self.locker_data.get('scrap_counts', {}).copy()
    
    def get_total_scrap(self) -> int:
        """Get total scrap count"""
        return self.locker_data.get('total_scrap', 0)
    
    def get_session_stats(self) -> Dict[str, Any]:
        """Get current session statistics"""
        return self.locker_data.get('session_stats', {})
    
    def record_asteroid_destroyed(self, asteroid_type: str) -> None:
        """Record asteroid destruction for statistics"""
        if 'session_stats' in self.locker_data:
            if 'asteroids_destroyed' not in self.locker_data['session_stats']:
                self.locker_data['session_stats']['asteroids_destroyed'] = 0
            self.locker_data['session_stats']['asteroids_destroyed'] += 1
            self._save_locker()
    
    def get_locker_summary(self) -> Dict[str, Any]:
        """Get complete locker summary for display"""
        return {
            'scrap_counts': self.get_scrap_counts(),
            'total_scrap': self.get_total_scrap(),
            'session_stats': self.get_session_stats(),
            'locker_path': str(self.locker_path)
        }


# Import math for pulsing effect
import math
import time
