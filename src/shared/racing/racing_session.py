"""
Racing Session - Persistent state for racing demo
Follows same pattern as DungeonSession for consistency
"""
import json
import random
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, field
from loguru import logger

@dataclass
class RacingSession:
    """Persistent session state for racing demo"""
    team: List = field(default_factory=list)  # List of Creature references
    seed: int = None
    track_length: float = 3000  # Track length in meters
    race_completed: bool = False
    best_time: Optional[float] = None  # Best completion time in seconds
    race_history: List[dict] = field(default_factory=list)  # Past race results
    
    def __post_init__(self):
        if self.seed is None:
            self.seed = random.randint(0, 99999)

    def save_to_file(self, filepath: Optional[Path] = None) -> None:
        """Save racing session to JSON file"""
        if filepath is None:
            filepath = Path(f"saves/racing_session_{self.seed}.json")
        
        filepath.parent.mkdir(exist_ok=True)
        
        session_data = {
            "seed": self.seed,
            "track_length": self.track_length,
            "team_slime_ids": [s.slime_id for s in self.team],
            "race_completed": self.race_completed,
            "best_time": self.best_time,
            "race_history": self.race_history
        }
        
        filepath.write_text(json.dumps(session_data, indent=2))
        logger.info(f"Racing session saved to {filepath}")

    @classmethod
    def load_from_file(cls, filepath: Optional[Path] = None, seed: Optional[int] = None) -> "RacingSession":
        """Load racing session from JSON file"""
        if filepath is None and seed is not None:
            filepath = Path(f"saves/racing_session_{seed}.json")
        
        # Handle case where filepath is still None
        if filepath is None:
            logger.info("No filepath provided and no seed, creating new session")
            return cls()
        
        if not filepath.exists():
            logger.info(f"No racing session file found at {filepath}, creating new session")
            return cls()
        
        try:
            data = json.loads(filepath.read_text())
            session = cls(
                team=[],  # Will be populated from slime_ids
                seed=data.get("seed"),
                track_length=data.get("track_length", 3000),
                race_completed=data.get("race_completed", False),
                best_time=data.get("best_time"),
                race_history=data.get("race_history", [])
            )
            
            # Load team from slime_ids
            from src.shared.teams.roster_save import load_roster
            roster = load_roster()
            for slime_id in data.get("team_slime_ids", []):
                creature = roster.get_creature(slime_id)
                if creature:
                    session.team.append(creature)
            
            logger.info(f"Racing session loaded from {filepath}")
            return session
            
        except Exception as e:
            logger.error(f"Failed to load racing session from {filepath}: {e}")
            return cls()

    def auto_save(self) -> None:
        """Auto-save session state"""
        self.save_to_file()

    def record_race_result(self, completion_time: float, position: int = 1) -> None:
        """Record a race result"""
        result = {
            "timestamp": json.dumps({"timestamp": "now"}),  # Would use real timestamp
            "completion_time": completion_time,
            "position": position,
            "team_slime_ids": [s.slime_id for s in self.team]
        }
        
        self.race_history.append(result)
        
        # Update best time
        if self.best_time is None or completion_time < self.best_time:
            self.best_time = completion_time
        
        self.race_completed = True
        self.auto_save()

    def reset_race(self) -> None:
        """Reset for new race attempt"""
        self.race_completed = False
        self.auto_save()

    def get_team_creatures(self) -> List:
        """Get the actual Creature objects for the team"""
        return self.team
