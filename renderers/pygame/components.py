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
