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
