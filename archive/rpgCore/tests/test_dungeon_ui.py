import pytest
import pygame
from src.shared.engine.scene_manager import SceneManager
from src.apps.dungeon_crawler.ui.dungeon_session import DungeonSession
from src.apps.dungeon_crawler.ui.scene_the_room import TheRoomScene
from src.apps.dungeon_crawler.ui.scene_dungeon_room import DungeonRoomScene
from src.apps.dungeon_crawler.ui.scene_inventory import InventoryScene
from src.shared.ui.spec import SPEC_720

@pytest.fixture(autouse=True)
def setup_pygame():
    pygame.init()
    yield
    pygame.quit()

def test_scene_the_room_initializes():
    session = DungeonSession()
    manager = SceneManager(width=800, height=600)
    scene = TheRoomScene(session=session)
    assert scene.session == session
    assert len(scene.buttons) >= 2 # Chest, Ladder

def test_scene_dungeon_room_initializes():
    session = DungeonSession()
    session.start_run()
    manager = SceneManager(width=800, height=600)
    scene = DungeonRoomScene(session=session)
    assert scene.session == session
    # Initial room should exist
    assert session.floor is not None

def test_scene_inventory_initializes():
    session = DungeonSession()
    session.start_run()
    manager = SceneManager(width=800, height=600)
    scene = InventoryScene(session=session)
    assert scene.session == session
    assert len(scene.panels) >= 1
