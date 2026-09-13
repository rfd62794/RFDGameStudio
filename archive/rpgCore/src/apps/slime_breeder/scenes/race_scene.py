import pygame
import random
import math
from typing import List, Optional, Tuple

from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.button import Button
from src.shared.ui.label import Label
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import ArenaLayout
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.racing.race_engine import RaceEngine
from src.shared.racing.race_track import generate_track, generate_zones, TerrainType, SEGMENT_LENGTH
from src.shared.racing.minimap import RaceMinimap
from src.shared.racing.race_hud import RaceHUD
from src.shared.racing.race_camera import RaceCamera
from src.shared.rendering.slime_renderer import SlimeRenderer
from src.shared.genetics.inheritance import generate_random
from src.shared.racing.racing_session import RacingSession

class RaceScene(Scene):
    """
    Focused racing screen using ArenaLayout with persistent session state.
    """
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = ArenaLayout(self.spec)
        
        # Session management
        self.session = kwargs.get("session")
        if not self.session:
            # Try to load existing session
            self.session = RacingSession.load_from_file()
        
        # Roster for team management
        self.roster = kwargs.get("roster")
        if not self.roster:
            from src.shared.teams.roster_save import load_roster
            self.roster = load_roster()
            # Set garden reference for roster
            self.roster.set_garden_reference(kwargs.get("garden_state"))
        
        # Store selected slime from carousel if provided
        selected_slime = kwargs.get("selected_slime")
        if selected_slime and self.context:
            self.context.selected_slime = selected_slime
            
        self.engine: Optional[RaceEngine] = None
        self.track = generate_track(self.session.track_length, 3)
        self.terrain_zones = generate_zones(self.session.track_length, 3)
        self.renderer = SlimeRenderer()
        self.minimap = RaceMinimap(spec)
        self.hud = RaceHUD(spec, self.layout)
        self.camera = RaceCamera()
        
        self.ui_components = []
        self._setup_ui()
        
        # Camera & Animation State
        self.start_countdown = 3.0
        self.shake_mag = 0.0
        self.shake_timer = 0.0
        
        # Motion Effects
        self.speed_lines = [] 
        
        # Track Layout Constants
        self.track_height_ratio = 0.45  # Track takes 45% of arena height
        self.min_track_height = 240     # Minimum track height for comfortable lanes
        self.track_border_width = 8
        self.lane_count = 4
        
        # Fixed slime render size - zoom affects world coordinates, not render size
        self.SLIME_RENDER_RADIUS = 24  # Fixed pixels always
        
        # Race constants
        self.total_laps = 3
        
        # Results state
        self._show_results = False
        self._results_timer = 0.0
        self._race_results = []
    
    def world_to_screen_x(self, world_x: float) -> float:
        """Convert world X coordinate to screen X using camera."""
        return self.camera.to_screen_x(world_x, self.layout.arena.x)
    
    def world_to_screen_y(self, lane: int, track_top: int, track_height: int) -> int:
        """Convert lane to screen Y coordinate (never affected by zoom)."""
        return self.camera.to_screen_y(lane, track_top, track_height)

    def _setup_ui(self):
        self.ui_components = []
        Panel(self.layout.header, self.spec, variant="surface").add_to(self.ui_components)
        Panel(self.layout.team_bar, self.spec, variant="surface").add_to(self.ui_components)
        Label("SLIME DERBY", (self.layout.header.centerx, self.layout.header.centery), self.spec, size="lg", bold=True, centered=True).add_to(self.ui_components)
        Button("EXIT", pygame.Rect(self.layout.header.x + 10, self.layout.header.y + 5, 80, self.layout.header.height - 10),
               self._exit_race, self.spec, variant="secondary").add_to(self.ui_components)

    def on_enter(self) -> None:
        # Check for pre-selected slime from carousel
        selected_slime = None
        if hasattr(self, 'context') and self.context and hasattr(self.context, 'selected_slime'):
            selected_slime = self.context.selected_slime
        
        # Get racing team from roster (using new reference layer)
        racing_team = self.roster.get_racing_team()
        participants = []
        
        # Add player's creature - use carousel selection if available, otherwise fall back to racing team
        if selected_slime:
            # Use pre-selected slime from carousel
            player_creature = self.roster.get_creature(selected_slime.slime_id)
            if player_creature:
                participants.append(player_creature)
        elif racing_team.members:
            # Fall back to racing team first member (backward compatibility)
            player_creature = self.roster.get_creature(racing_team.members[0].slime_id)
            if player_creature:
                participants.append(player_creature)
        
        # Add AI racers (create temporary RosterSlime for compatibility)
        for i in range(4 - len(participants)):
            # NOTE: AI racers are ephemeral objects
            # created for race simulation only.
            # They are never added to the Roster or
            # EntityRegistry, so SlimeEntityTemplate
            # migration is intentionally skipped.
            # These objects do not require validation.
            ai_slime = RosterSlime(slime_id=f"ai_{i}", name=f"Racer_{i+1}", genome=generate_random(), level=random.randint(1, 5))
            participants.append(ai_slime)
        
        # Update session with current team
        self.session.team = participants
        self.session.auto_save()  # Save session state
        
        # Initialize race engine
        self.engine = RaceEngine(participants, self.track, length=self.session.track_length * 3)
        self.start_countdown = 3.0
        self.camera.x = 0.0
        self.camera.zoom_x = 1.0

    def trigger_shake(self, magnitude: float, duration: float):
        self.shake_mag = magnitude
        self.shake_timer = duration

    def handle_event(self, event: pygame.event.Event) -> None:
        # Process UI components first
        for comp in reversed(self.ui_components):
            if hasattr(comp, 'handle_event') and comp.handle_event(event):
                return
        
        # Handle race-specific events
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                from src.apps.slime_breeder.ui.scene_garden import GardenScene
                self.context.manager.switch_to(GardenScene(**self.context.resources))
            elif event.key == pygame.K_SPACE and self.start_countdown <= 0:
                if self.engine and not self.engine.is_finished():
                    self.engine.tick(0.1)  # Fast forward slightly

    def tick(self, dt: float) -> None:
        dt_ms = int(dt * 1000)
        for comp in self.ui_components:
            comp.update(dt_ms)
            
        if self.start_countdown > 0:
            self.start_countdown -= dt
            if 0 < self.start_countdown < 0.1: self.trigger_shake(5.0, 0.3)
            return
            
        if self.engine and not self.engine.is_finished():
            self.engine.tick(dt)
            
            # Update rubber band camera
            self.camera.update(self.engine.participants, self.layout.arena.width, self.layout.arena.x)
            
            # 3. Speed Lines
            self._update_speed_lines(dt)

            if self.engine.is_finished() and not self._show_results:
                self._on_race_complete()
            
        if self._show_results:
            self._results_timer -= dt
            if self._results_timer <= 0:
                kwargs = self.context.resources.copy()
                kwargs["race_result"] = self._race_results[0] if self._race_results else None
                from src.apps.slime_breeder.ui.scene_garden import GardenScene
                self.context.manager.switch_to(GardenScene(**kwargs))
                return
            
        if self.shake_timer > 0:
            self.shake_timer -= dt
        else:
            self.shake_mag = 0

    def _update_speed_lines(self, dt: float):
        lead_p = max(self.engine.participants, key=lambda x: x.distance)
        if lead_p.velocity > 150:
            for _ in range(int(lead_p.velocity // 100)):
                self.speed_lines.append({
                    "x": self.spec.screen_width + random.randint(0, 100),
                    "y": random.randint(self.layout.arena.y, self.layout.arena.bottom),
                    "len": random.randint(40, 100),
                    "speed": lead_p.velocity * 1.5 + random.randint(0, 200)
                })
        for line in self.speed_lines[:]:
            line["x"] -= line["speed"] * dt
            if line["x"] < -200:
                self.speed_lines.remove(line)

    def render(self, surface: pygame.Surface):
        surface.fill(self.spec.color_bg)
        
        # Render arena content directly (no viewport scaling)
        self._render_arena_content(surface)
        
        # Shake
        if self.shake_mag > 0:
            sx = random.uniform(-self.shake_mag, self.shake_mag)
            sy = random.uniform(-self.shake_mag, self.shake_mag)
            temp = surface.copy()
            surface.fill((0,0,0))
            surface.blit(temp, (sx, sy))

        for comp in self.ui_components:
            comp.render(surface)
        
        # Render minimap
        if self.engine:
            # Update terrain ahead for player
            player = self.engine.participants[0]
            from src.shared.racing.race_track import get_terrain_at
            look_ahead_distance = player.distance + 200
            self.terrain_ahead = get_terrain_at(self.track, look_ahead_distance)
            
            # Update current lap from player
            self.current_lap = player.laps_complete + 1 if not player.finished else self.engine.total_laps
            
            full_dist = self.engine.length
            self.minimap.render(surface, self.engine.participants, full_dist, self.camera.x)
            self.hud.render(surface, self.engine.participants, self.current_lap, self.total_laps, self.terrain_ahead)
            
        if self.start_countdown > 0:
            msg = "READY" if self.start_countdown > 2 else "SET" if self.start_countdown > 1 else "GO!"
            Label(msg, (self.spec.screen_width // 2, self.spec.screen_height // 2), self.spec, size="hd", color=(255, 255, 255), centered=True).render(surface)

        if self._show_results:
            self._render_results_overlay(surface)

    def _render_arena_content(self, surface: pygame.Surface):
        # Render within arena bounds
        arena_rect = self.layout.arena
        arena_w = arena_rect.width
        arena_h = arena_rect.height
        
        # Create temporary surface for arena content
        arena_surf = pygame.Surface((arena_w, arena_h))
        arena_surf.fill((30, 50, 30)) # Off-track dark green background
        
        # Path Dimensions
        track_h = max(self.min_track_height, int(arena_h * self.track_height_ratio))
        track_y = (arena_h - track_h) // 2
        
        # Render all arena content to arena_surf
        self._render_track_content(arena_surf, arena_w, arena_h, track_y, track_h)
        self._render_lap_lines(arena_surf, arena_w, track_y, track_h)
        
        # Blit arena surface to main surface
        surface.blit(arena_surf, arena_rect.topleft)
    
    def _render_track_content(self, surface, arena_w, arena_h, track_y, track_h):
        
        # 1. Draw Road Base (Continuous band)
        road_rect = pygame.Rect(0, track_y, arena_w, track_h)
        pygame.draw.rect(surface, (40, 40, 40), road_rect) # Slate dark grey road
        
        # 2. Track Terrain Zones (Wide blocks, not stripes)
        # Terrain colors
        terrain_colors = {
            TerrainType.GRASS: (55, 110, 55),   # base track color
            TerrainType.WATER: (40, 100, 180),  # blue, slightly lighter
            TerrainType.ROCK:  (100, 90, 80),   # grey-brown
            TerrainType.MUD:   (90, 70, 50),    # dark brown
        }
        
        # Render zones as wide blocks with horizontal-only zoom
        for zone in self.terrain_zones:
            screen_start = self.world_to_screen_x(zone.start_dist)
            screen_end   = self.world_to_screen_x(zone.end_dist)
            
            # Clip to screen
            visible_start = max(screen_start, 0)
            visible_end   = min(screen_end, arena_w)
            
            if visible_end <= visible_start:
                continue  # off screen
            
            width = visible_end - visible_start
            
            # Skip grass zones (use road base color)
            if zone.terrain_type != TerrainType.GRASS:
                terrain_color = terrain_colors.get(zone.terrain_type, (60, 60, 60))
                pygame.draw.rect(surface, terrain_color, (visible_start, track_y, width, track_h))
                
                # Zone label at entry point
                if screen_start > 0 and screen_start < arena_w:
                    label = zone.terrain_type.value.upper()
                    if zone.terrain_type == TerrainType.WATER: label = "~ POND"
                    elif zone.terrain_type == TerrainType.ROCK: label = "▲ ROCKS"
                    elif zone.terrain_type == TerrainType.MUD: label = "◼ MUD"
                    
                    # Simple text rendering for terrain label
                    font = pygame.font.Font(None, 14)
                    text_surface = font.render(label, True, (255, 255, 255, 180))
                    surface.blit(text_surface, (visible_start + 8, track_y + 8))
            
        # 3. Track Borders & Lanes
        # Top/Bottom borders
        pygame.draw.line(surface, (200, 200, 200), (0, track_y), (arena_w, track_y), 3)
        pygame.draw.line(surface, (200, 200, 200), (0, track_y + track_h), (arena_w, track_y + track_h), 3)
        
        # Lanes
        lane_h = track_h // self.lane_count
        for i in range(1, self.lane_count):
            ly = track_y + (i * lane_h)
            # Dashed lane markers
            for dx in range(0, arena_w, 40):
                pygame.draw.line(surface, (100, 100, 100), (dx, ly), (dx + 20, ly), 1)

    def _render_lap_lines(self, surface, arena_w, track_y, track_h):
        if not self.engine: return
        
        # Lap line positions in world space: [3000, 6000, 9000]
        lap_dist = self.engine.lap_distance
        total_laps = self.engine.total_laps
        lap_positions = [lap_dist * i for i in range(1, total_laps + 1)]
        
        from src.shared.ui.profile_card import render_text
        
        for i, world_x in enumerate(lap_positions):
            screen_x = self.world_to_screen_x(world_x)
            
            # Clip: only render if on screen
            if screen_x < -50 or screen_x > arena_w + 50:
                continue
                
            lap_num = i + 1
            is_finish = (lap_num == total_laps)
            
            if is_finish:
                # Checkered finish line
                square_h = 16
                squares = track_h // square_h
                for j in range(squares):
                    color = (255, 255, 255) if j % 2 == 0 else (0, 0, 0)
                    pygame.draw.rect(surface, color, (screen_x - 4, track_y + j * square_h, 8, square_h))
                label = "FINISH"
                color = (255, 215, 0) # Gold
            else:
                # Regular lap line
                pygame.draw.line(surface, (255, 255, 255), (screen_x, track_y), (screen_x, track_y + track_h), 3)
                label = f"LAP {lap_num}"
                color = (255, 255, 255)
            
            # Label above track
            render_text(surface, label, (int(screen_x), track_y - 20), size=14, color=color, center=True)

        # 5. Participants
        if self.engine:
            for i, p in enumerate(self.engine.participants):
                # Use world_to_screen coordinate conversion
                ly = self.world_to_screen_y(i, track_y, track_h)
                screen_x = self.world_to_screen_x(p.distance)
                
                # Render shadow when jumping
                if p.jump_height > 2:
                    shadow_alpha = max(1, int(120 * (1 - p.jump_height/20)))  # Ensure minimum alpha of 1
                    shadow_surface = pygame.Surface((24, 8), pygame.SRCALPHA)
                    pygame.draw.ellipse(shadow_surface, (0, 0, 0, shadow_alpha), pygame.Rect(0, 0, 24, 8))
                    surface.blit(shadow_surface, (screen_x - 12, ly - 4))
                
                # Create dummy slime with jump height offset and squash/stretch effects
                from src.apps.slime_breeder.entities.slime import Slime
                jump_y = ly - int(p.jump_height)
                dummy_slime = Slime(p.slime.name, p.slime.genome, (screen_x, jump_y))
                
                # Apply squash/stretch based on jump phase
                scale_x, scale_y = 1.0, 1.0
                if p.is_jumping:
                    if p.jump_phase < 0.15:  # Launch - stretch vertically
                        scale_y = 1.2
                        scale_x = 0.85
                    elif p.jump_phase > 0.85:  # Landing - squash vertically
                        scale_y = 0.7
                        scale_x = 1.2
                
                # Override render size to be fixed regardless of zoom
                original_radius = getattr(self.renderer, 'render_radius', None)
                self.renderer.render_radius = self.SLIME_RENDER_RADIUS
                
                # Apply scale transformation
                if scale_x != 1.0 or scale_y != 1.0:
                    # Render to temporary surface with scaling
                    slime_size = int(self.SLIME_RENDER_RADIUS * 2)
                    temp_surface = pygame.Surface((slime_size * 2, slime_size * 2), pygame.SRCALPHA)
                    temp_surface.fill((0, 0, 0, 0))
                    
                    # Render slime to temp surface
                    temp_slime = Slime(p.slime.name, p.slime.genome, (slime_size, slime_size))
                    temp_renderer = SlimeRenderer()
                    temp_renderer.render_radius = self.SLIME_RENDER_RADIUS
                    temp_renderer.render(temp_surface, temp_slime)
                    
                    # Scale and blit
                    scaled_width = int(slime_size * 2 * scale_x)
                    scaled_height = int(slime_size * 2 * scale_y)
                    scaled_surface = pygame.transform.scale(temp_surface, (scaled_width, scaled_height))
                    surface.blit(scaled_surface, (screen_x - scaled_width // 2, jump_y - scaled_height // 2))
                else:
                    self.renderer.render(surface, dummy_slime)
                
                if original_radius is not None:
                    self.renderer.render_radius = original_radius
                
                if p.finished:
                    Label(f"FINISH #{p.rank}", (int(screen_x), ly - 30), self.spec, color=self.spec.color_accent, bold=True, centered=True).render(surface)

        # 6. Speed Lines
        for line in self.speed_lines:
            ly = line["y"] - self.layout.arena.y
            pygame.draw.line(surface, (240, 240, 255, 150), (line["x"], ly), (line["x"] + line["len"], ly), 2)

    def _exit_race(self):
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**self.context.resources))

    def _on_race_complete(self):
        self._show_results = True
        self._results_timer = 5.0
        # Rank participants
        ranked = sorted(self.engine.participants, key=lambda p: p.distance, reverse=True)
        self._race_results = []
        for i, p in enumerate(ranked):
            p.rank = i + 1
            self._race_results.append({
                "name": p.slime.name,
                "position": i + 1
            })

    def _render_results_overlay(self, surface: pygame.Surface):
        overlay = pygame.Surface((self.spec.screen_width, self.spec.screen_height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 180))
        surface.blit(overlay, (0, 0))
        
        center_x = self.spec.screen_width // 2
        y = self.spec.screen_height // 3
        
        Label("RACE COMPLETE", (center_x, y), self.spec, size="hd", color=self.spec.color_accent, centered=True).render(surface)
        y += 60
        
        for i, res in enumerate(self._race_results[:4]):
            color = (255, 215, 0) if i == 0 else (200, 200, 200) if i == 1 else (205, 127, 50) if i == 2 else (255, 255, 255)
            Label(f"{i+1}st: {res['name']}" if i==0 else f"{i+1}nd: {res['name']}" if i==1 else f"{i+1}rd: {res['name']}" if i==2 else f"{i+1}th: {res['name']}",
                  (center_x, y), self.spec, size="lg", color=color, centered=True).render(surface)
            y += 40
            
        y += 20
        Label("Returning to garden...", (center_x, y), self.spec, size="md", color=self.spec.color_text_dim, centered=True).render(surface)
        
        # Countdown bar
        bar_w = 200
        bar_h = 8
        bar_x = center_x - bar_w // 2
        bar_y = y + 30
        pygame.draw.rect(surface, (60, 60, 60), (bar_x, bar_y, bar_w, bar_h))
        progress_w = int(bar_w * (self._results_timer / 5.0))
        pygame.draw.rect(surface, self.spec.color_accent, (bar_x, bar_y, progress_w, bar_h))

    def on_exit(self):
        pass
