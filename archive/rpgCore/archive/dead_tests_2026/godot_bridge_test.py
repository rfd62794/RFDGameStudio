import pytest
import time
import threading
import socket
from unittest.mock import MagicMock, patch

from game_engine.engines.godot_bridge import GodotBridge, BridgeMessage, MessageType
from game_engine.systems.graphics.godot_render_system import GodotRenderSystem
from game_engine.systems.body.entity_manager import EntityManager, Entity, SystemConfig

class MockEntity(Entity):
    def __init__(self, eid, x, y):
        super().__init__()
        self.id = eid
        self.entity_type = "mock_unit"
        self.x = x
        self.y = y
        self.radius = 10.0

@pytest.fixture
def mock_socket():
    with patch("socket.socket") as mock_sock:
        yield mock_sock

@pytest.fixture
def godot_bridge(mock_socket):
    # Reset singleton
    GodotBridge._instance = None
    bridge = GodotBridge(host="localhost", port=9999)
    # Mock the socket instance created inside connect
    bridge.socket = MagicMock()
    return bridge

def test_bridge_connection_lifecycle(godot_bridge):
    """Test connect and disconnect logic."""
    with patch("socket.socket") as mock_sock_cls:
        mock_instance = MagicMock()
        mock_sock_cls.return_value = mock_instance
        
        assert godot_bridge.connect() is True
        assert godot_bridge.is_connected() is True
        
        godot_bridge.disconnect()
        assert godot_bridge.is_connected() is False
        mock_instance.close.assert_called()

def test_bridge_send_frame(godot_bridge):
    """Test sending frame data puts message in queue."""
    godot_bridge.state = "connected" 
    godot_bridge._running = True
    godot_bridge.socket = MagicMock()

    success = godot_bridge.send_frame(
        entities=[{"id": "e1", "x": 10, "y": 20}],
        hud={"score": 100}
    )
    assert success is True
    
    # Check queue
    msg = godot_bridge.send_queue.get_nowait()
    assert msg.type == MessageType.FRAME_UPDATE
    assert msg.payload["entities"][0]["id"] == "e1"

def test_render_system_integration():
    """Test GodotRenderSystem collecting and sending entities."""
    # Setup mocks
    GodotBridge._instance = None
    
    with patch("game_engine.engines.godot_bridge.GodotBridge.connect", return_value=True), \
         patch("game_engine.engines.godot_bridge.GodotBridge.send_frame") as mock_send:
        
        em = EntityManager()
        em.register_entity_type("mock_unit", MockEntity)
        
        # Spawn some entities
        e1 = MockEntity("e1", 100.0, 200.0)
        em.all_entities["e1"] = e1
        em.pools["mock_unit"].active_entities.add("e1") # Manually activating for test
        
        sys_config = SystemConfig(name="GodotRender")
        render_sys = GodotRenderSystem(sys_config, em)
        render_sys.initialize()
        
        # Tick the system
        render_sys.tick(0.017) # ~60fps
        
        # Verify bridge called
        mock_send.assert_called_once()
        args, _ = mock_send.call_args
        entities = args[0]
        assert len(entities) == 1
        assert entities[0]["x"] == 100.0
        assert entities[0]["y"] == 200.0
