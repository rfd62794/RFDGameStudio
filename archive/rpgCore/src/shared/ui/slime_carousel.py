"""
SlimeCarousel - Reusable slime selection overlay component

Provides full-screen overlay for selecting slimes in different modes.
Returns selected slime(s) to caller via CarouselResult.
"""

import pygame
from enum import Enum, auto
from dataclasses import dataclass
from typing import Optional, List, Callable, Dict, Any
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.profile_card import ProfileCard
from src.shared.ui.theme import DEFAULT_THEME, UITheme
from src.shared.ui.spec import UISpec
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.genetics.cultural_base import CulturalBase


class CarouselMode(Enum):
    """Carousel selection modes."""
    SINGLE = auto()    # Select one slime
    PAIR = auto()      # Select two slimes
    BROWSE = auto()    # Browse only, no selection


class CarouselFilter(Enum):
    """Filter options for slime display."""
    ALL = auto()
    FREE = auto()      # Not assigned to any team
    LEVEL_3_PLUS = auto()  # Level 3+ (breeding eligible)
    BY_CULTURE = auto()  # Filter by specific culture


@dataclass
class CarouselResult:
    """Result from carousel selection."""
    confirmed: bool
    selected: List[RosterSlime]
    mode: str


class SlimeCarousel:
    """
    Full-screen overlay for slime selection.
    
    Renders on top of current scene, handles events, returns result.
    """
    
    def __init__(self, roster: Roster, mode: CarouselMode, theme: Optional[UITheme] = None, 
                 spec: Optional[UISpec] = None, filter_type: Optional[CarouselFilter] = None):
        self.roster = roster
        self.mode = mode
        self.theme = theme or DEFAULT_THEME
        self.spec = spec or UISpec()
        self.filter_type = filter_type or CarouselFilter.ALL
        self.culture_filter = None  # For BY_CULTURE filter
        
        # State
        self.current_index = 0
        self.selected_slimes: List[RosterSlime] = []
        self.is_complete = False
        self.ui_components = []  # Initialize UI components list
        self.result: Optional[CarouselResult] = None
        
        # Animation
        self.slide_offset = 0.0
        self.target_offset = 0.0
        self.slide_speed = 800.0  # pixels per second
        
        # Setup UI
        self._setup_ui()
        
        # Apply initial filter
        self._apply_filter(self.filter_type)
    
    def _setup_ui(self):
        """Set up UI components."""
        # Full-screen overlay
        self.overlay_rect = pygame.Rect(0, 0, self.spec.screen_width, self.spec.screen_height)
        
        # Center panel
        panel_width = 600
        panel_height = 500
        panel_x = (self.spec.screen_width - panel_width) // 2
        panel_y = (self.spec.screen_height - panel_height) // 2
        
        self.panel_rect = pygame.Rect(panel_x, panel_y, panel_width, panel_height)
        
        # Create main panel
        self.main_panel = Panel(self.panel_rect, self.spec, variant="card", theme=self.theme)
        self.ui_components.append(self.main_panel)
        
        # Filter buttons (top of panel)
        self.filter_buttons: Dict[str, Button] = {}
        filter_y = panel_y + 10
        filter_x = panel_x + 20
        
        filter_configs = [
            ("ALL", CarouselFilter.ALL),
            ("FREE", CarouselFilter.FREE),
            ("LEVEL 3+", CarouselFilter.LEVEL_3_PLUS),
            ("BY CULTURE", CarouselFilter.BY_CULTURE)
        ]
        
        for i, (label, filter_type) in enumerate(filter_configs):
            btn_rect = pygame.Rect(filter_x + i * 80, filter_y, 70, 25)
            btn = Button(label, btn_rect, lambda f=filter_type: self._apply_filter(f), 
                       self.spec, variant="ghost", theme=self.theme)
            self.filter_buttons[label] = btn
            self.ui_components.append(btn)
        
        # Navigation arrows
        arrow_size = 40
        arrow_y = panel_y + panel_height // 2 - arrow_size // 2
        self.left_arrow = Button("◀", pygame.Rect(panel_x - 50, arrow_y, arrow_size, arrow_size),
                               self._prev_slime, self.spec, variant="secondary", theme=self.theme)
        self.right_arrow = Button("▶", pygame.Rect(panel_x + panel_width + 10, arrow_y, arrow_size, arrow_size),
                                self._next_slime, self.spec, variant="secondary", theme=self.theme)
        
        self.ui_components.append(self.left_arrow)
        self.ui_components.append(self.right_arrow)
        
        # Counter
        self.counter_label = Label("1 / 1", (panel_x + panel_width // 2, panel_y + panel_height - 30),
                                  self.spec, centered=True, theme=self.theme)
        self.ui_components.append(self.counter_label)
        
        # Action buttons (bottom)
        button_y = panel_y + panel_height - 60
        button_width = 100
        button_height = 35
        button_spacing = 20
        
        if self.mode == CarouselMode.BROWSE:
            self.cancel_btn = Button("CLOSE", 
                                     pygame.Rect(panel_x + panel_width // 2 - button_width // 2, button_y, 
                                              button_width, button_height),
                                     self._cancel, self.spec, variant="primary", theme=self.theme)
            self.ui_components.append(self.cancel_btn)
        else:
            self.select_btn = Button("SELECT", 
                                     pygame.Rect(panel_x + panel_width // 2 - button_width - button_spacing // 2, 
                                              button_y, button_width, button_height),
                                     self._select, self.spec, variant="primary", theme=self.theme)
            self.cancel_btn = Button("CANCEL", 
                                     pygame.Rect(panel_x + panel_width // 2 + button_spacing // 2, 
                                              button_y, button_width, button_height),
                                     self._cancel, self.spec, variant="secondary", theme=self.theme)
            self.ui_components.append(self.select_btn)
            self.ui_components.append(self.cancel_btn)
    
    def _apply_filter(self, filter_type: CarouselFilter):
        """Apply filter to slime list."""
        self.filter_type = filter_type
        self.current_index = 0
        
        if filter_type == CarouselFilter.ALL:
            self.filtered_slimes = self.roster.slimes.copy()
        elif filter_type == CarouselFilter.FREE:
            self.filtered_slimes = [s for s in self.roster.slimes if s.team == TeamRole.UNASSIGNED]
        elif filter_type == CarouselFilter.LEVEL_3_PLUS:
            self.filtered_slimes = [s for s in self.roster.slimes if s.level >= 3]
        elif filter_type == CarouselFilter.BY_CULTURE:
            # Default to first culture, can be changed with additional UI
            self.filtered_slimes = [s for s in self.roster.slimes if s.genome.cultural_base == CulturalBase.EMBER]
        
        # Update filter button states
        for label, btn in self.filter_buttons.items():
            btn_variant = "primary" if self._get_filter_from_label(label) == filter_type else "ghost"
            # Update button variant (would need to modify Button class to support variant changes)
    
    def _get_filter_from_label(self, label: str) -> CarouselFilter:
        """Get filter enum from button label."""
        mapping = {
            "ALL": CarouselFilter.ALL,
            "FREE": CarouselFilter.FREE,
            "LEVEL 3+": CarouselFilter.LEVEL_3_PLUS,
            "BY CULTURE": CarouselFilter.BY_CULTURE
        }
        return mapping.get(label, CarouselFilter.ALL)
    
    def _next_slime(self):
        """Navigate to next slime."""
        if self.filtered_slimes:
            self.current_index = (self.current_index + 1) % len(self.filtered_slimes)
            self.target_offset = -self.panel_rect.width
    
    def _prev_slime(self):
        """Navigate to previous slime."""
        if self.filtered_slimes:
            self.current_index = (self.current_index - 1) % len(self.filtered_slimes)
            self.target_offset = self.panel_rect.width
    
    def _select(self):
        """Handle select action."""
        if not self.filtered_slimes:
            return
        
        current_slime = self.filtered_slimes[self.current_index]
        
        if self.mode == CarouselMode.SINGLE:
            self.selected_slimes = [current_slime]
            self._complete(True)
        elif self.mode == CarouselMode.PAIR:
            if len(self.selected_slimes) == 0:
                self.selected_slimes.append(current_slime)
            elif len(self.selected_slimes) == 1 and current_slime != self.selected_slimes[0]:
                self.selected_slimes.append(current_slime)
                self._complete(True)
    
    def _cancel(self):
        """Handle cancel action."""
        self._complete(False)
    
    def _complete(self, confirmed: bool):
        """Mark carousel as complete with result."""
        self.is_complete = True
        self.result = CarouselResult(
            confirmed=confirmed,
            selected=self.selected_slimes if confirmed else [],
            mode=self.mode.value
        )
    
    def handle_event(self, event: pygame.event.Event) -> Optional[CarouselResult]:
        """Handle input events."""
        if self.is_complete:
            return self.result
        
        # Handle UI components
        for comp in reversed(self.ui_components):
            if hasattr(comp, 'handle_event') and comp.handle_event(event):
                return None
        
        # Handle keyboard navigation
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._cancel()
            elif event.key == pygame.K_LEFT:
                self._prev_slime()
            elif event.key == pygame.K_RIGHT:
                self._next_slime()
            elif event.key == pygame.K_RETURN:
                if self.mode != CarouselMode.BROWSE:
                    self._select()
        
        return None
    
    def tick(self, dt: float):
        """Update animations."""
        # Smooth slide animation
        if abs(self.slide_offset - self.target_offset) > 1:
            direction = 1 if self.target_offset > self.slide_offset else -1
            self.slide_offset += direction * self.slide_speed * dt
            
            # Clamp to target
            if direction > 0:
                self.slide_offset = min(self.slide_offset, self.target_offset)
            else:
                self.slide_offset = max(self.slide_offset, self.target_offset)
        else:
            self.slide_offset = self.target_offset
        
        # Update UI components
        for comp in self.ui_components:
            if hasattr(comp, 'update'):
                comp.update(int(dt * 1000))
    
    def render(self, surface: pygame.Surface):
        """Render the carousel overlay."""
        # Dark overlay
        overlay = pygame.Surface((self.spec.screen_width, self.spec.screen_height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))
        
        # Main panel
        self.main_panel.render(surface)
        
        # Current slime display
        if self.filtered_slimes:
            current_slime = self.filtered_slimes[self.current_index]
            self._render_slime_display(surface, current_slime)
        
        # Navigation elements
        self.left_arrow.render(surface)
        self.right_arrow.render(surface)
        self.counter_label.render(surface)
        
        # Filter buttons
        for btn in self.filter_buttons.values():
            btn.render(surface)
        
        # Action buttons
        if self.mode == CarouselMode.BROWSE:
            self.cancel_btn.render(surface)
        else:
            self.select_btn.render(surface)
            self.cancel_btn.render(surface)
        
        # Pair mode indicators
        if self.mode == CarouselMode.PAIR:
            self._render_pair_indicators(surface)
    
    def _render_slime_display(self, surface: pygame.Surface, slime: RosterSlime):
        """Render the current slime display."""
        panel_center_x = self.panel_rect.centerx
        panel_center_y = self.panel_rect.centery
        
        # Culture color background tint
        culture_color = self.theme.culture_color(slime.genome.cultural_base.value)
        bg_rect = pygame.Rect(self.panel_rect.x + 20, self.panel_rect.y + 60, 
                              self.panel_rect.width - 40, 200)
        
        # Semi-transparent culture color background
        culture_bg = pygame.Surface((bg_rect.width, bg_rect.height), pygame.SRCALPHA)
        culture_bg.fill((*culture_color, 30))
        surface.blit(culture_bg, bg_rect)
        
        # Slime name (large, gold text)
        name_label = Label(slime.name, (panel_center_x, bg_rect.y + 20),
                          self.spec, size="xl", color=self.theme.text_accent, 
                          centered=True, theme=self.theme)
        name_label.render(surface)
        
        # Stage • Level • Generation
        stage = getattr(slime.genome, 'stage', 'Unknown')
        info_text = f"{stage} • Lv.{slime.level} • Gen {slime.generation}"
        info_label = Label(info_text, (panel_center_x, bg_rect.y + 50),
                         self.spec, size="sm", color=self.theme.text_secondary,
                         centered=True, theme=self.theme)
        info_label.render(surface)
        
        # Culture badge
        culture_text = slime.genome.cultural_base.value.upper()
        culture_label = Label(culture_text, (panel_center_x, bg_rect.y + 70),
                              self.spec, size="sm", color=culture_color,
                              centered=True, theme=self.theme)
        culture_label.render(surface)
        
        # Stats bars (using stat_block)
        if hasattr(slime, 'stat_block') and slime.stat_block:
            hp = slime.stat_block.hp
            atk = slime.stat_block.atk
            spd = slime.stat_block.spd
        else:
            # Fallback to stat_calculator
            from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
            hp = calculate_hp(slime.genome, slime.level)
            atk = calculate_attack(slime.genome, slime.level)
            spd = calculate_speed(slime.genome, slime.level)
        
        # Render stat bars
        bar_width = 200
        bar_height = 8
        bar_x = panel_center_x - bar_width // 2
        bar_y = bg_rect.y + 100
        
        stats = [
            ("HP", hp, self.theme.success),
            ("ATK", atk, self.theme.danger),
            ("SPD", spd, self.theme.info)
        ]
        
        for i, (label, value, color) in enumerate(stats):
            y = bar_y + i * 25
            
            # Bar background
            pygame.draw.rect(surface, (40, 40, 40), (bar_x, y, bar_width, bar_height))
            
            # Bar fill
            max_value = max(hp, atk, spd) * 1.2  # Scale to max
            fill_width = int(bar_width * (value / max_value))
            pygame.draw.rect(surface, color, (bar_x, y, fill_width, bar_height))
            
            # Label and value
            label_text = f"{label}: {value}"
            text_label = Label(label_text, (bar_x - 10, y), self.spec, size="sm", 
                             color=self.theme.text_primary, theme=self.theme)
            text_label.render(surface)
    
    def _render_pair_indicators(self, surface: pygame.Surface):
        """Render pair selection indicators."""
        panel_center_x = self.panel_rect.centerx
        panel_y = self.panel_rect.y
        
        # Slot indicators
        slot_y = panel_y + self.panel_rect.height - 100
        
        for i in range(2):
            slot_x = panel_center_x - 150 + i * 300
            
            if i < len(self.selected_slimes):
                # Selected slime
                slime = self.selected_slimes[i]
                text = f"Slot {chr(65 + i)}: {slime.name}"
                color = self.theme.success
            else:
                # Empty slot
                text = f"Slot {chr(65 + i)}: Selecting..."
                color = self.theme.text_dim
            
            slot_label = Label(text, (slot_x, slot_y), self.spec, size="md", 
                             color=color, centered=True, theme=self.theme)
            slot_label.render(surface)
