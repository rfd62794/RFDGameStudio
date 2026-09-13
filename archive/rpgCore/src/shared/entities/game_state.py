"""
GameState Component - Lives, Waves, and Scoring
SRP: Manages game progression and scoring
"""

from dataclasses import dataclass
from typing import Optional

@dataclass
class GameSession:
    """Current game session state"""
    lives: int
    wave: int
    score: int


class GameState:
    """
    Manages arcade game progression.
    """
    
    def __init__(self, starting_lives: int = 3):
        self.starting_lives = starting_lives
        self.session: Optional[GameSession] = None
        self.game_over = False
        
    def start_new_game(self):
        self.session = GameSession(
            lives=self.starting_lives,
            wave=1,
            score=0
        )
        self.game_over = False
        return self.session
    
    def add_score(self, points: int):
        if self.session and not self.game_over:
            self.session.score += points
    
    def lose_life(self) -> bool:
        """Returns True if game over"""
        if self.session and not self.game_over:
            self.session.lives -= 1
            if self.session.lives <= 0:
                self.game_over = True
                return True
        return False
    
    def advance_wave(self):
        if self.session and not self.game_over:
            self.session.wave += 1


def create_arcade_game_state() -> GameState:
    return GameState(starting_lives=3)
