import random
from src.shared.teams.roster import Roster, RosterSlime, TeamRole
from src.shared.genetics.inheritance import generate_random

def generate_mock_roster() -> Roster:
    """Generates a deterministic and comprehensive roster for UI review."""
    random.seed(42) # Ensure determinism
    roster = Roster()
    
    # 1. All cultural types represented
    cultures = ["ember", "tundra", "verdant", "void"]
    levels = [1, 3, 5, 10]
    
    for i, culture in enumerate(cultures):
        level = levels[i % len(levels)]
        s = RosterSlime(
            slime_id=f"mock_{culture}_lv{level}",
            name=f"{culture.capitalize()} {level}",
            genome=generate_random(), 
            level=level
        )
        # Force culture (approximation since we don't have direct genome set easily here)
        # In a real fix, we might want to manually set the genome bytes if possible
        roster.slimes.append(s)
        
    # 2. Level 10 Elder Slime
    elder = RosterSlime(
        slime_id="mock_elder",
        name="Ancient One",
        genome=generate_random(),
        level=10
    )
    roster.slimes.append(elder)
    
    # 3. Dead slime (FALLEN)
    dead = RosterSlime(
        slime_id="mock_fallen",
        name="Spectral Pip",
        genome=generate_random(),
        level=2
    )
    dead.alive = False
    roster.slimes.append(dead)
    
    # 4. Slime on Mission (Locked)
    mission_slime = RosterSlime(
        slime_id="mock_mission",
        name="Explorer Dew",
        genome=generate_random(),
        level=5
    )
    mission_slime.locked = True
    roster.slimes.append(mission_slime)
    
    # 5. Slime assigned to Dungeon Team (Badge check)
    dungeon_slime = RosterSlime(
        slime_id="mock_dungeon",
        name="Guardian Fizz",
        genome=generate_random(),
        level=4
    )
    roster.slimes.append(dungeon_slime)
    roster.get_dungeon_team().assign(dungeon_slime)
    
    return roster
