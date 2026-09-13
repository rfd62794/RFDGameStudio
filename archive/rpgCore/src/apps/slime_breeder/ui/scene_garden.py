import pygame
import random
from loguru import logger
from typing import Optional, List, Tuple
from src.shared.engine.scene_templates.garden_scene import GardenSceneBase
from src.shared.engine.scene_context import SceneContext
from src.shared.engine.render_pipeline import RenderPipeline, RenderLayer
from src.shared.engine.input_router import InputRouter, InputPriority
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.layouts import HubLayout
from src.apps.slime_breeder.garden.garden_state import GardenState
from src.apps.slime_breeder.entities.slime import Slime
from src.shared.rendering.slime_renderer import SlimeRenderer
from src.shared.rendering.garden_renderer import GardenRenderer
from src.shared.genetics import generate_random, breed
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.teams.roster_save import load_roster, save_roster
from src.shared.ui.profile_card import ProfileCard, render_text
from src.shared.ui.panel import Panel
from src.apps.slime_breeder.ui.dispatch_panel import DispatchPanel
from src.shared.ui.spec import UISpec

NAMES = ["Mochi", "Pip", "Glimmer", "Bloop", "Sage", "Dew", "Ember", "Fizz", "Lumen", "Nook"]

class GardenScene(GardenSceneBase):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._kwargs = kwargs
        
        # Legacy compatibility - keep direct references for now
        self.entity_registry = kwargs.get('entity_registry')
        self.game_session = kwargs.get('game_session')
        self.dispatch_system = kwargs.get('dispatch_system')
        self.roster = kwargs.get('roster')  # Use shared roster
        
        # Garden area (center of screen, excluding right panel)
        self.garden_rect = pygame.Rect(
            0,
            self.layout.top_bar.height,
            self.spec.screen_width - self.layout.side_panel.width,
            self.spec.screen_height - self.layout.top_bar.height - self.layout.status_bar.height
        )
        
        # Initialize garden state
        self.garden_state = GardenState()
        
        # Initialize resource indicators for idle zones
        self.resource_indicators = []  # List of (pos, resource_type, amount, lifetime) tuples
        
        # Initialize hover tooltip system
        self.hover_timer = 0.0
        self.hovered_slime = None
        self.tooltip_delay = 0.5  # 0.5 seconds delay
        
        # Initialize dispatched slimes tracking
        self.dispatched_slimes = {}  # slime_id -> zone_type string
        
        # Carousel state
        self.active_carousel = None
        
        # Initialize garden renderer with level
        self.garden_level = 0
        try:
            # Try to get garden level from GameSession
            # This is a graceful attempt - if it fails, we default to level 0
            from src.shared.session.game_session import GameSession
            # In a real implementation, this would come from scene manager or global state
            # For now, we'll default to level 0
            self.garden_level = 0
        except Exception:
            self.garden_level = 0
        
        # Initialize slime renderer
        self.renderer = SlimeRenderer()
        
        try:
            self.garden_renderer = GardenRenderer(self.garden_rect, session_id="garden_session")
        except Exception as e:
            logger.warning(f"Failed to initialize garden renderer: {e}")
            self.garden_renderer = None
        
        # Banner state
        self._banner_msg = ""
        self._banner_timer = 0.0
        self._banner_color = (255, 255, 255)
        
        # Context from return (using self._kwargs from Scene init)
        run_result = self._kwargs.get('run_result')
        race_result = self._kwargs.get('race_result')
        
        if run_result:
            floors = run_result.get('floors_cleared', 1) if isinstance(run_result, dict) else 1
            self._show_banner(f"Run complete — Floor {floors}", self.spec.color_success)
        elif race_result:
            self._show_banner(f"Race finished — {race_result['position']} place", self.spec.color_success)
            
        # Respect injected roster if provided (for UI Review)
        if not hasattr(self, "roster") or not self.roster:
            self.roster = self.context.roster if self.context else load_roster()
            
        self._sync_roster_with_garden()
        
        # Update SceneContext with loaded roster and theme
        if self.context:
            self.context.roster = self.roster
            from src.shared.ui.theme import DEFAULT_THEME
            self.context.theme = DEFAULT_THEME
        
        # 1. Right Panel Layout (Exactly as sketched)
        padding = 8
        right_x = 880
        screen_w = self.spec.screen_width
        screen_h = self.spec.screen_height
        
        self.right_panel_rect = pygame.Rect(self.layout.side_panel.x, self.layout.side_panel.y, self.layout.side_panel.width, self.layout.side_panel.height)
        
        profile_w = int(self.right_panel_rect.width * 0.55)
        stats_w = self.right_panel_rect.width - profile_w - padding * 3
        # Shrink top panels to move buttons up
        top_h = 340
        bottom_h = self.right_panel_rect.height - top_h - padding * 3
        
        self.profile_rect = pygame.Rect(self.right_panel_rect.x + padding, self.right_panel_rect.y + padding, profile_w, top_h)
        self.stats_rect = pygame.Rect(self.profile_rect.right + padding, self.right_panel_rect.y + padding, stats_w, top_h)
        self.actions_rect = pygame.Rect(self.right_panel_rect.x + padding, self.profile_rect.bottom + padding, self.right_panel_rect.width - padding * 2, bottom_h)

        # Disable base detail_panel background to prevent overdrawing our custom sub-panels
        # This will be set in on_garden_enter after base setup

        # 2. Team Buttons (Stacked in actions_rect)
        btn_y = self.actions_rect.y + 10
        btn_w = self.actions_rect.width - 20
        btn_h = 40

        # Create team buttons
        self.dungeon_btn = Button("→ Dungeon Team", pygame.Rect(self.actions_rect.x + 10, btn_y, btn_w, btn_h), self._assign_to_dungeon, self.spec)
        self.racing_btn = Button("→ Racing Team", pygame.Rect(self.actions_rect.x + 10, btn_y + btn_h + 8, btn_w, btn_h), self._assign_to_racing, self.spec)
        self.remove_btn = Button("Remove", pygame.Rect(self.actions_rect.x + 10, btn_y + btn_h + 8, btn_w, btn_h), self._remove_from_team, self.spec, variant="danger")
        self.mission_btn = Button("ON MISSION", pygame.Rect(self.actions_rect.x + 10, btn_y, btn_w, btn_h), None, self.spec, variant="warning")
        
        # Hide initially
        self.dungeon_btn.set_visible(False)
        self.racing_btn.set_visible(False)
        self.remove_btn.set_visible(False)
        self.mission_btn.set_visible(False)
        
        # Store for on_garden_enter
        self._pending_buttons = [
            self.dungeon_btn,
            self.racing_btn, 
            self.remove_btn,
            self.mission_btn
        ]

        # Input handlers for the router (set up after all initialization)
        self._setup_input_handlers()

    def _setup_input_handlers(self):
        """Set up input handlers for the InputRouter"""
        # Capture self for the handlers
        scene = self
        
        # UI Components Handler (highest priority)
        class UIComponentsHandler:
            def handle_event(self, event: pygame.event.Event) -> bool:
                # Handle specialized team buttons first
                if hasattr(scene, 'dungeon_btn') and scene.dungeon_btn.visible and hasattr(scene.dungeon_btn, "handle_event") and scene.dungeon_btn.handle_event(event):
                    return True
                if hasattr(scene, 'racing_btn') and scene.racing_btn.visible and hasattr(scene.racing_btn, "handle_event") and scene.racing_btn.handle_event(event):
                    return True
                if hasattr(scene, 'remove_btn') and scene.remove_btn.visible and hasattr(scene.remove_btn, "handle_event") and scene.remove_btn.handle_event(event):
                    return True
                if hasattr(scene, 'mission_btn') and scene.mission_btn.visible and hasattr(scene.mission_btn, "handle_event") and scene.mission_btn.handle_event(event):
                    return True
                
                # Handle other UI components
                for comp in reversed(scene.ui_components):
                    if hasattr(comp, 'handle_event') and comp.handle_event(event):
                        return True
                return False
        
        # Scene Default Handler (lowest priority)
        class SceneDefaultHandler:
            def handle_event(self, event: pygame.event.Event) -> bool:
                # Handle status bar clicks
                if event.type == pygame.MOUSEBUTTONDOWN:
                    mouse_pos = event.pos
                    
                    # Check if clicking on dungeon status area
                    if hasattr(scene, 'dungeon_status_area') and scene.dungeon_status_area.collidepoint(mouse_pos):
                        scene.request_scene("teams")
                        return True
                    
                    # Check if clicking on racing status area  
                    if hasattr(scene, 'racing_status_area') and scene.racing_status_area.collidepoint(mouse_pos):
                        scene.request_scene("teams")
                        return True
                    
                    # Handle slime selection
                    clicked_slime = scene.pick_entity(mouse_pos)
                    if clicked_slime:
                        # Toggle selection
                        if clicked_slime in scene.selected_entities:
                            scene.selected_entities.remove(clicked_slime)
                        else:
                            scene.selected_entities = [clicked_slime]
                        scene.on_selection_changed()
                        return True
                return False
        
        # Register handlers with router
        self.router.register(UIComponentsHandler(), InputPriority.UI_COMPONENTS)
        self.router.register(SceneDefaultHandler(), InputPriority.SCENE_DEFAULT)
        
        # 3. Custom Action Bar Buttons
        btn_y = self.bar_rect.y + 10
        btn_w, btn_h = 130, 44
        
        self.new_btn = Button("New Slime", pygame.Rect(20, btn_y, btn_w, btn_h), self._add_new_slime, self.spec)
        self.breed_btn = Button("Breed", pygame.Rect(160, btn_y, btn_w, btn_h), self._go_to_breeding, self.spec)
        self.release_btn = Button("Release", pygame.Rect(300, btn_y, btn_w, btn_h), self._release_selected, self.spec, variant="danger")
        self.release_btn.set_enabled(False)
        
        # Store buttons for later addition to action_bar
        self._pending_action_buttons = [
            self.new_btn,
            self.breed_btn,
            self.release_btn
        ]

        # 3. Top Navigation Bar (Using HubLayout.top_bar)
        self.top_bar = Panel(self.layout.top_bar, self.spec, variant="surface")
        self.ui_components.append(self.top_bar)
        
        nav_y = self.layout.top_bar.y + 4
        nav_h = self.layout.top_bar.height - 8
        self.teams_nav_btn = Button("TEAMS", pygame.Rect(20, nav_y, 100, nav_h), self._go_to_teams, self.spec, variant="ghost")
        self.top_bar.add_child(self.teams_nav_btn)
        
        # Remove DUNGEON and RACING from top nav - they move to bottom hub bar

        # Sync initial slimes if garden is empty but entity registry has slimes
        if not self.garden_state.slimes and self.entity_registry:
            for rs in self.entity_registry.all():
                pos = (random.randint(50, self.garden_rect.width - 50), random.randint(50, self.garden_rect.height - 50))
                slime = Slime(rs.name, rs.genome, pos, level=rs.level)
                self.garden_state.add_slime(slime)
        elif not self.garden_state.slimes and self.roster.slimes:
            for rs in self.roster.slimes:
                pos = (random.randint(50, self.garden_rect.width - 50), random.randint(50, self.garden_rect.height - 50))
                slime = Slime(rs.name, rs.genome, pos, level=rs.level)
                self.garden_state.add_slime(slime)
        elif not self.garden_state.slimes and self.roster.entries:
            # Fallback for new format - create slimes from entries
            for entry in self.roster.entries:
                # Try to get the actual slime from garden state or create one
                slime = self.garden_state.get_slime(entry.slime_id)
                if not slime:
                    # Create a new slime from roster entry
                    # We need to get the genome from somewhere - try garden state first
                    try:
                        # If we have garden state, try to get slime from there
                        existing_slime = self.garden_state.get_slime(entry.slime_id)
                        if existing_slime:
                            slime = existing_slime
                        else:
                            # Create new slime - we need to get genome data
                            # This is a fallback - ideally we'd get genome from saved data
                            from src.shared.genetics import generate_random
                            genome = generate_random()  # Fallback to random genome
                            pos = (random.randint(50, self.garden_rect.width - 50), random.randint(50, self.garden_rect.height - 50))
                            slime = Slime(entry.slime_id, genome, pos, level=1)
                            self.garden_state.add_slime(slime)
                    except Exception as e:
                        logger.warning(f"Could not create slime for {entry.slime_id}: {e}")
        elif not self.garden_state.slimes:
            self._add_new_slime()

    def on_garden_enter(self):
        """Set up UI components after base initialization"""
        # Disable base detail_panel background to prevent overdrawing our custom sub-panels
        self.detail_panel.bg_color = None
        self.detail_panel.border_width = 0
        
        # Add pending buttons to detail_panel
        for button in self._pending_buttons:
            self.detail_panel.add_child(button)
            
        # Add pending action buttons to action_bar
        for button in self._pending_action_buttons:
            self.action_bar.add_child(button)
        
        # 4. Bottom Hub Bar
        hub_bar_height = 60
        hub_bar_y = self.spec.screen_height - hub_bar_height
        self.hub_bar_rect = pygame.Rect(0, hub_bar_y, self.spec.screen_width, hub_bar_height)
        self.hub_bar = Panel(self.hub_bar_rect, self.spec, variant="surface")
        self.ui_components.append(self.hub_bar)
        
        # Hub bar buttons - 5 buttons across full width
        button_width = 140
        button_height = 40
        button_spacing = 20
        total_width = (5 * button_width) + (4 * button_spacing)
        start_x = (self.spec.screen_width - total_width) // 2
        button_y = hub_bar_y + (hub_bar_height - button_height) // 2
        
        # BREED button
        self.breed_hub_btn = Button("🧬 BREED", pygame.Rect(start_x, button_y, button_width, button_height),
                                   self._open_breed_carousel, self.spec, variant="ghost")
        self.hub_bar.add_child(self.breed_hub_btn)
        
        # RACE button
        self.race_hub_btn = Button("🏎 RACE", pygame.Rect(start_x + button_width + button_spacing, button_y, button_width, button_height),
                                  self._open_race_carousel, self.spec, variant="ghost")
        self.hub_bar.add_child(self.race_hub_btn)
        
        # DUNGEON button with "COMING SOON" badge
        self.dungeon_hub_btn = Button("⚔ DUNGEON", pygame.Rect(start_x + 2*(button_width + button_spacing), button_y, button_width, button_height),
                                     self._open_dungeon_carousel, self.spec, variant="ghost")
        self.hub_bar.add_child(self.dungeon_hub_btn)
        
        # Add "COMING SOON" badge to dungeon button
        from src.shared.ui.label import Label
        badge_rect = pygame.Rect(
            self.dungeon_hub_btn.rect.right - 70,
            self.dungeon_hub_btn.rect.y - 8,
            65,
            16
        )
        self.dungeon_badge = Label("COMING SOON", badge_rect, self.spec, size="xs", 
                                   color=self.spec.color_warning, centered=True)
        self.hub_bar.add_child(self.dungeon_badge)
        
        # SUMO button
        self.sumo_hub_btn = Button("🥊 SUMO", pygame.Rect(start_x + 3*(button_width + button_spacing), button_y, button_width, button_height),
                                  self._open_sumo_carousel, self.spec, variant="ghost")
        self.hub_bar.add_child(self.sumo_hub_btn)
        
        # ROSTER button
        self.roster_hub_btn = Button("📋 ROSTER", pygame.Rect(start_x + 4*(button_width + button_spacing), button_y, button_width, button_height),
                                    self._open_roster_carousel, self.spec, variant="ghost")
        self.hub_bar.add_child(self.roster_hub_btn)
        
        # Store hub buttons for access
        self._hub_buttons = [
            self.breed_hub_btn,
            self.race_hub_btn,
            self.dungeon_hub_btn,
            self.sumo_hub_btn,
            self.roster_hub_btn
        ]
        
        # Create and add DispatchPanel
        dispatch_rect = pygame.Rect(
            self.actions_rect.x + 10,
            self.actions_rect.y + 150,  # Position below action buttons
            self.actions_rect.width - 20,
            200
        )
        self.dispatch_panel = DispatchPanel(dispatch_rect, self.spec)
        self.ui_components.append(self.dispatch_panel)

    def _sync_roster_with_garden(self):
        """Ensure all garden slimes are in the roster."""
        for slime in self.garden_state.slimes:
            # Check both old and new formats
            slime_id = slime.name.lower().replace(" ", "_")
            has_old_format = any(rs.slime_id == slime_id for rs in self.roster.slimes)
            has_new_format = any(entry.slime_id == slime_id for entry in self.roster.entries)
            
            if not has_old_format and not has_new_format:
                # Create roster entry for this slime using template
                from src.shared.genetics.entity_template import SlimeEntityTemplate
                rs = SlimeEntityTemplate.build(
                    genome=slime.genome,
                    name=slime.name,
                    slime_id=slime_id
                )
                self.roster.add_slime(rs)
        save_roster(self.roster)

    def _add_new_slime(self):
        name = random.choice(NAMES) + " " + str(len(self.garden_state.slimes) + 1)
        genome = generate_random()
        pos = (random.randint(50, self.garden_rect.width - 50), random.randint(50, self.garden_rect.height - 50))
        slime = Slime(name, genome, pos, level=1)
        self.garden_state.add_slime(slime)
        
        # Add to both roster and registry using sync service
        from src.shared.genetics.entity_template import SlimeEntityTemplate
        rs = SlimeEntityTemplate.build(
            genome=slime.genome,
            name=slime.name,
            slime_id=slime.name.lower().replace(" ", "_")
        )
        
        # Use RosterSyncService if available, fallback to direct roster.add
        if self.context and self.context.roster_sync:
            success = self.context.roster_sync.add_slime(rs)
            if not success:
                logger.error(f"Failed to add slime {rs.slime_id} via sync service")
        else:
            # Fallback to direct roster.add for backward compatibility
            self.roster.add_slime(rs)
        
        # Auto-save using SaveManager
        if self.context:
            self.context.save_roster()

    def _go_to_breeding(self):
        from src.apps.slime_breeder.scenes.breeding_scene import BreedingScene
        self.context.manager.switch_to(BreedingScene(**self.context.resources))

    def _release_selected(self):
        if len(self.selected_entities) == 0:
            return
            
        for s in self.selected_entities:
            print(f"DEBUG: Releasing {s.name} into the wild...")
            self.garden_state.remove_slime(s.name)
            
            # Remove from both roster and registry using sync service
            slime_id = s.name.lower().replace(" ", "_")
            
            # Use RosterSyncService if available, fallback to manual removal
            if self.context and self.context.roster_sync:
                success = self.context.roster_sync.remove_slime(slime_id)
                if not success:
                    logger.warning(f"Failed to remove slime {slime_id} via sync service")
            else:
                # Fallback to manual roster removal for backward compatibility
                # This is the bug we're fixing - use proper roster.remove_creature()
                self.roster.remove_creature(slime_id)
        
        # Auto-save using SaveManager
        if self.context:
            self.context.save_roster()
        
        self.selected_entities = []
        self.on_selection_changed()

    def _go_to_teams(self):
        from src.apps.slime_breeder.scenes.team_scene import TeamScene
        self.context.manager.switch_to(TeamScene(**self.context.resources))

    def _go_to_racing(self):
        from src.apps.slime_breeder.scenes.race_scene import RaceScene
        self.context.manager.switch_to(RaceScene(**self.context.resources))

    def _go_to_dungeon(self):
        team = self.roster.get_dungeon_team()
        if not team or len(team.members) == 0:
            self._show_banner(
                "Assign slimes to Dungeon Team first",
                color=self.spec.color_warning
            )
            return
        
        from src.apps.slime_breeder.scenes.scene_dungeon_path import DungeonPathScene
        session = DungeonSession(team=team.members)
        kwargs = self.context.resources.copy()
        kwargs["session"] = session
        kwargs["depth"] = 1
        self.context.manager.switch_to(DungeonPathScene(**kwargs))

    # Carousel handler methods
    def _open_breed_carousel(self):
        """Open carousel for breeding pair selection."""
        from src.shared.ui.slime_carousel import SlimeCarousel, CarouselMode, CarouselFilter
        self._last_carousel_source = 'breed'
        self.active_carousel = SlimeCarousel(
            self.roster, 
            CarouselMode.PAIR, 
            filter_type=CarouselFilter.LEVEL_3_PLUS,
            spec=self.spec,
            theme=self.spec.theme if hasattr(self.spec, 'theme') else None
        )

    def _open_race_carousel(self):
        """Open carousel for single race slime selection."""
        from src.shared.ui.slime_carousel import SlimeCarousel, CarouselMode
        self._last_carousel_source = 'race'
        self.active_carousel = SlimeCarousel(
            self.roster, 
            CarouselMode.SINGLE,
            spec=self.spec,
            theme=self.spec.theme if hasattr(self.spec, 'theme') else None
        )

    def _open_dungeon_carousel(self):
        """Open carousel for single dungeon slime selection."""
        from src.shared.ui.slime_carousel import SlimeCarousel, CarouselMode
        self._last_carousel_source = 'dungeon'
        self.active_carousel = SlimeCarousel(
            self.roster, 
            CarouselMode.SINGLE,
            spec=self.spec,
            theme=self.spec.theme if hasattr(self.spec, 'theme') else None
        )

    def _open_sumo_carousel(self):
        """Open carousel for sumo pair selection."""
        from src.shared.ui.slime_carousel import SlimeCarousel, CarouselMode
        self._last_carousel_source = 'sumo'
        self.active_carousel = SlimeCarousel(
            self.roster, 
            CarouselMode.PAIR,
            spec=self.spec,
            theme=self.spec.theme if hasattr(self.spec, 'theme') else None
        )

    def _open_roster_carousel(self):
        """Open carousel for roster browsing."""
        from src.shared.ui.slime_carousel import SlimeCarousel, CarouselMode
        self._last_carousel_source = 'roster'
        self.active_carousel = SlimeCarousel(
            self.roster, 
            CarouselMode.BROWSE,
            spec=self.spec,
            theme=self.spec.theme if hasattr(self.spec, 'theme') else None
        )

    def _handle_carousel_result(self, result):
        """Handle carousel selection result."""
        if not result.confirmed:
            return  # User cancelled
        
        from src.shared.ui.slime_carousel import CarouselMode
        
        if result.mode == CarouselMode.PAIR.value and len(result.selected) == 2:
            # BREED or SUMO - check which button was pressed
            if hasattr(self, '_last_carousel_source'):
                if self._last_carousel_source == 'breed':
                    from src.apps.slime_breeder.scenes.breeding_scene import BreedingScene
                    kwargs = self.context.resources.copy()
                    kwargs["selected_pair"] = result.selected
                    self.context.manager.switch_to(BreedingScene(**kwargs))
                elif self._last_carousel_source == 'sumo':
                    from src.apps.slime_breeder.scenes.scene_sumo import SumoScene
                    kwargs = self.context.resources.copy()
                    kwargs["selected_pair"] = result.selected
                    self.context.manager.switch_to(SumoScene(**kwargs))
        
        elif result.mode == CarouselMode.SINGLE.value and len(result.selected) == 1:
            if hasattr(self, '_last_carousel_source'):
                selected_slime = result.selected[0]
                if self._last_carousel_source == 'race':
                    from src.apps.slime_breeder.scenes.race_scene import RaceScene
                    kwargs = self.context.resources.copy()
                    kwargs["selected_slime"] = selected_slime
                    self.context.manager.switch_to(RaceScene(**kwargs))
                elif self._last_carousel_source == 'dungeon':
                    from src.apps.slime_breeder.scenes.scene_dungeon_path import DungeonPathScene
                    kwargs = self.context.resources.copy()
                    kwargs["selected_slime"] = selected_slime
                    self.context.manager.switch_to(DungeonPathScene(**kwargs))
        
        # BROWSE mode - no action needed, just close carousel

    def pick_entity(self, pos: Tuple[int, int]) -> Optional[Slime]:
        # Return the top-most slime at pos
        for slime in reversed(self.garden_state.slimes):
            dist = (slime.kinematics.position - pygame.Vector2(*pos)).magnitude()
            if dist < 40: # Hit radius
                return slime
        return None

    def on_selection_changed(self):
        """Update sub-panel content and button visibility based on selection."""
        # Reset visibility
        self.dungeon_btn.set_visible(False)
        self.racing_btn.set_visible(False)
        self.remove_btn.set_visible(False)
        self.mission_btn.set_visible(False)
        
        if len(self.selected_entities) == 1:
            s = self.selected_entities[0]
            # Find roster slime for this slime (check old format first)
            slime_id = s.name.lower().replace(" ", "_")
            rs = next((r for r in self.roster.slimes if r.slime_id == slime_id), None)
            if not rs:
                # Fallback to new format
                entry = next((e for e in self.roster.entries if e.slime_id == slime_id), None)
                if entry:
                    # Convert entry to rs-like object for compatibility
                    class EntryWrapper:
                        def __init__(self, entry):
                            self.slime_id = entry.slime_id
                            self.team = entry.team
                            self.locked = entry.locked
                    rs = EntryWrapper(entry)
            
            if rs:
                # Update Action Buttons based on state
                btn_y = self.actions_rect.y + 12
                if rs.locked:
                    self.mission_btn.set_visible(True)
                    self.mission_btn.set_enabled(False)
                elif rs.team == TeamRole.UNASSIGNED:
                    self.dungeon_btn.set_visible(True)
                    self.dungeon_btn.rect.y = btn_y
                    self.dungeon_btn.set_enabled(not self.roster.get_dungeon_team().is_full())
                    
                    self.racing_btn.set_visible(True)
                    self.racing_btn.rect.y = btn_y + 48
                    self.racing_btn.set_enabled(not self.roster.get_racing_team().is_full())
                else:
                    # Already on a team
                    label = "✓ Dungeon Team" if rs.team == TeamRole.DUNGEON else "✓ Racing Team"
                    btn = self.dungeon_btn if rs.team == TeamRole.DUNGEON else self.racing_btn
                    btn.text = label
                    btn.set_visible(True)
                    btn.set_enabled(False)
                    btn.rect.y = btn_y
                    
                    self.remove_btn.set_visible(True)
                    self.remove_btn.rect.y = btn_y + 48

    def _assign_to_dungeon(self):
        if len(self.selected_entities) == 1:
            s = self.selected_entities[0]
            slime_id = s.name.lower().replace(" ", "_")
            # Try old format first
            rs = next((r for r in self.roster.slimes if r.slime_id == slime_id), None)
            if rs:
                if self.roster.get_dungeon_team().assign(rs):
                    # Auto-save using SaveManager
                    if self.context:
                        self.context.save_roster()
                    self.on_selection_changed()
            else:
                # Try new format
                entry = next((e for e in self.roster.entries if e.slime_id == slime_id), None)
                if entry:
                    if self.roster.get_dungeon_team().assign(entry):
                        # Auto-save using SaveManager
                        if self.context:
                            self.context.save_roster()
                        self.on_selection_changed()

    def _assign_to_racing(self):
        if len(self.selected_entities) == 1:
            s = self.selected_entities[0]
            slime_id = s.name.lower().replace(" ", "_")
            # Try old format first
            rs = next((r for r in self.roster.slimes if r.slime_id == slime_id), None)
            if rs:
                if self.roster.get_racing_team().assign(rs):
                    # Auto-save using SaveManager
                    if self.context:
                        self.context.save_roster()
                    self.on_selection_changed()
            else:
                # Try new format
                entry = next((e for e in self.roster.entries if e.slime_id == slime_id), None)
                if entry:
                    if self.roster.get_racing_team().assign(entry):
                        # Auto-save using SaveManager
                        if self.context:
                            self.context.save_roster()
                        self.on_selection_changed()

    def _remove_from_team(self):
        if len(self.selected_entities) == 1:
            s = self.selected_entities[0]
            slime_id = s.name.lower().replace(" ", "_")
            # Try old format first
            rs = next((r for r in self.roster.slimes if r.slime_id == slime_id), None)
            if rs and rs.team != TeamRole.UNASSIGNED:
                if self.roster.teams[rs.team].remove(rs.slime_id):
                    # Auto-save using SaveManager
                    if self.context:
                        self.context.save_roster()
                    self.on_selection_changed()
            else:
                # Try new format
                entry = next((e for e in self.roster.entries if e.slime_id == slime_id), None)
                if entry and entry.team != TeamRole.UNASSIGNED:
                    if self.roster.teams[entry.team].remove(entry.slime_id):
                        # Auto-save using SaveManager
                        if self.context:
                            self.context.save_roster()
                        self.on_selection_changed()

    def update_garden(self, dt: float):
        if self._banner_timer > 0:
            self._banner_timer -= dt
        
        # Update ResourceFlow systems
        if self.game_session and self.dispatch_system:
            # Update game session tick
            self.game_session.current_tick += 1
            
            # Update active dispatches
            # TODO:SYSTEM: Move dispatch resolution logic to DispatchSystem
            self.dispatch_system.current_tick = self.game_session.current_tick
            for dispatch in self.dispatch_system.active_dispatches[:]:  # Copy list to avoid modification during iteration
                if dispatch.end_tick <= self.game_session.current_tick:
                    # Dispatch completed
                    result = self.dispatch_system.resolve_dispatch(dispatch)
                    if result.success:
                        # Add resources to game session
                        for resource, amount in result.resource_gains.items():
                            self.game_session.resources[resource] = self.game_session.resources.get(resource, 0) + int(amount)
                    
                    # Move to completed
                    self.dispatch_system.active_dispatches.remove(dispatch)
                    self.dispatch_system.completed_dispatches.append(dispatch)
                    
                    # Update UI
                    self._show_banner(f"Dispatch complete! Gained: {result.message}")
            
            # Update idle zone resource generation
            self._update_idle_zones(dt)
            
            # Auto-save after dispatch completion
            if len(self.dispatch_system.completed_dispatches) > 0:
                if self.context:
                    self.context.save_roster()
            
        # Update garden renderer animations
        if self.garden_renderer:
            self.garden_renderer.update(dt)
            
        mouse_pos = pygame.mouse.get_pos()
        # Only pass cursor if in garden area
        cursor = mouse_pos if self.garden_rect.collidepoint(mouse_pos) else None
        self.garden_state.update(dt, cursor)
        
        # Update hover tooltip
        self._update_hover_tooltip(dt, mouse_pos)

    def _update_idle_zones(self, dt: float):
        """Update idle zone resource generation and visual indicators"""
        if not self.game_session or not self.garden_renderer:
            return
        
        # Get idle zone target from garden renderer for each slime
        for slime in self.garden_state.slimes:
            idle_target = self.garden_renderer.get_idle_zone_target(slime)
            if not idle_target:
                continue
            
            # Simple resource generation for idle zones
            # TODO:SYSTEM: Move resource generation logic to ResourceSystem
            # In a full implementation, this would check zone type and generate appropriate resources
            resource_generation_rate = 0.1  # Resources per second
            
            # Generate small amounts of resources
            if random.random() < resource_generation_rate * dt:
                resource_type = random.choice(['gold', 'food', 'scrap'])
                amount = random.randint(1, 3)
                self.game_session.resources[resource_type] = self.game_session.resources.get(resource_type, 0) + amount
                
                # Add visual indicator for resource generation
                self._create_resource_indicator(idle_target, resource_type, amount)
        
        # Clean up old indicators
        self._cleanup_resource_indicators(dt)

    def _create_resource_indicator(self, pos: Tuple[float, float], resource_type: str, amount: int):
        """Create a visual indicator for resource generation"""
        # Add floating text indicator
        indicator = {
            'pos': list(pos),
            'resource_type': resource_type,
            'amount': amount,
            'lifetime': 2.0,  # 2 seconds
            'velocity': [0, -20]  # Float upward
        }
        self.resource_indicators.append(indicator)
    
    def _cleanup_resource_indicators(self, dt: float):
        """Update and clean up resource indicators"""
        for indicator in self.resource_indicators[:]:  # Copy list to avoid modification during iteration
            indicator['lifetime'] -= dt
            indicator['pos'][1] += indicator['velocity'][1] * dt  # Move upward
            
            if indicator['lifetime'] <= 0:
                self.resource_indicators.remove(indicator)
    
    def _render_resource_indicators(self, surface: pygame.Surface):
        """Render floating resource indicators with enhanced visuals"""
        for indicator in self.resource_indicators:
            # Calculate alpha based on lifetime
            alpha = min(255, int(indicator['lifetime'] * 255))
            
            # Resource colors with enhanced visibility
            colors = {
                'gold': (255, 215, 0),
                'food': (139, 69, 19),
                'scrap': (128, 128, 128)
            }
            color = colors.get(indicator['resource_type'], (255, 255, 255))
            
            # Create text surface with shadow effect
            font = pygame.font.Font(None, 18)
            text = f"+{indicator['amount']} {indicator['resource_type'].title()}"
            
            # Shadow for better visibility
            shadow_surface = font.render(text, True, (0, 0, 0))
            shadow_surface.set_alpha(alpha // 2)
            shadow_pos = [indicator['pos'][0] + 1, indicator['pos'][1] + 1]
            surface.blit(shadow_surface, shadow_pos)
            
            # Main text
            text_surface = font.render(text, True, color)
            text_surface.set_alpha(alpha)
            surface.blit(text_surface, indicator['pos'])
            
            # Add sparkle effect for gold
            if indicator['resource_type'] == 'gold' and indicator['lifetime'] > 1.5:
                sparkle_size = int(4 * (indicator['lifetime'] - 1.5))
                sparkle_color = (255, 255, 200)
                sparkle_alpha = int(alpha * 0.7)
                pygame.draw.circle(surface, sparkle_color, 
                                 (int(indicator['pos'][0] + 60), int(indicator['pos'][1])), 
                                 sparkle_size)
    
    def _render_idle_zone_overlays(self, surface: pygame.Surface):
        """Render subtle overlays for idle zones to show activity"""
        if not self.garden_renderer:
            return
        
        # Get zone rectangles from garden renderer
        zones = [
            ('nursery', self.garden_renderer.nursery_rect, (100, 200, 255)),
            ('training', self.garden_renderer.training_rect, (255, 100, 100)),
            ('foraging', self.garden_renderer.foraging_rect, (100, 255, 100))
        ]
        
        for zone_name, zone_rect, zone_color in zones:
            # Count slimes in this zone
            slimes_in_zone = 0
            for slime in self.garden_state.slimes:
                idle_target = self.garden_renderer.get_idle_zone_target(slime)
                if idle_target and zone_rect.collidepoint(idle_target):
                    slimes_in_zone += 1
            
            # Draw subtle overlay if zone is active
            if slimes_in_zone > 0:
                # Create pulsing effect
                pulse = abs(pygame.time.get_ticks() / 1000.0 % 2.0 - 1.0)  # 0 to 1 pulse
                alpha = int(20 + pulse * 30)  # 20 to 50 alpha
                
                overlay_surface = pygame.Surface((zone_rect.width, zone_rect.height), pygame.SRCALPHA)
                overlay_color = (*zone_color, alpha)
                pygame.draw.rect(overlay_surface, overlay_color, overlay_surface.get_rect(), border_radius=8)
                surface.blit(overlay_surface, zone_rect.topleft)
                
                # Draw zone label with activity
                font = pygame.font.Font(None, 14)
                label = f"{zone_name.title()} ({slimes_in_zone})"
                label_surface = font.render(label, True, zone_color)
                label_surface.set_alpha(alpha * 2)
                label_pos = (zone_rect.x + 5, zone_rect.y + 5)
                surface.blit(label_surface, label_pos)

    def render_garden(self, surface: pygame.Surface):
        """Render garden using RenderPipeline if available, otherwise legacy rendering"""
        if self.pipeline:
            # Use RenderPipeline for layered rendering
            # Background
            self.pipeline.submit(
                RenderLayer.BACKGROUND,
                lambda s: self._render_background(s)
            )
            
            # Environment
            self.pipeline.submit(
                RenderLayer.ENVIRONMENT,
                lambda s: self._render_environment(s)
            )
            
            # Entities
            self.pipeline.submit(
                RenderLayer.ENTITIES,
                lambda s: self._render_entities(s)
            )
            
            # UI Components
            self.pipeline.submit(
                RenderLayer.UI,
                lambda s: self._render_ui_components(s)
            )
            
            # Overlays (resource indicators, tooltips, banners)
            self.pipeline.submit(
                RenderLayer.OVERLAY,
                lambda s: self._render_overlays(s)
            )
            
            # Execute pipeline
            self.pipeline.execute(surface)
        else:
            # Legacy rendering (fallback)
            self._render_garden_legacy(surface)
    
    def _render_background(self, surface: pygame.Surface):
        """Render background layer"""
        surface.fill(self.spec.color_bg)
    
    def _render_environment(self, surface: pygame.Surface):
        """Render environment layer"""
        if self.garden_renderer:
            try:
                self.garden_renderer.render_ground(surface, self.garden_level)
                self.garden_renderer.render_ship(surface)
                self.garden_renderer.render_environment(surface, self.garden_level)
            except Exception as e:
                logger.warning(f"Garden renderer failed: {e}")
                # Fallback to simple background
                surface.fill((20, 20, 30), self.garden_rect)
    
    def _render_entities(self, surface: pygame.Surface):
        """Render entities layer"""
        # Render Slimes
        for slime in self.garden_state.slimes:
            is_selected = (slime in self.selected_entities)
            self.renderer.render(surface, slime, is_selected)
        
        # Render idle zone overlays (before resource indicators)
        self._render_idle_zone_overlays(surface)
    
    def _render_ui_components(self, surface: pygame.Surface):
        """Render UI components layer"""
        # Update and render DispatchPanel with current resources
        if hasattr(self, 'dispatch_panel') and self.game_session:
            available_slimes = [s for s in self.garden_state.slimes if s not in self.selected_entities]
            self.dispatch_panel.update_data(self.game_session.resources, available_slimes)
            self.dispatch_panel.render(surface)
        
        # Render right panel
        self._render_right_panel(surface)
        
        # Render team status bar
        self._render_team_status_bar(surface)
    
    def _render_overlays(self, surface: pygame.Surface):
        """Render overlay layer"""
        # Render resource indicators (after slimes, before UI)
        self._render_resource_indicators(surface)
        
        # Render hover tooltip (on top of everything)
        self._render_hover_tooltip(surface)
        
        # Render banner
        self._render_banner(surface)
    
    def _render_garden_legacy(self, surface: pygame.Surface):
        """Legacy rendering fallback"""
        # Render environmental elements before slimes
        if self.garden_renderer:
            try:
                self.garden_renderer.render_ground(surface, self.garden_level)
                self.garden_renderer.render_ship(surface)
                self.garden_renderer.render_environment(surface, self.garden_level)
            except Exception as e:
                logger.warning(f"Garden renderer failed: {e}")
                # Fallback to simple background
                surface.fill((20, 20, 30), self.garden_rect)
        
        # Render Slimes
        for slime in self.garden_state.slimes:
            is_selected = (slime in self.selected_entities)
            self.renderer.render(surface, slime, is_selected)
        
        # Render idle zone overlays (before resource indicators)
        self._render_idle_zone_overlays(surface)
        
        # Render resource indicators (after slimes, before UI)
        self._render_resource_indicators(surface)
        
        # Render hover tooltip (on top of everything)
        self._render_hover_tooltip(surface)
            
        self._render_banner(surface)
        self._render_right_panel(surface)
        self._render_team_status_bar(surface)
        
        # Update and render DispatchPanel with current resources
        if hasattr(self, 'dispatch_panel') and self.game_session:
            available_slimes = [s for s in self.garden_state.slimes if s not in self.selected_entities]
            self.dispatch_panel.update_data(self.game_session.resources, available_slimes)
            self.dispatch_panel.render(surface)

    def _render_right_panel(self, surface: pygame.Surface):
        from src.shared.ui.profile_card import render_text
        
        if len(self.selected_entities) != 1:
            # Show selection hint
            render_text(surface, "Select a slime", 
                       self.right_panel_rect.center, 
                       size=20, color=self.spec.color_text_dim, center=True)
            return
            
        s = self.selected_entities[0]
        rs = next((r for r in self.roster.slimes if r.name == s.name), None)
        if not rs:
            return

        # 1. Backgrounds (Draw all three first)
        for rect in [self.profile_rect, self.stats_rect, self.actions_rect]:
            pygame.draw.rect(surface, self.spec.color_surface, rect, border_radius=6)
            pygame.draw.rect(surface, self.spec.color_border, rect, width=1, border_radius=6)

        # 2. Profile Sub-panel Content
        from src.shared.ui.profile_card import render_slime_portrait, render_badge
        
        # Portrait (Top, slightly padded)
        portrait_size = 60
        portrait_rect = pygame.Rect(self.profile_rect.x + 12, self.profile_rect.y + 12, portrait_size, portrait_size)
        render_slime_portrait(surface, rs.genome, portrait_rect)
        
        # Text details
        text_x = self.profile_rect.x + 12
        y = portrait_rect.bottom + 8
        render_text(surface, rs.name, (text_x, y), size=18, bold=True)
        y += 22
        render_text(surface, f"Lv.{rs.level} | Gen {rs.generation}", (text_x, y), size=14, color=(200, 200, 100))
        y += 20
        
        # Culture badge
        culture_color = {
            "ember":   (200, 80, 40),
            "crystal": (140, 200, 255),
            "marsh":    (80, 180, 80),
            "gale":     (135, 206, 235),
            "tundra":   (180, 200, 220),
            "tide":     (80, 80, 220),
            "void":     (100, 40, 140),
        }.get(rs.genome.cultural_base.value, (140, 140, 140))
        render_badge(surface, rs.genome.cultural_base.value.upper(), (text_x, y), culture_color)
        
        # Team badge
        team_label = rs.team.value.upper()
        team_color = (80, 80, 80)
        if rs.locked:
            team_label = "ON MISSION"
            team_color = (200, 140, 0)
        elif rs.team == TeamRole.DUNGEON:
            team_color = (180, 60, 60)
        render_badge(surface, team_label, (text_x + 75, y), team_color)
        y += 24
        
        # Trait badges (using get_dominant_trait logic)
        from src.shared.ui.profile_card import get_dominant_trait
        trait = get_dominant_trait(rs.genome)
        trait_color = (120, 100, 180)
        render_badge(surface, trait, (text_x, y), trait_color)
        
        if not rs.can_breed:
            render_badge(surface, "YOUNG", (text_x + 80, y), (200, 140, 60))
        y += 24
        
        # DNA line (visual representation of genome)
        dna_parts = [
            rs.genome.shape[0].upper(),
            rs.genome.size[0].upper(),
            rs.genome.pattern[0].upper(),
            rs.genome.accessory[0].upper() if rs.genome.accessory != "none" else "N"
        ]
        dna_text = "-".join(dna_parts) + f"-{rs.generation:02d}"
        render_text(surface, f"DNA: {dna_text}", (text_x, y), size=12, color=(100, 100, 120))

        # 3. Stats Sub-panel Content
        from src.shared.teams.stat_calculator import calculate_hp, calculate_attack, calculate_speed
        stats_x = self.stats_rect.x + 12
        stats_y = self.stats_rect.y + 12
        
        render_text(surface, "STATS", (stats_x, stats_y), size=12, color=self.spec.color_text_dim)
        stats_y += 20
        
        bar_w = self.stats_rect.width - 24
        bar_h = 10
        
        # Stat Bars
        stats = [
            ("HP", calculate_hp(rs.genome, rs.level), 100, (100, 200, 100)),
            ("ATK", calculate_attack(rs.genome, rs.level), 50, (200, 100, 100)),
            ("SPD", calculate_speed(rs.genome, rs.level), 50, (100, 100, 200)),
        ]
        
        for label, val, max_val, color in stats:
            render_text(surface, label, (stats_x, stats_y), size=14)
            render_text(surface, str(int(val)), (stats_x + bar_w - 30, stats_y), size=14, bold=True)
            stats_y += 18
            
            # Draw bar
            pygame.draw.rect(surface, (40, 40, 50), (stats_x, stats_y, bar_w, bar_h), border_radius=2)
            fill_w = int(bar_w * min(1.0, val / max_val))
            pygame.draw.rect(surface, color, (stats_x, stats_y, fill_w, bar_h), border_radius=2)
            stats_y += 22

        # 4. Actions Sub-panel Content (Buttons rendered by base system or manually)
        for btn in [self.dungeon_btn, self.racing_btn, self.remove_btn, self.mission_btn]:
            if btn.visible:
                btn.render(surface)

    def _render_team_status_bar(self, surface: pygame.Surface):
        dungeon_team = self.roster.get_dungeon_team()
        racing_team = self.roster.get_racing_team()
        
        # Respect modernized HubLayout bar rect
        bar_rect = self.bar_rect
        pygame.draw.rect(surface, (20, 20, 30), bar_rect)
        pygame.draw.rect(surface, (50, 50, 70), bar_rect, width=1)
        
        # Calculate positions
        center_x = bar_rect.centerx
        text_y = bar_rect.y + 12
        
        # Left side: Dungeon Team
        if not dungeon_team.members:
            dungeon_text = "⚔ DUNGEON: Empty"
            dungeon_color = self.spec.color_text_dim
        else:
            names = ", ".join(s.name for s in dungeon_team.members)
            dungeon_text = f"⚔ DUNGEON: {names} [{len(dungeon_team.members)}/4]"
            dungeon_color = self.spec.color_success if not any(s.locked for s in dungeon_team.members) else self.spec.color_warning
        
        render_text(surface, dungeon_text, (16, text_y), size=16, color=dungeon_color)
        
        # Center divider
        render_text(surface, "│", (center_x - 10, text_y), size=16, color=(100, 100, 120))
        
        # Right side: Racing Team
        racing_x = center_x + 10
        if not racing_team.members:
            racing_text = "RACING: Empty"
            racing_color = self.spec.color_text_dim
        else:
            racer = racing_team.members[0]
            racing_text = f"◎ RACING: {racer.name} [1/1]"
            racing_color = self.spec.color_success if not racer.locked else self.spec.color_warning
        
        # Calculate text width to ensure it fits
        render_text(surface, racing_text, (racing_x, text_y), size=16, color=racing_color)
        
        # Store click areas for interaction
        self.dungeon_status_area = pygame.Rect(16, bar_rect.y, center_x - 26, bar_rect.height)
        self.racing_status_area = pygame.Rect(center_x + 10, bar_rect.y, bar_rect.right - center_x - 26, bar_rect.height)

    def _show_banner(self, msg: str, color: Tuple[int, int, int]):
        self._banner_msg = msg
        self._banner_color = color
        self._banner_timer = 3.0

    def _render_banner(self, surface: pygame.Surface):
        if self._banner_timer <= 0:
            return
            
        alpha = int(min(1.0, self._banner_timer) * 255)
        banner_h = 40
        banner_rect = pygame.Rect(self.garden_rect.x, self.garden_rect.y, self.garden_rect.width, banner_h)
        
        # BG
        s = pygame.Surface((banner_rect.width, banner_rect.height), pygame.SRCALPHA)
        s.fill((*self.spec.color_surface, alpha // 2))
        surface.blit(s, banner_rect.topleft)
        
        # Text
        from src.shared.ui.profile_card import render_text
        render_text(surface, self._banner_msg, (banner_rect.centerx, banner_rect.centery), 
                    size=20, color=(*self._banner_color, alpha), center=True)

    def render(self, surface: pygame.Surface) -> None:
        """Render garden and overlay carousel if active."""
        # Render garden first
        super().render(surface)
        
        # Render carousel overlay on top if active
        if self.active_carousel:
            self.active_carousel.render(surface)

    def on_exit(self):
        """Auto-save when exiting scene"""
        if self.context:
            self.context.save_roster()

    def update(self, dt: float) -> None:
        """Update garden and carousel if active."""
        # Update carousel first
        if self.active_carousel:
            self.active_carousel.update(dt)
        
        # Update garden
        super().update(dt)

    def handle_event(self, event: pygame.event.Event) -> None:
        # Handle carousel overlay first (highest priority)
        if self.active_carousel:
            result = self.active_carousel.handle_event(event)
            if result:
                # Carousel completed, handle result
                self._handle_carousel_result(result)
                self.active_carousel = None
            return  # Event consumed by carousel
        
        # Route through InputRouter if available
        if self.router:
            if self.router.route(event):
                return  # Event was consumed
        
        # Fallback to legacy handling if router not available
        # First, check specialized team buttons
        for btn in [self.dungeon_btn, self.racing_btn, self.remove_btn, self.mission_btn]:
            if btn.visible and hasattr(btn, "handle_event") and btn.handle_event(event):
                return

        # Then, let the base class handle other UI components
        for comp in reversed(self.ui_components):
            if hasattr(comp, 'handle_event') and comp.handle_event(event):
                return
        
        # Handle status bar clicks
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = pygame.mouse.get_pos()
            
            # Check if clicking on dungeon status area
            if hasattr(self, 'dungeon_status_area') and self.dungeon_status_area.collidepoint(mouse_pos):
                from src.apps.slime_breeder.scenes.team_scene import TeamScene
                self.context.manager.switch_to(TeamScene(**self.context.resources))
                return
            
            # Check if clicking on racing status area  
            if hasattr(self, 'racing_status_area') and self.racing_status_area.collidepoint(mouse_pos):
                from src.apps.slime_breeder.scenes.team_scene import TeamScene
                self.context.manager.switch_to(TeamScene(**self.context.resources))
                return
            
            # Handle slime selection
            clicked_slime = self.pick_entity(mouse_pos)
            if clicked_slime:
                # Toggle selection
                if clicked_slime in self.selected_entities:
                    self.selected_entities.remove(clicked_slime)
                else:
                    self.selected_entities = [clicked_slime]
                self.on_selection_changed()
                return

    def _update_hover_tooltip(self, dt: float, mouse_pos: Tuple[int, int]):
        """Update hover tooltip state"""
        # Find slime under cursor (within 40px)
        hovered_slime = None
        for slime in self.garden_state.slimes:
            slime_pos = (int(slime.kinematics.position.x), int(slime.kinematics.position.y))
            distance = ((mouse_pos[0] - slime_pos[0])**2 + (mouse_pos[1] - slime_pos[1])**2)**0.5
            if distance <= 40:  # 40px hover radius
                hovered_slime = slime
                break
        
        # Update hover state
        if hovered_slime != self.hovered_slime:
            self.hovered_slime = hovered_slime
            self.hover_timer = 0.0
        
        # Increment timer if hovering
        if self.hovered_slime:
            self.hover_timer += dt
    
    def _render_hover_tooltip(self, surface: pygame.Surface):
        """Render hover tooltip if conditions met"""
        if not self.hovered_slime or self.hover_timer < self.tooltip_delay:
            return
        
        # Get slime info
        slime = self.hovered_slime
        name = slime.name
        
        # Get stage and tier info
        stage = getattr(slime.genome, 'stage', 'Unknown')
        tier = getattr(slime.genome, 'tier', 1)
        
        # Create tooltip text
        tooltip_text = f"{name} | {stage} | T{tier}"
        
        # Create tooltip surface
        font = pygame.font.Font(None, 12)  # font_tiny
        text_surface = font.render(tooltip_text, True, DEFAULT_THEME.text_primary)
        
        # Add padding
        padding = 4
        tooltip_width = text_surface.get_width() + padding * 2
        tooltip_height = text_surface.get_height() + padding * 2
        
        # Position tooltip above slime
        slime_pos = (int(slime.kinematics.position.x), int(slime.kinematics.position.y))
        tooltip_x = slime_pos[0] - tooltip_width // 2
        tooltip_y = slime_pos[1] - 60  # Above slime
        
        # Create tooltip background
        tooltip_surface = pygame.Surface((tooltip_width, tooltip_height), pygame.SRCALPHA)
        tooltip_surface.fill((*DEFAULT_THEME.surface, 230))  # Semi-transparent background
        
        # Draw border
        pygame.draw.rect(tooltip_surface, DEFAULT_THEME.border, tooltip_surface.get_rect(), 1)
        
        # Render text
        text_x = padding
        text_y = padding
        tooltip_surface.blit(text_surface, (text_x, text_y))
        
        # Blit to main surface
        surface.blit(tooltip_surface, (tooltip_x, tooltip_y))
