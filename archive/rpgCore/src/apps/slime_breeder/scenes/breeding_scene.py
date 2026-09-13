import pygame
import random
import math
from enum import Enum, auto
from typing import Optional, List, Tuple

from src.shared.engine.scene_manager import Scene
from src.shared.ui.base import UIComponent
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import SelectionLayout, OverlayLayout
from src.shared.ui.theme import DEFAULT_THEME
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.genetics.inheritance import breed, generate_random
from src.shared.genetics.genome import SlimeGenome, CulturalBase
from src.shared.ui.profile_card import ProfileCard
from src.shared.rendering.slime_renderer import SlimeRenderer
from src.apps.slime_breeder.entities.slime import Slime

class BreedingState(Enum):
    SELECT_A = auto()
    SELECT_B = auto()
    PREVIEW  = auto()
    ANIMATION = auto()
    NAMING   = auto()
    COMPLETE = auto()

class BreedingScene(Scene):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = SelectionLayout(self.spec)
        
        # Use shared roster from kwargs or create SceneContext
        self.roster = kwargs.get('roster')
        if not self.roster:
            # Create SceneContext to get shared roster
            from src.shared.engine.scene_context import SceneContext
            context = SceneContext(
                entity_registry=kwargs.get('entity_registry'),
                game_session=kwargs.get('game_session'),
                dispatch_system=kwargs.get('dispatch_system'),
                roster=None,  # Will load from file if not provided
                roster_sync=kwargs.get('roster_sync')  # Add sync service
            )
            self.set_context(context)
            self.roster = context.roster
        
        # Store selected pair if provided from carousel
        selected_pair = kwargs.get('selected_pair')
        if selected_pair and self.context:
            self.context.selected_pair = selected_pair
            
        self.state = BreedingState.SELECT_A
        
        # Selection state
        self.parent_a: Optional[RosterSlime] = None
        self.parent_b: Optional[RosterSlime] = None
        self.offspring_genome = None
        self.offspring_slime = None
        self.offspring_name = ""
        
        # UI Setup
        self.ui_components: List[UIComponent] = []
        self.cards: List[ProfileCard] = []
        self._setup_ui()
        
        # Rendering
        self.renderer = SlimeRenderer()
        
        # Animation timer
        self.anim_timer = 0.0
        self._complete_timer = 0.0
        # Input for naming
        self.name_font = pygame.font.Font(None, int(48 * spec.scale_factor))

    def on_enter(self) -> None:
        """Check for pre-selected pair from carousel."""
        # Check if SceneContext has pre-selected pair from carousel
        if self.context and hasattr(self.context, 'selected_pair'):
            selected_pair = self.context.selected_pair
            if selected_pair and len(selected_pair) == 2:
                # Pre-select both parents from carousel
                self.parent_a = selected_pair[0]
                self.parent_b = selected_pair[1]
                self.state = BreedingState.PREVIEW
                # Generate offspring genome
                from src.shared.genetics.breeding_system import BreedingSystem
                self.offspring_genome = BreedingSystem.breed(self.parent_a, self.parent_b)
                self._setup_ui()
                return
        
        # No pre-selected pair, use normal flow
        self._setup_ui()

    def _setup_ui(self):
        self.ui_components = []
        
        # 1. Base Layout Panels
        Panel(self.layout.header, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        Panel(self.layout.action_bar, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # 2. Title and Status
        Label("BREEDING CHAMBER", (self.layout.header.centerx, 20), self.spec, size="xl", bold=True, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        status_text = self.get_status_text()
        status_color = self.spec.color_text_dim
        if self.state == BreedingState.PREVIEW: status_color = self.spec.color_warning
        
        Label(status_text, (self.layout.header.centerx, 50), self.spec, size="md", color=status_color, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)

        # 3. Global Navigation
        Button("BACK", pygame.Rect(20, 10, 100, 44), self._handle_back, self.spec, variant="secondary", theme=DEFAULT_THEME).add_to(self.ui_components)

        # 4. State-Specific Content
        if self.state in [BreedingState.SELECT_A, BreedingState.SELECT_B]:
            self._setup_selection_view()
        elif self.state == BreedingState.PREVIEW:
            self._setup_preview_view()
        elif self.state == BreedingState.COMPLETE:
            self._setup_complete_view()

    def _setup_selection_view(self):
        # Left Panel: Parent Slots
        Panel(self.layout.left_panel, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        Label("PARENT A", (self.layout.left_panel.x + 20, self.layout.left_panel.y + 10), self.spec, bold=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        if self.parent_a:
            ProfileCard(self.parent_a, (self.layout.left_panel.x + 20, self.layout.left_panel.y + 40), self.spec, theme=DEFAULT_THEME).add_to(self.ui_components)
        else:
            p_rect = pygame.Rect(self.layout.left_panel.x + 20, self.layout.left_panel.y + 40, self.spec.card_width, self.spec.card_height)
            Panel(p_rect, self.spec, variant="surface", border=True, theme=DEFAULT_THEME).add_to(self.ui_components)
            Label("NONE SELECTED", (p_rect.centerx, p_rect.centery), self.spec, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)

        # Right Panel: Selection Grid
        Panel(self.layout.right_panel, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        Label("AVAILABLE PARTNERS", (self.layout.right_panel.x + 20, self.layout.right_panel.y + 10), self.spec, bold=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Get breeding candidates - show more slimes
        slimes = [s for s in self.roster.slimes if s.alive and s != self.parent_a]
        
        # Calculate how many slimes can fit in the panel
        panel_height = self.layout.right_panel.height - 60  # 60px for header and padding
        slime_height = 90  # Height per slime entry
        max_visible = max(1, panel_height // slime_height)
        
        self.cards = []
        for i, slime in enumerate(slimes[:max_visible]):
            row_y = self.layout.right_panel.y + 40 + (i * slime_height)
            card = ProfileCard(slime, (self.layout.right_panel.x + 20, row_y), self.spec, theme=DEFAULT_THEME).add_to(self.ui_components)
            self.cards.append(card)
            
            if not slime.can_breed:
                # Ghost button to show why can't select
                Label("(Need Lv.3)", (card.rect.right - 80, card.rect.y + 10), self.spec, size="sm", color=self.spec.color_danger, theme=DEFAULT_THEME).add_to(self.ui_components)
            else:
                Button("Select", pygame.Rect(card.rect.right - 70, card.rect.y + 10, 60, 30),
                       lambda s=slime: self.handle_card_click(s), self.spec, variant="primary", theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # If there are more slimes than can fit, show indicator
        if len(slimes) > max_visible:
            Label(f"... and {len(slimes) - max_visible} more partners", 
                  (self.layout.right_panel.x + 20, self.layout.right_panel.bottom - 25), 
                  self.spec, size="sm", color=self.spec.color_text_dim, theme=DEFAULT_THEME).add_to(self.ui_components)

    def _setup_preview_view(self):
        # Show both parents in side panels, preview in center
        Panel(self.layout.left_panel, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        ProfileCard(self.parent_a, (self.layout.left_panel.x + 20, self.layout.left_panel.y + 40), self.spec, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        Panel(self.layout.right_panel, self.spec, variant="surface", theme=DEFAULT_THEME).add_to(self.ui_components)
        ProfileCard(self.parent_b, (self.layout.right_panel.x + 20, self.layout.right_panel.y + 40), self.spec, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        # Center Preview Table
        center_rect = self.layout.center_area.inflate(-40, -40)
        preview_panel = Panel(center_rect, self.spec, variant="card", theme=DEFAULT_THEME).add_to(self.ui_components)
        
        Label("POTENTIAL OFFSPRING", (center_rect.centerx, center_rect.y + 20), self.spec, size="lg", bold=True, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        y_off = center_rect.y + 60
        stats = [
            ("HP", self.offspring_genome.base_hp),
            ("ATK", self.offspring_genome.base_atk),
            ("SPD", self.offspring_genome.base_spd)
        ]
        for label, val in stats:
            Label(f"{label}: {int(val*0.95)}-{int(val*1.05)}", (center_rect.centerx, y_off), self.spec, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
            y_off += 30
            
        Label(f"Culture: {self.offspring_genome.cultural_base.value.upper()}", (center_rect.centerx, y_off + 20), self.spec, color=self.spec.color_accent, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        Button("BEGIN RITUAL", pygame.Rect(center_rect.centerx - 100, center_rect.bottom - 60, 200, 44),
               self.start_breeding, self.spec, variant="primary", theme=DEFAULT_THEME).add_to(self.ui_components)

    def _setup_complete_view(self):
        # Show Offspring in center
        center_rect = self.layout.center_area.inflate(-20, -100)
        Panel(center_rect, self.spec, variant="card", theme=DEFAULT_THEME).add_to(self.ui_components)
        
        Label("BREEDING COMPLETE", (center_rect.centerx, center_rect.y + 20), self.spec, size="lg", bold=True, centered=True, theme=DEFAULT_THEME).add_to(self.ui_components)
        
        if self.offspring_slime:
            ProfileCard(self.offspring_slime, (center_rect.centerx - self.spec.card_width//2, center_rect.y + 60), self.spec, theme=DEFAULT_THEME).add_to(self.ui_components)
            
        def go_to_garden():
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            self.context.manager.switch_to(GardenScene(**self.context.resources))
            
        Button("RETURN TO GARDEN", pygame.Rect(center_rect.centerx - 100, center_rect.bottom - 60, 200, 44),
               go_to_garden, self.spec, variant="primary", theme=DEFAULT_THEME).add_to(self.ui_components)

    def get_status_text(self) -> str:
        if self.state == BreedingState.SELECT_A:
            return "CHOOSE PARENT A (LEVEL 3+)"
        elif self.state == BreedingState.SELECT_B:
            return f"CHOOSE PARTNER FOR {self.parent_a.name.upper()}"
        elif self.state == BreedingState.PREVIEW:
            return "WARNING: BOTH PARENTS WILL LOSE 1 LEVEL"
        elif self.state == BreedingState.ANIMATION:
            return "STIRRING THE PRISM..."
        elif self.state == BreedingState.NAMING:
            return "A NEW SLIME ARRIVES"
        elif self.state == BreedingState.COMPLETE:
            return "SUCCESSFUL LEGACY"
        return ""

    def _handle_back(self):
        if self.state in [BreedingState.SELECT_A, BreedingState.COMPLETE]:
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            self.context.manager.switch_to(GardenScene(**self.context.resources))
        elif self.state == BreedingState.SELECT_B:
            self.state = BreedingState.SELECT_A
            self.parent_a = None
            self._setup_ui()
        elif self.state == BreedingState.PREVIEW:
            self.state = BreedingState.SELECT_B
            self.parent_b = None
            self._setup_ui()

    def handle_event(self, event: pygame.event.Event):
        # Pass to UI components
        for comp in reversed(self.ui_components):
            if hasattr(comp, "handle_event") and comp.handle_event(event):
                return

        if self.state == BreedingState.NAMING:
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_RETURN:
                    if self.offspring_name:
                        self.finalize_breeding()
                elif event.key == pygame.K_BACKSPACE:
                    self.offspring_name = self.offspring_name[:-1]
                else:
                    if len(self.offspring_name) < 12:
                        self.offspring_name += event.unicode

    def handle_card_click(self, slime: RosterSlime):
        if not slime.can_breed:
            return
        
        if self.state == BreedingState.SELECT_A:
            self.parent_a = slime
            self.state = BreedingState.SELECT_B
            self._setup_ui()
        elif self.state == BreedingState.SELECT_B:
            if slime != self.parent_a:
                self.parent_b = slime
                self.state = BreedingState.PREVIEW
                # Use new BreedingSystem for allele resolution
                from src.shared.genetics.breeding_system import BreedingSystem
                self.offspring_genome = BreedingSystem.breed(self.parent_a, self.parent_b)
                self._setup_ui()

    def start_breeding(self):
        self.state = BreedingState.ANIMATION
        self.anim_timer = 0.0
        self._setup_ui()

    def finalize_breeding(self):
        if not self.parent_a.is_elder:
            self.parent_a.level = max(1, self.parent_a.level - 1)
        if not self.parent_b.is_elder:
            self.parent_b.level = max(1, self.parent_b.level - 1)
        
        start_level = 2 if (self.parent_a.is_elder or self.parent_b.is_elder) else 1
        new_id = f"slime_{random.randint(10000, 99999)}"
        from src.shared.genetics.entity_template import SlimeEntityTemplate
        self.offspring_slime = SlimeEntityTemplate.build(
            genome=self.offspring_genome,
            name=self.offspring_name,
            slime_id=new_id,
            team=TeamRole.UNASSIGNED,
            level=start_level,
            generation=self.offspring_genome.generation
        )
        # Add to both roster and registry using sync service
        if self.context and self.context.roster_sync:
            success = self.context.roster_sync.add_slime(self.offspring_slime)
            if not success:
                logger.error(f"Failed to add offspring {self.offspring_slime.slime_id} via sync service")
        else:
            # Fallback to direct roster.add for backward compatibility
            self.roster.add_slime(self.offspring_slime)
        
        # Auto-save using SaveManager
        if self.context and hasattr(self.context, 'save_roster'):
            self.context.save_roster()
        else:
            from src.shared.teams.roster_save import save_roster
            save_roster(self.roster)
        
        self.state = BreedingState.COMPLETE
        self._complete_timer = 3.0
        self._setup_ui()

    def tick(self, dt: float):
        dt_ms = int(dt * 1000)
        for comp in self.ui_components:
            comp.update(dt_ms)

        if self.state == BreedingState.ANIMATION:
            self.anim_timer += dt
            if self.anim_timer > 2.0:
                self.state = BreedingState.NAMING
                self.offspring_name = f"Slug-{random.randint(10, 99)}"
                self._setup_ui()
                
        if self.state == BreedingState.COMPLETE:
            if self._complete_timer > 0:
                self._complete_timer -= dt
                if self._complete_timer <= 0:
                    from src.apps.slime_breeder.ui.scene_garden import GardenScene
                    self.context.manager.switch_to(GardenScene(**self.context.resources))

    def render(self, surface: pygame.Surface):
        surface.fill(self.spec.color_bg)
        
        for comp in self.ui_components:
            comp.render(surface)
            
        if self.state == BreedingState.ANIMATION:
            progress = min(1.0, self.anim_timer / 2.0)
            center = (self.spec.screen_width // 2, self.spec.screen_height // 2)
            for i in range(12):
                angle = math.radians(i * 30 + progress * 360)
                dist = 150 * (1.0 - progress)
                px = center[0] + dist * math.cos(angle)
                py = center[1] + dist * math.sin(angle)
                pygame.draw.circle(surface, self.spec.color_accent, (int(px), int(py)), 10)

        elif self.state == BreedingState.NAMING:
            overlay_rect = self.layout.center_area.inflate(-100, -200)
            pygame.draw.rect(surface, (0,0,0,180), self.spec.screen_rect if hasattr(self.spec, "screen_rect") else surface.get_rect(), )
            # Simple naming input render
            txt_surf = self.name_font.render(self.offspring_name + "_", True, (255, 255, 255))
            txt_rect = txt_surf.get_rect(center=(self.spec.screen_width // 2, self.spec.screen_height // 2))
            surface.blit(txt_surf, txt_rect)
            Label("NAME YOUR NEW ARRIVAL", (txt_rect.centerx, txt_rect.top - 40), self.spec, centered=True, bold=True, theme=DEFAULT_THEME).render(surface)
