import pygame
from src.shared.ui.spec import UISpec

class HubLayout:
    """Garden-style layout with top bar, main area, side panel, status bar."""
    def __init__(self, spec: UISpec):
        self.top_bar    = pygame.Rect(0, 0, spec.screen_width, 48 * spec.scale_factor)
        self.main_area  = pygame.Rect(0, 48 * spec.scale_factor, 
                                      spec.screen_width * 0.65,
                                      spec.screen_height - 84 * spec.scale_factor)
        self.side_panel = pygame.Rect(spec.screen_width * 0.65, 
                                      48 * spec.scale_factor,
                                      spec.screen_width * 0.35,
                                      spec.screen_height - 84 * spec.scale_factor)
        self.status_bar = pygame.Rect(0, spec.screen_height - 64 * spec.scale_factor,
                                      spec.screen_width, 64 * spec.scale_factor)

class SelectionLayout:
    """Breeding/Team-style layout with header, three panels, action bar."""
    def __init__(self, spec: UISpec):
        header_h = 64 * spec.scale_factor
        action_bar_h = 64 * spec.scale_factor
        content_h = spec.screen_height - header_h - action_bar_h
        w = spec.screen_width
        
        self.header      = pygame.Rect(0, 0, w, header_h)
        self.left_panel  = pygame.Rect(0, header_h, w * 0.30, content_h)
        self.center_area = pygame.Rect(w * 0.30, header_h, w * 0.40, content_h)
        self.right_panel = pygame.Rect(w * 0.70, header_h, w * 0.30, content_h)
        self.action_bar  = pygame.Rect(0, spec.screen_height - action_bar_h, w, action_bar_h)

class ArenaLayout:
    """Dungeon/Race-style layout with header, arena, team bar."""
    def __init__(self, spec: UISpec):
        w = spec.screen_width
        header_h = 48 * spec.scale_factor
        team_bar_h = 80 * spec.scale_factor
        
        self.header    = pygame.Rect(0, 0, w, header_h)
        self.arena     = pygame.Rect(0, header_h, w, spec.screen_height - header_h - team_bar_h)
        self.team_bar  = pygame.Rect(0, spec.screen_height - team_bar_h, w, team_bar_h)

class OverlayLayout:
    """Modal overlay for pause, results, confirmations."""
    def __init__(self, spec: UISpec, 
                 width: int = 480, height: int = 320):
        # Scale input width/height
        sw = width * spec.scale_factor
        sh = height * spec.scale_factor
        
        cx = spec.screen_width  // 2
        cy = spec.screen_height // 2
        
        self.backdrop = pygame.Rect(0, 0, 
                                    spec.screen_width, 
                                    spec.screen_height)
        self.card     = pygame.Rect(cx - sw // 2,
                                    cy - sh // 2,
                                    sw, sh)
