"""
Tests for Tri-Modal Display Dispatcher
Comprehensive testing of Terminal, Cockpit, and PPU display bodies
"""

import pytest
import time
from typing import Dict, Any
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from body.dispatcher import (
    DisplayDispatcher, DisplayMode, RenderPacket, RenderLayer, HUDData,
    create_ppu_packet, create_terminal_packet, create_cockpit_packet
)
from body.terminal import TerminalBody
from body.cockpit import CockpitBody
from body.ppu import PPUBody

class MockDisplayBody:
    """Mock display body for testing"""
    
    def __init__(self, name: str):
        self.name = name
        self.is_initialized = False
        self.last_render_time = 0.0
        self.render_count = 0
        self.last_packet = None
    
    def initialize(self) -> bool:
        self.is_initialized = True
        return True
    
    def render(self, packet: RenderPacket) -> bool:
        self.last_packet = packet
        self.render_count += 1
        self.last_render_time = 0.016  # Mock 16ms render time
        return True
    
    def cleanup(self):
        self.is_initialized = False
    
    def get_performance_stats(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'render_count': self.render_count,
            'last_render_time_ms': self.last_render_time * 1000,
        }

class TestDisplayDispatcher:
    """Test suite for DisplayDispatcher"""
    
    @pytest.fixture
    def dispatcher(self):
        """Create dispatcher with mock bodies"""
        dispatcher = DisplayDispatcher(default_mode=DisplayMode.TERMINAL)
        
        # Register mock bodies
        terminal_mock = MockDisplayBody("Terminal")
        cockpit_mock = MockDisplayBody("Cockpit")
        ppu_mock = MockDisplayBody("PPU")
        
        dispatcher.register_body(DisplayMode.TERMINAL, terminal_mock)
        dispatcher.register_body(DisplayMode.COCKPIT, cockpit_mock)
        dispatcher.register_body(DisplayMode.PPU, ppu_mock)
        
        return dispatcher
    
    @pytest.fixture
    def sample_packet(self):
        """Create a sample render packet"""
        layers = [
            RenderLayer(depth=0, type="dynamic", id="player", x=10, y=10),
            RenderLayer(depth=1, type="baked", id="background", x=0, y=0),
        ]
        hud = HUDData(line_1="Test HUD", line_2="Second line")
        
        return RenderPacket(
            mode=DisplayMode.TERMINAL,
            layers=layers,
            hud=hud
        )
    
    def test_dispatcher_initialization(self, dispatcher):
        """Test dispatcher initialization"""
        assert dispatcher.default_mode == DisplayMode.TERMINAL
        assert dispatcher.current_mode == DisplayMode.TERMINAL
        assert len(dispatcher.bodies) == 3
        assert DisplayMode.TERMINAL in dispatcher.bodies
        assert DisplayMode.COCKPIT in dispatcher.bodies
        assert DisplayMode.PPU in dispatcher.bodies
    
    def test_mode_switching(self, dispatcher):
        """Test switching between display modes"""
        # Switch to Cockpit mode
        assert dispatcher.set_mode(DisplayMode.COCKPIT)
        assert dispatcher.current_mode == DisplayMode.COCKPIT
        assert dispatcher.active_body.name == "Cockpit"
        
        # Switch to PPU mode
        assert dispatcher.set_mode(DisplayMode.PPU)
        assert dispatcher.current_mode == DisplayMode.PPU
        assert dispatcher.active_body.name == "PPU"
        
        # Switch back to Terminal
        assert dispatcher.set_mode(DisplayMode.TERMINAL)
        assert dispatcher.current_mode == DisplayMode.TERMINAL
        assert dispatcher.active_body.name == "Terminal"
    
    def test_invalid_mode_switch(self, dispatcher):
        """Test switching to unregistered mode"""
        # Remove PPU body
        del dispatcher.bodies[DisplayMode.PPU]
        
        # Try to switch to PPU
        assert not dispatcher.set_mode(DisplayMode.PPU)
        assert dispatcher.current_mode == DisplayMode.TERMINAL
    
    def test_packet_rendering(self, dispatcher, sample_packet):
        """Test rendering packets"""
        # Render packet
        assert dispatcher.render(sample_packet)
        
        # Check that the correct body received the packet
        terminal_body = dispatcher.bodies[DisplayMode.TERMINAL]
        assert terminal_body.render_count == 1
        assert terminal_body.last_packet == sample_packet
    
    def test_packet_mode_override(self, dispatcher, sample_packet):
        """Test packet overriding current mode"""
        # Start in Terminal mode
        dispatcher.set_mode(DisplayMode.TERMINAL)
        
        # Create packet with different mode
        ppu_packet = RenderPacket(
            mode=DisplayMode.PPU,
            layers=sample_packet.layers,
            hud=sample_packet.hud
        )
        
        # Render packet - should switch to PPU mode
        assert dispatcher.render(ppu_packet)
        assert dispatcher.current_mode == DisplayMode.PPU
        
        # Check PPU body received the packet
        ppu_body = dispatcher.bodies[DisplayMode.PPU]
        assert ppu_body.render_count == 1
        assert ppu_body.last_packet == ppu_packet
    
    def test_state_to_packet_conversion(self, dispatcher):
        """Test converting state data to render packet"""
        state_data = {
            'entities': [
                {'id': 'player', 'x': 10, 'y': 10, 'effect': 'sway'},
                {'id': 'enemy', 'x': 15, 'y': 8, 'effect': None},
            ],
            'background': {'id': 'grass_bg'},
            'hud': {
                'line_1': 'Health: 100%',
                'line_2': 'Score: 1500'
            }
        }
        
        packet = dispatcher._state_to_packet(state_data, DisplayMode.PPU)
        
        assert packet.mode == DisplayMode.PPU
        assert len(packet.layers) == 3  # 2 entities + 1 background
        assert packet.hud.line_1 == 'Health: 100%'
        assert packet.hud.line_2 == 'Score: 1500'
    
    def test_performance_stats(self, dispatcher):
        """Test performance statistics collection"""
        # Render some packets
        for i in range(5):
            packet = RenderPacket(mode=DisplayMode.TERMINAL)
            dispatcher.render(packet)
        
        stats = dispatcher.get_performance_stats()
        
        assert 'dispatcher' in stats
        assert 'bodies' in stats
        assert stats['dispatcher']['current_mode'] == DisplayMode.TERMINAL.value
        assert stats['dispatcher']['packet_history_size'] == 5
        assert len(stats['bodies']) == 3
    
    def test_packet_history(self, dispatcher, sample_packet):
        """Test packet history tracking"""
        # Render multiple packets
        for i in range(10):
            packet = RenderPacket(mode=DisplayMode.TERMINAL)
            dispatcher.render(packet)
        
        # Check history size
        assert len(dispatcher.packet_history) == 10
        
        # Render more packets to test history limit
        for i in range(100):
            packet = RenderPacket(mode=DisplayMode.TERMINAL)
            dispatcher.render(packet)
        
        # History should be limited to max_history
        assert len(dispatcher.packet_history) == dispatcher.max_history
    
    def test_convenience_functions(self):
        """Test convenience packet creation functions"""
        # Test PPU packet creation
        layers = [
            {'id': 'player', 'x': 10, 'y': 10, 'type': 'dynamic'},
            {'id': 'bg', 'x': 0, 'y': 0, 'type': 'baked'}
        ]
        hud_lines = ["Line 1", "Line 2"]
        
        ppu_packet = create_ppu_packet(layers, hud_lines)
        
        assert ppu_packet.mode == DisplayMode.PPU
        assert len(ppu_packet.layers) == 2
        assert ppu_packet.hud.line_1 == "Line 1"
        assert ppu_packet.hud.line_2 == "Line 2"
        
        # Test terminal packet creation
        data = {'key': 'value', 'number': 42}
        terminal_packet = create_terminal_packet(data, "Test Title")
        
        assert terminal_packet.mode == DisplayMode.TERMINAL
        assert len(terminal_packet.layers) == 1
        assert terminal_packet.layers[0].metadata['data'] == data
        assert terminal_packet.layers[0].metadata['title'] == "Test Title"
        
        # Test cockpit packet creation
        meters = {'fps': 60.0, 'cpu': 45.2}
        labels = {'status': 'Running'}
        cockpit_packet = create_cockpit_packet(meters, labels)
        
        assert cockpit_packet.mode == DisplayMode.COCKPIT
        assert len(cockpit_packet.layers) == 1
        assert cockpit_packet.layers[0].metadata['meters'] == meters
        assert cockpit_packet.layers[0].metadata['labels'] == labels

class TestDisplayBodies:
    """Test suite for individual display bodies"""
    
    def test_terminal_body_creation(self):
        """Test terminal body creation and initialization"""
        try:
            from body.terminal import create_terminal_body
            body = create_terminal_body()
            
            if body:  # Only test if Rich is available
                assert body.name == "Terminal"
                assert body.is_initialized
                assert body.console is not None
                body.cleanup()
        except ImportError:
            pytest.skip("Rich not available")
    
    def test_cockpit_body_creation(self):
        """Test cockpit body creation and initialization"""
        try:
            from body.cockpit import create_cockpit_body
            body = create_cockpit_body()
            
            if body:  # Only test if Tkinter is available
                assert body.name == "Cockpit"
                assert body.is_initialized
                assert body.root is not None
                assert len(body.meters) > 0
                assert len(body.labels) > 0
                body.cleanup()
        except ImportError:
            pytest.skip("Tkinter not available")
    
    def test_ppu_body_creation(self):
        """Test PPU body creation and initialization"""
        try:
            from body.ppu import create_ppu_body
            body = create_ppu_body()
            
            if body:  # Only test if PPU components are available
                assert body.name == "PPU"
                assert body.is_initialized
                assert body.root is not None
                assert body.target_fps == 60
                body.cleanup()
        except ImportError:
            pytest.skip("PPU components not available")

class TestRenderPacket:
    """Test suite for RenderPacket validation"""
    
    def test_packet_creation(self):
        """Test basic packet creation"""
        layers = [
            RenderLayer(depth=0, type="dynamic", id="test", x=5, y=5)
        ]
        hud = HUDData(line_1="Test")
        
        packet = RenderPacket(
            mode=DisplayMode.PPU,
            layers=layers,
            hud=hud,
            metadata={'test': 'data'}
        )
        
        assert packet.mode == DisplayMode.PPU
        assert len(packet.layers) == 1
        assert packet.hud.line_1 == "Test"
        assert packet.metadata['test'] == 'data'
        assert packet.timestamp > 0
    
    def test_packet_defaults(self):
        """Test packet default values"""
        packet = RenderPacket(mode=DisplayMode.TERMINAL)
        
        assert packet.mode == DisplayMode.TERMINAL
        assert len(packet.layers) == 0
        assert packet.hud.line_1 == ""
        assert packet.hud.line_2 == ""
        assert packet.hud.line_3 == ""
        assert packet.hud.line_4 == ""
        assert len(packet.metadata) == 0
        assert packet.timestamp > 0
    
    def test_render_layer_validation(self):
        """Test render layer creation"""
        layer = RenderLayer(
            depth=1,
            type="dynamic",
            id="test_entity",
            x=10,
            y=15,
            effect="sway",
            metadata={'health': 100}
        )
        
        assert layer.depth == 1
        assert layer.type == "dynamic"
        assert layer.id == "test_entity"
        assert layer.x == 10
        assert layer.y == 15
        assert layer.effect == "sway"
        assert layer.metadata['health'] == 100

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
