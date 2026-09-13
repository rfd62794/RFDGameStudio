from loguru import logger
from src.shared.state.entity_registry import EntityRegistry
from src.shared.state.roster_sync import RosterSyncService
from src.shared.teams.roster_save import load_roster
from src.shared.teams.roster import Roster
from src.shared.session.game_session import GameSession
from src.shared.dispatch.dispatch_system import DispatchSystem

def create_app() -> dict:
    """Create and configure the Slime Breeder headless state."""
    # Try to load existing save
    from src.shared.persistence.save_manager import SaveManager
    save_result = SaveManager.load()
    
    if save_result:
        # Load from save file
        roster_data, session_data = save_result
        roster = Roster.from_dict(roster_data)
        game_session = GameSession.from_dict(session_data)
        logger.info(f"Loaded save: {len(roster.entries)} slimes, {len(game_session.resources)} resources")
    else:
        # Create new game
        game_session = GameSession.new_game()
        roster = load_roster()  # Fallback to existing roster.json
        logger.info("Starting new game")
    
    # Create shared systems
    dispatch_system = DispatchSystem()
    
    # Create shared entity registry from roster
    entity_registry = EntityRegistry.from_roster(roster)
    
    # Create RosterSyncService to keep both systems in sync
    roster_sync = RosterSyncService(roster, entity_registry)
    
    # Sync registry from roster (ensure consistency)
    roster_sync.sync_from_roster()
    
    return {
        "entity_registry": entity_registry,
        "game_session": game_session,
        "dispatch_system": dispatch_system,
        "roster": roster,
        "roster_sync": roster_sync
    }

def main():
    logger.info("🚀 Launching Slime Breeder Headless Bootstrapper Tests (Internal Only)...")
    resources = create_app()
    logger.info(f"Loaded resources: {list(resources.keys())}")

if __name__ == "__main__":
    main()
