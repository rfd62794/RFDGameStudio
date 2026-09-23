import random
import json
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, field
from loguru import logger

from src.apps.dungeon_crawler.entities.hero import Hero
from src.apps.dungeon_crawler.world.floor import Floor
from src.apps.dungeon_crawler.world.room_generator import RoomGenerator
from src.apps.dungeon_crawler.hub.the_room import TheRoom
from src.shared.combat.turn_order import TurnOrderManager
from src.shared.teams.roster import Roster, TeamRole, RosterSlime

FIRST_NAMES = ["Aldric", "Maren", "Thorn", "Vex", "Sable", "Dusk"]
LAST_NAMES  = ["the Bold", "the Unlucky", "of the Deep", 
              "the Forgotten", "Ironhands", "of Ashfall"]

@dataclass
class DungeonSession:
    """
    Orchestrates the lifecycle of a Dungeon Crawler run.
    Mirrors the SpaceTraderSession pattern.
    """
    team:            List = field(default_factory=list)
    floor:           int = 1
    seed:            int = None
    track:           object = None  # DungeonTrack — set once
    active_zone:     object = None  # current zone being fought
    combat_results:  List = field(default_factory=list)
    
    def __post_init__(self):
        if self.seed is None:
            self.seed = random.randint(0, 99999)
        # Legacy compatibility
        self.hub = TheRoom()
        self.hero: Optional[Hero] = None
        self.floor_obj: Optional[Floor] = None
        self.turn_manager: Optional[TurnOrderManager] = None
        self.ancestors: List[dict] = []
        
        # Team Roster Integration - use main save system
        from src.shared.persistence.save_manager import SaveManager
        save_result = SaveManager.load()
        if save_result:
            roster_data, session_data = save_result
            self.roster = Roster.from_dict(roster_data)
            print(f"[DEBUG] Dungeon session - loaded roster with {len(self.roster.get_dungeon_team().members)} dungeon team members")
        else:
            self.roster = Roster()
            print("[DEBUG] Dungeon session - created fresh roster")
        self.party_slimes = self.team  # Alias for compatibility

    def generate_hero_name(self) -> str:
        return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

    def start_run(self, class_type: str = "fighter") -> None:
        name = self.generate_hero_name()
        self.hero = Hero(name, class_type)
        logger.info(f"🚀 Starting run with {self.hero.name} ({class_type})")
        
        # Initialize floor 1
        gen = RoomGenerator()
        self.floor = gen.generate(depth=1)
        self.floor.move_to("entrance")
        
        self.turn_manager = TurnOrderManager()
        
        self.party_slimes = [] # Reset for new run
        self._initialize_party_from_roster()

    def _initialize_party_from_roster(self):
        team = self.roster.get_dungeon_team()
        for slime in team.members:
            if slime.alive:
                slime.locked = True
                self.party_slimes.append(slime)
        # Save roster via main save system
        from src.shared.persistence.save_manager import SaveManager
        from src.shared.session.game_session import GameSession
        # Create a dummy game session for save
        dummy_session = GameSession.new_game()
        SaveManager.save(self.roster, dummy_session)

    def descend(self) -> Floor:
        if not self.floor_obj:
            self.start_run()
            return self.floor_obj
        
        new_depth = self.floor_obj.depth + 1
        logger.info(f"🔽 Descending to floor {new_depth}")
        gen = RoomGenerator()
        self.floor_obj = gen.generate(depth=new_depth)
        self.floor_obj.move_to("entrance")
        return self.floor_obj

    def end_run(self, cause: str = "extraction") -> None:
        if not self.hero:
            return

        logger.info(f"Dungeon run ended: {cause}")
        # Unlock slimes and handle deaths
        team = self.roster.get_dungeon_team()
        for rs in self.party_slimes:
            # Check if slime died (HP in combat unit or similar)
            # In current demo, if hero dies, entire run fails or specific slimes die.
            # We'll assume casualties are registered via cause or specific result calls.
            rs.locked = False
        
        # Save roster via main save system
        from src.shared.persistence.save_manager import SaveManager
        from src.shared.session.game_session import GameSession
        # Create a dummy game session for save
        dummy_session = GameSession.new_game()
        SaveManager.save(self.roster, dummy_session)
        
        # Record ancestor
        ancestor_record = {
            "name": self.hero.name,
            "class": self.hero.class_type,
            "floor": self.floor_obj.depth if self.floor_obj else 1,
            "kills": 0, # Could be expanded later
            "cause": cause
        }
        self.ancestors.append(ancestor_record)
        
        # Reset but keep ancestors list
        self.hero = None
        self.floor_obj = None
        self.turn_manager = None

    def get_ancestor_list(self) -> List[str]:
        return [f"{a['name']} ({a['class']}) - Floor {a['floor']} ({a['cause']})" for a in self.ancestors]

    # === Session Persistence Methods ===
    def save_to_file(self, filepath: Optional[Path] = None) -> None:
        """Save session state to JSON file"""
        if filepath is None:
            filepath = Path(f"saves/dungeon_session_{self.seed}.json")
        
        filepath.parent.mkdir(exist_ok=True)
        
        # Serialize session state
        session_data = {
            "seed": self.seed,
            "floor": self.floor,
            "team_slime_ids": [s.slime_id for s in self.team],
            "combat_results": self.combat_results,
            "ancestors": self.ancestors
        }
        
        # Save track if exists
        if self.track:
            session_data["track"] = {
                "depth": self.track.depth,
                "total_length": self.track.total_length,
                # Note: Would need to serialize track zones here
                # For now, we'll regenerate track on load using seed
            }
        
        filepath.write_text(json.dumps(session_data, indent=2))
        logger.info(f"Session saved to {filepath}")

    @classmethod
    def load_from_file(cls, filepath: Optional[Path] = None, seed: Optional[int] = None) -> "DungeonSession":
        """Load session state from JSON file"""
        if filepath is None and seed is not None:
            filepath = Path(f"saves/dungeon_session_{seed}.json")
        
        if not filepath.exists():
            logger.info(f"No session file found at {filepath}, creating new session")
            return cls()
        
        try:
            data = json.loads(filepath.read_text())
            session = cls(
                team=[],  # Will be populated from slime_ids
                floor=data.get("floor", 1),
                seed=data.get("seed"),
                combat_results=data.get("combat_results", []),
                ancestors=data.get("ancestors", [])
            )
            
            # Load team from slime_ids
            roster = load_roster()
            for slime_id in data.get("team_slime_ids", []):
                creature = roster.get_creature(slime_id)
                if creature:
                    session.team.append(creature)
            
            logger.info(f"Session loaded from {filepath}")
            return session
            
        except Exception as e:
            logger.error(f"Failed to load session from {filepath}: {e}")
            return cls()

    def auto_save(self) -> None:
        """Auto-save session state (call on important transitions)"""
        self.save_to_file()

    def resume_session(self) -> bool:
        """Resume session from saved state"""
        # This would be called when returning to dungeon after interruption
        # For now, just log that session is active
        logger.info(f"Resuming session on floor {self.floor} with {len(self.team)} team members")
        return True
