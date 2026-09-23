"""
GameState Component - Lives, Waves, and High Score Management
SRP: Manages "Insert Coin" progression and persistent scoring
"""

import json
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from pathlib import Path
from foundation.types import Result


@dataclass
class ScoreEntry:
    """High score entry with metadata"""
    name: str
    score: int
    wave: int
    timestamp: float
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        return {
            'name': self.name,
            'score': self.score,
            'wave': self.wave,
            'timestamp': self.timestamp
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ScoreEntry':
        """Create from dictionary"""
        return cls(
            name=data['name'],
            score=data['score'],
            wave=data['wave'],
            timestamp=data['timestamp']
        )


@dataclass
class GameSession:
    """Current game session state"""
    lives: int
    wave: int
    score: int
    start_time: float
    last_life_time: float
    
    def get_session_time(self) -> float:
        """Get elapsed session time"""
        return time.time() - self.start_time
    
    def get_life_time(self) -> float:
        """Get time since last life lost"""
        return time.time() - self.last_life_time


class GameState:
    """
    Manages arcade game progression with persistent high scores.
    Handles the "Insert Coin" feel of classic arcade games.
    """
    
    def __init__(self, 
                 starting_lives: int = 3,
                 high_score_file: Optional[str] = None,
                 max_high_scores: int = 10):
        """
        Initialize game state
        
        Args:
            starting_lives: Number of lives at game start
            high_score_file: File to store high scores (optional)
            max_high_scores: Maximum number of high scores to keep
        """
        self.starting_lives = starting_lives
        self.max_high_scores = max_high_scores
        self.high_score_file = high_score_file
        
        # Current session
        self.session: Optional[GameSession] = None
        
        # High scores
        self.high_scores: List[ScoreEntry] = []
        
        # Game state flags
        self.game_over = False
        self.is_paused = False
        self.is_attract_mode = True  # Demo mode when not playing
        
        # Load existing high scores
        self._load_high_scores()
        
        # Scoring multipliers
        self.score_multipliers = {
            'small_asteroid': 100,
            'medium_asteroid': 50,
            'large_asteroid': 20,
            'bonus_life': 10000  # Extra life every 10k points
        }
        
        # Wave progression
        self.wave_bonus_base = 1000  # Base bonus for completing wave
        self.wave_bonus_multiplier = 500  # Additional bonus per wave
        
    def start_new_game(self, player_name: str = "PLAYER") -> Result[GameSession]:
        """
        Start a new game session
        
        Args:
            player_name: Name for high score tracking
            
        Returns:
            Result containing the new session
        """
        current_time = time.time()
        
        self.session = GameSession(
            lives=self.starting_lives,
            wave=1,
            score=0,
            start_time=current_time,
            last_life_time=current_time
        )
        
        self.game_over = False
        self.is_paused = False
        self.is_attract_mode = False
        
        return Result(success=True, value=self.session)
    
    def add_score(self, points: int, category: str = "default") -> Result[int]:
        """
        Add points to current score
        
        Args:
            points: Points to add
            category: Scoring category for multipliers
            
        Returns:
            Result containing new total score
        """
        if self.session is None or self.game_over:
            return Result(success=False, error="No active game session")
        
        # Apply category multiplier if applicable
        if category in self.score_multipliers:
            points = self.score_multipliers[category]
        
        self.session.score += points
        
        # Check for bonus life
        if self.session.score >= self.score_multipliers['bonus_life']:
            bonus_lives = self.session.score // self.score_multipliers['bonus_life']
            if bonus_lives > 0:
                self.session.lives += bonus_lives
                # Reset score to prevent infinite lives
                self.session.score = self.session.score % self.score_multipliers['bonus_life']
        
        return Result(success=True, value=self.session.score)
    
    def lose_life(self) -> Result[bool]:
        """
        Lose a life
        
        Returns:
            Result containing True if game over, False if continuing
        """
        if self.session is None or self.game_over:
            return Result(success=False, error="No active game session")
        
        self.session.lives -= 1
        self.session.last_life_time = time.time()
        
        if self.session.lives <= 0:
            self.game_over = True
            self._finalize_game()
            return Result(success=True, value=True)  # Game over
        
        return Result(success=True, value=False)  # Continue playing
    
    def advance_wave(self) -> Result[int]:
        """
        Advance to next wave
        
        Returns:
            Result containing new wave number
        """
        if self.session is None or self.game_over:
            return Result(success=False, error="No active game session")
        
        self.session.wave += 1
        
        # Add wave completion bonus
        wave_bonus = self.wave_bonus_base + (self.session.wave * self.wave_bonus_multiplier)
        self.add_score(wave_bonus, "wave_complete")
        
        return Result(success=True, value=self.session.wave)
    
    def pause_game(self) -> Result[bool]:
        """Toggle pause state"""
        if self.session is None:
            return Result(success=False, error="No active game session")
        
        self.is_paused = not self.is_paused
        return Result(success=True, value=self.is_paused)
    
    def end_game(self) -> Result[ScoreEntry]:
        """
        End current game and record score
        
        Returns:
            Result containing high score entry if qualified
        """
        if self.session is None:
            return Result(success=False, error="No active game session")
        
        self.game_over = True
        self.is_attract_mode = True
        
        return self._finalize_game()
    
    def _finalize_game(self) -> Result[ScoreEntry]:
        """Finalize game and check for high score"""
        if self.session is None:
            return Result(success=False, error="No active session")
        
        # Create score entry
        score_entry = ScoreEntry(
            name="PLAYER",  # Could be made configurable
            score=self.session.score,
            wave=self.session.wave,
            timestamp=time.time()
        )
        
        # Check if high score
        is_high_score = self._add_high_score(score_entry)
        
        # Clear session
        self.session = None
        
        if is_high_score:
            return Result(success=True, value=score_entry)
        
        return Result(success=True, value=None)
    
    def _add_high_score(self, entry: ScoreEntry) -> bool:
        """
        Add entry to high scores if qualified
        
        Returns:
            True if entry made it to high scores
        """
        # Insert in sorted order
        self.high_scores.append(entry)
        self.high_scores.sort(key=lambda x: x.score, reverse=True)
        
        # Keep only top scores
        if len(self.high_scores) > self.max_high_scores:
            self.high_scores = self.high_scores[:self.max_high_scores]
        
        # Check if entry made the cut
        made_cut = entry in self.high_scores
        
        if made_cut:
            self._save_high_scores()
        
        return made_cut
    
    def get_high_scores(self, limit: Optional[int] = None) -> List[ScoreEntry]:
        """Get high scores list"""
        if limit:
            return self.high_scores[:limit]
        return self.high_scores.copy()
    
    def get_game_stats(self) -> Dict[str, Any]:
        """Get current game statistics"""
        if self.session is None:
            return {
                'game_over': self.game_over,
                'is_paused': self.is_paused,
                'is_attract_mode': self.is_attract_mode,
                'high_score_count': len(self.high_scores)
            }
        
        return {
            'lives': self.session.lives,
            'wave': self.session.wave,
            'score': self.session.score,
            'session_time': self.session.get_session_time(),
            'life_time': self.session.get_life_time(),
            'game_over': self.game_over,
            'is_paused': self.is_paused,
            'is_attract_mode': self.is_attract_mode,
            'high_score_count': len(self.high_scores)
        }
    
    def reset_high_scores(self) -> Result[bool]:
        """Clear all high scores"""
        self.high_scores.clear()
        self._save_high_scores()
        return Result(success=True, value=True)
    
    def _load_high_scores(self) -> None:
        """Load high scores from file"""
        if not self.high_score_file:
            return
        
        try:
            file_path = Path(self.high_score_file)
            if file_path.exists():
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                self.high_scores = [
                    ScoreEntry.from_dict(entry) 
                    for entry in data.get('high_scores', [])
                ]
                
                # Sort and limit
                self.high_scores.sort(key=lambda x: x.score, reverse=True)
                self.high_scores = self.high_scores[:self.max_high_scores]
                
        except Exception as e:
            # If loading fails, start fresh
            self.high_scores = []
    
    def _save_high_scores(self) -> None:
        """Save high scores to file"""
        if not self.high_score_file:
            return
        
        try:
            file_path = Path(self.high_score_file)
            file_path.parent.mkdir(parents=True, exist_ok=True)
            
            data = {
                'high_scores': [entry.to_dict() for entry in self.high_scores],
                'last_updated': time.time()
            }
            
            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception:
            # If saving fails, continue without persistence
            pass
    
    def get_attract_mode_data(self) -> Dict[str, Any]:
        """Get data for attract mode display"""
        return {
            'high_scores': [
                {
                    'rank': i + 1,
                    'name': entry.name,
                    'score': entry.score,
                    'wave': entry.wave
                }
                for i, entry in enumerate(self.high_scores[:5])
            ],
            'coin_inserted': not self.is_attract_mode
        }


# Factory functions for common configurations
def create_arcade_game_state() -> GameState:
    """Create standard arcade game state"""
    return GameState(
        starting_lives=3,
        high_score_file="data/high_scores.json",
        max_high_scores=10
    )


def create_survival_game_state() -> GameState:
    """Create survival mode game state (1 life)"""
    return GameState(
        starting_lives=1,
        high_score_file="data/survival_high_scores.json",
        max_high_scores=5
    )
