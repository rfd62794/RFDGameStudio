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
