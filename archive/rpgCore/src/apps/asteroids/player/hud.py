"""
Asteroids HUD Rendering using Shared UI Components
"""
import pygame
from src.shared.entities.game_state import GameSession
from src.shared.ui import Panel, Label
from src.shared.ui.spec import SPEC_160

class HUD:
    """Renders game status using shared UI system"""
    
    def __init__(self):
        # Small panel in top-left using 160x144 spec
        self.panel = Panel(
            rect=pygame.Rect(0, 0, 60, 52),
            spec=SPEC_160,
            variant="overlay",
            border=True
        )
        
        # Labels for stats - using new Label constructor
        self.score_label = Label(
            text="SCORE: 0",
            position=(4, 4),
            spec=SPEC_160,
            size="sm",
            color=(0, 255, 0)
        )
        self.lives_label = Label(
            text="LIVES: 0",
            position=(4, 16),
            spec=SPEC_160,
            size="sm",
            color=(0, 255, 0)
        )
        self.wave_label = Label(
            text="WAVE: 0",
            position=(4, 28),
            spec=SPEC_160,
            size="sm",
            color=(0, 255, 0)
        )
        self.rocks_label = Label(
            text="ROCKS: 0",
            position=(4, 40),
            spec=SPEC_160,
            size="sm",
            color=(0, 255, 0)
        )
        
        self.panel.add_child(self.score_label)
        self.panel.add_child(self.lives_label)
        self.panel.add_child(self.wave_label)
        self.panel.add_child(self.rocks_label)
            
    def render(self, surface: pygame.Surface, session: GameSession, asteroid_count: int):
        """Update and draw HUD to surface"""
        self.score_label.set_text(f"SCORE: {session.score}")
        self.lives_label.set_text(f"LIVES: {session.lives}")
        self.wave_label.set_text(f"WAVE: {session.wave}")
        self.rocks_label.set_text(f"ROCKS: {asteroid_count}")
        
        self.panel.render(surface)
