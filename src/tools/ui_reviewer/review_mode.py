import pygame
import sys
import time
from src.shared.engine.scene_manager import SceneManager
from src.shared.ui.spec import UISpec
from .mock_data import generate_mock_roster
from .screenshot_tool import save_screenshot

def run_review(scene_name: str, screen: pygame.Surface):
    """Launches a scene for review, takes a screenshot, and exits."""
    # Use standard UISpec
    from src.shared.ui.spec import SPEC_720
    spec = SPEC_720
    
    roster = generate_mock_roster()
    
    # Specialized SceneManager that doesn't loop forever
    manager = SceneManager(screen, spec)
    
    # We need to manually register the scenes we want to review
    from src.apps.slime_breeder.ui.scene_garden import GardenScene
    from src.apps.dungeon_crawler.ui.scene_dungeon_room import DungeonRoomScene
    from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
    
    scene_classes = {
        "garden": GardenScene,
        "dungeon_room": DungeonRoomScene
    }
    
    if scene_name not in scene_classes:
        print(f"Error: Scene '{scene_name}' not supported for review yet.")
        pygame.quit()
        return

    # Initialize scene
    if scene_name == "dungeon_room":
        session = DungeonSession()
        session.start_run()
        scene = DungeonRoomScene(manager, spec, session=session, roster=roster)
    else:
        scene = scene_classes[scene_name](manager, spec, roster=roster)
    scene.on_enter()
    
    # Force selection of one slime for the profile card review
    if scene_name == "garden" and roster.slimes:
        # Simulate picking the first slime
        s = scene.garden_state.slimes[0]
        scene.selected_entities = [s]
        scene.on_selection_changed()
    
    # Brief render loop (enough to layout)
    for _ in range(5):
        scene.update(0.016)
        scene.render(screen)
        pygame.display.flip()
        time.sleep(0.1)
        
    # Capture
    save_screenshot(screen, scene_name)
    
    pygame.quit()
