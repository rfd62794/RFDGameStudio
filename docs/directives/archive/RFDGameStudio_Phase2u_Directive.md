# RFDGameStudio — Phase 2u Directive: PyGame Universal Renderer

*June 2026 | Read fully before executing anything.*
*Two parts. A = base class + components extensions. B = Slither Rogue full port.*

---

> ⛔ **STOP:** Run `studio_run_tests()` → must report 70 passed, 0 failed.
> TypeScript: `cd ts && npx vitest run` → must report 35 passed, 0 failed.

---

## §0 Context

**The gap:**
`PyGameEngine` currently has drawing primitives for rectangles and text.
It has no circle drawing, no coordinate transforms, no overlay support,
no real-time game loop pattern. horse_racing only needed rect + text.
Slither Rogue needs all of the above.

**Two Port-Engine patterns in this codebase:**

| Game | Pattern | Lua role |
|---|---|---|
| horse_racing | Discrete | Called for events (create_race, simulate_race, settle_bets) |
| slither_rogue | Real-time | `tick_game(dt, input)` called every frame, owns GAME_STATE |

Both are correct. Real-time games call Lua every frame — this is the design.
The Lua VM is resident and warm. lupa handles it at 60fps without overhead.

**Arena coordinate space:**
Slither Rogue's arena is 2600×2600. The window is 1024×768.
With a 68px HUD strip, the game area is 1024×700.
Scale = `min(1024/2600, 700/2600)` = `min(0.394, 0.269)` = **0.269**.
Scaled arena: 699×699px, centered in the game area.

---

## §1 Scope

| File | Action |
|---|---|
| `renderers/pygame/components.py` | Add circle, glow, snake, overlay, centered-text utilities |
| `renderers/pygame/engine.py` | Add coordinate transform, `to_screen()`, `scale_radius()` |
| `renderers/pygame/games/slither_rogue/__init__.py` | New |
| `renderers/pygame/games/slither_rogue/renderer.py` | New — full SlitherRogueRenderer |
| `renderers/pygame/main.py` | Register slither_rogue |
| `tests/test_pygame_renderer.py` | Add 4 tests → 70→74 |

**Read-only — do not touch:**
horse_racing renderer, TypeScript files, Lua files, studio_mcp.

---

## §2 Part A — Universal Renderer Extensions

### §2.1 components.py additions

Add after the existing `draw_badge` function:

```python
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
```

### §2.2 engine.py additions

Add to `PyGameEngine.__init__` after `self.bounds = {}`:

```python
        # Coordinate transform — set by subclass for games with their own space
        # Default: 1:1 mapping, no offset (matches pixel-space games)
        self.game_scale: float = 1.0
        self.game_offset: tuple[int, int] = (0, 0)
```

Add to `PyGameEngine` class body (after the `lua` method):

```python
    def to_screen(self, gx: float, gy: float) -> tuple[int, int]:
        """Convert game-space coordinates to screen pixels."""
        sx = int(gx * self.game_scale + self.game_offset[0])
        sy = int(gy * self.game_scale + self.game_offset[1])
        return sx, sy

    def scale_radius(self, r: float) -> int:
        """Scale a game-space radius to screen space. Minimum 2px."""
        return max(2, int(r * self.game_scale))
```

---

## §3 Part B — Slither Rogue PyGame Renderer

### §3.1 Architecture

Slither Rogue uses the **real-time Port-Engine pattern**:
- `init_game(config)` — called once when the game starts (Lua call)
- `tick_game(dt, input)` — called every frame (Lua call, owns GAME_STATE)
- Returns flat render state: player, npcs, fruits, acid_drops, events, score, time_left

The renderer manages three screens: `menu`, `game`, `gameover`.
Evolution overlay is a fourth visual state (game paused, overlay shown).

### §3.2 renderers/pygame/games/slither_rogue/renderer.py

```python
"""
SlitherRogueRenderer — Slither Rogue PyGame Port-Engine.

Real-time pattern: tick_game(dt, input) called every frame.
Lua VM stays resident and owns GAME_STATE throughout the run.
"""
from __future__ import annotations
import sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

import pygame
from renderers.pygame.engine import PyGameEngine
from renderers.pygame.components import (
    draw_rect, draw_border_rect, draw_text, draw_circle, draw_circle_outline,
    draw_snake, draw_centered_text, draw_overlay, draw_card, draw_stat_bar,
    draw_badge, _hex_to_rgb,
)
from renderers.pygame.colors import COLORS


HUD_H = 68          # pixels reserved for HUD strip at top


class SlitherRogueRenderer(PyGameEngine):

    def __init__(self, width: int = 1024, height: int = 768):
        super().__init__('slither_rogue', width, height)
        pygame.display.set_caption('Snake Roguelike — PyGame Port')

        # Load arena config
        data = self.session.files.data or {}
        arena = data.get('arena', {})
        self.arena_w = float(arena.get('map_width',  2600))
        self.arena_h = float(arena.get('map_height', 2600))
        self.fruits_per_level = int(
            (data.get('evolution') or {}).get('fruits_per_level', 3)
        )
        self.cards_offered = int(
            (data.get('evolution') or {}).get('cards_offered', 3)
        )
        self.presets = list(data.get('player_presets', []))
        self.durations = list(data.get('run_durations', [
            {'label': '5 Mins', 'seconds': 300, 'sub': 'Standard'}
        ]))

        # Coordinate transform: scale arena to fit game area
        game_area_h = height - HUD_H
        self.game_scale = min(width / self.arena_w, game_area_h / self.arena_h)
        self.game_offset = (
            int((width  - self.arena_w * self.game_scale) // 2),
            int(HUD_H + (game_area_h - self.arena_h * self.game_scale) // 2),
        )

        # Screens
        self.screen_state: str = 'menu'

        # Menu selections
        self.preset_idx: int = 0
        self.duration_idx: int = 1   # default: 5 Mins
        self.menu_cursor: int = 0    # 0=preset, 1=duration

        # Input
        self.keys_held: set[int] = set()

        # Active game state
        self.render_state: dict = {}
        self.fruits_eaten: int = 0
        self.active_evolutions: dict[str, int] = {}
        self.evolution_pool: list[dict] = []
        self.showing_evolution: bool = False
        self.evolution_cursor: int = 0

        # Game over state
        self.final_score: int = 0
        self.final_peak: int = 5
        self.final_evolutions: int = 0

    # ── Input ──────────────────────────────────────────────────────────────

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type == pygame.KEYDOWN:
            self.keys_held.add(event.key)
            self._handle_key_down(event.key)
        elif event.type == pygame.KEYUP:
            self.keys_held.discard(event.key)

    def _handle_key_down(self, key: int) -> None:
        if self.screen_state == 'menu':
            self._menu_key(key)
        elif self.screen_state == 'game' and self.showing_evolution:
            self._evolution_key(key)
        elif self.screen_state == 'gameover':
            if key == pygame.K_r:
                self._start_game()
            elif key == pygame.K_ESCAPE:
                self.screen_state = 'menu'

    def _menu_key(self, key: int) -> None:
        if key == pygame.K_UP:
            self.menu_cursor = max(0, self.menu_cursor - 1)
        elif key == pygame.K_DOWN:
            self.menu_cursor = min(1, self.menu_cursor + 1)
        elif key == pygame.K_LEFT:
            if self.menu_cursor == 0:
                self.preset_idx = (self.preset_idx - 1) % len(self.presets)
            else:
                self.duration_idx = (self.duration_idx - 1) % len(self.durations)
        elif key == pygame.K_RIGHT:
            if self.menu_cursor == 0:
                self.preset_idx = (self.preset_idx + 1) % len(self.presets)
            else:
                self.duration_idx = (self.duration_idx + 1) % len(self.durations)
        elif key in (pygame.K_RETURN, pygame.K_SPACE):
            self._start_game()

    def _evolution_key(self, key: int) -> None:
        n = len(self.evolution_pool)
        if key == pygame.K_1 and n >= 1:
            self._pick_evolution(0)
        elif key == pygame.K_2 and n >= 2:
            self._pick_evolution(1)
        elif key == pygame.K_3 and n >= 3:
            self._pick_evolution(2)
        elif key == pygame.K_LEFT:
            self.evolution_cursor = max(0, self.evolution_cursor - 1)
        elif key == pygame.K_RIGHT:
            self.evolution_cursor = min(n - 1, self.evolution_cursor + 1)
        elif key == pygame.K_RETURN:
            self._pick_evolution(self.evolution_cursor)

    # ── Game Lifecycle ──────────────────────────────────────────────────────

    def _start_game(self) -> None:
        data = self.session.files.data or {}
        preset = dict(self.presets[self.preset_idx]) if self.presets else {}
        duration_entry = dict(self.durations[self.duration_idx])
        duration = int(duration_entry.get('seconds', 300))

        config = {
            'arena':            data.get('arena', {}),
            'fruit':            data.get('fruit', {}),
            'player_stats':     data.get('player_stats', {}),
            'player_preset':    preset,
            'npc_profiles':     data.get('npc_profiles', []),
            'npc_stats':        data.get('npc_stats', {}),
            'evolution_cards':  data.get('evolution_cards', []),
            'active_evolutions': {},
            'game_duration':    duration,
        }

        self.session.executor.call('init_game', config)

        self.fruits_eaten = 0
        self.active_evolutions = {}
        self.evolution_pool = []
        self.showing_evolution = False
        self.evolution_cursor = 0
        self.render_state = {}
        self.keys_held.clear()
        self.screen_state = 'game'

    def _trigger_evolution(self) -> None:
        data = self.session.files.data or {}
        pool_raw = self.session.executor.call(
            'select_evolution_pool',
            data.get('evolution_cards', []),
            self.cards_offered,
        )
        cards = []
        if pool_raw:
            for c in pool_raw:
                cd = dict(c)
                cards.append({
                    'id':          cd.get('id', ''),
                    'title':       cd.get('title', ''),
                    'description': cd.get('description', ''),
                    'rarity':      cd.get('rarity', 'common'),
                })
        self.evolution_pool = cards
        self.evolution_cursor = 0
        self.showing_evolution = True

    def _pick_evolution(self, idx: int) -> None:
        if idx >= len(self.evolution_pool):
            return
        card = self.evolution_pool[idx]
        card_id = card['id']
        self.active_evolutions[card_id] = self.active_evolutions.get(card_id, 0) + 1

        # Apply to Lua GAME_STATE
        self.session.executor.call('update_evolution_effects', self.active_evolutions)

        self.evolution_pool = []
        self.showing_evolution = False
        self.fruits_eaten = 0

    def _build_input(self) -> dict:
        keys: dict[str, bool] = {}
        if pygame.K_w in self.keys_held or pygame.K_UP in self.keys_held:
            keys['w'] = True
        if pygame.K_s in self.keys_held or pygame.K_DOWN in self.keys_held:
            keys['s'] = True
        if pygame.K_a in self.keys_held or pygame.K_LEFT in self.keys_held:
            keys['a'] = True
        if pygame.K_d in self.keys_held or pygame.K_RIGHT in self.keys_held:
            keys['d'] = True
        return {'control_type': 'keyboard', 'mouse_x': 0, 'mouse_y': 0, 'keys': keys}

    # ── Update ─────────────────────────────────────────────────────────────

    def update(self, dt: float) -> None:
        if self.screen_state != 'game' or self.showing_evolution:
            return

        input_state = self._build_input()
        raw = self.session.executor.call('tick_game', dt, input_state)
        if not raw:
            return
        self.render_state = dict(raw)
        self._process_events(self.render_state.get('events') or [])

    def _process_events(self, events) -> None:
        for ev_raw in events:
            ev = dict(ev_raw) if ev_raw else {}
            etype = ev.get('type')

            if etype == 'fruit_eaten':
                self.fruits_eaten += 1
                if self.fruits_eaten >= self.fruits_per_level:
                    self._trigger_evolution()

            elif etype == 'game_over':
                st = self.render_state
                self.final_score    = int(st.get('score', 0))
                self.final_peak     = int(st.get('peak_length', 5))
                self.final_evolutions = sum(self.active_evolutions.values())
                self.screen_state = 'gameover'

    # ── Rendering ──────────────────────────────────────────────────────────

    def render(self) -> None:
        if   self.screen_state == 'menu':    self._render_menu()
        elif self.screen_state == 'game':    self._render_game()
        elif self.screen_state == 'gameover': self._render_gameover()

    # ── Menu ───────────────────────────────────────────────────────────────

    def _render_menu(self) -> None:
        cx = self.width // 2

        draw_centered_text(self.screen, 'SNAKE ROGUELIKE',
                           cx, 80, COLORS['text'], 32, bold=True)
        draw_centered_text(self.screen, 'v1.0  ·  RFDGameStudio',
                           cx, 118, COLORS['muted'], 12)

        # Preset selector
        preset = dict(self.presets[self.preset_idx]) if self.presets else {}
        preset_name = preset.get('name', 'Default')
        preset_color_hex = preset.get('color', '#14b8a6')
        preset_rgb = _hex_to_rgb(preset_color_hex)
        is_sel = self.menu_cursor == 0
        draw_border_rect(self.screen, cx - 200, 180, 400, 60,
                         fill=COLORS['surface2'] if is_sel else COLORS['surface'],
                         border=COLORS['accent'] if is_sel else COLORS['border'])
        draw_centered_text(self.screen, 'SNAKE COLOR', cx, 188,
                           COLORS['muted'], 10)
        draw_circle(self.screen, cx - 100, 210, 14, preset_rgb)
        draw_centered_text(self.screen, f'← {preset_name} →',
                           cx, 203, COLORS['text'], 14, bold=True)

        # Duration selector
        dur = dict(self.durations[self.duration_idx])
        dur_label = dur.get('label', '5 Mins')
        is_sel2 = self.menu_cursor == 1
        draw_border_rect(self.screen, cx - 200, 260, 400, 60,
                         fill=COLORS['surface2'] if is_sel2 else COLORS['surface'],
                         border=COLORS['accent'] if is_sel2 else COLORS['border'])
        draw_centered_text(self.screen, 'RUN DURATION', cx, 268,
                           COLORS['muted'], 10)
        draw_centered_text(self.screen, f'← {dur_label} →',
                           cx, 283, COLORS['text'], 14, bold=True)

        # Controls hint
        draw_centered_text(self.screen, '↑↓ Navigate   ←→ Change   ENTER Start',
                           cx, 350, COLORS['muted'], 11)
        draw_centered_text(self.screen, 'In-game: WASD to steer',
                           cx, 370, COLORS['muted'], 11)

    # ── Game Screen ────────────────────────────────────────────────────────

    def _render_game(self) -> None:
        self._render_hud()
        self._render_arena()
        if self.showing_evolution:
            self._render_evolution_overlay()

    def _render_hud(self) -> None:
        st = self.render_state
        score     = int(st.get('score', 0))
        time_left = float(st.get('time_left', 0))
        peak      = int(st.get('peak_length', 5))
        evos      = sum(self.active_evolutions.values())

        draw_border_rect(self.screen, 0, 0, self.width, HUD_H,
                         fill=COLORS['surface'], border=COLORS['border'], radius=0)

        # Score
        draw_text(self.screen, 'SCORE', 20, 10, COLORS['muted'], 9)
        draw_text(self.screen, str(score), 20, 22, COLORS['accent'], 18, bold=True)

        # Time
        mins = int(time_left) // 60
        secs = int(time_left) % 60
        draw_text(self.screen, 'TIME', 140, 10, COLORS['muted'], 9)
        col = COLORS['red'] if time_left < 30 else COLORS['text']
        draw_text(self.screen, f'{mins}:{secs:02d}', 140, 22, col, 18, bold=True)

        # Peak length
        draw_text(self.screen, 'PEAK', 260, 10, COLORS['muted'], 9)
        draw_text(self.screen, str(peak), 260, 22, COLORS['text'], 18, bold=True)

        # Evolution progress bar
        evo_x = 360
        draw_text(self.screen, 'EVO PROGRESS', evo_x, 10, COLORS['muted'], 9)
        draw_stat_bar(self.screen, evo_x, 24, 200, 12,
                      self.fruits_eaten, self.fruits_per_level,
                      fill_color=COLORS['green'])
        draw_text(self.screen, f'{self.fruits_eaten}/{self.fruits_per_level}',
                  evo_x + 208, 24, COLORS['muted'], 10)

        # Evolutions count
        draw_text(self.screen, 'EVOS', 600, 10, COLORS['muted'], 9)
        draw_text(self.screen, str(evos), 600, 22, COLORS['yellow'], 18, bold=True)

        # Active evolution badges (compact)
        bx = 660
        for eid, lvl in self.active_evolutions.items():
            if lvl > 0:
                draw_badge(self.screen, f'{eid[:4].upper()} L{lvl}',
                           bx, 28, color=COLORS['accent'])
                bx += 70
                if bx > self.width - 80:
                    break

    def _render_arena(self) -> None:
        st = self.render_state
        ox, oy = self.game_offset
        sc = self.game_scale
        aw = int(self.arena_w * sc)
        ah = int(self.arena_h * sc)

        # Arena background
        pygame.draw.rect(self.screen, COLORS['surface2'],
                         (ox, oy, aw, ah))
        # Arena border
        pygame.draw.rect(self.screen, COLORS['border'],
                         (ox, oy, aw, ah), 2)

        # Fruits
        for f_raw in (st.get('fruits') or []):
            f = dict(f_raw)
            sx, sy = self.to_screen(float(f.get('x', 0)), float(f.get('y', 0)))
            r = max(3, int(5 * sc))
            col = _hex_to_rgb(f.get('color', '#10b981'))
            pygame.draw.circle(self.screen, col, (sx, sy), r)
            if f.get('is_golden'):
                pygame.draw.circle(self.screen, COLORS['yellow'], (sx, sy), r, 1)

        # Acid drops
        acid_col = (52, 211, 153, 140)  # semi-transparent green
        for ad_raw in (st.get('acid_drops') or []):
            ad = dict(ad_raw)
            sx, sy = self.to_screen(float(ad.get('x', 0)), float(ad.get('y', 0)))
            r = max(2, int(float(ad.get('radius', 8)) * sc))
            acid_surf = pygame.Surface((r*2+4, r*2+4), pygame.SRCALPHA)
            pygame.draw.circle(acid_surf, acid_col, (r+2, r+2), r)
            self.screen.blit(acid_surf, (sx - r - 2, sy - r - 2))

        # NPCs
        for npc_raw in (st.get('npcs') or []):
            npc = dict(npc_raw)
            if not npc.get('segs_x'):
                continue
            hunting = bool(npc.get('hunting', False))
            npc_r = float(npc.get('radius', 11))
            draw_snake(
                self.screen,
                npc.get('segs_x'), npc.get('segs_y'),
                npc_r,
                npc.get('color', '#ef4444'),
                npc.get('head_color'),
                scale=sc,
                offset=(ox, oy),
                hunting=hunting,
            )

        # Player
        player = dict(st.get('player') or {})
        if player.get('segs_x'):
            draw_snake(
                self.screen,
                player.get('segs_x'), player.get('segs_y'),
                float(player.get('radius', 11)),
                player.get('color', '#14b8a6'),
                player.get('head_color', '#06b6d4'),
                scale=sc,
                offset=(ox, oy),
                hunting=False,
            )
            # Shield indicator on head
            if player.get('shield_charges', 0):
                segs_x = list(player['segs_x'])
                segs_y = list(player['segs_y'])
                if segs_x:
                    hx, hy = self.to_screen(segs_x[0], segs_y[0])
                    r = self.scale_radius(float(player.get('radius', 11)))
                    pygame.draw.circle(self.screen, COLORS['accent'],
                                       (hx, hy), r + 3, 2)

    def _render_evolution_overlay(self) -> None:
        draw_overlay(self.screen, 180)

        cx = self.width // 2
        draw_centered_text(self.screen, 'EVOLUTION UNLOCKED',
                           cx, 60, COLORS['yellow'], 22, bold=True)
        draw_centered_text(self.screen, 'Choose your adaptation:',
                           cx, 92, COLORS['muted'], 12)

        card_w, card_h = 260, 120
        n = len(self.evolution_pool)
        total_w = n * card_w + (n - 1) * 20
        start_x = cx - total_w // 2

        for i, card in enumerate(self.evolution_pool):
            cx_card = start_x + i * (card_w + 20)
            selected = (i == self.evolution_cursor)
            draw_card(self.screen, cx_card, 140, card_w, card_h,
                      card.get('title', ''),
                      card.get('description', ''),
                      card.get('rarity', 'common'),
                      selected=selected)
            key_hint = str(i + 1)
            draw_centered_text(self.screen, f'[{key_hint}]',
                               cx_card + card_w // 2, 270,
                               COLORS['accent'] if selected else COLORS['muted'], 13)

        draw_centered_text(self.screen,
                           '←→ Navigate   1/2/3 Select   ENTER Confirm',
                           cx, 310, COLORS['muted'], 11)

    # ── Game Over ──────────────────────────────────────────────────────────

    def _render_gameover(self) -> None:
        data = self.session.files.data or {}
        thresholds = list(data.get('grade_thresholds', []))

        # Determine grade
        grade_title = 'Newborn Hatchling'
        grade_desc  = 'Survival is tough.'
        for th_raw in thresholds:
            th = dict(th_raw)
            if self.final_score >= int(th.get('min_score', 0)):
                grade_title = th.get('title', grade_title)
                grade_desc  = th.get('description', grade_desc)
                break

        cx = self.width // 2
        draw_centered_text(self.screen, 'RUN COMPLETE',
                           cx, 80, COLORS['accent'], 28, bold=True)
        draw_centered_text(self.screen, grade_title,
                           cx, 120, COLORS['yellow'], 20, bold=True)
        draw_centered_text(self.screen, grade_desc,
                           cx, 148, COLORS['muted'], 12)

        # Stats
        for i, (label, value) in enumerate([
            ('FINAL SCORE',       str(self.final_score)),
            ('PEAK LENGTH',       str(self.final_peak)),
            ('EVOLUTIONS TAKEN',  str(self.final_evolutions)),
        ]):
            y = 200 + i * 48
            draw_border_rect(self.screen, cx - 160, y, 320, 36,
                             fill=COLORS['surface'], border=COLORS['border'])
            draw_text(self.screen, label,  cx - 150, y + 4,  COLORS['muted'], 10)
            draw_text(self.screen, value,  cx - 150, y + 18, COLORS['text'],  16, bold=True)

        draw_centered_text(self.screen, 'R = Restart   ESC = Main Menu',
                           cx, 370, COLORS['muted'], 12)
```

---

## §4 Register in main.py

```python
AVAILABLE_GAMES = {
    'horse_racing':  'renderers.pygame.games.horse_racing.renderer.HorseRacingRenderer',
    'slither_rogue': 'renderers.pygame.games.slither_rogue.renderer.SlitherRogueRenderer',
}
```

---

## §5 New Python Tests (70→74)

Add to `tests/test_pygame_renderer.py`:

```python
def test_slither_rogue_pygame_renderer_initializes() -> None:
    """SlitherRogueRenderer loads session and computes coordinate transform."""
    from renderers.pygame.games.slither_rogue.renderer import SlitherRogueRenderer
    r = SlitherRogueRenderer()
    assert r.session is not None
    assert r.session.gameId == 'slither_rogue'
    assert r.game_scale > 0
    assert r.arena_w == 2600

def test_slither_rogue_pygame_arena_scale() -> None:
    """Scale fits 2600×2600 arena into 1024×700 game area."""
    from renderers.pygame.games.slither_rogue.renderer import SlitherRogueRenderer
    r = SlitherRogueRenderer()
    # Scaled arena must fit within window
    assert r.arena_w * r.game_scale <= r.width + 1
    assert r.arena_h * r.game_scale <= (r.height - 68) + 1

def test_slither_rogue_pygame_start_game_no_crash() -> None:
    """_start_game() calls init_game in Lua without error."""
    from renderers.pygame.games.slither_rogue.renderer import SlitherRogueRenderer
    r = SlitherRogueRenderer()
    r._start_game()
    assert r.screen_state == 'game'
    assert r.fruits_eaten == 0

def test_slither_rogue_pygame_tick_returns_render_state() -> None:
    """After _start_game(), update() produces a non-empty render_state."""
    from renderers.pygame.games.slither_rogue.renderer import SlitherRogueRenderer
    r = SlitherRogueRenderer()
    r._start_game()
    r.update(0.016)
    assert r.render_state is not None
    assert 'player' in r.render_state
    assert 'npcs' in r.render_state
```

---

## §6 Completion Criteria

- [ ] `studio_run_tests()` → **74 passed, 0 failed**
- [ ] `cd ts && npx vitest run` → 35 passed (unchanged)
- [ ] `uv run python renderers/pygame/main.py slither_rogue` — game launches
- [ ] Menu screen shows preset selector and duration selector
- [ ] ←→ on preset cycles snake colors (circle preview updates)
- [ ] ENTER starts game — arena renders with player and NPCs
- [ ] WASD controls player snake
- [ ] After 3 fruits eaten — evolution overlay appears with 3 cards
- [ ] 1/2/3 or ENTER selects card — game resumes
- [ ] NPCs with more segments than player have red heads (hunting mode)
- [ ] Game over screen shows score, peak length, grade title
- [ ] R restarts, ESC returns to menu
- [ ] `uv run python renderers/pygame/main.py horse_racing` still works
- [ ] `grep -rn "tick_game\|init_game" renderers/pygame/games/slither_rogue/` →
      `init_game` appears once (_start_game), `tick_game` appears once (update)
- [ ] `docs/state/current.md` updated to Phase 2u certified

---

## §7 Quick Reference

| Item | Value |
|---|---|
| Python floor | 70 → 74 / 0 / 0 |
| TypeScript floor | 35 / 0 / 0 (unchanged) |
| Arena size | 2600 × 2600 |
| Window size | 1024 × 768 |
| HUD height | 68px |
| Game area | 1024 × 700 |
| Scale factor | min(1024/2600, 700/2600) ≈ 0.269 |
| Lua: init_game | Called once in _start_game() |
| Lua: tick_game | Called every frame in update(dt) |
| Lua: select_evolution_pool | Called when fruits_eaten hits limit |
| Lua: update_evolution_effects | Called when evolution card chosen |
| New components | draw_circle, draw_snake, draw_glow, draw_card, draw_overlay, draw_centered_text |
| New engine methods | to_screen(), scale_radius(), game_scale, game_offset |

---

*RFDGameStudio Phase 2u | June 2026 | RFD IT Services Ltd.*
*Two Port-Engine patterns proven. Discrete events. Real-time tick.*
*Same Lua. Same four files. Three renderers.*
