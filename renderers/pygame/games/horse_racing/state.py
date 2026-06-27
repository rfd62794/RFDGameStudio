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
