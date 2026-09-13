import pygame
from typing import Tuple, Optional, Any
from src.shared.ui.base import UIComponent
from src.shared.ui.theme import DEFAULT_THEME
from src.shared.ui.ui_event import UIEvent
from src.shared.teams.roster import RosterSlime
from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
from src.shared.stats.stat_block import StatBlock

class StatsPanel(UIComponent):
    """
    Unified stats panel to be reused in Profile, Breeding, and Racing scenes.
    Extended to show culture expression and personality axes.
    """
    def __init__(self, slime: RosterSlime, position: Tuple[int, int], width: int = 200, theme: Optional['UITheme'] = None):
        self.WIDTH = width
        self.HEIGHT = 250  # Extended height for new sections
        self.PADDING = 10
        
        # Use theme or default
        self.theme = theme or DEFAULT_THEME
        
        rect = pygame.Rect(position[0], position[1], self.WIDTH, self.HEIGHT)
        super().__init__(rect, self.theme, z_order=0)
        
        self.slime = slime
        self.position = position

    def tick(self, dt_ms: int):
        """No periodic updates needed for this static panel."""
        pass

    def render(self, surface: pygame.Surface, data: Any = None) -> None:
        """Render the stats panel using theme colors."""
        x, y = self.position
        
        # Panel Background - use theme colors
        panel_rect = pygame.Rect(x, y, self.WIDTH, self.HEIGHT)
        pygame.draw.rect(surface, self.theme.surface, panel_rect, border_radius=6)
        pygame.draw.rect(surface, self.theme.border, panel_rect, width=1, border_radius=6)
        
        # Title
        self._render_text(surface, "STATS", (x + self.PADDING, y + self.PADDING), size=12, bold=True, color=self.theme.text_primary)
        
        # Calculate stats - use stat_block if available, fall back to stat_calculator
        if hasattr(self.slime, 'stat_block') and self.slime.stat_block:
            hp = self.slime.stat_block.hp
            atk = self.slime.stat_block.atk
            spd = self.slime.stat_block.spd
        else:
            # Fallback to stat_calculator for backward compatibility
            hp = calculate_hp(self.slime.genome, self.slime.level)
            atk = calculate_attack(self.slime.genome, self.slime.level)
            spd = calculate_speed(self.slime.genome, self.slime.level)
        
        # Render stats
        self._render_stat(surface, "HP", hp, (x + self.PADDING, y + 30), self.theme.success)
        self._render_stat(surface, "ATK", atk, (x + self.PADDING, y + 50), self.theme.danger)
        self._render_stat(surface, "SPD", spd, (x + self.PADDING, y + 70), self.theme.info)
        
        # Genetic dominance hint
        dominance = self._get_dominance_text()
        max_dna_width = self.WIDTH - (self.PADDING * 2)  # Card width minus padding
        self._render_truncated_text(surface, f"DNA: {dominance}", (x + self.PADDING, y + 90), max_dna_width, size=12, color=(140, 140, 160))
        
        # Culture expression chart
        culture_y = y + 100
        self._render_culture_expression(surface, x + self.PADDING, culture_y)
        
        # Personality axes
        personality_y = culture_y + 40
        self._render_personality_axes(surface, x + self.PADDING, personality_y)

    def _render_stat(self, surface, label, value, pos, color):
        # Stat Label
        self._render_text(surface, label, pos, size=14, color=self.theme.text_secondary)
        
        # Bar Placeholder
        bar_x = pos[0] + 60
        bar_w = self.WIDTH - 80
        pygame.draw.rect(surface, self.theme.surface, (bar_x, pos[1] + 4, bar_w, 8))
        
        # Calculate cultural max (at Lv.10 reference)
        # HP: ~200-300, ATK: ~40-60, SPD: ~15-20
        # Use stat_block base values when available for accurate cultural max
        cultural_max = 100 # Default
        culture = self.slime.genome.cultural_base
        from src.shared.genetics.cultural_base import CULTURAL_PARAMETERS
        params = CULTURAL_PARAMETERS[culture]
        
        if label == "HP":
            if hasattr(self.slime, 'stat_block') and self.slime.stat_block:
                # Use base_hp from stat_block for accurate cultural max calculation
                cultural_max = self.slime.stat_block.base_hp * 10 * params.hp_modifier
            else:
                cultural_max = 200 * params.hp_modifier
        elif label == "ATK":
            if hasattr(self.slime, 'stat_block') and self.slime.stat_block:
                cultural_max = self.slime.stat_block.base_atk * 8 * params.attack_modifier
            else:
                cultural_max = 40 * params.attack_modifier
        elif label == "SPD":
            if hasattr(self.slime, 'stat_block') and self.slime.stat_block:
                cultural_max = self.slime.stat_block.base_spd * 3 * params.speed_modifier
            else:
                cultural_max = 15 * params.speed_modifier
            
        fill_w = int(bar_w * (min(1.0, value / cultural_max)))
        # Ensure minimum visible fill of 8px
        fill_w = max(8, fill_w) if value > 0 else 0
        if fill_w > 0:
            pygame.draw.rect(surface, color, (bar_x, pos[1] + 4, fill_w, 8))
            
        # Value Text
        self._render_text(surface, str(value), (bar_x + bar_w + 5, pos[1]), size=14, bold=True)

    def _render_text(self, surface, text, pos, size=14, color=(255, 255, 255), bold=False):
        try:
            font = pygame.font.Font(None, size)
            if bold: font.set_bold(True)
            img = font.render(text, True, color)
            surface.blit(img, pos)
        except: pass

    def _get_dominance_text(self) -> str:
        traits = {
            "C": self.slime.genome.curiosity,
            "E": self.slime.genome.energy,
            "A": self.slime.genome.affection,
            "S": self.slime.genome.shyness
        }
        # Get highest
        top = max(traits, key=traits.get)
        return f"{top} ({int(traits[top]*100)}%)"
    
    def _render_truncated_text(self, surface, text, pos, max_width, size=12, color=(255, 255, 255)):
        """Render text with truncation if it exceeds max_width"""
        try:
            font = pygame.font.Font(None, size)
            rendered = font.render(text, True, color)
            if rendered.get_width() > max_width:
                # Truncate and add ellipsis
                truncated = text
                while font.render(truncated + "...", True, color).get_width() > max_width and len(truncated) > 0:
                    truncated = truncated[:-1]
                text = truncated + "..."
                rendered = font.render(text, True, color)
            surface.blit(rendered, pos)
        except:
            pass

    def _render_culture_expression(self, surface: pygame.Surface, x: int, y: int):
        """Render culture expression mini-chart"""
        # Header
        self._render_text(surface, "CULTURE", (x, y), size=11, color=self.theme.text_dim)
        
        # Get culture expression data
        culture_expression = getattr(self.slime.genome, 'culture_expression', {})
        if not culture_expression:
            return
        
        # Culture colors
        culture_colors = {
            'ember':   self.theme.culture_color('ember'),
            'gale':    self.theme.culture_color('gale'),
            'marsh':   self.theme.culture_color('marsh'),
            'crystal': self.theme.culture_color('crystal'),
            'tundra':  self.theme.culture_color('tundra'),
            'tide':    self.theme.culture_color('tide'),
            'void':    self.theme.culture_color('void'),
        }
        
        # Filter and sort cultures by expression (> 0.05 threshold)
        active_cultures = [(c, w) for c, w in culture_expression.items() if w > 0.05]
        active_cultures.sort(key=lambda x: x[1], reverse=True)
        
        # Render bars
        bar_y = y + 15
        max_bar_width = self.WIDTH - (self.PADDING * 2) - 40  # Leave room for percentage
        
        for culture, weight in active_cultures[:6]:  # Max 6 cultures
            color = culture_colors.get(culture, (140, 140, 140))
            
            # Culture name (abbreviated to 3 chars)
            name = culture[:3].upper()
            self._render_text(surface, name, (x, bar_y), size=9, color=color)
            
            # Bar
            bar_width = int(max_bar_width * weight)
            bar_rect = pygame.Rect(x + 20, bar_y, bar_width, 6)
            pygame.draw.rect(surface, color, bar_rect)
            
            # Percentage
            pct_text = f"{weight:.0%}"
            self._render_text(surface, pct_text, (x + 20 + bar_width + 5, bar_y), size=9, color=self.theme.text_secondary)
            
            bar_y += 8

    def _render_personality_axes(self, surface: pygame.Surface, x: int, y: int):
        """Render personality axes as mini-bars"""
        # Header
        self._render_text(surface, "PERSONALITY", (x, y), size=11, color=self.theme.text_dim)
        
        # Get personality axes data
        personality_axes = getattr(self.slime.genome, 'personality_axes', {})
        if not personality_axes:
            return
        
        # Axis definitions and abbreviations
        axes_info = {
            'aggression': ('AGG', (200, 100, 100)),
            'curiosity': ('CUR', (100, 200, 100)),
            'patience': ('PAT', (100, 150, 200)),
            'caution': ('CAU', (200, 200, 100)),
            'independence': ('IND', (200, 150, 100)),
            'sociability': ('SOC', (150, 100, 200))
        }
        
        # Render bars
        bar_y = y + 15
        max_bar_width = self.WIDTH - (self.PADDING * 2) - 35  # Leave room for value
        
        for axis, value in personality_axes.items():
            if axis not in axes_info:
                continue
                
            abbrev, color = axes_info[axis]
            
            # Axis abbreviation
            self._render_text(surface, abbrev, (x, bar_y), size=9, color=color)
            
            # Bar (0.0-1.0 range)
            bar_width = int(max_bar_width * min(1.0, max(0.0, value)))
            bar_rect = pygame.Rect(x + 25, bar_y, bar_width, 6)
            pygame.draw.rect(surface, color, bar_rect)
            
            # Value (1 decimal)
            value_text = f"{value:.1f}"
            self._render_text(surface, value_text, (x + 25 + bar_width + 5, bar_y), size=9, color=self.theme.text_secondary)
            
            bar_y += 8
