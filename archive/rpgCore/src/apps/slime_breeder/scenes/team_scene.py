import pygame
from loguru import logger
from typing import List, Optional, Tuple
from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.tabbed_panel import TabbedPanel, TabDef
from src.shared.ui.theme import DEFAULT_THEME
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import SelectionLayout
from src.shared.ui.profile_card import ProfileCard
from src.shared.teams.roster import Roster, TeamRole, RosterSlime
from src.shared.teams.roster_save import load_roster, save_roster

class TeamScene(Scene):
    """
    Dedicated team management screen using SelectionLayout.
    """
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
        
        self.dungeon_team = None
        self.racing_team = None
        self.ui_components = []

    def on_enter(self) -> None:
        # Use existing roster, don't reload
        self.dungeon_team = self.roster.get_dungeon_team()
        self.racing_team = self.roster.get_racing_team()
        self._setup_ui()

    def _setup_ui(self):
        self.ui_components = []
        
        # Create tab definitions
        tabs = [
            TabDef("dungeon", "DUNGEON", DEFAULT_THEME.team_colors["dungeon"]),
            TabDef("racing", "RACING", DEFAULT_THEME.team_colors["racing"]),
            TabDef("conquest", "CONQUEST", DEFAULT_THEME.team_colors["conquest"])
        ]
        
        # Create tabbed panel (left 65% of screen)
        tabbed_rect = pygame.Rect(
            self.layout.left_panel.x,
            self.layout.left_panel.y,
            int(self.spec.screen_width * 0.65),
            self.layout.left_panel.height
        )
        self.tabbed_panel = TabbedPanel(tabbed_rect, tabs, theme=DEFAULT_THEME)
        self.ui_components.append(self.tabbed_panel)
        
        # Set content callbacks for each tab
        self.tabbed_panel.set_content_callback("dungeon", self._render_dungeon_content)
        self.tabbed_panel.set_content_callback("racing", self._render_racing_content)
        self.tabbed_panel.set_content_callback("conquest", self._render_conquest_content)
        
        # Update badge counts
        self.tabbed_panel.set_badge("dungeon", len(self.dungeon_team.members))
        self.tabbed_panel.set_badge("racing", len(self.racing_team.members))
        self.tabbed_panel.set_badge("conquest", 0)  # Future content
        
        # Available Slimes panel (right 35%)
        available_rect = pygame.Rect(
            tabbed_rect.right + 10,
            self.layout.right_panel.y,
            self.spec.screen_width - tabbed_rect.width - 20,
            self.layout.right_panel.height
        )
        self.available_panel = Panel(available_rect, self.spec, variant="surface", theme=DEFAULT_THEME)
        self.ui_components.append(self.available_panel)
        
        # Action buttons (bottom)
        self.action_panel = Panel(self.layout.action_bar, self.spec, variant="surface", theme=DEFAULT_THEME)
        self.ui_components.append(self.action_panel)
        
        # Back button
        def go_to_garden():
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            self.context.manager.switch_to(GardenScene(**self.context.resources))
            
        back_btn = Button("← Back", self.layout.action_bar, go_to_garden, self.spec, variant="ghost", theme=DEFAULT_THEME)
        self.ui_components.append(back_btn)
        
        # Context-aware Enter button
        self.enter_btn = Button("ENTER DUNGEON ⚔", 
                               pygame.Rect(self.layout.action_bar.width - 220, self.layout.action_bar.y + 10, 200, 44),
                               self._handle_enter_button, self.spec, variant="primary", theme=DEFAULT_THEME)
        self.ui_components.append(self.enter_btn)
        
        # Update enter button text based on active tab
        self._update_enter_button()
        
        # Setup available slimes
        self._setup_available_slimes()
    
    def _update_enter_button(self):
        """Update enter button based on active tab"""
        if hasattr(self, 'tabbed_panel') and self.tabbed_panel:
            if self.tabbed_panel.active_tab_id == "dungeon":
                self.enter_btn.label_comp.text = "ENTER DUNGEON ⚔"
                self.enter_btn.visible = len(self.dungeon_team.members) > 0
            elif self.tabbed_panel.active_tab_id == "racing":
                self.enter_btn.label_comp.text = "ENTER RACING 🏁"
                self.enter_btn.visible = len(self.racing_team.members) > 0
            elif self.tabbed_panel.active_tab_id == "conquest":
                self.enter_btn.label_comp.text = "ENTER CONQUEST ⚔"
                self.enter_btn.visible = False  # Future content
    
    def _handle_enter_button(self):
        """Handle enter button click based on active tab"""
        if hasattr(self, 'tabbed_panel') and self.tabbed_panel:
            if self.tabbed_panel.active_tab_id == "dungeon":
                self._enter_dungeon()
            elif self.tabbed_panel.active_tab_id == "racing":
                self._enter_racing()
        # Conquest future
    
    def _setup_available_slimes(self):
        """Setup available slimes panel"""
        # Clear existing available slimes components
        self.available_panel.children = []
        
        # Header
        Label("AVAILABLE SLIMES", (self.available_panel.rect.x + 20, self.available_panel.rect.y + 10), 
              self.spec, size="md", bold=True, theme=DEFAULT_THEME).add_to(self.available_panel.children)
        
        # Available slimes list - show more slimes with scrolling
        unassigned = self.roster.unassigned()
        
        # Calculate how many slimes can fit in the panel
        panel_height = self.available_panel.rect.height - 60  # 60px for header and padding
        slime_height = 70  # Height per slime entry
        max_visible = max(1, panel_height // slime_height)
        
        # Show all unassigned slimes (or as many as fits)
        for i, slime in enumerate(unassigned[:max_visible]):
            row_y = self.available_panel.rect.y + 40 + (i * slime_height)
            row_rect = pygame.Rect(self.available_panel.rect.x + 10, row_y, self.available_panel.rect.width - 20, slime_height - 5)
            Panel(row_rect, self.spec, variant="surface", border=True, theme=DEFAULT_THEME).add_to(self.available_panel.children)
            
            # Mini info: name, level, culture
            actual_slime = self.roster.get_creature(slime.slime_id)
            if actual_slime:
                name = actual_slime.name
                level = actual_slime.level
                culture = actual_slime.genome.cultural_base.value.title()
            else:
                name = slime.slime_id
                level = 1
                culture = "Unknown"
            
            Label(name, (row_rect.x + 10, row_rect.y + 5), self.spec, size="sm", bold=True, theme=DEFAULT_THEME).add_to(self.available_panel.children)
            Label(f"Lv.{level} {culture}", 
                  (row_rect.x + 10, row_rect.y + 25), self.spec, size="sm", color=self.spec.color_text_dim, theme=DEFAULT_THEME).add_to(self.available_panel.children)
            
            # Add click handler for assignment
            def make_click_handler(target_slime):
                def click_handler():
                    if hasattr(self, 'tabbed_panel') and self.tabbed_panel:
                        if self.tabbed_panel.active_tab_id == "dungeon":
                            self._assign_to_dungeon(target_slime)
                        elif self.tabbed_panel.active_tab_id == "racing":
                            self._assign_to_racing(target_slime)
                        elif self.tabbed_panel.active_tab_id == "conquest":
                            # TODO: Implement conquest team assignment
                            pass
                return click_handler
            
            Button("Assign", pygame.Rect(row_rect.right - 70, row_rect.y + 35, 60, 25), 
                   make_click_handler(slime), self.spec, variant="primary", theme=DEFAULT_THEME).add_to(self.available_panel.children)
        
        # If there are more slimes than can fit, show indicator
        if len(unassigned) > max_visible:
            Label(f"... and {len(unassigned) - max_visible} more", 
                  (self.available_panel.rect.x + 20, self.available_panel.rect.bottom - 25), 
                  self.spec, size="sm", color=self.spec.color_text_dim, theme=DEFAULT_THEME).add_to(self.available_panel.children)
        
        # Team assignment rules
        rules_y = self.available_panel.rect.y + self.available_panel.rect.height - 80
        Label("ASSIGNMENT RULES:", (self.available_panel.rect.x + 20, rules_y), self.spec, size="sm", bold=True, theme=DEFAULT_THEME).add_to(self.available_panel.children)
        Label("• Dungeon: 4 slimes, locked during runs", (self.available_panel.rect.x + 20, rules_y + 20), self.spec, size="xs", color=(140, 140, 160), theme=DEFAULT_THEME).add_to(self.available_panel.children)
        Label("• Racing: 1 slime, speed determines performance", (self.available_panel.rect.x + 20, rules_y + 35), self.spec, size="xs", color=(140, 140, 160), theme=DEFAULT_THEME).add_to(self.available_panel.children)
    
    def _render_dungeon_content(self, surface: pygame.Surface):
        """Render dungeon team content"""
        # Clear surface
        surface.fill((0, 0, 0, 0))
        
        # Header
        Label("DUNGEON TEAM", (20, 15), self.spec, size="lg", bold=True, theme=DEFAULT_THEME).render(surface)
        Label("4 slots — enters the ruins together", (20, 35), self.spec, size="sm", color=(160, 160, 180), theme=DEFAULT_THEME).render(surface)
        
        # Team slots
        for i in range(4):
            slot_y = 60 + (i * (self.spec.card_height + 20))
            if i < len(self.dungeon_team.members):
                slime = self.dungeon_team.members[i]
                card = ProfileCard(slime, (20, slot_y), self.spec, theme=DEFAULT_THEME)
                card.render(surface)
                
                if not slime.locked:
                    rem_btn = Button("Remove", pygame.Rect(20, slot_y + self.spec.card_height + 5, 100, 30),
                                     lambda s=slime: self._remove_from_dungeon(s), self.spec, variant="ghost", theme=DEFAULT_THEME)
                    rem_btn.render(surface)
            else:
                # Empty Slot
                empty_rect = pygame.Rect(20, slot_y, self.spec.card_width, self.spec.card_height)
                Panel(empty_rect, self.spec, variant="surface", border=True, theme=DEFAULT_THEME).render(surface)
                Label("EMPTY", (empty_rect.centerx, empty_rect.centery), self.spec, centered=True, theme=DEFAULT_THEME).render(surface)
    
    def _render_racing_content(self, surface: pygame.Surface):
        """Render racing team content"""
        # Clear surface
        surface.fill((0, 0, 0, 0))
        
        # Header
        Label("RACING TEAM", (20, 15), self.spec, size="lg", bold=True, theme=DEFAULT_THEME).render(surface)
        Label("1 slot — competes in the derby", (20, 35), self.spec, size="sm", color=(160, 160, 180), theme=DEFAULT_THEME).render(surface)
        
        # Racing slot (larger)
        racing_slot_y = 60
        racing_slot_rect = pygame.Rect(20, racing_slot_y, surface.get_width() - 40, self.spec.card_height + 40)
        
        if self.racing_team.members:
            slime = self.racing_team.members[0]
            # Create larger racing card
            racing_card = self._create_racing_card(slime, racing_slot_rect)
            racing_card.render(surface)
            
            if not slime.locked:
                rem_btn = Button("Remove", pygame.Rect(racing_slot_rect.x + 20, racing_slot_rect.bottom - 35, 100, 30),
                                     lambda s=slime: self._remove_from_racing(s), self.spec, variant="ghost", theme=DEFAULT_THEME)
                rem_btn.render(surface)
        else:
            # Empty Racing Slot
            Panel(racing_slot_rect, self.spec, variant="surface", border=True, theme=DEFAULT_THEME).render(surface)
            Label("EMPTY", (racing_slot_rect.centerx, racing_slot_rect.centery), self.spec, centered=True, size="lg", theme=DEFAULT_THEME).render(surface)
    
    def _render_conquest_content(self, surface: pygame.Surface):
        """Render conquest team content (future)"""
        # Clear surface
        surface.fill((0, 0, 0, 0))
        
        # Header
        Label("CONQUEST TEAM", (20, 15), self.spec, size="lg", bold=True, theme=DEFAULT_THEME).render(surface)
        Label("Coming soon...", (20, 35), self.spec, size="sm", color=(160, 160, 180), theme=DEFAULT_THEME).render(surface)
        
        # Future content placeholder
        placeholder_rect = pygame.Rect(20, 60, surface.get_width() - 40, surface.get_height() - 80)
        Panel(placeholder_rect, self.spec, variant="surface", border=True, theme=DEFAULT_THEME).render(surface)
        Label("CONQUEST MODE", (placeholder_rect.centerx, placeholder_rect.centery), self.spec, centered=True, size="lg", theme=DEFAULT_THEME).render(surface)

    def _back_to_garden(self):
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**self.context.resources))

    def _enter_dungeon(self):
        logger.info("⚔️ Launching Dungeon Crawler...")
        from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
        from src.apps.dungeon_crawler.ui.scene_dungeon_room import DungeonRoomScene
        session = DungeonSession()
        logger.info(f"Created dungeon session: {session}")
        logger.info(f"Session floor before start_run: {session.floor}")
        session.start_run("fighter")
        logger.info(f"Session floor after start_run: {session.floor}")
        kwargs = self.context.resources.copy()
        kwargs["session"] = session
        self.context.manager.switch_to(DungeonRoomScene(**kwargs))
    
    def _enter_racing(self):
        logger.info("🏁 Launching Racing...")
        from src.apps.slime_breeder.scenes.race_scene import RaceScene
        self.context.manager.switch_to(RaceScene(**self.context.resources))

    def _assign_to_dungeon(self, slime: RosterSlime):
        if self.dungeon_team.assign(slime):
            # Save through context if available, otherwise fallback
            if self.context and hasattr(self.context, 'save_roster'):
                self.context.save_roster()
            else:
                save_roster(self.roster)
            self.tabbed_panel.set_badge("dungeon", len(self.dungeon_team.members))
            self._setup_available_slimes()
            self._update_enter_button()

    def _assign_to_racing(self, slime: RosterSlime):
        if self.racing_team.assign(slime):
            # Save through context if available, otherwise fallback
            if self.context and hasattr(self.context, 'save_roster'):
                self.context.save_roster()
            else:
                save_roster(self.roster)
            self.tabbed_panel.set_badge("racing", len(self.racing_team.members))
            self._setup_available_slimes()
            self._update_enter_button()

    def _remove_from_dungeon(self, slime: RosterSlime):
        if self.dungeon_team.remove(slime.slime_id):
            # Save through context if available, otherwise fallback
            if self.context and hasattr(self.context, 'save_roster'):
                self.context.save_roster()
            else:
                save_roster(self.roster)
            self.tabbed_panel.set_badge("dungeon", len(self.dungeon_team.members))
            self._setup_available_slimes()
            self._update_enter_button()

    def _remove_from_racing(self, slime: RosterSlime):
        if self.racing_team.remove(slime.slime_id):
            # Save through context if available, otherwise fallback
            if self.context and hasattr(self.context, 'save_roster'):
                self.context.save_roster()
            else:
                save_roster(self.roster)
            self.tabbed_panel.set_badge("racing", len(self.racing_team.members))
            self._setup_available_slimes()
            self._update_enter_button()

    def _create_racing_card(self, slime: RosterSlime, rect: pygame.Rect):
        """Create a larger racing-focused profile card"""
        from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
        
        # Background
        bg_color = self.spec.color_surface_alt if slime.is_elder else self.spec.color_surface
        border_color = self.spec.color_accent if slime.is_elder else self.spec.color_border
        
        card = Panel(rect, self.spec, variant="surface", border=True, theme=DEFAULT_THEME)
        card.bg_color = bg_color
        card.border_color = border_color
        
        # Portrait (larger, left side)
        portrait_size = 80
        portrait_rect = pygame.Rect(rect.x + 20, rect.y + 20, portrait_size, portrait_size)
        # We'll render this in the panel's render method
        
        # Name and level
        # Get the actual slime from roster to access genome
        actual_slime = self.roster.get_creature(slime.slime_id)
        if actual_slime:
            name = actual_slime.name
            level = actual_slime.level
            culture = actual_slime.genome.cultural_base.value
        else:
            name = slime.slime_id
            level = 1
            culture = "unknown"
        
        name_x = rect.x + portrait_size + 40
        Label(name, (name_x, rect.y + 20), self.spec, size="lg", bold=True, theme=DEFAULT_THEME).add_to(card.children)
        Label(f"Lv.{level}", (rect.right - 80, rect.y + 20), self.spec, size="md", color=(200, 200, 100), theme=DEFAULT_THEME).add_to(card.children)
        
        # Culture badge
        culture_color = {
            "ember": (200, 80, 40), "crystal": (140, 200, 255), "marsh": (80, 180, 80),
            "gale": (135, 206, 235), "tundra": (180, 200, 220), "tide": (80, 80, 220),
            "void": (100, 40, 140), "unknown": (140, 140, 140)
        }.get(culture, (140, 140, 140))
        
        # Stats (racing focused)
        if actual_slime:
            hp = calculate_hp(actual_slime.genome, actual_slime.level)
            atk = calculate_attack(actual_slime.genome, actual_slime.level)
            spd = calculate_speed(actual_slime.genome, actual_slime.level)
        else:
            hp = atk = spd = 0
        
        stats_y = rect.y + 60
        Label(f"HP: {hp}", (name_x, stats_y), self.spec, size="sm", color=(200, 100, 100), theme=DEFAULT_THEME).add_to(card.children)
        Label(f"ATK: {atk}", (name_x + 80, stats_y), self.spec, size="sm", color=(220, 140, 60), theme=DEFAULT_THEME).add_to(card.children)
        Label(f"SPD: {spd}", (name_x + 160, stats_y), self.spec, size="sm", color=(100, 180, 220), bold=True, theme=DEFAULT_THEME).add_to(card.children)
        
        # Speed emphasis
        Label("SPEED determines racing performance", (name_x, stats_y + 25), self.spec, size="xs", color=(140, 140, 160), theme=DEFAULT_THEME).add_to(card.children)
        
        return card

    def handle_event(self, event: pygame.event.Event) -> None:
        # First check tabbed panel for tab changes
        if hasattr(self, 'tabbed_panel'):
            tab_event = self.tabbed_panel.handle_event(event)
            if tab_event and tab_event.event_type == 'tab_change':
                self._update_enter_button()
                return
        
        # Then handle other UI components
        for comp in reversed(self.ui_components):
            if hasattr(comp, "handle_event") and comp.handle_event(event):
                break

    def tick(self, dt: float) -> None:
        """Update scene state"""
        for comp in self.ui_components:
            comp.update(int(dt * 1000))

    def render(self, surface: pygame.Surface) -> None:
        surface.fill(self.spec.color_bg)
        for comp in self.ui_components:
            comp.render(surface)

    def on_exit(self):
        """Auto-save when exiting scene"""
        if self.context and hasattr(self.context, 'save_roster'):
            self.context.save_roster()
        else:
            save_roster(self.roster)
