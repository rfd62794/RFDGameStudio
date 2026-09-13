import pygame
from typing import List, Dict, Any, Optional
from src.apps.slime_clan.constants import *
from src.apps.slime_clan.territorial_grid import draw_slime, SLIME_COLORS, TileState

def get_shape_str(shape: Any) -> str:
    """Helper for AutoBattle rendering."""
    # We use .value if it's an Enum, otherwise stringify
    val = getattr(shape, "value", str(shape))
    return {"CIRCLE": "C", "SQUARE": "S", "TRIANGLE": "T"}.get(val, "?")

def get_hat_str(hat: Any) -> str:
    """Helper for AutoBattle rendering."""
    val = getattr(hat, "value", str(hat))
    return {"NONE": " ", "SWORD": "⚔", "SHIELD": "🛡", "STAFF": "✨"}.get(val, "?")

def render_battlefield(surface: pygame.Surface, font_ui: pygame.font.Font, font_token: pygame.font.Font, font_banner: pygame.font.Font, 
                      region_name: str, grid: List[List[Any]], blue_token: Any, red_token: Any, 
                      game_over: bool, exit_code: int):
    """Pure render for BattleField tactical grid."""
    surface.fill(BF_BG)

    # Sidebar
    panel_rect = pygame.Rect(0, 0, BF_GRID_OFFSET_X, WINDOW_HEIGHT)
    pygame.draw.rect(surface, (18, 18, 26), panel_rect)
    pygame.draw.rect(surface, (55, 55, 80), panel_rect, 1)
    title = font_ui.render("REGION", True, (120, 120, 148))
    surface.blit(title, (5, 20))
    region_label = font_ui.render(region_name[:10], True, BF_SIDEBAR_TEXT)
    surface.blit(region_label, (5, 40))

    # Grid
    for row in range(BF_GRID_ROWS):
        for col in range(BF_GRID_COLS):
            state = grid[row][col]
            x = BF_GRID_OFFSET_X + col * BF_TILE_SIZE
            y = BF_GRID_OFFSET_Y + row * BF_TILE_SIZE
            tile_rect = pygame.Rect(x, y, BF_TILE_SIZE, BF_TILE_SIZE)
            if state == TileState.BLOCKED:
                pygame.draw.rect(surface, BF_TILE_BLOCKED, tile_rect)
                m = 10
                pygame.draw.line(surface, BF_BLOCKED_X, (x + m, y + m), (x + BF_TILE_SIZE - m, y + BF_TILE_SIZE - m), 2)
                pygame.draw.line(surface, BF_BLOCKED_X, (x + BF_TILE_SIZE - m, y + m), (x + m, y + BF_TILE_SIZE - m), 2)
            else:
                pygame.draw.rect(surface, BF_TILE_NEUTRAL, tile_rect)
                hl = pygame.Rect(x + 2, y + 2, BF_TILE_SIZE - 4, BF_TILE_SIZE - 4)
                pygame.draw.rect(surface, BF_TILE_HIGHLIGHT, hl, 2)
            pygame.draw.rect(surface, BF_BORDER_COLOR, tile_rect, 1)

    # Tokens
    if blue_token and blue_token.active:
        x = BF_GRID_OFFSET_X + blue_token.col * BF_TILE_SIZE
        y = BF_GRID_OFFSET_Y + blue_token.row * BF_TILE_SIZE
        cx, cy = x + BF_TILE_SIZE // 2, y + BF_TILE_SIZE // 2
        draw_slime(surface, cx, cy, BF_TILE_SIZE, SLIME_COLORS[TileState.BLUE])
        lbl = font_token.render("3", True, (255, 255, 255))
        surface.blit(lbl, (cx - lbl.get_width() // 2, cy - lbl.get_height() // 2 - 2))

    if red_token and red_token.active:
        x = BF_GRID_OFFSET_X + red_token.col * BF_TILE_SIZE
        y = BF_GRID_OFFSET_Y + red_token.row * BF_TILE_SIZE
        cx, cy = x + BF_TILE_SIZE // 2, y + BF_TILE_SIZE // 2
        draw_slime(surface, cx, cy, BF_TILE_SIZE, SLIME_COLORS[TileState.RED])
        lbl = font_token.render("3", True, (255, 255, 255))
        surface.blit(lbl, (cx - lbl.get_width() // 2, cy - lbl.get_height() // 2 - 2))

    # Banner
    if game_over:
        banner_w, banner_h = 320, 80
        bx = BF_GRID_OFFSET_X + (BF_GRID_COLS * BF_TILE_SIZE - banner_w) // 2
        by = BF_GRID_OFFSET_Y + (BF_GRID_ROWS * BF_TILE_SIZE - banner_h) // 2
        overlay = pygame.Surface((banner_w, banner_h))
        overlay.set_alpha(220)
        overlay.fill((10, 10, 15))
        surface.blit(overlay, (bx, by))
        color = (100, 200, 255) if exit_code == 0 else (255, 100, 100)
        msg = "FIELD SECURED!" if exit_code == 0 else "SQUAD WIPED!"
        surf = font_banner.render(msg, True, color)
        surface.blit(surf, (bx + (banner_w - surf.get_width()) // 2, by + 10))
        esc = font_ui.render("ESC to Return", True, (150, 150, 150))
        surface.blit(esc, (bx + (banner_w - esc.get_width()) // 2, by + 55))

def render_autobattle(surface: pygame.Surface, font_name: pygame.font.Font, font_log: pygame.font.Font, font_banner: pygame.font.Font,
                      blue_squad: List[Any], red_squad: List[Any], battle_logs: List[str], winner: Optional[str]):
    """Pure render for AutoBattle arena."""
    surface.fill(AB_BG)
    center_y = WINDOW_HEIGHT // 2
    spacing = 80

    # Blue squad
    bx = WINDOW_WIDTH // 6
    blue_count = len(blue_squad)
    for i, unit in enumerate(blue_squad):
        offset = i - (blue_count - 1) / 2
        _draw_unit(surface, font_name, unit, bx, center_y + int(offset * spacing))

    # Red squad
    rx = WINDOW_WIDTH - WINDOW_WIDTH // 6
    red_count = len(red_squad)
    for i, unit in enumerate(red_squad):
        offset = i - (red_count - 1) / 2
        _draw_unit(surface, font_name, unit, rx, center_y + int(offset * spacing))

    # Logs
    log_y = WINDOW_HEIGHT - 120
    for i, log_str in enumerate(battle_logs):
        surf = font_log.render(log_str, True, (180, 180, 180))
        surface.blit(surf, (WINDOW_WIDTH // 2 - surf.get_width() // 2, log_y + i * 20))

    if winner:
        banner_w, banner_h = 320, 80
        bx = (WINDOW_WIDTH - banner_w) // 2
        by = (WINDOW_HEIGHT - banner_h) // 2
        overlay = pygame.Surface((banner_w, banner_h))
        overlay.set_alpha(220)
        overlay.fill((10, 10, 15))
        surface.blit(overlay, (bx, by))
        color = (100, 200, 255) if "BLUE" in winner else (255, 100, 100)
        surf = font_banner.render(winner, True, color)
        surface.blit(surf, (bx + (banner_w - surf.get_width()) // 2, by + 15))
        wait_surf = font_name.render("Returning...", True, (150, 150, 150))
        surface.blit(wait_surf, (bx + (banner_w - wait_surf.get_width()) // 2, by + 60))

def _draw_unit(surface: pygame.Surface, font_name: pygame.font.Font, unit: Any, x: int, y: int):
    if unit.hp <= 0:
        pygame.draw.circle(surface, (50, 50, 50), (x, y), 20, 1)
        return

    name_surf = font_name.render(unit.name, True, AB_TEXT)
    surface.blit(name_surf, (x - name_surf.get_width() // 2, y - 35))

    draw_slime(surface, x, y, 48, SLIME_COLORS[unit.team])

    # HP bar
    bar_w, bar_h = 40, 6
    bx, by = x - bar_w // 2, y + 25
    pygame.draw.rect(surface, (50, 50, 50), (bx, by, bar_w, bar_h))
    fill_w = max(0, int((unit.hp / unit.max_hp) * bar_w))
    hp_color = (50, 255, 50) if unit.hp > unit.max_hp * 0.3 else (255, 50, 50)
    pygame.draw.rect(surface, hp_color, (bx, by, fill_w, bar_h))

    # Indicators (Shapes & Hats)
    ind_str = f"[{get_shape_str(unit.shape)}] {get_hat_str(unit.hat)}"
    ind_surf = font_name.render(ind_str, True, (150, 150, 150))
    surface.blit(ind_surf, (x - ind_surf.get_width() // 2, by + 8))

    if hasattr(unit, "taunt_active") and unit.taunt_active:
        pygame.draw.circle(surface, (255, 200, 50), (x, y), 24, 1)
