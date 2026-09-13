from typing import List, Dict, Any, Optional

import pygame
from loguru import logger

from src.shared.engine.scene_manager import Scene
from src.apps.slime_clan.constants import *
from src.apps.slime_clan.territorial_grid import TileState
from src.apps.slime_clan.auto_battle import (
    Shape, Hat, SlimeUnit, create_slime, execute_action
)
from src.apps.slime_clan.ui.battle_ui import render_autobattle

class AutoBattleScene(Scene):
    """3v3 auto-battler. Returns win/loss via scene transition."""

    def on_enter(self, **kwargs) -> None:
        self.region_name = kwargs.get("region", "Unknown Region")
        self.difficulty = kwargs.get("difficulty", "NORMAL")

        self.bf_region = kwargs.get("bf_region", "Unknown")
        self.bf_difficulty = kwargs.get("bf_difficulty", "NORMAL")
        self.bf_node_id = kwargs.get("bf_node_id")
        self.bf_nodes = kwargs.get("bf_nodes", {})
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
        
        self.initial_blue_count = 0
        self.turn_count = 0
        self.timer_ms = 0.0
        self.winner: Optional[str] = None
        self.win_close_timer = 0.0

        self.font_name = pygame.font.Font(None, 20)
        self.font_log = pygame.font.Font(None, 24)
        self.font_banner = pygame.font.Font(None, 52)

        mult = 1.0
        if self.difficulty == "EASY": mult = 0.8
        elif self.difficulty == "HARD": mult = 1.2

        if self.player_units:
            self.blue_squad = []
            for u in self.player_units:
                u.team = TileState.BLUE
                u.hp = u.max_hp
                self.blue_squad.append(u)
        else:
            self.blue_squad = [
                self._create_buffed_slime("blue_1", "Rex", Shape.CIRCLE, Hat.NONE),
                self._create_buffed_slime("blue_2", "Brom", Shape.SQUARE, Hat.NONE),
                self._create_buffed_slime("blue_3", "Pip", Shape.TRIANGLE, Hat.NONE),
            ]
        
        self.initial_blue_count = len(self.blue_squad)
        self.red_squad = [
            create_slime("r1", "R-Brute", TileState.RED, Shape.SQUARE, Hat.SWORD, difficulty_mult=mult),
            create_slime("r2", "R-Scout", TileState.RED, Shape.TRIANGLE, Hat.SWORD, difficulty_mult=mult),
            create_slime("r3", "R-Cleric", TileState.RED, Shape.CIRCLE, Hat.STAFF, difficulty_mult=mult),
        ]

        self.turn_queue: List[SlimeUnit] = []
        self._build_turn_queue()
        self.battle_logs: List[str] = [f"Battle Started in {self.region_name}!"]

    def on_exit(self) -> None:
        pass

    def _build_turn_queue(self) -> None:
        alive = [u for u in self.blue_squad + self.red_squad if u.hp > 0]
        self.turn_queue = sorted(alive, key=lambda x: x.speed, reverse=True)
        self.turn_count += 1

    def handle_event(self, event: pygame.event.Event) -> None:
        pass  # stub — scene not yet active

    def handle_events(self, events: list[pygame.event.Event]) -> None:
        for event in events:
            if event.type == pygame.QUIT:
                self.request_quit()
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                self._return_result("red_win")

    def tick(self, dt_ms: float) -> None:
        if self.winner:
            self.win_close_timer += dt_ms
            if self.win_close_timer >= 2000:
                result = "blue_win" if "BLUE" in self.winner else "red_win"
                self._return_result(result)
            return

        self.timer_ms += dt_ms
        if self.timer_ms >= TICK_RATE_MS:
            self.timer_ms -= TICK_RATE_MS
            self._process_next_turn()

    def _process_next_turn(self) -> None:
        self.turn_queue = [u for u in self.turn_queue if u.hp > 0]
        if not self.turn_queue:
            self._build_turn_queue()
            if not self.turn_queue: return

        actor = self.turn_queue.pop(0)
        if actor.team == TileState.BLUE: allies, enemies = self.blue_squad, self.red_squad
        else: allies, enemies = self.red_squad, self.blue_squad

        log_msg = execute_action(actor, allies, enemies)
        self.battle_logs.append(log_msg)
        if len(self.battle_logs) > 5: self.battle_logs.pop(0)
        self._check_win_condition()

    def _check_win_condition(self) -> None:
        blue_alive = any(u.hp > 0 for u in self.blue_squad)
        red_alive = any(u.hp > 0 for u in self.red_squad)
        if blue_alive and not red_alive: self.winner = "BLUE WINS!"
        elif red_alive and not blue_alive: self.winner = "RED WINS!"
        elif not blue_alive and not red_alive: self.winner = "DRAW!"
        elif self.turn_count >= 50:
            b_pct = sum(u.hp for u in self.blue_squad) / sum(u.max_hp for u in self.blue_squad)
            r_pct = sum(u.hp for u in self.red_squad) / sum(u.max_hp for u in self.red_squad)
            if b_pct > r_pct: self.winner = "BLUE WINS (TIMEOUT)!"
            else: self.winner = "RED WINS (TIMEOUT)!"

    def _create_buffed_slime(self, id: str, name: str, shape: Shape, hat: Hat) -> SlimeUnit:
        unit = create_slime(id, name, TileState.BLUE, shape, hat, is_player=True)
        if self.stronghold_bonus: unit.defense += 1
        return unit

    def _return_result(self, result: str) -> None:
        blue_alive = [u for u in self.blue_squad if u.hp > 0]
        blue_lost = len(blue_alive) < self.initial_blue_count
        from src.apps.slime_clan.scenes.battle_field_scene import BattleFieldScene
        kwargs = self.context.resources.copy()
        kwargs.update({
            "region": self.bf_region,
            "difficulty": self.bf_difficulty,
            "node_id": self.bf_node_id,
            "nodes": self.bf_nodes,
            "auto_battle_result": result,
            "blue_lost": blue_lost,
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
        self.context.manager.switch_to(BattleFieldScene(**kwargs))

    def render(self, surface: pygame.Surface) -> None:
        render_autobattle(surface, self.font_name, self.font_log, self.font_banner,
                          self.blue_squad, self.red_squad, self.battle_logs, self.winner)
