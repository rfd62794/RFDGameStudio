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
