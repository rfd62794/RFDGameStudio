import pygame
import math
from typing import List, Dict, Any, Optional, Set
from src.apps.slime_clan.constants import *

_LABEL_RECTS = []

FACTION_COLORS = {
    "CLAN_RED": {"fill": (139, 26, 26), "border": (204, 51, 51)},
    "CLAN_BLUE": {"fill": (26, 58, 92), "border": (51, 102, 204)},
    "CLAN_YELLOW": {"fill": (42, 42, 26), "border": (245, 197, 66)},
    "ASTRONAUT": {"fill": (42, 42, 42), "border": (255, 255, 255)},
    None: {"fill": (58, 58, 74), "border": (106, 106, 138)}
}

def draw_overworld_hud(surface: pygame.Surface, font: pygame.font.Font, day: int, actions: int, actions_max: int, resources: int, ship_parts: int, roster_count: int):
    """Pure render for Overworld HUD."""
    hud_text = f"Day {day}  —  Actions: {actions}/{actions_max}"
    hud_surf = font.render(hud_text, True, (255, 255, 255))
    surface.blit(hud_surf, (20, 20))
    
    res_text = f"Resources: {resources}  |  Ship Parts: {ship_parts}/5"
    res_surf = font.render(res_text, True, (150, 200, 255))
    surface.blit(res_surf, (20, 45))

    roster_text = f"Roster: {roster_count}"
    roster_surf = font.render(roster_text, True, (200, 255, 200))
    surface.blit(roster_surf, (20, 70))

    if actions == 0:
        prompt_surf = font.render("No actions remaining — End Day to continue", True, (255, 100, 100))
        surface.blit(prompt_surf, (20, 95))

def draw_nodes_and_connections(surface: pygame.Surface, font: pygame.font.Font, colonies: list, faction_manager: Any, actions_remaining: int):
    """Pure render for Map Nodes and Connections."""
    # Connections first
    drawn_pairs = set()
    for col in colonies:
        for conn_id in col.connections:
            # Note: We need a way to look up target pos. 
            # Passing colonies as a list might be tricky if connections refer to IDs.
            # Let's pass a dict of {id: col_obj} instead.
            pass

def render_overworld_map(surface: pygame.Surface, font: pygame.font.Font, colonies_dict: Dict[str, Any], faction_manager: Any, actions_remaining: int, tribe_state: Dict[str, Any]):
    """Pure render for the entire map layer."""
    surface.fill(OVERWORLD_BG)
    
    global _LABEL_RECTS
    _LABEL_RECTS.clear()
    
    # Connections
    drawn_pairs = set()
    for col in colonies_dict.values():
        for conn_id in col.connections:
            conn_node = colonies_dict.get(conn_id)
            if not conn_node: continue
            pair = tuple(sorted([col.id, conn_id]))
            if pair not in drawn_pairs:
                line_color = LINE_COLOR
                if col.faction and conn_node.faction and col.faction != conn_node.faction:
                    line_color = (74, 26, 26)  # Dark red for tension
                pygame.draw.line(surface, line_color, (col.x, col.y), (conn_node.x, conn_node.y), 3)
                drawn_pairs.add(pair)

    # Nodes
    for node in colonies_dict.values():
        owner = faction_manager.get_owner(node.coord)
        fc = FACTION_COLORS.get(owner, FACTION_COLORS[None])
        fill_color = fc["fill"]
        border_color = fc["border"]
        
        if node.id == "home":
            fill_color = (42, 42, 42)
            border_color = (255, 255, 255)
            
        radius = NODE_RADIUS
        if getattr(node, "node_type", None) and getattr(node.node_type, "name", "") == "STRONGHOLD":
            radius = int(NODE_RADIUS * 1.15)
            
        # If hidden, dim the colors by mixing 60% background color to simulate 40% opacity
        if getattr(node, "hidden", False):
            bg_r, bg_g, bg_b = OVERWORLD_BG
            
            fr, fg, fb = fill_color
            fill_color = (
                int(fr * 0.4 + bg_r * 0.6),
                int(fg * 0.4 + bg_g * 0.6),
                int(fb * 0.4 + bg_b * 0.6)
            )
            
            br, bg_c, bb = border_color
            border_color = (
                int(br * 0.4 + bg_r * 0.6),
                int(bg_c * 0.4 + bg_g * 0.6),
                int(bb * 0.4 + bg_b * 0.6)
            )
            
        pygame.draw.circle(surface, fill_color, (node.x, node.y), radius)

        # Draw markers BEFORE borders
        if owner == "CLAN_YELLOW":
            pts = [(node.x, node.y - 8), (node.x + 8, node.y), (node.x, node.y + 8), (node.x - 8, node.y)]
            pygame.draw.polygon(surface, border_color, pts, 0)
            
        if getattr(node, "node_type", None):
            nt_name = getattr(node.node_type, "name", "")
            if nt_name == "SHIP_PARTS":
                pts = [(node.x, node.y - 6), (node.x + 6, node.y), (node.x, node.y + 6), (node.x - 6, node.y)]
                pygame.draw.polygon(surface, border_color, pts, 0)
            elif nt_name == "RESOURCE":
                pygame.draw.circle(surface, border_color, (node.x, node.y - 5), 2)
                pygame.draw.circle(surface, border_color, (node.x - 4, node.y + 3), 2)
                pygame.draw.circle(surface, border_color, (node.x + 4, node.y + 3), 2)
                
        # Main border
        pygame.draw.circle(surface, border_color, (node.x, node.y), radius, 2)
        
        # Outer rings or markers
        if getattr(node, "node_type", None) and getattr(node.node_type, "name", "") == "RECRUITMENT":
            pygame.draw.circle(surface, border_color, (node.x, node.y), radius + 6, 1)

        # Home visual: small inverted triangle (fill white #FFFFFF)
        if node.id == "home":
            tri_pts = [(node.x - 6, node.y - radius - 2), (node.x + 6, node.y - radius - 2), (node.x, node.y - radius - 10)]
            pygame.draw.polygon(surface, (255, 255, 255), tri_pts)

        # Labels
        label_surf = font.render(node.name, True, TEXT_COLOR)
        lx = node.x - label_surf.get_width() // 2
        ly = node.y + radius + 5
        
        label_rect = pygame.Rect(lx, ly, label_surf.get_width(), label_surf.get_height())
        while label_rect.collidelist(_LABEL_RECTS) != -1:
            label_rect.y += 15
        
        _LABEL_RECTS.append(label_rect)
        surface.blit(label_surf, label_rect.topleft)

        pass

def draw_node_labels(surface: pygame.Surface, font: pygame.font.Font, node: Any, label_text: str, label_color: tuple):
    global _LABEL_RECTS
    surf = font.render(label_text, True, label_color)
    lx = node.x - surf.get_width() // 2
    
    radius = int(NODE_RADIUS * 1.15) if getattr(node, "node_type", None) and getattr(node.node_type, "name", "") == "STRONGHOLD" else NODE_RADIUS
    ly = node.y + radius + 5
    
    label_rect = pygame.Rect(lx, ly, surf.get_width(), surf.get_height())
    while label_rect.collidelist(_LABEL_RECTS) != -1:
        label_rect.y += 15
        
    _LABEL_RECTS.append(label_rect)
    surface.blit(surf, label_rect.topleft)

def draw_end_day_button(surface: pygame.Surface, font: pygame.font.Font):
    btn_x, btn_y, btn_w, btn_h = WINDOW_WIDTH - 140, WINDOW_HEIGHT - 60, 120, 40
    btn_rect = pygame.Rect(btn_x, btn_y, btn_w, btn_h)
    pygame.draw.rect(surface, (40, 60, 100), btn_rect)
    pygame.draw.rect(surface, (100, 150, 255), btn_rect, 2)
    btn_label = font.render("END DAY", True, (255, 255, 255))
    surface.blit(btn_label, (btn_x + (btn_w - btn_label.get_width()) // 2, btn_y + (btn_h - btn_label.get_height()) // 2))

def draw_interaction_panel(surface: pygame.Surface, font: pygame.font.Font, node_name: str, approaches: int, btns: List[tuple], is_hidden: bool = False):
    pw, ph = 300, 180
    px, py = (WINDOW_WIDTH - pw) // 2, (WINDOW_HEIGHT - ph) // 2
    pygame.draw.rect(surface, (20, 20, 30), (px, py, pw, ph))
    pygame.draw.rect(surface, (245, 197, 66), (px, py, pw, ph), 2)
    
    title = font.render(node_name, True, (245, 197, 66))
    surface.blit(title, (px + (pw - title.get_width()) // 2, py + 15))
    
    if is_hidden:
        flavor = "They have gone into hiding."
    else:
        flavor = "They watch you silently."
        if approaches >= 1: flavor = "They acknowledge your presence."
        if approaches >= 3: flavor = "They are considering you. Return tomorrow."
        
    flav_surf = font.render(flavor, True, (200, 200, 200))
    surface.blit(flav_surf, (px + (pw - flav_surf.get_width()) // 2, py + 50))
    
    if not is_hidden:
        prog_surf = font.render(f"Approach Progress: {approaches}/3", True, (150, 150, 150))
        surface.blit(prog_surf, (px + (pw - prog_surf.get_width()) // 2, py + 75))
    
    for label, rect in btns:
        pygame.draw.rect(surface, (40, 40, 60), rect)
        pygame.draw.rect(surface, (100, 100, 150), rect, 1)
        l_surf = font.render(label, True, (255, 255, 255))
        surface.blit(l_surf, (rect[0] + (rect[2] - l_surf.get_width()) // 2, rect[1] + (rect[3] - l_surf.get_height()) // 2))

def render_defection_moment(surface: pygame.Surface, font: pygame.font.Font, unit_name: str, colony_name: str):
    overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
    overlay.fill((10, 10, 20))
    overlay.set_alpha(230)
    surface.blit(overlay, (0, 0))
    
    big_f = pygame.font.Font(None, 48)
    name_surf = big_f.render(unit_name, True, (255, 255, 255))
    surface.blit(name_surf, ((WINDOW_WIDTH - name_surf.get_width()) // 2, WINDOW_HEIGHT // 2 - 50))
    
    flavor1 = f"{unit_name} slips away from {colony_name} in the darkness."
    flavor2 = "By morning they are standing at your fire."
    
    f1_surf = font.render(flavor1, True, (200, 200, 200))
    f2_surf = font.render(flavor2, True, (200, 200, 200))
    
    surface.blit(f1_surf, ((WINDOW_WIDTH - f1_surf.get_width()) // 2, WINDOW_HEIGHT // 2 + 10))
    surface.blit(f2_surf, ((WINDOW_WIDTH - f2_surf.get_width()) // 2, WINDOW_HEIGHT // 2 + 40))

def draw_game_over_overlay(surface: pygame.Surface, font: pygame.font.Font, game_over_type: str):
    overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT), pygame.SRCALPHA)
    overlay.fill((0, 0, 0, 230))
    surface.blit(overlay, (0, 0))
    
    msg = ""
    if game_over_type == "WIN": msg = "🎉 Planet Secured!"
    elif game_over_type == "LOSS": msg = "💀 Colony Lost!"
    elif game_over_type == "SURVIVOR": msg = "The ship shudders to life. You don't look back."
    
    big_font = pygame.font.Font(None, 36)
    txt = big_font.render(msg, True, (255, 255, 255))
    surface.blit(txt, ((WINDOW_WIDTH - txt.get_width()) // 2, WINDOW_HEIGHT // 2 - 20))
    
    sub = font.render("Press ESC to return to title", True, (150, 150, 150))
    surface.blit(sub, ((WINDOW_WIDTH - sub.get_width()) // 2, WINDOW_HEIGHT // 2 + 30))

def draw_launch_banner(surface: pygame.Surface, font: pygame.font.Font):
    banner_w, banner_h = 500, 100
    bx = (WINDOW_WIDTH - banner_w) // 2
    by = 100
    pygame.draw.rect(surface, (20, 40, 20), (bx, by, banner_w, banner_h))
    pygame.draw.rect(surface, (100, 255, 100), (bx, by, banner_w, banner_h), 2)
    
    win_txt = font.render("SHIP REPAIRED: Survivor Ending Available", True, (150, 255, 150))
    surface.blit(win_txt, (bx + (banner_w - win_txt.get_width()) // 2, by + 20))
    
    launch_hint = font.render("Click anywhere to LAUNCH and depart", True, (200, 255, 200))
    surface.blit(launch_hint, (bx + (banner_w - launch_hint.get_width()) // 2, by + 60))
