"""
PyGame drawing utilities — renderer-agnostic component primitives.
Each function accepts explicit coordinates rather than pygame.Rect
so callers can use resolver.py Bounds directly.
"""
from __future__ import annotations
import pygame
from .colors import COLORS

_font_cache: dict[tuple, pygame.font.Font] = {}

def get_font(size: int = 14, bold: bool = False) -> pygame.font.Font:
    key = (size, bold)
    if key not in _font_cache:
        _font_cache[key] = pygame.font.SysFont('Segoe UI', size, bold=bold)
    return _font_cache[key]

def draw_rect(surface: pygame.Surface, x, y, w, h,
              color=COLORS['surface'], radius: int = 8) -> None:
    pygame.draw.rect(surface, color, (int(x), int(y), int(w), int(h)),
                     border_radius=radius)

def draw_border_rect(surface: pygame.Surface, x, y, w, h,
                     fill=COLORS['surface'], border=COLORS['border'],
                     radius: int = 8) -> None:
    draw_rect(surface, x, y, w, h, fill, radius)
    pygame.draw.rect(surface, border, (int(x), int(y), int(w), int(h)),
                     width=1, border_radius=radius)

def draw_text(surface: pygame.Surface, text: str, x, y,
              color=COLORS['text'], size: int = 14, bold: bool = False) -> None:
    font = get_font(size, bold)
    rendered = font.render(str(text), True, color)
    surface.blit(rendered, (int(x), int(y)))

def draw_stat_bar(surface: pygame.Surface, x, y, w, h,
                  value: float, max_value: float = 100,
                  fill_color=COLORS['accent']) -> None:
    """Horizontal stat bar — fill_color proportional to value/max_value."""
    draw_border_rect(surface, x, y, w, h,
                     fill=COLORS['surface2'], border=COLORS['border'], radius=4)
    fill_w = (value / max(1, max_value)) * (w - 2)
    if fill_w > 0:
        draw_rect(surface, x + 1, y + 1, fill_w, h - 2, fill_color, radius=3)

def draw_badge(surface: pygame.Surface, text: str, x, y,
               color=COLORS['muted'], bg=COLORS['surface2']) -> None:
    """Small text badge."""
    font = get_font(11)
    rendered = font.render(text, True, color)
    pad = 4
    draw_rect(surface, x - pad, y - pad, rendered.get_width() + pad*2,
              rendered.get_height() + pad*2, bg, radius=4)
    surface.blit(rendered, (x, y))

def draw_circle(surface: pygame.Surface, cx, cy, radius,
                color=COLORS['accent']) -> None:
    """Filled circle. Use for snake segments, fruits, agents."""
    pygame.draw.circle(surface, color, (int(cx), int(cy)), max(1, int(radius)))

def draw_circle_outline(surface: pygame.Surface, cx, cy, radius,
                        color=COLORS['border'], width: int = 2) -> None:
    """Circle outline only."""
    pygame.draw.circle(surface, color, (int(cx), int(cy)),
                       max(1, int(radius)), width)

def draw_glow(surface: pygame.Surface, cx, cy, radius,
              color=COLORS['accent'], layers: int = 3) -> None:
    """
    Approximate glow using concentric transparent circles.
    Renders largest→smallest so the bright center is on top.
    Use sparingly — each call creates a temporary Surface.
    """
    glow_surf = pygame.Surface((surface.get_width(), surface.get_height()),
                                pygame.SRCALPHA)
    for i in range(layers, 0, -1):
        alpha = int(40 * (i / layers))
        r, g, b = color[:3] if len(color) == 3 else color[:3]
        glow_surf.fill((0, 0, 0, 0))
        pygame.draw.circle(glow_surf, (r, g, b, alpha),
                           (int(cx), int(cy)), int(radius + i * 4))
        surface.blit(glow_surf, (0, 0))
    pygame.draw.circle(surface, color, (int(cx), int(cy)), max(1, int(radius)))

def draw_snake(
    surface: pygame.Surface,
    segs_x, segs_y,                      # lupa sequence proxies
    radius: float,
    color,                                # RGB tuple or hex string
    head_color=None,
    scale: float = 1.0,
    offset: tuple[int, int] = (0, 0),
    hunting: bool = False,
) -> None:
    """
    Draw a complete snake (player or NPC) from segment coordinate arrays.
    `segs_x` and `segs_y` are lupa Lua sequence proxies — iterate with
    `for val in segs_x` (do NOT use len() or index directly).
    """
    if isinstance(color, str):
        color = _hex_to_rgb(color)
    hc = _hex_to_rgb(head_color) if isinstance(head_color, str) else (head_color or color)
    if hunting:
        hc = COLORS['red']

    ox, oy = offset
    r = max(2, int(radius * scale))

    xs = [ox + int(gx * scale) for gx in segs_x]
    ys = [oy + int(gy * scale) for gy in segs_y]

    if not xs:
        return

    # Draw body segments (tail → neck, so head is always on top)
    for i in range(len(xs) - 1, 0, -1):
        pygame.draw.circle(surface, color, (xs[i], ys[i]), r)

    # Draw head with head_color
    pygame.draw.circle(surface, hc, (xs[0], ys[0]), r + 1)

def draw_centered_text(surface: pygame.Surface, text: str, cx: int, y: int,
                       color=None, size: int = 14, bold: bool = False) -> None:
    """Draw text centered horizontally at cx."""
    color = color or COLORS['text']
    font = get_font(size, bold)
    rendered = font.render(str(text), True, color)
    surface.blit(rendered, (cx - rendered.get_width() // 2, int(y)))

def draw_overlay(surface: pygame.Surface, alpha: int = 160) -> None:
    """Semi-transparent black overlay. Use for modals and pause screens."""
    overlay = pygame.Surface((surface.get_width(), surface.get_height()),
                              pygame.SRCALPHA)
    overlay.fill((0, 0, 0, alpha))
    surface.blit(overlay, (0, 0))

def draw_card(surface: pygame.Surface, x, y, w, h,
              title: str, description: str, rarity: str = 'common',
              selected: bool = False) -> None:
    """
    Evolution card drawing. Rarity determines border color.
    selected: True = accent border, bright text.
    """
    rarity_colors = {
        'common': COLORS['muted'],
        'rare':   COLORS['accent'],
        'epic':   COLORS['yellow'],
    }
    border = COLORS['accent'] if selected else rarity_colors.get(rarity, COLORS['muted'])
    draw_border_rect(surface, x, y, w, h,
                     fill=COLORS['surface2'], border=border)
    title_color = COLORS['text'] if selected else COLORS['muted']
    draw_text(surface, title, x + 10, y + 10,
              color=title_color, size=13, bold=True)
    # Wrap description to fit card width
    font = get_font(11)
    words = description.split()
    line, lines = [], []
    for word in words:
        test = ' '.join(line + [word])
        if font.size(test)[0] < w - 20:
            line.append(word)
        else:
            lines.append(' '.join(line))
            line = [word]
    if line:
        lines.append(' '.join(line))
    for i, ln in enumerate(lines[:3]):
        draw_text(surface, ln, x + 10, y + 30 + i * 14,
                  color=COLORS['muted'], size=11)


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert '#rrggbb' to (r, g, b) tuple."""
    h = hex_color.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
