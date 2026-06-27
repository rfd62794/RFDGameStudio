# RFDGameStudio — Phase 2o Directive: PyGame Horse Racing Feature Parity

*June 2026 | Read fully before executing anything.*
*Goal: horse_racing PyGame renderer matches TypeScript feature-for-feature.*
*Full replace of state.py and renderer.py. No other files change.*

---

> ⛔ **STOP:** Run both test suites before touching any file.
> Python: `uv run pytest -v` → must report 58 passed, 0 failed, 0 skipped.
> TypeScript: `cd ts && npx vitest run` → must report 27 passed, 0 failed, 0 skipped.
> Report both before proceeding.

---

## §0 Context

The Phase 2n PyGame renderer is a skeleton. It runs races but has no betting,
no breeding, no persistence, no cooldowns, no slot unlocking, and no emergency
grant. The TypeScript renderer has all of these. This phase closes that gap.

Every feature maps directly to an existing Lua function — no new Lua work needed.

**Feature parity target:**

| Feature | TypeScript | PyGame (before) | PyGame (after) |
|---|---|---|---|
| Stable — 4 stats + career | ✅ | ⚠️ 3 stats | ✅ |
| Stable — cooldown badge | ✅ | ❌ | ✅ |
| Stable — sell horse | ✅ | ❌ | ✅ |
| Stable — slot unlock | ✅ | ❌ | ✅ |
| Betting — Win/Place/Show | ✅ | ❌ | ✅ |
| Betting — bet slip | ✅ | ❌ | ✅ |
| Betting — settle_bets | ✅ | ❌ | ✅ |
| Betting — post-race results | ✅ | ❌ | ✅ |
| Breeding tab | ✅ | ❌ | ✅ |
| History — detailed cards | ✅ | ⚠️ name only | ✅ |
| Persistence | ✅ | ❌ | ✅ |
| Emergency grant | ✅ | ❌ | ✅ |
| Starter market | ✅ | ❌ | ✅ |

---

## §1 Scope

| File | Action |
|---|---|
| `renderers/pygame/games/horse_racing/state.py` | Full replace |
| `renderers/pygame/games/horse_racing/renderer.py` | Full replace |
| `renderers/pygame/games/horse_racing/persistence.py` | New — save/load JSON |
| `tests/test_pygame_renderer.py` | Add 4 tests → floor 58→62 |

**Read-only — do not touch:**
Everything else. No TypeScript changes. No Lua changes. No studio changes.

---

## §2 Key Design Decisions

**Keyboard-driven interface.** No mouse required (matches cross-platform
portability goal). Every action has a key binding displayed on screen.

**Input map:**
| Key | Context | Action |
|---|---|---|
| 1/2/3/4 | Any | Switch tab (Stable/Betting/Breed/History) |
| ↑/↓ | Stable, Breed | Navigate horse list |
| W/P/S | Betting | Set bet type (Win/Place/Show) |
| ←/→ | Betting | Select race participant to bet on |
| +/- | Betting | Increase/decrease bet amount by 50 |
| ENTER | Betting | Place current bet |
| R | Betting | Run race (requires ≥1 bet) |
| C | Betting | Clear all bets |
| X | Stable | Sell selected horse (confirmed via prompt) |
| U | Stable | Unlock next slot |
| B | Breed | Breed selected sire + dam |
| K | Breed | Claim foal |
| ESC | Breed | Discard foal |
| M | Stable | Buy starter horse (starter market) |

**Tab layout:**
- Tab 1: Stable
- Tab 2: Betting
- Tab 3: Breed
- Tab 4: History

---

## §3 renderers/pygame/games/horse_racing/state.py (Full Replace)

```python
"""
Python-native game state for horse_racing PyGame renderer.
Architecture: state lives here, not in Lua VM.
Lua called only for discrete events.
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class BetEntry:
    horse_id: str
    horse_name: str
    bet_type: str           # 'Win' | 'Place' | 'Show'
    amount: int
    payout_odds: float


@dataclass
class BetResult:
    horse_name: str
    bet_type: str
    amount: int
    odds: float
    won: bool
    payout: int


@dataclass
class HorseRacingState:
    # Core
    funds: int
    horses: list[dict]
    unlocked_slots: int
    race_history: list[dict]

    # Active race
    current_race: dict | None = None
    race_participants: list[dict] = field(default_factory=list)
    race_results: list[dict] = field(default_factory=list)

    # Bets
    bets: list[BetEntry] = field(default_factory=list)
    last_bet_results: list[BetResult] = field(default_factory=list)
    last_net_payout: int = 0

    # Breed
    foal: dict | None = None
    foal_cost: int = 0

    # UI state
    active_tab: str = 'stable'
    selected_horse_idx: int = 0

    # Betting sub-state
    bet_type: str = 'Win'
    bet_target_idx: int = 0
    bet_amount: int = 50

    # Breed sub-state
    sire_idx: int = 0
    dam_idx: int = 0

    # Confirm prompt
    confirm_mode: bool = False
    confirm_action: str = ''

    # Message
    message: str = 'Welcome to Derby Sim. Ready to race.'
    message_timer: float = 0.0


def init_state_from_data(data: dict, loaded_save: dict | None = None) -> HorseRacingState:
    """
    Build initial state from data.yaml.
    If loaded_save is provided, restore from save instead.
    """
    if loaded_save:
        return HorseRacingState(
            funds=loaded_save.get('funds', 1000),
            horses=loaded_save.get('horses', []),
            unlocked_slots=loaded_save.get('unlocked_slots', 3),
            race_history=loaded_save.get('race_history', []),
        )

    stable = data.get('stable', {})
    starters = list(data.get('starter_horses', []))
    return HorseRacingState(
        funds=stable.get('starting_funds', 1000),
        horses=starters,
        unlocked_slots=stable.get('starting_slots', 3),
        race_history=[],
    )
```

---

## §4 renderers/pygame/games/horse_racing/persistence.py (New)

```python
"""
Save/load JSON persistence for the PyGame horse_racing renderer.
Equivalent to TypeScript localStorage with key 'derby_sim_state_v1'.
"""
from __future__ import annotations
import json
import time
from pathlib import Path

SAVE_DIR  = Path(__file__).parent / 'saves'
SAVE_FILE = SAVE_DIR / 'horse_racing_save.json'
SAVE_KEY  = 'derby_sim_state_v1'


def save_state(state) -> None:
    """Serialize HorseRacingState to JSON. Called after every state-changing event."""
    SAVE_DIR.mkdir(parents=True, exist_ok=True)
    data = {
        'funds':           state.funds,
        'horses':          state.horses,
        'unlocked_slots':  state.unlocked_slots,
        'race_history':    state.race_history,
        'saved_at':        int(time.time()),
    }
    SAVE_FILE.write_text(json.dumps(data, indent=2), encoding='utf-8')


def load_state() -> dict | None:
    """Load save file. Returns None if no save exists or save is invalid."""
    if not SAVE_FILE.exists():
        return None
    try:
        data = json.loads(SAVE_FILE.read_text(encoding='utf-8'))
        if not isinstance(data.get('horses'), list):
            return None
        return data
    except Exception:
        return None
```

---

## §5 renderers/pygame/games/horse_racing/renderer.py (Full Replace)

Write the complete file. Key sections are specified below — implement each fully.

### §5.1 Class declaration and init

```python
"""
HorseRacingRenderer — full feature parity with TypeScript renderer.
Port-Engine model: Python-native state, Lua for discrete events only.
"""
from __future__ import annotations
import sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

import pygame
from renderers.pygame.engine import PyGameEngine
from renderers.pygame.components import (
    draw_rect, draw_border_rect, draw_text, draw_stat_bar, draw_badge
)
from renderers.pygame.colors import COLORS
from .state import HorseRacingState, BetEntry, BetResult, init_state_from_data
from .persistence import save_state, load_state

# Panel split constants
LEFT_SPLIT = 0.55   # left panel takes 55% of content width
PAD = 12            # standard padding


class HorseRacingRenderer(PyGameEngine):

    def __init__(self, width: int = 1024, height: int = 768):
        super().__init__('horse_racing', width, height)
        pygame.display.set_caption('Derby Sim — PyGame Port')

        data = self.session.files.data or {}
        saved = load_state()
        self.state = init_state_from_data(data, saved)

        if saved:
            self._msg('Save loaded. Welcome back.')
```

### §5.2 update(dt) — ticker and timers

```python
    def update(self, dt: float) -> None:
        st = self.state
        # Decay message
        if st.message_timer > 0:
            st.message_timer = max(0, st.message_timer - dt)
            if st.message_timer == 0:
                st.message = ''
        # Emergency grant: funds <= 0, no horses earning, give $200
        if st.funds <= 0 and not st.bets:
            st.funds = 200
            self._msg('Emergency grant: $200 added to your account.')
            save_state(st)
```

### §5.3 handle_event — full key dispatch

```python
    def handle_event(self, event: pygame.event.Event) -> None:
        if event.type != pygame.KEYDOWN:
            return

        k  = event.key
        st = self.state
        data = self.session.files.data or {}

        # Confirm mode: Y to confirm, ESC to cancel
        if st.confirm_mode:
            if k == pygame.K_y:
                self._execute_confirm()
            else:
                st.confirm_mode = False
                st.confirm_action = ''
            return

        # Tab switching
        if k == pygame.K_1: st.active_tab = 'stable'
        elif k == pygame.K_2: st.active_tab = 'betting'
        elif k == pygame.K_3: st.active_tab = 'breed'
        elif k == pygame.K_4: st.active_tab = 'history'

        # Tab-specific actions
        elif st.active_tab == 'stable':
            self._handle_stable_keys(k, data)
        elif st.active_tab == 'betting':
            self._handle_betting_keys(k, data)
        elif st.active_tab == 'breed':
            self._handle_breed_keys(k, data)
```

### §5.4 Stable tab key handling

```python
    def _handle_stable_keys(self, k: int, data: dict) -> None:
        st = self.state
        horses = st.horses

        if k == pygame.K_UP:
            st.selected_horse_idx = max(0, st.selected_horse_idx - 1)
        elif k == pygame.K_DOWN:
            st.selected_horse_idx = min(len(horses) - 1, st.selected_horse_idx + 1)

        elif k == pygame.K_x and horses:
            # Sell selected horse
            st.confirm_mode = True
            st.confirm_action = 'sell'

        elif k == pygame.K_u:
            # Unlock next stable slot
            stable = data.get('stable', {})
            can, reason = self.lua('can_unlock_slot',
                                   st.unlocked_slots,
                                   stable.get('max_slots', 12),
                                   st.funds,
                                   stable.get('unlock_cost_per_slot', 500))
            if can:
                cost = stable.get('unlock_cost_per_slot', 500)
                st.funds -= cost
                st.unlocked_slots += 1
                save_state(st)
                self._msg(f'Slot unlocked. Stable capacity: {st.unlocked_slots}')
            else:
                self._msg(reason or 'Cannot unlock slot.')

        elif k == pygame.K_m:
            # Starter market — buy a foundation horse
            stable = data.get('stable', {})
            cost = stable.get('starter_horse_cost', 400)
            if len(st.horses) >= st.unlocked_slots:
                self._msg('Stable full. Unlock a slot first.')
            elif st.funds < cost:
                self._msg(f'Need ${cost} to buy a starter horse.')
            else:
                opts = {
                    'min_stat': stable.get('starter_min_stat', 35),
                    'max_stat': stable.get('starter_max_stat', 55),
                    'generation': 1,
                    'player_owned': True,
                    'gender': 'Stallion' if len(st.horses) % 2 == 0 else 'Mare',
                }
                new_horse = self.lua('generate_horse', opts,
                                     data.get('coat_colors', []),
                                     data.get('silk_colors', []),
                                     data.get('name_prefixes', []),
                                     data.get('name_suffixes', []))
                if new_horse:
                    st.funds -= cost
                    st.horses.append(dict(new_horse))
                    save_state(st)
                    self._msg(f'Bought {new_horse.get("name", "horse")} for ${cost}.')

    def _execute_confirm(self) -> None:
        st = self.state
        st.confirm_mode = False
        if st.confirm_action == 'sell' and st.horses:
            idx = min(st.selected_horse_idx, len(st.horses) - 1)
            horse = st.horses[idx]
            result = self.lua('sell_horse', horse, st.funds)
            if result:
                price = result.get('price', 0) if isinstance(result, dict) else 0
                st.funds += price
                st.horses.pop(idx)
                st.selected_horse_idx = max(0, idx - 1)
                save_state(st)
                self._msg(f'Sold for ${price}.')
        st.confirm_action = ''
```

### §5.5 Betting tab key handling

```python
    def _handle_betting_keys(self, k: int, data: dict) -> None:
        st = self.state

        if k == pygame.K_w: st.bet_type = 'Win'
        elif k == pygame.K_p: st.bet_type = 'Place'
        elif k == pygame.K_s: st.bet_type = 'Show'

        elif k == pygame.K_LEFT:
            st.bet_target_idx = max(0, st.bet_target_idx - 1)
        elif k == pygame.K_RIGHT:
            if st.current_race:
                parts = st.current_race.get('participants', [])
                st.bet_target_idx = min(len(parts) - 1, st.bet_target_idx + 1)

        elif k == pygame.K_EQUALS or k == pygame.K_PLUS:
            st.bet_amount = min(st.funds, st.bet_amount + 50)
        elif k == pygame.K_MINUS:
            st.bet_amount = max(10, st.bet_amount - 50)

        elif k == pygame.K_RETURN:
            # Place bet
            self._place_bet(data)

        elif k == pygame.K_c:
            st.bets.clear()
            st.last_bet_results.clear()
            st.last_net_payout = 0
            self._msg('Bets cleared.')

        elif k == pygame.K_r:
            self._run_race(data)

        elif k == pygame.K_n:
            # New race without betting
            self._generate_race(data)

    def _generate_race(self, data: dict) -> None:
        st = self.state
        if not st.horses:
            self._msg('No horses available.')
            return
        idx = min(st.selected_horse_idx, len(st.horses) - 1)
        horse = st.horses[idx]
        race, err = self.lua('create_race', horse, data)
        if race:
            st.current_race = dict(race)
            st.race_participants = list(race.get('participants', []))
            st.bets.clear()
            st.last_bet_results.clear()
            st.bet_target_idx = 0
            self._msg(f"Race ready: {race.get('name', 'Race')}")
        else:
            self._msg(str(err or 'Could not create race.'))

    def _place_bet(self, data: dict) -> None:
        st = self.state
        if not st.current_race:
            self._generate_race(data)
            return
        parts = st.current_race.get('participants', [])
        if not parts or st.bet_target_idx >= len(parts):
            self._msg('Select a valid participant.')
            return
        if st.bet_amount > st.funds:
            self._msg('Insufficient funds.')
            return

        p = parts[st.bet_target_idx]
        h = p.get('horse', p)
        win_odds = float(p.get('odds', 3.0))

        if st.bet_type == 'Place':
            betting_cfg = data.get('betting', {})
            odds = self.lua('calculate_place_odds', win_odds, betting_cfg)
        elif st.bet_type == 'Show':
            betting_cfg = data.get('betting', {})
            odds = self.lua('calculate_show_odds', win_odds, betting_cfg)
        else:
            odds = win_odds

        bet = BetEntry(
            horse_id=h.get('id', ''),
            horse_name=h.get('name', 'Unknown'),
            bet_type=st.bet_type,
            amount=st.bet_amount,
            payout_odds=float(odds or win_odds),
        )
        st.bets.append(bet)
        st.funds -= st.bet_amount
        self._msg(f'Bet placed: ${st.bet_amount} {st.bet_type} on {bet.horse_name} @ {odds:.2f}')

    def _run_race(self, data: dict) -> None:
        st = self.state
        if not st.current_race:
            self._msg('Generate a race first (press N).')
            return

        parts = st.current_race.get('participants', [])
        config = {
            'distance': st.current_race.get('distance', 1200),
            'delta_time': 0.2,
        }
        results = self.lua('simulate_race', parts, config)
        if not results:
            self._msg('Race simulation failed.')
            return

        result_list = [dict(r) for r in results]
        st.race_results = result_list

        # Settle bets
        bet_dicts = [
            {'horse_id': b.horse_id, 'horse_name': b.horse_name,
             'amount': b.amount, 'type': b.bet_type, 'payout_odds': b.payout_odds}
            for b in st.bets
        ]

        net = 0
        bet_results = []
        if bet_dicts:
            standings = result_list
            prize_pool = st.current_race.get('prize_pool', 0)
            prize_splits = st.current_race.get('prize_split',
                                               [0.60, 0.25, 0.15])
            settlement = self.lua('settle_bets', bet_dicts,
                                  standings, prize_pool, prize_splits)

            if isinstance(settlement, dict):
                settled = settlement.get('bets', []) or []
            else:
                settled = list(settlement) if settlement else []

            for i, b in enumerate(st.bets):
                s = settled[i] if i < len(settled) else {}
                payout = int(s.get('payout', 0)) if isinstance(s, dict) else 0
                won = payout > 0
                st.funds += payout
                net += payout - b.amount
                bet_results.append(BetResult(
                    horse_name=b.horse_name,
                    bet_type=b.bet_type,
                    amount=b.amount,
                    odds=b.payout_odds,
                    won=won,
                    payout=payout,
                ))

        st.last_bet_results = bet_results
        st.last_net_payout = net

        # Update player horse career
        player_horse_id = parts[0].get('horse', {}).get('id') if parts else None
        if player_horse_id:
            rank = next((r.get('rank', 99) for r in result_list
                        if r.get('horse_id') == player_horse_id), 99)
            prize = 0  # simplified — earnings from prize pool
            for i, horse in enumerate(st.horses):
                if horse.get('id') == player_horse_id:
                    updated = self.lua('update_horse_after_race', horse, rank, prize)
                    if updated:
                        st.horses[i] = dict(updated)
                    # Apply cooldown
                    cd_ms = (data.get('stable', {})
                             .get('race_cooldown_ms', 90000))
                    st.horses[i]['cooldown_until'] = int(time.time() * 1000) + cd_ms
                    break

        st.race_history.append({
            'name': st.current_race.get('name', 'Race'),
            'distance': st.current_race.get('distance', 0),
            'prize_pool': st.current_race.get('prize_pool', 0),
            'results': result_list[:3],
        })

        st.bets.clear()
        st.current_race = None
        save_state(st)
        self._msg(f'Race complete. Net: {"+" if net >= 0 else ""}${net}')
```

### §5.6 Breed tab key handling

```python
    def _handle_breed_keys(self, k: int, data: dict) -> None:
        st = self.state
        stallions = [h for h in st.horses if h.get('gender') == 'Stallion']
        mares = ([h for h in st.horses if h.get('gender') == 'Mare'] +
                 list(data.get('public_studs', [])))  # public studs used as dams too
        # Actually: sires are stallions (player + public), dams are mares
        sires = ([h for h in st.horses if h.get('gender') == 'Stallion'] +
                 [h for h in data.get('public_studs', []) if h.get('gender') == 'Stallion'])
        dams  = ([h for h in st.horses if h.get('gender') == 'Mare'] +
                 [h for h in data.get('public_studs', []) if h.get('gender') == 'Mare'])

        if st.foal:
            if k == pygame.K_k:
                # Claim foal
                if len(st.horses) < st.unlocked_slots:
                    if st.funds >= st.foal_cost:
                        st.funds -= st.foal_cost
                        st.horses.append(st.foal)
                        st.foal = None
                        st.foal_cost = 0
                        save_state(st)
                        self._msg('Foal claimed and added to stable.')
                    else:
                        self._msg(f'Need ${st.foal_cost} to claim foal.')
                else:
                    self._msg('Stable full. Unlock a slot first.')
            elif k == pygame.K_ESCAPE:
                st.foal = None
                st.foal_cost = 0
                self._msg('Foal discarded.')
            return

        if k == pygame.K_UP:
            if len(sires) > 0:
                st.sire_idx = max(0, st.sire_idx - 1)
        elif k == pygame.K_DOWN:
            if len(sires) > 0:
                st.sire_idx = min(len(sires) - 1, st.sire_idx + 1)
        elif k == pygame.K_LEFT:
            if len(dams) > 0:
                st.dam_idx = max(0, st.dam_idx - 1)
        elif k == pygame.K_RIGHT:
            if len(dams) > 0:
                st.dam_idx = min(len(dams) - 1, st.dam_idx + 1)
        elif k == pygame.K_b:
            self._breed(sires, dams, data)

    def _breed(self, sires: list, dams: list, data: dict) -> None:
        st = self.state
        if not sires or not dams:
            self._msg('Need at least one stallion and one mare.')
            return
        sire = sires[min(st.sire_idx, len(sires) - 1)]
        dam  = dams[min(st.dam_idx, len(dams) - 1)]

        # Stud fee for public horses
        stud_fee = 0
        if not sire.get('player_owned', True):
            stud_fee += sire.get('price', 0) // 4
        if not dam.get('player_owned', True):
            stud_fee += dam.get('price', 0) // 4

        if st.funds < stud_fee:
            self._msg(f'Need ${stud_fee} stud fee to breed.')
            return

        foal, err = self.lua('breed_horses', sire, dam,
                             data.get('coat_colors', []),
                             data.get('silk_colors', []),
                             data.get('name_prefixes', []),
                             data.get('name_suffixes', []))
        if foal:
            st.foal = dict(foal)
            st.foal_cost = stud_fee
            self._msg(f'Foal ready: {foal.get("name")}. K=Claim, ESC=Discard')
        else:
            self._msg(str(err or 'Breeding failed.'))
```

### §5.7 Render dispatch

```python
    def render(self) -> None:
        b = self.bounds
        if 'header'  in b: self._render_header(b['header'])
        if 'tab_nav' in b: self._render_tab_nav(b['tab_nav'])
        if 'content' in b: self._render_content(b['content'])
        if 'footer'  in b: self._render_footer(b['footer'])
        self._render_confirm_overlay()
```

### §5.8 Stable tab rendering

Show two panels: left = horse list, right = selected horse detail.

```python
    def _render_stable(self, b) -> None:
        lw = int(b.w * LEFT_SPLIT)
        rw = b.w - lw
        lb = type('B', (), {'x':b.x,'y':b.y,'w':lw,'h':b.h})()
        rb = type('B', (), {'x':b.x+lw,'y':b.y,'w':rw,'h':b.h})()

        # LEFT: horse list
        now_ms = int(time.time() * 1000)
        card_h, pad = 70, 8
        for i, horse in enumerate(self.state.horses):
            cy = lb.y + pad + i * (card_h + pad)
            if cy + card_h > lb.y + lb.h - 30: break
            is_sel = (i == self.state.selected_horse_idx)
            border = COLORS['accent'] if is_sel else COLORS['border']
            draw_border_rect(self.screen, lb.x+pad, cy, lw-pad*2, card_h,
                             fill=COLORS['surface'], border=border)
            name = horse.get('name', 'Unknown')
            gen  = horse.get('generation', 1)
            gender = horse.get('gender', '')[:1]
            resting = int(horse.get('cooldown_until', 0)) > now_ms
            draw_text(self.screen, name, lb.x+pad+10, cy+8, size=13, bold=True)
            draw_text(self.screen, f'G{gen} {gender}',
                      lb.x+pad+10, cy+26, color=COLORS['muted'], size=11)
            if resting:
                ms_left = int(horse.get('cooldown_until', 0)) - now_ms
                secs = ms_left // 1000
                draw_badge(self.screen, f'Resting {secs}s',
                           lb.x+lw-120, cy+10, color=COLORS['amber'])
            else:
                draw_badge(self.screen, 'Ready',
                           lb.x+lw-90, cy+10, color=COLORS['green'])

        # Controls hint
        draw_text(self.screen, '↑↓ Navigate  X Sell  U Unlock  M Buy',
                  lb.x+pad, lb.y+lb.h-18, color=COLORS['muted'], size=10)

        # RIGHT: detail panel
        draw_border_rect(self.screen, rb.x, rb.y, rw, rb.h,
                         fill=COLORS['surface'], border=COLORS['border'])
        if not self.state.horses: return
        idx = min(self.state.selected_horse_idx, len(self.state.horses)-1)
        h = self.state.horses[idx]
        dx, dy = rb.x+PAD, rb.y+PAD

        draw_text(self.screen, h.get('name','?'), dx, dy, size=15, bold=True)
        dy += 22
        gen_str = f"Gen {h.get('generation',1)}  {h.get('gender','')}"
        draw_text(self.screen, gen_str, dx, dy, color=COLORS['muted'], size=11)
        dy += 22

        # Stats
        for lbl, key, color in [
            ('Speed',    'speed',        COLORS['accent']),
            ('Stamina',  'stamina',      COLORS['green']),
            ('Accel',    'acceleration', COLORS['yellow']),
            ('Temp',     'temperament',  COLORS['amber']),
        ]:
            val = float(h.get(key, 0))
            draw_text(self.screen, lbl, dx, dy, color=COLORS['muted'], size=11)
            draw_stat_bar(self.screen, dx+55, dy+1, rw-PAD*2-55, 10,
                          val, 100, fill_color=color)
            draw_text(self.screen, str(int(val)), dx+rw-PAD*2-35, dy,
                      color=COLORS['text'], size=11)
            dy += 18

        dy += 6
        draw_text(self.screen, 'CAREER', dx, dy, color=COLORS['muted'], size=10)
        dy += 14
        career = (f"Runs:{h.get('runs',0)}  Wins:{h.get('wins',0)}  "
                  f"P:{h.get('places',0)}  S:{h.get('thirds',0)}")
        draw_text(self.screen, career, dx, dy, color=COLORS['text'], size=11)
        dy += 16
        draw_text(self.screen, f"Earnings: ${h.get('earnings',0):,}",
                  dx, dy, color=COLORS['green'], size=11)
        dy += 16
        price = self.lua('calculate_horse_price', h)
        draw_text(self.screen, f"Sale value: ${int(price or 0):,}",
                  dx, dy, color=COLORS['muted'], size=11)
```

### §5.9 Betting tab rendering

Two-column layout. Left: race info + participants with odds. Right: bet slip + results.

```python
    def _render_betting(self, b) -> None:
        st = self.state
        lw = int(b.w * LEFT_SPLIT)
        rw = b.w - lw

        # ── LEFT: Race info and participants ──
        lx, ly = b.x+PAD, b.y+PAD
        draw_text(self.screen, 'BETTING OFFICE', lx, ly, size=14, bold=True)
        ly += 22

        if not st.current_race:
            draw_text(self.screen, 'No race scheduled.',
                      lx, ly, color=COLORS['muted'], size=12)
            draw_text(self.screen, 'Press N for new race.',
                      lx, ly+18, color=COLORS['muted'], size=11)
        else:
            race = st.current_race
            draw_text(self.screen, race.get('name','Race'),
                      lx, ly, color=COLORS['accent'], size=13, bold=True)
            ly += 18
            draw_text(self.screen,
                      f"{race.get('distance',0)}m · Prize ${race.get('prize_pool',0):,}",
                      lx, ly, color=COLORS['muted'], size=11)
            ly += 20

            # Participants table
            draw_text(self.screen, '#  Horse                  Odds',
                      lx, ly, color=COLORS['muted'], size=10)
            ly += 14
            parts = race.get('participants', [])
            for i, p in enumerate(parts):
                h = p.get('horse', p)
                is_sel = (i == st.bet_target_idx)
                row_color = COLORS['accent'] if is_sel else COLORS['text']
                prefix = '▶ ' if is_sel else '  '
                name = h.get('name', 'Horse')[:20]
                odds = float(p.get('odds', 0))
                row = f"{prefix}{i+1:<3}{name:<22}{odds:.2f}"
                draw_text(self.screen, row, lx, ly, color=row_color, size=11)
                ly += 16

            ly += 4
            draw_text(self.screen,
                      '←→ Select horse  W/P/S Bet type  +/- Amount',
                      lx, ly, color=COLORS['muted'], size=10)
            ly += 14
            draw_text(self.screen,
                      'ENTER Place bet  R Run race  C Clear  N New race',
                      lx, ly, color=COLORS['muted'], size=10)

        # ── RIGHT: Bet slip + results ──
        rx, ry = b.x+lw+PAD, b.y+PAD
        draw_border_rect(self.screen, b.x+lw, b.y, rw, b.h,
                         fill=COLORS['surface'], border=COLORS['border'])

        # Current bet input
        draw_text(self.screen, 'BET SLIP', rx, ry, size=13, bold=True)
        ry += 20
        for btype, color in [('Win', COLORS['green']),
                              ('Place', COLORS['yellow']),
                              ('Show', COLORS['amber'])]:
            sel = '●' if st.bet_type == btype else '○'
            tc = color if st.bet_type == btype else COLORS['muted']
            draw_text(self.screen, f'{sel} {btype}', rx, ry, color=tc, size=12)
            ry += 16

        ry += 4
        draw_text(self.screen, f'Amount: ${st.bet_amount}',
                  rx, ry, color=COLORS['text'], size=12, bold=True)
        ry += 20

        # Placed bets
        if st.bets:
            draw_text(self.screen, 'Placed bets:', rx, ry,
                      color=COLORS['muted'], size=10)
            ry += 14
            for bet in st.bets:
                line = f'${bet.amount} {bet.bet_type} · {bet.horse_name[:16]}'
                draw_text(self.screen, line, rx, ry, color=COLORS['text'], size=11)
                draw_text(self.screen, f'@ {bet.payout_odds:.2f}',
                          rx+rw-80, ry, color=COLORS['accent'], size=11)
                ry += 15

        # Post-race results
        if st.last_bet_results:
            ry += 8
            draw_text(self.screen, '── Race Results ──', rx, ry,
                      color=COLORS['muted'], size=10)
            ry += 14
            for br in st.last_bet_results:
                won_color = COLORS['green'] if br.won else COLORS['red']
                mark = '✓' if br.won else '✗'
                line = f'{mark} {br.bet_type} {br.horse_name[:14]}'
                draw_text(self.screen, line, rx, ry, color=won_color, size=11)
                pout = f'+${br.payout}' if br.won else '-$' + str(br.amount)
                draw_text(self.screen, pout, rx+rw-70, ry,
                          color=won_color, size=11, bold=True)
                ry += 15

            net = st.last_net_payout
            net_color = COLORS['green'] if net >= 0 else COLORS['red']
            draw_text(self.screen,
                      f"Net: {'+'if net>=0 else ''}${net}",
                      rx, ry+4, color=net_color, size=13, bold=True)

        # Standings from last race
        if st.race_results:
            ry_s = b.y + b.h - 90
            draw_text(self.screen, 'Final standings:',
                      rx, ry_s, color=COLORS['muted'], size=10)
            ry_s += 14
            for r in st.race_results[:3]:
                draw_text(self.screen,
                          f"#{r.get('rank',0)} {r.get('horse_name','?')[:20]}",
                          rx, ry_s, color=COLORS['text'], size=11)
                ry_s += 15
```

### §5.10 Breed tab rendering

```python
    def _render_breed(self, b) -> None:
        st = self.state
        data = self.session.files.data or {}
        sires = ([h for h in st.horses if h.get('gender') == 'Stallion'] +
                 [h for h in data.get('public_studs',[]) if h.get('gender')=='Stallion'])
        dams  = ([h for h in st.horses if h.get('gender') == 'Mare'] +
                 [h for h in data.get('public_studs',[]) if h.get('gender')=='Mare'])

        lw = b.w // 2
        lx, rx = b.x+PAD, b.x+lw+PAD
        cy = b.y+PAD

        draw_text(self.screen, 'SIRES  (↑↓)', lx, cy, size=12, bold=True)
        draw_text(self.screen, 'DAMS   (←→)', rx, cy, size=12, bold=True)
        cy += 20

        # Sire list
        for i, sire in enumerate(sires[:8]):
            is_sel = (i == st.sire_idx)
            color = COLORS['accent'] if is_sel else COLORS['text']
            owned = sire.get('player_owned', True)
            prefix = '▶ ' if is_sel else '  '
            tag = '' if owned else f' [${sire.get("price",0)//4}]'
            draw_text(self.screen,
                      f'{prefix}{sire.get("name","?")[:22]}{tag}',
                      lx, cy + i*18, color=color, size=12)

        # Dam list
        for i, dam in enumerate(dams[:8]):
            is_sel = (i == st.dam_idx)
            color = COLORS['accent'] if is_sel else COLORS['text']
            owned = dam.get('player_owned', True)
            prefix = '▶ ' if is_sel else '  '
            tag = '' if owned else f' [${dam.get("price",0)//4}]'
            draw_text(self.screen,
                      f'{prefix}{dam.get("name","?")[:22]}{tag}',
                      rx, cy + i*18, color=color, size=12)

        footer_y = b.y + b.h - 50
        if st.foal:
            draw_text(self.screen,
                      f'Foal ready: {st.foal.get("name","?")}',
                      b.x+PAD, footer_y, color=COLORS['green'], size=13, bold=True)
            draw_text(self.screen, 'K = Claim  ESC = Discard',
                      b.x+PAD, footer_y+18, color=COLORS['muted'], size=11)
        else:
            draw_text(self.screen, 'B = Breed selected pair',
                      b.x+PAD, footer_y, color=COLORS['muted'], size=11)
```

### §5.11 History tab rendering

```python
    def _render_history(self, b) -> None:
        st = self.state
        if not st.race_history:
            draw_text(self.screen, 'No races completed yet.',
                      b.x+PAD, b.y+PAD, color=COLORS['muted'])
            return

        card_h, pad = 90, 10
        for i, entry in enumerate(reversed(st.race_history[-6:])):
            cy = b.y + pad + i * (card_h + pad)
            if cy + card_h > b.y + b.h: break
            draw_border_rect(self.screen, b.x+pad, cy, b.w-pad*2, card_h,
                             fill=COLORS['surface'], border=COLORS['border'])
            name = entry.get('name', 'Race')
            dist = entry.get('distance', 0)
            prize = entry.get('prize_pool', 0)
            draw_text(self.screen, name, b.x+pad+10, cy+8,
                      size=13, bold=True)
            draw_text(self.screen, f'{dist}m · Prize ${prize:,}',
                      b.x+pad+10, cy+24, color=COLORS['muted'], size=11)

            for j, r in enumerate(entry.get('results', [])[:3]):
                rank = r.get('rank', j+1)
                hname = r.get('horse_name', '?')[:24]
                rank_colors = {1: COLORS['yellow'], 2: COLORS['muted'],
                               3: COLORS['amber']}
                rc = rank_colors.get(rank, COLORS['muted'])
                draw_text(self.screen, f'#{rank}  {hname}',
                          b.x+pad+10, cy+42+j*14, color=rc, size=11)
```

### §5.12 Confirm overlay, header, footer, message helpers

```python
    def _render_confirm_overlay(self) -> None:
        if not self.state.confirm_mode: return
        ow, oh = 400, 100
        ox = (self.width - ow) // 2
        oy = (self.height - oh) // 2
        draw_border_rect(self.screen, ox, oy, ow, oh,
                         fill=COLORS['surface2'], border=COLORS['accent'])
        draw_text(self.screen, 'Are you sure? (Y to confirm, any other key cancels)',
                  ox+10, oy+30, color=COLORS['text'], size=12)

    def _render_header(self, b) -> None:
        draw_border_rect(self.screen, b.x, b.y, b.w, b.h,
                         fill=COLORS['surface'], border=COLORS['border'], radius=0)
        draw_text(self.screen, 'DERBY SIM', b.x+20, b.y+b.h//2-10,
                  color=COLORS['text'], size=18, bold=True)
        draw_text(self.screen, 'STABLE BANK',
                  b.x+b.w-160, b.y+8, color=COLORS['muted'], size=10)
        draw_text(self.screen, f'${self.state.funds:,}',
                  b.x+b.w-160, b.y+22, color=COLORS['green'], size=15, bold=True)
        # Message
        if self.state.message:
            draw_text(self.screen, self.state.message,
                      b.x+250, b.y+b.h//2-7, color=COLORS['muted'], size=11)

    def _render_tab_nav(self, b) -> None:
        tabs = [('1 Stable','stable'), ('2 Betting','betting'),
                ('3 Breed','breed'), ('4 History','history')]
        tw = b.w // len(tabs)
        for i, (lbl, tid) in enumerate(tabs):
            tx = b.x + i*tw
            active = self.state.active_tab == tid
            draw_border_rect(self.screen, tx, b.y, tw, b.h,
                             fill=COLORS['surface2'] if active else COLORS['surface'],
                             border=COLORS['accent'] if active else COLORS['border'],
                             radius=0)
            draw_text(self.screen, lbl, tx+10, b.y+b.h//2-7,
                      color=COLORS['accent'] if active else COLORS['muted'],
                      size=12, bold=active)

    def _render_content(self, b) -> None:
        draw_rect(self.screen, b.x, b.y, b.w, b.h, COLORS['bg'], radius=0)
        tab = self.state.active_tab
        if   tab == 'stable':  self._render_stable(b)
        elif tab == 'betting': self._render_betting(b)
        elif tab == 'breed':   self._render_breed(b)
        elif tab == 'history': self._render_history(b)

    def _render_footer(self, b) -> None:
        draw_border_rect(self.screen, b.x, b.y, b.w, b.h,
                         fill=COLORS['surface'], border=COLORS['border'], radius=0)
        draw_text(self.screen, '© 2026 DERBY SIM — RFD IT Services  |  PyGame Port',
                  b.x+20, b.y+b.h//2-7, color=COLORS['muted'], size=10)

    def _msg(self, text: str, duration: float = 4.0) -> None:
        self.state.message = text
        self.state.message_timer = duration
```

---

## §6 New Python Tests (58→62)

Add to `tests/test_pygame_renderer.py`:

```python
def test_pygame_betting_place_bet_deducts_funds() -> None:
    """Place a bet — funds decrease by bet amount."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    renderer = HorseRacingRenderer()
    data = renderer.session.files.data or {}
    initial_funds = renderer.state.funds

    renderer.state.active_tab = 'betting'
    renderer.state.bet_amount = 50
    renderer.state.bet_type = 'Win'

    # Generate race first
    renderer._generate_race(data)
    assert renderer.state.current_race is not None

    # Place bet
    renderer._place_bet(data)
    assert renderer.state.funds == initial_funds - 50
    assert len(renderer.state.bets) == 1

def test_pygame_run_race_settles_bets() -> None:
    """Run race after placing a bet — settle_bets called, bets cleared."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    renderer = HorseRacingRenderer()
    data = renderer.session.files.data or {}

    renderer._generate_race(data)
    renderer.state.bet_amount = 50
    renderer._place_bet(data)
    renderer._run_race(data)

    assert len(renderer.state.bets) == 0           # cleared after race
    assert len(renderer.state.race_results) > 0    # results populated
    assert len(renderer.state.race_history) == 1   # history updated

def test_pygame_breed_produces_foal() -> None:
    """Breed sire + dam — foal is created and waiting in state."""
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    renderer = HorseRacingRenderer()
    data = renderer.session.files.data or {}
    public_studs = list(data.get('public_studs', []))

    # Use public studs as sire, player mare as dam (or vice versa)
    sires = ([h for h in renderer.state.horses if h.get('gender') == 'Stallion'] +
             [h for h in public_studs if h.get('gender') == 'Stallion'])
    dams  = ([h for h in renderer.state.horses if h.get('gender') == 'Mare'] +
             [h for h in public_studs if h.get('gender') == 'Mare'])

    if sires and dams:
        renderer._breed(sires, dams, data)
        assert renderer.state.foal is not None
        assert 'name' in renderer.state.foal

def test_pygame_save_and_reload() -> None:
    """Save state, create new renderer — loads same funds and horse count."""
    import os
    from renderers.pygame.games.horse_racing.renderer import HorseRacingRenderer
    from renderers.pygame.games.horse_racing.persistence import SAVE_FILE

    # Remove any existing save
    if SAVE_FILE.exists():
        SAVE_FILE.unlink()

    renderer = HorseRacingRenderer()
    renderer.state.funds = 999  # distinctive value
    from renderers.pygame.games.horse_racing.persistence import save_state
    save_state(renderer.state)

    renderer2 = HorseRacingRenderer()
    assert renderer2.state.funds == 999
    assert len(renderer2.state.horses) == len(renderer.state.horses)

    # Clean up
    if SAVE_FILE.exists():
        SAVE_FILE.unlink()
```

---

## §7 Completion Criteria

- [ ] `uv run pytest -v` → **62 passed, 0 failed, 0 skipped**
- [ ] `cd ts && npx vitest run` → 27 passed, 0 failed (unchanged)
- [ ] `cd ts && npx vite build` → exits 0
- [ ] `uv run python renderers/pygame/main.py` — game window opens
- [ ] Tab 1 (Stable): all 4 stat bars, career stats, cooldown badge, sell (X), unlock (U), buy (M)
- [ ] Tab 2 (Betting): odds table, W/P/S toggle, amount +/-, ENTER bet, R race, C clear, post-race results
- [ ] Tab 3 (Breed): sire list, dam list, B breed, foal ready, K claim, ESC discard
- [ ] Tab 4 (History): race cards with standings
- [ ] Close and reopen: state persists (same funds, same horses)
- [ ] Funds hit 0 with no bets → emergency grant fires
- [ ] `grep -rn "tick_game\|init_game" renderers/` → zero matches (unchanged)
- [ ] `docs/state/current.md` updated to Phase 2o certified

---

## §8 Quick Reference

| Item | Value |
|---|---|
| Python floor | 58 → 62 / 0 / 0 |
| TypeScript floor | 27 / 0 / 0 (unchanged) |
| New Lua calls in renderer | `sell_horse`, `breed_horses`, `settle_bets`, `calculate_horse_price`, `calculate_place_odds`, `calculate_show_odds`, `update_horse_after_race` |
| Persistence file | `renderers/pygame/games/horse_racing/saves/horse_racing_save.json` |
| Emergency grant | Fires when `funds <= 0` in `update(dt)` |
| Port-Engine proof | `grep tick_game renderers/` → still zero |

---

*RFDGameStudio Phase 2o | June 2026 | RFD IT Services Ltd.*
*Feature parity achieved. Same game. Same logic. Different renderer.*
*The four-file format proves itself.*
