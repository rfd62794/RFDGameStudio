"""Race HUD component for displaying race information."""

import pygame
from typing import List, Optional
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import ArenaLayout

class RaceHUD:
    def __init__(self, spec: UISpec, layout: ArenaLayout):
        self.spec = spec
        self.layout = layout
        
    def render(self, surface, racers, current_lap: int, total_laps: int, terrain_ahead: Optional[str]):
        """Render the race HUD in the team bar area."""
        bar = self.layout.team_bar
        
        # Background
        pygame.draw.rect(surface, self.spec.color_surface, bar)
        
        if not racers:
            return
        
        # Player racer info (assuming first in list is player)
        player = racers[0]
        
        # Rank colors
        rank_colors = {
            1: (255, 215, 0),   # gold
            2: (192, 192, 192), # silver  
            3: (205, 127, 50),  # bronze
        }
        rank_color = rank_colors.get(player.rank, self.spec.color_text)
        
        # Left: Rank and Name
        self._render_text(surface, f"#{player.rank}", (bar.x + 20, bar.y + 16), size="xl", bold=True, color=rank_color)
        self._render_text(surface, player.slime.name, (bar.x + 60, bar.y + 16), size="md", color=self.spec.color_text)
        
        # Center: Lap counter
        lap_text = f"LAP {current_lap}/{total_laps}"
        self._render_text(surface, lap_text, (bar.centerx, bar.y + 16), size="lg", bold=True, centered=True)
        
        # Right: Speed indicator and terrain warning
        speed_percent = min(1.0, player.velocity / 300.0)  # Normalize to 0-1 (higher max for better visibility)
        speed_bar_width = 80
        speed_bar_height = 12
        speed_bar_x = bar.right - 200
        speed_bar_y = bar.y + 20
        
        # Speed bar background
        pygame.draw.rect(surface, (40, 40, 40), (speed_bar_x, speed_bar_y, speed_bar_width, speed_bar_height))
        # Speed bar fill
        fill_width = max(2, int(speed_bar_width * speed_percent))  # Minimum 2px for visibility
        pygame.draw.rect(surface, (100, 200, 100), (speed_bar_x, speed_bar_y, fill_width, speed_bar_height))
        
        # Speed text
        self._render_text(surface, f"SPEED: {int(player.velocity)}", (speed_bar_x, speed_bar_y - 15), size="sm", color=self.spec.color_text_dim)
        
        # Terrain warning
        if terrain_ahead:
            warning_colors = {
                "water": self.spec.color_tundra,
                "rock":  self.spec.color_ember,
                "mud":   self.spec.color_marsh,
            }
            color = warning_colors.get(terrain_ahead, self.spec.color_warning)
            warning_text = f"⚠ {terrain_ahead.upper()} AHEAD"
            self._render_text(surface, warning_text, (bar.right - 20, bar.y + 16), size="sm", color=color, right_aligned=True)
        
        # Bottom row: Gap display for all racers
        gap_y = bar.y + 48
        for i, racer in enumerate(racers):
            gap_x = bar.x + 20 + (i * 160)
            if i == 0:
                gap_text = "+0.0s"  # Leader has no gap
            else:
                gap_to_leader = racer.distance - racers[0].distance
                gap_text = f"+{gap_to_leader:.1f}s"
            
            racer_text = f"{racer.slime.name}: {gap_text}"
            self._render_text(surface, racer_text, (gap_x, gap_y), size="sm", color=self.spec.color_text_dim)
    
    def _render_text(self, surface, text, pos, size="md", centered=False, color=(255, 255, 255), right_aligned=False, bold=False):
        """Simple text rendering helper."""
        try:
            font_sizes = {"xs": 10, "sm": 12, "md": 14, "lg": 16, "xl": 18, "hd": 24}
            font = pygame.font.Font(None, font_sizes.get(size, 14))
            if bold:
                font.set_bold(True)
            text_surface = font.render(text, True, color)
            
            if centered:
                rect = text_surface.get_rect(center=pos)
                surface.blit(text_surface, rect)
            elif right_aligned:
                rect = text_surface.get_rect(right=pos)
                surface.blit(text_surface, rect)
            else:
                surface.blit(text_surface, pos)
        except:
            pass
