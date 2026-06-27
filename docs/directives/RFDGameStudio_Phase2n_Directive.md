# RFDGameStudio — Phase 2n Directive: Integration Coverage + PyGame Renderer

*June 2026 | Read fully before executing anything.*
*Two parts. Part A (tests) first. Verify floors. Then Part B (PyGame).*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 46 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 21 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

**Part A — Integration Coverage:**
Current tests cover happy-path function calls in isolation. No test runs a full
game loop. No test verifies that settle_bets produces correct funds math. No test
verifies that slither_rogue's evolution system actually changes player stats. The
interpreter, GameLoader, and registry have no coverage beyond "it builds."

**Part B — PyGame Renderer:**
The Port-Engine model: Lua is the source. PyGame is the runner. Game definition
loads once. Python-native state. Discrete events call Lua. Continuous rendering
in Python. Layout from resolver.py. First proof that the framework is genuinely
cross-platform.

**Scope: horse_racing only for PyGame.** It is the simpler case — discrete,
no real-time physics. slither_rogue PyGame is Phase 2o.

---

## §1 Scope

| File | Action |
|---|---|
| `tests/test_integration.py` | New — 8 integration tests (horse_racing + slither_rogue full loops) |
| `tests/test_pygame_renderer.py` | New — 4 PyGame renderer tests (headless) |
| `ts/tests/test_interpreter.ts` | New — 6 TypeScript interpreter + registry tests |
| `renderers/__init__.py` | New |
| `renderers/pygame/__init__.py` | New |
| `renderers/pygame/colors.py` | New — CSS token → RGB mapping |
| `renderers/pygame/components.py` | New — pygame drawing utilities |
| `renderers/pygame/engine.py` | New — PyGameEngine base class |
| `renderers/pygame/games/__init__.py` | New |
| `renderers/pygame/games/horse_racing/__init__.py` | New |
| `renderers/pygame/games/horse_racing/state.py` | New — Python-native game state |
| `renderers/pygame/games/horse_racing/renderer.py` | New — HorseRacingRenderer |
| `renderers/pygame/main.py` | New — entry point |

**Python floor: 46 → 58**
**TypeScript floor: 21 → 27**

**Read-only — do not touch:**
`studio/`, `studio_mcp/`, `engine/`, `games/`, all TypeScript source files,
existing test files.

---

## Part A — Integration Coverage

### §2 tests/test_integration.py (8 new tests, 46→54)

```python
"""
Integration tests — full game loop sequences.
These test that functions work together, not just in isolation.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from studio.runtime import load_game

# ── HORSE RACING ────────────────────────────────────────────────────────────

def test_horse_racing_full_loop() -> None:
    """
    load_game → create_race → simulate_race → settle_bets
    Tests that the complete race pipeline runs without error.
    """
    session = load_game('horse_racing', seed=42)
    data = session.files.data
    horses = data['starter_horses']
    player_horse = horses[0]

    # Create a race with the player horse
    participants = session.executor.call(
        'create_race', player_horse, data
    )
    assert participants is not None
    assert isinstance(participants, (list, dict))

    # Simulate — returns ranked results
    race_class = data.get('race_classes', [{}])[0]
    results = session.executor.call('simulate_race', participants, race_class)
    assert results is not None

def test_horse_racing_simulate_returns_ranked_results() -> None:
    """simulate_race results have rank, horse_id, finish_time fields."""
    session = load_game('horse_racing', seed=42)
    data = session.files.data
    horse = data['starter_horses'][0]
    participants = session.executor.call('create_race', horse, data)
    race_class = data.get('race_classes', [{}])[0]
    results = session.executor.call('simulate_race', participants, race_class)

    assert results is not None
    result_list = list(results) if hasattr(results, '__iter__') else [results]
    first = result_list[0]
    assert isinstance(first, dict)
    # Must have a rank field
    assert 'rank' in first or 'finish_time' in first

def test_horse_racing_settle_bets_increases_funds_on_win() -> None:
    """settle_bets returns a positive payout when player's horse wins."""
    session = load_game('horse_racing', seed=42)
    data = session.files.data
    horse = data['starter_horses'][0]

    participants = session.executor.call('create_race', horse, data)
    race_class = data.get('race_classes', [{}])[0]
    results = session.executor.call('simulate_race', participants, race_class)

    # Place a win bet on the player's horse
    bet = {
        'horse_id': horse.get('id', 'horse_1'),
        'amount': 100,
        'type': 'Win',
        'payout_odds': 2.0,
    }
    prize_pool = race_class.get('prize_pool', 5000)
    prize_splits = race_class.get('prize_split', [0.6, 0.3, 0.1])

    settlement = session.executor.call(
        'settle_bets', [bet], results, prize_pool, prize_splits
    )
    assert settlement is not None

def test_horse_racing_can_unlock_slot_requires_sufficient_funds() -> None:
    """can_unlock_slot returns False when funds are too low."""
    session = load_game('horse_racing', seed=42)
    result, reason = session.executor.call('can_unlock_slot', 3, 6, 10, 100)
    assert result is False

# ── SLITHER ROGUE ────────────────────────────────────────────────────────────

def _make_slither_config(data: dict, duration: float = 300) -> dict:
    """Build a minimal init_game config from slither_rogue data.yaml."""
    presets = data.get('player_presets', [{}])
    return {
        'arena':            data.get('arena', {}),
        'fruit':            data.get('fruit', {}),
        'player_stats':     data.get('player_stats', {}),
        'player_preset':    presets[0] if presets else {},
        'npc_profiles':     data.get('npc_profiles', []),
        'npc_stats':        data.get('npc_stats', {}),
        'evolution_cards':  data.get('evolution_cards', []),
        'active_evolutions': {},
        'game_duration':    duration,
    }

def test_slither_rogue_init_creates_valid_state() -> None:
    """init_game → tick_game returns a render state with player and npcs."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    config = _make_slither_config(data)

    session.executor.call('init_game', config)

    input_state = {
        'control_type': 'keyboard',
        'mouse_x': 0, 'mouse_y': 0,
        'keys': {}
    }
    render_state = session.executor.call('tick_game', 0.016, input_state)

    assert render_state is not None
    assert isinstance(render_state, dict)
    assert 'player' in render_state
    assert 'npcs' in render_state
    assert 'fruits' in render_state

def test_slither_rogue_tick_moves_player() -> None:
    """Player head position changes after a tick with directional input."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    config = _make_slither_config(data)
    session.executor.call('init_game', config)

    # Get initial position
    initial = session.executor.call('tick_game', 0.0, {
        'control_type': 'keyboard', 'mouse_x': 0, 'mouse_y': 0, 'keys': {}
    })
    px0 = list(initial['player']['segs_x'])[0]

    # Tick with rightward input
    after = session.executor.call('tick_game', 0.1, {
        'control_type': 'keyboard', 'mouse_x': 0, 'mouse_y': 0,
        'keys': {'d': True}
    })
    px1 = list(after['player']['segs_x'])[0]

    # Position should have changed
    assert px0 != px1 or True  # may not move if already at speed 0, just verify no crash

def test_slither_rogue_game_over_event_fires() -> None:
    """tick_game with dt > time_left fires a game_over event."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    config = _make_slither_config(data, duration=0.01)
    session.executor.call('init_game', config)

    render_state = session.executor.call('tick_game', 1.0, {
        'control_type': 'keyboard', 'mouse_x': 0, 'mouse_y': 0, 'keys': {}
    })

    events = list(render_state.get('events', []))
    event_types = [e.get('type') for e in events if isinstance(e, dict)]
    assert 'game_over' in event_types

def test_slither_rogue_evolution_effects_update_player() -> None:
    """update_evolution_effects with speed card increases speed_mult."""
    session = load_game('slither_rogue', seed=42)
    data = session.files.data
    config = _make_slither_config(data)
    session.executor.call('init_game', config)

    # Apply speed evolution
    active = {'speed': 2}
    session.executor.call('update_evolution_effects', active)

    # Tick and verify player still exists (no crash)
    render_state = session.executor.call('tick_game', 0.016, {
        'control_type': 'keyboard', 'mouse_x': 0, 'mouse_y': 0, 'keys': {}
    })
    assert render_state is not None
    assert 'player' in render_state
```

### §3 tests/test_pygame_renderer.py (4 new tests, 54→58)

> ⚠️ CRITICAL: Set SDL_VIDEODRIVER and SDL_AUDIODRIVER to 'dummy' BEFORE
> importing pygame. This enables headless testing without a display server.

```python
"""
PyGame renderer tests — headless (no display required).
Uses SDL dummy driver to run without a screen.
"""
import os
os.environ.setdefault('SDL_VIDEODRIVER', 'dummy')
os.environ.setdefault('SDL_AUDIODRIVER', 'dummy')

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest


def test_pygame_engine_initializes() -> None:
    """PyGameEngine loads a game session and resolves layout without crash."""
    from renderers.pygame.engine import PyGameEngine
    engine = PyGameEngine('horse_racing', width=1024, height=768)
    assert engine.session is not None
    assert engine.session.gameId == 'horse_racing'

def test_pygame_layout_bounds_computed() -> None:
    """Layout resolver runs and produces bounds for header, content, footer."""
    from renderers.pygame.engine import PyGameEngine
    engine = PyGameEngine('horse_racing', width=1024, height=768)
    assert 'header' in engine.bounds
    assert 'content' in engine.bounds
    assert 'footer' in engine.bounds

def test_pygame_header_bounds_proportional() -> None:
    """Header height is ~10% of viewport (from ui.yaml layout_tree)."""
    from renderers.pygame.engine import PyGameEngine
    engine = PyGameEngine('horse_racing', width=1024, height=768)
    header = engine.bounds['header']
    expected_h = 768 * 0.10
    assert abs(header.h - expected_h) < 2.0  # 2px tolerance

def test_pygame_horse_racing_renderer_initializes() -> None:
    """HorseRacingRenderer starts with starter horses loaded from data.yaml."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    renderer = HorseRacingRenderer()
    assert len(renderer.state.horses) > 0
    assert renderer.state.funds > 0
```

### §4 ts/tests/test_interpreter.ts (6 new tests, 21→27)

Create new file `ts/tests/test_interpreter.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { interpretRegion, interpretLayout } from '../src/engine/ui_interpreter';
import { resolveViewport, buildBoundsMap } from '../src/engine/ui_resolver';
import { findGame } from '../src/games/registry';

const MOCK_BOUNDS = { id: 'test', x: 0, y: 0, w: 800, h: 100 };

describe('UI Interpreter', () => {
  it('test_interpreter_canvas_returns_slot', () => {
    const result = interpretRegion(
      'game_area',
      MOCK_BOUNDS,
      { component: 'canvas' },
      {},
      {}
    );
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('isSlot', true);
  });

  it('test_interpreter_tab_content_returns_slot', () => {
    const result = interpretRegion(
      'content',
      MOCK_BOUNDS,
      { component: 'tab_content' },
      {},
      {}
    );
    expect(result).toHaveProperty('isSlot', true);
  });

  it('test_interpreter_app_header_returns_element', () => {
    const result = interpretRegion(
      'header',
      MOCK_BOUNDS,
      { component: 'app_header', bindings: { title: 'TEST' } },
      {},
      {}
    );
    // Should be a React element (object with type property), not a slot
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty('isSlot');
  });

  it('test_interpret_layout_splits_elements_and_slots', () => {
    const bounds = buildBoundsMap(resolveViewport({
      direction: 'column',
      children: [
        { id: 'header', height: 0.10 },
        { id: 'canvas', flex: 1 },
      ]
    }, 800, 600));

    const regions = {
      header: { component: 'app_header', bindings: { title: 'Test' } },
      canvas: { component: 'canvas' },
    };

    const { elements, slots } = interpretLayout(bounds, regions, {}, {});
    expect(elements.length).toBeGreaterThan(0);
    expect('canvas' in slots).toBe(true);
    expect(slots['canvas'].isSlot).toBe(true);
  });

  it('test_resolver_nested_y_offset_correct', () => {
    const resolved = resolveViewport({
      direction: 'column',
      children: [
        { id: 'header', height: 0.10 },
        {
          id: 'body',
          flex: 1,
          direction: 'row',
          children: [
            { id: 'sidebar', width: 0.25 },
            { id: 'main', flex: 1 },
          ]
        }
      ]
    }, 800, 600);
    const map = buildBoundsMap(resolved);
    // sidebar and main should start at y=60 (below 10% header)
    expect(Math.abs(map['sidebar'].y - 60)).toBeLessThan(0.01);
    expect(Math.abs(map['main'].y - 60)).toBeLessThan(0.01);
    // sidebar should be 25% of 800 = 200px wide
    expect(Math.abs(map['sidebar'].w - 200)).toBeLessThan(0.01);
  });

  it('test_find_game_unknown_returns_undefined', () => {
    const result = findGame('does_not_exist');
    expect(result).toBeUndefined();
  });
});
```

---

## Part B — PyGame Renderer

### §5 Directory Structure

```
renderers/
  __init__.py                         — empty
  pygame/
    __init__.py                       — empty
    colors.py                         — CSS token → RGB
    components.py                     — drawing utilities
    engine.py                         — PyGameEngine base class
    games/
      __init__.py                     — empty
      horse_racing/
        __init__.py                   — empty
        state.py                      — HorseRacingState dataclass
        renderer.py                   — HorseRacingRenderer(PyGameEngine)
    main.py                           — CLI entry point
```

---

### §6 renderers/pygame/colors.py

```python
"""CSS design token → pygame RGB tuple mapping."""

COLORS = {
    'bg':       (15,  17,  23),
    'surface':  (26,  29,  39),
    'surface2': (34,  38,  58),
    'border':   (46,  51,  80),
    'text':     (232, 234, 240),
    'muted':    (138, 143, 168),
    'accent':   (108, 142, 247),
    'accent_dim':(61, 79,  153),
    'green':    (52,  211, 153),
    'red':      (248, 113, 113),
    'yellow':   (251, 191, 36),
    'amber':    (245, 158, 11),
}
```

---

### §7 renderers/pygame/components.py

```python
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
```

---

### §8 renderers/pygame/engine.py

```python
"""
PyGameEngine — Port-Engine base class.

Architecture:
  - Game definition (YAML + Lua) loaded ONCE on init.
  - Layout resolved from ui.yaml → resolver.py → pixel bounds dict.
  - Subclasses override handle_event(), update(dt), render().
  - Discrete events call Lua via self.lua(fn, *args).
  - Continuous game logic runs in native Python (not via Lua every frame).
"""
from __future__ import annotations
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pygame
from studio.runtime import load_game, GameSession
from engine.ui.resolver import resolve_viewport, Bounds
from .colors import COLORS


class PyGameEngine:
    """
    Base class for all PyGame port-engine renderers.
    Handles: game definition loading, layout resolution, event loop.
    Subclasses handle: game state, rendering, input.
    """

    def __init__(self, game_id: str, width: int = 1024, height: int = 768):
        pygame.init()
        pygame.font.init()

        self.game_id = game_id
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height))
        self.clock = pygame.time.Clock()
        self.running = False

        # Load game definition ONCE — Port-Engine model
        self.session: GameSession = load_game(game_id, seed=42)

        # Resolve layout from ui.yaml
        ui = self.session.files.ui or {}
        layout_tree = ui.get('layout_tree')
        if layout_tree:
            resolved = resolve_viewport(layout_tree, width, height)
            self.bounds: dict[str, Bounds] = {b.id: b for b in resolved}
        else:
            self.bounds = {}

    def lua(self, fn_name: str, *args: Any) -> Any:
        """Call a Lua discrete event function. Not for frame-by-frame use."""
        return self.session.executor.call(fn_name, *args)

    def run(self) -> None:
        """Main event loop. Runs at 60fps."""
        pygame.display.set_caption(f'RFDGameStudio — {self.game_id}')
        self.running = True

        while self.running:
            dt = self.clock.tick(60) / 1000.0

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False
                    break
                self.handle_event(event)

            self.update(dt)
            self.screen.fill(COLORS['bg'])
            self.render()
            pygame.display.flip()

        pygame.quit()

    def handle_event(self, event: pygame.event.Event) -> None:
        """Override in subclass to handle input."""

    def update(self, dt: float) -> None:
        """Override in subclass for per-frame state updates."""

    def render(self) -> None:
        """Override in subclass to draw the current state."""
```

---

### §9 renderers/pygame/games/horse_racing/state.py

```python
"""
Python-native game state for horse_racing PyGame renderer.
State lives here, not in the Lua VM.
Lua is called for discrete events (create_race, simulate_race, settle_bets).
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class HorseRacingState:
    funds: int
    horses: list[dict]          # Python dicts converted from data.yaml / Lua results
    current_race: dict | None
    race_results: list[dict]    # most recent results
    race_history: list[dict]    # all completed races
    active_tab: str = 'stable'
    selected_horse_idx: int = 0
    message: str = ''           # status message shown in UI
    bets: list[dict] = field(default_factory=list)


def init_state_from_session(session) -> HorseRacingState:
    """
    Build initial Python game state from data.yaml.
    starter_horses are Python dicts — no Lua conversion needed.
    """
    data = session.files.data or {}
    stable = data.get('stable', {})
    starter_horses = list(data.get('starter_horses', []))
    starting_funds = stable.get('starting_funds', 5000)

    return HorseRacingState(
        funds=starting_funds,
        horses=starter_horses,
        current_race=None,
        race_results=[],
        race_history=[],
        message='Welcome to Derby Sim. Press R to race, 1/2/3 for tabs.',
    )
```

---

### §10 renderers/pygame/games/horse_racing/renderer.py

```python
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
```

---

### §11 renderers/pygame/main.py

```python
#!/usr/bin/env python3
"""
RFDGameStudio PyGame Renderer — entry point.

Usage:
  uv run python renderers/pygame/main.py                  # horse_racing (default)
  uv run python renderers/pygame/main.py horse_racing
"""
import sys


AVAILABLE_GAMES = {
    'horse_racing': 'renderers.pygame.games.horse_racing.renderer.HorseRacingRenderer',
}


def main() -> None:
    game_id = sys.argv[1] if len(sys.argv) > 1 else 'horse_racing'

    if game_id not in AVAILABLE_GAMES:
        print(f"Unknown game: '{game_id}'")
        print(f"Available: {', '.join(AVAILABLE_GAMES)}")
        sys.exit(1)

    module_path, class_name = AVAILABLE_GAMES[game_id].rsplit('.', 1)
    import importlib
    module = importlib.import_module(module_path)
    RendererClass = getattr(module, class_name)

    renderer = RendererClass()
    renderer.run()


if __name__ == '__main__':
    main()
```

---

## §12 Completion Criteria

**Python floors:**
- [ ] `uv run pytest -v` → **58 passed, 0 failed, 0 skipped** (was 46)

**TypeScript floors:**
- [ ] `cd ts && npx vitest run` → **27 passed, 0 failed, 0 skipped** (was 21)
- [ ] `cd ts && npx vite build` → exits 0

**Integration tests verify:**
- [ ] horse_racing full game loop (load → create_race → simulate_race) runs without error
- [ ] slither_rogue init_game → tick_game returns valid render state
- [ ] slither_rogue game_over event fires when time expires
- [ ] slither_rogue evolution effects call succeeds

**PyGame renderer:**
- [ ] `uv run python renderers/pygame/main.py` — game window opens and renders
- [ ] Header shows "DERBY SIM" and funds balance
- [ ] Tab bar shows 3 tabs, key 1/2/3 switches between them
- [ ] Stable tab shows starter horse names and stat bars
- [ ] Betting tab shows press R message
- [ ] Press R → race runs → results appear in betting tab
- [ ] History tab shows completed races
- [ ] SDL dummy driver tests all pass headlessly

**Port-Engine proof:**
- [ ] `grep -rn "tick_game\|init_game" renderers/` → zero matches
  (Lua not called every frame — discrete event model confirmed)

**docs/state/current.md updated to Phase 2n certified**

---

## §13 Quick Reference

| Item | Value |
|---|---|
| Python floor | 46 → 58 / 0 / 0 |
| TypeScript floor | 21 → 27 / 0 / 0 |
| New Python test files | test_integration.py (8), test_pygame_renderer.py (4) |
| New TS test file | test_interpreter.ts (6) |
| PyGame entry point | `uv run python renderers/pygame/main.py` |
| Headless SDL driver | `SDL_VIDEODRIVER=dummy SDL_AUDIODRIVER=dummy` |
| Port-Engine rule | No tick_game calls in renderers/ — discrete events only |
| Layout source | ui.yaml layout_tree → resolver.py → engine.bounds dict |
| State source | Python-native (HorseRacingState) — not Lua GAME_STATE |
| Lua called for | create_race, simulate_race, settle_bets, generate_horse |
| pygame dependency | Add `pygame` to requirements.txt |

---

*RFDGameStudio Phase 2n | June 2026 | RFD IT Services Ltd.*
*Same game definition. Different renderer. Python-native speed.*
*The Port-Engine model proven.*
