"""
HorseRacingRenderer — horse_racing PyGame Port-Engine.

Port-Engine model:
  - Python-native state (HorseRacingState)
  - Lua called for: create_race, simulate_race, settle_bets, generate_horse
  - Layout bounds from resolver.py via PyGameEngine.bounds
  - Rendering: components.py drawing utilities + layout bounds
"""
from __future__ import annotations
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

import pygame
from renderers.pygame.engine import PyGameEngine
from renderers.pygame.components import (
    draw_rect, draw_border_rect, draw_text, draw_stat_bar, draw_badge
)
from renderers.pygame.colors import COLORS
from .state import HorseRacingState, init_state_from_session


class HorseRacingRenderer(PyGameEngine):

    def __init__(self, width: int = 1024, height: int = 768):
        super().__init__('horse_racing', width, height)
        pygame.display.set_caption('Derby Sim — PyGame Port')
        self.state: HorseRacingState = init_state_from_session(self.session)

    # ── Input ──────────────────────────────────────────────────────────────

    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type != pygame.KEYDOWN:
            return

        key = event.key
        state = self.state

        if key == pygame.K_1:
            state.active_tab = 'stable'
        elif key == pygame.K_2:
            state.active_tab = 'betting'
        elif key == pygame.K_3:
            state.active_tab = 'history'
        elif key == pygame.K_UP:
            state.selected_horse_idx = max(0, state.selected_horse_idx - 1)
        elif key == pygame.K_DOWN:
            state.selected_horse_idx = min(
                len(state.horses) - 1, state.selected_horse_idx + 1
            )
        elif key == pygame.K_r and state.active_tab == 'betting':
            self._run_race()

    # ── Game Logic (Lua discrete events) ───────────────────────────────────

    def _run_race(self) -> None:
        if not self.state.horses:
            self.state.message = 'No horses available.'
            return

        idx = min(self.state.selected_horse_idx, len(self.state.horses) - 1)
        horse = self.state.horses[idx]
        data = self.session.files.data or {}

        try:
            participants = self.lua('create_race', horse, data)
            if not participants:
                self.state.message = 'Failed to create race.'
                return

            race_classes = data.get('race_classes', [{}])
            race_class = race_classes[0] if race_classes else {}

            results = self.lua('simulate_race', participants, race_class)
            if results:
                result_list = list(results) if hasattr(results, '__iter__') else []
                self.state.race_results = result_list
                self.state.race_history.append({
                    'horse': horse.get('name', 'Unknown'),
                    'results': result_list,
                })
                # Apply cooldown to raced horse
                import time
                if isinstance(horse, dict):
                    cd = data.get('stable', {}).get('race_cooldown_seconds', 60)
                    horse['cooldown_until'] = int(time.time() * 1000) + cd * 1000
                self.state.message = f'Race complete. Check history.'
        except Exception as e:
            self.state.message = f'Race error: {e}'

    # ── Rendering ──────────────────────────────────────────────────────────

    def render(self) -> None:
        b = self.bounds
        if 'header'  in b: self._render_header(b['header'])
        if 'tab_nav' in b: self._render_tab_nav(b['tab_nav'])
        if 'content' in b: self._render_content(b['content'])
        if 'footer'  in b: self._render_footer(b['footer'])

    def _render_header(self, b) -> None:
        draw_border_rect(self.screen, b.x, b.y, b.w, b.h,
                         fill=COLORS['surface'], border=COLORS['border'], radius=0)
        draw_text(self.screen, 'DERBY SIM', b.x + 20, b.y + b.h//2 - 10,
                  color=COLORS['text'], size=18, bold=True)
        funds_str = f'${self.state.funds:,}'
        draw_text(self.screen, 'STABLE BANK', b.x + b.w - 160, b.y + 8,
                  color=COLORS['muted'], size=10)
        draw_text(self.screen, funds_str, b.x + b.w - 160, b.y + 22,
                  color=COLORS['green'], size=15, bold=True)

    def _render_tab_nav(self, b) -> None:
        tabs = [('1 Stable', 'stable'), ('2 Betting', 'betting'), ('3 History', 'history')]
        tab_w = b.w // len(tabs)
        for i, (label, tab_id) in enumerate(tabs):
            tx = b.x + i * tab_w
            is_active = self.state.active_tab == tab_id
            fill = COLORS['surface2'] if is_active else COLORS['surface']
            border = COLORS['accent'] if is_active else COLORS['border']
            draw_border_rect(self.screen, tx, b.y, tab_w, b.h,
                             fill=fill, border=border, radius=0)
            color = COLORS['accent'] if is_active else COLORS['muted']
            draw_text(self.screen, label, tx + 12, b.y + b.h//2 - 7,
                      color=color, size=12, bold=is_active)

    def _render_content(self, b) -> None:
        draw_rect(self.screen, b.x, b.y, b.w, b.h, COLORS['bg'], radius=0)
        tab = self.state.active_tab
        if tab == 'stable':   self._render_stable(b)
        elif tab == 'betting': self._render_betting(b)
        elif tab == 'history': self._render_history(b)

    def _render_stable(self, b) -> None:
        if not self.state.horses:
            draw_text(self.screen, 'No horses in stable.', b.x + 20, b.y + 20,
                      color=COLORS['muted'])
            return

        card_h = 110
        pad = 12
        for i, horse in enumerate(self.state.horses):
            cy = b.y + pad + i * (card_h + pad)
            if cy + card_h > b.y + b.h:
                break
            is_selected = (i == self.state.selected_horse_idx)
            border = COLORS['accent'] if is_selected else COLORS['border']
            draw_border_rect(self.screen, b.x + pad, cy, b.w - pad*2, card_h,
                             fill=COLORS['surface'], border=border)

            name = horse.get('name', 'Unknown')
            gen  = horse.get('generation', 1)
            gender = horse.get('gender', '')
            draw_text(self.screen, name, b.x + pad + 12, cy + 10,
                      size=14, bold=True)
            draw_text(self.screen, f'GEN {gen}  {gender}',
                      b.x + pad + 12, cy + 28, color=COLORS['muted'], size=11)

            # Stat bars
            stats = [
                ('Speed',    horse.get('speed', 0)),
                ('Stamina',  horse.get('stamina', 0)),
                ('Accel',    horse.get('acceleration', 0)),
            ]
            for j, (label, val) in enumerate(stats):
                sx = b.x + pad + 12
                sy = cy + 50 + j * 16
                draw_text(self.screen, label, sx, sy, color=COLORS['muted'], size=10)
                draw_stat_bar(self.screen, sx + 60, sy + 1, 160, 10,
                              val, 100, fill_color=COLORS['accent'])

    def _render_betting(self, b) -> None:
        draw_text(self.screen, 'BETTING OFFICE', b.x + 20, b.y + 16,
                  size=14, bold=True)
        if self.state.horses:
            idx = self.state.selected_horse_idx
            h = self.state.horses[idx]
            draw_text(self.screen, f"Racer: {h.get('name', '?')}",
                      b.x + 20, b.y + 44, color=COLORS['accent'], size=13)
        draw_text(self.screen,
                  'Press R to run a race  |  UP/DOWN to choose racer',
                  b.x + 20, b.y + 70, color=COLORS['muted'], size=11)

        if self.state.race_results:
            draw_text(self.screen, 'Last Race Results:', b.x + 20, b.y + 100,
                      size=12, bold=True)
            for i, result in enumerate(self.state.race_results[:5]):
                if isinstance(result, dict):
                    rank = result.get('rank', i+1)
                    horse_name = result.get('horse_name', '?')
                    draw_text(self.screen, f'#{rank}  {horse_name}',
                              b.x + 20, b.y + 120 + i * 20,
                              color=COLORS['text'], size=11)

        draw_text(self.screen, self.state.message, b.x + 20, b.y + b.h - 30,
                  color=COLORS['muted'], size=11)

    def _render_history(self, b) -> None:
        if not self.state.race_history:
            draw_text(self.screen, 'No races completed yet.',
                      b.x + 20, b.y + 20, color=COLORS['muted'])
            return

        draw_text(self.screen, 'RACE HISTORY', b.x + 20, b.y + 16,
                  size=14, bold=True)
        for i, entry in enumerate(reversed(self.state.race_history[-8:])):
            ey = b.y + 44 + i * 24
            horse = entry.get('horse', '?')
            draw_text(self.screen, f'Race {len(self.state.race_history) - i}: {horse}',
                      b.x + 20, ey, color=COLORS['text'], size=12)

    def _render_footer(self, b) -> None:
        draw_border_rect(self.screen, b.x, b.y, b.w, b.h,
                         fill=COLORS['surface'], border=COLORS['border'], radius=0)
        draw_text(self.screen, '© 2026 DERBY SIM — RFD IT Services  |  PyGame Port',
                  b.x + 20, b.y + b.h//2 - 7, color=COLORS['muted'], size=10)
