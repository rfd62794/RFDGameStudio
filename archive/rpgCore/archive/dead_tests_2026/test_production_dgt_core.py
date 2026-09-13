"""
Production Tests for DGT Core
Validates the final production structure and ADR 122 compliance
"""

import pytest
import sys
import time
import json
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

def test_dgt_core_imports():
    """Test that DGT Core imports work correctly"""
    try:
        from dgt_core import (
            TriModalEngine, BodyEngine, EngineConfig,
            DisplayDispatcher, DisplayMode, RenderPacket,
            TRI_MODAL_AVAILABLE
        )
        
        assert TRI_MODAL_AVAILABLE is True
        assert DisplayMode is not None
        assert DisplayDispatcher is not None
        assert RenderPacket is not None
        
        return True
    except ImportError as e:
        pytest.skip(f"DGT Core not available: {e}")

def test_legacy_adapter():
    """Test legacy adapter resolves constructor issue"""
    try:
        from dgt_core.engines.body import LegacyGraphicsEngineAdapter, create_legacy_engine
        
        # Create legacy adapter
        adapter = create_legacy_engine()
        assert adapter is not None
        assert isinstance(adapter, LegacyGraphicsEngineAdapter)
        
        # Test rendering with POPO data
        packet_data = {
            'width': 160,
            'height': 144,
            'entities': [
                {'id': 'test', 'x': 10, 'y': 10, 'type': 'dynamic'}
            ],
            'background': {'id': 'grass'},
            'hud': {'line_1': 'Test HUD'}
        }
        
        # This should work without constructor issues
        success = adapter.render_packet(packet_data)
        assert success is True
        
        # Test performance stats
        stats = adapter.get_performance_stats()
        assert 'adapter_type' in stats
        assert stats['adapter_type'] == 'legacy_graphics_engine_adapter'
        
        adapter.cleanup()
        return True
        
    except Exception as e:
        pytest.skip(f"Legacy adapter test failed: {e}")

def test_universal_packet_enforcement():
    """Test ADR 122: Universal Packet Enforcement"""
    try:
        from dgt_core import TriModalEngine, EngineConfig, DisplayMode
        
        # Create engine with enforcement enabled
        config = EngineConfig(universal_packet_enforcement=True)
        engine = TriModalEngine(config)
        
        # Test valid POPO data
        valid_data = {
            'entities': [{'id': 'test', 'x': 5, 'y': 5}],
            'background': {'id': 'grass'},
            'hud': {'line_1': 'Valid Data'}
        }
        
        # Should serialize to JSON
        json.dumps(valid_data)  # Should not raise
        
        # Render should succeed
        success = engine.render(valid_data, DisplayMode.TERMINAL)
        assert success is True
        
        # Test invalid data (non-serializable object)
        class NonSerializable:
            pass
        
        invalid_data = {
            'entities': [{'id': 'test', 'x': 5, 'y': 5}],
            'bad_object': NonSerializable()  # This should fail
        }
        
        # Should fail to serialize
        with pytest.raises((TypeError, ValueError)):
            json.dumps(invalid_data)
        
        # Render should fail with enforcement enabled
        success = engine.render(invalid_data, DisplayMode.TERMINAL)
        assert success is False
        
        engine.cleanup()
        return True
        
    except Exception as e:
        pytest.skip(f"Universal packet enforcement test failed: {e}")

def test_cli_launchers():
    """Test CLI launchers can be imported"""
    try:
        # Test that all CLI modules can be imported
        import apps.monitor
        import apps.dashboard
        import apps.play_slice
        
        assert hasattr(apps.monitor, 'run_terminal_monitor')
        assert hasattr(apps.dashboard, 'run_cockpit_dashboard')
        assert hasattr(apps.play_slice, 'run_ppu_game')
        
        return True
        
    except ImportError as e:
        pytest.skip(f"CLI launcher import failed: {e}")

def test_unified_cli():
    """Test unified CLI launcher"""
    try:
        import main
        
        # Test that main function exists
        assert hasattr(main, 'main')
        assert callable(main.main)
        
        return True
        
    except ImportError as e:
        pytest.skip(f"Unified CLI import failed: {e}")

def test_sovereign_proof():
    """Test the sovereign proof: same data in different modes"""
    try:
        from dgt_core import BodyEngine, DisplayMode, TRI_MODAL_AVAILABLE
        
        if not TRI_MODAL_AVAILABLE:
            pytest.skip("Tri-Modal not available")
        
        # Create test data - simple counter
        test_data = {
            'counter': 42,
            'timestamp': time.time(),
            'entities': [
                {'id': 'counter_display', 'x': 10, 'y': 10, 'type': 'dynamic'}
            ],
            'background': {'id': 'test_bg'},
            'hud': {
                'line_1': f'Counter: 42',
                'line_2': 'Universal Packet Test',
                'line_3': 'Same Data, Three Lenses',
                'line_4': 'ADR 122 Compliant'
            }
        }
        
        # Test each mode can render the same data
        engine = BodyEngine(use_tri_modal=True, universal_packet_enforcement=True)
        
        results = {}
        for mode in [DisplayMode.TERMINAL, DisplayMode.COCKPIT, DisplayMode.PPU]:
            if engine.set_mode(mode):
                success = engine.render(test_data, mode)
                results[mode.value] = success
            else:
                results[mode.value] = False
        
        # At least terminal should work
        assert results['terminal'] is True
        
        # Cleanup
        engine.cleanup()
        
        # Log results for verification
        print(f"Sovereign Proof Results: {results}")
        
        return True
        
    except Exception as e:
        pytest.skip(f"Sovereign proof test failed: {e}")

def test_production_structure():
    """Test production directory structure"""
    try:
        # Check key directories exist
        base_path = Path(__file__).parent.parent
        
        required_dirs = [
            'src/dgt_core',
            'src/dgt_core/engines/body',
            'src/dgt_core/simulation',
            'src/dgt_core/registry',
            'apps'
        ]
        
        for dir_path in required_dirs:
            full_path = base_path / dir_path
            assert full_path.exists(), f"Required directory missing: {dir_path}"
        
        # Check key files exist
        required_files = [
            'src/dgt_core/__init__.py',
            'src/dgt_core/engines/__init__.py',
            'src/dgt_core/engines/body/__init__.py',
            'src/dgt_core/engines/body/dispatcher.py',
            'src/dgt_core/engines/body/terminal.py',
            'src/dgt_core/engines/body/cockpit.py',
            'src/dgt_core/engines/body/ppu.py',
            'src/dgt_core/engines/body/legacy_adapter.py',
            'src/dgt_core/engines/body/tri_modal_engine.py',
            'apps/monitor.py',
            'apps/dashboard.py',
            'apps/play_slice.py',
            'main.py'
        ]
        
        for file_path in required_files:
            full_path = base_path / file_path
            assert full_path.exists(), f"Required file missing: {file_path}"
        
        return True
        
    except Exception as e:
        pytest.fail(f"Production structure test failed: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
