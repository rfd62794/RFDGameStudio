"""
Status Manager - Data-Driven Game State Management
Handles score, lives, and game statistics with Glass Cockpit integration
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import time
from loguru import logger

from dgt_engine.foundation.types import Result


class StatType(Enum):
    """Types of game statistics"""
    SCORE = "score"
    LIVES = "lives"
    ENERGY = "energy"
    TIME = "time"
    KILLS = "kills"
    ACCURACY = "accuracy"
    COMBO = "combo"
    LEVEL = "level"


@dataclass
class GameStat:
    """Individual game statistic"""
    name: str
    value: float = 0.0
    max_value: Optional[float] = None
    min_value: Optional[float] = None
    display_name: Optional[str] = None
    stat_type: StatType = StatType.SCORE
    
    # Formatting
    decimal_places: int = 0
    suffix: Optional[str] = None
    prefix: Optional[str] = None
    
    # Change tracking
    last_change_time: float = 0.0
    change_rate: float = 0.0
    history: List[float] = field(default_factory=list)
    
    def update(self, new_value: float, timestamp: float) -> None:
        """Update statistic value"""
        old_value = self.value
        
        # Apply limits
        if self.max_value is not None:
            new_value = min(new_value, self.max_value)
        if self.min_value is not None:
            new_value = max(new_value, self.min_value)
        
        self.value = new_value
        self.last_change_time = timestamp
        
        # Calculate change rate
        if timestamp > 0:
            self.change_rate = (new_value - old_value) / (timestamp - self.last_change_time)
        
        # Add to history
        self.history.append(new_value)
        
        # Limit history size
        if len(self.history) > 100:
            self.history = self.history[-50:]
    
    def get_display_value(self) -> str:
        """Get formatted display value"""
        value_str = f"{self.value:.{self.decimal_places}f}"
        
        if self.prefix:
            value_str = f"{self.prefix}{value_str}"
        if self.suffix:
            value_str = f"{value_str}{self.suffix}"
        
        return value_str
    
    def get_display_name(self) -> str:
        """Get display name"""
        return self.display_name or self.name.replace("_", " ").title()


@dataclass
class Achievement:
    """Game achievement definition"""
    id: str
    name: str
    description: str
    stat_name: str
    required_value: float
    comparison: str = "greater_equal"  # greater_equal, less_equal, equal
    
    # Progress tracking
    unlocked: bool = False
    unlock_time: Optional[float] = None
    
    def check_unlock(self, current_value: float, timestamp: float) -> bool:
        """Check if achievement should be unlocked"""
        if self.unlocked:
            return True
        
        unlocked = False
        
        if self.comparison == "greater_equal":
            unlocked = current_value >= self.required_value
        elif self.comparison == "less_equal":
            unlocked = current_value <= self.required_value
        elif self.comparison == "equal":
            unlocked = abs(current_value - self.required_value) < 0.001
        
        if unlocked:
            self.unlocked = True
            self.unlock_time = timestamp
        
        return unlocked


class StatusManager:
    """Manages game state, statistics, and achievements"""
    
    def __init__(self):
        self.stats: Dict[str, GameStat] = {}
        self.achievements: Dict[str, Achievement] = {}
        self.change_callbacks: Dict[str, List[Callable]] = {}
        
        # Game session tracking
        self.session_start_time = time.time()
        self.session_duration = 0.0
        self.is_paused = False
        
        # Performance tracking
        self.update_count = 0
        self.last_update_time = 0.0
        
        logger.info("📊 StatusManager initialized")
    
    def register_stat(self, stat: GameStat) -> Result[bool]:
        """Register a game statistic"""
        try:
            self.stats[stat.name] = stat
            
            # Initialize change callbacks
            self.change_callbacks[stat.name] = []
            
            logger.info(f"✅ Registered stat: {stat.name}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register stat: {e}")
    
    def register_achievement(self, achievement: Achievement) -> Result[bool]:
        """Register an achievement"""
        try:
            self.achievements[achievement.id] = achievement
            
            logger.info(f"🏆 Registered achievement: {achievement.name}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to register achievement: {e}")
    
    def update_stat(self, stat_name: str, value: float, relative: bool = True) -> Result[bool]:
        """Update a statistic"""
        try:
            current_time = time.time()
            
            if stat_name not in self.stats:
                return Result(success=False, error=f"Stat '{stat_name}' not registered")
            
            stat = self.stats[stat_name]
            old_value = stat.value
            
            # Calculate new value
            if relative:
                new_value = old_value + value
            else:
                new_value = value
            
            # Update stat
            stat.update(new_value, current_time)
            
            # Trigger change callbacks
            if stat_name in self.change_callbacks:
                for callback in self.change_callbacks[stat_name]:
                    try:
                        callback(stat, old_value, new_value)
                    except Exception as e:
                        logger.error(f"Change callback failed: {e}")
            
            # Check achievements
            self._check_achievements(stat_name, new_value, current_time)
            
            self.update_count += 1
            self.last_update_time = current_time
            
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to update stat: {e}")
    
    def get_stat(self, stat_name: str) -> Optional[GameStat]:
        """Get a statistic"""
        return self.stats.get(stat_name)
    
    def get_stat_value(self, stat_name: str) -> Optional[float]:
        """Get statistic value"""
        stat = self.stats.get(stat_name)
        return stat.value if stat else None
    
    def get_display_stats(self) -> List[Dict[str, Any]]:
        """Get all stats formatted for display"""
        display_stats = []
        
        for stat in self.stats.values():
            display_stats.append({
                'name': stat.get_display_name(),
                'value': stat.get_display_value(),
                'raw_value': stat.value,
                'type': stat.stat_type.value,
                'change_rate': stat.change_rate
            })
        
        return display_stats
    
    def add_change_callback(self, stat_name: str, callback: Callable) -> Result[bool]:
        """Add callback for stat changes"""
        try:
            if stat_name not in self.change_callbacks:
                self.change_callbacks[stat_name] = []
            
            self.change_callbacks[stat_name].append(callback)
            
            logger.info(f"✅ Added change callback for: {stat_name}")
            return Result(success=True, value=True)
            
        except Exception as e:
            return Result(success=False, error=f"Failed to add change callback: {e}")
    
    def _check_achievements(self, stat_name: str, value: float, timestamp: float) -> None:
        """Check if any achievements should be unlocked"""
        for achievement in self.achievements.values():
            if achievement.stat_name == stat_name and not achievement.unlocked:
                if achievement.check_unlock(value, timestamp):
                    logger.info(f"🏆 Achievement unlocked: {achievement.name}")
    
    def get_achievements(self) -> List[Dict[str, Any]]:
        """Get all achievements"""
        return [
            {
                'id': achievement.id,
                'name': achievement.name,
                'description': achievement.description,
                'unlocked': achievement.unlocked,
                'unlock_time': achievement.unlock_time,
                'progress': self._get_achievement_progress(achievement)
            }
            for achievement in self.achievements.values()
        ]
    
    def _get_achievement_progress(self, achievement: Achievement) -> float:
        """Get achievement progress as percentage"""
        if achievement.unlocked:
            return 1.0
        
        current_value = self.get_stat_value(achievement.stat_name) or 0.0
        
        if achievement.required_value == 0:
            return 0.0
        
        return min(1.0, current_value / achievement.required_value)
    
    def reset_session(self) -> None:
        """Reset session statistics"""
        self.session_start_time = time.time()
        self.session_duration = 0.0
        self.is_paused = False
        
        # Reset stats that should reset each session
        for stat in self.stats.values():
            if stat.stat_type in [StatType.SCORE, StatType.KILLS, StatType.COMBO]:
                stat.update(0.0, time.time())
        
        logger.info("🔄 Session reset")
    
    def pause_session(self) -> None:
        """Pause the session"""
        if not self.is_paused:
            self.is_paused = True
            logger.info("⏸️ Session paused")
    
    def resume_session(self) -> None:
        """Resume the session"""
        if self.is_paused:
            self.is_paused = False
            logger.info("▶️ Session resumed")
    
    def update_session(self, dt: float) -> None:
        """Update session duration"""
        if not self.is_paused:
            self.session_duration += dt
            
            # Update time stat
            self.update_stat("session_time", dt, relative=True)
    
    def get_status(self) -> Dict[str, Any]:
        """Get status manager status"""
        return {
            'stats_count': len(self.stats),
            'achievements_count': len(self.achievements),
            'unlocked_achievements': sum(1 for a in self.achievements.values() if a.unlocked),
            'session_duration': self.session_duration,
            'is_paused': self.is_paused,
            'update_count': self.update_count,
            'last_update_time': self.last_update_time
        }


# Factory functions for common game setups
def create_asteroids_stats() -> List[GameStat]:
    """Create statistics for asteroids game"""
    return [
        GameStat(
            name="score",
            display_name="Score",
            stat_type=StatType.SCORE,
            min_value=0,
            suffix=" pts"
        ),
        GameStat(
            name="lives",
            display_name="Lives",
            stat_type=StatType.LIVES,
            min_value=0,
            max_value=3,
            decimal_places=0
        ),
        GameStat(
            name="energy",
            display_name="Energy",
            stat_type=StatType.ENERGY,
            min_value=0,
            max_value=100,
            suffix="%",
            decimal_places=0
        ),
        GameStat(
            name="asteroids_destroyed",
            display_name="Destroyed",
            stat_type=StatType.KILLS,
            min_value=0,
            decimal_places=0
        ),
        GameStat(
            name="bullets_fired",
            display_name="Shots Fired",
            stat_type=StatType.KILLS,
            min_value=0,
            decimal_places=0
        ),
        GameStat(
            name="accuracy",
            display_name="Accuracy",
            stat_type=StatType.ACCURACY,
            min_value=0,
            max_value=100,
            suffix="%",
            decimal_places=1
        ),
        GameStat(
            name="session_time",
            display_name="Time",
            stat_type=StatType.TIME,
            min_value=0,
            suffix="s",
            decimal_places=1
        )
    ]


def create_asteroids_achievements() -> List[Achievement]:
    """Create achievements for asteroids game"""
    return [
        Achievement(
            id="first_destroy",
            name="First Blood",
            description="Destroy your first asteroid",
            stat_name="asteroids_destroyed",
            required_value=1
        ),
        Achievement(
            id="destroyer",
            name="Asteroid Destroyer",
            description="Destroy 10 asteroids",
            stat_name="asteroids_destroyed",
            required_value=10
        ),
        Achievement(
            id="survivor",
            name="Survivor",
            description="Survive for 60 seconds",
            stat_name="session_time",
            required_value=60
        ),
        Achievement(
            id="sharpshooter",
            name="Sharpshooter",
            description="Achieve 80% accuracy",
            stat_name="accuracy",
            required_value=80
        ),
        Achievement(
            id="high_scorer",
            name="High Scorer",
            description="Score 1000 points",
            stat_name="score",
            required_value=1000
        )
    ]


def setup_asteroids_status_manager() -> StatusManager:
    """Setup status manager for asteroids game"""
    status_manager = StatusManager()
    
    # Register stats
    for stat in create_asteroids_stats():
        status_manager.register_stat(stat)
    
    # Register achievements
    for achievement in create_asteroids_achievements():
        status_manager.register_achievement(achievement)
    
    return status_manager
