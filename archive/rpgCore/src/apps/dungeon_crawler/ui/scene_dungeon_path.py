"""Dungeon Path Scene for traversal simulation.
"""

import pygame
import random
from typing import List, Optional

from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import ArenaLayout
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.apps.dungeon_crawler.world.dungeon_engine import DungeonEngine
from src.apps.dungeon_crawler.world.dungeon_track import DungeonTrack, DungeonZoneType
from src.shared.racing.race_camera import RaceCamera
from src.shared.racing.minimap import RaceMinimap
from src.shared.rendering.slime_renderer import SlimeRenderer

class DungeonPathScene(Scene):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = ArenaLayout(self.spec)
        self.roster = kwargs.get("roster")
        if not self.roster:
            from src.shared.teams.roster_save import load_roster
            self.roster = load_roster()
            
        self.engine: Optional[DungeonEngine] = None
        self.track = DungeonTrack(2000)
        self.camera = RaceCamera()
        self.renderer = SlimeRenderer()
        self.minimap = RaceMinimap(spec)
        
        self.ui_components = []
        self._setup_ui()
        
        # Appearance constants
        self.track_height_ratio = 0.5
        self.min_track_height = 200
        
        # Zone colors matching intent
        self.zone_colors = {
            DungeonZoneType.SAFE:     (50, 80, 50),    # green
            DungeonZoneType.COMBAT:   (180, 40, 40),   # red
            DungeonZoneType.TRAP:     (200, 100, 20),  # orange
            DungeonZoneType.REST:     (40, 80, 180),   # blue
            DungeonZoneType.TREASURE: (200, 160, 40),  # gold
            DungeonZoneType.BOSS:     (120, 40, 180),  # purple
        }

    def _setup_ui(self):
        self.ui_components = []
        Panel(self.layout.header, self.spec, variant="surface").add_to(self.ui_components)
        Panel(self.layout.team_bar, self.spec, variant="surface").add_to(self.ui_components)
        Label("DUNGEON DEPTHS", (self.layout.header.centerx, self.layout.header.centery), self.spec, size="lg", bold=True, centered=True).add_to(self.ui_components)
        Button("FLEE", pygame.Rect(self.layout.header.x + 10, self.layout.header.y + 5, 80, self.layout.header.height - 10),
               self._exit_dungeon, self.spec, variant="secondary").add_to(self.ui_components)

    def on_enter(self) -> None:
        team = self.roster.teams[TeamRole.DUNGEON].members
        if not team:
            # Fallback for testing
            team = [s for s in self.roster.slimes if s.alive][:3]
            
        self.engine = DungeonEngine(team, self.track)
        self.camera.x = 0.0
        self.camera.zoom_x = 1.0

    def handle_event(self, event: pygame.event.Event) -> None:
        for comp in reversed(self.ui_components):
            if hasattr(comp, 'handle_event') and comp.handle_event(event):
                return
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._exit_dungeon()

    def tick(self, dt: float) -> None:
        dt_ms = int(dt * 1000)
        for comp in self.ui_components:
            comp.update(dt_ms)
            
        if self.engine:
            self.engine.tick(dt)
            self.camera.update(self.engine.participants, self.layout.arena.width, self.layout.arena.x)
            
            # Check for paused state (encounter triggered)
            if self.engine.party.is_paused:
                self._handle_encounter(self.engine.party.last_zone_triggered)

    def _handle_encounter(self, zone):
        """Transition to specialized encounter scene."""
        z_type = zone.zone_type
        if z_type == DungeonZoneType.COMBAT or z_type == DungeonZoneType.BOSS:
            # Trigger combat
            from src.apps.dungeon_crawler.ui.scene_dungeon_combat import DungeonCombatScene
            kwargs = self.context.resources.copy()
            kwargs["party"] = self.engine.party.slimes
            kwargs["zone"] = zone
            self.context.manager.overlay(DungeonCombatScene(**kwargs))
        elif z_type == DungeonZoneType.TREASURE:
            # Trigger loot popup or overlay
            pass
        elif z_type == DungeonZoneType.REST:
            # Briefly animate healing and resume
            self.engine.party.is_paused = False

    def render(self, surface: pygame.Surface):
        surface.fill(self.spec.color_bg)
        
        # Render within arena bounds
        arena_rect = self.layout.arena
        arena_surf = pygame.Surface((arena_rect.width, arena_rect.height))
        arena_surf.fill((20, 20, 25)) # Dark dungeon floor
        
        track_h = max(self.min_track_height, int(arena_rect.height * self.track_height_ratio))
        track_y = (arena_rect.height - track_h) // 2
        
        # Render track tiles (simple stone pattern)
        self._render_dungeon_track(arena_surf, track_y, track_h)
        
        # Render party marker
        self._render_party(arena_surf, track_y, track_h)
        
        surface.blit(arena_surf, arena_rect.topleft)
        
        for comp in self.ui_components:
            comp.render(surface)
            
        if self.engine:
            self.minimap.render(surface, self.engine.participants, self.track.total_length, self.camera.x)

    def _render_dungeon_track(self, surface, track_y, track_h):
        arena_w = surface.get_width()
        
        # Draw road base
        pygame.draw.rect(surface, (30, 30, 35), (0, track_y, arena_w, track_h))
        
        # Zones
        for zone in self.track.zones:
            sx = self.camera.to_screen_x(zone.start_dist, 0)
            ex = self.camera.to_screen_x(zone.end_dist, 0)
            
            visible_start = max(sx, 0)
            visible_end = min(ex, arena_w)
            
            if visible_end > visible_start:
                color = self.zone_colors.get(zone.zone_type, (60, 60, 60))
                pygame.draw.rect(surface, color, (visible_start, track_y, visible_end - visible_start, track_h))
                
                # Zone label
                if sx > 0 and sx < arena_w:
                    font = pygame.font.Font(None, 18)
                    text = font.render(zone.zone_type.name, True, (255, 255, 255, 120))
                    surface.blit(text, (visible_start + 10, track_y + 10))

        # Borders
        pygame.draw.line(surface, (100, 100, 110), (0, track_y), (arena_w, track_y), 4)
        pygame.draw.line(surface, (100, 100, 110), (0, track_y + track_h), (arena_w, track_y + track_h), 4)

    def _render_party(self, surface, track_y, track_h):
        if not self.engine: return
        p = self.engine.party
        screen_x = self.camera.to_screen_x(p.distance, 0)
        center_y = track_y + track_h // 2
        
        # Draw individual slimes in a small cluster/line
        for i, slime in enumerate(p.slimes):
            offset_x = (i - len(p.slimes)/2) * 30
            offset_y = (i % 2) * 15 - 7
            
            pos = (screen_x + offset_x, center_y + offset_y)
            
            # Use SlimeRenderer directly
            from src.apps.slime_breeder.entities.slime import Slime
            dummy = Slime(slime.name, slime.genome, pos)
            self.renderer.render(surface, dummy)

    def _exit_dungeon(self):
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**self.context.resources))

    def on_exit(self):
        pass
