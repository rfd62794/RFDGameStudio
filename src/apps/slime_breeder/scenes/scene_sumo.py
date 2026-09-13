"""Sumo Resolution Scene - Stat-driven combat with culture advantages."""

import pygame
from typing import List, Tuple, Optional
from src.shared.engine.scene_manager import Scene
from src.shared.ui.spec import UISpec
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.layouts import SelectionLayout
from src.shared.ui.profile_card import ProfileCard
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.genetics.cultural_base import CulturalBase
from src.shared.ui.theme import UITheme, DEFAULT_THEME
import random
import math


class SumoScene(Scene):
    """Sumo combat scene with stat-driven resolution and culture advantages."""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = SelectionLayout(self.spec)
        
        # Get selected pair from context or kwargs
        self.selected_pair = kwargs.get('selected_pair', [])
        if not self.selected_pair:
            # Check if context has selected_pair
            context = kwargs.get('context')
            if context and hasattr(context, 'selected_pair'):
                self.selected_pair = context.selected_pair or []
        
        # Combat state
        self.slime_a: Optional[RosterSlime] = None
        self.slime_b: Optional[RosterSlime] = None
        self.winner: Optional[RosterSlime] = None
        self.loser: Optional[RosterSlime] = None
        self.culture_advantage: Optional[str] = None
        self.advantage_slime: Optional[RosterSlime] = None
        
        # Animation state
        self.countdown_timer = 2.0  # 2 seconds
        self.resolution_timer = 3.0  # 3 seconds
        self.phase = "COUNTDOWN"  # COUNTDOWN, RESOLUTION, COMPLETE
        
        # UI components
        self.ui_components: List = []
        self.cards: List[ProfileCard] = []
        
        # Initialize combat
        self._initialize_combat()
        self._setup_ui()
    
    def _initialize_combat(self):
        """Set up the two slimes for combat."""
        if len(self.selected_pair) >= 2:
            self.slime_a = self.selected_pair[0]
            self.slime_b = self.selected_pair[1]
        else:
            # Fallback: pick first two slimes from roster
            # This shouldn't happen in normal flow, but provides a safe fallback
            pass
        
        # Calculate culture advantage
        if self.slime_a and self.slime_b:
            self._calculate_culture_advantage()
    
    def _calculate_culture_advantage(self):
        """Calculate culture advantage based on RPS triangles."""
        if not self.slime_a or not self.slime_b:
            return
        
        culture_a = self.slime_a.genome.cultural_base
        culture_b = self.slime_b.genome.cultural_base
        
        # Aggressive triangle: ember beats gale, gale beats tundra, tundra beats ember
        aggressive_advantages = {
            CulturalBase.EMBER: CulturalBase.GALE,
            CulturalBase.GALE: CulturalBase.TUNDRA,
            CulturalBase.TUNDRA: CulturalBase.EMBER
        }
        
        # Tactical triangle: tide beats marsh, marsh beats crystal, crystal beats tide
        tactical_advantages = {
            CulturalBase.TIDE: CulturalBase.MARSH,
            CulturalBase.MARSH: CulturalBase.CRYSTAL,
            CulturalBase.CRYSTAL: CulturalBase.TIDE
        }
        
        # Check aggressive triangle
        if culture_a in aggressive_advantages and aggressive_advantages[culture_a] == culture_b:
            self.culture_advantage = f"⚡ {culture_a.value.upper()} ADVANTAGE"
            self.advantage_slime = self.slime_a
        elif culture_b in aggressive_advantages and aggressive_advantages[culture_b] == culture_a:
            self.culture_advantage = f"⚡ {culture_b.value.upper()} ADVANTAGE"
            self.advantage_slime = self.slime_b
        # Check tactical triangle
        elif culture_a in tactical_advantages and tactical_advantages[culture_a] == culture_b:
            self.culture_advantage = f"⚡ {culture_a.value.upper()} ADVANTAGE"
            self.advantage_slime = self.slime_a
        elif culture_b in tactical_advantages and tactical_advantages[culture_b] == culture_a:
            self.culture_advantage = f"⚡ {culture_b.value.upper()} ADVANTAGE"
            self.advantage_slime = self.slime_b
        # Void has no advantages or weaknesses
        elif culture_a == CulturalBase.VOID or culture_b == CulturalBase.VOID:
            self.culture_advantage = None
            self.advantage_slime = None
        else:
            self.culture_advantage = None
            self.advantage_slime = None
    
    def _calculate_score(self, slime: RosterSlime) -> float:
        """Calculate combat score: (atk * 0.5) + (hp * 0.3) + (spd * 0.2)"""
        if not slime or not slime.stat_block:
            return 0.0
        
        atk = slime.stat_block.atk
        hp = slime.stat_block.hp
        spd = slime.stat_block.spd
        
        score = (atk * 0.5) + (hp * 0.3) + (spd * 0.2)
        
        # Add 15% culture advantage bonus
        if slime == self.advantage_slime:
            score *= 1.15
        
        return score
    
    def _resolve_combat(self):
        """Determine winner based on scores."""
        if not self.slime_a or not self.slime_b:
            return
        
        score_a = self._calculate_score(self.slime_a)
        score_b = self._calculate_score(self.slime_b)
        
        if score_a > score_b:
            self.winner = self.slime_a
            self.loser = self.slime_b
        elif score_b > score_a:
            self.winner = self.slime_b
            self.loser = self.slime_a
        else:
            # Tie break - random winner
            self.winner = random.choice([self.slime_a, self.slime_b])
            self.loser = self.slime_a if self.winner == self.slime_b else self.slime_b
        
        # Award XP
        self._award_xp()
    
    def _award_xp(self):
        """Award XP to winner and consolation XP to loser."""
        if not self.winner or not self.loser:
            return
        
        # Winner gets 50 XP
        self.winner.experience += 50
        
        # Loser gets 20 XP consolation
        self.loser.experience += 20
        
        # Check for level up (simplified - every 100 XP = level up)
        for slime in [self.winner, self.loser]:
            if slime.experience >= 100:
                slime.level += 1
                slime.experience -= 100
    
    def _setup_ui(self):
        """Set up the UI components."""
        self.ui_components = []
        
        # Background panels
        Panel(self.layout.header, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        Panel(self.layout.action_bar, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Title
        Label("SUMO ARENA", (self.layout.header.centerx, 20), self.spec, 
              size="xl", bold=True, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Phase indicator
        phase_text = self._get_phase_text()
        phase_color = self.spec.color_warning if self.phase == "COUNTDOWN" else self.spec.color_success
        Label(phase_text, (self.layout.header.centerx, 50), self.spec, 
              size="md", color=phase_color, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Culture advantage banner
        if self.culture_advantage:
            Label(self.culture_advantage, (self.layout.header.centerx, 80), self.spec,
                  size="lg", color=self.spec.color_power, centered=True, bold=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Slime cards side by side in center area
        if self.slime_a and self.slime_b:
            card_width = 280
            card_spacing = 100
            total_width = (card_width * 2) + card_spacing
            start_x = self.layout.center_area.x + (self.layout.center_area.width - total_width) // 2
            card_y = self.layout.center_area.y + 50
            
            # Slime A card
            card_a_rect = pygame.Rect(start_x, card_y, card_width, 200)
            self.card_a = ProfileCard(self.slime_a, (start_x, card_y), self.spec, theme=DEFAULT_THEME)
            self.ui_components.append(self.card_a)
            
            # VS label
            vs_x = start_x + card_width + (card_spacing // 2)
            vs_y = card_y + 100
            Label("VS", (vs_x, vs_y), self.spec, size="xl", bold=True, 
                  centered=True, color=self.spec.color_text_dim, theme=DEFAULT_THEME).add_to(self.ui_components)
            
            # Slime B card
            card_b_rect = pygame.Rect(start_x + card_width + card_spacing, card_y, card_width, 200)
            self.card_b = ProfileCard(self.slime_b, (start_x + card_width + card_spacing, card_y), self.spec, theme=DEFAULT_THEME)
            self.ui_components.append(self.card_b)
            
            # Score display
            score_a = self._calculate_score(self.slime_a)
            score_b = self._calculate_score(self.slime_b)
            
            score_a_text = f"POWER: {score_a:.1f}"
            score_b_text = f"POWER: {score_b:.1f}"
            
            Label(score_a_text, (start_x + card_width // 2, card_y + 220), self.spec,
                  size="md", centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
            Label(score_b_text, (start_x + card_width + card_spacing + card_width // 2, card_y + 220), self.spec,
                  size="md", centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Result display (shown in COMPLETE phase)
        if self.phase == "COMPLETE" and self.winner:
            result_y = self.layout.center_area.y + 300
            result_text = f"{self.winner.name} WINS!"
            Label(result_text, (self.layout.center_area.centerx, result_y), self.spec,
                  size="xl", bold=True, centered=True, color=self.spec.color_success, theme=DEFAULT_THEME).add_to(self.ui_components)
            
            # XP gained text
            xp_text = f"+50 XP  |  {self.loser.name} +20 XP"
            Label(xp_text, (self.layout.center_area.centerx, result_y + 40), self.spec,
                  size="md", centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
            
            # Action buttons
            button_y = result_y + 100
            button_spacing = 20
            button_width = 140
            
            rematch_x = self.layout.center_area.centerx - button_width - button_spacing
            return_x = self.layout.center_area.centerx + button_spacing
            
            self.rematch_btn = Button("REMATCH", pygame.Rect(rematch_x, button_y, button_width, 44),
                                    self._handle_rematch, self.spec, variant="primary", theme=DEFAULT_THEME)
            self.return_btn = Button("RETURN", pygame.Rect(return_x, button_y, button_width, 44),
                                    self._handle_return, self.spec, variant="secondary", theme=DEFAULT_THEME)
            
            self.ui_components.append(self.rematch_btn)
            self.ui_components.append(self.return_btn)
    
    def _get_phase_text(self) -> str:
        """Get text for current phase."""
        if self.phase == "COUNTDOWN":
            if self.countdown_timer > 1.0:
                return "GET READY..."
            else:
                return "FIGHT!"
        elif self.phase == "RESOLUTION":
            return "BATTLE IN PROGRESS..."
        elif self.phase == "COMPLETE":
            return "BATTLE COMPLETE"
        return ""
    
    def _handle_rematch(self):
        """Start a rematch with the same slimes."""
        self.countdown_timer = 2.0
        self.resolution_timer = 3.0
        self.phase = "COUNTDOWN"
        self.winner = None
        self.loser = None
        self._setup_ui()
    
    def _handle_return(self):
        """Return to garden."""
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**self.context.resources))
    
    def tick(self, dt: float) -> None:
        """Update combat phase timers."""
        if self.phase == "COUNTDOWN":
            self.countdown_timer -= dt
            if self.countdown_timer <= 0:
                self.phase = "RESOLUTION"
                self._resolve_combat()
                self._setup_ui()
        
        elif self.phase == "RESOLUTION":
            self.resolution_timer -= dt
            if self.resolution_timer <= 0:
                self.phase = "COMPLETE"
                self._setup_ui()
        
        # Update UI components
        for comp in self.ui_components:
            if hasattr(comp, 'update'):
                comp.update(int(dt * 1000))
    
    def render(self, surface: pygame.Surface) -> None:
        """Render the sumo scene."""
        surface.fill(self.spec.color_bg)
        
        # Render UI components
        for comp in self.ui_components:
            comp.render(surface)
    
    def handle_event(self, event: pygame.event.Event) -> None:
        """Handle input events."""
        # Handle UI components
        for comp in reversed(self.ui_components):
            if hasattr(comp, "handle_event") and comp.handle_event(event):
                return
        
        # Handle ESC to return to garden
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                from src.apps.slime_breeder.ui.scene_garden import GardenScene
                self.context.manager.switch_to(GardenScene(**self.context.resources))
