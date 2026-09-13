import pygame
import random
import math
from typing import List, Optional

from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import ArenaLayout
from src.shared.ui.profile_card import render_text
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.dungeon.dungeon_track import DungeonTrack, DungeonZoneType, generate_dungeon_track, ZONE_COLORS, ZONE_LABELS
from src.shared.dungeon.dungeon_engine import DungeonEngine
from src.shared.racing.race_camera import RaceCamera
from src.shared.racing.minimap import RaceMinimap
from src.shared.rendering.slime_renderer import render_slime_from_genome

class DungeonPathScene(Scene):
    """
    Dungeon traversal scene based on a linear path simulation.
    Reuses racing engine patterns for autonomous party movement.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = ArenaLayout(self.spec)
        self.session = kwargs.get('session')
        
        # Create session if not provided
        if not self.session:
            from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
            self.session = DungeonSession()
            self.session.start_run()
        
        # Get shared entity registry
        self.entity_registry = kwargs.get('entity_registry')
        
        # Load roster and team from main save system
        from src.shared.persistence.save_manager import SaveManager
        save_result = SaveManager.load()
        if save_result:
            roster_data, session_data = save_result
            self.roster = Roster.from_dict(roster_data)
            dungeon_team = self.roster.get_dungeon_team()
            team = dungeon_team.members if dungeon_team else []
        else:
            # Fallback to old method
            from src.shared.teams.roster_save import load_roster
            self.roster = load_roster()
            d_team = self.roster.teams.get(TeamRole.DUNGEON)
            team = d_team.members if d_team else []
        
        # Store team on session for combat access
        if hasattr(self.session, 'team'):
            self.session.team = team
        self.team = team

        # Generate track ONCE and store on session
        # If session already has a track (on_resume after combat)
        # reuse it — never regenerate
        if self.session.track is None:
            # Handle both Floor object and integer depth
            if hasattr(self.session.floor, 'depth'):
                depth = self.session.floor.depth
            else:
                depth = self.session.floor  # It's already an integer
            
            self.session.track = generate_dungeon_track(
                depth=depth,
                seed=self.session.seed
            )
        
        # Always use session.track — never self.track
        # This ensures path and combat see same data
        self.track = self.session.track
        self.engine = DungeonEngine(self.track, self.team)
        self.camera = RaceCamera()
        
        # UI & Rendering
        self.minimap = RaceMinimap(spec)
        self.ui_components = []
        self._setup_ui()
        
        # Visual Constants
        self.track_height_ratio = 0.4
        self.track_rect = self._get_track_rect()

    def _setup_ui(self):
        self.ui_components = []
        # Header bar
        header = Panel(self.layout.header, self.spec, variant="surface")
        header.add_to(self.ui_components)
        
        Label("DUNGEON DEPTHS", (self.layout.header.centerx, self.layout.header.centery), 
              self.spec, size="lg", bold=True, centered=True).add_to(self.ui_components)
        
        # FLEE / EXIT Button
        Button("FLEE", pygame.Rect(self.layout.header.x + 10, self.layout.header.y + 5, 80, self.layout.header.height - 10),
               self._retreat, self.spec, variant="secondary").add_to(self.ui_components)

        # Team Status Bar (Bottom)
        Panel(self.layout.team_bar, self.spec, variant="surface").add_to(self.ui_components)

    def on_enter(self, **kwargs) -> None:
        self.camera.x = 0.0
        self.camera.zoom_x = 1.0

    def on_resume(self, **kwargs) -> None:
        """Called when returning from combat or other pushed scenes."""
        result = kwargs.get('combat_result', 'victory')
        
        if result == 'victory':
            # Mark zone resolved
            if self.session.active_zone:
                self.session.active_zone.resolved = True
                self.session.combat_results.append({
                    'zone': self.session.active_zone,
                    'result': 'victory'
                })
            self.session.active_zone = None
            self.engine.resume()
            
        elif result == 'defeat':
            self._retreat()
        elif result == 'flee':
            self.session.active_zone = None
            self.engine.resume()

    def handle_event(self, event: pygame.event.Event) -> None:
        for comp in reversed(self.ui_components):
            if hasattr(comp, 'handle_event') and comp.handle_event(event):
                return
        
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self._retreat()

    def tick(self, dt: float) -> None:
        dt_ms = int(dt * 1000)
        for comp in self.ui_components:
            comp.update(dt_ms)
            
        events = self.engine.tick(dt)
        for event in events:
            self._handle_event(event)
            
        # Update camera to follow party
        target_x = self.engine.party.distance
        self.camera.x += (target_x - self.camera.x - self.spec.screen_width * 0.3) * 0.06

    def _handle_event(self, event_type: str):
        if event_type == "combat_encounter":
            self._handle_combat()
        elif event_type == "rest_encountered":
            self._handle_rest()
        elif event_type == "treasure_found":
            self._handle_treasure()
        elif event_type == "boss_encountered":
            self._handle_boss()
        elif event_type == "path_complete":
            self._on_complete()

    def _handle_combat(self):
        zone = self.engine.party.current_zone
        
        # Store on session — combat reads from here
        self.session.active_zone = zone
        
        # Debug: Print squad info
        if zone and zone.squad:
            print(f"[DEBUG] Path scene - Squad: {zone.squad.name}")
            for i, member in enumerate(zone.squad.members):
                # Get the actual slime from entity registry
                slime = self.entity_registry.get(member.slime_id) if self.entity_registry and hasattr(member, 'slime_id') else None
                if slime:
                    print(f"[DEBUG]   Member {i}: {member.name}, genome colors: {slime.genome.base_color}")
                else:
                    print(f"[DEBUG]   Member {i}: {member.name}, genome not accessible")
        
        # Push to combat scene with full roster and team
        from src.apps.dungeon_crawler.ui.scene_dungeon_combat import DungeonCombatScene
        kwargs = self.context.resources.copy()
        kwargs["session"] = self.session
        kwargs["roster"] = self.roster
        kwargs["team"] = self.team
        self.context.manager.overlay(DungeonCombatScene(**kwargs))

    def _generate_enemy_group(self, zone, depth: int) -> List[dict]:
        """No longer used, replaced by pre-generation in _generate_zone_visuals."""
        return []

    def _on_encounter_resolved(self, result=None):
        # No longer used, handled by on_resume
        pass

    def _handle_rest(self):
        # Simple animation/delay and resume for now
        self.engine.resume()

    def _handle_treasure(self):
        # Resolve treasure and resume
        self.engine.resume()

    def _handle_boss(self):
        self._handle_combat() # Reuses combat for now

    def _on_complete(self):
        kwargs = self.context.resources.copy()
        kwargs["run_result"] = {"floors_cleared": getattr(self.track, 'depth', 1)}
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**kwargs))

    def _retreat(self):
        floors = len([r for r in self.session.combat_results
                     if r['result'] == 'victory'])
        kwargs = self.context.resources.copy()
        kwargs["message"] = f"Team retreated — {floors} encounters cleared"
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**kwargs))

    def render(self, surface: pygame.Surface):
        surface.fill((20, 15, 25)) # Background: Dark Abyss
        
        # 1. Render Path
        self._render_track(surface)
        
        # 2. Render Party Marker
        self._render_party(surface)
        
        # 3. UI Layer
        for comp in self.ui_components:
            comp.render(surface)
            
        # Minimap (fixed logic)
        self._render_minimap(surface)

    def _render_minimap(self, surface):
        track_rect = self.track_rect
        minimap_width = 200
        minimap_height = 40
        padding = 10
        
        m_left = self.spec.screen_width - minimap_width - padding
        m_top = padding + 64 # below header
        
        # Minimap Background
        m_rect = pygame.Rect(m_left, m_top, minimap_width, minimap_height)
        pygame.draw.rect(surface, (10, 10, 15), m_rect, border_radius=4)
        pygame.draw.rect(surface, (60, 60, 80), m_rect, width=1, border_radius=4)
        
        # Zone colors on minimap background
        track_len = self.track.total_length
        m_inner_w = minimap_width - 16
        m_inner_x = m_left + 8
        
        for zone in self.track.zones:
            z_start = int(m_inner_x + (zone.start_dist / track_len) * m_inner_w)
            z_end = int(m_inner_x + (zone.end_dist / track_len) * m_inner_w)
            z_color = tuple(c // 2 for c in ZONE_COLORS[zone.zone_type])
            pygame.draw.rect(surface, z_color, (z_start, m_top + 2, max(1, z_end - z_start), minimap_height - 4))

        # Party position dot
        progress = min(1.0, self.engine.party.distance / track_len)
        dot_x = int(m_inner_x + progress * m_inner_w)
        dot_y = m_top + minimap_height // 2
        
        # Cluster of dots for party
        for i, entry in enumerate(self.team[:4]):
            offset = (i - 1.5) * 4
            # Get the actual slime from entity registry
            slime = self.entity_registry.get(entry.slime_id) if self.entity_registry else None
            if slime:
                color = slime.genome.base_color
            else:
                color = (100, 100, 100)  # Default color if slime not found
            pygame.draw.circle(surface, color, (dot_x, dot_y + int(offset)), 3)
            pygame.draw.circle(surface, (255, 255, 255), (dot_x, dot_y + int(offset)), 3, width=1)

    def _render_track(self, surface):
        track_rect = self.track_rect
        
        # Path Floor
        pygame.draw.rect(surface, (45, 40, 55), track_rect)
        
        # Zones
        for zone in self.track.zones:
            sx = self.camera.to_screen_x(zone.start_dist, 0)
            ex = self.camera.to_screen_x(zone.end_dist, 0)
            
            visible_s = max(sx, 0)
            visible_e = min(ex, self.spec.screen_width)
            
            if visible_e > visible_s:
                color = ZONE_COLORS[zone.zone_type]
                if zone.resolved:
                    color = tuple(max(0, c - 40) for c in color) # Darken resolved
                
                pygame.draw.rect(surface, color, (visible_s, track_rect.top, visible_e - visible_s, track_rect.height))
                
                # Previews and Markers
                if not zone.resolved:
                    zone_center_x = self.camera.to_screen_x((zone.start_dist + zone.end_dist) / 2, 0)
                    if zone.zone_type in [DungeonZoneType.COMBAT, DungeonZoneType.BOSS]:
                        # Render squad members
                        if zone.squad:
                            members = zone.squad.members
                            count = len(members)
                            spacing = min(32, 120 // max(count, 1))
                            
                            for i, enemy in enumerate(members):
                                ex = zone_center_x + (i - count // 2) * spacing
                                ey = track_rect.centery
                                render_slime_from_genome(
                                    surface, enemy.genome, ex, ey, radius=12
                                )
                            
                            # Squad name above zone
                            render_text(surface, zone.squad.name,
                                       (zone_center_x, track_rect.top + 8),
                                       size=12, color=(255, 200, 200), center=True)
                else:
                    # Checkmark for resolved
                    zone_center_x = self.camera.to_screen_x((zone.start_dist + zone.end_dist) / 2, 0)
                    render_text(surface, "✓", (int(zone_center_x), track_rect.centery), size=24, color=(100, 255, 100), center=True)

                # Label
                if sx > -100 and sx < self.spec.screen_width:
                    label = ZONE_LABELS[zone.zone_type]
                    render_text(surface, label, (int(sx) + 10, track_rect.top + 10), size=16, color=(255, 255, 255))

        # Borders (Stone ridges)
        pygame.draw.line(surface, (120, 110, 130), track_rect.topleft, track_rect.topright, 4)
        pygame.draw.line(surface, (120, 110, 130), track_rect.bottomleft, track_rect.bottomright, 4)

    def _render_party(self, surface):
        track_rect = self.track_rect
        px = self.camera.to_screen_x(self.engine.party.distance, 0)
        py = track_rect.centery
        
        # FIX 3: Vertical Squad Formation
        SLIME_SPACING = 38 # Increased from 28
        total_h = len(self.team[:5]) * SLIME_SPACING
        start_y = py - total_h // 2 + SLIME_SPACING // 2
        
        for i, entry in enumerate(self.team[:5]):
            sy = start_y + i * SLIME_SPACING
            # Get the actual slime from entity registry
            slime = self.entity_registry.get(entry.slime_id) if self.entity_registry else None
            if slime:
                render_slime_from_genome(surface, slime.genome, int(px), int(sy), radius=16)

        # Pause Indicator
        if self.engine.party.paused:
            # Floating icon above party
            label = "!"
            color = (255, 200, 0)
            if self.engine.party.pause_reason == "rest":
                label = "RESTING..."
                color = (100, 200, 255)
                # Pulse effect
                size_mod = 1.0 + math.sin(pygame.time.get_ticks() * 0.01) * 0.1
                pygame.draw.circle(surface, color, (int(px), int(track_rect.top - 20)), int(15 * size_mod), width=2)
            
            pygame.draw.circle(surface, color, (int(px), int(track_rect.top - 20)), 10)
            render_text(surface, label, (int(px), int(track_rect.top - 20)), size=18, color=(0,0,0), center=True, bold=True)
            
            if self.engine.party.pause_reason == "rest":
                # Floating HP text
                if pygame.time.get_ticks() % 500 < 50:
                    render_text(surface, "HP +1", (int(px) + random.randint(-20, 20), int(track_rect.top - 40)), size=14, color=(100, 255, 100), center=True)

        # 3. Party Cards (Bottom)
        self._render_party_cards(surface)

    def _render_party_cards(self, surface):
        track_rect = self.track_rect
        bar_y = track_rect.bottom + 20
        card_h = self.layout.team_bar.height - 10
        card_w = (self.spec.screen_width - 50) // 4
        
        for i, entry in enumerate(self.team[:4]):
            card_x = 10 + i * (card_w + 10)
            card_rect = pygame.Rect(card_x, bar_y, card_w, card_h)
            
            # Background
            pygame.draw.rect(surface, (35, 30, 45), card_rect, border_radius=6)
            pygame.draw.rect(surface, (70, 60, 90), card_rect, width=1, border_radius=6)
            
            # Portrait
            # Get the actual slime from entity registry
            slime = self.entity_registry.get(entry.slime_id) if self.entity_registry else None
            if slime:
                render_slime_from_genome(surface, slime.genome, card_x + 25, bar_y + card_h // 2, radius=18)
            
            # Name & LV
            name = slime.name if slime else entry.slime_id
            level = slime.level if slime else 1
            render_text(surface, name, (card_x + 55, bar_y + 10), size=14, bold=True, color=(255,255,255))
            render_text(surface, f"Lv.{level}", (card_x + 55, bar_y + 26), size=12, color=(180, 180, 200))
            
            # HP Bar
            if slime:
                hp_pct = max(0.0, min(1.0, slime.current_hp / slime.max_hp))
                bar_rect = pygame.Rect(card_x + 55, bar_y + 44, card_w - 65, 8)
                pygame.draw.rect(surface, (20, 15, 25), bar_rect, border_radius=4)
                if hp_pct > 0:
                    hp_color = (100, 255, 100) if hp_pct > 0.5 else (255, 200, 0) if hp_pct > 0.2 else (255, 50, 50)
                    pygame.draw.rect(surface, hp_color, (bar_rect.x, bar_rect.y, int(bar_rect.width * hp_pct), bar_rect.height), border_radius=4)

    def _render_hud(self, surface):
        # HUD Information in team_bar
        bar = self.layout.team_bar
        dist_text = f"DEPTH: {int(self.engine.party.distance)}m / {int(self.track.total_length)}m"
        render_text(surface, dist_text, (bar.centerx, bar.y + 15), size=18, bold=True, center=True)

    def _get_track_rect(self):
        h = int(self.spec.screen_height * self.track_height_ratio)
        y = (self.spec.screen_height - h) // 2
        return pygame.Rect(0, y, self.spec.screen_width, h)

    def on_exit(self):
        pass
