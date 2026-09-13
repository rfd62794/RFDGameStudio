import json
from pathlib import Path
from src.shared.teams.roster import Roster

SAVE_PATH = Path("saves/roster.json")

def save_roster(roster: Roster):
    SAVE_PATH.parent.mkdir(exist_ok=True)
    SAVE_PATH.write_text(
        json.dumps(roster.to_dict(), indent=2)
    )

def load_roster() -> Roster:
    if not SAVE_PATH.exists():
        return Roster()
    try:
        data = json.loads(SAVE_PATH.read_text())
        return Roster.from_dict(data)
    except Exception:
        return Roster()
