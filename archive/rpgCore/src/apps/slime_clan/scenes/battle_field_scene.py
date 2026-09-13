import math
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

import pygame
from loguru import logger

from src.shared.engine.scene_manager import Scene
from src.apps.slime_clan.constants import *
from src.apps.slime_clan.territorial_grid import generate_obstacles, TileState
from src.apps.slime_clan.ui.battle_ui import render_battlefield

@dataclass
class SquadToken:
    col: int
    row: int
    team: TileState
    active: bool = True

class BattleFieldScene(Scene):
    """Operational grid — move Blue token, collide with Red to trigger auto-battle."""

    def on_enter(self, **kwargs) -> None:
        self.region_name = kwargs.get("region", "Test Grid")
        self.difficulty = kwargs.get("difficulty", "NORMAL")
        self.node_id = kwargs.get("node_id", "")
        self.nodes = kwargs.get("nodes", {})
        self.faction_manager = kwargs.get("faction_manager")
        self.day = kwargs.get("day", 1)
        self.actions_remaining = kwargs.get("actions_remaining", 3)
        self.resources = kwargs.get("resources", 0)
        self.ship_parts = kwargs.get("ship_parts", 0)
        self.secured_part_nodes = kwargs.get("secured_part_nodes", [])
        self.tribe_state = kwargs.get("tribe_state", {})
        self.player_units = kwargs.get("player_units", [])
        self.colony_manager = kwargs.get("colony_manager")
        self.stronghold_bonus = kwargs.get("stronghold_bonus", False)
        self.game_over = False
        self.exit_code = 1

        self.font_ui = pygame.font.Font(None, 24)
        self.font_token = pygame.font.Font(None, 28)
        self.font_banner = pygame.font.Font(None, 52)

        self.grid = [[TileState.NEUTRAL for _ in range(BF_GRID_COLS)] for _ in range(BF_GRID_ROWS)]
        generate_obstacles(self.grid)

        self.blue_token = SquadToken(0, 0, TileState.BLUE)
        self.red_token = SquadToken(BF_GRID_COLS - 1, BF_GRID_ROWS - 1, TileState.RED)

        auto_battle_result = kwargs.get("auto_battle_result")
        if auto_battle_result is not None:
            if auto_battle_result == "blue_win":
                self.red_token.active = False
                self.exit_code = 0
                self.game_over = True
            else:
                self.blue_token.active = False
                self.exit_code = 1
                self.game_over = True

    def on_exit(self) -> None:
        pass

    def handle_event(self, event: pygame.event.Event) -> None:
        pass  # stub — scene not yet active

    def handle_events(self, events: list[pygame.event.Event]) -> None:
        for event in events:
            if event.type == pygame.QUIT:
                self.request_quit()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self._return_to_overworld(won=self.exit_code == 0)
                elif not self.game_over and self.blue_token.active:
                    self._handle_player_move(event.key)

    def _handle_player_move(self, key) -> None:
        dc, dr = 0, 0
        if key == pygame.K_UP: dr = -1
        elif key == pygame.K_DOWN: dr = 1
        elif key == pygame.K_LEFT: dc = -1
        elif key == pygame.K_RIGHT: dc = 1
        else: return

        new_c = self.blue_token.col + dc
        new_r = self.blue_token.row + dr
        if not (0 <= new_c < BF_GRID_COLS and 0 <= new_r < BF_GRID_ROWS): return
        if self.grid[new_r][new_c] == TileState.BLOCKED: return

        self.blue_token.col, self.blue_token.row = new_c, new_r
        if self._check_collision(): return
        self._take_red_turn()
        self._check_collision()

    def _take_red_turn(self) -> None:
        if not self.red_token.active: return
        target_c, target_r = self.blue_token.col, self.blue_token.row
        best_dist = float('inf')
        best_step = (self.red_token.col, self.red_token.row)
        for dc, dr in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            nc, nr = self.red_token.col + dc, self.red_token.row + dr
            if 0 <= nc < BF_GRID_COLS and 0 <= nr < BF_GRID_ROWS:
                if self.grid[nr][nc] != TileState.BLOCKED:
                    dist = abs(nc - target_c) + abs(nr - target_r)
                    if dist < best_dist:
                        best_dist = dist
                        best_step = (nc, nr)
        self.red_token.col, self.red_token.row = best_step

    def _check_collision(self) -> bool:
        if not self.red_token.active or not self.blue_token.active: return False
        dist = abs(self.blue_token.col - self.red_token.col) + abs(self.blue_token.row - self.red_token.row)
        if dist <= 1:
            self._launch_auto_battle()
            return True
        return False

    def _launch_auto_battle(self) -> None:
        from src.apps.slime_clan.scenes.auto_battle_scene import AutoBattleScene
        kwargs = self.context.resources.copy()
        kwargs.update({
            "region": f"{self.region_name}_Skirmish",
            "difficulty": self.difficulty,
            "bf_region": self.region_name,
            "bf_difficulty": self.difficulty,
            "bf_node_id": self.node_id,
            "faction_manager": self.faction_manager,
            "day": self.day,
            "actions_remaining": self.actions_remaining,
            "resources": self.resources,
            "ship_parts": self.ship_parts,
            "secured_part_nodes": self.secured_part_nodes,
            "tribe_state": self.tribe_state,
            "player_units": self.player_units,
            "colony_manager": self.colony_manager,
            "stronghold_bonus": self.stronghold_bonus
        })
        self.context.manager.switch_to(AutoBattleScene(**kwargs))

    def _return_to_overworld(self, won: bool) -> None:
        from src.apps.slime_clan.scenes.overworld_scene import OverworldScene
        kwargs = self.context.resources.copy()
        kwargs.update({
            "nodes": self.nodes,
            "battle_node_id": self.node_id,
            "battle_won": won,
            "faction_manager": self.faction_manager,
            "day": self.day,
            "actions_remaining": self.actions_remaining,
            "resources": self.resources,
            "ship_parts": self.ship_parts,
            "secured_part_nodes": self.secured_part_nodes,
            "tribe_state": self.tribe_state,
            "player_units": self.player_units,
            "colony_manager": self.colony_manager,
            "stronghold_bonus": self.stronghold_bonus
        })
        self.context.manager.switch_to(OverworldScene(**kwargs))

    def tick(self, dt_ms: float) -> None:
        if self.game_over: return
        if (self.blue_token.active
            and self.blue_token.col >= BF_GRID_COLS - 2
            and self.blue_token.row >= BF_GRID_ROWS - 2):
            self.exit_code = 0
            self.game_over = True

    def render(self, surface: pygame.Surface) -> None:
        render_battlefield(surface, self.font_ui, self.font_token, self.font_banner,
                           self.region_name, self.grid, self.blue_token, self.red_token,
                           self.game_over, self.exit_code)
