"""
HorseRacingRenderer — full feature parity with TypeScript renderer.
Port-Engine model: Python-native state, Lua for discrete events only.
Rendering delegated to generic PyGameRenderer via lua_to_entities translation.
"""
from __future__ import annotations
import sys, time
from pathlib import Path
from dataclasses import dataclass, field

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

import pygame
from renderers.pygame.engine import PyGameEngine
from renderers.pygame.colors import COLORS
from renderers.pygame.shared.pygame_renderer import PyGameRenderer
from .lua_to_entities import state_to_layers
from .persistence import save_state, load_state

# Panel split constants
LEFT_SPLIT = 0.55   # left panel takes 55% of content width
PAD = 12            # standard padding


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


class HorseRacingRenderer(PyGameEngine):

    def __init__(self, width: int = 1024, height: int = 768):
        super().__init__('horse_racing', width, height)
        pygame.display.set_caption('Derby Sim — PyGame Port')

        data = self.session.files.data or {}
        saved = load_state()
        self.state = init_state_from_data(data, saved)

        self._generic_renderer = PyGameRenderer(width, height)
        self._generic_renderer.initialize(self.screen)

        if saved:
            self._msg('Save loaded. Welcome back.')

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
            race_dict = dict(race)
            # Convert participants to dicts to preserve structure
            raw_parts = race_dict.get('participants', [])
            if isinstance(raw_parts, (list, tuple)):
                participants = [dict(p) for p in raw_parts if p is not None]
            else:
                participants = []
            race_dict['participants'] = participants
            st.current_race = race_dict
            st.race_participants = participants
            st.bets.clear()
            st.last_bet_results.clear()
            st.bet_target_idx = 0
            self._msg(f"Race ready: {race_dict.get('name', 'Race')}")
        else:
            self._msg(str(err or 'Could not create race.'))

    def _place_bet(self, data: dict) -> None:
        st = self.state
        if not st.current_race:
            self._generate_race(data)
            return
        parts = st.race_participants  # Use pre-converted dicts
        if not parts or st.bet_target_idx >= len(parts):
            self._msg('Select a valid participant.')
            return
        if st.bet_amount > st.funds:
            self._msg('Insufficient funds.')
            return

        p = parts[st.bet_target_idx]
        h = p.get('horse', p) if isinstance(p, dict) else p
        win_odds = float(p.get('odds', 3.0)) if isinstance(p, dict) else 3.0

        if st.bet_type == 'Place':
            betting_cfg = data.get('betting', {})
            odds = self.lua('calculate_place_odds', win_odds, betting_cfg)
        elif st.bet_type == 'Show':
            betting_cfg = data.get('betting', {})
            odds = self.lua('calculate_show_odds', win_odds, betting_cfg)
        else:
            odds = win_odds

        bet = BetEntry(
            horse_id=h.get('id', '') if isinstance(h, dict) else '',
            horse_name=h.get('name', 'Unknown') if isinstance(h, dict) else 'Unknown',
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

        parts = st.race_participants  # Use pre-converted dicts from _generate_race
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
        player_horse_id = (parts[0].get('horse', {}).get('id')
                          if parts and parts[0] and isinstance(parts[0], dict)
                          else None)
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
            foal_dict = dict(foal)
            st.foal = foal_dict
            st.foal_cost = stud_fee
            self._msg(f'Foal ready: {foal_dict.get("name")}. K=Claim, ESC=Discard')
        else:
            self._msg(str(err or 'Breeding failed.'))

    def render(self) -> None:
        data = self.session.files.data or {}
        layers = state_to_layers(
            state=self.state,
            bounds=self.bounds,
            colors=COLORS,
            data=data,
            lua_call=self.lua,
        )
        self._generic_renderer.render_layered_entities(layers)

    def _msg(self, text: str, duration: float = 4.0) -> None:
        self.state.message = text
        self.state.message_timer = duration
