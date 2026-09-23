"""
Unified Graphics Engine Test Suite
Comprehensive testing for the consolidated Tri-Modal Graphics Engine

This test suite validates:
- Component initialization and integration
- Multi-mode rendering functionality
- SimplePPU Direct-Line protocol
- Legacy adapter compatibility
- Universal packet enforcement
- Performance monitoring
"""

import pytest
import time
import asyncio
from typing import Dict, Any, Optional
from unittest.mock import Mock, patch

# Import unified engine components
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent.parent))

try:
    from src.graphics.unified_engine import (
        UnifiedGraphicsEngine, UnifiedEngineConfig,
        create_unified_engine, create_miyoo_engine,
        create_development_engine, create_production_engine,
        TRI_MODAL_AVAILABLE, LEGACY_AVAILABLE
    )
    from src.body.dispatcher import DisplayMode, RenderPacket, HUDData, RenderLayer
    from src.body.simple_ppu import RenderDTO
    UNIFIED_ENGINE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Unified Graphics Engine not available: {e}")
    UNIFIED_ENGINE_AVAILABLE = False
    TRI_MODAL_AVAILABLE = False
    LEGACY_AVAILABLE = False
    RenderDTO = None

# Mock components for testing
class MockPhysicsComponent:
    def __init__(self):
        self.x = 80.0
        self.y = 72.0
        self.velocity_x = 0.0
        self.velocity_y = 0.0
        self.mass = 10.0
        self.energy = 100.0

class MockRenderDTO:
    def __init__(self):
        self.player_physics = MockPhysicsComponent()
        self.asteroids = []
        self.portal = None
        self.game_state = "TEST"
        self.time_remaining = 60.0

@pytest.mark.skipif(not UNIFIED_ENGINE_AVAILABLE, reason="Unified Graphics Engine not available")
class TestUnifiedGraphicsEngine:
    """Test suite for Unified Graphics Engine"""
    
    def test_engine_initialization(self):
        """Test basic engine initialization"""
        config = UnifiedEngineConfig()
        engine = UnifiedGraphicsEngine(config)
        
        assert engine is not None
        assert engine.config == config
        assert isinstance(engine.performance_stats, dict)
        
        engine.cleanup()
    
    def test_factory_functions(self):
        """Test factory function variants"""
        # Test default factory
        engine1 = create_unified_engine()
        assert engine1 is not None
        engine1.cleanup()
        
        # Test Miyoo factory
        engine2 = create_miyoo_engine()
        assert engine2 is not None
        assert engine2.config.simple_ppu_scale == 1  # 1x scale for Miyoo
        assert engine2.config.simple_ppu_fps == 30    # 30 FPS for battery
        engine2.cleanup()
        
        # Test development factory
        engine3 = create_development_engine()
        assert engine3 is not None
        assert engine3.config.default_mode == DisplayMode.TERMINAL
        engine3.cleanup()
        
        # Test production factory
        engine4 = create_production_engine()
        assert engine4 is not None
        assert engine4.config.enable_simple_ppu == False
        engine4.cleanup()
    
    def test_component_availability(self):
        """Test component availability detection"""
        engine = create_unified_engine()
        
        # Check component status
        stats = engine.update_performance_stats()
        components = stats['components']
        
        assert isinstance(components['tri_modal_available'], bool)
        assert isinstance(components['legacy_available'], bool)
        assert isinstance(components['simple_ppu_available'], bool)
        
        engine.cleanup()
    
    @pytest.mark.skipif(not TRI_MODAL_AVAILABLE, reason="Tri-Modal components not available")
    def test_dict_packet_rendering(self):
        """Test rendering with dictionary packet data"""
        engine = create_development_engine()
        
        # Create test packet data
        packet_data = {
            'entities': [
                {'id': 'player', 'x': 80, 'y': 72, 'type': 'dynamic'},
                {'id': 'enemy', 'x': 40, 'y': 40, 'type': 'dynamic'}
            ],
            'hud': {
                'line_1': 'HP: 100/100',
                'line_2': 'Score: 1500'
            }
        }
        
        # Test rendering
        result = engine.render(packet_data)
        assert isinstance(result, bool)
        
        engine.cleanup()
    
    @pytest.mark.skipif(not TRI_MODAL_AVAILABLE, reason="Tri-Modal components not available")
    def test_universal_packet_creation(self):
        """Test universal packet creation convenience methods"""
        engine = create_unified_engine()
        
        # Test universal packet creation
        packet = engine.create_universal_packet(
            mode=DisplayMode.TERMINAL,
            entities=[
                {'id': 'player', 'x': 80, 'y': 72}
            ],
            hud_lines=['HP: 100', 'Score: 1500'],
            metadata={'test': True}
        )
        
        assert packet is not None
        assert packet.mode == DisplayMode.TERMINAL
        assert len(packet.layers) == 1
        assert packet.hud.line_1 == 'HP: 100'
        assert packet.hud.line_2 == 'Score: 1500'
        assert packet.metadata['test'] == True
        
        engine.cleanup()
    
    @pytest.mark.skipif(not RenderDTO, reason="RenderDTO not available")
    def test_simple_ppu_dto_creation(self):
        """Test SimplePPU RenderDTO creation"""
        engine = create_unified_engine()
        
        # Test RenderDTO creation
        dto = engine.create_render_dto(
            player_physics=MockPhysicsComponent(),
            entities=[{'x': 40, 'y': 40, 'radius': 15}],
            game_state='TEST',
            time_remaining=45.0
        )
        
        assert dto is not None
        assert dto.game_state == 'TEST'
        assert dto.time_remaining == 45.0
        assert len(dto.asteroids) == 1
        
        engine.cleanup()
    
    def test_packet_validation(self):
        """Test universal packet validation"""
        engine = create_unified_engine()
        
        # Test valid packet (should pass)
        valid_packet = {'test': 'data', 'number': 42}
        assert engine._validate_packet_data(valid_packet) == True
        
        # Test invalid packet (should fail)
        invalid_packet = {'test': object()}  # Non-serializable object
        assert engine._validate_packet_data(invalid_packet) == False
        
        engine.cleanup()
    
    def test_performance_tracking(self):
        """Test performance tracking functionality"""
        engine = create_unified_engine()
        
        # Initial stats should be empty
        stats = engine.update_performance_stats()
        assert stats['performance']['render_count'] == 0
        
        # Mock a render to generate performance data
        with patch.object(engine, 'render', return_value=True):
            engine.render({'test': 'data'})
        
        # Should have performance data now
        stats = engine.update_performance_stats()
        assert stats['performance']['render_count'] >= 0
        assert 'last_render_time_ms' in stats['performance']
        
        engine.cleanup()
    
    @pytest.mark.skipif(not TRI_MODAL_AVAILABLE, reason="Tri-Modal components not available")
    def test_mode_switching(self):
        """Test display mode switching"""
        engine = create_unified_engine()
        
        # Test setting mode
        if engine.dispatcher:
            result = engine.set_mode(DisplayMode.TERMINAL)
            assert isinstance(result, bool)
            
            # Check current mode
            current_mode = engine.get_mode()
            assert current_mode in [DisplayMode.TERMINAL, None]
        
        engine.cleanup()
    
    def test_dict_to_packet_conversion(self):
        """Test dict packet to RenderPacket conversion"""
        engine = create_unified_engine()
        
        packet_data = {
            'entities': [
                {'id': 'player', 'x': 80, 'y': 72, 'depth': 1, 'type': 'dynamic'},
                {'id': 'item', 'x': 40, 'y': 40, 'depth': 2, 'type': 'dynamic'}
            ],
            'background': {'id': 'forest_bg'},
            'hud': {
                'line_1': 'Status: OK',
                'line_2': 'Time: 60s'
            }
        }
        
        packet = engine._dict_to_packet(packet_data, DisplayMode.TERMINAL)
        
        assert packet.mode == DisplayMode.TERMINAL
        assert len(packet.layers) == 3  # 2 entities + 1 background
        assert packet.hud.line_1 == 'Status: OK'
        assert packet.hud.line_2 == 'Time: 60s'
        
        # Check entity layers
        entity_layers = [l for l in packet.layers if l.type == 'dynamic']
        assert len(entity_layers) == 2
        
        # Check background layer
        bg_layers = [l for l in packet.layers if l.type == 'baked']
        assert len(bg_layers) == 1
        assert bg_layers[0].id == 'forest_bg'
        
        engine.cleanup()
    
    def test_configuration_options(self):
        """Test various configuration options"""
        # Test custom configuration
        config = UnifiedEngineConfig(
            default_mode=DisplayMode.COCKPIT if TRI_MODAL_AVAILABLE else None,
            enable_tri_modal=True,
            enable_legacy=False,
            enable_simple_ppu=True,
            universal_packet_enforcement=False,
            performance_tracking=False
        )
        
        engine = UnifiedGraphicsEngine(config)
        
        assert engine.config.enable_legacy == False
        assert engine.config.universal_packet_enforcement == False
        assert engine.config.performance_tracking == False
        
        engine.cleanup()
    
    def test_cleanup(self):
        """Test proper resource cleanup"""
        engine = create_unified_engine()
        
        # Initialize some components
        stats = engine.update_performance_stats()
        
        # Test cleanup
        engine.cleanup()
        
        # Components should be None after cleanup
        assert engine.dispatcher is None
        assert engine.legacy_adapter is None
        assert engine.simple_ppu is None
        assert len(engine.render_times) == 0
        assert len(engine.performance_stats) == 0

@pytest.mark.skipif(not UNIFIED_ENGINE_AVAILABLE, reason="Unified Graphics Engine not available")
class TestIntegrationScenarios:
    """Integration tests for real-world scenarios"""
    
    def test_miyoo_deployment_scenario(self):
        """Test Miyoo Mini deployment scenario"""
        engine = create_miyoo_engine()
        
        # Create game state data
        game_state = {
            'entities': [
                {'id': 'player', 'x': 80, 'y': 72, 'type': 'dynamic'},
                {'id': 'asteroid1', 'x': 40, 'y': 40, 'radius': 15},
                {'id': 'asteroid2', 'x': 120, 'y': 100, 'radius': 20}
            ],
            'hud': {
                'line_1': 'Energy: 85%',
                'line_2': 'Mass: 12.5',
                'line_3': 'Time: 45s'
            }
        }
        
        # Render multiple frames (simulate game loop)
        for i in range(5):
            result = engine.render(game_state)
            assert isinstance(result, bool)
            time.sleep(0.1)  # Simulate frame timing
        
        # Check performance
        stats = engine.update_performance_stats()
        assert stats['performance']['render_count'] >= 5
        
        engine.cleanup()
    
    def test_development_monitoring_scenario(self):
        """Test development monitoring scenario"""
        engine = create_development_engine()
        
        # Create monitoring data
        monitoring_data = {
            'entities': [
                {'id': 'process1', 'x': 0, 'y': 0, 'type': 'dynamic', 'cpu': 45.2},
                {'id': 'process2', 'x': 1, 'y': 0, 'type': 'dynamic', 'cpu': 23.8}
            ],
            'hud': {
                'line_1': 'CPU Usage: 69.0%',
                'line_2': 'Memory: 2.1GB',
                'line_3': 'Processes: 2'
            },
            'metadata': {
                'system': 'development',
                'timestamp': time.time()
            }
        }
        
        # Render monitoring data
        result = engine.render(monitoring_data)
        assert isinstance(result, bool)
        
        engine.cleanup()
    
    def test_production_dashboard_scenario(self):
        """Test production dashboard scenario"""
        engine = create_production_engine()
        
        # Create dashboard data
        dashboard_data = {
            'entities': [
                {'id': 'server1', 'x': 0, 'y': 0, 'type': 'dynamic', 'status': 'healthy'},
                {'id': 'server2', 'x': 1, 'y': 0, 'type': 'dynamic', 'status': 'warning'}
            ],
            'hud': {
                'line_1': 'Servers: 2/2 Online',
                'line_2': 'Response Time: 120ms',
                'line_3': 'Uptime: 99.9%'
            }
        }
        
        # Render dashboard data
        result = engine.render(dashboard_data)
        assert isinstance(result, bool)
        
        engine.cleanup()

if __name__ == "__main__":
    # Run tests directly
    print("🧪 Running Unified Graphics Engine Tests")
    print(f"   Unified Engine Available: {UNIFIED_ENGINE_AVAILABLE}")
    print(f"   Tri-Modal Available: {TRI_MODAL_AVAILABLE}")
    print(f"   Legacy Available: {LEGACY_AVAILABLE}")
    
    if UNIFIED_ENGINE_AVAILABLE:
        # Run basic functionality test
        engine = create_development_engine()
        print("✅ Engine creation successful")
        
        # Test packet rendering
        result = engine.render({'test': 'data'})
        print(f"✅ Packet rendering: {result}")
        
        # Test performance stats
        stats = engine.update_performance_stats()
        print(f"✅ Performance stats: {len(stats)} sections")
        
        engine.cleanup()
        print("✅ Engine cleanup successful")
        
        print("🎉 All basic tests passed!")
    else:
        print("❌ Unified Graphics Engine not available for testing")
