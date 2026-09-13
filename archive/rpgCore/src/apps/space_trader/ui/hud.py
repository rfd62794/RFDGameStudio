import pygame
from src.shared.ui.label import Label
from src.apps.space_trader.session import SpaceTraderSession

class SpaceTraderHUD:
    """Persistent top bar rendering ship and location state."""
    
    def __init__(self, session: SpaceTraderSession, width: int):
        self.session = session
        self.width = width
        self.height = 40
        self.rect = pygame.Rect(0, 0, width, self.height)
        
        # Colors (borrowing from the simple unified look)
        self.bg_color = (15, 20, 30)
        self.text_color = (200, 220, 255)
        self.border_color = (50, 80, 120)

    def draw(self, surface: pygame.Surface):
        pygame.draw.rect(surface, self.bg_color, self.rect)
        pygame.draw.line(surface, self.border_color, (0, self.height - 1), (self.width, self.height - 1), 2)
        
        # Location Info
        loc = self.session.graph.get(self.session.ship.location_id)
        loc_text = f"SYSTEM: {loc.name.upper()} ({loc.faction.upper()})"
        
        loc_label = Label(pygame.Rect(20, 10, 400, 20), text=loc_text, color=self.text_color)
        loc_label.render(surface)
        
        # Ship Stats
        stats_text = (
            f"CREDITS: {self.session.ship.credits} CR  |  "
            f"FUEL: {self.session.ship.fuel}/{self.session.ship.max_fuel}  |  "
            f"CARGO: {self.session.ship.cargo.space_used()}/{self.session.ship.cargo.capacity}"
        )
        
        # Right aligned
        font = pygame.font.Font(None, 24)
        text_surf = font.render(stats_text, True, self.text_color)
        x_pos = self.width - text_surf.get_width() - 20
        surface.blit(text_surf, (x_pos, 10))
