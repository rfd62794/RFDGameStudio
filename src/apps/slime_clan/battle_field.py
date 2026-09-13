#!/usr/bin/env python3
"""
Session 015 — Squad Collision Operational Map
=============================================
A mid-level skirmish that determines the spatial momentum of the invasion.
A grid-based simulation where a single Blue squad token and a Red squad token
maneuver across the field. Adjacent collision triggers tactical auto-battle.
"""

import sys
import argparse
import subprocess
from dataclasses import dataclass
from typing import List, Tuple, Optional

import pygame
from loguru import logger

from src.apps.slime_clan.territorial_grid import (
    draw_slime, SLIME_COLORS, TileState, generate_obstacles, screen_pos_to_tile
)

# ---------------------------------------------------------------------------
# Rendering Constants
# ---------------------------------------------------------------------------
WINDOW_WIDTH: int = 640
WINDOW_HEIGHT: int = 480
WINDOW_TITLE: str = "rpgCore — Squad Collision"
FPS: int = 60

GRID_COLS: int = 10
GRID_ROWS: int = 10
TILE_SIZE: int = 48
GRID_OFFSET_X: int = 80
GRID_OFFSET_Y: int = 0
BORDER_PX: int = 1

BACKGROUND_COLOR: tuple[int, int, int] = (15, 15, 20)
BORDER_COLOR: tuple[int, int, int] = (20, 20, 20)
TILE_COLORS: dict[TileState, tuple[int, int, int]] = {
    TileState.NEUTRAL: (70, 70, 70),
    TileState.BLOCKED: (42, 40, 46),
}
TILE_HIGHLIGHT: dict[TileState, tuple[int, int, int]] = {
    TileState.NEUTRAL: (100, 100, 100),
    TileState.BLOCKED: (60, 58, 66),
}
BLOCKED_X_COLOR: tuple[int, int, int] = (210, 165, 20)
SIDEBAR_TEXT_COLOR: tuple[int, int, int] = (200, 200, 200)

@dataclass
class SquadToken:
    col: int
    row: int
    team: TileState
    active: bool = True

class BattleField:
    def __init__(self, region_name: str, difficulty: str):
        pygame.init()
        # TODO: Migrate to Scene subclass — tracked Phase N
        self.screen = pygame.display.get_surface()
        pygame.display.set_caption(WINDOW_TITLE)
        
        self.region_name = region_name
        self.difficulty = difficulty
        
        try:
            self.font_ui = pygame.font.Font(None, 24)
            self.font_token = pygame.font.Font(None, 28)
            self.font_banner = pygame.font.Font(None, 52)
        except Exception:
            self.font_ui = pygame.font.SysFont("monospace", 16)
            self.font_token = pygame.font.SysFont("monospace", 20)
            self.font_banner = pygame.font.SysFont("monospace", 36)

        self.running = True
        self.exit_code = 1 # Default loss/cancel
        self.game_over = False
        
        # Grid initialization
        self.grid = [[TileState.NEUTRAL for _ in range(GRID_COLS)] for _ in range(GRID_ROWS)]
        generate_obstacles(self.grid)

        # Tokens
        self.blue_token = SquadToken(0, 0, TileState.BLUE)
        self.red_token = SquadToken(GRID_COLS - 1, GRID_ROWS - 1, TileState.RED)

        logger.info(f"🗺️  BattleField initialized for {region_name} ({difficulty})")

    def handle_events(self) -> None:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                elif not self.game_over and self.blue_token.active:
                    self._handle_player_move(event.key)

    def _handle_player_move(self, key) -> None:
        """Handle arrow keys for Blue Token movement."""
        dc, dr = 0, 0
        if key == pygame.K_UP: dr = -1
        elif key == pygame.K_DOWN: dr = 1
        elif key == pygame.K_LEFT: dc = -1
        elif key == pygame.K_RIGHT: dc = 1
        else:
            return
            
        new_c, new_r = self.blue_token.col + dc, self.blue_token.row + dr
        
        # Bounds check
        if not (0 <= new_c < GRID_COLS and 0 <= new_r < GRID_ROWS):
            return
            
        # Obstacle check
        if self.grid[new_r][new_c] == TileState.BLOCKED:
            return
            
        # Move Blue
        self.blue_token.col, self.blue_token.row = new_c, new_r
        
        # Check adjacent collision before Red moves
        if self._check_collision():
            return
            
        # Take Red Turn
        self._take_red_turn()
        
        # Check collision again
        self._check_collision()

    def _take_red_turn(self):
        """Red pathfinding: Greedy step toward Blue."""
        if not self.red_token.active:
            return
            
        target_c, target_r = self.blue_token.col, self.blue_token.row
        best_dist = float('inf')
        best_step = (self.red_token.col, self.red_token.row)
        
        for dc, dr in ((0, -1), (0, 1), (-1, 0), (1, 0)):
            nc, nr = self.red_token.col + dc, self.red_token.row + dr
            
            if 0 <= nc < GRID_COLS and 0 <= nr < GRID_ROWS:
                if self.grid[nr][nc] != TileState.BLOCKED:
                    dist = abs(nc - target_c) + abs(nr - target_r)
                    if dist < best_dist:
                        best_dist = dist
                        best_step = (nc, nr)
                        
        self.red_token.col, self.red_token.row = best_step

    def _check_collision(self) -> bool:
        """If Blue and Red are adjacent, trigger tactical battle."""
        if not self.red_token.active or not self.blue_token.active:
            return False
            
        dist = abs(self.blue_token.col - self.red_token.col) + abs(self.blue_token.row - self.red_token.row)
        if dist <= 1:
            logger.info("⚔️ SQUAD COLLISION DETECTED! Launching tactical auto-battle...")
            self._launch_auto_battle()
            return True
            
        return False

    def _launch_auto_battle(self):
        """Launch the 3v3 auto battler and handle the result."""
        base_cmd = [
            sys.executable, 
            "-m", "src.apps.slime_clan.auto_battle",
            "--region", f"{self.region_name}_Skirmish",
            "--difficulty", self.difficulty
        ]
        
        logger.info(f"🚀 Executing subprocess: {' '.join(base_cmd)}")
        
        try:
            result = subprocess.run(base_cmd)
            
            if result.returncode == 0:
                logger.info("🏆 Blue squad won the tactical skirmish! Red token eliminated.")
                self.red_token.active = False
                # No enemies remain — field is secured
                logger.info("🎉 Field Secured! Returning to Overworld.")
                self.exit_code = 0
                self.game_over = True
            else:
                logger.info(f"💀 Red squad repelled the attack! Blue token eliminated. Exit Code: {result.returncode}")
                self.blue_token.active = False
                self.exit_code = 1
                self.game_over = True
        except Exception as e:
            logger.error(f"❌ Auto-battle call failed: {e}")

    def update(self, dt_ms: float) -> None:

        if self.game_over:
            return
            
        # Win Condition: Blue reaches Red Base (bottom right 3x3 approx, let's say exactly at 9,9 for simplicity)
        if self.blue_token.active and self.blue_token.col >= GRID_COLS - 2 and self.blue_token.row >= GRID_ROWS - 2:
            logger.info("🎉 BLUE REACHED ENEMY BASE! Field Secured!")
            self.exit_code = 0
            self.game_over = True
            
    def render(self) -> None:
        self.screen.fill(BACKGROUND_COLOR)
        
        # Draw Sidebar
        panel_rect = pygame.Rect(0, 0, GRID_OFFSET_X, WINDOW_HEIGHT)
        pygame.draw.rect(self.screen, (18, 18, 26), panel_rect)
        pygame.draw.rect(self.screen, (55, 55, 80), panel_rect, 1)
        
        title = self.font_ui.render("REGION", True, (120, 120, 148))
        self.screen.blit(title, (5, 20))
        region_label = self.font_ui.render(self.region_name[:10], True, SIDEBAR_TEXT_COLOR)
        self.screen.blit(region_label, (5, 40))

        # Draw Grid
        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                state = self.grid[row][col]
                x = GRID_OFFSET_X + col * TILE_SIZE
                y = GRID_OFFSET_Y + row * TILE_SIZE
                tile_rect = pygame.Rect(x, y, TILE_SIZE, TILE_SIZE)

                if state == TileState.BLOCKED:
                    pygame.draw.rect(self.screen, TILE_COLORS[TileState.BLOCKED], tile_rect)
                    m = 10
                    pygame.draw.line(self.screen, BLOCKED_X_COLOR, (x + m, y + m), (x + TILE_SIZE - m, y + TILE_SIZE - m), 2)
                    pygame.draw.line(self.screen, BLOCKED_X_COLOR, (x + TILE_SIZE - m, y + m), (x + m, y + TILE_SIZE - m), 2)
                else:
                    pygame.draw.rect(self.screen, TILE_COLORS[TileState.NEUTRAL], tile_rect)
                    highlight_rect = pygame.Rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4)
                    pygame.draw.rect(self.screen, TILE_HIGHLIGHT[TileState.NEUTRAL], highlight_rect, 2)

                pygame.draw.rect(self.screen, BORDER_COLOR, tile_rect, BORDER_PX)

        # Draw Blue Token
        if self.blue_token.active:
            x = GRID_OFFSET_X + self.blue_token.col * TILE_SIZE
            y = GRID_OFFSET_Y + self.blue_token.row * TILE_SIZE
            cx, cy = x + TILE_SIZE // 2, y + TILE_SIZE // 2
            draw_slime(self.screen, cx, cy, TILE_SIZE, SLIME_COLORS[TileState.BLUE])
            sz_label = self.font_token.render("3", True, (255, 255, 255))
            self.screen.blit(sz_label, (cx - sz_label.get_width()//2, cy - sz_label.get_height()//2 - 2))

        # Draw Red Token
        if self.red_token.active:
            x = GRID_OFFSET_X + self.red_token.col * TILE_SIZE
            y = GRID_OFFSET_Y + self.red_token.row * TILE_SIZE
            cx, cy = x + TILE_SIZE // 2, y + TILE_SIZE // 2
            draw_slime(self.screen, cx, cy, TILE_SIZE, SLIME_COLORS[TileState.RED])
            sz_label = self.font_token.render("3", True, (255, 255, 255))
            self.screen.blit(sz_label, (cx - sz_label.get_width()//2, cy - sz_label.get_height()//2 - 2))

        # Win/Loss Banner
        if self.game_over:
            banner_w, banner_h = 320, 80
            banner_x = GRID_OFFSET_X + (GRID_COLS * TILE_SIZE - banner_w) // 2
            banner_y = GRID_OFFSET_Y + (GRID_ROWS * TILE_SIZE - banner_h) // 2
            
            overlay = pygame.Surface((banner_w, banner_h))
            overlay.set_alpha(220)
            overlay.fill((10, 10, 15))
            self.screen.blit(overlay, (banner_x, banner_y))
            
            color = (100, 200, 255) if self.exit_code == 0 else (255, 100, 100)
            msg = "FIELD SECURED!" if self.exit_code == 0 else "SQUAD WIPED!"
            surf = self.font_banner.render(msg, True, color)
            self.screen.blit(surf, (banner_x + (banner_w - surf.get_width()) // 2, banner_y + 10))
            
            esc_surf = self.font_ui.render("ESC to Return", True, (150, 150, 150))
            self.screen.blit(esc_surf, (banner_x + (banner_w - esc_surf.get_width()) // 2, banner_y + 55))

        pygame.display.flip()

    def run(self) -> None:
        clock = pygame.time.Clock()
        while self.running:
            dt_ms = clock.tick(FPS)
            self.handle_events()
            self.update(dt_ms)
            self.render()
        pygame.quit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--region", default="Test Grid", help="Region Name")
    parser.add_argument("--difficulty", default="NORMAL", help="EASY/NORMAL/HARD")
    args = parser.parse_args()
    
    app = BattleField(region_name=args.region, difficulty=args.difficulty)
    app.run()
    sys.exit(app.exit_code)
