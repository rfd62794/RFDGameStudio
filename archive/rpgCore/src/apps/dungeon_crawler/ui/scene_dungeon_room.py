import pygame
import math
import random
from typing import List, Tuple, Optional
from loguru import logger

from src.shared.engine.scene_manager import Scene
from src.shared.ui.panel import Panel
from src.shared.ui.label import Label
from src.shared.ui.button import Button
from src.shared.ui.spec import UISpec
from src.shared.ui.layouts import HubLayout
from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession

from src.shared.rendering.slime_renderer import SlimeRenderer
from src.apps.slime_breeder.entities.slime import Slime
from src.shared.genetics import generate_random
from src.shared.physics import Vector2

class DungeonRoomScene(Scene):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        from src.shared.ui.spec import SPEC_720
        self.spec = SPEC_720
        self.layout = HubLayout(self.spec)
        self.session = kwargs.get("session")
        self.roster = kwargs.get("roster")
        self.team = kwargs.get("team")
        
        # Grid settings derived from spec/layout
        self.tile_size = 48
        self.grid_rows = 9
        self.grid_cols = 9
        self.grid_offset_x = (self.layout.main_area.width - (self.grid_cols * self.tile_size)) // 2 + self.layout.main_area.x
        self.grid_offset_y = self.layout.main_area.y + 20
        
        # Atmospheric state
        self.torch_flicker = 1.0
        self.torch_timer = 0.0
        
        # Room logic state
        self.hero_grid_pos = [4, 1]
        self.enemy_grid_pos = [4, 4]
        self.enemy_defeated = False
        
        # Entity renderers
        self.slime_renderer = SlimeRenderer()
        self.slime_entity = Slime("Slime", generate_random(), (0, 0))
        
        self.ui_components = []
        self._setup_ui()

    def on_enter(self, **kwargs):
        logger.info("DungeonRoomScene.on_enter called")
        # Ensure session is captured
        if not self.session:
            self.session = kwargs.get('session')
        
        if not self.session:
            logger.error("No session available in DungeonRoomScene, aborting to garden")
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            self.context.manager.switch_to(GardenScene(**self.context.resources))
            return
        
        # Capture roster and team from kwargs or use existing ones
        if not self.roster:
            self.roster = kwargs.get("roster")
        if not self.team:
            self.team = kwargs.get("team")
        
        print(f"[DEBUG] Dungeon room on_enter - roster: {self.roster}")
        print(f"[DEBUG] Dungeon room on_enter - team: {self.team}")
        if self.roster:
            dungeon_team = self.roster.get_dungeon_team()
            print(f"[DEBUG] Dungeon room on_enter - dungeon team members: {len(dungeon_team.members)}")
        
        self.floor_obj = self.session.floor
        print(f"[DEBUG] Session floor after descend: {self.floor_obj}")
        
        if not self.session.floor:
            logger.info("Session floor is None, calling descend()")
            self.session.descend()
        
        logger.info(f"Session floor after descend: {self.session.floor}")
        
        # Check for combat result
        combat_result = kwargs.get('combat_result')
        if combat_result == "victory":
            self.enemy_defeated = True
            logger.info("🏆 Victory confirmed in Exploration Mode")
        elif combat_result == "defeat":
             self._on_run_complete("defeat")
             return
            
        self._setup_ui()

    def _setup_ui(self):
        self.ui_components = []
        
        if not self.session.floor:
            return

        room = self.session.floor.get_current_room()
        
        # 1. Header Area (Room Info)
        Panel(self.layout.top_bar, self.spec, variant="surface").add_to(self.ui_components)
        Label(f"FLOOR {self.session.floor.depth} — {room.id} ({room.room_type.upper()})", 
              (self.layout.top_bar.centerx, self.layout.top_bar.centery), self.spec, size="md", bold=True, centered=True).add_to(self.ui_components)

        # 2. Main Exploration Area (Background)
        Panel(self.layout.main_area, self.spec, variant="surface").add_to(self.ui_components)

        # 3. Action Bar (Bottom)
        Panel(self.layout.status_bar, self.spec, variant="surface").add_to(self.ui_components)
        
        action_y = self.layout.status_bar.y + 10
        btn_h = self.layout.status_bar.height - 20
        
        Button("FLEE (ESC)", pygame.Rect(20, action_y, 140, btn_h), self._handle_flee, self.spec, variant="danger").add_to(self.ui_components)

        if self.enemy_defeated or not room.has_enemies():
            nx = 200
            for conn_id in room.connections:
                btn_nav = Button(f"→ {conn_id}", pygame.Rect(nx, action_y, 120, btn_h), 
                                 lambda cid=conn_id: self._handle_move(cid), self.spec, variant="primary").add_to(self.ui_components)
                nx += 130

    def _handle_flee(self):
        logger.info("🏃 Flee from encounter")
        # Return to garden directly
        from src.apps.slime_breeder.ui.scene_garden import GardenScene
        self.context.manager.switch_to(GardenScene(**self.context.resources))

    def _on_run_complete(self, result):
        if result == "victory":
            logger.info("🏆 Encounter cleared!")
            from src.apps.dungeon_crawler.ui.scene_dungeon_path import DungeonPathScene
            kwargs = self.context.resources.copy()
            kwargs["session"] = self.session
            kwargs["encounter_result"] = "victory"
            kwargs["roster"] = self.roster
            kwargs["team"] = self.team
            self.context.manager.switch_to(DungeonPathScene(**kwargs))
        else:
            from dataclasses import dataclass
            @dataclass
            class RunResult:
                floors_cleared: int
                status: str
                
            res = RunResult(floors_cleared=self.session.floor.depth if self.session.floor else 0, status=result)
            from src.apps.slime_breeder.ui.scene_garden import GardenScene
            kwargs = self.context.resources.copy()
            kwargs["run_result"] = res
            self.context.manager.switch_to(GardenScene(**kwargs))

    def _handle_move(self, target_id: str):
        if self.session.floor.move_to(target_id):
            self.enemy_defeated = False
            self.hero_grid_pos = [4, 1]
            self.enemy_grid_pos = [4, 4]
            self._setup_ui()

    def handle_event(self, event: pygame.event.Event) -> None:
        for comp in reversed(self.ui_components):
            if hasattr(comp, "handle_event") and comp.handle_event(event):
                return
                
        if event.type == pygame.KEYDOWN:
            moved = False
            if event.key in [pygame.K_w, pygame.K_UP]:
                self.hero_grid_pos[1] = max(0, self.hero_grid_pos[1] - 1)
                moved = True
            elif event.key in [pygame.K_s, pygame.K_DOWN]:
                self.hero_grid_pos[1] = min(self.grid_rows - 1, self.hero_grid_pos[1] + 1)
                moved = True
            elif event.key in [pygame.K_a, pygame.K_LEFT]:
                self.hero_grid_pos[0] = max(0, self.hero_grid_pos[0] - 1)
                moved = True
            elif event.key in [pygame.K_d, pygame.K_RIGHT]:
                self.hero_grid_pos[0] = min(self.grid_cols - 1, self.hero_grid_pos[0] + 1)
                moved = True
            elif event.key == pygame.K_ESCAPE:
                self._handle_flee()
            
            if moved:
                self._check_collision()
                if not self.enemy_defeated:
                    self._enemy_turn()
                    self._check_collision()

    def _enemy_turn(self):
        if self.enemy_defeated: return
        dx = self.hero_grid_pos[0] - self.enemy_grid_pos[0]
        dy = self.hero_grid_pos[1] - self.enemy_grid_pos[1]
        if abs(dx) > abs(dy):
            self.enemy_grid_pos[0] += 1 if dx > 0 else -1
        elif dy != 0:
            self.enemy_grid_pos[1] += 1 if dy > 0 else -1

    def _check_collision(self):
        if self.enemy_defeated: return
        if self.hero_grid_pos == self.enemy_grid_pos:
            logger.info("💥 COLLISION! Entering Combat...")
            print(f"[DEBUG] Dungeon room - self.team: {self.team}")
            print(f"[DEBUG] Dungeon room - self.roster: {self.roster}")
            if self.roster:
                dungeon_team = self.roster.get_dungeon_team()
                print(f"[DEBUG] Dungeon room - dungeon team: {dungeon_team}")
                print(f"[DEBUG] Dungeon room - dungeon team members: {len(dungeon_team.members)}")
            from src.apps.dungeon_crawler.ui.scene_dungeon_combat import DungeonCombatScene
            kwargs = self.context.resources.copy()
            kwargs["session"] = self.session
            kwargs["enemy_entity"] = self.slime_entity
            kwargs["roster"] = self.roster
            kwargs["team"] = self.team
            self.context.manager.overlay(DungeonCombatScene(**kwargs))

    def tick(self, dt: float) -> None:
        self.torch_timer += dt
        self.torch_flicker = 1.0 + math.sin(self.torch_timer * 4.0) * 0.1
        
        # Update slime visuals position
        ex = self.grid_offset_x + (self.enemy_grid_pos[0] + 0.5) * self.tile_size
        ey = self.grid_offset_y + (self.enemy_grid_pos[1] + 0.5) * self.tile_size
        self.slime_entity.kinematics.position = Vector2(ex, ey)
        
        dt_ms = int(dt * 1000)
        for comp in self.ui_components:
            comp.update(dt_ms)

    def _get_tile_rect(self, col: int, row: int) -> pygame.Rect:
        return pygame.Rect(
            self.grid_offset_x + col * self.tile_size,
            self.grid_offset_y + row * self.tile_size,
            self.tile_size,
            self.tile_size
        )

    def render(self, surface: pygame.Surface) -> None:
        surface.fill(self.spec.color_bg)
        
        if not self.session or not self.session.floor:
            return

        # 1. Draw UI Background Panels first
        for comp in self.ui_components:
            if isinstance(comp, Panel):
                comp.render(surface)

        # 2. Draw Grid & World Content
        grid_w = self.grid_cols * self.tile_size
        grid_h = self.grid_rows * self.tile_size
        pygame.draw.rect(surface, (30, 30, 35), (self.grid_offset_x - 10, self.grid_offset_y - 10, grid_w + 20, grid_h + 20))
        
        # Torches
        torch_color = (int(200 * self.torch_flicker), int(100 * self.torch_flicker), 0)
        for tx, ty in [(self.grid_offset_x-10, self.grid_offset_y-10), (self.grid_offset_x+grid_w+10, self.grid_offset_y-10)]:
            pygame.draw.circle(surface, torch_color, (tx, ty), 8)
        
        # Grid Tiles
        for r in range(self.grid_rows):
            for c in range(self.grid_cols):
                rect = self._get_tile_rect(c, r)
                color = (25, 20, 20) if (r + c) % 2 == 0 else (28, 23, 23)
                pygame.draw.rect(surface, color, rect)
                pygame.draw.rect(surface, (15, 10, 10), rect, 1)

        # 3. Hero
        hx = self.grid_offset_x + (self.hero_grid_pos[0] + 0.5) * self.tile_size
        hy = self.grid_offset_y + (self.hero_grid_pos[1] + 0.5) * self.tile_size
        pygame.draw.rect(surface, self.spec.color_accent_alt, (hx - 15, hy - 20, 30, 40), border_radius=4)

        # 4. Enemy
        if not self.enemy_defeated:
            self.slime_renderer.render(surface, self.slime_entity)
            
        # 5. Exit Flag (at 7,7)
        if self.enemy_defeated:
            flag_rect = self._get_tile_rect(7, 7)
            fx, fy = flag_rect.centerx, flag_rect.centery
            pygame.draw.line(surface, (150, 150, 150), (fx, fy + 15), (fx, fy - 15), 2)
            pygame.draw.polygon(surface, self.spec.color_accent, [(fx, fy - 15), (fx + 15, fy - 7), (fx, fy)])
            
            # If hero touches flag, floor clear
            if self.hero_grid_pos == [7, 7]:
                self._on_run_complete("victory")

        # 6. Interactive UI & Labels on top
        for comp in self.ui_components:
            if not isinstance(comp, Panel):
                comp.render(surface)

    def on_exit(self):
        pass
